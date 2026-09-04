from app.services.git_miner import mine_commits


def test_mines_commits_from_real_small_repo():
    commits = list(mine_commits("https://github.com/octocat/Hello-World", max_commits=5))
    assert len(commits) > 0
    assert all(c.commit_hash for c in commits)


def test_respects_max_commits_cap():
    commits = list(mine_commits("https://github.com/octocat/Hello-World", max_commits=2))
    assert len(commits) <= 2