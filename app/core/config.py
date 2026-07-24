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
    
    # TIR Llama 3.3 70B Managed Endpoint
    TIR_LLM_URL: str = os.environ.get("TIR_LLM_URL", "http://164.52.194.136:8000/v1/chat/completions")
    TIR_API_KEY: str = os.environ.get("TIR_API_KEY", "e2e-a40-48fbd0fd88076c77f62e730d38aa5370")
    
    # LangFuse Observability Settings
    LANGFUSE_PUBLIC_KEY: str = os.environ.get("LANGFUSE_PUBLIC_KEY", "")
    LANGFUSE_SECRET_KEY: str = os.environ.get("LANGFUSE_SECRET_KEY", "")
    LANGFUSE_HOST: str = os.environ.get("LANGFUSE_HOST", "https://cloud.langfuse.com")
    
    # Database
    DATABASE_URL: str = os.environ.get("DATABASE_URL", f"sqlite:///{DB_PATH}")
    DB_PATH: Path = DB_PATH

settings = Settings()
