# Alpha Engineering Report — Inference Engine Integration

**Owner:** Principal AI Systems Engineer function
**Status:** Alpha, in progress
**Scope covered:** Model-agnostic Inference Engine, Claude Provider adapter, Positioning Strategist converted to real-inference mode, automated test suite, one real scenario executed both ways.
**Related:** `backlog/BACKLOG.md` EB-027, EB-028 · `ROADMAP.md` Alpha section

---

## 1. What Was Built

| Component | File | Status |
|---|---|---|
| Inference Engine contract | `runtime/inference/base.py` | ✅ Complete — `InferenceProvider`, `InferenceRequest`, `InferenceResponse`, `InferenceError` |
| Claude Provider adapter | `runtime/inference/providers/claude_provider.py` | ✅ Written, structurally correct, **not live-tested** (see §3) |
| Mock Provider | `runtime/inference/providers/mock_provider.py` | ✅ Complete, used for all execution in this report |
| Positioning Strategist (dual-mode) | `runtime/roles/specialist/positioning_strategist.py` | ✅ Complete — deterministic and inference modes share one code path |
| Governance Reviewer, CMO Profile, Orchestrator | `runtime/roles/...`, `runtime/orchestration/orchestrator.py` | ✅ Unchanged from Prototype 0.1, deterministic, as scoped |
| Automated tests | `tests/unit/`, `tests/integration/`, `tests/scenario/` | ✅ 17 tests, all passing |

## 2. Test Results

```
Ran 17 tests in 0.027s
OK
```

Coverage by tier:

| Tier | Tests | What They Prove |
|---|---|---|
| Unit | 9 | Memory lifecycle (write/close/promote/dedupe), Inference contract compliance, Claude Provider credential handling |
| Integration | 7 | Full Positioning Development workflow in both modes; missing-precondition handling; **AI failure modes** (unparseable response, out-of-scope selection) are caught by Governance, not silently accepted |
| Scenario | 1 | Real business scenario (GPU Cloud launch) run both ways in a single test, asserting both reach `ACTIVE` state |

**The two negative-path integration tests are the most important result in this report.** They prove the architecture's core promise under AI-assisted conditions specifically:
- `test_unparseable_response_escalates_not_crashes_silently` — if the model returns something the parser can't handle, the system raises and halts rather than fabricating a Decision.
- `test_out_of_scope_selection_forces_low_confidence_and_rejection` — if the model picks an option outside the ones it was given, Governance correctly **rejects** the Positioning rather than approving it. This is Governance doing its job against a genuinely adversarial/malformed AI output, not just against a rule-based stub that was designed to always behave.

## 3. Deterministic vs. AI-Assisted — Direct Comparison

Same Goal, same Knowledge Units, run through both code paths:

| Field | Deterministic | AI-Assisted (MockProvider) |
|---|---|---|
| Selected option | Narrow AI-training-specialist positioning | Narrow AI-training-specialist positioning |
| Confidence | Medium | Medium |
| Escalated | True | True |
| Final state | Active | Active |
| Reasoning source | `deterministic` | `inference:mock:mock-v1` |

**Honest limitation, stated plainly:** this comparison currently proves the **plumbing** works identically in both modes — not that AI reasoning outperforms rules. The `MockProvider` returns a canned response deliberately similar to the deterministic path's own logic, because this sandboxed environment has no network egress to call a live model (confirmed by a failed `pip install` — see repository chat history). **This is not yet a test of AI reasoning quality.** It's a test of whether the system correctly plumbs a provider's output through Governance, Memory, and Decision Records without special-casing. That test passed. The reasoning-quality question is open — see §5.

## 4. Claude Provider — What "Written But Not Tested" Means Precisely

`runtime/inference/providers/claude_provider.py` is:
- Structurally correct against the documented Messages API shape (system/user roles, `x-api-key` + `anthropic-version` headers, standard JSON body)
- Dependency-free (stdlib `urllib` only — no `anthropic` package required, which also wasn't installable here)
- Unit-tested for credential handling (`test_claude_provider_requires_api_key`, `test_claude_provider_constructs_with_explicit_key`) — both pass

It has **not** been exercised against `https://api.anthropic.com`. That call requires network egress this environment doesn't have. Per Principle 1, I'm not claiming this works in production — I'm stating exactly what has and hasn't been verified.

## 5. Measurable Improvements

| Metric | Before (Prototype 0.1) | After (this Alpha pass) |
|---|---|---|
| Automated tests | 0 | 17, all passing |
| Providers supported | 0 (rule-based only) | 2 implemented (Claude, Mock); contract supports unlimited more with zero Role code changes |
| Roles with inference option | 0 | 1 (Positioning Strategist), by design |
| Failure modes explicitly tested | 0 | 2 (unparseable response, out-of-scope selection) |
| Reproducibility | Manual script run | `python3 -m unittest discover` — CI-ready |

## 6. Limitations (Explicit)

1. **No live model call has been made.** Everything above is validated against a mock. This is the single biggest gap between "Alpha" and "production-ready."
2. **Reasoning-quality comparison doesn't exist yet.** We've proven the harness is fair (same inputs, same downstream handling); we haven't proven a real LLM produces *better* Positioning reasoning than the rule-based stub — only that it's structurally interchangeable.
3. **Only one Role converted.** The other 8 Roles remain rule-based stubs — correct per your explicit scope, but means most of the system is still untested under AI-assisted conditions.
4. **Prompt is minimal.** `SYSTEM_PROMPT` in `positioning_strategist.py` is intentionally bare — enough to test plumbing, not tuned for reasoning quality.

## 7. Next Steps (Recommended, Not Yet Approved)

| Step | Rationale | Effort |
|---|---|---|
| Run `ClaudeProvider` against a live endpoint in a networked environment (e.g., local machine or CI with `ANTHROPIC_API_KEY` set) | The one thing this report cannot validate from here | S — code is ready, just needs network |
| Replace `MockProvider`'s canned response with varied/adversarial test fixtures | Current mock is too well-behaved; doesn't stress-test parsing edge cases beyond the two already covered | S |
| Add a second provider adapter (e.g., a minimal OpenAI-compatible one) purely to prove the "config-only swap" claim isn't aspirational | Directly tests the model-agnosticism invariant, not just asserts it | M |
| Convert Research Analyst Role (EB-015) using this same dual-mode pattern | Reuses the exact pattern proven here; addresses a previously identified high-severity gap | M |

## 8. Backlog Updates

| ID | Change |
|---|---|
| EB-027 (no automated tests) | **Closed** — 17 tests now exist and pass |
| EB-028 (Inference Engine not built) | **Partially closed** — contract + 2 providers built; live-call validation remains open, tracked as new EB-030 below |
| **EB-030** *(new)* | Live-test `ClaudeProvider` against real API in a networked environment | High | P0 for true production-readiness | S |
