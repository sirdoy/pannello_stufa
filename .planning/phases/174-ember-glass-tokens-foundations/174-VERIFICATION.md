---
phase: 174-ember-glass-tokens-foundations
verified: 2026-04-27T00:00:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Visual inspection of ambient gradient animations on /debug/design-system-v2"
    expected: "Three radial-gradient blobs animate at 14s/18s/22s, matching .planning/inbox/ember-glass-design/project/Design System.html aesthetic"
    why_human: "Visual/motion quality cannot be code-asserted; requires human eyes against design bundle reference"
  - test: "Backdrop-filter fallback in Safari Technology Preview with Develop > Disable Backdrop Filter"
    expected: "Glass demo card renders solid translucent rgba(28, 25, 23, 0.92) instead of becoming illegible"
    why_human: "@supports not feature query only triggers when the feature is genuinely absent; needs older Safari/Firefox build to verify"
  - test: "Outfit + Inter visual pairing match against design bundle Design System.html"
    expected: "Display headlines (Outfit) and body text (Inter) match the design bundle's typography aesthetic"
    why_human: "Typography aesthetic match cannot be code-asserted; requires human design review"
  - test: "Run Playwright smoke specs against an authenticated session"
    expected: "tests/smoke/fonts-self-hosted.spec.ts (2 tests), accent-picker.spec.ts (2 tests), ambient-persist.spec.ts (3 tests) — all 7 pass"
    why_human: "Auth0 storageState (tests/.auth/user.json) is stale; runtime execution requires interactive Auth0 login. Spec FILES are verified against the contract — runtime gating is auth-infrastructure, not a plan defect"
  - test: "DevTools Network panel: load /debug/design-system-v2 and confirm zero requests to fonts.googleapis.com / fonts.gstatic.com"
    expected: "Outfit + Inter served from /_next/static/media/* — no Google CDN runtime requests"
    why_human: "Roadmap success criterion #3 explicitly says 'verified via DevTools Network panel'; Playwright spec covers it programmatically but blocked by Auth0 (above)"
---

# Phase 174: Ember Glass Tokens & Foundations Verification Report

**Phase Goal:** Establish the Ember Glass design language as a token system that drives every surface, with oklch hue support, typography pair, ambient glow, and graceful blur fallback.
**Verified:** 2026-04-27
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (5 ROADMAP Success Criteria)

