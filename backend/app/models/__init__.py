from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from app.models.repository import Repository
from app.models.commit import Commit
from app.models.interface import Interface
from app.models.snapshot import InterfaceSnapshot
from app.models.explanation import Explanation
from app.models.analysis_run import AnalysisRun
from app.models.finding import Finding
from app.models.dependency import DependencyEdge
from app.models.change_point import ChangePoint
from app.models.report import ReportJob
from app.models.evaluation import EvaluationResult

__all__ = [
    "db",
    "Repository",
    "Commit",
    "Interface",
    "InterfaceSnapshot",
    "Explanation",
    "AnalysisRun",
    "Finding",
    "DependencyEdge",
    "ChangePoint",
    "ReportJob",
    "EvaluationResult",
]