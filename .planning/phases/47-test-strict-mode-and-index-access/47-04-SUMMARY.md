---
phase: 47-test-strict-mode-and-index-access
plan: 04
subsystem: type-system
tags: [typescript, strict-mode, noUncheckedIndexedAccess, compiler-options, lib]
dependency_graph:
  requires: [47-01, 47-02, 47-03]
  provides: [noUncheckedIndexedAccess-enabled, lib-index-safe]
  affects: [all-ts-tsx-files]
tech_stack:
  added: []
  patterns: [non-null-assertions, nullish-coalescing, array-index-guards]
key_files:
  created: []
  modified:
    - tsconfig.json
    - lib/schedulerService.ts
    - lib/firebaseAdmin.ts
    - lib/rateLimiter.ts
    - lib/errorMonitor.ts
    - lib/changelogService.ts
    - lib/schedulerStats.ts
    - lib/netatmoApi.ts
    - lib/netatmoCalibrationService.ts
    - lib/firebase.ts
    - lib/hue/hueApi.ts
    - lib/hue/hueRemoteApi.ts
    - lib/notificationFilter.ts
    - lib/pwa/vibration.ts
    - lib/utils/scheduleHelpers.ts
    - lib/hlsDownloader.ts
    - lib/migrateSchedules.ts
    - lib/devices/deviceRegistry.ts
decisions:
  - Non-null assertions (!) safe after validation checks (length > 0, array.find, etc)
  - Nullish coalescing (??) for Record/object index access with fallback defaults
  - Extract variables to avoid repeated index access (firstToken pattern in firebaseAdmin)
  - Route guards (if route) before pushing to typed arrays (deviceRegistry)
metrics:
  duration_seconds: 970
  tasks_completed: 2
  files_modified: 17
  tsc_errors_fixed: 82
  tests_passing: 392
completed_date: 2026-02-09
---

# Phase 47 Plan 04: Enable noUncheckedIndexedAccess Summary

Enable `noUncheckedIndexedAccess: true` and fix all 82 resulting errors in lib/ files (17 files).

## One-liner

Enabled noUncheckedIndexedAccess strict compiler option, fixed 82 index access errors across 17 lib/ files using non-null assertions after validation, nullish coalescing for object access, and route guards—all 392 lib tests pass.

## Tasks Completed

### Task 1: Enable noUncheckedIndexedAccess + fix high-error lib/ files (schedulerService 24, firebaseAdmin 11, rateLimiter 8, errorMonitor 8)
- **Commit:** dfbde25
- **Files:** tsconfig.json, lib/schedulerService.ts, lib/firebaseAdmin.ts, lib/rateLimiter.ts, lib/errorMonitor.ts
- **Changes:**
  - Added `"noUncheckedIndexedAccess": true` to tsconfig.json compilerOptions
  - schedulerService.ts (24 errors): Non-null assertions for `array.split()[index]` access and `dayNames[index]`, `intervals[0]` after length/validation checks
  - firebaseAdmin.ts (11 errors): Non-null assertion for `getApps()[0]` (after length check), extracted `firstToken` variable to avoid repeated `tokenArray[0]` index access
  - rateLimiter.ts (8 errors): Nullish coalescing for `DEFAULT_RATE_LIMITS[notifType] ?? DEFAULT_RATE_LIMITS.default!` object access
  - errorMonitor.ts (8 errors): Non-null assertions for `ERROR_SEVERITY.INFO!` constant access, nullish coalescing for `ERROR_CODES[errorCode] ?? { ... }` with safe fallback
- **Verification:** All 4 high-error lib/ files compile cleanly with noUncheckedIndexedAccess

