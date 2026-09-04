from datetime import datetime
from app.models import db

class Explanation(db.Model):
    __tablename__ = "explanation"

    explanation_id = db.Column(db.Integer, primary_key=True)
    snapshot_id = db.Column(db.Integer, db.ForeignKey("interface_snapshot.snapshot_id"), nullable=False)
    explanation_text = db.Column(db.Text)
    suggestion_text = db.Column(db.Text)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)