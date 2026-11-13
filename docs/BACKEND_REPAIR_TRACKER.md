# Marketing OS — backend repair tracker

Updated: 13 November 2026 (Asia/Kolkata).

**Purpose:** a temporary, inspectable record of backend correctness and the minimum client integration work needed to prove it. It is not a declaration that repairs are complete. The owner wants to review completion and then delete this file; permanent contracts, tests and operating instructions must survive elsewhere first.

**Current action:** eight backend repair groups implemented and tested on `fix/backend-contracts`, based on the pushed `showcase-redesign` commit `31698d4c6efb9ef5969bc9e1a21e5b08c10bc4c3`. The ninth combined API workflow passes. Browser checks still reproduce frontend history/approval integration defects; frontend source has been left unchanged at the owner's request. Delivery is grouped into five atomic commits on the repair branch: four implementation commits and one documentation commit. No PR, merge, deployment, or environment publication is included in this delivery.

## Current repair results — 13 November 2026

This is the current completion record. Older baseline findings below remain historical evidence, not a claim that every broader backend, frontend, or deployment gap has been closed. The owner authorized the eight groups below, with a targeted regression and complete API workflow after each, followed by a ninth combined pass. Permanent API and review semantics are documented in `README.md` so deleting this temporary tracker later will not remove the contracts.

| Order | Repair | Verification before moving on | Evidence |
|---|---|---|---|
| 1 | Reject cross-agent/private and unrelated joint threads before reading/writing transcripts or calling a model | 29 related tests passed, including full API workflow | `01-before.log`, `01-after.log` |
| 2 | Reject malformed/empty strategy JSON with a typed provider error instead of inventing High-confidence content | 46 related tests passed, including full API workflow | `02-before.log`, `02-after.log` |
| 3 | Store decision-specific operator reviews, authenticated actor, UTC time, and review history; preserve risk flags | 26 related tests passed, including full API workflow | `03-before.log`, `03-after.log` |
| 4 | Persist complete run/chat/triage result snapshots; expose honest legacy records; fail visibly on persistence errors | 61 related tests passed, including full API workflow and repeat legacy-schema upgrade | `04-before.log`, `04-after.log` |
| 5 | Enable configurable taxonomy expansion in actual one-shot/chat/triage recall while preserving raw-search baseline | 42 related tests passed, including full API workflow | `05-before.log`, `05-after.log` |
| 6 | Apply typed request contracts to login, run, chat, triage, digest, export, and review boundaries | 71 related tests passed, including full API workflow | `06-before.log`, `06-after.log` |
| 7 | Correct provider/model/usage metadata in every workflow; reject incomplete responses; bound retries on one model and count every attempt; carry reservations into parallel workers | 119 related tests passed, including full API workflow and controlled live-shaped responses at exact capacity | `07-before.log`, `07-after.log` |
| 8 | Require a crawler origin and valid HTTP(S) source URL; apply the same eligibility to retrieval, digest/network, corpus graph, and citation grader | 147 related tests passed, including full API workflow and negative-source cases | `08-before.log`, `08-grader-before.log`, `08-after.log` |
| 9 | Combined verification, full regression suite, real HTTP server, built SPA, Chromium | 323 tests passed; 23 actual HTTP checks passed; frontend build/lint passed; browser limitations below remain open | `09-full-suite.log`, `09-http-workflow.json`, `09-browser-review.json`, build/lint logs |

Test counts above are overlapping stage suites, not numbers of distinct tests to add together. Evidence files live under `/workspace/reviews/backend-repairs/`. The repair commits preserve the tested implementation atop the recorded source revision; see `git log 31698d4..fix/backend-contracts` for the delivery history. The definitive reproducible regression suite is `tests/integration/test_backend_repairs.py`.

The ninth pass also reproduced and fixed the server's direct `/console` 404. Its regression checks `/console`, `/console/`, nested console routes, and unknown API routes. A built console opens with HTTP 200 under two-worker Gunicorn.

Two final integration regressions also failed before their corrections and pass afterward:

