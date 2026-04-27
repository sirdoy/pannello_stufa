---
phase: 176
plan: 04
plan_id: 176-04
slug: playwright-smoke
subsystem: testing
tags: [playwright, e2e, splash, ember-glass, smoke-test]
requires:
  - 176-01 (FlameViz primitive + globals.css keyframes)
  - 176-02 (Splash presentational + useReducedMotion)
  - 176-03 (SplashGate orchestrator + ClientProviders wiring)
provides:
  - tests/smoke/splash.spec.ts — 5 E2E specs covering SPLASH-01..05
  - app/debug/design-system-v2/page.tsx Section 07 — Replay splash debug button
affects:
  - SPLASH-01 — splash visibility within ~1.5s post-Auth0 (Playwright runtime)
  - SPLASH-02 — animation timeline beats (Playwright runtime)
  - SPLASH-03 — prefers-reduced-motion: reduce honoured (Playwright runtime)
  - SPLASH-04 — no re-trigger on in-session route change (Playwright runtime)
  - SPLASH-05 — non-blocking device fetches during splash window (Playwright runtime)
tech-stack:
  added: []
  patterns:
    - Phase 51 real-Auth0 signIn helper reuse
    - Phase 97 collectConsoleErrors helper convention reuse
    - Phase 175 waitForFunction(inline-style) animation-timing pattern reuse
    - storageState: { cookies: [], origins: [] } to force fresh per-test sign-in
key-files:
  created:
    - tests/smoke/splash.spec.ts (211 LOC, 5 named specs)
  modified:
    - app/debug/design-system-v2/page.tsx (+75 LOC, Section 07 Replay splash demo)
decisions:
  - "D-27: Playwright suite shipped at tests/smoke/splash.spec.ts (NOT tests/playwright/...)"
  - "D-28: VersionEnforcer dismissal via best-effort helper; runtime deferred per Phase 175 precedent"
  - "Claude's Discretion: <SplashGate forceShow> debug button shipped on /debug/design-system-v2"
metrics:
  duration_minutes: ~25
  tasks_completed: 2 (of 3 — Task 3 is checkpoint:human-verify, deferred per autonomous mode)
  files_changed: 2
  commits: 2
  completed_date: 2026-04-27
---

# Phase 176 Plan 04: Playwright Smoke Summary

5 Playwright specs at `tests/smoke/splash.spec.ts` covering SPLASH-01..05 plus a `/debug/design-system-v2` "Replay splash" debug button that remounts `<SplashGate forceShow>` for visual regression iteration.

## What Shipped

### Task 1 — Replay splash debug button (commit `3276c13c`)

Added Section 07 to `app/debug/design-system-v2/page.tsx`:

- Italian visible copy `Replay splash` + helper `Pulisce sessionStorage e ri-monta lo splash per il regression test visivo` per UI-SPEC §"Copywriting Contract" lock.
- Click handler: `sessionStorage.removeItem('ember-glass-splash-shown')` (try/catch wrapped per T-174-03-04 mirror) + `setReplayKey((k) => k + 1)` to remount.
- Renders `<SplashGate key={replayKey} forceShow><div aria-hidden /></SplashGate>` only after first click. The inner SplashGate's overlay is `position: fixed` z-index 1000 — visually covers the page, the intended demo behavior per UI-SPEC §"Claude's Discretion".
- Imported `SplashGate` from `@/app/components/EmberGlass` barrel.
- Existing Sections 01–06 (hue picker, ambient toggle, tokens, glass demo, press, sheet) untouched — Rule 1 honored.

### Task 2 — Playwright spec (commit `19589b31`)

Created `tests/smoke/splash.spec.ts` (211 LOC) with **5 named specs** in a single `test.describe` block, all using `storageState: { cookies: [], origins: [] }` so each test forces a fresh Auth0 sign-in and a clean sessionStorage:

