---
phase: 115
plan: 02
subsystem: components
tags: [type-safety, as-any, device-cards, typescript]
dependency_graph:
  requires: [115-01]
  provides: [type-safe-device-component-consumers]
  affects: [StoveCard, LightsCard, ThermostatCard, WeatherCardWrapper, RoomCard, SmartHomeCard, DataTable, CameraCard, HlsPlayer, EventPreviewModal]
tech_stack:
  added: []
  patterns: [exported-type-interfaces, typed-union-literals, JSX-component-rendering, native-label-element]
key_files:
  created: []
  modified:
    - app/components/devices/camera/HlsPlayer.tsx
    - app/components/devices/camera/EventPreviewModal.tsx
    - app/components/devices/camera/CameraCard.tsx
    - app/thermostat/schedule/components/ManualOverrideSheet.tsx
    - app/thermostat/schedule/components/ScheduleSelector.tsx
    - app/components/devices/stove/stoveStatusUtils.ts
    - app/components/devices/stove/StoveCard.tsx
    - app/components/devices/lights/LightsCard.tsx
    - app/components/devices/lights/components/LightsRoomControl.tsx
    - app/components/ui/DataTable.tsx
    - app/components/devices/thermostat/ThermostatCard.tsx
    - app/thermostat/schedule/components/WeeklyTimeline.tsx
    - app/components/devices/weather/WeatherCardWrapper.tsx
    - app/components/weather/WeatherCard.tsx
    - app/components/netatmo/RoomCard.tsx
    - app/components/devices/thermostat/BatteryWarning.tsx
    - app/components/ui/SmartHomeCard.tsx
decisions:
  - StoveStatusDisplay variant/health narrowed to typed unions in stoveStatusUtils (source), not StoveCard (consumer)
  - WeatherCardWrapper local WeatherData replaced with imported type from WeatherCard after exporting it
  - BatteryState exported from BatteryWarning to enable type-safe cross-component use in RoomCard
  - LightsRoomControl ControlButton variant derived via toControlButtonVariant() helper ('outline' maps to 'subtle')
  - WeeklyTimeline schedule cast uses unknown as NetatmoSchedule rather than as any
metrics:
  duration: 10min
  completed: "2026-03-22T16:30:36Z"
  tasks_completed: 2
  files_modified: 17
---

# Phase 115 Plan 02: Type Safety Components — Consumer as any Removal Summary

Zero `as any` casts in all 14 targeted consumer component files. With Plan 01's foundation types (widened Button.icon, exported DeviceCard interfaces), all casts were removable via typed interfaces, narrowed unions, JSX rendering, and native HTML elements.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix icon casts + StoveCard variants + LightsCard/RoomControl types + DataTable label | 2d70a5b1 | 10 files |
| 2 | Fix ThermostatCard + WeatherCardWrapper + RoomCard + SmartHomeCard + WeeklyTimeline casts | eaa0a404 | 7 files |

## What Was Built

**Task 1 — Icon/variant/slider/label casts:**
- Removed `as any` from `Button.Icon` icon prop in HlsPlayer, EventPreviewModal, CameraCard (Button.icon now accepts ReactNode after Plan 01)
- Removed `as any` from ManualOverrideSheet and ScheduleSelector (actual paths: `app/thermostat/schedule/components/`, not `app/components/devices/thermostat/components/`)
- Narrowed `StoveStatusDisplay.variant` to `'ember' | 'sage' | 'ocean' | 'warning' | 'danger' | 'neutral'` and `.health` to `'ok' | 'warning' | 'error' | 'critical'` in `stoveStatusUtils.ts`, removing casts in `StoveCard`
- Imported `FooterAction` and `StatusBadge` from DeviceCard in LightsCard; typed `footerActions: FooterAction[]` and `statusBadge: StatusBadge | null`
- Added `toControlButtonVariant()` helper in LightsRoomControl mapping `'outline' | null` → ControlButton-compatible variant; typed Slider `onValueCommit` as `(value: number[]) => void` matching Radix signature
- Replaced `<Text as="label" as any>` with `<label htmlFor="page-size">` in DataTable

**Task 2 — Thermostat/weather/room/smart home casts:**
- ThermostatCard: replaced `(activeSchedule as any).id` with `typedActiveSchedule.id` (already-cast variable); removed `(NETATMO_ROUTES as any).setRoomThermpoint` since the key exists in the const
- WeeklyTimeline: imported `NetatmoSchedule` from scheduleHelpers, replaced `as any` with `as unknown as NetatmoSchedule`
- WeatherCard: exported `WeatherData`, `CurrentWeather`, `ForecastDay`, `HourlyData`, `WeatherCondition` interfaces; WeatherCardWrapper's stale local type replaced with import
- BatteryWarning: exported `BatteryState` type; RoomCard imports it and uses `module.battery_state as BatteryState`, renders `<BatteryBadge>` as JSX instead of function call
- SmartHomeCard: replaced Banner spread `{...{children: x} as any}` with `<Banner ...>{x}</Banner>`

## Deviations from Plan

**1. [Rule 1 - Bug] Corrected file paths for ManualOverrideSheet and ScheduleSelector**
- **Found during:** Task 1
- **Issue:** Plan listed `app/components/devices/thermostat/components/ManualOverrideSheet.tsx` and `ScheduleSelector.tsx` — these paths don't exist
- **Fix:** Found actual paths: `app/thermostat/schedule/components/ManualOverrideSheet.tsx` and `app/thermostat/schedule/components/ScheduleSelector.tsx`
- **Files modified:** those two files
- **Commit:** 2d70a5b1

**2. [Rule 2 - Type export] Exported WeatherData from WeatherCard + BatteryState from BatteryWarning**
- **Found during:** Task 2
- **Issue:** WeatherCardWrapper's local `WeatherData` was structurally different (had `daily[]` instead of `forecast[]`); BatteryState was not exported but needed by RoomCard
- **Fix:** Exported both types from source files; WeatherCardWrapper discards its stale local type
- **Files modified:** WeatherCard.tsx, BatteryWarning.tsx
- **Commit:** eaa0a404

## Self-Check: PASSED

- SUMMARY.md: FOUND
- Commit 2d70a5b1: FOUND (Task 1 — icon/variant/slider/label)
- Commit eaa0a404: FOUND (Task 2 — thermostat/weather/room/smart home)
- Zero `as any` in all 14 consumer files: CONFIRMED
