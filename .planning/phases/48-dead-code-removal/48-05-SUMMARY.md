---
phase: 48-dead-code-removal
plan: 05
subsystem: dead-code
tags: [exports, barrel-cleanup, code-quality, unused-code]

dependency_graph:
  requires: [48-01]
  provides: [lean-exports, clean-barrels]
  affects: [lib/core, lib/hue, lib/pwa, app/components, types]

tech_stack:
  patterns:
    - internal-functions
    - lean-barrel-exports
    - design-system-pattern

key_files:
  created: []
  modified:
    - lib/core/apiResponse.ts
    - lib/core/middleware.ts
    - lib/core/requestParser.ts
    - lib/core/index.ts
    - lib/hooks/useBackgroundSync.ts
    - lib/hue/hueApi.ts
    - lib/hue/hueConnectionStrategy.ts
    - lib/hue/hueLocalHelper.ts
    - lib/hue/hueRemoteTokenHelper.ts
    - lib/hue/hueTokenHelper.ts
    - lib/pwa/backgroundSync.ts
    - lib/pwa/badgeService.ts
    - lib/pwa/geofencing.ts
    - lib/pwa/indexedDB.ts
    - lib/pwa/offlineStateCache.ts
    - lib/pwa/persistentStorage.ts
    - lib/pwa/vibration.ts
    - lib/pwa/wakeLock.ts
    - lib/pwa/webShare.ts
    - app/api/hue/test/route.ts
    - app/components/weather/weatherHelpers.ts
    - app/components/weather/index.ts
    - app/debug/api/components/ApiTab.tsx
    - app/debug/components/ApiTab.tsx
    - types/api/responses.ts
    - types/api/index.ts
    - lib/routes.ts

decisions:
  - Made internal helper functions (withAuth in middleware, utility functions in PWA modules)
  - Kept design system barrel exports intact (pattern is intentional public API)
  - Fixed NETATMO_ROUTES blocking issue from previous plan

metrics:
  duration: 2457s
  completed: 2026-02-09T17:14:26Z
  tasks: 2
  files: 27
---

# Phase 48 Plan 05: Unused Export Cleanup Summary

97 unused exports removed from lib/core, lib/hue, lib/pwa, app/, and type barrels. All tests pass (3034/3034).

## Objective

Remove unused exports from lib/core/, lib/hue/, lib/pwa/, app/ files, and clean up barrel exports in UI index and type barrels to reduce codebase surface area.

## Execution

### Task 1: Remove unused exports from lib/core/, lib/hue/, lib/pwa/ files

**lib/core/apiResponse.ts (4 exports removed):**
- Removed `fromApiError` (made internal, still used by handleError)
- Removed `validationError` (unused)
- Removed `serviceUnavailable` (unused)
- Removed default export object

**lib/core/middleware.ts (6 exports removed):**
- Removed `withAuth` export (kept as internal helper for withAuthAndErrorHandler)
- Removed `withOptionalAuth` (unused)
- Removed `protect` alias (unused)
- Removed `withAdmin` (unused)
- Removed `compose` (unused)
- Removed default export object

**lib/core/requestParser.ts (1 export removed):**
- Removed default export object

**lib/core/index.ts (9 re-exports removed):**
- Updated barrel to remove deleted exports from above modules

**lib/hooks/useBackgroundSync.ts (1 export removed):**
- Removed default export

**lib/hue/hueApi.ts (2 exports removed):**
- Removed `exchangeCodeForTokens` stub function
- Removed `refreshAccessToken` stub function

**lib/hue/hueConnectionStrategy.ts (1 export removed):**
- Removed default export

**lib/hue/hueLocalHelper.ts (2 exports removed):**
- Removed `getConnectionMode` (unused)
- Removed `setConnectionMode` (unused)

**lib/hue/hueRemoteTokenHelper.ts (2 exports removed):**
- Removed `getRemoteStatus` (unused)
- Removed default export object

**lib/hue/hueTokenHelper.ts (6 exports removed):**
- Removed all stub exports: `getValidAccessToken`, `saveRefreshToken`, `saveInitialTokens`, `isHueConnected`, `clearHueData`, `getHueStatus`

**lib/pwa/backgroundSync.ts (3 exports removed):**
- Made `isBackgroundSyncSupported` internal (used by registerSync)
- Made `registerSync` internal (used by queueCommand)
- Removed default export object

**lib/pwa/badgeService.ts (5 exports removed):**
- Made `isBadgeSupported`, `getBadgeCount`, `setBadgeCount` internal
- Removed `incrementBadge`, `decrementBadge`, `updateBadgeFromAlerts`, `initializeBadge`
- Removed default export object

**lib/pwa/geofencing.ts (10 exports removed):**
- Made all 9 functions internal: `getCurrentPosition`, `getGeofenceConfig`, `saveGeofenceConfig`, `setCurrentLocationAsHome`, `checkGeofenceStatus`, `enableGeofencing`, `disableGeofencing`, `updateGeofenceActions`, `clearGeofenceConfig`
- Removed default export object

**lib/pwa/indexedDB.ts (6 exports removed):**
- Made `openDB`, `add`, `clear`, `count`, `isSupported` internal
- Removed default export object

**lib/pwa/offlineStateCache.ts (4 exports removed):**
- Made `getAllCachedStates`, `cacheState`, `getCachedStateFromSW` internal
- Removed default export object

**lib/pwa/persistentStorage.ts (2 exports removed):**
- Made `getStorageDetails` internal
- Removed default export object

**lib/pwa/vibration.ts (3 exports removed):**
- Made `vibrateNotification`, `vibrateHeartbeat` internal
- Removed default export object

