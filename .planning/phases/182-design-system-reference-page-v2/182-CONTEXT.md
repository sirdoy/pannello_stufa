# Phase 182: Design System Reference Page v2 - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning
**Mode:** `--auto --chain` — gray areas auto-resolved with recommended defaults grounded in ROADMAP.md SC-#1..#3, REQUIREMENTS.md DSREF-01..03, the existing 667 LOC `app/debug/design-system-v2/page.tsx` (Phase 174), the `app/components/EmberGlass/` namespace shipped across Phases 174-181, and the design bundle at `.planning/inbox/ember-glass-design/project/components/`.

<domain>
## Phase Boundary

Expand `/debug/design-system-v2` from its current Phase-174 form (hue picker + ambient toggle + splash demo + placeholder Sheet) into the **single source of truth reference page for every Ember Glass primitive shipped across Phases 174-181**. Concretely:

1. Existing route `app/debug/design-system-v2/page.tsx` is extended in-place — no new route, no rename, no companion page. The Phase 174 sections (hue picker, ambient toggle, splash replay, Sheet preview) **stay verbatim** (DSREF-03 explicitly requires the inline accent picker to remain).
2. New sections are added that document, with live samples + copy-paste-ready code snippets, every visual primitive used by the dashboard, sheets, rooms tab, automations editor, and bottom tab bar:
   - **Tokens** — accent + neutrals + tones (color swatches), typography pair (Outfit display + Inter body) with sample lines at every size/weight used in the app, spacing/radius scale (`--pad-card`, `--r-card` + harvested literals), shadow/blur values (`--glass-shadow`, `--glass-blur`).
   - **Card primitives** — `<GlassCard>` (Phase 177), `<CardHead>` (Phase 177), `<StatusDot>` (Phase 177), `<InlineToggle>` (Phase 177), `<CircBtn>` (extracted this phase from bundle), `<MiniStat>` (Phase 177), `<FlameViz>` (Phase 177), `<PlayingBars>` (Phase 177).
   - **Sheet primitives** — `<Sheet>` (Phase 175 — already partially demoed), `<SheetRow>`, `<Stepper>`, `<Slider>`, `<BigSlider>` (extracted this phase from bundle), `<RadialDial>`, `<SheetBtn>`, `<QuickActionButton>` (all Phase 178).
   - **Sheet launcher row** — small launcher buttons that open the real `<StoveSheet>`, `<ClimateSheet>`, `<LightsSheet>`, `<SonosSheet>`, `<PlugsSheet>` (Phase 178) so designers can preview each in context against the picked accent.
3. **Two missing primitives are extracted in this phase** because they appear in ROADMAP SC-#1 sample list but were deferred from earlier phases (BigSlider) or specified-but-not-implemented (CircBtn):
   - `<CircBtn>` — verbatim port of `.planning/inbox/ember-glass-design/project/components/cards.jsx:298-340` → new file `app/components/EmberGlass/cards/CircBtn.tsx` + barrel re-export. Phase 177 UI-SPEC line 70 already named the primitive ("`34×34` CircBtn (sheet-harvest primitive, not used on Phase 177 cards but defined alongside InlineToggle)") but the deliverable was never produced.
   - `<BigSlider>` — verbatim port of `.planning/inbox/ember-glass-design/project/components/sheets.jsx:515-595` → new file `app/components/EmberGlass/sheets/primitives/BigSlider.tsx` + barrel re-export. Phase 178 deferred this to Phase 179 (`178-DISCUSSION-LOG.md` line 119), Phase 179 did not consume it, so Phase 182 lifts it now to satisfy DSREF-01.
4. **Section structure** continues the existing numbered-heading pattern (`01 / HUE`, `02 / AMBIENT`, `03 / SPLASH`, `04 / SHEET`) introduced by Phase 174 — new sections continue from `05 / …` upward. Italian visible copy + English aria labels match the page's existing convention.
5. **Code snippets** rendered as `<pre><code>` blocks with a small Pressable copy-to-clipboard button per snippet. No syntax highlighter dep. Snippets are JSX usage examples, not the component source.
6. **Page decomposition** — to keep the route file maintainable past 1500 LOC, extract per-section components into `app/debug/design-system-v2/sections/*.tsx` (one file per section). The route file becomes a section-orchestrator that imports + renders them in order. Existing inline sections (hue picker, ambient toggle, splash, sheet preview) are extracted into their own `Section01Hue.tsx` / `Section02Ambient.tsx` / `Section03Splash.tsx` / `Section04Sheet.tsx` as part of this phase to keep the structure uniform — **no behavioral change** to those sections; pure file move + import wiring.
7. **DSREF-03 requirement** ("accent picker rendered inline near the top so changing the hue updates every primitive on the page in place without a reload") is already satisfied by the Phase 174 implementation: `<Section01Hue />` writes `--accent` via `document.documentElement.style.setProperty`, every primitive sample below it consumes `var(--accent)` via inline-style discipline. **No re-architecture required** — verified by inspecting the 6 oklch swatches and the existing primitive samples.
8. Single Playwright spec already at `tests/playwright/design-system-v2.spec.ts` (Phase 174-03) is extended with new assertions: each new section heading is rendered, each new primitive sample is in the DOM, the accent-picker → live-recolor invariant holds across at least one new primitive (e.g., changing accent recolors `<CircBtn primary>` and `<BigSlider>` in place).