| ID | Test name | Assertion |
|-----|-----------|-----------|
| SPLASH-01 | `splash appears within ~1.5s of dashboard landing post-Auth0` | `page.getByTestId('splash-overlay')` becomes visible ≤1500ms, hidden ≤2300ms; zero console errors |
| SPLASH-02 | `sequence beats: flame scale(0.4) → scale(1) → unmount` | `page.waitForFunction` checks inline-style `transform.includes('scale(0.4)')` then `scale(1)` (excluding `scale(1.08)`); overlay hides ≤2300ms |
| SPLASH-03 | `reduced-motion: opacity-only fade, no transform, ≤600ms` | New context with `reducedMotion: 'reduce'`; flame + dashboard-wrapper computed `transform` is `none` or identity matrix; overlay hides ≤600ms |
| SPLASH-04 | `no re-trigger on in-session route change (Home → Stanze → Automazioni → Home)` | After first splash dismisses, navigations to `/stanze`, `/automazioni`, `/` never re-mount `splash-overlay` |
| SPLASH-05 | `≥1 device API request fires during splash window` | `page.on('request')` captures URLs; regex `/\/api\/(stove\|thermostat\|lights\|network\|sonos\|dirigera\|raspi\|tuya)/` matches ≥1 capture before overlay hides |

Helpers reused (no duplication):
- `signIn(page, email, password)` from `tests/helpers/auth.helpers.ts` (Phase 51 real-Auth0 pattern).
- `TEST_USER` from `tests/helpers/test-context.ts`.
- `collectConsoleErrors(page)` co-located in this spec via the canonical Phase 97 pattern.
- `page.waitForFunction(...)` checking inline `el.style.transform` — verbatim Phase 175 sheet-primitive.spec.ts pattern.

VersionEnforcer handling per CONTEXT.md D-28: `dismissVersionEnforcerIfPresent(page)` co-located helper looks for the Italian heading `Aggiornamento Disponibile` (rendered by `app/components/ForceUpdateModal.tsx`), `[data-version-enforcer]`, and `[data-testid="version-enforcer"]`; if visible, clicks any button matching `/aggiorna|ricarica|reload|chiudi|ignora|dismiss/i`, falling back to ESC.

## Coverage Matrix

| Requirement | Layer | Test | Status |
|-------------|-------|------|--------|
| SPLASH-01 | Jest (Splash) | Phase 176-02 splash.test.tsx | ✅ green (Phase 176-02 SUMMARY) |
| SPLASH-01 | Jest (SplashGate) | Phase 176-03 splashgate.test.tsx | ✅ green (Phase 176-03 SUMMARY) |
| SPLASH-01 | Playwright | `splash.spec.ts › SPLASH-01` | 🟡 authored, runtime deferred (D-28) |
| SPLASH-02 | Jest (Splash) | Phase 176-02 timeline assertions | ✅ green |
| SPLASH-02 | Playwright | `splash.spec.ts › SPLASH-02` | 🟡 authored, runtime deferred |
| SPLASH-03 | Jest (useReducedMotion + Splash) | Phase 176-02 reduced-motion paths | ✅ green |
| SPLASH-03 | Playwright | `splash.spec.ts › SPLASH-03` | 🟡 authored, runtime deferred |
| SPLASH-04 | Jest (SplashGate) | Phase 176-03 sessionStorage gating | ✅ green |
| SPLASH-04 | Playwright | `splash.spec.ts › SPLASH-04` | 🟡 authored, runtime deferred |
| SPLASH-05 | Jest | (n/a — only Playwright can capture network) | n/a |
| SPLASH-05 | Playwright | `splash.spec.ts › SPLASH-05` | 🟡 authored, runtime deferred |

## Verification

### Authoring validation (✅ PASSED)

```bash
$ npx playwright test --list tests/smoke/splash.spec.ts
[chromium] › smoke/splash.spec.ts:87  › SPLASH-01..05 — splash overlay › SPLASH-01 splash appears within ~1.5s of dashboard landing post-Auth0
[chromium] › smoke/splash.spec.ts:101 › SPLASH-01..05 — splash overlay › SPLASH-02 sequence beats: flame scale(0.4) → scale(1) → unmount
[chromium] › smoke/splash.spec.ts:129 › SPLASH-01..05 — splash overlay › SPLASH-03 reduced-motion: opacity-only fade, no transform, ≤600ms
[chromium] › smoke/splash.spec.ts:163 › SPLASH-01..05 — splash overlay › SPLASH-04 no re-trigger on in-session route change (Home → Stanze → Automazioni → Home)
[chromium] › smoke/splash.spec.ts:187 › SPLASH-01..05 — splash overlay › SPLASH-05 ≥1 device API request fires during splash window
Total: 6 tests in 2 files (5 + auth.setup.ts)
```

### Grep gates (✅ PASSED)

