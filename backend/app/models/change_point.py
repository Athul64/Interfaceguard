from app.models import db

class ChangePoint(db.Model):
    __tablename__ = "change_points"

    change_point_id = db.Column(db.Integer, primary_key=True)
    analysis_run_id = db.Column(db.Integer, db.ForeignKey("analysis_runs.run_id"), nullable=False)
    interface_id = db.Column(db.Integer, db.ForeignKey("interface.interface_id"), nullable=True)
    commit_hash = db.Column(db.String(50), nullable=False)
    commit_date = db.Column(db.DateTime, nullable=True)
    author = db.Column(db.String(100), nullable=True)
    metric_name = db.Column(db.String(50), default="health_score")
    score_before = db.Column(db.Float, nullable=True)
    score_after = db.Column(db.Float, nullable=True)
    confidence = db.Column(db.Float, default=1.0)
    description = db.Column(db.Text, nullable=True)
    is_project_level = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "change_point_id": self.change_point_id,
            "analysis_run_id": self.analysis_run_id,
            "interface_id": self.interface_id,
            "commit_hash": self.commit_hash,
            "commit_date": self.commit_date.isoformat() if self.commit_date else None,
            "author": self.author,
            "metric_name": self.metric_name,
            "score_before": self.score_before,
            "score_after": self.score_after,
            "confidence": self.confidence,
            "description": self.description,
            "is_project_level": self.is_project_level,
        }
