"""
Security Guardrails & Input Sanitization (Enterprise Hardening)
"""

import re
import secrets
import sqlite3
import threading
import time
import unicodedata
from pathlib import Path
from typing import Tuple, Optional, Dict, Any, List

from app.db.database import retry_on_locked


# Invisible and zero-width character regex
_INVISIBLE_CHARS_RE = re.compile(
    r"[\u200B-\u200D\uFEFF\u00AD\u2060\u200E\u200F\u202A-\u202E\u180E\uFFF9-\uFFFB]"
)

# Adversarial prompt injection & system override patterns
_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(?:all\s+|any\s+)?(?:previous|prior|above)\s+instructions?", re.IGNORECASE),
    re.compile(r"disregard\s+(?:all\s+|any\s+)?(?:previous|prior|above)\s+instructions?", re.IGNORECASE),
    re.compile(r"system\s*prompt\s*override", re.IGNORECASE),
    re.compile(r"override\s+(?:the\s+)?system\s+prompt", re.IGNORECASE),
    re.compile(r"\breveal\s+(?:all\s+)?(?:(?:secret|private)\s+)?(?:api[_\s-]?keys?|passwords?|system\s+prompts?)\b", re.IGNORECASE),
    re.compile(r"\breveal\s+(?:all\s+)?(?:secret|private)\s+keys?\b", re.IGNORECASE),
    re.compile(r"\b(?:show|print|output)\s+(?:the\s+)?(?:(?:secret|private)\s+)?(?:api[_\s-]?keys?|passwords?|system\s+prompts?)\b", re.IGNORECASE),
    re.compile(r"\b(?:show|print|output)\s+(?:the\s+)?(?:secret|private)\s+keys?\b", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+in\s+developer\s+mode", re.IGNORECASE),
    re.compile(r"\bDAN\s+mode\b", re.IGNORECASE),
    re.compile(r"\bbypass\s+(?:all\s+)?(?:safety|content|security|guardrail|ai)\s*(?:filters|rules|restrictions|guardrails)\b", re.IGNORECASE),
    re.compile(r"forget\s+(?:everything|all\s+rules)", re.IGNORECASE),
]

MAX_PROMPT_LENGTH = 4000
MAX_PAYLOAD_BYTES = 64 * 1024  # 64 KB


class SecurityError(Exception):
    """Base security exception."""
    status_code: int = 400


class PayloadTooLargeError(SecurityError):
    """Raised when prompt exceeds maximum character limit."""
    status_code: int = 413


class PromptInjectionError(SecurityError):
    """Raised when adversarial prompt injection is detected."""
    status_code: int = 400


# Comprehensive cross-script homoglyph map (Cyrillic, Greek, lookalikes -> Latin)
_HOMOGLYPH_MAP = str.maketrans({
    # Cyrillic lowercase lookalikes
    '\u0430': 'a', '\u0435': 'e', '\u043e': 'o', '\u0440': 'p', '\u0441': 'c',
    '\u0443': 'y', '\u0445': 'x', '\u0456': 'i', '\u0458': 'j', '\u0455': 's',
    '\u0432': 'v', '\u0433': 'g', '\u0434': 'd', '\u0436': 'zh', '\u0437': 'z',
    '\u0438': 'i', '\u0439': 'i', '\u043a': 'k', '\u043b': 'l', '\u043c': 'm',
    '\u043d': 'n', '\u043f': 'p', '\u0442': 't', '\u0444': 'f', '\u0446': 'ts',
    '\u0447': 'ch', '\u0448': 'sh', '\u0449': 'sh', '\u044b': 'y', '\u044d': 'e',
    '\u044e': 'yu', '\u044f': 'ya', '\u0454': 'e', '\u0457': 'i',
    # Cyrillic uppercase lookalikes
    '\u0410': 'A', '\u0412': 'B', '\u0415': 'E', '\u041a': 'K', '\u041c': 'M',
    '\u041d': 'H', '\u041e': 'O', '\u0420': 'P', '\u0421': 'C', '\u0422': 'T',
    '\u0423': 'Y', '\u0425': 'X', '\u0406': 'I', '\u0408': 'J', '\u0405': 'S',
    # Greek lowercase lookalikes
    '\u03b1': 'a', '\u03b2': 'b', '\u03b3': 'y', '\u03b5': 'e', '\u03b7': 'n',
    '\u03b9': 'i', '\u03ba': 'k', '\u03bd': 'v', '\u03bf': 'o', '\u03c1': 'p',
    '\u03c3': 's', '\u03c4': 't', '\u03c5': 'u', '\u03c7': 'x', '\u03c9': 'w',
    # Greek uppercase lookalikes
    '\u0391': 'A', '\u0392': 'B', '\u0395': 'E', '\u0397': 'H', '\u0399': 'I',
    '\u039a': 'K', '\u039c': 'M', '\u039d': 'N', '\u039f': 'O', '\u03a1': 'P',
    '\u03a4': 'T', '\u03a5': 'Y', '\u03a7': 'X',
})


