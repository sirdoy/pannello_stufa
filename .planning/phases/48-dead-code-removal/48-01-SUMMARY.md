---
phase: 48-dead-code-removal
plan: 01
subsystem: codebase-cleanup
tags: [dead-code-removal, knip, maintenance]
dependency_graph:
  requires: []
  provides: [clean-codebase, minimal-unused-files]
  affects: [build-performance, maintenance-overhead]
tech_stack:
  added: []
  patterns: [git-rm-for-history, knip-analysis]
key_files:
  created: []
  modified: []
  deleted:
    - app/components/StovePanel.tsx
    - app/components/VersionNotifier.tsx
    - app/components/devices/stove/GlassEffect.tsx
    - app/components/netatmo/NetatmoTemperatureReport.tsx
    - app/components/scheduler/DayAccordionItem.tsx
    - app/components/scheduler/DayScheduleCard.tsx
    - app/components/scheduler/index.ts
    - app/components/log/index.ts
    - app/debug/design-system/components/ComponentDemo.tsx
    - app/hooks/index.ts
    - components/notifications/NotificationFilters.tsx
    - components/notifications/NotificationInbox.tsx
    - components/notifications/NotificationItem.tsx
    - lib/logger.ts
    - lib/netatmoService.ts
    - lib/schedulesService.ts
    - lib/services/dashboardPreferencesService.ts
    - lib/repositories/ScheduleRepository.ts
    - lib/repositories/index.ts
    - lib/devices/index.ts
    - lib/hooks/useGeofencing.ts
    - lib/hooks/usePeriodicSync.ts
    - lib/hooks/usePWAInstall.ts
    - lib/hooks/useWakeLock.ts
    - lib/pwa/periodicSync.ts
    - types/components/common.ts
    - types/components/index.ts
    - types/config/constants.ts
    - types/config/index.ts
    - types/external-apis/index.ts
    - types/index.ts
    - docs/rollback/globals.v3.css
    - docs/rollback/tailwind.config.v3.js
    - fix-mocks-proper.mjs
    - fix-test-mocks.mjs
    - fix-test-types.mjs
    - scripts/migrate-log-devices.js
    - scripts/test-firebase-operations.js
    - scripts/test-firebase-rules.js
decisions:
  - "Used knip dependency analysis to identify unused files (not grep/manual search)"
  - "Excluded app/sw.ts and firebase-messaging-sw.js as runtime-loaded false positives"
  - "git rm preserves git history for deleted files (for archaeology if needed)"
metrics:
  duration: 276s
  completed: 2026-02-09
  tasks: 2
  files_deleted: 39
  loc_removed: 5702
---

# Phase 48 Plan 01: Remove Unused Files Summary

**One-liner:** Removed 39 unused files identified by knip analysis (deprecated components, barrel exports, legacy services, migration scripts) reducing codebase by 5,702 lines

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Delete unused source files | 369b0eb | 31 TypeScript source files |
| 2 | Delete unused scripts and doc files | 509f090 | 8 utility/script/doc files |

## What Was Done

### Task 1: Deleted Unused Source Files (31 files)

Removed unused TypeScript source files across 7 categories:

1. **Deprecated components** (2 files):
   - `app/components/StovePanel.tsx` - Replaced by StoveCard
   - `app/components/VersionNotifier.tsx` - Self-referencing only

2. **Unused components** (5 files):
   - `app/components/devices/stove/GlassEffect.tsx`
   - `app/components/netatmo/NetatmoTemperatureReport.tsx`
   - `app/components/scheduler/DayAccordionItem.tsx`
   - `app/components/scheduler/DayScheduleCard.tsx`
   - `app/debug/design-system/components/ComponentDemo.tsx`

3. **Unused barrel exports** (5 files):
   - `app/components/scheduler/index.ts`
   - `app/components/log/index.ts`
   - `app/hooks/index.ts`
   - `lib/devices/index.ts`
   - `lib/repositories/index.ts`

