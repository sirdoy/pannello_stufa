---
phase: quick-19
plan: 01
type: summary
subsystem: ui-controls
tags: [refactor, mobile-ux, controls]
dependency_graph:
  requires: []
  provides:
    - "Device cards without long-press mobile triggers"
    - "ControlButton with simple click-only behavior"
  affects:
    - app/components/ui/DeviceCard.tsx
    - app/components/devices/stove/StoveCard.tsx
    - app/components/ui/ControlButton.tsx
tech_stack:
  removed:
    - useLongPress hook (long-press repeat behavior)
    - useContextMenuLongPress hook (mobile long-press context menu)
  patterns:
    - "Simple onClick for control buttons (no repeat-on-hold)"
    - "Desktop-only right-click context menus (Radix native)"
key_files:
  modified:
    - app/components/ui/DeviceCard.tsx
    - app/components/devices/stove/StoveCard.tsx
    - app/components/ui/ControlButton.tsx
    - app/components/ui/__tests__/ControlButton.test.tsx
    - app/debug/design-system/page.tsx
  deleted:
    - app/hooks/useLongPress.ts
    - app/hooks/useContextMenuLongPress.ts
    - app/hooks/__tests__/useLongPress.test.ts
decisions: []
metrics:
  duration_minutes: 4.65
  completed_date: 2026-02-10
---

# Quick Task 19: Remove Long-Press from Monitoring Cards

Removed all long-press functionality from mobile to prevent accidental triggers and conflicts with native OS gestures. Desktop right-click context menus preserved via Radix.

## What Was Done

### Task 1: Remove Context-Menu Long-Press (Commit 2f579f4)
- Removed `useContextMenuLongPress` hook import and usage from DeviceCard
- Removed `longPressPreventSelection` and scale transform animation
- Removed `CSSProperties` import (no longer needed)
- Removed `useContextMenuLongPress` hook from StoveCard
- Removed `contextMenuOpen` state (unused after removal)
- Removed long-press handlers and transform styles from status display
- Deleted `app/hooks/useContextMenuLongPress.ts`
- Deleted `app/hooks/__tests__/useLongPress.test.ts` (hook deleted in Task 2)
- Cleaned unused import from design-system page
- **RightClickMenu preserved**: Desktop right-click still works via Radix on all cards

### Task 2: Replace ControlButton Long-Press (Commit ed4689f)
- Removed `useLongPress` hook import
- Removed props: `longPressDelay`, `longPressInterval`, `haptic`
- Replaced long-press event handlers with simple `onClick`
- Deleted `app/hooks/useLongPress.ts`
- Updated tests:
  - Removed Long Press Behavior tests (4 tests deleted)
  - Removed Haptic Feedback tests (2 tests deleted)
  - Updated onChange tests to use `fireEvent.click` (5 tests updated)
  - Updated legacy onClick test to use `fireEvent.click`
- **All 36 ControlButton tests pass**

## Deviations from Plan

None - plan executed exactly as written.

## Key Changes

| Component | Before | After |
|-----------|--------|-------|
| DeviceCard | Long-press triggers context menu on mobile | Desktop right-click only (Radix) |
| StoveCard | Long-press + scale animation on status box | Desktop right-click only (Radix) |
| ControlButton | Long-press repeats value changes | Single tap/click only |

## Testing

- ControlButton: 36 tests pass (6 tests removed, 5 updated to click)
- TypeScript: Compiles cleanly (pre-existing errors unrelated)
- Grep verification: Zero remaining `useLongPress`, `useContextMenuLongPress`, `longPressDelay`, `longPressInterval` references

## Files Summary

**Modified (5 files):**
- `app/components/ui/DeviceCard.tsx` - Removed context menu long-press
- `app/components/devices/stove/StoveCard.tsx` - Removed context menu long-press
- `app/components/ui/ControlButton.tsx` - Replaced long-press with simple click
- `app/components/ui/__tests__/ControlButton.test.tsx` - Updated tests for click behavior
- `app/debug/design-system/page.tsx` - Removed unused import

**Deleted (3 files):**
- `app/hooks/useLongPress.ts` - No consumers after ControlButton change
- `app/hooks/useContextMenuLongPress.ts` - No consumers after card changes
- `app/hooks/__tests__/useLongPress.test.ts` - Hook deleted

## Impact

**User Experience:**
- No more accidental context menus on mobile from long-press
- No more repeat-on-hold for control buttons (clearer single-tap behavior)
- Desktop right-click menus still work (Radix native behavior)

**Code Quality:**
- 3 hook files deleted (155 lines removed)
- Simpler component logic (no long-press state management)
- Clearer test coverage (36 tests, all click-based)

## Self-Check: PASSED

**Files exist:**
- ✅ app/components/ui/DeviceCard.tsx
- ✅ app/components/devices/stove/StoveCard.tsx
- ✅ app/components/ui/ControlButton.tsx
- ✅ app/components/ui/__tests__/ControlButton.test.tsx
- ✅ app/debug/design-system/page.tsx

**Files deleted:**
- ✅ app/hooks/useLongPress.ts (does not exist)
- ✅ app/hooks/useContextMenuLongPress.ts (does not exist)
- ✅ app/hooks/__tests__/useLongPress.test.ts (does not exist)

**Commits exist:**
- ✅ 2f579f4 (Task 1: Remove context-menu long-press)
- ✅ ed4689f (Task 2: Replace ControlButton long-press)

**Grep verification:**
- ✅ Zero matches for `useLongPress` in app/
- ✅ Zero matches for `useContextMenuLongPress` in app/ (excluding backup files)
- ✅ Zero matches for `longPressDelay|longPressInterval` in app/components/

**Tests:**
- ✅ ControlButton tests: 36 passed, 36 total
