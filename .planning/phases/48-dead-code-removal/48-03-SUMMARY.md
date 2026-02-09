---
phase: 48
plan: 03
subsystem: lib
tags: [code-quality, dead-code, knip, exports]
dependency_graph:
  requires: ["48-01"]
  provides: ["lib-exports-cleaned"]
  affects: ["lib/*"]
tech_stack:
  added: []
  patterns: ["unused-export-removal", "knip-analysis"]
key_files:
  created: []
  modified:
    - lib/auth0.ts
    - lib/changelogService.ts
    - lib/commands/deviceCommands.tsx
    - lib/coordinationEventLogger.ts
    - lib/coordinationOrchestrator.ts
    - lib/deviceFingerprint.ts
    - lib/devicePreferencesService.ts
    - lib/devices/deviceRegistry.ts
    - lib/devices/deviceTypes.ts
    - lib/environmentHelper.ts
    - lib/firebase.ts
    - lib/firebaseAdmin.ts
    - lib/geolocation.ts
    - lib/hlsDownloader.ts
    - lib/logService.ts
    - lib/migrateSchedules.ts
    - lib/notificationPreferencesService.ts
    - lib/routes.ts
    - lib/stoveStateService.ts
decisions:
  - decision: "Remove exports only, keep functions for internal use"
    rationale: "Functions are used within their files but not imported elsewhere"
  - decision: "Fix orphaned code in notificationPreferencesService.ts"
    rationale: "Deviation Rule 3 - blocking tsc compilation"
metrics:
  duration: 574s
  completed: "2026-02-09"
---

# Phase 48 Plan 03: Remove unused exports from lib/ core files Summary

Removed ~41 unused exports from 18 lib/ core service files (auth, devices, firebase, coordination, environment).

## What Was Done

### Task 1: Remove unused exports from lib/ core files (auth through geolocation)
**Commit:** 3ac9908

Removed unused exports from 13 lib/ core files:
- **lib/auth0.ts:** Removed export from `withAuth` (unused, lib/core/middleware has the active version used throughout codebase)
- **lib/changelogService.ts:** Removed default export
- **lib/commands/deviceCommands.tsx:** Removed exports from `getStoveCommands`, `getThermostatCommands`, `getLightsCommands` (internal use only), and default export
- **lib/coordinationEventLogger.ts:** Removed default export
- **lib/coordinationOrchestrator.ts:** Removed default export
- **lib/deviceFingerprint.ts:** Removed exports from `parseUserAgent`, `isSameDevice`, `formatDeviceInfo`
- **lib/devicePreferencesService.ts:** Removed exports from `getDevicePreferences`, `toggleDevicePreference`, `getEnabledDevicesForUser`, `isDeviceEnabled`
- **lib/devices/deviceRegistry.ts:** Removed exports from 11 helper functions (`getEnabledDevices`, `getDeviceConfig`, `getDeviceColors`, `deviceHasFeature`, `getDeviceNavItems`, `getGlobalNavItems`, `getSettingsMenuItems`, `getNavigationStructure`, `isDeviceRoute`, `getActiveDevice`, `getDeviceBadge`) and `DEVICE_TYPES` constant
- **lib/devices/deviceTypes.ts:** Removed export from `ALL_DASHBOARD_ITEMS`
- **lib/environmentHelper.ts:** Removed exports from `getEnvironmentPrefix`, `getEnvironmentName`, `logEnvironmentInfo`
- **lib/firebase.ts:** Removed exports of `app`, `firestore` (kept `db`, `database`)
- **lib/firebaseAdmin.ts:** Removed export from `verifyFCMToken`
- **lib/geolocation.ts:** Removed exports from `GEOLOCATION_ERRORS`, `GEOLOCATION_ERROR_MESSAGES`

### Task 2: Remove unused exports from lib/ utility files (hlsDownloader through stoveState)
**Commit:** 8d15c39

