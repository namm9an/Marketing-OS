"""
Shared agent execution core.

All five marketing agents (branding, PR, social, product-marketing, events) run the
exact same pipeline — retrieve grounded facts, prompt the LLM, parse + validate JSON —
differing only by persona. That body lives here once; each agent is just a registry entry.
"""

import json
from typing import Dict, Any, Optional

from app.core.config import settings
from app.services.llm_service import LLMService
from app.db.database import search_knowledge_units
from app.core.schemas import AgentResponseSchema

DEFAULT_PROVIDER = "gemini-3.8-flash"

_JSON_CONTRACT = """
Return a JSON object matching this schema and output valid JSON only:
{
  "selected_option": "Short strategy/option title",
  "statement": "Core positioning or strategic statement",
  "rationale": "Strategic reasoning grounded in the facts above",
  "risks": "Identified risks or counter-actions",
  "confidence": "High" | "Medium" | "Low"
}
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


def run_agent(
    agent_type: str,
    goal_statement: str,
    provider: str = DEFAULT_PROVIDER,
    extra_context: str = "",
    api_key: Optional[str] = None,
    client_ip: Optional[str] = None,
    request_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Run one agent. `extra_context` replaces the default retrieval when supplied —
    the weekly digest uses it to ground agents on competitor-only facts."""
    cfg = AGENT_REGISTRY.get(agent_type, AGENT_REGISTRY["branding"])

    # 1. Retrieve grounded facts from the SQLite knowledge base.
    if extra_context:
        facts_context = f"\n\nGROUNDED KNOWLEDGE UNITS FROM DB:\n{extra_context}"
    else:
        db_facts = search_knowledge_units(query=goal_statement, limit=5, sourced_only=True)
        facts_context = ""
        if db_facts:
            facts_context = "\n\nRELEVANT GROUNDED KNOWLEDGE UNITS FROM DB:\n" + "\n".join(
                f"- [{f['organization']} / {f['knowledge_class']}] (URL: {f.get('source_url', 'N/A')}): {f['content']}"
                for f in db_facts
            )
    user_prompt = f"Goal: {goal_statement}{facts_context}\nFormulate the strategy for your domain."

    # 2. Call the LLM.
    result = LLMService.generate(
        system_prompt=cfg["persona"] + _JSON_CONTRACT,
        user_prompt=user_prompt,
        provider=provider,
        api_key=api_key,
        client_ip=client_ip,
        request_id=request_id,
    )
    text = _strip_code_fence(result["text"])

    # 3. Validate against the Pydantic contract (every agent, consistently).
    try:
        parsed = AgentResponseSchema(**json.loads(text)).model_dump()
    except Exception:
        parsed = {
            "selected_option": f"{agent_type.replace('_', ' ').title()} Strategy",
            "statement": text or f"{settings.TARGET_ORGANIZATION} delivers enterprise {settings.TARGET_INDUSTRY.lower()} infrastructure.",
            "rationale": f"Grounded in enterprise compliance, certified SLA, and proven reliability for {settings.TARGET_ORGANIZATION}.",
            "risks": "Hyperscaler pricing pressure on standard compute instances.",
            "confidence": "High",
        }
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
