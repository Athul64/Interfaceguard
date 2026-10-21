import os
import sys
from pathlib import Path

# Add backend to sys.path
backend_dir = Path("backend").resolve()
sys.path.insert(0, str(backend_dir))

from app import create_app
from app.models import (
    db, Repository, AnalysisRun, Interface, InterfaceSnapshot,
    Finding, DependencyEdge, ChangePoint, Explanation
)
from app.services.analysis_runner import run_analysis_pipeline

def run_test():
    db_file = (backend_dir / "data" / "interfaceguard.db").resolve()
    db_uri = f"sqlite:///{str(db_file).replace('\\', '/')}"
    app = create_app({"SQLALCHEMY_DATABASE_URI": db_uri})
    
    with app.app_context():
        db.create_all()
        
        sample_path = "sample-repositories/order-service"
        repo = Repository.query.filter_by(github_url=sample_path).first()
        if not repo:
            repo = Repository(
                github_url=sample_path,
                name="order-service",
                default_branch="main",
                is_demo=True,
            )
            db.session.add(repo)
            db.session.commit()

        run = AnalysisRun(
            repository_id=repo.repository_id,
            status="queued",
            stage="Initialized",
            branch="main",
            scope="full",
        )
        db.session.add(run)
        db.session.commit()

        print(f"Starting pipeline for run #{run.run_id} on {repo.name}...")
        run_analysis_pipeline(app, run.run_id, max_commits=20)

        # Re-fetch run
        run = AnalysisRun.query.get(run.run_id)
        print("Run status:", run.status)
        print("Stage:", run.stage)
        print("Progress %:", run.progress_percent)
        print("Processed commits:", run.processed_commits)
        print("Extracted interfaces:", run.extracted_interfaces)
        print("Project Erosion Index:", run.project_erosion_index)

        interfaces = Interface.query.filter_by(repository_id=repo.repository_id).all()
        print(f"\nInterfaces ({len(interfaces)}):")
        for iface in interfaces:
            snap = (
                InterfaceSnapshot.query.filter_by(interface_id=iface.interface_id, analysis_run_id=run.run_id)
                .order_by(InterfaceSnapshot.snapshot_id.desc())
                .first()
            )
            if snap:
                print(f" - {iface.name}: Health={snap.health_score}, Severity={snap.severity}, Trend={snap.trend}, Methods={snap.method_count}, CBO={snap.cbo}, LCOM={snap.lcom}, Churn={snap.churn}")

        findings = Finding.query.filter_by(analysis_run_id=run.run_id).all()
        print(f"\nFindings ({len(findings)}):")
        for f in findings:
            print(f" * [{f.category}] {f.rule_name} ({f.severity}): {f.description}")

        cycles = DependencyEdge.query.filter_by(analysis_run_id=run.run_id, in_cycle=True).all()
        print(f"\nCycles ({len(cycles)} cycle edges):")
        for c in cycles:
            print(f" -> {c.source_name} --({c.relationship})--> {c.target_name} (path: {c.cycle_path})")

        change_points = ChangePoint.query.filter_by(analysis_run_id=run.run_id).all()
        print(f"\nChange Points ({len(change_points)}):")
        for cp in change_points:
            print(f" ! Commit {cp.commit_hash[:7]}: {cp.description}")

        explanations = Explanation.query.all()
        print(f"\nExplanations ({len(explanations)}):")
        for exp in explanations[:2]:
            print(f" AI: {exp.explanation_text[:120]}...")
            print(f" Rec: {exp.refactoring_recommendation[:120]}...\n")

if __name__ == "__main__":
    run_test()
