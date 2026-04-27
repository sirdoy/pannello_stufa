---
phase: 174-ember-glass-tokens-foundations
plan: 02
subsystem: ember-glass
tags: [ambient-glow, layout, prepaint-script, localStorage, ember-glass, custom-event]
requires: [174-01]
provides:
  - "AmbientBg client provider (DS-05 ambient layer)"
  - "Inline pre-paint <script> in <head> reading localStorage ember-glass-accent + ember-glass-ambient"
  - "Custom event ember-glass-ambient-change as in-session sync channel"
  - "AmbientBg mounted as first child of <body> at z-index 0"
affects: ["app/layout.tsx", "app/components/EmberGlass/AmbientBg.tsx"]
tech-stack:
  added: ["next/script (inline dangerouslySetInnerHTML)", "CustomEvent<boolean>"]
  patterns: ["pre-paint hydration script", "static-literal-only dangerouslySetInnerHTML (XSS mitigation)", "TDD RED-GREEN", "side-effect-only client provider"]
key-files:
  created:
    - "app/components/EmberGlass/AmbientBg.tsx (98 LOC)"
    - "app/components/EmberGlass/__tests__/AmbientBg.test.tsx (68 LOC, 7 tests)"
  modified:
    - "app/layout.tsx (5 atomic edits, +9/-2 LOC)"
decisions: [D-08, D-09, D-12, D-13, D-14, D-15]
metrics:
  duration: ~25 min
  completed: 2026-04-27
  tasks: 2
  commits: 4
  tests_added: 7
  tests_passing: 7
---

# Phase 174 Plan 02: Ambient Background + Pre-Paint Hydration Summary

**One-liner:** Wired Ember Glass runtime layer with inline pre-paint `<script>` in `<head>` (zero-flash localStorage hydration of `--accent` and `data-ambient`), `<AmbientBg />` client provider mounted as first child of `<body>` rendering 3 fixed-position radial-gradient blobs driven by `var(--accent)` + custom-event sync.

## Artifacts Created

### `app/components/EmberGlass/AmbientBg.tsx` (98 LOC)
- `'use client'` directive (D-15 contract)
- Public surface: `export default function AmbientBg(): React.ReactElement | null`
- `useState` initializer reads `document.documentElement.dataset.ambient` synchronously → mirrors pre-paint script result, eliminating flash on hard reload
- `useEffect` attaches `ember-glass-ambient-change` CustomEvent listener; cleanup removes it on unmount (no leak)
- Renders `null` when `data-ambient` is unset/`'off'` (D-14 default OFF)
- When `on`: wrapper `<div aria-hidden="true">` (decorative) with 3 child `.ember-ambient-blob` divs at `position: fixed; pointer-events: none`
- Blob A (top-left): `var(--accent) 60% → transparent`, animation `ambientA 14s`
- Blob B (bottom-right): `var(--accent) 40% → #301010`, animation `ambientB 18s` — `// AUDIT-EXCEPTION (DS-02)` comment
- Blob C (center): static `rgba(94, 175, 255, 0.25)` cool counterpoint, animation `ambientC 22s` — `// AUDIT-EXCEPTION (DS-02)` comment
- Class `ember-ambient-blob` matches the `prefers-reduced-motion` rule from Plan 01 globals.css (D-13 a11y compliance)

### `app/components/EmberGlass/__tests__/AmbientBg.test.tsx` (68 LOC, 7 tests)
| # | Test | Asserts |
|---|------|---------|
| 1 | Default OFF (D-14) | `container.firstChild === null` when `data-ambient` unset |
| 2 | Renders 3 blobs when `data-ambient='on'` at mount | wrapper exists; `.ember-ambient-blob` count = 3 |
| 3 | CustomEvent detail=true → renders blobs | dispatch event → 3 blobs appear |
| 4 | CustomEvent detail=false → renders nothing | dispatch event → `firstChild === null` |
| 5 | `aria-hidden="true"` wrapper | decorative semantic |
| 6 | Listener cleanup on unmount | `removeEventListener` called with same handler |
| 7 | Zero `console.error` | mounting + dispatching produces no errors |

**RED → GREEN:** First commit (`0bb9f461`) was the failing test (module not found). Second commit (`04b9d072`) added the implementation; all 7 tests passed on first run. No REFACTOR needed.

## Edits to `app/layout.tsx` (5 atomic edits)

1. **Font import swap:** `import { outfit, spaceGrotesk } from './fonts'` → `import { outfit, inter } from './fonts'`
2. **AmbientBg import added:** `import AmbientBg from './components/EmberGlass/AmbientBg'`
3. **`<html>` className:** `${spaceGrotesk.variable}` → `${inter.variable}` (still pairs with `${outfit.variable} dark`)
4. **Inline pre-paint `<script>` added** as first child of `<head>` (before `<meta name="view-transition">`)
5. **`<AmbientBg />` mounted** as first child of `<body>` (before the skip-link)

All other content preserved verbatim: metadata exports, viewport export, preconnect links, AppleSplashScreens, apple-touch-icon variants, mobile-web-app metas, theme-color, skip-link, ClientProviders, WebVitals, VersionEnforcer, Navbar, main, Footer.