In scope (file layout):

- `app/debug/design-system-v2/page.tsx` — **edits**: trims to a section orchestrator (~80 LOC). Imports each `Section0X.tsx` and renders in order. Top-level `useEffect` for accent/ambient state hydration moves into `Section01Hue.tsx`.
- `app/debug/design-system-v2/sections/Section01Hue.tsx` — **NEW** (extracted from current page lines 161-219). Owns accent picker + all related state.
- `app/debug/design-system-v2/sections/Section02Ambient.tsx` — **NEW** (extracted from current page lines 221-300). Owns ambient toggle.
- `app/debug/design-system-v2/sections/Section03Splash.tsx` — **NEW** (extracted from current splash demo block). Owns replay state.
- `app/debug/design-system-v2/sections/Section04Sheet.tsx` — **NEW** (extracted from current sheet placeholder block). Owns local `sheetOpen` + 5 device-sheet-launcher buttons (added in this phase).
- `app/debug/design-system-v2/sections/Section05Tokens.tsx` — **NEW**. Renders accent / neutral swatches, `--text-1`/`--text-2` samples, typography pair samples (Outfit display at h1/h2/section-eyebrow, Inter body at 16/14/12 with weights), spacing/radius scale (`--pad-card`, `--r-card`, plus literal harvested values from the design bundle), shadow/blur display.
- `app/debug/design-system-v2/sections/Section06CardPrimitives.tsx` — **NEW**. GlassCard / CardHead / StatusDot / InlineToggle / CircBtn / MiniStat / FlameViz / PlayingBars samples — each with a live demo + JSX snippet + copy button.
- `app/debug/design-system-v2/sections/Section07SheetPrimitives.tsx` — **NEW**. SheetRow / Stepper / Slider / BigSlider / RadialDial / SheetBtn / QuickActionButton samples — each with a live demo + JSX snippet + copy button. Each stateful primitive uses isolated `useState`.
- `app/debug/design-system-v2/sections/Section08SheetGallery.tsx` — **NEW**. 5 launcher buttons for `<StoveSheet>` / `<ClimateSheet>` / `<LightsSheet>` / `<SonosSheet>` / `<PlugsSheet>`. Each uses fixture data so the sheet renders without a live device. Reuses fixture pattern from `app/components/EmberGlass/sheets/__tests__/`.
- `app/debug/design-system-v2/sections/CodeSnippet.tsx` — **NEW**. Shared `<CodeSnippet code={...} />` primitive: `<pre><code>` block + a Pressable "Copy" button using `navigator.clipboard.writeText`. Inline-style only, no syntax highlighter.
- `app/components/EmberGlass/cards/CircBtn.tsx` — **NEW**. Verbatim port of `.planning/inbox/ember-glass-design/project/components/cards.jsx:298-340`. Props `{ Icon, onClick, primary, tone }`. Inline-style + `var(--accent)` for primary variant.
- `app/components/EmberGlass/cards/__tests__/CircBtn.test.tsx` — **NEW**. Renders with each prop variant; aria-pressed / focus-visible smoke.
- `app/components/EmberGlass/sheets/primitives/BigSlider.tsx` — **NEW**. Verbatim port of `.planning/inbox/ember-glass-design/project/components/sheets.jsx:515-595`. Props `{ value, onChange, color }`. Inline-style + `var(--accent)` default.
- `app/components/EmberGlass/sheets/primitives/__tests__/BigSlider.test.tsx` — **NEW**. Pointer-down → onChange wiring smoke + aria-valuenow update.
- `app/components/EmberGlass/index.ts` — **edits**: barrel re-exports for `CircBtn` (from `cards/`) and `BigSlider` (from `sheets/primitives/`).
- `app/components/EmberGlass/cards/index.ts` — barrel re-export for `CircBtn` (create file if absent — Phase 177 may have left this without a barrel).
- `app/components/EmberGlass/sheets/primitives/index.ts` — **edits**: add `BigSlider` to existing barrel.
- `tests/playwright/design-system-v2.spec.ts` — **edits**: append `test.describe('Phase 182 primitives reference')` with assertions for each new section heading and the accent-picker → live-recolor invariant on `<CircBtn>` + `<BigSlider>`.
- `app/debug/design-system-v2/__tests__/page.test.tsx` — **edits**: assert each section is mounted (via section heading text).

Out of scope (explicitly deferred):

