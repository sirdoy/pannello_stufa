---
phase: 122-room-management-ui
plan: "02"
subsystem: rooms-ui
tags: [rooms, crud, form-modal, confirmation-dialog, zod, tdd]
dependency_graph:
  requires: [122-01]
  provides: [ROOM-02, ROOM-03, ROOM-04]
  affects: [app/rooms/page.tsx]
tech_stack:
  added: []
  patterns: [FormModal-render-prop, ConfirmationDialog-danger, Zod-schema-inline, throw-to-keep-modal-open, 204-no-json]
key_files:
  created: []
  modified:
    - app/rooms/page.tsx
    - app/rooms/__tests__/page.test.tsx
decisions:
  - FormModal render-prop typed with Control<RoomFormData> to satisfy noImplicitAny — same pattern needed in registry/devices/page.tsx (pre-existing issue)
  - Tests 12/15/16 target row by data-testid (row-1) rather than getAllByRole index[0] because rooms sort by Italian locale (Camera before Soggiorno)
  - DELETE handler does NOT call res.json() — 204 has no body (per D-21 / plan constraint)
metrics:
  duration_seconds: 356
  completed_date: "2026-03-23"
  tasks_completed: 2
  files_changed: 2
requirements_fulfilled: [ROOM-02, ROOM-03, ROOM-04]
---

# Phase 122 Plan 02: Room CRUD Actions Summary

**One-liner:** Create/edit/delete room handlers with FormModal+Zod validation and ConfirmationDialog, wiring POST/PUT/DELETE to /api/rooms with 409/404 error handling.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Failing tests (RED) for ROOM-02, ROOM-03, ROOM-04 | 69916589 | app/rooms/__tests__/page.test.tsx |
| 2 | Implement handlers + FormModal + ConfirmationDialog (GREEN) | 4e1727f6 | app/rooms/page.tsx, app/rooms/__tests__/page.test.tsx |

## What Was Built

Added full CRUD mutation support to the Rooms page:

- **handleCreate**: POSTs to `/api/rooms` with `{ name, description: null }`. On 409 throws (modal stays open via FormModal throw-pattern). On success calls `toastSuccess` and refreshes list + health.
- **handleEdit**: PUTs to `/api/rooms/{id}`. On 409 throws. On 404 calls `toastError('Stanza non trovata')` and closes modal. On success calls `toastSuccess` and refreshes.
- **handleDelete**: DELETEs `/api/rooms/{id}`. Does NOT call `res.json()` (204 body). On 404 calls `toastError`. On success calls `toastSuccess` and refreshes.
- **Zod schema**: `roomSchema` with `name` (min 1, max 100) and `description` (nullable/optional, max 500).
- **FormModal for create**: Opens on "Crea stanza" click, `title="Crea stanza"`, testid `form-modal-create`.
- **FormModal for edit**: Opens on "Modifica" click, pre-filled with room data, `key={roomToEdit?.id}` for force remount.
- **ConfirmationDialog for delete**: Shows `Eliminare "{name}" ({device_count} dispositivi)?` with danger variant.

## Test Results

- **17 tests pass** — 7 from Plan 01 (ROOM-01) + 10 new (ROOM-02/03/04)
- RED phase: 7 passed, 10 failed (before implementation)
- GREEN phase: 17 passed (after implementation)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test index access fails due to Italian locale sort order**
- **Found during:** Task 2 (GREEN)
- **Issue:** `editButtons[0]` and `deleteButtons[0]` targeted "Camera" (id=2) not "Soggiorno" (id=1) because rooms sort alphabetically by locale — Camera before Soggiorno
- **Fix:** Changed Tests 12, 15, 16 to use `screen.getByTestId('row-1')` and `querySelectorAll('button')` to reliably target Soggiorno row
- **Files modified:** app/rooms/__tests__/page.test.tsx
- **Commit:** 4e1727f6

**2. [Rule 2 - Type Safety] Implicit any on render-prop control parameter**
- **Found during:** Task 2 TypeScript check
- **Issue:** `({ control }) =>` destructure had implicit `any` type failing noImplicitAny
- **Fix:** Added `Control<RoomFormData>` explicit type annotation from react-hook-form
- **Files modified:** app/rooms/page.tsx
- **Commit:** 4e1727f6

## Known Stubs

None — all handlers are fully wired to the API.

## Self-Check: PASSED
