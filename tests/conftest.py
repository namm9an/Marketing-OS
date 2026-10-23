"""
Pytest Fixtures and Environment Isolation
"""

import pytest
from app.core.config import settings
from app.core.rate_limiter import rate_limiter
from app.core.security import session_store, login_rate_limiter
from app.db.database import reset_db_state


@pytest.fixture(autouse=True)
def isolate_test_environment(monkeypatch):
    """
    Ensure hermetic test runs:
    1. Reset the rate limiter and session stores so limits do not bleed across test cases.
    2. Reset DB initialization singleton.
    3. Ensure base settings default model is isolated from local uncommitted .env overrides.
    """
    rate_limiter.reset()
    session_store.reset()
    login_rate_limiter.reset()
    reset_db_state()
    # Isolate DEFAULT_MODEL baseline and GEMINI_API_KEY from untracked local .env
    monkeypatch.setattr(settings, "DEFAULT_MODEL", "gemini-3.8-flash")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    yield
    rate_limiter.reset()
    session_store.reset()
    login_rate_limiter.reset()
    reset_db_state()
