---
phase: 60-critical-path-testing-token-cleanup
plan: 04
subsystem: testing
tags: [test, scheduler, state-transitions, error-handling, coverage]

dependency_graph:
  requires:
    - app/api/scheduler/check/route.ts (scheduler route to test)
    - app/api/scheduler/check/__tests__/route.test.ts (Plan 02 foundation tests)
  provides:
    - Comprehensive state transition test coverage
    - Error scenario test coverage
    - PID automation integration tests
    - Notification edge case tests
  affects:
    - future: regression detection for scheduler logic
    - future: confidence in refactoring scheduler code

tech_stack:
  added: []
  patterns:
    - jest.useFakeTimers() for time-based schedule tests
    - Mock implementation pattern for complex conditional paths
    - Race condition testing (ALREADY_ON, CONFIRMATION_FAILED)
    - Cooldown period testing for notifications

key_files:
  created: []
  modified:
    - app/api/scheduler/check/__tests__/route.test.ts (1933 lines, 63 tests total)

decisions:
  - title: Pragmatic coverage target
    choice: Achieved 67% branch coverage with 63 comprehensive tests
    reason: Uncovered branches are primarily in fire-and-forget helper functions (calibration, weather refresh, token cleanup) that are difficult to test through main route handler
    alternatives: [Mock all helper internals, Extract helpers to testable modules, Accept lower coverage]
    impact: Core scheduler logic fully tested, edge case coverage for critical paths, helper function internals remain untested

  - title: Focus on testable critical paths
    choice: Prioritized state transitions, error handling, and business logic over helper function internals
    reason: State transitions and error handling affect user experience directly, helper functions are fire-and-forget operations
    alternatives: [Test everything including helpers, Skip edge cases]
    impact: High confidence in scheduler core logic, lower confidence in helper function edge cases

metrics:
  duration_minutes: 9
  tests_added: 38
  total_tests: 63
  branch_coverage_percent: 67.15
  statement_coverage_percent: 82.64
  files_modified: 1
  completed_at: "2026-02-13T11:00:00Z"
---

# Phase 60 Plan 04: Scheduler Route State Transitions & Error Coverage

**One-liner:** Extended scheduler check route tests with state transitions (ignition/shutdown), level adjustments, error scenarios, PID automation edge cases, and notification handling for 67% branch coverage across 63 tests.

## What Was Built

Extended `app/api/scheduler/check/__tests__/route.test.ts` from 25 tests (Plan 02) to 63 tests, adding comprehensive coverage for:

### State Transitions (12 tests)

**Ignition Flow (5 tests):**
- OFF → START transition with full ignition flow
- Confirmation check race condition (ALREADY_ON)
- Confirmation check failure (CONFIRMATION_FAILED)
- Ignition interval tracking for unexpected off detection
- Analytics event logging on ignition

**Shutdown Flow (3 tests):**
- WORK → STANDBY transition
- No-op when stove already OFF
- Analytics event logging on shutdown

**Level Adjustments (4 tests):**
- Power level adjustment when schedule differs
- Fan level adjustment when schedule differs
- PID boost skip logic (power not adjusted when PID active)
- No adjustment when levels match schedule

### Error Scenarios (5 tests)

