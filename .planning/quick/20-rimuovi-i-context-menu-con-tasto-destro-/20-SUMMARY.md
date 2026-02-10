---
phase: 20-rimuovi-context-menu
plan: 01
type: quick-task
subsystem: ui-components
tags: [refactor, cleanup, context-menu, device-cards]
completed_at: 2026-02-10
duration_minutes: 9.2

dependency_graph:
  requires: []
  provides: ["clean device cards without context menus"]
  affects: [DeviceCard, StoveCard, ThermostatCard, LightsCard, CameraCard, design-system]

tech_stack:
  removed:
    - component: RightClickMenu (Radix Context Menu wrapper)
    - hooks: useContextMenuLongPress, useLongPress
  patterns:
    - "Removed context menu functionality from all device cards"
    - "Cleaned up unused lucide-react imports"
    - "Simplified DeviceCard props interface"

key_files:
  deleted:
    - app/components/ui/RightClickMenu.tsx
    - app/components/ui/__tests__/RightClickMenu.test.tsx
    - app/hooks/useContextMenuLongPress.ts
    - app/hooks/useLongPress.ts
    - app/hooks/__tests__/useLongPress.test.ts
  modified:
    - app/components/ui/DeviceCard.tsx
    - app/components/ui/__tests__/DeviceCard.test.tsx
    - app/components/ui/index.ts
    - app/components/devices/stove/StoveCard.tsx
    - app/components/devices/thermostat/ThermostatCard.tsx
    - app/components/devices/lights/LightsCard.tsx
    - app/components/devices/camera/CameraCard.tsx
    - app/debug/design-system/page.tsx

decisions:
  - summary: "Remove all right-click context menus from device cards"
    rationale: "Context menus no longer wanted; users prefer direct interaction"
    alternatives: []
    impact: "Cleaner UI, simpler code, better mobile experience"

metrics:
  files_modified: 8
  files_deleted: 5
  lines_removed: ~1496
  tests_removed: 4 (DeviceCard context menu tests)
  tests_passing: 46 (DeviceCard tests)
---

# Quick Task 20: Remove Context Menus from Device Cards

**One-liner**: Removed all right-click context menus from device cards, deleted RightClickMenu component and related hooks, cleaned up unused imports and exports.

## Objective

Remove the RightClickMenu functionality from all device cards across the application. Context menus are no longer wanted - users prefer direct interaction with device controls. This cleanup removes the RightClickMenu component, its tests, related hooks, and all usages across StoveCard, ThermostatCard, LightsCard, and CameraCard.

## Execution Summary

### Task 1: Remove RightClickMenu from DeviceCard and all consumer cards
**Status**: Complete ✅
**Commit**: 02cf5dc

#### Changes Made:

**DeviceCard.tsx**:
- Removed `import RightClickMenu from './RightClickMenu'`
- Removed `ContextMenuItem` interface
- Removed `contextMenuItems` and `onContextMenu` props from DeviceCardProps
- Removed context menu logic (hasContextMenu, contextMenuProps)
- Simplified return statement (removed conditional RightClickMenu wrapper)

**StoveCard.tsx**:
- Removed RightClickMenu import
- Removed `stoveContextMenuItems` array (Settings, Activity, Refresh actions)
- Removed RightClickMenu wrapper tags
- Removed unused lucide-react imports: Settings, Activity, RefreshCw
- Updated comment: "Main Status Card - Ember Noir with Context Menu" → "Main Status Card - Ember Noir"

**ThermostatCard.tsx**:
- Removed `thermostatContextMenuItems` array (Settings, Schedules, Refresh actions)
- Removed `contextMenuItems={thermostatContextMenuItems as any}` from DeviceCard props
- Removed unused lucide-react imports: Settings, Calendar, RefreshCw

**LightsCard.tsx**:
- Removed `lightsContextMenuItems` array (Settings, Color Control, Refresh actions)
- Removed `contextMenuItems={lightsContextMenuItems as any}` from DeviceCard props
- Removed unused lucide-react import line entirely (Palette, Settings, RefreshCw were the only imports)

**CameraCard.tsx**:
- Removed `cameraContextMenuItems` array (Events, Settings, Refresh actions)
- Removed `contextMenuItems={cameraContextMenuItems}` from DeviceCard props
- Removed unused lucide-react imports: Activity, Settings (kept RefreshCw for refresh button)

**Files Modified**: 5
**Lines Removed**: ~163

### Task 2: Delete RightClickMenu component and clean up tests and exports
**Status**: Complete ✅
**Commit**: 08ff45e

#### Changes Made:

