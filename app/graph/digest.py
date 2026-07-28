"""
Milestone 5 — CMO Weekly Executive Digest.

A LangGraph fan-out/aggregate subgraph. Unlike the single-agent supervisor graph in
workflow.py (where routing is deterministic and only one agent runs), the digest is
real multi-agent work: all five agents read the same competitor evidence in parallel
and a synthesizer merges their briefs into one executive view.

    START -> load_facts -> [branding | pr | social | product_marketing | events]  (parallel)
                              -> synthesize -> END

`briefs` uses an operator.add reducer because the five workers write it concurrently.

Grounding rule: the LLM writes prose; **citations come from the database only**
(build_network / the `citations` payload). A synthesized sentence can never become a
cited source — that is what keeps the "100% grounded" claim honest.
"""

import json
import logging
import operator
from collections import defaultdict
from typing import TypedDict, List, Dict, Any, Annotated

from langgraph.graph import StateGraph, START, END

from app.agents.base import ACTIVE_AGENTS, DEFAULT_PROVIDER, run_agent, _strip_code_fence
from app.core.primitives import now_iso
from app.core.schemas import DigestSchema
from app.db.database import get_competitor_facts
from app.memory.graph import shared_sku_links
from app.services.llm_service import LLMService

log = logging.getLogger(__name__)

# What each agent is asked to look for in the competitor evidence.
_DIGEST_LENS = {
    "branding": "how rivals are positioning and differentiating their brand",
    "pr": "rival announcements, narrative shifts, and media posture",
    "social": "rival community, developer-advocacy and social traction signals",
    "product_marketing": "rival hardware fleets, pricing moves, and packaging",
    "events": "rival field presence, sponsorships, and developer activations",
}


def _facts_block(facts: List[Dict[str, Any]], limit: int = 40) -> str:
    return "\n".join(
        f"- [{f['organization']} / {f['knowledge_class']}] (URL: {f.get('source_url', 'N/A')}): {f['content'][:240]}"
        for f in facts[:limit]
    )


class DigestState(TypedDict, total=False):
    provider: str
    facts: List[Dict[str, Any]]
    briefs: Annotated[List[Dict[str, str]], operator.add]  # 5 parallel writers
    headline: str
    executive_summary: str
    competitor_movements: List[str]
    recommended_actions: List[str]


# --- Nodes -----------------------------------------------------------------------

def _load_facts(state: DigestState) -> Dict[str, Any]:
    """Competitor Movement Filter — rival facts only, internal E2E noise excluded."""
    facts = get_competitor_facts()
    log.info(f"[Digest] loaded {len(facts)} grounded competitor facts")
    return {"facts": facts}


def _make_digest_worker(agent_type: str):
    """Each agent reads the same evidence through its own domain lens, in parallel."""
    def worker(state: DigestState) -> Dict[str, Any]:
        lens = _DIGEST_LENS[agent_type]
        goal = (
            f"WEEKLY COMPETITOR DIGEST. Review only the competitor evidence below and report "
            f"{lens}. Focus exclusively on rival movements — do not describe E2E Networks' own "
            f"activity. Be specific and name the competitors you are drawing from."
        )
        parsed = run_agent(
            agent_type,
            goal,
            provider=state.get("provider", DEFAULT_PROVIDER),
            extra_context=_facts_block(state.get("facts", [])),
        )
        return {
            "briefs": [{
                "agent": agent_type,
                "headline": parsed.get("selected_option", ""),
                "finding": parsed.get("statement", ""),
                "rationale": parsed.get("rationale", ""),
                "risks": parsed.get("risks", ""),
                "confidence": parsed.get("confidence", "High"),
            }]
        }
    worker.__name__ = f"digest_{agent_type}"
    return worker


_SYNTH_PROMPT = """You are the Chief of Staff to the CMO of E2E Networks (NSE: E2E), an Indian
sovereign GPU cloud. Five specialist marketing agents each reviewed the same grounded competitor
evidence. Merge their briefs into ONE executive digest for a CMO who has 3 minutes.

Rules: competitors only (Yotta, Neysa, Nebius, CoreWeave, RunPod, Together AI, Lambda Labs,
Crusoe, Hyperstack, Voltage Park, VAST Data, Foundry). Do not invent numbers, dates or URLs —
use only what appears in the evidence. Name specific rivals in each movement.

Return valid JSON only:
{
  "headline": "one-line executive headline on the week's competitive picture",
  "executive_summary": "3-5 sentence cross-agent summary for the CMO",
  "competitor_movements": ["specific rival move, naming the competitor", "..."],
  "recommended_actions": ["concrete action E2E should take", "..."]
}"""


def _fallback_digest(state: DigestState) -> Dict[str, Any]:
    """Deterministic, fully grounded digest — used when the LLM is unavailable or off-contract.

    Built from DB facts and the agents' own briefs, so the digest degrades to something
    true rather than to something invented.
    """
    facts = state.get("facts", [])
    by_org: Dict[str, int] = defaultdict(int)
    for f in facts:
        by_org[f["organization"]] += 1
    ranked = sorted(by_org.items(), key=lambda kv: kv[1], reverse=True)
    return {
        "headline": f"{len(by_org)} rival platforms tracked across {len(facts)} grounded competitor facts",
        "executive_summary": (
            f"Cross-agent digest assembled from {len(state.get('briefs', []))} specialist briefs over "
            f"{len(facts)} sourced competitor facts. Deepest current coverage: "
            + ", ".join(f"{org} ({n})" for org, n in ranked[:5])
            + ". LLM synthesis was unavailable, so this summary is generated directly from the "
            "grounded knowledge base."
        ),
        "competitor_movements": [
            f"{org}: {n} tracked facts across pricing, hardware and positioning" for org, n in ranked[:6]
        ],
        "recommended_actions": [
            b["headline"] for b in state.get("briefs", []) if b.get("headline")
        ][:5],
    }