- **Deleting `/debug/design-system` (the v1 page).** v1 references the legacy non-Ember-Glass component library. v2 is additive. Cleanup phase decides v1's fate when the legacy components themselves are removed (post the Navbar/Footer cleanup phase that 181 D-04 promised).
- **Live JSX playground / Sandpack / MDX integration.** Static `<pre><code>` blocks + clipboard copy is sufficient for "single source of truth" intent. No new deps.
- **Syntax-highlighting** code snippets. Plain text is fine — code is always JSX, designers + devs both read it.
- **Visual regression tests** (Chromatic / Percy / screenshot-diff). Existing Playwright assertions on the rendered DOM are the contract. No new infra.
- **Documenting the Phase-180 automations editor primitives** (`<NumInput>`, `<TextInput>`, `<TypeTile>`, `<Pill>`, `<SegmentedControl>`, `<TwoCol>`, `<FieldLabel>`, `<CronHint>`, `<AddChip>`, `<IconBtn>`, `<ConditionGroup>`, `<ConditionItem>`, `<ActionRow>`). Roadmap SC-#1 sample list does NOT include them. They are page-internal to `/automazioni/[id]/edit` and not part of the cross-app primitive vocabulary the v2 reference is meant to anchor. Tracked in deferred for a possible "automations primitives reference" follow-up.
- **Documenting the Phase-179 rooms primitives** (`<ControlRow>`, `<DualTempReadout>`, `<MiniButton>`, `<SliderRow>`, `<StatChip>`). Same rationale as automations primitives — page-internal vocabulary, not in SC-#1.
- **Documenting the Phase-181 `<BottomTabBar>` and `<AltroRow>`.** SC-#1 sample list omits them. The bar is a page-shell singleton (only one instance app-wide), not a primitive designers compose. Defer.
- **A "show source code" toggle** that prints the actual primitive's TS source. Snippets are usage-snippets only — primitives are imported from `@/app/components/EmberGlass`.
- **Token editing UI.** The hue picker writes `--accent` because Phase 174 designed it that way. No other token gets a picker. Adding spacing/radius/shadow editors is out of scope.
- **Locale toggle** for the page (e.g., switching the visible copy to English). Page stays Italian per Phase 174 decision.
- **Per-primitive dark/light toggle.** Ember Glass is dark-only (Phase 174 D-01 reaffirmed across 175-181). No light-mode preview.
- **Reduced-motion preview toggle.** Phase 176 covers reduced-motion globally; the reference page inherits it from `prefers-reduced-motion`. No in-page override.
- **Visual diff between Phase-N and Phase-(N+1) primitive versions.** Reference page is "what is", not "what was".
- **Primitive prop-table autodoc** (e.g., generated from TS types via TSDoc). The JSX snippet shows the API surface in usage form — that is the contract. TS types remain the source of truth in the file itself.
- **Lighthouse / Web Vitals snapshot for the page.** Phase 70-74 perf gates apply to user-facing pages; `/debug/design-system-v2` is dev-only, no perf budget.

</domain>

<decisions>
## Implementation Decisions

### Page architecture

- **D-01:** **Single route, decomposed by section.** Extend `app/debug/design-system-v2/page.tsx` in place. Decompose into `app/debug/design-system-v2/sections/Section0X.tsx` files (one per logical section). Route file becomes a thin orchestrator that imports + renders sections in order. **Why:** Page already at 667 LOC after Phase 174 — adding 8 primitive sections + 1 token section + 1 sheet gallery would push past 2000 LOC in a single client component. Per-section files keep diffs reviewable + tests focused. Mirrors Phase 180's automations-editor decomposition pattern (`automations/sections/`).
- **D-02:** **Inline-style + `var(--token)` discipline carries forward.** No Tailwind classes for visual values inside `app/debug/design-system-v2/**` or any new `EmberGlass/**` file. Layout flex/grid + spacing tokens stay inline. Locked across Phase 174 D-12 / 175 D-08 / 177 D-02 / 178 D-02 / 179 D-02 / 180 D-02 / 181 D-02. The `app/globals.css` exception channel is unused in this phase — no global rules added.
- **D-03:** **`'use client'` everywhere.** Every section is state-bearing (live samples, copy-to-clipboard, sheet open state). The route file itself stays client per the existing Phase 174 implementation. No Server Component refactor.
- **D-04:** **No new external deps.** No Sandpack, no MDX, no syntax highlighter, no clipboard polyfill. `navigator.clipboard.writeText` is sufficient for the dev-only audience. If `navigator.clipboard` is unavailable (rare in modern browsers), the copy button silently no-ops with a one-line `try/catch` — matches Phase 174 D-07 localStorage discipline.

### Primitive extraction (the 2 missing pieces)

