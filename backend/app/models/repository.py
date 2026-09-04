from datetime import datetime
from app.models import db

class Repository(db.Model):
    __tablename__ = "repository"

    repository_id = db.Column(db.Integer, primary_key=True)
    github_url = db.Column(db.String(255), nullable=False, unique=True)
    name = db.Column(db.String(120), nullable=False)
    analyzed_at = db.Column(db.DateTime, default=datetime.utcnow)

    commits = db.relationship("Commit", backref="repository", lazy=True)
    interfaces = db.relationship("Interface", backref="repository", lazy=True)

    def to_dict(self):
        return {
            "repository_id": self.repository_id,
            "github_url": self.github_url,
            "name": self.name,
            "analyzed_at": self.analyzed_at.isoformat(),
        }