## Inline Pre-Paint Script Body (verbatim)

```js
(function(){try{var a=localStorage.getItem('ember-glass-accent');var amb=localStorage.getItem('ember-glass-ambient');if(a){document.documentElement.style.setProperty('--accent',a);}if(amb==='true'){document.documentElement.dataset.ambient='on';}}catch(e){}})();
```

**XSS mitigation (T-174-02-01):** Body is a **static string literal** in `dangerouslySetInnerHTML.__html` — no template-string interpolation of any variable. Verified via:

```bash
grep -E 'dangerouslySetInnerHTML.*\$\{[a-zA-Z_]' app/layout.tsx | wc -l
# → 0
```

**Threat-model rationale:**
- T-174-02-01 (XSS): mitigated by static-literal rule above
- T-174-02-02 (Tampering on `--accent`): accepted — same-origin localStorage only; CSS custom property values cannot execute code
- T-174-02-03 (DoS via localStorage disabled): mitigated by `try/catch` IIFE; AmbientBg reads `dataset.ambient` (not localStorage directly), so a script-side exception falls back to default OFF

## Commits (4 total)

| Hash | Type | Description |
|------|------|-------------|
| `0bb9f461` | test | RED: failing test for AmbientBg (module not found) |
| `04b9d072` | feat | GREEN: implement AmbientBg client provider (DS-05) — all 7 tests pass |
| `59e990a0` | feat | Wire layout.tsx (5 atomic edits: font swap + import + className + script + mount) |
| _(this commit)_ | docs | Plan completion: SUMMARY + STATE + ROADMAP + REQUIREMENTS |

## Verification Results

- `npm test -- app/components/EmberGlass/__tests__/AmbientBg.test.tsx` → **7/7 passing** ✅
- `npm run test:pages -- layout` → 4 suites / 28 tests passing ✅ (no layout regression)
- All grep acceptance criteria satisfied:
  - `outfit/inter` import: 1 ✅
  - `spaceGrotesk` references remaining: 0 ✅
  - `AmbientBg` import: 1 ✅
  - `inter.variable` applied: 1 ✅
  - `ember-glass-accent` localStorage read: 1 ✅
  - `ember-glass-ambient` localStorage read: 1 ✅
  - `setProperty('--accent', …)` call: 1 ✅
  - `dataset.ambient` write: 1 ✅
  - `dangerouslySetInnerHTML`: 1 ✅
  - `<AmbientBg` mounted: 1 ✅
  - `try{` + `catch(e)` IIFE: 1 each ✅
  - Variable interpolation in script body: **0** ✅ (XSS mitigation T-174-02-01)
- AmbientBg-specific grep checks:
  - `'use client'`: 1 ✅
  - `ember-glass-ambient-change`: 3 (addEventListener + removeEventListener + JSDoc) ✅
  - `ember-ambient-blob`: 3 ✅
  - `aria-hidden`: 1 ✅
  - `AUDIT-EXCEPTION`: 3 (JSDoc preamble + 2 inline comments — exceeds minimum of 2) ✅
  - `var(--accent)`: 2 ✅
  - `color-mix(in oklab`: 2 ✅

## Deviations from Plan

None — plan executed exactly as written. The AUDIT-EXCEPTION grep returned 3 instead of the minimum-2 specified in acceptance criteria; this exceeds the minimum (the JSDoc preamble at the top of the file mentions both AUDIT-EXCEPTION sites as part of the file-level documentation). No code change needed; treat as informational.

## Decisions Honored

- **D-08** Inline pre-paint script pattern (Phase 149 precedent) — single static-literal IIFE in `<head>` reading two known localStorage keys
- **D-09** Body font swap (Inter replaces Space Grotesk) — `inter.variable` applied on `<html>`
- **D-12** AmbientBg as client provider mounted from RootLayout
- **D-13** `prefers-reduced-motion` compliance via shared CSS class `ember-ambient-blob` (rule lives in Plan 01 globals.css)
- **D-14** Default OFF — renders `null` when `data-ambient` unset; verified by Test 1
- **D-15** Custom event `ember-glass-ambient-change` as in-session sync channel between picker (Plan 03) and AmbientBg

## Threat Flags

None — all surfaces introduced are documented in the plan's `<threat_model>` register (T-174-02-01 through T-174-02-07). No new endpoints, auth paths, or schema changes.

## Known Stubs

None — AmbientBg is fully wired (props-less, reads from DOM + window event), and the layout edits compose with the picker (Plan 03) via the documented CustomEvent contract. Picker UI lives in Plan 03 as planned.

## Self-Check: PASSED

Verification (run after writing this SUMMARY):

- ✅ `app/components/EmberGlass/AmbientBg.tsx` exists (98 LOC)
- ✅ `app/components/EmberGlass/__tests__/AmbientBg.test.tsx` exists (68 LOC)
- ✅ `app/layout.tsx` modified (5 edits applied)
- ✅ Commit `0bb9f461` (test RED) present in `git log`
- ✅ Commit `04b9d072` (feat GREEN) present in `git log`
- ✅ Commit `59e990a0` (layout wiring) present in `git log`
- ✅ All 7 unit tests passing
- ✅ Page test regression check green (28 tests across 4 suites)
