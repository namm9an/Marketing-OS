"""
Per-agent conversation layer (Phase 9, M9.3) — design_doc.md §9.8.

Until now `/api/run` was a stateless one-shot: a form in, one JSON verdict out, and
`SwarmState.messages` was initialised to `[]` and never written. This is the layer that
makes "click an agent and talk to *that* agent and its memory" true.

    START -> recall -> respond -> remember -> END

- **recall** loads the thread's prior turns, then retrieves from two clearly separated
  sources: the agent's own memory scope (shared ∪ own private ∪ own joint — never
  another agent's) and the grounded corpus (crawler-sourced rows only).
- **respond** answers in prose as that agent's persona.
- **remember** persists the agent turn and runs the user's message past the promotion
  gate. The reply is not a candidate for memory; only the user's message is.

Recall is **visible**: every reply reports which memories and which sourced facts it
drew on. That follows Claude's memory design (explicit, inspectable recall) over
ChatGPT's silent always-on injection — for a product whose output a CMO has to defend,
being able to see where a recommendation came from is a governance feature, and it is
consistent with the escalation gate already in the supervisor graph.

ponytail: a three-node linear graph rather than a plain function, for two concrete
reasons — each node becomes its own span in LangSmith/LangFuse (the observability the
Option 1 migration was for, and chat is where the agents will actually be used), and
M9.5's /triage bridge fans these same nodes out across two agents.
"""

import logging
from typing import TypedDict, List, Dict, Any, Optional, Tuple

from langgraph.graph import StateGraph, START, END

from app.core.config import settings
from app.core.primitives import new_id
from app.agents.base import AGENT_REGISTRY, DEFAULT_PROVIDER
from app.db.database import search_knowledge_units, save_decision
from app.memory import gate, graph, store
from app.services.llm_service import LLMService

log = logging.getLogger(__name__)

# Risk phrases that force human (CMO) ratification regardless of confidence.
_HIGH_RISK_TERMS = ("legal", "lawsuit", "compliance breach", "misleading", "defamation", "price war")

_HISTORY_TURNS = 12   # ponytail: fixed window. Summarise older turns only if threads get long.
_MEMORY_RECALL = 6
_FACT_RECALL = 5
_GRAPH_RECALL = 3     # extra memories reached by traversal rather than by keyword
_GRAPH_DEPTH = 2      # memory -> entity -> related entity -> memory

_CHAT_CONTRACT = f"""
You are in a live conversation with the CMO of {settings.TARGET_ORGANIZATION}. Reply in plain prose — no JSON,
no headings, no bullet lists unless you are asked for one. Be direct and specific; two to five
sentences unless the question genuinely needs more.

Your context comes from two sources and they are NOT equal:
- GROUNDED FACTS are crawled competitor intelligence carrying real source URLs. Name the
  organisation when you use one. Never invent a price, date, number or URL that is not there.
- REMEMBERED NOTES are things this CMO told you in earlier sessions. They are standing
  instructions about how to work — not facts about the world, and not to be cited as evidence.

If neither gives you what you need, say so plainly instead of filling the gap.
"""


class ChatState(TypedDict, total=False):
    agent_type: str
    namespace: str       # where memory is WRITTEN (agent:x for solo, triage:a+b in M9.5)
    thread_id: str
    message: str
    provider: str
    api_key: Optional[str]
    client_ip: Optional[str]
    request_id: Optional[str]
    notice: Optional[str]
    user_turn_id: str
    history: List[Dict[str, Any]]
    memories: List[Dict[str, Any]]
    facts: List[Dict[str, Any]]
    graph_paths: List[Dict[str, Any]]
    reply: str
    memory_verdict: Dict[str, Any]
    confidence: str
    risks: str
    escalated: bool
    escalation_reason: Optional[str]
    decision_id: str


# --- Context blocks ---------------------------------------------------------------

def _memory_block(memories: List[Dict[str, Any]]) -> str:
    if not memories:
        return "REMEMBERED NOTES: none yet — this is an early session."
    return "REMEMBERED NOTES (standing instructions from the CMO):\n" + "\n".join(
        f"- [{m['tier']}] {m['content']}" for m in memories
    )


def _facts_block(facts: List[Dict[str, Any]]) -> str:
    if not facts:
        return "GROUNDED FACTS: none matched this question."
    return "GROUNDED FACTS (crawled, sourced):\n" + "\n".join(
        f"- [{f['organization']}] (URL: {f.get('source_url') or 'N/A'}): {f['content'][:300]}"
        for f in facts
    )


