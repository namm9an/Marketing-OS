# Marketing OS

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18%2F19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL_%2B_FTS5-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-orange)](https://github.com/langchain-ai/langgraph)
[![LangFuse](https://img.shields.io/badge/LangFuse-Tracing-blue)](https://langfuse.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

A governed multi-agent competitive intelligence platform for enterprise marketing teams.

Marketing OS deploys five specialized AI agents—Branding, PR, Social Media, Product Marketing, and Events—to analyze competitor intelligence, track market shifts, and formulate strategic positioning. The system enforces strict memory isolation so agents reason independently without cross-contaminating their memories, and routes high-risk recommendations through an executive governance review.

---

## Architecture

```mermaid
flowchart TD
    CMO["CMO Executive<br/>(Strategic Inquiries & Triage Routing)"]
    Gov["Universal Governance<br/>(Risk & Policy Evaluation: Confidence Gate)"]
    
    CMO --> Gov

    subgraph Swarm ["Five Specialized Agent Swarm"]
        direction TB
        subgraph Col1 ["Narrative & Communications"]
            direction TB
            A1["Branding Specialist<br/>Memory: [agent:branding]"]
            A2["PR & Policy Specialist<br/>Memory: [agent:pr]"]
            A3["Social Media Specialist<br/>Memory: [agent:social]"]
        end
        subgraph Col2 ["Commercial & Field Strategy"]
            direction TB
            A4["Product Marketing (PMM)<br/>Memory: [agent:product_marketing]"]
            A5["Field Events Specialist<br/>Memory: [agent:events]"]
        end
    end

    Gov --> Swarm
    Swarm --> Gate["Promotion Gate<br/>Filter: role == 'user' (Blocks model prose)<br/>Promotes to semantic at hit_count >= 3"]

    subgraph Memory ["Four-Tier Memory Hierarchy"]
        direction TB
        L0[("L0: Grounded Corpus (source-linked observations | FTS5 BM25)")]
        L05[("L0.5: Entity Graph (source-derived relationship edges)")]
        L1[("L1: Private Memory (5 isolated namespaces: agent_type in ns)")]
        L2[("L2: Joint Triage Memory (Order-stable pair namespaces)")]
    end

    Gate --> Memory
```

### Core Components

- **5 Specialized Personas:** Branding (narrative & positioning), PR (strategic communications & compliance), Social (advocacy & developer community), Product Marketing (competitive battlecards & rate card analysis), and Events (field marketing & keynote abstracts).
- **Universal Governance:** Reviews agent proposals for commercial, regulatory, or positioning risks, flagging high-risk actions for executive CMO sign-off.
- **Triage Collaboration (`/api/triage`):** Dynamically pairs any two specialists on a single strategic inquiry. The agents reason independently from their distinct perspectives, and only their synthesized conclusions are merged into a shared pair namespace without contaminating either agent's private memory.
- **Promotion Gate:** Enforces that only explicit user decisions, preferences, and corrections are admitted into memory. Generated assistant prose is discarded from long-term memory, preventing circular hallucination feedback loops.

---

## Retrieval Benchmarks

Run `python -m app.eval.retrieval` against a fresh database to compare
standard full-text search with taxonomy expansion on the bundled starter
sources. Both the corpus and the judged questions affect the results.

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

### Start the API

Configure `ADMIN_USER` and `ADMIN_PASSWORD` in your local environment.
Set `TARGET_ORGANIZATION` and `TARGET_INDUSTRY` when running for a specific
organization. Leave `GEMINI_API_KEY` unset for controlled responses.

```bash
python -m app.main
```

The server listens on <http://localhost:10000> by default. Check `/api/health`.
Startup installs the bundled source observations and updates the search index
and graph. Operator records and memory are preserved.

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
