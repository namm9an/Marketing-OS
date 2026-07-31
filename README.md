# Marketing OS

Governed multi-agent competitive intelligence for **E2E Networks** (NSE: E2E) and the TIR AI Platform.

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

The five specialists are **Branding**, **PR**, **Social**, **Product Marketing** and **Field Events**. All five are addressable through the chat and triage endpoints; the weekly digest currently fans out across Branding and PR.

---

## Quick start

### Docker

```bash
docker compose up --build
```

Serves on port 80. Set `GEMINI_API_KEY` in the environment or a `.env` file for live model calls.

### Local

```bash
pip install -r requirements.txt
python -m app.db.grounded_seed
python -m app.main
```

Serves on port 5000. Run from the repository root — `-m` places it on the import path.

To build the frontend:

```bash
cd frontend
npm install
npm run build
```

The API runs without a built frontend; requests to `/` return a plain notice until `frontend/dist` exists.

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

Chat and triage responses carry the memories and sourced facts each answer was built from, so recall is inspectable rather than taken on trust.

---

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | — | Live model calls; without it the system runs a deterministic fallback |
| `DEFAULT_MODEL` | `gemini-3.6-flash` | Model id |
| `APP_USERNAME` / `ADMIN_USER` | `admin` | Single-admin session auth |
| `APP_PASSWORD` / `ADMIN_PASSWORD` | `marketing2026` | **Override in production** |
| `DATABASE_URL` | `sqlite:///app/data/marketing_os.db` | Database location |
| `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` / `LANGFUSE_HOST` | — | Optional tracing |
| `PORT` | `5000` | Listen port |

---

## Development

```bash
python -m pytest
```

---

## License

MIT
