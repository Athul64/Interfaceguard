from datetime import datetime, timezone
from app.models import db

class ReportJob(db.Model):
    __tablename__ = "report_jobs"

    report_id = db.Column(db.Integer, primary_key=True)
    analysis_run_id = db.Column(db.Integer, db.ForeignKey("analysis_runs.run_id"), nullable=False)
    status = db.Column(db.String(30), default="generating")  # generating, completed, failed
    file_path = db.Column(db.String(255), nullable=True)
    file_size = db.Column(db.Integer, default=0)
    scope = db.Column(db.String(50), default="full")
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "report_id": self.report_id,
            "analysis_run_id": self.analysis_run_id,
            "status": self.status,
            "file_size": self.file_size,
            "scope": self.scope,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
