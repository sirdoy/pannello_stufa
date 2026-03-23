---
phase: 121-device-registry-ui
plan: "02"
subsystem: registry
tags: [crud, form-modal, confirmation-dialog, zod, react-hook-form]
dependency_graph:
  requires: [121-01, 118-01, 118-02]
  provides: [DREG-03, DREG-04, DREG-05]
  affects: [app/registry/devices/page.tsx]
tech_stack:
  added: []
  patterns: [FormModal render-prop, ConfirmationDialog danger variant, Zod schema validation, Controller from react-hook-form, throw-to-keep-modal-open pattern]
key_files:
  created: []
  modified:
    - app/registry/devices/page.tsx
    - app/registry/devices/__tests__/page.test.tsx
decisions:
  - FormModal mock catches onSubmit errors silently to simulate real FormModal behavior (errors keep modal open); test verifies no toastSuccess on 409
  - Test 14 uses getAllByText for device name in ConfirmationDialog description because name appears in both table row and dialog
  - useDeviceTypesForSelect added as inline hook — non-critical fetch (errors silently ignored)
metrics:
  duration: "~17 minutes"
  completed: "2026-03-23"
  tasks: 2
  files: 2
---

# Phase 121 Plan 02: Device Registry CRUD Actions Summary

**One-liner:** Full CRUD for registered devices — register FormModal with 4 fields + Zod, update FormModal pre-filled with read-only context, unregister ConfirmationDialog danger variant, all using numeric device.id with 409/422/404 error handling.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Failing tests (RED) for DREG-03, DREG-04, DREG-05 | c7114505 | app/registry/devices/__tests__/page.test.tsx |
| 2 | Implement register/update/unregister in Device Registry page | a44c60c5 | app/registry/devices/page.tsx + test |

## What Was Built

**Register flow (DREG-03):**
- `handleRegister` POSTs to `/api/registry/devices` with `DeviceCreate` body
- `res.status === 409` throws `Error` — FormModal catches error, keeps modal open
- `res.status === 422` throws `Error` (unknown type)
- Success: `toastSuccess` + `refetch()` + `healthRefetch()`
- Register FormModal with 4 Controller fields: provider (Select), device_id (Input), custom_name (Input), device_type_slug (Select from types API)

**Update flow (DREG-04):**
- `handleUpdate` PUTs to `/api/registry/devices/${deviceToEdit.id}` — uses **numeric id**, NOT `device_id` string
- `res.status === 404` calls `toastError` + closes modal + `refetch()` (does NOT throw)
- Success: `toastSuccess` + `refetch()`
- Update FormModal shows read-only provider_name/device_id context, editable custom_name + device_type_slug

**Unregister flow (DREG-05):**
- `handleUnregister` DELETEs at `/api/registry/devices/${deviceToDelete.id}` — uses **numeric id**
- `res.status === 404` calls `toastError` + closes dialog + `refetch()` + `healthRefetch()`
- Success: `toastSuccess` + closes dialog + `refetch()` + `healthRefetch()` (per D-13)
- ConfirmationDialog with `variant="danger"`, description shows `custom_name` and `provider_name`

**Shared:**
- `useDeviceTypesForSelect` inline hook fetches `/api/registry/types` for type dropdowns
- `registerSchema` and `updateSchema` Zod objects wired to FormModal `validationSchema` prop

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] FormModal mock threw unhandled rejection on 409 test**
- **Found during:** Task 1 (RED phase run) + Task 2 (GREEN phase)
- **Issue:** FormModal mock called `onSubmit()` directly without catching errors. When `handleRegister` threw on 409, the rejected promise propagated as unhandled rejection, causing Jest to fail the test even though behavior was correct.
- **Fix:** Updated FormModal mock to wrap `onSubmit` call in `Promise.resolve().catch(() => {})` — simulating real FormModal behavior that catches errors and shows them inline without propagating
- **Files modified:** app/registry/devices/__tests__/page.test.tsx
- **Commit:** a44c60c5

**2. [Rule 1 - Bug] Test 14 used getByText causing "multiple elements" error**
- **Found during:** Task 2 (GREEN)
- **Issue:** ConfirmationDialog description contains "Lampada IKEA", but the device name also appears in the DataTable row rendered above. `getByText` found two elements.
- **Fix:** Changed to `getAllByText(/Lampada IKEA/).length.toBeGreaterThan(0)` to handle multiple matches
- **Files modified:** app/registry/devices/__tests__/page.test.tsx
- **Commit:** a44c60c5

## Test Results

All 16 tests pass:
- Tests 1-8 (DREG-01, DREG-02, DREG-06): preserved from plan 01
- Tests 9-11 (DREG-03): register modal open, POST call, 409 no-toast
- Tests 12-13 (DREG-04): update modal open, PUT numeric id
- Tests 14-16 (DREG-05): delete dialog open, DELETE numeric id, 404 toast

## Known Stubs

None — all data wired to real API endpoints.

## Self-Check: PASSED

- [FOUND] app/registry/devices/page.tsx — contains `FormModal`, `ConfirmationDialog`, `handleRegister`, `handleUpdate`, `handleUnregister`
- [FOUND] app/registry/devices/__tests__/page.test.tsx — contains 16 test cases, `form-modal-register`, `form-modal-update`, `confirmation-dialog`
- [FOUND] Commit c7114505 (RED tests)
- [FOUND] Commit a44c60c5 (GREEN implementation)
