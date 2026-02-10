---
phase: 21
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "No console.log() calls remain in source files"
    - "console.warn(), console.error(), console.info(), console.debug() are preserved"
    - "Test files and config files are untouched"
  artifacts:
    - path: "lib/"
      provides: "Library files cleaned of console.log"
      min_files: 47
    - path: "app/"
      provides: "App files cleaned of console.log"
      min_files: 40
  key_links:
    - from: "grep console.log"
      to: "source files (lib/, app/, components/, hooks/)"
      via: "code search"
      pattern: "console\\.log\\("
---

<objective>
Remove all `console.log()` debug statements from the codebase while preserving intentional logging (`console.warn()`, `console.error()`, `console.info()`, `console.debug()`).

Purpose: Clean up development debug statements that clutter production logs and reduce noise
Output: Source files without console.log calls, maintaining production-appropriate logging
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md

## Console.log Inventory

**Total occurrences**: ~390 across 95 source files

**Distribution by directory**:
- `lib/`: ~47 files (coordinationOrchestrator.ts has 14, migrateSchedules.ts has 27, firebaseAdmin.ts has 8)
- `app/`: ~40 files (API routes, components, pages)
- `app/sw.ts`: 22 occurrences (service worker)

**Patterns observed**:
- Emoji prefixes for log categorization (🔄, ✅, 📨, ⏸️, etc.)
- Coordination flow tracking
- API rate limiting feedback
- Firebase initialization/operation logging
- PWA feature logging (badge, geofencing, wake lock)

**Files to EXCLUDE**:
- Test files (`__tests__/`, `*.test.ts`, `*.test.tsx`)
- Config files (`next.config.ts`, `jest.config.ts`)
- Service worker: `public/firebase-messaging-sw.js` (non-TS)
- Documentation: `.planning/`, `docs/`, `scripts/`

**Files to INCLUDE**:
- All `.ts` and `.tsx` files in: `src/`, `app/`, `lib/`, `components/`, `hooks/`, `utils/`, `pages/`
- Service worker: `app/sw.ts` (TypeScript PWA service worker)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove console.log from all source files</name>
  <files>
    lib/coordinationOrchestrator.ts
    lib/coordinationThrottlePersistent.ts
    lib/coordinationNotificationThrottle.ts
    lib/coordinationDebounce.ts
    lib/coordinationEventLogger.ts
    lib/firebaseAdmin.ts
    lib/tokenStorage.ts
    lib/rateLimiter.ts
    lib/netatmoRateLimiter.ts
    lib/netatmoRateLimiterPersistent.ts
    lib/netatmoCacheService.ts
    lib/netatmoCalibrationService.ts
    lib/netatmoStoveSync.ts
    lib/netatmoApi.ts
    lib/netatmoTokenHelper.ts
    lib/core/netatmoHelpers.ts
    lib/healthMonitoring.ts
    lib/healthLogger.ts
    lib/healthDeadManSwitch.ts
    lib/cronExecutionLogger.ts
    lib/notificationService.ts
    lib/notificationLogger.ts
    lib/notificationFilter.ts
    lib/notificationTriggersServer.ts
    lib/errorMonitor.ts
    lib/maintenanceService.ts
    lib/schedulerService.ts
    lib/stoveApi.ts
    lib/stoveStateService.ts
    lib/services/StoveService.ts
    lib/services/pidAutomationService.ts
    lib/services/locationService.ts
    lib/weatherCacheService.ts
    lib/openMeteo.ts
    lib/changelogService.ts
    lib/hlsDownloader.ts
    lib/tokenRefresh.ts
    lib/migrateSchedules.ts
    lib/envValidator.ts
    lib/environmentHelper.ts
    lib/geolocation.ts
    lib/commands/deviceCommands.tsx
    lib/hue/hueRemoteApi.ts
    lib/pwa/wakeLock.ts
    lib/pwa/persistentStorage.ts
    lib/pwa/offlineStateCache.ts
    lib/pwa/indexedDB.ts
    lib/pwa/geofencing.ts
    lib/pwa/badgeService.ts
    lib/pwa/backgroundSync.ts
    lib/pwa/webShare.ts
    lib/hooks/useBackgroundSync.ts
    lib/hooks/useOnlineStatus.ts
    app/sw.ts
    app/components/devices/camera/CameraCard.tsx
    app/components/devices/lights/LightsCard.tsx
    app/components/devices/thermostat/ThermostatCard.tsx
    app/components/devices/stove/StoveCard.tsx
    app/components/NotificationPermissionButton.tsx
    app/components/PWAInitializer.tsx
    app/components/CronHealthBanner.tsx
    app/components/AxeDevtools.tsx
    app/components/netatmo/StoveSyncPanel.tsx
    app/components/ui/Banner.tsx
    app/components/ui/DataTable.tsx
    app/context/VersionContext.tsx
    app/hooks/useVersionCheck.ts
    app/settings/notifications/page.tsx
    app/stove/scheduler/page.tsx
    app/debug/design-system/page.tsx
    app/debug/design-system/data/component-docs.ts
    app/api/scheduler/check/route.ts
    app/api/health-monitoring/check/route.ts
    app/api/netatmo/schedules/route.ts
    app/api/netatmo/calibrate/route.ts
    app/api/netatmo/camera/events/route.ts
    app/api/notifications/register/route.ts
    app/api/notifications/unregister/route.ts
    app/api/notifications/check-rate/route.ts
    app/api/notifications/cleanup/route.ts
    app/api/notifications/preferences/route.ts
    app/api/notifications/preferences-v2/route.ts
    app/api/notifications/errors/route.ts
    app/api/coordination/enforce/route.ts
    app/api/schedules/route.ts
    app/api/schedules/[id]/route.ts
    app/api/schedules/active/route.ts
    app/api/hue/remote/pair/route.ts
    app/api/hue/remote/callback/route.ts
    app/api/hue/remote/authorize/route.ts
    app/api/errors/resolve/route.ts
    app/api/errors/log/route.ts
    app/api/maintenance/update-target/route.ts
    app/api/maintenance/confirm-cleaning/route.ts
    app/api/user/theme/route.ts
  </files>
  <action>
