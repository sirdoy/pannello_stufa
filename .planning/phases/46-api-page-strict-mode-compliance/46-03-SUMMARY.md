---
phase: 46-api-page-strict-mode-compliance
plan: 03
subsystem: pages-hooks-misc
tags: [strict-mode, typescript, error-handling, type-safety]
dependency_graph:
  requires: [46-02]
  provides: [strict-compliant-misc-pages, strict-compliant-hooks]
  affects: [scenes-page, notification-history, camera-pages, log-page, hooks, settings-pages]
tech_stack:
  added: []
  patterns:
    - "instanceof Error checks for catch blocks"
    - "keyof typeof guards for dynamic object access"
    - "as const for literal type preservation"
    - "@ts-expect-error for untyped external modules"
    - "Non-null assertions after redirect guards"
    - "Nullish coalescing for undefined/null conversion"
key_files:
  created: []
  modified:
    - app/lights/scenes/page.tsx
    - app/settings/notifications/history/page.tsx
    - app/(pages)/camera/CameraDashboard.tsx
    - app/(pages)/camera/events/CameraEventsPage.tsx
    - app/log/page.tsx
    - app/hooks/useContextMenuLongPress.ts
    - app/hooks/useLongPress.ts
    - app/thermostat/page.tsx
    - app/settings/page.tsx
    - app/settings/notifications/page.tsx
    - app/page.tsx
    - eslint.config.ts
decisions:
  - "Use @ts-expect-error for useNotificationPreferences import (no type definitions)"
  - "Use as const for modeConfig colorScheme to preserve literal types"
  - "Type React event handlers explicitly (React.TouchEvent, React.MouseEvent)"
  - "Convert undefined to null with ?? null pattern for component props"
metrics:
  duration: 1250s
  completed: 2026-02-09T13:34:57Z
  tasks_completed: 2
  files_modified: 12
  errors_fixed: 33
---

# Phase 46 Plan 03: Miscellaneous Pages and Hooks Summary

**One-liner:** Fixed 33 strict-mode errors across 12 files including scenes page, notification history, camera pages, log page, hooks, and settings pages.

## Tasks Completed

### Task 1: Fix scenes page (12) and notification history page (10) errors

**Status:** ✅ Completed
**Commit:** c311c27 (partial - scenes/history already fixed in prior session)

**Scenes Page (app/lights/scenes/page.tsx) - 12 errors:**
- Typed handleActivateScene, handleCreateScene, handleUpdateScene parameters
- Added instanceof Error checks for 5 catch blocks (lines 98, 128, 160, 186, 210)
- Added null guard for deleteConfirm in handleDeleteSceneConfirmed
- Provided fallback values for scene.metadata?.name (undefined -> 'Scena')

**Notification History Page (app/settings/notifications/history/page.tsx) - 10 errors:**
- Defined NotificationHistoryRow interface for DataTable
- Typed all column cell getValue parameters with explicit types
- Added keyof typeof type guards for variants and labels object access
- Typed getRowId and renderExpandedContent callbacks with proper row types

**Note:** These files appeared to already be fixed in a previous session, but the fixes were verified and match the plan requirements.

### Task 2: Fix camera pages (6), log page (3), hooks (3), and single-error files (5)

**Status:** ✅ Completed
**Commits:** c311c27, f3399af

**Camera Pages:**

*app/(pages)/camera/CameraDashboard.tsx - 3 errors:*
- Added instanceof Error checks for catch blocks (lines 98, 105)
- Added ?? '' for NETATMO_CAMERA_API.getLiveStreamUrl (line 313 - returns string | null)
- Added ?? '' for snapshotUrls null handling in poster prop

*app/(pages)/camera/events/CameraEventsPage.tsx - 3 errors:*
- Typed getCameraForEvent parameter as ParsedEvent
- Typed stripHtml parameter as string
- Converted undefined to null for EventPreviewModal camera prop (line 376)

**Log Page (app/log/page.tsx) - 3 errors:**
- Changed formatDate signature to accept string | number
- Added undefined guard for DEVICE_CONFIG access with keyof typeof (line 116)
- Added keyof typeof type guard for colorMap access (line 129)

**Hooks:**

*app/hooks/useContextMenuLongPress.ts - 2 errors:*
- Typed handleLongPress event as React.TouchEvent | React.MouseEvent
- Typed meta parameter with context object shape

