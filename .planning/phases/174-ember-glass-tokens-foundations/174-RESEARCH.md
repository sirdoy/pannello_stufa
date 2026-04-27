# Phase 174: Ember Glass Tokens & Foundations - Research

**Researched:** 2026-04-27
**Domain:** CSS design-token system, Next.js App Router fonts, OKLCH color, backdrop-filter feature queries, localStorage hydration, Playwright network assertions
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Define all 11 Ember Glass tokens in `app/globals.css` on `:root`, in a dedicated `/* ===== EMBER GLASS TOKENS ===== */` block placed AFTER the existing Ember Noir `@theme` block. `globals.css` is the canonical token source; no separate `tokens.css`.
- **D-02:** Token values lifted verbatim from `.planning/inbox/ember-glass-design/project/components/app.jsx` lines 101-111:
  - `--glass-bg: rgba(255, 255, 255, 0.04);`
  - `--glass-blur: 24px;`
  - `--glass-border: rgba(255, 255, 255, 0.08);`
  - `--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.18), inset 0 0 0 0.5px rgba(255, 255, 255, 0.03);`
  - `--accent: oklch(0.68 0.17 45);` (Copper default)
  - `--text-1: #f5f5f4;`
  - `--text-2: rgba(245, 245, 244, 0.55);`
  - `--r-card: 24px;`
  - `--pad-card: 16px;`
  - `--font-display: var(--font-display-outfit), system-ui, sans-serif;`
  - `--font-body: var(--font-body-inter), system-ui, sans-serif;`
- **D-03:** Ember Glass tokens are ADDITIVE. Do NOT remove or rename existing `--color-ember-*`, `--color-flame-*`, `--color-slate-*` tokens.
- **D-04:** DS-02 hardcoded-value audit is scoped to NEW glass surfaces only.
- **D-05:** Six oklch hue presets: Copper (default) `oklch(0.68 0.17 45)`, Rose `oklch(0.68 0.17 0)`, Violet `oklch(0.65 0.17 290)`, Blue `oklch(0.65 0.14 230)`, Green `oklch(0.68 0.12 150)`, Amber `oklch(0.76 0.15 75)`.
- **D-06:** Accent picker lives at `/debug/design-system-v2`; also linked from `/debug/page.tsx`.
- **D-07:** `document.documentElement.style.setProperty('--accent', value)` for live update; persist under localStorage key `ember-glass-accent`.
- **D-08:** Inline `<script dangerouslySetInnerHTML>` in `app/layout.tsx` reads localStorage and applies tokens before paint (phase 149 historical pattern).
- **D-09:** Replace `Space_Grotesk` with `Inter` in `app/fonts.ts`. Outfit stays.
- **D-10:** `next/font` outputs `--font-display-outfit` and `--font-body-inter`; `globals.css` Ember Glass token block aliases to `--font-display` / `--font-body`.
- **D-11:** Playwright network assertion verifies zero `fonts.googleapis.com` requests.
- **D-12:** Ambient = three radial gradients with keyframes `ambientA 14s`, `ambientB 18s`, `ambientC 22s`; layer at z-index 0 behind app shell (z-index ≥ 1).
- **D-13:** Ambient toggle in `/debug/design-system-v2` toolbar; localStorage key `ember-glass-ambient` (boolean).
- **D-14:** Default state OFF on first visit.
- **D-15:** Top-level `<AmbientBg>` provider mounted from `app/layout.tsx`; same pre-paint script avoids flash.
- **D-16:** `backdrop-filter: blur(var(--glass-blur)) saturate(180%);` plus `-webkit-backdrop-filter:` prefix.
- **D-17:** `@supports not (backdrop-filter: blur(1px))` fallback to `background: rgba(28, 25, 23, 0.92);`. Define `glass-surface` utility class in `globals.css`.
- **D-18:** `glass-surface` utility used only on the `/debug/design-system-v2` demo card in this phase.
- **D-19:** Phase 174 ships ONLY token plumbing + minimal `/debug/design-system-v2` (token grid + picker + ambient toggle + 1 demo glass card). DSREF-01..04 full reference page is a later v20.0 phase.

### Claude's Discretion

- React component structure of `/debug/design-system-v2` (single file vs co-located components).
- Whether the inline pre-paint script is colocated in `layout.tsx` or extracted to a helper.
- Path of `<AmbientBg>` provider component file (suggested `app/components/EmberGlass/AmbientBg.tsx`).

### Deferred Ideas (OUT OF SCOPE)

- Production-facing accent picker outside `/debug`.
- Migration of legacy Ember Noir components to glass tokens.
- Removal of legacy `--color-ember-*` / `--color-flame-*` / `--color-slate-*` tokens.
- Full DSREF-01..04 design-system reference page.
- Card press animation utility (DS-07 — Phase 175).
- Container queries / responsive token variations.
- Light-mode token variants.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DS-01 | Project exposes Ember Glass design tokens as CSS variables | `:root` block after `@theme` in `globals.css`; Tailwind v4 reads `:root` vars seamlessly |
| DS-02 | Tokens drive all surfaces — no hardcoded glass/blur/accent colors in component files (verifiable via grep) | Audit scoped to NEW glass surfaces (D-04); grep regex defined below |
| DS-03 | Accent supports oklch hue shifting (default copper); 6 preset hues selectable from `/debug` toolbar | OKLCH supported in Chrome 111+, Safari 15.4+, Firefox 113+ (all production targets); `setProperty` + localStorage |
| DS-04 | Outfit (display) + Inter (body) self-hosted via `next/font` (no Google CDN roundtrip) | `next/font/google` self-hosts at build time; verify zero `fonts.googleapis.com` requests via Playwright |
| DS-05 | Optional ambient radial-gradient glow togglable per user preference, persists in localStorage | `<AmbientBg>` provider; localStorage `ember-glass-ambient` boolean; pre-paint script avoids flash |
| DS-06 | All glass surfaces apply `backdrop-filter: blur() saturate(180%)` with WebKit fallback; degrades gracefully | `@supports not (backdrop-filter: blur(1px))` is the canonical feature query |
</phase_requirements>

