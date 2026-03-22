---
phase: 117-dead-code-cleanup
plan: 01
subsystem: lib
tags: [knip, dead-code, exports, cleanup, refactor]

# Dependency graph
requires: []
provides:
  - "CLEAN-01: all in-scope unused exports removed from lib/ and app/ (knip CLEAN)"
affects: [future plans adding new lib/ exports, any code importing removed symbols]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "De-export pattern: remove export keyword from internally-used symbols, delete entirely if unused anywhere"
    - "Barrel cleanup: remove individual re-exports from lib/core/index.ts when symbols have no consumers"

key-files:
  created: []
  modified:
    - lib/core/index.ts
    - lib/core/apiResponse.ts
    - lib/core/__tests__/apiResponse.test.ts
    - lib/errorMonitor.ts
    - lib/tokenRefresh.ts
    - lib/tokenStorage.ts
    - lib/notifications/notificationPreferencesService.ts
    - lib/notifications/notificationTriggersServer.ts
    - lib/schemas/notificationPreferences.ts
    - lib/scheduler/schedulesApiClient.ts
    - lib/pwa/installPromptService.ts
    - lib/services/unifiedDeviceConfigService.ts
    - lib/services/locationService.ts
    - lib/services/pidAutomationService.ts
    - lib/rateLimiter.ts
    - lib/devices/deviceRegistry.ts
    - lib/validators/stove.validators.ts
    - app/hooks/useDebounce.ts
    - app/hooks/useHaptic.ts
    - app/network/components/DeviceListTable.tsx
    - app/network/components/DeviceCategoryBadge.tsx
    - app/network/components/DeviceStatusBadge.tsx
    - app/thermostat/components/ThermostatTabs.tsx
    - app/components/weather/WeatherCard.tsx
    - app/components/weather/CurrentConditions.tsx
    - app/components/weather/ForecastRow.tsx
    - app/components/weather/ForecastDaySheet.tsx
    - app/components/weather/ForecastDayCard.tsx
    - app/components/weather/HourlyForecast.tsx
    - app/debug/design-system/data/component-docs.ts
    - app/components/ErrorBoundary/index.ts
    - tests/helpers/test-context.ts

key-decisions:
  - "Deleted entire symbols when unused everywhere (forceTokenRefresh, sendErrorPushNotification, clearToken, getStorageStatus, getLocation, setLocation, clearRateLimitForUser, getRateLimitStatus, _internals in rateLimiter, getScheduleById, getActiveScheduleId, triggerNetatmoAlertServer, shouldSendErrorNotification)"
  - "De-exported only (kept function body) when symbol is used internally: requestPersistentStorage, checkPersistence, canUseLocalStorage, getVisitCount, DEFAULT_PID_CONFIG, dndWindowSchema, rateLimitSchema, isDisplayOnly, hasHomepageCard, getDefaultDeviceConfig, getUnifiedDeviceConfig"
  - "stove.validators.ts import path updated from @/lib/core to @/lib/core/requestParser after validateRange removed from barrel"
  - "Tests for deleted apiResponse functions removed (timeout, stoveOffline, maintenanceRequired, netatmoReconnect) — functions had no remaining callers"
  - "alertDeadManSwitch, determineConnectionStatus, detectStateMismatch, getRecentHealthLogs, getHealthCheckDetails kept exported (test access required)"
  - "AUTH_FILE kept in test-context.ts (used by auth.setup.ts, knip false-positive due to Playwright setup not being traced)"

requirements-completed: [CLEAN-01]

# Metrics
duration: 54min
completed: 2026-03-22
---

# Phase 117 Plan 01: Dead Code Cleanup Summary

**Removed 50+ unused exports across 32 files — lib/ barrel pruned from 18 to 9 re-exports, 14 symbols deleted entirely, 10 de-exported (export keyword stripped but function retained)**

## Performance

- **Duration:** 54 min
- **Started:** 2026-03-22T17:52:27Z
- **Completed:** 2026-03-22T18:46:00Z
- **Tasks:** 2 of 2
- **Files modified:** 32

## Accomplishments
- Eliminated all in-scope lib/ unused exports per knip CLEAN-01 scope
- lib/core/index.ts barrel reduced: 18 re-exports removed (unused symbols and device-specific responses)
- lib/core/apiResponse.ts cleaned: timeout, serverError, stoveOffline, maintenanceRequired, netatmoReconnect, redirect deleted (no callers in app or lib)
- All app/ component dead exports removed: default exports from 6 weather components, DeviceListTable/Badges named exports, ThermostatTabs named export, useDebounce/useHaptic default exports
- Test suite passes with no new regressions (pre-existing failures unchanged)

## Task Commits

1. **Task 1: Remove unused exports from lib/ files** - `d635f0f2` (chore)
2. **Task 2: Remove unused exports from app/ and test helpers** - `e9dbb8c5` (chore)