def _condense_older_turns(turns: List[Dict[str, Any]], max_chars: int = 2000) -> str:
    """Condense historical turns into a bounded concise background context summary."""
    condensed_items = []
    for idx, t in enumerate(turns, start=1):
        turn_num = t.get("turn_number", idx)
        role_label = "CMO" if t.get("role") == "user" else "YOU"
        content = (t.get("content") or "").strip().replace("\n", " ")
        if len(content) > 150:
            content = content[:147] + "..."
        condensed_items.append(f"Turn {turn_num} [{role_label}]: {content}")
    joined = "\n".join(condensed_items)
    if len(joined) > max_chars and len(condensed_items) > 15:
        head = "\n".join(condensed_items[:5])
        tail = "\n".join(condensed_items[-10:])
        omitted = len(condensed_items) - 15
        joined = f"{head}\n... [{omitted} older turns omitted for brevity] ...\n{tail}"
    return joined


def _history_block(history: List[Dict[str, Any]]) -> str:
    if not history:
        return ""
    if len(history) <= _HISTORY_TURNS:
        lines = "\n".join(
            f"{'CMO' if t.get('role') == 'user' else 'YOU'}: {t.get('content', '')}" for t in history
        )
        return f"\nCONVERSATION SO FAR:\n{lines}\n"

    # History exceeds 12 turns: partition into older turns (1..N-12) and active window (N-11..N)
    older_turns = history[:-_HISTORY_TURNS]
    active_turns = history[-_HISTORY_TURNS:]

    first_turn_num = older_turns[0].get("turn_number", 1)
    last_turn_num = older_turns[-1].get("turn_number", len(older_turns))

    condensed_summary = _condense_older_turns(older_turns)
    bg_block = (
        f"<background_context>\n"
        f"Summary of prior conversation (Turns {first_turn_num} to {last_turn_num}):\n"
        f"{condensed_summary}\n"
        f"</background_context>"
    )
    active_lines = "\n".join(
        f"{'CMO' if t.get('role') == 'user' else 'YOU'}: {t.get('content', '')}" for t in active_turns
    )
    return f"\n{bg_block}\n\nACTIVE CONVERSATION (Recent 12 turns):\n{active_lines}\n"


# --- Nodes ------------------------------------------------------------------------

def recall_for(agent_type: str, message: str) -> Dict[str, Any]:
    """What one agent may draw on for one message: its own scope, and nothing else.

    Shared with the /triage bridge (M9.5), where each agent reasons privately before the
    merge. Keeping it in one function means "shared ∪ own private ∪ own joint" is decided
    once — a second copy of this scoping logic is exactly how the two would drift apart.
    """
    scope = store.readable_namespaces(agent_type)
    memories = store.search_memories(scope, message, limit=_MEMORY_RECALL)

    # M9.4: keyword recall only finds notes that share wording with the question. The
    # graph finds notes that share *subject matter* — "developer-first tone on H100
    # posts" surfaces for a question about Nebius, because the corpus knows Nebius
    # offers H100. Same scope, so this widens recall without widening access.
    hop = graph.recall_by_graph(scope, message, depth=_GRAPH_DEPTH, limit=_GRAPH_RECALL)
    known = {m["id"] for m in memories}
    extra = [m for m in hop["memory_ids"] if m not in known]
    memories += store.get_memories(extra, scope)
    paths = [p for p in hop["paths"] if p["memory_id"] in set(extra)]

    facts = search_knowledge_units(query=message, limit=_FACT_RECALL, sourced_only=True)
    log.info(f"[Recall/{agent_type}] {len(memories)} memories ({len(extra)} via graph), "
             f"{len(facts)} facts")
    return {"memories": memories, "facts": facts, "graph_paths": paths}


def _recall(state: ChatState) -> Dict[str, Any]:
    """Load history, persist the user's turn, and retrieve from memory + corpus.

    The user turn is written here so the promotion gate has a real turn id to record as
    provenance, and so a failure further down the graph still leaves the question on record.
    """
    history = store.get_turns(state["thread_id"])
    user_turn_id = store.add_turn(state["thread_id"], "user", state["message"])
    return {
        "history": history,
        "user_turn_id": user_turn_id,
        **recall_for(state["agent_type"], state["message"]),
    }