- Eight concurrent workers upgrading an old decisions schema reproduced `duplicate column name`. Column inspection and migration now share a `BEGIN IMMEDIATE` transaction. The old record remains intact and all workers see the new fields. Evidence: `09-migration-before.log`, `09-migration-after.log`.
- A quoted URL containing a `key` query parameter reproduced corrupt saved JSON during redaction. Snapshot strings are now redacted recursively before JSON encoding. Reload succeeds and the sensitive value stays redacted. Evidence: `09-redaction-before.log`, `09-redaction-after.log`.

The final source version passed all 323 tests in 34.61 seconds. The real HTTP workflow was repeated after these corrections and passed all 23 checks. Dependency consistency, Python compilation, and `git diff --check` pass. The original Claude appendix SHA-256 is `bf73a852950f271f09cbafc3345591b0adaa85956cb3ace2c6d8bf772ebf940a`, unchanged from its pre-repair backup.


### Ninth pass limits and next discussion

- API workflow: authenticated session → all five one-shot specialists → persistent chat and memory → two-agent triage → five-agent digest/network → Markdown export → full history reload → decision review → logout/new login. Passed against the running server, with mock inference and honest null provider usage.
- Provider behavior: controlled upstream fixtures verify model reporting, missing usage/model metadata, thought-part exclusion, finish reasons, retries, 429, quota debits, and exact-capacity fan-out. No Gemini credentials are configured here; no actual provider call or model-availability claim was made.
- Browser: login, a new strategy, smooth showcase navigation, and direct console loading pass. **Full UI completion does not pass:** history reconstruction ignores the saved `result` and still crashes on missing `knowledge_units`; the approval button makes no review request and its boolean carries to the next result. These require frontend edits, explicitly deferred by the owner.
- Frontend source was checked against `31698d4` with no diff. Chromium also confirms mobile horizontal overflow and Lenis still enabled with reduced motion. Those are recorded in the frontend working record.
- Existing build/lint warnings remain. Production deployment, Docker build, fresh Linux dependency installation, CI, real recordings, memory-policy decisions, and broader register items are not declared complete by these eight repairs.
- Keep this tracker for owner review. Delete only when its remaining relevant items are resolved or explicitly accepted; the owner originally requested deletion after backend completion, not automatic deletion merely because the API suite is green.


## 1. How to read the evidence

| Status | Meaning |
|---|---|
| CONFIRMED ON BASELINE | Inspected or reproduced at the exact cloud commit below; may have changed on desktop |
| REPORTED ON DESKTOP | Described in the handoff/Anti Gravity update; source and execution not yet inspected here |
| NEEDS RECHECK | Must be tested on the chosen redesign commit before implementation |
| DECISION NEEDED | Product semantics must be settled before dependent changes |
| IN PROGRESS | A bounded repair is being implemented; not complete |
| VERIFIED | Fix inspected and checks passed on the recorded revision or explicitly identified working tree |
| DEFERRED / ACCEPTED LIMIT | Explicit scope decision, with reason; does not count as fixed |

An old defect does not remain open automatically after a branch update, and a commit description does not close it automatically. Record the new evidence. Never mark a row VERIFIED merely because an agent says “done,” a test count increased, or the suite is green.

## 2. Baseline and desktop work

- Repository: `namm9an/Marketing-OS`.
- Reviewed cloud checkout: branch `work`, commit `2b4a21d59d8720929b7bdd4f146207aec284afcf`.
- Fetched redesign branch: `showcase-redesign`, verified HEAD `31698d4c6efb9ef5969bc9e1a21e5b08c10bc4c3`; local repair branch `fix/backend-contracts`. Earlier desktop report stopped at `17910f6`.
- Nine commits were fetched ahead of the old baseline. The ninth (`31698d4`) includes the previously local Render production-variable edit.
- `render.yaml` now includes `ENVIRONMENT=production` and `SESSION_COOKIE_SECURE=true` in the fetched revision. This does not by itself prove a successful production deployment.
- Existing cloud review: `/workspace/reviews/marketing-os-baseline/REVIEW.md`; supporting file checklist, probe results, browser results and logs sit beside it. These are local artifacts, not files already committed to GitHub.

Desktop work to inspect before proposing replacements:

