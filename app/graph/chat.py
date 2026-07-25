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
from typing import TypedDict, List, Dict, Any, Optional

from langgraph.graph import StateGraph, START, END

from app.agents.base import AGENT_REGISTRY, DEFAULT_PROVIDER
from app.db.database import search_knowledge_units
from app.memory import gate, store
from app.services.llm_service import LLMService

log = logging.getLogger(__name__)

_HISTORY_TURNS = 12   # ponytail: fixed window. Summarise older turns only if threads get long.
_MEMORY_RECALL = 6
_FACT_RECALL = 5

_CHAT_CONTRACT = """
You are in a live conversation with the CMO of E2E Networks. Reply in plain prose — no JSON,
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
    user_turn_id: str
    history: List[Dict[str, Any]]
    memories: List[Dict[str, Any]]
    facts: List[Dict[str, Any]]
    reply: str
    memory_verdict: Dict[str, Any]


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


def _history_block(history: List[Dict[str, Any]]) -> str:
    if not history:
        return ""
    recent = history[-_HISTORY_TURNS:]
    lines = "\n".join(
        f"{'CMO' if t['role'] == 'user' else 'YOU'}: {t['content']}" for t in recent
    )
    return f"\nCONVERSATION SO FAR:\n{lines}\n"


# --- Nodes ------------------------------------------------------------------------

def _recall(state: ChatState) -> Dict[str, Any]:
    """Load history, persist the user's turn, and retrieve from memory + corpus.

    The user turn is written here so the promotion gate has a real turn id to record as
    provenance, and so a failure further down the graph still leaves the question on record.
    """
    agent_type = state["agent_type"]
    message = state["message"]
    history = store.get_turns(state["thread_id"])
    user_turn_id = store.add_turn(state["thread_id"], "user", message)

    scope = store.readable_namespaces(agent_type)
    memories = store.search_memories(scope, message, limit=_MEMORY_RECALL)
    facts = search_knowledge_units(query=message, limit=_FACT_RECALL, sourced_only=True)
    log.info(f"[Chat/{agent_type}] recalled {len(memories)} memories, {len(facts)} facts")
    return {"history": history, "user_turn_id": user_turn_id, "memories": memories, "facts": facts}


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
    result = LLMService.generate(
        system_prompt=persona + _CHAT_CONTRACT,
        user_prompt=user_prompt,
        provider=state.get("provider", DEFAULT_PROVIDER),
        temperature=0.5,
        max_tokens=900,
    )
    if result.get("model_used", "").endswith("fallback"):
        return {"reply": _fallback_reply(state)}
    return {"reply": result["text"].strip()}


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


def _build_chat_graph():
    builder = StateGraph(ChatState)
    builder.add_node("recall", _recall)
    builder.add_node("respond", _respond)
    builder.add_node("remember", _remember)
    builder.add_edge(START, "recall")
    builder.add_edge("recall", "respond")
    builder.add_edge("respond", "remember")
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
    })

    return {
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
        },
        # What the turn taught the agent, and why — shown rather than done silently.
        "memory": final.get("memory_verdict", {}),
    }


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
