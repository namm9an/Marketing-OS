"""Capture five one-shot examples through the real Flask handler and retrieval path.

Live mode requires credentials and real provider metadata. Controlled mode forces
mock inference and cannot produce a ready public manifest. Neither changes stored
workflow response shapes, disables quotas, nor re-searches evidence after a run.
"""

import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import secrets
import subprocess
from tempfile import NamedTemporaryFile, TemporaryDirectory
from urllib.parse import urlparse

from app.core.config import settings
from app.core.evidence_capture import capture_retrievals

AGENTS = ("branding", "pr", "social", "product_marketing", "events")
SCENARIO_ID = "fictional-vanguard-b200-launch-v1"
BRIEF = "Fictional Vanguard Cloud is preparing a B200 launch against Nebius. Use stored pricing, hardware and reliability evidence. This is supplied scenario context, not a detected market event. "
GOALS = {
    "branding": BRIEF + "Recommend a positioning brief and explain unknowns without invented guarantees.",
    "pr": BRIEF + "Review a proposed price war narrative and recommend a communication response with explicit risks; do not imply legal clearance.",
    "social": BRIEF + "Recommend developer-facing community content from this supplied signal; no live social monitoring or publishing.",
    "product_marketing": BRIEF + "Recommend product messaging using available B200/H100 facts and exact pricing units; no invented TCO calculation.",
    "events": BRIEF + "Recommend a field-event theme for ML engineers using available context; no booking, scheduling or invented budget optimization.",
}


class CaptureBlocked(RuntimeError):
    """A fixed, credential-free reason code safe to display in command output."""


def _bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def _write(path, value):
    data = _bytes(value)
    with NamedTemporaryFile(dir=path.parent, delete=False) as stream:
        temporary = Path(stream.name)
        stream.write(data)
    try:
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)
    return hashlib.sha256(data).hexdigest()


def _revision():
    try:
        return subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=settings.BASE_DIR,
                                       stderr=subprocess.DEVNULL, text=True).strip()
    except (OSError, subprocess.CalledProcessError):
        return None


@contextmanager
def _isolated_runtime(mode):
    from app.db import database
    keys = ("DB_PATH", "GEMINI_API_KEY", "TARGET_ORGANIZATION", "TARGET_INDUSTRY",
            "ENVIRONMENT", "SESSION_COOKIE_SECURE", "ADMIN_USER", "ADMIN_PASSWORD")
    previous = {key: getattr(settings, key) for key in keys}
    with TemporaryDirectory(prefix="marketing-os-capture-") as directory:
        try:
            settings.DB_PATH = Path(directory) / "capture.db"
            settings.TARGET_ORGANIZATION = "Vanguard Cloud"
            settings.TARGET_INDUSTRY = "Enterprise AI & GPU Cloud"
            settings.ENVIRONMENT = "test"
            settings.SESSION_COOKIE_SECURE = False
            settings.ADMIN_USER = "example-capture-operator"
            settings.ADMIN_PASSWORD = secrets.token_urlsafe(32)
            if mode == "controlled":
                settings.GEMINI_API_KEY = ""
            database.reset_db_state()
            database.init_db(force=True)
            from app.db.grounded_seed import seed_grounded_knowledge
            seed_grounded_knowledge()
            yield
        finally:
            for key, value in previous.items():
                setattr(settings, key, value)
            database.reset_db_state()


def validate_recording(bundle, mode, agent):
    """Validate attribution and observed evidence; no claim-entailment guarantee."""
    try:
        expected_kind = "live-recording" if mode == "live" else "controlled-fixture"
        expected_source = "live" if mode == "live" else "mock"
        if bundle["schema_version"] != 1 or bundle["recording"]["kind"] != expected_kind:
            raise CaptureBlocked("recording-kind-mismatch")
        request = bundle["request"]
        if request != {"workflow": "run", "agent_type": agent, "goal": GOALS[agent]}:
            raise CaptureBlocked("recording-request-mismatch")
        response = bundle["response"]
        metrics = response["metrics"]
        decision = response["decision"]
        if response.get("success") is not True or not response["positioning"]["statement"]:
            raise CaptureBlocked("missing-successful-output")
        if not decision["reasoning_source"].startswith(f"langgraph:{agent}:") or metrics["source"] != expected_source:
            raise CaptureBlocked("execution-attribution-mismatch")
        if metrics.get("requested_model") != settings.DEFAULT_MODEL:
            raise CaptureBlocked("configured-model-mismatch")
        if mode == "live" and (type(metrics.get("attempts")) is not int or metrics["attempts"] < 1 or metrics.get("finish_reason") != "STOP"):
            raise CaptureBlocked("missing-live-execution-evidence")
        retrievals = bundle["evidence"]["retrievals"]
        if len(retrievals) != 1 or retrievals[0]["agent"] != agent or retrievals[0]["query"] != request["goal"]:
            raise CaptureBlocked("missing-request-retrieval")
        facts = retrievals[0]["facts"]
        if not facts:
            raise CaptureBlocked("no-retrieved-source-rows")
        for fact in facts:
            url = urlparse(fact["source_url"])
            if not fact.get("id") or not fact.get("content") or fact.get("enriched_by") != "grounded_crawler" or url.scheme not in ("http", "https") or not url.netloc:
                raise CaptureBlocked("ineligible-captured-source")
        cited = decision.get("evidence_ids", [])
        if not set(cited) <= {fact["id"] for fact in facts} or decision.get("invalid_evidence_ids_count", 0):
            raise CaptureBlocked("invalid-citation-attribution")
        if mode == "live" and not cited:
            raise CaptureBlocked("missing-public-example-citations")
    except (KeyError, TypeError, AttributeError, ValueError):
        raise CaptureBlocked("invalid-recording-shape") from None


