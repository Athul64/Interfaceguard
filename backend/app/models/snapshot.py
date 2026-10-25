from app.models import db

class InterfaceSnapshot(db.Model):
    __tablename__ = "interface_snapshot"

    snapshot_id = db.Column(db.Integer, primary_key=True)
    interface_id = db.Column(db.Integer, db.ForeignKey("interface.interface_id"), nullable=False)
    commit_id = db.Column(db.Integer, db.ForeignKey("commit.commit_id"), nullable=False)
    analysis_run_id = db.Column(db.Integer, nullable=True)

    # Basic metrics
    method_count = db.Column(db.Integer, default=0)
    isp_violation_ratio = db.Column(db.Float, default=0.0)
    dependency_count = db.Column(db.Integer, default=0)
    churn = db.Column(db.Integer, default=0)
    breaking_change_count = db.Column(db.Integer, default=0)
    health_score = db.Column(db.Float, nullable=True)
    is_eroding = db.Column(db.Boolean, default=False)

    # CK Metrics aggregated over implementing classes
    cbo = db.Column(db.Float, default=0.0)
    lcom = db.Column(db.Float, default=0.0)
    rfc = db.Column(db.Float, default=0.0)
    wmc = db.Column(db.Float, default=0.0)
    dit = db.Column(db.Float, default=0.0)
    noc = db.Column(db.Float, default=0.0)

    # Interface erosion metrics
    method_growth = db.Column(db.Integer, default=0)
    cohesion = db.Column(db.Float, default=1.0)
    severity = db.Column(db.String(20), default="healthy")  # healthy, warning, high, critical
    trend = db.Column(db.String(20), default="stable")      # stable, rising, accelerating
    isp_violations_count = db.Column(db.Integer, default=0)
    smells_count = db.Column(db.Integer, default=0)

    explanations = db.relationship("Explanation", backref="snapshot", lazy=True)

    def to_dict(self):
        return {
            "snapshot_id": self.snapshot_id,
            "interface_id": self.interface_id,
            "commit_id": self.commit_id,
            "analysis_run_id": self.analysis_run_id,
            "method_count": self.method_count,
            "isp_violation_ratio": self.isp_violation_ratio,
            "dependency_count": self.dependency_count,
            "churn": self.churn,
            "breaking_change_count": self.breaking_change_count,
            "health_score": self.health_score,
            "is_eroding": self.is_eroding,
            "cbo": self.cbo,
            "lcom": self.lcom,
            "rfc": self.rfc,
            "wmc": self.wmc,
            "dit": self.dit,
            "noc": self.noc,
            "method_growth": self.method_growth,
            "cohesion": self.cohesion,
            "severity": self.severity or "healthy",
            "trend": self.trend or "stable",
            "isp_violations_count": self.isp_violations_count or 0,
            "smells_count": self.smells_count or 0,
        }