## Summary

Phase 174 wires a **CSS-variable token system** layered on top of the existing Tailwind v4 + Ember Noir codebase. All work is additive: new `:root` tokens live alongside the existing `@theme` block in `app/globals.css`, the body font swaps from `Space_Grotesk` to `Inter` in `app/fonts.ts` (preserving the `next/font` self-hosting pipeline), an `<AmbientBg>` client provider mounts from `app/layout.tsx`, and a new `/debug/design-system-v2` page exposes the accent picker + ambient toggle + a single `glass-surface` demo card.

Three tricky integrations dominate the planning surface: (1) **Tailwind v4 `@theme` already declares `--font-display: 'Outfit', ...`** in `globals.css` — this MUST be moved/superseded so the new `:root { --font-display: var(--font-display-outfit), ... }` resolves to the next/font CSS variable (otherwise the body uses the literal string `'Outfit'` and the self-host pipeline is bypassed). (2) **Pre-paint hydration of `--accent` and the ambient toggle** must run before first paint via `<script dangerouslySetInnerHTML>` in `<head>` to avoid a flash. (3) **The `@supports not (backdrop-filter)` feature query must include the `-webkit-` prefix variant** to avoid false negatives on older WebKit.

**Primary recommendation:** Plan should produce 2–3 plans: (P1) token wiring + font swap + globals.css token block + `@theme` font-token alignment; (P2) `<AmbientBg>` provider + inline pre-paint script in `layout.tsx`; (P3) `/debug/design-system-v2` page + accent picker UI + Playwright network assertion. Plans P1 and P2 can run in parallel after the tailwind/fonts decisions are locked; P3 depends on P1+P2.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Define Ember Glass design tokens | CSS / Static (globals.css) | — | All design tokens are global CSS variables read by every surface |
| Self-host fonts (Outfit, Inter) | Frontend Server (next/font build pipeline) | CDN / Static | `next/font/google` downloads at build time and serves from `/_next/static/media/` |
| Pre-paint accent + ambient hydration | Browser (inline `<script>` in `<head>`) | — | Must execute before React mounts; `document.documentElement.style.setProperty` |
| Live accent swap (picker UI) | Browser (Client Component) | — | `'use client'` page; `setProperty` + `localStorage.setItem` |
| Ambient gradient layer | Browser (Client Component provider) | — | Reads localStorage, renders fixed-position div with animated gradients |
| `glass-surface` fallback | CSS / Static | — | `@supports not (backdrop-filter)` block in globals.css |
| Network assertion (zero Google fonts requests) | E2E (Playwright) | — | `page.on('request')` listener filters by URL host |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/font/google` | bundled with Next 16.1 | Self-host Outfit + Inter at build time | Eliminates Google CDN runtime requests; produces `--font-*` CSS variables [VERIFIED: app/fonts.ts existing pattern] |
| `tailwindcss` | ^4.1.18 | CSS framework with `@theme` token block | Already in project; v4 reads `:root` CSS vars natively, no Tailwind config required for new tokens [VERIFIED: package.json] |
| `@playwright/test` | (existing in tests/) | Network assertion for fonts.googleapis.com | Existing E2E framework with `tests/auth.setup.ts` + Auth0 storageState [VERIFIED: playwright.config.ts] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | existing | Icons for hue swatches in picker | Existing /debug pages use Lucide; no new icon dep needed |
| `localStorage` (Web API) | native | Persist `ember-glass-accent` and `ember-glass-ambient` | No library — direct browser API |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `next/font/google` | `@font-face` + `<link rel="preload">` | Already self-hosted; switching would re-introduce manual font management. Reject. |
| Custom theme provider (React context) | localStorage + inline script | Context flashes on hydration; inline script runs before paint. Reject (D-08 locked). |
| Tailwind plugin for tokens | Plain CSS `:root` block | v4's `@theme` reads `:root` — no plugin needed. Reject. |

**Installation:**

No new packages required. All dependencies already present.

**Version verification:** `[VERIFIED: package.json]`
- `next: ^16.1.0` (App Router with `next/font` stable)
- `react: ^19.2.0`
- `tailwindcss: ^4.1.18`

`Inter` font import path is `next/font/google` (same module as existing `Outfit`). `[VERIFIED: app/fonts.ts:1]` — current import: `import { Outfit, Space_Grotesk } from 'next/font/google';`. Replace `Space_Grotesk` with `Inter`.

## Architecture Patterns

### System Architecture Diagram

```
                         Build time (next/font)
                         ┌────────────────────────────┐
                         │ Outfit + Inter downloaded  │
                         │ → /_next/static/media/*    │
                         │ → CSS vars exported:       │
                         │   --font-display-outfit    │
                         │   --font-body-inter        │
                         └─────────┬──────────────────┘
                                   │
                                   ▼
   app/layout.tsx applies className="${outfit.variable} ${inter.variable}"
                                   │
                                   ▼
              ┌────────────────────────────────────────────┐
              │  <head>                                    │
              │  <script dangerouslySetInnerHTML>          │
              │    Read localStorage:                      │
              │      ember-glass-accent → setProperty      │
              │      ember-glass-ambient → setProperty     │
              │    Runs BEFORE first paint (no flash)      │
              │  </script>                                 │
              └────────────────────────────────────────────┘
                                   │
                                   ▼
   app/globals.css :root block (after @theme)
   ┌──────────────────────────────────────────────┐
   │ --accent: oklch(0.68 0.17 45)                │
   │ --font-display: var(--font-display-outfit)…  │ ← aliases next/font output
   │ --font-body: var(--font-body-inter)…         │
   │ --glass-bg, --glass-blur, --glass-border…    │
   │ --r-card, --pad-card, --text-1, --text-2     │
   │                                              │
   │ @supports not (backdrop-filter: blur(1px)) { │
   │   .glass-surface { background: rgba(...)…   │ ← fallback
   │ }                                            │
   │ @keyframes ambientA, ambientB, ambientC …    │
   └──────────────────────────────────────────────┘
                                   │
                                   ▼
   <body>
   ┌─────────────────────────────────────────────────┐
   │ <AmbientBg> (z-index: 0) reads localStorage,    │
   │   renders 3 radial-gradient divs with keyframes │
   │ <main z-index: ≥1> app shell sits above ambient │
   │ <Navbar> existing                               │
   └─────────────────────────────────────────────────┘
                                   │
                                   ▼
   /debug/design-system-v2 (Client Component)
   ┌─────────────────────────────────────────────────┐
   │ Toolbar:                                        │
   │   [Hue picker × 6 swatches]                     │
   │     onClick → setProperty('--accent', value)    │
   │              → localStorage.setItem(...)        │
   │   [Ambient toggle on/off]                       │
   │     onChange → localStorage.setItem(...)        │
   │              → notifies AmbientBg via custom    │
   │                event or context                 │
   │ Token grid (live values)                        │
   │ glass-surface demo card                         │
   └─────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
app/
├── globals.css                          # ← extend: add :root Ember Glass block + @supports + keyframes + .glass-surface
├── fonts.ts                             # ← edit: replace Space_Grotesk with Inter; rename variables
├── layout.tsx                           # ← edit: import inter; mount <AmbientBg>; inline pre-paint script
├── components/
│   └── EmberGlass/                      # ← NEW (suggested path)
│       ├── AmbientBg.tsx                # ← NEW — client provider
│       └── EmberGlassHydration.tsx      # ← OPTIONAL — extracts inline script if planner picks colocation
└── debug/
    ├── page.tsx                         # ← edit: add nav link to design-system-v2
    └── design-system-v2/                # ← NEW
        └── page.tsx                     # ← NEW — accent picker + ambient toggle + token grid + demo card
tests/
└── smoke/
    └── ember-glass-fonts.spec.ts        # ← NEW — Playwright network assertion (zero fonts.googleapis.com)
```

### Pattern 1: next/font with CSS Variable Output (DS-04)

**What:** `next/font/google` accepts a `variable:` option that exposes the loaded `font-family` as a CSS custom property scoped to the className you apply.

**When to use:** Whenever the font family needs to be referenced from CSS (`var(--font-foo)`) instead of utility classes.

**Example:**

```typescript
// app/fonts.ts
// Source: existing pattern (verified 2026-04-27)
import { Outfit, Inter } from 'next/font/google';

export const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display-outfit', // RENAMED per D-10 (was --font-display)
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body-inter',     // NEW per D-10 (was --font-body for Space_Grotesk)
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});
```

```tsx
// app/layout.tsx — apply both variables to <html>
<html className={`${outfit.variable} ${inter.variable} dark`}>
```

```css
/* app/globals.css — alias raw next/font vars to public token names */
:root {
  --font-display: var(--font-display-outfit), system-ui, sans-serif;
  --font-body:    var(--font-body-inter),    system-ui, sans-serif;
}
```

**CRITICAL:** The existing `@theme` block in globals.css declares (lines 209-211):
```css
--font-display: 'Outfit', system-ui, sans-serif;
--font-body: 'Space Grotesk', system-ui, sans-serif;
```
These DECLARATIONS MUST BE EITHER REMOVED FROM `@theme` OR OVERRIDDEN BY THE NEW `:root` BLOCK below it. CSS cascade: later declarations on the same selector with the same specificity win. `@theme { … }` in Tailwind v4 emits the values into `:root`, so the new sibling `:root { … }` block placed AFTER `@theme` will override correctly. **Confirm: the new `:root` block goes AFTER `@theme` so its `--font-display` / `--font-body` win.** [VERIFIED: CSS cascade rules; D-01 places new block after `@theme`].

### Pattern 2: Inline Pre-Paint Script for Hydration (D-08)

**What:** A `<script dangerouslySetInnerHTML>` block in `<head>` reads localStorage and sets CSS variables on `document.documentElement` before the page renders, preventing flash of incorrect tokens.

**When to use:** Persisted UI preferences that affect first paint (theme, accent, motion preference, ambient).

**Example:**

```tsx
// app/layout.tsx <head> — runs before <body> renders
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){try{
      var a=localStorage.getItem('ember-glass-accent');
      var amb=localStorage.getItem('ember-glass-ambient');
      if(a){document.documentElement.style.setProperty('--accent',a);}
      if(amb==='true'){document.documentElement.dataset.ambient='on';}
    }catch(e){}})();`
  }}
/>
```