def capture_examples(output, mode="live", resume=False):
    if mode not in ("live", "controlled"):
        raise CaptureBlocked("unknown-capture-mode")
    if mode == "live" and not settings.GEMINI_API_KEY.strip():
        raise CaptureBlocked("missing-provider-key")
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    manifest_path = output / "manifest.json"
    entries = []
    if manifest_path.exists():
        try:
            previous = json.loads(manifest_path.read_text())
            entries = previous.get("examples", [])
            if not isinstance(entries, list) or any(not isinstance(entry, dict) or entry.get("agent") not in AGENTS for entry in entries):
                raise CaptureBlocked("invalid-existing-manifest")
            if len({entry["agent"] for entry in entries}) != len(entries):
                raise CaptureBlocked("duplicate-existing-specialist")
            if entries and (not resume or previous.get("mode") != f"{mode}-recordings"):
                raise CaptureBlocked("existing-capture-use-resume-or-new-directory")
        except (ValueError, TypeError):
            raise CaptureBlocked("invalid-existing-manifest") from None
    manifest = {"schema_version": 1, "status": "blocked", "mode": f"{mode}-recordings",
                "scenario_id": SCENARIO_ID, "fictional_client": "Vanguard Cloud", "examples": list(entries)}
    try:
        with _isolated_runtime(mode):
            from app.main import app
            with app.test_client() as client:
                login = client.post("/api/login", json={"username": settings.ADMIN_USER, "password": settings.ADMIN_PASSWORD})
                if login.status_code != 200:
                    raise CaptureBlocked("capture-authentication-failed")
                for agent in AGENTS:
                    existing = next((entry for entry in entries if entry.get("agent") == agent), None)
                    filename = f"{agent}.json"
                    path = output / filename
                    if existing:
                        if existing.get("path") != filename or hashlib.sha256(path.read_bytes()).hexdigest() != existing.get("sha256"):
                            raise CaptureBlocked("existing-recording-checksum-mismatch")
                        validate_recording(json.loads(path.read_text()), mode, agent)
                        continue
                    if path.exists():
                        raise CaptureBlocked("untracked-recording-file-exists")
                    with capture_retrievals() as retrievals:
                        response = client.post("/api/run", json={"agent_type": agent, "goal": GOALS[agent]})
                    if response.status_code != 200:
                        raise CaptureBlocked(f"capture-http-{response.status_code}")
                    bundle = {"schema_version": 1,
                              "recording": {"kind": "live-recording" if mode == "live" else "controlled-fixture",
                                            "captured_at": datetime.now(timezone.utc).isoformat(),
                                            "repository_revision": _revision(), "transport": "flask-test-client",
                                            "fictional_client": "Vanguard Cloud", "signal_kind": "supplied-simulated"},
                              "request": {"workflow": "run", "agent_type": agent, "goal": GOALS[agent]},
                              "response": response.get_json(), "evidence": {"retrievals": retrievals}}
                    validate_recording(bundle, mode, agent)
                    digest = _write(path, bundle)
                    manifest["examples"].append({"agent": agent, "path": filename, "sha256": digest})
                    _write(manifest_path, manifest)
                client.post("/api/logout")
        manifest["status"] = "ready" if mode == "live" else "controlled-only"
        _write(manifest_path, manifest)
        return manifest
    except CaptureBlocked as error:
        manifest["failure"] = str(error)
        _write(manifest_path, manifest)
        raise
    except Exception:
        manifest["failure"] = "capture-or-storage-failed"
        _write(manifest_path, manifest)
        raise CaptureBlocked("capture-or-storage-failed") from None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--mode", choices=("live", "controlled"), default="live")
    parser.add_argument("--resume", action="store_true", help="Reuse checksum-validated existing recordings without calling the model again")
    args = parser.parse_args()
    try:
        manifest = capture_examples(args.output, mode=args.mode, resume=args.resume)
        print(json.dumps({"status": manifest["status"], "examples": len(manifest["examples"]), "output": str(args.output)}))
        return 0
    except CaptureBlocked as error:
        print(json.dumps({"status": "blocked", "reason": str(error)}))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
