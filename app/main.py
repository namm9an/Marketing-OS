"""
Marketing OS v2.0 Application Server Entrypoint
"""

import os
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
from app.core.config import settings
from app.graph.workflow import swarm_engine
from app.db.database import get_all_decisions, init_db

init_db()

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
    if data.get("username") == settings.ADMIN_USER and data.get("password") == settings.ADMIN_PASSWORD:
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
