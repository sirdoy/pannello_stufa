---
phase: 78-valve-health
plan: "01"
subsystem: netatmo-proxy
tags: [proxy, valves, calibration, types]
dependency_graph:
  requires: []
  provides: [valve-status-types, valve-proxy-wrappers, valve-get-route, calibrate-proxy-route, calibration-service-proxy]
  affects: [netatmoCalibrationService, app/api/netatmo/calibrate, app/api/netatmo/valves]
tech_stack:
  added: []
  patterns: [proxy-passthrough, failure-only-logging, double-assertion-cast]
key_files:
  created:
    - app/api/netatmo/valves/route.ts
    - __tests__/lib/netatmoCalibrationService.test.ts
  modified:
    - types/netatmoProxy.ts
    - lib/netatmoProxy.ts
    - app/api/netatmo/calibrate/route.ts
    - lib/netatmoCalibrationService.ts
decisions:
  - "Calibration service failure reasons simplified to auth_error|proxy_error — old reasons (no_home_id, no_homes, no_schedule, insufficient_schedules, restore_failed) all removed"
  - "adminDbPush failure log written to netatmo/calibrations/failures (separate path from old netatmo/calibrations)"
metrics:
  duration: "~12 minutes"
  completed: "2026-03-15"
  tasks_completed: 2
  files_changed: 6
---

# Phase 78 Plan 01: Valve Types, Proxy Wrappers, Routes, and Service Rewrite Summary

Valve status and calibration endpoints fully migrated to proxy: ValveStatus/CalibrateBatchResponse types added, GET /valves route created, POST /calibrate rewritten from schedule-switching workaround to direct proxy call, and calibrateValvesServer simplified to a single proxyCalibrateValves() call.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add valve types and proxy wrappers | 2969da0 | types/netatmoProxy.ts, lib/netatmoProxy.ts |
| 2 | Create valves route, rewrite calibrate route + service | b18c4f6 | app/api/netatmo/valves/route.ts, app/api/netatmo/calibrate/route.ts, lib/netatmoCalibrationService.ts, __tests__/lib/netatmoCalibrationService.test.ts |

## What Was Built

**Task 1 — Types and wrappers:**
- Added `ValveStatus`, `ValveStatusResponse`, `CalibrateBatchResult`, `CalibrateBatchResponse` to `types/netatmoProxy.ts`
- Added `getProxyValves()` (GET /valves) and `proxyCalibrateValves()` (POST /valves/calibrate, empty body) to `lib/netatmoProxy.ts`

**Task 2 — Routes and service:**
- `app/api/netatmo/valves/route.ts`: minimal GET route — auth wrapper → getProxyValves() → success()
- `app/api/netatmo/calibrate/route.ts`: rewritten to call proxyCalibrateValves() in a try/catch; failure-only logging via adminDbPush in catch block; all OAuth/schedule-switching logic removed
- `lib/netatmoCalibrationService.ts`: rewritten from 195-line schedule-switching flow to a 65-line proxy wrapper; failure reasons simplified from 8 variants to auth_error|proxy_error
- `__tests__/lib/netatmoCalibrationService.test.ts`: 3 tests covering success, proxy_error, and auth_error cases — all passing

## Verification

- `npx jest __tests__/lib/netatmoCalibrationService.test.ts`: 3/3 passing
- `npx tsc --noEmit`: no errors in our new/modified files
- `grep -r "getValidAccessToken|NETATMO_API" lib/netatmoCalibrationService.ts`: no output (OAuth removed)
- `grep -r "getValidAccessToken|requireNetatmoToken" app/api/netatmo/calibrate/route.ts`: no output (OAuth removed)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] app/api/netatmo/valves/route.ts exists
- [x] app/api/netatmo/calibrate/route.ts rewritten (93% change)
- [x] lib/netatmoCalibrationService.ts rewritten (87% change)
- [x] __tests__/lib/netatmoCalibrationService.test.ts exists and passes
- [x] Commit 2969da0 exists (Task 1)
- [x] Commit b18c4f6 exists (Task 2)
