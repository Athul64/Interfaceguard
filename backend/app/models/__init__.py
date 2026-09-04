from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from app.models.repository import Repository
from app.models.commit import Commit
from app.models.interface import Interface
from app.models.snapshot import InterfaceSnapshot
from app.models.explanation import Explanation