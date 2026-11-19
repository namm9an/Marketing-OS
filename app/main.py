"""
Marketing OS v2.0 Application Server Entrypoint (Enterprise Hardened)
"""

import hmac
import hashlib
import ipaddress
import json
import os
import re
from typing import Iterable, Optional
from flask import Flask, request, jsonify, send_from_directory, Response, g
from flask_cors import CORS
from pydantic import ValidationError
from werkzeug.middleware.proxy_fix import ProxyFix
from app.core.config import settings
from app.core.primitives import new_id
from app.core.schemas import (
    RunRequestSchema, ChatRequestSchema, TriageRequestSchema,
    LoginRequestSchema, DigestRequestSchema, DecisionReviewRequestSchema, ExportRequestSchema,
)
from app.core.exceptions import (
    GlobalQuotaExhaustedError,
    UpstreamRateLimitError,
    UpstreamProviderError,
    PersistenceError,
)
from app.core.security import (
    validate_prompt,
    PayloadTooLargeError,
    PromptInjectionError,
    MAX_PAYLOAD_BYTES,
    session_store,
    login_rate_limiter,
)
from app.core.rate_limiter import rate_limiter, RateLimiter
from app.agents.base import AGENT_REGISTRY
from app.graph.workflow import swarm_engine
from app.graph.chat import run_chat
from app.graph.triage import run_triage
from app.graph.digest import run_digest, build_network
from app.memory import store
from app.db.database import get_all_decisions, get_decision, review_decision, get_connection
from app.db.grounded_seed import seed_grounded_knowledge
from app.memory.graph import rebuild_corpus_graph

seed_grounded_knowledge(only_if_empty=True)

# Deterministic and idempotent, so re-deriving on every boot keeps the graph in step with
# the corpus without a migration step. Cheap: one pass over ~94 sourced rows.
rebuild_corpus_graph()


class TrustedProxyFix:
    """Apply forwarded headers only when the immediate socket peer is trusted."""

    def __init__(self, app, trusted_proxies: Iterable[str], num_proxies: int = 1):
        self.app = app
        self._trusted_networks = tuple(self._parse_network(proxy) for proxy in trusted_proxies)
        self._proxy_fix = ProxyFix(
            app,
            x_for=num_proxies,
            x_proto=num_proxies,
            x_host=num_proxies,
        )

    @staticmethod
    def _parse_network(value: str):
        normalized = str(value).strip()
        if "/" in normalized:
            return ipaddress.ip_network(normalized, strict=False)
        address = ipaddress.ip_address(normalized)
        suffix = 32 if address.version == 4 else 128
        return ipaddress.ip_network(f"{address}/{suffix}", strict=False)

    def _is_trusted_peer(self, peer: Optional[str]) -> bool:
        try:
            address = ipaddress.ip_address(peer or "")
        except ValueError:
            return False
        if address.version == 6 and address.ipv4_mapped is not None:
            address = address.ipv4_mapped
        return any(address in network for network in self._trusted_networks)

    def __call__(self, environ, start_response):
        if self._is_trusted_peer(environ.get("REMOTE_ADDR")):
            return self._proxy_fix(environ, start_response)
        return self.app(environ, start_response)

FRONTEND_DIST = settings.BASE_DIR / "frontend" / "dist"
app = Flask(__name__, static_folder=str(FRONTEND_DIST), static_url_path="")
# Lower payload boundary from 16MB to 64KB
app.config["MAX_CONTENT_LENGTH"] = MAX_PAYLOAD_BYTES  # 64 KB max payload limit
CORS(app, origins=settings.get_allowed_origins(), supports_credentials=True)

# Reverse proxy support is enabled only for explicitly trusted socket peers.
if settings.TRUST_FORWARDED_FOR:
    app.wsgi_app = TrustedProxyFix(
        app.wsgi_app,
        trusted_proxies=settings.TRUSTED_PROXIES,
        num_proxies=settings.NUM_PROXIES,
    )

# Cryptographically random, expiring, revocable session token in browser cookie
SESSION_COOKIE = "auth_session"
_OPEN_API_PATHS = {"/api/health", "/api/login", "/api/logout", "/api/me"}


class RequestValidationError(ValueError):
    pass


