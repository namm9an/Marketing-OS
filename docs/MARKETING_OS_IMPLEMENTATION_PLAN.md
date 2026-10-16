# 🚀 Marketing OS v2.0 Enterprise: Master Implementation Plan

**Document Version:** 2.0.0-PROD  
**Author:** Lead Multi-Agent Systems Engineer  
**Status:** Authorized for Execution (Phase 2 Master Document)  
**Target Environment:** Python 3.10+, SQLite 3.46+ (WAL + FTS5), Node.js v20.18.0 (Vite 5.4.14 + React Plugin 4.3.4), LangGraph, LangFuse  
**Commit Author Standard:** `namm9an <naman.moudgill77@gmail.com>`  

---

## 1. Implementation Governance & Execution Strategy

This implementation plan establishes the exact tactical sequence, code changes, verification tests, and git commits required to execute the ratified architectural blueprint. Execution follows seven strictly sequential milestones. 

Each milestone is atomic, independently verifiable, and leaves the test suite green. Zero breaking changes or half-wired interfaces are permitted between commits.

```
+----------------------------------------------------------------------------------------------------+
|                                    7-MILESTONE EXECUTION PHASES                                    |
+-------------------+---------------------------------------------------------+----------------------+
| Milestone         | Primary Scope                                           | Key Deliverables     |
+-------------------+---------------------------------------------------------+----------------------+
| Milestone 1       | Sanitization, Environment Config & Pydantic v2 Schemas  | config.py, schemas.py|
| Milestone 2       | Deterministic Storage, SQLite WAL, FTS5 & Attribution   | database.py, seed.py |
| Milestone 3       | Memory Isolation Engine (L0–L2) & Promotion Gate        | store.py, gate.py    |
| Milestone 4       | LangGraph Deterministic State Machine & Universal Gov   | workflow, chat,triage|
| Milestone 5       | Comprehensive Pytest Suite (100% Real Assertions)       | tests/ (unit & integ)|
| Milestone 6       | Senior Developer README & Granular Conventional Commits | README.md, git logs  |
| Milestone 7       | Frontend Review & Bundler Integration (Vite Pinning)    | package.json, SPA    |
+-------------------+---------------------------------------------------------+----------------------+
```

---

## 2. Granular Conventional Commits Specification (21 Commits)

All repository commits must be authored under:
`git config user.name "namm9an"`  
`git config user.email "naman.moudgill77@gmail.com"`  

The 21 granular conventional commits are organized as follows:

```
+----+--------+-----------------------------------------------------------------------------------------+
| #  | Type   | Commit Message Subject                                                                  |
+----+--------+-----------------------------------------------------------------------------------------+
| 01 | config | config(core): parameterize enterprise identity as Vanguard Cloud via BaseSettings       |
| 02 | schema | schema(core): introduce Pydantic v2 domain schemas for knowledge, decisions, and triage |
| 03 | refact | refactor(agents): de-identify persona prompts and parameterize target organization      |
| 04 | feat   | feat(crypto): restore 128-bit UUID4 entropy and deterministic SHA-256 content hashing  |
| 05 | fix    | fix(seed): implement multi-field 404 validation filter purging error page facts         |
| 06 | feat   | feat(seed): preserve SKU tokens in pricing facts for graph edge reconciliation          |
| 07 | feat   | feat(db): create SQLite FTS5 virtual table with Porter stemming for BM25 search        |
| 08 | feat   | feat(db): implement deterministic taxonomy expansion dictionary with quote-safe tokens  |
| 09 | fix    | fix(db): resolve SQL LIMIT 15 pre-scoring truncation bug with engine-level BM25 ranking |
| 10 | feat   | feat(graph): reconcile prices edge binding linking organizations to GPU SKUs with rates |
| 11 | test   | test(db): add comprehensive unit tests for FTS5 BM25 search and taxonomy expansion     |
| 12 | refact | refactor(memory): enforce strict regex validation and exact-match namespace algebra     |
| 13 | feat   | feat(memory): harden promotion gate with episodic-to-semantic promotion heuristics      |
| 14 | feat   | feat(agents): activate full 5-agent parallel specialist swarm in supervisor registry    |
| 15 | fix    | fix(graph): wire universal governance node across chat and triage execution graphs      |
| 16 | feat   | feat(digest): implement resilient 5-agent parallel digest fan-out with fallback merge   |
| 17 | test   | test(eval): upgrade retrieval gold set and achieve >= 0.85 paraphrase recall benchmark |
| 18 | test   | test(eval): implement Anthropic frontier agent evaluation harness with pass@k reliability |
| 19 | build  | build(frontend): pin Vite to ^5.4.14 and react plugin to ^4.3.4 for host Node v20.18.0 |
| 20 | docs   | docs(readme): author senior developer README with architectural diagrams and memory spec|
| 21 | chore  | chore(release): finalize production v2.0 verification and clean test artifacts           |
+----+--------+-----------------------------------------------------------------------------------------+
```

