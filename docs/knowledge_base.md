# 📚 Master Knowledge Base & Audit Trail
## Marketing OS v2.0 for E2E Networks & TIR AI Platform

---

## 🏛️ 1. Executive Identity & System Scope

* **Organization**: **E2E Networks** (NSE: E2E) — India's premier sovereign GPU cloud provider.
* **Flagship Platform**: **TIR AI Platform** — Complete AI/ML model deployment & training platform (model fine-tuning, RAG pipelines, no-code AI agents, Indic Voice AI, Hugging Face & W&B integrations).
* **Architecture**: Governed Multi-Agent Swarm operating on a **LangGraph state machine** with **LangFuse full-trace observability** and **RAMP SQLite persistent memory**.

---

## 📁 2. Comprehensive Log of Inspected Local Codebases & Files

### A. `CompTrack` Competitor Intelligence Codebase
* **Path**: `/Users/namanmoudgill13/Desktop/CompTrack`
* **Purpose**: Evaluated production competitor intelligence, scraping pipelines, and LLM extraction templates.
* **Key Files Inspected**:
  1. `README.md`: Discovered tech stack (FastAPI, Next.js 15, Crawl4AI, Playwright, SearXNG, APScheduler, aiosqlite).
  2. `app/config.py`: LLM configurations, fallback parameters, SearXNG settings.
  3. `app/db/database.py`: Database schemas (`users`, `competitors`, `tracked_individuals`, `job_runs`, `tracking_raw`, `digests`).
  4. `app/services/tracker.py`: Extracted prompt templates and injection protection tags (`BEGIN_DATA` / `END_DATA`), raw text limits (`RAW_TEXT_CHAR_LIMIT = 20,000`, `PER_SOURCE_CHAR_LIMIT = 4,000`).
  5. `app/services/kb_service.py` & `app/services/search_service.py`: Knowledge base digest and search handlers.
  6. `.env`: Discovered TIR Llama 3.3 70B credentials (`http://164.52.194.136:8000/v1`) and Qwen3 32B fallback endpoints.

### B. `Marketing-OS` Platform Files
* **Path**: `/tmp/Marketing-OS`
* **Key Files Inspected & Modified**:
  1. `web/app.py`: Added agent type routing (`agent_type: "branding"` vs `"pr"`), SQLite decision persistence, `/api/history` endpoint.
  2. `frontend/src/App.jsx`: Built React SPA with left navigation sidebar, Live Governed Reasoning Stream, Executive Ratification Banner, Dismiss (X) button, and Interactive Agent Swarm Box.
  3. `runtime/memory/db.py`: SQLite database interface (`marketing_os.db`).
  4. `runtime/roles/specialist/branding_agent.py`: Branding & Tech Stack Specialist module.
  5. `runtime/roles/specialist/pr_agent.py`: Unified PR Intelligence Specialist module.

---

## 🔍 3. Complete Web Search Query Log

1. **Query**: `LangGraph multi agent swarm competitor intelligence github`
   - **Results & Discovered Repos**:
     - `aniket-work/strategic-intelligence-swarm`: Autonomous multi-agent market monitoring system on LangGraph.
     - `langchain-ai/langgraph-swarm-py`: Official LangGraph Swarm library for decentralized agent handoffs (`transfer_to_agent`).
2. **Query**: `LangGraph LangFuse observability tracing multi agent setup python`
   - **Results & Discovered Patterns**:
     - `langfuse.langchain.CallbackHandler`: Top-level callback instrumentation that automatically reconstructs nested agent calls, prompt versions, token consumption, and latencies in LangFuse.

---

## 🌐 4. Complete Web Crawl & Scraping Registry (13 Neo-Cloud Target Ecosystem)

### Target Subpages Audited (Playwright Chromium + BeautifulSoup):

| Organization | Region | Subpage URLs Scraped |
|---|---|---|
| **E2E Networks (Us)** | India | `https://www.e2enetworks.com/`<br>`https://www.e2enetworks.com/tir`<br>`https://www.e2enetworks.com/pricing`<br>`https://www.e2enetworks.com/company`<br>`https://docs.e2enetworks.com/myaccount/` |
| **Yotta Data Services** | India | `https://yotta.com/`<br>`https://yotta.com/shakti-cloud/`<br>`https://yotta.com/pricing/` |
| **Neysa AI** | India | `https://neysa.ai/`<br>`https://neysa.ai/platform/` |
| **Together AI** | Global | `https://www.together.ai/`<br>`https://www.together.ai/pricing`<br>`https://www.together.ai/models` |
| **RunPod** | Global | `https://www.runpod.io/`<br>`https://www.runpod.io/pricing`<br>`https://www.runpod.io/serverless` |
| **Lambda Labs** | Global | `https://lambdalabs.com/`<br>`https://lambdalabs.com/service/gpu-cloud`<br>`https://lambdalabs.com/pricing` |
| **Nebius** | Global | `https://nebius.com/`<br>`https://nebius.com/pricing`<br>`https://nebius.com/services/gpu-cloud` |
| **CoreWeave** | Global | `https://www.coreweave.com/`<br>`https://www.coreweave.com/products/gpu-cloud` |
| **Crusoe Cloud** | Global | `https://crusoe.ai/`<br>`https://crusoe.ai/cloud/` |
| **VAST Data** | Global | `https://www.vastdata.com/`<br>`https://www.vastdata.com/platform` |
| **Voltage Park** | Global | `https://www.voltagepark.com/` |
| **Hyperstack** | Global | `https://www.hyperstack.cloud/`<br>`https://www.hyperstack.cloud/pricing` |
| **Foundry** | Global | `https://mlfoundry.com/` |

