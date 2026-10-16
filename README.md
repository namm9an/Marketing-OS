# Marketing OS

Multi-agent competitive intelligence engine for enterprise AI & GPU cloud markets.

Five specialized marketing agents reason over a crawled, source-attributed corpus of the neo-cloud GPU market (NVIDIA B200/H100/H200 hardware, on-demand rate cards, MeitY sovereignty compliance). Each agent operates within an isolated memory namespace, queries the corpus through an internal SQLite FTS5 BM25 search engine, and can be bridged into joint triage threads without memory contamination.

---

## Architecture

```
                              +-----------------------+
                              |     CMO Executive     |
                              |  (Decision / Triage)  |
                              +-----------+-----------+
                                          |
                                          v
                              +-----------------------+
                              |  Universal Governance |
                              |   (Risk Evaluation)   |
                              +-----------+-----------+
                                          |
            +-----------------------------+-----------------------------+
            |                             |                             |
            v                             v                             v
  +-------------------+         +-------------------+         +-------------------+
  | Branding Agent    |         | PR Agent          |         | Product Marketing |
  | (Positioning)     |         | (Comms / Policy)  |         | (Battlecards/PMM) |
  +---------+---------+         +---------+---------+         +---------+---------+
            |                             |                             |
            v                             v                             v
    [agent:branding]                 [agent:pr]            [agent:product_marketing]
            \                             |                             /
             +----------------------------+----------------------------+
                                          |
                                          v
    =============================================================================
    FOUR-TIER MEMORY HIERARCHY
    =============================================================================
    L0    Grounded Corpus   75 verified facts across 13 neo-clouds (source URLs)
    L0.5  Entity Graph      50 deterministic edges (SKUs, pricing, residency)
    L1    Private Memory    Strictly isolated per-agent namespaces
    L2    Joint Triage      Isolated pair namespaces (e.g. triage:branding+pr)
    =============================================================================
                                          |
                                          v
    +---------------------------------------------------------------------------+
    | Promotion Gate: User turns only (role == 'user').                         |
    | Blocks model/assistant prose. Promotes episodic to semantic at hit_count>=3.|
    +---------------------------------------------------------------------------+
```

### Memory Isolation & Promotion Gate
- **Namespace Algebra:** Reads and writes are scoped by exact namespace match (`agent_type in ns_members(namespace)`). An agent can never read another agent's private namespace.
- **Promotion Gate:** Only explicit user input (`role == "user"`) is eligible for memory storage. Model and assistant prose are rejected to prevent self-referential hallucination loops.
- **Episodic to Semantic Promotion:** Memories enter as episodic records and promote to semantic storage when recalled across multiple sessions (`hit_count >= 3`).
- **Triage Isolation:** When two agents collaborate via `/api/triage`, their joint reasoning is recorded only in the joint namespace (`triage:agent_a+agent_b`) without contaminating either private memory.

---

## Specialized Agents

| Agent | Scope | Focus |
|---|---|---|
| `branding` | Enterprise Positioning | Category leadership, narrative architecture, value propositions |
| `pr` | Strategic Communications | Regulatory compliance, MeitY sovereignty, press narratives |
| `social` | Developer Advocacy | Technical social media, GPU developer community engagement |
| `product_marketing` | Product Marketing (PMM) | Competitive battlecards, GPU SKU rate cards (B200, H100 SXM5) |
| `events` | Field Marketing | Keynotes, technical conference abstracts, developer events |

---

## Benchmarks & Evaluations

### 1. Agent Evaluation Suite (Anthropic Frontier Standard)
Evaluated across 40 class-balanced scenarios (20 Governance + 20 Memory Gate) with 3 trials each (120 total trajectory runs).

| Benchmark Suite | Scenarios | pass@1 | pass@3 | pass^3 (Target >= 0.95) | Status |
|---|:---:|:---:|:---:|:---:|:---:|
| **Governance Escalation** | 20 | 1.0000 | 1.0000 | **1.0000** | PASS |
| **Memory Promotion Gate** | 20 | 1.0000 | 1.0000 | **1.0000** | PASS |
| **Combined Trajectory Benchmark** | **40** | **1.0000** | **1.0000** | **1.0000** | **PASS** |

### 2. Retrieval Engine Benchmark (SQLite FTS5 BM25 + Taxonomy Expansion)
Evaluated across 34 gold queries (22 lexical, 12 paraphrase queries).

| Metric | Baseline FTS5 | FTS5 + Taxonomy Expansion | Delta |
|---|:---:|:---:|:---:|
| **Overall Recall@5** | 0.726 | **0.943** | +21.7% |
| **Paraphrase Recall@5** | 0.283 | **0.900** | +61.7% |
| **Lexical Recall@5** | 0.967 | **0.967** | Exact Match |
| **Mean Reciprocal Rank (MRR)** | 0.771 | **0.985** | +0.214 |
| **Zero-Hit Queries** | 5 | **0** | Complete Coverage |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Active health check (verifies SQLite database connectivity) |
| `POST` | `/api/login` / `/api/logout` | Session cookie authentication for admin console |
| `GET` | `/api/me` | Validates active session token |
| `POST` | `/api/run` | Runs one-shot supervisor agent graph with governance review |
| `POST` | `/api/chat` | Multi-turn chat with an isolated specialist, returning citations |
| `GET` | `/api/chat/threads` | Lists conversation threads scoped by namespace (`?agent=` or `?agents=a,b`) |
| `GET` | `/api/chat/thread/<id>` | Retrieves turns and recalled memory IDs for a thread |
| `POST` | `/api/triage` | Bridges two specialists on one question with isolated joint memory |
| `GET` | `/api/memory` | Inspects memories scoped to an agent or pair |
| `POST` | `/api/digest` | Generates weekly 5-agent competitive intelligence synthesis |
| `GET` | `/api/digest/network` | Returns competitor knowledge graph edges |
| `POST` | `/api/export/markdown` | Exports structured positioning brief with citations |
| `GET` | `/api/history` | Paginated decision history (`?limit=50&offset=0`) |

---

## Quickstart

### 1. Installation

```bash
# Clone repository
git clone https://github.com/namm9an/Marketing-OS.git
cd Marketing-OS

# Virtual environment setup
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Seed Database

```bash
python -m app.db.grounded_seed
```

### 3. Run Tests & Evals

```bash
# Unit & integration tests (190 tests, 100% offline)
pytest

# Agent evaluation harness
python -m app.eval.agent_eval

# Retrieval evaluation benchmark
python -m app.eval.retrieval --expand-taxonomy
```

### 4. Start Server

```bash
python -m app.main
```

Server binds to `http://localhost:5000`. Test health endpoint:
```bash
curl http://localhost:5000/api/health
```

---

## Environment Configuration

| Variable | Description | Default |
|---|---|---|
| `TARGET_ORGANIZATION` | Enterprise organization name | `Vanguard Cloud` |
| `TARGET_INDUSTRY` | Target industry domain | `Enterprise AI & GPU Cloud` |
| `GEMINI_API_KEY` | Optional API key for live Gemini models (falls back to local responses if unset) | `""` |
| `DEFAULT_MODEL` | Default LLM model identifier | `gemini-3.6-flash` |
| `ADMIN_USER` | Admin username for console | `admin` |
| `ADMIN_PASSWORD` | Admin password for console | Configured via environment |
| `DATABASE_URL` | SQLite database URI | `sqlite:///app/data/marketing_os.db` |
| `LANGFUSE_PUBLIC_KEY` | Optional LangFuse public key for tracing | `""` |
| `LANGFUSE_SECRET_KEY` | Optional LangFuse secret key for tracing | `""` |