def clean_invisible_characters(text: str) -> str:
    """Strip zero-width spaces and invisible formatting unicode characters."""
    if not text:
        return ""
    return _INVISIBLE_CHARS_RE.sub("", text)


def normalize_homoglyphs(text: str) -> str:
    """Normalize unicode lookalikes and homoglyphs to compatibility decomposed/composed forms."""
    if not text:
        return ""
    nfkc = unicodedata.normalize("NFKC", text)
    return nfkc.translate(_HOMOGLYPH_MAP)


def detect_prompt_injection(text: str) -> Tuple[bool, Optional[str]]:
    """
    Check for jailbreaks, system prompt overrides, and token extraction attempts.
    Returns (is_detected, matched_pattern_description).
    """
    if not text:
        return False, None

    cleaned = clean_invisible_characters(text)
    normalized = normalize_homoglyphs(cleaned)

    for pattern in _INJECTION_PATTERNS:
        match = pattern.search(normalized)
        if match:
            return True, match.group(0)

    return False, None


def sanitize_prompt(text: str) -> str:
    """
    Sanitize prompt: strip zero-width characters and neutralize detected injection triggers.
    """
    if not text:
        return ""

    cleaned = clean_invisible_characters(text)
    for pattern in _INJECTION_PATTERNS:
        cleaned = pattern.sub("[FILTERED_PROMPT_INJECTION]", cleaned)

    return cleaned.strip()


def validate_prompt(text: str, max_chars: int = MAX_PROMPT_LENGTH) -> str:
    """
    Enforce boundary rules on prompt strings:
    1. Length limit <= 4000 chars (raises PayloadTooLargeError / 413).
    2. Zero-width character stripping.
    3. Injection pattern rejection (raises PromptInjectionError / 400).
    4. Return cleaned original Unicode text (preserving Cyrillic, Greek, etc.).
    """
    if not text:
        return ""

    # Length boundary check
    if len(text) > max_chars:
        raise PayloadTooLargeError(
            f"Prompt exceeds maximum allowed length of {max_chars} characters (received {len(text)})."
        )

    # Invisible character defense
    cleaned = clean_invisible_characters(text)

    # Injection defense (evaluated against homoglyph-normalized temporary copy inside detect_prompt_injection)
    is_injection, matched = detect_prompt_injection(cleaned)
    if is_injection:
        raise PromptInjectionError(
            f"Adversarial prompt injection pattern detected: '{matched}'"
        )

    return cleaned