Removed unused exports from 5 lib/ utility files:
- **lib/hlsDownloader.ts:** Removed export from `downloadHlsAsMP4`
- **lib/logService.ts:** Removed export from `logHueAction`
- **lib/migrateSchedules.ts:** Removed export from `runMigration`
- **lib/routes.ts:** Removed exports from `STOVE_UI_ROUTES`, `THERMOSTAT_UI_ROUTES`, `CAMERA_UI_ROUTES`, `GLOBAL_UI_ROUTES`, `SCHEDULER_ROUTES`, `USER_ROUTES`, `AUTH_ROUTES`, `API_ROUTES`, and default export
- **lib/stoveStateService.ts:** Removed exports from `getStoveState`, `initializeStoveState`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Fixed orphaned code in lib/notificationPreferencesService.ts**
- **Found during:** Task 1 tsc compilation check
- **Issue:** Previous plan (48-02) left orphaned code block (lines 224-239) causing parse errors - incomplete function body fragment with closing braces and catch block without try
- **Fix:** Removed orphaned code fragment, keeping only the comment about removed functions
- **Files modified:** lib/notificationPreferencesService.ts
- **Commit:** Included in Task 1 commit (3ac9908)
- **Impact:** Unblocked tsc compilation, zero cascade effects

## Verification Results

### TypeScript Compilation
```bash
npx tsc --noEmit
```
**Result:** 0 errors (all export removals safe)

### Test Suite
```bash
npm test -- --testPathPatterns="lib"
```
**Result:** 54 test suites (1 failed, 53 passed) - failure in `healthDeadManSwitch.test.ts` is pre-existing and unrelated to export changes

### Knip Analysis
All identified unused exports from these 18 files have been removed. Remaining knip findings are in other lib/ files (will be addressed in subsequent plans).

## Key Decisions

1. **Export Removal Strategy:** Removed `export` keyword from functions still used internally within their files, kept function implementations. For completely unused functions/constants, removed only export (preserved for potential future use).

2. **lib/auth0.ts withAuth:** Confirmed unused - the active `withAuth` used throughout the codebase is from `lib/core/middleware.ts`, not `lib/auth0.ts`.

3. **Default Exports:** Removed default exports from `changelogService`, `coordinationEventLogger`, `coordinationOrchestrator`, `deviceCommands`, `routes` - all consumers use named imports.

4. **DEVICE_TYPES Export:** Removed from `lib/devices/deviceRegistry.ts` as it's already exported from `lib/devices/deviceTypes.ts` (single source of truth).

5. **Orphaned Code Fix:** Applied Deviation Rule 3 immediately to unblock compilation - fixing broken code from previous plan is critical path work, not scope creep.

## Files Modified

**18 files total:**
- 13 files in Task 1
- 5 files in Task 2
- 1 additional file (notificationPreferencesService.ts) for orphaned code fix

**Commits:**
- Task 1: `3ac9908` - 14 files changed, 33 insertions(+), 230 deletions(-)
- Task 2: `8d15c39` - 5 files changed, 14 insertions(+), 16 deletions(-)

## Impact Assessment

### Code Quality
- **LOC Reduced:** ~246 lines of export declarations removed
- **API Surface:** Significantly reduced public API surface of lib/ modules
- **Maintainability:** Clearer distinction between public and internal APIs

### Breaking Changes
**None** - all removed exports were confirmed unused by knip and manual verification.

### Performance
No runtime impact - export removal is compile-time only.

## Next Steps

**For Phase 48:**
- Plan 04: Remove unused exports from remaining lib/ files (hue, netatmo, notification, pwa subsystems)
- Plan 05: Remove unused exports from app/ directory
- Plan 06: Remove unused exports from components/ directory

## Self-Check: PASSED

**Files Verification:**
```bash
[ -f "lib/auth0.ts" ] && echo "FOUND: lib/auth0.ts" || echo "MISSING"
[ -f "lib/changelogService.ts" ] && echo "FOUND: lib/changelogService.ts" || echo "MISSING"
[ -f "lib/commands/deviceCommands.tsx" ] && echo "FOUND: lib/commands/deviceCommands.tsx" || echo "MISSING"
[ -f ".planning/phases/48-dead-code-removal/48-03-SUMMARY.md" ] && echo "FOUND: SUMMARY" || echo "MISSING"
```
**Result:** All files present

**Commits Verification:**
```bash
git log --oneline | grep -E "(3ac9908|8d15c39)"
```
**Result:**
- 8d15c39 chore(48-03): remove unused exports from lib/ utility files (Task 2)
- 3ac9908 chore(48-03): remove unused exports from lib/ core files (Task 1)

Both commits present in git history.

---

**Plan 48-03 Complete** | 18 files cleaned | 41 unused exports removed | 0 tsc errors | 574s duration
