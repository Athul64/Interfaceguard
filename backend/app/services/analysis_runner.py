import os
import shutil
import tempfile
import threading
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any

from app.models import (
    db, Repository, Commit, Interface, InterfaceSnapshot,
    AnalysisRun, Finding, DependencyEdge, ChangePoint, Explanation
)
from app.analyzers.parser_bridge import parse_with_javaparser, parse_with_fallback
from app.analyzers.ck_metrics import compute_aggregated_ck_metrics
from app.analyzers.erosion_metrics import (
    compute_interface_cohesion, diff_interface_signatures, compute_method_growth
)
from app.analyzers.isp_detector import detect_isp_violations
from app.analyzers.smell_detector import detect_code_smells
from app.analyzers.dependency_analyzer import build_dependency_graph
from app.analyzers.health_scorer import compute_health_score, compute_project_erosion_index
from app.analyzers.change_point_detector import classify_erosion_trend, detect_change_points_cusum
from app.analyzers.ai_explainer import generate_explanation, _generate_deterministic_explanation
from app.core.config import Config

logger = logging.getLogger(__name__)

# Active background threads / cancellation tokens
_CANCEL_FLAGS = set()

def cancel_analysis(run_id: int):
    _CANCEL_FLAGS.add(run_id)

def is_cancelled(run_id: int) -> bool:
    return run_id in _CANCEL_FLAGS