```
[2] Replay splash                                    (Section 07 + button label)
[6] SplashGate                                       (import + render + helpers)
[3] forceShow                                        (prop reference)
[1] ember-glass-splash-shown                         (sessionStorage key)
[1] sessionStorage.removeItem                        (clear on click)
[1] regression test visivo                           (Italian helper copy)
[5] SPLASH-01..05 spec test names                    (one each)
[1] reducedMotion: 'reduce'                          (new context option)
[1] page.on('request'                                (network capture)
[1] /api/(stove|thermostat|lights|network|sonos|dirigera|raspi|tuya)  (alternation list)
[2] version-enforcer                                 (dismiss helper)
```

### Jest regression (✅ PASSED)

```bash
$ npm run test:components -- app/components/EmberGlass/__tests__/ lib/hooks/__tests__/useReducedMotion.test.ts
Test Suites: 8 passed, 8 total
Tests:       72 passed, 72 total
Time:        3.464 s
```

Includes the 26 new Phase 176 tests (FlameViz, Splash, SplashGate) plus AmbientBg/Sheet/Pressable regression suites.

### Runtime disposition (🟡 DEFERRED per D-28 / Phase 175 precedent)

Best-effort `npx playwright test tests/smoke/splash.spec.ts` in this worktree fails before reaching the spec because the dev server in the worktree path is missing Firebase env vars (`Can't determine Firebase Database URL` from `lib/firebase.ts:16`). This is an **environment blocker, not a spec defect** — analogous to Phase 175's VersionEnforcer overlay deferral. The spec is authored correctly per `playwright test --list` and grep validation; it should run green on a developer machine with `.env.local` present and on CI where the env is provisioned, modulo the documented VersionEnforcer dismiss best-effort.

## Deviations from Plan

### None on Tasks 1 + 2

Plan executed exactly as written.

### Task 3 — checkpoint:human-verify

Per executor critical_constraints (autonomous --auto mode), Task 3 is documented as **deferred**: the orchestrator (or a human reviewer) should run the manual visual smoke (steps A–G in the plan) when an instance of the app with full env is available. The verification gate covers:

- Full Jest component suite regression (`npm run test:components`) — already exercised on the scoped Phase 176 subset above with 72/72 green.
- Playwright runtime (`npx playwright test tests/smoke/splash.spec.ts`) — deferred to env-complete environment.
- Manual browser walkthrough (sign-in → splash plays → dashboard appears → route changes don't re-trigger → reduced-motion path → `/debug/design-system-v2` Replay button).
- AUDIT-EXCEPTION grep gate on Splash.tsx + FlameViz.tsx (every hex literal tagged).
- Italian copy invariant (`grep -F 'gateway...'` returns no match — only U+2026 ellipsis).
- sessionStorage key consistency check across SplashGate, debug page, and spec.
- ROADMAP/STATE updates (handled by execute-phase orchestrator, not this executor).

## Threat Surface Scan

No new endpoints, auth paths, file access patterns, or schema changes introduced. The "Replay splash" button only clears one well-known UX flag; the spec only captures `req.url()` (no bodies/headers). The plan's threat register T-176-04-01..04 dispositions remain accurate.

## Self-Check: PASSED

- ✅ `tests/smoke/splash.spec.ts` exists (211 LOC).
- ✅ `app/debug/design-system-v2/page.tsx` modified (Section 07 added).
- ✅ Commit `3276c13c` (feat 176-04 Replay splash) exists in `git log`.
- ✅ Commit `19589b31` (test 176-04 splash.spec.ts) exists in `git log`.
- ✅ `npx playwright test --list` reports 5 specs in splash.spec.ts.
- ✅ Scoped Jest regression: 72/72 tests green across 8 suites.
- ✅ STATE.md / ROADMAP.md not modified (per parallel_execution rules).

## Recommended Follow-up

1. **Runtime exercise on env-complete machine**: when a developer has `.env.local` with Firebase keys present, run `npx playwright test tests/smoke/splash.spec.ts --reporter=line` and either (a) confirm all 5 specs pass, or (b) tune `dismissVersionEnforcerIfPresent` if the modal selector / button copy differs from the helper's expectations. Phase 175's VersionEnforcer overlay deferral may also be cleared at that time.

2. **CI integration**: once specs run green locally, add `tests/smoke/splash.spec.ts` to the CI Playwright matrix alongside the existing `auth-flows.spec.ts` / `page-loads.spec.ts` jobs.

3. **Optional cleanup (post-Phase 181)**: after the in-session UI shipped in Phases 178-181 lands, consider extracting `dismissVersionEnforcerIfPresent` to `tests/helpers/` if more specs need it — currently scoped to this file per Phase 175/176 precedent.