def _request_data(schema):
    try:
        data = request.get_json(silent=True)
    except (RecursionError, UnicodeError):
        raise RequestValidationError("Invalid JSON encoding or nesting") from None
    if data is None and not request.get_data():
        data = {}
    if not isinstance(data, dict):
        raise RequestValidationError("Expected a JSON object")
    try:
        # Reject unpaired surrogate escapes before DB/provider encoding. Preserve
        # ordinary multilingual text and valid emoji; do not homoglyph-fold auth.
        json.dumps(data, ensure_ascii=False).encode("utf-8")
    except (UnicodeError, RecursionError):
        raise RequestValidationError("Invalid JSON encoding or nesting") from None
    try:
        return schema.model_validate(data).model_dump()
    except ValidationError:
        # Do not echo submitted passwords, provider keys or arbitrary payload values.
        raise RequestValidationError("Request fields do not satisfy the API contract") from None


@app.errorhandler(RequestValidationError)
def invalid_request(error):
    return jsonify({"error": "invalid_request", "message": str(error)}), 400


def _safe_digest_compare(a: Optional[str], b: Optional[str]) -> bool:
    """Timing-safe string comparison that encodes to UTF-8 to prevent non-ASCII string TypeError crashes."""
    if not isinstance(a, str) or not isinstance(b, str):
        return False
    try:
        return hmac.compare_digest(
            hashlib.sha256(a.encode("utf-8")).digest(),
            hashlib.sha256(b.encode("utf-8")).digest(),
        )
    except UnicodeError:
        return False


def _is_authed() -> bool:
    """Validate server-side session from opaque cookie."""
    cookie_val = request.cookies.get(SESSION_COOKIE) or ""
    session_data = session_store.validate_session(cookie_val)
    if session_data is not None:
        g.current_user = session_data.get("username", settings.ADMIN_USER)
        g.session_token = cookie_val
        return True
    return False


def _get_client_context():
    """Return the peer address after trusted-only proxy normalization, if configured."""
    return request.remote_addr or "127.0.0.1", None


def _enforce_quotas(fan_out: int = 1):
    """
    Check visitor-action quota and global Gemini capacity before performing LLM work.
    Returns HTTP 429 response tuple if quota is exceeded, else None.
    Identity semantics: Tracks quota per browser session as a best-effort visitor identity.
    The shared admin login does NOT conflate visitor identities. Client IP acts as a higher
    abuse ceiling (settings.IP_DAILY_LIMIT, default 50/day).
    """
    client_ip, _ = _get_client_context()
    session_id = getattr(g, "session_token", None) or request.cookies.get(SESSION_COOKIE)
    # Per-session visitor identity (best-effort); fall back to client IP for anonymous requests
    identity = f"session:{session_id}" if session_id else f"ip:{client_ip}"

    # 1. Global Gemini Capacity Reservation:
    # Atomically reserve fan-out quota (held during execution; unused units released in finally block)
    has_cap, res_id, retry_after = rate_limiter.reserve_capacity(fan_out)
    if not has_cap:
        return RateLimiter.make_429_response(
            retry_after,
            message=f"Insufficient global daily Gemini API quota remaining for workflow (needs {fan_out} calls)",
        )
    g.quota_reservation_id = res_id

    # 2. Visitor Action Quota: 10 frontend AI actions/day per visitor identity PLUS IP abuse ceiling
    v_res = rate_limiter.acquire_visitor_action(identity, client_ip=client_ip)
    if not v_res.allowed:
        if hasattr(g, "quota_reservation_id"):
            rate_limiter.release_reservation(g.quota_reservation_id)
        msg = (
            "Daily visitor AI action limit reached (10 actions/day)"
            if v_res.limit_type == "visitor_action"
            else "Daily IP address action limit reached (abuse ceiling)"
        )
        return RateLimiter.make_429_response(v_res.retry_after, message=msg)

    return None


@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        "error": "Payload exceeds 64KB limit",
        "message": "Payload too large",
    }), 413


@app.errorhandler(PersistenceError)
def persistence_unavailable(error):
    return jsonify({"error": "persistence_unavailable", "message": "Could not store the result. Please try again later."}), 503


@app.errorhandler(UpstreamRateLimitError)
def handle_upstream_rate_limit(error: UpstreamRateLimitError):
    return RateLimiter.make_429_response(
        error.retry_after,
        message="Upstream AI provider rate limit reached. Please try again later.",
    )


@app.errorhandler(GlobalQuotaExhaustedError)
def handle_global_quota_exhausted(error: GlobalQuotaExhaustedError):
    return RateLimiter.make_429_response(
        error.retry_after,
        message=str(error),
    )


@app.errorhandler(UpstreamProviderError)
def handle_upstream_provider(error: UpstreamProviderError):
    return jsonify({
        "error": "upstream_provider_error",
        "message": "Upstream AI provider unavailable. Please try again later.",
    }), error.status_code or 502


