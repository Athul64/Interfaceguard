"""
Orchestrates S2-T01 through S2-T05. Idempotent: safe to call /analyze more
than once on the same repository -- already-persisted commits (by hash)
and interfaces (by file_path + name) are skipped rather than duplicated.
"""
from app.models import db, Commit, Interface
from app.services.git_miner import mine_commits
from app.services.interface_extractor import extract_interfaces


def analyze_repository(repository, max_commits: int | None = None) -> dict:
    existing_hashes = {
        c.commit_hash for c in Commit.query.filter_by(repository_id=repository.repository_id).all()
    }
    seen_interfaces = {
        (i.file_path, i.name) for i in Interface.query.filter_by(repository_id=repository.repository_id).all()
    }

    commits_created = 0
    interfaces_created = 0

    for commit_info in mine_commits(repository.github_url, max_commits=max_commits):
        if commit_info.commit_hash in existing_hashes:
            continue  # already mined this commit in a previous /analyze call

        commit = Commit(
            repository_id=repository.repository_id,
            commit_hash=commit_info.commit_hash,
            commit_date=commit_info.commit_date,
            author=commit_info.author,
        )
        db.session.add(commit)
        existing_hashes.add(commit_info.commit_hash)
        commits_created += 1

        for java_file in commit_info.java_files:
            for iface in extract_interfaces(java_file.content, java_file.file_path):
                key = (iface["file_path"], iface["name"])
                if key in seen_interfaces:
                    continue
                seen_interfaces.add(key)
                db.session.add(Interface(
                    repository_id=repository.repository_id,
                    name=iface["name"],
                    file_path=iface["file_path"],
                ))
                interfaces_created += 1

    db.session.commit()
    return {"commits_mined": commits_created, "interfaces_found": interfaces_created}