---
phase: 121-device-registry-ui
plan: "01"
subsystem: registry-ui
tags: [registry, devices, pagination, filter, health-stats, tdd]
dependency_graph:
  requires:
    - "118-01: /api/registry/devices endpoint (PaginatedResponse<RegistryDevice>)"
    - "118-01: /api/registry/health endpoint (RegistryHealthResponse)"
    - "120-01: DeviceTypesPage pattern (canonical Phase 120 structure)"
  provides:
    - "DeviceRegistryPage at /registry/devices with provider filter and health stats"
  affects:
    - "app/registry/devices/page.tsx"
    - "app/registry/devices/__tests__/page.test.tsx"
tech_stack:
  added: []
  patterns:
    - "useRegistryDevices inline hook with page/provider state and Italian locale sort"
    - "useRegistryHealth silently ignoring errors (non-critical endpoint)"
    - "Multi-URL fetch mock routing by URL string matching in tests"
    - "Pre-declared state vars (showRegister, deviceToEdit, deviceToDelete) for plan 02 compatibility"
key_files:
  created:
    - "app/registry/devices/page.tsx"
    - "app/registry/devices/__tests__/page.test.tsx"
  modified: []
decisions:
  - "Test 6 (Tutti filter) uses cumulative call counting (>= 2 without provider_name) instead of mockClear() to avoid timing issues with in-flight fetches"
  - "getProviderBadgeVariant: hue=ocean, netatmo/thermorossi=ember, all others=neutral"
  - "Health stats rendered in Card header, not as separate Card (per D-11 inline pattern)"
metrics:
  duration_minutes: 12
  completed_date: "2026-03-23"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
requirements: [DREG-01, DREG-02, DREG-06]
---

# Phase 121 Plan 01: Device Registry Page Summary

Paginated read-only Device Registry page with provider filter and health stats.

## One-liner

Device Registry page at `/registry/devices` with server-side pagination (20/page), provider Select filter, Italian locale sort, and inline health stats from `/api/registry/health`.

## What Was Built

### app/registry/devices/page.tsx

`'use client'` component following Phase 120 `DeviceTypesPage` structure exactly.

- **`useRegistryDevices` hook:** manages `page`, `provider` state; builds URLSearchParams with `limit=20`, `offset=page*20`, conditionally adds `provider_name`; sorts results client-side by `custom_name` with `localeCompare('it')`; `handleProviderChange` resets page to 0 before setting provider.
- **`useRegistryHealth` hook:** fetches `/api/registry/health`; silently ignores errors (non-critical).
- **`getProviderBadgeVariant` helper:** `hue` → `ocean`, `netatmo`/`thermorossi` → `ember`, others → `neutral`.
- **DataTable columns:** `custom_name` (sortable), `provider_name` (Badge), `device_type_slug` (code), `device_id` (code), `updated_at` (it-IT date), `actions` (Modifica + Rimuovi buttons for plan 02).
- **Layout:** SettingsLayout with `backHref="/registry/types"`, health stats inline in Card header, provider Select + "Registra dispositivo" button toolbar, empty state with message, server-side pagination controls.
- **Pre-declared state:** `showRegister`, `deviceToEdit`, `deviceToDelete` for plan 02 modal integration.

### app/registry/devices/__tests__/page.test.tsx

8 tests covering DREG-01, DREG-02, DREG-06 using Phase 120 mock pattern, extended with multi-URL fetch routing and Select mock.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Failing tests for Device Registry page | ec6560c0 | app/registry/devices/__tests__/page.test.tsx |
| 2 (GREEN) | Device Registry page implementation | 2129aefa | app/registry/devices/page.tsx, __tests__/page.test.tsx (test fixes) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test ambiguity for provider text and health stats numbers**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** Test 1 used `getByText('hue')` but Select option and Badge both rendered "hue"; Test 7 used `getByText('5')` but device_id "5" also matched.
- **Fix:** Changed to `getAllByText('hue').length > 0` and regex `/Tipi dispositivo:/` assertions.
- **Files modified:** app/registry/devices/__tests__/page.test.tsx
- **Commit:** 2129aefa (bundled with implementation commit)

**2. [Rule 1 - Bug] Fixed Test 6 (Tutti filter) timing/spy-clearing issue**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** Using `fetchSpy.mockClear()` then selecting '' while component was in loading state caused spy to miss the refetch triggered by the provider state change.
- **Fix:** Replaced mockClear() approach with cumulative counting — asserts that device calls without `provider_name` occur at least twice (initial load + after selecting Tutti).
- **Files modified:** app/registry/devices/__tests__/page.test.tsx
- **Commit:** 2129aefa (bundled with implementation commit)

## Known Stubs

- **`showRegister` state** — "Registra dispositivo" button sets this to `true` but no FormModal is connected yet. The modal integration will be wired in plan 02.
- **`deviceToEdit` / `deviceToDelete` state** — action column buttons set these but consuming modals will be added in plan 02.

These stubs are intentional and documented for plan 02 (DREG-03, DREG-04, DREG-05 requirements).

## Self-Check: PASSED

- [x] app/registry/devices/page.tsx exists
- [x] app/registry/devices/__tests__/page.test.tsx exists
- [x] Commit ec6560c0 exists (RED tests)
- [x] Commit 2129aefa exists (GREEN implementation)
- [x] All 8 tests pass
- [x] No regressions (17/17 registry tests pass)
