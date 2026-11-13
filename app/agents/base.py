"""
Shared agent execution core.

All five marketing agents (branding, PR, social, product-marketing, events) run the
exact same pipeline — retrieve grounded facts, prompt the LLM, parse + validate JSON —
differing only by persona. That body lives here once; each agent is just a registry entry.
"""

import json
import re
import time
from typing import Dict, Any, Optional, List, Tuple

from app.core.config import settings
from app.services.llm_service import LLMService
from app.core.telemetry import provider_metrics
from app.db.database import search_knowledge_units
from app.core.schemas import AgentResponseSchema
from app.core.exceptions import UpstreamProviderError

DEFAULT_PROVIDER = "gemini-3.8-flash"

_JSON_CONTRACT = """
Return a JSON object matching this schema and output valid JSON only:
{
  "selected_option": "Short strategy/option title",
  "statement": "Core positioning or strategic statement",
  "rationale": "Strategic reasoning grounded in the facts above",
  "risks": "Identified risks or counter-actions",
  "confidence": "High" | "Medium" | "Low",
  "evidence_ids": ["fact_id_1", "fact_id_2"]
}
List only the IDs of facts from the RELEVANT GROUNDED KNOWLEDGE UNITS above that directly support your strategy in evidence_ids.
"""

_PERSONA_TEMPLATES = {
    "branding": """You are the Lead Branding & Positioning Strategist for {target_org}.
Domain: {target_industry}.
Infrastructure: NVIDIA B200 (from Rs671/hr), H200, H100, L40S, HGX. Enterprise Empaneled, 99.95% SLA, SOC2.
Cloud branding archetypes: Enterprise-Centric (compliance/SLA), Developer-Focused (fast launch, self-serve
CLI, transparent per-hour pricing), Research-Focused (batch clusters, benchmarks, raw Slurm).
COMPETITOR TAXONOMY: {competitors}
""",
    "pr": """You are the Lead PR & Competitive Intelligence Strategist for {target_org}.
Domain: {target_industry}.
Synthesize competitor press releases, newsletters/blogs, social activity (LinkedIn/X by named CEOs/CTOs),
and founder/executive discourse (podcasts, interviews) into a counter-narrative and media positioning brief.
COMPETITORS MONITORED: {competitors}
""",
    "social": """You are the Lead Social Media Strategist for {target_org}.
Domain: {target_industry}.
Fleet: B200 from Rs671/hr, H100 from Rs334/hr, Enterprise Empaneled, 1-click model scaling.
Platforms: LinkedIn (B2B decision makers, C-suite, VP of AI) and X/Twitter (AI researchers, OSS devs).
Produce campaign hooks, viral thread concepts, and executive thought-leadership posts.
COMPETITOR TAXONOMY: {competitors}
""",
    "product_marketing": """You are the Lead Product Marketing Manager (PMM) for {target_org}.
Domain: {target_industry}.
Products: B200/H200/H100 clusters, fast InfiniBand storage, RAG engine, Indic Voice AI.
Segments: Enterprise CTOs, AI founders, ML engineers, sovereign govt agencies.
Produce feature messaging, competitive battlecards, tier pricing, and GTM launch plans.
COMPETITOR TAXONOMY: {competitors}
""",
    "events": """You are the Lead Events & Field Marketing Strategist for {target_org}.
Domain: {target_industry}.
Portfolio: developer hackathons, AI summits, enterprise executive roundtables, Indic AI expos.
Produce keynote concepts, booth demos, sponsorship ROI, and developer-activation strategies.
COMPETITOR TAXONOMY: {competitors}
""",
}


class _DynamicAgentRegistry(dict):
    """Dynamic registry mapping agent_type -> {"persona": ...} with runtime settings injection."""

    def _render_persona(self, key: str) -> str:
        target_org = settings.TARGET_ORGANIZATION
        target_industry = settings.TARGET_INDUSTRY
        competitors = (
            f"Domestic Top 3: {target_org} (Us), Yotta Data Services, Neysa AI. "
            "Global Top 10: CoreWeave, Nebius, Lambda Labs, RunPod, Together AI, Crusoe Cloud, "
            "VAST Data, Voltage Park, Hyperstack, Foundry."
        )
        return _PERSONA_TEMPLATES[key].format(
            target_org=target_org,
            target_industry=target_industry,
            competitors=competitors,
        )

    def __getitem__(self, key: str) -> Dict[str, str]:
        if key not in _PERSONA_TEMPLATES:
            raise KeyError(key)
        return {"persona": self._render_persona(key)}

    def get(self, key: str, default: Any = None) -> Any:
        if key in _PERSONA_TEMPLATES:
            return {"persona": self._render_persona(key)}
        return default

    def __contains__(self, key: object) -> bool:
        return key in _PERSONA_TEMPLATES

    def __iter__(self):
        return iter(_PERSONA_TEMPLATES)

    def __len__(self) -> int:
        return len(_PERSONA_TEMPLATES)

    def keys(self):
        return _PERSONA_TEMPLATES.keys()

    def items(self):
        return [(k, {"persona": self._render_persona(k)}) for k in _PERSONA_TEMPLATES]

    def values(self):
        return [{"persona": self._render_persona(k)} for k in _PERSONA_TEMPLATES]


