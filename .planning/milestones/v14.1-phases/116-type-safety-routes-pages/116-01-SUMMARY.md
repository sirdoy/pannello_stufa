---
phase: 116-type-safety-routes-pages
plan: "01"
subsystem: type-safety
tags: [typescript, as-any-elimination, api-routes, service-worker]
dependency_graph:
  requires: []
  provides: [typed-scheduler-route, typed-netatmo-homestatus, typed-weather-forecast, typed-maintenance-route, typed-sw]
  affects: [lib/stove/stoveStateService, lib/maintenance/maintenanceServiceAdmin, lib/weather/openMeteo]
tech_stack:
  added: []
  patterns:
    - "adminDbGet<T> generic for typed Firebase reads without as any"
    - "declare global interface augmentation for browser APIs (Badging, PeriodicSync)"
    - "Optional chaining for optional browser APIs (navigator.setAppBadge?.(), periodicSync?.register())"
    - "Inline interface definitions near usage for local Firebase data shapes"
key_files:
  created: []
  modified:
    - app/api/scheduler/check/route.ts
    - app/api/netatmo/homestatus/route.ts
    - app/api/weather/forecast/route.ts
    - app/api/maintenance/update-target/route.ts
    - app/sw.ts
    - lib/stove/stoveStateService.ts
    - lib/maintenance/maintenanceServiceAdmin.ts
    - lib/weather/openMeteo.ts
decisions:
  - "Inline PidConfig, NetatmoCurrentStatus, PidState interfaces near their usage in scheduler route rather than at top of file — localizes domain knowledge"
  - "CalibrationDone interface added alongside CalibrationSkipped to properly type calibrateValvesIfNeeded return (CalibrationSuccess lacks nextCalibration field)"
  - "DailyWeather.time and HourlyWeather.time added to openMeteo types (auto-fix Rule 1 — missing fields causing TS error when as any removed)"
  - "WeatherForecast.current_units made optional (matches actual API response structure)"
  - "roomName fallback to targetRoomId when name is undefined (logPidTuningEntry requires string)"
metrics:
  duration: 8m
  completed: "2026-03-22T17:10:42Z"
  tasks_completed: 2
  files_modified: 8
---

# Phase 116 Plan 01: Type Safety Routes/Pages — Scheduler, Netatmo, Weather, Maintenance, sw.ts Summary

Eliminated all `as any` casts in 5 route/worker files plus 2 supporting lib files, bringing the server-side and worker layer to full type safety using typed generics, declare global augmentation, and proper interface widening.

## What Was Built

**Task 1 — Scheduler route + lib files (3 files, 9 as any eliminated):**
- `app/api/scheduler/check/route.ts`: Replaced 9 `as any` casts with typed generics (`adminDbGet<PidConfig>`, `adminDbGet<NetatmoCurrentStatus>`, `adminDbGet<PidState>`, `adminDbGet<SchedulerMode>`, `adminDbGet<ScheduleInterval[]>`). Added inline interfaces for Firebase data shapes. Fixed `calibrateValvesIfNeeded` return type with `CalibrationResult | CalibrationSkipped | CalibrationDone` union. Removed `'pid_automation' as any` after widening source union.
- `lib/stove/stoveStateService.ts`: Widened `StoveStateUpdate.source` union to include `'pid_automation'`.
- `lib/maintenance/maintenanceServiceAdmin.ts`: Typed `notificationData` as `MaintenanceNotificationData | null` in `TrackUsageResult`.

**Task 2 — Netatmo, weather, maintenance routes + sw.ts (5 files, 11 as any eliminated):**
- `app/api/netatmo/homestatus/route.ts`: Battery functions now accept `ModuleWithStatus[]` instead of `any[]`, removing 3 `as any` casts.
- `app/api/weather/forecast/route.ts`: Import `WeatherForecast` + `AirQualityData`, cast rawData and airQualityResult with proper types, removing 2 `as any` casts.
- `app/api/maintenance/update-target/route.ts`: Removed `parseFloat(targetHours as any)` — `targetHours` is already `number` per validated interface.
- `app/sw.ts`: Added `declare global` blocks for Badging API (`Navigator.setAppBadge/clearAppBadge`) and Periodic Background Sync (`PeriodicSyncManager`, `ServiceWorkerRegistration.periodicSync`). Replaced 5 `as any` casts with optional chaining.
- `lib/weather/openMeteo.ts`: Added `time: string[]` to `DailyWeather` and `HourlyWeather`, added `current_units?: CurrentWeatherUnits` to `WeatherForecast`.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1 | 6e7c63f8 | route.ts, stoveStateService.ts, maintenanceServiceAdmin.ts |
| Task 2 | cc6bd9e3 | homestatus/route.ts, forecast/route.ts, update-target/route.ts, sw.ts, openMeteo.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing `time` fields in DailyWeather and HourlyWeather interfaces**
- **Found during:** Task 2 — removing `as any` from weather forecast route exposed TS errors
- **Issue:** `DailyWeather` and `HourlyWeather` lacked `time: string[]` fields; `WeatherForecast` lacked `current_units`; `interpretWeatherCode` called with `number | undefined`
- **Fix:** Added `time: string[]` to both sub-interfaces, added optional `current_units?: CurrentWeatherUnits`, added `?? 0` fallback for weather code indexing
- **Files modified:** `lib/weather/openMeteo.ts`, `app/api/weather/forecast/route.ts`
- **Commit:** cc6bd9e3

**2. [Rule 1 - Bug] CalibrationDone interface needed for calibrateValvesIfNeeded**
- **Found during:** Task 1 — `{ calibrated: true; timestamp; nextCalibration }` has extra `nextCalibration` field not in `CalibrationSuccess`
- **Fix:** Added `CalibrationDone` interface alongside `CalibrationSkipped` for the local wrapper return
- **Files modified:** `app/api/scheduler/check/route.ts`
- **Commit:** 6e7c63f8

**3. [Rule 1 - Bug] Several consequential type errors after as any removal in scheduler route**
- **Found during:** Task 1 — `sh/sm/eh/em` destructuring defaults, `semiManual ?? false` for boolean parameter, `roomName` fallback to `targetRoomId`
- **Fix:** Added destructuring defaults `[sh = 0, sm = 0]`, `?? false` guard for semiManual, `?? targetRoomId` fallback for roomName
- **Files modified:** `app/api/scheduler/check/route.ts`
- **Commit:** 6e7c63f8

## Known Stubs

None — all typing is complete and uses actual runtime data shapes.

## Self-Check

- [x] `app/api/scheduler/check/route.ts` exists and has 0 `as any` casts
- [x] `app/api/netatmo/homestatus/route.ts` exists and has 0 `as any` casts
- [x] `app/api/weather/forecast/route.ts` exists and has 0 `as any` casts
- [x] `app/api/maintenance/update-target/route.ts` exists and has 0 `as any` casts
- [x] `app/sw.ts` exists and has 0 `as any` casts
- [x] Commits 6e7c63f8 and cc6bd9e3 exist
- [x] tsc reports no errors in modified files

## Self-Check: PASSED
