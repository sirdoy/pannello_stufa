---
phase: quick
plan: 260328-jyf
subsystem: websocket-types
tags: [types, websocket, proxy-alignment, refactoring]
dependency_graph:
  requires: [types/hueProxy.ts, types/thermorossiProxy.ts, types/sonosProxy.ts, types/dirigeraProxy.ts]
  provides: [types/websocket.ts with proxy re-exports, simplified WS handlers]
  affects: [useLightsData, useStoveData, useSonosData, useDirigeraData]
tech_stack:
  patterns: [proxy type re-export, direct WS data assignment]
key_files:
  modified:
    - types/websocket.ts
    - app/components/devices/lights/hooks/useLightsData.ts
    - app/components/devices/stove/hooks/useStoveData.ts
    - app/components/devices/sonos/hooks/useSonosData.ts
    - app/components/devices/dirigera/hooks/useDirigeraData.ts
    - __tests__/components/devices/lights/hooks/useLightsData.test.ts
    - __tests__/components/devices/stove/hooks/useStoveData.test.ts
    - app/components/devices/sonos/hooks/__tests__/useSonosData.test.ts
    - app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts
decisions:
  - "Re-export proxy types from websocket.ts for consumer convenience"
  - "Stove WS handler now reads data_freshness from payload instead of hardcoding isStale=false"
  - "Dirigera uses is_open directly from DirigeraSensor (no discriminated union needed)"
metrics:
  duration: 350s
  completed: 2026-03-28
  tasks: 2/2
  tests: 100 passing across 4 suites
---

# Quick Task 260328-jyf: Align WS Types with HA Proxy Types Summary

WS payload types in types/websocket.ts now import from proxy type files instead of defining redundant local interfaces; 4 device hooks simplified by removing manual field-by-field transformation code.

## Changes Made

### Task 1: Replace WS-specific types with proxy type imports (c6e593ec)

Rewrote `types/websocket.ts` to import and re-export from 4 proxy type files:
- **Hue**: Deleted `HueLightState`, `HueLight`, `HueGroupState`, `HueGroup`; imported `HueLight`/`HueGroup` from `hueProxy.ts`. `HueData` changed from `Record<string, X>` to `X[]`
- **Thermorossi**: Deleted `ThermorossiData` (had `stove_state: string` + index signature); aliased to `ThermorossiStatusResponse` (strict `StoveState` union + `data_freshness` + `last_poll_at`)
- **Sonos**: Deleted `SonosSpeaker`, `SonosGroupMember`, `SonosGroup`; imported `SonosDeviceResponse`/`SonosZoneResponse` from `sonosProxy.ts`
- **Dirigera**: Deleted `DirigeraBaseSensor`, `DirigeraContactSensor`, `DirigeraMotionSensor` discriminated union; imported flat `DirigeraSensor` from `dirigeraProxy.ts`
- **Unchanged**: FritzBox (canonical here), Netatmo (raw format, needs adapter), core envelope types

Net result: -82 lines of redundant type definitions.

### Task 2: Simplify WS handlers in 4 device hooks (635f6337)

- **useLightsData**: Removed ~25 lines of Object.entries + map transformation (Record to Array, state flattening, bri->brightness, ct->ct_mirek, capability_tier defaulting). Now assigns `data.lights` and `data.groups` directly with sort
- **useStoveData**: Removed `as StoveState` cast (stove_state is already typed). Now uses `data.data_freshness` and `data.last_poll_at` from WS payload instead of hardcoding `isStale=false`/`new Date()`
- **useSonosData**: Removed `as unknown as SonosZoneResponse[]` unsafe double cast. `wsData.groups` is already `SonosZoneResponse[]`
- **useDirigeraData**: Removed `DirigeraContactSensor` import and `as DirigeraContactSensor` cast. Proxy `DirigeraSensor` has `is_open: boolean | null` at top level -- simpler filter
- **Tests**: Updated all 4 test files with proxy-shaped mock WS payloads. 100 tests pass across 4 suites

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

1. `npx tsc --noEmit` -- zero errors
2. 100 tests pass across 4 hook test suites
3. No `as StoveState` casts in stove hooks
4. No `as unknown as SonosZoneResponse` double casts in sonos hooks
5. No `DirigeraContactSensor`/`DirigeraMotionSensor`/`DirigeraBaseSensor` in types/websocket.ts
6. No `HueLightState`/`HueGroupState` in types/websocket.ts

## Known Stubs

None.

## Self-Check: PASSED
