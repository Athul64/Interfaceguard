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

    def to_dict(self):
        return {
            "snapshot_id": self.snapshot_id, "interface_id": self.interface_id,
            "commit_id": self.commit_id, "method_count": self.method_count,
            "isp_violation_ratio": self.isp_violation_ratio, "dependency_count": self.dependency_count,
            "churn": self.churn, "breaking_change_count": self.breaking_change_count,
            "health_score": self.health_score, "is_eroding": self.is_eroding,
        }