def _fallback_reply(state: ChatState) -> str:
    """Deterministic grounded reply for when the LLM is unavailable.

    Same principle as the M5 digest fallback: degrade to something true, assembled from
    the database, rather than to something invented.
    """
    facts, memories = state.get("facts", []), state.get("memories", [])
    parts = [
        f"On \"{state['message'][:120]}\" I can work from "
        f"{len(facts)} sourced fact(s) and {len(memories)} remembered note(s)."
    ]
    if facts:
        parts.append("Grounded: " + "; ".join(
            f"{f['organization']} — {f['content'][:140]}" for f in facts[:3]
        ))
    if memories:
        parts.append("Remembered: " + "; ".join(m["content"][:120] for m in memories[:3]))
    parts.append("(LLM synthesis is unavailable, so this is assembled directly from the "
                 "knowledge base rather than written.)")
    return " ".join(parts)


def _respond(state: ChatState) -> Dict[str, Any]:
    agent_type = state["agent_type"]
    persona = AGENT_REGISTRY[agent_type]["persona"]
    user_prompt = (
        f"{_memory_block(state.get('memories', []))}\n\n"
        f"{_facts_block(state.get('facts', []))}\n"
        f"{_history_block(state.get('history', []))}\n"
        f"CMO's message: {state['message']}"
    )
    try:
        result = LLMService.generate(
            system_prompt=persona + _CHAT_CONTRACT,
            user_prompt=user_prompt,
            provider=state.get("provider", DEFAULT_PROVIDER),
            api_key=state.get("api_key"),
            client_ip=state.get("client_ip"),
            request_id=state.get("request_id"),
            temperature=0.5,
            max_tokens=900,
        )
        notice = result.get("notice")
        if result.get("model_used", "").endswith("fallback"):
            resp = {"reply": _fallback_reply(state), "confidence": "High"}
            if notice:
                resp["notice"] = notice
            return resp
        resp = {"reply": result["text"].strip(), "confidence": "High"}
        if notice:
            resp["notice"] = notice
        return resp
    except Exception as err:
        if settings.GEMINI_API_KEY or state.get("api_key") or "quota reached" in str(err).lower():
            raise
        log.warning(f"[Chat/{agent_type}] worker error, generating fallback reply: {err}")
        return {"reply": _fallback_reply(state), "confidence": "Low"}


def _remember(state: ChatState) -> Dict[str, Any]:
    """Persist the agent turn, then run the CMO's message past the promotion gate.

    Note the asymmetry, and that it is the whole point: the agent's own reply is written
    to the transcript but is never a candidate for memory.
    """
    store.add_turn(
        state["thread_id"], "agent", state["reply"],
        recalled_ids=[m["id"] for m in state.get("memories", [])],
    )
    verdict = gate.admit(
        state["namespace"], "user", state["message"], turn_id=state.get("user_turn_id", "")
    )
    return {"memory_verdict": verdict}


def _governance_check(confidence: str, message: str, reply: str, risks: str = "") -> Tuple[bool, Optional[str]]:
    """Human-in-the-loop gate: escalate low-confidence or high-risk chat decisions to the CMO."""
    scan_text = f"{message} {reply} {risks}".lower()
    for term in _HIGH_RISK_TERMS:
        if term in scan_text:
            return True, f"High-risk factor detected ('{term}') — requires CMO ratification."
    if (confidence or "").strip().lower() == "low":
        return True, "Low decision confidence — requires CMO ratification."
    return False, None


def _governance(state: ChatState) -> Dict[str, Any]:
    """CMO governance gate + decision persistence for chat."""
    confidence = state.get("confidence", "High")
    risks = state.get("risks", "")
    message = state.get("message", "")
    reply = state.get("reply", "")
    escalated, reason = _governance_check(confidence, message, reply, risks)
    record_id = new_id()
    agent_type = state.get("agent_type", "branding")
    source = f"langgraph:chat:{agent_type}:{state.get('provider', DEFAULT_PROVIDER)}"
    try:
        save_decision(
            decision_id=record_id,
            goal_statement=message,
            selected_option=f"Chat Turn ({agent_type})",
            confidence=confidence,
            escalated=escalated,
            reasoning_source=source,
            rationale=reply[:500] if reply else f"Chat consultation with {agent_type}",
            risks=reason or risks or "None identified",
        )
    except Exception as db_err:  # pragma: no cover
        log.warning(f"[DB Warning] Could not persist chat decision: {db_err}")
    return {
        "escalated": escalated,
        "escalation_reason": reason,
        "decision_id": record_id,
        "confidence": confidence,
        "risks": risks,
    }


