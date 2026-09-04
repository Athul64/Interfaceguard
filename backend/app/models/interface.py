from app.models import db

class Interface(db.Model):
    __tablename__ = "interface"

    interface_id = db.Column(db.Integer, primary_key=True)
    repository_id = db.Column(db.Integer, db.ForeignKey("repository.repository_id"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)

    snapshots = db.relationship("InterfaceSnapshot", backref="interface", lazy=True)
    
    def to_dict(self):
        return {
            "interface_id": self.interface_id,
            "repository_id": self.repository_id,
            "name": self.name,
            "file_path": self.file_path,
        }