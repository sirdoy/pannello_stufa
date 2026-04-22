---
phase: 169-dirigera-frontend-cutover
plan: 01
subsystem: dirigera
tags: [api-routes, hooks, url-swap, playwright, v1-routes]
dependency_graph:
  requires: []
  provides: [dirigera-v1-sensor-routes, dirigera-hooks-v1-urls]
  affects: [app/api/v1/dirigera, app/components/devices/dirigera/hooks, tests/smoke]
tech_stack:
  added: []
  patterns: [withAuthAndErrorHandler, explicit-field-spread, full-passthrough, adaptive-polling]
key_files:
  created:
    - app/api/v1/dirigera/health/route.ts
    - app/api/v1/dirigera/health/__tests__/route.test.ts
    - app/api/v1/dirigera/sensors/route.ts
    - app/api/v1/dirigera/sensors/__tests__/route.test.ts
    - app/api/v1/dirigera/sensors/summary/route.ts
    - app/api/v1/dirigera/sensors/summary/__tests__/route.test.ts
    - app/api/v1/dirigera/sensors/contact/route.ts
    - app/api/v1/dirigera/sensors/contact/__tests__/route.test.ts
    - app/api/v1/dirigera/sensors/motion/route.ts
    - app/api/v1/dirigera/sensors/motion/__tests__/route.test.ts
  modified:
    - app/components/devices/dirigera/hooks/useDirigeraData.ts
    - app/components/devices/dirigera/hooks/useDirigeraFullData.ts
    - app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts
    - tests/smoke/page-loads.spec.ts
decisions:
  - "Full passthrough (data as unknown as Record<string,unknown>) for health and sensors/summary routes; explicit { sensors, count, is_stale } spread for sensors, sensors/contact, sensors/motion routes (D-02)"
  - "WS subscribe/unsubscribe('dirigera',...) topic strings left unchanged in useDirigeraData.ts (Pitfall 2 — WS keys are not URL paths)"
  - "Playwright smoke test uses skeleton-tolerant main attached assertion (no heading check) — matches /raspi pattern, Wave 2 will extend with panel-heading assertions"
metrics:
  duration: 40min
  completed: "2026-04-22T19:34:21Z"
  tasks_completed: 5
  files_created: 10
  files_modified: 4
---

# Phase 169 Plan 01: DIRIGERA v1 Route Surface + Hook URL Cutover Summary

