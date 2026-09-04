from app.models import db

class InterfaceSnapshot(db.Model):
    __tablename__ = "interface_snapshot"

    snapshot_id = db.Column(db.Integer, primary_key=True)
    interface_id = db.Column(db.Integer, db.ForeignKey("interface.interface_id"), nullable=False)
    commit_id = db.Column(db.Integer, db.ForeignKey("commit.commit_id"), nullable=False)
    method_count = db.Column(db.Integer)
    isp_violation_ratio = db.Column(db.Float)
    dependency_count = db.Column(db.Integer)
    churn = db.Column(db.Integer)
    breaking_change_count = db.Column(db.Integer)
    health_score = db.Column(db.Float)
    is_eroding = db.Column(db.Boolean, default=False)

    explanations = db.relationship("Explanation", backref="snapshot", lazy=True)