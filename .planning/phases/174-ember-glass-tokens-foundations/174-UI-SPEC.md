---
phase: 174
slug: ember-glass-tokens-foundations
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-27
---

# Phase 174 — UI Design Contract

> Visual and interaction contract for the **Ember Glass tokens & foundations** phase. Auto-resolved per CONTEXT.md (D-01..D-19) + the design bundle (`.planning/inbox/ember-glass-design/`). Verified by gsd-ui-checker downstream.

**Scope reminder (per D-19):** This phase ships ONLY (a) the 11 token CSS variables on `:root`, (b) the 6 oklch hue presets, (c) the `.glass-surface` utility + `@supports` fallback + ambient keyframes in `globals.css`, (d) the minimal `/debug/design-system-v2` reference page (token grid + 6-hue picker + ambient toggle + 1 demo glass card), and (e) the `<AmbientBg>` provider + inline pre-paint script. Dashboard cards, sheets, splash, room tabs, automations, nav-glass, and the full design-system reference page are **deferred to phases 175–182**.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Tailwind v4 + CVA — project convention; no shadcn) |
| Preset | not applicable |
| Component library | none (custom primitives via CVA + Radix where needed; existing project pattern) |
| Icon library | `lucide-react` (existing — used by `/debug` pages and Hue picker swatches in this phase) |
| Display font | **Outfit** via `next/font/google` → `--font-display-outfit` → aliased to `--font-display` (D-09, D-10) |
| Body font | **Inter** via `next/font/google` → `--font-body-inter` → aliased to `--font-body` (D-09, D-10) |
| Color space | **OKLCH** for `--accent`; `color-mix(in oklab, …)` for ambient gradients (Pattern 3 in RESEARCH.md) |
| Layer system | Tailwind v4 `@theme` block + sibling `:root` Ember Glass block (placed AFTER `@theme`) per D-01 |

**Detected existing UI:**
- `app/globals.css` — Tailwind v4 `@theme` block at line 13; existing `--font-display: 'Outfit'` and `--font-body: 'Space Grotesk'` at lines 209–211 (will be cascade-overridden by new `:root` block per Pitfall 1).
- `app/fonts.ts` — `next/font/google` pipeline with `Outfit` + `Space_Grotesk`. Body font swaps to `Inter`; both `variable:` names rename per D-10.
- `app/layout.tsx` — server component; will mount `<AmbientBg>` + inline pre-paint `<script>`.
- `app/debug/design-system/` — existing Ember Noir reference; **untouched in this phase**. New `app/debug/design-system-v2/` is a sibling.
- Existing glass utilities `glass-dark`, `glass-vibrancy`, `glass-shine` (`globals.css:1029-1034, 1424-1430`) — kept as-is; new `.glass-surface` utility coexists.

---

## Spacing Scale

Declared values (all multiples of 4):

| Token | Value | Usage in Phase 174 |
|-------|-------|-------|
| xs | 4px | Token-grid inline gaps; swatch border thickness inset |
| sm | 8px | Picker swatch grid gap; toolbar inner-element spacing |
| md | 16px | `--pad-card` default (D-02); demo glass card internal padding; toolbar→content spacing |
| lg | 24px | `--r-card` default (D-02); demo card outer margin; section breaks on `/debug/design-system-v2` |
| xl | 32px | Page-header → first section spacing on `/debug/design-system-v2` |
| 2xl | 48px | Major vertical break between picker/token-grid/demo-card sections |

**Token cross-reference (DS-01):**
- `--pad-card: 16px` (md) — confirmed by D-02; medium density per design bundle (`app.jsx:97`).
- `--r-card: 24px` (lg) — confirmed by D-02; design-bundle slider midpoint.

**Exceptions:** none for this phase. Hue swatch tap targets are 44px square (≥ Apple HIG minimum); 44 is a 4-multiple.

---

## Typography

Declared roles for Phase 174 surfaces (`/debug/design-system-v2` reference page + demo glass card). Sizes lifted from the design bundle's `Design System.html` (`.ph h1`, section headers, body, caption) and clamped to the 4-size budget.

