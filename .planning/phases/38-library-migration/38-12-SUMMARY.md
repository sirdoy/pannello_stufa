---
phase: 38-library-migration
plan: 12
subsystem: database
tags: [typescript, firebase, type-assertions, type-guards, rtdb]

# Dependency graph
requires:
  - phase: 37-typescript-foundation
    provides: TypeScript configuration and base types
provides:
  - Typed Firebase RTDB access patterns for all library files
  - Type interfaces for Firebase data shapes (tokens, configs, schedules)
  - Proper type guards for unknown data from Firebase
affects: [39-ui-components-migration, 40-api-routes-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Firebase get().val() and adminDbGet() always cast to typed interface"
    - "Firebase messaging priority uses literal types 'high' | 'normal'"
    - "TokenRecord interface for FCM token data with index signature"

key-files:
  created: []
  modified:
    - lib/netatmoStoveSync.ts
    - lib/schedulesService.ts
    - lib/migrateSchedules.ts
    - lib/netatmoService.ts
    - lib/services/unifiedDeviceConfigService.ts
    - lib/firebaseAdmin.ts
    - lib/healthDeadManSwitch.ts
    - lib/healthMonitoring.ts
    - lib/notificationService.ts
    - lib/tokenRefresh.ts
    - lib/tokenStorage.ts
    - lib/schedulerStats.ts
    - lib/deviceFingerprint.ts

key-decisions:
  - "Use type assertions (as Type) for all Firebase unknown returns"
  - "Add index signatures to interfaces where Record<string, unknown> needed"
  - "Firebase messaging priority requires literal types not string"

patterns-established:
  - "Pattern 1: Define interface for Firebase data shape before casting"
  - "Pattern 2: Use type guards for discriminated unions (PromiseSettledResult)"
  - "Pattern 3: Add index signature [key: string]: unknown for flexible data"

# Metrics
duration: 9min
completed: 2026-02-06
---

# Phase 38 Plan 12: Firebase Unknown Type Access Summary

**Fixed 62 TypeScript errors by adding type assertions and interfaces for all Firebase RTDB data access across 12 library files**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-06T10:31:50Z
- **Completed:** 2026-02-06T10:41:10Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Defined 7 new interfaces for Firebase data shapes (SyncConfigData, ScheduleRawData, SchedulerModeData, NetatmoHomeData, TokenRecord, etc.)
- Fixed all Firebase `get().val()` and `adminDbGet()` calls with proper type assertions
- Fixed Firebase messaging priority to use literal types instead of string
- Added platform and isPWA properties to TokenStorageRecord
- Fixed iOS PWA detection with Navigator.standalone type assertion

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix unknown type access in Netatmo, schedules, and migration files** - `13571bf` (fix)
   - Files: lib/netatmoStoveSync.ts, lib/schedulesService.ts, lib/migrateSchedules.ts, lib/netatmoService.ts, lib/services/unifiedDeviceConfigService.ts

2. **Task 2: Fix unknown type access in Firebase admin, health, notification, and token files** - `a96e460` (fix)
   - Files: lib/firebaseAdmin.ts, lib/healthDeadManSwitch.ts, lib/healthMonitoring.ts, lib/notificationService.ts, lib/tokenRefresh.ts, lib/tokenStorage.ts, lib/schedulerStats.ts, lib/deviceFingerprint.ts

## Files Created/Modified
- `lib/netatmoStoveSync.ts` - Added SyncConfigData interface, typed Firebase sync config reads
- `lib/schedulesService.ts` - Added ScheduleRawData interface, fixed Date arithmetic
- `lib/migrateSchedules.ts` - Added SchedulerModeData and ScheduleData interfaces
- `lib/netatmoService.ts` - Added NetatmoHomeData interface, typed topology/status access
- `lib/services/unifiedDeviceConfigService.ts` - Fixed cardOrder type from string[] to object array
- `lib/firebaseAdmin.ts` - Added TokenRecord interface, fixed messaging priority literals
- `lib/healthDeadManSwitch.ts` - Cast lastCheck to string
- `lib/healthMonitoring.ts` - Fixed PromiseSettledResult access, cast token data
- `lib/notificationService.ts` - Fixed Navigator.standalone, ServiceWorker types, Promise<void>
- `lib/tokenRefresh.ts` - Fixed getToken options type, simplified saveToken call
- `lib/tokenStorage.ts` - Added platform and isPWA properties to TokenStorageRecord
- `lib/schedulerStats.ts` - Added type guards for dailyHours calculations
- `lib/deviceFingerprint.ts` - Added index signature to DeviceInfo interface

## Decisions Made

1. **Type assertion pattern for Firebase data**: Cast all Firebase reads to specific interfaces rather than using any. Provides type safety while acknowledging Firebase returns unknown.

2. **Literal types for Firebase messaging**: Android/APNS priority must use literal types ('high' | 'normal') not string. Ensures compile-time safety for FCM API.

3. **Index signatures for flexible data**: Added [key: string]: unknown to interfaces that need Record<string, unknown> compatibility (DeviceInfo, TokenRecord, SyncConfigData).

4. **ServiceWorker type handling**: Cast unknown ServiceWorker types explicitly rather than using any for better type safety.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all errors followed the same pattern (Firebase returns unknown, needs casting).

## Next Phase Readiness

- All 12 library files now have proper TypeScript types for Firebase data access
- Zero tsc errors for files in this plan
- Patterns established for remaining Firebase access in UI components and API routes
- Ready for UI components migration (phase 39)

## Self-Check: PASSED

All 13 modified files verified to exist.
All 2 commits verified to exist in git history.

---
*Phase: 38-library-migration*
*Completed: 2026-02-06*