4. **Legacy notification components** (3 files):
   - `components/notifications/NotificationFilters.tsx`
   - `components/notifications/NotificationInbox.tsx`
   - `components/notifications/NotificationItem.tsx`
   - (Replaced by app/ versions)

5. **Unused services/hooks** (5 files):
   - `lib/logger.ts`
   - `lib/netatmoService.ts`
   - `lib/schedulesService.ts`
   - `lib/services/dashboardPreferencesService.ts`
   - `lib/repositories/ScheduleRepository.ts`

6. **Unused PWA hooks** (5 files):
   - `lib/hooks/useGeofencing.ts`
   - `lib/hooks/usePeriodicSync.ts`
   - `lib/hooks/usePWAInstall.ts`
   - `lib/hooks/useWakeLock.ts`
   - `lib/pwa/periodicSync.ts`

7. **Unused type barrels** (6 files):
   - `types/index.ts`
   - `types/components/common.ts`
   - `types/components/index.ts`
   - `types/config/constants.ts`
   - `types/config/index.ts`
   - `types/external-apis/index.ts`

**Verification:** Checked for imports from deleted type barrels - only self-referencing comments found, no actual imports from other files.

**Result:** Zero TypeScript compilation errors after deletion.

### Task 2: Deleted Unused Scripts and Doc Files (8 files)

Removed leftover utility files no longer needed:

1. **Rollback docs** (2 files):
   - `docs/rollback/globals.v3.css` - Pre-Tailwind v4 CSS
   - `docs/rollback/tailwind.config.v3.js` - Pre-Tailwind v4 config

2. **One-time migration scripts** (3 files):
   - `fix-mocks-proper.mjs` - v5.0 TypeScript migration
   - `fix-test-mocks.mjs` - v5.0 TypeScript migration
   - `fix-test-types.mjs` - v5.0 TypeScript migration

3. **Test/migration scripts** (3 files):
   - `scripts/migrate-log-devices.js` - Already executed
   - `scripts/test-firebase-operations.js` - Not part of test suite
   - `scripts/test-firebase-rules.js` - Not part of test suite

**Result:** knip now reports only 2 unused files (both known false positives):
- `app/sw.ts` - Referenced in next.config.ts as Serwist service worker
- `public/firebase-messaging-sw.js` - Loaded at runtime by PWA registration

## Verification Results

✅ **TypeScript compilation:** 0 errors
✅ **Knip unused files:** 2 (both known false positives used at runtime)
✅ **Files deleted:** 39 (31 source + 8 scripts/docs)
✅ **Lines removed:** 5,702 (4,285 from source + 1,417 from scripts/docs)
⚠️ **Tests:** 368 passed, 2 failed (pre-existing axe accessibility race condition in Accordion.test.tsx, unrelated to deletions)

## Deviations from Plan

None - plan executed exactly as written.

## Known Issues

The 2 failing tests in Accordion.test.tsx are pre-existing race conditions in jest-axe accessibility tests ("Axe is already running"). These failures exist in the main branch before our deletions and are unrelated to the files we removed.

## Self-Check: PASSED

**Files deleted verification:**
```bash
✓ DELETED: app/components/StovePanel.tsx
✓ DELETED: lib/logger.ts
✓ DELETED: lib/netatmoService.ts
✓ DELETED: types/index.ts
✓ DELETED: fix-mocks-proper.mjs
✓ DELETED: fix-test-mocks.mjs
✓ DELETED: fix-test-types.mjs
✓ DELETED: scripts/migrate-log-devices.js
```

**Commits exist:**
```bash
✓ FOUND: 369b0eb (Task 1 - Remove unused source files)
✓ FOUND: 509f090 (Task 2 - Remove unused scripts and doc files)
```

**TypeScript compilation:**
```bash
✓ PASSED: 0 tsc errors
```

**Knip unused files check:**
```bash
✓ PASSED: Only 2 files (app/sw.ts, public/firebase-messaging-sw.js - known false positives)
```

All verification checks passed successfully.
