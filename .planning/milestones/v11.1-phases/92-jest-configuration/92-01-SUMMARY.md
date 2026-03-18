---
phase: 92-jest-configuration
plan: "01"
subsystem: testing
tags: [jest, configuration, test-runner, ordering-independence, playwright]
dependency_graph:
  requires: []
  provides: [jest-playwright-exclusion, test-ordering-independence]
  affects: [jest.config.ts, package.json]
tech_stack:
  added: []
  patterns: [testPathIgnorePatterns, jest-randomize, resetAllMocks-in-beforeEach]
key_files:
  created: []
  modified:
    - jest.config.ts
    - package.json
    - lib/__tests__/weatherCacheService.test.ts
    - lib/hooks/__tests__/useDeviceStaleness.test.ts
    - lib/services/__tests__/StoveService.test.ts
    - __tests__/app/settings/thermostat/page.test.tsx
decisions:
  - "Added <rootDir>/tests/ to testPathIgnorePatterns to exclude 4 Playwright .spec.ts files from Jest discovery (JEST-01)"
  - "Used resetAllMocks() instead of clearAllMocks() in weatherCacheService.test.ts to prevent mockRejectedValue implementation bleed"
  - "Explicitly reset useVisibility mock to true in beforeEach (clearAllMocks does not clear mockReturnValue)"
  - "Reset MaintenanceRepository mock in beforeEach after discovery that test override leaked to subsequent tests"
  - "Fixed thermostat page test: set mockUseUser before render, not after (render used stale auth state)"
  - "test:random script added to package.json for CI/manual ordering validation (base test script unchanged)"
metrics:
  duration_minutes: 28
  completed_date: "2026-03-18"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 6
---

# Phase 92 Plan 01: Jest Configuration Summary

**One-liner:** Jest configured to exclude Playwright tests directory via testPathIgnorePatterns, with 4 ordering-dependent flakes fixed across 5 test files (clearAllMocks→resetAllMocks pattern + explicit mock resets).

## What Was Built

