# Marketing OS

A governed multi-agent competitive intelligence platform for enterprise marketing teams.

Marketing OS deploys five specialized AI agents—Branding, PR, Social Media, Product Marketing, and Events—to analyze competitor intelligence, track market shifts, and formulate strategic positioning. The system enforces strict memory isolation so agents reason independently without cross-contaminating their memories, and routes high-risk recommendations through an executive governance review.

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
  |  Branding Agent   |         |     PR Agent      |         | Product Marketing |
  |   (Positioning)   |         | (Comms / Policy)  |         | (Battlecards/PMM) |
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
    L0    Grounded Corpus   Verified competitor facts carrying explicit source URLs
    L0.5  Entity Graph      Deterministic relationship edges across organizations
    L1    Private Memory    Strictly isolated per-agent private memory
    L2    Joint Triage      Isolated pair namespaces for two-agent collaboration
    =============================================================================
                                          |
                                          v
    +---------------------------------------------------------------------------+
    | Promotion Gate: Only user-validated inputs become long-term memory.       |
    | Blocks model/assistant prose to eliminate self-referential hallucination. |
    +---------------------------------------------------------------------------+
```

### Core Components

- **5 Specialized Personas:** Branding (narrative & positioning), PR (strategic communications & compliance), Social (advocacy & developer community), Product Marketing (competitive battlecards & rate card analysis), and Events (field marketing & keynote abstracts).
- **Universal Governance:** Reviews agent proposals for commercial, regulatory, or positioning risks, flagging high-risk actions for executive CMO sign-off.
- **Triage Collaboration (`/api/triage`):** Dynamically pairs any two specialists on a single strategic inquiry. The agents reason independently from their distinct perspectives, and only their synthesized conclusions are merged into a shared pair namespace without contaminating either agent's private memory.
- **Promotion Gate:** Enforces that only explicit user decisions, preferences, and corrections are admitted into memory. Generated assistant prose is discarded from long-term memory, preventing circular hallucination feedback loops.

---

## Retrieval Benchmarks

Evaluated against a golden set of domain queries comparing standard full-text search against deterministic taxonomy-expanded search:

| Metric | Baseline Search | Taxonomy-Expanded Search | Impact |
|---|:---:|:---:|:---:|
| **Overall Recall@5** | 0.726 | **0.943** | +21.7% |
| **Paraphrase Recall@5** | 0.283 | **0.900** | +61.7% (Resolves vocabulary mismatch) |
| **Lexical Recall@5** | 0.967 | **0.967** | Exact keyword precision |
| **Mean Reciprocal Rank (MRR)** | 0.771 | **0.985** | Top-ranked evidence retrieval |
| **Zero-Hit Queries** | 5 | **0** | Complete candidate coverage |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check verifying database and application status |
| `POST` | `/api/login` / `/api/logout` | Session authentication for the executive console |
| `GET` | `/api/me` | Validates active session state |
| `POST` | `/api/run` | Executes one-shot supervisor agent graph with governance review |
| `POST` | `/api/chat` | Multi-turn chat with an isolated specialist, returning citation recall |
| `GET` | `/api/chat/threads` | Lists conversation threads scoped by namespace (`?agent=` or `?agents=a,b`) |
| `GET` | `/api/chat/thread/<id>` | Retrieves ordered turns and recalled memory IDs for a thread |
| `POST` | `/api/triage` | Bridges two specialists on one question with isolated joint memory |
| `GET` | `/api/memory` | Inspects stored memories scoped to an agent or joint pair |
| `POST` | `/api/digest` | Generates weekly 5-agent competitive intelligence synthesis |
| `GET` | `/api/digest/network` | Returns competitor entity network projection |
| `POST` | `/api/export/markdown` | Exports structured positioning brief with citations |
| `GET` | `/api/history` | Paginated decision history (`?limit=50&offset=0`) |

---

## Instructions to Build & Run

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/namm9an/Marketing-OS.git
cd Marketing-OS

# Set up virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Seed Database

Populate the local SQLite database with verified competitor facts and derive the initial entity graph:

```bash
python -m app.db.grounded_seed
```

### 3. Start Application Server

```bash
python -m app.main
```

The application server binds to `http://localhost:5000`. You can verify it is healthy via:

```bash
curl http://localhost:5000/api/health
```

---

## Instructions to Run Test Suites

Run the automated test suite (190 unit and integration tests, runs 100% offline):

```bash
pytest
```

Run the retrieval benchmark suite:

```bash
python -m app.eval.retrieval --expand-taxonomy
```
