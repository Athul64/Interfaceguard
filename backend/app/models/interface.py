from app.models import db

class Interface(db.Model):
    __tablename__ = "interface"

    interface_id = db.Column(db.Integer, primary_key=True)
    repository_id = db.Column(db.Integer, db.ForeignKey("repository.repository_id"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    package = db.Column(db.String(255), default="")
    file_path = db.Column(db.String(255), nullable=False)

    snapshots = db.relationship("InterfaceSnapshot", backref="interface", lazy=True, cascade="all, delete-orphan")
    findings = db.relationship("Finding", backref="interface", lazy=True, cascade="all, delete-orphan")
    change_points = db.relationship("ChangePoint", backref="interface", lazy=True, cascade="all, delete-orphan")
    explanations = db.relationship("Explanation", backref="interface", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "interface_id": self.interface_id,
            "repository_id": self.repository_id,
            "name": self.name,
            "package": self.package or "",
            "file_path": self.file_path,
        }