@app.before_request
def _before_request():
    g.request_id = new_id()
    path = request.path
    if path.startswith("/api/") and request.method not in {"GET", "HEAD", "OPTIONS"}:
        origin = request.headers.get("Origin")
        allowed = set(settings.get_allowed_origins()) | {request.host_url.rstrip("/")}
        if (origin is not None and origin not in allowed) or (
            origin is None and request.headers.get("Sec-Fetch-Site") == "cross-site"
        ):
            return jsonify({"error": "origin_not_allowed"}), 403
    if path.startswith("/api/") and path not in _OPEN_API_PATHS and not _is_authed():
        return jsonify({"error": "Authentication required"}), 401


@app.after_request
def _response_boundaries(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    if request.path.startswith("/api/"):
        # Includes authentication errors, exports and health; never let shared
        # caches replay another browser's session/decision response.
        response.headers["Cache-Control"] = "no-store, private"
        response.vary.add("Cookie")
    return response


@app.route("/api/me", methods=["GET"])
def api_me():
    if _is_authed():
        username = getattr(g, "current_user", settings.ADMIN_USER)
        return jsonify({"authenticated": True, "username": username})
    return jsonify({"authenticated": False})


@app.route("/api/login", methods=["POST"])
def api_login():
    client_ip, _ = _get_client_context()
    allowed, retry_after = login_rate_limiter.check(client_ip)
    if not allowed:
        resp, code = RateLimiter.make_429_response(
            retry_after, message="Too many failed login attempts. Please try again later."
        )
        return resp, code

    data = _request_data(LoginRequestSchema)
    user = (data.get("username") or "").strip()
    pwd = data.get("password") or ""

    # Timing-safe comparison on admin username and password (resilient to non-ASCII strings)
    user_matches = _safe_digest_compare(user.lower(), settings.ADMIN_USER.lower())
    password_matches = _safe_digest_compare(pwd, settings.ADMIN_PASSWORD)
    if user_matches & password_matches:
        login_rate_limiter.record_success(client_ip)
        token = session_store.create_session(settings.ADMIN_USER)
        resp = jsonify({"success": True, "username": settings.ADMIN_USER})
        resp.set_cookie(
            SESSION_COOKIE,
            token,
            max_age=86400,
            httponly=True,
            samesite="Lax",
            secure=settings.SESSION_COOKIE_SECURE,
        )
        return resp

    admitted, retry_after = login_rate_limiter.record_failure_if_allowed(client_ip)
    if not admitted:
        resp, code = RateLimiter.make_429_response(
            retry_after, message="Too many failed login attempts. Please try again later."
        )
        return resp, code
    return jsonify({"error": "Invalid credentials"}), 401


@app.route("/api/logout", methods=["POST"])
def api_logout():
    cookie_val = request.cookies.get(SESSION_COOKIE)
    if cookie_val:
        session_store.revoke_session(cookie_val)
    resp = jsonify({"success": True})
    resp.delete_cookie(
        SESSION_COOKIE,
        httponly=True,
        samesite="Lax",
        secure=settings.SESSION_COOKIE_SECURE,
    )
    return resp


@app.route("/api/health", methods=["GET"])
def health():
    db_status = "connected"
    try:
        conn = get_connection()
        conn.execute("SELECT 1")
        conn.close()
    except Exception as e:
        db_status = f"unhealthy: {e}"
    return jsonify({
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "version": settings.VERSION,
        "project": settings.PROJECT_NAME,
    })


@app.route("/api/run", methods=["POST"])
def api_run():
    data = _request_data(RunRequestSchema)
    goal = (data.get("goal") or "").strip()
    agent_type = (data.get("agent_type") or "branding").strip()
    provider = settings.DEFAULT_MODEL
    client_ip, _ = _get_client_context()

    if not goal:
        return jsonify({"error": "Goal statement is required"}), 400

    try:
        goal = validate_prompt(goal)
    except PayloadTooLargeError as e:
        return jsonify({"error": str(e)}), 413
    except PromptInjectionError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    # Quota check before database writes or LLM invocation
    quota_err = _enforce_quotas(fan_out=1)
    if quota_err:
        return quota_err

    try:
        res = swarm_engine.run(
            goal_statement=goal,
            agent_type=agent_type,
            provider=provider,
            client_ip=client_ip,
        )
        return jsonify(res)
    except (UpstreamRateLimitError, GlobalQuotaExhaustedError) as e:
        return RateLimiter.make_429_response(e.retry_after, message=str(e))
    except UpstreamProviderError as e:
        return jsonify({"error": "upstream_provider_error", "message": "Upstream AI provider error. Please try again later."}), e.status_code or 502
    except PersistenceError:
        raise
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        res_id = getattr(g, "quota_reservation_id", None)
        if res_id:
            rate_limiter.release_reservation(res_id)


@app.route("/api/history", methods=["GET"])
def api_history():
    limit_arg = request.args.get("limit")
    offset_arg = request.args.get("offset", "0")
    limit = int(limit_arg) if limit_arg and limit_arg.isdigit() else None
    offset = int(offset_arg) if offset_arg and offset_arg.isdigit() else 0
    return jsonify({"success": True, "history": get_all_decisions(limit=limit, offset=offset)})


@app.route("/api/decisions/<decision_id>", methods=["GET"])
def api_decision_detail(decision_id):
    decision = get_decision(decision_id)
    if decision is None:
        return jsonify({"error": "unknown decision"}), 404
    return jsonify({"success": True, "decision": decision})


@app.route("/api/decisions/<decision_id>/review", methods=["POST"])
def api_decision_review(decision_id):
    data = _request_data(DecisionReviewRequestSchema)
    reason = data["reason"]
    if not review_decision(decision_id, data["status"], g.current_user, reason):
        return jsonify({"error": "unknown decision"}), 404
    return jsonify({"success": True, "decision": get_decision(decision_id)})


@app.route("/api/export/markdown", methods=["POST"])
def api_export_markdown():
    d = _request_data(ExportRequestSchema)
    decision = d.get("decision") if isinstance(d.get("decision"), dict) else {}
    positioning = d.get("positioning") if isinstance(d.get("positioning"), dict) else {}
    md = (
        f"# Positioning Strategy Brief\n\n"
        f"**Strategy:** {decision.get('selected_option', 'N/A')}\n"
        f"**Confidence:** {decision.get('confidence', 'N/A')}\n"
        f"**Escalated to CMO:** {decision.get('escalated', False)}\n\n"
        f"## Business Goal\n{d.get('goalStatement', '')}\n\n"
        f"## Positioning Statement\n{positioning.get('statement', '')}\n\n"
        f"## Strategic Rationale\n{decision.get('rationale', '')}\n\n"
        f"## Identified Risks\n{decision.get('risks', '')}\n"
    )
    raw_id = str(decision.get("id") or d.get("id") or "export")
    # Sanitize ID against CRLF injection and hostile header characters
    safe_id = re.sub(r"[^a-zA-Z0-9_-]", "_", raw_id).strip("_") or "export"
    filename = f"positioning-brief-{safe_id}.md"
    return Response(
        md,
        mimetype="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.route("/api/digest/network", methods=["GET"])
def api_digest_network():
    return jsonify({"success": True, **build_network()})


@app.route("/api/digest", methods=["POST"])
def api_digest():
    _request_data(DigestRequestSchema)
    provider = settings.DEFAULT_MODEL
    client_ip, _ = _get_client_context()

    # Quota check before database reads or LLM invocation (digest fan-out = 6)
    quota_err = _enforce_quotas(fan_out=6)
    if quota_err:
        return quota_err

    try:
        return jsonify(run_digest(provider=provider, client_ip=client_ip))
    except (UpstreamRateLimitError, GlobalQuotaExhaustedError) as e:
        return RateLimiter.make_429_response(e.retry_after, message=str(e))
    except UpstreamProviderError as e:
        return jsonify({"error": "upstream_provider_error", "message": "Upstream AI provider error. Please try again later."}), e.status_code or 502
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        res_id = getattr(g, "quota_reservation_id", None)
        if res_id:
            rate_limiter.release_reservation(res_id)


@app.route("/api/chat", methods=["POST"])
def api_chat():
    data = _request_data(ChatRequestSchema)
    message = (data.get("message") or "").strip()
    provider = settings.DEFAULT_MODEL
    agent_type = (data.get("agent") or "branding").strip()
    thread_id = data.get("thread_id") or None
    client_ip, _ = _get_client_context()

    if not message:
        return jsonify({"error": "message is required"}), 400

    try:
        message = validate_prompt(message)
    except PayloadTooLargeError as e:
        return jsonify({"error": str(e)}), 413
    except PromptInjectionError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    # Quota check before database writes or LLM invocation
    quota_err = _enforce_quotas(fan_out=1)
    if quota_err:
        return quota_err

    try:
        return jsonify(
            run_chat(
                agent_type=agent_type,
                message=message,
                thread_id=thread_id,
                provider=provider,
                client_ip=client_ip,
            )
        )
    except (UpstreamRateLimitError, GlobalQuotaExhaustedError) as e:
        return RateLimiter.make_429_response(e.retry_after, message=str(e))
    except UpstreamProviderError as e:
        return jsonify({"error": "upstream_provider_error", "message": "Upstream AI provider error. Please try again later."}), e.status_code or 502
    except PersistenceError:
        raise
    except ValueError as e:  # unknown agent / unknown thread / empty message
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        res_id = getattr(g, "quota_reservation_id", None)
        if res_id:
            rate_limiter.release_reservation(res_id)


def _namespace_from_args():
    pair = (request.args.get("agents") or "").strip()
    if pair:
        members = [a.strip() for a in pair.split(",") if a.strip()]
        if len(members) != 2 or members[0] == members[1]:
            raise ValueError("agents must name exactly two different agents")
        for a in members:
            if a not in AGENT_REGISTRY:
                raise ValueError(f"unknown agent: {a}")
        return store.triage_ns(*members)

    agent = (request.args.get("agent") or "branding").strip()
    if agent not in AGENT_REGISTRY:
        raise ValueError(f"unknown agent: {agent}")
    return store.agent_ns(agent)


@app.route("/api/chat/threads", methods=["GET"])
def api_chat_threads():
    try:
        namespace = _namespace_from_args()
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({
        "success": True,
        "namespace": namespace,
        "threads": store.list_threads(namespace),
    })


@app.route("/api/chat/thread/<thread_id>", methods=["GET"])
def api_chat_thread(thread_id):
    thread = store.get_thread(thread_id)
    if thread is None:
        return jsonify({"error": "unknown thread"}), 404
    return jsonify({"success": True, "thread": thread, "turns": store.get_turns(thread_id)})


@app.route("/api/memory", methods=["GET"])
def api_memory():
    try:
        namespace = _namespace_from_args()
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({
        "success": True,
        "namespace": namespace,
        "memories": store.list_memories(namespace),
    })


@app.route("/api/triage", methods=["POST"])
def api_triage():
    data = _request_data(TriageRequestSchema)
    message = (data.get("message") or "").strip()
    agents = data.get("agents") or []
    provider = settings.DEFAULT_MODEL
    thread_id = data.get("thread_id") or None
    client_ip, _ = _get_client_context()

    if not message:
        return jsonify({"error": "message is required"}), 400

    try:
        message = validate_prompt(message)
    except PayloadTooLargeError as e:
        return jsonify({"error": str(e)}), 413
    except PromptInjectionError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    # Quota check before database writes or LLM invocation (triage fan-out = 3)
    quota_err = _enforce_quotas(fan_out=3)
    if quota_err:
        return quota_err

    try:
        return jsonify(
            run_triage(
                agents=agents,
                message=message,
                thread_id=thread_id,
                provider=provider,
                client_ip=client_ip,
            )
        )
    except (UpstreamRateLimitError, GlobalQuotaExhaustedError) as e:
        return RateLimiter.make_429_response(e.retry_after, message=str(e))
    except UpstreamProviderError as e:
        return jsonify({"error": "upstream_provider_error", "message": "Upstream AI provider error. Please try again later."}), e.status_code or 502
    except PersistenceError:
        raise
    except ValueError as e:  # bad pair / unknown agent / empty message / wrong thread
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        res_id = getattr(g, "quota_reservation_id", None)
        if res_id:
            rate_limiter.release_reservation(res_id)


@app.route("/")
@app.route("/console", strict_slashes=False)
@app.route("/console/<path:route>")
def serve_spa(route=""):
    if (FRONTEND_DIST / "index.html").is_file():
        return send_from_directory(str(FRONTEND_DIST), "index.html")
    return "Marketing OS v2.0 Server Running. Build frontend with 'npm run build' inside frontend/."


@app.errorhandler(404)
def serve_not_found(error):
    # Render the client fallback only for browser document requests.
    path = request.path.strip("/")
    if (
        request.method not in {"GET", "HEAD"}
        or path.partition("/")[0] in {"api", "assets", "examples", "showcase"}
        or "." in path.rpartition("/")[2]
        or not (FRONTEND_DIST / "index.html").is_file()
    ):
        return error

    is_document = any(media == "text/html" and quality > 0 for media, quality in request.accept_mimetypes)
    if is_document:
        response = send_from_directory(str(FRONTEND_DIST), "index.html", conditional=False)
        response.status_code = 404
    else:
        response = error.get_response()
    response.vary.add("Accept")
    return response


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)
