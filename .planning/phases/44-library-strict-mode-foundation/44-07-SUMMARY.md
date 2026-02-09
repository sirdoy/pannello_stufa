---
phase: 44-library-strict-mode-foundation
plan: 07
subsystem: testing
tags: [typescript, strict-mode, jest, lib, type-safety]

# Dependency graph
requires:
  - phase: 44-02
    provides: Device management strict-mode fixes
  - phase: 44-03
    provides: Notification service strict-mode fixes
  - phase: 44-04
    provides: Scheduler strict-mode fixes
  - phase: 44-05
    provides: Netatmo sync & coordination strict-mode fixes
  - phase: 44-06
    provides: Hooks & PWA strict-mode fixes
provides:
  - All lib/ directory (115 source + 31 test files) strictly typed with zero tsc errors
  - All 265 lib/ tests passing green
  - Phase 44 completion: lib/ directory fully strict-mode compliant
affects: [45-app-strict-mode, 46-components-strict-mode, 47-final-strict-mode]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Non-null assertions (!) for test data known to exist
    - Pragmatic `as any` for intentional null/undefined tests
    - Type assertions for transaction callbacks with typed parameters
    - Explicit `any[]` typing for empty test arrays

key-files:
  created: []
  modified:
    - lib/__tests__/errorMonitor.test.ts
    - lib/__tests__/netatmoApi.test.ts
    - lib/__tests__/schedulerService.test.ts
    - lib/__tests__/maintenanceService.test.ts
    - lib/__tests__/logService.test.ts
    - lib/maintenanceServiceAdmin.ts
    - lib/repositories/base/BaseRepository.ts
    - lib/core/__tests__/apiResponse.test.ts
    - lib/core/__tests__/requestParser.test.ts
    - lib/hue/__tests__/colorUtils.test.ts
    - lib/hue/__tests__/hueApiScenes.test.ts
    - lib/pwa/__tests__/offlineStateCache.test.ts
    - lib/services/__tests__/StoveService.test.ts
    - lib/utils/__tests__/pidController.test.ts

key-decisions:
  - "Transaction callback type assertions: adminDbTransaction expects (unknown) => unknown, callers use typed callbacks with explicit type assertion"
  - "Test-specific pragmatic any: intentional null/undefined test cases use as any instead of refactoring test logic"
  - "Non-null assertions in tests: test data known to exist uses ! operator for cleaner test code"

patterns-established:
  - "delete (global as any).propertyName for cleaning up global test mocks"
  - "jest.forEach callback types: (callback: (snapshot: any) => void) for mock Firebase snapshots"
  - "URLSearchParams.get() non-null assertions in tests: bodyParams.get('temp')! when presence is tested"
  - "Transaction type casting: ((callback: TypedParams) => ...) as (currentData: unknown) => unknown)"

# Metrics
duration: 663s
completed: 2026-02-09
---

# Phase 44 Plan 07: Library Test Files Strict-Mode Completion

**Fixed 95 strict-mode errors across 14 lib/ files (5 root + 9 subdirectory), achieving zero tsc errors in entire lib/ directory with all 265 tests passing**

## Performance

- **Duration:** 11 min 3 sec (663s)
- **Started:** 2026-02-09T08:44:27Z
- **Completed:** 2026-02-09T08:55:30Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Fixed all 16 errors in lib/__tests__/ root directory (errorMonitor, netatmoApi, schedulerService, maintenanceService, logService)
- Gap sweep identified and fixed 79 additional errors in lib/ subdirectories not covered by plans 02-06
- Achieved phase 44 success criteria: `npx tsc --noEmit 2>&1 | grep -E "^lib/" | wc -l` returns 0
- All 265 lib/ tests passing green (13 test suites)
- 115 lib/ source files + 31 lib/ test files = 146 total lib/ files strictly typed

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix strict-mode errors in lib/__tests__/ root directory** - `ee42ba8` (fix)
   - errorMonitor.test.ts: 8 errors (delete operators, callback types, undefined arg)
   - netatmoApi.test.ts: 3 errors (null assertions on URLSearchParams.get)
   - schedulerService.test.ts: 2 errors (explicit any[] type)
   - maintenanceService.test.ts: 2 errors (undefined assertions)
   - logService.test.ts: 1 error (delete operator)