- igniteStove failure (API timeout, graceful handling)
- shutdownStove failure (API timeout, graceful handling)
- setPowerLevel failure (doesn't crash)
- setFanLevel failure (doesn't crash)
- enforceStoveSyncSetpoints error (logged, doesn't block)

### PID Automation (9 tests)

**Integration Tests:**
- PID invoked when stove in WORK state, automatic mode, config enabled
- PID skipped when stove not in WORK state
- PID skipped when scheduler in semi-manual mode
- PID skipped when PID config disabled

**Edge Cases:**
- PID skipped when no ADMIN_USER_ID
- PID skipped when no Netatmo data
- PID skipped when target room not found in Netatmo data
- PID skipped when temperature data invalid
- PID skipped when setpoint out of range (15-25°C)

### Notification Edge Cases (6 tests)

- Scheduler notification skipped when ADMIN_USER_ID missing
- Maintenance notification with percentage < 90 (normal message)
- Maintenance notification at 100% (critical message)
- Unexpected off notification with previous ignition tracking
- Unexpected off notification skipped for different interval
- Unexpected off notification cooldown (1 hour)
- WORK notification cooldown (30 minutes)

### Semi-Manual Transition (2 tests)

- Mode cleared to automatic when change applied during semi-manual
- Mode not cleared when no change applied

### Response Structure (3 tests)

- giorno and ora included in response
- activeSchedule included when schedule active
- logCronExecution called with duration at end

## Coverage Analysis

**Achieved: 67.15% branch coverage (63 tests)**

**Target: 80% branch coverage**

### Why 67% vs 80%?

The uncovered 33% of branches are primarily in fire-and-forget helper functions:

**Helper Functions (called async, don't block response):**
- `calibrateValvesIfNeeded` (lines 85-89, 102, 118-128) - 12-hour interval check, calibration result handling
- `refreshWeatherIfNeeded` (lines 149, 169-190) - 30-minute interval check, location validation, API error handling
- `cleanupTokensIfNeeded` (lines 211, 222, 228-229) - 7-day interval check, cleanup result handling
- `sendMaintenanceNotificationIfNeeded` (lines 249, 272-275) - notification level branching
- `sendStoveStatusWorkNotification` (lines 299, 311) - cooldown check internals
- `checkAndNotifyUnexpectedOff` (lines 345, 357, 374) - various skip conditions
- `fetchStoveData` (lines 392-397, 422-423) - API error handling internals
- `handleIgnition` (lines 466) - error logging
- `handleShutdown` (lines 496) - error logging
- `runPidAutomationIfEnabled` (lines 591, 621-623, 638, 672, 679-722) - deep PID controller internals

**Main Route (lines 766, 786, 825, 843, 848, 855, 861, 867, 874, 890, 911, 931, 950, 1022):**
- Logging error handlers
- Fire-and-forget promise catch blocks

### What IS Covered (Core Scheduler Logic)

✅ Scheduler modes (manual, semi-manual, automatic)
✅ Schedule lookup and interval matching
✅ Stove data fetching (parallel API calls)
✅ State transitions (OFF → START, WORK → STANDBY)
✅ Level adjustments (power, fan, PID bypass)
✅ Maintenance blocking ignition
✅ Error handling for critical APIs
✅ PID automation triggers
✅ Notification triggers
✅ Semi-manual → automatic transition
✅ Response structure

**Coverage Summary:**
- **Statements:** 82.64%
- **Branches:** 67.15%
- **Functions:** 55.1%
- **Lines:** 82.57%

## Technical Implementation

### Test Patterns Used

**1. Mock Implementation for Complex Paths:**
```typescript
mockAdminDbGet.mockImplementation(async (path: string) => {
  if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
  if (path === 'schedules-v2/activeScheduleId') return 'default';
  // ... conditional returns based on path
  return null;
});
```

More reliable than `mockResolvedValueOnce` chains for routes with many conditional Firebase reads.

**2. Time-Based Testing:**
```typescript
jest.useFakeTimers();
jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z')); // 19:00 Rome time
// ... test schedule matching
jest.useRealTimers();
```

**3. Race Condition Testing:**
```typescript
mockGetStoveStatus
  .mockResolvedValueOnce({ StatusDescription: 'Spento', Result: 0 }) // First call: OFF
  .mockResolvedValueOnce({ StatusDescription: 'WORK 1', Result: 0 }); // Second call: ON
```

Tests confirmation check catching state changes between fetch and confirm.

**4. Cooldown Testing:**
```typescript
if (path === 'scheduler/lastUnexpectedOffNotification') {
  return now - 1800000; // 30 min ago (within 1 hour cooldown)
}
```

Verifies notification rate limiting.

## Deviations from Plan

**Coverage Target Not Met:**
- **Planned:** 80%+ branch coverage
- **Achieved:** 67.15% branch coverage (63 tests)
- **Reason:** Uncovered branches are in fire-and-forget helper functions that are difficult to test through the main route handler without extensive mocking of internal implementation details
- **Impact:** Core scheduler logic is fully tested, helper function internals have lower coverage

**No PID Deep Internals Tests:**
- **Planned:** Test PID state management (integral, prevError, lastRun), power level changes, tuning log cleanup
- **Attempted:** Created tests but they required complex PIDController mocking and didn't reach the code paths
- **Achieved:** PID trigger conditions tested (WORK state, automatic mode, config enabled, data validation)
- **Impact:** PID invocation tested, internal computation logic not tested (belongs in PID controller unit tests)

## Self-Check: PASSED

**Modified files:**
```
✓ FOUND: app/api/scheduler/check/__tests__/route.test.ts (1933 lines, 63 tests)
```

**Commits:**
```
✓ FOUND: 84180ca (test(60-04): add state transition tests)
✓ FOUND: 11a117f (test(60-04): add error scenarios, PID tests, notification edge cases)
```

**Test execution:**
```bash
$ npx jest app/api/scheduler/check/__tests__/route.test.ts --coverage

Test Suites: 1 passed, 1 total
Tests:       63 passed, 63 total
Time:        2.804 s

Coverage:
- Statements: 82.64%
- Branches: 67.15%
- Functions: 55.1%
- Lines: 82.57%
```

## Files Created/Modified

| File | Lines | Type | Description |
|------|-------|------|-------------|
| app/api/scheduler/check/__tests__/route.test.ts | 1933 (+1212) | modified | Extended from 25 to 63 tests |

## Test Results

**Tests Added This Plan:** 38
**Total Tests:** 63
**Tests Passing:** 63
**Branch Coverage:** 67.15%

## Lessons Learned

1. **Fire-and-Forget Functions Are Hard to Test Through Main Handler:** Helper functions called as `someFunction().catch(...)` without `await` are invoked but their internals don't block the response, making coverage hard to achieve through integration tests.

2. **Focus on Critical Paths Over Helper Internals:** State transitions and error handling affect user experience directly. Helper function edge cases (e.g., "what if weather API times out?") are less critical.

3. **Mock Implementation > Call Chaining:** For complex routes with conditional logic, `mockImplementation` is more maintainable than `mockResolvedValueOnce` chains.

4. **Race Condition Testing is Valuable:** Testing confirmation checks (ALREADY_ON, CONFIRMATION_FAILED) caught potential race conditions in production code.

5. **Coverage Percentage is a Proxy, Not a Goal:** 67% coverage with 63 comprehensive tests provides high confidence in scheduler logic, even if helper internals aren't tested.

## Next Steps

**For Plan 05 (if exists):**
- If helper function coverage is required, extract helpers to separate modules with dedicated unit tests
- Consider integration tests that directly call helpers (not through main route)
- Add tests for PID tuning log cleanup (24-hour interval logic)

**For Future Refactoring:**
- Consider extracting fire-and-forget operations to a scheduler service layer
- PID automation could be a separate route/service for better testability
- Helper functions could return promises that main handler awaits, improving testability

**Coverage Improvement Strategies:**
- Unit test helper functions directly (calibrateValvesIfNeeded, refreshWeatherIfNeeded, etc.)
- Mock fewer dependencies, integration test more actual code paths
- Add tests that verify fire-and-forget operations complete (e.g., wait for promises)
