---
phase: 182
slug: design-system-reference-page-v2
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-03
---

# Phase 182 — UI Design Contract

> Visual and interaction contract for the **Design System Reference Page v2** — extending `/debug/design-system-v2` into the single source of truth for every Ember Glass primitive shipped across Phases 174-181. Auto-resolved from `182-CONTEXT.md` D-01..D-26, CD-01..CD-05, REQUIREMENTS.md DSREF-01..DSREF-03, and the upstream UI-SPECs (174/175/177/178/181). No interactive questions — every gray area is locked in CONTEXT.md. Verified by gsd-ui-checker downstream.

**Scope reminder (per D-01, D-07, D-10):** Phase 182 ships ONLY (a) decomposition of `app/debug/design-system-v2/page.tsx` into `sections/Section0X.tsx` files (Sections 01-04 extracted verbatim, Sections 05-08 added new), (b) verbatim ports of `<CircBtn>` and `<BigSlider>` into the EmberGlass barrel, (c) shared `<CodeSnippet>` primitive, (d) fixture-backed `<Section08SheetGallery>` with 5 real sheet launchers, and (e) test extensions. **Neither CircBtn nor BigSlider is wired into production cards or sheets in this phase.** The existing accent picker (Section 01) stays untouched; its `--accent` write path is the recolor invariant for DSREF-03.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Tailwind v4 + custom EmberGlass token system; no shadcn — `components.json` confirmed absent 2026-05-03) |
| Preset | not applicable |
| Component library | `@radix-ui/react-dialog ^1.1.14` (via Phase 175 `<Sheet>` — consumed by Section 08 launchers); no new Radix primitives |
| Icon library | `lucide-react` (existing dep) — CodeSnippet copy button: `<Check size={12}>` for "Copiato" feedback; Section 06 CircBtn sample: `<Plus size={16}>`, `<Minus size={16}>`, `<X size={16}>` (all already used elsewhere); Section 07 BigSlider sample: `<Lightbulb size={22}>` (Phase 178 carry-forward) |
| Display font | Outfit (`var(--font-display)`, Phase 174 token alias) — used by primitive-name row (18px/600), RadialDial center value (68px/600), RadialDial sample label, BigSlider percentage label (28px/600) |
| Body font | Inter (`var(--font-body)`, Phase 174 token alias) — used by section eyebrows (12px/600/uppercase), primitive description lines (14px/500), CodeSnippet monospace block (12px/400), copy button label ("Copia" / "Copiato") |
| Color space | OKLCH for `--accent`; rgba/hex literals for bundle-verbatim AUDIT-EXCEPTION values inherited from prior phases; no new color space constructs |
| Styling approach | **Inline `style={...}` + `var(--token)` discipline** (locked across Phases 174-181 D-02 chain; CONTEXT D-02 reaffirms for Phase 182). No Tailwind inside `sections/*.tsx`, `CodeSnippet.tsx`, `CircBtn.tsx`, or `BigSlider.tsx`. |

**Detected existing UI (verified 2026-05-03):**
- `app/debug/design-system-v2/page.tsx` (667 LOC) — current single-file page. Sections 01-04 (hue picker, ambient toggle, splash demo, sheet preview) are extracted verbatim into `sections/Section0X.tsx`; no behavioral change.
- `app/components/EmberGlass/index.ts` — barrel; Phase 182 adds CircBtn + BigSlider exports.
- `app/components/EmberGlass/sheets/primitives/` — contains `SheetRow.tsx`, `Stepper.tsx`, `Slider.tsx`, `RadialDial.tsx`, `SheetBtn.tsx`, `QuickActionButton.tsx` (Phase 178). `BigSlider.tsx` is **NEW** in Phase 182.
- `app/components/EmberGlass/cards/` — contains `StoveCard.tsx`, `ClimateCard.tsx`, etc. (Phase 177). `CircBtn.tsx` is **NEW** in Phase 182.
- No `components.json`; shadcn gate not applicable.

---

## Spacing Scale

Phase 182 inherits the Phase 174 page envelope unchanged and extends it. No new spacing values are introduced at the page level. Sub-block micro-affordances inside CircBtn and BigSlider are bundle-verbatim and documented separately.

| Value | Usage in Phase 182 |
|-------|---------------------|
| 0 | Spacing scale anchor |
| 4px | CodeSnippet inner padding base; RadialDial label `marginTop: 4` |
| 8px | Sub-block header stack gap (name + description `gap: 8`) |
| 12px | CodeSnippet `padding: 12`; Section 05 token-grid inter-cell gap |
| 16px | `var(--pad-card)` — page outer padding; sub-block `gap: 16` within Section 06/07 (per CD-01) |
| 20px | BigSlider side padding `padding: '0 20px'` (bundle `sheets.jsx:528`, verbatim) |
| 24px | `var(--r-card)` — RadialDial sub-block `gap: 24` (per CD-01; larger breathing for 220×220 sample); Section 05 row `gap: 24` between token-name and resolved-value; hr divider `margin: '24px 0'` |
| 28px | BigSlider percentage label `fontSize: 28` (bundle `sheets.jsx:529`, verbatim — not a spacing value, but the font size matches the spacing rhythm) |
| 32px | Section 08 launcher row `gap: 32` between the 5 pill buttons |
| 48px | `marginBottom: 48` between each section (page envelope, Phase 174 pattern) |
| 64px | Spacing scale max literal (shown in Section 05 spacing tile) |

**Phase 174 page-level layout grammar (authoritative — inherited verbatim):**
- `maxWidth: 1240` — page container max-width, centered with `margin: '0 auto'`.
- `padding: 'var(--pad-card)'` — page container inner horizontal padding.
- `marginBottom: 48` — section separation (applies to each `<section>` element wrapping Sections 01-08).
- `margin: '24px 0'` — `<hr>` divider `border: 0; borderTop: '0.5px solid var(--glass-border)'` between sub-blocks within Sections 06/07.
- `gap: 16` — sub-block vertical gap within a section (default per CD-01).
- `gap: 24` — sub-block vertical gap when sample area needs extra breathing (RadialDial per CD-01).

**Sub-block spacing contract (D-11):**
Each primitive sub-block uses a fixed layout:
```
name row             — Outfit 18px / 600 / var(--text-1)
description row      — Inter 14px / 500 / var(--text-2) / marginTop: 4
[gap: 16]
live sample area     — interactive, min-height as needed
[gap: 12]
CodeSnippet block    — pre/code + copy button
```

**CircBtn-specific (bundle verbatim `cards.jsx:298-308`):**
- Width/height: `34×34px`, `borderRadius: 999`.
- Icon: `size={16}`, `strokeWidth={2.2}`.

**BigSlider-specific (bundle verbatim `sheets.jsx:515-533`):**
- Container: `height: 72px`, `borderRadius: 20`.
- Side padding for overlay label: `padding: '0 20px'`.
- Track fill overlay uses `width: ${value}%`.

**Spacing scale literals shown in Section 05 tiles:**
`0 / 4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 / 40 / 48 / 64` (per D-16).
Each rendered as a filled rectangle (`height: 8`, `borderRadius: 4`, `background: var(--accent)`) with its literal value underneath in 12px / `var(--text-2)`.

**Touch targets:** no production interactive surfaces are added to the app shell by this phase. The "Copia" CodeSnippet button is `<Pressable as="button">` with a minimum height of 24px (small; dev-only tool). Section 08 launcher pills are `<Pressable as="button">` at height 40px. All dev-only; HIG tap-target rules are advisory, not binding on `/debug/**` pages.

