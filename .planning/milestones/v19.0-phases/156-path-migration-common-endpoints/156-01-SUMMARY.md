---
phase: 156-path-migration-common-endpoints
plan: "01"
subsystem: api-routes
tags: [path-migration, thermorossi, aggregated-endpoints, health, devices]
dependency_graph:
  requires: []
  provides:
    - "GET /api/v1/thermorossi/status"
    - "GET /api/v1/thermorossi/health"
    - "GET /api/v1/thermorossi/power"
    - "GET /api/v1/thermorossi/fan-level"
    - "GET /api/v1/thermorossi/history"
    - "POST /api/v1/thermorossi/commands/ignit"
    - "POST /api/v1/thermorossi/commands/shutdown"
    - "POST /api/v1/thermorossi/settings/power"
    - "POST /api/v1/thermorossi/settings/fan-level"
    - "POST /api/v1/thermorossi/settings/temperature/water"
    - "GET /health (aggregated, unauthenticated)"
    - "GET /api/v1/devices (fritzbox network devices)"
  affects:
    - "lib/stove/thermorossiProxy.ts (imported, not modified)"
    - "lib/fritzbox/fritzboxClient.ts (imported, not modified)"
tech_stack:
  added: []
  patterns:
    - "Promise.allSettled fan-out for multi-provider aggregation"
    - "Verbatim route copy with JSDoc path update only"
    - "withErrorHandler (unauthenticated) vs withAuthAndErrorHandler (authenticated)"
key_files:
  created:
    - app/api/v1/thermorossi/status/route.ts
    - app/api/v1/thermorossi/health/route.ts
    - app/api/v1/thermorossi/power/route.ts
    - app/api/v1/thermorossi/fan-level/route.ts
    - app/api/v1/thermorossi/history/route.ts
    - app/api/v1/thermorossi/commands/ignit/route.ts
    - app/api/v1/thermorossi/commands/shutdown/route.ts
    - app/api/v1/thermorossi/settings/power/route.ts
    - app/api/v1/thermorossi/settings/fan-level/route.ts
    - app/api/v1/thermorossi/settings/temperature/water/route.ts
    - app/health/route.ts
    - app/api/v1/devices/route.ts
  modified: []
  deleted:
    - app/api/stove/ (entire directory — 10 route files)
decisions:
  - "Verbatim copy strategy: handler logic identical to old routes, only JSDoc path comment updated"
  - "GET /health uses withErrorHandler (unauthenticated per D-06)"
  - "GET /api/v1/devices uses withAuthAndErrorHandler (authenticated)"
  - "ignit directory name matches HA proxy endpoint (no trailing e)"
metrics:
  duration_minutes: 15
  tasks_completed: 2
  tasks_total: 2
  files_created: 12
  files_deleted: 10
  completed_date: "2026-04-07"
---

# Phase 156 Plan 01: Thermorossi Path Migration & Common Endpoints Summary

Migrated 10 thermorossi API routes to canonical `/api/v1/thermorossi/*` paths, deleted all old `/api/stove/*` routes, and created 2 new cross-provider aggregate endpoints (`GET /health` and `GET /api/v1/devices`).

## What Was Built

### Task 1: Thermorossi Route Migration

Created 10 new route files at canonical `/api/v1/thermorossi/*` paths by verbatim copy from old `/api/stove/*` routes, updating only the JSDoc path comment. Deleted the entire `app/api/stove/` directory tree.

Path mapping applied:
- `app/api/stove/status` → `app/api/v1/thermorossi/status`
- `app/api/stove/health` → `app/api/v1/thermorossi/health`
- `app/api/stove/getPower` → `app/api/v1/thermorossi/power`
- `app/api/stove/getFan` → `app/api/v1/thermorossi/fan-level`
- `app/api/stove/history` → `app/api/v1/thermorossi/history`
- `app/api/stove/ignite` → `app/api/v1/thermorossi/commands/ignit` (no trailing `e`)
- `app/api/stove/shutdown` → `app/api/v1/thermorossi/commands/shutdown`
- `app/api/stove/setPower` → `app/api/v1/thermorossi/settings/power`
- `app/api/stove/setFan` → `app/api/v1/thermorossi/settings/fan-level`
- `app/api/stove/setWaterTemperature` → `app/api/v1/thermorossi/settings/temperature/water`

### Task 2: Aggregate Endpoints

**`GET /health`** (`app/health/route.ts`):
- Unauthenticated (`withErrorHandler`)
- `Promise.allSettled` fan-out to all 8 providers: thermorossi, netatmo, hue, sonos, dirigera, tuya, raspi, fritzbox
- Returns `{ status: 'ok'|'degraded', providers: { [name]: 'ok'|'down' } }`

**`GET /api/v1/devices`** (`app/api/v1/devices/route.ts`):
- Authenticated (`withAuthAndErrorHandler`)
- Calls `fritzboxClient.getDevices()` and maps to `{ ip, name, mac, status, provider_type: 'fritzbox' }`
- Returns paginated envelope `{ items, total_count, limit, offset }`

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `36eba917` | 10 thermorossi routes created, /api/stove/ deleted |
| 2 | `cb01e3d3` | /health and /api/v1/devices aggregate endpoints |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data flows are wired to real proxy functions.

## Self-Check: PASSED

Files verified:
- `app/api/v1/thermorossi/status/route.ts` — FOUND
- `app/api/v1/thermorossi/commands/ignit/route.ts` — FOUND
- `app/health/route.ts` — FOUND
- `app/api/v1/devices/route.ts` — FOUND
- `app/api/stove/` — CONFIRMED DELETED

Commits verified:
- `36eba917` — FOUND
- `cb01e3d3` — FOUND