def _synthesize(state: DigestState) -> Dict[str, Any]:
    briefs = state.get("briefs", [])
    briefs_block = "\n\n".join(
        f"[{b['agent'].upper()} AGENT] {b['headline']}\nFinding: {b['finding']}\nRationale: {b['rationale']}"
        for b in briefs
    )
    user_prompt = (
        f"COMPETITOR EVIDENCE:\n{_facts_block(state.get('facts', []))}\n\n"
        f"SPECIALIST AGENT BRIEFS:\n{briefs_block}\n\nProduce the CMO digest."
    )
    try:
        result = LLMService.generate(
            system_prompt=_SYNTH_PROMPT,
            user_prompt=user_prompt,
            provider=state.get("provider", DEFAULT_PROVIDER),
            max_tokens=1600,
        )
        return DigestSchema(**json.loads(_strip_code_fence(result["text"]))).model_dump()
    except Exception as err:
        log.info(f"[Digest] falling back to grounded synthesis: {err}")
        return _fallback_digest(state)


def _build_digest_graph():
    builder = StateGraph(DigestState)
    builder.add_node("load_facts", _load_facts)
    builder.add_node("synthesize", _synthesize)
    builder.add_edge(START, "load_facts")
    for agent_type in ACTIVE_AGENTS:
        node = f"digest_{agent_type}"
        builder.add_node(node, _make_digest_worker(agent_type))
        builder.add_edge("load_facts", node)   # fan out (all active agents in one superstep)
        builder.add_edge(node, "synthesize")   # aggregate (waits for all of them)
    builder.add_edge("synthesize", END)
    return builder.compile()


_DIGEST_GRAPH = _build_digest_graph()


# --- Network map (pure DB projection — no LLM, therefore no hallucination) ----------

def build_network() -> Dict[str, Any]:
    """Node/link map for the CMO's interactive graph: E2E hub, one node per rival.

    Edge weight = number of grounded facts we hold on that rival. Each node carries its
    own citations so a click can show rate cards and sources.

    Rival<->rival edges are *derived*, not asserted: M9.4's corpus graph links two rivals
    only when both are recorded offering the same GPU SKU, and the link names the SKUs so
    the CMO can check it. Inventing a bare `competes_with` edge would have been exactly
    the fabrication this project is built to avoid — which is why it stayed hub-and-spoke
    until there was a real shared attribute to join on.
    """
    facts = get_competitor_facts()
    grouped: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for f in facts:
        grouped[f["organization"]].append(f)

    nodes = [{
        "id": "E2E Networks",
        "group": "us",
        "fact_count": 0,
        "citations": [],
    }]
    links = []
    for org, org_facts in sorted(grouped.items(), key=lambda kv: len(kv[1]), reverse=True):
        nodes.append({
            "id": org,
            "group": "competitor",
            "fact_count": len(org_facts),
            "classes": sorted({f["knowledge_class"] for f in org_facts}),
            "citations": [
                {
                    "knowledge_class": f["knowledge_class"],
                    "content": f["content"][:400],
                    "source_url": f["source_url"],
                }
                for f in org_facts
            ],
        })
        links.append({"source": "E2E Networks", "target": org, "weight": len(org_facts),
                      "kind": "hub"})

    known = {n["id"] for n in nodes}
    links += [
        {**link, "kind": "shared_sku"}
        for link in shared_sku_links()
        if link["source"] in known and link["target"] in known
    ]
    return {"nodes": nodes, "links": links, "total_facts": len(facts)}


def run_digest(provider: str = DEFAULT_PROVIDER) -> Dict[str, Any]:
    """Public entry point for POST /api/digest."""
    final = _DIGEST_GRAPH.invoke({"provider": provider, "briefs": []})
    network = build_network()
    return {
        "success": True,
        "generated_at": now_iso(),
        "provider": provider,
        "headline": final.get("headline", ""),
        "executive_summary": final.get("executive_summary", ""),
        "competitor_movements": final.get("competitor_movements", []),
        "recommended_actions": final.get("recommended_actions", []),
        "agent_briefs": sorted(final.get("briefs", []), key=lambda b: b["agent"]),
        "network": network,
        # Citations are DB rows, never model output — this is the grounding guarantee.
        "citations": [
            {"organization": n["id"], "knowledge_class": c["knowledge_class"], "source_url": c["source_url"]}
            for n in network["nodes"] if n["group"] == "competitor"
            for c in n["citations"]
        ],
    }


if __name__ == "__main__":
    # ponytail self-check: all five agents fan out, digest is populated, nothing cites E2E.
    out = run_digest()
    assert len(out["agent_briefs"]) == 5, out["agent_briefs"]
    assert out["headline"] and out["executive_summary"]
    assert out["network"]["total_facts"] > 0
    assert all("E2E" not in c["organization"] for c in out["citations"])
    print("digest.py self-check OK:", out["headline"])
