---
phase: 145-ws-type-alignment
plan: "03"
subsystem: websocket-types
tags: [websocket, typescript, types, raspi, tuya, fritzbox, dirigera, netatmo, hue, sonos]
dependency_graph:
  requires:
    - "145-01 (TuyaPlug in tuyaProxy.ts)"
    - "145-02 (custom_name/device_type in hueProxy, thermorossiProxy, sonosProxy, dirigeraProxy)"
  provides:
    - "Complete WS type definitions for all 8 topics"
    - "Topic union with raspi and tuya"
    - "TopicDataMap with all 8 entries"
    - "Data freshness fields on all topic interfaces"
  affects:
    - "lib/hooks/useWebSocketManager.ts (Topic, TopicDataMap consumers)"
    - "all provider hooks that import from types/websocket.ts"
    - "Phase 146 (Raspi WS migration uses RaspiData)"
    - "Phase 147 (Tuya integration uses TuyaData)"
tech_stack:
  added: []
  patterns:
    - "Inline freshness union over proxy type import where shape differs (2-state vs 3-state)"
    - "Import SonosDataFreshness from sonosProxy (proxy 2-state matches WS exactly)"
    - "D-01: HueData.lights/groups stay as arrays, not dicts"
key_files:
  created: []
  modified:
    - "types/websocket.ts"
    - "app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts"
decisions:
  - "D-01 LOCKED: HueData.lights stays HueLight[] | null (array) — useLightsData iterates as array"
  - "Inline freshness unions for DirigeraData ('LIVE'|'STALE') and HueData ('LIVE'|'STALE'|'UNREACHABLE') — proxy types are different widths"
  - "SonosDataFreshness imported from sonosProxy — 2-state proxy type matches WS doc"
  - "NetatmoData becomes interface (was type alias) with index signature for backward compat"
  - "RaspiData.data_freshness is literal 'LIVE' (not union) — always live, no caching"
metrics:
  duration_minutes: 8
  completed_date: "2026-03-28"
  tasks_completed: 1
  tasks_total: 1
  files_created: 0
  files_modified: 2
requirements_closed:
  - WSTYPE-01
  - WSTYPE-02
  - WSTYPE-03
  - WSTYPE-06
  - WSTYPE-08
  - WSTYPE-13
  - WSTYPE-14
---

# Phase 145 Plan 03: Rewrite types/websocket.ts (All 8 Topics) Summary

**One-liner:** Complete types/websocket.ts rewrite — 8-topic union + TopicDataMap, all 6 existing types enriched with data_freshness and registry metadata, 2 new interfaces (RaspiData, TuyaData), npx tsc exits 0.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Rewrite types/websocket.ts with all enriched type definitions | 3d8c96e4 | types/websocket.ts, useDirigeraData.test.ts |

## Changes Made

### types/websocket.ts

- **Imports:** Added `SonosDataFreshness` from sonosProxy, `TuyaPlug` from tuyaProxy
- **Re-exports:** Added `TuyaPlug` re-export
- **Topic union:** Extended from 6 to 8 topics — added `'raspi'` and `'tuya'`
- **FritzBoxDevice:** Added `custom_name?: string | null` and `device_type?: string | null`
- **FritzBoxData:** Added `is_stale: boolean`, `fetched_at: string | null`, `data_freshness: 'LIVE' | 'STALE'`
- **DirigeraData:** Added `data_freshness: 'LIVE' | 'STALE'` (inline, 2-state)
- **NetatmoData:** Replaced `type = Record<string, unknown>` with typed interface containing `body`, `status`, `time_server`, `data_freshness`, and index signature
- **HueData:** Added `data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE'` (3-state inline), kept lights/groups as arrays per D-01
- **SonosData:** Added `data_freshness: SonosDataFreshness` (imported 2-state type)
- **RaspiData:** New interface — `cpu_percent`, `memory`, `disk`, `system`, `data_freshness: 'LIVE'`
- **TuyaData:** New interface — `plugs: TuyaPlug[] | null`, `data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE'`
- **TopicDataMap:** Added `raspi: RaspiData` and `tuya: TuyaData` entries

### app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts (Rule 1 auto-fix)

- Added `data_freshness: 'LIVE'` to `mockWsPayload` (DirigeraData mock)
- Added `data_freshness: 'LIVE'` to inline mock in empty sensors test case

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing data_freshness in useDirigeraData test mocks**
- **Found during:** Task 1 (npx tsc --noEmit check)
- **Issue:** DirigeraData mock objects in `useDirigeraData.test.ts` lacked the newly required `data_freshness` field, causing TS2741 and TS2352 errors
- **Fix:** Added `data_freshness: 'LIVE'` to `mockWsPayload` and inline empty-sensors mock
- **Files modified:** `app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts`
- **Commit:** 3d8c96e4

## Verification Results

- `npx tsc --noEmit` — EXIT_CODE: 0 (zero TypeScript errors)
- `npm test` (relevant suites) — 318 tests passed across 14 suites, 0 failures
- All acceptance criteria met:
  - Topic union contains 'raspi' and 'tuya'
  - `is_stale: boolean` in FritzBoxData (1 occurrence)
  - `fetched_at: string | null` in FritzBoxData (1 occurrence)
  - `export interface NetatmoData` (not type alias)
  - `lights: HueLight[] | null` (array preserved, D-01)
  - RaspiData — 2 occurrences (interface + TopicDataMap)
  - TuyaData — 2 occurrences (interface + TopicDataMap)
  - `raspi: RaspiData` in TopicDataMap
  - `tuya: TuyaData` in TopicDataMap
  - SonosDataFreshness in import and SonosData

## Known Stubs

None — all types are fully specified with correct field shapes per docs/api/websocket.md.

## Self-Check: PASSED
- types/websocket.ts exists: FOUND
- Commit 3d8c96e4 exists: FOUND
- `npx tsc --noEmit` exits 0: CONFIRMED
