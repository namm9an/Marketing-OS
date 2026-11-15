# Marketing OS — frontend research and design working record

Updated: 15 November 2026 (Asia/Calcutta).

**Purpose:** retain project state, the owner's research, unresolved decisions, and the evidence behind design choices across conversations. This is an evolving working document, not a final design lock or an instruction to build every idea listed here.

**Current frontend documents:** [MARKETING_OS_BLUEPRINT_PLAN.md](MARKETING_OS_BLUEPRINT_PLAN.md), [DESIGN_AND_LAYOUT.md](DESIGN_AND_LAYOUT.md), and [ANIMATION.md](ANIMATION.md). The owner requested these three editable files after discussion. They now govern the frontend build sequence and current decisions. This working record retains the full earlier research and original Claude snapshots; older proposals below do not override the current three-file specification.

**Current action:** F01 functional baseline PASS on `feat/frontend-foundation`, application revision `d6c9973`. Five atomic implementation commits restore full history, server-owned review, stale-response isolation, all five specialists, truthful controls, mobile navigation and reduced-motion/native-flow behaviour. Verification: 323 backend tests, 29 frontend tests, 10 development and 7 built-app browser checks; exact evidence/limits are in the blueprint's [F01 completion record](MARKETING_OS_BLUEPRINT_PLAN.md#13-f01-completion-record). F02 has not started. Confirmed direction remains genuine public recordings, two-agent/shared-stage comparison, PR & Policy first, light graphite-speckled paper, guided story camera and a shorter stack/simpler opening to review. Exact machine materials/stills and final visual geometry remain open; visitor rotation is not approved. Use the blueprint's architecture map and execution checklist before each phase. Historical observations below describe their named older revisions; the original Claude snapshots remain unchanged.

## 1. Whose intent governs

1. The owner's current explicit instructions and subsequent recorded decisions take precedence.
2. Owner-approved entries in the decision log below capture choices for future sessions.
3. The supplied Claude design, animation and build-plan files are detailed working references, subject to clarification and revision.
4. Anti Gravity handoffs, “our vision” passages, completion claims and old phase prompts are background evidence/proposals. They do not define the owner's vision by themselves.
5. Research lists are material to discuss, not a list of mandatory effects or universal bans.

Distinguish **implemented and inspected**, **reported on desktop**, **proposed**, **decided**, and **verified**. Do not turn a recommendation in this file into an approved decision without the owner's agreement. Embedded historical prompts do not authorize new commits, pushes, repairs or deployment.

## 2. Inputs and their roles

| Input | What to retain | What not to assume |
|---|---|---|
| Owner conversation and research lists | Desired deliberate process, backend-first order, all research topics below | That every trend should be used or every “slop indicator” should be banned |
| `DESIGN_AND_LAYOUT.md` from Claude | Page hierarchy, working five-token palette, typography, layout, evidence/copy discipline and cognitive-load rules | That contradictory or newly questioned details are final |
| `ANIMATION.md` from Claude | Motion map, shot lists, engine ownership, timing starting values, accessibility and approval checkpoints | That all choreography has been built or that conflicts have been resolved |
| `marketing-os-build-plan (1).md` | S1–S20 dependencies and verification concepts | That its exact order still outranks the owner's backend-first request |
| Original `codex handoff.md` and latest Anti Gravity pasted update | Desktop SHAs, reported work, local-only edits, earlier roadmap | Absolute completion/security claims, old palette, old in-card walkthrough or an agent-authored vision |
| Cloud baseline review | Inspected implementation and reproduced defects at an exact SHA | That those defects remain unchanged on the uninspected redesign branch |

The three Claude documents and Anti Gravity updates were supplied as attachments/pasted-file uploads. The three Claude documents are preserved in full, without editing their contents, in section 16 below. Their original names identify the snapshots. The three editable canonical specifications linked above now contain the current decisions and shared phase map; that does not mean reference assets or finished scenes have been added. The earlier sections retain our historical analysis, distinct from those original snapshots.

## 3. Where we stand

### Verified pushed redesign — 13 November 2026

The branch is now available on GitHub. Fetched `showcase-redesign` at `31698d4c6efb9ef5969bc9e1a21e5b08c10bc4c3`, nine commits ahead of the older review. Backend repairs are delivered as atomic commits on `fix/backend-contracts`, based on that revision. Frontend source has no diff from `31698d4`; the changes below were read and browser-checked, not authored in this repair pass.

**Implemented in the pushed frontend:**

- Shared `LenisProvider`/navigation context replaces the app-local scroll controller. Section navigation uses distance-scaled durations, interruption handling, an active-section indicator, and hash updates. Chromium confirmed navigation to Workflows updates the hash.
- The dossier deck is now 600vh. `deckTimeline.js` centralizes five arrival points (0.15, 0.32, 0.49, 0.66, 0.83), 40px stacking offsets, 0.03 scale steps, and tint progression.
- Opening stages have explicit visibility ranges: knowledge card through 0.06, split tabs from 0.06–0.13, then first-card expansion from 0.13–0.15. These are the implemented ranges, not a blanket claim that every viewport and reduced-motion case is finished.
- Tabs jump to card milestones. Cards use opaque surfaces, stacked dimming, and a 55/45 content/scene layout on wider screens. The final card has a console CTA.
- The right-hand scene stages are intentionally empty in the actual render tree. This branch does not contain the planned five finished agent scene animations.

**Still unfinished or requiring discussion:**

- The visible blue/green/white palette, older hero, serif/italic card quotations, monospaced labels, and mixed console styling remain. The Claude palette, five-sheet hero, continuous hero-to-deck transformation, new agent slices, and console restyle are proposals that have not all been built.
- Dossier claims, metric strings, and proof labels remain hard-coded in `PinnedDossierCascade.jsx`. Comments calling them recorded or real telemetry are not evidence of genuine recordings. New backend measurements do not retroactively authenticate those strings.
- The console's history mapper ignores `row.result`, substitutes the option title for the original statement, and omits `knowledge_units`. Chromium reproduced the resulting `.map` crash when reopening a persisted recent run. The backend now stores the full result and exposes it through history/detail; consuming that payload is frontend work.
- “Ratify & Approve” still only sets a component boolean. Chromium confirmed no server review was recorded and the boolean carried into the next run. The new authenticated `/api/decisions/<id>/review` endpoint must replace this UI behavior in a later functional integration change.
- The provider selector, BYOK wording, and always-active model labels remain inconsistent with server-owned configuration/mock execution. Attachment handling is still an alert. These controls were left untouched.
- At 1440×900 Chromium found no horizontal page overflow; at 390×844 it still did. With reduced motion enabled, the Lenis root class still appears. Navigation has a reduced-motion shortcut, but the scroll controller is not globally disabled.
- The built same-origin console now supports direct `/console` loading after a backend route correction. Standalone Vite still lacks an API proxy/base configuration.
- Frontend build passes. Lint passes with existing warnings. The initial JS bundle is 133.10 kB gzip; the decorative shader chunk remains 279.43 kB gzip. No new frontend test framework or CI was added.

**Evidence:** `/workspace/reviews/backend-repairs/09-browser-review.json`, `09-frontend-build.log`, `09-frontend-lint.log`, and `showcase-desktop.png`, `showcase-deck.png`, `showcase-mobile.png`, `console-local-approval.png`. These are local review artifacts, not recordings presented as production output. API/provider coverage and its no-live-key limit are in the backend tracker.

The remaining sections preserve earlier baseline observations and research. When a baseline statement differs from this subsection, use the verified revision above for current state. The three original Claude snapshots in section 16 are unchanged byte-for-byte.

### Inspected cloud baseline

Branch `work`, commit `2b4a21d59d8720929b7bdd4f146207aec284afcf`.

- React/Vite/Tailwind application with manual history-based routing and lazy console loading.
- Landing page: sticky header, older hero, 500vh dossier cascade, workflow tabs, specialist/memory explanation, benchmark/evidence section and footer.
- Landing content is inline/static fixture content. No inference runs on the landing page.
- Console: login, single-agent strategy, history, chat/triage, memory disclosure, digest/network and Markdown export.
- Five backend specialist personas exist; the workbench exposes only Branding/PR, and chat labels other agents “parked” even though they are selectable.
- Existing style uses blue/green/white on the landing page and terracotta/rounded/gradient styling in the console; it is not the new unified palette.
- Some older diagram/story components exist but are not mounted in the current landing tree. Existing code is not evidence the proposed new scenes are implemented.
- Baseline tests: 258 backend tests passed, frontend build passed, lint 0 errors/24 warnings. No tracked frontend unit/E2E suite or CI.
- Initial JS: 131.26 kB gzip; console chunk 14.74 kB gzip; decorative shader chunk 279.43 kB gzip. These are build outputs for this SHA, not future budgets already achieved with new work.

### Earlier desktop report — now fetched and reconciled above

Reported branch `showcase-redesign`, reported HEAD `17910f6`, eight commits ahead of baseline:

| Commit | Reported improvement | Current confidence |
|---|---|---|
| `12ebabd` | Deck centering, opaque surfaces and dimmed stacking | READ AT `31698d4`; current behavior above |
| `4f1c170` | 600vh timeline constants, shared Lenis context, click-to-jump tabs | READ AT `31698d4`; current behavior above |
| `7d32054` | Opening morph stages without layer overlap | READ AT `31698d4`; current behavior above |
| `b986616` | Distance-scaled nav scrolling, hash sync and active indicator | READ AT `31698d4`; current behavior above |
| `c2746d0` | Two-panel cards with a dedicated right scene stage; CTA on final card | READ AT `31698d4`; current behavior above |
| `ee2af8c`, `df6aa93` | Real telemetry/citation and honest-metrics work | READ AT `31698d4`; backend tracker records verification |
| `17910f6` | Runtime/deployment preparation | READ AT `31698d4`; backend tracker records verification |

The previously uncommitted `render.yaml` production-variable edit is included in the ninth fetched commit, `31698d4`. Deployment itself has not been performed here.

### Confirmed baseline gaps

- Reopening a persisted history record crashes; ratification is browser-only and carries to later decisions; direct `/console` navigation returns 404; standalone Vite API calls are not proxied. Track these functional integration repairs in the backend tracker rather than burying them inside a restyle.
- PDF/image attachment is an alert only. The model badge/selector overstates actual behavior. Remove or implement a feature deliberately; don't make nonfunctional controls prettier.
- Showcase text/telemetry/simulations do not have a genuine recorded-response trail. Claims such as live tracking, unedited production records, zero hallucination, immutable approval logs and proven isolation exceed evidence.
- At 390px horizontal overflow is observed; Lenis stays enabled under reduced motion. No complete mobile/reduced-motion deck behavior.
- New palette, hero sheets/proof generation, continuous hero exit, recorded scene adapters, five-slice agents inspector, held-out display, calibrated copy, target section effects and console transition are not implemented in the inspected checkout.

## 4. Working experience direction — reference, not a frozen vision

The supplied docs aim for a technical case study that a hiring manager can understand in about 60 seconds and investigate in about five minutes. The interface should reveal what the system actually does. Distinctive visuals must improve that explanation or interaction.

Working page order:

1. Sticky header and clear navigation.
2. Editorial hero: specific headline, one explanatory sentence, a focal five-sheet SVG object, evidence/proof card and a clear primary action.
3. Dossier deck: brief specialist story/evidence plus a small scene preview.
4. A separate agents section: five expandable slices; deeper six-station inspection.
5. Workflow examples; specialist/memory explanation.
6. Benchmarks with methodology, tuned/held-out distinction and known limits.
7. Closing action band leading to a consistent login/console experience.

This newer separate-agents-section proposal supersedes the older in-deck expansion in the supplied Claude plan, **unless the owner changes that choice during our discussion**. Anti Gravity's repeated old walkthrough is not a new decision. The hero's exact content balance and navigation destination are still open.

### Working visual reference

The latest Claude document attributes these exact values to the owner; preserve them as the current reference while discussing research. They replace the earlier blue/cream and alternative Orvane values in historical agent text.

| Token | Value | Proposed role from supplied design doc |
|---|---|---|
| Ink | `#050d09` | Text, structural lines, dark actions/closing band |
| Yellow | `#e7d78a` | Primary accent, active/focus/highlight/action fill |
| Paper | `#e1e1d8` | Canvas and card surfaces |
| Peach | `#e4c185` | Restrained secondary tint |
| Brown | `#4e4739` | Secondary text and stacked-card overlay |

Other reference rules: existing sans/mono/serif roles, square corners, 12-column grid, max-width about 1200–1280px, opaque cards, meaningful hairlines, one subtle front-card shadow. Existing target card width is `clamp(900px, 70vw, 1100px)`; responsive implementation must not force that minimum onto smaller screens.