For each file listed above:

1. **Read the file** to understand the context
2. **Remove all `console.log()` calls** (including multi-line statements)
3. **Preserve all other console methods**:
   - `console.warn()` — keep (warnings)
   - `console.error()` — keep (errors)
   - `console.info()` — keep (info logging)
   - `console.debug()` — keep (debug logging)
4. **Clean up any orphaned code** if the console.log was the only statement in a block
5. **Verify syntax** remains valid after removal

**Search pattern**: `/console\.log\(/`

**Special handling**:
- Multi-line console.log statements: Remove entire statement including all arguments
- Template literals with emoji: Remove entire statement (e.g., `console.log(\`🔄 [Coordination] ...\`)`)
- Conditional logging: If console.log is in an if block with no other side effects, remove the entire if block
- Comments: If a comment explains the console.log, remove the comment too

**DO NOT**:
- Touch test files (`*.test.ts`, `*.test.tsx`, `__tests__/`)
- Touch config files (`next.config.ts`, `jest.config.ts`)
- Touch `public/firebase-messaging-sw.js` (JavaScript service worker)
- Touch documentation files (`.planning/`, `docs/`)
- Remove `console.warn()`, `console.error()`, `console.info()`, `console.debug()`

**Quality check**:
- After removing console.log, ensure no syntax errors introduced
- Ensure no empty try/catch blocks created
- Ensure no dangling template literals or string concatenations
  </action>
  <verify>
# Verify no console.log remains in source files
grep -r "console\.log(" lib/ app/ --include="*.ts" --include="*.tsx" --exclude-dir=__tests__ --exclude="*.test.ts" --exclude="*.test.tsx" || echo "✅ No console.log found"

# Verify console.error/warn/info/debug are preserved (spot check)
grep -r "console\.(error|warn|info|debug)" lib/ app/ --include="*.ts" --include="*.tsx" | head -5

# Verify TypeScript compilation still works
npx tsc --noEmit
  </verify>
  <done>
- All `console.log()` calls removed from source files (lib/, app/, components/, hooks/, utils/, pages/)
- `console.warn()`, `console.error()`, `console.info()`, `console.debug()` preserved
- No TypeScript compilation errors introduced
- Test files, config files, and documentation untouched
- Grep search returns no matches for `console.log(` in source directories
  </done>
</task>

</tasks>

<verification>
**Post-cleanup validation**:

1. **Search verification**:
   ```bash
   # Should return 0 matches in source files
   grep -r "console\.log(" lib/ app/ --include="*.ts" --include="*.tsx" --exclude-dir=__tests__ --exclude="*.test.ts" --exclude="*.test.tsx"

   # Should still find console.error/warn (spot check)
   grep -r "console\.(error|warn)" lib/ app/ --include="*.ts" --include="*.tsx" | wc -l
   ```

2. **Build verification**:
   ```bash
   # TypeScript compilation must succeed
   npx tsc --noEmit
   ```

3. **Test verification**:
   ```bash
   # All tests must still pass
   npm test -- --passWithNoTests
   ```

4. **Spot check key files**:
   - `lib/coordinationOrchestrator.ts` (had 14 occurrences)
   - `lib/migrateSchedules.ts` (had 27 occurrences)
   - `lib/firebaseAdmin.ts` (had 8 occurrences)
   - `app/api/scheduler/check/route.ts` (had 38 occurrences)
   - `app/sw.ts` (had 22 occurrences)
</verification>

<success_criteria>
**Phase complete when**:

1. ✅ Zero `console.log()` calls in source files (lib/, app/, components/, hooks/, utils/, pages/)
2. ✅ `console.warn()`, `console.error()`, `console.info()`, `console.debug()` preserved
3. ✅ TypeScript compilation passes (`npx tsc --noEmit`)
4. ✅ Test suite passes (no regressions)
5. ✅ No syntax errors introduced
6. ✅ Test files and config files untouched

**Measurable outcome**: `grep -r "console\.log(" lib/ app/ --include="*.ts" --include="*.tsx" --exclude-dir=__tests__` returns 0 results
</success_criteria>

<output>
After completion, create `.planning/quick/21-pulisci-i-console-log-presenti-nel-sito-/21-SUMMARY.md` documenting:
- Total console.log calls removed
- Files modified count
- Any edge cases encountered
- Verification results (grep, tsc, npm test)
</output>