- **D-05:** **`<CircBtn>` is extracted in Phase 182, not deferred again.** Source: `.planning/inbox/ember-glass-design/project/components/cards.jsx:298-340` lifted verbatim. Destination: `app/components/EmberGlass/cards/CircBtn.tsx`. Re-exported from `app/components/EmberGlass/index.ts`. **Why:** SC-#1 lists CircBtn as a required sample and the primitive cannot be sampled without existing. Phase 177 UI-SPEC named it but did not ship it. Roadmap is the contract, ship the primitive.
- **D-06:** **`<BigSlider>` is extracted in Phase 182, not deferred again.** Source: `.planning/inbox/ember-glass-design/project/components/sheets.jsx:515-595` lifted verbatim. Destination: `app/components/EmberGlass/sheets/primitives/BigSlider.tsx`. Re-exported from existing `app/components/EmberGlass/sheets/primitives/index.ts` (or that barrel created if Phase 178 left it without one). **Why:** Same as D-05. Phase 178 explicitly deferred BigSlider to Phase 179 (`178-DISCUSSION-LOG.md:119`); Phase 179 did not consume it. SC-#1 requires the sample. Phase 182 lifts the primitive itself.
- **D-07:** **CircBtn + BigSlider are NOT consumed by any production card or sheet in this phase.** Phase 182 only adds them to the EmberGlass barrel + showcases them on `/debug/design-system-v2`. Wiring `<CircBtn>` into actual card overflow buttons or `<BigSlider>` into Stove "Temperatura obiettivo" / Lights brightness is a separate phase. Mirrors Phase 177 UI-SPEC line 70 ("CircBtn… not used on Phase 177 cards but defined") — same posture, just shipped instead of skipped.
- **D-08:** **Verbatim ports — no opinionated changes.** Both primitives are lifted from the bundle with the same prop API, same inline styles, same constants. Bundle wins over any local conventions (Phase 176/177/178 precedent). Any improvement (better accessibility, RTL support, drag gesture) is a follow-up phase, not this one.
- **D-09:** **Each new primitive ships with a Jest spec** under `app/components/EmberGlass/cards/__tests__/CircBtn.test.tsx` and `app/components/EmberGlass/sheets/primitives/__tests__/BigSlider.test.tsx`. CircBtn: renders with each variant (`primary`, default, `tone='warning'`/`'danger'` if bundle supports), aria role/pressed, click wiring. BigSlider: pointer-down → onChange wiring, aria-valuenow update on drag, color prop honored. Coverage parity with Phase 178 sub-primitive specs.

### Section structure & numbering

- **D-10:** **Section heading numbering continues from existing `01 / HUE` / `02 / AMBIENT` pattern.** New ordering, top-to-bottom:
  | # | Title | Source |
  |---|---|---|
  | 01 / HUE | Tinte accento | Phase 174, **kept verbatim** |
  | 02 / AMBIENT | Glow ambient | Phase 174, **kept verbatim** |
  | 03 / SPLASH | Replay splash | Phase 176, **kept verbatim** |
  | 04 / SHEET | Sheet preview | Phase 175, **kept verbatim** |
  | 05 / TOKENS | Colori, tipografia, spaziatura, ombre | NEW (Phase 182) |
  | 06 / CARDS | Primitive carta | NEW (Phase 182) |
  | 07 / SHEET PRIMITIVES | Primitive sheet | NEW (Phase 182) |
  | 08 / SHEET GALLERY | Sheet device live | NEW (Phase 182) |
  Italian visible copy. Numeric prefix English (`05` not `cinque`). Eyebrow style matches Phase 174 (`fontFamily: 'var(--font-body)'; fontSize: 12; fontWeight: 600; letterSpacing: '1.2px'; textTransform: 'uppercase'; color: 'var(--text-2)'`).
- **D-11:** **Each primitive sample uses a fixed sub-block layout:**
  ```
  ┌────────────────────────────────────────────┐
  │ Primitive name (Outfit 18px var(--text-1)) │
  │ One-line description (Inter 14 text-2)     │
  │                                            │
  │  [ Live sample area — interactive ]        │
  │                                            │
  │  ┌────────────────────────────┐            │
  │  │ <pre><code>JSX usage</code></pre>       │
  │  └────────────────────────────┘ [ Copy ]   │
  └────────────────────────────────────────────┘
  ```
  Plain horizontal-rule separator (`<hr>` with `border: 0; borderTop: '0.5px solid var(--glass-border)'; margin: '24px 0';`) between sub-blocks — matches existing Phase 174 dividers.
