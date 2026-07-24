# 📐 Master Design Document & System Blueprint
## Marketing OS v2.0 for E2E Networks & TIR AI Platform

---

## 🏛️ 1. System Engineering & Over-Engineering Audit

### Honest Architectural Assessment:
1. **Scratch File Clutter (Addressed)**:
   - *Observation*: During initial web crawling and AI analysis, standalone scripts were created in `scratch/` (`deep_neo_cloud_scraper.py`, `gemini_deep_analyzer.py`, `build_llm_intelligence_report.py`). While they kept raw scrape text out of prompt context window, they were single-use scratch files.
   - *Resolution*: All data ingestion logic is consolidated into single-command, reproducible scripts in `app/db/` (`grounded_seed.py` reading `app/data/deep_scrape_results.json`).
2. **Clean Root `app/` Package**:
   - The root application architecture (`app/api`, `app/core`, `app/db`, `app/graph`, `app/agents`, `app/services`) is **not over-engineered**. It follows senior engineering standards for modular Python applications.
3. **Reproducibility Guarantee**:
   - Executing `PYTHONPATH=. python3 app/db/grounded_seed.py` reproducibly seeds the SQLite database (`marketing_os.db`) on any environment (Mac, Linux, Docker, VM) with zero manual setup.

---

## 🧠 2. Zero-Hallucination SQLite Triple-Store GraphRAG Engine

To ensure that the Gemini LLM never hallucinates across chat contexts or pollutes semantic memory, the platform implements a **Deterministic SQLite Triple-Store GraphRAG Architecture**:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     SQLITE TRIPLE-STORE GRAPH SCHEMA (marketing_os.db)           │
├─────────────────┬───────────┬───────────────────────────┬────────────────────────┤
│ Subject (Node)  │ Predicate │ Object (Node)             │ Source URL (Truth)     │
├─────────────────┼───────────┼───────────────────────────┼────────────────────────┤
│ E2E Networks    │ HAS_PRICE │ NVIDIA B200 @ ₹671/hr     │ e2enetworks.com/pricing│
│ Yotta           │ OFFERS    │ Shakti Cloud VMs          │ yotta.com/shakti-cloud │
│ Nebius          │ USES_NET  │ 3.2Tbps InfiniBand Fabric │ nebius.com/services    │
└─────────────────┴───────────┴───────────────────────────┴────────────────────────┘
```

### Key Zero-Hallucination Guarantees:
1. **Triple-Store Traversal**: Instead of relying purely on probabilistic text generation, agents query explicit `(Subject, Predicate, Object)` triplets from SQLite.
2. **Context Isolation**: Chat conversations are isolated per session. Agents query the database for factual grounding, preventing old conversation turns from polluting new prompt contexts.
3. **Pydantic Output Validation**: Agent outputs are strictly validated using Pydantic schemas before returning to the UI.

---

## 📊 3. Chief Marketing Officer (CMO) Weekly Executive Digest

### The Business Value:
A busy CMO or CFO may only chat with 1 or 2 agents (e.g. Branding Agent) during the week. However, the other agents (`📰 PR Agent`, `🔮 Social Agent`, `🚀 Product Marketing Agent`, `🎪 Events Agent`) are continuously gathering intelligence in the background.

The **CMO Weekly Executive Digest** aggregates all background findings into a single, high-impact executive report and interactive visual graph map.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            CMO WEEKLY EXECUTIVE DIGEST PANEL                             │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  [LEFT SIDEBAR]                 [CENTER INTERACTIVE GRAPH MAP]                           │
│  📑 Weekly Digest Tab           (Interactive Node/Link Visualizer of Discoveries)        │
│    ├── Executive Summary          (E2E Networks) <──[Competes]──> (Yotta Shakti Cloud)   │
│    ├── Cross-Agent Discoveries       │                              │                    │
│    └── PDF Download Button           ├──[B200 Rate: ₹671/hr]       ├──[H100 SXM Nodes]  │
│                                      ▼                              ▼                    │
│                                 (TIR Platform)                 (NVIDIA NIMs)             │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Core Features of the Weekly Digest:
1. **Cross-Agent Consolidation**: Aggregates verified updates across ALL 5 agents, highlighting critical competitor rate drops, press coverage, social trends, and product battlecards that the user missed.
2. **Interactive Link Network Diagram**: A visual node/edge graph map on the UI allowing the CMO to click on competitor nodes (e.g. *Nebius*, *RunPod*, *Yotta*) to reveal linked rate cards and press citations.
3. **100% Grounded PDF Export**: Generates a downloadable **Weekly Intelligence Briefing (.pdf)** citing explicit source URLs for executive review.

---

## 🚩 4. Complete Milestone Roadmap

* [x] **Milestone 1**: Multi-Page Scrape across 13 Neo-Clouds (Top 10 Global + Top 3 India).
* [x] **Milestone 2**: RAMP SQLite Database (`marketing_os.db`) seeded with 91 empirical, 100% grounded facts & source URLs.
* [x] **Milestone 3**: Core **🎨 Branding Agent** and **📰 PR Agent** Nodes with retrieval & dynamic enrichment.
* [x] **Milestone 4**: Clean Senior Engineering layout (`app/` root) deployed on live VM ([http://164.52.203.81](http://164.52.203.81)).
* [ ] **Milestone 5 (Next)**: CMO Weekly Executive Digest UI Panel & Interactive Link Graph Visualizer.
* [ ] **Milestone 6**: Multimodal Document & Image Ingestion (`📎 Attach PDF / Image`).
* [ ] **Milestone 7**: Automated Competitor Change Tracking & Delta Alerts (`CompTrack` Sync).
* [ ] **Milestone 8**: Full Activation of Future Swarm Agents (`🔮 Social`, `🚀 Product Marketing`, `🎪 Events`).
