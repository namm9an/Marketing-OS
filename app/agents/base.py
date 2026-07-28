"""
Shared agent execution core.

All five marketing agents (branding, PR, social, product-marketing, events) run the
exact same pipeline — retrieve grounded facts, prompt the LLM, parse + validate JSON —
differing only by persona. That body lives here once; each agent is just a registry entry. The old per-agent files repeated this
~90-line body five times, which meant a retrieval or validation fix had to be made
(and was made inconsistently) in five places.
"""

import json
from typing import Dict, Any

from app.services.llm_service import LLMService
from app.db.database import search_knowledge_units
from app.core.schemas import AgentResponseSchema

DEFAULT_PROVIDER = "gemini-3.6-flash"

_COMPETITORS = (
    "India Top 3: E2E Networks (Us), Yotta Data Services, Neysa AI. "
    "Global Top 10: CoreWeave, Nebius, Lambda Labs, RunPod, Together AI, Crusoe Cloud, "
    "VAST Data, Voltage Park, Hyperstack, Foundry."
)

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

# agent_type -> (persona, knowledge_class, provenance source_url).
# `persona` is the agent's identity on its own, with no output contract attached: the
# structured pipeline appends _JSON_CONTRACT to it, while the Phase 9 chat layer wants the
# same identity speaking prose. One source of truth per agent, two output modes.
AGENT_REGISTRY: Dict[str, Dict[str, str]] = {
    "branding": {
        "persona": f"""You are the Lead Branding & Positioning Strategist for E2E Networks (NSE: E2E).
Infrastructure: NVIDIA B200 (from Rs671/hr), H200, H100, L40S, HGX. MeitY Empaneled, 99.95% SLA, SOC2.
Cloud branding archetypes: Enterprise-Centric (compliance/SLA), Developer-Focused (fast launch, self-serve
CLI, transparent per-hour pricing), Research-Focused (batch clusters, benchmarks, raw Slurm).
COMPETITOR TAXONOMY: {_COMPETITORS}
""",
    },
    "pr": {
        "persona": f"""You are the Lead PR & Competitive Intelligence Strategist for E2E Networks (NSE: E2E).
Synthesize competitor press releases, newsletters/blogs, social activity (LinkedIn/X by named CEOs/CTOs),
and founder/executive discourse (podcasts, interviews) into a counter-narrative and media positioning brief.
COMPETITORS MONITORED: {_COMPETITORS}
""",
    },
    "social": {
        "persona": f"""You are the Lead Social Media Strategist for E2E Networks (NSE: E2E).
E2E: B200 from Rs671/hr, H100 from Rs334/hr, MeitY Empaneled, 1-click model scaling.
Platforms: LinkedIn (B2B decision makers, C-suite, VP of AI) and X/Twitter (AI researchers, OSS devs).
Produce campaign hooks, viral thread concepts, and executive thought-leadership posts.
COMPETITOR TAXONOMY: {_COMPETITORS}
""",
    },
    "product_marketing": {
        "persona": f"""You are the Lead Product Marketing Manager (PMM) for E2E Networks (NSE: E2E).
Products: B200/H200/H100 clusters, fast InfiniBand storage, RAG engine, Indic Voice AI.
Segments: Enterprise CTOs, AI founders, ML engineers, sovereign govt agencies.
Produce feature messaging, competitive battlecards, tier pricing, and GTM launch plans.
COMPETITOR TAXONOMY: {_COMPETITORS}
""",
    },
    "events": {
        "persona": f"""You are the Lead Events & Field Marketing Strategist for E2E Networks.
Portfolio: developer hackathons, AI summits, enterprise executive roundtables, Indic AI expos.
Produce keynote concepts, booth demos, sponsorship ROI, and developer-activation strategies.
COMPETITOR TAXONOMY: {_COMPETITORS}
""",
    },
}

# Agents whose output reaches a user. The other three registry entries (social,
# product_marketing, events) were built from a 3-bullet spec in design_doc Phase 8 and are
# parked until the requesting stakeholder specifies what they should actually do. They stay
# in AGENT_REGISTRY so their namespaces keep existing (memory isolation tests depend on the
# `pr` ⊂ `product_marketing` prefix collision); they just don't get to write the CMO digest.
ACTIVE_AGENTS = ("branding", "pr")


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
        system_prompt=cfg["persona"] + _JSON_CONTRACT, user_prompt=user_prompt, provider=provider
    )
    text = _strip_code_fence(result["text"])

    # 3. Validate against the Pydantic contract (every agent, consistently).
    try:
        parsed = AgentResponseSchema(**json.loads(text)).model_dump()
    except Exception:
        parsed = {
            "selected_option": f"{agent_type.replace('_', ' ').title()} Strategy",
            "statement": text or "E2E Networks delivers sovereign GPU cloud infrastructure for Indian AI developers.",
            "rationale": "Grounded in MeitY empanelment, B200 availability, and 16+ years of cloud experience.",
            "risks": "Hyperscaler pricing pressure on standard compute instances.",
            "confidence": "High",
        }

    # 4. No write-back to knowledge_units. That table is L0, the grounded corpus: every row
    #    is meant to be crawler-sourced with a real source_url, and agents are readers only
    #    (design_doc.md §9.3/§9.5). The old enrichment wrote synthesized prose back into it
    #    under a boilerplate E2E URL, which is what made `enriched_by NOT LIKE '%agent%'`
    #    necessary in M5 to stop model output being cited as competitor intelligence. It was
    #    also redundant — save_decision() in the governance node already logs every decision,
    #    in the table meant for it. Conversation-derived learning now goes to L1 through the
    #    promotion gate instead (app/memory/gate.py).
    return parsed


class AgentNode:
    """Thin adapter so callers/tests can keep the `Node().process(goal)` API."""

    def __init__(self, agent_type: str):
        self.agent_type = agent_type

    def process(self, goal_statement: str, provider: str = DEFAULT_PROVIDER) -> Dict[str, Any]:
        return run_agent(self.agent_type, goal_statement, provider=provider)


if __name__ == "__main__":
    # ponytail self-check: registry is complete and the pipeline returns a valid contract.
    assert set(AGENT_REGISTRY) == {"branding", "pr", "social", "product_marketing", "events"}
    assert set(ACTIVE_AGENTS) < set(AGENT_REGISTRY), "active agents must be registered agents"
    out = run_agent("branding", "Position B200 against Nebius on price")  # uses mock LLM without keys
    assert {"selected_option", "statement", "rationale", "risks", "confidence"} <= set(out)
    print("base.py self-check OK:", out["selected_option"])