**Exceptions (bundle-verbatim — DO NOT normalize):**
- `0.5px` — sub-block container border and CodeSnippet border (sub-pixel retina hairline, Phase 174+ convention).
- `20px` — BigSlider internal side-padding (bundle `sheets.jsx:528`; not a 4-multiple).
- `34×34` — CircBtn size (bundle `cards.jsx:298`; not a 4-multiple).
- `72px` — BigSlider height (bundle `sheets.jsx:516`).
- `220×220` — RadialDial SVG size (Phase 178 carry-forward; bundle `sheets.jsx:539`).

---

## Typography

**Inherited from Phase 174 + extended by Phase 182 for new surfaces.** Phase 174 established 4 sizes (12/16/24/40) and 2 weights (400/600). Phase 182 adds sizes from the bundle used by CircBtn, BigSlider, RadialDial, and primitive-name labels. The expanded set is the page's full typography inventory — each size appears on the reference page itself (DSREF-01 requires showing all typography pairs).

| Role | Size | Weight | Line Height | Family | Where |
|------|------|--------|-------------|--------|-------|
| Page display | 40px | 600 | 1.05 | `var(--font-display)` Outfit | Page title "Ember Glass" (Phase 174 carry-forward; Section 01 header) |
| Primitive name / Section heading | 24px | 600 | 1.2 | `var(--font-display)` Outfit | Section H2 titles ("Token, tipografia e spaziatura" etc.) |
| Primitive name row | 18px | 600 | 1.2 | `var(--font-display)` Outfit | Sub-block name label (e.g., "GlassCard", "CircBtn") — per D-11, D-17 |
| BigSlider percentage label | 28px | 600 | 1 | `var(--font-display)` Outfit | BigSlider overlay `{value}%` — bundle `sheets.jsx:529` |
| RadialDial center value | 68px | 600 | 1 | `var(--font-display)` Outfit | RadialDial center display — bundle `sheets.jsx:560`, Phase 178 carry-forward |
| Body | 16px | 400 | 1.5 | `var(--font-body)` Inter | Section-level description copy; CodeSnippet button body text |
| Primitive description | 14px | 500 | 1.4 | `var(--font-body)` Inter | Sub-block one-line description — per D-11, D-17 |
| CodeSnippet | 12px | 400 | 1.5 | `var(--font-body)` Inter (monospace fallback: `ui-monospace, SF Mono, Menlo`) | `<pre><code>` JSX snippet text — D-18 |
| Eyebrow / Section label | 12px | 600 | 1.4 | `var(--font-body)` Inter | Section eyebrow ("01 / HUE", "05 / TOKENS" etc.); `letterSpacing: '1.2px'`; `textTransform: 'uppercase'`; `color: 'var(--text-2)'` — Phase 174 pattern, D-10 |
| RadialDial unit label | 12px | 400 | (default) | `var(--font-body)` Inter | Label below RadialDial center value, `marginTop: 4`, `color: 'var(--text-2)'` — bundle `sheets.jsx:563` |
| Chip / button | 13px | 500 | (default) | `var(--font-body)` Inter | Section 08 launcher pill labels ("Stufa", "Clima", "Luci", "Sonos", "Prese") |

**Weights summary:** 400 (regular body / CodeSnippet), 500 (medium descriptions / chips), 600 (semibold display / headings / labels). No 700 used on this page (LIVE pill from CameraCard is not showcased in live form in Sections 06-07 samples).

**Typography samples in Section 05 (D-17):** Show each pair as a live text specimen:
- Outfit 40/600/-1px tracking: `"Ember Glass"` (page title scale)
- Outfit 24/600: `"Tipografia display"` (section heading scale)
- Outfit 18/600: `"Nome primitivo"` (sub-block name scale)
- Outfit 68/600: `"21°"` (RadialDial scale)
- Outfit 28/600: `"72%"` (BigSlider scale)
- Inter 16/400: `"Testo corpo con ritmo 1.5."` (body scale)
- Inter 14/500: `"Descrizione in una riga."` (description scale)
- Inter 12/600/1.2px/uppercase: `"01 / TOKENS"` (eyebrow scale)
- Inter 13/500: `"Stufa"` (chip scale)
- Inter 12/400 mono: `"<GlassCard tone={…} />"` (snippet scale)

Each specimen shown against dark page background (`var(--text-1)` or `var(--text-2)` as applicable), with its size/weight annotation in 11px `var(--text-2)`.

**Verification gate:** new files in Phase 182 (`sections/*.tsx`, `CodeSnippet.tsx`, `CircBtn.tsx`, `BigSlider.tsx`) MUST show zero usages of `fontSize` outside `{12, 13, 14, 16, 18, 24, 28, 40, 68}` and zero `fontWeight` outside `{400, 500, 600}`.

---

## Color

Phase 182 introduces no new colors. All values either consume Phase 174 tokens or carry forward bundle-verbatim AUDIT-EXCEPTIONs from Phases 175/177/178.

| Role | Value | Token | Usage |
|------|-------|-------|-------|
| Dominant (60%) | `#0a0908` linear-gradient base | inherited page background | Page background; visible behind CodeSnippet `<pre>` blocks |
| Secondary (30%) | `rgba(255, 255, 255, 0.04)` | `--glass-bg` | Sub-block container background; CodeSnippet `<pre>` background |
| Accent (10%) | `oklch(0.68 0.17 45)` default copper | `--accent` | See reserved-for list below |
| Text primary | `#f5f5f4` | `--text-1` | Primitive name labels, section headings, BigSlider percentage, RadialDial value |
| Text secondary | `rgba(245, 245, 244, 0.55)` | `--text-2` | Primitive description lines, section eyebrows, CodeSnippet monospace text, RadialDial unit label, spacing tile labels, typography specimen annotations |
| Border | `rgba(255, 255, 255, 0.08)` | `--glass-border` | Sub-block `<hr>` divider `borderTop: '0.5px solid var(--glass-border)'`; CodeSnippet `<pre>` border `'0.5px solid var(--glass-border)'` |
| CircBtn default bg | `rgba(255, 255, 255, 0.08)` | NOT a token (AUDIT-EXCEPTION) | CircBtn non-primary variant background — bundle `cards.jsx:301` verbatim |
| CircBtn primary bg | `var(--accent)` | `--accent` | CircBtn primary variant — fills with user-selected accent; recolors live when accent picker changes |
| CircBtn primary color | `#1a0f08` | NOT a token (AUDIT-EXCEPTION) | CircBtn primary label/icon color against accent fill — bundle `cards.jsx:302` verbatim |
| BigSlider track fill | `linear-gradient(90deg, color-mix(in oklab, ${color} 70%, transparent) 0%, ${color} 100%)` | default `color` = `var(--accent)` | BigSlider fill track — live-recolors with accent; bundle `sheets.jsx:520` verbatim |
| BigSlider icon | `rgba(255, 255, 255, 0.7)` | NOT a token (AUDIT-EXCEPTION) | Icon overlay in BigSlider — bundle `sheets.jsx:530` verbatim |
| BigSlider container bg | `rgba(255, 255, 255, 0.06)` | NOT a token (AUDIT-EXCEPTION) | BigSlider unfilled track — bundle `sheets.jsx:517` verbatim |
| Section 08 pill default | `rgba(255, 255, 255, 0.08)` | NOT a token (AUDIT-EXCEPTION) | Launcher pill neutral fill — bundle-consistent non-token |
| CodeSnippet copy button | `rgba(255, 255, 255, 0.08)` | NOT a token (AUDIT-EXCEPTION) | Pressable button fill (same as CircBtn default / general glass button) |
| Destructive | n/a | — | Phase 182 has no destructive actions (no delete, no reset, no danger paths) |

