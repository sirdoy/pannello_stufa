---
phase: 71-react-compiler
plan: 01
subsystem: infra
tags: [react-compiler, babel, memoization, performance, next.js]

# Dependency graph
requires:
  - phase: 70-measurement-baseline-quick-wins
    provides: Performance baseline + Web Vitals pipeline established
provides:
  - React Compiler 1.0 enabled globally via reactCompiler: true in next.config.ts
  - babel-plugin-react-compiler@1.0.0 installed as devDependency
  - Healthcheck confirmed 271/271 components compile without violations
  - Zero new test regressions from compiler enablement
affects: [72-bundle-splits, 73-polling-optimization, 74-suspense-streaming]

# Tech tracking
tech-stack:
  added: [babel-plugin-react-compiler@1.0.0]
  patterns: [React Compiler auto-memoization replaces manual useMemo/useCallback, "use no memo" directive for opt-outs]

key-files:
  created: []
  modified:
    - next.config.ts
    - package.json
    - package-lock.json

key-decisions:
  - "All 28 failing tests are pre-existing (confirmed by running identical test set without reactCompiler flag) — no compiler regressions"
  - "No 'use no memo' opt-outs required: healthcheck shows 271/271 components pass, and zero new test failures introduced by compiler"
  - "COMP-02 satisfied: React Compiler causes zero new test failures across the 4004 passing tests"

patterns-established:
  - "React Compiler activation: single line reactCompiler: true in nextConfig, plus babel-plugin-react-compiler as devDependency"
  - "Pre-existing test failures confirmed by toggling reactCompiler flag before declaring regressions"

requirements-completed: [COMP-01, COMP-02, COMP-03]

# Metrics
duration: 13min
completed: 2026-02-18
---

# Phase 71 Plan 01: React Compiler Enablement Summary

**React Compiler 1.0 enabled globally via `reactCompiler: true` — 271/271 components auto-memoized, zero new regressions across 4004 tests**

## Performance

- **Duration:** 13 min
- **Started:** 2026-02-18T14:41:40Z
- **Completed:** 2026-02-18T14:55:28Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Ran `npx react-compiler-healthcheck@latest` — 271 out of 271 components compiled successfully, no incompatible libraries (COMP-03)
- Installed `babel-plugin-react-compiler@1.0.0` as devDependency and enabled `reactCompiler: true` in `next.config.ts` (COMP-01)
- Confirmed zero new test regressions: 4004 tests pass with compiler ON; 28 pre-existing failures confirmed as pre-existing by toggling compiler flag (COMP-02)

## Task Commits

1. **Task 1: Run healthcheck, add compiler dependency, and enable React Compiler** - `64815bd` (feat)
2. **Task 2: Run full test suite and opt out non-compliant components** - no commit (no file changes needed — zero opt-outs required)

## Files Created/Modified
- `next.config.ts` — Added `reactCompiler: true` after `reactStrictMode: true`
- `package.json` — Added `"babel-plugin-react-compiler": "^1.0.0"` to devDependencies
- `package-lock.json` — Lock file updated with new package

## Healthcheck Output

```
Successfully compiled 271 out of 271 components.
StrictMode usage not found.
Found no usage of incompatible libraries.
```

Note: "StrictMode usage not found" is expected — the healthcheck looks for explicit `<StrictMode>` JSX in source code, not the `reactStrictMode: true` Next.js config option. Next.js applies StrictMode internally; the project IS running in StrictMode via config.

## Test Results

**Final test run (compiler ON):**
- 4004 tests pass
- 28 tests fail (all pre-existing, confirmed by toggling compiler)
- 4032 total

**Pre-existing failures (NOT caused by React Compiler):**
- `middleware.test.ts`, `envValidator.test.ts`, `changelogService.test.ts`, `VersionContext.test.tsx` — `console.log` mock assertion pattern fails in both compiler ON and OFF states
- `stoveApi.test.ts`, `maintenanceService.test.ts`, `schedulerService.test.ts`, `healthDeadManSwitch.test.ts` — Non-React failures, same in both states
- `StovePrimaryActions.test.tsx`, `ThermostatCard.schedule.test.tsx`, `useNetworkData.test.ts` — Component test quality issues, same in both states
- `tests/smoke/auth-flows.spec.ts`, `tests/features/*.spec.ts` — Playwright TypeError from playwright-core bundle (4 suites, same in both states)
- `fritzboxClient.test.ts` — Jest worker out of memory (same in both states)

**Verification method:** Ran component tests after temporarily removing `reactCompiler: true` from next.config.ts (while keeping babel-plugin-react-compiler installed). Identical failures in both configurations.

## Decisions Made

- No `"use no memo"` opt-outs needed — healthcheck confirmed 271/271 components compile without violations
- Pre-existing test failures confirmed by toggling compiler flag before declaring them regressions
- Existing `useMemo`/`useCallback` calls NOT removed per plan (deferred for regression attribution in follow-up phase)

## Deviations from Plan

None — plan executed exactly as written. The "fallback path" in Task 2 (add opt-outs) was not needed.

## Issues Encountered

- Healthcheck reports "StrictMode usage not found" — investigated and confirmed this is expected behavior (healthcheck scans JSX source for `<StrictMode>` wrapper, not `next.config.ts` config). Not a concern.
- 28 pre-existing test failures required investigation to confirm they predate the compiler. Toggling the `reactCompiler` flag verified none are compiler-caused.

## User Setup Required

None — no external service configuration required. React Compiler runs entirely at build/compile time with no runtime configuration.

## Next Phase Readiness

- React Compiler 1.0 is now active globally across all 271 components
- All `useMemo`/`useCallback` calls remain in place for regression attribution in future cleanup phase
- Phase 72 (bundle splits) can proceed — React Compiler enablement is isolated in this commit for clean attribution
- Visual verification: Open React DevTools Profiler in browser after `npm run dev` — compiled components show a sparkle (✨) badge

## Self-Check: PASSED

- `next.config.ts` — FOUND, `reactCompiler: true` present
- `package.json` — FOUND, `babel-plugin-react-compiler` present
- `node_modules/babel-plugin-react-compiler` — FOUND (installed)
- Commit `64815bd` — FOUND in git log

---
*Phase: 71-react-compiler*
*Completed: 2026-02-18*