*app/hooks/useLongPress.ts - 1 error:*
- Typed handleTouchStart parameter as React.TouchEvent

**Single-Error Files:**

*app/thermostat/page.tsx:*
- Added keyof typeof guard for modeConfig access (line 483)
- Added 'as const' to colorScheme values for literal type preservation (line 489)

*app/settings/page.tsx:*
- Typed handleTabChange value parameter as string

*app/settings/notifications/page.tsx:*
- Added @ts-expect-error for useNotificationPreferences import (no type definitions)

*app/page.tsx:*
- Added non-null assertion for session after redirect guard (safe because redirect exits)

*eslint.config.ts:*
- Added @ts-expect-error for eslint-plugin-tailwindcss import (no type definitions)

## Verification

**Before:** 33 strict-mode TypeScript errors across 12 files
**After:** 0 errors in all plan files

```bash
npx tsc --noEmit 2>&1 | grep -E "(scenes/page|history/page|camera/|log/page|hooks/use|thermostat/page|settings/(page|notifications/page)|app/page\.tsx|eslint\.config)" | grep -v "\.test\." | wc -l
# Result: 0
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing null coalescing for getLiveStreamUrl**
- **Found during:** Task 2 verification
- **Issue:** NETATMO_CAMERA_API.getLiveStreamUrl returns string | null but HlsPlayer src expects string
- **Fix:** Added ?? '' to convert null to empty string (line 313)
- **Files modified:** app/(pages)/camera/CameraDashboard.tsx
- **Commit:** f3399af

**2. [Rule 1 - Bug] Type mismatch for Button colorScheme**
- **Found during:** Task 2 verification
- **Issue:** modeConfig colorScheme values were inferred as string, but Button expects literal union
- **Fix:** Added 'as const' to each colorScheme value to preserve literal types
- **Files modified:** app/thermostat/page.tsx
- **Commit:** f3399af

**Rationale:** Both issues were blocking the plan's success criteria (zero tsc errors). They were discovered during final verification and fixed immediately using Rule 1 (auto-fix bugs).

## Pattern Observations

1. **instanceof Error pattern is universal** - Used in all catch blocks across all files for proper unknown error handling

2. **keyof typeof pattern for dynamic access** - Essential for strict-mode compliance when accessing object properties with string keys

3. **@ts-expect-error for legacy/untyped dependencies** - Pragmatic approach for external modules without type definitions (useNotificationPreferences, eslint-plugin-tailwindcss)

4. **as const for config objects** - Preserves literal types for variant props and prevents string widening

5. **Nullish coalescing hierarchy:**
   - undefined → null: Use `?? null` for component props that expect null
   - null → '': Use `?? ''` for string props that don't accept null
   - Guard before access: Use `value ? obj[value] : undefined` for optional keys

6. **React event types should be explicit** - Don't rely on inference for event handler parameters; specify React.TouchEvent, React.MouseEvent, etc.

## Impact

**Code Quality:**
- 12 files now fully strict-mode compliant
- All error handling properly typed with instanceof Error checks
- All dynamic object access protected with type guards
- All React event handlers explicitly typed

**Type Safety:**
- Eliminated 33 implicit any types and unsafe operations
- All function parameters explicitly typed
- All component prop types matched exactly

**Developer Experience:**
- Clear error messages instead of runtime failures
- IntelliSense works correctly for all typed parameters
- Safer refactoring with full type coverage

## Self-Check

Verifying all claimed changes:

```bash
# Check files exist and were modified
git log --oneline -3 -- "app/(pages)/camera/CameraDashboard.tsx"
git log --oneline -3 -- "app/(pages)/camera/events/CameraEventsPage.tsx"
git log --oneline -3 -- app/log/page.tsx
git log --oneline -3 -- app/hooks/useContextMenuLongPress.ts
git log --oneline -3 -- app/hooks/useLongPress.ts
git log --oneline -3 -- app/thermostat/page.tsx
git log --oneline -3 -- app/settings/page.tsx
git log --oneline -3 -- app/settings/notifications/page.tsx
git log --oneline -3 -- app/page.tsx
git log --oneline -3 -- eslint.config.ts
```

**Result:** All files modified in commits c311c27 and f3399af ✅

**Self-Check: PASSED**

All files exist, all commits present, zero tsc errors in plan files confirmed.