def run_analysis_pipeline(app, run_id: int, max_commits: int = 50):
    """
    Executes the 11-stage analysis pipeline in a background thread with application context.
    Updates the AnalysisRun entity at each stage.
    """
    with app.app_context():
        run = AnalysisRun.query.get(run_id)
        if not run:
            logger.error(f"AnalysisRun {run_id} not found.")
            return

        repo = Repository.query.get(run.repository_id)
        if not repo:
            run.status = "failed"
            run.error_message = "Repository not found."
            db.session.commit()
            return

        run.status = "running"
        run.stage = "1/11 Repository acquisition"
        run.progress_percent = 5.0
        db.session.commit()

        temp_dir = None
        target_path = None

        try:
            # Stage 1: Acquisition
            github_url = repo.github_url.strip()
            # Check if local demo repo
            if os.path.exists(github_url) or github_url.startswith("sample-repositories"):
                local_p = Path(github_url)
                if not local_p.is_absolute():
                    local_p = (Config.BASE_DIR.parent / github_url).resolve()
                if local_p.exists():
                    target_path = str(local_p)
                else:
                    target_path = str(Config.SAMPLE_REPOS_DIR / "order-service")
            else:
                # Clone remote repo using shallow clone
                temp_dir = tempfile.mkdtemp(prefix="ifguard_clone_")
                from git import Repo as GitRepo
                run.stage = f"1/11 Cloning repository {github_url} (shallow clone)"
                run.progress_percent = 5.0
                db.session.commit()

                clone_depth = min(max_commits or 20, 50)
                clone_kwargs = {
                    "depth": clone_depth,
                    "single_branch": True,
                }
                req_branch = repo.default_branch
                if req_branch and req_branch.lower() not in ["auto", "default", "main"]:
                    clone_kwargs["branch"] = req_branch

                try:
                    GitRepo.clone_from(github_url, temp_dir, **clone_kwargs)
                except Exception as clone_err:
                    # If specific branch failed (e.g. repo uses master instead of main), clone default branch
                    if "branch" in clone_kwargs:
                        clone_kwargs.pop("branch")
                        GitRepo.clone_from(github_url, temp_dir, **clone_kwargs)
                    else:
                        raise clone_err

                target_path = temp_dir

            if is_cancelled(run_id):
                run.status = "cancelled"
                db.session.commit()
                return

            # Stage 2: Git-history discovery
            run.stage = "2/11 Git-history discovery"
            run.progress_percent = 15.0
            db.session.commit()

            from pydriller import Repository as PyDrillerRepo
            driller = PyDrillerRepo(target_path, order="date-order")
            
            commits_to_analyze = []
            count = 0
            for c in driller.traverse_commits():
                count += 1
                commits_to_analyze.append(c)
                if max_commits and count >= max_commits:
                    break

            run.total_commits = len(commits_to_analyze)
            db.session.commit()

            # Tracking structures across history
            interface_cache = {}
            prior_signatures = {}
            cumulative_churn = {}
            cumulative_breaking = {}
            initial_method_counts = {}
            commit_entities = []

            # Stage 3-5: Mine each commit snapshot
            run.stage = "3/11 Java parsing & interface extraction"
            run.progress_percent = 25.0
            db.session.commit()

            processed_commits = 0
            all_snapshot_scores = []
            all_findings = []
            final_interfaces_data = []
            final_classes_data = []

            # We can checkout or inspect commit contents
            from git import Repo as GitPythonRepo
            git_repo = GitPythonRepo(target_path)

            for c in commits_to_analyze:
                if is_cancelled(run_id):
                    run.status = "cancelled"
                    db.session.commit()
                    return

                processed_commits += 1
                run.current_commit = c.hash
                run.processed_commits = processed_commits
                run.progress_percent = round(25.0 + (processed_commits / max(1, len(commits_to_analyze))) * 35.0, 1)
                run.stage = f"4/11 Processing commit {c.hash[:7]} ({processed_commits}/{len(commits_to_analyze)})"
                db.session.commit()

                # Checkout commit to parse workspace
                try:
                    git_repo.git.checkout(c.hash, force=True)
                except Exception as ex:
                    logger.warning(f"Failed to checkout commit {c.hash}: {ex}")
                    continue

                # Record Commit entity
                commit_entity = Commit.query.filter_by(
                    repository_id=repo.repository_id, commit_hash=c.hash
                ).first()
                if not commit_entity:
                    commit_entity = Commit(
                        repository_id=repo.repository_id,
                        commit_hash=c.hash,
                        commit_date=c.committer_date,
                        author=c.author.name if c.author else "unknown",
                    )
                    db.session.add(commit_entity)
                    db.session.flush()
                commit_entities.append(commit_entity)

                # Parse workspace Java files
                parse_result = parse_with_javaparser([target_path])
                interfaces = parse_result.get("interfaces", [])
                classes = parse_result.get("classes", [])

                final_interfaces_data = interfaces
                final_classes_data = classes

                for iface in interfaces:
                    iface_name = iface["name"]
                    key = (iface["file_path"], iface_name)

                    if key not in interface_cache:
                        iface_obj = Interface.query.filter_by(
                            repository_id=repo.repository_id,
                            name=iface_name,
                            file_path=iface["file_path"],
                        ).first()
                        if not iface_obj:
                            iface_obj = Interface(
                                repository_id=repo.repository_id,
                                name=iface_name,
                                package=iface.get("package", ""),
                                file_path=iface["file_path"],
                            )
                            db.session.add(iface_obj)
                            db.session.flush()
                        interface_cache[key] = iface_obj
                    else:
                        iface_obj = interface_cache[key]

                    iid = iface_obj.interface_id

                    # Find implementing classes for this interface
                    implementors = [
                        cls for cls in classes if iface_name in cls.get("implements", [])
                    ]

                    # CK metrics aggregated over implementing classes
                    ck = compute_aggregated_ck_metrics(iface, implementors)

                    # Erosion metrics
                    m_count = len(iface.get("methods", []))
                    if iid not in initial_method_counts:
                        initial_method_counts[iid] = m_count
                    m_growth = compute_method_growth(initial_method_counts[iid], m_count)
                    cohesion = compute_interface_cohesion(iface)

                    prev_sig = prior_signatures.get(iid)
                    breaking_this_commit, changed = diff_interface_signatures(prev_sig, iface)
                    cur_churn = cumulative_churn.get(iid, 0) + (1 if changed else 0)
                    cur_breaking = cumulative_breaking.get(iid, 0) + breaking_this_commit

                    prior_signatures[iid] = iface
                    cumulative_churn[iid] = cur_churn
                    cumulative_breaking[iid] = cur_breaking

                    # Detect ISP violations
                    isp_v = detect_isp_violations(iface_name, iface.get("methods", []), implementors)
                    
                    # Detect code smells
                    smells = detect_code_smells(iface, implementors, ck, cohesion)

                    # Total implementer methods
                    tot_impl_methods = sum(len(c.get("methods", [])) for c in implementors)

                    # Compute Health Score
                    hs_result = compute_health_score(
                        method_count=m_count,
                        isp_violations_count=len(isp_v),
                        total_implementer_methods=tot_impl_methods,
                        cbo=ck["cbo"],
                        in_cycle=False, # updated in stage 7
                        churn=cur_churn,
                        breaking_change_count=cur_breaking,
                        cohesion=cohesion,
                    )
                    h_score = hs_result["health_score"]
                    severity = hs_result["severity"]

                    snapshot = InterfaceSnapshot(
                        interface_id=iid,
                        commit_id=commit_entity.commit_id,
                        analysis_run_id=run.run_id,
                        method_count=m_count,
                        isp_violation_ratio=round(len(isp_v) / max(1, len(iface.get("methods", []))), 3),
                        dependency_count=int(ck["cbo"]),
                        churn=cur_churn,
                        breaking_change_count=cur_breaking,
                        health_score=h_score,
                        is_eroding=h_score < 70.0,
                        cbo=ck["cbo"],
                        lcom=ck["lcom"],
                        rfc=ck["rfc"],
                        wmc=ck["wmc"],
                        dit=ck["dit"],
                        noc=ck["noc"],
                        method_growth=m_growth,
                        cohesion=cohesion,
                        severity=severity,
                        trend="stable",
                        isp_violations_count=len(isp_v),
                        smells_count=len(smells),
                    )
                    db.session.add(snapshot)
                    db.session.flush()

                    all_snapshot_scores.append(h_score)

                    # Persist findings for latest commit only or major findings
                    if processed_commits == len(commits_to_analyze):
                        for item in isp_v:
                            f_entity = Finding(
                                analysis_run_id=run.run_id,
                                interface_id=iid,
                                snapshot_id=snapshot.snapshot_id,
                                category=item["category"],
                                rule_name=item["rule_name"],
                                severity=item["severity"],
                                description=item["description"],
                                evidence=item["evidence"],
                                class_name=item.get("class_name"),
                                method_name=item.get("method_name"),
                                file_path=item.get("file_path"),
                                line_number=item.get("line_number"),
                            )
                            db.session.add(f_entity)
                            all_findings.append(item)

                        for item in smells:
                            f_entity = Finding(
                                analysis_run_id=run.run_id,
                                interface_id=iid,
                                snapshot_id=snapshot.snapshot_id,
                                category=item["category"],
                                rule_name=item["rule_name"],
                                severity=item["severity"],
                                description=item["description"],
                                evidence=item["evidence"],
                                class_name=item.get("class_name"),
                                method_name=item.get("method_name"),
                                file_path=item.get("file_path"),
                                line_number=item.get("line_number"),
                            )
                            db.session.add(f_entity)
                            all_findings.append(item)

                run.extracted_interfaces = len(interface_cache)
                db.session.commit()

            # Stage 7: Dependency graph construction & cycle detection
            run.stage = "7/11 Dependency graph construction & cycle detection"
            run.progress_percent = 70.0
            db.session.commit()

            nodes, edges, cycles = build_dependency_graph(final_interfaces_data, final_classes_data)
            cycle_nodes = {n for c in cycles for n in c}

            for edge in edges:
                dep_entity = DependencyEdge(
                    analysis_run_id=run.run_id,
                    source_name=edge["source"],
                    target_name=edge["target"],
                    relationship=edge["relationship"],
                    in_cycle=edge["in_cycle"],
                    cycle_path=edge.get("cycle_path"),
                )
                db.session.add(dep_entity)

            # Stage 8: Historical trend analysis & Stage 9: Change-point detection
            run.stage = "8/11 Historical trend analysis & change-point detection"
            run.progress_percent = 80.0
            db.session.commit()

            # Compute trend for each interface across its snapshots
            latest_snapshots = []
            for (f_path, if_name), if_obj in interface_cache.items():
                snaps = (
                    InterfaceSnapshot.query.filter_by(interface_id=if_obj.interface_id, analysis_run_id=run.run_id)
                    .join(Commit)
                    .order_by(Commit.commit_date)
                    .all()
                )
                if snaps:
                    scores = [s.health_score or 100.0 for s in snaps]
                    trend = classify_erosion_trend(scores)
                    for s in snaps:
                        s.trend = trend
                    latest_snapshots.append(snaps[-1])

                    # Change point detection
                    cp_list = detect_change_points_cusum(
                        [{"commit_hash": s.commit.commit_hash, "commit_date": s.commit.commit_date, "author": s.commit.author} for s in snaps],
                        scores,
                        threshold=10.0,
                    )
                    for cp in cp_list:
                        cp_entity = ChangePoint(
                            analysis_run_id=run.run_id,
                            interface_id=if_obj.interface_id,
                            commit_hash=cp["commit_hash"],
                            commit_date=cp["commit_date"],
                            author=cp["author"],
                            metric_name=cp["metric_name"],
                            score_before=cp["score_before"],
                            score_after=cp["score_after"],
                            confidence=cp["confidence"],
                            description=cp["description"],
                            is_project_level=False,
                        )
                        db.session.add(cp_entity)

            # Stage 10: AI explanation generation (prioritize top eroded interfaces for Gemini)
            run.stage = "10/11 AI explanation generation"
            run.progress_percent = 90.0
            db.session.commit()

            # Collect interfaces with their latest snapshot and findings
            candidate_list = []
            for iface in final_interfaces_data:
                iface_name = iface["name"]
                key = (iface["file_path"], iface_name)
                if key in interface_cache:
                    if_obj = interface_cache[key]
                    latest_snap = (
                        InterfaceSnapshot.query.filter_by(interface_id=if_obj.interface_id, analysis_run_id=run.run_id)
                        .order_by(InterfaceSnapshot.snapshot_id.desc())
                        .first()
                    )
                    if latest_snap:
                        candidate_list.append((iface, if_obj, latest_snap))

            # Sort candidate interfaces by health_score ascending (most eroded first)
            candidate_list.sort(key=lambda item: item[2].health_score if item[2].health_score is not None else 100)

            ai_calls_made = 0
            MAX_AI_CALLS = 3  # Top 3 most eroded get Gemini LLM; healthy ones use deterministic engine

            def _to_clean_text(val):
                if val is None:
                    return None
                if isinstance(val, (dict, list)):
                    return json.dumps(val, indent=2)
                return str(val)

            for iface, if_obj, latest_snap in candidate_list:
                iface_name = iface["name"]
                implementors = [c for c in final_classes_data if iface_name in c.get("implements", [])]
                if_findings = [f for f in all_findings if f.get("category") == "isp_violation" or iface_name in str(f.get("description", ""))]
                
                context = {
                    "interface_name": iface_name,
                    "methods": iface.get("methods", []),
                    "implementing_classes": implementors,
                    "findings": if_findings,
                    "metrics": {
                        "health_score": latest_snap.health_score,
                        "method_count": latest_snap.method_count,
                        "cbo": latest_snap.cbo,
                        "lcom": latest_snap.lcom,
                        "churn": latest_snap.churn,
                    },
                }

                # Default to fast deterministic expert engine during full scans (0 token consumption, 0 RPM/RPD).
                # Deep Gemini generation is available on-demand when the user clicks 'Generate with Gemini' in the Case File.
                exp_data = _generate_deterministic_explanation(context)

                try:
                    exp_entity = Explanation(
                        snapshot_id=latest_snap.snapshot_id,
                        interface_id=if_obj.interface_id,
                        explanation_text=_to_clean_text(exp_data.get("explanation")),
                        suggestion_text=_to_clean_text(exp_data.get("recommendation")),
                        impact_text=_to_clean_text(exp_data.get("impact")),
                        refactoring_recommendation=_to_clean_text(exp_data.get("recommendation")),
                        responsibility_separation=_to_clean_text(exp_data.get("responsibility_separation")),
                        risk_analysis=_to_clean_text(exp_data.get("risks")),
                        is_ai_generated=bool(exp_data.get("is_ai_generated", False)),
                        provider=str(exp_data.get("provider", "deterministic_expert_engine")),
                    )
                    db.session.add(exp_entity)
                    db.session.flush()
                except Exception as exp_err:
                    logger.warning(f"Failed to record explanation for {iface_name}: {exp_err}")
                    db.session.rollback()

            # Stage 11: Persistence and completion
            run.stage = "11/11 Persistence and completion"
            run.progress_percent = 100.0
            run.project_erosion_index = compute_project_erosion_index(
                [s.health_score for s in latest_snapshots] if latest_snapshots else [100.0]
            )
            run.status = "completed"
            run.completed_at = datetime.now(timezone.utc)
            db.session.commit()
            logger.info(f"AnalysisRun {run_id} completed successfully.")

        except Exception as exc:
            logger.exception(f"AnalysisRun {run_id} failed with error: {exc}")
            try:
                db.session.rollback()
                failed_run = db.session.get(AnalysisRun, run_id)
                if failed_run:
                    failed_run.status = "failed"
                    failed_run.error_message = str(exc)
                    failed_run.completed_at = datetime.now(timezone.utc)
                    db.session.commit()
            except Exception as rollback_err:
                logger.error(f"Failed to persist failure status for run {run_id}: {rollback_err}")

        finally:
            _CANCEL_FLAGS.discard(run_id)
            if temp_dir and os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)
