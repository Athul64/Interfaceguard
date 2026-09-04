import pytest
from app import create_app
from app.models import db


@pytest.fixture
def client():
    app = create_app(config_overrides={"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})
    with app.app_context():
        with app.test_client() as client:
            yield client
        db.drop_all()


def test_submit_repository_persists_to_db(client, monkeypatch):
    from app.routes import repository_routes
    monkeypatch.setattr(repository_routes, "validate_github_url", lambda url, **kw: (True, ""))

    response = client.post("/repositories", json={
        "github_url": "https://github.com/junit-team/junit4",
        "config": {"erosion_threshold": 70}
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data["name"] == "junit4"
    assert data["repository_id"] == 1


def test_submit_invalid_config_returns_400(client, monkeypatch):
    from app.routes import repository_routes
    monkeypatch.setattr(repository_routes, "validate_github_url", lambda url, **kw: (True, ""))

    response = client.post("/repositories", json={
        "github_url": "https://github.com/junit-team/junit4",
        "config": {"erosion_threshold": 999}
    })
    assert response.status_code == 400


def test_submit_duplicate_repository_returns_409(client, monkeypatch):
    from app.routes import repository_routes
    monkeypatch.setattr(repository_routes, "validate_github_url", lambda url, **kw: (True, ""))

    client.post("/repositories", json={"github_url": "https://github.com/junit-team/junit4"})
    response = client.post("/repositories", json={"github_url": "https://github.com/junit-team/junit4"})
    assert response.status_code == 409


def test_list_repositories_returns_submitted_repo(client, monkeypatch):
    from app.routes import repository_routes
    monkeypatch.setattr(repository_routes, "validate_github_url", lambda url, **kw: (True, ""))

    client.post("/repositories", json={"github_url": "https://github.com/junit-team/junit4"})
    response = client.get("/repositories")
    assert response.status_code == 200
    assert len(response.get_json()) == 1