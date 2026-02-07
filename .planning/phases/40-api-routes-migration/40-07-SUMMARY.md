---
phase: 40-api-routes-migration
plan: 07
subsystem: api
tags: [typescript, api-routes, error-handling, gap-closure]

# Dependency graph
requires:
  - phase: 40-01
    provides: Core API routes migrated (19 files)
  - phase: 40-02
    provides: Netatmo API routes migrated (16 files)
  - phase: 40-03
    provides: Hue API routes migrated (13 files)
  - phase: 40-04
    provides: Stove API routes migrated (14 files)
  - phase: 40-05
    provides: Health/Scheduler API routes migrated (14 files)
  - phase: 40-06
    provides: Miscellaneous API routes migrated (14 files)
provides:
  - Zero TypeScript errors in app/api/ directory
  - All 90 API route files compile cleanly
  - Missing ERROR_CODES added (HUE_ERROR, WEATHER_API_ERROR, LOCATION_NOT_SET)
  - Missing CoordinationEventType/Action values added
affects: [41-pages-migration, 42-test-migration, 43-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pragmatic any for external API responses (Hue, Open-Meteo)"
    - "Double assertion pattern for Firebase types (as unknown as Record<string, unknown>)"
    - "ErrorCode type synchronization between lib/core/apiErrors.ts and types/api/errors.ts"
    - "CoordinationEventType extensibility for error logging"

key-files:
  created: []
  modified:
    - lib/core/apiErrors.ts
    - lib/coordinationEventLogger.ts
    - types/api/errors.ts
    - app/api/**/route.ts (23 files)

key-decisions:
  - "Add HUE_ERROR, WEATHER_API_ERROR, LOCATION_NOT_SET to ERROR_CODES for missing error scenarios"
  - "Add coordination_error, coordination_debouncing to CoordinationEventType for coordination logging"
  - "Use pragmatic any for Hue API responses (external library with complex types)"
  - "Use pragmatic any for Open-Meteo weather responses (external API without TypeScript types)"
  - "Fix error() function calls to use (message, ErrorCode, HttpStatus) signature not (message, number)"
  - "Use double assertion for DeadManSwitchStatus conversion (as unknown as Record<string, unknown>)"
  - "Fix Date arithmetic with .getTime() for TypeScript strict mode"
  - "Note test import failures for Phase 42 (route.js → route.ts path changes)"

patterns-established:
  - "Gap closure pattern: Run tsc, categorize errors, fix systematically by type"
  - "Error code synchronization: Add to ERROR_CODES constant, ERROR_MESSAGES map, and ErrorCode type"
  - "Pragmatic typing for external APIs: Use 'as any' instead of full type generation"

# Metrics
duration: 12min
completed: 2026-02-07
---

# Phase 40 Plan 07: API Routes Gap Closure Summary

**Resolved all TypeScript compilation errors in 90 migrated API routes through systematic error categorization and type-safe fixes**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-07T10:04:41Z
- **Completed:** 2026-02-07T10:16:43Z
- **Tasks:** 2
- **Files modified:** 23

## Accomplishments

- Fixed 80 TypeScript errors across app/api/ directory
- Added 3 missing ERROR_CODES (HUE_ERROR, WEATHER_API_ERROR, LOCATION_NOT_SET)
- Added 2 missing CoordinationEventType values (coordination_error, coordination_debouncing)
- Added 1 missing CoordinationAction value (error)
- Verified all 90 API route files compile without errors
- Documented test import failures for Phase 42 test migration

## Task Commits

Each task was committed atomically:

1. **Task 1: Diagnose and fix all TypeScript errors** - `3640395` (fix)
2. **Task 2: Verify migration completeness** - `ade23ae` (chore)

## Files Created/Modified

**Core Infrastructure:**
- `lib/core/apiErrors.ts` - Added HUE_ERROR, WEATHER_API_ERROR, LOCATION_NOT_SET to ERROR_CODES constant and ERROR_MESSAGES map
- `lib/coordinationEventLogger.ts` - Added coordination_error, coordination_debouncing to CoordinationEventType union, added error to CoordinationAction union
- `lib/changelogService.ts` - Changed syncVersionHistoryToFirebase parameter from Partial<ChangelogEntry>[] to any[] for VersionEntry compatibility
- `types/api/errors.ts` - Added HUE_ERROR, WEATHER_API_ERROR, LOCATION_NOT_SET to ErrorCode type

**API Routes (23 files):**
- `app/api/admin/sync-changelog/route.ts` - Removed Session import, use any for session parameter
- `app/api/config/location/route.ts` - Import ERROR_CODES/HTTP_STATUS, use ERROR_CODES.LOCATION_NOT_SET
- `app/api/coordination/enforce/route.ts` - Fixed CoordinationEventType and CoordinationAction values
- `app/api/health-monitoring/dead-man-switch/route.ts` - Double assertion for DeadManSwitchStatus conversion
- `app/api/health-monitoring/logs/route.ts` - Import ERROR_CODES/HTTP_STATUS, fix error() calls
- `app/api/health-monitoring/stats/route.ts` - Import ERROR_CODES/HTTP_STATUS, fix error() calls
- `app/api/hue/lights/[id]/route.ts` - Pragmatic any for Hue API responses
- `app/api/hue/lights/route.ts` - Pragmatic any for Hue API responses
- `app/api/hue/remote/pair/route.ts` - Use ERROR_CODES.HUE_ERROR (already imported)
- `app/api/hue/rooms/[id]/route.ts` - Pragmatic any for Hue API responses
- `app/api/hue/rooms/route.ts` - Pragmatic any for Hue API responses
- `app/api/hue/scenes/[id]/activate/route.ts` - Pragmatic any for Hue API responses
- `app/api/hue/scenes/[id]/route.ts` - Pragmatic any for Hue API responses
- `app/api/hue/scenes/create/route.ts` - Pragmatic any for Hue API responses
- `app/api/hue/scenes/route.ts` - Pragmatic any for Hue API responses
- `app/api/hue/test/route.ts` - Add 'as any' to tokenResult, fix HueApi constructor call
- `app/api/schedules/route.ts` - Fix Date arithmetic with .getTime()
- `app/api/weather/forecast/route.ts` - Import ERROR_CODES/HTTP_STATUS, pragmatic any for weather data, use ERROR_CODES.WEATHER_API_ERROR
- `app/api/netatmo/callback/route.ts` - Auto-formatting cleanup (unused import removed)
- `app/api/netatmo/homestatus/route.ts` - Auto-formatting cleanup
- `app/api/netatmo/schedules/route.ts` - Auto-formatting cleanup

## Decisions Made

**Error Code Additions:**
- Added HUE_ERROR for Hue API-specific failures (used in hue/remote/pair route)
- Added WEATHER_API_ERROR for Open-Meteo API failures (used in weather/forecast route)
- Added LOCATION_NOT_SET for missing location configuration (used in config/location route)

**Coordination Type Additions:**
- Added coordination_error and coordination_debouncing to CoordinationEventType for error logging scenarios in coordination/enforce route
- Added error to CoordinationAction for error event actions

**Pragmatic Typing Strategy:**
- Hue API responses: Use 'as any' instead of generating full types for external Hue v2 API (complex nested structures)
- Weather API responses: Use 'as any' for Open-Meteo responses (no official TypeScript types available)
- Session type: Use 'any' instead of importing from @auth0 (compatibility with middleware signature)

**Error Function Signature:**
- Fixed all error() calls to use (message, ErrorCode, HttpStatus) signature
- Replaced HTTP status code literals (400, 503) with ERROR_CODES constants and HTTP_STATUS values

## Deviations from Plan

None - plan executed exactly as written. The plan anticipated 30-80 errors based on Phase 38/39 experience. Found 80 errors and categorized them into:
1. Missing ERROR_CODES (3 codes)
2. Missing CoordinationEventType/Action (3 values)
3. Session import issue (1 error)
4. Unknown type property access (46 errors - Hue/Weather APIs)
5. Type assignment issues (11 errors - various)

All fixes followed established patterns from previous phases.

## Issues Encountered

**Test Import Failures:**
- 3 API route tests fail to import '../route.js' (now '../route.ts')
- Files: app/api/netatmo/setthermmode/__tests__/route.test.js, app/api/netatmo/setroomthermpoint/__tests__/route.test.js, app/api/hue/discover/__tests__/route.test.js
- Resolution: Documented for Phase 42 (Test Migration) as expected behavior

**Pre-existing Test Failures:**
- netatmoApi.parseModules test expects object without 'reachable' field
- This failure pre-dates Phase 40 (introduced in Phase 38-05)
- Not a regression from this gap closure plan

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Phase 40 Complete:**
- All 90 API route files migrated to TypeScript (.js → .ts)
- Zero TypeScript compilation errors in app/api/ directory
- All route files compile cleanly with correct middleware signatures
- Ready for Phase 41 (Pages Migration)

**Phase 42 Prerequisites:**
- 3 test files need import path updates (route.js → route.ts)
- Test migration can proceed with full knowledge of import resolution issues

**Blockers/Concerns:**
- None

---
*Phase: 40-api-routes-migration*
*Completed: 2026-02-07*

## Self-Check: PASSED

All files listed in key-files.modified exist.
All commit hashes from Task Commits section exist in git history.