| Role | Size | Weight | Line Height | Family | Used By |
|------|------|--------|-------------|--------|---------|
| Body | 16px | 400 (regular) | 1.5 | `var(--font-body)` (Inter) | Token table cells, demo-card description, picker labels, toggle copy |
| Label / Caption | 12px | 600 (semibold) | 1.4 | `var(--font-body)` (Inter) | Section eyebrow ("01 / TOKENS"), token names in grid, swatch hue names; uppercase + 1.2px letter-spacing per design bundle convention |
| Section heading | 24px | 600 (semibold) | 1.2 | `var(--font-display)` (Outfit) | Section titles ("Tokens", "Hue presets", "Ambient", "Glass surface demo") |
| Page display | 40px | 600 (semibold) | 1.05 | `var(--font-display)` (Outfit) | Page title "Ember Glass · v2" with -1.0px letter-spacing |

**Weights:** exactly 2 — `400` (regular body) + `600` (semibold for labels, headings, display).

**Verification gate:** A repo-wide grep against the new files in this phase MUST show zero usages of font sizes outside `{12, 16, 24, 40}` and zero font weights outside `{400, 600}`. The 4 sizes / 2 weights budget is locked for this phase's surfaces; later phases may extend.

**Self-host invariant (DS-04):** Both fonts render exclusively from `/_next/static/media/*.woff2`. Zero requests to `fonts.googleapis.com` or `fonts.gstatic.com` (Playwright assertion in `tests/smoke/ember-glass-fonts.spec.ts`).

---

## Color

Phase 174 dark-only Ember Glass palette. The 60/30/10 split applies to the `/debug/design-system-v2` reference page surface — it is the only new visual surface this phase ships.

| Role | Value | Token | Usage |
|------|-------|-------|-------|
| Dominant (60%) | `#0a0908` (linear-gradient with `#1c1917` 50% midpoint per `app.jsx:172`) | `--bg-0` (existing project bg, kept) | Page background; ambient layer's solid base when ambient is OFF |
| Secondary (30%) | `rgba(255, 255, 255, 0.04)` over the dark base | `--glass-bg` | Glass surface fills (demo card, picker toolbar, token grid card); `.glass-surface` utility |
| Accent (10%) | `oklch(0.68 0.17 45)` (Copper, default) — runtime-overridable via `setProperty('--accent', …)` | `--accent` | **Reserved for:** (1) the active hue-swatch outer ring on the picker, (2) the ambient glow blob color (when ambient ON), (3) the demo glass card's `:focus-visible` outline + the "Demo accent" inline preview swatch INSIDE the demo card |
| Text primary | `#f5f5f4` | `--text-1` | All headings + body text on glass |
| Text secondary | `rgba(245, 245, 244, 0.55)` | `--text-2` | Captions, hint text, inactive swatch labels, token-value mono strings in the grid |
| Border | `rgba(255, 255, 255, 0.08)` | `--glass-border` | Glass surface 1px inset border; section dividers |
| Shadow | `0 8px 32px rgba(0,0,0,0.18), inset 0 0 0 0.5px rgba(255,255,255,0.03)` | `--glass-shadow` | Glass surface elevation |
| Destructive | n/a in this phase | — | No destructive actions in Phase 174 (no delete/reset/danger paths) |

**Accent reserved-for list (the 10% zone):**
1. **Active hue swatch ring** on the 6-hue picker — the currently-applied accent gets a 2px ring colored `var(--accent)`.
2. **Ambient glow** primary blob (`ambientA` keyframe) when the ambient toggle is ON — uses `color-mix(in oklab, var(--accent) 60%, transparent)` per `app.jsx:178`.
3. **Demo glass card "Live preview" swatch** — a small inline rectangle inside the demo card filled with `var(--accent)` to demonstrate live token swap.
4. **Demo glass card border-glow on `:focus-visible`** — `box-shadow: 0 0 0 2px var(--accent)` for keyboard-focus only.