**Accent reserved-for list (Phase 182 additions to the 10% zone):**

1. **CircBtn `primary` variant background** — the only surface on the page that gets a solid accent fill. Demonstrates the primary/secondary visual split in CircBtn's prop contract.
2. **BigSlider track fill** — `linear-gradient` uses `var(--accent)` as both gradient stops. The fill width tracks the slider's controlled value.
3. **RadialDial arc stroke** — `stroke={color}` where `color` defaults to `var(--accent)` in the Section 07 sample. The arc glow `filter: drop-shadow(0 0 12px ${color})` also reads accent.
4. **Section 08 launcher pill active border** — when a sheet is open from a launcher, that launcher button gets a `border: '1px solid var(--accent)'` highlight to show "this sheet is open" (per CD-01 disambiguation; color resolves from `--accent`).
5. **`<Pressable>` `:focus-visible` outline** — inherited from Phase 175 global rule `[data-pressable-focusable="true"]:focus-visible { outline: 2px solid var(--accent); }`. Applies to CodeSnippet copy button + Section 08 launcher pills.

**Inherited accent usages (Phases 174-181 carry-forward):**
- Active hue swatch ring (Section 01).
- Ambient glow blob (Section 02).
- MiniStat progress fill (Section 06 sample).
- StatusDot fallback color (Section 06 sample).
- InlineToggle thumb color when on (Section 06 sample, passing `color="var(--accent)"`).
- StoveSheet "Accendi stufa" button fill (Section 08 fixture).
- Slider fill color (Section 07 sample, `color` prop defaults to `var(--accent)`).
- All Sheet close-button `:focus-visible` outlines.

**Recolor invariant (DSREF-03):** Changing the accent in Section 01 immediately recolors — without page reload — all of the above elements. The Playwright assertion in D-20 validates this by picking the violet preset and asserting `getComputedStyle` on `<CircBtn primary>` and `<BigSlider>` shows `oklch(0.65 0.17 290)`.

**AUDIT-EXCEPTION inventory (Phase 182 additions only):**
| File:value | Bundle source | Why non-token |
|------------|---------------|---------------|
| `CircBtn.tsx` `#1a0f08` | `cards.jsx:302` | Dark text on accent-colored button; brand-specific warm near-black |
| `CircBtn.tsx` `rgba(255,255,255,0.08)` | `cards.jsx:301` | Glass button default fill; not reused beyond buttons |
| `BigSlider.tsx` `rgba(255,255,255,0.06)` | `sheets.jsx:517` | Slightly denser than `--glass-bg` for contrast vs track fill |
| `BigSlider.tsx` `rgba(255,255,255,0.7)` | `sheets.jsx:530` | Icon stroke opacity; partially opaque white for subtlety |

All AUDIT-EXCEPTION values must be tagged `// AUDIT-EXCEPTION` inline.

---

## Page-Level Layout Grammar (inherited — prescriptive for executor)

Source: `app/debug/design-system-v2/page.tsx` lines 108-158 (verified 2026-05-03).

```
<main style={{ maxWidth: 1240, margin: '0 auto', padding: 'var(--pad-card)', position: 'relative', zIndex: 1 }}>

  {/* Page header (unchanged — Section01Hue takes everything after the <hr> divider) */}
  <header style={{ marginBottom: 32 }}>
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-2)' }}>
      DESIGN SYSTEM · v2
    </p>
    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 600,
                 lineHeight: 1.05, letterSpacing: '-1px', color: 'var(--text-1)', margin: 0 }}>
      Ember Glass
    </h1>
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 400,
                color: 'var(--text-2)', marginTop: 8 }}>
      Riferimento token e picker live · Phase 174
    </p>
  </header>

  <hr style={{ border: 0, borderTop: '0.5px solid var(--glass-border)', margin: '24px 0' }} />

  {/* Sections in order — each section is wrapped in <section style={{ marginBottom: 48 }}> */}
  <Section01Hue />
  <Section02Ambient />
  <Section03Splash />
  <Section04Sheet />
  <Section05Tokens />
  <Section06CardPrimitives />
  <Section07SheetPrimitives />
  <Section08SheetGallery />

</main>
```

**Section eyebrow + heading pattern (D-10, verbatim for every section including new ones):**
```tsx
<p style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
            letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-2)' }}>
  {eyebrow}   {/* e.g. "05 / TOKENS" */}
</p>
<h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600,
             lineHeight: 1.2, color: 'var(--text-1)', margin: '4px 0 8px' }}>
  {title}     {/* e.g. "Token, tipografia e spaziatura" */}
</h2>
<p style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 400,
            color: 'var(--text-2)', marginBottom: 24 }}>
  {description}
</p>
```

**Sub-block divider pattern (D-11, between each primitive sample):**
```tsx
<hr style={{ border: 0, borderTop: '0.5px solid var(--glass-border)', margin: '24px 0' }} />
```

**Sub-block internal layout (D-11):**
```
primitive name        font-display 18/600 var(--text-1)
description           font-body 14/500 var(--text-2), marginTop: 4
[gap: 16 or 24]
live sample area      (rendered at natural dimensions, centered or left-aligned per CD-02)
[gap: 12]
<CodeSnippet>         pre+code block with copy button
```

---

## Section Specifications

### Section 01 / HUE — Extracted verbatim (no change)

Source lines: `page.tsx:161-219` → `sections/Section01Hue.tsx`. Owns accent picker state + `setAccent()` + `setAmbient()` coordination. **Zero behavioral change.** (D-01)

### Section 02 / AMBIENT — Extracted verbatim

Source lines: `page.tsx:221-300` → `sections/Section02Ambient.tsx`. Owns ambient toggle state. **Zero behavioral change.** (D-01)

### Section 03 / SPLASH — Extracted verbatim

Source: splash demo block → `sections/Section03Splash.tsx`. Owns `replayKey` state. **Zero behavioral change.** (D-01)

### Section 04 / SHEET — Extracted verbatim

Source: sheet preview block → `sections/Section04Sheet.tsx`. Owns `sheetOpen` state for the demo sheet. **Zero behavioral change.** (D-01)

---

### Section 05 / TOKENS — New

**Eyebrow:** `"05 / TOKENS"` | **Title:** `"Token, tipografia e spaziatura"` | **Description:** `"Valori risolti da :root in tempo reale"` (D-26)

Token values read via `getComputedStyle(document.documentElement)` on mount + re-read on `'ember-glass-accent-change'` event (or a custom effect that fires when `--accent` changes — simplest: read all values in a `useEffect` keyed on a dummy state that Section01Hue increments via a prop/context callback). **Note:** Section 05 reads tokens live so displayed hex/oklch values always match the current accent.

**Sub-sections (rendered in order, separated by sub-block dividers):**

#### 5a — Color tokens
Display each of the 11 Phase-174 tokens as a row:

| Display | Layout |
|---------|--------|
| Token name | `12px / 600 / var(--font-body)` left column |
| Resolved value | `12px / 400 / var(--text-2)` center column — live-read via `getComputedStyle` |
| Color swatch (where applicable) | `20×20px, borderRadius: 6` filled with the token value; omit for non-color tokens (`--glass-blur`, `--r-card`, `--pad-card`, `--font-display`, `--font-body`) |
| Description | `12px / 400 / var(--text-2)` right column — static Italian label (e.g., `"Superficie vetro"`, `"Colore accento"`) |

Token rows:
- `--glass-bg` — swatch + `"Sfondo superficie vetro (4% bianco)"`
- `--glass-blur` — no swatch, show blur preview tile (a blurred circle behind a glass rect) + `"Blur backdropfilter"`
- `--glass-border` — swatch + `"Bordo 1px vetro"`
- `--glass-shadow` — shadow preview tile + `"Ombra elevazione carta"`
- `--accent` — **live swatch** (updates immediately when picker changes) + `"Accento oklch hue-shiftable"`
- `--text-1` — swatch + `"Testo primario"`
- `--text-2` — swatch + `"Testo secondario"`
- `--r-card` — radius preview (small square with resolved radius) + `"Raggio bordo carta"`
- `--pad-card` — spacing preview (bar at resolved width) + `"Padding interno carta"`
- `--font-display` — text specimen "Aa Bb" in resolved font + `"Font display (Outfit)"`
- `--font-body` — text specimen "Aa Bb" in resolved font + `"Font body (Inter)"`

#### 5b — Typography pairs (D-17)
Show each type specimen from the Typography section above. Each row:
- Specimen text (rendered at specified size/weight/family/color)
- Annotation: `"Outfit 40 / 600 / tracking -1px"` style (Inter 11px `var(--text-2)`)

#### 5c — Spacing & radius scale (D-16)
Literal values: `0 / 4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 / 40 / 48 / 64` px.
Each shown as a filled rectangle (`height: 8px, borderRadius: 4, background: 'var(--accent)'`) with width equal to the literal value in px, labeled below with the numeric value.
Token-named entries `--pad-card` and `--r-card` shown alongside their resolved values via `getComputedStyle`.

#### 5d — Shadow & blur tiles
- `--glass-shadow` tile: 80×80 glass card with `box-shadow: var(--glass-shadow)`, labeled.
- `--glass-blur` tile: frosted glass card with `backdrop-filter: blur(var(--glass-blur)) saturate(180%)` over a gradient background, labeled `"blur(24px) saturate(180%)"`.

---

### Section 06 / CARDS — New

**Eyebrow:** `"06 / CARDS"` | **Title:** `"Primitive carta"` | **Description:** `"Componenti delle dashboard card"` (D-26)

Primitive order (per CD-02): `GlassCard → CardHead → StatusDot → InlineToggle → CircBtn → MiniStat → FlameViz → PlayingBars`

#### 6-01 GlassCard

**Name:** `"GlassCard"` | **Description:** `"Superficie base 1:1 vetro. Riceve tone wash, press scale via Pressable."` (Italian)

**Live sample:** A 200×200px `<GlassCard tone="var(--accent)" onOpen={() => {}}>` instance with an empty body showing the glass surface, tone wash, and press animation. The `onOpen` is a no-op so the card is pressable (shows scale(0.97) on touch) but opens nothing.

**Token usage:** `--glass-bg` (fill), `--glass-blur` (backdrop), `--glass-border` (border), `--glass-shadow` (shadow), `--r-card` (radius), `--pad-card` (padding), `--accent` (tone wash gradient). All recolor with accent picker.

**Snippet:**
```tsx
<GlassCard tone="var(--accent)" onOpen={() => openSheet()}>
  <CardHead Icon={Flame} label="Stufa" tone="var(--accent)" />
  {/* body content */}
</GlassCard>
```

#### 6-02 CardHead

**Name:** `"CardHead"` | **Description:** `"Intestazione carta: icona 32×32, etichetta 13px/600, slot destra opzionale."` (Italian)

**Live sample:** `<CardHead Icon={Flame} label="Stufa" tone="var(--accent)" right={<StatusDot on />}>`

**Snippet:**
```tsx
<CardHead
  Icon={Flame}
  label="Stufa"
  tone="var(--accent)"
  right={<StatusDot on color="var(--accent)" />}
/>
```

#### 6-03 StatusDot

**Name:** `"StatusDot"` | **Description:** `"Indicatore 8×8 on/off. Glow 12px box-shadow quando on. Colore variabile."` (Italian)

**Live sample:** Two dots side by side — `<StatusDot on color="var(--accent)" />` and `<StatusDot on={false} />` — labeled "on" and "off".

**Snippet:**
```tsx
<StatusDot on color="var(--accent)" />  {/* on — glow */}
<StatusDot on={false} />                {/* off — dim */}
```

#### 6-04 InlineToggle

**Name:** `"InlineToggle"` | **Description:** `"Switch iOS 44×26. Thumb animato con cubic-bezier(.34,1.56,.64,1). stopPropagation obbligatorio."` (Italian)

**Live sample:** `<InlineToggle on={toggleState} color="var(--accent)" onChange={setToggleState} />` backed by local `useState<boolean>`. Starts `false`.

**Snippet:**
```tsx
const [on, setOn] = useState(false);
<InlineToggle
  on={on}
  color="var(--accent)"
  onChange={(next) => {
    e.stopPropagation(); // mandatory — prevents parent GlassCard from opening sheet
    setOn(next);
  }}
/>
```

#### 6-05 CircBtn

**Name:** `"CircBtn"` | **Description:** `"Pulsante circolare 34×34. Variante primary colorata da --accent."` (Italian)

**Live sample:** Two buttons side by side — `<CircBtn Icon={Plus} primary tone="var(--accent)" onClick={() => {}} />` (primary/accent) and `<CircBtn Icon={X} tone="var(--accent)" onClick={() => {}} />` (default/glass).

**Token usage:** Primary variant uses `background: tone` where `tone = 'var(--accent)'` — recolors live. Default variant uses `rgba(255,255,255,0.08)` (AUDIT-EXCEPTION, bundle-verbatim).

**Snippet:**
```tsx
{/* Primary — accent fill, dark icon */}
<CircBtn Icon={Plus} primary tone="var(--accent)" onClick={() => increment()} />

{/* Default — glass fill, white icon */}
<CircBtn Icon={Minus} tone="var(--accent)" onClick={() => decrement()} />
```

#### 6-06 MiniStat

**Name:** `"MiniStat"` | **Description:** `"Stat 2-righe: etichetta 11px, valore 15px display, barra progresso 3px --accent."` (Italian)

**Live sample:** `<MiniStat label="CPU" value="42%" bar={0.42} />` + `<MiniStat label="RAM" value="67%" bar={0.67} />` side by side.

**Snippet:**
```tsx
<MiniStat label="CPU" value="42%" bar={0.42} />
```

#### 6-07 FlameViz

**Name:** `"FlameViz"` | **Description:** `"Visualizzazione fiamma animata quando on. intensity da 0 a 1. Colore da --accent."` (Italian)

**Live sample:** `<FlameViz on intensity={0.6} />` at natural size, with a play/pause InlineToggle below to toggle `on`.

**Snippet:**
```tsx
<FlameViz on={isAccesa} intensity={powerLevel / 5} />
```

#### 6-08 PlayingBars

