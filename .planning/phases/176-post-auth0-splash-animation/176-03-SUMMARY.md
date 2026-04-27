---
phase: 176
plan: 03
slug: splashgate-orchestrator
subsystem: app/components/EmberGlass
tags:
  - ember-glass
  - splash
  - auth0
  - orchestrator
  - sessionStorage
  - reduced-motion
requires:
  - 176-01  # AmbientBg/FlameViz/keyframes (FlameViz consumed by Splash)
  - 176-02  # Splash + useReducedMotion (consumed verbatim)
provides:
  - splashgate-orchestrator
  - clientproviders-splash-integration
affects:
  - app/components/ClientProviders.tsx
tech_stack:
  added: []
  patterns:
    - sibling-overlay-render (children mount immediately during splash window)
    - ssr-safe-sessionstorage (try/catch read on hydration; try/catch write on done)
    - useUser-discriminated-union (destructure { user, isLoading } only; ignore error)
    - usereducedmotion-forwarding (reducedMotion prop to Splash AND wrapper transition)
    - jest-module-mock (StovePage.test.tsx canonical pattern: mockUseUser jest.fn())
key_files:
  created:
    - app/components/EmberGlass/SplashGate.tsx
    - app/components/EmberGlass/__tests__/SplashGate.test.tsx
  modified:
    - app/components/EmberGlass/index.ts
    - app/components/ClientProviders.tsx
decisions:
  - SPLASH_FLAG_KEY constant declared once at module top — all uses reference the constant (not a magic string at the call site).
  - shouldShowSplash is a derived boolean (not React state) so the predicate stays deterministic from inputs.
  - <Splash> rendered as a SIBLING of dashboard-wrapper — children always mount, satisfying SPLASH-05 non-blocking fetch contract.
  - reducedMotion is passed AS a prop to <Splash> AND consumed by the wrapper transition — single matchMedia subscription serves both layers.
  - Both sessionStorage operations (read on hydrate, write on onDone) wrapped in try/catch — incognito graceful no-op (T-176-03-02 mitigation, Test 9).
  - Jest tests mock @auth0/nextjs-auth0/client and @/lib/hooks/useReducedMotion at module level — the real <Splash> + real <FlameViz> are exercised under fake timers.
metrics:
  duration: "3m 44s"
  completed_date: "2026-04-27"
  tasks_completed: 2
  files_changed: 4
  loc_added: 245
  tests_added: 9
  tests_total_passing: 36
---

# Phase 176 Plan 03: SplashGate Orchestrator Summary

Wired the post-Auth0 splash into the dashboard tree via a single sibling-overlay orchestrator (`<SplashGate>`) that owns Auth0 `useUser()`, sessionStorage persistence, `useReducedMotion()`, and the `ready` crossfade — no other touchpoints needed.

## Objective Recap

Per CONTEXT.md D-02 / D-04 / D-05: ship a single integration component that consumes `<Splash>` (Plan 02) verbatim, gates it on Auth0 + sessionStorage + reduced-motion, and mounts inside `<ClientProviders>` so the splash covers the entire dashboard tree on session entry while children mount immediately (SPLASH-05).

## What Shipped

### `app/components/EmberGlass/SplashGate.tsx` (89 LOC)

- `'use client'` orchestrator with `SplashGate` named export + `SplashGateProps` interface.
- Reads `useUser()` from `@auth0/nextjs-auth0/client` (destructure `{ user, isLoading }` only; the discriminated-union `error` field is ignored — boolean coercion of `user` handles all branches per RESEARCH Pitfall 1).
- Reads `useReducedMotion()` from `@/lib/hooks/useReducedMotion` and forwards the result to both `<Splash reducedMotion>` AND the `dashboard-wrapper` inline `style.transition`.
- SSR-safe sessionStorage hydration: a `useEffect` on mount sets `hydrated=true` and reads `'ember-glass-splash-shown'` inside a try/catch (incognito graceful no-op).
- Trigger predicate (D-08): `forceShow || (hydrated && !shownThisSession && !isLoading && !!user && !ready)`.
- `onDone` callback: `setReady(true)` + `setShownThisSession(true)` + `sessionStorage.setItem(SPLASH_FLAG_KEY, 'true')` wrapped in a second try/catch.
- Rendered output is a fragment containing:
  1. `<div data-testid="dashboard-wrapper">{children}</div>` with crossfade inline style — full-motion: `opacity .6s + transform .7s cubic-bezier(.22,1,.36,1) .1s` and `scale(0.97 → 1)`; reduced-motion: `opacity .2s linear` with `transform: undefined` so React renders no transform style at all (satisfies SPLASH-03 reduced-motion contract).
  2. `<Splash reducedMotion={reducedMotion} onDone={...} />` — only mounted when `shouldShowSplash` is true; sibling, not parent.

### `app/components/EmberGlass/__tests__/SplashGate.test.tsx` (156 LOC, 9 tests)

Module-level mocks for `@auth0/nextjs-auth0/client` and `@/lib/hooks/useReducedMotion` (canonical StovePage.test.tsx pattern). `beforeEach` clears sessionStorage + resets both mocks to default truthy-user / no-reduced-motion. The real `<Splash>` and real `<FlameViz>` are exercised under fake timers — no nested module mocks needed.

Coverage matrix:

| # | Behavior | Decision |
|---|----------|----------|
| 1 | dashboard-wrapper always present + children rendered | SPLASH-05, D-05 |
| 2 | Splash mounts when user + !isLoading + no flag | SPLASH-01, D-08 |
| 3 | Splash skipped when sessionStorage flag = 'true' | SPLASH-04, D-09 |
| 4 | Splash skipped while isLoading | D-10 (anti-flicker) |
| 5 | Splash skipped when user null (logged out) | D-12 |
| 6 | reduced-motion → wrapper transition is opacity-only, no transform | D-16, D-17 |
| 7 | onDone writes sessionStorage flag + flips wrapper opacity to 1 | D-07, D-16 |
| 8 | forceShow bypasses sessionStorage gate | D-11 |
| 9 | sessionStorage.setItem throw → no crash, splash unmounts cleanly | T-176-03-02 |

### `app/components/EmberGlass/index.ts` (5 → 11 lines)

Appended `SplashGate` + `SplashGateProps` after the `Splash` exports — preserves Phase 174/175 exports (Pressable, Sheet, AmbientBg) and Phase 176 Wave 1 (FlameViz) and Wave 2 (Splash).

### `app/components/ClientProviders.tsx` (single-line edit + import)

Added `import { SplashGate } from '@/app/components/EmberGlass';` alongside `InstallPrompt` and replaced bare `{children}` with `<SplashGate>{children}</SplashGate>`. Order under `<CommandPaletteProvider>` is now: `<AxeDevtools />` → `<PWAInitializer />` → `<OfflineBanner fixed showPendingCount />` → `<SplashGate>{children}</SplashGate>` → `<InstallPrompt />`. No other change.

## File Ownership Boundary (Plans 02 ↔ 03)

Both plans append to `app/components/EmberGlass/index.ts`, but at different positions:

- Plan 02 appended `Splash` + `SplashProps` (lines 8–9).
- Plan 03 appended `SplashGate` + `SplashGateProps` (lines 10–11).

The barrel is now 11 lines total. No collisions, no rebases.

## How Plan 04 Will Validate End-to-End

The Playwright spec (Plan 04) drives a real Auth0 sign-in flow and asserts:

1. Sign-in → `[data-testid="splash-overlay"]` becomes visible.
2. Splash dismisses around t=2100ms (full-motion) or t=200ms (reduced-motion via `prefers-reduced-motion: reduce` emulation).
3. Network capture confirms dashboard XHRs fire DURING the splash window (SPLASH-05 non-blocking fetch contract).
4. Page reload within the same tab → splash does NOT reappear (sessionStorage gate).
5. New incognito context → splash plays once on first sign-in.
6. `/debug/design-system-v2` Replay button uses the `forceShow` prop to demo the splash regardless of sessionStorage state.

## Verification Run

```
$ npm run test:components -- \
    app/components/EmberGlass/__tests__/SplashGate.test.tsx \
    app/components/EmberGlass/__tests__/Splash.test.tsx \
    app/components/EmberGlass/__tests__/FlameViz.test.tsx
Test Suites: 4 passed, 4 total
Tests:       36 passed, 36 total
```

(`__tests__/app/components/devices/camera/CameraMonitoringToggle.test.tsx` is matched by the `test:components` glob and also passes — unrelated to this plan.)

`npm run test:unit -- lib/hooks/__tests__/useReducedMotion.test.ts` → 285/285 unit tests green; no regressions in the hook consumed by SplashGate.

## Deviations from Plan

None. Patterns from `176-PATTERNS.md` were followed verbatim. The plan flagged two acceptable approaches for Test 7 (mock Splash vs. real Splash + fake timers); I chose **real Splash + fake timers** — keeps the test deterministic at <100ms and exercises the real Splash → SplashGate.onDone integration path, which is more valuable than a stubbed Splash mock.

## Commits

| Hash | Type | Subject |
|------|------|---------|
| 301b42fa | test | add failing SplashGate Jest matrix (RED) |
| 216c8fd1 | feat | implement SplashGate orchestrator (GREEN) |
| ff4876a7 | feat | wire SplashGate into ClientProviders + barrel export |

## Decision Citations Implemented

D-02, D-04, D-05, D-07, D-08, D-09, D-10, D-11, D-12, D-16, D-17, D-20, D-21, D-29 — all honored. D-22 (Splash root pointer-events flip) belongs to Plan 02 and remains untouched.

## Self-Check: PASSED

- `app/components/EmberGlass/SplashGate.tsx`: FOUND
- `app/components/EmberGlass/__tests__/SplashGate.test.tsx`: FOUND
- `app/components/EmberGlass/index.ts`: FOUND (11 lines, exports SplashGate + SplashGateProps)
- `app/components/ClientProviders.tsx`: FOUND (`<SplashGate>{children}</SplashGate>` between OfflineBanner and InstallPrompt)
- Commit `301b42fa`: FOUND
- Commit `216c8fd1`: FOUND
- Commit `ff4876a7`: FOUND
- 36 EmberGlass primitive tests pass (no regressions in FlameViz / Splash / SplashGate).

## Known Stubs

None. SplashGate is fully wired and the dashboard tree integration is complete. Plan 04 will add the Replay button on `/debug/design-system-v2` that consumes the `forceShow` prop already shipped here.