| Reported commit | Claimed backend work | Verification here |
|---|---|---|
| `ee2af8c` | Live/mock telemetry, real usage counts, retrieval timing, evidence IDs and DB migration | READ; remaining inaccuracies repaired in group 7 |
| `df6aa93` | Separate final-call latency/wall time, attempts, thinking tokens, requested model and fallback flag | READ; mock usage and other workflows required group 7 repairs |
| `17910f6` | Gunicorn, pinned dependencies, Docker fix, empty-corpus startup seeding, Render blueprint and env example | READ; pinned Python install, seeded startup and two-worker Gunicorn exercised locally; deployment not run |

Anti Gravity's “fully verified,” “bulletproof,” “complete,” “zero keys” and “our vision” statements are reports, not accepted conclusions. Its repeated count of 94 facts conflicts with the 75-row cloud seed. Verify the actual branch/database. Its old model-fallback instructions may refer to code not present at the baseline.

## 3. What already exists

The baseline has Flask APIs for authentication, single-agent strategy, chat, two-agent triage, memory inspection, transcript listing, history, Markdown export, digest and a competitor network. Five specialist personas share one execution core. LangGraph implements the workflows.

SQLite supplies WAL persistence, FTS5/BM25 search, optional deterministic query expansion, source-linked corpus rows, agent/pair memory namespaces, graph edges, sessions and transactional quotas. Role-based memory admission blocks model prose and classifies user corrections/preferences/decisions. Risk terms and low confidence trigger escalation flags.

Important distinctions:

- One-shot strategy retrieves corpus facts but does not use private chat memory.
- Chat reads memory and transcript history; these are separate paths with separate boundary requirements.
- Triage independently briefs two agents and merges their outputs; it is not a debate loop.
- Digest fans out to five agents and synthesizes on demand. It has no weekly scheduler or historical-change detector and does not currently follow the same governance persistence path.
- An escalation flag is not a persisted human approval. Source-linked input is not proof every output claim is correct. A content hash is not a signature from a source website.

Baseline evidence: 258 tests passed; build passed; lint had 0 errors/24 warnings. A fresh seed produced 75 source-linked fact records across 13 organizations: 17 target records and 58 records covering 12 competitors; graph held 50 corpus edges. Expanded benchmark results were reproduced on the existing tuned set. None of this verifies live Gemini behavior or later desktop changes.

## 4. Sequence — when repairs happen

Work in this order, one bounded change at a time. These are dependency stages, not calendar promises. Do not execute the old runbook wholesale.

### B0 — reconcile the code before repairing it

- [ ] Inspect local changes and preserve them, including these planning files.
- [ ] When `showcase-redesign` is available, fetch and verify its exact HEAD against the desktop report. Use the existing isolated checkout; do not create another worktree unless requested.
- [ ] Review its diff from `2b4a21d`, including migrations, changed tests and startup scripts.
- [ ] Resolve the disposition of the uncommitted deployment edit without losing it.
- [ ] Reproduce the baseline findings on this chosen revision using temporary databases and mocked HTTP responses.
- [ ] Record which findings persist, which are already corrected, and which changed shape.
- [ ] Run the appropriate existing tests/build checks and record versions/counts/results.

**Exit:** one named source revision, a reconciled issue list and no duplicate repairs to work already done on desktop.

### B1 — isolation and HTTP correctness

Fix thread namespace validation, stale client responses, typed request boundaries and routing/API-origin integration. Add a failing regression for each reproduced defect before the correction where useful. The focus is working behavior, not visual redesign.

**Exit:** selected agents cannot consume unauthorized transcripts; malformed requests produce controlled client errors; built `/console` direct navigation and development API calls work.

### B2 — durable results and honest approval

Define and repair persisted result contracts, history restoration and decision-specific approval. Settle the approval lifecycle before implementing dependent API/UI changes. Stop presenting model or approval states that the server has not established.

**Exit:** a result survives reload accurately; approval belongs to one decision and is inspectable; risk flags, review status and memory admission have distinct meanings.

### B3 — provider behavior and output validity