**Name:** `"PlayingBars"` | **Description:** `"3 barre Sonos animate. CSS keyframes sonosBar0/1/2. Colore #b080ff fisso."` (Italian)

**Live sample:** `<PlayingBars />` — static mount; animation plays automatically via CSS keyframes.

**Snippet:**
```tsx
<PlayingBars />  {/* renders inside SonosCard playing-group rows */}
```

---

### Section 07 / SHEET PRIMITIVES — New

**Eyebrow:** `"07 / SHEET"` | **Title:** `"Primitive sheet"` | **Description:** `"Componenti dei pannelli a comparsa"` (D-26)

Primitive order (per CD-02): `SheetRow → Stepper → Slider → BigSlider → RadialDial → SheetBtn → QuickActionButton`

Each stateful primitive uses isolated `useState` within the section. The entire section is `'use client'`.

#### 7-01 SheetRow

**Name:** `"SheetRow"` | **Description:** `"Riga sheet con label + slot destra. Separatore 0.5px glass-border."` (Italian)

**Live sample:**
```tsx
<SheetRow label="Temperatura" right={<span>22°C</span>} />
<SheetRow label="Ventola" right={<span>Livello 3</span>} />
```

**Snippet:**
```tsx
<SheetRow
  label="Temperatura obiettivo"
  right={<Stepper value={target} min={7} max={30} onChange={setTarget} />}
/>
```

#### 7-02 Stepper

**Name:** `"Stepper"` | **Description:** `"Controllo −/+ con valore centrale. Pulsanti 36×36. Curva spring su thumb."` (Italian)

**Live sample:** `<Stepper value={stepperVal} min={1} max={5} onChange={setStepperVal} />` backed by `useState(3)`.

**Snippet:**
```tsx
<Stepper
  value={powerLevel}
  min={1}
  max={5}
  onChange={(v) => handlePowerChange(v)}
/>
```

#### 7-03 Slider

**Name:** `"Slider"` | **Description:** `"Range input 140px con fill --accent. Usato per temperatura obiettivo rapida."` (Italian)

**Live sample:** `<Slider value={sliderVal} onChange={setSliderVal} color="var(--accent)" />` backed by `useState(50)`.

**Snippet:**
```tsx
<Slider
  value={targetTemp}
  onChange={(v) => debouncedSetTarget(v)}
  color="var(--accent)"
/>
```

#### 7-04 BigSlider

**Name:** `"BigSlider"` | **Description:** `"Slider orizzontale 72px. Fill gradient --accent. Percentuale display Outfit 28/600."` (Italian)

**Live sample:** `<BigSlider value={bigVal} onChange={setBigVal} color="var(--accent)" />` backed by `useState(60)`. Full-width container (constrained to `maxWidth: 480px` in the sample area).

**Token usage:** `color` prop defaults to `var(--accent)` — gradient fill recolors live when accent picker changes.

**Snippet:**
```tsx
<BigSlider
  value={brightness}
  onChange={(v) => setBrightness(v)}
  color="var(--accent)"
/>
```

#### 7-05 RadialDial

**Name:** `"RadialDial"` | **Description:** `"Dial SVG 220×220. Arco 270° con fill stroke --accent e glow drop-shadow. Bottoni ±1."` (Italian)

**Live sample:** `<RadialDial value={dialVal} min={7} max={30} onChange={setDialVal} color="var(--accent)" label="Zona soggiorno" />` backed by `useState(21)`.
Sub-block uses `gap: 24` instead of 16 (per CD-01, RadialDial is 220px — needs breathing room).

**Token usage:** `color` prop passed as `"var(--accent)"` — arc stroke + glow recolors live.

**Snippet:**
```tsx
<RadialDial
  value={targetTemp}
  min={7}
  max={30}
  onChange={(v) => debouncedSetTemp(v)}
  color="var(--accent)"
  label={selectedZone.name}
/>
```

#### 7-06 SheetBtn

**Name:** `"SheetBtn"` | **Description:** `"Bottone sheet con icona 18px e label 14px/500. Sfondo rgba bianco 5%."` (Italian)

**Live sample:** Two side by side — `<SheetBtn Icon={Calendar} label="Orari" onClick={() => {}} />` and `<SheetBtn Icon={AlertTriangle} label="Manutenzione" onClick={() => {}} />`.

**Snippet:**
```tsx
<SheetBtn Icon={Calendar} label="Orari" onClick={() => router.push('/stove/scheduler')} />
<SheetBtn Icon={AlertTriangle} label="Manutenzione" onClick={() => router.push('/stove/maintenance')} />
```

#### 7-07 QuickActionButton

**Name:** `"QuickActionButton"` | **Description:** `"Bottone azione rapida full-width con icona + label. Variante primary = --accent fill."` (Italian)

**Live sample:** `<QuickActionButton Icon={Power} label="Accendi stufa" primary onClick={() => {}} />` full-width within the sample area.

**Snippet:**
```tsx
<QuickActionButton
  Icon={Power}
  label="Accendi stufa"
  primary
  onClick={() => handlePrimaryAction()}
/>
```

---

### Section 08 / SHEET GALLERY — New

**Eyebrow:** `"08 / DEMO"` | **Title:** `"Sheet device dal vivo"` | **Description:** `"Apri ciascun pannello con dati di esempio"` (D-26)

**Purpose:** Section 08 renders 5 glass pill launcher buttons. Each opens the real corresponding device sheet (`<StoveSheet>`, `<ClimateSheet>`, `<LightsSheet>`, `<SonosSheet>`, `<PlugsSheet>`) populated with fixture data. Only one sheet can be open at a time (D-14).

**State:**
```tsx
const [openSheet, setOpenSheet] = useState<'stove'|'climate'|'lights'|'sonos'|'plugs'|null>(null);
```

**Launcher row layout:**
```
flex row, gap: 32, flexWrap: 'wrap', justifyContent: 'center', marginTop: 24
```

**Launcher pill design:**
- `<Pressable as="button" onClick={() => setOpenSheet(device)} tabIndex={0}>`
- Style: `height: 40px, padding: '0 20px', borderRadius: 999, border: openSheet === device ? '1px solid var(--accent)' : '0.5px solid rgba(255,255,255,0.12)', background: openSheet === device ? 'rgba(255,255,255,0.08)' : 'transparent', color: openSheet === device ? 'var(--accent)' : 'var(--text-2)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, cursor: 'pointer'`
- Label: Italian device name (see Copywriting Contract below)

**Sheet rendering:**
```tsx
<StoveSheet  open={openSheet === 'stove'}   onClose={() => setOpenSheet(null)} data={stoveFixture} />
<ClimateSheet open={openSheet === 'climate'} onClose={() => setOpenSheet(null)} data={climateFixture} />
<LightsSheet  open={openSheet === 'lights'}  onClose={() => setOpenSheet(null)} data={lightsFixture} />
<SonosSheet   open={openSheet === 'sonos'}   onClose={() => setOpenSheet(null)} data={sonosFixture} />
<PlugsSheet   open={openSheet === 'plugs'}   onClose={() => setOpenSheet(null)} data={plugsFixture} />
```

