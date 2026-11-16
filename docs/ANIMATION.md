# Marketing OS — animation and miniature 3D scenes

Updated: 17 November 2026 (Asia/Calcutta).
Status: current working motion specification; no new scenes have been implemented by this document.

Read with [the blueprint](MARKETING_OS_BLUEPRINT_PLAN.md) and [design/layout specification](DESIGN_AND_LAYOUT.md). The owner has chosen click-to-play miniature physical 3D machines/scenes that explain the agents, and visitor-facing agent comparison. These decisions supersede the original flat-SVG-only restriction. The original Claude animation file remains unchanged in the [historical archive](FRONTEND_DESIGN_WORKING.md#16-original-claude-documents--verbatim-snapshots).

**Phase correspondence rule:** these 16 sections, scene beats, M01–M21 notes and P01–P21 principles support the blueprint's shared F00–F14 phases; they are not extra build phases. Before any phase/change and before phase closure, read the blueprint's [architecture and phase correspondence map](MARKETING_OS_BLUEPRINT_PLAN.md#10-architecture-and-phase-correspondence-map), the mapped sections here and its [required execution checklist](MARKETING_OS_BLUEPRINT_PLAN.md#11-required-phase-execution-checklist). Record applicable motion/UX checks and reasoned N/A items. The owner confirmed PR & Policy as the pilot; ask about remaining unresolved material/camera/opening choices before dependent work. Each F07 child needs its own evidence and full gate before the next agent.

## 1. What motion must achieve

The scene should make a visitor understand the specialist's job and remember the experience. The owner-approved public sequence is purpose → short example brief → visual explanation → useful result, with sources/rationale available on demand. The broader engineering explanation belongs in a separate “How it’s built” section.

Keep the result readable without watching the scene. Motion should lead to a useful
agent-appropriate outcome, with actual business risk/review state where relevant.
Capture/test timestamps and quota/debug/operational explanations are internal
verification material, not public scene captions. Address known weak outputs and
source quality before presenting them as finished examples; original recordings
remain unchanged until a corrected response is genuinely captured.

Every movement should explain order, transform a meaningful object, direct attention, show an actual state change, or confirm an interaction. Start from a few understandable objects. Add detail only when it improves that explanation.

The miniature machine is a visual metaphor. It does not reproduce hidden model thinking, prove a causal explanation for a token, or turn an absent backend feature into a real one.

## 2. Confirmed direction and open choices

| Item | Status |
|---|---|
| Miniature physical machines or scenes for clicked agents | CONFIRMED by owner |
| Paper/dossier identity around the scenes | CONFIRMED by owner |
| Purpose, short brief, visual explanation and useful result; optional sources/rationale; separate engineering section | CONFIRMED by owner, 16 November. Public capture/test dates and quota/debug explanations are rejected; next UI change must apply this presentation correction |
| Visitors compare agents before choosing one to explore | CONFIRMED by owner |
| Compare two agents side by side, then open one shared animation stage | CONFIRMED by owner, 15 November; all five remain discoverable |
| Genuine saved model responses for public examples; controlled/mock responses for routine tests | CONFIRMED. F02 PASS: five genuine `gemini-3.5-flash-lite` responses captured with same-request evidence; public selection tests make zero API calls. Generated claims remain unverified |
| Physical-scene material, scale, modelling style, lighting, exact camera framing | OPEN DETAILS; collect and compare references/stills before full modelling/animation |
| Guided camera that shows the machine's story | CONFIRMED by owner, 15 November; visitor-controlled rotation is not approved |
| PR & Policy as the first pilot | CONFIRMED by owner, 15 November; risk checkpoint and separate human-review route |
| Stacked cards with a shorter scroll and simpler opening | CONFIRMED investigation direction by owner, 15 November; exact geometry/composition still needs review |
| Five-sheet opening morph into the deck | CLAUDE PROPOSAL; not adopted by default under the simpler-opening direction |
| Full autoplay on card arrival | NOT ADOPTED as the main interaction; current owner direction is click-to-play |
| Preview motion before a click | OPTIONAL; needs a purpose and review, not five running miniatures |
| Specific renderer/new dependencies | TECHNICAL CHOICE after prototype evidence, not a visual decision already made |
| Speckled graphite, dithering/dithered images, and pixel loaders | OWNER LIKED, 15 November; exact reference and implementation remain open |
| Renaissance branding | OWNER REJECTED, 15 November; do not import it into the machine/material/typography direction |

The current implementation has Motion and Lenis plus Three.js/React Three Fiber-related packages used for an old console shader. Their presence does not prove the new scene system exists or that the old shader should remain.

## 3. Truthful data and scene states

Separate three kinds of information:

| Type | Example | Treatment |
|---|---|---|
| Actual input/output | Supplied goal, recorded response, retrieved fact captured for that request | Attribute to the example; preserve original values |
| Observed application event/state | Validation succeeded, risk escalation, authenticated review status | Show only when the relevant record/contract supports it |
| Illustrative physical motion | A sheet travels along a rail into a checkpoint | Treat as explanation; do not label its timestamp as actual model execution |

- All five roles are backed by the same implementation family; one-shot selects one, triage uses two, digest uses five. Do not run five machines to imply five agents were called for one single-agent request.
- Do not animate intermediate “thinking,” scanning, phrase removal, score calculation, or event booking as a recorded operation unless there is actual evidence.
- A PR risk term may trigger escalation. That does not establish a phrase-level editing system. Show a risk flag and review route; do not automatically strike out a phrase and announce it was corrected.
- Social signals can be supplied/simulated. Do not show invented live feeds or sentiment scores.
- A replay is read-only. Playing, pausing, comparing, or opening a scene does not generate output, approve a decision, or promote memory.
- Mock and missing provider usage remains unavailable. An explanatory playback clock is not measured model latency.
- If only a result summary exists, show the summary honestly. Do not invent a detailed retrieved-fact set from `knowledge_units` or use a later search as if it were the original retrieval.

Presentation state sequence, to be implemented and tested:

```text
idle/static preview → loading assets → ready → playing → paused or completed
                                  ↘ asset/renderer failure → readable static fallback
```

Closing, changing the selected agent/example, or choosing reduced motion must cancel the previous animation cleanly. An older callback may not update the newly selected scene.

## 4. Proposed physical scene family

Use a coherent world: compatible materials, scale, camera treatment, lighting, and controls. Do not give each agent an unrelated colour theme or a different visual genre. Exact materials are still open; paper-built mechanisms and precise instrument-like machines are references to compare, not chosen assets.

Owner clarification, 15 November: the camera should show the story clearly; the owner likes the machine concept but does not want a cheap/generic result or an assumed match with the implementer's visual taste. Follow the blueprint's F05 pilot quality checkpoint: a specific visitor question and truthful three-state story, exact data bindings, concrete references and two small still-frame interpretations, plausible purposeful mechanics, and owner review before full animation. Guided framing is the baseline; visitor rotation remains unapproved until demonstrated and discussed. The dossier identity outside does not dictate a cardboard material inside the scene.

### Branding — composition workshop

- Question: how can this specialist help form a useful positioning recommendation from the supplied goal and competitor context?
- Candidate objects: input sheet, a few source cards, a composition surface, a final brief.
- Beats: introduce the brief → bring available evidence into view → reveal the attributable positioning output.
- Do not imply that the arrangement is an observed evidence-ranking algorithm or that animation proves the statement is correct.
- Static result: input, evidence available, and positioning result remain readable together.

### PR & Policy — checkpoint and review route

- Question: how is a potentially risky generated recommendation flagged for a human?
- Candidate objects: draft sheet, physical checkpoint, two labelled routes, review tray/result stand.
- Beats: introduce actual input/output context → show the recorded risk state → route to review when escalated, otherwise present the result without inventing a review.
- Review is a separate recorded event. Only show an approved/rejected state when the selected example actually includes that review.
- Do not show an automatic deletion, rewrite, legal clearance, or irreversible action merely because a risk flag exists.
- Static result: risk state and human review state are distinct and inspectable.

### Social Community — editorial workbench

- Question: how does the specialist turn supplied audience context into a content/community recommendation?
- Candidate objects: clearly labelled signal card, instruction/context cards when actually used, editorial surface, output sheet.
- Beats: show the supplied/simulated signal → explain the available context → reveal the recorded recommendation.
- No fabricated social scraping, sentiment analysis, live posting, or audience score. Token overlap, if used as an illustrative highlight, does not establish model reasoning.
- Static result: source of the signal, context, and recommendation remain clear.

### Product Marketing — comparison table

- Question: how does the specialist use available product/hardware/pricing context to produce its recommendation?
- Candidate objects: a few source-backed specification cards, aligned comparison surface, output brief.
- Beats: reveal actual facts → align relevant fields with readable units → reveal the recorded output.
- No invented computed TCO, optimal SKU selection, market pricing, or cost savings. Show unavailable fields as unavailable.
- Static result: exact fact values and the resulting recommendation can be inspected without rotating objects.

### Field Events — planning table

- Question: how does the specialist advise on field activity from the supplied brief and available context?
- Candidate objects: brief, available evidence cards, planning surface, recommendation sheet.
- Beats: show the requested task → connect the available context → reveal the recorded recommendation.
- No implied live event database, booking, scheduling, calendar execution, or budget optimization unless implemented and evidenced separately.
- Static result: actual inputs, limitations, and recommendation remain available.

These are initial briefs. No specific machine, asset, composition, or exact choreography is approved merely because it appears here.

## 5. Scene controls and comparison behaviour

- Click/Enter on an agent opens it and initiates the chosen playback behaviour. Show a clear loading state while assets are unavailable; preserve readable content underneath.
- Provide accessible Play/Replay, Pause, and Close controls. Add Next/Back for meaningful inspection stations if chosen in the reviewed interaction; do not require frame-perfect clicking.
- On completion hold a useful final state. Do not restart indefinitely. Replay begins deterministically for the same example.
- The comparison interface presents useful role/example differences without forcing scene playback. One primary moving scene at a time is the starting rule.
- The owner selected two-agent comparison and a single shared animation stage on 15 November. Choose which compared agent to open/play; do not render two simultaneously running machines. Preserve comparison selection when switching or closing the shared stage. Detailed responsive arrangement remains for F04 review.
- Comparison must not trigger `/api/triage` or any model request merely by selecting agents. A distinct console action may run a real workflow when explicitly invoked.
- Close returns focus to the agent/comparison control that opened the scene. Preserve understandable comparison selection and scroll position.
- No essential interaction depends on hover, dragging a camera, or sound. Use the owner-selected guided story camera. Do not add visitor rotation without a visible prototype and separate owner decision; any later camera exploration must preserve normal page scrolling.

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

F02 provides these six station bindings through `adaptAgentScene`, for each attributable one-shot specialist. They are data projections, not an implemented renderer, animation timeline or hidden-reasoning trace. Captured source rows support Retrieve; a generated summary alone leaves it partial. Successful one-shot schema acceptance does not establish claim entailment. Risk escalation stays separate from absent human-review events. All five genuine Flash-Lite captures now pass the F02 gate at `0dc18d6`; the static inspector reads saved files only. Future scenes must retain the unverified-output/source-coverage boundary and may not turn a limited corpus into proof that a competitor lacks hardware. This pass approves no scene material or physical motion.

## 7. Timing and all 21 supplied motion notes

Starting timing ranges: routine UI 150–250ms; a readable scene beat roughly 400–900ms; a short explanatory scene roughly 4–6s when the actual content fits. These are experiments. Reading a longer result must not be compressed into an unreadable typewriter sequence to meet a number.

Use named timing/easing constants. Prefer a quick response with a controlled settle. Use scroll progress directly for reviewed scroll-driven motion and a deterministic playback clock for clicked scenes. Keep those ownership models separate.

The owner's “20 days” list contains 21 techniques. All are retained below; conditional techniques are not requirements to invent controls.

| ID | Original technique | Application / acceptance |
|---|---|---|
| M01 | Ease out for entrances | Starting choice for triggered arrivals; do not unpredictably time-ease scroll position |
| M02 | Dropdowns 150–250ms | Use for real dropdowns and test rapid/keyboard input |
| M03 | Stagger list rows by 30ms | Starting value for short lists; do not delay large data tables |
| M04 | Buttons scale to 0.97 on press | Optional feedback; keep text legible and hit area/layout stable |
| M05 | Stretch moving knobs by 12% | Only if an actual useful draggable knob exists; otherwise N/A |
| M06 | Stagger when details settle | Introduce supporting information after the focal object is understandable |
| M07 | Arcs for object movement | A physical packet/document path can use an arc when it clarifies movement |
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
| M19 | Crossfade icons with scale and blur | Scale/crossfade may help; blur is not adopted by default and must justify its readability/performance cost |
| M20 | Rubberband past drag boundaries | Only for real bounded drag interactions; never rubberband the page or keyboard navigation |
| M21 | Reuse layout IDs for shared objects | Use for genuine continuity with correctly scoped IDs; do not collide between comparison/preview instances |

For each implemented interaction record which notes apply, which are N/A, and why. Do not claim all 21 are implemented simply because they are listed.

## 8. Engines and property ownership

- Lenis currently owns desktop smooth scrolling. It must be disabled under reduced motion and omitted wherever native document flow is the better interaction.
- Motion handles React layout/state transitions and existing scroll transforms.
- Prototype the physical scene using an appropriate renderer; evaluate the existing Three.js/React Three Fiber stack before adding dependencies. Lazy-load scene code/assets after an intentional entry or another reviewed loading strategy.
- GSAP is an option inherited from Claude for bounded labelled timelines, not a mandatory additional engine. Do not introduce it if the chosen renderer/Motion can own the needed timeline clearly.
- Never let two engines control the same position/rotation/scale/material/property on the same object. Document ownership in the pilot brief.
- The old CSS/SVG-only property budget is not a complete 3D rule. Mesh transforms, lighting, materials, renderer loops, and shadows need separate measurement and ownership.
- Keep UI text stable and readable; avoid scaling essential text through a long transition. Physical sheets may move in 3D while their readable content is available separately.
- A routine transition may use a simple fade when it is the clearest accessible option. Claude's blanket ban on cuts/fades is not a reason to build convoluted motion. Final scene continuity is reviewed visually.

## 9. Existing deck and optional opening transition

Owner's 17 November direction is a whole-page scroll story: calm arrival → a
small initial movement → a larger scroll-driven reveal → agent dossiers in the
same continuous composition. The first short scroll is anticipation; “1.5
scrolls” describes pacing and must be tested as document travel across wheel,
trackpad and touch inputs. Use direct progress for the main motion-study timeline
so stopping holds the composition and reversing scroll reverses it. Small
independent settling movements can be considered separately during review.

F03 now includes an isolated opening-to-PR-dossier study with temporary simple
visuals. Keep it separate from the working public composition until reviewed.
The miniature means a physical model viewed close up inside the dossier; exact
materials and full rendering remain F05/F06 work. Compare outer scroll reveal
with the earlier click-to-play inner-scene proposal before changing that control
contract. No automatic five-machine playback or paid inference on scroll.

The radio-tuner reference demonstrates pinning, responsive scroll ownership,
selection continuity and coordinated content changes. Its semicircle, glass and
blue chromatic fringe are not adopted styling. React Bits/Codrops components are
research references, not an instruction to install multiple animation engines.

These are the values in the inspected code, not values inferred from an outdated prompt:

| Property | Current value |
|---|---|
| Desktop deck container | 600vh |
| Knowledge-card interval | 0.00–0.06 |
| Split tabs | 0.06–0.13 |
| First-card expansion | 0.13–0.15 |
| Card arrivals | 0.15, 0.32, 0.49, 0.66, 0.83 |
| Stacking offset | 40px per level |
| Scale step | 0.03 per level |

The original Claude animation snapshot uses 0.11 at one opening boundary; the implementation uses 0.13. Preserve the observed values until a deliberate reviewed change. Tests should cover the actual chosen sequence.

The owner chose to preserve stacked cards while reviewing a shorter scroll and simpler opening. Keep the observed implementation values until the replacement geometry/composition is reviewed, then update the constants and tests together. The old five-sheet morph is not adopted by default. Test the joining frame, reverse scrolling, navigation interruption and mobile/reduced-motion alternatives for the chosen sequence. Do not move or autoplay an entire miniature machine simply because its card crosses a scroll threshold.

## 10. Accessibility, performance, and fallback

- The scene's meaning exists in real readable text. Decorative canvas/SVG is hidden from assistive technology; informative visuals have a useful description.
- Essential controls use DOM buttons with labels and visible focus. Support Tab/Enter/Space, Escape to close, and arrows for a station control if that control is implemented.
- Reduced motion: no Lenis smoothing, camera flights, parallax, scroll scrubbing, typewriter, or forced autoplay. Show a useful static state and allow ordinary inspection.
- Mobile: normal page flow, readable controls/text, no desktop min-width or scroll trap. Choose a lighter scene or static representation based on measured device capability.
- If WebGL is unavailable, assets fail, or context is lost, present the static explanation and output. No blank panel, uncaught error, or blocked agent comparison.
- Stop animation/render loops when offscreen, hidden, paused where possible, or unmounted. Dispose owned renderer resources/listeners safely; switching agents repeatedly must not leak resources.
- Keep a single focal moving composition. Cap geometry, textures, lighting, shadows, and asset weight using pilot measurements. An old “150 SVG elements” target is not a valid count limit for 3D meshes.
- Starting landing target: initial JS ≤180 kB gzip. Measure first-open 3D transfer/startup separately in F05 and record a reviewed budget. No loading everything merely because package dependencies are already installed.
- Aim for smooth interaction on a typical 1366×768 laptop and test actual frame pacing. Lighthouse alone does not prove scene smoothness or explainability.
- Static background texture remains static by default. A pointer-responsive dot field is not required; avoid competing with the selected machine.

## 11. Build and verification process

1. Gather references for material, camera, and motion feel; record URLs/creator/licence and the exact property to learn.
2. Write a short pilot brief describing the visitor question, three beats, objects, exact data bindings, property ownership, controls, and static/reduced-motion result.
3. Review start/end stills and fallback before coding a full animation. Do not model all five machines first.
4. Animate the one pilot; verify replay, pause, close, rapid switching, missing data, and interruption.
5. Run the blueprint's backend connection, unit, integration, full agent, UI, and design gates. The owner reviews the pilot's meaning and feel before expanding the scene family.
6. Build each additional agent as its own checked subphase. Use the shared scene infrastructure without making every scene the same generic machine.

Every motion phase must prove that playing scenes/using comparison leaves backend data unchanged, and that an explicit console action still reaches the correct agent/API. Use controlled inference and test records for routine checks; no paid model call for each replay or screenshot.

## 12. Motion acceptance checklist

- [ ] The scene explains one agent's actual role and a useful result.
- [ ] Observable events, physical metaphors, and unavailable data are distinguished.
- [ ] Actual input/output and displayed measurements are attributable to the selected example.
- [ ] Click/play/replay/comparison produces no unintended API call, approval, or memory write.
- [ ] Play, pause, replay, close, and any station controls work with keyboard/touch.
- [ ] Closing restores focus and selection context.
- [ ] Rapid switching cancels old work; stale callbacks cannot replace the new scene.
- [ ] The final frame is useful and readable without perpetual looping.
- [ ] Reduced motion and missing WebGL/assets have useful static states.
- [ ] Offscreen/hidden/unmounted scenes stop work and release owned resources.
- [ ] One primary moving composition and readable DOM text are maintained.
- [ ] Chosen scroll/deck states work forwards, backwards, and during interrupted navigation.
- [ ] Timing/property ownership is explicit and applicable M01–M21 notes are reviewed.
- [ ] Scene and initial-load budgets are measured against the reviewed targets.
- [ ] Both design checklists and all common phase-gate lanes pass before the next phase.

## 13. Open decisions and revision log

2026-11-16 subsequent owner approval: public agent views use purpose → short brief → visual explanation → useful result, with optional sources/rationale and a separate “How it’s built” section. Capture/test dates and operational bottleneck explanations are rejected. Correct weak examples internally rather than substituting public caveats for a quality fix. This is a documentation-only update: existing UI, scene code and original recording bytes are unchanged; F03 and the physical-scene phases have not started.

2026-11-16 F02 PASS at `0dc18d6`: five genuine `gemini-3.5-flash-lite` captures, seven provider attempts including two temporary-503 retries, original output/source bytes preserved. Full development and compiled browser suites pass 13/13 each, including read-only actual-recording selection. Scoped mobile/keyboard/accessibility checks and current unit/API gates pass; blueprint section 15 has the evidence. No miniature renderer, comparison layout, camera behaviour, new timing, texture or dependency has been introduced. That revision displayed a source-quality caveat; the subsequent owner-approved presentation correction above governs future UI. No final motion acceptance is inferred.

Earlier 2026-11-16 snapshot: capture was blocked before the successful provider configuration/key checks. Blueprint section 14 preserves those initial failures; it is no longer the current phase status.

Resolve exact material/modelling references, guided camera framing, detailed responsive comparison, opening/scroll geometry and rendering/asset budgets before their dependent phases. The owner answered Q01–Q06 on 15 November: PR & Policy first, two-agent/shared-stage comparison, genuine public recordings, light paper with subtle graphite, guided story camera and a shorter stack/simpler opening. Exact machine quality needs reference/still review; visitor rotation is not approved. “Tabular notes,” “Pretext,” “spring balance,” and “handheld animation” have interpretations recorded in the design/motion documents but are not silently turned into package requirements.

2026-11-15: Added cross-document phase lookup and evidence requirements. Recorded the owner's Q01–Q03 answers; no scene, material, asset or animation was implemented by this documentation change.

2026-11-15 F01 completion at `d6c9973`: stale UI work is cancelled/invalidated; reduced motion disables Lenis and the old decorative console shader, including changes to the preference at runtime. Dossiers use readable native flow under reduced motion or at widths ≤1023px; the ordinary desktop timeline/constants remain inherited. Mobile navigation, Escape/focus return, source-graph keyboard inspection and bounded axe checks pass. See the blueprint's [F01 completion record](MARKETING_OS_BLUEPRINT_PLAN.md#13-f01-completion-record). No new physical scene, selected texture, camera choreography, replay system, scene/WebGL budget or full performance acceptance is claimed; those motion checklist items remain for their mapped phases.

2026-11-13: Created this editable specification from the preserved Claude reference and current owner decisions. Added physical miniature scenes, visitor comparison, data boundaries, fallback/resource handling, and mandatory phase integration gates. No animation implementation or new dependency installation was performed.

## 14. Additional UX and animation principles — research register

Added 13 November 2026 (Asia/Calcutta). The owner supplied 21 items under a heading of 20 and asked for brief research and relevant applications. Preserve all 21. These are researched recommendations to review during F00 and apply where useful, not 21 effects to add or newly approved scene designs.

Normalize “pose a pose” to **pose-to-pose** and “Jacob's law” to **Jakob's law**. The owner explicitly clarified that “Pasteur's law” meant **Postel's law**. Windup overlaps anticipation; bigger hit areas are a practical application of Fitts' law. Frequency of use is a prioritization heuristic rather than one universal mathematical law.

### Motion and physical-scene principles

| ID | Owner item / standard term | Brief meaning | Marketing OS application | Recommendation |
|---|---|---|---|---|
| P01 | Squash and stretch | Controlled deformation suggests flexibility, force, or weight; believable volume is usually maintained | A flexible paper packet or tiny press reaction may deform; keep rigid machines, exact charts, and readable text stable | SELECTIVE |
| P02 | Anticipation | A small preparatory cue helps the viewer expect the next action | A checkpoint aligns or an input tray engages before the main document transfer; acknowledge the click immediately | USE SUBTLY |
| P03 | Windup | A particular anticipatory movement before the main movement | A small lever pull or press preparation can establish the machine's operation | OPTIONAL; do not duplicate anticipation or delay routine UI |
| P04 | Staging the focus / staging | Composition, contrast, position, and motion make the important action clear | One moving machine and one readable result; comparison controls remain quiet while a scene plays | CORE |
| P05 | Pose a pose / pose-to-pose | Plan key poses/states first, then interpolate between them | Design input, evidence/review, and output states before animation; also produce a useful static fallback | CORE |
| P06 | Follow-through | Parts continue or settle after the main action, communicating inertia | A moving sheet or joint settles after transfer; closing/switching must still cancel old callbacks and render work | SELECTIVE |
| P07 | Slow in, slow out | Acceleration and deceleration make movement feel intentional | Ease physical transfers and camera moves; routine controls respond promptly; do not double-ease direct manipulation or scroll | CORE, tuned to interaction |
| P08 | Moving in arcs | Rotating joints and many natural movements trace curved paths | A hinged arm can arc; a sheet constrained to a straight rail should remain straight | SELECTIVE, based on mechanics |
| P09 | Secondary action | Small supporting movement reinforces the primary action | A source marker highlights after a document arrives; avoid unrelated particles or competing machines | SELECTIVE |
| P10 | Snappy timing | Short, deliberate durations keep interactions responsive while conveying weight | Immediate selection/press feedback; brief control transitions; reserve longer timing for an intentionally played explanation | CORE |
| P11 | Exaggerated feedback / exaggeration | Amplify a visual cue enough to make its meaning noticeable | A restrained selection/arrival emphasis; never exaggerate actual evidence counts, certainty, review state, or model performance | SELECTIVE |
| P12 | Solid drawing in 3D / solid drawing | Coherent volume, perspective, weight, lighting, and balance make forms understandable | Believable miniature proportions, consistent material/light direction, readable silhouettes, stable camera, and clear contact | CORE |
| P13 | Overall appeal / appeal | Coherent composition, form, and movement make an experience engaging and understandable | A recognizable family of five machines with distinct jobs and well-crafted transitions | CORE; more visual detail is not automatically more appeal |

### UX and interface principles

| ID | Owner item / standard term | Brief meaning | Marketing OS application | Recommendation |
|---|---|---|---|---|
| P14 | Fitts' law | Pointing difficulty depends on target distance and effective target size | Make Compare, Open, Play/Pause, Close, and review actions easy to reach and accurately activate | CORE |
| P15 | Bigger hit areas | A clickable area can be larger than its visible icon | Small dossier tabs and scene controls need padded, well-spaced targets without overlapping neighbouring actions | CORE; practical application of P14 |
| P16 | Hick's law | Choosing becomes slower as the number/complexity of alternatives increases | Clear role/use-case labels and staged technical detail make the five agents easier to compare; do not impose an arbitrary three-choice cap | CORE |
| P17 | Miller's law | Short-term memory is limited and depends on meaningful chunks | Keep comparison labels/values visible, group evidence, and avoid requiring recall across scenes; 7±2 is not a menu-size rule or proof that five agents is ideal | CORE as a memory-load consideration |
| P18 | Doherty threshold | Fast human/computer response can sustain interaction flow; about 400ms is the commonly cited historical benchmark | Acknowledge input promptly, show genuine pending state, keep comparison/replay local, and lazy-load 3D with a fallback | CORE responsiveness goal; not a promise of sub-400ms LLM completion |
| P19 | Pasteur's law → Postel's law | Produce clear, consistent output while accommodating reasonable input | Forgive harmless formatting and explain errors; preserve strict HTTP types, strategy validation, source eligibility, and authorization | APPLY CAREFULLY; owner confirmed the intended name |
| P20 | Jacob's law → Jakob's law | People bring expectations from interfaces they already use | Familiar comparison controls, tabs, close buttons, keyboard behaviour, form states, and back navigation around the distinctive machines | CORE |
| P21 | Frequency of use | Important repeated tasks benefit from efficient access; priority depends on actual usage | Keep likely repeat actions such as replay, agent switching, and console submission easy; validate with observed use rather than assuming a usage ranking | USE; heuristic, not an automatic analytics requirement |

### How these principles combine in a pilot

For PR & Policy, first define readable input, risk-checkpoint, and result/review poses (P05). Stage one main object (P04), give the mechanism a subtle anticipatory cue (P02), move it along a mechanically plausible path (P07/P08), and let an appropriate flexible part settle (P06). Hold the truthful result and provide familiar, comfortably sized Replay/Pause/Close controls (P14/P15/P20).

If the example is escalated, show the actual risk state. If a human review is pending, it stays pending. Visual exaggeration, follow-through, or optimistic UI must never turn that into a successful approval before the server records it. Reduced motion presents the same meaning statically.

### Research sources and limits

- Reviewed the [educational animation primer and examples](https://github.com/tanxh33/animation-principles-css/blob/main/index.html), which covers the twelve classical animation principles and identifies windup as anticipation. It is a web interpretation, not an empirical proof that one timing fits every interaction.
- Reviewed [W3C's WCAG 2.2 target-size explanation source](https://github.com/w3c/wcag/blob/main/understanding/22/target-size-minimum.html). The AA minimum criterion uses 24×24 CSS pixels or defined exceptions; 44×44 is the enhanced threshold and a useful touch-design target, not the universal AA minimum.
- UX-law summaries are design guidance with different empirical scope. Do not convert popular summaries into universal laws, a forced maximum number of choices, or guaranteed performance.
- Direct Laws of UX and Adobe reference pages were unavailable under this environment's web access policy. No claim is made that those pages or the original research papers were freshly reviewed here. The owner confirmed the intended Postel term; no new dependency, external skill, or application code was installed or executed from research sources.

## 15. Applying the principles at phase gates

- F00: review the reference style and which physical principles suit a precise machine versus flexible paper. The optional P01/P03/P06/P08/P09/P11 techniques are not a requirement to make everything elastic or bouncy.
- F01/F04: test input acknowledgement, truthful async/error/review states, comparison usability, focus, target sizes, and familiar navigation. Check that presentation/replay remains free of unintended model or memory calls.
- F05/F06: review the three key poses, stable lighting/camera/volume, focal staging, timing, readable final state, and static/reduced-motion equivalent.
- Every F07 subphase: apply the same review independently to that agent's meaningful mechanics; do not copy every flourish to all five.
- F12/F13: measure actual responsiveness and target geometry; check memory load through usable comparison tasks, not an arbitrary item count. Re-run backend, integration, unit, and agent gates before advancing.

### Additional review checks

- [ ] The scene has planned readable key poses and one primary focus.
- [ ] Preparation/settling/secondary movement supports the story without delaying controls.
- [ ] Mechanical paths and deformation match the intended material.
- [ ] Forms, lighting, camera, and motion feel coherent across the five machines.
- [ ] Control targets, spacing, focus, and familiar behaviours work on mouse, touch, and keyboard.
- [ ] The UI acknowledges actions promptly while preserving honest request/review state.
- [ ] Comparison reduces memory burden without hiding necessary agent choices.
- [ ] Input forgiveness stays within the backend's validation/security contract.
- [ ] Frequent-action placement is based on a sensible task model and checked through use.
- [ ] Optional techniques are marked applicable/N/A with reasons; no principle is treated as a verified implementation merely because it appears in this register.

## 16. Surface and loading preferences — 15 November

The owner likes speckled graphite, dithering, dithered images, and pixel loaders. Record these as preferred candidates, not an instruction to animate multiple layers of grain. Dithered imagery is an application of dithering, not a separate required effect. Renaissance branding was explicitly rejected in the follow-up discussion and must not become an agent-scene art direction.

- Keep the owner-selected light-paper graphite surface static by default. Compare subtle speckling with the plain base before choosing its exact intensity; do not alter the palette implicitly.
- Dithering may treat a selected graphic/object's tonal shading; it does not require moving noise over the page. Avoid accidental shimmer/crawling grain, especially behind text or during camera movement.
- Compare graphite alone with selective dithering before combining them. Similar-looking treatments may be redundant.
- Pixel loaders belong to actual pending states: loading scene assets or awaiting an API response. Their animation does not establish any unobserved model reasoning stage.
- A loader must not invent percentages or a fake completion time. Pair it with a readable status, preserve controls where appropriate, and replace it with the actual result/error when known.
- Reduced motion uses a static marker and status text rather than continuous pixel movement. A replay of an already loaded example should not add an artificial waiting sequence.
- Cream is a background-colour reference; text wrapping is typography/layout. They do not need new motion effects. Process explanation can live inside the miniature scenes without a separate generic flowchart.

These preferences refine F00 references and later F03/F05/F06/F11 acceptance. They do not close those phases, add an asset/renderer/loader, or change the mandatory backend, unit, integration, agent, and browser gates.
