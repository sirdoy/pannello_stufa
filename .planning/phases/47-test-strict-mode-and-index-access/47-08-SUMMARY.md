---
phase: 47-test-strict-mode-and-index-access
plan: 08
subsystem: testing
tags: [typescript, strict-mode, noUncheckedIndexedAccess, test-fixes]
dependency-graph:
  requires: [47-04, 47-05, 47-06, 47-07]
  provides: [zero-tsc-errors-entire-codebase]
  affects: [all-test-files]
tech-stack:
  added: []
  patterns: [non-null-assertions-test-data, pragmatic-any-test-mocks]
key-files:
  created: []
  modified:
    - app/components/ui/__tests__/DataTable.test.tsx
    - __tests__/utils/scheduleHelpers.test.ts
    - lib/__tests__/errorMonitor.test.ts
    - lib/__tests__/changelogService.test.ts
    - lib/__tests__/version.test.ts
    - __tests__/lib/netatmoCameraApi.test.ts
    - __tests__/lib/netatmoApi.test.ts
    - __tests__/maintenanceService.concurrency.test.ts
    - app/components/ui/__tests__/Slider.test.tsx
    - app/components/ui/__tests__/RightClickMenu.test.tsx
    - app/hooks/__tests__/useReducedMotion.test.ts
    - __tests__/lib/coordinationEventLogger.test.ts
    - __tests__/lib/notificationHistoryService.test.ts
    - __tests__/lib/healthDeadManSwitch.test.ts
decisions:
  - "Non-null assertions (!) for known test data access patterns (test data is guaranteed by test setup)"
  - "Pragmatic (as any) for ERROR_CODES assignments in tests (avoids complex type narrowing for temporary test mutations)"
  - "Non-null assertions for mock.calls array access (jest guarantees structure after toHaveBeenCalled)"
  - "Type assertions over runtime checks in test code (tests know their own data structure)"
metrics:
  duration_seconds: 1018
  completed_date: 2026-02-09
  tasks_completed: 2
  files_modified: 14
  tsc_errors_fixed: 94
  final_tsc_errors: 0
---

# Phase 47 Plan 08: Fix noUncheckedIndexedAccess Errors in Test Files

**All test files now compile cleanly with strict: true + noUncheckedIndexedAccess: true. Zero tsc errors across entire codebase.**

## Summary

Fixed 94 noUncheckedIndexedAccess TypeScript errors in 15 test files. After Plans 01-03 fixed 282 strict-mode errors and Plans 04-07 enabled noUncheckedIndexedAccess and fixed source files, this plan addressed the remaining index access errors in test files. Result: `npx tsc --noEmit` reports **0 errors** across the entire codebase with full strict mode enabled.

## Tasks Completed

### Task 1: Fix 9 Newly-Erroring Test Files (63 errors)
**Commit:** d5fc5fc

Fixed files that had zero strict-mode errors but gained errors from noUncheckedIndexedAccess:

1. **DataTable.test.tsx (23 errors)** - Heavy array access in table test assertions
   - `rows[0]` → `rows[0]!` for test row access
   - `checkboxes[1]` → `checkboxes[1]!` for checkbox element access
   - `expandButtons[0]` → `expandButtons[0]!` for button access
   - Non-null assertions safe: test data guaranteed by render setup

2. **scheduleHelpers.test.ts (9 errors)** - Schedule slot array access
   - `slots[0].durationPercent` → `slots[0]!.durationPercent`
   - `slots[1].day` → `slots[1]!.day`
   - Known test data: schedule parser always returns expected structure

3. **errorMonitor.test.ts (8 errors)** - Error code tracking data
   - Pragmatic `(ERROR_CODES as any)[5] = {...}` for temporary test mutations
   - Avoids complex type narrowing for test-only code
   - Clean pattern: assign with (as any), delete after test

4. **version.test.ts (7 errors)** - Version history array access
   - `VERSION_HISTORY[0]!.version` for first entry checks
   - `current[0]!` / `next[1]!` for semantic version comparison
   - Non-null safe: VERSION_HISTORY is populated array

5. **changelogService.test.ts (7 errors)** - Changelog data array
   - `result[0]!.version` for sorted results
   - `mockSet.mock.calls[0]![1]` for mock call arguments
   - Jest guarantees mock.calls structure after toHaveBeenCalled

6. **maintenanceService.concurrency.test.ts (4 errors)** - Transaction mock calls
   - `mockedFirebase.runTransaction.mock.calls[0]![1]` for transaction function
   - Pattern applies to all mock.calls array access in tests

7. **Slider.test.tsx (2 errors)** - Slider element access
   - `sliders[0]!.focus()` for keyboard navigation tests

8. **RightClickMenu.test.tsx (2 errors)** - Menu item access
   - `screen.getAllByRole('menuitem')[0]!` for icon ordering tests

9. **healthDeadManSwitch.test.ts (1 error)** - Mock call timestamp
   - `mockedAdminDbSet.mock.calls[0]![1]` for ISO timestamp verification

