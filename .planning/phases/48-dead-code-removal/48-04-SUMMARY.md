---
phase: 48-dead-code-removal
plan: 04
subsystem: lib-services
tags: [dead-code-removal, exports, knip, lib-cleanup]
dependency_graph:
  requires: [48-01]
  provides: [clean-lib-exports]
  affects: [import-paths, api-surface]
tech_stack:
  added: []
  patterns: [internal-functions, export-removal]
key_files:
  created: []
  modified:
    - lib/netatmoApi.ts
    - lib/netatmoCalibrationService.ts
    - lib/netatmoCameraApi.ts
    - lib/netatmoCredentials.ts
    - lib/netatmoStoveSync.ts
    - lib/netatmoTokenHelper.ts
    - lib/notificationFilter.ts
    - lib/notificationLogger.ts
    - lib/notificationPreferencesService.ts
    - lib/notificationService.ts
    - lib/notificationTriggers.ts
    - lib/notificationTriggersServer.ts
decisions:
  - "Knip reported server trigger functions as unused - verified actual production usage before removal"
  - "Made getUserPreferences and updateUserPreferences internal (not exported) - used only by exported functions"
  - "Restored triggerMaintenanceAlertServer, triggerStoveStatusWorkServer, triggerSchedulerActionServer, triggerStoveUnexpectedOffServer, triggerNetatmoAlertServer - actively used in scheduler/health monitoring"
metrics:
  duration: 3420s
  completed: 2026-02-09
  tasks: 1
  files_modified: 12
  exports_removed: 45
---

# Phase 48 Plan 04: Remove Unused Exports from lib/ Service Files Summary

**One-liner:** Removed 45 unused exports from 12 lib/ netatmo/notification service files, reducing public API surface while preserving internal usage patterns

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove unused exports from lib/ netatmo and notification files | 81e75ea | 12 service files |

## What Was Done

### Task 1: Removed Unused Exports from lib/ Netatmo and Notification Files (12 files)

Cleaned up public API surface from netatmo and notification service modules:

**1. lib/netatmoApi.ts** - Removed 7 unused exports:
- `getDeviceList`, `getThermState`, `getRoomMeasure` (data fetching)
- `syncHomeSchedule`, `createSchedule`, `renameHome` (control functions)
- `isHeatingActive` (helper)

**2. lib/netatmoCalibrationService.ts** - Removed default export (unused wrapper)

**3. lib/netatmoCameraApi.ts** - Removed 9 unused exports:
- `getCamerasData`, `getCameraEvents`, `getEventsUntil` (data fetching)
- `getLiveStreamUrl`, `getEventVideoUrl`, `getEventVideoThumbnail`, `getEventVideoDownloadUrl` (media URLs)
- `getSubTypeName`, `getSubTypeIcon` (display helpers)

**4. lib/netatmoCredentials.ts** - Made `NETATMO_OAUTH_SCOPES` internal (used only by getNetatmoAuthUrl)

**5. lib/netatmoStoveSync.ts** - Removed 2 exports:
- `getSyncedRoomIds` - made internal (used only within module)
- Default export (unused wrapper)

**6. lib/netatmoTokenHelper.ts** - Removed 2 exports:
- `clearNetatmoData` - unused logout function
- Default export (unused wrapper)

**7. lib/notificationFilter.ts** - Removed `_internals` test export (not used in tests)

**8. lib/notificationLogger.ts** - Removed 2 convenience wrappers:
- `logNotificationError` - unused convenience wrapper
- `getNotificationLogs` - unused query function

**9. lib/notificationPreferencesService.ts** - Removed 6 exports (4 unused, 2 made internal):
- Made internal (used by other exports): `getUserPreferences`, `updateUserPreferences`
- Removed entirely: `shouldSendSchedulerNotification`, `shouldSendMaintenanceNotification`, `resetPreferences`, `getPreferenceStats`

**10. lib/notificationService.ts** - Removed 5 payload builder helpers:
- `createErrorNotification`, `createSchedulerNotification`, `createMaintenanceNotification`
- `createGenericNotification`, `getUserFCMTokens`