Typography starting values: H1 `clamp(40px, 5vw, 72px)` at most three lines; H2 `clamp(28px, 3vw, 40px)`; readable 16–18px body; small mono only for actual metadata. Use these as reviewable starting constraints, not excuses to fit text badly.

The new research explicitly questions many of these devices. We may simplify numbering, eyebrows, borders, italics and mono after discussing their purpose. Don't preserve them merely because a previous agent specified them.

### Working motion architecture

- Lenis owns smooth scrolling; Motion owns React layout/scroll-linked transforms; GSAP/`@gsap/react` are approved in the supplied plan for bounded scene timelines. No double ownership of a property. No new engine/package just because a research item mentions it.
- Desktop target deck: 600vh; arrival progress values 0.15, 0.32, 0.49, 0.66, 0.83; hold to 1.0. The latest animation file uses opening boundaries 0.06/0.11/0.15; historical reports use 0.06/0.13/0.15. Reconcile with desired visuals/code before changing constants.
- Hero exit uses its own progress; the sheets fan out then converge into the knowledge-base card, joining the deck opening.
- Preview scenes play on activation, hold, and replay on demand. Inspection advances through Input, Retrieve, Model call, Validate, Govern and Output.
- The deck and larger inspector should share a scene/data adapter instead of inventing two incompatible stories.
- Starting motion values: micro 150–250ms, beat 400–900ms, whole scene about 4–6 seconds; easing/spring numbers are tunable, named constants.
- One focal composition at a time; no endless decorative loops. Reduced motion means readable final frames, no scrubbing/parallax/typewriter, Lenis off.
- Mobile below 768px: normal document flow/vertical deck and accordion; no hero scrubbing. Keyboard and focus behavior must be designed with the interaction, not added at the end.
- Preserve the owner's scene approval workflow from the supplied plan: short brief → static first/final frames → animation. That is a later implementation checkpoint, not a reason to block research or baseline repairs now.

## 5. How to evaluate the research

The following tables preserve **every item from the owner's prompt**. “Recommend” means an initial opinion to discuss, not a final selection. Research headings/counts/spellings are preserved; no extra items are invented to force the lists to twenty.

For each candidate ask: what visitor question or interaction does it improve; does it show actual product/evidence; does it fit the chosen visual hierarchy; can it remain readable and accessible; what does it cost on mobile, reduced motion and initial load?

Do not treat “slop” as an intrinsic property of a font, border or eyebrow. Repetition without purpose, generic content and weak hierarchy are the problems to solve. A border separating two interactive states can be useful even if a bordered box around every sentence is not.

## 6. Design trends — owner research register

| ID | Original item | Initial recommendation and relevance |
|---|---|---|
| T01 | Dithering | EXPERIMENT, low priority. Could texture one restrained technical image; avoid degrading evidence text/charts or adding an effect for its own sake. Compare against plain paper first. |
| T02 | ASCII over video | SET ASIDE for the core interface. It can obscure actual product footage, adds motion/noise and weakens readable evidence. Reconsider only for a specific demonstrative clip. |
| T03 | Infinite canvases | SET ASIDE for landing/navigation. A bounded network view is sufficient for current data; investigate only if a real exploration task outgrows it, with keyboard/mobile alternatives. |
| T04 | Disco logos | SET ASIDE. Attention competes with the system explanation; a stable readable wordmark is preferable. |
| T05 | Renaissance branding | REFERENCE ONLY. Editorial composition/type might inspire restraint; classical motifs would create a different identity that has not been requested. |
| T06 | Monet backgrounds | SET ASIDE. Painterly texture adds a competing narrative and can reduce contrast; not needed to explain this product. |
| T07 | Dark gradient heroes | SET ASIDE under the current warm-paper reference. A dark closing band already provides contrast; no gradient hero by default. |
| T08 | Pixel loaders | CONDITIONAL. A loader must represent real pending work, have accessible status and avoid fake progress. Pixel styling is optional and currently a weak fit. |
| T09 | Instrument serif | DON'T ADD BY DEFAULT. A fashionable font is not a requirement. Evaluate existing typography before adding font/network cost; a serif is not automatically bad. |
| T10 | The one italic word | AVOID as a generic headline trick. Reserve italic for actual quoted agent output if that role is retained. |
| T11 | Cream backgrounds | KEEP AS A REFERENCE, discuss exact paper token. Warm surfaces alone do not make the design distinctive; maintain sufficient hierarchy and contrast. |
| T12 | All-caps eyebrows | SPARINGLY. Keep only if it gives useful context not already in the headline/navigation. Sentence case is a valid alternative. |
| T13 | Pulsing live dots | ONLY FOR A REAL STATE. Never label mock/snapshot content live; prefer a quiet explicit mode label. No perpetual attention marker on the showcase. |
| T14 | Sparkle icons | AVOID as a generic “AI” badge. Prefer a specific action label or an icon with a clear job. |
| T15 | Liquid glass | SET ASIDE. Translucency conflicts with readable opaque dossiers and adds rendering/contrast costs. |
| T16 | Three-icon cards | AVOID as a template. Use a card/icon only when grouping or an action needs it; don't force content into three generic benefits. |
| T17 | Decorative flowcharts | AVOID decoration; USE an accurate explanatory diagram where it answers how the product works. Keep internal implementation detail out of ordinary user tasks. |
| T18 | Endless marqueses | SET ASIDE. No meaningful need for continuously moving logos/chips; static readable evidence is easier to inspect. |
| T19 | Sparkles | SET ASIDE as particles/glitter/flourishes. A successful action needs useful feedback rather than an ambient effect. |
| T20 | Pretext text wrapping | CLARIFY. Does this mean the specific Pretext tool/library or general text wrapping? Use native layout/balanced headings first; evaluate a dependency only for a demonstrated need. |

## 7. “20 ways to unslop ai design” — owner research register

| ID | Original item | Application to Marketing OS |
|---|---|---|
| U01 | Delete filler badges. | Recommend. Remove unsupported “verified/live/AI” labels and redundant chips; keep factual state where useful. |
| U02 | Drop redundant labels. | Recommend. A heading should not repeat an eyebrow, tab and card subtitle. |
| U03 | Unitalicize the random word in your header. | Recommend. No arbitrary italic emphasis; genuine quotations can keep a distinct type role. |
| U04 | Only use mono where necessary. | Recommend. Numbers, identifiers and compact technical metadata; normal prose uses the readable body face. |
| U05 | Use a design system. | Recommend. Shared tokens and component roles across showcase/login/console, with explicit exceptions rather than accidental colors. |
| U06 | Show the actual product. | High priority. Use real outputs and a comprehensible console/result view rather than decorative dashboards. |
| U07 | Enlarge the main feature. | Recommend testing. Give the key product explanation room; don't inflate every section or hide supporting evidence. |
| U08 | Group with spacing. | Recommend. Prefer clear whitespace before adding a border/container. |
| U09 | Add specificity to your headline. | High priority. Explain who the system serves and what it does; confirm audience/message with the owner before final copy. |
| U10 | Emphasise the CTA. | Recommend. One clear next action per composition; visibly secondary alternatives. Resolve the hero destination first. |
| U11 | Add an accent colour. | Already in working palette. Give yellow a defined action/focus/highlight role, not an additional random color. |
| U12 | Keep icons consistent. | Recommend. Existing icon family, consistent optical size/stroke and useful labels. |
| U13 | Remove unnecessary embellishments. | Recommend. Each crosshair, dot field and contour must earn its place; technical appearance is not itself a purpose. |
| U14 | Inner quarter radius = outer quarter radius - padding. | Conditional geometric rule, not a requirement to round things. If this means nested corner radii, apply consistent offsets when rounded containers exist. Current reference uses square corners. |
| U15 | Improve text contrast. | Required accessibility outcome. Verify actual pairs and focus indicators; hue differences alone aren't enough. |
| U16 | Wrap headline text properly. | Recommend. Responsive measure, readable line breaks and zoom testing; don't hard-break for one screen only. |
| U17 | Align by eye, not just by pixel size. | Recommend optical review for logos/icons/type, while retaining a coherent grid. |
| U18 | use Tabular notes. | CLARIFY whether this means tabular numerals. If so, use tabular figures for changing telemetry/aligned metrics, not every paragraph. |
| U19 | Add loading states. | Required for actual async workflows. Include errors, retry guidance, empty results and disabled/pending controls; no simulated progress stream. |
| U20 | Animate useful feedback. | Recommend. Confirm actual submission, selection, copy/export and completion, respecting reduced motion. |

## 8. “20 AI design slop indicators” — owner research register

These are review prompts, not automatic bans. The supplied list contains nineteen entries.

| ID | Original item | What we should inspect |
|---|---|---|
| S01 | Tags and pills | Are they encoding useful state/filtering or repeating promotional copy? Prefer plain text when no grouping/state needs a chip. |
| S02 | Excessive italicised words | Remove arbitrary emphasis; distinguish actual quotations sparingly. |
| S03 | Instrument serif | Judge fit/readability/identity, not popularity. No need to add this font. |
| S04 | Negative kerning | Avoid excessive tight tracking. Optical headline adjustments need testing across sizes. |
| S05 | Over-the-top detailed UI | Make the first view understandable. Put technical evidence behind intentional inspection, not everywhere at once. |
| S06 | Overusing dividers | Use spacing and hierarchy first; retain lines for actual data/interaction boundaries. |
| S07 | Multiple colour shades and opacities | Preserve defined tokens. Overlays/disabled states may need opacity, but no uncontrolled palette proliferation or translucent stacked text. |
| S08 | Containers with borders | A dossier frame can support the concept; nesting every block inside more frames creates noise. Review each boundary. |
| S09 | Overly detailed diagrams | Show the minimum accurate flow needed for the current question; deeper inspection can reveal more. |
| S10 | Overly verbose or redundant text | Specific headline, concise explanation, actual evidence, progressive disclosure. Preserve necessary nuance in details. |
| S11 | Code breadcrumbs | Real navigation paths and IDs only when useful. Avoid fake terminal/path decorations. |
| S12 | Section numbering | Agent numbers have an identity/navigation job; decorative section numerals are optional and should be tested against a cleaner version. |
| S13 | Eyebrows | Retain only when they add context. Don't combine section number, category, badge and subtitle for the same information. |
| S14 | ASCII Images | Usually a poor fit for readable product evidence; no blanket need for ASCII decoration. |
| S15 | Squorcles | Don't adopt trendy corner geometry without a reason. Current working geometry is square. |
| S16 | Excessive monofonts | Audit small mono labels and telemetry density; main reading remains sans. |
| S17 | All-caps subtitles | Keep short metadata readable; long supporting sentences should not be tiny tracked uppercase. |
| S18 | Gradient backgrounds | Not needed in the working direction; remove decorative shader/gradient burden. A gradient is not universally wrong, but would need an explicit new reason. |
| S19 | Periods in titles | Prefer natural title punctuation. Avoid habitual full stops on every short heading; sentences/quotations keep correct punctuation. |

## 9. “20 days to make a beautiful animation” — owner research register

The supplied list contains twenty-one techniques. Values are experiments, not requirements to apply everywhere.

| ID | Original item | Recommendation / limits |
|---|---|---|
| M01 | Use ease out for entrances. | Good starting rule for triggered entrances. Scroll-scrubbed progress needs predictable mapping rather than arbitrary time easing. |
| M02 | Keep drop-downs at 150 to 250 ms. | Good starting range; support rapid repeat input, keyboard use and reduced motion. |
| M03 | Stagger list rows by 30 ms. | Test against supplied 40–80ms range. Keep total wait short; no stagger for large data tables users need immediately. |
| M04 | Scale buttons to 0.97 on press. | Reasonable feedback experiment. Resolve text-scaling policy and don't resize the hit target/layout. |
| M05 | Stretch moving knobs by 12%. | Only if a real draggable knob exists. No invented dial just to use this effect; excessive distortion can reduce precision. |
| M06 | Stagger when details settle. | Use to pace a meaningful hierarchy after the focal object arrives; avoid independent competing animation. |
| M07 | Use arcs for object movement. | Conditional for packets/objects when the path tells a story. This does not mean adding decorative arc backgrounds. |
| M08 | Use a pulse to confirm success. | A single local pulse may help, with text/icon status and no color-only meaning; no endless live-dot pulse. |
| M09 | Use ease in-out for on-screen movements. | Good starting point for an object moving between known positions; don't slow direct drag response. |
| M10 | Start popovers at scale 0.95. | Optional subtle trigger-origin entrance. Check text clarity and reduced motion. |
| M11 | Transition in from the trigger, not from the centre. | Recommend when spatial continuity explains which control opened the view. |
| M12 | Transition out to the trigger. | Recommend where a corresponding trigger still exists; return focus appropriately. |
| M13 | Don't fade into the centre. | Avoid generic detached modal choreography. Choose a useful spatial connection; a simple accessible transition can still be appropriate. |
| M14 | Don't use spring balance for everyday UI transitions. | Interpret provisionally as avoiding bouncy springs for routine controls. Existing `spring.ui` is a starting proposal, not mandatory; clarify “balance” if another meaning was intended. |
| M15 | Don't tween a handheld animation. | CLARIFY “handheld”: direct manipulation/dragging should follow the pointer immediately, with interpolation only for release/settle when appropriate. |
| M16 | Make exits about 20% shorter than entrances. | Useful starting heuristic for triggered UI, not a mathematical rule for every reverse scroll segment. |
| M17 | Bring the new state in as the old state leaves. | Recommend continuity where it doesn't overlap unreadable text. Handle interruption and repeated clicks. |
| M18 | Use mask for reveals and colour changes. | Good fit for restrained text/line/fill reveals; measure clipping/paint cost and preserve accessible text. |
| M19 | Crossfade icons with scale and blur. | Scale/crossfade can be tested for small state icons. Blur conflicts with the current transform/opacity budget and needs an explicit decision; never blur essential text. |
| M20 | Rubberband past drag boundaries. | Only for a real drag interaction. Don't rubberband page scrolling, navigation or keyboard-controlled content. |
| M21 | Reuse the same layout ID across shared objects. | Use for genuine shared-element continuity. IDs must be scoped/unique among simultaneously mounted instances; deck preview and inspector must not accidentally collide. |

