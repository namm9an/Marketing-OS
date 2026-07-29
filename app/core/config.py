"""
App Configuration & Environment Settings
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "app" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "marketing_os.db"

class Settings:
    PROJECT_NAME: str = "Marketing OS v2.0"
    VERSION: str = "2.0.0"
    BASE_DIR: Path = BASE_DIR
    
    # LLM Settings
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
    DEFAULT_MODEL: str = os.environ.get("DEFAULT_MODEL", "gemini-3.6-flash")

    # Auth (single-admin; override in production via env)
    ADMIN_USER: str = os.environ.get("ADMIN_USER") or os.environ.get("APP_USERNAME") or "admin"
    ADMIN_PASSWORD: str = os.environ.get("ADMIN_PASSWORD") or os.environ.get("APP_PASSWORD") or "marketing2026"
    
    # LangFuse Observability Settings
    LANGFUSE_PUBLIC_KEY: str = os.environ.get("LANGFUSE_PUBLIC_KEY", "")
    LANGFUSE_SECRET_KEY: str = os.environ.get("LANGFUSE_SECRET_KEY", "")
    LANGFUSE_HOST: str = os.environ.get("LANGFUSE_HOST", "https://cloud.langfuse.com")
    
    # Database
    DATABASE_URL: str = os.environ.get("DATABASE_URL", f"sqlite:///{DB_PATH}")
    DB_PATH: Path = DB_PATH

settings = Settings()