---

## 📊 5. Empirical Scrape Findings & Rate Card Matrix

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             EMPIRICAL RATE CARD MATRIX                           │
├───────────────────────┬──────────────────────────────┬───────────────────────────┤
│ Organization          │ GPUs Discovered              │ Pricing / Rate Card       │
├───────────────────────┼──────────────────────────────┼───────────────────────────┤
│ E2E Networks (Us)     │ B200, H200, H100, A100, L40S │ B200: ₹671/hr ($6.99/hr)  │
│                       │                              │ H100: ₹334/hr             │
│                       │                              │ A100: ₹362 - ₹436/hr      │
│                       │                              │ L40S: ₹27.40/hr           │
│                       │                              │ CPU: ₹0.14 - ₹0.70/hr     │
│ Yotta Data Services   │ H100 SXM, L40S               │ Shakti Cloud contracts    │
│ Neysa AI              │ H100, L40S                   │ Neysa Velocis quote       │
│ Together AI           │ GB300, GB200, B200, H200     │ Token API & YC B200 nodes │
│ RunPod                │ B200, H100, L40S, RTX 4090   │ Spot 4090 ~$0.44/hr       │
│ Lambda Labs           │ B200, H200, H100, HGX        │ 1-Click Clusters™         │
│ Nebius                │ B200, H200, H100             │ Bare-metal 3.2Tbps fabric │
└───────────────────────┴──────────────────────────────┴───────────────────────────┤
```

---

## 🤖 6. System Prompts & Agent Specifications

### A. Branding Agent System Prompt (`branding_agent.py`)
```python
"""
You are the Lead Branding & Positioning Strategist for E2E Networks (NSE: E2E).
Domain:
1. E2E Networks: TIR AI Platform (fine-tuning, RAG, Indic voice AI, HuggingFace/W&B), B200 (₹671/hr), MeitY empaneled, SOC2, 99.95% SLA.
2. Competitor Taxonomy: Global Top 10 + India Top 3.
3. Archetypes: Enterprise-Centric vs Developer-Focused vs Research-Focused.
"""
```

### B. Unified PR Agent System Prompt (`pr_agent.py`)
```python
"""
You are the Lead PR & Competitive Intelligence Strategist for E2E Networks.
Domain:
1. Unified Stream: Press releases, newsletters/blogs, social media ([LinkedIn], [X/Twitter]), and founder PR.
2. Dynamic Advisory: Synthesizes PR data interactively when the user chats with the PR Agent.
"""
```

---

## 📐 7. LangGraph + LangFuse Architecture Specification

```
                                    ┌───────────────────────────────────┐
                                    │    LangFuse Tracing & Telemetry   │
                                    │  (Latency, Tokens, Cost, Traces)  │
                                    └─────────────────▲─────────────────┘
                                                      │ (Telemetry Stream)
                                                      │
                                    ┌─────────────────┴─────────────────┐
                                    │    LangGraph State Orchestrator   │
                                    │  (State: Memory, Context, Goals)  │
                                    └─────────────────┬─────────────────┘
                                                      │
                ┌─────────────────────────────────────┼─────────────────────────────────────┐
                │                                     │                                     │
                ▼                                     ▼                                     ▼
  ┌───────────────────────────┐         ┌───────────────────────────┐         ┌───────────────────────────┐
  │   Branding Agent Node     │         │      PR Agent Node        │         │   CMO Governance Node     │
  └─────────────┬─────────────┘         └─────────────┬─────────────┘         └─────────────┬─────────────┘
                │                                     │                                     │
                └─────────────────────────────────────┼─────────────────────────────────────┘
                                                      │
                                                      ▼
                                    ┌───────────────────────────────────┐
                                    │  RAMP Shared Knowledge Database   │
                                    │      (SQLite persistent WAL)      │
                                    └───────────────────────────────────┘
```

---

## 🔄 8. Session Change History & Commit Log

* `925e480`: `feat(swarm): add Agent Swarm Box with Branding Agent and Unified PR Agent`
* `b98f771`: `feat(persistence): add SQLite database storage for decision history and knowledge units`
* `abdd6ce`: `feat(ui): refactor into React 18 SPA with left navigation sidebar`

---

## 🎯 Summary
All research, prompt definitions, file paths, web search queries, scraped subpages, and competitive intelligence matrices are permanently logged in `docs/knowledge_base.md`.
