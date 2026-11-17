# Backend and API verification at every frontend phase

Updated 17 November 2026 (Asia/Calcutta). This is a permanent phase checklist,
separate from the completed backend-repair tracker. The owner requested these
checks alongside every phase; success is scoped evidence, not a guarantee that
no vulnerability exists anywhere in the application or deployment stack.

Run `.venv/bin/python tools/verify_phase.py F03 --output /tmp/f03-verification`
with the current phase ID. It runs backend/unit/integration security regressions,
frontend units, lint/build, and both development and compiled browser/API suites
sequentially, fail-fast. It isolates SQLite, clears the model key, preserves
product quotas and records commands, commit/diff, exit codes and logs. Routine
checks use controlled inference, never paid generation. A technical pass does
not close a rejected/pending visual review or authorise a merge/deployment.

## Required loop

- [ ] Record phase/revision and changed functions, routes, dependencies and data boundaries.
- [ ] Revisit every applicability row below against actual imports, configuration and routes.
- [ ] Reproduce each relevant defect; make a bounded repair and targeted regression check.
- [ ] Confirm every registered API has a healthy authenticated contract and rejects anonymous access where required. `test_phase_security.py` inventories all 16 current method/route pairs; adding a route without a contract fails the gate.
- [ ] Run all six automated lanes and the complete browser workflow: five agents, chat/memory, two-agent triage, five-agent digest, history/detail, decision review/reload/new decision, export and logout.
- [ ] Exercise meaningful invalid/empty/error/stale-response cases, quotas, origin/session boundaries and relevant frontend rendering of untrusted text.
- [ ] Record dependency-advisory results separately. Do not hide findings behind a green functional test suite or silently update major dependencies.
- [ ] Save per-phase evidence below; unresolved applicable findings remain OPEN. Preserve all existing endpoint/data contracts unless a specific fix intentionally tightens invalid input.
- [ ] Recheck the blueprint's design/motion map, required owner reviews and at least two coherent implementation/test commits before advancing.

## Owner-requested threat inventory

“SML” was clarified as **SAML**; “Redis RAGX” was clarified as **regex ReDoS**.
There is no instruction to add Redis. Bcrypt's historical limit is **72 bytes**,
not universally 72 characters; the cited Okta condition required its particular
AD/LDAP delegated-authentication/cache path. Our long-credential checks verify
our different authentication path without claiming to reproduce Okta's service.

| Concern | Actual surface / disposition | Evidence required every relevant phase |
|---|---|---|
| HTTP/2 rapid reset | Deployment edge: Gunicorn here parses HTTP/1, not the public TLS/HTTP2 terminator | No flood test. Verify actual terminator version/reset-stream limits and provider mitigation at F14; not certified by Flask tests |
| 52-character username/cache truncation | No Okta/AD/LDAP/bcrypt credential cache; local configured operator credentials | 52/72/120-character usernames, >72-byte password with differing suffix, empty/wrong password; no cache-hit bypass |
| SAML bypass | No SAML/SSO routes or library in current auth path | Inventory remains absent; reclassify if identity integration is added |
| OAuth email spoofing | No OAuth/email-claim login | No email-to-account trust assumed; inventory and opaque-session rejection checks |
| GraphQL aliases | No GraphQL endpoint/engine | Route inventory catches new API surface; if added, require depth/complexity/alias-budget controls |
| 2FA code replay | No 2FA/OTP implementation | N/A to nonexistent OTP. Test actual session revocation/replay; do not call it a 2FA test |
| Regex ReDoS | Bounded prompt validation and fixed regexes | Reject oversized prompts before regex evaluation; bounded near-match corpus in a subprocess with timeout. Samples are not proof for every possible input |
| JWT algorithm confusion | No JWT authentication; opaque random server-side tokens | Unsigned/JWT-shaped/forged cookies cannot authenticate; revisit if JWT parsing is introduced |
| Request smuggling | Pinned Gunicorn HTTP/1 parser and future reverse-proxy chain | Reject CL+TE, duplicate CL and malformed header spacing in parser tests; real proxy/backend framing alignment remains F14 evidence |
| Cache poisoning/private response reuse | API/session/export responses | `no-store, private`, `Vary: Cookie`, no untrusted-origin reflection; deployed CDN/proxy cache and host policy still need actual edge verification |
| Spoofed IP | Trusted-peer-only forwarded-header middleware | Existing trusted-proxy/IP quota regressions; never trust internet-supplied X-Forwarded-For by default |
| Views bypass RLS | SQLite has no RLS; app is a shared operator workspace, not tenant-isolated customer storage | Existing namespace/thread/source-eligibility/parameterised-query tests. Do not promise per-user RLS isolation the product does not implement |
| Math.random tokens | Python `secrets.token_urlsafe(32)` for sessions; UUID4 IDs | Session creation, expiry and revocation tests; no client-generated auth token or JWT parser |
| Timing attack | Fixed-length digest comparisons and no username-only short circuit | Both credentials compared, generic failure; tests do not prove constant total network/DB response time |
| Padding oracle | No application CBC-decrypted credential/session payload | N/A to app crypto path; public TLS implementation requires deployed provider assessment |
| Prototype pollution | Python schema validation and React presentation of untrusted data | Reject noncontract payloads; `__proto__` data must not change object prototypes; no arbitrary JS deep merge/eval |
| Template injection | JSON/Markdown output and React text nodes, no user-supplied template execution | Template-looking input remains literal; no executable HTML/render_template_string/eval path |
| XXE file read | JSON-only request contracts; no XML entity parser | XML bodies rejected, no file contents reflected; revisit any XML parser/dependency addition |
| WebSocket hijack | No WebSocket endpoint | N/A to absent socket flow; cookie-bearing unsafe HTTP requests still need origin checks |
| Unicode | Multilingual prompt data; exact UTF-8 credential comparison with documented username case policy | Preserve legitimate multilingual/emoji input; reject malformed surrogates/deep JSON; homoglyph/zero-width credentials do not alias the operator |