**Fixture data (D-13):** extracted from `app/components/EmberGlass/sheets/__tests__/*.test.tsx` patterns into `app/debug/design-system-v2/sections/sheetFixtures.ts`. Each fixture is a minimal object satisfying the corresponding `<*Sheet>` prop contract:
- `stoveFixture`: `{ stove_state: 'on', power_level: 3, fan_level: 2 }` (shape from Phase 178 `useStoveData` return)
- `climateFixture`: `{ zones: [{ name: 'Soggiorno', current: 20.5, target: 21, active: true }, { name: 'Camera', current: 18.0, target: 19, active: false }], mode: 'auto' }`
- `lightsFixture`: `{ lights: [{ id: '1', name: 'Lampada 1', on: true }, { id: '2', name: 'Lampada 2', on: false }], scenes: [] }`
- `sonosFixture`: `{ groups: [{ id: 'g1', name: 'Soggiorno', playing: true, track: 'Nessun titolo', volume: 45 }] }`
- `plugsFixture`: `{ plugs: [{ id: 'p1', name: 'Lampada scrivania', on: true, power: 42, room: 'Studio' }] }`

**Note:** If the actual `<*Sheet>` components accept data via hooks (not props), use `useStoveData()` etc. inside the section with a fixture-seed approach. The executor should read Phase 178 sheet component contracts and adapt accordingly. The fixture object shapes above are guidance; the binding mechanism is implementation-discretion.

---

## CodeSnippet Primitive

**Path:** `app/debug/design-system-v2/sections/CodeSnippet.tsx`

**Props:**
```ts
interface CodeSnippetProps {
  code: string;
}
```

**Visual contract:**
```
┌────────────────────────────────────────────────────┐  ← 0.5px var(--glass-border)
│  <pre style={{                                      │     borderRadius: 8
│    background: 'var(--glass-bg)',                   │     padding: 12
│    fontFamily: 'ui-monospace, SF Mono, Menlo, ...',  │
│    fontSize: 12,                                    │
│    fontWeight: 400,                                 │
│    color: 'var(--text-2)',                          │
│    lineHeight: 1.5,                                 │
│    margin: 0,                                       │
│    overflow: 'auto',                                │
│  }}>                                               │
│    <code>{code}</code>                              │
│  </pre>                                            │
│                                                    │   ← copy button
│                               ┌──────────────────┐ │
│                               │ Copia / Copiato  │ │   position: absolute, top: 8, right: 8
│                               └──────────────────┘ │
└────────────────────────────────────────────────────┘
```

**Container:** `position: 'relative'` to allow absolute-positioned copy button.

**Copy button (D-18, D-19):**
- `<Pressable as="button" type="button" onClick={handleCopy} tabIndex={0} aria-label={copied ? "Copiato" : "Copia codice"} data-pressable-focusable="true">`
- Style: `position: 'absolute', top: 8, right: 8, height: 24, padding: '0 8px', borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.08)', color: 'var(--text-2)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4`
- Label logic: `copied ? "Copiato" : "Copia"`. After `navigator.clipboard.writeText(code)` resolves, set `copied = true`; after 1500ms, set `copied = false`.
- `aria-live="polite"` on the label span so screen readers announce the state change.
- Silent failure: `try/catch` around `navigator.clipboard.writeText`; on failure, keep "Copia" and do not show error. (D-04, D-19)

