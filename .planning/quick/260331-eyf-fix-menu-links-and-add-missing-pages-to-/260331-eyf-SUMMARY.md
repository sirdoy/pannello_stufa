---
phase: quick
plan: 260331-eyf
subsystem: navigation, notifications
tags: [bugfix, dead-link, navbar]
dependency_graph:
  requires: []
  provides: [clean-navbar, valid-notification-urls]
  affects: [global-navigation, stove-health-notifications]
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - lib/devices/deviceTypes.ts
    - lib/notifications/notificationTriggers.ts
    - __tests__/lib/healthNotifications.test.ts
decisions: []
metrics:
  duration_seconds: 56
  completed: "2026-03-31T08:50:55Z"
  tasks_completed: 2
  tasks_total: 2
---

# Quick Task 260331-eyf: Fix Menu Links and Notification URLs Summary

Removed dead /monitoring navbar entry and redirected 3 stove health notification URLs to /stove.

## What Changed

### Task 1: Remove MONITORING from GLOBAL_SECTIONS and fix notification URLs
- Deleted the MONITORING entry from `GLOBAL_SECTIONS` in `lib/devices/deviceTypes.ts` (pointed to non-existent /monitoring page)
- Changed `url: '/monitoring'` to `url: '/stove'` in all 3 stove health notification triggers in `lib/notifications/notificationTriggers.ts`
- Commit: `180a1bea`

### Task 2: Update notification test assertions
- Updated `expect(type.url).toBe('/monitoring')` to `expect(type.url).toBe('/stove')` in `__tests__/lib/healthNotifications.test.ts`
- All 7 tests pass
- Commit: `ad2b9507`

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `grep -r "'/monitoring'" lib/` returns no results
- `grep "MONITORING" lib/devices/deviceTypes.ts` returns no results
- `npx jest __tests__/lib/healthNotifications.test.ts` - 7/7 tests pass

## Known Stubs

None.
