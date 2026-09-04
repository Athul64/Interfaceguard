from flask import Blueprint, request, jsonify
from app.models import db, Repository, Commit, Interface
from app.services.validation import validate_github_url, validate_config
from app.services.analysis_service import analyze_repository

repository_bp = Blueprint("repository", __name__)


@repository_bp.route("/repositories", methods=["POST"])
def submit_repository():
    payload = request.get_json(silent=True) or {}
    github_url = payload.get("github_url", "").strip()
    config = payload.get("config", {}) or {}

    url_valid, url_error = validate_github_url(github_url)
    if not url_valid:
        return jsonify({"error": url_error}), 400

    config_valid, config_error = validate_config(config)
    if not config_valid:
        return jsonify({"error": config_error}), 400

    name = github_url.rstrip("/").split("/")[-1]
    if Repository.query.filter_by(github_url=github_url).first():
        return jsonify({"error": "This repository has already been submitted."}), 409

    repository = Repository(github_url=github_url, name=name)
    db.session.add(repository)
    db.session.commit()

    return jsonify(repository.to_dict()), 201


@repository_bp.route("/repositories", methods=["GET"])
def list_repositories():
    repos = Repository.query.order_by(Repository.analyzed_at.desc()).all()
    return jsonify([r.to_dict() for r in repos]), 200


@repository_bp.route("/repositories/<int:repository_id>/analyze", methods=["POST"])
def analyze(repository_id):
    repository = Repository.query.get(repository_id)
    if repository is None:
        return jsonify({"error": "Repository not found."}), 404

    payload = request.get_json(silent=True, force=True) or {}
    max_commits = payload.get("max_commits", 30)

    try:
        result = analyze_repository(repository, max_commits=max_commits)
    except Exception as exc:
        return jsonify({"error": f"Analysis failed: {exc}"}), 502

    return jsonify(result), 200


@repository_bp.route("/repositories/<int:repository_id>/commits", methods=["GET"])
def list_commits(repository_id):
    commits = Commit.query.filter_by(repository_id=repository_id).order_by(Commit.commit_date).all()
    return jsonify([c.to_dict() for c in commits]), 200


@repository_bp.route("/repositories/<int:repository_id>/interfaces", methods=["GET"])
def list_interfaces(repository_id):
    interfaces = Interface.query.filter_by(repository_id=repository_id).all()
    return jsonify([i.to_dict() for i in interfaces]), 200