---

## 3. Milestone-by-Milestone Tactical Execution Plan

### Milestone 1: Sanitization, Environment Config & Pydantic v2 Domain Schemas

#### Objectives
1. Parameterize enterprise identity to eliminate hardcoded vendor references.
2. Introduce formal Pydantic v2 domain schemas for all database entities, requests, and agent responses.
3. Clean all system prompts in `app/agents/base.py`, `app/graph/triage.py`, `app/graph/digest.py`, and `app/eval/gold.py` to reference `settings.TARGET_ORGANIZATION`.

#### File Modifications
* `app/core/config.py`:
  - Inherit `Settings` from `pydantic_settings.BaseSettings`.
  - Add `TARGET_ORGANIZATION: str = "Vanguard Cloud"`.
  - Add `TARGET_INDUSTRY: str = "Enterprise AI & GPU Cloud"`.
  - Ensure `DB_PATH`, `ADMIN_USER`, and `ADMIN_PASSWORD` load cleanly from environment variables.
* `app/core/schemas.py`:
  - Define `KnowledgeUnitSchema` with `id`, `organization`, `knowledge_class`, `confidence`, `content`, `source_url`, `enriched_by`, `created_at`.
  - Define `DecisionRecordSchema` with `id`, `goal_statement`, `selected_option`, `confidence`, `escalated`, `reasoning_source`, `rationale`, `risks`, `created_at`.
  - Define `ChatTurnSchema`, `TriageResponseSchema`, `AgentResponseSchema`, and `DigestSchema`.
* `app/agents/base.py`:
  - Parameterize `AGENT_REGISTRY` personas so `"Vanguard Cloud"` and `settings.TARGET_INDUSTRY` are dynamically injected.
  - Remove all hardcoded `"E2E Networks (NSE: E2E)"` strings.
* `app/eval/gold.py`:
  - Update queries checking internal positioning: change `GoldQuery("What is our own tagline?", Relevance(org=settings.TARGET_ORGANIZATION, ...))` to dynamically evaluate the target organization.

#### Verification Gate
* `python -c "from app.core.config import settings; assert settings.TARGET_ORGANIZATION == 'Vanguard Cloud'"` succeeds.
* Schema serialization and validation tests pass with zero validation errors.

---

### Milestone 2: Deterministic Storage, SQLite WAL, FTS5 & Cryptographic Attribution

#### Objectives
1. Restore 128-bit UUID4 entropy and SHA-256 content hashing in `app/core/primitives.py`.
2. Purge 404 error page corpus contamination (13.2% defect) in `app/db/grounded_seed.py` with multi-field validation.
3. Fix the broken `prices` edge binding by preserving GPU SKU tokens in pricing facts.
4. Implement SQLite FTS5 BM25 virtual table with Porter stemming in `app/db/database.py`.
5. Integrate the deterministic hardware/market taxonomy expansion dictionary with quote-safe punctuation handling.
6. Fix the SQL `LIMIT 15` pre-scoring truncation bug.

#### File Modifications
* `app/core/primitives.py`:
  ```python
  import uuid
  import hashlib

  def new_id() -> str:
      return uuid.uuid4().hex

  def content_hash(text: str) -> str:
      return hashlib.sha256(text.encode("utf-8")).hexdigest()
  ```
* `app/db/grounded_seed.py`:
  - Add `is_valid_corpus_content(text)` to purge 404s (`"404"`, `"Page Not Found"`, `"Oops!"`, etc.).
  - Validate both `headings[0]` and `snippet` before fact insertion.
  - Reconcile pricing fact formatting to preserve GPU SKU names:
    ```python
    if pricing and gpus:
        pricing_fact = f"Empirical Pricing & Rate Card Terms for {', '.join(sorted(gpus))}: {', '.join(pricing[:4])}."
        # Insert with SHA-256 content-derived ID for deterministic idempotency
    ```
