"""
App Configuration & Environment Settings
"""

import os
import ipaddress
from pathlib import Path
from typing import List, Union
from pydantic import Field, AliasChoices, model_validator
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
    ENVIRONMENT: str = Field(
        default="development",
        description="Deployment environment (e.g. development, test, staging, production)",
    )
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
    DEFAULT_MODEL: str = Field(default="gemini-3.8-flash", description="Default LLM model identifier")
    GEMINI_DAILY_LIMIT: int = Field(default=200, description="Daily limit for Gemini API calls")
    VISITOR_DAILY_LIMIT: int = Field(default=10, description="Daily limit for visitor AI actions")
    IP_DAILY_LIMIT: int = Field(default=50, description="Daily abuse ceiling limit per IP address")

    # Security & Browser Boundary
    SESSION_COOKIE_SECURE: bool = Field(
        default=False,
        description="Enable Secure attribute on session cookies in HTTPS production",
    )
    ALLOWED_ORIGINS: Union[str, List[str]] = Field(
        default_factory=lambda: [
            "http://localhost:5000",
            "http://127.0.0.1:5000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        description="Allowed CORS frontend origins",
    )
    TRUST_FORWARDED_FOR: bool = Field(
        default=False,
        description="Trust X-Forwarded-For header only when explicitly enabled",
    )
    TRUSTED_PROXIES: List[str] = Field(
        default_factory=list,
        description="List of trusted proxy IP addresses",
    )
    NUM_PROXIES: int = Field(
        default=1,
        description="Number of reverse proxy hops if using ProxyFix middleware",
    )

    # Auth & Abuse Controls
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
    LOGIN_MAX_ATTEMPTS: int = Field(
        default=5,
        description="Max failed login attempts before throttling",
    )
    LOGIN_RATE_LIMIT_WINDOW_SECONDS: int = Field(
        default=300,
        description="Time window in seconds for failed login rate limiting",
    )

    # LangFuse Observability Settings
    LANGFUSE_PUBLIC_KEY: str = Field(default="", description="LangFuse public key")
    LANGFUSE_SECRET_KEY: str = Field(default="", description="LangFuse secret key")
    LANGFUSE_HOST: str = Field(default="https://cloud.langfuse.com", description="LangFuse host endpoint")

    # Database: DB_PATH is the single source of truth for sqlite3 connections
    DB_PATH: Path = Field(default=DEFAULT_DB_PATH, description="SQLite database path")

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        env = (self.ENVIRONMENT or "development").strip().lower()
        if self.TRUST_FORWARDED_FOR:
            proxies = [str(proxy).strip() for proxy in self.TRUSTED_PROXIES if str(proxy).strip()]
            if not proxies:
                raise ValueError(
                    "TRUSTED_PROXIES must name at least one proxy IP or CIDR when "
                    "TRUST_FORWARDED_FOR is enabled."
                )
            for proxy in proxies:
                try:
                    if "/" in proxy:
                        ipaddress.ip_network(proxy, strict=False)
                    else:
                        ipaddress.ip_address(proxy)
                except ValueError as exc:
                    raise ValueError(
                        "TRUSTED_PROXIES entries must be valid IP addresses or CIDRs. "
                        f"Invalid value: {proxy!r}."
                    ) from exc
            self.TRUSTED_PROXIES = proxies
        if env not in ("development", "dev", "test", "testing"):
            if self.ADMIN_PASSWORD == "marketing2026":
                raise ValueError(
                    f"Insecure default ADMIN_PASSWORD is prohibited outside development ('{self.ENVIRONMENT}'). "
                    "Configure a strong ADMIN_PASSWORD in your environment variables."
                )
            if not self.SESSION_COOKIE_SECURE:
                raise ValueError(
                    f"SESSION_COOKIE_SECURE must be True outside development/test ('{self.ENVIRONMENT}'). "
                    "Insecure session cookies are prohibited in production/staging environments."
                )
        return self

    def get_allowed_origins(self) -> List[str]:
        if isinstance(self.ALLOWED_ORIGINS, str):
            return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]
        return list(self.ALLOWED_ORIGINS)


settings = Settings()