class SessionStore:
    """
    Cryptographically secure, SQLite-backed, expiring, and revocable server-side session store.
    Backed by SQLite 'sessions' table to support multi-process deployments (e.g. Gunicorn workers)
    without state desynchronization.
    """

    def __init__(
        self,
        default_ttl_seconds: int = 86400,
        max_sessions: int = 10000,
        db_path: Optional[Path] = None,
    ):
        self.default_ttl = default_ttl_seconds
        self.max_sessions = max_sessions
        self._db_path = db_path
        self._lock = threading.Lock()

    @property
    def db_path(self) -> Path:
        if self._db_path is not None:
            return self._db_path
        from app.core.config import settings
        return settings.DB_PATH

    def _get_conn(self, timeout: float = 10.0) -> sqlite3.Connection:
        from app.db.database import init_db
        init_db()
        conn = sqlite3.connect(str(self.db_path), timeout=timeout, isolation_level=None)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA busy_timeout = 5000;")
        conn.execute("PRAGMA synchronous = NORMAL;")
        return conn

    @retry_on_locked()
    def create_session(self, username: str, ttl_seconds: Optional[int] = None) -> str:
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        token = secrets.token_urlsafe(32)
        created_at = time.time()
        expires_at = created_at + ttl
        conn = self._get_conn()
        try:
            conn.execute("BEGIN IMMEDIATE")
            conn.execute("DELETE FROM sessions WHERE expires_at <= ?", (created_at,))
            conn.execute(
                "INSERT INTO sessions (token, username, created_at, expires_at) VALUES (?, ?, ?, ?)",
                (token, username, created_at, expires_at),
            )
            if self.max_sessions > 0:
                count = conn.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
                if count > self.max_sessions:
                    excess = count - self.max_sessions
                    conn.execute(
                        "DELETE FROM sessions WHERE token IN (SELECT token FROM sessions ORDER BY created_at ASC LIMIT ?)",
                        (excess,),
                    )
            conn.execute("COMMIT")
        except Exception:
            try:
                conn.execute("ROLLBACK")
            except Exception:
                pass
            raise
        finally:
            conn.close()
        return token

    @retry_on_locked()
    def validate_session(self, token: Optional[str]) -> Optional[Dict[str, Any]]:
        if not token or not isinstance(token, str):
            return None
        # Explicitly reject old static cookie
        if token == "authenticated_admin":
            return None
        now = time.time()
        conn = self._get_conn()
        try:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute(
                "SELECT token, username, created_at, expires_at FROM sessions WHERE token = ?",
                (token,),
            ).fetchone()
            if row is None:
                conn.execute("COMMIT")
                return None
            if now > row["expires_at"]:
                conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
                conn.execute("COMMIT")
                return None
            conn.execute("COMMIT")
            return {
                "username": row["username"],
                "created_at": row["created_at"],
                "expires_at": row["expires_at"],
            }
        except Exception:
            try:
                conn.execute("ROLLBACK")
            except Exception:
                pass
            return None
        finally:
            conn.close()

    @retry_on_locked()
    def revoke_session(self, token: Optional[str]) -> bool:
        if not token or not isinstance(token, str):
            return False
        conn = self._get_conn()
        try:
            conn.execute("BEGIN IMMEDIATE")
            cursor = conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
            conn.execute("COMMIT")
            return cursor.rowcount > 0
        except Exception:
            try:
                conn.execute("ROLLBACK")
            except Exception:
                pass
            return False
        finally:
            conn.close()

    @retry_on_locked()
    def reset(self) -> None:
        conn = self._get_conn()
        try:
            conn.execute("BEGIN IMMEDIATE")
            conn.execute("DELETE FROM sessions")
            conn.execute("COMMIT")
        except Exception:
            try:
                conn.execute("ROLLBACK")
            except Exception:
                pass
        finally:
            conn.close()


