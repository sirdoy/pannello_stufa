---
phase: 100-control-endpoints
plan: "02"
subsystem: api-routes
tags: [thermorossi, proxy, migration, routes, commands]
dependency_graph:
  requires: [100-01]
  provides: [stove-command-routes-via-proxy, stove-history-route]
  affects: [app/api/stove/ignite, app/api/stove/shutdown, app/api/stove/setPower, app/api/stove/setFan, app/api/stove/setWaterTemperature, app/api/stove/history]
tech_stack:
  added: []
  patterns: [thermorossiProxy-command-wrappers, withIdempotency-for-all-commands, 202-for-commands-200-for-reads]
key_files:
  created:
    - app/api/stove/history/route.ts
  modified:
    - app/api/stove/ignite/route.ts
    - app/api/stove/shutdown/route.ts
    - app/api/stove/setPower/route.ts
    - app/api/stove/setFan/route.ts
    - app/api/stove/setWaterTemperature/route.ts
decisions:
  - "Commands return HTTP 202 (proxy convention), history returns 200 (read endpoint)"
  - "setWaterTemperature gains withIdempotency for consistency (was missing before)"
  - "Proxy handles range validation — client-side validateRange removed from setWaterTemperature"
  - "body['value'] used for all parameter routes (replaces body.level and body.temperature)"
metrics:
  duration: "~5 minutes"
  completed: "2026-03-19"
  tasks_completed: 2
  files_created: 1
  files_modified: 5
---

# Phase 100 Plan 02: Control Endpoint Migration Summary

**One-liner:** 5 stove command routes migrated from StoveService/stoveApi to thermorossiProxy wrappers (returning 202) plus new GET /api/stove/history route returning 200.

## What Was Built

All five stove control route files (`ignite`, `shutdown`, `setPower`, `setFan`, `setWaterTemperature`) were rewritten to use the proxy wrappers added in Plan 01 (`sendIgnit`, `sendShutdown`, `setPower`, `setFan`, `setWaterTemp`). A new history route was created at `app/api/stove/history/route.ts`.

### Route Changes

| Route | Before | After |
|-------|--------|-------|
| POST /api/stove/ignite | stoveService.ignite() → 200 | sendIgnit() → 202 |
| POST /api/stove/shutdown | stoveService.shutdown() → 200 | sendShutdown() → 202 |
| POST /api/stove/setPower | stoveService.setPower(level) → 200 | setPower(value) → 202 |
| POST /api/stove/setFan | stoveService.setFan(level) → 200 | setFan(value) → 202 |
| POST /api/stove/setWaterTemperature | stoveApi.setWaterTemperature → 200 | setWaterTemp(value) → 202 |
| GET /api/stove/history | (did not exist) | getHistory(params) → 200 |

### Removed Code
- `validateIgniteInput`, `validateShutdownInput`, `validateSetPowerInput`, `validateSetFanInput` — validators removed (proxy handles state gating)
- `validateRange` — removed from setWaterTemperature (proxy handles 422 on out-of-range)
- `getStoveService()` — removed from all command routes
- `stoveApi.setWaterTemperature` import — removed
- `modeChanged`/`newMode` backward-compat response shaping — removed from setPower and setFan

### Added Code
- `withIdempotency` added to `setWaterTemperature` (was missing in old version, consistency with other command routes)
- `export const dynamic = 'force-dynamic'` added to ignite, shutdown, setFan

## Commits

| Task | Hash | Description |
|------|------|-------------|
| Task 1 | fc52efc | migrate ignite, shutdown, setPower routes to thermorossiProxy |
| Task 2 | f9654c1 | migrate setFan, setWaterTemperature routes + create history route |

## Test Results

- thermorossiProxy tests: 16/16 pass
- Full suite: 3893/3899 pass (6 pre-existing failures in useDeviceStaleness — unrelated timing tests, out of scope)
- No regressions introduced

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- app/api/stove/history/route.ts: FOUND
- app/api/stove/ignite/route.ts: FOUND (contains sendIgnit, 202, no getStoveService)
- app/api/stove/shutdown/route.ts: FOUND (contains sendShutdown, 202, no getStoveService)
- app/api/stove/setPower/route.ts: FOUND (contains setPower, body['value'], 202, no modeChanged)
- app/api/stove/setFan/route.ts: FOUND (contains setFan, body['value'], 202, no getStoveService)
- app/api/stove/setWaterTemperature/route.ts: FOUND (contains setWaterTemp, withIdempotency, 202, no validateRange)
- Commit fc52efc: FOUND
- Commit f9654c1: FOUND