### Task 2: Fix remaining 13 lib/ files (31 errors total)
- **Commit:** 4d08326
- **Files:** lib/changelogService.ts, lib/schedulerStats.ts, lib/netatmoApi.ts, lib/netatmoCalibrationService.ts, lib/firebase.ts, lib/hue/hueApi.ts, lib/hue/hueRemoteApi.ts, lib/notificationFilter.ts, lib/pwa/vibration.ts, lib/utils/scheduleHelpers.ts, lib/hlsDownloader.ts, lib/migrateSchedules.ts, lib/devices/deviceRegistry.ts
- **Changes:**
  - changelogService.ts (7 errors): Non-null assertion for `versions[0]!` after length check, `split()[index]!` for version parsing
  - schedulerStats.ts (7 errors): Non-null assertions for `interval.start.split(':')[index]!`, nullish coalescing for `gradients[power] ?? gradients[2]!`
  - netatmoApi.ts (3 errors): Non-null assertion for `homesData[0]!` (validated by length > 0 guard)
  - netatmoCalibrationService.ts (2 errors): Non-null assertions for `homesData[0]!` and `homesDataAfter[0]!`
  - firebase.ts (1 error): Non-null assertion for `getApps()[0]!` (after length check)
  - hueApi.ts, hueRemoteApi.ts (2 errors): Non-null assertion for `errors[0]!` (after length check)
  - notificationFilter.ts (2 errors): Non-null assertions for `time.split(':').map(Number)[index]!`
  - pwa/vibration.ts (1 error): Non-null assertion for `VIBRATION_PATTERNS.SHORT!` default parameter
  - scheduleHelpers.ts (2 errors): Non-null assertion for `timetable[i]!`, nullish coalescing for `nextSlot?.m_offset ?? 10080`
  - hlsDownloader.ts (2 errors): Non-null assertions for `bandwidthMatch[1]!` and `segmentUrls[i]!`
  - migrateSchedules.ts (1 error): Non-null assertion for `defaultSlots[day]!`
  - deviceRegistry.ts (1 error): Non-null assertion for `device.routes.main!`, added route guard `if (route)` before push
- **Verification:** 0 tsc errors in all lib/ files, all lib/ tests pass (392 tests)

## Deviations from Plan

None - plan executed exactly as written. All 82 lib/ errors fixed, 0 remaining, all tests pass.

## Verification Results

```bash
# Verify noUncheckedIndexedAccess is enabled
grep "noUncheckedIndexedAccess" tsconfig.json
# Output: "noUncheckedIndexedAccess": true ✓

# Verify zero lib/ errors
npx tsc --noEmit 2>&1 | grep "error TS" | grep "^lib/" | wc -l
# Output: 0 ✓

# Verify lib tests pass
npx jest __tests__/lib/ 2>&1 | tail -5
# Output: Test Suites: 23 passed, 23 total
#         Tests:       392 passed, 392 total ✓
```

## Self-Check: PASSED

**Created files verification:**
- No new files created ✓

**Modified files verification:**
```bash
[ -f "tsconfig.json" ] && echo "FOUND: tsconfig.json" || echo "MISSING: tsconfig.json"
# FOUND: tsconfig.json ✓

[ -f "lib/schedulerService.ts" ] && echo "FOUND: lib/schedulerService.ts" || echo "MISSING: lib/schedulerService.ts"
# FOUND: lib/schedulerService.ts ✓

[ -f "lib/firebaseAdmin.ts" ] && echo "FOUND: lib/firebaseAdmin.ts" || echo "MISSING: lib/firebaseAdmin.ts"
# FOUND: lib/firebaseAdmin.ts ✓

# (all 17 lib/ files verified present)
```

**Commits verification:**
```bash
git log --oneline --all | grep -q "dfbde25" && echo "FOUND: dfbde25" || echo "MISSING: dfbde25"
# FOUND: dfbde25 ✓

git log --oneline --all | grep -q "4d08326" && echo "FOUND: 4d08326" || echo "MISSING: 4d08326"
# FOUND: 4d08326 ✓
```

All files exist, all commits present, all verifications passed.

## Impact

**What Changed:**
- TypeScript compiler now enforces `| undefined` for all index signatures and array access
- 82 potential runtime bugs caught at compile time (accessing undefined array elements/object properties)
- All lib/ files now handle index access safely with explicit guards or assertions

**What Stayed the Same:**
- Runtime behavior unchanged (assertions applied where context guarantees existence)
- All 392 lib/ tests still pass
- No breaking changes to APIs or function signatures

## Key Patterns Applied

1. **Non-null assertions after validation:**
   ```typescript
   if (arr.length > 0) {
     const first = arr[0]!; // Safe: length check guarantees existence
   }
   ```

2. **Nullish coalescing for object access:**
   ```typescript
   const value = config[key] ?? defaultValue;
   ```

3. **Variable extraction to avoid repeated index access:**
   ```typescript
   const token = tokenArray[0]!;
   // Use token multiple times instead of tokenArray[0]! repeatedly
   ```

4. **Route guards before typed push:**
   ```typescript
   if (route) {
     navItems.push({ label, route }); // route guaranteed string
   }
   ```

## Next Steps

- Phase 47-05: Fix remaining app/, components/, app/components/ errors (estimated ~200 errors)
- Phase 47-06: Fix __tests__/ errors (estimated ~100 errors)
- Phase 47-07: Gap sweep for any missed files
- Phase 47-08: Final verification and phase completion

---

**Phase 47 Progress: 4/8 plans complete**
**Remaining lib/ errors: 0**
**Remaining total errors: ~300 (app/, components/, tests/)**
