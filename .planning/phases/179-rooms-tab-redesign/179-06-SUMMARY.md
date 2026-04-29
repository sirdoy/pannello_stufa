---
phase: 179
plan: "06"
subsystem: rooms-tab
tags: [ember-glass, rooms, device-bodies, thermostat, lights, debounce, tdd]
dependency_graph:
  requires: [179-01, 179-02]
  provides: [ThermoBody, ValveBody, LightBody]
  affects: [DeviceBody, rooms/index.ts]
tech_stack:
  added: []
  patterns:
    - useDebounce(pending, 500) for thermostat setpoint — mirrors ClimateSheet
    - useDebounce(pending, 250) for brightness — mirrors SonosSheet volume
    - self-fetch pattern (useThermostatData + useLightsData per CONTEXT D-39)
    - Pitfall 8 gate — homeId + roomId guard before any thermostat command
    - Pitfall 5 — String(debounced) for handleBrightnessChange
key_files:
  created:
    - app/components/EmberGlass/rooms/bodies/ThermoBody.tsx
    - app/components/EmberGlass/rooms/bodies/LightBody.tsx
    - app/components/EmberGlass/rooms/__tests__/bodies/ThermoBody.test.tsx
    - app/components/EmberGlass/rooms/__tests__/bodies/LightBody.test.tsx
  modified: []
decisions:
  - "ThermoBody and ValveBody share one file (ThermoOrValveBody internal function); both exported per D-28 / CONTEXT D-69"
  - "LightBody wires useLightsCommands with full lightsData shape + router (LightsSheet pattern) — plan stub was incomplete"
  - "Temperatura slider value hardcoded to 2700K (bundle midpoint) — no live data for color temp"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-29T14:19:55Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 0
---

# Phase 179 Plan 06: ThermoBody + LightBody Debounced Bodies Summary

Two Wave 2 device bodies with real command integration: ThermoBody (exporting ValveBody) with 500ms debounced setpoint, and LightBody with 250ms debounced brightness slider.

## What Was Built

**ThermoBody.tsx** (`app/components/EmberGlass/rooms/bodies/ThermoBody.tsx`):
- Exports both `ThermoBody` and `ValveBody` from a shared `ThermoOrValveBody` function
- Self-fetches `useThermostatData()` to get `topology.home_id` (D-39 self-fetch convention)
- `useThermostatCommands({ homeId, refetch })` wired for setpoint + mode commands
- `useState(initialTarget)` + `useDebounce(pending, 500)` debounces setpoint commits
- `useEffect` fires `setRoomSetpoint(roomId, debounced)` when debounced diverges from initial
- Pitfall 8 gate: `if (!homeId || !roomId) return` short-circuits effect before any network call
- Eco button → `setHomeMode('away')`, Auto button → `setHomeMode('schedule')`
- D-53: unicode minus U+2212 in label `−0.5°` (not hyphen), `+0.5°` with actual plus
- D-28: `DualTempReadout current={current} target={pending}` renders immediately on setState

**LightBody.tsx** (`app/components/EmberGlass/rooms/bodies/LightBody.tsx`):
- Exports `LightBody`
- Self-fetches `useLightsData()` + `useLightsCommands({ lightsData, router })` (LightsSheet pattern)
- `useState(initialBrightness)` + `useDebounce(pending, 250)` debounces brightness commits
- `useEffect` fires `cmds.handleBrightnessChange(groupId, String(debounced))` — Pitfall 5 string cast
- Brightness slider gated on `device.on` + non-empty `groupId`
- Luminosità: interactive `<SliderRow>` (disabled={!device.on}, onChange supplied)
- Temperatura: permanently disabled `<SliderRow>` (no Hue color-temp endpoint — T-179-06-04 accepted)
- D-54: Italian labels "Luminosità" (% unit) and "Temperatura" (K unit, range 2200-6500)

## Tests

- 9 jest tests for ThermoBody — all passing (fake timers for debounce, home_id gate, Eco/Auto modes, ValveBody shape)
- 6 jest tests for LightBody — all passing (fake timers, disabled-slider guard, Pitfall 5 string arg)
- Total: 15 new tests green

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] LightBody useLightsCommands full param shape**
- **Found during:** Task 2 implementation
- **Issue:** Plan stub `useLightsCommands({ fetchData: data.fetchData })` does not match the actual hook signature, which requires `{ lightsData: { setRefreshing, setLoadingMessage, setError, fetchData, groups, checkConnection, connected }, router }`
- **Fix:** Wired the full params as LightsSheet does (self-fetch `useLightsData()` + `useRouter()`), passing the complete `lightsData` shape. This is the established pattern and the only correct wiring.
- **Files modified:** `app/components/EmberGlass/rooms/bodies/LightBody.tsx`
- **Commit:** 5bd90881

### Plan Execution Notes

- Comment in ThermoBody.tsx removed `useMemo/useCallback` keyword to satisfy grep gate (acceptance criteria requires 0 grep matches — the words appeared in a JSDoc comment)
- Temperatura slider shows `value={2700}` (bundle midpoint) — no live color-temp data from aggregator; color-temp is static in EXTRA_DEVICES and not provided for real Hue lights per CONTEXT D-29

## Known Stubs

- `LightBody` Temperatura slider: hardcoded `value={2700}` — no live color-temp from any provider. Slider renders for visual fidelity per D-29 / T-179-06-04. Future phase ships `handleColorTempChange(lightId, K)`.

## Threat Flags

None — both trust boundaries (ThermoBody → setRoomSetpoint/setHomeMode, LightBody → handleBrightnessChange) were already in the plan's threat model and all mitigations are implemented (Pitfall 8 gate, 500/250ms debounce, Pitfall 5 String cast).

## Self-Check: PASSED

- `app/components/EmberGlass/rooms/bodies/ThermoBody.tsx` — FOUND
- `app/components/EmberGlass/rooms/bodies/LightBody.tsx` — FOUND
- `app/components/EmberGlass/rooms/__tests__/bodies/ThermoBody.test.tsx` — FOUND
- `app/components/EmberGlass/rooms/__tests__/bodies/LightBody.test.tsx` — FOUND
- Commit a6e187a0 (ThermoBody) — verified in git log
- Commit 5bd90881 (LightBody) — verified in git log
- 15 tests passing
- 0 useMemo/useCallback in production code
- Acceptance gate (no setRoomMode on/off) — PASSES