**Explicitly NOT accented in this phase:** toggle thumb (uses `--text-1`), toolbar background (uses `--glass-bg`), section headings (uses `--text-1`), nav links (uses `--text-2` → `--text-1` on hover, no accent). Accent is rare-and-precious per the 10% rule.

**6-hue preset palette (DS-03, D-05):**

| Name | OKLCH | Hue ° | Visual | Default? |
|------|-------|-------|--------|----------|
| Copper | `oklch(0.68 0.17 45)` | 45 | Warm orange-red ember | **YES** (default) |
| Rose | `oklch(0.68 0.17 0)` | 0 | Pink-red | no |
| Violet | `oklch(0.65 0.17 290)` | 290 | Purple | no |
| Blue | `oklch(0.65 0.14 230)` | 230 | Cool blue (was "Ocean" in design bundle) | no |
| Green | `oklch(0.68 0.12 150)` | 150 | Sage green (was "Sage" in design bundle) | no |
| Amber | `oklch(0.76 0.15 75)` | 75 | Gold-yellow | no |

Bundle's "Coral" (`oklch(0.7 0.17 25)`) is dropped — success criterion #2 locks exactly 6, not 7 (CONTEXT.md §specifics).

**Ambient layer (DS-05) — visual contract:**
- Three radial-gradient blobs, each `position: fixed`, `border-radius: 999px`, `pointer-events: none`, `aria-hidden="true"`, `filter: blur(60-80px)`.
- Blob A: top: -60, left: -60; 320×320; `radial-gradient(circle, color-mix(in oklab, var(--accent) 60%, transparent) 0%, transparent 70%)`; opacity 0.5; animation `ambientA 14s ease-in-out infinite`.
- Blob B: bottom: 120, right: -80; 360×360; `radial-gradient(circle, color-mix(in oklab, var(--accent) 40%, #301010) 0%, transparent 70%)`; opacity 0.4; animation `ambientB 18s ease-in-out infinite`.
- Blob C: top: 40%, left: 30%; 260×260; `radial-gradient(circle, rgba(94,175,255,0.25) 0%, transparent 70%)` — fixed cool-blue counterpoint, NOT recolored by accent; opacity 0.4; animation `ambientC 22s ease-in-out infinite`.
- Z-index: 0 (behind app shell). App shell content sits at z-index ≥ 1.
- Visible only when `localStorage['ember-glass-ambient'] === 'true'` AND data attribute `<html data-ambient="on">` is set by inline pre-paint script.
- Default: **OFF** on first visit (D-14). User opts in from the toolbar.

**Keyframe transforms (canonical — verified from design bundle `Pannello Stufa - Redesign.html:46-57`, supersedes RESEARCH.md A1 assumption):**
```css
@keyframes ambientA { 0%, 100% { transform: translate(0, 0) scale(1); }     50% { transform: translate(40px, 30px) scale(1.15); } }
@keyframes ambientB { 0%, 100% { transform: translate(0, 0) scale(1); }     50% { transform: translate(-30px, -40px) scale(1.1); } }
@keyframes ambientC { 0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; } 50% { transform: translate(20px, -20px) scale(1.2); opacity: 0.6; } }
```

**Reduced-motion contract:** `@media (prefers-reduced-motion: reduce)` disables ambient animations (`animation: none`); blobs stay static at their 0% transform. The toggle still works (visual presence ON/OFF), only the drift is suppressed.

---

## Token Inventory (DS-01 — visual source of truth)

The 11 tokens this phase ships, each with its visual contract. This is the table the demo `/debug/design-system-v2` "Tokens" section renders live.

