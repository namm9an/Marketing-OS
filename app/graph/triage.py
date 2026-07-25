"""
The /triage bridge (Phase 9, M9.5) — design_doc.md §9.7.

    /triage branding pr   How do we answer the Nebius price cut?

    START -> prepare -> { view_a || view_b } -> merge -> remember -> END

Two agents answer one question together **without either one's memory touching the
other's**. Each reasons privately first — its own namespace plus the shared corpus, via
the same `recall_for()` the solo chat path uses — and the bridge merges the two *views*,
not the two memories.

The load-bearing decision is where the turn is written. It goes to `triage:branding+pr`
and to nowhere else. Writing back into both private namespaces would look helpful and
would re-create precisely the cross-contamination /triage exists to prevent, just delayed
by one turn: branding's memory would start containing PR's reasoning, and every later
solo branding answer would be built on it. The pair accumulates its own shared history
instead, which both members can read (`readable_namespaces` admits a joint namespace to
its members only) and no one else can.

Note what this means in practice: over time a pair gets better *as a pair* without either
agent's private voice drifting toward the other's.

> supermemory's v4 API has the same shape — it cannot query across containers in one
> request; you query separately and merge in application logic.

ponytail: exactly two agents. The merge prompt attributes two named positions and the
namespace algebra sorts two members; an n-way bridge is a different product decision
(who arbitrates disagreement?), not a loop bound to raise.
"""

import json
import logging
import operator
from typing import Annotated, Any, Dict, List, Optional, TypedDict

from langgraph.graph import StateGraph, START, END

from app.agents.base import AGENT_REGISTRY, DEFAULT_PROVIDER, _strip_code_fence
from app.graph.chat import _facts_block, _memory_block, recall_for
from app.memory import gate, store
from app.services.llm_service import LLMService

log = logging.getLogger(__name__)

_VIEW_CONTRACT = """
You are one of TWO specialists answering the CMO of E2E Networks together. Give YOUR
discipline's view only — the other specialist covers theirs, and a bridge will merge the two.

Reply in plain prose, 2-4 sentences. Lead with your actual position, not a preamble.

GROUNDED FACTS are crawled competitor intelligence with real source URLs; name the
organisation when you use one and never invent a price, date, number or URL. REMEMBERED
NOTES are standing instructions this CMO gave you earlier — follow them, but do not cite
them as evidence. If you would need something neither gives you, say so.
"""

_MERGE_PROMPT = """You are the Chief of Staff to the CMO of E2E Networks (NSE: E2E), an Indian
sovereign GPU cloud. Two specialist agents answered the same question independently. Merge
their views into ONE answer the CMO can act on.

Rules:
- Attribute. Every substantive point must be traceable to the agent who made it.
- Where they disagree, say so plainly and name the trade-off. Do not average them into mush;
  a real disagreement between two specialists is information the CMO needs.
- Add no new facts, numbers, dates or URLs. You are merging, not researching.

Return valid JSON only:
{
  "answer": "3-6 sentence merged answer for the CMO, attributing points to the agents by name",
  "agreements": ["point both agents support"],
  "tensions": ["where the two views pull against each other, and the trade-off"],
  "recommended_action": "the single next step"
}"""


class TriageState(TypedDict, total=False):
    agents: List[str]                                     # exactly two, order as asked
    namespace: str                                        # triage:a+b — the ONLY write target
    thread_id: str
    message: str
    provider: str
    user_turn_id: str
    views: Annotated[List[Dict[str, Any]], operator.add]  # 2 parallel writers
    merged: Dict[str, Any]
    memory_verdict: Dict[str, Any]


# --- Nodes --------------------------------------------------------------------------

def _prepare(state: TriageState) -> Dict[str, Any]:
    """Record the question once, before the fan-out.

    In solo chat the recall node writes the user turn; here recall runs twice in parallel,
    so it has to happen upstream or the transcript would double.
    """
    return {"user_turn_id": store.add_turn(state["thread_id"], "user", state["message"])}