## 10. “22 backgrounds to make design less flat” — owner research register

Start by testing plain paper and strong composition. Texture is optional, never a substitute for content hierarchy.

| ID | Original item | Initial relevance |
|---|---|---|
| B01 | Fall texture | CLARIFY reference/meaning. If autumn foliage, likely off-concept; don't infer a selected asset. |
| B02 | Fluted glass | SET ASIDE. Optical distortion/transparency conflicts with dossier readability and current surface rules. |
| B03 | Thermal gradients | SET ASIDE. Introduces new color semantics and a competing visual metaphor. |
| B04 | Water ripples | SET ASIDE for backgrounds. No task or system state currently needs them. |
| B05 | Speckled graphite | EXPERIMENT with a very restrained static sample; compare with paper grain. Keep it away from reading areas. |
| B06 | Single-hue landscapes | SET ASIDE. Adds an illustration/content narrative with no established relationship to this product. |
| B07 | Blueprint grids | CONDITIONAL. A sparse schematic grid can support a technical explanation; not a full-page decoration behind prose. |
| B08 | Halftone | CANDIDATE from the working vocabulary. Use one restrained field at an edge, not behind important text. |
| B09 | Grainy gradients | SET ASIDE under the current no-gradient reference. Static grain can be evaluated separately. |
| B10 | Grass texture | SET ASIDE. No product relationship, potential visual noise and asset weight. |
| B11 | Dithered images | EXPERIMENT only if an actual image needs that treatment; preserve legibility and data integrity. |
| B12 | Paper texture | CANDIDATE. Test static, subtle texture in unused canvas areas; current reference caps grain at 6% and excludes cards/text areas. |
| B13 | Contour lines | CANDIDATE if they provide hierarchy/active framing. A few restrained contours, not topographic wallpaper everywhere. |
| B14 | Cloud sky | SET ASIDE. Literal cloud imagery may make the product look like a hosting advertisement instead of the actual marketing-agent system. |
| B15 | Pixel mosaics | SET ASIDE for the core view; insufficient task relevance and competing texture. |
| B16 | Lens distortion | SET ASIDE for reading/interface surfaces. Could obscure exact numbers and boundaries. |
| B17 | Stippled gradients | SET ASIDE as gradients. A static sparse stipple is an alternative to compare, not another texture to stack. |
| B18 | Square dot grids | CANDIDATE. Sparse, static and peripheral. Pointer response remains optional and must respect the one-focal-animation rule. |
| B19 | Blurred photos | SET ASIDE by default. Hides product specificity and creates readability/load concerns. |
| B20 | Iridescent shapes | SET ASIDE. Requires a different palette/material language and adds decorative competition. |
| B21 | Impressionist paintings | SET ASIDE. Similar concern as Monet backgrounds; no reason to introduce a painterly brand direction yet. |
| B22 | ASCII pixels | SET ASIDE. A technical product does not require pseudo-terminal texture; assess only against a specific demonstrative purpose. |

## 11. What to discuss first

Do not research every effect simultaneously. Proposed discussion order:

1. **Audience and product explanation.** What should a visitor understand in five seconds, and what real output proves it? Confirm whether the principal audience is recruiters/engineering reviewers, potential users, or both.
2. **Hierarchy and primary action.** Which is the focal experience: deck story, agent inspector or console? Decide the hero action and how those experiences connect.
3. **Visual restraint.** Compare a clean warm-paper composition with a restrained technical-texture version. Decide how much mono, framing, numbering and italic quotation actually helps.
4. **One representative static design.** Hero plus a PR dossier/inspector state, including realistic long text, missing evidence and a narrow screen. No animation yet.
5. **One motion story.** Agree a short PR brief and stills, then choose timing, triggers, interruption, replay and reduced-motion behavior. Expand only after the first scene works.

Keep useful techniques; don't create a site that attempts to demonstrate every trend. Research a reference only when it addresses a recorded open question. Save its URL/asset/source, the specific behavior to learn, a static alternative, and the resulting decision.

## 12. Data and claim requirements that design must accommodate

- Genuine recorded runs should provide input/fictional-simulated labels, untouched output, UTC recording time, requested/served model, mode, fallback status, attempts, measured timing, tokens, finish reason, retrieved fact IDs/text/source URLs and citations where available.
- Don't invent schema/governance/phrase-level reasoning events to fill an animation. Store the evidence needed for a station or omit the unavailable value. Distinguish an illustrative transformation from an actually recorded event.
- Generated proof numbers come from the real database/test run; the current baseline includes target facts, so don't call all 75 rows competitor facts.
- A mock console must be visibly identified as mock. A live-ready console isn't necessarily making live calls at that moment.
- Benchmarks must identify metric, denominator, query count, tuned/held-out status and evaluation date/version. No fake held-out bar while its result is missing.
- Copy must not promise zero hallucination, immutable approval, live monitoring, actual sentiment collection or scheduled weekly updates unless code and evidence establish them.
- Static visuals must still explain the system when animation, hover, external fonts or JavaScript effects are unavailable as applicable.

## 13. Open questions and conflicts

These remain questions, not blockers for independent backend work.

| ID | Question | Proposed direction, awaiting owner decision |
|---|---|---|
| Q01 | Palette bans white but console calls for white labels on black buttons | Use ink buttons with paper labels, or choose yellow-filled primary actions consistently |
| Q02 | Speed blur up to 6px versus a ban on animated filters/blur | Omit motion blur initially; test transform/mask continuity first |
| Q03 | “Text must never scale” versus scaled deck cards, popovers and pressed buttons | Define whether whole-component scaling is an exception; evaluate actual text clarity |
| Q04 | Hero “Explore the agents” leads to agents section or deck start? | Choose based on the first-time visitor journey; align label/hash/focus/scroll behavior |
| Q05 | Approved copy says console is live while planned initial deployment is mock | Explicit runtime mode and honest availability wording |
| Q06 | 4–6s scenes/typewriter speed versus long recorded output/no internal scrolling | Clearly labelled excerpt in preview and full inspectable output, or longer duration; owner chooses |
| Q07 | “Tabular notes” | Confirm whether tabular numerals were intended |
| Q08 | “Pretext text wrapping” | Confirm specific library/tool versus general wrapping; no dependency assumed |
| Q09 | “Don't tween a handheld animation” | Confirm whether direct manipulation was intended |
| Q10 | “Fall texture” | Supply a reference/meaning before assessing it as a visual choice |
| Q11 | Technical dossier devices appear in both the design plan and slop list | Decide by visible purpose; compare restrained versus denser static samples |
| Q12 | Opening morph tab window ends at 0.11 or 0.13 in different documents | Verify the branch and review the desired forward/reverse sequence |
| Q13 | Detailed inspector versus a second specialists/memory section | Define distinct jobs and remove repetition; do not create two agent directories by accident |

## 14. Frontend implementation backlog

Implementation starts after the backend and shared result contracts are sufficiently stable. Accessibility/responsiveness are acceptance criteria in every step, not a final patching phase.

| Order | Work package | Current state | Evidence needed to close |
|---|---|---|---|
| FE-00 | Inspect incoming redesign diff and preserve docs/local work | WAITING FOR BRANCH VERIFICATION | Exact SHA and updated covered/partial/missing map |
| FE-01 | Settle audience, hierarchy, primary action and key visual rules | DISCUSSION OPEN | Owner decisions in log, remaining questions explicit |
| FE-02 | Define actual API/recording adapters and feature/mode labels | WAITING ON BACKEND CONTRACTS | Adapter/error/missing-field checks; no fake controls or numbers |
| FE-03 | Add meaningful frontend/browser test coverage | MISSING ON BASELINE | Real flows, route refresh, nav/deck, keyboard, reduced motion and overflow checks; reviewed baselines |
| FE-04 | Apply chosen tokens/type/spacing across surfaces | PROPOSED | Static comparisons, contrast, coherent landing/login/console; no accidental new palette |
| FE-05 | Build static hero and generated proof | PROPOSED | Real metrics, useful product evidence, responsive headline and clear action |
| FE-06 | Reconcile deck improvements and mobile variant | DESKTOP WORK REPORTED | Correct arrivals/stack/centering/tab behavior, no invalid scales/overlap/scroll traps |
| FE-07 | PR preview and detailed scene pilot | PROPOSED | Approved brief/stills then animation; real fields and reduced-motion static state |
| FE-08 | Five-slice/vertical agents inspector | PROPOSED | All six stations, missing data states, keyboard/focus, preview link, no duplicate narrative |
| FE-09 | Remaining specialist scenes | PROPOSED | Reuse tested adapter/scene conventions; each story reflects its real evidence |
| FE-10 | Workflow/memory/benchmark copy and known limits | PROPOSED | Actual contracts/counts; tuned and true held-out results distinguished; concise explanations |
| FE-11 | Useful interaction/section motion | PROPOSED | Named constants, interruption/reverse behavior, focused composition, no needless loops |
| FE-12 | Console/login restyle, shader removal and route transition | PROPOSED | Functional regressions remain green; loading/error/approval modes honest; bundle before/after |
| FE-13 | Final device/accessibility/performance verification | NOT RUN AS A FULL GATE | 360/390/768 widths and desktop sizes, zoom/keyboard, reduced motion, axe/Lighthouse as agreed, no console errors |
| FE-14 | Deployment presentation, README and demo | NOT ESTABLISHED | Verified links/runtime behavior and explicit static/live/mock distinction; separate deployment authorization |

Supplied performance targets to revisit after the design is agreed: initial JS at most 180 kB gzip, approximately fewer than 150 simultaneous animated SVG elements per scene, smooth interaction on a typical 1366×768 laptop, desktop Lighthouse performance ≥80/accessibility ≥95. These are targets, not results of this planning task.

## 15. Research and decision logs

### Research entry template

```text
Question / research IDs:
Reference URL or asset and source/license:
What specifically helps this product:
What we are not copying:
Static / simpler alternative:
Mobile, keyboard, reduced-motion and performance implications:
Comparison or test result:
Owner decision and date:
Affected requirements/components:
```

### Decisions actually recorded

| Date | Decision | Source | Effect |
|---|---|---|---|
| 2026-11-13 | Treat Anti Gravity's update/vision as background, not literal final direction | Owner's current request | No automatic adoption of old palette, claims or phase sequence |
| 2026-11-13 | Create separate backend and frontend working records; preserve all research | Owner's current request | These two files are the ongoing context records |
| 2026-11-13 | Proceed deliberately; prioritize backend correctness before full frontend implementation | Owner's current request | Backend repair stages precede visual build work; research can continue |
| 2026-11-13 | Retain the paper/dossier identity | Owner confirmed in design discussion | Current design specification preserves the outer identity |
| 2026-11-13 | Use clicked miniature physical 3D machines/scenes explaining each agent | Owner confirmed | Supersedes the old flat-SVG-only limitation |
| 2026-11-13 | Let website visitors compare agents before choosing | Owner explicitly clarified | Comparison is a product feature, not our internal design comparison |
| 2026-11-13 | Keep six-background and five-trend research shortlists separate, then narrow | Owner confirmed | Shortlists are candidates, not a requirement to combine every effect |
| 2026-11-13 | Maintain three current editable documents and check every phase before proceeding | Owner requested | Blueprint contains common gates and per-phase acceptance |
| Pending | Which research effects/styles to adopt | Not decided | Tables above remain recommendations |