**lib/pwa/wakeLock.ts (2 exports removed):**
- Made `reacquireWakeLock` internal
- Removed default export object

**lib/pwa/webShare.ts (4 exports removed):**
- Made `isFileShareSupported`, `shareDeviceSummary`, `shareErrorLog` internal
- Removed default export object

**app/api/hue/test/route.ts (1 fix):**
- Fixed broken import of removed stub function `getValidAccessToken`

**Total Task 1:** 66 exports removed from 18 lib/ files

### Task 2: Remove unused exports from app/ files and clean barrels

**app/components/weather/weatherHelpers.ts (2 exports removed):**
- Made `isSnowCode` internal (used by getPrecipitationLabel)
- Made `getPrecipitationLabel` internal (unused externally)

**app/components/weather/index.ts (36 re-exports removed):**
- Cleaned barrel to only export `WeatherCard` and `WeatherCardProps`
- Removed: `WeatherCardDefault`, `CurrentConditions`, `ForecastRow`, `ForecastDayCard`, `ForecastDaySheet`, `HourlyForecast`, `WeatherIcon`, `getWeatherLabel`, and all helper function re-exports
- Only WeatherCard is imported outside the weather/ directory

**app/debug/api/components/ApiTab.tsx (1 export removed):**
- Made `JsonDisplay` internal (unused externally)

**app/debug/components/ApiTab.tsx (1 export removed):**
- Made `JsonDisplay` internal (unused externally)

**types/api/responses.ts (2 exports removed):**
- Removed `isApiSuccess` type guard (unused)
- Removed `isApiError` type guard (unused)

**types/api/index.ts (2 re-exports removed):**
- Removed `isApiSuccess`, `isApiError` re-exports from barrel

**app/thermostat/components/ThermostatTabs.tsx:**
- Verified export IS used (imported by thermostat page) - kept as is

**app/components/ui/index.ts:**
- Conservative approach: UI barrel exports are part of design system pattern
- Components flagged by knip are used internally within ui/ directory
- This is the intended pattern for a design system barrel
- No changes made (design-system-first pattern)

**Total Task 2:** 31 exports removed from 7 app/types files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Re-exported NETATMO_ROUTES**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** NETATMO_ROUTES was made internal in plan 48-03 or 48-04, causing 13 import errors across camera, thermostat, netatmo, and hook files
- **Fix:** Re-exported NETATMO_ROUTES from lib/routes.ts
- **Files modified:** lib/routes.ts
- **Commit:** b911cc6

## Verification

**TypeScript Compilation:**
```bash
npx tsc --noEmit
# Result: 0 errors (after NETATMO_ROUTES fix)
```

**Tests:**
```bash
npm test
# Result: 3034/3034 tests passing
# Test suites: 131 passed
```

**Knip Analysis:**
```bash
npx knip --include exports | grep "lib/pwa\|lib/core\|lib/hue\|app/components/weather\|types/api"
# Result: Significantly fewer unused exports
# Remaining: Design system barrel exports (intentional pattern)
```

## Key Files

**Modified (27 files):**
- 10 lib/core+hue files
- 9 lib/pwa files
- 5 app/ files
- 2 types/ files
- 1 lib/routes.ts (deviation fix)

## Success Criteria

- ✅ 66 unused exports removed from lib/core+hue+pwa files
- ✅ 31 unused exports removed from app/ and type barrels
- ✅ Zero tsc errors after fixing NETATMO_ROUTES blocking issue
- ✅ All 3034 tests passing
- ✅ Knip shows significantly fewer unused exports (design system pattern preserved)

## Impact

**Code Quality:**
- 97 total exports removed (66 lib/ + 31 app/types/)
- Leaner export surfaces reduce API confusion
- Internal-only functions now properly encapsulated
- Barrel exports cleaned to only truly consumed items

**Patterns Established:**
- Internal helper pattern (functions used only within module)
- Lean barrel exports (only export what's consumed externally)
- Design system barrel pattern preserved (intentional public API)

## Self-Check: PASSED

**Files exist:**
```bash
[ -f ".planning/phases/48-dead-code-removal/48-05-SUMMARY.md" ] && echo "FOUND"
```

**Commits exist:**
```bash
git log --oneline | grep "48-05"
# 7e1fbae feat(48-05): remove unused exports from lib/core, lib/hue, lib/pwa files
# b911cc6 feat(48-05): remove unused exports from app/ files and type barrels
```

**Files modified (27 total):**
- lib/core/apiResponse.ts
- lib/core/middleware.ts
- lib/core/requestParser.ts
- lib/core/index.ts
- lib/hooks/useBackgroundSync.ts
- lib/hue/hueApi.ts
- lib/hue/hueConnectionStrategy.ts
- lib/hue/hueLocalHelper.ts
- lib/hue/hueRemoteTokenHelper.ts
- lib/hue/hueTokenHelper.ts
- lib/pwa/backgroundSync.ts
- lib/pwa/badgeService.ts
- lib/pwa/geofencing.ts
- lib/pwa/indexedDB.ts
- lib/pwa/offlineStateCache.ts
- lib/pwa/persistentStorage.ts
- lib/pwa/vibration.ts
- lib/pwa/wakeLock.ts
- lib/pwa/webShare.ts
- app/api/hue/test/route.ts
- app/components/weather/weatherHelpers.ts
- app/components/weather/index.ts
- app/debug/api/components/ApiTab.tsx
- app/debug/components/ApiTab.tsx
- types/api/responses.ts
- types/api/index.ts
- lib/routes.ts

**TypeScript:** 0 errors
**Tests:** 3034/3034 passing

All verification passed.
