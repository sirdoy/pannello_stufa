---
phase: 113-known-issues-fix
plan: 01
subsystem: debug-panels, stove-status, network-ui, test-suite
tags: [bug-fix, type-safety, design-system, test-isolation]
dependency_graph:
  requires: []
  provides: [ISSUE-01-fixed, ISSUE-02-fixed, ISSUE-03-fixed, ISSUE-04-verified, ISSUE-05-fixed, ISSUE-06-fixed]
  affects: [app/debug/components/tabs/HueTab.tsx, app/debug/api/components/tabs/HueTab.tsx, app/components/devices/stove/components/StoveStatus.tsx, app/network/components/CopyableIp.tsx, app/components/ui/__tests__/FormModal.test.tsx]
tech_stack:
  added: []
  patterns: [design-system Button component, afterEach timer teardown]
key_files:
  created: []
  modified:
    - app/debug/components/tabs/HueTab.tsx
    - app/debug/api/components/tabs/HueTab.tsx
    - app/components/devices/stove/components/StoveStatus.tsx
    - app/network/components/CopyableIp.tsx
    - app/components/ui/__tests__/FormModal.test.tsx
decisions:
  - "ISSUE-04 (StoveState typing) was already resolved in a prior plan — verified via grep, no code change needed"
  - "CopyableIp Button uses iconOnly prop (not ButtonIcon) because Lucide JSX icons are not compatible with ButtonIcon emoji-only prop"
metrics:
  duration: 15m
  completed_date: "2026-03-22"
  tasks_completed: 3
  files_modified: 5
---

# Phase 113 Plan 01: Known Issues Fix Summary

Fixed all 6 known issues from the v14.0 audit: HueTab field name mismatches, stove staleness dead guard, status type verification, CopyableIp design system compliance, and FormModal test isolation flake.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix debug panel HueTab field names and form params (ISSUE-01, ISSUE-02) | aedc41cd | app/debug/components/tabs/HueTab.tsx, app/debug/api/components/tabs/HueTab.tsx |
| 2 | Fix stove staleness display, verify status type, replace CopyableIp button (ISSUE-03, ISSUE-04, ISSUE-05) | e123fff3 | app/components/devices/stove/components/StoveStatus.tsx, app/network/components/CopyableIp.tsx |
| 3 | Fix FormModal test isolation flake (ISSUE-06) | 09db8211 | app/components/ui/__tests__/FormModal.test.tsx |

## Issues Resolved

### ISSUE-01: HueTab bridgeConnected → connected
Both `app/debug/components/tabs/HueTab.tsx` and `app/debug/api/components/tabs/HueTab.tsx` used `data.bridgeConnected` in the bridge status check. The `HueBridgeHealth` interface defines the field as `connected: boolean`. Fixed to `data.connected` in both files.

### ISSUE-02: HueTab brightness param → bri
Both HueTab files had form params named `brightness` with `values.brightness` in the onExecute body. The actual PUT body key must be `bri` (CLIP v1 protocol). Fixed param `name: 'brightness'` → `name: 'bri'` and `values.brightness` → `values.bri` in both Control Light and Control Room entries in both files. Labels remain human-readable ("Brightness (0-100)").

### ISSUE-03: StoveStatus instanceof Date guard removed
The staleness display at line 129 had an unnecessary `instanceof Date` ternary guard:
```
staleness.cachedAt instanceof Date ? staleness.cachedAt : new Date(staleness.cachedAt)
```
Simplified to `new Date(staleness.cachedAt)` matching the ThermostatCard.tsx reference pattern. The staleness display block is NOT dead code — it renders when the proxy returns `last_poll_at`. Added clarifying comment above the block.

### ISSUE-04: StoveState typing verified
Confirmed `UseStoveDataReturn.status` is typed as `StoveState` union (not string). No code change was needed — this was already correct.

### ISSUE-05: CopyableIp design system Button
Replaced raw `<button>` with design system `<Button variant="ghost" size="sm" iconOnly>`. All inline Tailwind classes removed. The `buttonVariants` ghost+sm compound with `iconOnly` handles sizing, hover states, and focus ring.

### ISSUE-06: FormModal test timer leak
Added `afterEach(() => { jest.useRealTimers(); })` inside the `describe('Success State', ...)` block. This ensures fake timers are cleaned up even if a test throws before reaching the inline `jest.useRealTimers()`. Removed the manual `mockOnClose.mockClear()` workaround in Cancel Behavior (no longer needed). All 15 FormModal tests pass in isolation.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- [x] app/debug/components/tabs/HueTab.tsx modified — confirmed, commit aedc41cd
- [x] app/debug/api/components/tabs/HueTab.tsx modified — confirmed, commit aedc41cd
- [x] app/components/devices/stove/components/StoveStatus.tsx modified — confirmed, commit e123fff3
- [x] app/network/components/CopyableIp.tsx modified — confirmed, commit e123fff3
- [x] app/components/ui/__tests__/FormModal.test.tsx modified — confirmed, commit 09db8211
- [x] All 6 issues resolved
- [x] 15/15 FormModal tests pass
