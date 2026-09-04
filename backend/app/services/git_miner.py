from dataclasses import dataclass, field
from pydriller import Repository as PyDrillerRepository


@dataclass
class JavaFileChange:
    file_path: str
    content: str


@dataclass
class CommitInfo:
    commit_hash: str
    commit_date: object  # datetime
    author: str
    java_files: list = field(default_factory=list)  # list[JavaFileChange]


def mine_commits(github_url: str, max_commits: int | None = None):
    """
    Generator yielding CommitInfo objects, oldest first. Only commits that
    touch a .java file get java_files entries; other commits still yield
    (empty list) so churn/commit-count metrics in Sprint 3 can use full
    history. max_commits caps how many commits are walked, for
    demo/performance on large repos (S2-T06).
    """
    repo = PyDrillerRepository(github_url, order="date-order")

    count = 0
    for commit in repo.traverse_commits():
        if max_commits is not None and count >= max_commits:
            break
        count += 1

        java_files = []
        for modified_file in commit.modified_files:
            path = modified_file.new_path or modified_file.old_path
            if path and path.endswith(".java") and modified_file.source_code:
                java_files.append(JavaFileChange(file_path=path, content=modified_file.source_code))

        yield CommitInfo(
            commit_hash=commit.hash,
            commit_date=commit.committer_date,
            author=commit.author.name if commit.author else "unknown",
            java_files=java_files,
        )