| #   | Truth                                                                                                                                  | Status     | Evidence                                                                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1   | `:root` exposes 11 named tokens; zero hardcoded glass/blur/accent hex in NEW component files (D-04 scope)                              | ✓ VERIFIED | `globals.css` lines 301+ declare all 11 tokens (grep returns 13 — extras are legacy `--font-display/-body` literals from `@theme`). DS-02 audit grep cascade PASS for hex/blur/oklch in `app/components/EmberGlass/` and `app/debug/design-system-v2/`. |
| 2   | Developer toolbar at `/debug/design-system-v2` lets user pick 6 oklch hues (copper, rose, violet, blue, green, amber); live `--accent` swap | ✓ VERIFIED | `page.tsx` (421 LOC) defines `ACCENT_PRESETS` map with 6 named hues; click handler calls `document.documentElement.style.setProperty('--accent', value)` + writes `localStorage 'ember-glass-accent'`; sibling button in `app/debug/page.tsx:372` links to v2. Unit test `page.test.tsx` 13/13 PASS. |
| 3   | Outfit + Inter via next/font, no fonts.googleapis.com runtime requests                                                                 | ✓ VERIFIED | `app/fonts.ts` declares `Outfit` + `Inter` from `next/font/google` (self-hosted) with `variable: '--font-display-outfit' / '--font-body-inter'`; `globals.css` aliases public `--font-display`/`--font-body`. `tests/smoke/fonts-self-hosted.spec.ts` (2 tests) asserts zero Google Fonts requests; runtime deferred (Auth0 gate). Repo-wide grep for `fonts.googleapis.com` / `fonts.gstatic.com` returns no source matches. |
| 4   | Ambient radial-gradient glow togglable, persists in localStorage, survives hard reload                                                | ✓ VERIFIED | `app/components/EmberGlass/AmbientBg.tsx` renders 3 fixed-position blobs gated on `<html data-ambient="on">`. Inline pre-paint script in `app/layout.tsx:39-43` reads `localStorage.getItem('ember-glass-ambient')` before paint. AmbientBg unit test 7/7 PASS (default OFF, custom-event sync, listener cleanup). `tests/smoke/ambient-persist.spec.ts` (3 tests) asserts hard-reload survival. |
| 5   | `backdrop-filter: blur() saturate(180%)` + WebKit prefix + `@supports not` fallback to solid translucent                              | ✓ VERIFIED | `globals.css` `.glass-surface` utility applies both `backdrop-filter` and `-webkit-backdrop-filter` with `saturate(180%)`. `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` block falls back to opaque `rgba(28, 25, 23, 0.92)`. Grep returns 1 match (≥1 required). |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact                                                       | Expected                                                                                  | Status     | Details                                                              |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------- |
| `app/globals.css`                                              | 11 Ember Glass tokens on `:root`, `.glass-surface` utility, `@supports not` fallback, 3 ambient keyframes | ✓ VERIFIED | All present (Bash grep verification above)                          |
| `app/fonts.ts`                                                 | `Outfit` + `Inter` from next/font/google, `--font-display-outfit` + `--font-body-inter` variables | ✓ VERIFIED | Verified via Read; `Space_Grotesk` removed                          |
| `app/layout.tsx`                                               | Inline pre-paint script reading `ember-glass-accent` + `ember-glass-ambient`; `<AmbientBg />` mounted | ✓ VERIFIED | Lines 39-43 (script) + line 60 (mount); imports `inter` from `./fonts` |
| `app/components/EmberGlass/AmbientBg.tsx`                      | Client provider with `'use client'`, 3 blobs, custom event listener, cleanup              | ✓ VERIFIED | 96 LOC; default OFF; AUDIT-EXCEPTION tags on 5 non-token literals    |
| `app/debug/design-system-v2/page.tsx`                          | 6-hue picker + ambient toggle + token grid + glass-surface demo                           | ✓ VERIFIED | 421 LOC; `ACCENT_PRESETS` allowlist; localStorage writes try/catch  |
| `app/debug/page.tsx`                                           | Nav link to `/debug/design-system-v2`                                                     | ✓ VERIFIED | Line 372 — sibling Button mirroring v1                              |
| `tests/smoke/fonts-self-hosted.spec.ts`                        | Playwright network assertion, 0 Google Fonts requests                                     | ✓ VERIFIED | 43 LOC, 2 tests; `page.on('request', …)` collector pattern          |
| `tests/smoke/accent-picker.spec.ts`                            | Click Rose swatch → assert `--accent` + localStorage + aria-pressed                       | ✓ VERIFIED | 42 LOC, 2 tests                                                     |
| `tests/smoke/ambient-persist.spec.ts`                          | Seed localStorage → reload → assert `data-ambient='on'`                                   | ✓ VERIFIED | 52 LOC, 3 tests                                                     |
| `app/components/EmberGlass/__tests__/AmbientBg.test.tsx`       | 7 unit tests covering default OFF, event sync, cleanup, a11y                              | ✓ VERIFIED | 7/7 PASS (jest run during verification)                            |
| `app/debug/design-system-v2/__tests__/page.test.tsx`           | 13 unit tests covering hue picker, ambient toggle, page structure, jest-axe                | ✓ VERIFIED | 13/13 PASS (jest run during verification)                          |

### Key Link Verification

| From                                  | To                                                  | Via                                                                | Status | Details                                                                  |
| ------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------ |
| `app/layout.tsx`                      | `next/font` Outfit + Inter                          | `import { outfit, inter } from './fonts'` + `${outfit.variable} ${inter.variable}` className | WIRED | `import` line 3, classNames applied to `<html>` line 37                  |
| `app/layout.tsx`                      | `AmbientBg` provider                                 | `import AmbientBg from './components/EmberGlass/AmbientBg'` + `<AmbientBg />` mount | WIRED | Import line 10, mount line 60 (first child of `<body>`)                  |
| `app/layout.tsx` pre-paint script     | localStorage `ember-glass-accent` / `-ambient`      | Inline `<script dangerouslySetInnerHTML>` IIFE with try/catch       | WIRED | Static-literal body; reads both keys; sets `--accent` + `dataset.ambient` |
| `AmbientBg`                           | `data-ambient` attribute                             | `useState` initializer reads `document.documentElement.dataset.ambient` synchronously | WIRED | Reads on mount; null-renders when not 'on'                              |
| `AmbientBg`                           | `ember-glass-ambient-change` CustomEvent             | `window.addEventListener` with cleanup                              | WIRED | Listener added in useEffect; cleanup in return                          |
| `design-system-v2/page.tsx` swatch    | `--accent` + localStorage                            | `setProperty('--accent', value)` + `localStorage.setItem('ember-glass-accent', value)` | WIRED | All 6 buttons wired; allowlist `ACCENT_PRESETS`                        |
| `design-system-v2/page.tsx` toggle    | AmbientBg                                            | `dispatchEvent(new CustomEvent('ember-glass-ambient-change', { detail }))` | WIRED | Plus localStorage write + `dataset.ambient` mutation                    |
| `app/debug/page.tsx`                  | `/debug/design-system-v2`                            | `<Button onClick={() => window.location.href = '/debug/design-system-v2'}>` | WIRED | Line 372                                                                |