**Notes:**
- Inline scripts in `<head>` execute synchronously before paint — `window` and `document` are always available.
- The `try/catch` swallows SSR/private-mode/storage-disabled errors silently (graceful degradation).
- IIFE prevents leaking variables into the page scope.
- For ambient toggle, use a `data-ambient="on"` attribute on `<html>` rather than a CSS variable — `<AmbientBg>` reads this attribute on mount to set its initial state, eliminating the flicker between SSR (no localStorage) and hydration. Alternative: render `<AmbientBg>` in a Suspense-boundary-free client provider that reads localStorage in a `useLayoutEffect`.

**Historical reference:** Phase 149 (`.planning/phases/149-theme-removal-core/149-01-PLAN.md:182`) previously REMOVED an inline theme script from `app/layout.tsx` lines 52-76 because the project went dark-only. We are reintroducing the same shape (different keys, different effect). The previous block was at `app/layout.tsx` lines 52-76 — verified via 149-01-PLAN.md. Phase 174 places the new script just BEFORE the existing `<link rel="preconnect">` lines (in `<head>`).

[CITED: .planning/phases/149-theme-removal-core/149-CONTEXT.md:18, 149-01-PLAN.md:182]

### Pattern 3: OKLCH Color + color-mix(in oklab)

**What:** Modern color spec providing perceptually uniform color manipulation. Used for the accent token and ambient gradients.

**Example:**

```css
:root {
  --accent: oklch(0.68 0.17 45); /* Copper — L=0.68, C=0.17, H=45° */
}

/* Mixing for ambient gradient — design bundle pattern */
.ambient-glow {
  background: radial-gradient(
    circle,
    color-mix(in oklab, var(--accent) 60%, transparent) 0%,
    transparent 70%
  );
}
```