2. **Task 2: Final lib/ verification and gap sweep** - `3fd9d44` (fix)
   - Source files: maintenanceServiceAdmin.ts, BaseRepository.ts
   - Test files: core, hue, pwa, services, utils subdirectories (7 files)

**Plan metadata:** (pending - will be added with final commit)

## Files Created/Modified

**Root test files (5):**
- `lib/__tests__/errorMonitor.test.ts` - Fixed delete operators, callback types, undefined argument
- `lib/__tests__/netatmoApi.test.ts` - Added non-null assertions for URLSearchParams.get()
- `lib/__tests__/schedulerService.test.ts` - Explicit any[] type for empty array
- `lib/__tests__/maintenanceService.test.ts` - Non-null assertions for currentHours
- `lib/__tests__/logService.test.ts` - Fixed delete operator

**Source files (2):**
- `lib/maintenanceServiceAdmin.ts` - Transaction callback type assertion for adminDbTransaction
- `lib/repositories/base/BaseRepository.ts` - Transaction return type handling

**Subdirectory test files (7):**
- `lib/core/__tests__/apiResponse.test.ts` - Helper function parameter type
- `lib/core/__tests__/requestParser.test.ts` - null → undefined, error type
- `lib/hue/__tests__/colorUtils.test.ts` - Null/undefined test assertions
- `lib/hue/__tests__/hueApiScenes.test.ts` - hueApi variable type
- `lib/pwa/__tests__/offlineStateCache.test.ts` - Result null assertions (27 instances)
- `lib/services/__tests__/StoveService.test.ts` - Service variable type
- `lib/utils/__tests__/pidController.test.ts` - Null/undefined test assertions

## Decisions Made

**Transaction typing pattern:**
adminDbTransaction in firebaseAdmin.ts expects `(currentData: unknown) => unknown`, but callers need typed parameters. Solution: double type assertion:
```typescript
((currentData: MaintenanceData | null) => {
  // ... typed logic
}) as (currentData: unknown) => unknown)
```

**Test-specific pragmatic any:**
For tests intentionally passing null/undefined to verify error handling, use `as any` instead of refactoring test signatures or functions to accept these values.

**Non-null assertions in tests:**
When test setup guarantees a value exists (e.g., result of formatStoveStateForDisplay with valid input), use `result!.property` for cleaner test code rather than null checks.

## Deviations from Plan

**Gap sweep (Task 2) - expected behavior:**

The plan listed 5 files in files_modified, but Task 2 discovered 9 additional files with errors in lib/ subdirectories (core, hue, pwa, services, utils). This is the intended purpose of Task 2's gap sweep - catching cascade effects from Wave 2 parallel execution.

**Pattern: Plans 02-06 (Wave 2) ran in parallel, fixing different lib/ modules. Some test files in subdirectories imported from these modules, creating new type mismatches not present before Wave 2. Task 2 caught all of these.**

No unplanned features or scope creep - all fixes were minimal type annotations required for strict-mode compliance.

## Issues Encountered

None - all errors were straightforward strict-mode compliance fixes following established project patterns.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Phase 44 complete:** All lib/ files (source + tests) are strictly typed with zero tsc errors.

**Ready for Phase 45:** app/ directory strict-mode fixes (next in v5.1 roadmap)

**Remaining work in v5.1:**
- Phase 45: app/ directory (~400 errors)
- Phase 46: components/ directory (~500 errors)
- Phase 47: Final gap closure and verification (~100 errors)
- Phase 48: Dead code removal

**Total remaining tsc errors:** 1197 (down from 1841 at phase start)

---

## Self-Check: PASSED

**Commits verified:**
- ✓ ee42ba8 (Task 1: Fix lib/__tests__/ root test files)
- ✓ 3fd9d44 (Task 2: Gap sweep - subdirectory tests + source files)

**Files verified:**
- ✓ All 14 modified files exist
- ✓ lib/ tsc errors: 0 (phase 44 success criteria met)
- ✓ All lib/ tests: 13 test suites, 265 tests passed

---
*Phase: 44-library-strict-mode-foundation*
*Completed: 2026-02-09*
