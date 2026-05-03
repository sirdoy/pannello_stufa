# Phase 182: Design System Reference Page v2 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-03
**Phase:** 182-design-system-reference-page-v2
**Mode:** `--auto --chain` — gray areas auto-resolved with recommended defaults
**Areas discussed:** Page architecture, Missing-primitive extraction, Section structure, Token-section content, Code snippets & copy, Tests, Italian copy contract

---

## Page architecture

| Option | Description | Selected |
|--------|-------------|----------|
| A. Single 2000+ LOC client component | Keep current single-file shape, add 8 new sections inline | |
| B. Decompose into per-section files under `sections/` | Route file becomes orchestrator, each section is its own client component | ✓ |
| C. New separate route `/debug/design-system-v3` | Leave Phase 174 page untouched, ship a parallel page | |

**Auto choice:** B — recommended default. Mirrors Phase 180's automations editor decomposition; keeps diffs reviewable and tests focused.
**Notes:** D-01. Phase 174 sections (01-04) are extracted in this phase too for uniformity — pure file-move, no behavioral change.

---

## Missing-primitive extraction

| Option | Description | Selected |
|--------|-------------|----------|
| A. Ship samples only of existing primitives | Note CircBtn + BigSlider as gaps, defer | |
| B. Extract CircBtn + BigSlider verbatim from bundle in this phase | Lift `cards.jsx:298` and `sheets.jsx:515` into EmberGlass; showcase | ✓ |
| C. Reimplement CircBtn + BigSlider with improvements (a11y, RTL, gesture) | Don't blindly port; modernize | |

**Auto choice:** B — recommended default. ROADMAP SC-#1 explicitly lists both as required samples; primitives must exist before they can be sampled. Bundle-verbatim port matches Phase 176/177/178 precedent.
**Notes:** D-05, D-06, D-07, D-08, D-09. Primitives are NOT consumed by production cards/sheets in this phase — wiring is a follow-up.

---

## Section structure

| Option | Description | Selected |
|--------|-------------|----------|
| A. Continue 01..NN numbered sections, append new ones | New sections continue from 05 onward; existing 01-04 untouched | ✓ |
| B. Restructure into thematic groups (Tokens / Cards / Sheets / Demo) | Drop the numeric prefix, use grouped headings | |
| C. Tabs/accordion top-nav | Each group is a hidden tab/accordion expanded on demand | |

**Auto choice:** A — recommended default. Preserves Phase 174 visual contract; designers can scroll top-to-bottom in one viewport.
**Notes:** D-10, D-11, D-12. New section ordering: 05/TOKENS, 06/CARDS, 07/SHEET-PRIMITIVES, 08/SHEET-GALLERY.

---

## Token-section content

| Option | Description | Selected |
|--------|-------------|----------|
| A. Static hardcoded values | Mirror tokens directly from `:root` with literal strings | |
| B. Live `getComputedStyle(:root)` reads | Display whatever the runtime resolves; correct against accent picker | ✓ |
| C. Token-name-only references | List `var(--accent)` etc. without resolving | |

**Auto choice:** B — recommended default. A typo or token rename would otherwise leave the reference page silently stale; live reads keep the page honest.
**Notes:** D-15. Spacing/radius scale uses hardcoded literal `0/4/8/12/16/20/24/28/32/40/48/64` derived from design bundle, with token-named entries showing both abstract name and resolved px.

---

## Code snippets & copy

| Option | Description | Selected |
|--------|-------------|----------|
| A. Plain `<pre><code>` + clipboard copy | No deps, simple, dev-only audience | ✓ |
| B. Syntax highlighter (Prism / Shiki) | Coloured snippets | |
| C. Live JSX playground (Sandpack / MDX) | Editable in-page | |

**Auto choice:** A — recommended default. Dev-only page; no need for visual or interactive richness. Matches Phase 174's no-new-deps posture.
**Notes:** D-04, D-18, D-19. Shared `<CodeSnippet>` component; 1500ms "Copiato" feedback; silent no-op if `navigator.clipboard` unavailable.

---

## Tests

| Option | Description | Selected |
|--------|-------------|----------|
| A. New separate Playwright spec `design-system-v2-primitives.spec.ts` | Isolate Phase 182 assertions | |
| B. Extend existing `tests/playwright/design-system-v2.spec.ts` via `test.describe` | Single contract suite per page | ✓ |
| C. Visual regression (Chromatic / Percy) | Screenshot-diff every primitive | |

**Auto choice:** B — recommended default. Phase 174 established the spec file; splitting forces consumers to grep two files. Recolor invariant (SC-#3) goes into the same suite.
**Notes:** D-20, D-21, D-22. Jest specs only for new primitives (CircBtn, BigSlider) + page section-mount assertions.

---

## Italian copy contract

| Option | Description | Selected |
|--------|-------------|----------|
| A. Page entirely English (developer audience) | Match component identifiers | |
| B. Italian visible copy + English aria/code | Continue Phase 174 convention | ✓ |
| C. Bilingual toggle | i18n preview baked in | |

**Auto choice:** B — recommended default. Phase 174 set the convention; cross-app locale toggle is a separate (deferred) effort.
**Notes:** D-25, D-26. Section eyebrows English (numeric prefix); titles + descriptions Italian.

---

## Claude's Discretion

- CD-01: Exact px sizing of section sub-blocks within Phase 174's visual envelope.
- CD-02: Order of primitives within Sections 06 and 07.
- CD-03: Exact JSX content of each code snippet (recommend realistic prop usage, not bare minimum).
- CD-04: Optional `vscode://` "view source" link per primitive — allow if trivial; skip if any complexity.
- CD-05: Optional sticky right-rail or top nav-pills — defer unless page becomes hard to scan.

## Deferred Ideas

- Phase 180 automations editor primitives reference page.
- Phase 179 rooms primitives reference page.
- `<BottomTabBar>` + `<AltroRow>` reference (page-shell singletons, not compositional primitives).
- Wiring `<CircBtn>` into actual card overflow buttons.
- Wiring `<BigSlider>` into Stove "Temperatura obiettivo" + Lights brightness.
- Token editor UI for spacing/radius/shadow.
- Live-edit JSX playground (Sandpack / MDX).
- Visual regression suite (Chromatic / Percy / screenshot diff).
- English locale toggle.
- Light mode primitive preview.
- TSDoc-driven prop tables.