5 thin v1 wrapper routes at `/api/v1/dirigera/{health,sensors,sensors/summary,sensors/contact,sensors/motion}` created with exact envelope parity to legacy routes, both consumer hooks atomically flipped to `/api/v1/dirigera/*` URLs, and `/dirigera` smoke test added (closes RESEARCH Q2 gap).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| T1 | Create 5 v1 wrapper routes | `1126f690` | 5 new route files |
| T2 | Add 5 co-located Jest route tests | `a9e2c68e` | 5 new test files |
| T3 | Swap hook URLs to /api/v1/dirigera/* | `8dbd3bc4` | useDirigeraData.ts, useDirigeraFullData.ts, useDirigeraData.test.ts |
| T4 | Add /dirigera Playwright smoke test | `5f8bf3d2` | tests/smoke/page-loads.spec.ts |
| T5 | Verification gate | — | No code changes (verification only) |

## What Was Built

### 5 New v1 Route Files

Two response envelope patterns applied per D-02 discipline:

**Full passthrough** (`success(data as unknown as Record<string, unknown>)`):
- `app/api/v1/dirigera/health/route.ts` — delegates to `getHealth()`
- `app/api/v1/dirigera/sensors/summary/route.ts` — delegates to `getSensorSummary()`

**Explicit field spread** (`success({ sensors: data.sensors, count: data.count, is_stale: data.is_stale })`):
- `app/api/v1/dirigera/sensors/route.ts` — delegates to `getSensors()`
- `app/api/v1/dirigera/sensors/contact/route.ts` — delegates to `getContactSensors()`
- `app/api/v1/dirigera/sensors/motion/route.ts` — delegates to `getMotionSensors()`

All 5 routes use `withAuthAndErrorHandler` (auth guard) and `export const dynamic = 'force-dynamic'`.

Context labels used: `'Dirigera/Health'`, `'Dirigera/Sensors'`, `'Dirigera/SensorsSummary'`, `'Dirigera/SensorsContact'`, `'Dirigera/SensorsMotion'`.

### 5 New v1 Route Test Files (13 tests total)

Each file asserts:
1. `401 UNAUTHORIZED` when session is null
2. `200 success: true` with representative field assertions on authenticated request

Spread-envelope routes (sensors/contact/motion) add a 3rd test verifying `expect(mockGetX).toHaveBeenCalledWith()` (no args) and exact field projection.

### URL Swaps in Consumer Hooks

`useDirigeraData.ts` — 3 strings replaced:
- Line 51: `fetch('/api/dirigera/health')` → `fetch('/api/v1/dirigera/health')`
- Line 52: `fetch('/api/dirigera/sensors/summary')` → `fetch('/api/v1/dirigera/sensors/summary')`
- Line 81: `fetch('/api/dirigera/health')` → `fetch('/api/v1/dirigera/health')` (fetchHealth function)

`useDirigeraFullData.ts` — 4 strings replaced:
- FILTER_ENDPOINTS `all` → `/api/v1/dirigera/sensors`
- FILTER_ENDPOINTS `contact` → `/api/v1/dirigera/sensors/contact`
- FILTER_ENDPOINTS `motion` → `/api/v1/dirigera/sensors/motion`
- `fetch('/api/dirigera/health')` → `fetch('/api/v1/dirigera/health')`

`useDirigeraData.test.ts` — 3 assertion strings replaced:
- Line 121: `/api/dirigera/health` → `/api/v1/dirigera/health`
- Line 122: `/api/dirigera/sensors/summary` → `/api/v1/dirigera/sensors/summary`
- Line 309: `/api/dirigera/health` → `/api/v1/dirigera/health`

**WS subscription code unchanged** (lines 128-129): `subscribe('dirigera', handleMessage)` and `unsubscribe('dirigera', handleMessage)` — WS topic strings are not URLs.

### Playwright Smoke Test

New test case added inside `test.describe('Device Pages')` after `/raspi`:
- E2E-10: `/dirigera loads and shows data`
- Uses `collectConsoleErrors` helper + `waitForLoadState('networkidle')` + `expect(main).toBeAttached({ timeout: 15000 })`
- Skeleton-tolerant: no heading assertion (page shows skeleton during `loading && !data`)

## Wave-Exit Gates Verified

| Gate | Check | Result |
|------|-------|--------|
| G1 | `find app/api/v1/dirigera -name route.ts \| wc -l` = 8 | PASS (3 existing + 5 new) |
| G2 | Zero `/api/dirigera/` literals in hook files | PASS |
| G3 | `subscribe('dirigera')` / `unsubscribe('dirigera')` unchanged | PASS |
| G4 | Dirigera-focused Jest suite | PASS (59/59 tests) |
| G5 | Full Jest suite (dirigera suites) | PASS (all dirigera PASS) |

## Test Run Results

**Dirigera-focused (`--testPathPatterns="dirigera"`):** 59/59 tests, 11 suites — ALL PASS

**Full Jest suite:** 10 failing suites, all pre-existing (not touching any plan-modified files):
- `useLightsData.test.ts` — Lights hook URL assertions expecting old `/api/hue/*` paths (pre-existing from Phase 14.0 Hue migration)
- `useLightsCommands.test.ts` — Lights commands hook (pre-existing)
- `NetworkCard.test.tsx` — Space key navigation (pre-existing)
- `HueTab.test.tsx` — Cannot find module `../ApiTab` (pre-existing)
- `Kbd.test.tsx` — Snapshot mismatch (dark-only CSS class change, pre-existing from Phase 18.0)
- `LastUpdated.test.tsx` — class assertion mismatch (pre-existing)
- `FormModal.test.tsx` — pre-existing
- `useDeviceStaleness.test.ts` — pre-existing
- `ThermostatCard.schedule.test.tsx` — pre-existing
- `app/thermostat/page.test.tsx` — pre-existing

None of these suites touch `app/api/v1/dirigera/`, `app/components/devices/dirigera/`, or `tests/smoke/page-loads.spec.ts`.

## Deviations from Plan

None — plan executed exactly as written. All 5 tasks completed without auto-fix deviations.

## Known Stubs

None. All new routes delegate to proxy functions (`getHealth`, `getSensors`, `getSensorSummary`, `getContactSensors`, `getMotionSensors`) which are real production implementations from Phase 163.

## Threat Flags

No new threat surface introduced beyond the plan's threat model. All 5 new routes use `withAuthAndErrorHandler` (T-169-01 mitigated). No new query params added. No new WS paths.

## Self-Check

## Self-Check: PASSED

Files verified:
- `app/api/v1/dirigera/health/route.ts` — FOUND
- `app/api/v1/dirigera/sensors/route.ts` — FOUND
- `app/api/v1/dirigera/sensors/summary/route.ts` — FOUND
- `app/api/v1/dirigera/sensors/contact/route.ts` — FOUND
- `app/api/v1/dirigera/sensors/motion/route.ts` — FOUND
- All 5 test files — FOUND
- v1 route count = 8 — VERIFIED

Commits verified:
- `1126f690` — feat(169-01-T1) — PRESENT
- `a9e2c68e` — test(169-01-T2) — PRESENT
- `8dbd3bc4` — feat(169-01-T3) — PRESENT
- `5f8bf3d2` — test(169-01-T4) — PRESENT
