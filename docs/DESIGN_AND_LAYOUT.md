# Marketing OS — design and layout

Updated: 18 November 2026 (Asia/Calcutta).
Status: sitewide specification revised from the website study and supplied components.
Phase 1/Phase 2 remain complete within their recorded scope; Phase 3 is OPEN. This is a plan,
not implementation or owner acceptance of unseen artwork.

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

Local working copy only: keep this file off GitHub unless the owner explicitly
changes that instruction. No staging, commit, push or deployment is authorised.

Read with [the blueprint](MARKETING_OS_BLUEPRINT_PLAN.md), [animation](ANIMATION.md)
and the local [website study](/workspace/reviews/WEBSITE_REFERENCE_STUDY.md).
The owner's decisions govern. Reference prompts describe other sites; they are
not build instructions. Original Claude text remains verbatim in the
historical archive.

**Phase correspondence rule:** these 16 sections support the single Phase 0–Phase 14
roadmap, not extra phases. Consult blueprint §6, §10 and §11 before changes and
closure. Apply U01–U20/S01–S19, V01–V12 and relevant UX checks with evidence or a
reasoned N/A. Blueprint §20 records the sitewide retain/revise/discard decisions.

When a backend gap reopens verification, review each phase through the
discovery phase against this file. Recheck data attribution, normal and failed
request states, and affected user paths on the repaired code. Record affected
visual evidence and any outstanding owner acceptance in the phase ledger.
[Backend gap procedure](PHASE_EXECUTION_GUIDE.md#backend-gap-discovered-during-any-phase)

## 1. Vision and confirmed decisions

Create a motion-led Marketing OS portfolio with a functioning product beneath
it. An ordinary visitor understands what the five agents can do; an engineer
can inspect the actual architecture and evidence. Motion is a defining part of
that experience, not decoration attached after a static site is finished.

The working visual idea is a family of useful agent dossiers becoming spatial
and revealing their work. This is a design interpretation to demonstrate, not
an approved new brand metaphor. The coherent-identity lesson comes from the
references; their studio, botanical, voxel or photographic subjects do not.

| Decision | Current meaning |
|---|---|
| Light palette | Retain the exact paper/ink/yellow/peach/brown tokens in §4 |
| Paper/dossier | Organise roles, briefs, results and evidence; no literal library, book cover or mandatory cardboard material |
| Landing story | Product opening → quiet introduction → clockwise gallery → clicked dossier → results and cases → console close |
| Agent discovery | Five circular/spiral cards in the third section. Scroll gives every role its focal-arrival beat; click opens information; How it works plays a distinct role animation |
| Main action | Open console is primary. The secondary Spider action, Explore the agents, goes directly to the orbit |
| Vector Wordmark | First-screen product name at the current scale. Pointer over the letters reveals local dots, guide lines, squares and coordinate numbers. Marketing Helper is a working name |
| Visitor comparison | Choose two of all five agents side by side, then open one shared stage |
| Role explanations | Five click-to-play 2D explanations, using a shared stage and static equivalents. PR & Policy first, with a risk checkpoint and separate human-review route |
| Scroll and pointer | Same-page glides are a Phase 3 trial and a Phase 9 production task. Use bounded hover, pointer-only hero guides and a native scroll-linked orbit |
| Public examples | Genuine saved responses; purpose → short brief → visual explanation → useful result; optional sources/rationale; engineering separate |
| Surface/detail | Reuse the existing Phase 3 dithering across the website. Keep reading surfaces crisp and use the pixel loader inside a genuinely loading stage |
| Delivery | Desktop first; preserve existing narrow-screen/reduced-motion safety. Bespoke mobile design is Phase 12. Owner can review a checkout locally in Anti Gravity |

Not yet accepted: original agent artwork, final composition/type scale, wordmark
intensity/composition, precise card geometry/travel, graphite intensity, section pacing, navigation expansion,
role-specific component choices and measured budgets. Bring a concrete proposal for these rather
than asking the owner to repeat generic research. Visitor-controlled rotation
and a second theme are not adopted. More general websites are not a prerequisite.

## 2. What exists and what needs to change

| Area | Implemented evidence | Current disposition |
|---|---|---|
| Anti Gravity base | 600vh deck, opaque stacking, tabs, Lenis, navigation and two-panel cards on showcase-redesign | Preserve useful contracts/history; replace visual assumptions only through reviewed, tested work |
| Phase 1 | Functional baseline at d6c9973: saved results, server reviews, request isolation, all roles, modes/errors, API integration, accessible baseline | Retain; new visuals must pass these regressions, not redo the phase |
| Phase 2 | Adapters and five genuine gemini-3.5-flash-lite recordings at 0dc18d6; same-request evidence and immutable original snapshots | Retain; saved presentation stays read-only; historical inspector metadata is not the desired public design |
| Rejected Phase 3 motion | Paper/book opening at /preview/f03/motion through 9f0a3e7 | Rejected as library/children's book; do not promote or merely change font/padding and call it resolved |
| Rejected Phase 3 stills | Static schematic machines and expanded PR frames through a4104a2 | Rejected before animation; useful data/security work remains separate from visual approval |
| Later technical loop | Blueprint §19 records 411 backend, 56 frontend and 18+18 browser passes at that revision | Historical scoped evidence, not current visual acceptance or a promise of no vulnerabilities |
| New direction | A connected homepage exists. Revision 7 reopens the section order, Wordmark, gallery and role art. Phase 4 follows the new Phase 3 exit gate |
| Role explanations | Data bindings exist and the role animations are open | PR 2D pilot Phase 5/Phase 6, other agents Phase 7A–D |

The connected draft uses / for review; the working console is at /console. Captures,
provider corrections and scoped test results remain in blueprint §13–§19.
Original Phase 2 recordings and the Claude archive must not change as a design edit.
The references change the whole design system and later integration, not the
already tested backend contracts. No Render dependency is needed for local review.

## 3. Two audiences, one understandable journey

| Journey | Visitor sees/does | Architectural responsibility |
|---|---|---|
| Opening | Short, specific product headline, succinct upper-right description, working name and two actions | Semantic text. Open console is primary; Explore the agents links to the gallery with a stable Spider target |
| Quiet introduction | On the first scroll, one clear statement and one quieter supporting line | Normal-flow editorial section with its own space; carries the same dither and palette |
| Discovery | In the third section, scroll through five clockwise roles with readable focal arrivals | Section-local progress and overlap. Keep role labels and direct controls reachable |
| Dossier | Click a card to open its purpose, short brief, result and evidence | Keep the selected agent/example stable and readable; one focused role at a time |
| Explain and compare | Open How it works to see the role’s own explanation; select two agents for comparison in the later phase | Separate playback and comparison state, guided stage and static equivalent |
| Results and case previews | Exit the orbit by scrolling. See the workflow, one featured result and a few lines per real-company case | Preview copy stays short. Open the full brief, recommendation and supporting sources on demand |
| Close and use | Bring a brief, enter the console, or follow short footer links under our dotted wordmark | Actual console route, ordinary navigation, normal flow and paper palette |

Use Strata's order and contrast in emphasis as a reference, then establish our
own type, palette, spacing, artifacts and motion. Keep section boundaries
deliberate and the entire page navigable with native scroll.

### Approved agent presentation

1. Plain purpose and business value.
2. Short relatable example brief.
3. Useful genuine result, readable immediately after opening the dossier.
4. Optional sources and written rationale.
5. A separate **How it works** action for the role-specific explanation; broader engineering has its own section.

Use natural labels only where needed. Do not force a chat transcript or six-stage
technical panel onto every role. Keep public capture/test timestamps, quota/debug
notes and provider troubleshooting out. Use a concise Example or fictional-case
identification when needed; never imply replay runs a model. Preserve actual
loading/error/review feedback for explicit console actions. Known misleading
claims need underlying correction and genuine recapture, not cosmetic hiding.

## 4. Visual identity and reference palette

| Token | Exact reference value | Sitewide role |
|---|---|---|
| --ink | #050d09 | Headline, body/control text, decisive structure and restrained dark controls |
| --paper | #e1e1d8 | Continuous page and quiet readable result surfaces |
| --yellow | #e7d78a | Primary Open console and active-agent emphasis; keep the secondary Explore target clear |
| --peach | #e4c185 | Restrained secondary tint when it clarifies hierarchy |
| --brown | #4e4739 | Supporting text/details after contrast check |

The art direction must specify where each colour goes in arrival, foreground and
rear cards, expanded dossier, comparison, explanation artwork, evidence, login and
console. Check ink-on-yellow and actual focus/disabled/selected states. Colour
alone never indicates selection, risk, review or success.

Use depth through overlap, projection, readable silhouettes and controlled light,
contact/shadow and texture. Spatial shading may vary pixels without adding new
semantic UI colours. Do not darken rear cards until their labels become unusable;
keep controls/essential copy on readable DOM surfaces. No copied 65% brightness
or 70% rear overlay is prescribed.

Freeland's dark imagery, Strata's orange/voxels/glow and Antimatter's green/leaves
are reference identities, not ours. The rejected static boxes are not a fallback
art direction. Paper is a surface/organisation choice, not a literal book world.
No dark mode, arbitrary gradients/glass, new agent palettes or white/black tokens
are implicitly approved. Originkit defaults must be recoloured to these tokens.

## 5. Typography, spacing, and geometry

- Start with the existing readable sans; no reference font is automatically
  selected. Wordmark is display artwork with a semantic DOM identity alongside.
- Review an expressive scale and deliberate overlap in the actual composition.
  The previous 40–72px headline and 1200–1280px content widths are inherited
  starting references, not caps that force a static small-column hero. Keep
  result/engineering reading widths comfortable; art may extend beyond them.
- Reserve mono for identifiers/aligned values; avoid random serif italics,
  agency-style all-caps captions and negative kerning used to mimic a template.
- Use a coherent spacing scale and optical alignment. Intentionally spaced
  breathing room differs from copying Freeland's empty spacer sections.
- Keep essential text outside rotating/scaling/blurred canvases. Foreground card
  snippets may be illustrative previews; full result and controls stay real DOM.
- Corners/edges must serve the artifact: square dossier references are retained,
  but source radii (5px/16px) are not requirements. Review the family together.
- Remove the source components' 1200×800 minima and inherited 900px card floor;
  fit the available stage, preserve zoom and existing readable narrow-screen flow.

### Additional CSS/design technique register — 17 November

The owner supplied ten further tips and authorised research, deduplication and
selection. These are technical review dispositions, not approval of a new
aesthetic, component, palette or implementation. Existing U/M checklist IDs
remain; C01–C10 track these inputs without adding phases.

| ID / input | Existing coverage or observed code | Disposition for Marketing OS |
|---|---|---|
| C01 Nested rounded corners: inner radius = outer radius minus padding | U14 already records this; the dossier direction uses square corners | KEEP as a conditional geometry check. For concentric corners use `max(0, outer radius - total inset)`, including applicable border width/padding/margin. Unequal insets need per-corner/per-axis treatment. N/A for square corners; no reason to round the site |
| C02 Alpha borders instead of solid hex borders | Phase 3 already uses `color-mix(in srgb, var(--ink) 24%, transparent)` for `--rule`; other borders are intentionally solid | REFINE: translucent ink can soften decorative separators. Hex is a notation, not the cause of ugly borders; it can also encode alpha. Keep strong CTA/control/focus boundaries where needed. Check actual composited contrast over paper, graphite, fills and scene backgrounds; do not lower every border's opacity |
| C03 Prefer OKLCH to HSL | No authoring policy yet; exact palette tokens are established | KEEP as a useful authoring/evaluation method: perceptual lightness/chroma is generally easier to adjust consistently than HSL lightness. Existing hex tokens remain valid and visually unchanged. No mandatory token migration, new palette or shade ladder; perceptual lightness does not prove WCAG contrast |
| C04 OKLCH for grey gradient midpoints | Gradients are not an adopted page-background style | CONDITIONAL: if a justified gradient is used, compare explicit Oklab/OKLCH interpolation and hue path; inspect intermediate chroma, gamut and readability. One keyword does not fix every colour pair. This concerns interpolation, not data compression. No decorative gradient is required; alpha-mask gradients are a separate use |
| C05 Match icon stroke to font weight | U12 covers consistency; Phase 3 pairs 20px, 1.5-stroke role icons with bold labels | KEEP and strengthen optical review at actual size, with one icon family and role-based stroke choices. Font weight and SVG stroke width have no numeric equality. Review that current thin-icon/bold-label pairing rather than assuming it passes or fails automatically |
| C06 Fade carousel edges with a mask | M18 covers masks generally; clockwise agent gallery is selected; a separate autoplay carousel is not | CONDITIONAL on a useful horizontal track existing. An alpha mask can fade its edges over varied backgrounds. Keep active items, readable labels, arrows and keyboard focus clear of the fade or scroll them into the clear region. Evaluate depth/occlusion before edge masks; do not mask readable results or focus targets |
| C07 Blur during icon swaps | M19 already records crossfade/scale, with blur optional | ALREADY COVERED / OPTIONAL for genuine state changes. Preserve accessible name, focus, hit area and correct final state during interruptions. Prefer a simple swap/crossfade where clearer; omit blur under reduced motion and review readability/paint cost |
| C08 Lighter surfaces for elevation in dark mode | Agreed page is light paper; dark theme is not selected | OUT OF CURRENT SCOPE. Tonal separation is valid in a dark theme, not a universal replacement for shadows. Retain as future reference only; no dark theme, extra surface palette or mandatory shadow removal |
| C09 Replace mobile `100vh` with `dvh` | Phase 3 preview/study and legacy deck contain `100vh`; native mobile flow is required, but unit choice was not explicit | KEEP with a choice per component: `dvh` fits changing visible height; `svh` provides stable height with browser controls expanded. Prefer stable/content-driven sizing for the mobile hero/study; consider dynamic sizing for a viewport-filling panel. Use `min-height` where content must grow, include header/safe-area insets and appropriate fallback; no blind global replacement |
| C10 Multiply white-background product shots | Multiply already appears in the graphite overlay, not an adopted product-shot treatment | CONDITIONAL for a suitable decorative image. White blends into the underlying surface, but every other pixel also multiplies/darkens; inspect off-white/coloured/translucent content. Prefer a proper transparent export where possible, isolate blend scope and preserve original assets. Keep evidence/product screenshots faithful and essential text outside the blend layer |

These refine the existing direction, not ten effects to display. Review
applicable items in Phase 3 discovery, Phase 4 comparison, Phase 5–Phase 8 scene/viewer,
Phase 9 route integration and Phase 10/Phase 11 content/console; check cumulatively in Phase 12. Geometry/icon/border/
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

## 6. Sitewide architecture and component system

Use semantic React content and controls, spatial DOM/CSS cards, original
prepared artwork and Canvas2D where it earns its place. The current Vector and
Spider direction uses local pointer decoration. Set aside animated SVG, a
separate slider, WebGL shaders, physics and live 3D. Detailed ownership is in
animation §8 and blueprint §10.

### Composition and section boundaries

Read the page as opening → quiet introduction → orbit → clicked dossier →
normal-flow workflow/results → compact cases → closing. Use our own original
composition while drawing on [Strata's source study](/workspace/reviews/WEBSITE_REFERENCE_STUDY.md#2-strata-studio)
for separate scroll sections, readable text hierarchy and depth.

- **Opening composition.** Keep the name at the current hero scale. Use a
  lower main headline and a short upper-right explanation as the framing
  proposal. Primary **Open console** and secondary Spider **Explore the agents**
  share tokens and alignment. Draft wording for evaluation: “Find your angle
  before you launch” and “Five specialists turn a company brief and competitor
  evidence into recommendations for your launch.” Marketing Helper is a
  working label; lock final copy and name at review.
- **Quiet introduction.** Use one stronger line and one subdued follow-up,
  both readable on dithered paper. Explain the connection between
  recommendations, evidence and human judgment in a few lines. Give the section
  enough space to read before the gallery. Compare a light scroll-linked glide
  in ordinary flow with a short local overlap at the orbit boundary. Keep
  the quiet intro and direct gallery entry in both versions.
- **Gallery and dossier.** Give the foreground agent a readable contemporary
  work artifact and clear label. Click to reveal the brief and result; use
  a separate **How it works** control. Treat all five artifacts as one family
  with shared typography, spacing and surface rules.
- **Results.** A workflow panel can switch among brief, sources, recommendation
  and review using real product states. Give one genuine result a featured
  reveal. For each case card, show a company, a short headline and one or two
  lines. Open supporting detail on demand. Reserve the final section for a
  console action and dotted brand close. Pricing is outside the product story.

| Component | Current role / disposition | Owner phase and state requirements |
|---|---|---|
| Main button | Open console is the primary action; reuse the same button scale, padding and focus conventions | Phase 3/Phase 11: semantic route, contrast, keyboard entry and authenticated handoff |
| Secondary buttons/links | Explore the agents uses the Spider interaction and steps directly into the orbit; ordinary controls use restrained feedback | Phase 3/Phase 9: stable target, direct entry and fallback |
| Dropdown | Real workflow/agent/model options where supported | Phase 4/Phase 11: labelled keyboard selection and honest availability |
| Speed dial | Omit without a demonstrated frequent-action need | Not a promised feature |
| Modal/viewer | One shared stage; use inline by default as recommendation, modal only if demonstrated useful | Phase 5/Phase 8: close/Escape/return focus; modal focus containment if chosen |
| Swap | Genuine icon/status changes only | M19/C07 optional; final state, name and focus remain correct on interruption |
| Theme controller | No second theme selected | Omit; keep light palette |
| Data display | Purpose/brief/result first, relevant risk/review, optional evidence | Phase 3/Phase 4/Phase 10/Phase 11: real data, long/empty/error states |
| Avatar | Stable specialist identity, not invented human persona | Phase 3–Phase 8: one visual family, real role labels |
| Badge | Only meaningful example/actual review/execution context | All phases: no filler/live-pill decoration |
| Dossier card | A focused preview shows a readable role and contemporary artifact. Clicking opens the dossier. How it works sits inside that opened state | Phase 3/Phase 8/Phase 9: focused, opened and playback states are distinct |
| Carousel/gallery | Five-agent circular/spiral discovery selected | Phase 3: direct selection, read-only, no autoplay requirement; extra content carousels omitted |
| Chat bubble | Real user/specialist thread and pending/error/result | Phase 11: preserve isolation, source context, long text and history |
| Collapse | Optional sources/rationale/FAQ only where useful | Phase 3/Phase 10/Phase 11: native disclosure, keyboard and retained context |
| Countdown | No showcase use | Omit fake urgency/wait percentages |
| List | Role access, history, sources and memory | Phase 3/Phase 4/Phase 11: stable order, selected/empty/error and focus |
| Stat | Attributable evaluation/product value only | Phase 10: real methodology, no agency awards/clients or generated counters |
| Status/table | Actual risk, human review, comparable fields and saved history | Phase 4/Phase 10/Phase 11: text plus colour, headers, no fabricated ranking |
| Text rotate | No need for changing slogans | Keep message stable; coordinated selected-agent content is not slogan rotation |
| Documentation nav | Actual engineering sections/evidence anchors | Phase 10: ordinary links, browser back, no fake terminal breadcrumbs |

Build one component sheet across showcase, comparison, evidence, login and
console. For each retained component define actual data/action binding, palette,
type/spacing/icon weight, relevant rest/hover/focus/press/selected/disabled,
loading/empty/error/success states and reduced-motion/failure treatment. Mark
irrelevant states N/A; do not implement every component just to fill the table.

### All-phase counterpart contracts — owner standing instruction, 18 November

At each milestone open the matching [blueprint phase row](MARKETING_OS_BLUEPRINT_PLAN.md#phase-to-specification-and-verification-table)
and the phase's [milestone sequence](MARKETING_OS_BLUEPRINT_PLAN.md#milestones-for-every-phase).
Before building, use this file to check user purpose, placement, hierarchy,
shared tokens, component and data states, and input/accessibility. Identify
the accepted layout to inherit and the design artifact the next phase needs.
Use the study's cited section when a concrete visual or interaction question
needs evidence. Save frames and the requirement IDs they prove. At M5 reconcile
all 39 original design checks against the cumulative candidate.

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

| Phase / linked contract | Design, visual treatments and state requirements | Evidence required in the phase audit |
|---|---|---|
| [Phase 0: Reference synthesis and decisions](MARKETING_OS_BLUEPRINT_PLAN.md#phase-0-completion-contract) | Record current palette, art/motion direction, components, retained/rejected trends and 39-check expectations across all phases; keep genuine unknowns bounded. | Document/source/decision consistency and owner direction; no fabricated runtime test or paid capture. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 1: Functional baseline](MARKETING_OS_BLUEPRINT_PLAN.md#phase-1-completion-contract) | All role controls, forms, history/review and error/empty/loading surfaces remain honest, readable, consistently styled and accessible. | Browser login, all agents, chat/memory, triage/digest, history/review/new decision, export/logout and API/session regressions. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 2: Data and saved examples](MARKETING_OS_BLUEPRINT_PLAN.md#phase-2-completion-contract) | Actual product/brief/result and optional sources stay attributable; no fabricated metrics, decorative diagnostics or inconsistent example presentation. | Adapter/null/legacy/source/recording hashes and read-only selection/network checks; controlled fixtures distinct from genuine captures. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 3: Opening and discovery](MARKETING_OS_BLUEPRINT_PLAN.md#phase-3-completion-contract) | Product opening and quiet intro before five-agent orbit; current-scale pointer Wordmark, primary console and secondary Spider Explore, sitewide dither, clicked dossier and distinct explanation handoff | Actual frames and motion; data, rapid input and failure tests; all 39 checks and the full phase gate |
| [Phase 4: Visitor comparison](MARKETING_OS_BLUEPRINT_PLAN.md#phase-4-completion-contract) | Two real-role comparison entries inherit gallery/dossier identity, useful task/brief/results, readable fields, intentional spacing, controls and all design checks. | Empty/one/two/replace/long/missing comparison states, direct return, keyboard/focus and network/write assertions. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 5: PR 2D proof](MARKETING_OS_BLUEPRINT_PLAN.md#phase-5-completion-contract) | Two original 2D compositions for the checkpoint and separate review. Shared art and readable source/result states. | Inspect key stills, labels, field bindings, asset readiness, fallback, resources and comparison regressions. All 39 U/S checks and applicable V/C/A/M/P checks accounted for. |
| [Phase 6: PR animated scene](MARKETING_OS_BLUEPRINT_PLAN.md#phase-6-completion-contract) | Preserve the accepted pilot/art/UI identity and truthful useful result; risk and review routes readable without motion; check every design item. | Actual owner motion review, mid-load/play close/switch/preference/failure tests, replay read-only and full gate. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 7A: Branding scene](MARKETING_OS_BLUEPRINT_PLAN.md#phase-7a-completion-contract) | Original positioning artifact and source-backed brief/result, consistent card/thumbnail/art/spacing/palette and meaningful role distinction. | Branding-specific attribution and scene/compare handoff, owner review, all 39 design checks and independent full gate. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 7B: Social scene](MARKETING_OS_BLUEPRINT_PLAN.md#phase-7b-completion-contract) | Original editorial artifact, explicitly supplied/simulated signal and useful recommendation; same design system and readable evidence. | Signal provenance, original card/stage story, no unsupported action, all design checks and independent full gate. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 7C: Product Marketing scene](MARKETING_OS_BLUEPRINT_PLAN.md#phase-7c-completion-contract) | Original fact/comparison artifact with exact supported values/units, meaningful result and consistent art/type/spacing; no fake prices or absence claims. | Exact source/unit/availability attribution, no fake computation, owner review, all design checks and independent full gate. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 7D: Field Events scene](MARKETING_OS_BLUEPRINT_PLAN.md#phase-7d-completion-contract) | Original brief/plan artifact and real contextual output with the same family of card/scene/result surfaces and all design checks. | Recommendation attribution and no implied execution, owner review, separate full gate and retained prior-agent regressions. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 8: Joined exploration](MARKETING_OS_BLUEPRINT_PLAN.md#phase-8-completion-contract) | One coherent gallery/dossier/comparison/viewer/evidence flow; real data, stable component treatment, no duplicate directory or conflicting art family. | Discover/compare/open/inspect/close/back through each agent under rapid input/asset/preference failure, read-only plus full gate. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 9: Production choreography](MARKETING_OS_BLUEPRINT_PLAN.md#phase-9-completion-contract) | Finish the accepted section glides, navigation expansion or link treatment, hover behavior and footer across the journey. | Verify pointer, keyboard, tap, Escape, scrolling forward/reverse, direct entry, focus and fallbacks. All 39 U/S checks and applicable V/C/A/M/P checks accounted for. |
| [Phase 10: Evidence and claims](MARKETING_OS_BLUEPRINT_PLAN.md#phase-10-completion-contract) | Concise real-company case previews with readable detail, accurate engineering and source-backed claims. | Review copy at page scale, case/profile and source attribution, labels, links, migration and fresh capture evidence. All 39 U/S checks and applicable V/C/A/M/P checks accounted for. |
| [Phase 11: Console and login](MARKETING_OS_BLUEPRINT_PLAN.md#phase-11-completion-contract) | Shared typography/palette/padding/icons/buttons/lists/tables/chat/status/forms; actual loading/error/empty/retry and all 39 design checks. | Every run/chat/triage/digest/history/review/export/login/logout state, provider/auth failures, actual APIs and full gate. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 12: Devices, accessibility, performance](MARKETING_OS_BLUEPRINT_PLAN.md#phase-12-completion-contract) | Complete deferred mobile/touch/zoom/long-text art/layout, readable pair comparison, all role states and consistent graphite/dither/loader treatment. | Named desktop/mobile widths, real-browser/manual+a11y evidence, every effect and all common workflows/checklists. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 13: Combined acceptance](MARKETING_OS_BLUEPRINT_PLAN.md#phase-13-completion-contract) | Audit the whole site and every 39-check item, original art, palette, spacing, icon/copy/claim and actual-product presentation; owner acceptance. | Fresh full showcase→console user simulation, all agents/workflows/error/security cases, exact final revision and release evidence. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |
| [Phase 14: Deployed acceptance](MARKETING_OS_BLUEPRINT_PLAN.md#phase-14-completion-contract) | At the explicitly chosen real host, retain actual content, assets/typography/surfaces/control semantics and all original design requirements. | Only after deployment request: actual URL smoke, persistence/session/proxy/security and complete product/design workflow. All 39 U/S checks and applicable V/C/A/M/P checks accounted for; no inferred PASS. |

Graphite/dithered imagery and genuine pixel loading are project-wide treatments:
create/review them at their owning phase, then maintain them consistently in
later comparison/scene/route/evidence/console/device/release phases where relevant.
A feature need not be rebuilt in every phase; preserving/testing its accepted
behaviour is a concrete obligation. Rejected/superseded treatments must propagate
to every affected use. Actual placement/intensity/art still needs evidence, not
a silent N/A or a blanket claim that every optional trend is mandatory.

### Phase 3 design counterpart — revision 7, 18 November

Read together with the [Phase 3 blueprint ledger](MARKETING_OS_BLUEPRINT_PLAN.md#phase-3-completion-contract)
and [animation counterpart](ANIMATION.md#phase-3-animation-counterpart--revision-7-18-november).
The current connected draft is the revision starting point. Earlier routed
experiments and art captures are historical evidence. The new sequence,
pointer Wordmark, gallery and dossier need a fresh review. The 19 November
M1 feedback supports the type-led opening and confirms the visible top links
Agents, Results and How it’s built. The owner rejected the displayed wheel
treatment and supplied Orbit Sphere for the gallery form and Moss Island
for visual depth. Three-dimensional tile placement is the M3 prototype
direction. Try original work images associated with stable agent identities.
[Clip study](/workspace/reviews/WEBSITE_REFERENCE_STUDY.md#orbit-sphere-and-moss-island)

The integrated candidate carries the accepted opening into a quiet
intro and a 25-image shell. The dossier opens from a tile or the named
five-role controls. Its result and evidence stay in readable DOM text.
See the audited 39 original checks and checked wide/narrow layouts.
[Phase 3 candidate](/workspace/reviews/phase-3-final/completion-audit.md)

| Shared IDs | What to demonstrate in design | Evidence for review |
|---|---|---|
| P3-01/P3-02/P3-07 | Opening and quiet intro have distinct space and trial a reversible glide. Gallery is third, with five contemporary role artifacts and a normal results exit | Compare the rendered handoffs and check five focal poses, one clicked dossier and the gallery exit |
| P3-03/P3-04 | Open console leads, Spider Explore remains usable, and the wordmark is the original-scale first-screen name with pointer-local guides | Actual pointer and keyboard behavior, crisp text, rest/near-letter/exit frames and contrast checks |
| P3-05 | Existing Phase 3 dither appearance carries across the website | Samples of opening, intro, gallery, results and closing. Check text, focus and evidence edges |
| P3-06 | In-stage real pending, readable failure and retry, normal navigation | Slow/failure/ready observations and cached replay |
| P3-08–P3-11 | Scroll focus, clicked information and separate How it works; coherent spacing/tokens; short case previews; retain the selected visible top links and scoped hover treatment | Clear hierarchy, stable targets, keyboard/tap, result/source binding and readable long/missing values |
| P3-12–P3-15 | Static text and controls, reduced motion, failure and resource bounds, read-only results | Actual failure, preference and network tests |
| P3-16–P3-18 | Current full product gate, completeness audit, code review and owner acceptance | Technical results and owner review of the actual revision |
| U01–U20/S01–S19 | Apply all 39 original checks to affected screens | Per-item evidence in the blueprint; historical results stay distinct |

Review opening and intro before committing to orbit composition. Shortlist
five explanation patterns by real role, with component references, use and
fallback. The later scene phases choose and validate each pattern. Compare one
concrete clicked role against the actual hero and intro together. Carry
accepted decisions through comparison, the PR pilot, other agents, results
and console as each phase is built.

### Supplied Originkit sources — selected use, adaptation still required

**Vector Wordmark.** Render the working or approved name as first-screen
text at its current scale. Match the supplied E/C example's behavior: when the
pointer approaches the letterforms, nearby edges become dotted, dashed guides
connect to outlined squares, and coordinate numbers appear in those squares.
The marks follow the pointer within the wordmark region and settle to crisp
resting type on exit. Keep the effect local to the name. Page scroll advances
the document into the quiet intro. Use the supplied Originkit source as the
behavior reference and retain semantic text, palette adaptation, responsive
sizing, reduced-motion/failure fallback and lifecycle cleanup. Implement the
local overlay with CSS or Canvas2D under the current renderer choice.

**Spider Button.** Explore the agents is the secondary opening action. The
source uses a WebGL pill and a Canvas2D decoration. Use the existing bounded
Canvas2D direction or a CSS equivalent for our own local response. Keep a
stable link area, ink/paper contrast, focus state and a usable plain action
during asset failure or reduced motion. Verify reuse terms for both components.

### Navigation and footer

Keep **Agents**, **Results** and **How it’s built** visible in the desktop
header and keep **Open console** visible. The M1 storyboard established
the direct-link choice. Use stable targets, a short hover underline, visible
focus and resting labels across the header, Spider and agent cards. Phase 9
carries that header through the finished page and verifies link and focus
destinations. [Navigation and hover research](/workspace/reviews/WEBSITE_REFERENCE_STUDY.md#phase-motion-and-case-study-research)

The closing follows Strata's functional hierarchy in our own layout: **Bring
a brief**, a real console action, an oversized dot-matrix rendering of our
name and a short set of useful links. The dot wordmark is a separate footer
visual with a static equivalent, distinct from the pointer-sensitive hero
wordmark. Phase 9 owns its production composition and continuity. Use the
existing dither and ink/paper palette through the close.

### Placement decisions and remaining visual work — 18 November

The confirmed placements are the pointer-local hero wordmark, primary console
and secondary Spider action, quiet introduction, third-section orbit, clicked
dossier and separate How it works. Keep pixel loading inside actual pending
visuals and reuse Phase 3 dithering across the website. The final name,
gallery proportions, role artifacts and role-specific component details are
open for storyboard/visual review. Complete the
[execution guide's placement record](PHASE_EXECUTION_GUIDE.md#4-placement-and-behaviour-record-for-every-chosen-technique)
before implementing each effect.

### Original asset production and review

For each agent produce a card-face brief: role, real example ID, recognizable job,
focal artifact, silhouette/depth, palette roles and readable DOM counterpart.
Use original prepared illustrations/renders where appropriate. Prepared art
may carry lighting/detail; actual inputs/results/controls remain editable DOM.
A baked screenshot is neither a running interface nor a live inference trace.
Maintain one art family across discovery, comparison thumbnails and the 2D
explanation; review a common reference frame before scaling to all five.

Review arrival/first-movement/expanded-stage compositions and actual motion.
Exact type, art, depth and wordmark location are bounded review items. A static
box illustration plus yellow CTA does not satisfy the motion-led direction.
Desktop review comes first; preserve baseline mobile usability without requiring
new bespoke mobile stills before the desktop prototype.

## 7. Visitor-facing agent comparison

Choose two agents from the same five-role discovery; do not build a second
unrelated directory or a fictional intelligence leaderboard. Spatial position,
active agent, the comparison pair and playback state are distinct states.
Selection must remain explicit when cards overlap or move.

| Field | Useful comparison content |
|---|---|
| Specialist / useful when | Real role and suitable business task |
| Brief | Attributable example input; use a common scenario only where genuinely comparable |
| Result | Useful excerpt and access to complete saved output |
| Evidence | Optional source-linked support, not primary diagnostic metadata |
| Risk/review | Actual recorded need/state; a risk flag is not human approval |
| Open | Choose which compared agent occupies the single shared scene stage |

Add/remove/replace/open actions are familiar, labelled and keyboard operable.
Use restrained shared-object/state transitions so the chosen agent is traceable
from gallery to comparison to scene. Preserve pair, active ID, scroll and focus
on return. Keep the comparison readable without playback; no simultaneous
running machines. Blank/one-selected states should explain the next action,
not invent results or hard-block ordinary exploration.

Comparison never invokes triage, generation, review or memory writes. No
noncomparable model timings as speed rankings. New mobile arrangement is Phase 12;
retain readable fallback now. Verify rapid replacement, closing mid-transition,
keyboard, long/missing values and returning to the correct gallery item in Phase 4/Phase 8.

## 8. Role-specific 2D explanations

A card click opens the dossier. **How it works** intentionally starts the
selected role's explanation within the shared stage. Use paper, ink and yellow
consistently. Show a useful result in readable DOM, with a static version of
each explanation and one active playback at a time.

| Role and phase | Visual candidate to validate | Meaning the visitor should get |
|---|---|---|
| PR & Policy, Phases 5–6 | A claim and its evidence meet a labelled checkpoint. A review branch and result appear in distinct rows | Understand the risk and who makes the human decision |
| Branding, Phase 7A | Show brief and evidence alongside a selected positioning line | See how the audience and differentiator inform the wording |
| Social Community, Phase 7B | Reveal a supplied signal beside the suggested post or response outline | See what the signal supports and the recommended response |
| Product Marketing, Phase 7C | Align a supported comparison row with the product message it informs | Connect the exact fact and units to a practical claim |
| Field Events, Phase 7D | Compare published agendas and event formats, then highlight the positioning recommendation | See the evidence behind the suggested audience, format or topic |

Phase 5 compares two 2D layouts of the same PR story using the actual field
bindings. Review a start, a checkpoint and a result, along with missing data
and asset failure. Phase 6 adds the timed sequence. Phase 7 reviews each
distinct component and role outcome before scaling. The shared stage, controls
and dithered art family carry across comparison and exploration.

## 9. Background research — all 22 inputs retained

All 22 owner inputs are retained as an inventory, not a requirement to fill the page.
Freeland/Strata/Antimatter update composition and motion, not these owner choices.
All dispositions are research assessments. The original six-candidate shortlist is retained, but the owner's 15 November feedback now prioritizes speckled graphite. No combination of six backgrounds is required.

| ID | Original background | Research disposition |
|---|---|---|
| B01 | Fall texture | Meaning/reference unclear; keep pending rather than invent an interpretation |
| B02 | Fluted glass | Set aside for the dossier UI; distorts text and requires another material language |
| B03 | Thermal gradients | Set aside under the reference palette; new heat/colour semantics are unexplained |
| B04 | Water ripples | Set aside as a page background; no current product purpose |
| B05 | Speckled graphite | OWNER SELECTED STARTING DIRECTION: subtle speckling on the light paper page; compare with plain base. Exact grain scale, asset and intensity remain for review |
| B06 | Single-hue landscapes | Set aside; no established link to the agent workflow |
| B07 | Blueprint grids | EARLIER SHORTLIST, NOT SELECTED: sparse construction structure around technical scenes |
| B08 | Halftone | EARLIER SHORTLIST, NOT SELECTED: restrained printed-dot treatment |
| B09 | Grainy gradients | Set aside as gradients; compare plain static grain separately |
| B10 | Grass texture | Set aside; unrelated material/narrative |
| B11 | Dithered images | Reuse the existing Phase 3 dither character across site surfaces. Apply it to visual layers and protect body and evidence contrast |
| B12 | Paper texture | EARLIER EARLIER SHORTLIST, NOT SELECTED: a comparison/reference surface, no longer the first owner research task |
| B13 | Contour lines | EARLIER SHORTLIST, NOT SELECTED: restrained framing/outline treatment, not topographic wallpaper |
| B14 | Cloud sky | Set aside; could make this appear to sell cloud hosting rather than show marketing agents |
| B15 | Pixel mosaics | Set aside for the page; could compete with a miniature scene |
| B16 | Lens distortion | Set aside for readable/interface surfaces |
| B17 | Stippled gradients | Set aside as gradients; sparse static stipple is an alternative texture, not another layer to stack |
| B18 | Square dot grids | EARLIER SHORTLIST, NOT SELECTED: static spatial structure |
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

The signature is now spatial clockwise discovery plus role-specific 2D explanations.
The trend list supports that story; it does not replace it or mandate a library.

| ID | Original trend | Research disposition |
|---|---|---|
| T01 | Dithering | OWNER CONFIRMED: retain the Phase 3 treatment sitewide. Review its compositing alongside any graphite and preserve crisp evidence text/charts |
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
| 1 | Cream backgrounds | `warm paper editorial website typography` | Does the reference surface support readable text and readable explanation artwork? This is colour research; paper texture is surface research |
| 2 | Pretext/text wrapping | `responsive headline text wrap balance typography` | Can natural/balanced wrapping solve the composition? Establish what “Pretext” refers to before evaluating a package |
| 3 | Useful animated process diagrams | `interactive process diagram source evidence decision animation` | Can a few objects/routes explain the actual workflow and support the role explanation? |
| 4 | Dithering | `restrained monochrome dithering graphic design` | Does one deliberate asset treatment add identity without introducing noise? |
| 5 | Pixel loaders | `accessible pixel loading indicator reduced motion` | Is this better than a simple pending indicator for our actual console request? No fake progress or simulated stages |

The current decisions are **existing Phase 3 dithering across the website**
and **pixel loaders inside real loading stages**. Do not require more cream-background, wrapping, or flowchart-image searches. The defining experience combines spatial scroll-led discovery and the role-specific 2D agent explanations; precise treatments are tested before final adoption.

## 11. Design-review checklists

Use these items when defining and building each evolving phase, then audit every item after implementation and again at final acceptance. Copy the actual applicable requirements into the active phase ledger; do not leave them as a forgotten final checklist. All items below are initially unchecked. Record PASS, FAIL, or N/A with evidence. If a functional exception is proposed, explain it for owner review instead of silently retaining the pattern or banning a necessary control.

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

### C. Sitewide reference-application checks

- [ ] V01 Arrival, discovery, comparison, scene, evidence and console share a coherent identity.
- [ ] V02 Depth comes from intentional art, perspective, overlap/light and timing, not generic box icons or dependency count.
- [ ] V03 All five roles are discoverable and readable; foreground position, selection and comparison state are explicit.
- [ ] V04 Layout 3→1 is demonstrated as connected motion, with direct Explore access.
- [ ] V05 Spider's target/focus remains usable; Wordmark has semantic text and a reviewed location.
- [ ] V06 Prepared imagery, live geometry and real DOM results/controls are correctly distinguished.
- [ ] V07 Normal document and bounded pinned stages work without an endless scroll tunnel.
- [ ] V08 Hover, scroll, playback and result transitions do not compete or lose context under interruption.
- [ ] V09 No reference palettes, fake clients/stats, terrain, botanical identity, timer-percentage loader or idle drift sneaks in.
- [ ] V10 Every visual has a useful static/reduced-motion/failed-asset presentation.
- [ ] V11 Payload, frame pacing, hidden/offscreen work and resource cleanup are measured per subsystem.
- [ ] V12 Actual desktop motion and all affected functional paths are reviewed; deferred mobile polish is recorded honestly.

U13/S05/S08 do not mean remove the expressive motion the owner wants. Remove
unjustified clutter while retaining a coherent, ambitious animated composition.
No checkbox is checked merely because these requirements were written down.

## 12. Data, language, and engineering truth

- Populate telemetry from actual records. Mock calls show no fabricated token usage/provider latency; missing values say unavailable. Show configured and provider-reported model identities accurately.
- History reads the complete stored `result`, with a truthful legacy state. Reviews come from the server and belong to one decision. Preserve the original escalation flag.
- A result's `knowledge_units` summary is not automatically the retrieved corpus. Show source detail only when it was actually captured and linked to the request.
- Distinguish one-agent routing, two-agent triage, and five-agent digest. No automatic five-agent swarm animation for every request.
- Do not claim “zero hallucination,” tamper-proof approval, continual monitoring, real social listening, a scheduler, or actual policy-driven rewriting without code and evidence.
- “Recorded,” “live,” “mock,” “simulated,” and “fictional client” describe different things. Choose concise visible wording without burying it in an unreadable badge pile.
- Counts come from the relevant data/report. Do not turn the 75-row mixed target/competitor seed into a claim of 75 competitor facts.
- Avoid unnecessary implementation jargon in the ordinary console task flow. Put engineering detail in an intentional inspectable layer.

Phase 2 implementation: `presentation.js` normalizes run/chat/triage/digest/history and supplies six-station scene bindings without mutating raw snapshots. One-shot generated summaries, request-captured full rows, chat fact excerpts, per-specialist triage scopes and digest corpus links stay distinct. Missing IDs, measurements, flagged phrases and review events stay unavailable. `exampleCatalog.js` accepts only complete live catalogs and matching-file checksums; checksums establish consistency, not independent provider authentication or claim entailment. Physical comparison/scene UI and the final design system remain later work.

The presence of fields in an internal presentation model is not a requirement to
render them publicly. The owner-approved information hierarchy above governs
visibility. Capture/test dates, quota/debug notes and operational metadata remain
verification material; the separate engineering section explains the system
without becoming a capture-log or troubleshooting panel.

The five saved examples use the seeded local source corpus, not a fresh web crawl. Inspection found some navigation/cookie text in retrieved rows and unsupported inferences that H100 evidence establishes a competitor's full hardware limits. At the Phase 2 revision, a visible caveat disclosed those issues. The subsequently approved direction requires correcting the underlying issues before promoting these examples as finished public results. Preserve the original snapshots; Phase 10 still owns the broader content/proof audit. Phase 2 PASS does not certify model quality or source entailment.

### Visuals bind to facts, not reference-site pixels

Keep agent IDs and selected example IDs identical across foreground art, result,
comparison and stage. Prepared cards may contain illustrative snippets, but full
result text and controls remain real data-driven DOM. A backend event is not
inferred from a wipe, loader, packet path or highlighted station. Separate
source eligibility, citation presence and actual claim support.

Use real companies in new case studies, identified as demonstrations using
public evidence. Separate company facts, submitted brief, agent output and human
review. Show the company, a decision-led headline and one or two short lines
of recommendation. Provide one clear link to the profile, brief, result,
evidence and limits. Use the real company profile and brief to provide audience,
constraints and goals, including for Events. [Case writing research](/workspace/reviews/WEBSITE_REFERENCE_STUDY.md#phase-motion-and-case-study-research) Replace the old
case-specific source corpus and verify any changes with a tested
migration. Preserve historical captures and recapture the five genuine examples
from the validated company profile and researched evidence. The visual review
can use labelled storyboard fixtures while the separate source work is open.
Phase 3 repaired seeding and filtering and recaptured against the same original
corpus. Phase 10 owns new case copy and evidence and tracks the open replacement
with Phase 2 provenance. Bring the data work forward if a pilot depends on it.

## 13. Accessibility and comparison acceptance

- Use native text/actions as the base, enhanced by visual layers. No loader,
  initial opacity, canvas failure or broken image can hide the product/action.
- Separate decorative copies from accessible names; hide duplicate rolling text
  from assistive technology. Keep visible focus above transformed layers.
- Do not leave hidden rear-card duplicate buttons tabbable. Offer all five through
  stable semantic controls; manage active card focus deliberately on direct entry.
- Keyboard selection, close/Escape and back restore correct context. If a modal
  is chosen, contain focus; an inline stage must not introduce a false focus trap.
- React to reduced-motion changes at runtime: bypass spatial travel/auto movement,
  preserve selection/results and stop unnecessary effect loops. Asset or graphics
  failure has a readable fallback.
- Test zoom/long text, contrast over composited textures, overlap/occlusion,
  sticky headers, resize mid-transition and rapid selection. No essential hover,
  camera dragging, sound or scroll-trapping interaction.
- Desktop craft is current priority. Preserve existing mobile/native flow now;
  bespoke touch layout, Safari viewport and lower-capability treatment are Phase 12,
  with deferred evidence recorded rather than falsely passed.

## 14. Decision and reference log

### Current sitewide revision — 18 November

The [website study](/workspace/reviews/WEBSITE_REFERENCE_STUDY.md) is integrated
throughout these 16 sections and the blueprint/animation specifications.
Freeland is a supplied settings/Q&A report, Strata includes supplied excerpts,
Antimatter is a lower-confidence description. None was independently verified
as a full live site here; source values stay reference evidence, not our spec.

Retain the owner's palette and real product. The November 18 update selects role-specific 2D explanations. Revise
the whole experience to coherent spatial discovery, prepared/live asset roles,
explicit selection, clock ownership and reusable component states. Discard the
literal book/cheap boxes, earlier CTA hierarchy, stack-only discovery,
static-only Phase 3, globally pinned/WebGL assumptions and repeated generic research
as blockers. Exact current dispositions and phase impacts are blueprint §20.

Revision 7 in §§1–13 records the latest owner direction. The entries below
are dated history.
Earlier blocked capture and candidate recommendations are superseded by their
later results and §§1–13 above. Original logs are retained for provenance.


| Date | Decision | Source / status |
|---|---|---|
| 2026-11-18 | Owner confirms motion scope | Pointer-only hero, native clockwise orbit and sitewide dithering. Trial section glides, animated navigation and hover. Use role-specific 2D explanations and concise, source-linked real-company cases. |
| 2026-11-17 | Research ten additional CSS/design tips and deduplicate existing rules | C01–C10 in §5: retain/refine geometry, icon weight, border/colour and viewport checks; masks/blur/gradients/multiply remain conditional; dark-theme elevation is out of scope. Technical dispositions under the research request, not new aesthetic/implementation approval |
| 2026-11-17 | Owner agrees centred arrival → central agent stage, coordinated scroll and stable direct-entry CTA | Supplied wireframes 3 → 1; wireframe 2 is supporting reference. “Explore the agents” primary, “Open console” secondary; paper/ink/yellow roles retained. Revise Phase 3 visuals, preserve Phase 1/Phase 2 and functional Phase 3 work; storyboard review precedes replacement animation. Blueprint §18 |
| 2026-11-17 | Inspect supplied dial video and read Glaze/Lūmen reference briefs | User-supplied “Scroll-spun client dial with a needle and lens panel of each client's work.mp4” and two pasted prompts. Learn composition/motion discipline; exact assets, colours, fonts and implementation mandates are not adopted. No licensing or asset-reuse approval inferred |
| 2026-11-17 | Owner rejects current book-like Phase 3 motion/visual study | MP4 reads as a library/children's book, not the intended tech product; misses the supplied reference. Font/padding suggested as possible contributors. Visual realignment required before another substantial build or promotion; no new palette/material/typeface inferred |
| 2026-11-17 | Phase 3 candidate implemented; technical gate passes, visual review open | `/preview/f03` and `/preview/f03/motion`, application `9f0a3e7`; 349 backend, 55 frontend unit and 18 browser tests per mode. Desktop/mobile and plain/grain captures plus scroll clip in blueprint §17. No final aesthetic acceptance, promotion, new material or next-phase authorisation inferred |
| 2026-11-17 | Record connected landing-page scroll story and proceed with Phase 3 | Owner authorised a focused opening-to-PR-dossier motion prototype and page foundation. Small first movement precedes the larger reveal; no literal dial/glass/blue-fringe adoption. Concrete visual review remains required |
| 2026-11-16 | Purpose → short brief → visual explanation → useful result; optional sources/rationale; separate “How it’s built” section | Owner approved the researched recommendation. Public capture/test dates and quota/debug explanations are rejected. Documentation recorded; UI cleanup and example-quality correction remain pending implementation |
| 2026-11-16 | Phase 2 data/capture foundation PASS; five genuine Flash-Lite recordings | `0dc18d6`, full backend/frontend/browser gates recorded in blueprint section 15. Capture model explicitly selected under owner's lower-tier authorisation; final art direction and generated-claim quality remain separate |
| 2026-11-16 | Phase 2 data/capture implementation; retain genuine-public-example requirement | Implementation status, not a new owner design choice: upstream generation HTTP 402 blocks capture. No final palette, background, material or camera treatment implemented |
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
| 2026-11-15 | Phase 1 functional baseline verified at `d6c9973` | 323 backend tests, 29 frontend tests, 10 development and 7 built-app browser checks; scoped design audit in blueprint §13. No new art direction or scene acceptance inferred |
| Pending | Final product name, contemporary agent artifacts, exact orbit geometry and role-specific component selection; role-specific 2D compositions and timings | Bring concrete storyboard and rendered evidence before owner review |

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

Supplied website reports and component sources have been studied; their assets/code are not licensed or incorporated merely by that review. Keep new decisions synchronized across all three current files.

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

Scene staging, pose planning, readable solid forms, and overall appeal belong to the role explanations; do not turn them into extra UI chrome. Squash/stretch, windup, secondary movement, and exaggerated feedback remain selective techniques. Any approval/success display must follow actual server state.

Review these criteria alongside U01–U20 and S01–S19 at phase boundaries. Add new findings and decisions to the log rather than silently labelling these research recommendations as owner-approved implementation.

### Applying the reference lessons across the site

Staging/pose planning now covers arrival, depth bands, foreground dossier and
comparison return as well as clicked explanations. Fitts/Jakob apply to Spider's
stable action, direct agent controls, links and ordinary console forms. Hick and
Miller support readable pair comparison without forcing a new browsing mode.
Doherty requires immediate acknowledgement even while art/scene assets load;
it does not justify a fake loader. Solid form/appeal applies to prepared art and
CSS spatial cards too, not only mesh count. Review these in Phase 3–Phase 11, then Phase 12/Phase 13.

## 16. Narrowed visual direction and application decisions

| Treatment / earlier idea | Current disposition | Where to verify |
|---|---|---|
| Light paper with subtle graphite | The light palette remains. Use earlier plain/graphite samples as comparison evidence for the existing dither | Page/card/result readability and compositing in Phase 3/Phase 12 |
| Dithering/dithered imagery | Existing Phase 3 treatment throughout the website | Phase 3 opening/intro/orbit, Phase 9 results/closing, Phase 11 console and relevant later surfaces. Inspect contrast and shimmer |
| Pixel loader | Genuine asset/API waiting only; no timer percentage or fake reasoning | Phase 3/Phase 5/Phase 11 loading, error/retry and instant replay |
| Cream, text wrapping, useful diagrams | Existing base and implementation/explanation techniques | Typography and engineering explanation, no more image-search prerequisite |
| Renaissance, dark gradients, leaves/voxels, fake agency content | Rejected or unselected reference identities | Do not quietly bring them into any later phase |
| Stacked deck | Retain useful selection/continuity/history; supersede stack-only path with confirmed clockwise circular/spiral discovery | Phase 3, then Phase 8/Phase 9 integration |
| Prepared art | Adopt as a production option to craft depth, not a substitute for actual data/controls | Original art briefs, asset ownership, readable DOM and static failure states |
| Live 3D | Set aside with WebGL shaders, physics and dedicated SVG animation. Keep CSS depth for the orbit and use 2D for role explanations | Review the renderer choice and faithful static equivalents in Phases 3, 5–7 and 12 |
| Spider / Vector | Spider on Explore; Vector responds to the pointer on the current-size first-screen name | Verify both rendered interactions, fallback, lifecycle and focus |

Exact texture, card art, timing and composition are concrete review work, not
permission to reopen the entire colour/story discussion. The next implementation
is the desktop connected composition/motion prototype with the same original
art direction that later scenes, comparison and console will inherit. Review it
interactively through the local checkout and supplement with an actual recording.
Phase 1/Phase 2 remain retained; Phase 3 OPEN. No application changed by this specification.
