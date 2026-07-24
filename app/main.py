"""
Marketing OS v2.0 Application Server Entrypoint
"""

import os
from flask import Flask, request, jsonify, send_from_directory, render_template_string
from flask_cors import CORS
from app.core.config import settings
from app.graph.workflow import swarm_engine
from app.db.database import get_all_decisions, get_all_knowledge_units, init_db

# Initialize database
init_db()

FRONTEND_DIST = settings.BASE_DIR / "frontend" / "dist"
app = Flask(__name__, static_folder=str(FRONTEND_DIST), static_url_path="")
CORS(app)

LOGIN_PAGE = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Marketing OS v2.0 | Authentication</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#FAF8F5] text-[#1C1917] flex items-center justify-center min-h-screen font-sans">
  <div class="w-full max-w-md p-8 bg-white/90 backdrop-blur-xl border border-[#E7E2D8] rounded-3xl shadow-xl space-y-6">
    <div class="text-center space-y-2">
      <h1 class="text-2xl font-bold tracking-tight text-[#1C1917]">Marketing OS v2.0</h1>
      <p class="text-xs text-[#78716C]">Governed Multi-Agent Swarm for E2E Networks</p>
    </div>

    {% if error %}
    <div class="p-3 bg-red-500/10 border border-red-500/20 text-red-700 text-xs rounded-xl text-center font-medium">
      {{ error }}
    </div>
    {% endif %}

    <form method="POST" action="/login" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-[#44403C] mb-1">Username</label>
        <input type="text" name="username" required placeholder="admin" className="w-full px-4 py-2.5 bg-[#F7F5F0] border border-[#E0DACE] rounded-xl text-sm outline-none focus:border-[#D97757]" />
      </div>
      <div>
        <label class="block text-xs font-semibold text-[#44403C] mb-1">Password</label>
        <input type="password" name="password" required placeholder="••••••••" className="w-full px-4 py-2.5 bg-[#F7F5F0] border border-[#E0DACE] rounded-xl text-sm outline-none focus:border-[#D97757]" />
      </div>
      <button type="submit" class="w-full py-3 bg-[#D97757] hover:bg-[#C15C3D] text-white font-semibold text-xs rounded-xl transition-all shadow-md">
        Authenticate Session
      </button>
    </form>
  </div>
</body>
</html>
"""

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        u = request.form.get("username")
        p = request.form.get("password")
        if u == "admin" and p == "marketing2026":
            resp = jsonify({"success": True, "message": "Authenticated"})
            resp.set_cookie("auth_session", "authenticated_admin", max_age=86400)
            return resp
        return render_template_string(LOGIN_PAGE, error="Invalid credentials")
    return render_template_string(LOGIN_PAGE)

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
    decisions = get_all_decisions()
    history_records = []
    for d in decisions:
        history_records.append({
            "goalStatement": d["goal_statement"],
            "timestamp": d["created_at"],
            "positioning": {
                "statement": d["rationale"][:150] + "...",
                "differentiation_basis": "Sovereign Neo-Cloud Platform",
                "state": "ACTIVE"
            },
            "decision": {
                "id": d["id"],
                "selected_option": d["selected_option"],
                "confidence": d["confidence"],
                "escalated": bool(d["escalated"]),
                "reasoning_source": d["reasoning_source"],
                "rationale": d["rationale"],
                "risks": d["risks"]
            }
        })
    return jsonify({"success": True, "history": history_records})

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