Audit desktop telemetry first. Correct served/requested model attribution, structured-output failure behavior, finish reasons, retries/quota accounting and mock/live provenance. Test error paths with controlled responses. Use live quota only for a bounded agreed verification/recording session, never as a prerequisite for unrelated repairs.

**Exit:** no malformed result is silently promoted to High confidence; provider errors stay visible; every exposed metric has a defined measured source.

### B4 — retrieval, evidence and memory contracts

Make the actual retrieval mode explicit, tighten source-filter semantics, define memory promotion/approval rules and reconcile joint-thread continuity. Verify the same path used by the product. Preserve a separate baseline search mode for comparisons.

**Exit:** grounding and memory claims match the implemented behavior; benchmark and source counts are accurate and reproducible. A held-out evaluation requires genuinely unseen queries and must not be manufactured by tuning to the test.

### B5 — production setup and closure verification

Audit deployment/container work, dependency reproducibility, schema upgrades, seed behavior, proxy settings and health checks. Consolidate meaningful regressions and a repeatable check command. Run complete local mock flows. Record genuine sample runs only after the producing backend contract is stable.

**Exit:** all in-scope rows below have evidence-backed outcomes and the closure checklist is met. Production deployment itself remains a separate task, not something this file authorizes.

## 5. Repair register

All rows initially need rechecking on the redesign commit. “Owner area” describes code responsibility, not a delegated agent.