**Browser support [CITED: caniuse.com / MDN as of 2026-04]:**
- `oklch()` — Chrome 111+ (Mar 2023), Safari 15.4+ (Mar 2022), Firefox 113+ (May 2023). All major mobile browsers covered.
- `color-mix()` — Chrome 111+, Safari 16.2+ (Dec 2022), Firefox 113+. The `in oklab` color-space is supported in the same versions.

The project ships as a PWA targeting iOS 15+/Chromium current. No browserslist configured in `package.json` — Next.js 16 defaults apply (modern browsers only). [VERIFIED: package.json no browserslist key]. **No fallback required for oklch/color-mix in production targets.**

### Pattern 4: @supports Feature Query for backdrop-filter (DS-06)

**What:** CSS feature query to fall back when `backdrop-filter` is unsupported.

**Canonical form (avoids old WebKit false-positives):**

```css
/* Default: glass surface assumes backdrop-filter works */
.glass-surface {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: var(--r-card);
}

/* Fallback: solid translucent background when neither prefix supported */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-surface {
    background: rgba(28, 25, 23, 0.92); /* matches --color-slate-900 */
  }
}
```

**Rationale:** The simpler `@supports not (backdrop-filter: blur(1px))` works in Chrome/Firefox but old WebKit reports false negatives because it only supports the prefixed form. The double-disjunction inside `not` covers both. [CITED: MDN @supports nesting docs; CSS Conditional Rules Level 3].

### Pattern 5: Tailwind v4 Custom Utility (`.glass-surface`)

**What:** Tailwind v4 supports `@utility name { … }` to register a custom utility, OR plain CSS classes work fine since `globals.css` is loaded directly.

**Recommendation:** Use plain CSS class inside `@layer components` (matches existing project convention — see `glass-dark`, `glass-vibrancy` in `globals.css:1029-1034, 1424-1430`):

```css
@layer components {
  .glass-surface {
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur)) saturate(180%);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow);
    border-radius: var(--r-card);
  }
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-surface {
    background: rgba(28, 25, 23, 0.92);
  }
}
```

[VERIFIED: existing globals.css uses `@layer components` for `.glass-dark`, `.glass-vibrancy`, `.glass-shine` — same convention applies to `.glass-surface`.]

### Pattern 6: Live Accent Override + Persistence

**Example:**

```tsx
// app/debug/design-system-v2/page.tsx — Client Component
'use client';

const ACCENT_PRESETS = {
  copper: 'oklch(0.68 0.17 45)',
  rose:   'oklch(0.68 0.17 0)',
  violet: 'oklch(0.65 0.17 290)',
  blue:   'oklch(0.65 0.14 230)',
  green:  'oklch(0.68 0.12 150)',
  amber:  'oklch(0.76 0.15 75)',
} as const;

function setAccent(value: string): void {
  document.documentElement.style.setProperty('--accent', value);
  try { localStorage.setItem('ember-glass-accent', value); } catch {}
}
```

### Pattern 7: Ambient Provider with Pre-Paint Sync

**Example:**

```tsx
// app/components/EmberGlass/AmbientBg.tsx
'use client';
import { useEffect, useState } from 'react';

export default function AmbientBg() {
  // Initial state from data attribute set by inline pre-paint script — avoids flash
  const [on, setOn] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.dataset.ambient === 'on'
  );

  useEffect(() => {
    // Listen for picker toggle event (custom event from /debug page)
    const handler = (e: Event) => setOn((e as CustomEvent<boolean>).detail);
    window.addEventListener('ember-glass-ambient-change', handler);
    return () => window.removeEventListener('ember-glass-ambient-change', handler);
  }, []);

  if (!on) return <div aria-hidden="true" className="ember-glass-base" />;

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <div className="ambient-blob ambient-a" />
      <div className="ambient-blob ambient-b" />
      <div className="ambient-blob ambient-c" />
    </div>
  );
}
```

Custom event pattern decouples the picker page from the AmbientBg provider; both use the same localStorage key for persistence and the same event for cross-component live updates.

### Anti-Patterns to Avoid

- **Setting `--font-display` in `@theme` AND in the new `:root` block to different values.** `@theme` declarations emit to `:root`; later same-specificity declarations win, but the dual declaration is confusing and CI noise. Move the font-family declarations OUT of `@theme` (or accept that the `:root` block silently overrides them). The existing `@theme` declarations at globals.css:209-211 will need editing.
- **Using `useLayoutEffect` instead of inline script.** `useLayoutEffect` still flashes briefly because React must hydrate first. Inline `<script>` in `<head>` runs strictly before paint.
- **Storing complex objects in localStorage.** Use scalar strings only (`'oklch(...)'`, `'true'`/`'false'`). No JSON.parse needed in pre-paint script.
- **Mounting AmbientBg as a sibling of Navbar in `<body>`.** Must be the FIRST child of `<body>` (z-index 0, behind everything). Existing `app/layout.tsx:53` makes `<body>` a flex column — verify the AmbientBg `position: fixed` doesn't disrupt flex layout (it shouldn't because fixed elements are taken out of flow).
- **Forgetting `aria-hidden="true"` on AmbientBg.** Decorative layer — must not appear in accessibility tree.
- **Adding the inline script via `<Script strategy="beforeInteractive">`.** That works in Pages Router only; in App Router (this project), use raw `<script dangerouslySetInnerHTML>` in `<head>` directly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Self-host Outfit + Inter | Custom `@font-face` block + manual woff2 download | `next/font/google` (already in use) | Build-time download, automatic preload, hash-stable URLs, zero runtime CDN |
| Theme provider with React context | Custom ThemeProvider component | localStorage + inline `<script>` + `setProperty` | Context flashes on hydration; inline script is pre-paint |
| Browser feature detection in JS | `if (CSS.supports('backdrop-filter', 'blur(1px)'))` runtime check | CSS `@supports` block | Native, declarative, no JS bundle cost |
| Color manipulation library | `chroma.js`, `tinycolor2`, `colord` | Native CSS `color-mix(in oklab, …)` + `oklch()` | Zero bytes; same browser support as our targets |
| Ambient animation framework | `framer-motion`, `react-spring` | CSS `@keyframes` (existing convention) | Already 50+ keyframes in globals.css; consistency |
| Custom localStorage hook | `useLocalStorage` library | Direct `localStorage.getItem`/`setItem` + try/catch | Two call sites only; over-engineering |