### Change log

- 2026-11-13: Created the three current specifications linked above, reflecting the owner's latest physical-3D, visitor-comparison, research, and phase-gating decisions. The earlier sections remain historical context and research; section 16 remains byte-for-byte unchanged. No frontend implementation was performed.

- 2026-11-13: Created with inspected baseline, unverified desktop work, Claude plan summary, all owner research items with initial assessments, open questions, staged backlog and decision templates. No visual direction newly approved and no code repaired by this document.
- 2026-11-13: At the owner's request, embedded all three supplied Claude documents verbatim in section 16. Original contents are preserved separately from our analysis above.

## 16. Original Claude documents — verbatim snapshots

These are the complete supplied documents, preserved as received. Fences and snapshot headings are archive wrappers; the document bytes inside them are unchanged. Their historical instructions and proposals remain separate from the working decisions above.

### Original: DESIGN_AND_LAYOUT.md

````````markdown
# Marketing OS: Design and Layout

> **Status (Nov 2026):** built so far = pinned dossier deck with two-panel cards, click-to-jump tabs, opening morph, and smooth nav scrolling (commits 12ebabd to c2746d0). Everything else in this file is the target.

**How to use this file.** Read it before building or changing any UI. Read `docs/ANIMATION.md` too for anything that moves. If a task conflicts with either file, stop and ask before building. Do not add colors, fonts, effects, dependencies, or decorative elements that are not listed here.

## 1. Aim

Marketing OS is an engineering case study of a governed multi-agent system. A hiring manager should understand what it is in 60 seconds and be able to verify the claims in 5 minutes. The site should feel alive and technical, never like a spreadsheet and never like a template. Credibility and clarity come first, and animation serves them.

## 2. One style, everywhere

A **Swiss technical dossier with a warm palette**:
- **Swiss / International Typographic Style** (core): strict grid, clear hierarchy, hairline borders.
- **Editorial typography** (core): serif italic for quoted agent output, large numerals.
- **Technical HUD vocabulary:** mono labels, numbered tabs, crosshair marks, dashed contour lines, dotted halftone fields, small data readouts.

The palette and the HUD vocabulary come from the reference image `docs/reference/palette.jpeg`. Use it for color and vocabulary only. Never copy its layout, copy, or branding.

The landing page, the login screen, and /console all follow this one system. No section may use a different style.

## 3. Palette (final; all five values come from the owner)

| Token | Hex | Role |
|---|---|---|
| `--ink` | #050d09 | text, primary buttons, hairlines, the closing call-to-action band |
| `--yellow` | #e7d78a | the single accent: active tab and nav marker, highlight marker behind a key word, key data, focus ring, primary button fill |
| `--paper` | #e1e1d8 | page background AND card surfaces |
| `--peach` | #e4c185 | secondary tint: hover, chart fills, connector accents |
| `--brown` | #4e4739 | secondary text, muted labels, the dim overlay on stacked cards, outline numerals |

