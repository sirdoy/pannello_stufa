---
phase: 114-type-safety-lib
plan: 01
subsystem: notifications
tags: [firebase, typescript, type-safety, generics, error-handling]

# Dependency graph
requires:
  - phase: 113-known-issues-fix
    provides: baseline with zero regressions before type safety work
provides:
  - adminDbGet<T = unknown>() generic with T | null return type
  - Error type guards (instanceof Error + 'code' in error pattern)
  - Explicit preferences mapping from Firebase shape to filter shape
  - Zero as any casts in firebaseAdmin.ts
affects: [114-type-safety-lib, downstream adminDbGet call sites]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Error type guard: error instanceof Error && 'code' in error ? (error as Error & { code: string }).code : undefined"
    - "Generic function with default type: adminDbGet<T = unknown>() returning T | null"
    - "Type alias import: import type { X as Y } to avoid name collision between different NotificationPreferences shapes"

key-files:
  created: []
  modified:
    - lib/firebaseAdmin.ts
    - lib/notifications/notificationFilter.ts

key-decisions:
  - "Use FirebaseStoredPreferences alias for types/firebase/notifications.ts to avoid collision with filter's NotificationPreferences"
  - "Guard INVALID_TOKEN_ERRORS.includes(errorCode) with errorCode truthy check since type guard returns undefined when no code property"
  - "Map Firebase dndEnabled + dndStart/End to filter's dndWindows array format explicitly"

patterns-established:
  - "Error type guard pattern: error instanceof Error && 'code' in error for typed error codes"
  - "Generic adminDbGet<T>() allows typed fetch without assertions at call sites"

requirements-completed: [TYPE-01, TYPE-06]

# Metrics
duration: 12min
completed: 2026-03-22
---

# Phase 114 Plan 01: firebaseAdmin.ts Type Safety Summary

**Generic adminDbGet<T = unknown>() with T | null return, error instanceof type guards, and explicit Firebase-to-filter preferences mapping — zero as any casts in firebaseAdmin.ts**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-22T15:25:00Z
- **Completed:** 2026-03-22T15:37:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `adminDbGet<T = unknown>(path: string): Promise<T | null>` generic signature with typed return
- Replaced both `(error as any).code` / `(error as any).message` casts with `instanceof Error && 'code' in error` type guards
- Replaced `preferences as any` with explicit mapping from Firebase `NotificationPreferences` (types.alert/system/etc) to filter's `FilterPreferences` (enabledTypes Record<string, boolean>)
- Exported `NotificationPreferences` from `notificationFilter.ts` to allow typed import

## Task Commits

Each task was committed atomically:

1. **Task 1: Add generic to adminDbGet and fix error type guards** - `ee80df2b` (feat)
2. **Task 2: Fix preferences type mismatch with explicit field mapping** - `526062ad` (feat)

## Files Created/Modified
- `lib/firebaseAdmin.ts` - Generic adminDbGet, error type guards, explicit filterPrefs mapping, FirebaseStoredPreferences import
- `lib/notifications/notificationFilter.ts` - Exported NotificationPreferences interface

## Decisions Made
- Used `FirebaseStoredPreferences` alias when importing from `types/firebase/notifications.ts` to avoid name collision with filter's own `NotificationPreferences`
- Added `errorCode && INVALID_TOKEN_ERRORS.includes(errorCode)` guard because narrowed `errorCode` is `string | undefined` — the `includes()` only accepts `string`
- Mapped `dndEnabled + dndStart + dndEnd` from old Firebase shape to a single DndWindow entry in the new filter shape

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added truthiness guard for errorCode before INVALID_TOKEN_ERRORS.includes()**
- **Found during:** Task 1 (fixing error type guards)
- **Issue:** After narrowing `errorCode` to `string | undefined`, `INVALID_TOKEN_ERRORS.includes(errorCode)` failed tsc: "Argument of type 'string | undefined' is not assignable to parameter of type 'string'"
- **Fix:** Added `errorCode &&` guard before the `includes()` call
- **Files modified:** lib/firebaseAdmin.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors in firebaseAdmin.ts
- **Committed in:** ee80df2b (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Necessary for correctness — type narrowing exposed the real type of errorCode. No scope creep.

## Issues Encountered
None beyond the auto-fixed type guard issue.

## Known Stubs
None — all data is wired.

## Next Phase Readiness
- firebaseAdmin.ts has zero as any casts (TYPE-01, TYPE-06 complete)
- Generic `adminDbGet<T>()` available for downstream call sites in plan 02
- Pattern established for error type guards and explicit shape mapping

## Self-Check: PASSED

All files exist, all commits present.

---
*Phase: 114-type-safety-lib*
*Completed: 2026-03-22*