| Token | Value (default) | Visual Role | Renderable on demo card? |
|-------|-----------------|-------------|--------------------------|
| `--glass-bg` | `rgba(255, 255, 255, 0.04)` | Glass surface fill (4% white over dark) | yes — fills the demo card |
| `--glass-blur` | `24px` | Backdrop blur radius for `.glass-surface` | yes — visible blur of ambient when ON |
| `--glass-border` | `rgba(255, 255, 255, 0.08)` | 1px inset border on glass surfaces | yes — demo card border |
| `--glass-shadow` | `0 8px 32px rgba(0,0,0,0.18), inset 0 0 0 0.5px rgba(255,255,255,0.03)` | Card elevation + 0.5px inner highlight | yes — demo card drop-shadow |
| `--accent` | `oklch(0.68 0.17 45)` | Hue-shiftable accent (10% zone) | yes — inline live preview swatch |
| `--text-1` | `#f5f5f4` | Primary text | yes — demo card title |
| `--text-2` | `rgba(245, 245, 244, 0.55)` | Secondary text | yes — demo card body copy |
| `--r-card` | `24px` | Glass-surface border-radius | yes — demo card corners |
| `--pad-card` | `16px` | Glass-surface inner padding | yes — demo card padding |
| `--font-display` | `var(--font-display-outfit), system-ui, sans-serif` | Display family | yes — demo card title |
| `--font-body` | `var(--font-body-inter), system-ui, sans-serif` | Body family | yes — demo card body |

**Audit gate (DS-02, D-04):** New files in this phase (`app/components/EmberGlass/AmbientBg.tsx`, `app/debug/design-system-v2/page.tsx`, plus the new `:root` block in `globals.css`) MUST contain zero hardcoded glass/blur/accent hex strings. Allowed exceptions: (1) the picker preset map (literal `oklch(...)` strings — that IS the source of truth), (2) the ambient blob B's `#301010` mix-target color (lifted verbatim from design bundle, intentional non-token), (3) the ambient blob C's static blue `rgba(94,175,255,0.25)` (intentional non-accent counterpoint). All three exceptions are documented inline in the source file with a `// AUDIT-EXCEPTION` comment.

---

## `/debug/design-system-v2` Page Layout (the only new visual surface this phase)

Single client component (`'use client'`). Vertical stack, max-width 1240px, centered, dark background, lives behind the optional `<AmbientBg>` layer.

**Layout (top → bottom):**

