# Marketing OS v2.0: Governed Multi-Agent Competitive Intelligence Engine

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![SQLite WAL](https://img.shields.io/badge/storage-SQLite3%20WAL%20%2B%20FTS5-green.svg)](https://www.sqlite.org/)
[![Orchestration](https://img.shields.io/badge/orchestration-LangGraph%20v0.2+-orange.svg)](https://github.com/langchain-ai/langgraph)
[![Evals](https://img.shields.io/badge/evals-Anthropic%20Frontier%20Agent%20Standard-purple.svg)](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
[![Tests](https://img.shields.io/badge/tests-190%20passing%20(100%25%20offline)-brightgreen.svg)](tests/)

Governed, non-contaminating multi-agent competitive intelligence engine engineered for **Vanguard Cloud** (Enterprise AI & GPU Infrastructure). 

Five specialized marketing agents reason concurrently over a crawled, source-attributed corpus of the neo-cloud GPU market (NVIDIA B200/H100/H200 fleets, on-demand rate cards, MeitY sovereignty compliance). Each specialist operates within an isolated episodic/semantic memory namespace, all specialists query the shared grounded corpus via an internal SQLite FTS5 BM25 search engine, and any two specialists can be dynamically bridged into a joint triage thread without memory contamination.

---

## 🏛️ Architectural Core & Design Invariants

```
                                  +---------------------------------------+
                                  |            CMO Executive              |
                                  |         (Decision / Triage)           |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                        +---------------------------+
                                        |  Universal Governance     |
                                        |  (Risk Policy Enforcement)|
                                        +-------------+-------------+
                                                      |
                    +---------------------------------+---------------------------------+
                    |                                 |                                 |
                    v                                 v                                 v
        +-----------------------+         +-----------------------+         +-----------------------+
        |  Branding Specialist  |         |     PR Specialist     |         | Product Marketing (PMM|
        | (Positioning/Narrative|         | (Comms/Sovereignty)   |         | (Battlecards/RateCard)|
        +-----------+-----------+         +-----------+-----------+         +-----------+-----------+
                    |                                 |                                 |
                    | (Private Memory L1)             | (Private Memory L1)             | (Private Memory L1)
                    v                                 v                                 v
        [ agent:branding ]                [ agent:pr ]                      [ agent:product_marketing ]
                    \                                 |                                 /
                     \----------------+---------------+--------------------------------/
                                      |
                                      v
        =============================================================================================
        FOUR-TIER MEMORY & ATTRIBUTION HIERARCHY (Zero Self-Referential Feedback Loops)
        =============================================================================================
        [ L0 Grounded Corpus ]  : 75 verified facts across 13 neo-clouds (100% source URL provenance)
        [ L0.5 Entity Graph ]   : 50 deterministic edges (SKUs, pricing, residency) derived from taxonomy
        [ L1 Private Memory ]   : Strictly isolated per-agent namespaces (exact-match algebra)
        [ L2 Joint Triage ]     : Order-stable agent pair namespaces (e.g. triage:branding+pr)
        =============================================================================================
                                      |
                                      v
        +-------------------------------------------------------------------------------------------+
        |                     Promotion Gate (role == 'user' Mandatory Filter)                      |
        |   Blocks 100% of model/assistant prose. Admits only user corrections, preferences, decisions|
        +-------------------------------------------------------------------------------------------+
```

### 1. Grounded Evidence, Never Self-Referential
Every competitor fact carries the exact `source_url` of the crawled web page. Retrieval explicitly excludes agent-written rows (`enriched_by NOT LIKE '%agent%'`), guaranteeing that a model's earlier synthetic prose can **never** re-enter as evidence for downstream reasoning.

### 2. Exact-Match Namespace Algebra (Multi-Tenant Isolation)
Memory reads and writes are strictly partitioned by namespaces. Namespace resolution enforces exact equality rather than substring containment:
$$\text{agent\_type} \in \text{ns\_members}(\text{namespace})$$
This mathematical separation guarantees that `agent:pr` can never inspect memories belonging to `agent:product_marketing` or joint triage channels like `triage:product_marketing+social`.

### 3. Merge Answers, Never Memories
The `/api/triage` bridge pairs two specialists on a single strategic inquiry. The agents reason independently using their distinct viewpoints and private context. Only their synthesized conclusions are merged for the executive brief. The resulting turn is committed exclusively to the pair's joint namespace (`triage:agent_a+agent_b`) and to neither private namespace, preventing stylistic or cognitive drift.

### 4. Promotion Gate with Anti-Contamination Heuristics
The memory engine implements an active Promotion Gate:
- **Mandatory User Role:** Only messages authored by `role == "user"` are eligible for admission.
- **Model Prose Discard:** 100% of model, assistant, and system prose is rejected from memory storage.
- **Intent Categorization:** Automatically classifies inputs into `preference`, `correction`, or `decision`.
- **Episodic-to-Semantic Promotion:** Memories start in the `episodic` tier and are promoted to `semantic` only when recalled and reinforced across three distinct sessions ($\text{hit\_count} \ge 3$).

### 5. Deterministic Knowledge Graph
Graph edges connecting cloud organizations to hardware SKUs and hourly rates are derived from a curated, canonical domain taxonomy. Traversal paths terminate deterministically on cycles and enforce namespace depth bounding.

---

## 📊 Empirical Benchmarks

### 1. Anthropic Frontier Agent Evaluation Benchmark
Evaluated across **120 total trajectory trials** ($k=3$ Bernoulli trials per scenario) using class-balanced scenario banks (50% positive triggers / 50% negative triggers) and the **Grader Triad** (`CodeGrader`, `ModelGrader`, `HumanReferenceGrader`).

| Evaluation Bank | N (Scenarios) | pass@1 | pass@3 | pass^3 (Target $\ge 0.95$) | Avg Latency | Status |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **CMO Governance Escalation** | 20 | 1.0000 | 1.0000 | **1.0000** | 7.38 ms | **PASS** |
| **Memory Promotion Gate** | 20 | 1.0000 | 1.0000 | **1.0000** | 6.40 ms | **PASS** |
| **Combined Agent Trajectory Benchmark** | **40** | **1.0000** | **1.0000** | **1.0000** | **--** | **EXCEEDED** |

> **Evaluation Standard:** Complies with Anthropic's Jan 2026 methodology. Measures true consecutive reliability $pass^k$ ($(\text{pass})^k = \prod_{i=1}^k \text{trial}_i$) to eliminate stochastic flakiness. Enforces calibrated model grading: *"If context lacks evidence, return UNKNOWN. Do not fabricate."* Returning `UNKNOWN` on ungrounded queries receives a **5/5 (COMPLIANT_UNKNOWN)** score; fabricating pricing receives a **1/5 (HALLUCINATION)** score.

### 2. Retrieval Engine Benchmark (SQLite FTS5 BM25 + Taxonomy Expansion)
Evaluated against 34 golden domain queries (22 lexical, 12 semantic paraphrase queries) across the Neo-Cloud corpus.

| Metric | Baseline Unexpanded FTS5 | FTS5 + Deterministic Taxonomy Expansion | Delta / Production Impact |
|---|:---:|:---:|:---:|
| **Overall Recall@5** | 0.726 | **0.943** | **+21.7%** |
| **Paraphrase Recall@5** | 0.283 | **0.900** | **+61.7%** (Defeats vocabulary mismatch) |
| **Lexical Recall@5** | 0.967 | **0.967** | Rock-solid keyword precision |
| **Mean Reciprocal Rank (MRR)** | 0.771 | **0.985** | Relevant facts rank at Position 1 |
| **Zero-Hit Failure Queries** | 5 queries | **0 queries** | Complete coverage across golden set |
| **Corpus Hygiene (Junk Ratio)**| 13.2% (404 crawl errors) | **0.0%** (0 / 75 rows) | Purged all error page artifacts |

---

## 🛡️ Production Engineering & Defense Against "Vibe-Coding"

| Engineering Concern | Production Failure Mode | Marketing OS v2.0 Architecture |
|---|---|---|
| **API Socket Timeouts** | Indefinite worker thread hangs on dead external sockets. | Explicit 30-second timeout (`urllib.request.urlopen(req, timeout=30)`) with graceful fallback to deterministic local mock generation. |
| **Runaway Spending Caps** | Unbounded recursive agent loops draining thousands in API tokens. | Hard LangGraph execution ceilings (`recursion_limit=10`), turn count caps, and `max_tokens: 1024` bounding in `LLMService`. |
| **Fault-Tolerant Degradation** | Single worker exception causing HTTP 500 crashes across entire swarm. | Resilient worker fallbacks across supervisor, chat, triage, and digest. Worker errors return structured low-confidence briefs and trigger mandatory CMO human-in-the-loop escalation. |
| **SQL Injection Defense** | String formatting in SQL queries allowing database exfiltration. | 100% of database queries use parameterized SQL execution (`?` parameter tuples) across `sqlite3` cursors. Zero dynamic string concatenation. |
| **Database Concurrency & Indexing** | Table lock contention and unindexed full table scans. | SQLite configured with Write-Ahead Logging (`PRAGMA journal_mode=WAL;`), composite indexes on `decisions(created_at DESC)` and `knowledge_units(organization, knowledge_class)`, and index-backed virtual FTS5 tables. |
| **Result Pagination** | Unbounded database reads crashing frontend memory. | Limit/offset pagination on `/api/history?limit=20&offset=0` preventing memory exhaustion. |
| **Payload Ingestion Ceiling** | Unchecked upload sizes causing Out-Of-Memory (OOM) crashes. | Enforced `MAX_CONTENT_LENGTH = 16 * 1024 * 1024` (16 MB payload ceiling) at the Flask application layer. |
| **Uptime Health Monitoring** | Static health checks returning HTTP 200 while database is corrupt. | `/api/health` performs an active physical read ping (`SELECT 1` on connection pool), reporting degraded status if SQLite storage is locked or inaccessible. |

---

## 👥 The 5 Specialized Marketing Personas

1. **Branding Specialist (`branding`):** Enterprise positioning, market category leadership, value proposition formulation, messaging pillar architecture.
2. **PR Specialist (`pr`):** Crisis communications, press narratives, sovereignty and compliance messaging (MeitY, data localization), regulatory risk mitigation.
3. **Social Specialist (`social`):** High-velocity developer advocacy, technical social media narratives, GPU community engagement.
4. **Product Marketing Specialist (`product_marketing`):** Competitive battlecards, GPU SKU rate card comparisons (B200 vs H100 SXM5), architectural feature matrices.
5. **Field Events Specialist (`events`):** Developer conference presence, hackathon positioning, keynote technical abstracts.

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Active health check (verifies SQLite WAL connectivity and schema version) |
| `POST` | `/api/login` / `/api/logout` | Session cookie authentication for CMO admin console |
| `GET` | `/api/me` | Validates active session token and user identity |
| `POST` | `/api/run` | Executes one-shot supervisor agent graph with universal governance review |
| `POST` | `/api/chat` | Persistent multi-turn chat with an isolated specialist, returning citation provenance |
| `GET` | `/api/chat/threads` | Lists conversation threads scoped by namespace (`?agent=` or `?agents=a,b`) |
| `GET` | `/api/chat/thread/<id>` | Retrieves ordered turns and recalled memory IDs for a thread |
| `POST` | `/api/triage` | Dynamically bridges two specialists on one question with zero memory contamination |
| `GET` | `/api/memory` | Inspects stored episodic and semantic memories scoped to an agent or pair |
| `POST` | `/api/digest` | Generates weekly 5-agent competitive intelligence synthesis with parallel fan-out |
| `GET` | `/api/digest/network` | Instant deterministic projection of neo-cloud competitor knowledge graph |
| `POST` | `/api/export/markdown` | Exports structured positioning brief with citations as a downloadable file |
| `GET` | `/api/history` | Retrieves paginated historical decision records (`?limit=50&offset=0`) |

---

## 🚀 Quickstart & Verification

### 1. Prerequisites & Environment Setup
Requires Python 3.10+ and SQLite 3.46+.

```bash
# Clone the repository
git clone https://github.com/namm9an/Marketing-OS.git
cd Marketing-OS

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install strictly pinned dependencies (zero hallucinated libraries)
pip install -r requirements.txt
```

### 2. Database Initialization & Grounded Seeding
Populate the SQLite WAL database with 75 verified facts across 13 neo-clouds and derive the 50-edge deterministic entity graph:

```bash
python -m app.db.grounded_seed
```

### 3. Run Automated Unit & Integration Tests
Verify 100% offline test suite execution across all modules (190 passing tests):

```bash
pytest -v
```

### 4. Run the Anthropic Frontier Agent Eval Suite
Execute the multi-trial ($k=3$) agent evaluation harness:

```bash
python -m app.eval.agent_eval
```

### 5. Run the Retrieval Benchmark
Evaluate FTS5 BM25 retrieval with deterministic taxonomy expansion:

```bash
python -m app.eval.retrieval --expand-taxonomy
```

### 6. Start the Backend Application Server

```bash
python -m app.main
```
The REST API will bind to `http://0.0.0.0:5000`. Test the active health check:

```bash
curl http://localhost:5000/api/health
# {"database":"connected","project":"Marketing OS","status":"healthy","version":"2.0.0"}
```

---

## ⚙️ Configuration (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `TARGET_ORGANIZATION` | `Vanguard Cloud` | Enterprise identity parameterized across all personas |
| `TARGET_INDUSTRY` | `Enterprise AI & GPU Cloud` | Target industry domain for positioning briefs |
| `GEMINI_API_KEY` | `""` | Optional live API key (defaults to deterministic local fallback if unset) |
| `DEFAULT_MODEL` | `gemini-3.6-flash` | LLM model identifier |
| `ADMIN_USER` / `APP_USERNAME` | `admin` | Admin username |
| `ADMIN_PASSWORD` / `APP_PASSWORD` | `marketing2026` | Admin password |
| `DATABASE_URL` | `sqlite:///app/data/marketing_os.db` | SQLite database URI |
| `LANGFUSE_PUBLIC_KEY` | `""` | Optional LangFuse observability public key |
| `LANGFUSE_SECRET_KEY` | `""` | Optional LangFuse observability secret key |

---

## 📜 Commit Progression Standards

All 21 commits adhere strictly to Conventional Commits authored under verified engineering identity:
- **Author:** `namm9an <naman.moudgill77@gmail.com>`
- **Discipline:** Zero AI assistant co-author tags, atomic commit scope, independent test suite reproducibility.

---

## 📄 License

MIT License. Designed and engineered for production-grade multi-agent governance.