| ID | Stage / priority | Baseline finding | Current status | Closure evidence required |
|---|---|---|---|---|
| BE-01 | B1 / high | `run_chat` accepts another agent's thread ID, then inserts its transcript into the prompt | VERIFIED API: group 1; wrong namespace rejected before writes/model calls | Wrong namespace rejected before writes/model calls; captured prompts contain no sentinel from a foreign private/joint thread; legitimate reuse still works |
| BE-02 | B1 / high, shared client | Agent switching during an in-flight chat can accept an old response/thread into the new selection | OPEN FRONTEND: source unchanged; not part of the eight backend groups | Delayed-response browser test; old response cannot replace selected agent state or thread |
| BE-03 | B1 / medium | Request schema classes exist but handlers use raw JSON; wrong-type goal/message/agents/username cause 500 | VERIFIED API: group 6; strict payload shapes return 400 | Wrong types and malformed bodies return documented 400/422 responses without side effects; valid existing payloads still work |
| BE-04 | B1 / high, serving | Root static route captures `/console`; direct open/refresh returns 404 | VERIFIED SERVER: ninth-pass route regression and Chromium direct load 200 | Built SPA loads at `/console` directly and on refresh; static assets and API 404 behavior remain correct |
| BE-05 | B1 / medium, shared client | Relative frontend API calls hit Vite without a proxy/API base; `/api/me` returns HTML | OPEN FRONTEND/DEV: use built same-origin app; Vite proxy not changed | Separate Vite/Flask development login and one mock workflow work; configured production-origin strategy documented/tested |
| BE-06 | B2 / high, shared client | Persisted history lacks original output/knowledge payload; reopening calls `.map` on undefined and substitutes title for statement | BACKEND VERIFIED group 4; FRONTEND OPEN: ignores result snapshot and still crashes | Run → reload → reopen → inspect/export retains actual result; workflow types handled; no browser error |
| BE-07 | B2 / high, product decision | Approval only sets a React boolean and carries to later decisions | API VERIFIED group 3; FRONTEND OPEN: local boolean not wired to review endpoint | Chosen lifecycle implemented; decision-bound server record/approver/time if approval is claimed; no inherited approval; reload behavior tested |
| BE-08 | B2 / medium | Governance persistence failures are swallowed while returning a decision ID; no complete immutable approval trail | VERIFIED bounded contract: persistence failures fail closed; reviews append through app; SQLite is not tamper-proof | Defined persistence-failure behavior tested; success cannot claim a durable record that was not stored; limits stated accurately |
| BE-09 | B3 / high | Invalid model JSON/schema failure becomes unlabeled High-confidence content | VERIFIED API: group 2 and provider completion checks in group 7 | Invalid/truncated/off-contract output produces a visible failure or explicit degraded state; no fabricated confidence/rationale; no accepted invalid recording |
| BE-10 | B3 / high | Model source reflects requested config even in mock mode; live token count is hardcoded; planned metrics absent | VERIFIED offline service/graph/DB/API contract: group 7; actual provider run unavailable | Recorded requested/served/source/attempts/latency/wall time/retrieval/tokens/thinking/fallback/finish values validated at service, graph, DB and API layers; absent values aren't invented |
| BE-11 | B3 / medium | Target retry/model/thinking/quota policy not verified against updated code or provider capability | VERIFIED offline retry/quota/finish policy: group 7; configured model availability remains unverified live | User-approved available model; tested 429/reset handling, 503/timeouts, bounded retries, per-attempt quota debit, reservation release, no silent mock/model downgrade; finish reason enforced |
| BE-12 | B3 / medium, shared client | Provider chooser/BYOK and always-active model badge disagree with HTTP behavior | OPEN FRONTEND: unsupported chooser/badge remains unchanged | Choose supported interface; server/response/UI agree; mock/live explicit; no false control or status |
| BE-13 | B4 / medium | Taxonomy expansion is benchmarked but actual one-shot/chat/triage retrieval leaves it disabled | VERIFIED product retrieval: group 5; explicit unexpanded baseline retained | Intended retrieval configuration passed through all paths; integration test captures it; baseline/expanded comparisons remain available |
| BE-14 | B4 / medium | `sourced_only` merely filters creator names containing `agent`; unsourced system rows pass | VERIFIED eligibility rule: group 8; no claim-entailment/freshness guarantee | Source eligibility policy documented/enforced; missing URL/untrusted origins tested; legitimate seed rows preserved |
| BE-15 | B4 / medium | “Only human-approved” and universal three-repeat promotion are stronger than regex/usage rules | OPEN: no new memory-policy decision or implementation in these eight groups | Role gate, corrections/preferences/approvals, exact repeats, near-duplicates and retrieval hits have explicit tested rules; wording matches them |
| BE-16 | B4 / medium | Dedicated `source_turn_id` isn't populated by gate; triage saves history without feeding prior turns into prompts | OPEN: source-turn provenance and joint prompt continuity not changed | Provenance column round-trips; choose/test joint conversational continuity or document its boundary |
| BE-17 | B4 / medium | Citations/source linkage and 75-row/94-row claims are not reconciled; grounding checkers aren't runtime guarantees | PARTIAL: citation eligibility tightened; evidence-ID checks retained; broader claim/corpus cleanup still open | Actual fact/organization/competitor counts computed; evidence IDs within retrieved set; supported claim limits documented; fabricated citation tests |
| BE-18 | B5 / medium | Docker copies absent docs and required Windows binding breaks ordinary Linux install; startup seed/WSGI work only reported later | PARTIAL: Python pins installed, frontend build and two-worker startup pass; clean Linux npm/container install not verified | Clean Linux install/build path, pinned/reproducible deps, container/build check as appropriate, seeded new DB and safe repeat startup; no verification disabled |
| BE-19 | B5 / medium | Health checks connectivity only; data loss/persistence/proxy deployment assumptions remain | PARTIAL: legacy upgrade and shared Gunicorn state tested locally; production data durability/proxy deployment not verified | Distinguish process health/data readiness; migrations preserve existing data; proxy trust/cookies verified under intended deployment; ephemeral-disk limitation explicit |
| BE-20 | B5 / medium | Passing tests miss full contracts; quality tooling/CI absent; some tests mutate configured default DB | PARTIAL: isolated 323-test suite and HTTP/browser evidence added; CI/coverage/audit remain separate work | Isolated DB test command, targeted regressions, relevant HTTP/browser checks, coverage/audit baseline and CI as agreed; failures/skips disclosed |

The exact-three-call triage reservation probe PASSED on baseline. Do not list context propagation as a defect without new evidence. Retest it if provider retry/topology changes affect accounting.

## 6. Decisions before dependent repairs

