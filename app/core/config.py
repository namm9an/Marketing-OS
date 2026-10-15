"""
App Configuration & Environment Settings
"""

import os
from pathlib import Path
from pydantic import Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "app" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_DB_PATH = DATA_DIR / "marketing_os.db"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = Field(default="Marketing OS v2.0", description="Project display name")
    VERSION: str = Field(default="2.0.0", description="Current application version")
    BASE_DIR: Path = Field(default=BASE_DIR, description="Absolute root directory of project")

    # Enterprise Identity & Industry Vertical (Parameterizable)
    TARGET_ORGANIZATION: str = Field(
        default="Vanguard Cloud",
        description="Enterprise name for target organization (de-identified default)",
    )
    TARGET_INDUSTRY: str = Field(
        default="Enterprise AI & GPU Cloud",
        description="Target industry and competitive market domain",
    )

    # LLM Settings
    GEMINI_API_KEY: str = Field(default="", description="API key for Gemini models")
    DEFAULT_MODEL: str = Field(default="gemini-3.6-flash", description="Default LLM model identifier")

    # Auth (single-admin; override in production via env ADMIN_USER / ADMIN_PASSWORD or legacy APP_USERNAME / APP_PASSWORD)
    ADMIN_USER: str = Field(
        default="admin",
        validation_alias=AliasChoices("ADMIN_USER", "APP_USERNAME"),
        description="Admin username",
    )
    ADMIN_PASSWORD: str = Field(
        default="marketing2026",
        validation_alias=AliasChoices("ADMIN_PASSWORD", "APP_PASSWORD"),
        description="Admin password",
    )

    # LangFuse Observability Settings
    LANGFUSE_PUBLIC_KEY: str = Field(default="", description="LangFuse public key")
    LANGFUSE_SECRET_KEY: str = Field(default="", description="LangFuse secret key")
    LANGFUSE_HOST: str = Field(default="https://cloud.langfuse.com", description="LangFuse host endpoint")

    # Database: DB_PATH is the single source of truth for sqlite3 connections
    DB_PATH: Path = Field(default=DEFAULT_DB_PATH, description="SQLite database path")


settings = Settings()