**Key insight:** Every capability for this phase has a native CSS or browser-API solution. No new dependencies should be introduced.

## Common Pitfalls

### Pitfall 1: `@theme` Token Conflict with `:root` Override

**What goes wrong:** Existing `@theme` block declares `--font-display: 'Outfit', system-ui, sans-serif;` at `globals.css:209`. When the new `:root` block declares `--font-display: var(--font-display-outfit), system-ui, sans-serif;`, both target `:root` with the same specificity. The block declared LATER in source order wins.

**Why it happens:** Tailwind v4's `@theme { … }` directive emits tokens into the global `:root`. A second `:root { … }` block in the same stylesheet stacks declarations.

**How to avoid:** Place the new Ember Glass `:root` block AFTER the closing `}` of `@theme` (per D-01). Verify with DevTools that the computed style of `:root` shows `--font-display: var(--font-display-outfit), system-ui, sans-serif;`. Optionally, EDIT the `@theme` declarations to match (cleaner) — but D-03 says additive, so leaving the `@theme` declarations and overriding via `:root` is acceptable.

**Warning signs:** Body text renders in literal "Outfit" instead of the next/font-served file. Browser DevTools network panel shows zero requests to `/_next/static/media/*.woff2`.

### Pitfall 2: Pre-Paint Script Runs on Server (SSR)

**What goes wrong:** Pre-paint script written without try/catch crashes during SSR if it accesses `window`/`localStorage`.

**Why it happens:** App Router server-renders `<head>`. But `<script>` content is just a string — it's NEVER executed on the server. The string IS rendered into HTML. So the script literal is fine; only its EVALUATION at the client is risky if localStorage is unavailable.

**How to avoid:** Wrap script body in `try{…}catch(e){}` IIFE. Never reference variables from outer JS scope (the script is a string).

**Warning signs:** Console errors `localStorage is not defined` (impossible — but if seen, the script is being executed in SSR via mistake like `eval(scriptString)`).

### Pitfall 3: Z-Index Layering Breaks Existing UI

**What goes wrong:** `<AmbientBg>` at `z-index: 0` sits behind everything; existing `<main>`, `<Navbar>`, `<Footer>` have NO explicit z-index, so they stack at `auto` (which can be ABOVE or BELOW the ambient depending on stacking context).

**Why it happens:** `position: fixed` creates a new stacking context. Ambient gradient with `position: fixed; z-index: 0` will always render UNDER positioned siblings without explicit z-index ONLY if the siblings are also positioned.

**How to avoid:** Audit `app/layout.tsx` and existing components for `position: relative/absolute/fixed`. Currently:
- `<body>` has `flex flex-col` (no position) — stacking context = root.
- `<Navbar>` is likely sticky/fixed (need to verify) — has its own stacking context.
- `<main>` is `flex-1` (no position) — root context.
- `<Footer>` — likely no position.

The safe pattern: give `<AmbientBg>` `position: fixed; inset: 0; z-index: 0; pointer-events: none;` and ensure `<main>` and `<Navbar>` get `position: relative; z-index: 1;` (or higher). One-line addition to layout.tsx wrapper.

**Warning signs:** Ambient gradients appear ABOVE app content; clicks pass through to ambient (fixed by `pointer-events: none`).

### Pitfall 4: localStorage Disabled (Private Mode / Cookie Block)

**What goes wrong:** Picker `setItem` throws; pre-paint `getItem` throws; UI breaks.

**Why it happens:** Safari private mode and some browser extensions throw on localStorage access.

**How to avoid:** Wrap all access in `try/catch`. Picker UI continues to work for the session even if persistence fails.

**Warning signs:** Accent picker visually changes hue but doesn't persist on reload — degrade gracefully.

### Pitfall 5: Playwright `networkidle` Misses Late Font Requests

**What goes wrong:** Asserting "zero fonts.googleapis.com requests" with only `waitForLoadState('domcontentloaded')` may miss requests fired AFTER initial paint.

**Why it happens:** Some browsers lazily resolve `@font-face` `src: url(...)` when the font is actually used by visible text.

**How to avoid:** Use `page.on('request', ...)` listener attached BEFORE `page.goto()`, then use `waitForLoadState('networkidle')` to confirm all requests resolved. Existing test pattern (`tests/smoke/page-loads.spec.ts:42`) uses `networkidle` consistently.

**Warning signs:** Test passes locally but flakes in CI.

### Pitfall 6: Outfit Variable Already Named `--font-display`

**What goes wrong:** Existing `app/fonts.ts:5` declares `outfit = Outfit({ ..., variable: '--font-display', ... })`. Per D-10, this must be RENAMED to `--font-display-outfit`. If not renamed, both the next/font output AND the new `:root` token point at `--font-display`, creating a recursive/circular reference: `--font-display: var(--font-display)` (which CSS resolves to the initial value `unset`).

**Why it happens:** Same custom property name used by two different layers.

**How to avoid:** RENAME existing `outfit.variable` from `'--font-display'` to `'--font-display-outfit'` (D-10). Same for `inter.variable: '--font-body-inter'`. THEN the new `:root` aliases `--font-display: var(--font-display-outfit), …;` correctly.

**Warning signs:** All text renders in browser default font (Times New Roman fallback).

### Pitfall 7: `setProperty` Call Site Mismatch

**What goes wrong:** Picker calls `setProperty('--accent', 'oklch(...)')` but existing components reference `bg-ember-500` / `text-ember-300` (Ember Noir tokens). The picker swap has zero visual effect on legacy components.

**Why it happens:** D-04 explicitly scopes the audit to NEW glass surfaces. Legacy components are intentionally untouched.