def _build_chat_graph():
    builder = StateGraph(ChatState)
    builder.add_node("recall", _recall)
    builder.add_node("respond", _respond)
    builder.add_node("governance", _governance)
    builder.add_node("remember", _remember)
    builder.add_edge(START, "recall")
    builder.add_edge("recall", "respond")
    builder.add_edge("respond", "governance")
    builder.add_edge("governance", "remember")
    builder.add_edge("remember", END)
    return builder.compile()


_CHAT_GRAPH = _build_chat_graph()


# --- Public entry point -----------------------------------------------------------

def run_chat(
    agent_type: str,
    message: str,
    thread_id: Optional[str] = None,
    provider: str = DEFAULT_PROVIDER,
    namespace: Optional[str] = None,
    api_key: Optional[str] = None,
    client_ip: Optional[str] = None,
    request_id: Optional[str] = None,
) -> Dict[str, Any]:
    """One conversational turn with one agent. Creates the thread on first message."""
    if agent_type not in AGENT_REGISTRY:
        raise ValueError(f"unknown agent: {agent_type!r}")
    if not (message or "").strip():
        raise ValueError("message is required")

    namespace = namespace or store.agent_ns(agent_type)
    if thread_id and store.get_thread(thread_id) is None:
        raise ValueError(f"unknown thread: {thread_id!r}")
    if not thread_id:
        thread_id = store.create_thread(namespace, title=message.strip()[:80])

    final = _CHAT_GRAPH.invoke({
        "agent_type": agent_type,
        "namespace": namespace,
        "thread_id": thread_id,
        "message": message.strip(),
        "provider": provider,
        "api_key": api_key,
        "client_ip": client_ip,
        "request_id": request_id,
    })

    res = {
        "success": True,
        "agent": agent_type,
        "namespace": namespace,
        "thread_id": thread_id,
        "reply": final.get("reply", ""),
        # Visible recall: what this answer was actually built from.
        "recall": {
            "memories": [
                {"id": m["id"], "tier": m["tier"], "namespace": m["namespace"], "content": m["content"]}
                for m in final.get("memories", [])
            ],
            "facts": [
                {"organization": f["organization"], "knowledge_class": f["knowledge_class"],
                 "content": f["content"][:300], "source_url": f.get("source_url")}
                for f in final.get("facts", [])
            ],
            # How the graph reached what keyword search would have missed. A readable
            # path ("Nebius > H100 > mem:...") is auditable in a way a score is not.
            "graph": final.get("graph_paths", []),
        },
        # What the turn taught the agent, and why — shown rather than done silently.
        "memory": final.get("memory_verdict", {}),
        "governance": {
            "escalated": final.get("escalated", False),
            "escalation_reason": final.get("escalation_reason"),
            "decision_id": final.get("decision_id"),
        },
        "escalated": final.get("escalated", False),
        "escalation_reason": final.get("escalation_reason"),
        "decision_id": final.get("decision_id"),
    }
    if final.get("notice"):
        res["notice"] = final["notice"]
    return res


if __name__ == "__main__":
    # ponytail self-check: memory survives across turns, and only the CMO's words become memory.
    import tempfile
    from pathlib import Path
    from app.core.config import settings
    from app.db import database

    _tmp = tempfile.TemporaryDirectory()
    settings.DB_PATH = Path(_tmp.name) / "chat_selfcheck.db"
    database.init_db(force=True)

    first = run_chat("branding", "never frame our B200 pricing as a price war")
    assert first["memory"]["admitted"] and first["memory"]["category"] == "correction", first

    second = run_chat("branding", "how should we answer the Nebius price cut?",
                      thread_id=first["thread_id"])
    assert any("price war" in m["content"] for m in second["recall"]["memories"]), second["recall"]

    # The PR agent must not see any of it.
    other = run_chat("pr", "how should we answer the Nebius price cut?")
    assert not any("price war" in m["content"] for m in other["recall"]["memories"]), other
    print("chat.py self-check OK:", second["reply"][:90])