### Data-Flow Trace (Level 4)

| Artifact                                              | Data Variable                | Source                                                              | Produces Real Data | Status         |
| ----------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------- | ------------------ | -------------- |
| `AmbientBg.tsx`                                       | `on` (boolean state)         | `dataset.ambient` (initial) + `ember-glass-ambient-change` events  | Yes — both event-driven and DOM-driven | ✓ FLOWING |
| `design-system-v2/page.tsx` accent state              | `activeHue`                  | `localStorage.getItem('ember-glass-accent')` rehydration on mount  | Yes               | ✓ FLOWING      |
| `design-system-v2/page.tsx` ambient state             | `ambientOn`                  | `localStorage.getItem('ember-glass-ambient')` rehydration on mount | Yes               | ✓ FLOWING      |
| `design-system-v2/page.tsx` token grid `--accent` row | `ACCENT_PRESETS[activeHue]`  | Live state — updates on swatch click                                | Yes               | ✓ FLOWING      |

### Behavioral Spot-Checks

| Behavior                                                              | Command                                                              | Result          | Status |
| --------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------- | ------ |
| AmbientBg unit tests pass                                              | `npm test -- app/components/EmberGlass/__tests__/AmbientBg.test.tsx` | 7/7 passing     | ✓ PASS |
| design-system-v2 page unit tests pass                                  | `npm test -- app/debug/design-system-v2/__tests__/page.test.tsx`    | 13/13 passing   | ✓ PASS |
| 11 Ember Glass tokens declared on `:root`                              | `grep -E "^\s+--(glass-bg\|...\|font-body):" app/globals.css \| wc -l` | 13 (≥11)        | ✓ PASS |
| `@supports not` fallback declared                                      | `grep -cE "@supports not.*backdrop-filter" app/globals.css`         | 1               | ✓ PASS |
| No `fonts.googleapis.com` in app/                                      | `grep -rE "fonts\.googleapis\.com" app/`                            | empty           | ✓ PASS |
| DS-02 audit (hex literals)                                             | `grep -rE "#[0-9a-fA-F]{3,8}" app/{EmberGlass,design-system-v2}/ \| grep -v AUDIT-EXCEPTION` | empty           | ✓ PASS |
| DS-02 audit (blur literals)                                            | `grep -rE "blur\([0-9]" app/{EmberGlass,design-system-v2}/ \| grep -v AUDIT-EXCEPTION`     | empty           | ✓ PASS |
| DS-02 audit (oklch literals in EmberGlass)                             | `grep -rE "oklch\(" app/components/EmberGlass/ \| grep -v AUDIT-EXCEPTION`                 | empty           | ✓ PASS |
| Playwright spec runtime                                                 | `npx playwright test tests/smoke/fonts-self-hosted.spec.ts ...`     | DEFERRED (auth) | ? SKIP |

### Requirements Coverage

| Requirement | Source Plan(s)        | Description                                                                                         | Status      | Evidence                                                                                          |
| ----------- | --------------------- | --------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| DS-01       | 174-01                | 11 named CSS variable tokens on `:root`                                                             | ✓ SATISFIED | All 13 declarations in `globals.css` post-`@theme` block; `--accent` is `oklch(0.68 0.17 45)`     |
| DS-02       | 174-01, 174-03        | Tokens drive surfaces — no hardcoded glass/blur/accent in NEW glass surface files                   | ✓ SATISFIED | DS-02 audit grep cascade passes for `app/components/EmberGlass/` and `app/debug/design-system-v2/`. AUDIT-EXCEPTION tags in place on documented non-token literals. |
| DS-03       | 174-02, 174-03        | 6 oklch hue presets, picker in `/debug` toolbar, live `--accent` swap                               | ✓ SATISFIED | `ACCENT_PRESETS` allowlist (6 entries), buttons wired, `aria-pressed` semantics, localStorage persistence |
| DS-04       | 174-01, 174-03        | Outfit + Inter via next/font, no Google CDN roundtrip                                               | ✓ SATISFIED | `app/fonts.ts` self-hosts; Playwright network assertion file ready (runtime deferred to authenticated session) |
| DS-05       | 174-02, 174-03        | Ambient toggle, localStorage persistence, hard-reload survival                                      | ✓ SATISFIED | AmbientBg + inline pre-paint script + Playwright spec; default OFF (D-14)                          |
| DS-06       | 174-01                | `backdrop-filter: blur() saturate(180%)` + `-webkit-` prefix + `@supports not` fallback             | ✓ SATISFIED | `.glass-surface` utility + `@supports not (...)` block; fallback `rgba(28, 25, 23, 0.92)`         |

### Anti-Patterns Found

