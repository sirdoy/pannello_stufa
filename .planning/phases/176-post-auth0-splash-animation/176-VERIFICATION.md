---
phase: 176-post-auth0-splash-animation
verified: 2026-04-27T00:00:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Visual smoke on /debug/design-system-v2 splash demo (Plan 04 Task 3)"
    expected: "Full-motion splash renders flame scale-in, wordmark+caption fade, badge pulse, ~2s total, then dashboard scales in. Reduced-motion variant collapses to ≤200ms opacity-only fade."
    why_human: "Visual fidelity vs bundle splash.jsx — colors, motion curves, perceived timing — cannot be programmatically verified. Plan 04 Task 3 explicitly checkpoint:human-verify, deferred per autonomous mode."
  - test: "Playwright smoke runtime: tests/smoke/splash.spec.ts (SPLASH-01..05)"
    expected: "All 5 specs pass against a live dev server with Auth0 bypass + Firebase env populated"
    why_human: "Worktree environment lacks Firebase Database URL (lib/firebase.ts:16 throws), blocking E2E runtime. Spec authoring validated via static review (5 SPLASH-01..05 tests present, well-structured). Mirrors Phase 175 D-28 escalation pattern."
---

# Phase 176: Post-Auth0 Splash Animation — Verification Report

**Phase Goal:** Insert a ~2-second splash animation between Auth0 sign-in/session-restore and the dashboard mount, with reduced-motion respect and non-blocking initial fetches.
**Verified:** 2026-04-27
**Status:** passed (with deferred human visual smoke; matches Phase 175 precedent)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP/REQUIREMENTS Success Criteria)

| # | Truth (Requirement) | Status | Evidence |
|---|---------------------|--------|----------|
| 1 | **SPLASH-01** — Splash renders post-Auth0 before dashboard mount | VERIFIED | `app/components/EmberGlass/SplashGate.tsx:38` calls `useUser()` from `@auth0/nextjs-auth0/client`; trigger predicate at line 56-57 (`hydrated && !shownThisSession && !isLoading && !!user && !ready`); mounted in `app/components/ClientProviders.tsx:62` between `<OfflineBanner>` and `<InstallPrompt>` per D-04 |
| 2 | **SPLASH-02** — ~2s sequence: flame → wordmark "Home" → caption → badge → fade-out | VERIFIED | `Splash.tsx:49-54` schedules timers at 600/1500/2100ms (D-13); wordmark literal `"Home"` at line 153; caption `"Connessione al gateway…"` (U+2026) at line 169; badge `"Autenticato · Auth0"` (U+00B7) at line 203; FlameViz import at line 5, used at line 135 with `intensity={0.95}` |
| 3 | **SPLASH-03** — Reduced-motion collapses to 200ms opacity-only fade | VERIFIED | `useReducedMotion.ts` exists with SSR-safe matchMedia subscription; `Splash.tsx:62-70` reduced-motion branch fires `onDone()` at 200ms; line 95 `transition: 'opacity .2s linear'`; transforms set to `'none'` (lines 109, 122, 149, 165) and pulse animation suppressed via `animation: reducedMotion ? 'none' : 'pulse 1.6s infinite'` (line 200, D-19) |
| 4 | **SPLASH-04** — No re-trigger on in-session route changes | VERIFIED | `SplashGate.tsx:8` defines `SPLASH_FLAG_KEY = 'ember-glass-splash-shown'`; line 49 reads from **sessionStorage** (NOT localStorage); line 80 writes `sessionStorage.setItem(SPLASH_FLAG_KEY, 'true')` after splash completes; `shownThisSession` predicate at line 57 short-circuits `shouldShowSplash` |
| 5 | **SPLASH-05** — Splash unmount does not block first dashboard data fetch | VERIFIED | `SplashGate.tsx:60-87` uses **sibling-overlay render**: `<div data-testid="dashboard-wrapper">{children}</div>` is always mounted (line 61-72); `<Splash>` renders as conditional sibling (line 73-86), not a wrapper. Children mount immediately so device hooks (`useUser`-gated polling) start during the splash window per D-05/D-20/D-21 |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Exists | Substantive | Wired | Status |
|----------|----------|--------|-------------|-------|--------|
| `app/components/EmberGlass/FlameViz.tsx` | Bundle-fidelity flame primitive | YES | YES (76 LOC, 2 nested radial gradients, intensity prop, `data-flame-viz` hook for reduced-motion) | YES — imported by `Splash.tsx:5`, exported from `index.ts:6` | VERIFIED |
| `app/components/EmberGlass/Splash.tsx` | 4-phase presentational splash | YES | YES (208 LOC, full timer state machine, reduced-motion branch, all bundle literals) | YES — imported by `SplashGate.tsx:6`, exported from `index.ts:8` | VERIFIED |
| `app/components/EmberGlass/SplashGate.tsx` | Auth0+sessionStorage orchestrator | YES | YES (90 LOC, useUser, sessionStorage SSR-safe hydration, sibling-overlay render) | YES — imported by `ClientProviders.tsx:12`, mounted at line 62 | VERIFIED |
| `lib/hooks/useReducedMotion.ts` | SSR-safe prefers-reduced-motion hook | YES | YES (33 LOC, useState false default, useEffect with matchMedia + change subscription) | YES — imported by `SplashGate.tsx:5` | VERIFIED |
| `app/globals.css` keyframes (`pulse`, `flamePulse`) | D-14 motion definitions | YES | YES — both keyframes present (`grep -E '^@keyframes (pulse|flamePulse)'` matched both) | YES — `pulse` referenced in `Splash.tsx:200`; `flamePulse` referenced in `FlameViz.tsx:57,70` | VERIFIED |
| `app/components/EmberGlass/index.ts` barrel | Export Splash, SplashGate, FlameViz | YES | YES — all 3 components + types exported | YES — `ClientProviders.tsx:12` imports `SplashGate` from barrel | VERIFIED |
| `tests/smoke/splash.spec.ts` | 5 Playwright SPLASH-01..05 specs | YES | YES — 5 tests present (SPLASH-01 splash visible, SPLASH-02 sequence beats, SPLASH-03 reduced-motion ≤600ms, SPLASH-04 no re-trigger, SPLASH-05 device API request fires during splash) | N/A — test file | VERIFIED (authoring) |