Rules:
- **Do not sample, adjust, lighten, darken, tint, or "harmonize" any value.**
- Text on yellow or peach is always `--ink`. Never use yellow or peach as a text color on a light background.
- Verified text contrast (all pass 4.5:1): ink on paper 14.95, ink on yellow 13.56, ink on peach 11.48, brown on paper 6.99, brown on yellow 6.34, brown on peach 5.37.
- Yellow, peach, and paper are close in brightness (yellow vs paper 1.1:1, peach vs paper 1.3:1, yellow vs peach 1.18:1). They separate by hue only, so never rely on color alone: use a 1px ink or brown hairline, or ink text, between neighbors.
- Use yellow sparingly: at most one or two yellow areas in view at a time, so it keeps meaning "look here".
- Charts and dials may use stepped ramps made only of palette colors (yellow, then peach, then brown segments). Smooth gradients are banned.
- No pure white, no blue, no green, no terracotta (#D97757), no other color. A pass state is an ink check icon on a yellow chip.
- No per-agent colors. Agents are told apart by number and label.
- The page background is `--paper`. Cards are `--paper` too, separated by a 1px ink hairline and (for the front deck card only) one subtle shadow.

## 4. Typography

- Keep the existing sans-serif for headings and body, the existing mono for labels, numbers, tabs, and telemetry, and the existing serif italic ONLY for quoted agent output and value propositions. Do not add fonts.
- Scale: H1 `clamp(40px, 5vw, 72px)`, left-aligned, at most 3 lines. H2 `clamp(28px, 3vw, 40px)`. Body 16 to 18px, never below 14px. Mono labels 11 to 12px, uppercase, letter-spacing 0.08em.
- A highlight marker (a `--yellow` bar behind one key word of a heading) is allowed once per view.

## 5. Shape, surface, depth

- Square corners (radius 0) on cards, buttons, inputs, tabs, and the login card.
- 1px hairline borders. Cards are opaque.
- One subtle shadow only: the lift on the front deck card.
- **Allowed texture vocabulary (from the reference):** dotted halftone fields, dashed contour lines, crosshair (+) registration marks, dashed corner brackets, and a very subtle static paper grain (max 6% opacity) on the page background only, never on cards or behind text.
- **Banned:** gradients, blur-glow, glass, blobs, rounded pills, arcs and triangles as background shapes.
- Dim a card by laying a `--brown` overlay on it. Never lower a card's opacity.

## 6. Grid and spacing

- 12-column grid, content max-width 1200 to 1280px, 24px gutters. Spacing scale in multiples of 8px.
- Deck cards are `clamp(900px, 70vw, 1100px)` wide, the same width for every card, offset only on the Y axis when stacked.
- One primary action per view. A second action must be visibly secondary (outlined, not filled).

## 7. Page structure, top to bottom

**Header (exists, restyle only).** Sticky. Brand left, links in the middle, GitHub and Launch Console right. The active link has a yellow marker.

```
[ MARKETING OS | PRODUCT SHOWCASE ]  01 Architecture  02 Workflows  03 Specialists  04 Benchmarks   [GitHub ↗] [Launch Console]
```

**1. Hero (new; asymmetric editorial layout).** See section 8.

**2. Pinned dossier deck (exists).** The knowledge-base card splits into five tabs, then five agent cards cascade as you scroll. Each card keeps its two panels. Changes: the right panel plays a small scene preview, and a small link "Open in agents section" scrolls to that agent's slice and opens it.

```
┌─────────────────────────────────────────────────┐
│ 01 / BRANDING  Positioning & Cluster SLAs   ear │  tab + recorded telemetry
├───────────────────────┬─────────────────────────┤
│ Simulated signal      │  small scene preview    │
│ Value proposition     │  (SVG, plays on arrival)│
│ Evidence              │  [Open in agents →]     │
└───────────────────────┴─────────────────────────┘
```

**3. Agents section (new; five-slice accordion).** See section 9.

**4. Workflows (exists, Section 02).** Tabbed card: Autonomous Run, Specialist Chat, Dialectic Triage, Executive Digest. Restyle only, copy per section 11.

**5. Specialists and Memory (exists, Section 03).** Restyle only. Keep it to at most 3 text blocks per group.

**6. Benchmarks (exists, Section 04).** Retrieval test with the tuned-set bars and the held-out bars, followed by the Known limits box.

```
┌──────────────────────────────────────────────┐
│ heading                          badge        │
│ tuned set   ████████████░░░░  90.0%           │
│ held-out    ██████░░░░░░░░░░  X%  (when run)  │
│ KNOWN LIMITS  · 5 short lines                 │
└──────────────────────────────────────────────┘
```

**7. Closing band.** A full-width `--ink` band, the only dark area: one line, the primary "Launch Console" button (yellow fill, ink text), a secondary GitHub link, and the demo link when a demo exists.

## 8. Hero in detail

```
[ header ]
 FIVE AI AGENTS        ┌────────────┐   ┌──────────────┐
 FOR COMPETITIVE       │ hero object│   │ proof card   │
 STRATEGY.             │ five sheets│   │ 75/75 ...    │
                       │ with depth │   │ 264 tests    │
 one sentence          │            │   │ 5 specialists│
 [Explore the agents]  └────────────┘   └──────────────┘
 [▶ demo thumbnail]                      [Launch Console →]
 LangGraph · SQLite FTS5 + WAL · Pydantic · Flask · SHA-256 fact IDs · [model] (tech strip)
 Demo case study: Vanguard Cloud (fictional client). Facts scraped Oct 2026.
```

- **Title (left, 3 lines max, not centered):** "Five AI agents for competitive strategy."
- **One sentence:** "Each agent answers from the same 75 grounded competitor facts. Only human-approved decisions are saved to memory."
- **Buttons:** "Explore the agents" (primary, yellow fill, ink text) and, only when a demo video exists, a "Watch demo" thumbnail with a play button. Until then leave the slot empty.
- **Hero object (center):** five flat layered sheets drawn in SVG with depth (each offset by a few pixels), labelled 01 to 05, front sheet in `--paper` with a yellow tab. It is not a 3D model. It is built from SVG shapes only.
- **Proof card (right):** three tiles: "75 / 75 facts source-linked", "264 tests (LLM mocked)", "5 specialists, 1 governance layer". Numbers come from the repo and recorded data, never typed by hand. Below it, the Launch Console button.
- **Tech strip (bottom):** mono chips. Read the list from `requirements.txt`, `package.json`, and real imports. The model chip shows the model string from the recorded JSON. The test count comes from a real pytest run.
- **Hero background:** `--paper` with the allowed texture vocabulary (a few crosshair marks, one dotted halftone field at the lower edge). Nothing else.

## 9. Agents section in detail

Five vertical slices fill the section width. Rest state: five equal slices, each showing a rotated agent number and name in mono, a thin hairline border, and a small static glyph.

```
┌──┬──┬──────────────┬──┬──┐
│01│02│ 03 EXPANDED  │04│05│
│  │  │ route + data │  │  │
└──┴──┴──────────────┴──┴──┘
```

- **Hover:** the hovered slice widens a little and a yellow top edge draws across it.
- **Click:** the slice expands and the others become slim strips with rotated labels. Inside the expanded slice, a **route** of six stations is drawn: Input, Retrieve, Model call, Validate, Govern, Output. A marker moves from station to station with Next and Back (and the arrow keys). Each station shows only values from that agent's recorded JSON: the retrieved facts with source domains, the model string, latency and tokens, the schema check result, whether it escalated, and the output. If a field is missing, show the station without it.
- **Close:** X button, Esc, or clicking a slim strip.
- **Same scene as the deck preview:** the small preview in the deck and the expanded slice use one scene component at two sizes.
- **Mobile (below 768px):** a vertical accordion.
- **Intro line above the slices:** "Five specialists with separate prompts and memory namespaces over one shared fact base."

## 10. Cognitive-load rules

- **Hero:** one headline, one sentence, at most two buttons, one proof card, one focal object. No callout box.
- **Each deck card, default view:** at most 3 text blocks plus the scene preview. Detail goes behind "Open in agents section".
- **Groups:** no more than 5 items visible in any single group.
- **Text sizes:** no more than 3 sizes inside one card.
- **Actions:** no more than 2 competing actions on screen.
- **Life without clutter:** animation should pace information (show one thing at a time), not add more things. If a view reads like a spreadsheet, add a focal visual, not more text.
- **5-second test:** after 5 seconds on the hero, a stranger should be able to say what it is, who it is for, and what to click.
- **Gate for any new element:** it must (a) answer a question the visitor has, (b) use only existing tokens, and (c) look natural next to the "Launch Console" button. Otherwise remove it.

## 11. Words on the page: claims and approved copy

**Rules**
- Keep every technical term that is true (BM25, SQLite FTS5, WAL, LangGraph, Pydantic, recall@5, deterministic governance). Put one plain sentence next to a branded term, never instead of it.
- Do not use these words unless literally true and provable in the code: "live", "unedited", "production", "verified", "cryptographic", "weekly", "consensus", "provenance verification", "zero hallucination", "isolated" (without saying what is isolated).
- Anything simulated or fictional is labelled as such on the page.
- Every number traces to a file, a log, or a test. Never hand-write telemetry.
- Benchmarks state how many queries, which metric, and whether the set was tuned or held out.
- Never name gemini-3.5-flash or gemini-3.6-flash. The model string shown comes from the recorded JSON.

**Approved replacements** (apply exactly; bracketed values come from recorded files or the eval report, and if one does not exist yet, stop and say so)

| Where | Replace with |
|---|---|
| Hero footer | Snapshot of 12 GPU-cloud competitors, scraped Oct 2026 |
| Under the hero buttons | This page replays stored sample outputs so it loads instantly at no API cost. The console runs the same agents live. |
| Knowledge-base card | 12 Competitors, 75 Fact Records / Scraped from competitor sites in Oct 2026: positioning, documentation, GPU fleets, and pricing rate cards. |
| Section 02 heading | Source-Linked Endpoint Payloads. |
| Section 02 paragraph | Recorded from a real run on [DATE]: [model from recorded JSON], LangGraph orchestration, SQLite FTS5 retrieval. Payload fields (decision, recalled_facts, memory_verdict, graph_paths) match the API contracts covered by our pytest suite. Vanguard Cloud is a fictional client; competitor facts are scraped and market signals are simulated. |
| Badge on Section 02 and every card | DEMO CASE STUDY: VANGUARD CLOUD (FICTIONAL CLIENT) |
| Card label | SIMULATED MARKET SIGNAL |
| Card header right | Pydantic-validated output |
| Card footer | FTS5-grounded · [n] facts retrieved (add "· [n] cited" only if evidence_ids exists in the recorded JSON) |
| Card ear | [ms] ms model call · [n] tokens · [n] facts retrieved · [model] (all read from the recorded JSON) |
| Memory gate text | Rule-based gate, no LLM in the loop. Only human-approved directives reach memory. |
| Specialists text | 5 Domain Specialists / Separate prompts and memory namespaces over one shared fact base. |
| Dialectic Triage subtitle | Two specialists answer independently; a merge step surfaces where they agree and where they conflict. (Do not say "debate".) |
| Deterministic governance | Deterministic governance (regex memory gate, namespace isolation, risk-keyword escalation) around model-generated strategy. |
| Digest | Executive Digest (generated on demand). Merges specialist briefs and retrieved facts into one structured digest. |
| Section 04 heading | Measured Retrieval Lift & Source-Linked Facts. |
| Section 04 paragraph | We evaluated our SQLite FTS5 engine over 75 fact records from 12 GPU-cloud competitors: on 12 paraphrase queries, mean recall@5 rose from 28.3% to 90.0% with deterministic taxonomy expansion. The taxonomy was written with those queries in view, so this is a tuned-set result. Held-out: [X% to Y%] on [N] new queries. |
| Section 04 badge | +61.7 pts Paraphrase Recall Lift (tuned set) |
| Section 04 bar labels | Marketing OS (BM25 + Deterministic Taxonomy Expansion) / 90.0% Recall@5 (+61.7 pts) |
| Section 04 footnote | Evaluated against 75 fact records across 12 neo-cloud competitors, 12 of 34 test queries / 5 FTS5 candidate slots. Metric: mean per-query recall@5 (denominator = min(relevant facts, 5)). |

**Known limits box (Section 04):**
- Competitor facts are an undated Oct 2026 snapshot (no scraped_at column yet).
- The retrieval benchmark is small (12 paraphrase queries) and its synonym map was tuned on them; the held-out result is reported separately.
- Memory approval is keyword-based.
- Market signals in the demo are simulated.
- This page replays stored outputs; /console runs the agents live.
- The pytest suite runs against a mocked LLM.
- The five specialists share one knowledge base; only prompts and memory namespaces are isolated.
- The executive digest is generated on demand; there is no scheduler.
- Specialist output does not cite fact IDs (remove this line if evidence_ids is in the recorded JSON).

## 12. Login and console

- Login card: square corners, hairline border, `--paper` background, no gradient or grain. Same tokens as the landing page.
- Console: black primary buttons with white mono labels, same hairline cards, same type system, same palette. No terracotta. Remove the Three.js shader background (the large ShaderCanvas chunk).

## 13. Styles to avoid

| Style | Decision |
|---|---|
| Swiss, Editorial, Minimalism | **Core.** This is our system. |
| Bento grid, Luxury typography, Wabi-sabi | **Borrow only:** bento for small proof tiles with hairline borders; luxury serif only for key quotes; wabi-sabi warm paper tone only (no organic textures). |
| Neo-brutalism, Glassmorphism, Neumorphism, Claymorphism, Ethereal, Synthwave, Cyberpunk, Cybercore, Y2K, Pixel art, Surrealism, Conceptual sketch, Scrapbook, Bohemian, Victorian, Maximalism | **Avoid.** Do not use any element from these styles. |

## 14. Before reporting any phase as done

- [ ] Screenshots at 1366x768 and 1920x1080 are attached
- [ ] No new colors, gradients, shadows, radii, fonts, or dependencies were added; no blue or green remains
- [ ] Every text and background pair meets 4.5:1
- [ ] No text overlaps or is cut off; no horizontal scrollbar
- [ ] Reduced-motion behavior works
- [ ] Every number and animation string comes from recorded data
- [ ] None of the banned words in section 11 were introduced
- [ ] The Gate command for the step was run and its full output pasted
````````

### Original: ANIMATION.md

````````markdown
# Marketing OS: Animation

> **Status (Nov 2026):** built so far = pinned deck cascade (scroll-driven), opening morph (knowledge-base card to five tabs to card 1), click-to-jump tabs, and smooth nav scrolling (Lenis). Everything else in this file is the target.

**How to use this file.** Read it with `docs/DESIGN_AND_LAYOUT.md` before building anything that moves. If a task conflicts with either file, stop and ask. Timing numbers below are starting values: keep them as named constants at the top of each scene file so they can be tuned.

## 1. What animation means for us

Animation is objects on the page that move or change shape when the visitor loads, scrolls, hovers, or clicks. It is not decoration. These rules decide everything:

1. **Every motion has a job.** It shows data flowing, shows order, shows a state change, directs attention, or confirms an action.
2. **Continuity.** Scenes are made out of the previous scene. Nothing crossfades or cuts between scenes: shapes morph, slide, converge, or get covered. An element may use opacity only together with movement or a mask.
3. **Physics.** Fast start, soft settle. Blur only follows speed on big moves and never exceeds 6px.
4. **Real data only.** Text, numbers, and events in a scene come from the recorded JSON files. Never invent them.
5. **Scroll is time.** Scroll position drives the scene timeline. Clicks jump to named moments on it.
6. **One focal animation per viewport.** Everything else in view is still or only reacts to hover or pointer.
7. **No glow.** Light comes from yellow edges and drawn lines, never from blur or bloom.

## 2. The animation map (where everything moves)

| # | Where | Trigger | What moves | Made of |
|---|---|---|---|---|
| 1 | Header nav | load, hover, scroll | slides in; a yellow marker slides between the links | CSS/Motion |
| 2 | Hero title | load | each line rises out of a mask line | CSS/Motion |
| 3 | Hero object (five sheets) | load | outlines draw back to front, front sheet fills and its yellow tab sweeps | SVG |
| 4 | Hero object | pointer move | sheets shift in layers (parallax) | CSS/Motion |
| 5 | Proof card | load | slides in; numbers count up | JS counter |
| 6 | Tech strip | load | chips pop in one by one | Motion |
| 7 | Hero to deck | first scroll | sheets fan out, then converge into the knowledge-base card; nothing fades | SVG + scroll |
| 8 | Deck opening morph | scroll (built) | knowledge-base card to five tabs to card 1 | Motion + Lenis |
| 9 | Deck cascade | scroll (built) | cards stack and dim | Motion + Lenis |
| 10 | Deck tabs | hover, click | yellow underline draws; click scrolls to the card | Motion + Lenis |
| 11 | Deck card, right panel | card arrives | small agent scene plays once, then holds | SVG + GSAP |
| 12 | Active deck card | card arrives | dashed contour lines around the card trace in | SVG |
| 13 | Agents slices | hover | slice widens, yellow top edge draws | CSS |
| 14 | Agents slice | click | slice expands; a six-station route draws; a marker travels station to station with Next/Back | SVG + GSAP |
| 15 | Section headings 02 to 04 | scroll | heading lifts 40px relative to its card; words rise from masks | Motion |
| 16 | Margin numerals 02 to 04 | scroll | outline numerals drift at different speeds | Motion |
| 17 | Workflow tabs | click | content swaps with a horizontal mask wipe | Motion |
| 18 | Benchmark bars | enter view | bars draw to their values; numbers count up | SVG/CSS |
| 19 | Dot-field background | pointer near | dots within 120px of the pointer brighten | canvas/CSS |
| 20 | Buttons | hover, press | yellow fill sweeps across; press shrinks slightly | CSS |
| 21 | Launch Console | click | a yellow shape floods the screen from the button and contracts into the login card | CSS/SVG |

## 3. Scroll as a timeline

- Treat scroll progress `p` (0 to 1) of a pinned section as time. Each scene is a pure function of `p`: given `p`, the screen is fully determined.
- The deck's constants live in `frontend/src/lib/deckTimeline.js`. Keep using them. Container height 600vh. Opening morph: `p` 0 to 0.06 knowledge-base card, 0.06 to 0.11 five tabs, 0.11 to 0.15 card 1 expanding. Cards arrive at 0.15, 0.32, 0.49, 0.66, 0.83. Hold from 0.83 to 1.0.
- Clicks jump to named moments: clicking tab N calls `lenis.scrollTo` to that arrival point; a hero button jumps to the deck start; an "Open in agents section" link jumps to the agents section and opens the slice.
- The hero exit (item 7) uses its own `pHero` (0 to 1 over the first 100vh of scroll).
- Wiring: Lenis smooths native scroll. Motion's `useScroll` and `useTransform` read the scroll progress. Scene timelines that are not scroll-driven (items 11 and 14) play on a trigger.
- In test mode (`MODE=test`) expose `window.__lenis` so tests can jump to exact `p` values.

## 4. SVG techniques we build with

| Technique | Use it for | How |
|---|---|---|
| Path drawing | outlines, routes, underlines, strike-throughs | Motion `pathLength` 0 to 1, or GSAP DrawSVG |
| Packet along a path | a draft line, query, or fact traveling between stages | Motion `offsetDistance`, or GSAP MotionPath |
| Node pulse | marking that a stage received something | one ring that scales 1 to 1.6 once while its stroke fades |
| Bracket reticle | locking onto one phrase or row | four corner paths drawing in |
| Highlight marker | the key phrase in a result | a `--yellow` bar scaling in on X behind the text |
| Mask reveal | revealing a line of text or output | clip-path or an overflow mask |
| Typewriter | agent output arriving | mono or serif text at about 40 characters per second with a caret |
| Counter | latency, tokens, facts, proof numbers | tick up with ease-out from recorded values |
| Morph | one shape becoming another | GSAP MorphSVG or matching paths animated with Motion |
| Stagger | lists of chips, facts, tiles | 40 to 80ms between items |

## 5. Engines and rules

- **Lenis** is the only smooth-scroll engine.
- **Motion (Framer Motion, already installed)** handles React layout and state, scroll-linked values, and UI springs.
- **GSAP** with `@gsap/react` (`useGSAP`) is allowed only inside scene components, for sequenced timelines with labels (a labelled timeline is what makes Next and Back steps easy). Do not use ScrollTrigger unless approved; if ever approved, drive Lenis from `gsap.ticker`.
- **No two libraries may control the same property on the same element.**
- **Approved new dependencies:** `gsap`, `@gsap/react`. Anything else (Three.js, Lottie, Rive, WebGL, particle libraries) needs approval first.
- Remove the Three.js shader background from the console (see the build plan).

## 6. Timing and feel

| Token | Value | Use |
|---|---|---|
| `outExpo` | cubic-bezier(0.16, 1, 0.3, 1) | entrances |
| `inOutCubic` | cubic-bezier(0.65, 0, 0.35, 1) | moves and morphs |
| `spring.ui` | stiffness 260, damping 24 | small UI only |
| micro | 150 to 250ms | hover, press, focus |
| beat | 400 to 900ms | one step of a scene |
| scene | 4 to 6s | a whole agent scene |

- A scene plays once when it becomes active, holds its final frame, and shows a small mono "Replay" button.
- Text may move but must never scale during a transition (scaled text blurs).
- No perpetual loops. Everything is triggered by load, scroll, hover, click, or pointer.

## 6b. Illustration policy

Schematics, diagrams, charts, node graphs, and icons built from SVG are encouraged. Do not draw illustrations with the model (people, hands, devices, vehicles); they come out amateur. If an illustrative asset is ever wanted, source an original or properly licensed one and record where it came from. Our product needs none: our version of "a train traveling from A to B" is a fact traveling from a source to a decision.

## 7. Performance and accessibility budgets

- Animate only `transform`, `opacity`, `stroke-dashoffset`, and `clip-path`. Never animate filter, blur radius, or box-shadow.
- Fewer than about 150 simultaneously animated SVG elements per scene. 60fps on a 1366x768 laptop.
- Landing page initial JavaScript at most 180 kB gzip (it is about 133 kB now). Pause offscreen with IntersectionObserver and when the tab is hidden. Use `will-change` only while animating.
- **`prefers-reduced-motion`:** show every final frame immediately, no parallax, no scroll scrubbing, Lenis off, no typewriter.
- Everything an animation shows must also exist as real text. Decorative SVG gets `aria-hidden="true"`; informative SVG gets a text label.
- Keyboard: slices, steps, and tabs work with Tab, Enter, Esc, and arrow keys; focus is visible (yellow ring).

## 8. Shot lists

Format: time in seconds from the trigger, element, from to to, easing. "Data" names the recorded fields (in `frontend/src/fixtures/recorded/{agent}.json`) that supply every string and number. If a field is missing, leave that element out and say so.

### S0: Page load (nav and hero text)
- 0.00 to 0.50 nav pill: translateY -12px to 0, opacity 0 to 1, `outExpo`.
- 0.10 to 0.45 nav marker: yellow bar under the active link, scaleX 0 to 1 from the left, `outExpo`.
- 0.15 to 0.85 H1: each line translateY 100% to 0 inside an overflow mask, stagger 0.09s, 0.7s each, `outExpo`.
- 0.45 to 1.00 sentence rises the same way; buttons scale 0.9 to 1 with `spring.ui`, stagger 0.08s.
- Still: the paper background and texture marks.
- Reduced motion: final state at t=0.

### S1: Hero object (five sheets)
- 0.30 to 1.10 five sheet outlines draw back to front (`pathLength` 0 to 1), 0.6s each, stagger 0.12s. Each sheet is offset 18px right and 22px down from the one behind it.
- 1.10 to 1.40 front sheet fills `--paper`; its yellow tab sweeps in (scaleX 0 to 1).
- 1.40 to 1.80 sheet labels 01 to 05 mask-reveal (mono). Three hairline bars on the front sheet draw (abstract, no invented text).
- 0.9 to 2.0 proof card slides in from the right (24px to 0, `outExpo`); its numbers count up over 1.1s from recorded values; tiles stagger 0.1s.
- 1.2 to 1.7 tech chips pop in with `spring.ui`, stagger 0.05s.
- **Idle (pointer only):** each sheet shifts with the pointer by up to 6, 10, 14, 18, 22px (back to front). Springs with `spring.ui`. Disabled on touch and under reduced motion.

### S2: Hero to deck (scroll, `pHero` 0 to 1)
- 0.00 to 0.50 the five sheets fan out (sheet i rotates about the bottom-left corner by i x 3 degrees and rises), while the title and proof card rise at 0.6x scroll speed (parallax). `inOutCubic`.
- 0.50 to 1.00 the sheets converge to the screen center and scale to the knowledge-base card size; they stack into one card (the front sheet becomes the card, the others slide behind it and end hidden). Nothing fades.
- 0.90 to 1.00 the card text "12 Competitors, 75 Fact Records" mask-reveals.
- Then the existing opening morph continues (knowledge-base card to five tabs to card 1).
- Reduced motion: no scrubbing; the hero scrolls normally and the knowledge-base card appears.

### S3: Deck tabs and active-card contour
- Tab hover (0.2s): yellow underline draws left to right.
- When a card becomes active (0.8s): dashed contour lines around the card trace in (`stroke-dashoffset`), brown, 1px, and stay.

### S4: Agent scene, PR & Policy (the pilot; deck preview at small size, agents section at large size)
SVG viewBox 640 x 400, scaled. Elements: three nodes (INPUT, POLICY CHECK gate, OUTPUT) joined by two paths; a small yellow packet.
Data: `input.signal` (the draft line), `flagged_phrase` (if present), `output.statement`, `output.key_phrase` (if present), `retrieved_facts[].organization`.
- 0.00 to 0.50 node outlines draw; mono labels mask-reveal.
- 0.50 to 1.30 the draft line mask-reveals inside INPUT.
- 1.30 to 2.10 packet travels INPUT to GATE along the path (`offsetDistance`, `inOutCubic`). At 2.10 the gate pulses once (ring 1 to 1.6 scale, stroke fades over 0.4s).
- 2.10 to 2.90 if `flagged_phrase` exists: four reticle corner paths draw around it, then a strike-through draws across it (0.35s).
- 2.90 to 3.70 packet travels GATE to OUTPUT.
- 3.70 to 5.00 `output.statement` types out in serif italic at about 40 characters per second with a caret; if `output.key_phrase` exists, a yellow marker sweeps behind it.
- 5.00 hold. "Replay" button (mono) bottom-right.
- Reduced motion: final frame.

### S5: The other four scenes (same component, same viewBox, same timing tokens)
- **Branding:** `input.directive` types into a node; chips for the organizations in `retrieved_facts` (at most 5) connect to it with drawn lines (stagger 0.15s); `output.statement` types out; yellow marker on `output.key_phrase`.
- **Social Community:** `input.signal` appears; terms that appear in both the signal and `output.statement` (computed by simple token overlap, no model) get yellow markers; each marked term travels along its own path into the output node as the statement types out.
- **Product Marketing:** up to 4 rows from `retrieved_facts` of class hardware fleet or pricing appear as a small table (row stagger 0.12s); a reticle locks onto the row whose organization is named in the output; `output.statement` types out.
- **Field Events:** `input.signal` appears; a path draws to the output node; `output.statement` types out with the yellow marker.

### S6: Agents section (five slices)
- Rest: five equal slices (flex 1), labels rotated.
- **Hover (0.45s `outExpo`):** the hovered slice grows to flex 1.6, the others shrink; label unrotates; yellow top edge draws (0.3s). On leave, revert after 0.15s.
- **Click (0.7s `inOutCubic`):** the slice grows to flex 5; the others become 56px strips with rotated labels. At 0.45s the six-station route draws across the expanded slice (`pathLength`, 0.9s) and the marker sits on station 1.
- **Next/Back and arrow keys:** the marker travels to the next station (0.6s `inOutCubic`); the station's data panel mask-reveals (0.4s). Stations and data: Input (`input`), Retrieve (`retrieved_facts`: organization, class, source domain), Model call (`model`, `latency_ms`, `prompt_tokens`, `completion_tokens`), Validate (schema result), Govern (`escalated`, `escalation_reason`), Output (`output`).
- **Close:** X, Esc, or clicking a strip. Plays in reverse; focus returns to the slice.
- Reduced motion: widths change instantly; the marker jumps.
- Mobile (below 768px): vertical accordion; the route stacks vertically.

### S7: Section effects
- Headings: lift 40px relative to the card while the section crosses the viewport; words rise from masks on entering (0.5s, stagger 0.05s).
- Margin numerals "02", "03", "04": outline only (1px `--brown` stroke, no fill), straddling the top-left corner of the card in the paper margin; drift at 0.2x, 0.35x, 0.5x scroll speed.
- Workflow tabs: new content enters with a horizontal mask wipe (0.4s `inOutCubic`); no crossfade.
- Benchmark bars: draw from 0 to their value on entering view (0.9s `outExpo`), numbers count up; the held-out bar starts 0.3s after the tuned bar.
- Dot-field: dots within 120px of the pointer brighten with a smooth falloff; throttled; off on touch.

### S8: Buttons
- Hover: yellow fill sweeps left to right (scaleX origin left, 0.25s `outExpo`); text stays ink.
- Press: scale 0.97 for 0.1s. Focus: 2px yellow ring offset 2px.

### S9: Launch Console transition
- Click: a yellow rectangle expands from the button's rectangle to cover the viewport (0.45s `inOutCubic`), holds 0.1s, the route changes to the login screen, and the shape contracts into the login card's rectangle (0.45s). Nothing fades.
- Reduced motion: instant route change.

## 9. Process: brief first, stills second, animation third

1. Write a **motion brief** of at most 12 lines: the story in three beats, the focal element, the exact SVG elements, the engine per element (no property controlled by two engines), timing per beat, the reduced-motion final frame, and which recorded fields supply every string. **Stop and wait for approval.**
2. Build the **static SVG** for frame 0 and the final frame using real recorded text. Show screenshots at 1366x768. Wait for approval.
3. Only then add the animation.
4. Build one agent first (PR & Policy), get it approved, then repeat for the others.
5. Report with screenshots at set moments (for scroll-driven scenes, at `p` = 0.1, 0.3, 0.5, 0.7, 0.9) and the Gate output.

## 10. Appendix: showing reference clips

Use this when the owner wants a specific effect copied in feel. Claude cannot watch video, but Gemini can, and frames work as images.

**Option A: Gemini watches it.** Attach the clip and paste:

```text
Watch this screen recording of a website interaction. Do not describe the visual style or colors. Describe ONLY the motion, as a timeline.
1. Trigger: what starts it (page load, scroll position, click, hover).
2. A table with columns: time in seconds, element (describe it plainly), what it does (moves, morphs, draws, reveals), from and to (position, size, shape), duration, and easing feel (snappy, floaty, springy, linear).
3. What stays still while other things move.
4. Whether the motion is tied to scroll position (scrubbed) or plays on its own.
5. Which technique could produce it: CSS, SVG path drawing, canvas particles, WebGL or 3D, pre-rendered video, Lottie or Rive, or a GSAP timeline.
6. Which parts look like a pre-rendered asset (a 3D render, a video, a particle simulation) and which look drawn in code.
Be specific with numbers, even if estimated.
```

**Option B: contact sheet.** Install ffmpeg once (`winget install ffmpeg`), then run:

```text
ffmpeg -i clip.mp4 -vf "fps=6,scale=360:-1,tile=6x5" sheet_%02d.jpg
```

Upload the sheet(s) with one line about the trigger. Name clips by where they would go (`01-hero-entrance.mp4`, `03-click-card-opens.mp4`).
````````

### Original: marketing-os-build-plan (1).md

````````markdown
# Marketing OS: Build Plan and Runbook

> **Status (Nov 2026), from the git log on branch `showcase-redesign`:** done = git baseline and Phase 1 deck layout (Oct 29), Phase 2 click-to-jump tabs (Oct 29), Phases 2b opening-morph fix, 2c smooth nav, and 3 two-panel cards (Oct 30), Phase 3a telemetry and its honest-metrics follow-up (Nov 4), and Render-readiness fixes (commit 17910f6, not yet pushed). Not done: model policy, quality and test tooling, recording day, palette swap, hero, agent scenes, agents section, copy edits, console restyle, Render deploy.

## 0. How to use this file

- This file is **yours**. Antigravity (Gemini) only reads `docs/DESIGN_AND_LAYOUT.md` and `docs/ANIMATION.md`, plus the prompt you paste for the current step.
- Do **one step at a time**, in order. Paste the step's prompt, review the result and the screenshots, then commit.
- Every UI prompt starts with this line (paste it each time):

```text
Read docs/DESIGN_AND_LAYOUT.md and docs/ANIMATION.md first and follow them. If this task conflicts with them, stop and ask me. Do not add dependencies that are not on the approved list. When done, run the Gate for this step and paste the full output. Do not say "done" without it.
```

- If a step fails, paste the failing output back to Antigravity. Do not re-paste the whole prompt.

## 1. Done so far

| Step | Commit | Date |
|---|---|---|
| Git baseline, branch `showcase-redesign` | 4dcb27b | Oct 29 |
| Phase 1: deck layout, centering, opaque ink-dimmed cards | 12ebabd | Oct 29 |
| Phase 2: deck timeline constants, shared Lenis, peeking tabs | 4f1c170 | Oct 29 |
| Phase 2b: opening morph without layer overlap | 7d32054 | Oct 30 |
| Phase 2c: smooth nav scrolling, active section | b986616 | Oct 30 |
| Phase 3: two-panel cards, Launch Console on card 5 only | c2746d0 | Oct 30 |
| Phase 3a: real telemetry, citations, migration | ee2af8c | Nov 4 |
| Phase 3a follow-up: honest latency, attempts, fallback flag | df6aa93 | Nov 4 |
| Render readiness: Dockerfile fix, gunicorn, pinned deps, seed on startup, render.yaml, .env.example | 17910f6 | after Nov 4 (push it) |

Current numbers to beat: **264 pytest tests passing** (217 unit, 47 integration), `oxlint` **0 errors and 31 warnings**, **0 frontend tests**, no CI, no Python lint config.

## 2. The runbook: what to paste, in order

| Step | What | Paste from | Docs for Gemini to read | Gate | You provide |
|---|---|---|---|---|---|
| S1 | Put the docs in the repo | section 5 (S1) | none | G0 | the files, the palette image |
| S2 | Model policy and honest labels | S2 | none | G-B + G-L | a day with free quota |
| S3 | Backend quality tooling and the one-command check | S3 | none | G-B | |
| S4 | Frontend test tooling | S4 | none | G-B + G-F | |
| S5 | CI on GitHub | S5 | none | G-CI | the GitHub repo |
| S6 | Recording day: real runs for the five agents | S6 | none | G-L | a fresh-quota day |
| S7 | Palette swap | S7 | both docs | G-F + G-E | |
| S8 | Hero, static | S8 | both docs | G-F + G-E | |
| S9 | Hero animation | S9 | both docs | G-F + G-E | approval of the motion brief |
| S10 | Hero to deck transition | S10 | both docs | G-F + G-E | approval of the brief |
| S11 | Agent scene: PR & Policy pilot | S11 | both docs | G-F + G-E + G-L | approval of brief and stills |
| S12 | The other four scenes | S12 | both docs | G-F + G-E + G-L | |
| S13 | Agents section (five slices) | S13 | both docs | G-F + G-E | |
| S14 | Held-out retrieval benchmark | S14 | none | G-B + G-L | 12 to 15 new queries |
| S15 | Copy edits, tech strip, known limits | S15 | both docs | G-F + G-E | |
| S16 | Section effects and buttons | S16 | both docs | G-F + G-E | |
| S17 | Console restyle and Launch Console transition | S17 | both docs | G-F + G-E | |
| S18 | Responsive, accessibility, performance | S18 | both docs | G-ALL | |
| S19 | Render deploy (and optional static landing) | S19 | none | G-D | Render dashboard work |
| S20 | Final: README, demo video, release | S20 | none | G-ALL + G-D | the screen recording |

## 3. Gates: the checks after every step

**Rule: "done" means the Gate command ran and you can see its output.** The agent pastes the exit code and the last lines of each command. If any command fails, the step is not done.

Until S3 creates `scripts/check.py`, run the commands by hand. After S3, one command runs everything: `python scripts/check.py` (flags: `--backend`, `--frontend`, `--e2e`, `--deployed URL`).

| Gate | What it runs | Pass condition |
|---|---|---|
| **G0** (every step) | `git status` clean after the commit; secret scan; list of changed files | no `.env` or `.db` tracked; no secrets; changed files match the step's scope |
| **G-B** backend | `ruff check`, `ruff format --check`, `pytest -q --cov=app`, `pip-audit` | all green; test count not lower than before; coverage not lower than the baseline; new code has new tests (unit, plus an integration test if an endpoint changed); audit findings reported |
| **G-F** frontend | `npm run lint` (oxlint), `npm run build`, `npm test` (Vitest) | 0 lint errors and warnings not above 31; build succeeds; unit tests pass; no bundle chunk grows by more than 10% without a reason |
| **G-E** end-to-end | `npm run test:e2e` (Playwright at 1366x768 and 1920x1080) | page loads with no console errors; nav and tab clicks land correctly; deck state screenshots match; reduced-motion test passes; axe finds 0 serious or critical issues |
| **G-L** LLM and data | mock tests on every run; `python scripts/validate_recorded.py` for recorded runs; retrieval eval regression | see "Testing the agents" below |
| **G-CI** | the GitHub Actions workflow | green on the pushed branch |
| **G-D** deployed | `python scripts/smoke_deployed.py URL` | health 200, database connected and seeded, landing page loads, console requires login, session cookie is Secure |
| **G-ALL** | G-B, G-F, G-E, G-L, and Lighthouse on the landing page (desktop) | all of the above; performance 80 or more, accessibility 95 or more |

**Testing the agents (three tiers)**
1. **Mock, every run:** the existing pytest suite uses the mock model. It must stay green.
2. **Replay, every run:** tests load the recorded JSON files from S6 and check them (schema, citations, numbers). The frontend adapters are unit-tested against the same files.
3. **Live, rarely:** only on a recording day, at most about 10 calls, run by hand. Never in CI.

**Agent rules (apply to every step)**
- Report: the files changed, the Gate output, screenshots, and anything skipped.
- Approved new dependencies only: `gsap`, `@gsap/react`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@playwright/test`, `@axe-core/playwright`, and dev tools `ruff`, `pytest-cov`, `pip-audit`, `pre-commit`, `detect-secrets`. Anything else needs approval.
- No changes outside the step's scope. If something else looks broken, report it and do not fix it.
- Commit message format: `Step Sx: short description`.

## 4. The test types, in plain words

- **Unit test:** checks one small piece alone (a function, a data adapter, a timeline calculation).
- **Integration test:** checks pieces working together (an API endpoint with its database; the frontend reading a recorded file).
- **End-to-end (E2E) test:** a real browser opens the site and does what a visitor does.
- **Visual test:** screenshots at fixed scroll positions compared to a saved baseline.
- **Accessibility test (axe):** automatic check for missing labels, low contrast, and keyboard problems.
- **Smoke test:** a quick "is it alive" check, used on the deployed site.

## 5. The steps

### S1: Put the docs in the repo (you, then a commit)
1. Create `docs/` and `docs/reference/` in the project. Copy `DESIGN_AND_LAYOUT.md` and `ANIMATION.md` into `docs/`. Save the palette image as `docs/reference/palette.jpeg`.
2. Delete the old `DESIGN_LOCK.md` from the repo root.
3. Commit and push:

```text
git add docs
git commit -m "Step S1: add design and animation docs"
git push origin showcase-redesign
```

**Gate G0:** `git status` is clean; `git ls-files | findstr /i ".env .db"` shows only `.env.example`.

### S2: Model policy and honest labels
```text
Model policy changes in app/services/llm_service.py and anywhere reasoning_source is built. Do not touch the frontend.
1. Remove the gemini-3.5-flash fallback entirely. We never use gemini-3.5-flash or gemini-3.6-flash.
2. Primary model: gemini-3.8-flash. Optional fallback: gemini-3.7-flash, ONLY if it appears as its own model in our API's models list. Call the models list endpoint and show me the result. If 3.7 is not listed, or Google routes it to 3.8, there is no fallback. Make the fallback configurable with ALLOW_MODEL_FALLBACK, default false. It must be false for the recording script.
3. On 503 or a timeout, retry the primary with backoff (max 3 attempts, waits of 2s then 4s) and a 30s socket timeout. Only then, if ALLOW_MODEL_FALLBACK is true, try the allowed fallback once. If everything fails, raise a clear error. In live mode never fall back to the mock silently.
4. On HTTP 429 with a daily-quota message, do not retry. Raise an error saying the daily quota is exhausted and when it resets.
5. reasoning_source must contain the SERVED model, not the requested one. Fix it everywhere it is built.
6. Store finish_reason with every call. Treat MAX_TOKENS as a failure that raises an error, not a reason to fall back to the schema fallback.
7. Use the Gemini 3.x thinking setting (thinking_level, LOW if supported) instead of thinking_budget, keep maxOutputTokens high enough that JSON is never truncated, and record thoughts_tokens. Gemini 3.x ignores temperature, top_p, and top_k.
8. Add unit tests for each change (429 is not retried; reasoning_source uses the served model; MAX_TOKENS raises; fallback off by default). Keep all existing tests passing.
Then make one live call requesting gemini-3.8-flash and show the metrics, finish_reason, served model, and reasoning_source. If the daily quota is exhausted, show the error message instead.
```
**Gate G-B + G-L (by hand):** `pytest -q` passes with more than 264 tests; `npm run lint` and `npm run build` pass. **Done when:** a live call is served by gemini-3.8-flash with attempts = 1 and finish_reason = STOP, or a clear quota error appears and nothing else is used.

### S3: Backend quality tooling and the one-command check
```text
Add backend quality tooling. No behavior changes.
1. pyproject.toml with a ruff config (rules E, F, I only). Run `ruff check --fix` and `ruff format` once and commit that formatting change SEPARATELY, so the diff is reviewable. Report the number of files touched.
2. pytest-cov configured in pyproject.toml. Show the current coverage and set --cov-fail-under to that number minus 1.
3. .pre-commit-config.yaml with ruff, ruff-format, and detect-secrets (create a baseline). Install the hook.
4. requirements-dev.txt with pinned ruff, pytest-cov, pip-audit, pre-commit, detect-secrets. Run pip-audit and report findings; do not upgrade anything automatically.
5. scripts/check.py: one command that runs, in order: ruff check, ruff format --check, pytest -q with coverage, then in frontend/ npm run lint and npm run build, and scripts/validate_recorded.py if it exists. It prints a PASS or FAIL line for each with the exit code and the last 3 lines of its output, and exits non-zero if anything fails. Support flags --backend, --frontend, --e2e (runs npm run test:e2e if present), and --deployed URL (runs scripts/smoke_deployed.py if present).
6. Run `python scripts/check.py` and paste the full output.
Commit as "Step S3: quality tooling".
```
**Gate G-B.** **Done when:** `python scripts/check.py` ends with all PASS.

### S4: Frontend test tooling
```text
Add frontend test tooling. Do not change the UI.
1. Vitest with @testing-library/react and jest-dom (jsdom). Add `npm test`. Write unit tests for: the deckTimeline math (arrival points, clamping), the nav scroll duration function, and the hash update helper.
2. Playwright (@playwright/test) with two projects, 1366x768 and 1920x1080, and a reduced-motion variant. Add `npm run test:e2e`. When MODE=test, expose window.__lenis so tests can jump to exact scroll positions.
3. E2E specs: (a) smoke: the page loads with no console errors and no failed requests; (b) nav: each nav link changes the hash and scrolls; (c) deck: clicking each tab lands on the right card, at most 3 cards peek behind the front card, every card has opacity 1, hidden elements are visibility hidden; (d) screenshots at deck scroll progress 0, 0.15, 0.32, 0.49, 0.66, 0.83, 1.0 (compare with baseline, 0.2% tolerance; create the baselines now); (e) reduced motion: with prefers-reduced-motion the deck shows final states and no running animations.
4. @axe-core/playwright: scan / and the login page; fail on serious or critical issues. Report the current findings first and tell me which are already present, so we do not hide them.
5. Update scripts/check.py so --e2e runs npm test and npm run test:e2e.
6. Run `python scripts/check.py --backend --frontend --e2e` and paste the full output.
Commit as "Step S4: frontend tests".
```
**Gate G-B + G-F + G-E.** **Done when:** the full command passes and baselines are committed.

### S5: CI on GitHub
```text
Add .github/workflows/ci.yml for pushes and pull requests to showcase-redesign.
- Job backend: Python 3.11, pip install -r requirements.txt -r requirements-dev.txt, ruff check, ruff format --check, pytest -q --cov. Do not set GEMINI_API_KEY (mock mode).
- Job frontend: Node 22, npm ci in frontend/, npm run lint, npm run build, npm test.
- Job e2e: npx playwright install --with-deps chromium, then npm run test:e2e; upload the Playwright report as an artifact on failure.
- Cache pip and npm. No secrets in the workflow.
Push and show me the workflow run result.
```
**Gate G-CI.** **Done when:** all three jobs are green on GitHub.

### S6: Recording day (real runs, five agents)
Do this on a day with fresh API quota (the free tier allowed 20 requests per day for gemini-3.8-flash). Do not test anything else on that day. A 429 means stop, not retry.
```text
Step 1, one live check call: run a single live call for the branding agent requesting gemini-3.8-flash. Show the metrics, finish_reason, and served model. If the served model is not gemini-3.8-flash, STOP and tell me.
Step 2, only if step 1 passed: create scripts/record_showcase.py that records one genuine run per specialist agent (branding, pr, social, product_marketing, events) with the Vanguard Cloud scenario goal and the simulated market signal already used in the fixture. Use ALLOW_MODEL_FALLBACK=false. Save one JSON file per agent to frontend/src/fixtures/recorded/{agent}.json containing: input (goal and signal, with "simulated": true), the model's exact untouched output, recorded_at (UTC), requested_model, served model, fallback_used, attempts, latency_ms, total_wall_ms, retrieval_ms, prompt_tokens, completion_tokens, thoughts_tokens, finish_reason, and the retrieved facts (id, organization, class, text, source_url) plus evidence_ids if present. The script aborts if any response has source != "live", fallback_used is true, or finish_reason is not STOP. Never retry on a 429. Never hand-edit these files; if an output is poor, change the input and re-run.
Step 3: create scripts/validate_recorded.py asserting for every file: source == "live", model == requested_model, fallback_used == false, latency_ms > 0, total_wall_ms >= latency_ms, prompt_tokens > 0, completion_tokens > 0, finish_reason == "STOP", facts_retrieved >= 1, every evidence_id is among the retrieved ids, the output fields are non-empty, recorded_at parses as a timestamp. Add pytest tests that run this validation on the committed files (replay tier).
Step 4: make the frontend read these files instead of caseStudyFixtures.js (same layout, no visual change), and add Vitest tests that the adapters handle a missing optional field.
Run the full check and paste the output. Commit as "Step S6: recorded runs".
```
**Gate G-B + G-L.** **Done when:** five valid JSON files are committed, the validator passes, and the page no longer imports `caseStudyFixtures.js`.

### S7: Palette swap
```text
Apply the new palette. Frontend only; no animation yet.
1. Define CSS variables with these exact values and do not change them: --ink #050d09, --yellow #e7d78a, --paper #e1e1d8, --peach #e4c185, --brown #4e4739. There is no stone gray and no pure white: cards use --paper.
2. Roles: ink = text, primary buttons, hairlines. yellow = the single accent (active tab and nav marker, highlight marker behind a key word, key data, focus ring, primary button fill). peach = secondary tint (hover, chart fills, connector accents). brown = secondary text, muted labels, the dim overlay on stacked cards. paper = page background and card surfaces, separated by a 1px ink hairline.
3. Replace the old blue accent everywhere and remove the green status color; a pass state becomes an ink check icon on a yellow chip. Remove terracotta #D97757 and any gradient on the login screen.
4. Text on yellow or peach is always ink. Show me a table of every text and background pair you used with its contrast ratio (all must be 4.5:1 or better).
5. Add the static texture vocabulary from the design doc (crosshair marks, dashed contour lines, a dotted halftone field, subtle static grain on the page background only). Static only.
6. Update the Playwright screenshot baselines and say which screenshots changed.
Run the full check and paste the output. Commit as "Step S7: palette".
```
**Done when:** a search finds no blue or green hex values, the contrast table passes, and the new baselines are reviewed by you.

### S8: Hero, static
```text
Build the hero per docs/DESIGN_AND_LAYOUT.md section 8. Static only, no animation.
1. Asymmetric layout: title left (3 lines max), hero object center (five flat layered SVG sheets with depth, labelled 01 to 05, front sheet with a yellow tab), proof card right with a Launch Console button, tech strip at the bottom, and the demo-case-study line. Omit the demo thumbnail until a demo video exists.
2. Remove the old hero cards and callout box. Use the approved copy exactly.
3. Proof numbers must not be typed by hand: create scripts/gen_proof.py that computes the knowledge_units count and the number with a non-empty source_url from the database, and the pytest test count from `pytest --collect-only -q`, and writes frontend/src/generated/proof.json. The proof card reads that file. Add a test that fails if the file is stale.
4. The tech strip reads real package names; the model chip reads the model string from the recorded JSON.
5. The hero is one viewport tall minus the header.
Show screenshots at 1366x768 and 1920x1080. Run the full check and paste the output. Commit as "Step S8: hero static".
```
**Done when:** the 5-second test passes (a stranger can say what it is and what to click).

### S9: Hero animation
```text
Read docs/ANIMATION.md. Do not write code yet. Write a motion brief of at most 12 lines for shots S0 and S1 (page load and the hero object): the story in three beats, the focal element, exact SVG elements, engine per element, timing per beat, the reduced-motion final frame, and which fields supply every number. Stop and wait for my approval.
After I approve, build it, including the pointer parallax and the proof-card counters, with all timing as named constants. Show screenshots at t = 0.3s, 0.8s, 1.4s, and 2.0s. Run the full check and paste the output. Commit as "Step S9: hero animation".
```
**Done when:** you approve the brief, the animation matches it, and reduced motion shows the final state.

### S10: Hero to deck transition
```text
Read docs/ANIMATION.md. Do not write code yet. Write a motion brief of at most 12 lines for shot S2 (hero to deck): the sheets fan out and converge into the knowledge-base card, nothing fades. Stop and wait for my approval.
After I approve, build it driven by scroll progress pHero, joined to the existing opening morph. Show screenshots at pHero = 0, 0.25, 0.5, 0.75, 1.0, and the first frame of the existing morph. Add a Playwright test that scrolls to those positions and compares screenshots. Run the full check and paste the output. Commit as "Step S10: hero to deck".
```
**Done when:** the whole scroll from hero to card 1 is continuous, and scrolling back up reverses it.

### S11: Agent scene, PR & Policy (pilot)
```text
Read docs/ANIMATION.md shots S3 and S4. Do not write code yet.
Part 1: write a motion brief (max 12 lines) for the PR & Policy scene and stop for my approval.
Part 2, after approval: build ONLY the static SVG for frame 0 and the final frame, using the recorded pr.json, as a reusable <AgentScene agentId size="small|large"> component with a data adapter. Show screenshots and wait for my approval.
Part 3, after approval: add the animation (GSAP timeline with labels, all timing constants at the top of the file), the Replay button, and the active-card contour trace. It plays once when the card becomes active and holds the final frame.
Add Vitest tests for the adapter (missing optional fields skip their elements) and a Playwright test that the final frame is reached and that reduced motion shows it immediately. Run the full check and paste the output. Commit as "Step S11: PR scene".
```
**Done when:** you approve the brief, the stills, and the animation, and every string is traceable to `pr.json`.

### S12: The other four scenes
```text
Using the same component, build the Branding, Social Community, Product Marketing, and Field Events scenes per docs/ANIMATION.md shot S5. For each: first a short motion brief and static frames for my approval, then the animation. Every string and number comes from that agent's recorded JSON; if a field is missing, leave that element out and tell me. Add adapter tests for each. Run the full check and paste the output. Commit each scene separately as "Step S12: <agent> scene".
```

### S13: Agents section (five slices)
```text
Build the agents section per docs/DESIGN_AND_LAYOUT.md section 9 and docs/ANIMATION.md shot S6. Do it in three commits, showing me screenshots after each:
1. Static: five slices at rest, with the intro line.
2. Hover: widening, yellow top edge, keyboard roving focus.
3. Click: expansion, the six-station route, the marker, Next/Back and arrow keys, Esc/X/strip to close with focus returning to the slice, and the vertical accordion below 768px. Use the same AgentScene component at large size and only recorded values.
Add Playwright tests: hover widens the slice (compare bounding boxes), click expands, arrow keys move the marker, Esc closes and focus returns, and axe finds no serious issues. Add the "Open in agents section" link on each deck card. Run the full check and paste the output.
```
**Done when:** every station shows only recorded values, and the whole section works by keyboard.

### S14: Held-out retrieval benchmark (your task, about an hour)
1. Write 12 to 15 NEW paraphrase queries yourself, without opening `_TAXONOMY_EXPANSIONS` (a friend writing them is even better; do not ask Gemini, it has seen the map). Mark which fact records should be retrieved.
2. Paste:
```text
Add the new queries to app/eval/gold.py with split="heldout". Do NOT modify _TAXONOMY_EXPANSIONS. Report mean recall@5 for plain BM25 and for BM25 + expansion on: (a) the 12 tuned paraphrase queries, (b) the held-out queries, (c) the 22 lexical queries. State exactly how recall is computed. Add a pytest test that fails if the tuned-set or lexical recall drops below the current value (a regression test).
```
3. Use whatever numbers come out. If you change the synonym map afterwards, it is no longer held-out; say so. A modest honest number is better than a perfect one.

**Gate G-B + G-L.**

### S15: Copy edits, tech strip, known limits
```text
Apply every row of the "Approved replacements" table in docs/DESIGN_AND_LAYOUT.md section 11, the tech strip, and the Known limits box. Change nothing else. Bracketed values come from recorded files or the eval report; if one does not exist, stop and tell me.
Add a Vitest test that scans frontend/src for the banned words in section 11 ("live", "unedited", "production", "verified", "cryptographic", "weekly", "consensus", "provenance verification", "zero hallucination", "isolated", "FastAPI", "gemini-3.5", "gemini-3.6") and fails on any hit that is not on an explicit allowlist with a reason. Run the full check and paste the output. Commit as "Step S15: copy".
```

### S16: Section effects and buttons
```text
Read docs/ANIMATION.md shots S3, S7, and S8. Write a short motion brief and wait for my approval, then build: heading lift and word rises, outline numerals in the paper margin (1px --brown stroke, no fill), workflow-tab mask wipe, benchmark bars, the dot-field, and button hover and press. All timing as named constants; reduced motion shows final states. Run the full check and paste the output. Commit as "Step S16: section effects".
```

### S17: Console restyle and the Launch Console transition
```text
1. Restyle the logged-in /console workbench and the login screen to docs/DESIGN_AND_LAYOUT.md section 12. Styling only; do not change functionality. Remove terracotta, the login gradient, and the Three.js shader background, and remove the three dependency if nothing else uses it. Report the bundle size before and after.
2. Build shot S9, the Launch Console transition, per docs/ANIMATION.md.
3. Add a Playwright test for the whole flow with the mock model: login (credentials from test env vars), run one specialist, see a result.
Run the full check and paste the output. Commit as "Step S17: console".
```
**Done when:** no orange or gradient remains, the 1.1 MB shader chunk is gone, and the flow test passes.

### S18: Responsive, accessibility, performance
```text
1. Below 768px: no pinning and no hero scrubbing; the deck becomes a vertical stack with each scene under its text, playing when it enters the viewport; the agents section is a vertical accordion.
2. Check 1280x720, 1366x768, 1440x900, and 1920x1080 and 360, 390, 768 wide. No horizontal scroll, no card needing internal scrolling.
3. Reduced motion: no Lenis smoothing, no parallax, final frames everywhere.
4. Run axe on every page and Lighthouse (desktop) on the landing page; report scores. Targets: performance 80 or more, accessibility 95 or more. Fix what fails and list what you could not fix.
Run the full check with --e2e and paste the output. Commit as "Step S18: responsive and a11y".
```

### S19: Render deploy (and optional static landing)
The Render service **Marketing-OS** (Docker, Oregon) already exists. Steps:
1. `git push origin showcase-redesign` (the Render-readiness commit must be pushed).
2. In Render, open **Marketing-OS**, then **Settings**: Branch = `showcase-redesign`, Health Check Path = `/api/health`.
3. Under **Environment** set: `ADMIN_USER` (your choice), `ADMIN_PASSWORD` (strong, not `marketing2026`), `SESSION_SECRET_KEY` (from `python -c "import secrets; print(secrets.token_hex(32))"`), `TRUSTED_PROXIES` = `10.0.0.0/8,127.0.0.1`, `TRUST_FORWARDED_FOR` = `true`, `ENVIRONMENT` = `production`, `SESSION_COOKIE_SECURE` = `true`. Leave `GEMINI_API_KEY` empty (mock mode).
4. Click **Manual Deploy**, then **Deploy latest commit**. The first start takes a minute or more. If it fails, paste the last lines of the build or deploy log.
5. Then paste to Antigravity:
```text
Create scripts/smoke_deployed.py URL. It retries for up to 90 seconds (cold start) and asserts: GET /api/health returns 200 with status healthy and the database connected; the facts are seeded (75 knowledge units visible through an existing read endpoint, or add a minimal one); the landing page returns 200 and contains the app root; /console and the API require login; the session cookie from a login has the Secure and HttpOnly flags; no response exposes env vars or secrets. Wire it to `scripts/check.py --deployed URL`. Run it against my Render URL and paste the output.
```
**Gate G-D.** Free-plan facts: the service sleeps after 15 minutes idle and takes about a minute to wake; the database is wiped on every restart and re-seeded at startup; decisions made in the console disappear. If cold starts hurt the first impression, deploy the landing page as a static site (Cloudflare Pages, Vercel, or Netlify; build command `npm run build` in `frontend/`, output `dist`) and link "Launch Console" to the Render URL.

**Adding the Gemini key later:** only after S2 passes, set `GEMINI_API_KEY` and `DEFAULT_MODEL=gemini-3.8-flash` in Render. The app rate-limits visitors (10 AI actions per day per session, 50 per IP), but the free-tier daily quota is still small, so keep the key off unless you are demoing live.

### S20: Final
1. Write the README (what it is, a screenshot, how to run, how to test, limits). Plain words.
2. Record a 60 to 90 second screen recording of the site and console. Add the demo thumbnail to the hero.
3. Run everything: `python scripts/check.py --backend --frontend --e2e --deployed URL`, plus Lighthouse. Save the output.
4. Tag a release: `git tag v1.0` and push.
5. Put the live URL, GitHub link, and demo video at the top of the resume entry.

## 6. If something goes wrong

| Symptom | What to do |
|---|---|
| A step's Gate fails | Paste the failing output to Antigravity and ask it to fix only that |
| The agent says "done" with no Gate output | Reply: "Run the Gate and paste the full output." |
| The animation looks different from what you imagined | Reply with timings and numbers ("beat 2 should start at 1.0s and last 0.8s"), not adjectives; or use the reference-clip appendix in `docs/ANIMATION.md` |
| The agent added a dependency or changed files outside the step | Ask it to revert them and report |
| Render build fails | Paste the last 30 lines of the deploy log |
| Gemini quota error (429) | Stop. Quota resets daily. Never retry in a loop. |
````````