- **D-12:** **No section omits a sample.** ROADMAP SC-#1 lists 13 primitives — all 13 must appear. Coverage check: GlassCard ✓, CardHead ✓, StatusDot ✓, InlineToggle ✓, CircBtn ✓ (D-05), Stepper ✓, Slider ✓, BigSlider ✓ (D-06), RadialDial ✓, Sheet preview ✓ (Section 04 verbatim), MiniStat ✓, FlameViz ✓, PlayingBars ✓.
- **D-13:** **Section 08 SHEET GALLERY uses fixture data.** Each launcher button opens the real sheet component (`<StoveSheet>` etc.) wired against a hand-rolled fixture object that satisfies the Phase 178 prop contract. Fixture pattern reused from `app/components/EmberGlass/sheets/__tests__/*.test.tsx` — extract the shared fixture into `app/debug/design-system-v2/sections/sheetFixtures.ts` if multiple sheets share fields, otherwise inline per launcher.
- **D-14:** **Single Sheet open at a time** — Section 08 launcher buttons share one local `useState<'stove'|'climate'|'lights'|'sonos'|'plugs'|null>` so opening one closes the others. No need for the Phase 181 SheetCounter when only one demo sheet ever opens.

### Token section content

- **D-15:** **Token section pulls from `:root` at runtime via `getComputedStyle`** for color swatches and shadow/blur values, so the displayed value is always live-correct against the user-picked accent. Same pattern Phase 174's hue picker uses to read persisted state. **Why:** A typo or token rename would otherwise leave the reference page silently stale.
- **D-16:** **Hardcoded literal scale** for spacing + radius — `0`, `4`, `8`, `12`, `16`, `20`, `24`, `28`, `32`, `40`, `48`, `64` px. These are the values harvested from the design bundle (`app.jsx`, `cards.jsx`, `sheets.jsx`, `rooms.jsx`, `automations.jsx`). Token-named entries (`var(--pad-card)`, `var(--r-card)`) are rendered alongside their resolved px values via `getComputedStyle`. **Why:** Designers need to see both the abstract token AND the literal it resolves to.
- **D-17:** **Typography section samples each used pair**:
  - Outfit display at: `40px/600/-1px tracking` (h1), `24px/600` (section heading), `18px/600` (primitive name), `68px/600` (RadialDial center value).
  - Inter body at: `16px/400` (body), `14px/500` (sample description), `12px/600/1.2px tracking/uppercase` (eyebrow), `13px/500` (chip / button).
  Sourced from existing inline styles in the page itself + EmberGlass primitives. Italian + English placeholders ("Acceso" / "Spento" / "Lorem ipsum" not used — pull realistic strings from the app).

### Code snippets & copy

- **D-18:** **One shared `<CodeSnippet code={...}>` component** at `app/debug/design-system-v2/sections/CodeSnippet.tsx`. Renders `<pre><code>` (monospace, 12px, `var(--text-2)`, `var(--glass-bg)` background, 0.5px `var(--glass-border)`, padding 12) plus a Pressable copy button absolutely positioned top-right. Snippets are JSX usage strings (e.g., `<CircBtn Icon={Plus} primary onClick={...} />`) — NOT primitive source.
- **D-19:** **Copy state has a 1500ms "Copiato" feedback.** After `navigator.clipboard.writeText` resolves, the button label switches to "Copiato" with `setTimeout` reverting to "Copia". Matches Phase 175 `<Pressable>` press feedback timing convention. Failure (clipboard unavailable) silently keeps "Copia" — no toast, no error — matches Phase 174 D-07 try/catch posture.

### Tests

- **D-20:** **Single Playwright spec extension.** Append a new `test.describe('Phase 182 primitives reference')` block to the existing `tests/playwright/design-system-v2.spec.ts` (created in Phase 174-03). Assertions: (a) each new section heading text is rendered (one assertion per section ID 05-08), (b) every primitive sub-block heading appears (one assertion per primitive name from D-12), (c) the accent-picker → live-recolor invariant holds: pick a non-default hue (e.g., violet) → assert `<CircBtn primary>` and `<BigSlider>` resolved background contains the expected `oklch(0.65 0.17 290)` value via `getComputedStyle`. **Why:** SC-#3 explicitly requires "changing the hue updates every primitive on the page in place without a reload" — the recolor invariant is the testable form of that contract.
- **D-21:** **Jest specs.** New: `CircBtn.test.tsx` (D-09), `BigSlider.test.tsx` (D-09). Edits: `app/debug/design-system-v2/__tests__/page.test.tsx` — assert each `<Section0X />` is mounted (via section heading text). No need to test individual primitive samples in Jest — the Playwright spec covers DOM presence + recolor; Jest tests are about each primitive's contract in isolation, which already exists for the Phase-174-181 primitives.
- **D-22:** **No new Playwright spec file.** Single design-system-v2 spec is extended. **Why:** Phase 174 already established `tests/playwright/design-system-v2.spec.ts` as the page's contract suite. Splitting now would force consumers to grep two files for the same page's behavior.

### Routing & navigation

- **D-23:** **No nav-link change.** Phase 174-03 added a `/debug/design-system-v2` link from `/debug/page.tsx`. Phase 182 keeps that link unchanged. **No /altro entry.** The page is dev-only; the Altro route should not list it.
- **D-24:** **Auth posture unchanged.** `/debug/**` remains gated by the same Auth0 middleware as the rest of the app — Phase 174 inherited this; Phase 182 inherits from Phase 174.