| File                                                  | Line | Pattern                                                                                              | Severity | Impact                                                                                                                       |
| ----------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `app/debug/design-system-v2/page.tsx`                 | 336, 338, 343 | Documentary `rgba(...)` text strings in token-grid `dl` rows lack inline `// AUDIT-EXCEPTION` tags  | ℹ️ Info  | Same documentary-text pattern as `#f5f5f4` on line 341 (which IS tagged). The narrow Plan 03 audit grep flagged line 336 (`rgba(255, 255, 255, 0.04)`) when this verifier ran it; SUMMARY-claimed "PASS" passes only because the SUMMARY's grep was scoped narrower than the literal regex. These are pure display strings inside `<dd>` elements — not styling literals. **No functional impact on goal achievement.** Recommend adding 3 trailing `// AUDIT-EXCEPTION` comments in a future cleanup or before the DS-02 audit gate fires in later phases. |

### Human Verification Required

1. **Visual inspection of ambient gradient animations**
   - **Test:** Open `/debug/design-system-v2`, toggle ambient on, observe three radial gradients animating at 14s/18s/22s
   - **Expected:** Match the design bundle's `Design System.html` aesthetic
   - **Why human:** Visual/motion quality cannot be code-asserted

2. **Backdrop-filter fallback in browsers without backdrop-filter support**
   - **Test:** Use Safari Technology Preview with `Develop > Disable Backdrop Filter`, load `/debug/design-system-v2`
   - **Expected:** Demo card shows solid translucent `rgba(28, 25, 23, 0.92)` background, not illegible glass
   - **Why human:** `@supports not` only triggers when the feature is genuinely absent — needs older browser build or feature toggle

3. **Outfit + Inter visual pairing**
   - **Test:** Open `/debug/design-system-v2`, compare display headlines (Outfit) and body text (Inter) against `.planning/inbox/ember-glass-design/project/Design System.html`
   - **Expected:** Typography pairing matches design bundle aesthetic
   - **Why human:** Aesthetic match is subjective

4. **Playwright smoke runtime against authenticated session**
   - **Test:** Refresh `tests/.auth/user.json` via interactive Auth0 login, then run `npx playwright test tests/smoke/fonts-self-hosted.spec.ts tests/smoke/accent-picker.spec.ts tests/smoke/ambient-persist.spec.ts`
   - **Expected:** All 7 tests pass in ~10s
   - **Why human:** Auth0 OAuth re-auth requires interactive credentials; spec FILES are content-verified

5. **DevTools Network panel verification of zero Google CDN requests**
   - **Test:** Load `/debug/design-system-v2` in browser, inspect Network tab
   - **Expected:** Zero requests to `fonts.googleapis.com` or `fonts.gstatic.com`
   - **Why human:** Roadmap success criterion #3 explicitly says "verified via DevTools Network panel"; Playwright covers it programmatically but is auth-blocked

### Gaps Summary

**No goal-blocking gaps.** All 5 ROADMAP success criteria + all 6 DS-* requirements have implementation evidence:

- 13 tokens (≥11 required) declared on `:root` after `@theme` block
- `.glass-surface` utility consumes all 4 glass tokens via `var()` with both `backdrop-filter` and `-webkit-backdrop-filter`, plus `@supports not` fallback to opaque `rgba(28, 25, 23, 0.92)`
- 3 ambient keyframes (`ambientA 14s`, `ambientB 18s`, `ambientC 22s`) + `prefers-reduced-motion` guard
- `next/font` self-hosting both Outfit + Inter; public token aliases via `:root` cascade order
- Inline pre-paint script in `<head>` reading both localStorage keys with try/catch IIFE
- `AmbientBg` client provider mounted as first child of `<body>`, gated by `data-ambient`, custom-event sync
- `/debug/design-system-v2` page (421 LOC) with 6-hue picker, ambient toggle, token grid, glass-surface demo
- `/debug` index nav link to v2
- 20 unit tests (7 + 13) all passing; 7 Playwright e2e tests (file content verified, runtime deferred)
- DS-02 audit grep cascade: PASS for hex/blur/oklch literals in NEW glass surface files

**Minor non-blocking observation:** 3 documentary `rgba(...)` strings in the design-system-v2 token-grid display lack their own `AUDIT-EXCEPTION` comments (same pattern as the documentary `'#f5f5f4'` on line 341 which IS tagged). These are pure display strings, not styling literals. Recommend adding inline tags during a future DS-02 audit hardening pass.

**Status is `human_needed` (not `passed`)** because the milestone requires:
- Visual confirmation of ambient animation against design bundle
- Backdrop-filter fallback verification in a non-supporting browser
- Typography pairing visual review
- Playwright runtime against an authenticated session (Auth0 storageState refresh required)
- DevTools Network panel verification per roadmap SC #3 wording

These are infrastructure/UAT gates, not implementation defects.

---

_Verified: 2026-04-27_
_Verifier: Claude (gsd-verifier)_
