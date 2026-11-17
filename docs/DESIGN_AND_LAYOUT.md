# Marketing OS — design and layout

Updated: 17 November 2026 (Asia/Calcutta).
Status: current editable design specification. Confirmed decisions are separated from research candidates.

Read with [the blueprint](MARKETING_OS_BLUEPRINT_PLAN.md) and [animation specification](ANIMATION.md). The owner's latest instructions govern. Historical Claude originals remain unchanged in section 16 of [the working record](FRONTEND_DESIGN_WORKING.md).

**Phase correspondence rule:** this file supplies requirements for the blueprint's single F00–F14 roadmap; its 16 sections are not a second phase sequence. Before any phase/change and before phase closure, consult the blueprint's [architecture and phase correspondence map](MARKETING_OS_BLUEPRINT_PLAN.md#10-architecture-and-phase-correspondence-map) and [required execution checklist](MARKETING_OS_BLUEPRINT_PLAN.md#11-required-phase-execution-checklist). Review this file's mapped sections, U01–U20/S01–S19 and UX criteria; record evidence or a reasoned N/A. Ask the owner about unresolved dependent choices using the blueprint's [decision register](MARKETING_OS_BLUEPRINT_PLAN.md#12-owner-decision-register-and-questions). Do not advance on an unverified visual or functional acceptance item.

## 1. Vision and confirmed decisions

Marketing OS is an interactive portfolio case study with a real product underneath it. A casual visitor should understand what useful work the agents help with. An engineer should be able to inspect the actual system and its limits.

Confirmed by the owner:

- Keep the paper/dossier concept.
- Let visitors click an agent to play a distinctive miniature physical 3D machine or scene explaining its work.
- Let visitors compare agents on the website before choosing one to explore. This is a visitor feature.
- Compare two agents side by side, then open one shared animation stage; all five roles remain discoverable (owner confirmed 15 November).
- Use genuine saved model responses for public examples and controlled/mock responses for routine tests (owner confirmed 15 November). Provider/credential availability must be verified before capture.
- Begin with PR & Policy's risk-checkpoint/human-review scene as the first pilot (owner confirmed 15 November).
- Keep the light paper page and compare subtle graphite speckling with the plain base (owner confirmed 15 November).
- Use a guided camera to explain the miniature machine's story. Exact machine materials/modelling need concrete references/stills; visitor-controlled rotation is not approved (owner clarified 15 November).
- Preserve the stacked-card idea while reviewing a shorter scroll and simpler opening (owner confirmed 15 November).
- Use the supplied wireframe 3's centred arrival, developing toward wireframe 1's central agent stage and adjacent explanation/result; primary “Explore the agents” CTA and quieter “Open console” action (owner agreed 17 November). Exact storyboard, copy, typography and geometry remain for review.
- Research backgrounds and design trends as separate shortlists, then narrow them.
- Maintain three current working documents and build through tested phases.

Still open: precise machine materials/modelling, guided camera framing, detailed responsive comparison layout, exact simpler-opening/shorter-stack geometry and final texture/dithering/loader treatments. The overall direction, two-agent/shared-stage comparison, genuine public recordings and PR-first pilot are settled; see Q01–Q06 in the blueprint for the owner's answers and remaining review checkpoints.

Owner feedback, 15 November: **speckled graphite is liked as a background candidate; dithering and pixel loaders are liked as trend candidates**. Exact brightness, intensity, scale, and placement are not yet selected. The owner noted that graphite speckling and dithering can look similar and that the current background is already cream-like. Text wrapping and process diagrams are implementation/explanation techniques, not extra visual styles the owner must research. This update supersedes the earlier research priority order below.

Follow-up on 15 November: **dithered images are also liked; Renaissance branding is explicitly rejected** because it does not fit the owner's existing design choices and project direction. Other follow-up suggestions received no positive selection. Do not interpret the earlier assistant recommendation as an adopted style.

The five colours below remain the existing owner reference recorded by Claude. No new palette has been approved in this discussion. Scene examples and the page order below are proposals for review, not commitments to build every device.

## 2. What exists and what needs to change

Anti Gravity established the scrollable deck, opaque stacked cards, tab jumps, navigation, opening morph, and two-panel layout. The five miniature scenes and new complete design system have not been built. The scene panels are empty; existing hard-coded telemetry is not a genuine recorded-response trail.

F01's functional baseline passed at application revision `d6c9973`: original saved results, server-owned reviews, stale-request isolation, all five selectable specialists, actual execution mode and useful error states, development/built API integration, mobile navigation, native readable dossiers and reduced-motion support. See the blueprint's [F01 completion record](MARKETING_OS_BLUEPRINT_PLAN.md#13-f01-completion-record) for all six gate lanes, exact tests and scoped checklist findings. These repairs do not apply the final palette/graphite/dither style or complete the visual overhaul. The master design checkboxes below remain open for their full intended scope.

F02's data/capture foundation passes at `0dc18d6`: normalized workflow/history/scene data, five genuine `gemini-3.5-flash-lite` recordings and an optional plain inspector. Original responses and same-request source rows are separate; checksums, model/citation attribution and read-only selection are verified. Existing hand-written examples stay explicitly illustrative. At that revision, the inspector marked unsupported competitor hardware-limit claims as unverified; genuine model output is not a verified competitive assessment. Blueprint section 15 records the historical gate and limits.

Subsequent owner-approved presentation direction supersedes that inspector's public capture metadata and operational explanations. F03 now implements a candidate at `/preview/f03`, technically verified through `9f0a3e7`: the exact five-colour foundation, existing sans typography, role/brief/useful result, optional sources/rationale, separate “How it’s built” and working console entry. It uses a separate genuinely recaptured catalog after bounded source/prompt correction; original F02 recordings remain unchanged. Known weak competitor-absence, SKU-price and availability implications were addressed internally, rather than covered by public disclaimers. Blueprint section 17 records the provenance, tests and limits.

F03 remains OPEN. On 17 November the owner rejected the MP4 study's book/library/children's-book appearance and said it does not match the animation reference or feel like a tech product. The literal paper-cover treatment is not an accepted baseline. Typography and padding are possible contributors raised by the owner, not confirmed causes or approval of a new font. Preserve the approved palette and dossier organisational concept unless separately changed; neither requires a literal book aesthetic. The review-only toolbar is not final product UI. The inherited homepage remains during review, so its inspector has not yet been replaced. A revised concrete visual direction, owner acceptance, deliberate promotion and affected rechecks are still required; no finished comparison or miniature machine is claimed.

The owner subsequently agreed to the hero/CTA direction below on 17 November.
Revise F03's visual portion; keep completed F01/F02 functionality and useful F03
grounding/capture/integration changes. This documentation records direction, not
approval of an unseen replacement. Blueprint §18 records the revision sequence.

Do not interpret backend test results as proof of a finished browser product. Do not spend a redesign phase making a nonfunctional control more attractive.

## 3. Two audiences, one understandable journey

17 November direction: the entire landing page should unfold as a connected
scroll story, beginning calmly, responding subtly to the first small scroll and
revealing the larger composition after further travel. The dossiers belong to
that same visual world. F03 first provides a reviewable static foundation and
an isolated motion study with simple temporary visuals. Exact scroll distances,
inner scene behaviour, materials and final composition are not approved merely
by this direction; compare actual movement with the owner before committing.

| Layer | Visitor question | Content |
|---|---|---|
| First view | What is this, and why explore it? | A clear business problem, five specialist roles, one prominent next action |
| Agent discovery/comparison | Which agent fits my task? | Purpose, suitable task, evidence available, sample result |
| Miniature scene and result | What does that agent actually do? | A short brief, physical explanation, useful result and relevant business risk/review state; readable without watching playback |
| Optional supporting detail | What supports this recommendation? | Sources and the model's written rationale, available on demand |
| Separate “How it’s built” section | How did you engineer it? | Architecture, agent roles/routing, retrieval, schema, memory, governance and persistence, supported by actual implementation evidence |
| Working console | Can I try the actual system? | Truthful mock/live mode, authentication, usable workflows, source and review state |

A visitor should not need to read a paragraph of infrastructure terminology before understanding the product. Technical terms remain available where they answer a real question.

### Approved agent presentation

Owner confirmed this direction on 16 November after reviewing developer examples:

1. One plain sentence explaining the agent's job and business value.
2. A short, relatable example brief.
3. The planned miniature machine explaining supported behaviour.
4. A useful result shaped for the agent's actual job; give it enough space and keep it accessible without animation.
5. Optional sources and written rationale. Put the broader engineering explanation in its own “How it’s built” section.

Use natural labels such as “The brief” and “Recommendation” where helpful; do not
add a stack of redundant labels or force a chat transcript for every agent. Show
real role differences through the output, using only deliverables the backend
actually produces. PR's supported risk flag and review route do not establish an
automatically rewritten or legally cleared draft. Exact copy/layout remains for
phase review rather than being inferred from this structure.

Keep capture/test timestamps, quota explanations and debugging/operational notes
out of the public product presentation. Retain them in verification records. A
concise “Example” label can identify a saved response; do not imply that opening
or playing it runs a model. Fix known weak claims/source quality internally before
promoting an example as finished. Do not merely remove a caveat while retaining a
known misleading assertion. Preserve original recordings and genuinely capture a
corrected response when necessary. The console still needs truthful, useful
loading/error and review states for actions a visitor actually takes.

## 4. Visual identity and reference palette

The current direction combines a calm paper dossier outside with a miniature physical world inside selected agents. Keep the product's documents, sources, decisions, and review mechanisms visually related.

| Token | Exact reference value | Role |
|---|---|---|
| `--ink` | `#050d09` | Primary text, structural lines, dark controls |
| `--paper` | `#e1e1d8` | Page and card surfaces |
| `--yellow` | `#e7d78a` | Primary action, active/selected state, important highlight |
| `--peach` | `#e4c185` | Restrained secondary tint |
| `--brown` | `#4e4739` | Secondary text and supporting details |

- Preserve the exact values while researching. Do not add agent-specific colours or quietly substitute old blue/green/terracotta tokens.
- Use ink text on yellow/peach. Verify actual contrast after the final composition, textures, and state treatments are applied. Accent hue alone does not indicate selection, risk, or success.
- Pure white/black additions, new surface colours, or a different palette are changes to discuss, not implied by a reference image.
- The old “five pixel colours only” interpretation cannot literally describe physically shaded 3D rendering. UI tokens remain exact; material lighting/shadows are a separate art-direction question for F00/F05. Do not invent new semantic UI colours under the name of lighting.
- Avoid gradients, glow, and glass as default interface treatments. The miniature physical scene may require controlled depth/contact shadows; that does not authorize unrelated UI effects.

For the agreed opening, paper is the continuous page surface, ink supplies the
headline/text/structural weight, and yellow marks the primary CTA and selected
agent. The CTA uses an ink label and fine ink edge; check its actual states and
focus against paper. Brown/peach keep secondary roles rather than competing
with the main action. The reference wireframes' pastel block colours and the
Lūmen prompt's dark theme are not our colour allocation. Graphite stays subtle;
readable output surfaces remain quiet.

## 5. Typography, spacing, and geometry

- Start from the existing readable sans-serif family. Reserve mono for useful identifiers/numbers/compact metadata. Research text wrapping before adding a typography dependency.
- Serif/italic treatment is optional for a real quoted excerpt; do not italicize a random heading word or all agent outputs by habit. Do not add Instrument Serif merely because it is fashionable.
- Starting type sizes: body 16–18px; headings scale responsively. The old 40–72px opening headline range and three-line target are starting constraints, not reasons to force awkward breaks.
- Retain an orderly grid, a content width around 1200–1280px, and a coherent spacing scale. Use spacing to group information before drawing another box.
- Square corners and fine structural lines are the inherited dossier reference. Review each border; not every paragraph needs its own container.
- Never impose the current 900px minimum card width on a narrow viewport. Use normal flow/stacked layouts on mobile.
- In a scene, keep essential text in readable DOM overlays or adjacent panels. Avoid tiny labels painted onto rotating machinery.

### Additional CSS/design technique register — 17 November

The owner supplied ten further tips and authorised research, deduplication and
selection. These are technical review dispositions, not approval of a new
aesthetic, component, palette or implementation. Existing U/M checklist IDs
remain; C01–C10 track these inputs without adding phases.

| ID / input | Existing coverage or observed code | Disposition for Marketing OS |
|---|---|---|
| C01 Nested rounded corners: inner radius = outer radius minus padding | U14 already records this; the dossier direction uses square corners | KEEP as a conditional geometry check. For concentric corners use `max(0, outer radius - total inset)`, including applicable border width/padding/margin. Unequal insets need per-corner/per-axis treatment. N/A for square corners; no reason to round the site |
| C02 Alpha borders instead of solid hex borders | F03 already uses `color-mix(in srgb, var(--ink) 24%, transparent)` for `--rule`; other borders are intentionally solid | REFINE: translucent ink can soften decorative separators. Hex is a notation, not the cause of ugly borders; it can also encode alpha. Keep strong CTA/control/focus boundaries where needed. Check actual composited contrast over paper, graphite, fills and scene backgrounds; do not lower every border's opacity |
| C03 Prefer OKLCH to HSL | No authoring policy yet; exact palette tokens are established | KEEP as a useful authoring/evaluation method: perceptual lightness/chroma is generally easier to adjust consistently than HSL lightness. Existing hex tokens remain valid and visually unchanged. No mandatory token migration, new palette or shade ladder; perceptual lightness does not prove WCAG contrast |
| C04 OKLCH for grey gradient midpoints | Gradients are not an adopted page-background style | CONDITIONAL: if a justified gradient is used, compare explicit Oklab/OKLCH interpolation and hue path; inspect intermediate chroma, gamut and readability. One keyword does not fix every colour pair. This concerns interpolation, not data compression. No decorative gradient is required; alpha-mask gradients are a separate use |
| C05 Match icon stroke to font weight | U12 covers consistency; F03 pairs 20px, 1.5-stroke role icons with bold labels | KEEP and strengthen optical review at actual size, with one icon family and role-based stroke choices. Font weight and SVG stroke width have no numeric equality. Review that current thin-icon/bold-label pairing rather than assuming it passes or fails automatically |
| C06 Fade carousel edges with a mask | M18 covers masks generally; no new carousel is adopted | CONDITIONAL on a useful horizontal track existing. An alpha mask can fade its edges over varied backgrounds. Keep active items, readable labels, arrows and keyboard focus clear of the fade or scroll them into the clear region. No mask on the whole readable result; no carousel added just to use the effect |
| C07 Blur during icon swaps | M19 already records crossfade/scale, with blur optional | ALREADY COVERED / OPTIONAL for genuine state changes. Preserve accessible name, focus, hit area and correct final state during interruptions. Prefer a simple swap/crossfade where clearer; omit blur under reduced motion and review readability/paint cost |
| C08 Lighter surfaces for elevation in dark mode | Agreed page is light paper; dark theme is not selected | OUT OF CURRENT SCOPE. Tonal separation is valid in a dark theme, not a universal replacement for shadows. Retain as future reference only; no dark theme, extra surface palette or mandatory shadow removal |
| C09 Replace mobile `100vh` with `dvh` | F03 preview/study and legacy deck contain `100vh`; native mobile flow is required, but unit choice was not explicit | KEEP with a choice per component: `dvh` fits changing visible height; `svh` provides stable height with browser controls expanded. Prefer stable/content-driven sizing for the mobile hero/study; consider dynamic sizing for a viewport-filling panel. Use `min-height` where content must grow, include header/safe-area insets and appropriate fallback; no blind global replacement |
| C10 Multiply white-background product shots | Multiply already appears in the graphite overlay, not an adopted product-shot treatment | CONDITIONAL for a suitable decorative image. White blends into the underlying surface, but every other pixel also multiplies/darkens; inspect off-white/coloured/translucent content. Prefer a proper transparent export where possible, isolate blend scope and preserve original assets. Keep evidence/product screenshots faithful and essential text outside the blend layer |

These refine the existing direction, not ten effects to display. Review
applicable items in F03's revised foundation, F09 viewport/scroll integration
and F11 console work; check them cumulatively in F12. Geometry/icon/border/
viewport checks remain useful even when optional effects are N/A with a reason.

#### Technical acceptance and limits

- C01: inspect actual rounded nesting and full insets; do not apply a scalar
  formula blindly to unequal corners or force rounding onto square components.
- C02/C03: verify final composited colours. Apply the relevant text contrast
  criterion and at least 3:1 for non-text boundaries/state indicators needed to
  identify or operate a control. Decorative separators are not all control
  boundaries. OKLCH or opacity alone does not establish accessibility; a border
  can composite over its element's own background.
- C04/C06/C07/C10: retain useful no-effect/static fallbacks and inspect relevant
  browsers, readability, focus, interruption and rendering cost. A mask gradient
  changes alpha, not the approved palette.
- C09: verify expanded/collapsed mobile browser controls, rotation, content
  growth/zoom and the on-screen keyboard where relevant, with real Safari/device
  or appropriate browser evidence. A Chromium viewport sweep or `CSS.supports`
  check alone does not establish iOS Safari behaviour. Dynamic height changes
  must not make the timeline or CTA jump; mobile stays native/readable.
- This research does not mark visual checks PASS. No code/assets, colours,
  dependencies, model requests or completed-phase status change here.

#### Sources reviewed

Reviewed 17 November 2026 through official documentation/specification source
repositories. These establish mechanics, not a universal aesthetic; check actual
browser support and the composition at implementation:

- [CSS Backgrounds corner shaping](https://github.com/w3c/csswg-drafts/blob/main/css-backgrounds-3/Overview.bs) — border/padding/content-edge radius relationships; C01.
- [MDN colour values](https://github.com/mdn/content/blob/main/files/en-us/web/css/reference/values/color_value/index.md), [Oklab](https://github.com/mdn/content/blob/main/files/en-us/web/css/reference/values/color_value/oklab/index.md), [OKLCH](https://github.com/mdn/content/blob/main/files/en-us/web/css/reference/values/color_value/oklch/index.md) and [linear gradients](https://github.com/mdn/content/blob/main/files/en-us/web/css/reference/values/gradient/linear-gradient/index.md) — alpha, perceptual spaces and interpolation; C02–C04.
- [WCAG non-text contrast](https://github.com/w3c/wcag/blob/main/understanding/21/non-text-contrast.html) — required indicators versus optional boundaries/decorative lines; C02/C03/C06.
- [MDN SVG stroke width](https://github.com/mdn/content/blob/main/files/en-us/web/css/reference/properties/stroke-width/index.md), [mask-image](https://github.com/mdn/content/blob/main/files/en-us/web/css/reference/properties/mask-image/index.md) and [blur](https://github.com/mdn/content/blob/main/files/en-us/web/css/reference/values/filter-function/blur/index.md) — C05–C07 mechanics; optical weight remains a visual judgement.
- [Material surface-colour roles](https://github.com/material-components/material-components-android/blob/master/docs/theming/Color.md) — light/dark surface/container tones as reference, not adoption of Material styling; C08.
- [MDN viewport-relative lengths](https://github.com/mdn/content/blob/main/files/en-us/web/css/reference/values/length/index.md) — small/large/dynamic units and resize caveat; C09.
- [MDN mix-blend-mode](https://github.com/mdn/content/blob/main/files/en-us/web/css/reference/properties/mix-blend-mode/index.md) — backdrop/stacking-context behaviour; C10.

Local research snapshots: `/workspace/reviews/css-technique-research/`.

## 6. Proposed information architecture

### Component and state coverage — owner review, 17 November

The owner asked whether the whole component system is defined beyond the hero.
Product flow, palette and result hierarchy are settled; a complete visual
component sheet is not yet approved. These are recommendations/coverage, not
approval of a library or every listed feature. Existing console functionality
does not establish finished F11 styling.

| Component | Product use and recommended direction | Coverage / phase |
|---|---|---|
| Buttons | Yellow/ink primary, quiet secondary; stable target, labels, focus/press/disabled/loading and useful failures | Roles defined; F03 visual sheet pending; console F11 |
| Dropdown | Real labelled agent/workflow/model selection, keyboard and clear selected value; keep five showcase roles discoverable | Existing controls; styling F03/F11, no decorative dropdown |
| Speed dial | Floating actions only for a demonstrated frequent-action need | Not required; omit |
| Modal | Scene/detail viewer only if a separate focus context helps; label, Escape/close, focus containment/return and mobile fallback | Viewer decision F05/F08; sources can remain inline |
| Swap | Real icon/state change with stable accessible name and correct final state; M19 optional transition | Motion policy defined; only for controls that need it |
| Theme controller | Requires a separately designed/tested second theme | Not adopted; preserve light palette |
| Data display | Purpose → brief → useful genuine result → relevant risk/review → optional sources/rationale; engineering separate | Defined; F02 adapters; F03 layout, F04 comparison, F10 evidence |
| Avatar | Consistent specialist icons or actual attributed identity; no fictional human profiles/testimonials | Roles exist; illustration styling not accepted |
| Badge | Meaningful example, actual review or explicit execution state on the right surface | Meaning defined; U01/S01 audit; no filler/live badges or public provider-debug labels |
| Card | Useful brief/result/evidence grouping and readable mobile hierarchy; dossier means organisation, not a compulsory literal book | Content defined; F03 visual redesign OPEN |
| Carousel | Only genuinely useful sequential content with direct selection/static alternative | No current need; comparison is F04, not autoplay; C06 conditional |
| Chat bubble | User/agent turns, selected specialist, pending/error, retained thread and accessible sources | Functional chat exists; F11 visual system; isolation regressions retained |
| Collapse | Native expandable sources/rationale or genuine secondary detail; keyboard/focus and clear label | Existing details pattern; F03 review |
| Countdown | Actual time-bound event/action only | No showcase need; omit fake waiting, urgency or progress |
| List | Agent choices, history, sources/memories; stable order and selected/empty/loading/error states | Existing data paths; F03/F04/F11 consistency |
| Stat | Measured, attributable value with its meaning/limits | No decorative counters; F10 evidence audit |
| Status | Actual pending/completed/error/review in text as well as colour; risk flag is not approval | Contracts exist; F03/F11 styling |
| Table | Real comparison/history/evidence fields, readable headers and responsive adaptation | F04/F10/F11 as useful; no invented rankings/decorative dashboard |
| Text rotate | Only if it preserves a clear stable message and serves an interaction | Not required for hero; avoid rotating vague slogans |
| Documentation navigation | Anchors for real engineering content; sidebar only for actual long documentation | Navigation exists; F10 content review; no fake code breadcrumbs |

For each chosen component specify purpose, data/action binding, palette/type/
spacing/icons, applicable resting/hover/focus/pressed/selected/disabled states,
loading/empty/error/success, keyboard/touch, reduced-motion/static fallback and
integration evidence. Mark irrelevant states N/A rather than inventing controls.
The component sheet should show button, selector, result card, source collapse,
list/status and chat patterns together while retaining their phase ownership.

### Supplied component references — candidates, not adopted

**Vector Wordmark (Originkit, supplied TSX):** React plus WebGL/canvas text atlas,
pointer/lattice effects and coordinate labels. Candidate for one hero display
word/wordmark or bounded typographic transition; navigation identity stays
readable/stable. Defaults include 1200×800 minimum size and labels on. There is
no readable DOM text fallback when WebGL is missing, no reduced-motion branch
or offscreen IntersectionObserver. Its loop stops for document visibility but
otherwise continues; cleanup removes listeners/observer without explicitly
deleting the GL program/buffer/texture. Its custom parser does not accept
arbitrary CSS/OKLCH colour syntax. Adapt/test these before any import; preserve
real DOM heading semantics and the exact palette.

**Spider Button (Originkit, supplied TSX):** real HTML button plus WebGL pill,
2D web/rope/cursor effects, pointer/touch/key handlers and onClick. It has GL
fallback, reduced-motion handling and resource cleanup, but samples the motion
preference at mount and keeps a frame loop even for reduced motion, without
offscreen/document-visibility gating. Defaults include a 1200×800 container,
glossy red pill, web/custom-cursor decoration and white-oriented focus styling.
Candidate for an isolated secondary-interaction trial after palette/focus/
target/loop adaptation. Recommend a simpler stable hero CTA first; this web
motif is not an explanation of an agent's actual capability.

Both sources were inspected, not rendered/adopted as production components.
They do not define the hero object, scroll geometry, data layout or machine
materials. Check reuse terms before importing third-party code. No Originkit
package/dependency or new colour has been added.

### Remaining visual decision

The owner rejected the revised schematic-machine/expanded PR frames and asked
for revision before animation. It is still unclear whether the objection is
machine artwork, typography/spacing, the centred-to-three-column execution or
all of these. New component references are not approval of a replacement.
Do not animate/promote this candidate or mark F03 PASS. Standard component
behaviour can be specified from existing contracts without twenty separate
owner decisions; precise hero artwork/effect intensity needs concrete review.

1. Opening section: specific explanation, a focal visual, and an obvious way to explore/compare agents.
2. Agent discovery: reuse useful deck work if it serves the reviewed journey. Do not retain 600vh pinning solely because it already exists.
3. Agent comparison and selected-agent exploration: directly connected, without two redundant directories of the same five agents.
4. A separate “How it’s built” section for workflow/memory/architecture and engineering evidence, available without forcing every visitor through it.
5. Benchmarks with real methodology and known limits.
6. Clear entry into a consistent login and console.

This detailed order is a proposal. “Hero” means opening section; “deck” means stacked cards. The owner chose to preserve the stack while reviewing a shorter scroll and simpler opening. The original five-sheet transforming graphic is not an adopted requirement; review the exact opening/static composition before choreography.

### Agreed opening and CTA direction — 17 November

The owner accepted the recommendation to develop supplied wireframe **3 → 1**
as connected scroll states. The reference numbers identify the uploaded layout
diagrams, not extra build phases:

| State | Composition and purpose |
|---|---|
| Arrival — wireframe 3 | Compact navigation; centred ink headline and short explanation; one yellow “Explore the agents” CTA; partial agent visual below |
| First small movement | Visible agent elements begin repositioning while the main message remains legible; establish that the visual responds to scroll |
| Expanded exploration — wireframe 1 | A prominent central agent visual with compact adjacent role/brief and a useful genuine result; selection, focus and labels remain connected |

Use wireframe 2 only as supporting reference for selected-agent prominence and
nearby controls; its price/badge blocks are not features to adopt. Reduce extra
card/media/text boxes rather than filling every placeholder. Lower background
forms should relate to the agent presentation, not become an arbitrary staircase.

“Explore the agents” directly reaches the exploration section without requiring
the full animation. Keep it steady while hovered/focused/pressed; the moving scene
must not carry its hit target away. “Open console” remains a quieter navigation
action. Agent selection/comparison and console submission are separate actions;
exploration itself never invokes a model. Comparison still belongs to F04.

Before rebuilding the study, review arrival/first-movement/expanded-stage frames
with the owner, including colour placement, headline/CTA alignment, useful agent
content and a readable mobile arrangement. The existing sans family is the
starting point; no reference typeface, exact headline or fixed pixel geometry
is adopted. Narrow screens need their own readable arrangement of the same
essential content. Reduced motion must retain an immediate route to exploration.

The dial video supplies coordinated selection/focus/work-display continuity;
Glaze supplies object continuity/material specificity; Lūmen supplies alignment,
spacing and hierarchy discipline. Exact third-party assets, palette, placeholder
claims, commerce content and framework instructions remain reference context.

## 7. Visitor-facing agent comparison

Comparison helps choose the appropriate specialist. It must not present a fictional intelligence leaderboard.

Proposed common fields:

| Field | What to show |
|---|---|
| Specialist | Branding, PR & Policy, Social Community, Product Marketing, or Field Events |
| Useful when | A concrete task the specialist is designed to help with |
| Input/example | The supplied goal or clearly labelled simulated signal |
| Evidence | Optional source-linked supporting detail; keep the primary comparison focused on role, brief and useful result |
| Example result | An attributable excerpt and access to the full recorded result |
| Review behaviour | Business-relevant risk/review needs that the selected result actually supports; memory architecture belongs in the engineering section |
| Explore | Open that agent's physical scene and result, with supporting sources/rationale available on demand |

The owner confirmed a two-agent side-by-side comparison with one shared animation stage on 15 November. Show all five roles in discovery and let visitors choose/remove either comparison entry. On mobile, adapt those same two records into a readable stacked/tabular arrangement; review the exact responsive layout rather than shrinking two desktop columns.

Selection, removal, replay, closing, and return focus must be clear. Compare by useful differences, not fabricated speed/quality scores. Timings from different inputs/models are labelled observations, not a fair controlled ranking.

Comparing agents does not automatically call `/api/triage`. Triage remains its own real workflow. Comparison/replay must not invoke inference, submit a review, change a chat thread, or write memory.

## 8. Miniature physical scenes

The physical world should feel coherent across agents while each machine explains a different job. The owner selected a guided camera that makes the story clear and likes the machine concept, but explicitly wants concrete alignment before anything risks looking cheap/generic. Material/modelling choices require references and stills under the blueprint's F05 pilot quality checkpoint. The outer paper dossier does not force cardboard machinery. Optional visitor rotation is not approved. These are starting story candidates:

| Agent | Candidate physical metaphor | What must remain truthful |
|---|---|---|
| Branding | Composition/printing workshop gathers evidence into a positioning brief | Do not invent evidence rankings or causal reasoning traces |
| PR & Policy | Draft reaches a checkpoint and, when flagged, a human-review route | Current governance flags risk; it does not prove a phrase was automatically removed or rewritten |
| Social Community | Editorial workbench uses a supplied audience signal to produce a recommendation | Do not imply actual social listening, sentiment measurement, or publishing |
| Product Marketing | Miniature comparison table aligns available hardware/pricing facts with the result | No invented units, totals, TCO engine, or quantitative optimization |
| Field Events | Planning table connects the supplied brief/context to an event recommendation | No implied booking, scheduling, spend allocation, or unseen event database |

Prefer a few readable objects and a clear transformation over a complex machine whose operation needs explanation. A scene is an explanatory visualization of available input/output and observed workflow events, not a replay of hidden model thought.

The owner confirmed PR & Policy as the first pilot on 15 November: a risk checkpoint and separate human-review route. Review its materials, camera, stills and exact story before full animation. Use the same scene/data family for the deck preview, comparison entry and deeper view; do not create incompatible output stories.

## 9. Background research — all 22 inputs retained

All dispositions are research assessments. The original six-candidate shortlist is retained, but the owner's 15 November feedback now prioritizes speckled graphite. No combination of six backgrounds is required.

| ID | Original background | Research disposition |
|---|---|---|
| B01 | Fall texture | Meaning/reference unclear; keep pending rather than invent an interpretation |
| B02 | Fluted glass | Set aside for the dossier UI; distorts text and requires another material language |
| B03 | Thermal gradients | Set aside under the reference palette; new heat/colour semantics are unexplained |
| B04 | Water ripples | Set aside as a page background; no current product purpose |
| B05 | Speckled graphite | OWNER SELECTED STARTING DIRECTION: subtle speckling on the light paper page; compare with plain base. Exact grain scale, asset and intensity remain for review |
| B06 | Single-hue landscapes | Set aside; no established link to the agent workflow |
| B07 | Blueprint grids | SHORTLIST: sparse construction structure around technical scenes |
| B08 | Halftone | SHORTLIST: restrained printed-dot treatment |
| B09 | Grainy gradients | Set aside as gradients; compare plain static grain separately |
| B10 | Grass texture | Set aside; unrelated material/narrative |
| B11 | Dithered images | OWNER LIKED in follow-up: preferred selective imagery treatment; placement remains open and must not duplicate graphite grain everywhere |
| B12 | Paper texture | EARLIER SHORTLIST: a comparison/reference surface, no longer the first owner research task |
| B13 | Contour lines | SHORTLIST: restrained framing/outline treatment, not topographic wallpaper |
| B14 | Cloud sky | Set aside; could make this appear to sell cloud hosting rather than show marketing agents |
| B15 | Pixel mosaics | Set aside for the page; could compete with a miniature scene |
| B16 | Lens distortion | Set aside for readable/interface surfaces |
| B17 | Stippled gradients | Set aside as gradients; sparse static stipple is an alternative texture, not another layer to stack |
| B18 | Square dot grids | SHORTLIST: static spatial structure |
| B19 | Blurred photos | Set aside; hides specificity and adds an unrelated photographic layer |
| B20 | Iridescent shapes | Set aside; conflicts with the current material/palette direction |
| B21 | Impressionist paintings | Set aside; painterly identity has not been chosen |
| B22 | ASCII pixels | Set aside; pseudo-terminal imagery is not needed to establish technical credibility |

### Earlier six-candidate research order — retained for context

| Order | Candidate | Search starting point | Compare and inspect |
|---|---|---|---|
| 1 | Paper texture | `subtle uncoated paper texture editorial website` | Plain warm paper versus fine static grain; text clarity, compression/asset weight, appearance at mobile size |
| 2 | Halftone | `minimal editorial halftone dot pattern web design` | A small peripheral printed field versus no pattern; avoid interference with 3D detail |
| 3 | Blueprint grids | `sparse technical grid interactive product scene` | Whether a sparse grid clarifies spatial construction around a scene; avoid a full-screen engineering wallpaper |
| 4 | Square dot grids | `subtle square dot grid interface background` | Cleaner alternative to blueprint lines; density, contrast, distraction |
| 5 | Contour lines | `minimal contour line framing graphic design` | Useful active framing versus decorative topography |
| 6 | Speckled graphite | `fine graphite speckle paper texture design` | An alternative to paper grain; ensure it does not look dirty or obscure labels |

The table records the earlier recommendation, not the current task list. Start now with the owner's **speckled graphite** reference, using the plain base as a control. Halftone/blueprint/dot/contour/paper alternatives are retained for comparison if useful; they have not been selected by this feedback.

Choose one main surface and at most a useful supporting treatment. Keep reading/result areas quiet. The original grain cap of roughly 6% opacity is a starting reference to evaluate, not a required texture intensity. Research URLs/images have not yet been collected merely by listing these search phrases.

## 10. Design trends — all 20 inputs retained

| ID | Original trend | Research disposition |
|---|---|---|
| T01 | Dithering | OWNER LIKED: selective graphic/shading treatment; compare against graphite to avoid duplicated noise; never damage evidence text or charts |
| T02 | ASCII over video | Set aside; obscures readable product footage |
| T03 | Infinite canvases | Set aside for the core journey; reconsider only for a demonstrated graph-exploration need |
| T04 | Disco logos | Set aside; stable readable identity takes priority |
| T05 | Renaissance branding | OWNER REJECTED: does not fit the existing chosen direction; do not reintroduce as a branding/composition recommendation |
| T06 | Monet backgrounds | Set aside; painterly art direction not selected |
| T07 | Dark gradient heroes | Set aside under the paper reference |
| T08 | Pixel loaders | OWNER LIKED, for genuine asset/API pending states; final appearance is open |
| T09 | Instrument serif | Do not add by default; assess existing typography |
| T10 | The one italic word | Avoid arbitrary headline emphasis |
| T11 | Cream backgrounds | BASE-COLOUR REFERENCE: current page is already cream/off-white-like; not a new effect or current research obligation |
| T12 | All-caps eyebrows | Only short useful context; not a default on every section |
| T13 | Pulsing live dots | Only a truthful actual state; no perpetual fake-live indicator |
| T14 | Sparkle icons | Avoid generic AI decoration |
| T15 | Liquid glass | Set aside for dossier/UI readability |
| T16 | Three-icon cards | Avoid forcing the product into a generic benefits template |
| T17 | Decorative flowcharts | EXPLANATORY TECHNIQUE: actual process relationships can be explained inside the miniature scenes; no separate ornamental diagram section is required |
| T18 | Endless marqueses | Set aside; no current need for continuously moving logos/chips |
| T19 | Sparkles | Set aside ambient particles/glitter |
| T20 | Pretext text wrapping | LAYOUT TECHNIQUE: implementation should provide readable responsive line breaks; no specific Pretext tool/library has been chosen |

### Earlier five-candidate research order — retained for context

| Order | Candidate | Search starting point | Specific question |
|---|---|---|---|
| 1 | Cream backgrounds | `warm paper editorial website typography` | Does the reference surface support readable text and physical miniatures? This is colour research; paper texture is surface research |
| 2 | Pretext/text wrapping | `responsive headline text wrap balance typography` | Can natural/balanced wrapping solve the composition? Establish what “Pretext” refers to before evaluating a package |
| 3 | Useful animated process diagrams | `interactive process diagram source evidence decision animation` | Can a few objects/routes explain the actual workflow and support the physical scene? |
| 4 | Dithering | `restrained monochrome dithering graphic design` | Does one deliberate asset treatment add identity without introducing noise? |
| 5 | Pixel loaders | `accessible pixel loading indicator reduced motion` | Is this better than a simple pending indicator for our actual console request? No fake progress or simulated stages |

The owner has since narrowed this table to **dithering** and **pixel loaders** as liked visual candidates. Do not require more cream-background, wrapping, or flowchart-image searches. The defining experience remains the miniature physical agent scenes; precise treatments are tested before final adoption.

## 11. Design-review checklists

Check every item after each implementation phase and again at final acceptance. All items below are initially unchecked. Record PASS, FAIL, or N/A with evidence. If a functional exception is proposed, explain it for owner review instead of silently retaining the pattern or banning a necessary control.

### A. All 20 ways to unslop the design

- [ ] U01 Delete filler badges; truthful mode/review state must remain inspectable.
- [ ] U02 Drop redundant labels and unnecessary hierarchy levels.
- [ ] U03 Remove the arbitrary italic word from headings.
- [ ] U04 Use mono only where it adds clarity.
- [ ] U05 Use one coherent design system across showcase, login, and console.
- [ ] U06 Show the actual product and attributable results.
- [ ] U07 Enlarge/emphasize the main feature rather than making every element loud.
- [ ] U08 Group related information with spacing.
- [ ] U09 Make the headline specific to the actual system and use case.
- [ ] U10 Emphasize the primary action; keep alternatives visibly secondary.
- [ ] U11 Give the accent colour a defined role.
- [ ] U12 Keep icon family, stroke, size, meaning and optical weight beside labels consistent; see C05 in §5.
- [ ] U13 Remove unnecessary embellishments.
- [ ] U14 Check nested rounded geometry using outer radius minus full applicable inset, including border/padding (C01 in §5); otherwise record N/A for square corners.
- [ ] U15 Verify text contrast and focus visibility in actual states.
- [ ] U16 Wrap headings correctly across widths and zoom levels.
- [ ] U17 Check optical alignment as well as numerical alignment.
- [ ] U18 Clarify the original “Tabular notes”; if tabular numerals were intended, apply them to changing/aligned metrics.
- [ ] U19 Provide real loading, error, empty, and retry states.
- [ ] U20 Animate useful feedback for actual interactions and results.

### B. All 19 supplied AI-design-slop indicators

The original heading said 20, but its list contains 19 entries. Preserve those entries rather than invent a twentieth.

- [ ] S01 No filler tags and pills.
- [ ] S02 No excessive italicized words.
- [ ] S03 No trend-led adoption of Instrument Serif.
- [ ] S04 No cramped/excessive negative kerning.
- [ ] S05 No unnecessarily detailed UI in the primary view.
- [ ] S06 No excessive dividers.
- [ ] S07 No uncontrolled colour shades and opacities.
- [ ] S08 No unnecessary bordered containers nested around every block.
- [ ] S09 No overloaded diagrams; reveal technical detail intentionally.
- [ ] S10 No verbose, redundant copy.
- [ ] S11 No fake code breadcrumbs or terminal paths.
- [ ] S12 No purposeless section numbering; explain retained agent identifiers/navigation.
- [ ] S13 No redundant eyebrows.
- [ ] S14 No decorative ASCII images.
- [ ] S15 No arbitrary squircle styling.
- [ ] S16 No excessive monofonts.
- [ ] S17 No long, unreadable all-caps subtitles.
- [ ] S18 No gratuitous gradient backgrounds.
- [ ] S19 No habitual periods on short titles; preserve natural punctuation where needed.

## 12. Data, language, and engineering truth

- Populate telemetry from actual records. Mock calls show no fabricated token usage/provider latency; missing values say unavailable. Show configured and provider-reported model identities accurately.
- History reads the complete stored `result`, with a truthful legacy state. Reviews come from the server and belong to one decision. Preserve the original escalation flag.
- A result's `knowledge_units` summary is not automatically the retrieved corpus. Show source detail only when it was actually captured and linked to the request.
- Distinguish one-agent routing, two-agent triage, and five-agent digest. No automatic five-agent swarm animation for every request.
- Do not claim “zero hallucination,” tamper-proof approval, continual monitoring, real social listening, a scheduler, or actual policy-driven rewriting without code and evidence.
- “Recorded,” “live,” “mock,” “simulated,” and “fictional client” describe different things. Choose concise visible wording without burying it in an unreadable badge pile.
- Counts come from the relevant data/report. Do not turn the 75-row mixed target/competitor seed into a claim of 75 competitor facts.
- Avoid unnecessary implementation jargon in the ordinary console task flow. Put engineering detail in an intentional inspectable layer.

F02 implementation: `presentation.js` normalizes run/chat/triage/digest/history and supplies six-station scene bindings without mutating raw snapshots. One-shot generated summaries, request-captured full rows, chat fact excerpts, per-specialist triage scopes and digest corpus links stay distinct. Missing IDs, measurements, flagged phrases and review events stay unavailable. `exampleCatalog.js` accepts only complete live catalogs and matching-file checksums; checksums establish consistency, not independent provider authentication or claim entailment. Physical comparison/scene UI and the final design system remain later work.

The presence of fields in an internal presentation model is not a requirement to
render them publicly. The owner-approved information hierarchy above governs
visibility. Capture/test dates, quota/debug notes and operational metadata remain
verification material; the separate engineering section explains the system
without becoming a capture-log or troubleshooting panel.

The five saved examples use the seeded local source corpus, not a fresh web crawl. Inspection found some navigation/cookie text in retrieved rows and unsupported inferences that H100 evidence establishes a competitor's full hardware limits. At the F02 revision, a visible caveat disclosed those issues. The subsequently approved direction requires correcting the underlying issues before promoting these examples as finished public results. Preserve the original snapshots; F10 still owns the broader content/proof audit. F02 PASS does not certify model quality or source entailment.

## 13. Accessibility and comparison acceptance

- Preserve readable text and a coherent result when animation, WebGL, touch hover, or a texture is unavailable.
- Use labelled keyboard-operable controls with visible focus. Closing a scene restores focus to its opener. Selection does not rely on colour alone.
- Provide responsive comparison instead of shrinking five desktop columns into unreadable mobile cells.
- Keep one primary moving composition; avoid making visitors track five simultaneously running machines.
- Test mobile widths, zoom, text wrapping, reduced motion, renderer failure, and long/missing result fields during relevant phases, not only at the end.

## 14. Decision and reference log

| Date | Decision | Source / status |
|---|---|---|
| 2026-11-17 | Research ten additional CSS/design tips and deduplicate existing rules | C01–C10 in §5: retain/refine geometry, icon weight, border/colour and viewport checks; masks/blur/gradients/multiply remain conditional; dark-theme elevation is out of scope. Technical dispositions under the research request, not new aesthetic/implementation approval |
| 2026-11-17 | Owner agrees centred arrival → central agent stage, coordinated scroll and stable direct-entry CTA | Supplied wireframes 3 → 1; wireframe 2 is supporting reference. “Explore the agents” primary, “Open console” secondary; paper/ink/yellow roles retained. Revise F03 visuals, preserve F01/F02 and functional F03 work; storyboard review precedes replacement animation. Blueprint §18 |
| 2026-11-17 | Inspect supplied dial video and read Glaze/Lūmen reference briefs | User-supplied “Scroll-spun client dial with a needle and lens panel of each client's work.mp4” and two pasted prompts. Learn composition/motion discipline; exact assets, colours, fonts and implementation mandates are not adopted. No licensing or asset-reuse approval inferred |
| 2026-11-17 | Owner rejects current book-like F03 motion/visual study | MP4 reads as a library/children's book, not the intended tech product; misses the supplied reference. Font/padding suggested as possible contributors. Visual realignment required before another substantial build or promotion; no new palette/material/typeface inferred |
| 2026-11-17 | F03 candidate implemented; technical gate passes, visual review open | `/preview/f03` and `/preview/f03/motion`, application `9f0a3e7`; 349 backend, 55 frontend unit and 18 browser tests per mode. Desktop/mobile and plain/grain captures plus scroll clip in blueprint §17. No final aesthetic acceptance, promotion, new material or next-phase authorisation inferred |
| 2026-11-17 | Record connected landing-page scroll story and proceed with F03 | Owner authorised a focused opening-to-PR-dossier motion prototype and page foundation. Small first movement precedes the larger reveal; no literal dial/glass/blue-fringe adoption. Concrete visual review remains required |
| 2026-11-16 | Purpose → short brief → visual explanation → useful result; optional sources/rationale; separate “How it’s built” section | Owner approved the researched recommendation. Public capture/test dates and quota/debug explanations are rejected. Documentation recorded; UI cleanup and example-quality correction remain pending implementation |
| 2026-11-16 | F02 data/capture foundation PASS; five genuine Flash-Lite recordings | `0dc18d6`, full backend/frontend/browser gates recorded in blueprint section 15. Capture model explicitly selected under owner's lower-tier authorisation; final art direction and generated-claim quality remain separate |
| 2026-11-16 | F02 data/capture implementation; retain genuine-public-example requirement | Implementation status, not a new owner design choice: upstream generation HTTP 402 blocks capture. No final palette, background, material or camera treatment implemented |
| 2026-11-13 | Paper/dossier identity is retained | Owner confirmed |
| 2026-11-13 | Clicked agents use miniature physical 3D scenes explaining their work | Owner confirmed; supersedes old flat-SVG-only constraint |
| 2026-11-13 | Agent comparison is for website visitors | Owner clarified explicitly |
| 2026-11-13 | Keep background and trend shortlists separate, then narrow | Owner confirmed research approach |
| 2026-11-13 | Maintain three current files and gate every build phase | Owner requested |
| 2026-11-15 | Speckled graphite, dithering, and pixel loaders are liked candidates | Owner feedback; final reference, placement, and intensity remain open |
| 2026-11-15 | Current cream-like base needs no new trend effect; wrapping and diagrams need clearer roles | Owner feedback and implementation clarification; earlier research order superseded |
| 2026-11-15 | Add dithered images to the liked candidates; reject Renaissance branding | Owner explicitly selected only dithered images from the follow-up suggestions and explained the branding mismatch |
| 2026-11-15 | Use genuine saved responses for public examples; controlled/mock responses for routine tests | Owner answered Q01; provider and credential availability not yet verified |
| 2026-11-15 | Compare two agents side by side with one shared animation stage | Owner answered Q02; all five remain discoverable; detailed mobile layout still requires review |
| 2026-11-15 | Build PR & Policy's checkpoint/human-review pilot first | Owner answered Q03; materials/camera/stills not yet settled |
| 2026-11-15 | Keep light paper and try subtle graphite speckling | Owner answered Q04; exact texture/intensity still requires comparison/review |
| 2026-11-15 | Use a camera that shows the story; align machine quality through concrete proposals | Owner answered Q05; likes machines, does not want a cheap/generic result. Materials remain open; visitor rotation unapproved until a visible prototype |
| 2026-11-15 | Preserve stacked cards; review shorter scroll and simpler opening | Owner answered Q06; exact composition/boundaries still require review |
| 2026-11-15 | F01 functional baseline verified at `d6c9973` | 323 backend tests, 29 frontend tests, 10 development and 7 built-app browser checks; scoped design audit in blueprint §13. No new art direction or scene acceptance inferred |
| Pending | Exact machine material/modelling/stills, guided framing, texture/dithering/loader placement, opening geometry and responsive comparison details | Bring concrete evidence before owner review; do not infer detailed visual acceptance from the direction choices |

Reference entry template:

```text
Question and research ID:
Reference URL/asset, creator, and licence/source:
Specific property to learn:
Proposed location and product purpose:
Simpler/plain alternative:
Mobile, accessibility, reduced-motion, and performance implications:
Comparison result:
Owner decision/date and affected phases:
```

No new visual references have been researched or licensed merely by drafting this specification. Keep this log and the blueprint synchronized as choices are made.

## 15. UX principles added to the research and review criteria

On 13 November 2026 the owner supplied 21 UX/animation items and clarified that “Pasteur's law” meant **Postel's law**. The complete definitions, application recommendations, naming corrections, and research-source limitations are in [ANIMATION.md, sections 14–15](ANIMATION.md#14-additional-ux-and-animation-principles--research-register). These are review recommendations, not newly approved layouts or 21 additional effects to ship.

Apply the following to the comparison feature and console:

| Principle | Working design criterion | How to check |
|---|---|---|
| Fitts' law and bigger hit areas | Make small icons/tabs easier to activate through spacing and padded hit areas. Start from a comfortable 44×44 CSS-pixel touch target where practical; comply with WCAG 2.2 minimum requirements/exceptions | Inspect actual target bounds and spacing, test touch/mouse/keyboard, and ensure targets do not overlap |
| Hick's law | Use clear role and task labels, one primary next action, and progressive disclosure. All five specialists may remain visible | Ask a visitor to choose a suitable agent and explain the choice; do not impose an arbitrary three-option limit |
| Miller's law | Group related information and leave comparison evidence/labels visible so users do not have to memorize one agent before opening another | Complete an agent-comparison task without relying on memory. Do not treat 7±2 as a maximum number of controls |
| Doherty threshold | Give prompt visual acknowledgement and genuine pending state; keep local selection/replay responsive | Measure browser acknowledgement separately from API/model latency. A roughly sub-100ms local acknowledgement is a provisional target to test, not a newly verified result or a guarantee of sub-400ms generation |
| Postel's law | Accommodate harmless human-input formatting and explain recoverable errors, while preserving strict server contracts | Test whitespace/empty/invalid input, server error messages, and unchanged invalid-type/schema rejection. Never coerce unsafe input or accept malformed model results to be “forgiving” |
| Jakob's law | Preserve familiar comparison selection, tabs, close/back behaviour, and standard form controls around the new 3D scenes | Keyboard/focus and browser-history journeys behave predictably; no bespoke gesture is required for an essential action |
| Frequency of use | Keep likely repeat actions such as changing an agent, replaying, and submitting a console task convenient | Observe representative tasks before asserting which actions are frequent; no telemetry collection is authorized merely by this principle |

Scene staging, pose planning, readable solid forms, and overall appeal belong to the physical presentation; do not turn them into extra UI chrome. Squash/stretch, windup, secondary movement, and exaggerated feedback remain selective techniques. Any approval/success display must follow actual server state.

Review these criteria alongside U01–U20 and S01–S19 at phase boundaries. Add new findings and decisions to the log rather than silently labelling these research recommendations as owner-approved implementation.

## 16. Narrowed visual direction — 15 November feedback

### Surface texture and dithering have different jobs

- **Speckled graphite** describes a surface with fine flecks/grain. The owner selected a light paper page with subtle speckling as the starting direction; compare that with the plain base. A dark redesign or palette change is not implied.
- **Dithering** is a method of representing tonal shades using patterns of dots/pixels and a limited palette. Its visual grain can resemble speckling even though its role is different.
- Compare graphite alone with graphite plus a dithered object/graphic. If they produce the same visual noise, use one treatment or separate their locations instead of stacking both everywhere.
- Keep essential body text, exact values, source cards, and console result areas quiet. Texture should remain background; it must not compete with the selected 3D scene.

### Clarify the other three earlier candidates

- **Cream backgrounds:** the current page already uses an off-white base. Colour and texture are separate choices. Retain the reference palette until a deliberate change, rather than adding a “cream effect.”
- **Text wrapping:** how headlines/paragraphs form readable lines across widths. We should solve this in typography/layout; the owner does not need to find an animation image for it. The specific term “Pretext” is still not a package requirement.
- **Useful process diagrams:** a way to explain relationships such as input, evidence, risk review, and output. The miniature machines can perform this explanatory role. A generic flowchart and an additional section are not required.

### Focused next comparison

1. Identify a subtle graphite-speckle reference for the owner-selected light paper base.
2. Compare the existing/plain base with that one texture at readable desktop/mobile scales.
3. Test one selective dithered graphic only if it adds a distinct role.
4. Compare a small pixel loader with a simple pending indicator for real scene/API loading.
5. Continue the separate material/camera/story references for the miniature agent machines.

No frontend code, palette value, background asset, loader implementation, or dependency was changed by recording these preferences.

Follow-up narrowing: dithered imagery is liked, while Renaissance branding is rejected. Dithering is the rendering technique and dithered images are one use of it; they do not require two independent effects. Keep that visual family coherent with the graphite surface and physical agent scenes. Stippled gradients, pixel mosaics, and infinite canvases were suggestions without positive selection, not agreed features. Any further comparison must come from the original lists and earn its place; there is no requirement to keep expanding the count of styles.
