---
phase: 117-dead-code-cleanup
plan: "02"
subsystem: lib/notifications + lib/health
tags: [dead-code, notifications, health-monitoring, firebase, grace-period]
dependency_graph:
  requires: []
  provides: [CLEAN-02, CLEAN-03]
  affects: [lib/notifications/notificationService.ts, lib/health/healthMonitoring.ts, __tests__/lib/healthMonitoring.test.ts]
tech_stack:
  added: []
  patterns: [Firebase RTDB grace period tracking, async detectStateMismatch, fail-safe Firebase error handling]
key_files:
  created: []
  modified:
    - lib/notifications/notificationService.ts
    - lib/health/healthMonitoring.ts
    - __tests__/lib/healthMonitoring.test.ts
decisions:
  - notificationService.ts re-exports removed (no external consumers found via grep)
  - adminDbRemove for non-STARTING states is fire-and-forget (catch(() => {})) to avoid blocking health check
  - detectStateMismatch async signature change is backward-compatible — only caller is checkUserStoveHealth which now awaits
  - Grace period fail-safe: Firebase errors return null (don't alert) to prevent false positives
metrics:
  duration: 15m
  completed: "2026-03-22T18:18:00Z"
  tasks_completed: 1
  files_modified: 3
---

# Phase 117 Plan 02: Clean notificationService + async detectStateMismatch with Grace Period

**One-liner:** Deleted disabled cleanupOldTokens block from notificationService.ts and implemented Firebase RTDB timestamp-based 15-minute grace period for STARTING stove states in detectStateMismatch.

## What Was Done

### CLEAN-02: notificationService.ts disabled block deleted

- Removed lines 481-513: the entire `/* DISABLED */` block for `cleanupOldTokens`
- Removed stale re-export: `export { supportsNotificationActions, getNotificationCapabilities } from './notificationActions'` (no external consumers, confirmed via grep)
- Added JSDoc comment referencing the migration target: `/api/notifications/cleanup + lib/services/tokenCleanupService.ts`

### CLEAN-03: async detectStateMismatch with grace period

**healthMonitoring.ts changes:**
- Import expanded: `adminDbGet, adminDbSet, adminDbRemove` from `@/lib/firebaseAdmin`
- `detectStateMismatch` changed from sync to async, added `userId: string` (4th parameter)
- STARTING block replaced: Firebase timestamp-based grace period logic
  - First observation: `adminDbSet('health/stoveStarting/{userId}', Date.now())` + return null
  - Within 15 min: return null (grace period active)
  - After 15 min: return `{ detected: true, reason: 'starting_timeout' }`
  - Firebase error: `console.error` + return null (fail-safe)
- Non-STARTING states: fire-and-forget `adminDbRemove('health/stoveStarting/{userId}')` cleanup
- `checkUserStoveHealth` caller updated: `await detectStateMismatch(..., userId)`

**__tests__/lib/healthMonitoring.test.ts changes:**
- Fixed module paths: `../../lib/stove/thermorossiProxy`, `../../lib/netatmo/netatmoProxy`, `../../lib/health/healthMonitoring`
- `firebaseAdmin` mock factory updated: includes `adminDbSet` and `adminDbRemove`
- All 8 existing `detectStateMismatch(...)` calls updated to `await detectStateMismatch(..., 'test-user')`
- Added `describe('STARTING grace period')` with 5 new test cases:
  1. writes timestamp on first STARTING observation
  2. returns null within grace period (5 min elapsed)
  3. flags starting_timeout after grace period expires (20 min elapsed)
  4. cleans up grace period key when leaving STARTING
  5. returns null on Firebase error (fail-safe)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| RED  | 7f790a11 | test(117-02): add failing tests for async detectStateMismatch with grace period |
| GREEN | 63361380 | feat(117-02): clean notificationService + async detectStateMismatch with grace period |

## Test Results

- `__tests__/lib/healthMonitoring.test.ts`: 23/23 tests pass (18 pre-existing + 5 new grace period)
- Pre-existing failures in `healthDeadManSwitch.test.ts` and `healthLogger.test.ts` are unrelated (missing `notificationTriggersServer` module — out of scope)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect mock paths in test file**
- **Found during:** RED phase (test failed to run)
- **Issue:** Test file used `../../lib/thermorossiProxy` and `../../lib/netatmoProxy` but modules are at `../../lib/stove/thermorossiProxy` and `../../lib/netatmo/netatmoProxy`
- **Fix:** Updated all import/mock paths to correct subdirectory paths; also corrected healthMonitoring import to `../../lib/health/healthMonitoring`
- **Files modified:** `__tests__/lib/healthMonitoring.test.ts`
- **Commit:** 7f790a11

## Acceptance Criteria Verification

```
grep -c "DISABLED" notificationService.ts         → 0 PASS
grep -c "cleanupOldTokens" notificationService.ts → 0 PASS
grep -c "Token lifecycle management" notificationService.ts → 1 PASS
grep -c "supportsNotificationActions" notificationService.ts → 0 PASS
grep "async function detectStateMismatch" healthMonitoring.ts → 1 PASS
grep "adminDbGet.*health/stoveStarting" healthMonitoring.ts → 1 PASS
grep "adminDbSet.*health/stoveStarting" healthMonitoring.ts → 1 PASS
grep "adminDbRemove.*health/stoveStarting" healthMonitoring.ts → 1 PASS
grep "starting_timeout" healthMonitoring.ts → 1 PASS
grep "starting_timeout" healthMonitoring.test.ts → 2 PASS
npx jest healthMonitoring.test.ts → 23/23 PASS
```

## Known Stubs

None — plan goal fully achieved.

## Self-Check: PASSED