```
┌──────────────────────────────────────────────────────────────────┐
│  Page header (margin-bottom 32px)                                 │
│  ┌───────────────────────────────────────────────────────┐        │
│  │ EYEBROW: "DESIGN SYSTEM · v2" (12px / 600 / uppercase)│        │
│  │ TITLE:   "Ember Glass" (40px / 600 / Outfit)          │        │
│  │ SUBTITLE: token reference + live picker (16px /       │        │
│  │  Inter / --text-2)                                    │        │
│  │ BADGE: "Phase 174" (pill, accent-tinted)              │        │
│  └───────────────────────────────────────────────────────┘        │
│                                                                   │
│  ─── Section divider (0.5px / --glass-border) ───                 │
│                                                                   │
│  Section 01 — Hue picker (margin-bottom 48px)                     │
│  ┌─────────────────────────────────────────────────────┐          │
│  │ "01 / HUE"  ·  "Click a swatch to live-update --accent" │       │
│  │ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐                       │          │
│  │ │Cu│ │Ro│ │Vi│ │Bl│ │Gn│ │Am│   ← 6 swatches, 44×44 │          │
│  │ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘                       │          │
│  │   Active swatch: 2px outer ring var(--accent)        │          │
│  │   Hover: subtle scale(1.05); focus-visible: 2px ring │          │
│  │   Below each swatch: 12px label ("Copper", "Rose"…)  │          │
│  └─────────────────────────────────────────────────────┘          │
│                                                                   │
│  Section 02 — Ambient toggle (margin-bottom 48px)                 │
│  ┌─────────────────────────────────────────────────────┐          │
│  │ "02 / AMBIENT"                                      │          │
│  │ Row: Label "Ambient glow"  ……  [Toggle ○─●]         │          │
│  │ Helper: "Persists in localStorage. Off by default." │          │
│  │ State sync: localStorage['ember-glass-ambient'] +   │          │
│  │   custom event 'ember-glass-ambient-change'         │          │
│  └─────────────────────────────────────────────────────┘          │
│                                                                   │
│  Section 03 — Token grid (margin-bottom 48px)                     │
│  ┌─────────────────────────────────────────────────────┐          │
│  │ "03 / TOKENS"                                       │          │
│  │ Two-column grid (single column on < 640px):         │          │
│  │ ┌─────────────────┬─────────────────┐               │          │
│  │ │ --glass-bg      │ rgba(...,0.04)  │  ← live cell  │          │
│  │ │ --glass-blur    │ 24px            │               │          │
│  │ │ --glass-border  │ rgba(...,0.08)  │               │          │
│  │ │ --glass-shadow  │ 0 8px 32px ...  │               │          │
│  │ │ --accent        │ [oklch swatch]  │  ← updates    │          │
│  │ │                 │   live          │               │          │
│  │ │ --text-1        │ #f5f5f4         │               │          │
│  │ │ --text-2        │ rgba(...,0.55)  │               │          │
│  │ │ --r-card        │ 24px            │               │          │
│  │ │ --pad-card      │ 16px            │               │          │
│  │ │ --font-display  │ Outfit (Aa Bb)  │  ← rendered   │          │
│  │ │ --font-body     │ Inter (Aa Bb)   │  ← rendered   │          │
│  │ └─────────────────┴─────────────────┘               │          │
│  │ Token names: 12px / 600 / mono (JetBrains Mono OK   │          │
│  │   per design bundle but NOT loaded in this phase —   │          │
│  │   use --font-body 12px instead).                    │          │
│  │ Token values: 12px / --text-2.                      │          │
│  └─────────────────────────────────────────────────────┘          │
│                                                                   │
│  Section 04 — Glass-surface demo card                             │
│  ┌─────────────────────────────────────────────────────┐          │
│  │ "04 / DEMO"                                         │          │
│  │ ┌──────────────────────────────────────────┐        │          │
│  │ │ [.glass-surface — the only consumer of   │        │          │
│  │ │   .glass-surface utility in this phase]  │        │          │
│  │ │                                          │        │          │
│  │ │ "Glass surface demo" (24px / Outfit)     │        │          │
│  │ │ "Live token preview. Click a hue above." │        │          │
│  │ │ (16px / Inter / --text-2)                │        │          │
│  │ │ ┌────┐ ← inline accent swatch            │        │          │
│  │ │ │    │  filled with var(--accent),       │        │          │
│  │ │ └────┘  32×32, --r-card scaled to 8px    │        │          │
│  │ │                                          │        │          │
│  │ │ Padding: var(--pad-card)                 │        │          │
│  │ │ Radius:  var(--r-card)                   │        │          │
│  │ │ Border:  1px solid var(--glass-border)   │        │          │
│  │ │ BG:      var(--glass-bg) + backdrop-blur │        │          │
│  │ │ Shadow:  var(--glass-shadow)             │        │          │
│  │ └──────────────────────────────────────────┘        │          │
│  └─────────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────────┘
```

**Interactive contract:**
- **Hue swatch click** → calls `document.documentElement.style.setProperty('--accent', value)` + `localStorage.setItem('ember-glass-accent', value)`. The demo card's accent swatch + `--accent` references update instantly. No page reload.
- **Hue swatch keyboard** → Tab focusable; Enter/Space activates. Focus-visible ring: 2px `var(--accent)` outset.
- **Ambient toggle change** → `localStorage.setItem('ember-glass-ambient', 'true'|'false')` + `window.dispatchEvent(new CustomEvent('ember-glass-ambient-change', { detail: bool }))`. `<AmbientBg>` provider listens and re-renders. Also updates `<html data-ambient>` attribute for next pre-paint.
- **Hard reload** → inline pre-paint `<script>` in `<head>` (D-08) reads both keys before first paint, sets `--accent` on `documentElement` and `data-ambient` attribute. Zero visual flash.
- **localStorage unavailable** (private mode) → all access wrapped in `try/catch`; picker still works for the session, just doesn't persist.

