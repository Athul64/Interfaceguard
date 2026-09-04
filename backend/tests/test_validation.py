from unittest.mock import patch, MagicMock
from app.services.validation import validate_github_url, validate_config


def test_rejects_malformed_url():
    ok, err = validate_github_url("not-a-url")
    assert not ok
    assert "valid GitHub" in err


def test_rejects_empty_url():
    ok, err = validate_github_url("")
    assert not ok


@patch("app.services.validation.requests.get")
def test_accepts_valid_public_repo(mock_get):
    mock_get.return_value = MagicMock(status_code=200, json=lambda: {"private": False})
    ok, err = validate_github_url("https://github.com/junit-team/junit4")
    assert ok
    assert err == ""


@patch("app.services.validation.requests.get")
def test_rejects_private_repo(mock_get):
    mock_get.return_value = MagicMock(status_code=200, json=lambda: {"private": True})
    ok, err = validate_github_url("https://github.com/someone/private-repo")
    assert not ok
    assert "private" in err


@patch("app.services.validation.requests.get")
def test_rejects_nonexistent_repo(mock_get):
    mock_get.return_value = MagicMock(status_code=404, text="Not Found")
    ok, err = validate_github_url("https://github.com/nobody/nothing")
    assert not ok
    assert "not found" in err.lower()


@patch("app.services.validation.requests.get")
def test_surfaces_clear_message_on_rate_limit(mock_get):
    mock_get.return_value = MagicMock(status_code=403, text="API rate limit exceeded")
    ok, err = validate_github_url("https://github.com/junit-team/junit4")
    assert not ok
    assert "rate limit" in err.lower()


def test_skips_remote_check_when_disabled():
    ok, err = validate_github_url("https://github.com/junit-team/junit4", check_remote=False)
    assert ok


def test_valid_config_uses_default_threshold():
    ok, err = validate_config({})
    assert ok


def test_valid_config_with_threshold():
    ok, err = validate_config({"erosion_threshold": 50})
    assert ok


def test_rejects_out_of_range_threshold():
    ok, err = validate_config({"erosion_threshold": 150})
    assert not ok


def test_rejects_non_numeric_threshold():
    ok, err = validate_config({"erosion_threshold": "high"})
    assert not ok


def test_rejects_non_dict_config():
    ok, err = validate_config("not a dict")
    assert not ok