## Current F03 evidence record — IN PROGRESS

Base `c66aa84`; visual composition is awaiting revision after owner rejection.
Security regressions first reproduced missing cache headers, disallowed-origin
mutation attempts, password trimming and comparison short-circuiting. The bounded
patch adds no-store API responses, safe MIME handling, unsafe-request origin
validation, exact password comparison and malformed Unicode/nesting rejection.
Valid endpoint result shapes and controlled-inference workflows remain unchanged.

Targeted evidence is under `/workspace/reviews/f03-security-*.log`. Final full
gate counts, dependency findings and exact implementation commits must be filled
before phase closure. HTTP/2/proxy/TLS deployment checks remain explicitly open
for the actual release environment; do not mark them PASS locally.

Current targeted results: 25 failures/31 passes before repairs, followed by
73 targeted security/sanitization/proxy passes; the parser/ReDoS/new security
subset passes 62 tests. Full backend regression passes 411 tests. The complete
phase runner is recorded under `/workspace/reviews/f03-loop-verification/`;
final browser results and its report must be consulted rather than assuming
completion from these intermediate counts.

Dependency scans, 17 November (separate from application security regressions):

- `npm audit --omit=dev --json`: zero reported production-JS advisories.
- Full `npm audit --json`: 15 affected package entries (4 high, 7 moderate,
  4 low), in the development/build dependency graph. Several report no available
  fix, including current Vite/PostCSS entries; do not claim zero findings or run
  a forced major-version update without assessing compatibility. Reports are
  `/workspace/reviews/f03-npm-audit.json` and `f03-npm-runtime-audit.json`.
- `pip-audit --path .venv/lib/python3.12/site-packages`: 73 distributions scanned;
  14 advisory entries, including duplicate IDs, across pip 25.0.1 and Requests
  2.32.4. The Requests advisory concerns direct `extract_zipped_paths()` usage,
  which this application's ordinary HTTP client path does not invoke; its
  reported fixed version is 2.33.0. Pip findings concern the development installer,
  not an exposed login/API endpoint. These remain tracked update/release tasks,
  not a statement that scans are clean or every deployment image is assessed.
  Reports: `/workspace/reviews/f03-python-audit.json` and its log.

No HTTP/2 flood, external penetration test, deployed proxy cache inspection or
timing-channel proof has been performed. Dependency advisories and deployment
checks have their own disposition; a green offline functional report is narrower.

## Per-phase evidence template

Phase/revision/working delta:
Changed API/function/dependency boundaries:
Targeted failure-before and pass-after evidence:
All API contract/auth/cache checks:
Full gate report and six lane results:
Dependency scan scope/findings/disposition:
Owner visual acceptance and phase-specific browser checks:
Threat rows PASS / N/A with reason / OPEN deployment evidence:
Atomic commits, remaining limitations and next-stage eligibility:
