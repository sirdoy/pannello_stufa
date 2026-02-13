---
phase: 60-critical-path-testing-token-cleanup
plan: 02
subsystem: testing
tags: [test, scheduler, unit-test, critical-path]

dependency_graph:
  requires:
    - app/api/scheduler/check/route.ts (existing route to test)
  provides:
    - app/api/scheduler/check/__tests__/route.test.ts (comprehensive unit tests)
  affects:
    - future: test coverage metrics
    - future: regression detection

tech_stack:
  added: []
  patterns:
    - Jest mock implementation for complex dependency chains
    - Fire-and-forget operation verification
    - Time-based test scenarios with jest.useFakeTimers()

key_files:
  created:
    - app/api/scheduler/check/__tests__/route.test.ts (721 lines, 25 tests)
  modified: []

decisions:
  - title: Mock implementation over call chaining
    choice: Used mockImplementation for adminDbGet instead of mockResolvedValueOnce chains
    reason: More reliable for complex routes with conditional paths and multiple Firebase reads
    alternatives: [mockResolvedValueOnce chain, manual reset between tests]
    impact: Tests are more maintainable and less brittle to route refactoring

  - title: Empty array vs null for intervals
    choice: Use empty array `[]` for intervals to test fire-and-forget operations
    reason: Route returns early with `null` intervals before reaching side effects
    alternatives: [null with separate test paths, mock route internals]
    impact: Tests accurately reflect production code paths

  - title: NextResponse.json in core mock
    choice: Mock @/lib/core module with NextResponse.json instead of global Response
    reason: Jest environment doesn't have global Response, Next.js provides NextResponse
    alternatives: [Polyfill Response, use plain objects]
    impact: Tests run in standard Jest environment without additional setup

metrics:
  duration_minutes: 8
  tests_added: 25
  files_created: 1
  dependencies_mocked: 15
  completed_at: "2026-02-13T10:25:00Z"
---

# Phase 60 Plan 02: Scheduler Check Route Unit Tests

**One-liner:** Comprehensive unit tests for /api/scheduler/check covering all scheduler modes, early returns, and fire-and-forget side effects with 15+ mocked dependencies.

## What Was Built

Created `app/api/scheduler/check/__tests__/route.test.ts` with 25 test cases providing comprehensive coverage of the scheduler check route's execution paths.

### Test Coverage

**Scheduler Modes (5 tests):**
- Manual mode (scheduler disabled) returns early
- Semi-manual mode with future returnToAutoAt stays in semi-manual
- Semi-manual mode with past returnToAutoAt proceeds to automatic
- Semi-manual mode with null returnToAutoAt edge case
- Automatic mode proceeds normally

**Schedule Lookup (3 tests):**
- No schedule found returns NO_SCHEDULE
- Active schedule detected when current time within interval
- No active schedule when current time outside all intervals

**Stove Data Fetching (6 tests):**
- Parallel fetching of status, fan, and power
- Status fetch failure returns STATUS_UNAVAILABLE (safety)
- Null fan level uses default (3)
- Null power level uses default (2)
- Stove detected as ON with WORK status
- Stove detected as ON with START status

**Cron Health Tracking (1 test):**
- cronHealth/lastCall timestamp saved on every invocation

**Fire-and-Forget Side Effects (6 tests):**
- stove_status_work notification triggered when status is WORK
- calibrateValvesServer called as fire-and-forget
- proactiveTokenRefresh called as fire-and-forget
- trackUsageHours called with current status
- Maintenance notification sent when notificationData present
- enforceStoveSyncSetpoints called with stove on/off state

**Maintenance Blocks Ignition (2 tests):**
- Returns MANUTENZIONE_RICHIESTA when canIgnite returns false
- Proceeds to ignition when canIgnite returns true

**Unexpected Off Detection (2 tests):**
- No notification when stove is on during active schedule
- No notification when no active schedule

### Mock Setup

Mocked 15+ external dependencies:
- Firebase Admin (adminDbGet, adminDbSet, adminDbUpdate, getAdminDatabase)
- Stove API (getStoveStatus, getFanLevel, getPowerLevel, igniteStove, shutdownStove, setPowerLevel, setFanLevel)
- Maintenance Service (canIgnite, trackUsageHours)
- Notification Triggers (4 server functions)
- Netatmo Sync (2 functions)
- Side Effects (calibration, weather, token cleanup, Hue refresh, PID)
- Logging (cron execution, analytics events)
- Core middleware (withCronSecret, success, error)

## Technical Implementation

**Mock Strategy:**
- Used `jest.mock()` at file top for all dependencies (before imports)
- Implemented custom `mockImplementation` for `adminDbGet` to handle conditional paths
- Used `jest.mocked()` for type-safe mock references
- Mocked @/lib/core with NextResponse.json to avoid global Response issues

**Test Patterns:**
- `setupSchedulerMocks()` helper for common mock scenarios
- `jest.useFakeTimers()` for time-based schedule tests
- Empty `intervals: []` to test fire-and-forget operations (vs `null` which returns early)
- Console spy mocks to keep test output clean

**Key Decisions:**
1. Mock implementation over call chaining for reliability
2. Empty array for intervals to reach side-effect code paths
3. NextResponse.json in core mock for Jest compatibility

## Deviations from Plan

**None** - Plan executed exactly as written.

The plan's Task 1 and Task 2 had overlapping requirements. All tests from both tasks were implemented in a single comprehensive test file:
- Task 1: Mock setup + scheduler modes + early returns + stove data (✓)
- Task 2: Cron health + fire-and-forget + maintenance + unexpected off (✓)

## Self-Check: PASSED

**Created files:**
```
✓ FOUND: app/api/scheduler/check/__tests__/route.test.ts (721 lines)
```

**Commits:**
```
✓ FOUND: e4d8fc4 (test(60-02): add comprehensive scheduler check route tests)
```

**Test execution:**
```bash
$ npx jest app/api/scheduler/check/__tests__/route.test.ts --no-coverage

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Time:        1.854 s
```

## Files Created/Modified

| File | Lines | Type | Description |
|------|-------|------|-------------|
| app/api/scheduler/check/__tests__/route.test.ts | 721 | created | Comprehensive unit tests for scheduler check route |

## Test Results

**Tests Added:** 25
**Tests Passing:** 25
**Coverage:** All scheduler modes, early returns, stove data fetching, fire-and-forget operations

## Lessons Learned

1. **Mock implementation > call chaining:** For routes with complex conditional logic and multiple Firebase reads, `mockImplementation` provides more reliable and maintainable mocks than `mockResolvedValueOnce` chains.

2. **Empty array vs null matters:** The route returns early when `intervals` is `null`, skipping fire-and-forget operations. Using `intervals: []` (empty array) allows testing those code paths without artificial mocking.

3. **NextResponse in Jest:** Jest environment doesn't have global `Response`. Mocking @/lib/core with `NextResponse.json` avoids polyfill complexity.

4. **Fire-and-forget testing:** Fire-and-forget operations (weather refresh, calibration, etc.) are invoked synchronously even if their promises aren't awaited, making them testable with standard Jest assertions.

## Next Steps

**For Plan 03 (PID Route Tests):**
- Follow similar mock implementation pattern for adminDbGet
- Test PID state management (integral, prevError, lastRun)
- Verify tuning log cleanup (24-hour interval)

**For Plan 04 (Ignite/Shutdown Route Tests):**
- Test state transition logic
- Test error scenarios
- Verify Auth0 session injection