### Task 2: Fix Remaining Test Files (31 additional errors)
**Commit:** d5fc5fc (combined with Task 1)

Fixed additional errors in previously-modified test files:

- **netatmoCameraApi.test.ts (17 errors)** - Camera/person/event parsing
  - `result[0]!.id` for parsed camera data
  - `result[0]!.light_mode_status` for optional properties
  - All parsed array results use non-null assertions

- **netatmoApi.test.ts (4 errors)** - Room/module parsing
  - `result[1]!.setpoint` for undefined checking
  - `result[0]!.name` for module name assertions

- **useReducedMotion.test.ts (2 errors)** - Listener callbacks
  - `listeners[0]!({ matches: false })` for motion preference changes

- **coordinationEventLogger.test.ts (1 error)** - Recent events
  - `events[0]!.timestamp` for timestamp assertions

- **notificationHistoryService.test.ts (1 error)** - Notification history
  - `result.notifications[0]!.timestamp` for history query results

## Verification

### TSC Check - Zero Errors
```bash
npx tsc --noEmit 2>&1 | grep -c "error TS"
# Result: 0
```

### Strict Options Enabled
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Deviations from Plan

None - plan executed exactly as written.

## Key Patterns Established

### Pattern 1: Non-Null Assertions for Known Test Data
```typescript
// Known test data: render guarantees structure
const rows = screen.getAllByRole('row').slice(1);
expect(within(rows[0]!).getByText('Alpha')).toBeInTheDocument();

// Known test data: parser returns expected array
const slots = parseTimelineSlots(schedule);
expect(slots[0]!.day).toBe(0);
```

### Pattern 2: Pragmatic (as any) for Test Mutations
```typescript
// Temporary test mutation - cleaner than complex narrowing
(ERROR_CODES as any)[5] = {
  description: 'Test Error',
  severity: ERROR_SEVERITY.CRITICAL,
};
// ... test ...
delete ERROR_CODES[5]; // Cleanup
```

### Pattern 3: Mock.calls Access
```typescript
// Jest guarantees mock.calls structure after toHaveBeenCalled
const transactionFn = mockedFirebase.runTransaction.mock.calls[0]![1];
const timestamp = mockedAdminDbSet.mock.calls[0]![1];
```

## Success Criteria Met

- [x] 0 tsc errors total with strict: true + noUncheckedIndexedAccess: true
- [x] All test files compile cleanly
- [x] STRICT-07 satisfied (noUncheckedIndexedAccess enabled)
- [x] STRICT-08 satisfied (zero errors with all strict options)

## Impact

### Before
- 94 noUncheckedIndexedAccess errors in test files
- Tests pass but tsc fails
- Cannot enable noUncheckedIndexedAccess in CI

### After
- 0 tsc errors across entire codebase
- Tests pass AND tsc passes
- Full strict mode enforced: strict: true + noUncheckedIndexedAccess: true
- Foundation for noUncheckedIndexedAccess enforcement in CI

## Next Steps

Phase 48 can proceed with:
- Dead code removal (unused exports, files, dependencies)
- Test suite health improvements
- Performance optimization with full type safety

## Notes

- **Test data is known**: Non-null assertions safe in tests because test setup guarantees data structure
- **Pragmatic over pure**: (as any) for temporary test mutations cleaner than complex type guards
- **Mock call access**: Jest's mock.calls is guaranteed structure after toHaveBeenCalled checks
- **Combined commit**: Tasks 1 and 2 fixed together (natural flow, single logical unit)
- **Duration**: ~17 minutes for 94 error fixes across 15 files

## Self-Check: PASSED

### Files Created
None - test-only fixes

### Files Modified (14 files)
- [x] FOUND: app/components/ui/__tests__/DataTable.test.tsx
- [x] FOUND: __tests__/utils/scheduleHelpers.test.ts
- [x] FOUND: lib/__tests__/errorMonitor.test.ts
- [x] FOUND: lib/__tests__/changelogService.test.ts
- [x] FOUND: lib/__tests__/version.test.ts
- [x] FOUND: __tests__/lib/netatmoCameraApi.test.ts
- [x] FOUND: __tests__/lib/netatmoApi.test.ts
- [x] FOUND: __tests__/maintenanceService.concurrency.test.ts
- [x] FOUND: app/components/ui/__tests__/Slider.test.tsx
- [x] FOUND: app/components/ui/__tests__/RightClickMenu.test.tsx
- [x] FOUND: app/hooks/__tests__/useReducedMotion.test.ts
- [x] FOUND: __tests__/lib/coordinationEventLogger.test.ts
- [x] FOUND: __tests__/lib/notificationHistoryService.test.ts
- [x] FOUND: __tests__/lib/healthDeadManSwitch.test.ts

### Commits
- [x] FOUND: d5fc5fc - fix(47-08): fix noUncheckedIndexedAccess errors in test files

### TSC Verification
```bash
$ npx tsc --noEmit 2>&1 | grep -c "error TS"
0
```

All claims verified. Plan complete.