**11. lib/notificationTriggers.ts** - Removed 10 client-side trigger functions:
- `getNotificationType`, `getNotificationTypesByCategory`
- `triggerNotification` (base function)
- `triggerStoveStatusWork`, `triggerStoveUnexpectedOff`, `triggerStoveError`
- `triggerSchedulerAction`, `triggerMaintenanceAlert`, `triggerNetatmoAlert`, `triggerGenericNotification`

**12. lib/notificationTriggersServer.ts** - Removed 5 unused server triggers (kept 5 actively used):
- Removed: `triggerNotificationToAdmin`, `triggerStoveErrorServer`, `triggerHueAlertServer`, `triggerSystemNotificationServer`, `triggerGenericNotificationServer`
- **Kept** (actively used): `triggerStoveStatusWorkServer`, `triggerStoveUnexpectedOffServer`, `triggerSchedulerActionServer`, `triggerMaintenanceAlertServer`, `triggerNetatmoAlertServer`

## Verification Results

✅ **TypeScript compilation:** 0 errors from export changes
✅ **Tests:** 52 passed (notification tests)
✅ **Exports removed:** 45 unused exports
✅ **Production code:** Verified no broken imports

## Deviations from Plan

### Deviation 1: Knip False Positives for Server Trigger Functions

**Issue:** Knip reported several `*Server` trigger functions as unused in `notificationTriggersServer.ts`

**Root Cause:** These functions are used in scheduler check route (`app/api/scheduler/check/route.ts`) and health monitoring (`lib/healthDeadManSwitch.ts`), but knip didn't detect the usage

**Resolution:**
- Verified actual production usage with grep search
- Restored: `triggerStoveStatusWorkServer`, `triggerStoveUnexpectedOffServer`, `triggerSchedulerActionServer`, `triggerMaintenanceAlertServer`, `triggerNetatmoAlertServer`
- Removed only truly unused: `triggerNotificationToAdmin`, `triggerStoveErrorServer`, `triggerHueAlertServer`, `triggerSystemNotificationServer`, `triggerGenericNotificationServer`

**Files Affected:** `lib/notificationTriggersServer.ts`

**Decision Rule Applied:** Rule 3 (Auto-fix blocking issues) - verified actual usage before removal to prevent breaking production code

### Deviation 2: getUserPreferences and updateUserPreferences Made Internal

**Issue:** Plan listed these as "unused exports" to remove

**Root Cause:** They are used internally by other exported functions in the same module (`updatePreferenceSection`, `shouldSendErrorNotification`)

**Resolution:**
- Removed `export` keyword (made internal) rather than deleting entirely
- Functions remain available for internal module use
- Public API surface still reduced (no longer part of public exports)

**Files Affected:** `lib/notificationPreferencesService.ts`

**Decision Rule Applied:** Rule 1 (Auto-fix bugs) - preserving internal dependencies while achieving plan goal of export reduction

## Known Issues

None - all changes cleanly integrated.

## Self-Check: PASSED

**Modified files verification:**
```bash
✓ MODIFIED: lib/netatmoApi.ts (7 exports removed)
✓ MODIFIED: lib/netatmoCalibrationService.ts (default export removed)
✓ MODIFIED: lib/netatmoCameraApi.ts (9 exports removed)
✓ MODIFIED: lib/netatmoCredentials.ts (NETATMO_OAUTH_SCOPES made internal)
✓ MODIFIED: lib/netatmoStoveSync.ts (2 exports removed)
✓ MODIFIED: lib/netatmoTokenHelper.ts (2 exports removed)
✓ MODIFIED: lib/notificationFilter.ts (_internals removed)
✓ MODIFIED: lib/notificationLogger.ts (2 functions removed)
✓ MODIFIED: lib/notificationPreferencesService.ts (6 exports addressed)
✓ MODIFIED: lib/notificationService.ts (5 functions removed)
✓ MODIFIED: lib/notificationTriggers.ts (10 functions removed)
✓ MODIFIED: lib/notificationTriggersServer.ts (5 functions removed, 5 kept)
```

**Commits exist:**
```bash
✓ FOUND: 81e75ea (Task 1 - Remove unused exports from netatmo/notification files)
```

**TypeScript compilation:**
```bash
✓ PASSED: 0 errors from export changes
```

**Test execution:**
```bash
✓ PASSED: 52 notification tests passing
```

All verification checks passed successfully.
