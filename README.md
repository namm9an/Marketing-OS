# Marketing OS

Governed multi-agent competitive intelligence for the neo-cloud GPU market.

Five marketing specialists reason over a crawled, source-attributed corpus of the neo-cloud GPU market. Each keeps its own private memory, all of them share the grounded corpus, and any two can be bridged onto a single question without their memories mixing.

---

## Design principles

**Grounded, not generative.** Every competitor fact carries the `source_url` of the page it came from. Retrieval excludes agent-written rows, so a model's own earlier prose can never return as evidence for a later answer.

**Isolation by default.** An agent reads the shared corpus, its own namespace, and any joint namespace it belongs to — nothing else. Membership is matched exactly rather than by substring, so `agent:pr` can never be handed `triage:product_marketing+social`.

**Merge the answers, not the memories.** `/api/triage` puts two agents on one question. They reason independently, and only their conclusions are merged. The joint turn is written to the pair's namespace and to neither private one, so a pair improves as a pair without either agent's voice drifting toward the other's.

**Deterministic where correctness matters.** Corpus graph edges are derived from a fixed entity taxonomy, never inferred by a model. A fabricated edge is worse than a missing one, because a traversal path looks like evidence.

**Escalate rather than assume.** Low-confidence or high-risk positioning is flagged for CMO ratification instead of being returned as settled.

---

## Architecture

```
app/
├── main.py         Flask entrypoint — REST API and SPA host
├── core/           Settings, Pydantic schemas, id primitives
├── agents/         Agent registry and the five personas
├── graph/          LangGraph: supervisor workflow, chat, triage, digest
├── memory/         Namespace store, promotion gate, corpus graph
├── db/             SQLite layer (WAL) and the grounded seeder
└── services/       LLM factory, LangFuse tracing
frontend/           React 18 + Vite SPA
tests/              Unit and integration suites
```

Knowledge is layered, and the boundaries between layers are the product:

| Layer | Contents | Written by |
|---|---|---|
| **L0** Grounded corpus | Competitor facts, every row carrying a `source_url` | The crawler and seeder only — read-only to agents |
| **L0.5** Corpus graph | Entity edges (`offers`, `prices`) over the corpus | Deterministic extraction from a fixed taxonomy |
| **L1** Private memory | One namespace per agent | The promotion gate, from that agent's own conversations |
| **L2** Joint memory | One namespace per agent pair | `/api/triage`, readable by the pair's members only |

The **promotion gate** decides what is allowed to become memory at all. User corrections, stated preferences and ratified decisions are admitted; model prose and unsourced claims are discarded, which is what keeps a self-referential memory loop from forming.

The five specialists are **Branding**, **PR**, **Social**, **Product Marketing** and **Field Events**. All five are addressable through the chat and triage endpoints, and the weekly digest fans out across all specialists.

---

## Benchmarks & Evaluations

### Agent Trajectory Evaluation (Anthropic Frontier Standard)
Evaluated across 40 class-balanced scenarios (20 Governance + 20 Memory Gate) with 3 trials each (k=3).

| Evaluation Suite | Scenarios | pass@1 | pass@3 | pass^3 (Target >= 0.95) | Status |
|---|:---:|:---:|:---:|:---:|:---:|
| Governance Escalation | 20 | 1.0000 | 1.0000 | 1.0000 | PASS |
| Memory Promotion Gate | 20 | 1.0000 | 1.0000 | 1.0000 | PASS |
| **Combined Trajectory** | **40** | **1.0000** | **1.0000** | **1.0000** | **PASS** |

### Retrieval Benchmark (SQLite FTS5 BM25 + Taxonomy Expansion)
Evaluated across 34 gold queries (22 lexical, 12 paraphrase queries).

| Metric | Baseline FTS5 | FTS5 + Taxonomy Expansion | Delta |
|---|:---:|:---:|:---:|
| Overall Recall@5 | 0.726 | 0.943 | +21.7% |
| Paraphrase Recall@5 | 0.283 | 0.900 | +61.7% |
| Lexical Recall@5 | 0.967 | 0.967 | — |
| Mean Reciprocal Rank (MRR) | 0.771 | 0.985 | +0.214 |
| Zero-Hit Queries | 5 | 0 | -5 |

---

## API

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/run` | One-shot structured agent run, through governance review |
| `POST` | `/api/chat` | Multi-turn conversation with one agent, returning its recall |
| `GET` | `/api/chat/threads` | Threads in a namespace (`?agent=` or `?agents=a,b`) |
| `GET` | `/api/chat/thread/<id>` | Turns in one thread |
| `POST` | `/api/triage` | Two agents, one merged and attributed answer |
| `GET` | `/api/memory` | Inspect the memories a namespace holds |
| `POST` | `/api/digest` | Weekly competitor intelligence digest |
| `GET` | `/api/digest/network` | Competitor network projection (no model call) |
| `POST` | `/api/export/markdown` | Digest export with cited sources |
| `GET` | `/api/history` | Past decision records |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/login` · `/api/logout` | Session auth |
| `GET` | `/api/me` | Current session |

---

## Quick start

```bash
pip install -r requirements.txt
python -m app.db.grounded_seed
python -m app.main
```

Serves on port 5000. Run from the repository root.

---

## Testing

```bash
pytest
```