### Italian copy contract

- **D-25:** **Visible copy is Italian.** Section eyebrows English (numeric prefix), section titles Italian. Primitive names in code stay in English (component identifiers). Aria labels English (matches Phase 174 `aria-label="Set accent to {Name}"` convention — i18n pivot is a future cross-app phase, not this one).
- **D-26:** **Copy strings list:**
  - Section 05 / TOKENS — eyebrow "05 / TOKENS"; title "Token, tipografia e spaziatura"; description "Valori risolti da `:root` in tempo reale"
  - Section 06 / CARDS — eyebrow "06 / CARDS"; title "Primitive carta"; description "Componenti delle dashboard card"
  - Section 07 / SHEET PRIMITIVES — eyebrow "07 / SHEET"; title "Primitive sheet"; description "Componenti dei pannelli a comparsa"
  - Section 08 / SHEET GALLERY — eyebrow "08 / DEMO"; title "Sheet device dal vivo"; description "Apri ciascun pannello con dati di esempio"
  Per-primitive descriptions are one-line Italian (e.g., `<CircBtn>` → "Pulsante circolare 34×34. Variante `primary` colorata da `--accent`.").

### Claude's Discretion

- **CD-01:** Exact px sizing of the section sub-blocks (gap, padding) within the Phase 174 visual envelope. Use Phase 174's `marginBottom: 48` between sections + `gap: 16` within sub-blocks unless a primitive needs more breathing room (RadialDial is 220×220 — give it `gap: 24`).
- **CD-02:** Order of primitives within Section 06 / 07. Recommended order in 06: GlassCard → CardHead → StatusDot → InlineToggle → CircBtn → MiniStat → FlameViz → PlayingBars. In 07: SheetRow → Stepper → Slider → BigSlider → RadialDial → SheetBtn → QuickActionButton. Adjust if a different grouping reads better visually.
- **CD-03:** Exact JSX content of each code snippet. Show realistic prop usage, not the bare minimum. Comments inside snippets are OK if they aid understanding.
- **CD-04:** Whether to add a small "view source" link per primitive that opens the file in the user's editor via a `vscode://` URL. Allowed if trivial; skip if it adds any complexity.
- **CD-05:** Whether to add a "Section ToC" sticky right-rail or top nav-pills. Phase 174 has none — defer unless the resulting page is hard to scan after all sections are in.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### ROADMAP & requirements (locked contract)
- `.planning/ROADMAP.md` lines around "Phase 182: Design System Reference Page v2" — phase goal, depends-on chain (174-181), 3 success criteria, 3 requirement IDs.
- `.planning/REQUIREMENTS.md` DSREF-01..DSREF-03 — single-page reference, single-source-of-truth, inline accent picker.
- `.planning/STATE.md` — current phase pointer, last-completed phase (181).

### Source bundle (verbatim ports for the 2 new primitives)
- `.planning/inbox/ember-glass-design/project/components/cards.jsx:298-340` — `<CircBtn>` source (D-05). Verbatim port to `app/components/EmberGlass/cards/CircBtn.tsx`.
- `.planning/inbox/ember-glass-design/project/components/sheets.jsx:515-595` — `<BigSlider>` source (D-06). Verbatim port to `app/components/EmberGlass/sheets/primitives/BigSlider.tsx`.
- `.planning/inbox/ember-glass-design/project/components/cards.jsx:440` — barrel-export line confirming bundle's CircBtn/MiniStat/FlameViz API surface.
- `.planning/inbox/ember-glass-design/project/components/sheets.jsx:596` — barrel-export line confirming bundle's SheetRow/Stepper/Slider/BigSlider/RadialDial/SheetBtn API surface.

### Existing /debug/design-system-v2 page (extended in place)
- `app/debug/design-system-v2/page.tsx` — current 667 LOC implementation. Existing sections 01/HUE, 02/AMBIENT, 03/SPLASH, 04/SHEET. Accent picker writes `--accent` + persists via localStorage. Pattern referenced by D-15 (getComputedStyle for live token reads).
- `app/debug/design-system-v2/__tests__/page.test.tsx` — current Jest spec. Extended in D-21.
- `tests/playwright/design-system-v2.spec.ts` — current Playwright spec (Phase 174-03). Extended in D-20.

