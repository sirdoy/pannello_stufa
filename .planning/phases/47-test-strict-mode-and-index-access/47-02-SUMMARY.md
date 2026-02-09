---
phase: 47-test-strict-mode-and-index-access
plan: 02
subsystem: test-infrastructure
tags: [strict-mode, typescript, test-fixes, type-safety]
completed: 2026-02-09
duration: 313s
tasks_completed: 2
files_modified: 3

dependencies:
  requires:
    - "47-01: High-error test files fixed (59 errors)"
  provides:
    - "Mid-error test files: netatmoStoveSync.test.ts strict-mode compliant"
    - "Mid-error test files: coordinationPauseCalculator.test.ts strict-mode compliant"
    - "Mid-error test files: app/thermostat/page.test.tsx strict-mode compliant"
  affects:
    - "Phase 47 completion: 133/285 test errors resolved (47%)"

tech_stack:
  patterns:
    - "Record<string, any> for dynamic test object access"
    - "Non-null assertions (!) for test data known to exist"
    - "Explicit React.ReactNode types for mock components"
    - "jest.Mock type annotations for test fixtures"

key_files:
  created: []
  modified:
    - "__tests__/lib/netatmoStoveSync.test.ts"
    - "__tests__/lib/coordinationPauseCalculator.test.ts"
    - "app/thermostat/page.test.tsx"

decisions:
  - "Use Record<string, any> type assertions for dynamic appliedSetpoints/previousSetpoints access (test-specific pragmatism)"
  - "Non-null assertions safe for nextSlot in tests where test data guarantees presence"
  - "Explicit React.ReactNode typing for all mock component props (strict-mode requirement)"
  - "'as any' acceptable for intentional null parameter tests (testing error handling)"

metrics:
  errors_fixed: 74
  tests_passing: 66
  commits: 2
---

# Phase 47 Plan 02: Mid-Error Test Files Summary

**One-liner:** Fixed 74 strict-mode tsc errors across 3 mid-error test files (netatmoStoveSync, coordinationPauseCalculator, thermostat page) using Record type assertions, non-null guards, and explicit React types.

## Objective

Fix 74 strict-mode tsc errors across 3 mid-error test files that account for ~26% of remaining test file errors. Combined with Plan 01, this addresses ~64% of all test file errors in Phase 47.

## Tasks Completed

### Task 1: Fix netatmoStoveSync.test.ts (25 errors) and coordinationPauseCalculator.test.ts (22 errors)

**Commit:** `217eb67`

**Changes:**
- netatmoStoveSync.test.ts (25 errors → 0):
  - Added `Record<string, any>` type assertions for dynamic `appliedSetpoints` access (TS7053)
  - Pattern: `(result.appliedSetpoints as Record<string, any>)['room-123']`
  - Applied to 25 instances across boost and restore test cases

- coordinationPauseCalculator.test.ts (22 errors → 0):
  - Added non-null assertions (`!`) for `nextSlot` access (TS18047)
  - Pattern: `result.nextSlot!.offset` where test data guarantees presence
  - Used `as any` for intentional null parameter test (TS2345)

**Verification:**
- All 62 tests pass (netatmoStoveSync + coordinationPauseCalculator)
- 0 tsc errors in both files

### Task 2: Fix app/thermostat/page.test.tsx (27 errors)

**Commit:** `8743477`

**Changes:**
- Fixed 27 TS7031/TS7005/TS7034 errors:
  - Added explicit `React.ReactNode` types to all mock component props (18 instances)
  - Added explicit `jest.Mock` types to `mockRouter` and `mockSearchParams` fixtures
  - Pattern: `{ children: React.ReactNode; header: React.ReactNode }` for mock components

**Verification:**
- All 4 thermostat page tests pass
- 0 tsc errors in file

## Deviations from Plan

None - plan executed exactly as written.

## Technical Decisions

1. **Record<string, any> for test assertions**: Pragmatic choice for dynamic room ID access in test result objects. Alternative of creating explicit interfaces would be overkill for test code.

2. **Non-null assertions in tests**: Safe pattern when test setup guarantees data presence. Used extensively in coordinationPauseCalculator where sample schedules always return valid slots.

3. **React.ReactNode for all mock props**: Strict requirement for mock components. Ensures type safety even in test mocks.

## Impact

**Before:** 74 tsc errors across 3 files
**After:** 0 tsc errors, all 66 tests passing

**Phase Progress:**
- Plan 01: 59 errors fixed (high-error files)
- Plan 02: 74 errors fixed (mid-error files)
- **Total: 133/285 errors fixed (47%)**

## Verification

```bash
# Zero errors in target files
npx tsc --noEmit 2>&1 | grep "netatmoStoveSync\.test\|coordinationPauseCalculator\.test\|thermostat/page\.test" | wc -l
# Output: 0

# All tests passing
npx jest netatmoStoveSync coordinationPauseCalculator thermostat/page
# Test Suites: 3 passed, 3 total
# Tests:       66 passed, 66 total
```

## Self-Check

**Status: PASSED**

### Files Created
None (modification-only plan)

### Files Modified
✅ __tests__/lib/netatmoStoveSync.test.ts exists and modified
✅ __tests__/lib/coordinationPauseCalculator.test.ts exists and modified
✅ app/thermostat/page.test.tsx exists and modified

### Commits
✅ 217eb67 exists (Task 1: netatmoStoveSync + coordinationPauseCalculator)
✅ 8743477 exists (Task 2: thermostat page test)

### Test Verification
✅ All 66 tests pass in modified files
✅ 0 tsc errors remain in target files

## Next Steps

Continue with Plan 03 to address remaining low-error test files, working toward 0 strict-mode errors in all test files.