* `app/db/database.py`:
  - Add `CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_units_fts USING fts5(id UNINDEXED, organization, knowledge_class, content, tokenize = 'porter unicode61 remove_diacritics 2')` to `SCHEMA`.
  - Add automatic FTS5 sync triggers on `knowledge_units` `AFTER INSERT`, `AFTER DELETE`, and `AFTER UPDATE`.
  - Implement `_expand_query_terms(query: str) -> str` using the deterministic taxonomy expansion dictionary with quote-safe tokens and disjunctive OR-clauses:
    ```python
    _TAXONOMY_EXPANSIONS = {
        "blackwell": ["b200", "gb200", "gb300"],
        "hopper": ["h100", "h200", "gh200"],
        "ada": ["l40s", "l4", "rtx 4090"],
        "lovelace": ["l40s", "l4", "rtx 4090"],
        "consumer": ["rtx 4090", "l40", "l40s"],
        "rupee": ["inr", "rs", "pricing", "rate"],
        "rupees": ["inr", "rs", "pricing", "rate"],
        "hourly": ["hr", '"/hr"', "pricing", "rate"],
        "hour": ["hr", '"/hr"', "pricing", "rate"],
        "cost": ["pricing", "rate", "rate card"],
        "cheapest": ["pricing", "rate", "rate card"],
        "rental": ["pricing", "cloud", "instance"],
        "capacity": ["pricing", "cloud"],
        "sells": ["pricing", "rate"],
        "india": ["sovereign", "meity", "india"],
        "indian": ["sovereign", "meity", "india"],
        "residency": ["sovereign", "india", "meity", "compliance"],
        "tagline": ["positioning", "official"],
        "describe": ["positioning", "cloud"],
        "our": [settings.TARGET_ORGANIZATION.lower()],
        "own": [settings.TARGET_ORGANIZATION.lower()],
    }
    ```
  - Rewrite `search_knowledge_units` to execute full FTS5 BM25 queries joining on `fts.id = k.id` without arbitrary pre-scoring truncation:
    ```sql
    SELECT k.id, k.organization, k.knowledge_class, k.confidence, k.content, k.source_url, k.enriched_by, k.created_at,
           bm25(knowledge_units_fts) AS rank
    FROM knowledge_units_fts fts
    JOIN knowledge_units k ON fts.id = k.id
    WHERE knowledge_units_fts MATCH :match_query AND k.enriched_by NOT LIKE '%agent%'
    ORDER BY rank ASC
    LIMIT :limit;
    ```
* `app/memory/graph.py`:
  - Reconcile `rebuild_corpus_graph()`:
    When `fact["knowledge_class"] == "pricing"`, extract rate terms and establish `(Org) --prices--> (SKU)` edges with rate provenance (`amount`, `unit`, `source_fact_id`).

#### Verification Gate
* Run `python -m app.db.grounded_seed`.
* Check zero junk rows: `python -m app.eval.retrieval` reports `0/X` junk rows (0.0%).
* Verify `edges` contains valid `prices` edges:
  `SELECT COUNT(*) FROM edges WHERE rel = 'prices';` returns $> 0$.

---

### Milestone 3: Memory Isolation Engine (L0–L2) & Promotion Gate

#### Objectives
1. Enforce strict namespace validation and exact membership algebra in `app/memory/store.py`.
2. Harden the promotion gate in `app/memory/gate.py` to prevent temporal memory contamination.
3. Validate recursive CTE graph traversal in `app/memory/graph.py` to prevent cross-agent memory leakage.

#### File Modifications
* `app/memory/store.py`:
  - Ensure `readable_namespaces(agent_type)` matches joint triage namespaces by exact set membership (`agent_type in ns_members(ns)`), preventing substring collision leaks (e.g., `pr` colliding with `product_marketing`).
  - Validate that `add_memory` rejects invalid namespace patterns.
* `app/memory/gate.py`:
  - Enforce rule: `role == "user"` is mandatory for admission.
  - Maintain strict classifier regex patterns for `correction`, `decision`, `preference`.
  - Track `hit_count` and promote `episodic` $\to$ `semantic` when `hit_count >= 3`.
* `app/memory/graph.py`:
  - Confirm recursive CTE traversal strictly scopes edges by `namespace IN ({placeholders})` at every single hop.

#### Verification Gate
* Run `pytest tests/unit/test_memory_store.py tests/unit/test_memory_gate.py tests/unit/test_memory_graph.py`.
* All memory isolation tests pass with zero failures.

---

### Milestone 4: LangGraph Deterministic State Machine & Universal Governance

#### Objectives
1. Activate all 5 specialized agents (`branding`, `pr`, `social`, `product_marketing`, `events`) across all execution paths.
2. Wire the universal `governance` node into `chat.py` and `triage.py`.
3. Implement worker-level resilience in `workflow.py` and `digest.py`.

