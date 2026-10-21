from datetime import datetime, timezone
from app.models import db

class Explanation(db.Model):
    __tablename__ = "explanation"

    explanation_id = db.Column(db.Integer, primary_key=True)
    snapshot_id = db.Column(db.Integer, db.ForeignKey("interface_snapshot.snapshot_id"), nullable=False)
    interface_id = db.Column(db.Integer, db.ForeignKey("interface.interface_id"), nullable=True)
    explanation_text = db.Column(db.Text)
    suggestion_text = db.Column(db.Text)
    impact_text = db.Column(db.Text, nullable=True)
    refactoring_recommendation = db.Column(db.Text, nullable=True)
    responsibility_separation = db.Column(db.Text, nullable=True)
    risk_analysis = db.Column(db.Text, nullable=True)
    is_ai_generated = db.Column(db.Boolean, default=False)
    provider = db.Column(db.String(50), default="deterministic_fallback")
    generated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "explanation_id": self.explanation_id,
            "snapshot_id": self.snapshot_id,
            "interface_id": self.interface_id,
            "explanation_text": self.explanation_text,
            "suggestion_text": self.suggestion_text,
            "impact_text": self.impact_text,
            "refactoring_recommendation": self.refactoring_recommendation,
            "responsibility_separation": self.responsibility_separation,
            "risk_analysis": self.risk_analysis,
            "is_ai_generated": self.is_ai_generated,
            "provider": self.provider,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
        }