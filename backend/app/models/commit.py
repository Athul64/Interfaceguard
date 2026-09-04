from app.models import db

class Commit(db.Model):
    __tablename__ = "commit"

    commit_id = db.Column(db.Integer, primary_key=True)
    repository_id = db.Column(db.Integer, db.ForeignKey("repository.repository_id"), nullable=False)
    commit_hash = db.Column(db.String(40), nullable=False)
    commit_date = db.Column(db.DateTime, nullable=False)
    author = db.Column(db.String(120))

    snapshots = db.relationship("InterfaceSnapshot", backref="commit", lazy=True)

    def to_dict(self):
        return {
            "commit_id": self.commit_id,
            "repository_id": self.repository_id,
            "commit_hash": self.commit_hash,
            "commit_date": self.commit_date.isoformat(),
            "author": self.author,
        }