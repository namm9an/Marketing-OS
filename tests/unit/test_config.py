"""
Unit Tests for BaseSettings Configuration & Enterprise Identity
"""

import os
from pathlib import Path
import pytest
from app.core.config import Settings, settings


def test_default_enterprise_identity():
    assert settings.TARGET_ORGANIZATION == "Vanguard Cloud"
    assert settings.TARGET_INDUSTRY == "Enterprise AI & GPU Cloud"
    assert settings.PROJECT_NAME == "Marketing OS v2.0"
    assert settings.VERSION == "2.0.0"
    assert isinstance(settings.DB_PATH, Path)
    assert settings.ADMIN_USER == "admin"
    assert settings.DEFAULT_MODEL == "gemini-3.8-flash"


def test_settings_env_override(monkeypatch):
    monkeypatch.setenv("TARGET_ORGANIZATION", "Acme Compute")
    monkeypatch.setenv("TARGET_INDUSTRY", "Quantum AI Systems")
    monkeypatch.setenv("ADMIN_USER", "custom_admin")
    monkeypatch.setenv("ADMIN_PASSWORD", "secret999")
    custom_settings = Settings()
    assert custom_settings.TARGET_ORGANIZATION == "Acme Compute"
    assert custom_settings.TARGET_INDUSTRY == "Quantum AI Systems"
    assert custom_settings.ADMIN_USER == "custom_admin"
    assert custom_settings.ADMIN_PASSWORD == "secret999"


def test_legacy_auth_env_aliases(monkeypatch):
    monkeypatch.delenv("ADMIN_USER", raising=False)
    monkeypatch.delenv("ADMIN_PASSWORD", raising=False)
    monkeypatch.setenv("APP_USERNAME", "legacy_user")
    monkeypatch.setenv("APP_PASSWORD", "legacy_pass")
    custom_settings = Settings()
    assert custom_settings.ADMIN_USER == "legacy_user"
    assert custom_settings.ADMIN_PASSWORD == "legacy_pass"


def test_db_path_reassignment(tmp_path):
    orig = settings.DB_PATH
    try:
        new_path = tmp_path / "temporary.db"
        settings.DB_PATH = new_path
        assert settings.DB_PATH == new_path
    finally:
        settings.DB_PATH = orig
