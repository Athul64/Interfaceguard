import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

class Config:
    BASE_DIR = BASE_DIR
    SECRET_KEY = os.getenv("SECRET_KEY", "interfaceguard-dev-secret-key-2026")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", f"sqlite:///{str(BASE_DIR / 'data' / 'interfaceguard.db').replace('\\', '/')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Storage and paths
    DATA_DIR = BASE_DIR / "data"
    REPORTS_DIR = DATA_DIR / "reports"
    TEMP_DIR = DATA_DIR / "temp"
    SAMPLE_REPOS_DIR = BASE_DIR.parent / "sample-repositories"
    
    # JavaParser bridge jar path
    JAVAPARSER_JAR = (
        BASE_DIR / "app" / "tools" / "javaparser-bridge" / "target" / "javaparser-bridge-1.0.jar"
    )
    
    # LLM Settings
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")  # "gemini", "openai", "fallback"
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    LLM_MODEL = os.getenv("LLM_MODEL", "gemini-flash-lite-latest")
    LLM_TIMEOUT_SECONDS = int(os.getenv("LLM_TIMEOUT_SECONDS", "30"))
    
    # Analysis thresholds & weights
    DEFAULT_MAX_COMMITS = int(os.getenv("DEFAULT_MAX_COMMITS", "50"))
    HEALTH_WEIGHTS = {
        "isp_violations": 0.30,
        "method_bloat": 0.20,
        "coupling": 0.15,
        "dependency_cycles": 0.15,
        "churn": 0.10,
        "cohesion": 0.10,
    }
