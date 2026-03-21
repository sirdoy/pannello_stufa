---
phase: 108-frontend-hooks-rewrite
plan: "01"
subsystem: frontend-hooks
tags:
  - hue
  - hooks
  - proxy-migration
  - refactor
dependency_graph:
  requires:
    - 106-01 (GET routes)
    - 107-01 (PUT routes + haPut)
  provides:
    - useLightsData proxy-native shapes
    - useLightsCommands v1 body format
  affects:
    - app/components/devices/lights/LightsCard.tsx (consumer)
tech_stack:
  added: []
  patterns:
    - "202 Accepted + suggested_poll_delay_s delayed refresh (same as Thermorossi v13.0)"
    - "HueGroup.group_id for action endpoints (not grouped_light service lookup)"
    - "HueGroup.lights[] membership check for roomLights filtering"
    - "light.on boolean (flat proxy field, not CLIP v2 light.on.on)"
    - "Brightness 0-254 proxy → 0-100% UI via Math.round(bri / 254 * 100)"
key_files:
  created: []
  modified:
    - app/api/hue/lights/route.ts
    - app/api/hue/rooms/route.ts
    - app/api/hue/scenes/route.ts
    - lib/hue/colorUtils.ts
    - app/components/devices/lights/hooks/useLightsData.ts
    - app/components/devices/lights/hooks/useLightsCommands.ts
    - __tests__/components/devices/lights/hooks/useLightsData.test.ts
    - __tests__/components/devices/lights/hooks/useLightsCommands.test.ts
decisions:
  - "groups (not rooms) is the canonical name in both hook and params — aligns with HueGroup type and proxy field names"
  - "handleSceneActivate takes two args (sceneId, groupId) — caller always has both from scene.group_id"
  - "handleAllLightsToggle uses 2s fixed delay (not suggested_poll_delay_s) for multi-group parallel calls"
  - "setError(null) call at start of each handler is intentional to clear previous errors"
  - "useLightsData test uses jest.spyOn(setTimeout) to resolve immediately — avoids fake timer complexity"
metrics:
  duration: "520s (~9 minutes)"
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_modified: 8
requirements_addressed:
  - UI-01
  - UI-02
  - UI-03
  - UI-04
  - UI-05
  - UI-06
---

# Phase 108 Plan 01: Frontend Hooks Rewrite Summary

Rewrote useLightsData and useLightsCommands hooks for Hue proxy response shapes, fixed collection route array wrapping, and adapted colorUtils for proxy fields.

## What Was Built

**Part A — Route array wrapping (already partially done, committed here):**
- `lights/route.ts`: `success({ lights: data })` replacing raw array spread
- `rooms/route.ts`: `success({ groups: data })` replacing raw array spread
- `scenes/route.ts`: `success({ scenes: data })` replacing raw array spread

**Part B — colorUtils.ts proxy-native:**
- `supportsColor`: uses `light.capability_tier === 'color'` (was checking CLIP v2 `color.gamut`)
- `getCurrentColorHex`: uses proxy `hue` (0-65535) and `saturation` (0-254) fields, converts to degrees/percent
- Added `hslToHex` function for HSL→hex conversion
- Import `HueLight` from `@/types/hueProxy` (removed local interface)

**Task 1 — useLightsData rewrite:**
- Removed ~350 lines of pairing state machine (pairing, pairingStep, discoveredBridges, selectedBridge, pairingCountdown, pairingError, pairingTimerRef)
- Removed connectionMode, remoteConnected state
- Added `stale: boolean` from `data_freshness === 'STALE'`
- `checkConnection`: reads `/api/hue/status`, 503 → connected=false (Bridge UNREACHABLE), otherwise reads `data_freshness`
- `fetchData`: reads wrapped arrays (`groupsData.groups`, `lightsData.lights`, `scenesData.scenes`)
- Renamed `rooms`→`groups`, `selectedRoomId`→`selectedGroupId` throughout
- `roomLights`: filters by `selectedGroup.lights.includes(light.light_id)` (proxy flat membership)
- `effectiveLights = roomLights` (no serviceLights fallback — proxy is single-path)
- `lightsOnCount` uses `light.on` (boolean, not `light.on?.on`)
- `avgBrightness` converts 0-254 → 0-100% via `Math.round((bri ?? 0) / 254 * 100)`
- `selectedGroupId_action = selectedGroup.group_id` for action endpoints

**Task 2 — useLightsCommands rewrite:**
- Removed 8 pairing handlers (~220 lines)
- `UseLightsCommandsParams`: uses `groups` (not `rooms`), no pairing fields
- `handleRoomToggle`: `{ on }` body (v1 flat, NOT `{ on: { on } }`)
- `handleBrightnessChange`: `{ bri: Math.round(brightness * 254 / 100) }` (v1, NOT `{ dimming: { brightness } }`)
- `handleSceneActivate(sceneId, groupId)`: POST `/api/hue/groups/{gid}/scenes/{sid}` with two args
- `handleAllLightsToggle`: iterates `group.group_id` (NOT grouped_light service lookup)
- All commands: 202 + `suggested_poll_delay_s * 1000` before `fetchData`

## Test Results

- useLightsData: 25 tests green
- useLightsCommands: 11 tests green
- Total: 36 tests green

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files exist:
- [x] app/components/devices/lights/hooks/useLightsData.ts
- [x] app/components/devices/lights/hooks/useLightsCommands.ts
- [x] __tests__/components/devices/lights/hooks/useLightsData.test.ts
- [x] __tests__/components/devices/lights/hooks/useLightsCommands.test.ts

### Commits:
- [x] 6eb7f87 — feat(108-01): rewrite useLightsData + fix route array wrapping + colorUtils proxy-native
- [x] 2d68b39 — feat(108-01): rewrite useLightsCommands for v1 body format + 202 delayed refresh + remove pairing