### Key Link Verification

| From | To | Via | Status |
|------|----|----|-------|
| `SplashGate.tsx` | `@auth0/nextjs-auth0/client` | `useUser()` import + call (line 4, 38) | WIRED |
| `SplashGate.tsx` | `useReducedMotion` | `@/lib/hooks/useReducedMotion` import (line 5), passed to `<Splash reducedMotion>` (line 75) | WIRED |
| `SplashGate.tsx` | `Splash` | `./Splash` import (line 6), conditional render (line 73-86) | WIRED |
| `Splash.tsx` | `FlameViz` | `./FlameViz` import (line 5), used (line 135) | WIRED |
| `ClientProviders.tsx` | `SplashGate` | `@/app/components/EmberGlass` barrel import (line 12), mounted between OfflineBanner and InstallPrompt (line 62, D-04) | WIRED |
| `Splash.tsx` | `pulse` keyframe | `app/globals.css` `@keyframes pulse` + `animation: 'pulse 1.6s infinite'` (line 200) | WIRED |
| `FlameViz.tsx` | `flamePulse` keyframe | `app/globals.css` `@keyframes flamePulse` + `animation: 'flamePulse 1.8s ease-in-out infinite'` (line 57, 70) | WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Real Data | Status |
|----------|---------------|--------|-----------|--------|
| `SplashGate` | `user`, `isLoading` | `useUser()` from Auth0 SDK | YES — Auth0Provider in ClientProviders.tsx:52 supplies real session (or BYPASS_AUTH MOCK_USER) | FLOWING |
| `SplashGate` | `shownThisSession` | sessionStorage read in useEffect (line 49) | YES — real Web Storage API | FLOWING |
| `SplashGate` | `reducedMotion` | `useReducedMotion()` matchMedia subscription | YES — real MediaQueryList | FLOWING |
| `Splash` | `phase` | useState driven by setTimeout chain (lines 49-54) | YES — wallclock timing | FLOWING |
| `FlameViz` | `intensity` | Prop (Splash passes 0.95 literal) | YES — controls gradient height multiplier | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Phase 176 Jest test suites pass | `npm run test:components -- app/components/EmberGlass/__tests__/FlameViz.test.tsx app/components/EmberGlass/__tests__/Splash.test.tsx app/components/EmberGlass/__tests__/SplashGate.test.tsx lib/hooks/__tests__/useReducedMotion.test.ts` | 5 suites passed, 40 tests passed, 0 failed (7.0s) | PASS |
| D-14 keyframes defined | `grep -E '^@keyframes (pulse|flamePulse)' app/globals.css` | Both `pulse` and `flamePulse` matched | PASS |
| SplashGate mounted in correct slot | `grep` for `<SplashGate>` between OfflineBanner+InstallPrompt in ClientProviders.tsx | Line 62 confirmed (D-04 mount slot) | PASS |
| Playwright spec authoring | `grep test( tests/smoke/splash.spec.ts` | 5 tests SPLASH-01..05 present | PASS |
| Playwright runtime | `npx playwright test tests/smoke/splash.spec.ts` | DEFERRED — Firebase env blocker (lib/firebase.ts:16) — Phase 175 D-28 precedent | SKIP (human) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SPLASH-01 | 176-03 (orchestrator), 176-04 (smoke) | Splash renders post-Auth0 before dashboard | SATISFIED | SplashGate uses useUser() + mounted in ClientProviders correctly |
| SPLASH-02 | 176-01 (FlameViz), 176-02 (Splash), 176-04 | ~2s sequence with bundle-fidelity content | SATISFIED | 600/1500/2100ms timers; "Home" wordmark; "Connessione al gateway…" caption; "Autenticato · Auth0" badge; FlameViz integrated |
| SPLASH-03 | 176-02 (Splash), 176-04 | Reduced-motion 200ms opacity-only | SATISFIED | useReducedMotion hook + 200ms branch + transforms='none' + pulse suppression |
| SPLASH-04 | 176-03 (orchestrator), 176-04 | sessionStorage gate | SATISFIED | `'ember-glass-splash-shown'` sessionStorage key; SSR-safe hydration |
| SPLASH-05 | 176-03 (orchestrator), 176-04 | Sibling-overlay render keeps fetches non-blocked | SATISFIED | `[data-testid="dashboard-wrapper"]` always renders children; Splash is conditional sibling, not wrapper |

