"""
Unit Tests for Sliding-Window Rate Limiter & Abuse Defense
"""

import time
import pytest
from app.core.rate_limiter import RateLimiter, rate_limiter


def test_ip_burst_limit():
    limiter = RateLimiter(host_daily_limit=200, ip_daily_limit=10, ip_burst_limit=3, burst_window_seconds=60)
    ip = "192.168.1.100"

    # First 3 requests within a minute must succeed
    r1 = limiter.acquire(ip)
    assert r1.allowed is True
    r2 = limiter.acquire(ip)
    assert r2.allowed is True
    r3 = limiter.acquire(ip)
    assert r3.allowed is True

    # 4th burst request in the same minute must breach burst limit
    r4 = limiter.acquire(ip)
    assert r4.allowed is False
    assert r4.notice == "Quota reached"
    assert r4.limit_type == "ip_burst"
    assert r4.retry_after > 0


def test_ip_daily_limit():
    limiter = RateLimiter(host_daily_limit=200, ip_daily_limit=10, ip_burst_limit=20, day_window_seconds=86400)
    ip = "192.168.1.101"

    # Consume 10 requests
    for _ in range(10):
        res = limiter.acquire(ip)
        assert res.allowed is True

    # 11th request must fail with daily IP quota
    r11 = limiter.acquire(ip)
    assert r11.allowed is False
    assert r11.notice == "Quota reached"
    assert r11.limit_type == "ip_daily"
    assert r11.retry_after > 0


def test_host_wide_shared_key_ceiling():
    limiter = RateLimiter(host_daily_limit=5, ip_daily_limit=100, ip_burst_limit=100, day_window_seconds=86400)

    # 5 different IPs consume the shared host key
    for i in range(5):
        res = limiter.acquire(f"10.0.0.{i}", is_byok=False)
        assert res.allowed is True

    # 6th request from another IP on shared key breaches host ceiling
    r6 = limiter.acquire("10.0.0.99", is_byok=False)
    assert r6.allowed is False
    assert r6.notice == "Quota reached"
    assert r6.limit_type == "host_daily"
    assert r6.retry_after > 0


def test_byok_bypasses_host_ceiling():
    limiter = RateLimiter(host_daily_limit=2, ip_daily_limit=100, ip_burst_limit=100, day_window_seconds=86400)

    # Exhaust the 2-request host ceiling
    assert limiter.acquire("10.0.0.1", is_byok=False).allowed is True
    assert limiter.acquire("10.0.0.2", is_byok=False).allowed is True
    # Shared key is now blocked
    assert limiter.acquire("10.0.0.3", is_byok=False).allowed is False

    # A visitor bringing their own API key (BYOK) must bypass the host cap!
    byok_res = limiter.acquire("10.0.0.3", is_byok=True)
    assert byok_res.allowed is True


def test_burst_window_reset():
    limiter = RateLimiter(host_daily_limit=200, ip_daily_limit=10, ip_burst_limit=2, burst_window_seconds=2)
    ip = "192.168.1.102"
    t0 = 1000.0

    assert limiter.acquire(ip, now=t0).allowed is True
    assert limiter.acquire(ip, now=t0 + 0.5).allowed is True
    # Exceeded burst limit
    assert limiter.acquire(ip, now=t0 + 1.0).allowed is False

    # After burst window (2s) expires, new requests are allowed
    assert limiter.acquire(ip, now=t0 + 2.5).allowed is True


def test_rate_limiter_reset():
    limiter = RateLimiter(host_daily_limit=1, ip_daily_limit=1, ip_burst_limit=1)
    ip = "1.2.3.4"

    assert limiter.acquire(ip).allowed is True
    assert limiter.acquire(ip).allowed is False

    limiter.reset()
    assert limiter.acquire(ip).allowed is True


def test_make_429_response(app_context=None):
    from flask import Flask
    app = Flask(__name__)
    with app.app_context():
        resp, code = RateLimiter.make_429_response(retry_after=15, message="Custom limit reached")
        assert code == 429
        assert resp.status_code == 429
        assert resp.headers.get("Retry-After") == "15"
        json_data = resp.get_json()
        assert json_data["error"] == "rate_limit_exceeded"
        assert json_data["notice"] == "Quota reached"
        assert json_data["retry_after"] == 15


def test_multi_agent_pipeline_request_id_does_not_self_throttle():
    """Verify that multiple agent calls (e.g. 5 agents in /api/digest) within ONE user request ID
    do not trigger the 3-requests/minute burst limit for that IP."""
    limiter = RateLimiter(host_daily_limit=200, ip_daily_limit=10, ip_burst_limit=3, burst_window_seconds=60)
    ip = "192.168.1.103"
    req_id = "user_request_001"

    # 5 agent sub-calls for the same user request
    for agent_idx in range(5):
        res = limiter.acquire(ip, is_byok=False, request_id=req_id)
        assert res.allowed is True, f"Agent {agent_idx} was throttled within same user request!"

    # A 2nd user request from the same IP succeeds (burst count = 2)
    res2 = limiter.acquire(ip, is_byok=False, request_id="user_request_002")
    assert res2.allowed is True

    # A 3rd user request succeeds (burst count = 3)
    res3 = limiter.acquire(ip, is_byok=False, request_id="user_request_003")
    assert res3.allowed is True

    # A 4th user request exceeds the burst limit
    res4 = limiter.acquire(ip, is_byok=False, request_id="user_request_004")
    assert res4.allowed is False
    assert res4.limit_type == "ip_burst"
