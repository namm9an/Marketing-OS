"""
Multi-Worker Concurrency & Process Isolation Integration Tests (AC-001 through AC-004)

Verifies that all rate limiting, quota enforcement, atomic fan-out reservations,
and login attempt throttling are strictly synchronized and enforced across
independent OS worker processes sharing a single SQLite database.
"""

from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
import sqlite3
import time
import pytest

from app.core.config import Settings
from app.core.rate_limiter import RateLimiter, get_pt_day_boundaries
from app.core.security import LoginRateLimiter
from app.db.database import get_connection, init_db


# ==============================================================================
# Top-Level Worker Functions (Pickleable for spawn multiprocessing)
# ==============================================================================

def _worker_ac001_execute(
    db_path_str: str,
    worker_id: int,
    units_to_acquire: int,
    reserve_digest_units: int = 0,
):
    """
    Simulates a WSGI worker process acquiring global Gemini quota units
    and optionally making an atomic fan-out capacity reservation.
    """
    limiter = RateLimiter(db_path=Path(db_path_str), host_daily_limit=200)

    reservation_allowed = None
    reservation_id = None
    reservation_retry_after = 0
    if reserve_digest_units > 0:
        allowed, res_id, retry = limiter.reserve_capacity(units=reserve_digest_units)
        reservation_allowed = allowed
        reservation_id = res_id
        reservation_retry_after = retry

    acquired_count = 0
    rejected_count = 0
    last_retry_after = 0
    for _ in range(units_to_acquire):
        res = limiter.acquire_global_gemini(units=1)
        if res.allowed:
            acquired_count += 1
        else:
            rejected_count += 1
            last_retry_after = res.retry_after

    return {
        "worker_id": worker_id,
        "reservation_allowed": reservation_allowed,
        "reservation_id": reservation_id,
        "reservation_retry_after": reservation_retry_after,
        "acquired_count": acquired_count,
        "rejected_count": rejected_count,
        "last_retry_after": last_retry_after,
    }


def _worker_ac002_visitor(
    db_path_str: str,
    worker_id: int,
    identity: str,
    client_ip: str,
    num_actions: int,
    rotate_identity: bool = False,
):
    """
    Simulates a WSGI worker process recording frontend AI actions for a visitor identity and IP.
    """
    limiter = RateLimiter(db_path=Path(db_path_str), visitor_daily_limit=10, ip_daily_limit=50)
    admitted = 0
    rejected = 0
    last_limit_type = None
    last_retry_after = 0
    for i in range(num_actions):
        cur_id = f"{identity}_{i}" if rotate_identity else identity
        res = limiter.acquire_visitor_action(identity=cur_id, client_ip=client_ip)
        if res.allowed:
            admitted += 1
        else:
            rejected += 1
            last_limit_type = res.limit_type
            last_retry_after = res.retry_after

    return {
        "worker_id": worker_id,
        "admitted": admitted,
        "rejected": rejected,
        "last_limit_type": last_limit_type,
        "last_retry_after": last_retry_after,
    }


def _worker_ac003_reserve(db_path_str: str, units: int, ttl: int = 120):
    limiter = RateLimiter(db_path=Path(db_path_str), host_daily_limit=200)
    return limiter.reserve_capacity(units=units, ttl_seconds=ttl)


def _worker_ac003_consume(db_path_str: str, reservation_id: str):
    limiter = RateLimiter(db_path=Path(db_path_str), host_daily_limit=200)
    return limiter.consume_reservation(reservation_id)


def _worker_ac003_release(db_path_str: str, reservation_id: str):
    limiter = RateLimiter(db_path=Path(db_path_str), host_daily_limit=200)
    return limiter.release_reservation(reservation_id)


def _worker_ac004_record_failure(db_path_str: str, ip: str, num_failures: int):
    limiter = LoginRateLimiter(db_path=Path(db_path_str), max_attempts=5, window_seconds=300)
    for _ in range(num_failures):
        limiter.record_failure(ip)
    return True


def _worker_ac004_admit_failed_login(db_path_str: str, ip: str):
    """Attempt one failed-login admission from an independent worker process."""
    limiter = LoginRateLimiter(db_path=Path(db_path_str), max_attempts=5, window_seconds=300)
    return limiter.record_failure_if_allowed(ip)


