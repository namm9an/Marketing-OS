"""
Marketing OS v2.0 Application Server Entrypoint
"""

import os
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
from app.core.config import settings
from app.agents.base import AGENT_REGISTRY
from app.graph.workflow import swarm_engine
from app.graph.chat import run_chat
from app.graph.triage import run_triage
from app.graph.digest import run_digest, build_network
from app.memory import store
from app.db.database import get_all_decisions, init_db
from app.memory.graph import rebuild_corpus_graph

init_db()
# Deterministic and idempotent, so re-deriving on every boot keeps the graph in step with
# the corpus without a migration step. Cheap: one pass over ~94 sourced rows.
rebuild_corpus_graph()

FRONTEND_DIST = settings.BASE_DIR / "frontend" / "dist"
app = Flask(__name__, static_folder=str(FRONTEND_DIST), static_url_path="")
CORS(app, supports_credentials=True)

# ponytail: single shared session token; swap for real per-user sessions if this ever
# serves more than the one admin. The point of this pass was that login/logout/me were
# called by the frontend but did not exist on the backend at all.
SESSION_COOKIE = "auth_session"
SESSION_TOKEN = "authenticated_admin"
_OPEN_API_PATHS = {"/api/health", "/api/login", "/api/logout", "/api/me"}


def _is_authed() -> bool:
    return request.cookies.get(SESSION_COOKIE) == SESSION_TOKEN


@app.before_request
def _require_auth():
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
    if user.lower() == settings.ADMIN_USER.lower() and pwd == settings.ADMIN_PASSWORD:
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
    return jsonify({"status": "healthy", "version": settings.VERSION, "project": settings.PROJECT_NAME})


@app.route("/api/run", methods=["POST"])
def api_run():
    data = request.get_json() or {}
    goal = data.get("goal", "").strip()
    provider = data.get("provider", "gemini-3.6-flash").strip()
    agent_type = data.get("agent_type", "branding").strip()

    if not goal:
        return jsonify({"error": "Goal statement is required"}), 400

    try:
        res = swarm_engine.run(goal_statement=goal, agent_type=agent_type, provider=provider)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/history", methods=["GET"])
def api_history():
    # Return the raw decision rows — their columns (id, goal_statement, selected_option,
    # confidence, reasoning_source, rationale, risks, created_at) are exactly the flat
    # fields the frontend history view reads.
    return jsonify({"success": True, "history": get_all_decisions()})


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


# --- Milestone 5: CMO Weekly Executive Digest ---------------------------------------
# Split in two on purpose: the network map is an instant DB projection, while the digest
# fans out to every agent in ACTIVE_AGENTS (one LLM call each). Bundling them would make the graph tab wait on
# synthesis it does not need.

@app.route("/api/digest/network", methods=["GET"])
def api_digest_network():
    return jsonify({"success": True, **build_network()})


@app.route("/api/digest", methods=["POST"])
def api_digest():
    data = request.get_json(silent=True) or {}
    provider = (data.get("provider") or "gemini-3.6-flash").strip()
    try:
        return jsonify(run_digest(provider=provider))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Phase 9 M9.3: per-agent conversation ------------------------------------------
# Talking to an agent is a different shape from /api/run: multi-turn, persistent, and
# scoped to one agent's memory. The reply carries its own recall so the CMO can see what
# it was built from instead of taking it on trust.

@app.route("/api/chat", methods=["POST"])
def api_chat():
    data = request.get_json(silent=True) or {}
    try:
        return jsonify(run_chat(
            agent_type=(data.get("agent") or "branding").strip(),
            message=(data.get("message") or "").strip(),
            thread_id=(data.get("thread_id") or None),
            provider=(data.get("provider") or "gemini-3.6-flash").strip(),
        ))
    except ValueError as e:  # unknown agent / unknown thread / empty message
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _namespace_from_args():
    """Resolve ?agent=branding or ?agents=branding,pr to a namespace.

    One resolver for both the thread list and the memory inspector, so the joint view can
    never be reachable under one and not the other.
    """
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
    return jsonify({"success": True, "namespace": namespace,
                    "threads": store.list_threads(namespace)})


@app.route("/api/chat/thread/<thread_id>", methods=["GET"])
def api_chat_thread(thread_id):
    thread = store.get_thread(thread_id)
    if thread is None:
        return jsonify({"error": "unknown thread"}), 404
    return jsonify({"success": True, "thread": thread, "turns": store.get_turns(thread_id)})


@app.route("/api/memory", methods=["GET"])
def api_memory():
    """What one agent — or one pair — actually remembers, made inspectable.

    Scoped by namespace, so this endpoint cannot show one agent another's private memory
    even if asked to: `?agents=a,b` resolves to the joint namespace, never to a union of
    the two private ones.
    """
    try:
        namespace = _namespace_from_args()
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({
        "success": True,
        "namespace": namespace,
        "memories": store.list_memories(namespace),
    })


# --- Phase 9 M9.5: the /triage bridge ----------------------------------------------

@app.route("/api/triage", methods=["POST"])
def api_triage():
    """Two agents, one answer, neither one's private memory touched."""
    data = request.get_json(silent=True) or {}
    try:
        return jsonify(run_triage(
            agents=data.get("agents") or [],
            message=(data.get("message") or "").strip(),
            thread_id=(data.get("thread_id") or None),
            provider=(data.get("provider") or "gemini-3.6-flash").strip(),
        ))
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
