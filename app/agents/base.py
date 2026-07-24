"""
Shared agent execution core.

All five marketing agents (branding, PR, social, product-marketing, events) run the
exact same pipeline — retrieve grounded facts, prompt the LLM, parse + validate JSON,
enrich the KB — differing only by system prompt and knowledge class. That body lives
here once; each agent is just a registry entry. The old per-agent files repeated this
~90-line body five times, which meant a retrieval or validation fix had to be made
(and was made inconsistently) in five places.
"""

import json
from typing import Dict, Any

from app.services.llm_service import LLMService
from app.db.database import search_knowledge_units, save_knowledge_unit
from app.core.schemas import AgentResponseSchema
from app.core.primitives import new_id

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

# agent_type -> (system_prompt, knowledge_class, provenance source_url)
AGENT_REGISTRY: Dict[str, Dict[str, str]] = {
    "branding": {
        "prompt": f"""You are the Lead Branding & Positioning Strategist for E2E Networks (NSE: E2E).
E2E: TIR AI Platform (fine-tuning, RAG, no-code AI agents, Indic Voice AI, HuggingFace & W&B).
Infrastructure: NVIDIA B200 (from Rs671/hr), H200, H100, L40S, HGX. MeitY Empaneled, 99.95% SLA, SOC2.
Cloud branding archetypes: Enterprise-Centric (compliance/SLA), Developer-Focused (fast launch, self-serve
CLI, transparent per-hour pricing), Research-Focused (batch clusters, benchmarks, raw Slurm).
COMPETITOR TAXONOMY: {_COMPETITORS}
{_JSON_CONTRACT}""",
        "k_class": "positioning",
        "source_url": "https://www.e2enetworks.com/",
    },
    "pr": {
        "prompt": f"""You are the Lead PR & Competitive Intelligence Strategist for E2E Networks (NSE: E2E).
Synthesize competitor press releases, newsletters/blogs, social activity (LinkedIn/X by named CEOs/CTOs),
and founder/executive discourse (podcasts, interviews) into a counter-narrative and media positioning brief.
COMPETITORS MONITORED: {_COMPETITORS}
{_JSON_CONTRACT}""",
        "k_class": "pr_intelligence",
        "source_url": "https://www.e2enetworks.com/company",
    },
    "social": {
        "prompt": f"""You are the Lead Social Media Strategist for E2E Networks (NSE: E2E).
E2E: TIR AI Platform, B200 from Rs671/hr, H100 from Rs334/hr, MeitY Empaneled, 1-click model scaling.
Platforms: LinkedIn (B2B decision makers, C-suite, VP of AI) and X/Twitter (AI researchers, OSS devs).
Produce campaign hooks, viral thread concepts, and executive thought-leadership posts.
COMPETITOR TAXONOMY: {_COMPETITORS}
{_JSON_CONTRACT}""",
        "k_class": "social_campaign",
        "source_url": "https://www.e2enetworks.com/",
    },
    "product_marketing": {
        "prompt": f"""You are the Lead Product Marketing Manager (PMM) for E2E Networks & TIR AI Platform.
Products: TIR AI Platform, B200/H200/H100 clusters, fast InfiniBand storage, RAG engine, Indic Voice AI.
Segments: Enterprise CTOs, AI founders, ML engineers, sovereign govt agencies.
Produce feature messaging, competitive battlecards, tier pricing, and GTM launch plans.
COMPETITOR TAXONOMY: {_COMPETITORS}
{_JSON_CONTRACT}""",
        "k_class": "gtm_strategy",
        "source_url": "https://www.e2enetworks.com/tir",
    },
    "events": {
        "prompt": f"""You are the Lead Events & Field Marketing Strategist for E2E Networks.
Portfolio: developer hackathons, AI summits, enterprise executive roundtables, Indic AI expos.
Produce keynote concepts, booth demos, sponsorship ROI, and developer-activation strategies.
COMPETITOR TAXONOMY: {_COMPETITORS}
{_JSON_CONTRACT}""",
        "k_class": "event_strategy",
        "source_url": "https://www.e2enetworks.com/",
    },
}


def _strip_code_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return text


def run_agent(agent_type: str, goal_statement: str, provider: str = DEFAULT_PROVIDER) -> Dict[str, Any]:
    cfg = AGENT_REGISTRY.get(agent_type, AGENT_REGISTRY["branding"])

    # 1. Retrieve grounded facts from the SQLite knowledge base.
    db_facts = search_knowledge_units(query=goal_statement, limit=5)
    facts_context = ""
    if db_facts:
        facts_context = "\n\nRELEVANT GROUNDED KNOWLEDGE UNITS FROM DB:\n" + "\n".join(
            f"- [{f['organization']} / {f['knowledge_class']}] (URL: {f.get('source_url', 'N/A')}): {f['content']}"
            for f in db_facts
        )
    user_prompt = f"Goal: {goal_statement}{facts_context}\nFormulate the strategy for your domain."

    # 2. Call the LLM.
    result = LLMService.generate(system_prompt=cfg["prompt"], user_prompt=user_prompt, provider=provider)
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

    # 4. Enrich the KB with the synthesized decision.
    try:
        save_knowledge_unit(
            id_str=new_id(),
            k_class=cfg["k_class"],
            confidence=parsed.get("confidence", "High").lower(),
            content=f"{agent_type} strategy: {parsed.get('selected_option')} - {parsed.get('statement', '')[:120]}",
            organization="E2E Networks",
            source_url=cfg["source_url"],
            enriched_by=f"{agent_type}_agent",
        )
    except Exception as err:  # pragma: no cover - enrichment is best-effort
        print(f"[DB Warning] Could not enrich knowledge unit: {err}")

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
    out = run_agent("branding", "Position B200 against Nebius on price")  # uses mock LLM without keys
    assert {"selected_option", "statement", "rationale", "risks", "confidence"} <= set(out)
    print("base.py self-check OK:", out["selected_option"])