**Accessibility:**
- Page has a single `<h1>` ("Ember Glass") and one `<h2>` per section.
- Hue swatches: `<button type="button" aria-label="Set accent to Copper" aria-pressed={isActive}>`. The active swatch carries `aria-pressed="true"`.
- Ambient toggle: `<button role="switch" aria-checked={on} aria-label="Toggle ambient glow">`. Hand-rolled toggle, not Radix (no new deps).
- AmbientBg `<div>` is `aria-hidden="true"` (decorative).
- Keyboard nav: Tab through swatches → toggle → demo card (focusable for visual keyboard testing).
- Color contrast: text on glass measured against the dark base (`#0a0908`) — `--text-1` (`#f5f5f4`) yields ~17:1 (AAA), `--text-2` (55% opacity ≈ `#85857F` effective) yields ~5.8:1 (AA for normal text).

---

## Copywriting Contract

Italian (project locale per `<html lang="it">`). Copy strings live in the `/debug/design-system-v2` page source — no i18n extraction needed for this developer-facing surface.

| Element | Copy (IT) | English equivalent (for reviewers) |
|---------|-----------|-------------------------------------|
| Page eyebrow | `DESIGN SYSTEM · v2` | DESIGN SYSTEM · v2 |
| Page title | `Ember Glass` | Ember Glass |
| Page subtitle | `Riferimento token e picker live · Phase 174` | Token reference and live picker · Phase 174 |
| Badge | `Phase 174` | Phase 174 |
| Section 01 heading | `Tinte accento` | Accent hues |
| Section 01 helper | `Clicca uno swatch per aggiornare --accent in tempo reale` | Click a swatch to live-update --accent |
| Section 02 heading | `Glow ambient` | Ambient glow |
| Section 02 toggle label | `Attiva glow ambient` | Enable ambient glow |
| Section 02 helper | `Persistito in localStorage. Spento di default per risparmiare frame.` | Persists in localStorage. Off by default to save paint frames. |
| Section 03 heading | `Token` | Tokens |
| Section 03 helper | `11 variabili CSS · sorgente: globals.css` | 11 CSS variables · source: globals.css |
| Section 04 heading | `Demo glass-surface` | Glass surface demo |
| Section 04 demo card title | `Superficie vetro` | Glass surface |
| Section 04 demo card body | `Anteprima dei token. Clicca un colore sopra per vedere --accent aggiornarsi.` | Token preview. Click a color above to see --accent update. |
| Primary CTA | **n/a** — no primary CTA in this phase. The "actions" are the hue swatches and the ambient toggle, both inline controls labeled as above. |
| Empty state | **n/a** — no data fetching or empty states in this phase (token reference is fully static). |
| Error state | **n/a for visible UI.** localStorage failures are silent (try/catch). Inline pre-paint script swallows all errors. The Playwright fonts test captures any Google CDN regression with the message: `Expected zero Google Fonts requests, got: ${urls.join(', ')}` (English; test-runner output only). |
| Destructive confirmation | **n/a** — no destructive actions in this phase (no reset, no clear, no delete; toggle is non-destructive and reversible). |

**Copy invariants:**
- All UI copy in Italian (project standard).
- Test/error/console output in English (developer-facing).
- No emoji in production UI copy.
- Token names rendered as code (`--accent`, etc.) inside `<code>` element with `--font-body` (Inter at 12px); no separate mono font loaded in this phase.

---

## Component Inventory (deliverables this phase)

