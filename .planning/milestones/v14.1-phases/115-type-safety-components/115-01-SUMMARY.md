---
phase: 115-type-safety-components
plan: 01
subsystem: ui-components
tags: [type-safety, as-any, design-system, DeviceCard, Button, WeakSet]
dependency_graph:
  requires: [114-02]
  provides: [typed-DeviceCard-interfaces, widened-icon-props, clean-spreads]
  affects: [LightsCard, StoveCard, ThermostatCard, plan-02-consumers]
tech_stack:
  added: []
  patterns: [extends-component-props, WeakSet-tracking, satisfies-operator, instanceof-Error]
key_files:
  created: []
  modified:
    - app/components/ui/Button.tsx
    - app/components/ui/LoadingOverlay.tsx
    - app/components/ui/DeviceCard.tsx
    - app/components/ui/ControlButton.tsx
    - app/components/ui/ConfirmDialog.tsx
    - app/components/ui/Panel.tsx
    - app/components/ui/ErrorAlert.tsx
    - app/components/ui/BottomSheet.tsx
    - app/components/ui/FormModal.tsx
    - app/components/ui/__tests__/DeviceCard.test.tsx
decisions:
  - "ToastNotification extends Omit<ToastProps,'children'> with legacy message/type fields added for backward compat; render destructures them"
  - "InfoBoxItem aligned with InfoBoxProps (icon: string required, value: string|number) — all callers use emoji strings and numeric values"
  - "BottomSheet ActionButton variant changed from 'close' (untyped) to 'ghost' (typed, same styling) using satisfies operator"
  - "TransitionLink.tsx skipped — file does not exist in codebase (plan lists it but it was already migrated or never created)"
  - "DeviceCard test mock updated to match new children/variant interface instead of legacy message/type props"
metrics:
  duration: ~20min
  completed_date: "2026-03-22"
  tasks_completed: 2
  files_changed: 10
requirements: [TYPE-07, TYPE-08, TYPE-10, TYPE-11, TYPE-12]
---

# Phase 115 Plan 01: Design System Foundation Type Safety Summary

Zero `as any` in 9 UI component files — Button/LoadingOverlay icons widened to ReactNode, DeviceCard interfaces extend real component props, ControlButton uses WeakSet, empty spreads and modal spread antipatterns removed.

## What Was Built

### Task 1: Widen Icon Props + Restructure DeviceCard Interfaces

**Button.tsx:** `icon?: string` widened to `icon?: string | React.ReactNode`. JSDoc updated.

**LoadingOverlay.tsx:** `icon?: string` widened to `icon?: string | React.ReactNode`. React import added.

**DeviceCard.tsx (largest change):**
- Added imports: `BannerProps`, `ToastProps`, `ButtonProps`
- `StatusBadge` interface exported
- `BannerItem` replaced: now `export interface BannerItem extends BannerProps {}`
- `FooterAction` replaced: now `export interface FooterAction extends Omit<ButtonProps, 'children'> { label: string; }`
- `ToastNotification` replaced: now `export interface ToastNotification extends Omit<ToastProps, 'children'> { show: boolean; message?: string; type?: 'success'|'error'|'info'|'warning'; }`
- `InfoBoxItem` aligned with `InfoBoxProps` (icon: string required, value: string|number)
- All 5 `as any` casts removed from render section
- Toast render restructured to pass `variant` and `children` explicitly

**TransitionLink.tsx:** Skipped — file does not exist in codebase.

### Task 2: Fix Spread Patterns + ControlButton WeakSet

**ControlButton.tsx:** Module-level `const warnedFns = new WeakSet<(...args: unknown[]) => void>()` replaces the `(handlePress as any)._warned` function-property antipattern.

**ConfirmDialog.tsx:** `{...({} as any)}` removed from Card — no-op empty spread.

**Panel.tsx:** `{...({} as any)}` removed from Card — no-op empty spread.

**ErrorAlert.tsx:** `{...({} as any)}` removed from Banner — no-op empty spread.

**BottomSheet.tsx:** `{ icon: <X />, variant: "close", ... } as any` replaced with `{ icon: <X />, variant: 'ghost', ... } satisfies ActionButtonProps`. The `'close'` variant exists in the runtime object map but not the TypeScript union; `'ghost'` has identical styling.

**FormModal.tsx:** Modal spread `{...({ ref, isOpen, size, className, ...props } as any)}` replaced with explicit prop passing (`isOpen={isOpen} size={size} className={...} {...props}`). `ref` was dropped — Modal is not a forwardRef component. `(error as any)?.message` replaced with `error instanceof Error ? error.message : 'Invalid value'`.

**DeviceCard.test.tsx:** Toast mock updated to accept `{ children, variant, onClose }` matching the new DeviceCard render interface.

## Verification

Zero `as any` across all 9 modified UI component files. 181 tests pass (6 test suites).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DeviceCard test mock incompatible with new Toast render**
- **Found during:** Task 2 verification
- **Issue:** Toast mock expected `{ message, type, onClose }` props; new render passes `{ children, variant, onClose }`
- **Fix:** Updated mock to `{ children, variant, onClose }` and added React import
- **Files modified:** app/components/ui/__tests__/DeviceCard.test.tsx
- **Commit:** 2e2b0f4d

### Skipped Items

**1. TransitionLink.tsx** — File listed in plan but does not exist in codebase (`app/components/ui/TransitionLink.tsx` returns 404). No action taken; no `as any` to remove.

## Known Stubs

None — all interfaces fully typed, no placeholder data.

## Self-Check: PASSED

- Button.tsx: FOUND
- DeviceCard.tsx: FOUND
- ControlButton.tsx: FOUND
- FormModal.tsx: FOUND
- SUMMARY.md: FOUND
- Commit 4dd2f7bd: FOUND
- Commit 2e2b0f4d: FOUND