def _make_view_worker(index: int):
    """One agent reasoning privately. `index` picks which of the pair this node is."""
    def worker(state: TriageState) -> Dict[str, Any]:
        agent_type = state["agents"][index]
        message = state["message"]
        recall = recall_for(agent_type, message)

        result = LLMService.generate(
            system_prompt=AGENT_REGISTRY[agent_type]["persona"] + _VIEW_CONTRACT,
            user_prompt=(
                f"{_memory_block(recall['memories'])}\n\n"
                f"{_facts_block(recall['facts'])}\n\n"
                f"The CMO asks: {message}"
            ),
            provider=state.get("provider", DEFAULT_PROVIDER),
            temperature=0.5,
            max_tokens=700,
        )
        if result.get("model_used", "").endswith("fallback"):
            view = (
                f"[{agent_type}] working from {len(recall['facts'])} sourced fact(s) and "
                f"{len(recall['memories'])} remembered note(s); LLM synthesis unavailable."
            )
        else:
            view = result["text"].strip()

        return {"views": [{
            "agent": agent_type,
            "view": view,
            # Visible recall, per agent — the CMO can see the two were briefed differently.
            "recall": {
                "memories": [
                    {"id": m["id"], "tier": m["tier"], "namespace": m["namespace"],
                     "content": m["content"]}
                    for m in recall["memories"]
                ],
                "facts": [
                    {"organization": f["organization"], "knowledge_class": f["knowledge_class"],
                     "content": f["content"][:300], "source_url": f.get("source_url")}
                    for f in recall["facts"]
                ],
                "graph": recall["graph_paths"],
            },
        }]}
    worker.__name__ = f"view_{index}"
    return worker