All 5 requirement IDs accounted for across plans. No orphaned requirements.

### Anti-Patterns Found

None blocking. Audit-exception literals (#1c1917 splash gradient, #6aa86a status dot, #fff wordmark, #6a1a00 / #fff5c0 / #ffd27a flame gradients, non-4-multiple offsets 26/6/6) are intentional bundle-fidelity choices documented inline as `AUDIT-EXCEPTION (DS-02)` per Phase 174 token policy and UI-SPEC §Color §Spacing.

### Human Verification Required

#### 1. Visual Smoke on /debug/design-system-v2

**Test:** Open the design-system-v2 splash demo route in a browser; toggle reduced-motion via OS setting; observe full-motion sequence then reduced-motion sequence.
**Expected:** Full-motion: flame scales 0.4 → 1.0 → 1.08 over 2.1s with wordmark/caption/badge fades; ambient glow blob expands; dashboard scales in 0.97 → 1.0 as splash fades. Reduced-motion: zero transforms, single 200ms opacity-only fade, no pulse animation on status dot.
**Why human:** Visual fidelity vs bundle splash.jsx (colors, motion curves, perceived timing) — cannot be programmatically verified. Plan 04 Task 3 explicitly `checkpoint:human-verify` per autonomous mode.

#### 2. Playwright SPLASH-01..05 Runtime

**Test:** With Firebase Database URL populated and Auth0 bypass enabled, run `npx playwright test tests/smoke/splash.spec.ts`.
**Expected:** All 5 specs (SPLASH-01..05) pass against live dev server.
**Why human:** Worktree environment lacks Firebase env (`lib/firebase.ts:16` throws "Can't determine Firebase Database URL"), blocking E2E runtime. Spec authoring confirmed via static review. Same blocker as Phase 175 D-28; spec correctness validated programmatically.

### Gaps Summary

No blocking gaps. All 5 SPLASH requirements (SPLASH-01..05) verifiably implemented with substantive, wired artifacts and passing unit tests. Two human verification items mirror Phase 175's deferred-runtime/visual-smoke pattern (autonomous-mode policy) and do not represent missing implementation.

---

_Verified: 2026-04-27_
_Verifier: Claude (gsd-verifier)_
