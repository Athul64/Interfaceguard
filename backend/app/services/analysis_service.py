from app.models import db, Commit, Interface, InterfaceSnapshot
from app.services.git_miner import mine_commits
from app.services.interface_extractor import extract_interfaces
from app.services.metrics_service import (
    compute_method_count, compute_dependency_count,
    compute_isp_violation_ratio, diff_signatures,
)


def _get_or_create_interface(repository_id, file_path, name, cache):
    key = (file_path, name)
    if key in cache:
        return cache[key]
    interface = Interface.query.filter_by(
        repository_id=repository_id, file_path=file_path, name=name
    ).first()
    if interface is None:
        interface = Interface(repository_id=repository_id, name=name, file_path=file_path)
        db.session.add(interface)
        db.session.flush()
    cache[key] = interface
    return interface


def analyze_repository(repository, max_commits: int | None = None) -> dict:
    existing_hashes = {c.commit_hash for c in Commit.query.filter_by(repository_id=repository.repository_id).all()}
    interface_cache = {}
    last_signature, last_churn, last_breaking_total = {}, {}, {}

    for interface in Interface.query.filter_by(repository_id=repository.repository_id).all():
        latest = (InterfaceSnapshot.query
                  .filter_by(interface_id=interface.interface_id)
                  .join(Commit).order_by(Commit.commit_date.desc()).first())
        if latest:
            last_churn[interface.interface_id] = latest.churn or 0
            last_breaking_total[interface.interface_id] = latest.breaking_change_count or 0

    commits_created = 0
    snapshots_created = 0

    for commit_info in mine_commits(repository.github_url, max_commits=max_commits):
        if commit_info.commit_hash in existing_hashes:
            continue

        commit = Commit(
            repository_id=repository.repository_id, commit_hash=commit_info.commit_hash,
            commit_date=commit_info.commit_date, author=commit_info.author,
        )
        db.session.add(commit)
        db.session.flush()
        existing_hashes.add(commit_info.commit_hash)
        commits_created += 1

        for java_file in commit_info.java_files:
            for iface_data in extract_interfaces(java_file.content, java_file.file_path):
                interface = _get_or_create_interface(
                    repository.repository_id, iface_data["file_path"], iface_data["name"], interface_cache
                )
                iid = interface.interface_id
                breaking_this_commit, changed = diff_signatures(last_signature.get(iid), iface_data)
                cumulative_churn = last_churn.get(iid, 0) + (1 if changed else 0)
                cumulative_breaking = last_breaking_total.get(iid, 0) + breaking_this_commit

                db.session.add(InterfaceSnapshot(
                    interface_id=iid, commit_id=commit.commit_id,
                    method_count=compute_method_count(iface_data),
                    isp_violation_ratio=compute_isp_violation_ratio(iface_data),
                    dependency_count=compute_dependency_count(iface_data),
                    churn=cumulative_churn, breaking_change_count=cumulative_breaking,
                    health_score=None, is_eroding=False,  # Sprint 4
                ))
                snapshots_created += 1
                last_signature[iid] = iface_data
                last_churn[iid] = cumulative_churn
                last_breaking_total[iid] = cumulative_breaking

    db.session.commit()
    return {"commits_mined": commits_created, "snapshots_created": snapshots_created, "interfaces_tracked": len(interface_cache)}