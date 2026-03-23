---
phase: 123
plan: 02
subsystem: rooms-ui
tags: [rooms, devices, assign, remove, tdd, form-modal, confirmation-dialog]
dependency_graph:
  requires: [123-01]
  provides: [room-device-assign, room-device-remove]
  affects: [app/rooms/[room_id]/page.tsx]
tech_stack:
  added: []
  patterns: [inline-hooks, zod-schema, controller-select, 404-close-modal-pattern]
key_files:
  created: []
  modified:
    - app/rooms/[room_id]/page.tsx
    - app/rooms/[room_id]/__tests__/page.test.tsx
decisions:
  - "handleAssign 404 calls toastError + closes modal (setShowAssign(false)) without throwing — FormModal must close on 404"
  - "useRegistryDevicesForSelect as inline hook matching rooms page pattern, errors silently (non-critical)"
  - "assignedIds Set computed from current devices to filter Select options before each render"
  - "DeviceAssignment.previous_room_id !== null check for conditional moved-from-another-room toast"
metrics:
  duration_minutes: 4
  completed_date: "2026-03-23"
  tasks_completed: 2
  files_modified: 2
requirements: [ROOM-06, ROOM-07]
---

# Phase 123 Plan 02: Assign and Remove Device Actions Summary

Assign device via FormModal with Select dropdown (filtered to exclude already-assigned devices) and remove device via ConfirmationDialog on the room detail page. Both mutations refetch device list and registry options. Conditional toast message when device is moved from another room.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Tests + useRegistryDevicesForSelect hook + assign device FormModal with Select + handleAssign | 3bde95c7 | app/rooms/[room_id]/page.tsx, __tests__/page.test.tsx |
| 2 | Tests + remove device ConfirmationDialog with handleRemove | 3bde95c7 | app/rooms/[room_id]/page.tsx, __tests__/page.test.tsx |

Note: Tasks 1 and 2 were committed together as a single cohesive implementation after verifying both RED and GREEN phases.

## Verification Results

```
Test Suites: 6 passed, 6 total
Tests:       60 passed, 60 total (20 room detail: 10 ROOM-05 + 6 ROOM-06 + 4 ROOM-07 + 40 rooms list page)
```

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — assign and remove are fully wired to real API endpoints.

## Self-Check: PASSED

- app/rooms/[room_id]/page.tsx: FOUND
- app/rooms/[room_id]/__tests__/page.test.tsx: FOUND
- Commit 3bde95c7: FOUND