class LoginRateLimiter:
    """
    Rate limiter for failed admin login attempts per client IP with bounded cardinality
    and transactional SQLite persistence across multi-worker processes.
    """

    def __init__(
        self,
        max_attempts: Optional[int] = None,
        window_seconds: Optional[int] = None,
        max_buckets: int = 10000,
        db_path: Optional[Path] = None,
    ):
        self._max_attempts = max_attempts
        self._window_seconds = window_seconds
        self.max_buckets = max_buckets
        self._db_path = db_path
        self._lock = threading.Lock()

    @property
    def db_path(self) -> Path:
        if self._db_path is not None:
            return self._db_path
        from app.core.config import settings
        return settings.DB_PATH

    def _get_conn(self, timeout: float = 10.0) -> sqlite3.Connection:
        from app.db.database import init_db
        init_db()
        conn = sqlite3.connect(str(self.db_path), timeout=timeout, isolation_level=None)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA busy_timeout = 5000;")
        conn.execute("PRAGMA synchronous = NORMAL;")
        return conn

    @property
    def max_attempts(self) -> int:
        if self._max_attempts is not None:
            return self._max_attempts
        try:
            from app.core.config import settings
            return getattr(settings, "LOGIN_MAX_ATTEMPTS", 5)
        except Exception:
            return 5

    @max_attempts.setter
    def max_attempts(self, val: int):
        self._max_attempts = val

    @property
    def window_seconds(self) -> int:
        if self._window_seconds is not None:
            return self._window_seconds
        try:
            from app.core.config import settings
            return getattr(settings, "LOGIN_RATE_LIMIT_WINDOW_SECONDS", 300)
        except Exception:
            return 300

    @window_seconds.setter
    def window_seconds(self, val: int):
        self._window_seconds = val

    @property
    def _failures(self) -> Dict[str, List[float]]:
        """Backward-compatible inspection property reflecting SQLite login_failures table."""
        try:
            conn = self._get_conn()
            try:
                rows = conn.execute(
                    "SELECT ip, attempted_at FROM login_failures ORDER BY attempted_at ASC"
                ).fetchall()
                res: Dict[str, List[float]] = {}
                for r in rows:
                    res.setdefault(r["ip"], []).append(float(r["attempted_at"]))
                return res
            finally:
                conn.close()
        except Exception:
            return {}

    @_failures.setter
    def _failures(self, val: Any) -> None:
        pass

    @retry_on_locked()
    def check(self, ip: str, now: Optional[float] = None) -> Tuple[bool, int]:
        t = time.time() if now is None else now
        cutoff = t - self.window_seconds
        conn = self._get_conn()
        try:
            conn.execute("BEGIN IMMEDIATE")
            conn.execute("DELETE FROM login_failures WHERE attempted_at <= ?", (cutoff,))
            rows = conn.execute(
                "SELECT attempted_at FROM login_failures WHERE ip = ? AND attempted_at > ? ORDER BY attempted_at ASC",
                (ip, cutoff),
            ).fetchall()
            conn.execute("COMMIT")
            if len(rows) >= self.max_attempts:
                earliest = rows[0]["attempted_at"]
                retry_after = max(1, int(self.window_seconds - (t - earliest)))
                return False, retry_after
            return True, 0
        except Exception:
            try:
                conn.execute("ROLLBACK")
            except Exception:
                pass
            raise
        finally:
            conn.close()

    @retry_on_locked()
    def record_failure_if_allowed(self, ip: str, now: Optional[float] = None) -> Tuple[bool, int]:
        """
        Atomically admit one failed login attempt or reject it once the window is full.

        This is intentionally a single transaction rather than a separate check followed
        by a write, so concurrent WSGI workers cannot all observe stale capacity and
        admit an unlimited burst of password guesses.
        """
        t = time.time() if now is None else now
        cutoff = t - self.window_seconds
        conn = self._get_conn()
        try:
            conn.execute("BEGIN IMMEDIATE")
            conn.execute("DELETE FROM login_failures WHERE attempted_at <= ?", (cutoff,))
            rows = conn.execute(
                "SELECT attempted_at FROM login_failures WHERE ip = ? AND attempted_at > ? "
                "ORDER BY attempted_at ASC",
                (ip, cutoff),
            ).fetchall()
            if len(rows) >= self.max_attempts:
                earliest = rows[0]["attempted_at"]
                retry_after = max(1, int(self.window_seconds - (t - earliest)))
                conn.execute("COMMIT")
                return False, retry_after

            conn.execute("INSERT INTO login_failures (ip, attempted_at) VALUES (?, ?)", (ip, t))
            if self.max_buckets > 0:
                count_ips = conn.execute(
                    "SELECT COUNT(DISTINCT ip) FROM login_failures"
                ).fetchone()[0]
                if count_ips > self.max_buckets:
                    excess = count_ips - self.max_buckets
                    conn.execute(
                        """
                        DELETE FROM login_failures WHERE ip IN (
                            SELECT ip FROM login_failures GROUP BY ip ORDER BY MIN(attempted_at) ASC LIMIT ?
                        )
                        """,
                        (excess,),
                    )
            conn.execute("COMMIT")
            return True, 0
        except Exception:
            try:
                conn.execute("ROLLBACK")
            except Exception:
                pass
            raise
        finally:
            conn.close()

    def record_failure(self, ip: str, now: Optional[float] = None) -> None:
        """Backward-compatible wrapper; callers needing a decision use the atomic method."""
        self.record_failure_if_allowed(ip, now=now)

    @retry_on_locked()
    def record_success(self, ip: str) -> None:
        conn = self._get_conn()
        try:
            conn.execute("BEGIN IMMEDIATE")
            conn.execute("DELETE FROM login_failures WHERE ip = ?", (ip,))
            conn.execute("COMMIT")
        except Exception:
            try:
                conn.execute("ROLLBACK")
            except Exception:
                pass
            raise
        finally:
            conn.close()

    @retry_on_locked()
    def reset(self) -> None:
        conn = self._get_conn()
        try:
            conn.execute("BEGIN IMMEDIATE")
            conn.execute("DELETE FROM login_failures")
            conn.execute("COMMIT")
        except Exception:
            try:
                conn.execute("ROLLBACK")
            except Exception:
                pass
            raise
        finally:
            conn.close()


session_store = SessionStore()
login_rate_limiter = LoginRateLimiter()
