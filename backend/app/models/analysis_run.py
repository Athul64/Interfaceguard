from datetime import datetime, timezone
from app.models import db

class AnalysisRun(db.Model):
    __tablename__ = "analysis_runs"

    run_id = db.Column(db.Integer, primary_key=True)
    repository_id = db.Column(db.Integer, db.ForeignKey("repository.repository_id"), nullable=False)
    status = db.Column(db.String(30), default="queued")  # queued, running, completed, failed, cancelled
    stage = db.Column(db.String(100), default="Initialized")
    progress_percent = db.Column(db.Float, default=0.0)
    current_commit = db.Column(db.String(50), nullable=True)
    total_commits = db.Column(db.Integer, default=0)
    processed_commits = db.Column(db.Integer, default=0)
    extracted_interfaces = db.Column(db.Integer, default=0)
    project_erosion_index = db.Column(db.Float, default=100.0)
    error_message = db.Column(db.Text, nullable=True)
    warnings = db.Column(db.Text, nullable=True)
    scope = db.Column(db.String(50), default="full")
    branch = db.Column(db.String(100), default="main")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime, nullable=True)

    findings = db.relationship("Finding", backref="analysis_run", cascade="all, delete-orphan", lazy=True)
    change_points = db.relationship("ChangePoint", backref="analysis_run", cascade="all, delete-orphan", lazy=True)
    dependencies = db.relationship("DependencyEdge", backref="analysis_run", cascade="all, delete-orphan", lazy=True)
    reports = db.relationship("ReportJob", backref="analysis_run", cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        return {
            "run_id": self.run_id,
            "repository_id": self.repository_id,
            "status": self.status,
            "stage": self.stage,
            "progress_percent": round(self.progress_percent, 1),
            "current_commit": self.current_commit,
            "total_commits": self.total_commits,
            "processed_commits": self.processed_commits,
            "extracted_interfaces": self.extracted_interfaces,
            "project_erosion_index": round(self.project_erosion_index, 1) if self.project_erosion_index is not None else 100.0,
            "error_message": self.error_message,
            "warnings": self.warnings,
            "scope": self.scope,
            "branch": self.branch,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