| Component | Path | New/Edit | Visual Contract |
|-----------|------|----------|-----------------|
| `:root` Ember Glass token block | `app/globals.css` | edit (append after `@theme`) | 11 CSS variables; values per D-02 |
| `.glass-surface` utility | `app/globals.css` `@layer components` | new | `bg: var(--glass-bg)`, `backdrop-filter: blur(var(--glass-blur)) saturate(180%)` + `-webkit-` prefix, `border: 1px solid var(--glass-border)`, `box-shadow: var(--glass-shadow)`, `border-radius: var(--r-card)` |
| `@supports not` fallback | `app/globals.css` | new | `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` → `.glass-surface { background: rgba(28, 25, 23, 0.92); }` |
| Ambient keyframes | `app/globals.css` | new | `ambientA` (14s), `ambientB` (18s), `ambientC` (22s) — transforms canonical from design bundle (see Color section above) |
| `app/fonts.ts` | `app/fonts.ts` | edit | Replace `Space_Grotesk` → `Inter`; rename `outfit.variable` → `'--font-display-outfit'`; `inter.variable` → `'--font-body-inter'` |
| `<AmbientBg>` provider | `app/components/EmberGlass/AmbientBg.tsx` | new | Client component; reads `<html data-ambient>`; renders 3 fixed-position blob divs when ON; listens for `'ember-glass-ambient-change'` custom event; respects `prefers-reduced-motion` |
| Inline pre-paint script | `app/layout.tsx` `<head>` | edit | `<script dangerouslySetInnerHTML>` IIFE reads `ember-glass-accent` + `ember-glass-ambient` from localStorage; applies to documentElement before paint |
| `<html>` className | `app/layout.tsx` | edit | `${outfit.variable} ${inter.variable} dark` (replaces existing Space_Grotesk variable) |
| `/debug/design-system-v2` page | `app/debug/design-system-v2/page.tsx` | new | Single client-component page; layout per "Page Layout" section above |
| `/debug` index link | `app/debug/page.tsx` | edit | Add a sibling button next to the existing "Design System" link, labeled `Design System v2`, linking to `/debug/design-system-v2` |
| Playwright fonts test | `tests/smoke/ember-glass-fonts.spec.ts` | new | Asserts zero requests to `fonts.googleapis.com` / `fonts.gstatic.com` on `/` and `/debug/design-system-v2` |
| Playwright ambient test | `tests/smoke/ember-glass-ambient.spec.ts` | new | Sets `localStorage['ember-glass-ambient']='true'`, reloads, asserts `<html>` has `data-ambient="on"` |
| AmbientBg unit test | `app/components/EmberGlass/__tests__/AmbientBg.test.tsx` | new | Toggle state, custom event listener, reduced-motion path |
| design-system-v2 unit test | `app/debug/design-system-v2/__tests__/page.test.tsx` | new | Picker preset map, setProperty mock, localStorage persistence |

**Components NOT shipped in this phase** (deferred to 175–182):
- Card press animation utility (DS-07 → Phase 175)
- BottomSheet primitive (SHEET-01 → Phase 175)
- Dashboard cards (DASH-01..12 → Phase 177)
- Device sheets (SHEET-02..06 → Phase 178)
- Splash screen (SPLASH-01..05 → Phase 176)
- Glass tab bar (NAV-01..04 → Phase 181)
- Full design-system reference page (DSREF-01..03 → Phase 182)

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — project does not use shadcn | not applicable |
| third-party | none | not applicable |

**Notes:**
- Project does not have `components.json` (verified 2026-04-27). Per CONTEXT.md decision history and CLAUDE.md, primitives are built with CVA + Radix on demand. Auto-mode skips the shadcn initialization gate.
- This phase introduces NO new third-party packages. All listed dependencies (`next`, `react`, `tailwindcss`, `next/font/google`, `lucide-react`, `@playwright/test`) already in `package.json`.
- Vetting gate: not required (no third-party blocks).

---

## Verification Mapping (downstream consumers)