def _worker_ac004_check(db_path_str: str, ip: str):
    limiter = LoginRateLimiter(db_path=Path(db_path_str), max_attempts=5, window_seconds=300)
    return limiter.check(ip)


def _worker_ac004_record_success(db_path_str: str, ip: str):
    limiter = LoginRateLimiter(db_path=Path(db_path_str), max_attempts=5, window_seconds=300)
    limiter.record_success(ip)
    return True


# ==============================================================================
# Helper for Hermetic DB Setup
# ==============================================================================

def _setup_isolated_db(tmp_path: Path, monkeypatch) -> Path:
    db_file = tmp_path / "isolated_worker_concurrency.db"
    monkeypatch.setattr("app.core.config.settings.DB_PATH", db_file)
    from app.db.database import reset_db_state, init_db
    reset_db_state()
    init_db(force=True)
    return db_file


# ==============================================================================
# Integration Test Cases
# ==============================================================================

def test_ac001_global_200_call_ceiling_across_processes(tmp_path, monkeypatch):
    """
    AC-001: Global 200-call ceiling is shared across worker processes.
    - Two or more independent OS processes use the same SQLite DB and concurrently reserve/consume.
    - Collectively attempt > 200 units in one PT day (including a 6-unit digest reservation).
    - Expected: at most 200 units committed or actively reserved; excess attempts receive quota rejection
      with PT-midnight retry_after.
    - Must not rely on one process or threading.Lock.
    """
    db_path = _setup_isolated_db(tmp_path, monkeypatch)
    db_path_str = str(db_path)

    # 4 independent worker processes
    # Process 0: reserves 6 units for digest + attempts 60 units
    # Process 1: attempts 70 units
    # Process 2: attempts 70 units
    # Process 3: attempts 70 units
    # Total attempted units = 6 + 60 + 70 + 70 + 70 = 276 units (> 200)
    with ProcessPoolExecutor(max_workers=4) as executor:
        f0 = executor.submit(_worker_ac001_execute, db_path_str, 0, 60, 6)
        f1 = executor.submit(_worker_ac001_execute, db_path_str, 1, 70, 0)
        f2 = executor.submit(_worker_ac001_execute, db_path_str, 2, 70, 0)
        f3 = executor.submit(_worker_ac001_execute, db_path_str, 3, 70, 0)

        r0 = f0.result()
        r1 = f1.result()
        r2 = f2.result()
        r3 = f3.result()

    # Worker 0 successfully reserved 6 units
    assert r0["reservation_allowed"] is True
    assert r0["reservation_id"] is not None

    total_acquired = (
        r0["acquired_count"]
        + r1["acquired_count"]
        + r2["acquired_count"]
        + r3["acquired_count"]
    )
    total_rejected = (
        r0["rejected_count"]
        + r1["rejected_count"]
        + r2["rejected_count"]
        + r3["rejected_count"]
    )

    # Verify directly in SQLite
    conn = sqlite3.connect(db_path_str)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.execute("SELECT COUNT(*) AS c FROM quota_global_gemini_calls")
        committed_calls = cur.fetchone()["c"]

        cur = conn.execute(
            "SELECT COALESCE(SUM(units_reserved - units_consumed), 0) AS res FROM quota_reservations"
        )
        active_reserved = cur.fetchone()["res"]
    finally:
        conn.close()

    # The 6 units are actively reserved; acquired calls are committed
    assert active_reserved == 6
    assert committed_calls == total_acquired
    # Total committed + actively reserved must NEVER exceed 200
    assert committed_calls + active_reserved == 200
    assert total_acquired == 194

    # Excess attempts must be rejected
    assert total_rejected == 76
    # Any worker that experienced rejection received a valid PT-midnight retry_after
    rejection_retries = [
        r["last_retry_after"]
        for r in [r0, r1, r2, r3]
        if r["rejected_count"] > 0
    ]
    for retry in rejection_retries:
        assert retry > 0