AGENT_REGISTRY: Dict[str, Dict[str, str]] = _DynamicAgentRegistry()

# Agents whose output reaches a user. All five specialist agents (branding, PR,
# social, product_marketing, events) are fully active in the swarm.
ACTIVE_AGENTS = ("branding", "pr", "social", "product_marketing", "events")


def _strip_code_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return text


def verify_citations(cited_ids: Any, retrieved_ids: set) -> Tuple[List[str], int]:
    """
    Deterministically check that every returned id is in the retrieved set.
    Drop any that are not and record an invalid_evidence_ids count.

    Note: This proves cited facts were actually retrieved, not that the text is supported by them.
    """
    if not isinstance(cited_ids, (list, tuple, set)):
        return [], 0
    valid = []
    invalid_count = 0
    seen = set()
    for item in cited_ids:
        if isinstance(item, str) and item in retrieved_ids:
            if item not in seen:
                valid.append(item)
                seen.add(item)
        else:
            invalid_count += 1
    return valid, invalid_count


def run_agent(
    agent_type: str,
    goal_statement: str,
    provider: str = DEFAULT_PROVIDER,
    extra_context: str = "",
    api_key: Optional[str] = None,
    client_ip: Optional[str] = None,
    request_id: Optional[str] = None,
    reservation_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Run one agent. `extra_context` replaces the default retrieval when supplied —
    the weekly digest uses it to ground agents on competitor-only facts."""
    cfg = AGENT_REGISTRY.get(agent_type, AGENT_REGISTRY["branding"])

    # 1. Retrieve grounded facts from the SQLite knowledge base (timed separately as retrieval_ms).
    t_retrieval_0 = time.perf_counter()
    retrieved_facts_ids = set()
    if extra_context:
        facts_context = f"\n\nGROUNDED KNOWLEDGE UNITS FROM DB:\n{extra_context}"
        facts_retrieved = extra_context.count("\n- ") or (1 if extra_context.strip() else 0)
        for m in re.finditer(r"\[id:\s*([a-zA-Z0-9_-]+)\]", extra_context):
            retrieved_facts_ids.add(m.group(1))
    else:
        db_facts = search_knowledge_units(query=goal_statement, limit=5, sourced_only=True)
        facts_retrieved = len(db_facts)
        retrieved_facts_ids = {str(f["id"]) for f in db_facts if "id" in f}
        facts_context = ""
        if db_facts:
            facts_context = "\n\nRELEVANT GROUNDED KNOWLEDGE UNITS FROM DB:\n" + "\n".join(
                f"- [id: {f['id']}] [{f['organization']} / {f['knowledge_class']}] (URL: {f.get('source_url', 'N/A')}): {f['content']}"
                for f in db_facts
            )
    retrieval_ms = round((time.perf_counter() - t_retrieval_0) * 1000, 2)
    user_prompt = f"Goal: {goal_statement}{facts_context}\nFormulate the strategy for your domain."

    # 2. Call the LLM.
    result = LLMService.generate(
        system_prompt=cfg["persona"] + _JSON_CONTRACT,
        user_prompt=user_prompt,
        provider=provider,
        api_key=api_key,
        client_ip=client_ip,
        request_id=request_id,
        reservation_id=reservation_id,
    )
    # 3. Validate against the Pydantic contract (every agent, consistently).
    try:
        text = _strip_code_fence(result["text"])
        parsed = AgentResponseSchema(**json.loads(text)).model_dump()
    except (ValueError, TypeError, KeyError, IndexError):
        raise UpstreamProviderError(
            "Model output did not satisfy the strategy schema", status_code=502,
        ) from None

    # Deterministic citation check
    valid_evidence_ids, invalid_evidence_count = verify_citations(
        parsed.get("evidence_ids", []), retrieved_facts_ids
    )
    parsed["evidence_ids"] = valid_evidence_ids
    parsed["invalid_evidence_ids_count"] = invalid_evidence_count

    # Keep missing usage unknown, and preserve the provider's reported identity.
    parsed.update(provider_metrics(result))
    parsed["tokens"] = parsed["total_tokens"]
    parsed["retrieval_ms"] = retrieval_ms
    parsed["facts_retrieved"] = facts_retrieved

    if result.get("notice"):
        parsed["notice"] = result["notice"]

    return parsed


class AgentNode:
    """Thin adapter so callers/tests can keep the `Node().process(goal)` API."""

    def __init__(self, agent_type: str):
        self.agent_type = agent_type

    def process(
        self,
        goal_statement: str,
        provider: str = DEFAULT_PROVIDER,
        api_key: Optional[str] = None,
        client_ip: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return run_agent(
            self.agent_type,
            goal_statement,
            provider=provider,
            api_key=api_key,
            client_ip=client_ip,
            request_id=request_id,
        )


if __name__ == "__main__":
    assert set(AGENT_REGISTRY) == {"branding", "pr", "social", "product_marketing", "events"}
    assert set(ACTIVE_AGENTS) == set(AGENT_REGISTRY), "active agents must match registered agents"
    out = run_agent("branding", "Position B200 against Nebius on price")
    assert {"selected_option", "statement", "rationale", "risks", "confidence"} <= set(out)
    print("base.py self-check OK:", out["selected_option"])
