---
phase: 116-type-safety-routes-pages
plan: "02"
subsystem: type-safety
tags: [type-safety, as-any, pages, routes, notifications, monitoring, thermostat, scheduler]
dependency_graph:
  requires: []
  provides: [TYPE-16-pages]
  affects: [app/thermostat, app/monitoring, app/log, app/stove/scheduler, app/settings/notifications]
tech_stack:
  added: []
  patterns:
    - Export child component types to enable safe cross-component prop passing
    - Use DaySchedule alias for narrow-keyed access under noUncheckedIndexedAccess
    - Explicit interface fields instead of index signatures with any
key_files:
  created: []
  modified:
    - app/components/devices/thermostat/BatteryWarning.tsx
    - components/monitoring/ConnectionStatusCard.tsx
    - components/monitoring/DeadManSwitchPanel.tsx
    - app/thermostat/page.tsx
    - app/thermostat/schedule/page.tsx
    - app/monitoring/page.tsx
    - app/log/page.tsx
    - lib/hooks/useScheduleData.ts
    - app/components/netatmo/RoomCard.tsx
    - app/stove/scheduler/page.tsx
    - app/settings/notifications/page.tsx
    - app/settings/notifications/devices/page.tsx
decisions:
  - "DaySchedule = Record<DayOfWeek, ScheduleInterval[]> retained as internal alias for safe indexed access under noUncheckedIndexedAccess; WeeklySchedule used only for component prop types"
  - "ModuleData.name made optional in RoomCard.tsx since NetatmoModule does not include a name field"
  - "NotificationDevice.createdAt guarded with != null before new Date() to handle optional field"
  - "useScheduleData Schedule interface extended with name/timetable/zones to match WeeklyTimeline expectations without as any"
metrics:
  duration: "~20 minutes"
  completed: "2026-03-22T18:11:00Z"
  tasks_completed: 2
  files_modified: 12
requirements: [TYPE-16]
---

# Phase 116 Plan 02: Type Safety Routes and Pages Summary

Zero `as any` casts in 7 target page files by exporting types from child components, importing canonical types from services, and making interfaces explicit rather than using escape-hatch index signatures.

## What Was Built

### Task 1: Export Types from Child Components + Fix Thermostat/Monitoring/Log Pages (89d71cd3)

Exported three types that were previously internal-only:
- `export interface Module` from `BatteryWarning.tsx` — enables typed `lowBatteryModules` and `modulesWithBattery` props
- `export interface ConnectionStats` from `ConnectionStatusCard.tsx` — enables typed `useState<ConnectionStats | null>` in monitoring page
- `export interface HealthyStatus`, `StaleStatus`, `export type DeadManSwitchStatus` from `DeadManSwitchPanel.tsx` — enables typed `useState<DeadManSwitchStatus | null>`

Fixed `thermostat/page.tsx` (3 casts):
- `lowBatteryModules={(status?.lowBatteryModules || []) as Module[]}` — specific typed cast
- `modules={modulesWithBattery as Module[]}` — specific typed cast
- `room={room}` — removed entirely; also made `ModuleData.name` optional in `RoomCard.tsx` to resolve structural incompatibility with `NetatmoModule`

Fixed `thermostat/schedule/page.tsx` (2 casts):
- `icon={<RefreshCw size={16} />}` — Button.icon accepts `string | React.ReactNode`, cast was unnecessary
- `schedule={activeSchedule}` — added `name?/timetable?/zones?` to `useScheduleData.ts` `Schedule` interface to match `WeeklyTimeline` expectations

Fixed `monitoring/page.tsx` (2 casts):
- Deleted `StatsData` and `DMSStatus` index-signature interfaces; imported `ConnectionStats` and `DeadManSwitchStatus` instead
- Removed `as any` from both component prop sites

Fixed `log/page.tsx` (2 casts):
- Changed `[key: string]: any` to `[key: string]: unknown` in `LogEntryData`
- Changed `.map(([id, entry]) => ... as any)` to `as LogEntryData`
- Changed `.sort((a: any, b: any) => ...)` to `.sort((a: LogEntryData, b: LogEntryData) => ...)`

### Task 2: Fix Stove Scheduler + Settings Notification Pages (0e90259b)