#### File Modifications
* `app/agents/base.py`:
  - Set `ACTIVE_AGENTS = ("branding", "pr", "social", "product_marketing", "events")`.
* `app/graph/chat.py`:
  - Update `ChatState` to include `confidence`, `risks`, `escalated`, `escalation_reason`, and `decision_id`.
  - Add `_governance` node to `_CHAT_GRAPH`:
    `START -> recall -> respond -> governance -> remember -> END`
  - In `_governance`, evaluate reply text and risk phrases, record decision via `save_decision`, and flag escalation if high-risk terms or low confidence are detected.
* `app/graph/triage.py`:
  - Update `TriageState` to include `escalated`, `escalation_reason`, and `decision_id`.
  - Add `_governance` node to `_TRIAGE_GRAPH`:
    `START -> prepare -> { view_0 || view_1 } -> merge -> governance -> remember -> END`
* `app/graph/digest.py`:
  - Ensure all 5 specialist workers fan out concurrently.
  - Wrap worker execution in `try / except` blocks:
    If an agent fails or times out, return a structured fallback brief rather than crashing the graph.
  - Parameterize radial network center node to `settings.TARGET_ORGANIZATION`.
* `app/graph/workflow.py`:
  - Ensure supervisor routes to all 5 specialist nodes cleanly with worker-level exception handling.

#### Verification Gate
* Run `python -m app.graph.workflow` $\to$ OK.
* Run `python -m app.graph.chat` $\to$ OK.
* Run `python -m app.graph.triage` $\to$ OK.
* Run `python -m app.graph.digest` $\to$ OK with 5 specialist briefs.

---

### Milestone 5: Anthropic Frontier Agent Evaluation Suite & Pass@k Reliability

#### Objectives
1. Elevate evaluation from basic unit tests to the **Anthropic Frontier Agent Evaluation Standard** (*Demystifying Evals for AI Agents*, Jan 2026).
2. Implement **The Grader Triad** (`CodeGrader`, `ModelGrader`, `HumanReferenceGrader`) to evaluate database mutations, zero cross-namespace memory reads, grounded citations, and calibrated tone.
3. Construct **Class-Balanced Problem Sets** (20 Governance scenarios: 10 positive / 10 negative triggers; 20 Memory Gate scenarios: 10 positive / 10 negative triggers).
4. Build the **Multi-Trial Agent Evaluation Harness** measuring $pass@1$, $pass@3$, and $pass^3$ (consecutive reliability) under non-deterministic multi-agent execution.
5. Guarantee $\text{pass}^3 \ge 0.95$ across CMO Governance and Memory Promotion Gate adversarial benchmarks under 100% offline deterministic execution.
6. Achieve $\ge 0.85$ Recall@5 on the paraphrase split in `app/eval/retrieval.py` and zero 0-hit queries.

#### File Modifications & New Modules
* `app/eval/graders.py`:
  - `CodeGrader`:
    - `assert_outcome_state(db, table, expected_fields)`: Asserts physical SQLite database mutations.
    - `assert_zero_namespace_leakage(transcript, forbidden_namespaces)`: Asserts an agent never reads another's private memory.
    - `assert_valid_citations(response, corpus_db)`: Asserts 100% of cited facts carry valid, active `source_url`s in `knowledge_units`.
  - `ModelGrader`:
    - Calibrated LLM-as-judge scoring Groundedness (1–5) and Strategic Tone with mandatory guardrail: *"If context lacks evidence, return 'UNKNOWN'. Do not fabricate."*
    - Deterministic offline calibrated fallback for zero paid API key dependency.
  - `HumanReferenceGrader`:
    - Golden truth comparison against human-annotated decisions and memory admissions.
* `app/eval/scenarios.py`:
  - `GOVERNANCE_SCENARIOS`: 10 positive triggers (lawsuit, defamation, price war, compliance breach) + 10 negative triggers (factual specs, slogans, pricing inquiries).
  - `MEMORY_GATE_SCENARIOS`: 10 positive triggers (corrections, decisions, preferences with `role == "user"`) + 10 negative triggers (chatter, questions, model prose with `role != "user"`).
* `app/eval/agent_eval.py`:
  - Automated multi-trial agent evaluation runner executing $k=3$ trials.
  - Calculates $pass@1$, $pass@3$, and $pass^3 = (p)^3$.
  - Tracks trajectory turn count ($\le 10$), token usage, latency, and verifies outcome state with `CodeGrader`.