### Prior phase CONTEXTs (locked decisions inherited)
- `.planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md` — D-03 accent token, D-07 picker localStorage key `ember-glass-accent`, D-12 inline-style discipline.
- `.planning/phases/175-glass-primitives-press-animation-sheet/175-CONTEXT.md` — `<Pressable>` API, `<Sheet>` z-index 200/201, scroll-lock pattern.
- `.planning/phases/177-equal-size-dashboard-glass-cards/177-CONTEXT.md` + `177-UI-SPEC.md:70` — confirms CircBtn was specified but never implemented.
- `.planning/phases/178-per-device-modal-sheets/178-CONTEXT.md` + `178-UI-SPEC.md:1066` + `178-DISCUSSION-LOG.md:119` — confirms BigSlider was deferred from Phase 178; Phase 179 did not consume it.
- `.planning/phases/178-per-device-modal-sheets/178-01-SUMMARY.md` — Sheet sub-primitives ship list (SheetRow, Stepper, Slider, RadialDial, SheetBtn, QuickActionButton) — these are the existing primitives Section 07 consumes.
- `.planning/phases/181-glass-bottom-tab-bar/181-CONTEXT.md` D-04 — legacy-leaves-untouched cleanup posture (nothing to do for Phase 182, but confirms `/debug/design-system` v1 page is also "leave untouched until cleanup phase").

### EmberGlass component tree (existing primitives Sections 06/07/08 sample)
- `app/components/EmberGlass/index.ts` — current barrel. Edited in this phase (D-05/D-06 add CircBtn + BigSlider exports).
- `app/components/EmberGlass/GlassCard.tsx` — Section 06 sample.
- `app/components/EmberGlass/CardHead.tsx` — Section 06 sample.
- `app/components/EmberGlass/StatusDot.tsx` — Section 06 sample.
- `app/components/EmberGlass/InlineToggle.tsx` — Section 06 sample.
- `app/components/EmberGlass/MiniStat.tsx` — Section 06 sample.
- `app/components/EmberGlass/FlameViz.tsx` — Section 06 sample.
- `app/components/EmberGlass/PlayingBars.tsx` — Section 06 sample.
- `app/components/EmberGlass/Pressable.tsx` — used by `<CodeSnippet>` copy button + section sub-blocks.
- `app/components/EmberGlass/Sheet.tsx` — Section 04 verbatim + Section 08 device-sheet wrapper.
- `app/components/EmberGlass/sheets/primitives/SheetRow.tsx` — Section 07 sample.
- `app/components/EmberGlass/sheets/primitives/Stepper.tsx` — Section 07 sample.
- `app/components/EmberGlass/sheets/primitives/Slider.tsx` — Section 07 sample.
- `app/components/EmberGlass/sheets/primitives/RadialDial.tsx` — Section 07 sample.
- `app/components/EmberGlass/sheets/primitives/SheetBtn.tsx` — Section 07 sample.
- `app/components/EmberGlass/sheets/primitives/QuickActionButton.tsx` — Section 07 sample.
- `app/components/EmberGlass/sheets/StoveSheet.tsx` / `ClimateSheet.tsx` / `LightsSheet.tsx` / `SonosSheet.tsx` / `PlugsSheet.tsx` — Section 08 launcher targets. Read each component's prop contract + the matching `__tests__` fixture.
- `app/components/EmberGlass/sheets/__tests__/` — fixture pattern source for D-13.

