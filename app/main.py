"""
Marketing OS v2.0 Application Server Entrypoint (Enterprise Hardened)
"""

import hmac
import os
from typing import Optional
from flask import Flask, request, jsonify, send_from_directory, Response, g
from flask_cors import CORS
from app.core.config import settings
from app.core.primitives import new_id
from app.core.security import (
    validate_prompt,
    PayloadTooLargeError,
    PromptInjectionError,
    MAX_PAYLOAD_BYTES,
)
from app.core.rate_limiter import rate_limiter
from app.agents.base import AGENT_REGISTRY
from app.graph.workflow import swarm_engine
from app.graph.chat import run_chat
from app.graph.triage import run_triage
from app.graph.digest import run_digest, build_network
from app.memory import store
from app.db.database import get_all_decisions, init_db, get_connection
from app.memory.graph import rebuild_corpus_graph

init_db()
# Deterministic and idempotent, so re-deriving on every boot keeps the graph in step with
# the corpus without a migration step. Cheap: one pass over ~94 sourced rows.
rebuild_corpus_graph()

FRONTEND_DIST = settings.BASE_DIR / "frontend" / "dist"
app = Flask(__name__, static_folder=str(FRONTEND_DIST), static_url_path="")
# Lower payload boundary from 16MB to 64KB
app.config["MAX_CONTENT_LENGTH"] = MAX_PAYLOAD_BYTES  # 64 KB max payload limit
CORS(app, supports_credentials=True)

# Single shared session token; timing-safe verification via hmac.compare_digest
SESSION_COOKIE = "auth_session"
SESSION_TOKEN = "authenticated_admin"
_OPEN_API_PATHS = {"/api/health", "/api/login", "/api/logout", "/api/me"}


def _safe_digest_compare(a: Optional[str], b: Optional[str]) -> bool:
    """Timing-safe string comparison that encodes to UTF-8 to prevent non-ASCII string TypeError crashes."""
    if not isinstance(a, str) or not isinstance(b, str):
        return False
    return hmac.compare_digest(a.encode("utf-8"), b.encode("utf-8"))


def _is_authed() -> bool:
    """Timing-safe session cookie verification to prevent side-channel timing attacks."""
    cookie_val = request.cookies.get(SESSION_COOKIE) or ""
    return _safe_digest_compare(cookie_val, SESSION_TOKEN)


def _get_client_context():
    """Extract client IP and optional BYOK X-API-Key header."""
    client_ip = (
        request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1")
        .split(",")[0]
        .strip()
    )
    api_key = request.headers.get("X-API-Key")
    return client_ip, api_key


@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        "error": "Payload exceeds 64KB limit",
        "message": "Payload too large",
    }), 413


@app.before_request
def _before_request():
    g.request_id = new_id()
    path = request.path
    if path.startswith("/api/") and path not in _OPEN_API_PATHS and not _is_authed():
        return jsonify({"error": "Authentication required"}), 401


@app.route("/api/me", methods=["GET"])
def api_me():
    if _is_authed():
        return jsonify({"authenticated": True, "username": settings.ADMIN_USER})
    return jsonify({"authenticated": False})


@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    user = (data.get("username") or "").strip()
    pwd = (data.get("password") or "").strip()
    # Timing-safe comparison on admin username and password (resilient to non-ASCII strings)
    if _safe_digest_compare(user.lower(), settings.ADMIN_USER.lower()) and _safe_digest_compare(
        pwd, settings.ADMIN_PASSWORD
    ):
        resp = jsonify({"success": True, "username": settings.ADMIN_USER})
        resp.set_cookie(SESSION_COOKIE, SESSION_TOKEN, max_age=86400, httponly=True, samesite="Lax")
        return resp
    return jsonify({"error": "Invalid credentials"}), 401


@app.route("/api/logout", methods=["POST"])
def api_logout():
    resp = jsonify({"success": True})
    resp.delete_cookie(SESSION_COOKIE)
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
    data = request.get_json() or {}
    goal = (data.get("goal") or "").strip()
    provider = (data.get("provider") or "gemini-3.8-flash").strip()
    agent_type = (data.get("agent_type") or "branding").strip()
    client_ip, byok_key = _get_client_context()
    api_key = byok_key or data.get("api_key")

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

    try:
        res = swarm_engine.run(
            goal_statement=goal,
            agent_type=agent_type,
            provider=provider,
            api_key=api_key,
            client_ip=client_ip,
        )
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/history", methods=["GET"])
def api_history():
    limit_arg = request.args.get("limit")
    offset_arg = request.args.get("offset", "0")
    limit = int(limit_arg) if limit_arg and limit_arg.isdigit() else None
    offset = int(offset_arg) if offset_arg and offset_arg.isdigit() else 0
    return jsonify({"success": True, "history": get_all_decisions(limit=limit, offset=offset)})


@app.route("/api/export/markdown", methods=["POST"])
def api_export_markdown():
    d = request.get_json() or {}
    decision = d.get("decision", {})
    positioning = d.get("positioning", {})
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
    filename = f"positioning-brief-{decision.get('id', 'export')}.md"
    return Response(
        md,
        mimetype="text/markdown",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.route("/api/digest/network", methods=["GET"])
def api_digest_network():
    return jsonify({"success": True, **build_network()})


@app.route("/api/digest", methods=["POST"])
def api_digest():
    data = request.get_json(silent=True) or {}
    provider = (data.get("provider") or "gemini-3.8-flash").strip()
    client_ip, byok_key = _get_client_context()
    api_key = byok_key or data.get("api_key")
    try:
        return jsonify(run_digest(provider=provider, api_key=api_key, client_ip=client_ip))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/chat", methods=["POST"])
def api_chat():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    provider = (data.get("provider") or "gemini-3.8-flash").strip()
    agent_type = (data.get("agent") or "branding").strip()
    thread_id = data.get("thread_id") or None
    client_ip, byok_key = _get_client_context()
    api_key = byok_key or data.get("api_key")

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

    try:
        return jsonify(
            run_chat(
                agent_type=agent_type,
                message=message,
                thread_id=thread_id,
                provider=provider,
                api_key=api_key,
                client_ip=client_ip,
            )
        )
    except ValueError as e:  # unknown agent / unknown thread / empty message
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    agents = data.get("agents") or []
    provider = (data.get("provider") or "gemini-3.8-flash").strip()
    thread_id = data.get("thread_id") or None
    client_ip, byok_key = _get_client_context()
    api_key = byok_key or data.get("api_key")

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

    try:
        return jsonify(
            run_triage(
                agents=agents,
                message=message,
                thread_id=thread_id,
                provider=provider,
                api_key=api_key,
                client_ip=client_ip,
            )
        )
    except ValueError as e:  # bad pair / unknown agent / empty message / wrong thread
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and (FRONTEND_DIST / path).exists():
        return send_from_directory(str(FRONTEND_DIST), path)
    if (FRONTEND_DIST / "index.html").exists():
        return send_from_directory(str(FRONTEND_DIST), "index.html")
    return "Marketing OS v2.0 Server Running. Build frontend with 'npm run build' inside frontend/."


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