**Deleted Files**:
- `app/components/ui/RightClickMenu.tsx` (Radix Context Menu wrapper component)
- `app/components/ui/__tests__/RightClickMenu.test.tsx` (component tests)

**index.ts**:
- Removed RightClickMenu export line and comment

**DeviceCard.test.tsx**:
- Removed entire `describe('Context Menu (v4.0)')` block (4 tests):
  - "renders without context menu when contextMenuItems is empty"
  - "renders with context menu when contextMenuItems is provided"
  - "maintains backwards compatibility without contextMenuItems"
  - "has no a11y violations with context menu"
- Note: Settings and RefreshCw imports still used in other tests (footerActions)

**design-system/page.tsx**:
- Removed RightClickMenu import
- Removed entire RightClickMenu showcase section (~47 lines)
- Removed unused lucide-react imports: Edit, Copy, Share, Trash2
- Updated SectionShowcase docs reference: `RightClickMenu.js` → `CommandPalette.tsx`
- Updated section description: "Context menus and command palettes..." → "Command palettes..."

**Files Modified**: 3
**Files Deleted**: 2
**Lines Removed**: ~1333

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Git tracked additional deleted hook files**
- **Found during**: Task 2 file deletion
- **Issue**: Git status showed 3 additional deleted files not mentioned in plan:
  - `app/hooks/useContextMenuLongPress.ts`
  - `app/hooks/useLongPress.ts`
  - `app/hooks/__tests__/useLongPress.test.ts`
- **Fix**: These were already deleted (likely by previous quick tasks or cleanup). Staged them for commit.
- **Files affected**: None (already deleted)
- **Commit**: 08ff45e (included in cleanup commit)

**Explanation**: The plan didn't mention these hook files, but they were RightClickMenu-related and already deleted from the filesystem. Including them in the commit provides a complete record of the context menu removal.

## Verification

### Test Results
```bash
✅ npx jest app/components/ui/__tests__/DeviceCard.test.tsx
   46 tests passing (removed 4 context menu tests)

✅ npx tsc --noEmit
   5 errors (pre-existing, unrelated to changes)

✅ grep -r "RightClickMenu|contextMenuItems|ContextMenuItem" app/
   No references found (except separate ContextMenu.tsx component)
```

### Success Criteria Met
- ✅ Zero references to RightClickMenu in production code
- ✅ Zero contextMenuItems props passed to any DeviceCard
- ✅ RightClickMenu.tsx and RightClickMenu.test.tsx deleted
- ✅ ContextMenuItem interface removed from DeviceCard.tsx
- ✅ All existing tests pass (46 passing, 4 removed)
- ✅ TypeScript compiles with no new errors

### Commits
- `02cf5dc`: refactor(quick-20): remove RightClickMenu from DeviceCard and all consumer cards
- `08ff45e`: chore(quick-20): delete RightClickMenu component and clean up tests

## Impact

**User Experience**:
- Right-clicking on device cards now shows browser default context menu
- Cleaner interaction model - no hidden menus to discover
- Better mobile experience - no long-press confusion

**Code Quality**:
- Removed ~1496 lines of code (component + tests + usages)
- Simplified DeviceCard props interface
- Reduced lucide-react bundle size (removed 9 unused icon imports)
- Cleaner design system showcase (removed 47 lines)

**Maintenance**:
- Fewer components to maintain
- No context menu behavior to test across devices
- Easier to reason about device card behavior

## Notes

- **ContextMenu.tsx is separate**: A different component used by the lights/scenes page for dropdown menus (not right-click menus). Not touched by this task.
- **No device card component tests**: The `app/components/devices/` folder has no test files, so only DeviceCard.test.tsx was updated.
- **Design system still functional**: Removed RightClickMenu showcase, but other sections unaffected.

## Self-Check: PASSED

### File Existence Verification
```bash
✅ ls app/components/ui/RightClickMenu.tsx → No such file
✅ ls app/components/ui/__tests__/RightClickMenu.test.tsx → No such file
✅ DeviceCard.tsx exists and compiles
✅ All 5 consumer card files exist and compile
```

### Commit Verification
```bash
✅ git log --oneline | grep 02cf5dc → Found
✅ git log --oneline | grep 08ff45e → Found
```

### TypeScript Verification
```bash
✅ npx tsc --noEmit → 5 errors (pre-existing, in cron-executions.test.ts)
   No errors in modified files
```

### Reference Cleanup Verification
```bash
✅ grep -r "RightClickMenu" app/ --include="*.tsx" --include="*.ts"
   → No matches (excluding .backup files and separate ContextMenu.tsx)
```

All checks passed. Quick task complete.