def test_ac002_visitor_and_ip_quotas_shared_across_processes(tmp_path, monkeypatch):
    """
    AC-002: Visitor and IP quotas are shared across worker processes.
    - Two independent processes receive actions for the same session identity and IP.
    - Collectively submit 11 actions under one visitor identity and 51 under one IP in the same PT day.
    - Expected: exactly 10 visitor actions and exactly 50 IP actions admitted; excess actions rejected.
    """
    db_path = _setup_isolated_db(tmp_path, monkeypatch)
    db_path_str = str(db_path)

    # --- Part A: Visitor Daily Limit (10 actions/day) ---
    shared_identity = "session_visitor_abc123"
    with ProcessPoolExecutor(max_workers=2) as executor:
        # Worker A attempts 6 actions, Worker B attempts 5 actions (Total: 11)
        fa = executor.submit(_worker_ac002_visitor, db_path_str, 1, shared_identity, "198.51.100.1", 6)
        fb = executor.submit(_worker_ac002_visitor, db_path_str, 2, shared_identity, "198.51.100.2", 5)
        ra = fa.result()
        rb = fb.result()

    total_visitor_admitted = ra["admitted"] + rb["admitted"]
    total_visitor_rejected = ra["rejected"] + rb["rejected"]
    assert total_visitor_admitted == 10
    assert total_visitor_rejected == 1

    # Verify SQLite reflects exactly 10 rows for this identity
    conn = sqlite3.connect(db_path_str)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.execute(
            "SELECT COUNT(*) AS c FROM quota_visitor_actions WHERE identity = ?",
            (shared_identity,),
        )
        assert cur.fetchone()["c"] == 10
    finally:
        conn.close()

    # --- Part B: IP Abuse Ceiling (50 actions/day) ---
    shared_ip = "203.0.113.88"
    with ProcessPoolExecutor(max_workers=2) as executor:
        # Worker A attempts 26 actions with rotating visitor IDs
        # Worker B attempts 25 actions with rotating visitor IDs
        # Total attempted on shared IP = 51 actions (> 50)
        fa_ip = executor.submit(_worker_ac002_visitor, db_path_str, 3, "vis_a_unique", shared_ip, 26, True)
        fb_ip = executor.submit(_worker_ac002_visitor, db_path_str, 4, "vis_b_unique", shared_ip, 25, True)
        ra_ip = fa_ip.result()
        rb_ip = fb_ip.result()

    total_ip_admitted = ra_ip["admitted"] + rb_ip["admitted"]
    total_ip_rejected = ra_ip["rejected"] + rb_ip["rejected"]
    assert total_ip_admitted == 50
    assert total_ip_rejected == 1

    conn = sqlite3.connect(db_path_str)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.execute(
            "SELECT COUNT(*) AS c FROM quota_ip_actions WHERE ip = ?",
            (shared_ip,),
        )
        assert cur.fetchone()["c"] == 50
    finally:
        conn.close()


def test_ac003_fan_out_reservations_safe_and_recoverable_across_processes(tmp_path, monkeypatch):
    """
    AC-003: Fan-out reservations remain safe and recoverable across independent processes.
    - Concurrent triage (3 units) and digest (6 units) requests reserve capacity.
    - One workflow partially consumes (e.g. 2 of 3) and releases the remainder.
    - Another fails before making any call and releases 6 units.
    - A third attempts to over-consume its reservation: over-consumption is blocked.
    """
    db_path = _setup_isolated_db(tmp_path, monkeypatch)
    db_path_str = str(db_path)

    with ProcessPoolExecutor(max_workers=3) as executor:
        # Worker 1: reserves 3 units for Triage
        f1 = executor.submit(_worker_ac003_reserve, db_path_str, 3, 120)
        # Worker 2: reserves 6 units for Digest
        f2 = executor.submit(_worker_ac003_reserve, db_path_str, 6, 120)
        # Worker 3: reserves 1 unit for Run
        f3 = executor.submit(_worker_ac003_reserve, db_path_str, 1, 120)

        ok1, res1, _ = f1.result()
        ok2, res2, _ = f2.result()
        ok3, res3, _ = f3.result()

    assert ok1 and res1
    assert ok2 and res2
    assert ok3 and res3

    # Worker 1 partially consumes: consumes 2 units out of 3
    with ProcessPoolExecutor(max_workers=2) as executor:
        c1 = executor.submit(_worker_ac003_consume, db_path_str, res1)
        c2 = executor.submit(_worker_ac003_consume, db_path_str, res1)
        assert c1.result() is True
        assert c2.result() is True

    # Worker 1 releases unconsumed units (should return 1)
    with ProcessPoolExecutor(max_workers=1) as executor:
        rel1 = executor.submit(_worker_ac003_release, db_path_str, res1).result()
    assert rel1 == 1

    # Worker 2 fails before making any provider calls: releases all 6 units
    with ProcessPoolExecutor(max_workers=1) as executor:
        rel2 = executor.submit(_worker_ac003_release, db_path_str, res2).result()
    assert rel2 == 6

    # Worker 3 consumes its 1 unit
    with ProcessPoolExecutor(max_workers=1) as executor:
        consumed_ok = executor.submit(_worker_ac003_consume, db_path_str, res3).result()
        assert consumed_ok is True
        # Worker 3 attempts to over-consume (consume a 2nd time on 1-unit reservation)
        over_consume = executor.submit(_worker_ac003_consume, db_path_str, res3).result()
        assert over_consume is False

    # Verify final SQLite state:
    # Exactly 2 + 1 = 3 provider calls committed
    # 0 active lingering reservations
    conn = sqlite3.connect(db_path_str)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.execute("SELECT COUNT(*) AS c FROM quota_global_gemini_calls")
        assert cur.fetchone()["c"] == 3

        cur = conn.execute("SELECT COUNT(*) AS c FROM quota_reservations")
        assert cur.fetchone()["c"] == 0
    finally:
        conn.close()