### Project rules
- `CLAUDE.md` — never run `npm run build` / `npm install`; design system entry; testing scoping rules (D-20/D-21 must use scoped subsets, never bare `npm test`).
- `app/globals.css` — `--accent`, `--glass-bg`, `--glass-blur`, `--glass-border`, `--glass-shadow`, `--text-1`, `--text-2`, `--r-card`, `--pad-card`, `--font-display`, `--font-body` token block (Phase 174). Section 05 reads via `getComputedStyle` (D-15).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/debug/design-system-v2/page.tsx` (667 LOC, Phase 174) — current host. Sections 01-04 stay verbatim; only their containers move into `sections/Section0X.tsx` files (D-01). Accent picker + ambient toggle + splash replay + Sheet preview already prove the live-token / live-recolor invariant works (DSREF-03 satisfied).
- `app/components/EmberGlass/Pressable.tsx` (Phase 175) — reused for the per-snippet "Copia" button (D-18) and any Section 06/07 sample interactions. `usePressed()` hook + `.press-anim` already wired.
- `app/components/EmberGlass/Sheet.tsx` (Phase 175 + 181 SheetCounter augmentation) — reused for Section 04 (existing) + Section 08 (5 launchers, D-13/D-14). One sheet open at a time (D-14) means SheetCounter behavior stays internal — no new code.
- `app/components/EmberGlass/sheets/__tests__/*.test.tsx` (Phase 178) — fixture shapes for `<*Sheet>` props. D-13 lifts these into `sheetFixtures.ts`.
- `app/components/EmberGlass/cards/*.tsx` (Phase 177) — every existing card primitive Section 06 samples. Their public API + inline-style implementations are the snippet content for D-18.
- `app/components/EmberGlass/sheets/primitives/*.tsx` (Phase 178) — every existing sheet primitive Section 07 samples (other than BigSlider, which D-06 adds).
- `tests/playwright/design-system-v2.spec.ts` (Phase 174-03) — extended in D-20, no new file.

### Established Patterns
- **Inline-style + `var(--token)` discipline** — D-02 carries forward across every Phase 174-181 implementation. New primitive ports (D-05/D-06) preserve this.
- **`'use client'` for state-bearing pages/components** — D-03 inherits Phase 174 page convention.
- **localStorage `try/catch` silent fallback** — Phase 174 D-07 / 175 D-11; D-04 + D-19 reuse for clipboard write.
- **Section eyebrow + numbered heading** — Phase 174 sections 01/02/03/04 establish the visual pattern; D-10 continues numbering.
- **Pressable copy button** — D-18 uses Phase 175 `<Pressable>` to keep press-feedback consistent.
- **Bundle-verbatim ports** — Phases 176/177/178 precedent: when bundle disagrees with local convention, bundle wins. D-08 keeps this stance.
- **Page decomposition into `sections/` subdir** — Phase 180's automations editor (`app/components/EmberGlass/automations/sections/`) is the closest analog for D-01.
- **Single Playwright spec per page extended via `test.describe`** — Phases 174-03, 175-03, 177-08, 178-10, 181-06 all extend a single spec rather than splitting; D-22 holds.

### Integration Points
- `/debug` index page (Phase 174-03 added the link) → links to `/debug/design-system-v2`. Unchanged in Phase 182.
- `app/components/EmberGlass/index.ts` barrel → `<CircBtn>` and `<BigSlider>` join the public surface (D-05/D-06). Other Phase 182 files import from `@/app/components/EmberGlass`.
- `app/globals.css` token block → Section 05 reads tokens via `getComputedStyle(document.documentElement)` (D-15). No CSS edits.
- Accent-picker → `--accent` write path is unchanged (D-23/D-24). Section 06/07 samples consume `var(--accent)` and recolor automatically — that is the SC-#3 contract Playwright asserts in D-20.

</code_context>

<specifics>
## Specific Ideas

- **Designers' real workflow** is "pick an accent, scan every primitive at once, decide if the hue feels right." That is exactly what Section 01 + Sections 06/07/08 deliver in one viewport. Don't break the picker-to-primitive visual chain by inserting marketing copy or long prose blocks between Section 01 and Section 06.
- **Snippets are JSX usage**, not source. A designer copying `<CircBtn Icon={Plus} primary onClick={() => …} />` should be able to paste it into a card and have it work. Don't paste primitive internals.
- **The page is dev-only.** No SEO meta, no OpenGraph, no schema.org markup. The existing Phase-174 page has none — keep it that way.
- **Italian + English split holds**: visible copy Italian, code English, aria English. Do not Italianize prop names or component identifiers.

</specifics>

<deferred>
## Deferred Ideas

- **Phase 180 automations editor primitives reference** (NumInput, TextInput, TypeTile, Pill, SegmentedControl, TwoCol, FieldLabel, CronHint, AddChip, IconBtn, ConditionGroup, ConditionItem, ActionRow). Out of SC-#1 sample list. A "v20.1 automations primitives reference" follow-up could host these on the same page or a sibling `/debug/design-system-v2/automations` route.
- **Phase 179 rooms primitives reference** (ControlRow, DualTempReadout, MiniButton, SliderRow, StatChip). Same rationale — page-internal, not in SC-#1.
- **`<BottomTabBar>` + `<AltroRow>` reference** (Phase 181). Not primitives in the compositional sense — page-shell singletons. Defer.
- **Wiring `<CircBtn>` into actual card overflow buttons.** Cards (Phase 177) currently use plain `<button>` for action affordances. Migrating to `<CircBtn>` is a separate, focused phase.
- **Wiring `<BigSlider>` into Stove "Temperatura obiettivo" + Lights brightness.** The bundle uses BigSlider in those exact spots; Phase 178 deferred and Phase 182 only ships the primitive. A v20.1 phase consumes it.
- **Token editor UI** (spacing/radius/shadow pickers). Hue picker is Phase 174's contract; nothing else gets a picker.
- **Live-edit JSX playground** (Sandpack/MDX). Plain code snippets + clipboard copy is sufficient.
- **Visual regression suite** (Chromatic / Percy / screenshot diff). Future infra phase if/when designers ask for it.
- **English locale toggle** for the page. v20.0 ships Italian-only across all UI; cross-app i18n is a separate effort.
- **Light mode primitive preview.** Ember Glass is dark-only. Cross-app light theme is a separate (currently unscoped) effort.
- **TSDoc-driven prop tables.** Snippets show usage; primitives' TS types are the source of truth in their files.

### Reviewed Todos (not folded)

None — no todos matched Phase 182 scope (todo cross-reference returned 0 in `--auto` mode).

</deferred>

---

*Phase: 182-Design-System-Reference-Page-v2*
*Context gathered: 2026-05-03*