Fixed `app/stove/scheduler/page.tsx` (4 casts + local type cleanup):
- Deleted local `interface ScheduleInterval` and `type WeekSchedule` (duplicates of service types)
- Imported canonical `ScheduleInterval` and `WeeklySchedule` from `@/lib/scheduler/schedulerService`
- Added `type DaySchedule = Record<DayOfWeek, ScheduleInterval[]>` as internal alias for narrow-keyed access (avoids `undefined` from `noUncheckedIndexedAccess` on DayOfWeek keys)
- Removed `schedule as any` from `WeeklySummaryCard`, `WeeklyTimeline`, `DayEditPanel.intervals`, `AddIntervalModal.initialInterval`
- Removed `as ServiceScheduleInterval[]` cast from internal `saveSchedule` wrapper

Fixed `app/settings/notifications/page.tsx` (1 cast):
- Added `token?: string` and other runtime fields (`id?`, `platform?`, `isPWA?`, `createdAt?`, `userAgent?`) to `NotificationDevice` interface
- Changed `[key: string]: any` to `[key: string]: unknown`
- Removed `(d as any).token` cast; guarded `createdAt` with `!= null` before `new Date()`

Fixed `app/settings/notifications/devices/page.tsx` (1 cast):
- Changed `lastUsed?: number` to `lastUsed: string | null` to match `DeviceListItem.Device` type
- Removed `[key: string]: any` index signature (all fields now explicit)
- Removed `device as any` cast

## Verification

All 7 target page files have zero `as any` casts:
- `grep -c 'as any' app/thermostat/page.tsx` → 0
- `grep -c 'as any' app/thermostat/schedule/page.tsx` → 0
- `grep -c 'as any' app/monitoring/page.tsx` → 0
- `grep -c 'as any' app/log/page.tsx` → 0
- `grep -c 'as any' app/stove/scheduler/page.tsx` → 0
- `grep -c 'as any' app/settings/notifications/page.tsx` → 0
- `grep -c 'as any' app/settings/notifications/devices/page.tsx` → 0

TypeScript: 19 non-test errors remain — all pre-existing, none in modified files.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ModuleData.name made optional in RoomCard.tsx**
- **Found during:** Task 1, removing `room as any` cast
- **Issue:** `RoomWithStatus.roomModules` is `NetatmoModule[]` which lacks `name: string`; `RoomCard.ModuleData` required `name: string`
- **Fix:** Changed `name: string` to `name?: string` in `ModuleData` interface — matches actual runtime data
- **Files modified:** `app/components/netatmo/RoomCard.tsx`
- **Commit:** 89d71cd3

**2. [Rule 2 - Missing fields] NotificationDevice fields added explicitly**
- **Found during:** Task 2, fixing `[key: string]: any` → `[key: string]: unknown`
- **Issue:** JSX used `device.id`, `device.platform`, `device.isPWA`, `device.createdAt`, `device.userAgent` which returned `unknown` after index signature change, causing type errors
- **Fix:** Added all runtime-accessed fields explicitly to `NotificationDevice` interface
- **Files modified:** `app/settings/notifications/page.tsx`
- **Commit:** 0e90259b

**3. [Rule 2 - Missing guard] createdAt null guard added**
- **Found during:** Task 2, after adding `createdAt?: string | number` to interface
- **Issue:** `new Date(device.createdAt)` rejects `undefined`
- **Fix:** Added `device.createdAt != null ? ... : 'N/D'` guard
- **Files modified:** `app/settings/notifications/page.tsx`
- **Commit:** 0e90259b

**4. [Rule 1 - Bug] DaySchedule alias for noUncheckedIndexedAccess compatibility**
- **Found during:** Task 2, replacing `WeekSchedule` with `WeeklySchedule`
- **Issue:** `WeeklySchedule = Record<string, ScheduleInterval[]>` caused `schedule[day]` to return `ScheduleInterval[] | undefined` under `noUncheckedIndexedAccess`, breaking multiple function bodies
- **Fix:** Kept internal `DaySchedule = Record<DayOfWeek, ScheduleInterval[]>` for state type; imported `WeeklySchedule` for component prop passing only
- **Files modified:** `app/stove/scheduler/page.tsx`
- **Commit:** 0e90259b

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 89d71cd3 | Export types from child components + fix thermostat/monitoring/log pages |
| 2 | 0e90259b | Fix stove scheduler + settings notification pages |

## Self-Check: PASSED