**How to avoid:** This is by design. Verify the picker DOES affect the demo glass-surface card on `/debug/design-system-v2` (visible accent edge / glow). Don't expect it to change the dashboard yet.

**Warning signs:** Reviewer confusion. Document explicitly: "the picker only affects elements that consume `var(--accent)` — for now, only the demo card."

## Code Examples

### Example 1: Complete `:root` Block for globals.css

```css
/* ===== EMBER GLASS TOKENS ===== */
/* Place AFTER the existing @theme {} block */
:root {
  /* Glass surface tokens */
  --glass-bg: rgba(255, 255, 255, 0.04);
  --glass-blur: 24px;
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.18),
                  inset 0 0 0 0.5px rgba(255, 255, 255, 0.03);

  /* Accent (overridable via setProperty / inline script) */
  --accent: oklch(0.68 0.17 45);

  /* Text */
  --text-1: #f5f5f4;
  --text-2: rgba(245, 245, 244, 0.55);

  /* Geometry */
  --r-card: 24px;
  --pad-card: 16px;

  /* Typography (alias next/font output to public token names) */
  --font-display: var(--font-display-outfit), system-ui, sans-serif;
  --font-body:    var(--font-body-inter),    system-ui, sans-serif;
}

@layer components {
  .glass-surface {
    background: var(--glass-bg);
    backdrop-filter: blur(var(--glass-blur)) saturate(180%);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow);
    border-radius: var(--r-card);
  }
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-surface {
    background: rgba(28, 25, 23, 0.92);
  }
}

/* Ambient keyframes (lifted from .planning/inbox/ember-glass-design/project/components/app.jsx:175-200) */
@keyframes ambientA {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(40px, 60px) scale(1.1); }
}
@keyframes ambientB {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(-50px, -30px) scale(1.15); }
}
@keyframes ambientC {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(30px, -40px) scale(1.05); }
}
```

**Note on keyframe content:** The design bundle's `app.jsx` declares the animations by NAME but the keyframe definitions themselves are not in the bundle (they're hardcoded inline as `animation: ambientA 14s …`). The bundle does not show the actual transform sequences — these are inferred. Verify against `.planning/inbox/ember-glass-design/project/Design System.html` if it contains explicit `@keyframes` rules for ambientA/B/C.

[ASSUMED — A1] Exact keyframe transforms for `ambientA/B/C` are not in `app.jsx`. The transforms above are best-effort recreation matching the design intent (slow drifting blobs, 14s/18s/22s periods). Verify against the standalone `Design System.html` during planning.

### Example 2: Updated app/fonts.ts

```typescript
import { Outfit, Inter } from 'next/font/google';

export const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display-outfit', // RENAMED per D-10
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body-inter', // NEW per D-10 (replaces spaceGrotesk)
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});
```

### Example 3: layout.tsx Edits

```tsx
// app/layout.tsx — relevant changes only
import { outfit, inter } from './fonts'; // was: outfit, spaceGrotesk
import AmbientBg from './components/EmberGlass/AmbientBg';

// In RootLayout return:
<html lang="it" className={`${outfit.variable} ${inter.variable} dark`} suppressHydrationWarning>
  <head>
    {/* ... existing meta tags ... */}
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{
          var a=localStorage.getItem('ember-glass-accent');
          var amb=localStorage.getItem('ember-glass-ambient');
          if(a){document.documentElement.style.setProperty('--accent',a);}
          if(amb==='true'){document.documentElement.dataset.ambient='on';}
        }catch(e){}})();`
      }}
    />
    {/* ... existing preconnect, apple icons ... */}
  </head>
  <body className="...">
    <AmbientBg />
    {/* ... existing skip link, ClientProviders, Navbar, main, Footer ... */}
  </body>
</html>
```

### Example 4: Playwright Network Assertion

```typescript
// tests/smoke/ember-glass-fonts.spec.ts
import { test, expect } from '@playwright/test';

test.describe('DS-04 — fonts self-hosted', () => {
  test('zero requests to fonts.googleapis.com on home', async ({ page }) => {
    const googleFontRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        googleFontRequests.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(
      googleFontRequests,
      `Expected zero Google Fonts requests, got: ${googleFontRequests.join(', ')}`
    ).toEqual([]);
  });

  test('zero requests on /debug/design-system-v2', async ({ page }) => {
    const googleFontRequests: string[] = [];
    page.on('request', (req) => {
      const u = req.url();
      if (u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')) {
        googleFontRequests.push(u);
      }
    });
    await page.goto('/debug/design-system-v2');
    await page.waitForLoadState('networkidle');
    expect(googleFontRequests).toEqual([]);
  });
});
```

[VERIFIED: existing pattern at `tests/smoke/page-loads.spec.ts:7-20` uses `page.on('console')`; this pattern adapts cleanly to `page.on('request')`.]

### Example 5: DS-02 Hardcoded-Value Audit Grep

Per D-04, audit is scoped to NEW glass surfaces:
- `app/components/EmberGlass/`
- `app/debug/design-system-v2/`
- The `glass-surface` rule in `app/globals.css` (allowed — that IS the token consumer).

```bash
# Forbid hardcoded glass/blur/accent hex values in NEW glass surface files
# (allows tokens like var(--glass-bg), oklch(...), and inherited Ember Noir tokens)

# 1. Hex colors in new glass component files
grep -rEn '#[0-9a-fA-F]{3,8}\b' \
  app/components/EmberGlass/ \
  app/debug/design-system-v2/ \
  2>/dev/null && exit 1 || echo "PASS: no hardcoded hex colors"

# 2. Hardcoded blur(Npx) values (other than within --glass-blur reference)
grep -rEn 'blur\([0-9]+px\)' \
  app/components/EmberGlass/ \
  app/debug/design-system-v2/ \
  2>/dev/null && exit 1 || echo "PASS: no hardcoded blur values"

# 3. Hardcoded oklch() values outside the picker preset map
# (the picker file is allowed to declare presets; component files must use var(--accent))
grep -rEn 'oklch\(' \
  app/components/EmberGlass/AmbientBg.tsx \
  2>/dev/null && exit 1 || echo "PASS: AmbientBg uses var(--accent)"
