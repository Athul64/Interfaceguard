from datetime import datetime, timezone
from app.models import db

class EvaluationResult(db.Model):
    __tablename__ = "evaluation_results"

    id = db.Column(db.Integer, primary_key=True)
    repository_name = db.Column(db.String(100), nullable=False)
    configuration = db.Column(db.String(50), nullable=False)  # rules_only, rules_and_changepoint, full_pipeline_with_ai
    total_interfaces = db.Column(db.Integer, default=0)
    true_positives = db.Column(db.Integer, default=0)
    false_positives = db.Column(db.Integer, default=0)
    false_negatives = db.Column(db.Integer, default=0)
    true_negatives = db.Column(db.Integer, default=0)
    precision = db.Column(db.Float, default=0.0)
    recall = db.Column(db.Float, default=0.0)
    f1_score = db.Column(db.Float, default=0.0)
    details = db.Column(db.Text, nullable=True)
    evaluated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "repository_name": self.repository_name,
            "configuration": self.configuration,
            "total_interfaces": self.total_interfaces,
            "true_positives": self.true_positives,
            "false_positives": self.false_positives,
            "false_negatives": self.false_negatives,
            "true_negatives": self.true_negatives,
            "precision": round(self.precision, 3),
            "recall": round(self.recall, 3),
            "f1_score": round(self.f1_score, 3),
            "details": self.details,
            "evaluated_at": self.evaluated_at.isoformat() if self.evaluated_at else None,
        }