* `tests/unit/test_agent_eval.py`:
  - Comprehensive unit tests covering the Grader Triad, class-balanced scenario banks, and eval harness execution.

#### Verification Gate
* Execute:
  `python -m app.eval.retrieval --expand-taxonomy`
  Verify: Paraphrase Recall@5 $\ge 0.85$, Overall Recall@5 $\ge 0.88$, Junk ratio == 0.0%.
* Execute:
  `python -m app.eval.agent_eval`
  Verify: $\text{pass}^3 \ge 0.95$ for Governance and Memory Gate, zero namespace leakage, valid citations.
* Execute:
  `pytest tests/`
  Verify: 100% tests passing with zero errors.

---

### Milestone 6: Senior Developer README & 21 Conventional Commits

#### Objectives
1. Overhaul `README.md` to showcase the production architecture, 4 memory tiers, FTS5 BM25 retrieval, and multi-agent swarm.
2. Initialize and verify git repository state, executing the 21 granular conventional commits authored under `namm9an <naman.moudgill77@gmail.com>`.

#### File Modifications
* `README.md`:
  - Update system overview to reflect Vanguard Cloud Enterprise AI & GPU Cloud.
  - Detail the 4 memory tiers and promotion gate.
  - Include FTS5 retrieval benchmark results (before vs after).
  - Provide quick-start commands for Docker, local execution, and test suites.

---

### Milestone 7: Frontend Review & Bundler Integration

#### Objectives
1. Pin Vite to `^5.4.14` and `@vitejs/plugin-react` to `^4.3.4` in `frontend/package.json`.
2. Parameterize center node label in `frontend/src/components/CompetitorNetwork.jsx` to dynamically render `data?.center_name || "Vanguard Cloud"`.
3. Verify frontend dependencies and execute `npm run build` using host Node `v20.18.0`.
4. Validate that `frontend/dist` builds cleanly and is served by Flask without routing conflicts.

#### File Modifications
* `frontend/package.json`:
  - Update devDependencies: `"vite": "^5.4.14"`, `"@vitejs/plugin-react": "^4.3.4"`.
* `frontend/src/components/CompetitorNetwork.jsx`:
  - Dynamically render target organization label from network props.
* Run `npm install` and `npm run build` in `frontend/`.

#### Verification Gate
* `frontend/dist/index.html` and assets exist.
* Flask starts and serves the frontend on `http://127.0.0.1:5000/`.

---

## 4. Verification Matrix & Quality Checklist

```
+-----------------------------------+------------------------------------------+-----------------------+
| Checkpoint                        | Verification Command                     | Expected Result       |
+-----------------------------------+------------------------------------------+-----------------------+
| 1. Config & Identity              | python -c "from app.core.config import   | Vanguard Cloud        |
|                                   | settings; print(settings.TARGET_ORG)"    |                       |
+-----------------------------------+------------------------------------------+-----------------------+
| 2. Corpus 404 Hygiene             | python -m app.eval.retrieval             | 0 junk rows (0.0%)    |
+-----------------------------------+------------------------------------------+-----------------------+
| 3. Paraphrase Retrieval Recall    | python -m app.eval.retrieval             | Recall@5 >= 0.85      |
+-----------------------------------+------------------------------------------+-----------------------+
| 4. Prices Edge Graph Binding      | python -c "from app.db.database import   | > 0 prices edges      |
|                                   | get_connection; c = get_connection();    |                       |
|                                   | print(c.execute('SELECT COUNT(*) FROM    |                       |
|                                   | edges WHERE rel=\"prices\"').fetchone()[0])"|                   |
+-----------------------------------+------------------------------------------+-----------------------+
| 5. Universal Governance in Chat   | python -c "from app.graph.chat import    | escalated == True     |
|                                   | run_chat; res = run_chat('branding',     |                       |
|                                   | 'lawsuit risk on pricing');              |                       |
|                                   | print(res['governance']['escalated'])"   |                       |
+-----------------------------------+------------------------------------------+-----------------------+
| 6. Full 5-Agent Digest Fan-Out    | python -c "from app.graph.digest import  | 5 agent briefs        |
|                                   | run_digest; out = run_digest();          |                       |
|                                   | print(len(out['agent_briefs']))"         |                       |
+-----------------------------------+------------------------------------------+-----------------------+
| 7. Complete Test Suite            | pytest tests/unit/                       | 100% passed           |
+-----------------------------------+------------------------------------------+-----------------------+
| 8. Frontend Production Build      | cd frontend && npm run build             | vite build complete   |
+-----------------------------------+------------------------------------------+-----------------------+
```
