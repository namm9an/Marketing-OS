"""Regression tests for forwarded-IP trust boundaries."""

from app.core.config import Settings


def _call_wsgi(app, remote_addr: str, forwarded_for: str) -> str:
    def start_response(status, headers):
        return None

    environ = {
        "REQUEST_METHOD": "GET",
        "SCRIPT_NAME": "",
        "PATH_INFO": "/",
        "QUERY_STRING": "",
        "SERVER_NAME": "localhost",
        "SERVER_PORT": "5000",
        "SERVER_PROTOCOL": "HTTP/1.1",
        "wsgi.version": (1, 0),
        "wsgi.url_scheme": "http",
        "wsgi.input": None,
        "wsgi.errors": None,
        "wsgi.multithread": False,
        "wsgi.multiprocess": False,
        "wsgi.run_once": False,
        "REMOTE_ADDR": remote_addr,
        "HTTP_X_FORWARDED_FOR": forwarded_for,
    }
    list(app(environ, start_response))
    return _capture_remote_addr.observed


def _capture_remote_addr(environ, start_response):
    start_response("200 OK", [])
    _capture_remote_addr.observed = environ["REMOTE_ADDR"]
    return [b"ok"]


def test_forwarded_ip_is_applied_only_when_socket_peer_is_trusted():
    """An internet client cannot spoof its IP merely by adding X-Forwarded-For."""
    from app.main import TrustedProxyFix

    proxy = TrustedProxyFix(
        _capture_remote_addr,
        trusted_proxies={"127.0.0.1"},
        num_proxies=1,
    )

    _call_wsgi(proxy, remote_addr="198.51.100.44", forwarded_for="203.0.113.10")
    assert _capture_remote_addr.observed == "198.51.100.44"

    _call_wsgi(proxy, remote_addr="127.0.0.1", forwarded_for="203.0.113.10")
    assert _capture_remote_addr.observed == "203.0.113.10"


def test_forwarded_header_mode_requires_explicit_trusted_proxy_configuration():
    """Production cannot enable forwarded headers without naming a trusted peer."""
    import pytest

    with pytest.raises(ValueError, match="TRUSTED_PROXIES"):
        Settings(
            ENVIRONMENT="production",
            ADMIN_PASSWORD="StrongProductionSecret999!",
            SESSION_COOKIE_SECURE=True,
            TRUST_FORWARDED_FOR=True,
            TRUSTED_PROXIES=[],
        )

    settings = Settings(
        ENVIRONMENT="production",
        ADMIN_PASSWORD="StrongProductionSecret999!",
        SESSION_COOKIE_SECURE=True,
        TRUST_FORWARDED_FOR=True,
        TRUSTED_PROXIES=["127.0.0.1"],
    )
    assert settings.TRUSTED_PROXIES == ["127.0.0.1"]
