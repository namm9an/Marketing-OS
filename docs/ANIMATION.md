# Marketing OS — animation, interaction and role explanations

Updated: 18 November 2026 (Asia/Calcutta).
Status: sitewide motion specification revised from the reference study and supplied
components; implementation/visual acceptance remain open. Phase 1/Phase 2 are retained.

**Before phase work or resumption:** read [PHASE_EXECUTION_GUIDE.md](PHASE_EXECUTION_GUIDE.md),
including its saved checkpoint. It explains how to correlate these files, resolve
placement/behaviour questions, choose skills/subagents, execute the audit/fix/
review/test loop and then understand the next phase. Do not code an unresolved
product/art decision or unfamiliar mechanism by guessing.

**Standing project-wide rule:** every owner instruction about design, skills,
audit, testing or process applies to all affected phases by default, past/current/
future. An imminent-phase example does not narrow it. Read the blueprint's
standing instructions and this file's all-phase counterpart contracts; update
all three files and affected acceptance evidence before continuing changed work.

Local working copy only: no staging, commit, push or deployment without a new
owner instruction. These edits change no app, capture, dependency or environment.

Read with [the blueprint](MARKETING_OS_BLUEPRINT_PLAN.md), [design/layout](DESIGN_AND_LAYOUT.md)
and the local [website study](/workspace/reviews/WEBSITE_REFERENCE_STUDY.md).
Original Claude text stays verbatim in the
[historical archive](FRONTEND_DESIGN_WORKING.md#16-original-claude-documents--verbatim-snapshots).

**Phase correspondence:** these 16 sections, M01–M21, P01–P21 and A01–A24 are
requirements for the one Phase 0–Phase 14 roadmap. Read blueprint §6/§10/§11 before work
and closure. All six technical/design lanes plus required owner review apply;
each Phase 7 child has an independent gate. Blueprint §20 records superseded ideas.

When a backend gap reopens verification, revisit every phase's applicable motion
and state checks through the discovery phase. Verify that actual data readiness,
errors, retries, cancellation and reduced-motion equivalents still work where
the repair touches them. Record the result in the cumulative phase review.
[Backend gap procedure](PHASE_EXECUTION_GUIDE.md#backend-gap-discovered-during-any-phase)

## 1. What motion must achieve

The opening tells visitors what the product does and responds locally to
their pointer over the product name. The first page scroll reaches a separate
quiet introduction. The third section brings five roles into clockwise focus.
A card click opens its dossier; the dossier's How it works action starts its
own explanation. The visitor can continue down to results, case previews and
the console close. Keep the existing Phase 3 dither character throughout.

Every major effect supports visual identity, attention, continuity or feedback.
Expressive composition is wanted; arbitrary motion clutter is not. Study the
references' art preparation and mixed rendering rather than attributing their
polish solely to WebGL or a library. The core connected prototype belongs to Phase 3;
later role explanations and production integration refine that same visual world.

After a card click, show purpose, a short brief and a useful genuine result.
Offer sources/rationale and a separate How it works action. Engineering has its
own section. A case preview earns its place in a headline and a few lines;
full results and sources remain available to open.
Machine motion is an explanatory metaphor, never hidden model thought, a claim
of unsupported automation or a timestamped replay of actual inference.

## 2. Confirmed direction, proposals and discarded defaults

| Item | Current status / consequence |
|---|---|
| Light paper/ink/yellow/peach/brown | Retain exact UI tokens; no dark/green/orange template imitation |
| Clockwise circular/spiral five-agent cards | Confirmed discovery direction; earlier stack-only investigation is superseded |
| Opening → quiet intro → clockwise gallery → clicked dossier | Confirmed sequence. The first scroll reaches the intro. Gallery focus and explicit dossier opening use separate state |
| Spider Button | Confirmed on secondary Explore the agents; Open console is primary. Stable semantic actions and local pointer/focus feedback |
| Vector Wordmark | Confirmed current-scale first-screen product name, with Marketing Helper as the working name. Pointer-local dotted contours, connecting guides, outlined squares and coordinate numbers. Final name and actual rendering open |
| Clicked role explanations | How it works starts a distinct 2D explanation for each role. PR checkpoint and separate human review come first, then four different role patterns |
| Two-agent comparison, one shared stage | Confirmed; all five discoverable, preserve pair on return |
| Genuine saved examples | Phase 2 complete; routine tests controlled; selection/replay makes no inference or writes |
| Dithering and pixel loaders | Reuse the existing Phase 3 dither throughout the website. Pixel feedback belongs inside a genuinely pending stage |
| Stop holds, reverse reverses | Main proposed direct-progress contract; no inherited automatic drift |
| Literal book/hinged cover, static generic machine boxes | Rejected candidates; not accepted art or fallback style |
| Global pinning, universal WebGL, five simultaneous/autoplay machines | Use local scroll progress and at most one explicit playback. Set aside WebGL shaders, live 3D, physics, animated SVG and a separate slider |
| Visitor camera rotation, second theme, copied botanical/voxel identities | Set aside under the current scope |

Current component/scene/rendering packages do not establish implementation.
A prior connected homepage exists with earlier trials. The new Wordmark,
section pacing, header, hover, gallery arrival and clicked states await
implementation and visual acceptance under Phase 3 revision 7.

## 3. Truthful data and scene states

| Information | Binding rule |
|---|---|
| Actual brief/output/request-captured facts | Attribute to stable agentId/exampleId, preserve source snapshots |
| Observed validation/risk/review | Show only events the record/contract contains; risk and human review remain separate |
| Illustrated role steps | Explain the actual brief, output and review state. Claim support comes from linked evidence |
| Asset readiness | Real fetch/decode/renderer state; no invented percentages or thinking stations |

One-shot selects one specialist; triage briefs two; digest uses five plus synthesis.
An orbit containing five agents does not imply five calls. Do not animate live
social scraping, phrase removal, legal clearance, scheduling, TCO optimization or
memory admission unless actual contracts support the shown event. Missing fields
stay missing; a generated knowledge_units summary is not a captured fact corpus.

### Proposed presentation state boundaries

```text
saved data: agentId + exampleId + result/evidence (read-only)
page: section progress + focused agent + navigation intent
dossier: closed OR opened agent/example (explicit card selection)
wordmark: resting OR local pointer proximity to displayed letters
comparison: up to two agent IDs (independent of active stage)
assets: idle → loading → ready OR failed → readable fallback
playback: ready → playing ↔ paused → completed; replay resets deterministically
```

Opening/replay/compare/scroll never generates, reviews or writes memory. Only
explicit authenticated console submission/review uses those APIs. A new agent,
example, close, back, unmount or reduced-motion change invalidates obsolete work.
Use an intent/version token or equivalent cancellation; old asset promises,
frames and timed reveals cannot replace the new result. Static content is usable
through asset loading/failure, not hidden behind the render-state machine.

## 4. Role-specific 2D explanation family

Use the same art family as the discovery cards and comparison thumbnails. Keep
real fields, choices and results in DOM. The examples below are candidates to
review with current art and actual recorded evidence. Each has an intentional
trigger, an ordered explanation and a useful final static state.

| Role | Phase | Candidate sequence |
|---|---|---|
| PR & Policy | 5 proof, 6 playback | Show the claim and supporting evidence, highlight the risk checkpoint, then show a distinct human-review path and its actual status |
| Branding | 7A | Bring the brief, audience and evidence into focus in order, then reveal the positioning line |
| Social Community | 7B | Pair a labelled supplied signal with the editorial decision, then reveal the proposed response |
| Product Marketing | 7C | Highlight the exact comparison fact and units, then the supported message or offer |
| Field Events | 7D | Reveal evidence from public agendas or a supplied brief, compare formats and highlight the recommended option and its rationale |

For each explanation review the start, decision and result poses, exact
data bindings, normal and missing states, reset during a role change,
real asset readiness, readable fallback and startup cost. Use tightly
scoped DOM/CSS transitions. Canvas2D can support decoration if it earns its
cost. Keep the earlier physical scenes as historical design exploration.

## 5. Scene controls and comparison behaviour

- Scroll focuses a card. Clicking the card opens information, brief, result
  and sources. The opened dossier has a separate How it works action. That
  action opens the shared stage and starts the specific role’s explanation
  once ready. Pair selection is independent of all three steps.
- Use accessible Play/Replay, Pause and Close. Next/Back stations are optional
  only when useful. Completion holds a useful result, not endless restart.
- Keep two-agent comparison visible/readable independently of playback. One shared
  stage shows one selected agent; opening another cancels/releases prior work.
- Retain comparison pair and active example on close; restore correct focus,
  route and document position. Use one gallery and one active explanation.
- Direct exploration must skip preceding beats. Keyboard/links never require
  precise hover, sound or frame-perfect timing. Guided sequencing
  is baseline; visitor rotation is unapproved and page scroll stays ordinary.
- Rapid switching, close during load, replay after completion, back during travel
  and reduced-motion changes have deterministic latest-intent behaviour.
- Native buttons/links retain meaning and hit bounds while decorative layers move.
  If inline stage becomes a modal, specify actual focus containment/Escape/return;
  do not silently adopt a modal or lock scroll because a template did so.
- Compare/scene controls never invoke triage, inference, review or memory writes.
  Actual console actions and review state remain server-authoritative.

## 6. Engineering explanation and optional supporting detail

The primary agent view explains the job, brief, scene and result. Sources and the
model's written rationale are secondary detail. Use the separate “How it’s built”
section for the broader engineering story; do not automatically place a technical
execution panel beside every agent.

Claude proposed six stations: Input, Retrieve, Model call, Validate, Govern, Output.
Retain their existing data bindings for accurate explanation and verification.
They are not a requirement to render every stored field in the public interface:

| Station | Evidence to display | Boundary |
|---|---|---|
| Input | Supplied goal/message and labelled signal | Simulated input is labelled |
| Retrieve | Actually captured retrieved facts, IDs/domains, or truthful available summary | No invented rows; chat recall differs from one-shot summary |
| Model call | Explain the provider's role and real workflow; retain actual source, model, attempts, usage and timing in verification records | No fake live state or invented measurements; no public capture/test timestamps, quota/debug notes or troubleshooting panel |
| Validate | Actual structured-output acceptance where that workflow uses it | Do not claim every prose chat response passed the strategy JSON schema |
| Govern | Recorded risk/escalation and, separately, review state | Human review and memory admission are distinct |
| Output | Untouched stored response, with an explicitly labelled excerpt if needed | No hand-edited “model output” |

Missing evidence leaves a station incomplete/unavailable with a plain explanation, not a fabricated success. The scene can still communicate the supported high-level story.

Phase 2 provides these six station bindings through `adaptAgentScene`, for each attributable one-shot specialist. They are data projections, not an implemented renderer, animation timeline or hidden-reasoning trace. Captured source rows support Retrieve; a generated summary alone leaves it partial. Successful one-shot schema acceptance does not establish claim entailment. Risk escalation stays separate from absent human-review events. All five genuine Flash-Lite captures now pass the Phase 2 gate at `0dc18d6`; the static inspector reads saved files only. Future scenes must retain the unverified-output/source-coverage boundary and may not turn a limited corpus into proof that a competitor lacks hardware. This pass approves no scene material or physical motion.

### Engineering transitions and evidence

Retain normal DOM engineering content and anchors; selectively reveal an actual
workflow/architecture diagram without making visitors decode an ornamental
machine or six fake success lamps. Source links are real links; identifiers,
counts and review status follow actual records. Incomplete evidence is not
upgraded by a visually convincing animation. Keep recorded/live/mock distinction
where meaningful, but operational capture dates/quotas/debug details stay in
verification records, not the landing experience.

## 7. Timing and all 21 supplied motion notes

Starting timing ranges: routine UI 150–250ms; a readable scene beat roughly 400–900ms; a short explanatory scene roughly 4–6s when the actual content fits. These are experiments. Reading a longer result must not be compressed into an unreadable typewriter sequence to meet a number.

Use named timing/easing constants. Prefer a quick response with a controlled settle. Use scroll progress directly for reviewed spatial discovery and retained-artifact transitions, short triggered transitions for UI, and a deterministic elapsed-time playback clock for clicked role explanations. Keep those ownership models separate.

The owner's “20 days” list contains 21 techniques. All are retained below; conditional techniques are not requirements to invent controls.

| ID | Original technique | Application / acceptance |
|---|---|---|
| M01 | Ease out for entrances | Starting choice for triggered arrivals; do not unpredictably time-ease scroll position |
| M02 | Dropdowns 150–250ms | Use for real dropdowns and test rapid/keyboard input |
| M03 | Stagger list rows by 30ms | Starting value for short lists; do not delay large data tables |
| M04 | Buttons scale to 0.97 on press | Optional feedback; keep text legible and hit area/layout stable |
| M05 | Stretch moving knobs by 12% | Only if an actual useful draggable knob exists; otherwise N/A |
| M06 | Stagger when details settle | Introduce supporting information after the focal object is understandable |
| M07 | Arcs for object movement | Circular/spiral discovery and purposeful role paths can use arcs; review depth and direction rather than decorating every control |
| M08 | Pulse to confirm success | One local confirmation for an actual success; no perpetual fake-live pulse |
| M09 | Ease in-out for on-screen movement | Starting choice between known scene positions |
| M10 | Popovers start at scale 0.95 | Optional, subtle; verify text clarity and reduced motion |
| M11 | Enter from the trigger | Preserve the connection between control and opened content |
| M12 | Exit toward the trigger | Use when the trigger exists; restore focus |
| M13 | Do not fade into the centre | Avoid detached generic entrances; prioritize understandable spatial continuity |
| M14 | Do not use spring balance for everyday UI | Interpret as avoiding routine bounce; clarify the wording if another meaning was intended |
| M15 | Do not tween a handheld animation | Interpret as direct manipulation following the pointer immediately; original wording remains open to clarification |
| M16 | Exits about 20% shorter | Starting heuristic for triggered UI, not a fixed rule for reverse scroll |
| M17 | Bring new state in as old state leaves | Keep continuity without overlapping unreadable text or accepting stale callbacks |
| M18 | Masks for reveals/colour changes | Use where helpful, retaining accessible DOM text and reasonable paint cost |
| M19 | Crossfade icons with scale and blur | Optional for a real state change; preserve label/focus/hit area and correct state during interruptions. Scale/crossfade may help; blur must justify readability/paint cost and is omitted under reduced motion |
| M20 | Rubberband past drag boundaries | Only for real bounded drag interactions; never rubberband the page or keyboard navigation |
| M21 | Reuse layout IDs for shared objects | Use for the proposed foreground-card→dossier bridge where appropriate; scope IDs by instance/agent/example and avoid duplicate comparison/preview collisions |

For each implemented interaction record which notes apply, which are N/A, and why. Do not claim all 21 are implemented simply because they are listed.

The owner's 17 November additions are researched as C01–C10 in design/layout §5.
Carousel edge masks (C06) refine M18 only if a useful horizontal track exists;
mask the visual track, not essential controls or readable results. Keep the
active/focused item in the clear area and leave navigation/focus visible.
Icon-swap blur (C07) is the existing optional M19, not a new required effect.
No additional carousel, blur sequence or decorative gradient is required by
these tips; the selected five-agent gallery is a separate owner decision.

### Clocks learned from the references

Freeland reports timed text/project entrances, scroll-scrubbed text and an opaque
automatic gallery/fold. Strata's supplied gallery combines a smoothed scroll
angle and idle time; services use scroll-selected bands followed by timed wipes;
landmark uses smoothed crop progress; hero/footer/CTA use other clocks. These are
separate systems, not one perfectly scrubbed timeline. For Marketing OS choose
each clock deliberately: no hidden idle drift, queued wipes or double smoothing
on the main selection path. Routine UI may settle after input stops; that does
not authorise the main dossier selection to keep changing.

## 8. Rendering architecture and property ownership

| Layer | Proposed owner | Boundaries / implementation checks |
|---|---|---|
| Document/nav/text/results/forms | React DOM, CSS and native browser behaviour | Readable without graphics/init, no essential text inside a texture |
| Scroll transport | Native scroll and section-relative progress | Keep one progress owner. Compare short glides while preserving wheel, trackpad, keyboard and reduced-motion behavior |
| Agent gallery | Native section progress and DOM/CSS depth | Five focal beats; scroll focus, explicit dossier and playback have separate owners |
| Wordmark | Local pointer-driven CSS or Canvas2D overlay | Guides near actual hero letters, semantic rest state, settle on exit; no scroll binding |
| Spider CTA | Native link and bounded CSS or Canvas2D decoration | Stable target, visible focus, reduced motion and usable fallback |
| Navigation and general hover | Shared DOM control, CSS/Motion with one property owner | Visual feedback stays local. Any expansion has click/keyboard/tap and Escape recovery |
| Dossier/compare/viewer | React state with bounded CSS/Motion transitions | Stable selected ID and latest intent wins |
| Role explanations | React DOM/CSS, prepared layers, optional Canvas2D ornament | One active playback, useful static equivalent, real readiness, cancel and clean up |
| Text and engineering | Semantic DOM and short feedback/reveals where they clarify state | Copy stays readable before animation and on failure |

The supplied Originkit sources use richer graphics. The current plan adapts
their behavior within DOM, CSS and Canvas2D. Animated SVG, WebGL shaders,
physics and live 3D animation are out of scope. Keep per-effect ownership of
timers, listeners, observers and frames. Stop unnecessary work offscreen or
when playback ends, and verify cancellation and resource cleanup after
switch/unmount. Prepared assets and animation startup failures retain the
readable state. [Implementation references](/workspace/reviews/WEBSITE_REFERENCE_STUDY.md#phase-motion-and-case-study-research)

## 9. Connected page choreography and spatial geometry

### All-phase counterpart contracts — owner standing instruction, 18 November

At each milestone open the matching [blueprint phase row](MARKETING_OS_BLUEPRINT_PLAN.md#phase-to-specification-and-verification-table)
and the phase's [milestone sequence](MARKETING_OS_BLUEPRINT_PLAN.md#milestones-for-every-phase).
Use this file to identify the state owner, trigger and clock, behavior during
pause/reverse/interruption, focus, asset readiness and readable fallbacks.
Record what is inherited and what later phases must preserve. Check a cited
reference if it answers a specific mechanic. Review the actual candidate and
record motion evidence and requirement IDs at M5.

This table applies to EVERY phase, including prior phases affected by new input,
the present phase and all future phases. It is not a Phase 3-only rule. The
blueprint has a concrete completion contract and all 39 original design checks
inside each independently tracked phase. Re-read that contract and BOTH counterpart
rows before build/audit; current owner decisions update every affected row and
reopen its evidence. Do not treat a recorded phase as permanently locked.

All phases inherit the agreed palette, actual-product/data requirements, reference
lessons, component/state consistency, original U/S/V/C/M/P/A review criteria and
the Ponytail implementation → audit/fix/re-audit → connected-code review/fix → full
tests/user simulation/owner acceptance loop, with Hallmark/build-design and React
specialist in their scoped roles. A tool's use must fit real work: backend-only
changes preserve and verify existing visual contracts, not invent a new UI; the
research phase records design/decision evidence rather than fake runtime results.

| Phase / linked contract | Motion, state, rendering and interaction requirements | Evidence required in the phase audit |
|---|---|---|
| [Phase 0: Reference synthesis and decisions](MARKETING_OS_BLUEPRINT_PLAN.md#phase-0-completion-contract) | Record scroll/pointer/playback distinctions, geometry/renderer uncertainty, static/reduced-motion and original scene-story requirements without claiming implementation. | Document/source/decision consistency and owner direction; no fabricated runtime test or paid capture. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 1: Functional baseline](MARKETING_OS_BLUEPRINT_PLAN.md#phase-1-completion-contract) | Request/agent switching cancels stale work; pending/success/review follows real events, preference changes preserve readable flow and navigation. | Browser login, all agents, chat/memory, triage/digest, history/review/new decision, export/logout and API/session regressions. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 2: Data and saved examples](MARKETING_OS_BLUEPRINT_PLAN.md#phase-2-completion-contract) | Saved selection has no inference/write; exact identity, absent fields and risk/review data support later scenes without invented timings or hidden reasoning. | Adapter/null/legacy/source/recording hashes and read-only selection/network checks; controlled fixtures distinct from genuine captures. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 3: Opening and discovery](MARKETING_OS_BLUEPRINT_PLAN.md#phase-3-completion-contract) | Local hero pointer effect, distinct quiet intro, third-section orbit, individual arrival beats, clicked dossier, separate How it works handoff and results exit; keep reduced-motion/failure paths | Actual motion, rapid input, full frontend/backend workflow and all original design/animation checks |
| [Phase 4: Visitor comparison](MARKETING_OS_BLUEPRINT_PLAN.md#phase-4-completion-contract) | Pair and active agent/stage stay separate; replacement/open/close preserves context and focus, cancels obsolete transitions and never starts inference. | Empty/one/two/replace/long/missing comparison states, direct return, keyboard/focus and network/write assertions. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 5: PR 2D proof](MARKETING_OS_BLUEPRINT_PLAN.md#phase-5-completion-contract) | Readable input, checkpoint and result frames, causal order, real readiness, motion fallback and a measured budget. | Verify stills, field bindings, broken assets, repeated opening, fallback and comparison regressions. All 39 U/S checks and applicable V/C/A/M/P checks accounted for. |
| [Phase 6: PR animated scene](MARKETING_OS_BLUEPRINT_PLAN.md#phase-6-completion-contract) | Elapsed-time play/pause/replay/close, purposeful anticipation/arcs/settle, held final result, latest-intent cancellation and one active scene. | Actual owner motion review, mid-load/play close/switch/preference/failure tests, replay read-only and full gate. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 7A: Branding scene](MARKETING_OS_BLUEPRINT_PLAN.md#phase-7a-completion-contract) | Purposeful input/evidence/output poses, no invented ranking/thought; guided deterministic controls, real loading and static/lifecycle equivalents. | Branding-specific attribution and scene/compare handoff, owner review, all 39 design checks and independent full gate. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 7B: Social scene](MARKETING_OS_BLUEPRINT_PLAN.md#phase-7b-completion-contract) | Signal/context/output explanation without fake monitoring/sentiment/posting; guided play/close/switch/fallback with correct active identity. | Signal provenance, original card/stage story, no unsupported action, all design checks and independent full gate. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 7C: Product Marketing scene](MARKETING_OS_BLUEPRINT_PLAN.md#phase-7c-completion-contract) | Facts-to-output explanation without invented TCO/optimization; guided playback, direct switches, long-value readability and fallback/resource ownership. | Exact source/unit/availability attribution, no fake computation, owner review, all design checks and independent full gate. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 7D: Field Events scene](MARKETING_OS_BLUEPRINT_PLAN.md#phase-7d-completion-contract) | Brief/context/recommendation motion without booking/scheduling/budget execution; deterministic controls, loading/failure/static and cancellation. | Recommendation attribution and no implied execution, owner review, separate full gate and retained prior-agent regressions. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 8: Joined exploration](MARKETING_OS_BLUEPRINT_PLAN.md#phase-8-completion-contract) | One agent/example source of truth, independent pair/playback, focus/scroll/back restoration, canceled stale loads and one active renderer. | Discover/compare/open/inspect/close/back through each agent under rapid input/asset/preference failure, read-only plus full gate. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 9: Production choreography](MARKETING_OS_BLUEPRINT_PLAN.md#phase-9-completion-contract) | Finish the reviewed same-page glides, header response, hover states, native orbit release and dot-matrix close. | Verify direct entry and back, forward/reverse/fast scroll, pointer and focus crossing, Escape, reduced motion and inert fallbacks. All 39 U/S checks and applicable V/C/A/M/P checks accounted for. |
| [Phase 10: Evidence and claims](MARKETING_OS_BLUEPRINT_PLAN.md#phase-10-completion-contract) | Use ordinary document flow and short disclosures for preview, source and case detail. Preserve semantic rendered copy. | Inspect representative short and long cases, report labels and relevant evidence, and verify source/corpus and read-only behavior. All 39 U/S checks and applicable V/C/A/M/P checks accounted for. |
| [Phase 11: Console and login](MARKETING_OS_BLUEPRINT_PLAN.md#phase-11-completion-contract) | Prompt real feedback with no fake stage/progress, interruptible entry, stale-request isolation, honest review/session and no unrelated decorative shader. | Every run/chat/triage/digest/history/review/export/login/logout state, provider/auth failures, actual APIs and full gate. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 12: Devices, accessibility, performance](MARKETING_OS_BLUEPRINT_PLAN.md#phase-12-completion-contract) | Native/reduced-motion alternatives, real Safari viewport/keyboard, capability/failure, frame/DPR/startup/idle/memory and complete lifecycle measurement. | Named desktop/mobile widths, real-browser/manual+a11y evidence, every effect and all common workflows/checklists. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 13: Combined acceptance](MARKETING_OS_BLUEPRINT_PLAN.md#phase-13-completion-contract) | Full normal/reduced/failed-graphics and interrupted motion journey, every agent scene/control, no stale identity or hidden essential content. | Fresh full showcase→console user simulation, all agents/workflows/error/security cases, exact final revision and release evidence. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 14: Deployed acceptance](MARKETING_OS_BLUEPRINT_PLAN.md#phase-14-completion-contract) | Real chunk/asset/cold-start/loading/failure, deep routes/session focus and motion/capability costs; local scores do not establish deployed behaviour. | Only after deployment request: actual URL smoke, persistence/session/proxy/security and complete product/design workflow. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |

Graphite/dithered imagery and genuine pixel loading are project-wide treatments:
create/review them at their owning phase, then maintain them consistently in
later comparison/scene/route/evidence/console/device/release phases where relevant.
A feature need not be rebuilt in every phase; preserving/testing its accepted
behaviour is a concrete obligation. Rejected/superseded treatments must propagate
to every affected use. Actual placement/intensity/art still needs evidence, not
a silent N/A or a blanket claim that every optional trend is mandatory.

### Phase 3 animation counterpart — revision 7, 18 November

Read alongside the [blueprint ledger](MARKETING_OS_BLUEPRINT_PLAN.md#phase-3-completion-contract)
and [design counterpart](DESIGN_AND_LAYOUT.md#phase-3-design-counterpart--revision-7-18-november).
The previous [motion recording](/workspace/reviews/phase-3-connected/scroll-review.mp4)
and [audit](/workspace/reviews/phase-3-connected/ponytail-candidate-audit.md)
show earlier trials. Assess new evidence against this revision.

| Shared IDs | Required motion and behavior | What to observe |
|---|---|---|
| P3-01/P3-07/P3-09 | Product opening and quiet first scroll precede the orbit; measured entry and exit for the new spherical tile trial and a separate pointer rotation clock | Compare native handoffs, then verify first-scroll hold and reverse, five reachable roles, tile pull-forward, rapid input and results release |
| P3-02/P3-05 | Contemporary role artifact set and the same Phase 3 dithering throughout | Legible layers in motion, no interfering grain or loss of result contrast |
| P3-03/P3-04 | Stable primary Open console and secondary Spider Explore; first-screen wordmark reacts to nearby pointer | Real pointer trace between letters, number/square formation, exit, independent page scroll, keyboard and stable fallback |
| P3-06 | Pixel pending tied to actual stage load | Slow, ready, failure, retry and cached asset sequences |
| P3-08–P3-11 | Focused role, clicked dossier and separate How it works remain distinct; stable identity, visible header links and local hover | Stable targets, click/focus/tap, direct destinations, fast switches, correct result and restored gallery position |
| P3-12–P3-15 | Lifecycle, budgets, static equivalents and read-only saved data | Failure/preferences, offscreen and repeated switching, network/resource samples |
| P3-16–P3-18 | Current verification, audit/review and owner acceptance | Record evidence for the actual revision |

### Timeline and trigger ownership

| Beat | Trigger and motion | End condition |
|---|---|---|
| Opening | Semantic name and copy at rest. Pointer through the name traces dotted contours, connecting guides, outlined squares and coordinates around adjacent letters | Marks settle when the pointer leaves. The current-scale name stays crisp; scroll moves the opening normally out of view |
| Quiet introduction | First scroll reaches the short primary statement and subdued support in normal flow | Both lines can be read before the orbit starts |
| Spherical discovery trial | Bounded scroll progress reveals and releases the image sphere. Local pointer movement rotates the image tiles in depth | Scroll stops and retraces the handoff. A foreground tile leaves the dossier closed until activation. |
| Tile activation | A stable tile represents one role. Activation brings that image forward and opens the dossier with the role, brief, result and optional evidence | Information remains readable. Close/back returns to the original tile and previous gallery position. |
| How it works | A separate user action runs the role's distinct explanation using a playback clock | Stop on a useful final pose. Provide pause, replay and close plus static explanation. Phase 5/6 PR pilot, then Phase 7A–D |
| Results and close | The gallery releases into ordinary document scroll. Later phases add a changing workflow panel, featured result reveal, short case rows and dot-matrix footer | Case detail opens intentionally. Closing console action remains usable without its decorative visual |

Phase 3 review starts with a storyboard and short recorded prototype of the
opening, intro, orbit and one clicked dossier with its exit. Compare the
provided near-letter reference before expanding to all five cards. Research
candidate components for all five explanations as part of planning. Before
each later scene, validate its component, timing source, data binding, resource
budget and fallback. Each gallery arrival beat is distinct from the explanation.

Preserve the dither texture as an existing sitewide visual treatment; the
Wordmark and footer dots are separate local effects. Use the
[execution guide's placement record](PHASE_EXECUTION_GUIDE.md#4-placement-and-behaviour-record-for-every-chosen-technique)
for each chosen component and the normal audit/review/full gate for each phase.

### Same-page glide and input trials

Compare a view-progress translation/opacity handoff in normal flow with
a short sticky overlap at the quiet-intro-to-orbit boundary. Keep headline,
copy and controls visible at rest. On first scroll the intro has its own
readable beat. Inspect hold, reverse, fast skip, resize, direct Explore,
and release into results. Use a single scroll progress source. Keep the
pointer-led wordmark and clicked playback on their own clocks. Phase 3
compares the behavior and Phase 9 finishes the accepted version.

Use the owner's selected visible desktop links. Underline or fill on hover
and focus with a stationary hit target. Hover and focus can indicate that
a card is actionable without selecting it. Test pointer exit, focus return,
keyboard navigation, tap and reduced motion. The current M1 wheel pose
was rejected. The supplied Orbit Sphere clip is the reference for local
rotation and selected-image pull-forward. The proposed M3 split uses scroll
for entering and leaving the stage, pointer input for rotation and explicit
activation for selection. Exact input mechanics await a prototype.
The integrated candidate uses normal document flow with one structural
scroll-glide treatment. Local drag controls rotation. Explicit activation
pulls forward the selected image and opens the matching dossier. Closing
returns focus to the opener. The static explanation handoff remains separate
from the later agent-scene playback.
[Clip study](/workspace/reviews/WEBSITE_REFERENCE_STUDY.md#orbit-sphere-and-moss-island)
· [Candidate motion](/workspace/reviews/phase-3-final/walkthrough.mp4) [Source comparisons](/workspace/reviews/WEBSITE_REFERENCE_STUDY.md#phase-motion-and-case-study-research)

### Geometry and selection contract

Use clamped progress from measured section travel, for example
`p = clamp(-sectionTop / max(1, sectionHeight - viewportHeight), 0, 1)` for a
bounded sticky stage. Resize/layout changes recompute the range. Pinning is
section-local if useful, not a requirement for the entire page or hero. Exact
travel, radius, tilt, camera distance and card size are prototype measurements.

A circle can start with five angle offsets separated by 2π/5. Translate x/z
from sine/cosine, choose purposeful vertical variation for the reviewed circular
or spiral path, and derive projected size/position plus z-order/depth treatment.
A helix adds vertical offsets; it is not automatically the same geometry as a
tilted ring. Keep cards legible and broadly camera-facing unless reviewed poses
justify another orientation. Avoid projection singularities, excessive rear
shade and ambiguous overlapping hit areas. Prove each agent has a usable focal
state; do not copy Strata's eight-image 0.75-turn counter as five-agent coverage.

Track a focused agent from scroll progress, then bind an opened dossier only
to the stable agentId/exampleId of the clicked card. Use active bands and
tie-breaks to keep focal arrival stable. Direct selection synchronizes scroll
and opens the intended dossier. Comparison pair and How it works playback
remain separate; obsolete callbacks may not change the opened or playing role.
Keep focused controls visible.

Stop holds; reverse retraces. No independent idle contribution on the main path.
Another selection, wheel/trackpad input, navigation or back interrupts ongoing
programmatic travel: latest intent wins, no queued services-style wipes. Bounded
local UI feedback can finish independently without changing selected identity.

The secondary Explore CTA takes a direct focus-aware path into the gallery.
Primary Open console goes to the product. Both paths support native input. No scroll/selection/replay causes inference, approval or memory writes.
Reduced motion and failed graphics show useful static selection/results. Exact
art/wordmark placement/light/depth/travel are shown for review, not assigned to
the owner as arbitrary technical constants.

### Historical implementation, not the new direction

Inherited deck values: 600vh; knowledge interval 0–0.06; split tabs 0.06–0.13;
first expansion 0.13–0.15; five arrivals 0.15/0.32/0.49/0.66/0.83; stack offset
40px, scale step 0.03. Claude's archived 0.11 boundary differs from code's 0.13.
These describe old code, not required pacing for the replacement.

Rejected study through 9f0a3e7 used a 320vh hinged-paper track, native scroll and
Motion, static/narrow fallback. Rejected later schematic stills were not an
approved replacement. Preserve useful hold/reverse and data contracts, replace
the visual model deliberately and update constants/tests with reviewed geometry.
Phase 3 owns the opening and core orbit. Phase 9 integrates the reviewed
opening/intro/orbit with comparison and scenes, the normal-flow exit through
workflow and results and the dotted closing wordmark, using separate clocks.

## 10. Accessibility, performance, and fallback

| Failure/preference | Required sitewide behaviour |
|---|---|
| Scripts/effect init unavailable | Semantic heading, links, five-role explanation and available results visible; no permanent overlay/zero-opacity content |
| Asset, Canvas2D or initialization failure | Wordmark/Spider/native actions remain; explanations have a static useful equivalent |
| Missing/broken image, decode/asset failure | Stable geometry, meaningful fallback/alt, honest retry if useful; never only a fabricated functioning screenshot |
| Reduced motion, including runtime changes | Bypass spatial travel, parallax/looping/forced autoplay and smoothing; preserve selection, readable result and controls |
| Keyboard/zoom/long copy | Focus visible outside masks/occlusion; semantic order and correct close/back return; content grows without clipping |
| Hidden/offscreen/unmounted | Stop relevant work and dispose owned resources; test repeated re-entry and switching |
| Narrow/touch view | Existing native readable flow now; bespoke responsive/touch art and Safari validation in Phase 12 |

Reduced motion is per effect, not a token flag. Freeland disabled it in reported
effects; Strata sometimes removes smoothing but retains crop/rotation. Those
limitations must not be copied. Motion failure must not hide essential content.
A static fallback need not mimic an unsupported animated mechanism.

Measure initial JS (starting target ≤180kB gzip), optional component chunks,
first-open machine transfer/startup, frame pacing on a typical 1366×768 laptop,
idle CPU, DPR scaling and memory after repeated entries. Record actual results
and adjust budgets deliberately with the owner; existing numbers are targets,
not passed guarantees. Cap resolution per effect from evidence, use instancing
where useful, lazy/decode original art, and avoid preloading all five live scenes.
Reference DPR 1.35/2 or 4096 instances are observations, not our budgets.
Lighthouse targets in the blueprint do not replace measured normal-motion use.

For viewport units use stable svh/content-driven sizing versus dvh deliberately;
account for header/safe area and keyboard/content growth. Changing browser bars
must not jump scroll selection/CTA. CSS.supports or Chromium alone does not prove
iOS Safari behaviour. Keep essential text outside masks/blur/blend and inspect
actual composited contrast. Static grain avoids shimmer during section and orbit motion.

## 11. Build and verification process

The owner's named skill/evolving-phase loop in blueprint §5 governs this process:
Ponytail implementation with Hallmark/build-design and React specialist, then
completeness audit/remediation, whole-phase connected-code review and final full
verification/owner review. A new decision updates all three files and affected
phase evidence before work resumes. The steps below support that loop.

1. Read blueprint phase/map/current decisions and the relevant study findings.
   General reference study is sufficient; request only genuinely missing material
   evidence. Do not relabel unmade artwork as a need for more inspiration sites.
2. Define the active deliverable: page motion prototype, comparison handoff,
   2D storyboard and renderer proof, timed pilot, another agent, route/console work.
   Name real data, art assets, clock/property owners, controls and fallback.
3. Show concrete composition/key poses before substantial animation; inspect the
   connected moving implementation, not only stills. Phase 3 establishes the shared
   world; Phase 5/Phase 6 refine one 2D explanation before expanding to the other four.
4. Run meaningful targeted checks per atomic change: every agent/selection,
   pause/replay, stop/reverse, rapid interruption, resize, keyboard, missing data,
   failed graphics/images, runtime reduced motion and navigation/unmount.
5. Run the entire common backend/API/agent/unit/integration/browser gate and
   applicable design/motion checks on the resulting revision. Check read-only
   showcase actions and explicit console submission separately.
6. Record exact evidence, asset/provenance/budget decisions and actual owner visual
   review. At least two meaningful owner-attributed atomic commits per authorised
   implementation stage; current local-doc edits are not a commit instruction.
7. Keep all three specs synchronized; no advancing on prior test counts or unseen
   art acceptance. Use the local checkout for interaction and a real recording to
   supplement review; no invented laptop-accessible cloud localhost URL.

## 12. Motion acceptance checklist

Record A01–A24 as PASS/FAIL/BLOCKED/N/A with evidence for the active phase, then
cumulatively. These replace the earlier scene-only checklist without reducing
its functional requirements.

- [ ] A01 The site has a coherent motion/art identity from arrival through console.
- [ ] A02 The opening, quiet first scroll, spherical gallery, explicitly opened dossier and results exit are visible in actual motion. Test the chosen same-page glide forward and in reverse.
- [ ] A03 The image sphere has readable depth and overlap. All five roles have direct access.
- [ ] A04 Stable agent/example ID coordinates art, labels, brief, result and controls.
- [ ] A05 Stop holds and reverse retraces the main scroll timeline.
- [ ] A06 Fast scrolling/direct choice/back cancel obsolete transitions; no queues/stale results.
- [ ] A07 Explore directly enters, target/focus remains usable, Open console is separate.
- [ ] A08 Spider/Vector have palette, size, semantics and fallback. Pointer recreates local Vector guides and coordinates at the current hero name scale; normal scroll leaves the effect behind.
- [ ] A09 Compare pair, active stage and playback are distinct; return restores context.
- [ ] A10 Card click opens information. Separate How it works plays the distinct explanation for that role with truthful poses and a useful result.
- [ ] A11 Observed events, model output and illustrative motion remain distinct.
- [ ] A12 Prepared art, CSS card depth, local 2D graphics and functioning DOM controls are identified correctly.
- [ ] A13 Scene play/pause/replay/close and selected final frame are deterministic.
- [ ] A14 Close/load/switch/unmount invalidate old callbacks and restore useful focus.
- [ ] A15 Showcase actions cause no generation, review or memory writes.
- [ ] A16 Test keyboard, zoom, long text and native narrow-screen flow. If the menu expands, it supports click, focus, tap and Escape. Hover leaves navigation and agent selection usable.
- [ ] A17 Reactive reduced motion bypasses spatial travel while preserving meaning.
- [ ] A18 No graphics/init/assets failure or loader can hide product text/actions/results.
- [ ] A19 All loops/listeners/observers/graphics resources have tested lifecycle ownership.
- [ ] A20 Initial/first-open payload, frame pacing, DPR and repeated-switch memory are measured.
- [ ] A21 Scroll, pointer, timed UI and clicked playback have separate explicit property owners.
- [ ] A22 Applicable M/P/C and U/S/V checks are reviewed; optional effects have reasoned N/A.
- [ ] A23 Current technical/security/API/agent gates pass and open limits are recorded honestly.
- [ ] A24 Owner reviewed actual desktop motion; required visual acceptance precedes next phase.

## 13. Open decisions and revision log

### Current decisions and superseded assumptions

| Earlier view | Current view / reason |
|---|---|
| Start from a static page and add major motion later | Phase 3 must show connected core motion now; later phases extend that world |
| Keep the existing stack/opening unless polish suffices | Clockwise circular/spiral is the latest selection; replace rejected book/boxes |
| Explore as primary CTA | Open console primary, Spider Explore secondary and direct to the gallery |
| Wordmark as oversized scroll effect or CSS tilt trial | Current-scale first-screen name. Local pointer dots, lines, squares and coordinates. Final name and rendered fidelity open |
| Full page must be WebGL/pinned | Semantic page, local scroll ranges and selective 2D effects; WebGL and global pinning are set aside |
| Foreground counter equals selection | Real five-agent state, direct access and cancellation are our implementation responsibility |
| Prepared visuals prove a live UI/3D simulation | They supply art detail; actual controls, results and geometry are separate |
| Need another general website before action | Existing Freeland/Strata/Antimatter references suffice; review real art/prototype next |

Open bounded reviews: original card/scene art, typography/composition, exact
final name, gallery travel/depth, individual arrival beats, section-glide
pacing, menu behavior and role-explanation compositions. PR first, pair
comparison, genuine examples, palette and Spider placement are settled.

Historical chronology and tested revisions are preserved in blueprint §13–§19:
Phase 1 functional PASS; Phase 2 genuine capture PASS after earlier provider blocks;
Phase 3 book/box candidates rejected despite scoped technical passes. Those records
do not approve new motion or reset current status. Original Claude text and
saved captures remain unchanged. This whole-file revision is local documentation.

## 14. Additional UX and animation principles — research register

Added 13 November 2026 (Asia/Calcutta). The owner supplied 21 items under a heading of 20 and asked for brief research and relevant applications. Preserve all 21. These are researched recommendations to review during Phase 0 and apply where useful, not 21 effects to add or newly approved scene designs.

Normalize “pose a pose” to **pose-to-pose** and “Jacob's law” to **Jakob's law**. The owner explicitly clarified that “Pasteur's law” meant **Postel's law**. Windup overlaps anticipation; bigger hit areas are a practical application of Fitts' law. Frequency of use is a prioritization heuristic rather than one universal mathematical law.

### Motion and physical-scene principles

| ID | Owner item / standard term | Brief meaning | Marketing OS application | Recommendation |
|---|---|---|---|---|
| P01 | Squash and stretch | Controlled deformation suggests flexibility, force, or weight; believable volume is usually maintained | A flexible paper packet or tiny press reaction may deform; keep rigid machines, exact charts, and readable text stable | SELECTIVE |
| P02 | Anticipation | A small preparatory cue helps the viewer expect the next action | A checkpoint aligns or an input tray engages before the main document transfer; acknowledge the click immediately | USE SUBTLY |
| P03 | Windup | A particular anticipatory movement before the main movement | A small lever pull or press preparation can establish the machine's operation | OPTIONAL; do not duplicate anticipation or delay routine UI |
| P04 | Staging the focus / staging | Composition, contrast, position, and motion make the important action clear | One focal composition across gallery/dossier/scene and readable result; supporting controls stay quiet | CORE |
| P05 | Pose a pose / pose-to-pose | Plan key poses/states first, then interpolate between them | Plan arrival, gallery/focused dossier and input/review/result poses; also produce a useful static fallback | CORE |
| P06 | Follow-through | Parts continue or settle after the main action, communicating inertia | A moving sheet or joint settles after transfer; closing/switching must still cancel old callbacks and render work | SELECTIVE |
| P07 | Slow in, slow out | Acceleration and deceleration make movement feel intentional | Ease intentional 2D changes between explanatory states. Keep controls immediate and direct scroll progress continuous | CORE, tuned to interaction |
| P08 | Moving in arcs | Rotating joints and many natural movements trace curved paths | Clockwise discovery and a hinged arm may arc; a rail-constrained sheet remains straight; spatial continuity needs no gratuitous bends | SELECTIVE, based on mechanics |
| P09 | Secondary action | Small supporting movement reinforces the primary action | A source marker highlights after a document arrives; avoid unrelated particles or competing machines | SELECTIVE |
| P10 | Snappy timing | Short, deliberate durations keep interactions responsive while conveying weight | Immediate selection/press feedback; brief control transitions; reserve longer timing for an intentionally played explanation | CORE |
| P11 | Exaggerated feedback / exaggeration | Amplify a visual cue enough to make its meaning noticeable | A restrained selection/arrival emphasis; never exaggerate actual evidence counts, certainty, review state, or model performance | SELECTIVE |
| P12 | Solid drawing in 3D / solid drawing | Coherent volume, perspective, weight, lighting, and balance make forms understandable | Readable depth/volume only when useful for prepared art and CSS projection | Conditional. Live 3D is deferred |
| P13 | Overall appeal / appeal | Coherent composition, form, and movement make an experience engaging and understandable | A recognizable family across wordmark, five dossiers, comparison and distinct 2D explanations with crafted transitions | CORE; more visual detail is not automatically more appeal |

### UX and interface principles

| ID | Owner item / standard term | Brief meaning | Marketing OS application | Recommendation |
|---|---|---|---|---|
| P14 | Fitts' law | Pointing difficulty depends on target distance and effective target size | Make Compare, Open, Play/Pause, Close, and review actions easy to reach and accurately activate | CORE |
| P15 | Bigger hit areas | A clickable area can be larger than its visible icon | Small dossier tabs and scene controls need padded, well-spaced targets without overlapping neighbouring actions | CORE; practical application of P14 |
| P16 | Hick's law | Choosing becomes slower as the number/complexity of alternatives increases | Clear role/use-case labels and staged technical detail make the five agents easier to compare; do not impose an arbitrary three-choice cap | CORE |
| P17 | Miller's law | Short-term memory is limited and depends on meaningful chunks | Keep comparison labels/values visible, group evidence, and avoid requiring recall across scenes; 7±2 is not a menu-size rule or proof that five agents is ideal | CORE as a memory-load consideration |
| P18 | Doherty threshold | Fast human/computer response can sustain interaction flow; about 400ms is the commonly cited historical benchmark | Acknowledge Explore, selection and controls promptly; show real asset/request pending, keep comparison/replay local and lazy-load optional graphics | CORE responsiveness goal; not a promise of sub-400ms LLM completion |
| P19 | Pasteur's law → Postel's law | Produce clear, consistent output while accommodating reasonable input | Forgive harmless formatting and explain errors; preserve strict HTTP types, strategy validation, source eligibility, and authorization | APPLY CAREFULLY; owner confirmed the intended name |
| P20 | Jacob's law → Jakob's law | People bring expectations from interfaces they already use | Familiar comparison controls, tabs, close buttons, keyboard behaviour, form states, and back navigation around the distinctive machines | CORE |
| P21 | Frequency of use | Important repeated tasks benefit from efficient access; priority depends on actual usage | Keep likely repeat actions such as replay, agent switching, and console submission easy; validate with observed use rather than assuming a usage ranking | USE; heuristic, not an automatic analytics requirement |

### How these principles combine in a pilot

For PR & Policy, define readable input, risk-checkpoint, and result/review frames (P05). Stage one focus at a time (P04). Use a short highlight or reveal to connect evidence to the checkpoint, then the result or review route. Hold the result with familiar Replay/Pause/Close controls (P14/P15/P20).

If the example is escalated, show the actual risk state. If a human review is pending, it stays pending. Visual exaggeration, follow-through, or optimistic UI must never turn that into a successful approval before the server records it. Reduced motion presents the same meaning statically.

### Research sources and limits

- Reviewed the [educational animation primer and examples](https://github.com/tanxh33/animation-principles-css/blob/main/index.html), which covers the twelve classical animation principles and identifies windup as anticipation. It is a web interpretation, not an empirical proof that one timing fits every interaction.
- Reviewed [W3C's WCAG 2.2 target-size explanation source](https://github.com/w3c/wcag/blob/main/understanding/22/target-size-minimum.html). The AA minimum criterion uses 24×24 CSS pixels or defined exceptions; 44×44 is the enhanced threshold and a useful touch-design target, not the universal AA minimum.
- UX-law summaries are design guidance with different empirical scope. Do not convert popular summaries into universal laws, a forced maximum number of choices, or guaranteed performance.
- Direct Laws of UX and Adobe reference pages were unavailable under this environment's web access policy. No claim is made that those pages or the original research papers were freshly reviewed here. The owner confirmed the intended Postel term; no new dependency, external skill, or application code was installed or executed from research sources.


These principles apply to the complete page as well as role-specific 2D explanations.
Use staging/pose-to-pose/appeal for the spatial gallery; Fitts/Jakob for stable
Spider actions and direct access; Miller/Hick for pair comparison; lifecycle and
truthful feedback for console use. None requires cartoon elasticity, automatic
model calls, fake stage timings or stripping away the wanted expressive motion.

## 15. Applying the principles at phase gates

| Phase | Motion/UX evidence added to the full common gate |
|---|---|
| Phase 0 | Retain owner choices; reference evidence vs proposal; original art and composition reviews scoped to dependent phases |
| Phase 1/Phase 2 retained | Preserve strict validation, real request/review state, immutable captures and read-only adapters; new visual work reruns their contracts |
| Phase 3 | Wordmark pointer tracking, quiet first scroll, five distinct orbit arrivals, opened dossier and How it works handoff, normal-flow gallery exit |
| Phase 4 | Pair selection, visible comparison data, stable targets, shared-stage handoff and cancellation without inference |
| Phase 5/Phase 6 | Role-specific 2D states, readable field bindings, actual fallback and budget, then timed PR playback |
| Phase 7A–D | Independent specialist art/story and exact bindings, no generic cloned machine or unverified capability |
| Phase 8/Phase 9 | Return to the same agent and page position, scene cancellation, gallery exit, workflow/result reveals, short case previews and a separate dotted footer |
| Phase 10/Phase 11 | Readable engineering evidence and familiar console/form feedback, no fake telemetry or delayed routine actions |
| Phase 12/Phase 13 | Actual device/zoom/keyboard/touch, frame pacing/cleanup and complete showcase-to-console workflow; owner review plus all gates |
| Phase 14 when requested | Real deployment asset/cold-start/context/focus/API checks; local performance alone is not deployed evidence |

For every active row apply A01–A24 and the relevant U/S/V/C/M/P criteria. Record
optional techniques N/A with reasons, mobile polish deferred when appropriate,
and failed/missing required checks as OPEN/BLOCKED. Art written in a brief is
not visually accepted; passing tests is not a replacement for actual motion review.

## 16. Surface, asset and loading decisions

| Topic | Working direction | Verification |
|---|---|---|
| Graphite | Earlier plain and graphite samples provide a comparison for sitewide reuse of the existing dither | Check compositing and contrast at moving depth |
| Dithering | Apply the existing Phase 3 dither across all website sections, including closing surfaces, with a static visual layer | Check shimmer, layered grain and sharp text/evidence/control contrast in normal and reduced motion |
| Pixel loader | Real pending scene/component asset or API work only | Native text/status and failure/retry; no fabricated percent, timer hold or hidden response |
| Replay | Already saved/loaded example, deterministic local playback | No artificial capture/progress delay or provider calls |
| Prepared images | Original optimized art with intrinsic dimensions/decoding and useful fallback | Do not bake essential result/interactive controls into false live UI |
| Live graphics | Local Canvas2D ornament only when useful; keep explanations readable in DOM | Measure startup, DPR where applicable and cleanup |
| Masks/blur/blend | Optional purposeful transition/art treatment | Keep final text sharp, focus unobscured, palette and no-effect equivalent |

Strata's 0.6s timer, 0.1s hold and 0.5s loader exit are observations of a decorative
intro, not measured download progress or adopted Marketing OS timing. Freeland's
missing lifecycle/disabled reduced-motion evidence and Strata's still-scheduled
RAFs/partial shader fallback must not be copied as production guarantees.
A CSS gradient fallback is not permission to add our own unselected gradient
identity. Responsive srcsets/asset budgets/load priority are implementation
choices to measure, not reasons to fetch every scene at first paint.

Renaissance branding is rejected; cream is already the base; text wrapping is
layout; meaningful diagrams belong to real explanation. These choices serve the
same overall motion-led identity through every phase. No new effect, renderer,
asset, dependency, API call or completed phase is implied by this document.
