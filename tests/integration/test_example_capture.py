"""All provider behaviour here is controlled. These tests are NOT public recordings."""

from copy import deepcopy
import io
import json
import re

import pytest

from app.core.config import settings
from app.core.exceptions import UpstreamProviderError
from app.recordings.capture import AGENTS, CaptureBlocked, capture_examples
from app.services.llm_service import LLMService


def test_missing_key_blocks_before_capture_files_or_api_calls(tmp_path, monkeypatch):
    monkeypatch.setattr(LLMService, "generate", lambda *a, **k: pytest.fail("No generation allowed before credential preflight"))
    destination = tmp_path / "not-created"
    with pytest.raises(CaptureBlocked, match="missing-provider-key"):
        capture_examples(destination)
    assert not destination.exists()


def test_controlled_capture_preserves_actual_saved_response_and_exact_retrieval(tmp_path, monkeypatch):
    import app.agents.base as agent_module
    import app.graph.workflow as workflow_module
    observed = []
    saved = {}
    original_search = agent_module.search_knowledge_units
    original_save = workflow_module.save_workflow_result
    def search(*args, **kwargs):
        result = original_search(*args, **kwargs)
        observed.append(deepcopy(result))
        return result
    def save(decision_id, kind, result):
        saved[decision_id] = deepcopy(result)
        return original_save(decision_id, kind, result)
    monkeypatch.setattr(agent_module, "search_knowledge_units", search)
    monkeypatch.setattr(workflow_module, "save_workflow_result", save)
    original_db = settings.DB_PATH
    result = capture_examples(tmp_path, mode="controlled")
    assert settings.DB_PATH == original_db
    assert result["status"] == "controlled-only"
    assert len(observed) == 5  # No post-hoc retrieval to construct a convenient explanation.
    for index, entry in enumerate(result["examples"]):
        bundle = json.loads((tmp_path / entry["path"]).read_text())
        response = bundle["response"]
        assert response == saved[response["decision"]["id"]]
        assert bundle["evidence"]["retrievals"][0]["facts"] == observed[index]
        assert response["metrics"]["source"] == "mock"
        assert bundle["recording"]["kind"] == "controlled-fixture"
        assert "retrievals" not in response  # Original API/stored snapshot contract is unchanged.


def test_live_mode_rejects_mock_output_instead_of_relabelling_it(tmp_path, monkeypatch):
    original_generate = LLMService.generate
    def controlled_generate(*args, **kwargs):
        key = settings.GEMINI_API_KEY
        settings.GEMINI_API_KEY = ""
        try:
            return original_generate(*args, **kwargs)
        finally:
            settings.GEMINI_API_KEY = key
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "synthetic-test-key-not-a-real-credential")
    monkeypatch.setattr(LLMService, "generate", controlled_generate)
    with pytest.raises(CaptureBlocked, match="execution-attribution-mismatch"):
        capture_examples(tmp_path, mode="live")
    manifest = json.loads((tmp_path / "manifest.json").read_text())
    assert manifest["status"] == "blocked" and manifest["examples"] == []
    assert not (tmp_path / "branding.json").exists()


def test_resume_reuses_untouched_recordings_without_new_generation(tmp_path, monkeypatch):
    capture_examples(tmp_path, mode="controlled")
    originals = {agent: (tmp_path / f"{agent}.json").read_bytes() for agent in AGENTS}
    monkeypatch.setattr(LLMService, "generate", lambda *a, **k: pytest.fail("Resume must not regenerate existing examples"))
    result = capture_examples(tmp_path, mode="controlled", resume=True)
    assert result["status"] == "controlled-only"
    assert originals == {agent: (tmp_path / f"{agent}.json").read_bytes() for agent in AGENTS}


def test_modified_recording_fails_closed_before_recapture(tmp_path, monkeypatch):
    capture_examples(tmp_path, mode="controlled")
    path = tmp_path / "branding.json"
    path.write_bytes(path.read_bytes() + b"\n")
    monkeypatch.setattr(LLMService, "generate", lambda *a, **k: pytest.fail("An altered recording must not cause paid regeneration"))
    with pytest.raises(CaptureBlocked, match="existing-recording-checksum-mismatch"):
        capture_examples(tmp_path, mode="controlled", resume=True)


def test_controlled_upstream_can_exercise_live_contract_without_real_provider_contact(tmp_path, monkeypatch):
    import urllib.request
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "synthetic-test-key-not-a-real-credential")
    requests = []
    def upstream(request, timeout):
        requests.append(request)
        prompt = json.loads(request.data)["contents"][0]["parts"][0]["text"]
        ids = re.findall(r"\[id:\s*([^\]]+)\]", prompt)
        body = {"selected_option": "Controlled upstream strategy", "statement": "A synthetic provider contract result.",
                "rationale": "Controlled evidence reference.", "risks": "Controlled test risk", "confidence": "Medium", "evidence_ids": ids[:1]}
        return io.BytesIO(json.dumps({"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": json.dumps(body)}]}}],
                                     "modelVersion": "controlled-test-version", "usageMetadata": {"totalTokenCount": 100}}).encode())
    monkeypatch.setattr(urllib.request, "urlopen", upstream)
    manifest = capture_examples(tmp_path, mode="live")
    assert manifest["status"] == "ready" and len(requests) == 5
    for entry in manifest["examples"]:
        bundle = json.loads((tmp_path / entry["path"]).read_text())
        assert bundle["response"]["metrics"]["model"] == "controlled-test-version"
        assert bundle["response"]["decision"]["evidence_ids"]
    # Artifacts exist only in pytest's temporary directory; none is a genuine public recording.


def test_provider_failure_never_serializes_credentials_into_manifest(tmp_path, monkeypatch):
    synthetic = "synthetic-test-key-not-a-real-credential"
    monkeypatch.setattr(settings, "GEMINI_API_KEY", synthetic)
    def fail(*args, **kwargs):
        raise UpstreamProviderError(f"A synthetic failure containing {synthetic}", status_code=502)
    monkeypatch.setattr(LLMService, "generate", fail)
    with pytest.raises(CaptureBlocked, match="capture-http-502"):
        capture_examples(tmp_path)
    manifest = (tmp_path / "manifest.json").read_text()
    assert synthetic not in manifest
    assert '"status": "blocked"' in manifest


def test_partial_capture_retains_success_and_resume_only_calls_missing_specialists(tmp_path, monkeypatch):
    original = LLMService.generate
    calls = []
    def fail_second(*args, **kwargs):
        calls.append(1)
        if len(calls) == 2:
            raise UpstreamProviderError("Controlled interruption", status_code=503)
        return original(*args, **kwargs)
    monkeypatch.setattr(LLMService, "generate", fail_second)
    with pytest.raises(CaptureBlocked, match="capture-http-503"):
        capture_examples(tmp_path, mode="controlled")
    first = (tmp_path / "branding.json").read_bytes()
    manifest = json.loads((tmp_path / "manifest.json").read_text())
    assert manifest["status"] == "blocked" and len(manifest["examples"]) == 1
    resumed = []
    def count_rest(*args, **kwargs):
        resumed.append(1)
        return original(*args, **kwargs)
    monkeypatch.setattr(LLMService, "generate", count_rest)
    assert capture_examples(tmp_path, mode="controlled", resume=True)["status"] == "controlled-only"
    assert len(resumed) == 4
    assert (tmp_path / "branding.json").read_bytes() == first


def test_duplicate_manifest_specialists_never_become_public_ready(tmp_path, monkeypatch):
    capture_examples(tmp_path, mode="controlled")
    path = tmp_path / "manifest.json"
    manifest = json.loads(path.read_text())
    manifest["examples"][1] = manifest["examples"][0]
    path.write_text(json.dumps(manifest))
    monkeypatch.setattr(LLMService, "generate", lambda *a, **k: pytest.fail("Invalid manifests must not trigger generation"))
    with pytest.raises(CaptureBlocked, match="duplicate-existing-specialist"):
        capture_examples(tmp_path, mode="controlled", resume=True)