**Accessibility:**
- Container: `role` not needed (it's a decorative `<div>`).
- Button: `type="button"` mandatory (D-18); `aria-label` updates with state; `data-pressable-focusable="true"` for Phase 175 focus-visible rule.
- `<pre>` is readable by screen readers; no additional `role`.

**Reduced motion:** `<Pressable>` press animation inherits `.press-anim` reduced-motion override from Phase 175.

---

## Copywriting Contract

Italian visible copy (project locale per `<html lang="it">`). Code identifiers and aria labels in English.

### Section titles (D-26)

| Section | Eyebrow | Title | Description |
|---------|---------|-------|-------------|
| 05 | `"05 / TOKENS"` | `"Token, tipografia e spaziatura"` | `"Valori risolti da :root in tempo reale"` |
| 06 | `"06 / CARDS"` | `"Primitive carta"` | `"Componenti delle dashboard card"` |
| 07 | `"07 / SHEET"` | `"Primitive sheet"` | `"Componenti dei pannelli a comparsa"` |
| 08 | `"08 / DEMO"` | `"Sheet device dal vivo"` | `"Apri ciascun pannello con dati di esempio"` |

### Per-primitive descriptions (Italian, one line each — D-26)

| Primitive | Description |
|-----------|-------------|
| GlassCard | `"Superficie base 1:1 vetro. Riceve tone wash, press scale via Pressable."` |
| CardHead | `"Intestazione carta: icona 32×32, etichetta 13px/600, slot destra opzionale."` |
| StatusDot | `"Indicatore 8×8 on/off. Glow 12px box-shadow quando on. Colore variabile."` |
| InlineToggle | `"Switch iOS 44×26. Thumb animato con cubic-bezier(.34,1.56,.64,1). stopPropagation obbligatorio."` |
| CircBtn | `"Pulsante circolare 34×34. Variante primary colorata da --accent."` |
| MiniStat | `"Stat 2-righe: etichetta 11px, valore 15px display, barra progresso 3px --accent."` |
| FlameViz | `"Visualizzazione fiamma animata quando on. intensity da 0 a 1. Colore da --accent."` |
| PlayingBars | `"3 barre Sonos animate. CSS keyframes sonosBar0/1/2. Colore #b080ff fisso."` |
| SheetRow | `"Riga sheet con label + slot destra. Separatore 0.5px glass-border."` |
| Stepper | `"Controllo −/+ con valore centrale. Pulsanti 36×36. Curva spring su thumb."` |
| Slider | `"Range input 140px con fill --accent. Usato per temperatura obiettivo rapida."` |
| BigSlider | `"Slider orizzontale 72px. Fill gradient --accent. Percentuale display Outfit 28/600."` |
| RadialDial | `"Dial SVG 220×220. Arco 270° con fill stroke --accent e glow drop-shadow. Bottoni ±1."` |
| SheetBtn | `"Bottone sheet con icona 18px e label 14px/500. Sfondo rgba bianco 5%."` |
| QuickActionButton | `"Bottone azione rapida full-width con icona + label. Variante primary = --accent fill."` |

### CodeSnippet copy button

| State | Italian label | English aria-label |
|-------|---------------|--------------------|
| Idle | `"Copia"` | `"Copia codice"` |
| After copy (1500ms) | `"Copiato"` | `"Copiato"` |

### Section 08 launcher pill labels

| Device | Italian label |
|--------|---------------|
| stove | `"Stufa"` |
| climate | `"Clima"` |
| lights | `"Luci"` |
| sonos | `"Sonos"` |
| plugs | `"Prese"` |

### Primary CTA

**None.** This is a dev-only reference page. The "actions" are: hue swatches (Section 01), ambient toggle (Section 02), splash replay button (Section 03), sheet demo open (Section 04), copy-to-clipboard buttons (Sections 05-07), sheet launcher buttons (Section 08). All labeled above.

### Empty state

**n/a.** Section 05 token rows always render (CSS variables always have computed values). Section 06/07 live samples are always populated (they use fixed/fixture state). Section 08 launchers are always visible.

### Error state

**n/a for visible UI.** Clipboard failure: silent (try/catch, keeps "Copia" label — D-04, D-19). Sheet fixture data is hardcoded; no network call, no error path. `getComputedStyle` cannot fail (always returns a value, may return empty string for unset variables — in that case display `"—"` as the resolved value).

### Destructive confirmation

**n/a.** Phase 182 has zero destructive actions. The sheet gallery opens real sheets with fixture data but no destructive commands are invoked (no power-off, no delete).

**Copy invariants:**
- All visible UI copy in Italian.
- Code identifiers (component names, prop names, file paths) in English.
- `aria-label` strings in English (consistency with Phase 174 `"Set accent to {Name}"` pattern).
- No emoji in production copy.
- Token names rendered inside `<code>` element (`--accent`, `var(--font-display)` etc.) within description strings.

---

## Interaction Contract

### Accent picker → live recolor (DSREF-03)

The existing Phase 174 accent picker in Section 01 writes `--accent` via `document.documentElement.style.setProperty`. Every new surface in Sections 05-08 that references `var(--accent)` recolors immediately — no reload, no re-fetch:
- Section 05: `--accent` swatch cell and spacing-scale bar color.
- Section 06: GlassCard tone wash, StatusDot on-color, InlineToggle thumb color, CircBtn primary background, MiniStat progress fill.
- Section 07: Slider fill color, BigSlider track fill, RadialDial arc stroke + glow, QuickActionButton primary fill.
- Section 08: launcher pill border + text when selected.

This invariant is the testable form of SC-#3. The Playwright assertion (D-20) validates it by changing the picker to violet and asserting computed styles on `<CircBtn primary>` and `<BigSlider>`.

### CodeSnippet copy button

- On click: `navigator.clipboard.writeText(code)` → on resolve: `setCopied(true)` → 1500ms `setTimeout`: `setCopied(false)`.
- Label shows "Copia" idle / "Copiato" for 1500ms after copy.
- `aria-live="polite"` on label span → screen reader announces state change.
- Failure (clipboard API unavailable): silent catch, label stays "Copia".
- Press animation: Phase 175 `<Pressable>` scale(0.97) cubic-bezier(.34,1.56,.64,1) 220ms.

### Section 08 sheet launchers

- Clicking a launcher pill sets `openSheet` to the device key. The corresponding real sheet renders open.
- Clicking the same pill again: closes the sheet (sets `openSheet(null)`) — the `onClose` handler already does this.
- Clicking a different pill while a sheet is open: the old sheet closes (its `open` prop becomes `false`), the new sheet opens. This is automatic because `openSheet` can only hold one value.
- Phase 175 Sheet dismissal: ESC key, backdrop tap, close button — all call `onClose(() => setOpenSheet(null))`.
- Phase 181 `<SheetCounter>`: the five sheets in Section 08 are real `<Sheet>` instances; opening them will trigger `incrementSheetCount()` → `body[data-sheet-open="true"]` → BottomTabBar slides down. Intentional — demonstrates the hide-on-sheet-open behavior (NAV-03) live on the reference page.

### Stateful primitives (Sections 06/07)

Each stateful sample uses its own isolated `useState`. State changes are local to the section; they do not affect any global device state or hook.

| Primitive | State | Behavior |
|-----------|-------|----------|
| InlineToggle | `useState(false)` | Toggles `on` prop; shows thumb animation |
| Stepper | `useState(3)` | ± 1 per button click; constrained to `min: 1, max: 5` |
| Slider | `useState(50)` | Drag or click range input; 0-100 |
| BigSlider | `useState(60)` | Drag or click range input; 0-100; fill updates live |
| RadialDial | `useState(21)` | ± 1 per button; constrained to `min: 7, max: 30`; arc redraws live |
| FlameViz | `useState(true)` for `on`; `intensity` fixed at 0.6 for simplicity | Toggle button below the sample |

---

## Component Inventory

| Component | Path | New/Edit | Contract |
|-----------|------|----------|---------|
| `<CircBtn>` | `app/components/EmberGlass/cards/CircBtn.tsx` | **NEW** | Verbatim port of `cards.jsx:298-308`. Props: `{ Icon, onClick, primary?, tone }`. Bundle-verbatim styles. `34×34` circle. |
| CircBtn test | `app/components/EmberGlass/cards/__tests__/CircBtn.test.tsx` | **NEW** | D-09: renders primary + default variants; aria role; click wiring |
| `<BigSlider>` | `app/components/EmberGlass/sheets/primitives/BigSlider.tsx` | **NEW** | Verbatim port of `sheets.jsx:515-533`. Props: `{ value, onChange, color? }`. Default `color = 'var(--accent)'`. |
| BigSlider test | `app/components/EmberGlass/sheets/primitives/__tests__/BigSlider.test.tsx` | **NEW** | D-09: onChange wiring; aria-valuenow; color prop honored |
| `<CodeSnippet>` | `app/debug/design-system-v2/sections/CodeSnippet.tsx` | **NEW** | Pre/code block + Pressable copy button. Props: `{ code: string }`. Copy state 1500ms. |
| `<Section01Hue>` | `app/debug/design-system-v2/sections/Section01Hue.tsx` | **NEW** | Extracted verbatim from `page.tsx` lines ~161-219. Owns `activeHue`, `setAccent`. |
| `<Section02Ambient>` | `app/debug/design-system-v2/sections/Section02Ambient.tsx` | **NEW** | Extracted verbatim. Owns `ambientOn`. |
| `<Section03Splash>` | `app/debug/design-system-v2/sections/Section03Splash.tsx` | **NEW** | Extracted verbatim. Owns `replayKey`. |
| `<Section04Sheet>` | `app/debug/design-system-v2/sections/Section04Sheet.tsx` | **NEW** | Extracted verbatim. Owns `sheetOpen` for demo sheet. |
| `<Section05Tokens>` | `app/debug/design-system-v2/sections/Section05Tokens.tsx` | **NEW** | Token grid, typography specimens, spacing tiles, shadow/blur tiles. Reads via `getComputedStyle`. |
| `<Section06CardPrimitives>` | `app/debug/design-system-v2/sections/Section06CardPrimitives.tsx` | **NEW** | 8 card-primitive sub-blocks with live samples + CodeSnippet. |
| `<Section07SheetPrimitives>` | `app/debug/design-system-v2/sections/Section07SheetPrimitives.tsx` | **NEW** | 7 sheet-primitive sub-blocks with live samples + CodeSnippet. Each stateful primitive has isolated useState. |
| `<Section08SheetGallery>` | `app/debug/design-system-v2/sections/Section08SheetGallery.tsx` | **NEW** | 5 launcher pills + fixture-backed real sheet renders. Shared `useState<device|null>`. |
| `sheetFixtures.ts` | `app/debug/design-system-v2/sections/sheetFixtures.ts` | **NEW** | Typed fixture objects for 5 device sheets. |
| `app/debug/design-system-v2/page.tsx` | existing | **EDIT** | Thin orchestrator (~80 LOC). Imports + renders Section01-08 in order. |
| `app/components/EmberGlass/index.ts` | existing | **EDIT** | Add `CircBtn` + `BigSlider` exports (D-05/D-06). |
| `app/components/EmberGlass/cards/index.ts` | existing or new | **EDIT/NEW** | Barrel re-export for `CircBtn`. |
| `app/components/EmberGlass/sheets/primitives/index.ts` | existing | **EDIT** | Add `BigSlider` export. |
| `app/debug/design-system-v2/__tests__/page.test.tsx` | existing | **EDIT** | D-21: assert each `<Section0X>` mounts (via section heading text). |
| `tests/playwright/design-system-v2.spec.ts` | existing | **EDIT** | D-20: append `test.describe('Phase 182 primitives reference')`. |

**No new routes.** No nav-link changes. No auth changes. (D-23, D-24)

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — project does not use shadcn (no `components.json` — verified 2026-05-03) | not applicable |
| third-party | none | not applicable |

**Notes:**
- Phase 182 introduces zero new external packages. All imports are from existing deps (`react`, `lucide-react`, `@radix-ui/react-dialog` via Phase 175 `<Sheet>`).
- Vetting gate: not required.

---

## Accessibility

### CodeSnippet copy button
- `type="button"` (prevents accidental form submission)
- `aria-label` updates with copy state ("Copia codice" → "Copiato")
- `aria-live="polite"` on the label span (screen reader announces "Copiato" on copy)
- `:focus-visible` accent outline via Phase 175 `[data-pressable-focusable="true"]:focus-visible` rule
- Press animation via Phase 175 Pressable

### CircBtn
- `<button>` (native semantics)
- `type="button"` — executor MUST set (bundle uses plain `onClick={onClick}` button; add `type="button"` in the port)
- `aria-label` should be set by the consumer (not included in the primitive — bundle-verbatim posture)
- `:focus-visible` — add `data-pressable-focusable="true"` attribute on the button OR rely on existing `button:focus-visible` rule if one exists in `globals.css`

### BigSlider
- `<input type="range">` native semantics (ARIA role `slider` is implicit)
- `aria-valuemin`, `aria-valuemax`, `aria-valuenow` provided by the native `<input type="range" min max value>` attributes automatically
- The visible overlay div is `pointerEvents: 'none'` (decorative) — only the transparent `<input>` receives interaction

### Section 08 launchers
- `<Pressable as="button" tabIndex={0}>` (keyboard accessible)
- `type="button"` mandatory
- Label matches visible text — no additional `aria-label` needed
- Open sheet traps focus via Radix (Phase 175 contract)

### Page-level
- Page has a single `<h1>` (Phase 174 carry-forward: "Ember Glass") and one `<h2>` per section (section titles).
- All sections are wrapped in `<section>` elements for landmark navigation.
- New sections 05-08 follow the same `<h2>` heading pattern.

---

## Verification Mapping

| Requirement | Visual contract surface | Verification method |
|-------------|-------------------------|---------------------|
| DSREF-01 | Sections 05-07 render 13 primitive samples + token/typography/spacing/shadow reference | Playwright: each primitive sub-block heading text present in DOM; Jest: `page.test.tsx` asserts each section renders |
| DSREF-02 | Every primitive from Phases 174-181 has a sub-block with CodeSnippet | Cross-reference: Phase 177-181 component import lists vs. D-12 coverage checklist (all 13 present) |
| DSREF-03 | Section 01 accent picker → live recolor on CircBtn primary + BigSlider | Playwright D-20: pick violet, assert `getComputedStyle` on CircBtn primary background + BigSlider fill contains `oklch(0.65 0.17 290)` |
| D-08 (bundle verbatim) | CircBtn source matches `cards.jsx:298-308`; BigSlider source matches `sheets.jsx:515-533` | Code review: line-by-line diff during plan verification |
| D-19 (copy feedback) | 1500ms "Copiato" revert | Jest on CodeSnippet: fake timers; assert label is "Copiato" immediately after click, "Copia" after 1500ms |
| D-20 (Playwright accent recolor) | accent-picker → var(--accent) → CircBtn primary + BigSlider fill | `tests/playwright/design-system-v2.spec.ts` `test.describe('Phase 182 primitives reference')` |
| D-12 (13 primitives coverage) | Sections 06+07 contain all 13 named sub-blocks | Playwright: all 13 heading text assertions in D-20 spec |

---

## Claude's Discretion (auto-resolved per CD-01..CD-05)

| Item | Resolution | Rationale |
|------|------------|-----------|
| Sub-block gap (CD-01) | `gap: 16` within Sections 06/07; `gap: 24` for RadialDial sub-block only | RadialDial is 220px — needs more breathing. All others at 16 per Phase 174 envelope rhythm. |
| Primitive order within sections (CD-02) | Section 06: GlassCard → CardHead → StatusDot → InlineToggle → CircBtn → MiniStat → FlameViz → PlayingBars. Section 07: SheetRow → Stepper → Slider → BigSlider → RadialDial → SheetBtn → QuickActionButton | Foundational first (GlassCard/SheetRow as parent), then controls (toggles/steppers), then numerics (MiniStat/RadialDial), then buttons (SheetBtn/QAB). |
| JSX snippet content (CD-03) | Snippets show realistic prop usage with real Italian copy where applicable, not bare minimum. Comments added sparingly only where behavior is non-obvious (e.g. `stopPropagation` in InlineToggle). | The reference page is for designers + devs; realistic snippets reduce the "how do I actually use this?" question. |
| vscode:// view-source links (CD-04) | **Skipped.** | Adds complexity; filesystem paths would need to be hardcoded and break across machines. Plain code snippet is sufficient. |
| Section ToC (CD-05) | **Deferred.** The 8-section page is scannable by scrolling; the section eyebrows ("01 / HUE" etc.) provide orientation. A sticky ToC can be added in a follow-up if the page becomes unwieldy after further additions. | Phase 174 set the no-ToC precedent for this page. 8 sections is manageable. |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — all visible copy declared (IT), CodeSnippet button copy ("Copia"/"Copiato") locked, all section titles/descriptions declared, aria labels in English, no destructive copy needed, empty/error states declared as n/a with rationale
- [ ] Dimension 2 Visuals: PASS — page-level layout grammar specified with exact px values; all 8 sections specified with eyebrow/title/description/content; every primitive sub-block specifies name/description/live-sample/snippet layout; CodeSnippet pre+button visual contract pixel-precise; CircBtn + BigSlider bundle-verbatim size contracts locked; Section 08 launcher pill design specified; fixture shapes specified
- [ ] Dimension 3 Color: PASS — 60/30/10 split declared; accent reserved-for list (5 Phase 182 additions + inherited items); all AUDIT-EXCEPTION literals enumerated with bundle source references; recolor invariant specified for DSREF-03
- [ ] Dimension 4 Typography: PASS — 9 sizes declared (12/13/14/16/18/24/28/40/68), 3 weights (400/500/600), families explicitly bound to `var(--font-display)` Outfit and `var(--font-body)` Inter; typography specimen content specified for Section 05 display; verification gate specified
- [ ] Dimension 5 Spacing: PASS — spacing scale declared (0/4/8/12/16/20/24/28/32/48/64); bundle-verbatim exceptions enumerated (0.5px/20/34/72/220); page envelope grammar specified (maxWidth 1240, marginBottom 48, gap 16/24, hr margin 24px 0); sub-block internal layout specified
- [ ] Dimension 6 Registry Safety: PASS (vacuous) — no shadcn, no third-party blocks, no new deps

**Approval:** pending (gsd-ui-checker)

---

*UI-SPEC drafted: 2026-05-03 by gsd-ui-researcher (auto mode — all gray areas resolved from CONTEXT.md D-01..D-26 + CD-01..CD-05).*
*Sources: 182-CONTEXT.md, 174-UI-SPEC.md, 175-UI-SPEC.md, 177-UI-SPEC.md, 178-UI-SPEC.md, 181-UI-SPEC.md (lines 1-100), `cards.jsx:298-308`, `sheets.jsx:515-533`, `page.tsx` (live), `index.ts` (live), `globals.css` (live).*