def test_ac004_login_throttling_shared_across_processes(tmp_path, monkeypatch):
    """
    AC-004: Login throttling is shared across worker processes.
    - Failed login attempts for one client IP are split across two processes sharing the DB.
    - Submit configured number of failures (5), then next attempt during window is throttled.
    - Successful login resets the failure count for that IP.
    """
    db_path = _setup_isolated_db(tmp_path, monkeypatch)
    db_path_str = str(db_path)
    target_ip = "192.0.2.77"

    # Process 1 records 3 failed attempts
    # Process 2 records 2 failed attempts
    with ProcessPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(_worker_ac004_record_failure, db_path_str, target_ip, 3)
        f2 = executor.submit(_worker_ac004_record_failure, db_path_str, target_ip, 2)
        assert f1.result() is True
        assert f2.result() is True

    # 5 total failed attempts recorded across both workers.
    # An independent worker process checks the IP:
    with ProcessPoolExecutor(max_workers=1) as executor:
        allowed, retry_after = executor.submit(_worker_ac004_check, db_path_str, target_ip).result()

    assert allowed is False
    assert retry_after > 0
    assert retry_after <= 300

    # Process 2 records a successful login for that IP (e.g. after waiting or on correct password):
    with ProcessPoolExecutor(max_workers=1) as executor:
        executor.submit(_worker_ac004_record_success, db_path_str, target_ip).result()

    # Subsequent check from Process 1 succeeds:
    with ProcessPoolExecutor(max_workers=1) as executor:
        allowed_after_success, _ = executor.submit(_worker_ac004_check, db_path_str, target_ip).result()

    assert allowed_after_success is True


def test_ac004_failed_login_admission_is_atomic_across_processes(tmp_path, monkeypatch):
    """
    Failed-login admission must not be a check-then-record race.

    Ten concurrent invalid credential attempts against one IP may enter different
    WSGI workers. Exactly five may be admitted as ordinary failures; every later
    attempt must be rejected by the same transaction that observes the count.
    """
    db_path = _setup_isolated_db(tmp_path, monkeypatch)
    db_path_str = str(db_path)
    target_ip = "192.0.2.201"

    with ProcessPoolExecutor(max_workers=10) as executor:
        results = list(
            executor.map(
                _worker_ac004_admit_failed_login,
                [db_path_str] * 10,
                [target_ip] * 10,
            )
        )

    admitted = sum(1 for allowed, _ in results if allowed)
    rejected_retry_after = [retry_after for allowed, retry_after in results if not allowed]
    assert admitted == 5
    assert len(rejected_retry_after) == 5
    assert all(retry_after > 0 for retry_after in rejected_retry_after)

    conn = sqlite3.connect(db_path_str)
    try:
        stored_failures = conn.execute(
            "SELECT COUNT(*) FROM login_failures WHERE ip = ?", (target_ip,)
        ).fetchone()[0]
    finally:
        conn.close()
    assert stored_failures == 5
