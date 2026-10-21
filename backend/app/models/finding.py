from app.models import db

class Finding(db.Model):
    __tablename__ = "findings"

    finding_id = db.Column(db.Integer, primary_key=True)
    analysis_run_id = db.Column(db.Integer, db.ForeignKey("analysis_runs.run_id"), nullable=False)
    interface_id = db.Column(db.Integer, db.ForeignKey("interface.interface_id"), nullable=True)
    snapshot_id = db.Column(db.Integer, db.ForeignKey("interface_snapshot.snapshot_id"), nullable=True)
    
    category = db.Column(db.String(50), nullable=False)  # isp_violation, code_smell, dependency_cycle, fat_interface
    rule_name = db.Column(db.String(100), nullable=False)
    severity = db.Column(db.String(20), default="warning")  # critical, high, warning, healthy
    description = db.Column(db.Text, nullable=False)
    evidence = db.Column(db.Text, nullable=True)
    class_name = db.Column(db.String(150), nullable=True)
    method_name = db.Column(db.String(150), nullable=True)
    file_path = db.Column(db.String(255), nullable=True)
    line_number = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            "finding_id": self.finding_id,
            "analysis_run_id": self.analysis_run_id,
            "interface_id": self.interface_id,
            "snapshot_id": self.snapshot_id,
            "category": self.category,
            "rule_name": self.rule_name,
            "severity": self.severity,
            "description": self.description,
            "evidence": self.evidence,
            "class_name": self.class_name,
            "method_name": self.method_name,
            "file_path": self.file_path,
            "line_number": self.line_number,
        }
