---
phase: 36-application-integration
plan: 01
subsystem: ui-components
tags: [quick-actions, context-menu, device-cards, radix-ui]
depends_on:
  requires: [32-01]
  provides: [context-menu-on-all-device-cards, quick-action-buttons]
  affects: [36-02, 36-03, 36-04]
tech-stack:
  added: []
  patterns: [RightClickMenu wrapper, useContextMenuLongPress hook, Button.Icon quick actions]
key-files:
  created: []
  modified:
    - app/components/ui/DeviceCard.js
    - app/components/ui/__tests__/DeviceCard.test.js
    - app/components/devices/stove/StoveCard.js
    - app/components/devices/thermostat/ThermostatCard.js
    - app/components/devices/lights/LightsCard.js
    - app/components/devices/camera/CameraCard.js
decisions:
  - Quick actions positioned below status display for immediate visibility
  - Context menu items include settings, specialized pages, and refresh
  - Power toggle variant changes based on device state (ember when on)
  - Temperature/brightness controls use +/- pattern with current value display
metrics:
  duration: 6m 30s
  completed: 2026-02-05
---

# Phase 36 Plan 01: Device Card Quick Actions & Context Menu Summary

**One-liner:** Quick action icon buttons and right-click/long-press context menus on all device cards using RightClickMenu wrapper and Button.Icon pattern.

## Completed Tasks

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Add Context Menu Wrapper to DeviceCard | 43493e0 | DeviceCard.js, DeviceCard.test.js |
| 2 | Add Quick Actions and Context Menu to StoveCard | bd68bf3 | StoveCard.js |
| 3 | Add Quick Actions and Context Menu to ThermostatCard, LightsCard, CameraCard | 87356f6 | ThermostatCard.js, LightsCard.js, CameraCard.js |

## Implementation Details

### DeviceCard Context Menu Wrapper (Task 1)
- Added `contextMenuItems` and `onContextMenu` props to DeviceCard v4.0 API
- Imported RightClickMenu and useContextMenuLongPress hook
- Card content conditionally wrapped with RightClickMenu when items provided
- Long-press triggers context menu on mobile with scale animation feedback (0.98)
- Maintains full backwards compatibility when contextMenuItems not provided
- Added tests verifying context menu integration and accessibility

### StoveCard Quick Actions (Task 2)
- Power toggle button (ember when on, subtle when off)
- Power level +/- controls (visible only in WORK mode)
- Fan control button that scrolls to fan section (visible only in WORK mode)
- Added `data-control="fan"` attribute for scroll targeting
- Context menu: Impostazioni Stufa, Log Attivita, Aggiorna Stato
- Card wrapped with RightClickMenu for desktop and mobile support

### ThermostatCard Quick Actions (Task 3)
- Temperature +/- compact control with current setpoint display
- Mode cycle button (schedule/away/hg/off) with dynamic icon
- Context menu: Impostazioni Termostato, Programmazioni, Aggiorna
- Uses DeviceCard contextMenuItems prop

### LightsCard Quick Actions (Task 3)
- Power toggle button (ember when on)
- Brightness slider (visible when room is on) with sun icon
- Context menu: Impostazioni Luci, Controllo Colore, Aggiorna
- Uses DeviceCard contextMenuItems prop

### CameraCard Quick Actions (Task 3)
- Snapshot capture button
- Live/Snapshot toggle button (visible when camera is on)
- Context menu: Eventi Camera, Impostazioni, Aggiorna
- Uses DeviceCard contextMenuItems prop

## Patterns Applied

1. **RightClickMenu wrapper pattern**: Card content wrapped with RightClickMenu.Trigger + RightClickMenu.Content
2. **useContextMenuLongPress hook**: Single trigger for mobile context menu with haptic feedback
3. **Button.Icon quick actions**: All icon buttons have aria-label for accessibility
4. **Conditional visibility**: Controls shown based on device state (e.g., power +/- only in WORK mode)
5. **DeviceCard contextMenuItems prop**: Declarative context menu items passed to DeviceCard

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- [x] All quick action buttons visible in device cards
- [x] All Button.Icon components have aria-label
- [x] Context menus open on right-click (desktop)
- [x] Context menus open on long-press (mobile via hook)
- [x] Disabled states properly managed at boundaries
- [x] npm test passes for DeviceCard (50 tests)

## Success Criteria

- [x] QACT-01: Device cards have visible quick action icon buttons
- [x] QACT-02: Device cards support context menu on right-click/long-press
- [x] QACT-03: Quick actions are consistent across all device types
- [x] APPL-05: Context Menu on all device cards

## Next Phase Readiness

Ready for 36-02 (Command Palette Device Commands):
- All device cards now have context menu infrastructure
- Quick actions provide immediate device control
- Context menus provide extended navigation to settings/detail pages
