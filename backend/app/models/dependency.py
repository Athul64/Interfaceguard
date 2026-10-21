from app.models import db

class DependencyEdge(db.Model):
    __tablename__ = "dependency_edges"

    edge_id = db.Column(db.Integer, primary_key=True)
    analysis_run_id = db.Column(db.Integer, db.ForeignKey("analysis_runs.run_id"), nullable=False)
    source_name = db.Column(db.String(150), nullable=False)
    target_name = db.Column(db.String(150), nullable=False)
    source_type = db.Column(db.String(50), default="class")      # interface, class
    target_type = db.Column(db.String(50), default="interface")  # interface, class
    relationship = db.Column(db.String(50), default="depends_on") # implements, depends_on, extends
    in_cycle = db.Column(db.Boolean, default=False)
    cycle_path = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            "edge_id": self.edge_id,
            "analysis_run_id": self.analysis_run_id,
            "source_name": self.source_name,
            "target_name": self.target_name,
            "source_type": self.source_type,
            "target_type": self.target_type,
            "relationship": self.relationship,
            "in_cycle": self.in_cycle,
            "cycle_path": self.cycle_path,
        }