| Requirement | Visual contract surface | Verification method |
|-------------|-------------------------|---------------------|
| DS-01 | "Token Inventory" table (11 tokens) | Static grep against `app/globals.css` for the 11 variable declarations |
| DS-02 | "Audit gate" note + 3 documented exceptions | Static grep: `grep -rEn '#[0-9a-fA-F]{3,8}\b\|blur\([0-9]+px\)' app/components/EmberGlass app/debug/design-system-v2` returns only AUDIT-EXCEPTION-tagged lines |
| DS-03 | "6-hue preset palette" + Section 01 layout + interactive contract | Unit test on `page.test.tsx` (preset map + setProperty + localStorage); manual visual: click each swatch, demo card accent swatch updates instantly |
| DS-04 | Typography section (Outfit + Inter via next/font) | Playwright `tests/smoke/ember-glass-fonts.spec.ts` (zero Google CDN requests) |
| DS-05 | "Ambient layer" visual contract + Section 02 toggle + reduced-motion contract | Unit test on `AmbientBg.test.tsx` + Playwright `tests/smoke/ember-glass-ambient.spec.ts` (hard reload survival) |
| DS-06 | `.glass-surface` utility + `@supports not` fallback | Static grep for both rules in `globals.css`; manual visual via Chrome DevTools "Rendering > emulate CSS feature: backdrop-filter unsupported" on the demo card |

---

## Claude's Discretion (auto-resolved)

Items where CONTEXT.md left planner freedom; this UI-SPEC locks visual answers so the planner has zero ambiguity:

| Item | Resolution | Rationale |
|------|------------|-----------|
| `/debug/design-system-v2` component structure | **Single-file client component** with co-located swatch + toggle + grid sub-components in the same file | Page is small (one screen, ~6 sub-elements). Splitting into separate files adds friction without payoff. Future Phase 182 reference page WILL split when the component count exceeds ~10. |
| Inline pre-paint script location | **Inline directly in `app/layout.tsx`** `<head>` | Script is ~10 lines; co-locating with layout keeps the read-order obvious. Phase 149 used the same pattern. |
| `<AmbientBg>` provider path | **`app/components/EmberGlass/AmbientBg.tsx`** | Matches the suggested-folder convention in CONTEXT.md §discretion. Creates the `EmberGlass/` namespace folder that Phases 175+ will populate (BottomSheet, CardPress, etc.). |
| Picker → AmbientBg communication | **Custom DOM event** `'ember-glass-ambient-change'` (detail: boolean) | Zero deps; works for any future toggle source; documented in RESEARCH.md Open Question #2. |
| Ambient blob C cool-blue color | **Keep static `rgba(94,175,255,0.25)`** — does NOT recolor with `--accent` | Lifted verbatim from design bundle (`app.jsx:190`); the cool-blue counterpoint is intentional design intent for visual depth. Documented as AUDIT-EXCEPTION. |
| Ambient blob B mix-target `#301010` | **Keep verbatim from design bundle** | `app.jsx:184` deliberately mixes accent at 40% with a near-black `#301010` to deepen the second blob's saturation. Documented as AUDIT-EXCEPTION. |
| Toggle widget style | **Hand-rolled `<button role="switch">`** (not Radix Switch) | One control on one developer page; Radix import-cost not justified. Phase 175+ may adopt Radix for production toggles. |
| Section eyebrow numbering format | **`01 / TOKENS`** (zero-padded number, ` / `, uppercase label) | Matches design bundle's `Design System.html` `.sec-head .num` convention (line 92). |
| Mono font for token names | **NOT loaded.** Use `--font-body` (Inter) at 12px / 600 instead | JetBrains Mono in design bundle adds a third font family; Phase 174 budget is 2 fonts. Inter Semibold at small sizes reads cleanly enough for token names. Phase 182 may revisit. |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — all UI copy declared (IT), no destructive copy needed, error/empty states declared as n/a with rationale
- [ ] Dimension 2 Visuals: PASS — page layout, ambient blob geometry, demo card composition, swatch grid all specified pixel-precise
- [ ] Dimension 3 Color: PASS — 60/30/10 split declared with explicit accent reserved-for list (4 items); 6-hue palette enumerated with oklch values
- [ ] Dimension 4 Typography: PASS — exactly 4 sizes (12/16/24/40) and 2 weights (400/600); both fonts wired via `next/font` with self-host invariant
- [ ] Dimension 5 Spacing: PASS — 4-multiple scale declared; 44px tap-target exception called out and justified
- [ ] Dimension 6 Registry Safety: PASS (vacuous) — no shadcn, no third-party blocks, no new deps

**Approval:** pending (gsd-ui-checker)