### JEST-01: Playwright Exclusion
Added `'<rootDir>/tests/'` to `testPathIgnorePatterns` in `jest.config.ts`. The 4 Playwright `.spec.ts` files (tests/features/*.spec.ts, tests/smoke/*.spec.ts) no longer appear in `npm test -- --listTests` output. Discovery count: 228 unit test files (project has grown since the plan was authored which predicted 76).

### JEST-02: Ordering Independence
Ran `npm test -- --randomize` repeatedly to identify ordering-dependent flakes. Found 4 suites that failed inconsistently:

| Suite | Root Cause | Fix |
|-------|------------|-----|
| `lib/__tests__/weatherCacheService.test.ts` | `clearAllMocks()` doesn't clear `mockRejectedValue` — rejection implementation leaked to next test | `clearAllMocks()` → `resetAllMocks()` in beforeEach |
| `lib/hooks/__tests__/useDeviceStaleness.test.ts` | `clearAllMocks()` doesn't clear `mockReturnValue` — `useVisibility` mock stuck at `false` after visibility tests | Explicit `jest.mocked(useVisibility).mockReturnValue(true)` in beforeEach |
| `lib/services/__tests__/StoveService.test.ts` | Test overrides `MaintenanceRepository.mockImplementation()` to return `canIgnite: false` — leak to subsequent tests | Re-apply default `canIgnite: true` factory in beforeEach |
| `__tests__/app/settings/thermostat/page.test.tsx` | Test called `render()` before `mockUseUser.mockReturnValue(...)` — stale auth state from prior test used | Swap lines: set mock before render |

After fixes: 3 consecutive randomize runs produce identical pass/fail results to the standard run. No ordering-dependent flakes remain.

### test:random Script
Added `"test:random": "jest --randomize"` to package.json scripts section alongside existing test scripts.

## Verification Results

| Check | Result |
|-------|--------|
| `npm test -- --listTests \| grep "tests/"` | 0 matches (JEST-01 PASS) |
| `jest.config.ts` contains `<rootDir>/tests/` | PASS |
| `package.json` has `test:random` script | PASS |
| 3x `npm test -- --randomize` same failures | PASS (JEST-02 PASS) |
| Standard run: Tests total | 3890 tests, 228 suites |
| Standard run: Known failures | 13 suites / 38 tests (TFIX scope for Phase 93-94) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Bug] Fixed weatherCacheService ordering-dependent failure**
- **Found during:** Task 1, step 4 (--randomize validation)
- **Issue:** `clearAllMocks()` in beforeEach does not reset `mockRejectedValue` implementation — test `should throw error if Firebase remove fails` leaked rejection to `should remove cache entry` when run in randomized order
- **Fix:** Changed `clearAllMocks()` to `resetAllMocks()` in beforeEach (safe here as all mock implementations are re-set explicitly in each test)
- **Files modified:** `lib/__tests__/weatherCacheService.test.ts`
- **Commit:** f3a3d71

**2. [Rule 2 - Bug] Fixed useDeviceStaleness ordering-dependent failure**
- **Found during:** Task 1, step 4 (--randomize validation)
- **Issue:** `jest.mocked(useVisibility).mockReturnValue(false)` set in `pauses polling when tab is hidden` was not cleared by `clearAllMocks()`, causing subsequent tests that don't explicitly set `useVisibility` to see the tab as hidden — `waitFor` calls timed out because the hook skipped polling
- **Fix:** Added explicit `jest.mocked(useVisibility).mockReturnValue(true)` in beforeEach after `clearAllMocks()`
- **Files modified:** `lib/hooks/__tests__/useDeviceStaleness.test.ts`
- **Commit:** f3a3d71

**3. [Rule 2 - Bug] Fixed StoveService ordering-dependent failure**
- **Found during:** Task 1, step 4 (--randomize validation)
- **Issue:** `should not sync when maintenance check fails` called `(MaintenanceRepository as jest.Mock).mockImplementation(() => ({ canIgnite: jest.fn().mockResolvedValue(false) }))` — `clearAllMocks()` did not reset this, so subsequent tests got `canIgnite: false` and threw `Maintenance required`
- **Fix:** Added default `MaintenanceRepository` mock reset to `canIgnite: true` in beforeEach
- **Files modified:** `lib/services/__tests__/StoveService.test.ts`
- **Commit:** f3a3d71

**4. [Rule 1 - Bug] Fixed thermostat page test render-before-mock bug**
- **Found during:** Task 1, step 4 (--randomize validation)
- **Issue:** `should handle auth state transitions correctly` called `render(<ThermostatSettingsPage />)` before `mockUseUser.mockReturnValue({ user: null, isLoading: true })` — when `should render content when authenticated` ran first, the stale authenticated state caused `pid-automation-panel` to be visible at the start of the transition test
- **Fix:** Swapped the two lines so mock is set before render
- **Files modified:** `__tests__/app/settings/thermostat/page.test.tsx`
- **Commit:** f3a3d71

## Key Decisions

1. **clearAllMocks vs resetAllMocks:** Applied `resetAllMocks()` only in `weatherCacheService.test.ts` where it's safe (all implementations re-set per test). Other files used explicit mock resets in beforeEach to preserve factory implementations that `resetAllMocks` would wipe.
2. **test:random not added to base test script:** Per plan instructions, `--randomize` stays as a separate script until Phases 93-94 fix the 13 known TFIX suites, after which the base script can be updated.
3. **Test file count 228 vs plan's expected 76:** Project has grown significantly since the research was authored. This is expected and does not affect the requirements — the key requirement is 0 Playwright files, not a specific count.

## Self-Check

**Files exist:**
- jest.config.ts: FOUND
- package.json: FOUND (contains test:random)
- lib/__tests__/weatherCacheService.test.ts: FOUND
- lib/hooks/__tests__/useDeviceStaleness.test.ts: FOUND
- lib/services/__tests__/StoveService.test.ts: FOUND
- __tests__/app/settings/thermostat/page.test.tsx: FOUND

**Commits exist:**
- f3a3d71: chore(92-01): exclude Playwright files and fix ordering-dependent test flakes
- f498778: chore(92-01): add test:random npm script for ordering independence validation

## Self-Check: PASSED