## Files Created/Modified
- `lib/core/index.ts` - Barrel reduced from 18 to 9 re-exports (removed all flagged symbols)
- `lib/core/apiResponse.ts` - Deleted 6 unused response helpers (timeout, serverError, stoveOffline, maintenanceRequired, netatmoReconnect, redirect)
- `lib/core/__tests__/apiResponse.test.ts` - Removed test cases for deleted functions
- `lib/errorMonitor.ts` - Deleted sendErrorPushNotification (commented-out call site only)
- `lib/tokenRefresh.ts` - Deleted forceTokenRefresh (no callers)
- `lib/tokenStorage.ts` - De-exported requestPersistentStorage/checkPersistence; deleted clearToken/getStorageStatus
- `lib/notifications/notificationPreferencesService.ts` - Deleted shouldSendErrorNotification
- `lib/notifications/notificationTriggersServer.ts` - Deleted triggerNetatmoAlertServer
- `lib/schemas/notificationPreferences.ts` - De-exported dndWindowSchema/rateLimitSchema (used internally)
- `lib/scheduler/schedulesApiClient.ts` - Deleted getScheduleById, getActiveScheduleId
- `lib/pwa/installPromptService.ts` - De-exported canUseLocalStorage/getVisitCount (used internally)
- `lib/services/unifiedDeviceConfigService.ts` - De-exported 4 helper functions (used internally)
- `lib/services/locationService.ts` - Deleted getLocation, setLocation, LocationInput (no callers)
- `lib/services/pidAutomationService.ts` - De-exported DEFAULT_PID_CONFIG (used internally)
- `lib/rateLimiter.ts` - Deleted clearRateLimitForUser, getRateLimitStatus, _internals
- `lib/devices/deviceRegistry.ts` - Removed DEVICE_CONFIG/GLOBAL_SECTIONS re-export
- `lib/validators/stove.validators.ts` - Fixed import path to lib/core/requestParser
- `app/hooks/useDebounce.ts` / `useHaptic.ts` - Removed default exports
- `app/network/components/DeviceListTable.tsx` / `DeviceCategoryBadge.tsx` / `DeviceStatusBadge.tsx` - De-exported named functions (default export kept)
- `app/thermostat/components/ThermostatTabs.tsx` - De-exported named function (default export kept)
- `app/components/weather/*.tsx` (6 files) - Removed default exports (all callers use named imports)
- `app/debug/design-system/data/component-docs.ts` - Deleted getComponentsByCategory, getCategories, getComponentDoc, default export
- `app/components/ErrorBoundary/index.ts` - Removed ErrorFallback from barrel
- `tests/helpers/test-context.ts` - Removed BASE_URL export

## Decisions Made
- De-exported symbols used internally (remove `export` only) vs deleted symbols unused anywhere
- stove.validators.ts import path changed to direct requestParser import after barrel cleanup
- Test cases for apiResponse deleted functions removed to maintain test suite health
- health/ functions kept exported for test access (alertDeadManSwitch, getRecentHealthLogs, getHealthCheckDetails, determineConnectionStatus, detectStateMismatch)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed stale tests for deleted apiResponse functions**
- **Found during:** Task 2 verification
- **Issue:** lib/core/__tests__/apiResponse.test.ts imported timeout/stoveOffline/maintenanceRequired/netatmoReconnect which were deleted from apiResponse.ts in Task 1
- **Fix:** Removed 4 test cases (timeout, stoveOffline, maintenanceRequired, netatmoReconnect) and their imports
- **Files modified:** lib/core/__tests__/apiResponse.test.ts
- **Verification:** npx jest lib/core/__tests__/apiResponse.test.ts passes (16 tests)
- **Committed in:** d635f0f2 (Task 1 commit includes this fix)

**2. [Rule 3 - Blocking] Fixed stove.validators.ts import path**
- **Found during:** Task 1 — tsc check after barrel cleanup
- **Issue:** lib/validators/stove.validators.ts imported validateRange from @/lib/core which no longer exports it; file itself is unused (knip flagged it) but tsc still compiled it
- **Fix:** Changed import to @/lib/core/requestParser (direct path)
- **Files modified:** lib/validators/stove.validators.ts
- **Verification:** tsc --noEmit shows no new errors
- **Committed in:** d635f0f2 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 stale test cleanup, 1 blocking import path)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
- knip `--reporter json` returns empty exports array (known limitation — only text output shows unused exports)
- stove.validators.ts is an unused file but tsc still compiles it — fixed by updating its import path rather than deleting the file (not in scope)
- useDeviceStaleness, healthDeadManSwitch, healthLogger tests fail with pre-existing issues (unrelated to this plan)

## Known Stubs
None — this plan only removes exports, no new features or data flows introduced.

## Next Phase Readiness
- CLEAN-01 complete: knip reports zero in-scope lib/ and app/ unused exports
- lib/notifications/notificationService.ts re-exports (supportsNotificationActions, getNotificationCapabilities) handled in Plan 02
- health/ exports (alertDeadManSwitch, getRecentHealthLogs, getHealthCheckDetails) intentionally retained for test access

## Self-Check: PASSED

- All 32 modified files exist on disk
- Commits d635f0f2 and e9dbb8c5 confirmed in git log
- ERROR_MESSAGES removed from lib/core/index.ts
- mapLegacyError removed from lib/core/index.ts
- serverError export removed from lib/core/apiResponse.ts
- No app/components/ui/ files modified
- lib/notifications/notificationService.ts not modified by this plan

---
*Phase: 117-dead-code-cleanup*
*Completed: 2026-03-22*
