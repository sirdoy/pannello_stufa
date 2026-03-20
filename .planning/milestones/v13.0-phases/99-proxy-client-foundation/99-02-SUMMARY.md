---
phase: 99
plan: 02
subsystem: stove-api-routes
tags: [thermorossi, proxy-migration, api-routes, read-endpoints]
dependency_graph:
  requires: [99-01]
  provides: [stove-read-routes-migrated, stove-health-route]
  affects: [stove-status-api, stove-power-api, stove-fan-api, stove-health-api]
tech_stack:
  added: []
  patterns: [thin-handler, withAuthAndErrorHandler, force-dynamic]
key_files:
  modified:
    - app/api/stove/status/route.ts
    - app/api/stove/getPower/route.ts
    - app/api/stove/getFan/route.ts
  created:
    - app/api/stove/health/route.ts
key_decisions:
  - "Migrated three existing stove read routes from stoveApi to thermorossiProxy"
  - "Created new /api/stove/health route following netatmo/health thin-handler pattern"
  - "Pre-existing tsc errors in test files are out-of-scope; deferred per scope boundary rule"
metrics:
  duration_seconds: 87
  completed_date: "2026-03-19"
  tasks_completed: 2
  files_modified: 3
  files_created: 1
---

# Phase 99 Plan 02: Read Route Migration Summary

Migrated three stove read routes (status, getPower, getFan) from `lib/stoveApi.ts` to `lib/thermorossiProxy.ts`, and created a new `/api/stove/health` route — completing all read endpoint migrations so stove data flows through the HA proxy instead of direct WiNet cloud calls.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migrate status, getPower, getFan routes | 5f0abbb | app/api/stove/status/route.ts, getPower/route.ts, getFan/route.ts |
| 2 | Create /api/stove/health route | e5cf902 | app/api/stove/health/route.ts |

## Changes Made

### Task 1: Three Routes Migrated

All three routes follow the same thin-handler pattern:
- Import changed from `lib/stoveApi` to `lib/thermorossiProxy`
- Function calls updated: `getStoveStatus` → `getStatus`, `getPowerLevel` → `getPower`, `getFanLevel` → `getFan`
- Added `export const dynamic = 'force-dynamic'` (was missing from all three)
- Removed sandbox mode references from JSDoc comments
- No try/catch (withAuthAndErrorHandler handles errors)

### Task 2: New Health Route

Created `app/api/stove/health/route.ts` from scratch:
- GET /api/stove/health returns provider status, data freshness, last poll timestamp
- Follows exact same thin-handler pattern as `app/api/netatmo/health/route.ts`
- Protected with Auth0 via `withAuthAndErrorHandler`

## Verification Results

1. `grep -r "stoveApi"` in migrated routes — returns nothing (exit 1 = pass)
2. `grep "force-dynamic"` in all 4 routes — all present
3. `grep "thermorossiProxy"` in all 4 routes — all import from proxy
4. `npx tsc --noEmit` — no errors in plan files (pre-existing test file errors are out-of-scope)

## Deviations from Plan

None - plan executed exactly as written.

## Deferred Items

Pre-existing tsc errors in `__tests__/api/health-monitoring/cron-executions.test.ts` and `__tests__/components/devices/lights/` are out of scope — not caused by this plan's changes.

## Self-Check: PASSED

Files created/modified:
- app/api/stove/status/route.ts: FOUND
- app/api/stove/getPower/route.ts: FOUND
- app/api/stove/getFan/route.ts: FOUND
- app/api/stove/health/route.ts: FOUND

Commits:
- 5f0abbb: FOUND
- e5cf902: FOUND
