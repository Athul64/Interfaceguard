from datetime import datetime, timezone
from app.models import db

class Repository(db.Model):
    __tablename__ = "repository"

    repository_id = db.Column(db.Integer, primary_key=True)
    github_url = db.Column(db.String(255), nullable=False, unique=True)
    name = db.Column(db.String(120), nullable=False)
    default_branch = db.Column(db.String(100), default="main")
    is_demo = db.Column(db.Boolean, default=False)
    analyzed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    commits = db.relationship("Commit", backref="repository", lazy=True, cascade="all, delete-orphan")
    interfaces = db.relationship("Interface", backref="repository", lazy=True, cascade="all, delete-orphan")
    runs = db.relationship("AnalysisRun", backref="repository", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "repository_id": self.repository_id,
            "github_url": self.github_url,
            "name": self.name,
            "default_branch": self.default_branch or "main",
            "is_demo": bool(self.is_demo),
            "analyzed_at": self.analyzed_at.isoformat() if self.analyzed_at else None,
        }