```

**Note:** The picker page (`app/debug/design-system-v2/page.tsx`) is the one place where literal `oklch(...)` strings ARE allowed — it's the source of the preset map. Audit excludes it.

## Runtime State Inventory

> Phase 174 is greenfield (additive token system). No rename/refactor/migration touchpoints. SKIPPED.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Next.js | All | ✓ | ^16.1.0 | — |
| React | All | ✓ | ^19.2.0 | — |
| tailwindcss | globals.css | ✓ | ^4.1.18 | — |
| next/font/google | DS-04 | ✓ | bundled with Next | — |
| @playwright/test | DS-04 verification | ✓ | (existing in tests/) | — |
| oklch() browser support | DS-03 | n/a (CSS feature) | n/a | None needed (modern targets only) |
| color-mix() browser support | Ambient (D-12) | n/a (CSS feature) | n/a | None needed (modern targets only) |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.x (unit) + Playwright (e2e) [VERIFIED: package.json + tests/ dir] |
| Config files | `jest.config.*` (existing); `playwright.config.ts` (verified) |
| Quick run command | `npm run test:changed` or `npm run test:components` (per CLAUDE.md rule 8) |
| Full suite command | `npm test` — RESERVED for release gates only; agents must NOT use it |
| E2E command | `npx playwright test tests/smoke/ember-glass-fonts.spec.ts` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DS-01 | `:root` exposes 11 named CSS tokens; grep against `app/globals.css` | static (grep) | `grep -E '^\s*--(glass-bg\|glass-blur\|glass-border\|glass-shadow\|accent\|text-1\|text-2\|r-card\|pad-card\|font-display\|font-body):' app/globals.css \| wc -l` should return ≥ 11 | static check, no test file |
| DS-02 | No hardcoded glass/blur/accent values in NEW glass surface files | static (grep) | See Example 5 above | static check |
| DS-03 (oklch presets) | 6 hue preset constants exposed in picker page | unit | `npm test -- app/debug/design-system-v2/__tests__/page.test.tsx` | ❌ Wave 0 — create |
| DS-03 (live update) | Picker click sets `--accent` on documentElement | unit + RTL | Same file as above; assert `setProperty` mock call | ❌ Wave 0 |
| DS-03 (persistence) | Click persists to localStorage | unit | Same; mock localStorage | ❌ Wave 0 |
| DS-04 | Zero requests to fonts.googleapis.com | e2e (Playwright) | `npx playwright test tests/smoke/ember-glass-fonts.spec.ts` | ❌ Wave 0 — create |
| DS-04 | Body uses Inter, display uses Outfit (computed style) | unit (jsdom) | Test that `<html>` className includes both `outfit.variable` and `inter.variable` strings | ❌ Wave 0 |
| DS-05 (toggle) | Toggle persists to localStorage `ember-glass-ambient` | unit + RTL | `npm test -- app/components/EmberGlass/__tests__/AmbientBg.test.tsx` | ❌ Wave 0 |
| DS-05 (hard reload) | Pre-paint script reads localStorage and sets `data-ambient` attr | e2e (Playwright) | New test in `tests/smoke/ember-glass-ambient.spec.ts`: `page.evaluate(() => localStorage.setItem('ember-glass-ambient','true'))` then reload, assert `document.documentElement.dataset.ambient === 'on'` | ❌ Wave 0 |
| DS-06 (backdrop-filter applied) | `.glass-surface` has `backdrop-filter` rule | static (grep) | `grep -E 'backdrop-filter:.*var\(--glass-blur\)' app/globals.css` returns ≥ 1 hit | static |
| DS-06 (fallback rule present) | `@supports not` block defines `glass-surface` solid bg | static (grep) | `grep -E '@supports not.*backdrop-filter' app/globals.css` returns ≥ 1 hit | static |
| DS-06 (fallback works) | When backdrop-filter unsupported, surface stays opaque | manual visual | Use Chrome DevTools "Rendering > emulate CSS feature" or browser without support; visual check on demo card | manual fallback |

### Sampling Rate

- **Per task commit:** `npm run test:changed` (only files touched) — fast feedback per CLAUDE.md rule 8.
- **Per wave merge:** `npm run test:components` + `npm run test:pages` (covers new EmberGlass + design-system-v2 page).
- **Phase gate:** Run all relevant scoped suites + `npx playwright test tests/smoke/ember-glass-fonts.spec.ts tests/smoke/ember-glass-ambient.spec.ts` green before `/gsd-verify-work`. **Do NOT run bare `npm test` from agents** (CLAUDE.md rule 8).

### Wave 0 Gaps

- [ ] `app/components/EmberGlass/__tests__/AmbientBg.test.tsx` — covers DS-05 toggle + initial-state-from-data-attribute
- [ ] `app/debug/design-system-v2/__tests__/page.test.tsx` — covers DS-03 picker preset map, setProperty call, localStorage persist
- [ ] `tests/smoke/ember-glass-fonts.spec.ts` — covers DS-04 (Playwright network assertion)
- [ ] `tests/smoke/ember-glass-ambient.spec.ts` — covers DS-05 hard-reload survival (Playwright)
- [ ] No new Jest config or fixtures needed — existing `jest.config.*` + jsdom environment cover RTL component tests; Playwright config already supports new spec files in `tests/smoke/`.

## Sources

### Primary (HIGH confidence)
- `.planning/inbox/ember-glass-design/project/components/app.jsx` — design bundle (lines 5-13 hue presets; 100-112 token values; 168-202 ambient component)
- `.planning/REQUIREMENTS.md` §DS-01..DS-06 — locked requirements
- `.planning/ROADMAP.md` lines 52-63 — Phase 174 goal + 5 success criteria
- `.planning/phases/149-theme-removal-core/149-CONTEXT.md` + `149-01-PLAN.md` — historical inline pre-paint script pattern
- `app/globals.css` (existing) — Tailwind v4 `@theme` block, font declarations at lines 209-211, `glass-*` utility precedents at 1029-1034, 1424-1430
- `app/fonts.ts` (existing) — next/font/google `variable:` pattern
- `app/layout.tsx` (existing) — html className wiring, `<head>` structure
- `tests/smoke/page-loads.spec.ts` — existing Playwright `page.on()` listener pattern (lines 7-20)
- `playwright.config.ts` — existing E2E config with Auth0 storageState
- `package.json` — Next 16.1, React 19.2, tailwindcss 4.1.18

### Secondary (MEDIUM confidence)
- MDN — `@supports`, `backdrop-filter`, `oklch()`, `color-mix()` browser support tables (queried via training knowledge; cross-checked against caniuse.com defaults — modern targets covered)
- Tailwind v4 `@theme` directive behavior — emit-to-`:root` semantics inferred from observed globals.css cascade

### Tertiary (LOW confidence)
- Exact keyframe transforms for `ambientA/B/C` — not in `app.jsx`; recreated from design intent. **[ASSUMED A1]**

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The exact `@keyframes ambientA/B/C` transform sequences (drift + scale) match design intent | Code Examples §1 | Visual mismatch with design bundle; trivial to fix by reading `Design System.html` once during implementation. Recommend planner instructs implementer to verify against `.planning/inbox/ember-glass-design/project/Design System.html`. |

## Open Questions

1. **Existing `@theme` font declarations — edit or override?**
   - What we know: `globals.css:209-211` declares `--font-display: 'Outfit', ...` and `--font-body: 'Space Grotesk', ...` inside `@theme`. New `:root` block (D-01) declares same names with `var(--font-display-outfit)` references.
   - What's unclear: D-03 says "additive, no removal" of legacy tokens, but the conflicting font declarations in `@theme` are NOT semantic Ember Noir tokens — they're font-family bindings. Strictly additive interpretation = leave them and rely on cascade order. Cleaner interpretation = remove them from `@theme` and let the `:root` block be the single source.
   - Recommendation: **Cascade override (leave `@theme` alone)**. Reasoning: D-03 is explicit about additive policy; cascade override works correctly; later cleanup phase can remove the duplicate `@theme` lines. Document this decision in PLAN.md.

2. **Picker → AmbientBg communication mechanism**
   - What we know: Picker page is at `/debug/design-system-v2`; AmbientBg lives in `app/layout.tsx`. They are sibling-mounted — no parent-child prop path.
   - What's unclear: How should picker toggle update AmbientBg state without a full reload?
   - Options: (a) Custom DOM event (`window.dispatchEvent(new CustomEvent('ember-glass-ambient-change', {detail: bool}))`), (b) `storage` event (fires only across tabs, not same tab), (c) Tiny shared Zustand store, (d) React Context + portal.
   - Recommendation: **(a) Custom event** — zero deps, decoupled, works for both picker and any future toggle source.

3. **Should the inline pre-paint script live in layout.tsx or a separate component?**
   - What we know: Phase 149 historically had it inline in layout.tsx; design bundle doesn't dictate.
   - Discretion (per CONTEXT.md). Recommendation: **Inline in layout.tsx** — short (~10 lines), single call site, easier to reason about cascade with `<head>` adjacent meta tags.

4. **Where to surface the picker entry from `/debug/page.tsx`?**
   - What we know: D-06 says picker is also linked from `/debug/page.tsx`. Existing /debug page has a "Design System" button at line 363-369 that links to `/debug/design-system`.
   - Recommendation: Add a sibling "Design System v2" button right next to it, same shape, linking to `/debug/design-system-v2`. No tab refactor.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hex/HSL color tokens | OKLCH for accents | 2022-2023 (browser support landed) | Perceptually uniform hue shifts; cleaner accent picker math |
| `tailwind.config.js` token block | Tailwind v4 `@theme` in CSS | Tailwind v4 (2025) | Tokens live in CSS file, no JS config; project already on v4.1.18 |
| Inline `<style>` for theme | Inline `<script>` + `setProperty` | Stable since 2020 | No flash on hydration |
| `_document.tsx` pre-paint script | App Router: `<script dangerouslySetInnerHTML>` in layout `<head>` | Next 13+ App Router | Direct, no Pages Router scaffolding |

## Project Constraints (from CLAUDE.md)

- NEVER run `npm install` or `npm run build` from agents.
- NEVER commit/push without explicit user request.
- NEVER use bare `npm test` from agents or PLAN `<verify><automated>` blocks. Use scoped scripts: `test:changed`, `test:quick`, `test:unit`, `test:api`, `test:components`, `test:pages`. Or `npm test -- <specific paths>`.
- USE design system from `/debug/design-system` (existing Ember Noir reference) when building component shapes — but NOTE: the new `/debug/design-system-v2` is the v20.0 reference and is being created in THIS phase.
- Firebase: use `filterUndefined()` for updates (not relevant to phase 174 — no Firebase writes).
- API routes: `export const dynamic = 'force-dynamic';` (not relevant — no new API routes).
- Client components: `'use client'` directive (relevant for AmbientBg + design-system-v2 page).
- UI: variants only (`<Heading variant="ember">`) — relevant when building demo card components.
- Prefer editing existing files (relevant for `app/fonts.ts`, `app/layout.tsx`, `app/globals.css`, `app/debug/page.tsx`). NEW files: `app/components/EmberGlass/AmbientBg.tsx`, `app/debug/design-system-v2/page.tsx`, `tests/smoke/ember-glass-fonts.spec.ts`, `tests/smoke/ember-glass-ambient.spec.ts`.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project, versions verified
- Architecture: HIGH — patterns directly inherited from phase 149 + design bundle + existing globals.css conventions
- Pitfalls: HIGH — inferred from concrete file inspection (existing `@theme` declarations, fonts.ts variable name conflict)
- OKLCH/color-mix browser support: MEDIUM — based on training knowledge; modern targets (Next 16, no browserslist override) make this safe
- Keyframe transforms: LOW — not in design bundle source [ASSUMED A1]

**Research date:** 2026-04-27
**Valid until:** ~2026-05-27 (30 days; stack is stable, no fast-moving dependencies)

## RESEARCH COMPLETE