def _fallback_merge(views: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Degrade to something true: both views verbatim and attributed, merged by nobody.

    Same principle as the M5 digest fallback — losing the synthesis is acceptable, losing
    the attribution or inventing a consensus is not.
    """
    named = [v["agent"] for v in views]
    return {
        "answer": " ".join(f"{v['agent'].upper()}: {v['view']}" for v in views),
        "agreements": [],
        "tensions": [],
        "recommended_action": (
            f"Merged synthesis was unavailable — the {' and '.join(named)} views above are "
            f"unedited and attributed, so they can be reconciled by hand."
        ),
    }


def _merge(state: TriageState) -> Dict[str, Any]:
    """Merge the two VIEWS. The two memories never meet — only their conclusions do."""
    views = sorted(state.get("views", []), key=lambda v: state["agents"].index(v["agent"]))
    block = "\n\n".join(f"[{v['agent'].upper()} AGENT]\n{v['view']}" for v in views)
    try:
        result = LLMService.generate(
            system_prompt=_MERGE_PROMPT,
            user_prompt=f"The CMO asked: {state['message']}\n\nTHE TWO VIEWS:\n{block}\n\nMerge them.",
            provider=state.get("provider", DEFAULT_PROVIDER),
            max_tokens=1200,
        )
        merged = json.loads(_strip_code_fence(result["text"]))
        if not isinstance(merged.get("answer"), str) or not merged["answer"].strip():
            raise ValueError("merge returned no answer")
        return {"merged": {
            "answer": merged["answer"],
            "agreements": list(merged.get("agreements") or []),
            "tensions": list(merged.get("tensions") or []),
            "recommended_action": merged.get("recommended_action", ""),
        }}
    except Exception as err:
        log.info(f"[Triage] falling back to unmerged attributed views: {err}")
        return {"merged": _fallback_merge(views)}


def _remember(state: TriageState) -> Dict[str, Any]:
    """Write the turn to the JOINT namespace and nowhere else. §9.7 step 4.

    `state["namespace"]` is always triage:a+b — the private namespaces are not written to
    here, and there is deliberately no code path that would.
    """
    store.add_turn(
        state["thread_id"], "agent", state["merged"]["answer"],
        recalled_ids=[m["id"] for v in state.get("views", []) for m in v["recall"]["memories"]],
    )
    verdict = gate.admit(
        state["namespace"], "user", state["message"], turn_id=state.get("user_turn_id", "")
    )
    return {"memory_verdict": verdict}


def _build_triage_graph():
    builder = StateGraph(TriageState)
    builder.add_node("prepare", _prepare)
    builder.add_node("merge", _merge)
    builder.add_node("remember", _remember)
    builder.add_edge(START, "prepare")
    for index in (0, 1):
        node = f"view_{index}"
        builder.add_node(node, _make_view_worker(index))
        builder.add_edge("prepare", node)   # fan out — both run in one superstep
        builder.add_edge(node, "merge")     # aggregate — merge waits for both
    builder.add_edge("merge", "remember")
    builder.add_edge("remember", END)
    return builder.compile()


_TRIAGE_GRAPH = _build_triage_graph()


# --- Public entry point -------------------------------------------------------------

def run_triage(
    agents: List[str],
    message: str,
    thread_id: Optional[str] = None,
    provider: str = DEFAULT_PROVIDER,
) -> Dict[str, Any]:
    """One /triage turn across exactly two agents."""
    agents = [a.strip() for a in (agents or []) if a and a.strip()]
    if len(agents) != 2 or agents[0] == agents[1]:
        raise ValueError("/triage needs exactly two different agents")
    for agent in agents:
        if agent not in AGENT_REGISTRY:
            raise ValueError(f"unknown agent: {agent!r}")
    if not (message or "").strip():
        raise ValueError("message is required")

    namespace = store.triage_ns(*agents)
    if thread_id:
        thread = store.get_thread(thread_id)
        if thread is None:
            raise ValueError(f"unknown thread: {thread_id!r}")
        # A thread belongs to one pair. Continuing it under a different pair would file
        # one pair's history in another's namespace.
        if thread["namespace"] != namespace:
            raise ValueError(f"thread {thread_id!r} belongs to {thread['namespace']!r}")
    else:
        thread_id = store.create_thread(namespace, title=message.strip()[:80])

    final = _TRIAGE_GRAPH.invoke({
        "agents": agents,
        "namespace": namespace,
        "thread_id": thread_id,
        "message": message.strip(),
        "provider": provider,
    })

    merged = final.get("merged", {})
    return {
        "success": True,
        "agents": agents,
        "namespace": namespace,
        "thread_id": thread_id,
        "answer": merged.get("answer", ""),
        "agreements": merged.get("agreements", []),
        "tensions": merged.get("tensions", []),
        "recommended_action": merged.get("recommended_action", ""),
        # Each agent's own view and its own recall, kept separate and attributed.
        "views": sorted(final.get("views", []), key=lambda v: agents.index(v["agent"])),
        "memory": final.get("memory_verdict", {}),
    }


if __name__ == "__main__":
    # ponytail self-check: the joint turn is written to the pair, and to neither private side.
    import tempfile
    from pathlib import Path
    from app.core.config import settings
    from app.db import database

    _tmp = tempfile.TemporaryDirectory()
    settings.DB_PATH = Path(_tmp.name) / "triage_selfcheck.db"
    database.init_db(force=True)

    res = run_triage(["pr", "branding"], "never concede on price when Nebius cuts rates")
    assert res["namespace"] == "triage:branding+pr", res["namespace"]   # sorted, not as asked
    assert [v["agent"] for v in res["views"]] == ["pr", "branding"]     # attributed, as asked
    assert store.list_memories("triage:branding+pr"), "joint memory not written"
    assert not store.list_memories(store.agent_ns("branding")), "leaked into branding"
    assert not store.list_memories(store.agent_ns("pr")), "leaked into pr"
    print("triage.py self-check OK:", res["answer"][:90])
