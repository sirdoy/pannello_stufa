---
phase: 107-control-endpoints
plan: "01"
subsystem: hue-proxy
tags: [hue, proxy, command-wrappers, transport, types]
dependency_graph:
  requires: []
  provides: [haPut, HueLightStateRequest, HueCommandResponse, setLightState, setGroupAction, activateScene]
  affects: [lib/hue/hueProxy.ts, lib/haClient.ts, types/hueProxy.ts]
tech_stack:
  added: []
  patterns: [PUT transport function, 409 pass-through, command wrapper pattern]
key_files:
  created: []
  modified:
    - types/hueProxy.ts
    - lib/haClient.ts
    - lib/hue/hueProxy.ts
    - lib/hue/__tests__/hueProxy.test.ts
decisions:
  - "haPut is a direct copy of haPost with method changed to PUT — no abstraction over method, consistent with codebase pattern"
  - "409 CONFLICT inserted before the catch-all EXTERNAL_API_ERROR throw — preserves exact status code for unreachable-light errors"
  - "Command wrappers use body as Record<string, unknown> cast to satisfy haPut/haPost signature while keeping typed parameter"
metrics:
  duration: "2m"
  completed_date: "2026-03-20"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 4
---

# Phase 107 Plan 01: Hue Command Foundations Summary

**One-liner:** haPut transport + 409 CONFLICT pass-through added to haClient, with HueLightStateRequest/HueCommandResponse types and three command wrappers (setLightState, setGroupAction, activateScene) backed by 12 passing unit tests.

## What Was Built

Foundation layer for Hue write operations:

1. **types/hueProxy.ts** — Added `HueLightStateRequest` (v1 flat format: on, bri, ct, hue, sat, effect, alert) and `HueCommandResponse` (discriminated by command field, includes suggested_poll_delay_s and poll_endpoint).

2. **lib/haClient.ts** — Added `haPut<T>` export (PUT transport matching haPost structure) and 409 CONFLICT case in `mapResponseError` (inserted before catch-all to preserve exact status code, not remap to 502).

3. **lib/hue/hueProxy.ts** — Added COMMAND WRAPPERS section with three exports:
   - `setLightState(lightId, body)` → PUT `/api/v1/hue/lights/{lightId}/state`
   - `setGroupAction(groupId, body)` → PUT `/api/v1/hue/groups/{groupId}/action`
   - `activateScene(groupId, sceneId)` → POST `/api/v1/hue/groups/{groupId}/scenes/{sceneId}`

4. **lib/hue/__tests__/hueProxy.test.ts** — Extended mock imports to include `haPost` and `haPut`, added `mockHaPost`/`mockHaPut` typed mocks, `mockCommandResponse` fixture, and 3 new describe blocks (one per command wrapper). All 12 tests pass.

## TDD Execution

- RED: 3 new tests failing (haPut/haPost/activateScene not exported, types not defined) — 9 existing tests passing
- GREEN: All 12 tests passing after adding types + haClient extension + command wrappers

## Verification

- `grep -c "export async function haPut" lib/haClient.ts` → 1
- `grep -c "HTTP_STATUS.CONFLICT" lib/haClient.ts` → 2 (constant definition + usage)
- `grep -c "setLightState\|setGroupAction\|activateScene" lib/hue/hueProxy.ts` → 3
- 12/12 unit tests pass

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| b61c2a2 | feat(107-01): add haPut, 409 handling, and 3 Hue command wrappers |

## Self-Check: PASSED

- types/hueProxy.ts: HueLightStateRequest and HueCommandResponse present
- lib/haClient.ts: haPut export present, HTTP_STATUS.CONFLICT handled
- lib/hue/hueProxy.ts: setLightState, setGroupAction, activateScene present
- lib/hue/__tests__/hueProxy.test.ts: 3 new describe blocks present
- Commit b61c2a2 verified in git log