1. **Approval semantics:** is the button recording a review decision only, or must a flagged recommendation wait for approval before some later action? What action would be blocked? No external publishing/action execution is currently implemented.
2. **Memory admission:** retain user corrections/preferences as admissible without pressing an approval button, or require explicit confirmation? Define semantic promotion separately from admission.
3. **Mock/live product:** the deployment plan starts with no key, so the interface must not claim live generation in that state. Establish the displayed mode and disabled/unavailable behavior.
4. **Model policy:** verify model identifiers and capabilities through authoritative provider responses/documentation when needed; don't assume the research model names or thinking controls exist as described. Do not switch models silently.
5. **Scope of “fully corrected”:** close the register for the verified revision and agreed product behavior, not a promise that no unknown bug remains. Explicitly deferred work stays visible and requires an owner decision about closure.

These decisions need answers only when their stage starts. They do not block baseline reconciliation or unrelated deterministic tests.

## 7. Rules for each repair

1. Record the exact revision and trigger.
2. Show the failing behavior or a narrowly justified static defect; distinguish hypothesis from reproduction.
3. Agree the intended behavior where it is a product decision.
4. Implement only the bounded correction and necessary client contract changes. Avoid styling changes and unrelated refactors.
5. Run targeted regression plus relevant existing checks. Use temporary DBs, mock network responses and no live API calls in CI.
6. Update the evidence ledger with command, result, revision and remaining limits. Do not overwrite the original finding.
7. Review the diff. Commit/push only as instructed in the active task; this planning file does not request either now.

Provider retry work must account for actual HTTP attempts, not assume one graph node equals one provider call. Do not spend a fresh recording quota day on repeated exploratory calls. Never copy keys, session tokens or `.env` values into this tracker or recordings.

## 8. Evidence ledger

| Item | Revision | Check/result | Artifact | Outcome |
|---|---|---|---|---|
| Initial cloud review | `2b4a21d` | 258 tests pass; build pass; lint 0 errors/24 warnings | `/workspace/reviews/marketing-os-baseline/` | Baseline established, defects remain |
| Isolated test run | `2b4a21d` | Seed temporary DB then pytest: 258 passed in 17.63s | `pytest.log` in review directory | PASS |
| Contract/isolation probes | `2b4a21d` | Thread leak, invalid JSON fallback, malformed payloads, source filtering reproduced; exact triage capacity passed | `probes.py`, `probes.json` | Findings reproduced, not repaired |
| Browser checks | `2b4a21d` | History crash, approval carryover, `/console` 404; mode/mobile issues documented | `browser.json`, screenshots, review | Findings reproduced, not repaired |
| Redesign reconciliation | `31698d4` | Nine fetched commits; frontend changes read | Current results above | DONE |
| Eight repairs and ninth combined pass | working tree atop `31698d4` | Individual stage tests; 323 total; 23 real HTTP checks | `/workspace/reviews/backend-repairs/` | API PASS; frontend integration OPEN |

The isolated console browser run replaced the decorative shader response and blocked external fonts; it proves the observed functional failures, not final visual/performance readiness.

## 9. Completion and removal

- [ ] Exact final branch/commit recorded and desktop changes reconciled.
- [ ] Every in-scope repair has VERIFIED evidence; every deferment has an explicit accepted limit.
- [ ] All four workflows have relevant success/error-path checks; namespace boundaries, quotas and persistence tested end to end where applicable.
- [ ] History restore and approval lifecycle work after reload and across successive decisions.
- [ ] Source/mode/telemetry/grounding claims reflect actual behavior.
- [ ] Clean install, startup, schema upgrade and temporary-DB test instructions are reproducible.
- [ ] Relevant existing and new tests/build checks pass; skips and live-provider limitations remain explicit.
- [ ] Permanent API contracts, architecture/limitations and run commands moved into maintained docs/tests.
- [ ] Owner has reviewed completion. Then delete this temporary tracker as requested; don't delete the permanent evidence and regression coverage.

## 10. Change log

- 2026-11-13: Created from the current cloud review, user-requested backend-first workflow, Claude planning files and Anti Gravity's historical report. No repairs marked complete. Cross-reference frontend work in [FRONTEND_DESIGN_WORKING.md](FRONTEND_DESIGN_WORKING.md).
