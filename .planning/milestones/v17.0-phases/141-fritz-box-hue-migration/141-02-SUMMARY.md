---
phase: 141-fritz-box-hue-migration
plan: "02"
subsystem: lights
tags: [websocket, hue, polling-fallback, tdd, migration]
requirements_completed: [MIG-07, MIG-08]
dependency_graph:
  requires:
    - "139: WebSocketContext + useWebSocketManager infrastructure"
    - "140-01: useStoveData WS migration pattern (reference implementation)"
  provides:
    - "useLightsData WS-primary data channel on 'hue' topic"
    - "Record→array mapping for HueLight and HueGroup WS payloads"
  affects:
    - "LightsCard: near-real-time light state updates via WS"
    - "useLightsData consumers: unchanged public API (frozen)"
tech_stack:
  added: []
  patterns:
    - "WS-primary + polling-fallback (established in Phase 140, replicated here)"
    - "fetchScenesRef pattern: useRef to avoid stale closures in WS useEffect"
    - "Record<string, T> → T[] conversion with key injection for light_id / group_id"
    - "isWsConnected ? null : (connected ? 60000 : null) interval gate"
key_files:
  created: []
  modified:
    - app/components/devices/lights/hooks/useLightsData.ts
    - __tests__/components/devices/lights/hooks/useLightsData.test.ts
decisions:
  - "WS useEffect conditionally subscribes only when isWsConnected=true — avoids dead subscription when WS is CLOSED"
  - "fetchScenesRef ref pattern prevents stale closure for scenes fetch inside WS handleMessage"
  - "capability_tier defaults to 'color' for WS-sourced lights — WS payload has no tier field"
  - "alwaysActive:false preserved — lights are non-critical (unlike stove which uses alwaysActive:true)"
  - "Scenes intentionally excluded from WS payload — remain HTTP fire-and-forget on every WS message"
metrics:
  duration: "~20 minutes"
  completed: "2026-03-27"
  tasks_completed: 2
  files_modified: 2
  tests_added: 13
  tests_total: 38
---

# Phase 141 Plan 02: useLightsData WS Migration Summary

**One-liner:** WS-primary Hue data hook with Record→array mapping, bri/ct field conversion, and polling suppression when WS is OPEN.

## What Was Built

Migrated `useLightsData` from HTTP-only polling (60s) to WebSocket-primary data channel with polling fallback, following the pattern established by `useStoveData` in Phase 140.

### Key changes in useLightsData.ts

1. **WS imports**: `useWebSocketContext`, `ReadyState`, `HueData`, `WsHueLight`, `WsHueGroup` (aliased to avoid collision with proxy types)

2. **WS subscription useEffect**: subscribes to `'hue'` topic when `isWsConnected=true`, unsubscribes on cleanup

3. **handleMessage**: converts `Record<string, WsHueLight>` to `HueLight[]` with:
   - `light_id` injected from Record key
   - `state.bri` → `brightness`
   - `state.ct` → `ct_mirek`, plus `ct_kelvin` derived as `Math.round(1_000_000 / ct)`
   - `capability_tier: 'color' as const` (WS has no tier field)
   - Null defaults for `hue`, `saturation`, `room_id`, `room_name`

4. **Groups conversion**: `Record<string, WsHueGroup>` → `HueGroup[]` sorted Casa-first

5. **State updates on WS message**: `connected=true`, `stale=false`, `loading=false`, `error=null`

6. **Scenes fire-and-forget**: `fetchScenesRef.current()` called after every WS message

7. **Polling gate**: `interval: isWsConnected ? null : (connected ? 60000 : null)` — WS OPEN suppresses polling

### TDD cycle

- **RED** (commit `ddcc2610`): 13 WS integration tests added, 6 failed (subscription/mapping/unmount tests)
- **GREEN** (commit `7182b104`): Implementation added, all 38 tests pass (25 existing HTTP + 13 new WS)

## Test Coverage

| Test | Description | Status |
|------|-------------|--------|
| subscribes to 'hue' topic when OPEN | mockSubscribe called with ('hue', fn) | PASS |
| does NOT subscribe when CLOSED | mockSubscribe not called | PASS |
| interval=null when WS OPEN | polling suppressed | PASS |
| interval=60000 when WS CLOSED + connected=true | polling fallback | PASS |
| interval=null when WS CLOSED + connected=false | not polling when disconnected | PASS |
| alwaysActive=false preserved | non-critical lights | PASS |
| Record lights → array with light_id | key injection | PASS |
| bri → brightness mapping | field mapping | PASS |
| ct → ct_mirek + derived ct_kelvin | field mapping + derivation | PASS |
| Record groups → sorted array Casa first | sort order | PASS |
| connected=true, stale=false on WS message | state updates | PASS |
| scenes fetch fire-and-forget | scenes on every WS message | PASS |
| unsubscribes on unmount | cleanup | PASS |

## Deviations from Plan

None — plan executed exactly as written.

The WS useEffect in the implementation conditionally subscribes based on `isWsConnected` (guard at top of effect), which slightly differs from the plan's `[isWsConnected, subscribe, unsubscribe]` dependency approach but is functionally equivalent and cleaner. All acceptance criteria met.

## Known Stubs

None — all WS mapping logic is fully implemented. Scenes continue via HTTP fire-and-forget as intended (not a stub — this is by design per D-14).

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `ddcc2610` | test | add failing WS integration tests for useLightsData (RED) |
| `7182b104` | feat | migrate useLightsData to WS-primary with polling fallback (GREEN) |

## Self-Check: PASSED

- [x] `app/components/devices/lights/hooks/useLightsData.ts` modified — FOUND
- [x] `__tests__/components/devices/lights/hooks/useLightsData.test.ts` modified — FOUND
- [x] commit `ddcc2610` — FOUND
- [x] commit `7182b104` — FOUND
- [x] 38/38 tests pass in main repo
- [x] `subscribe('hue'` present in useLightsData.ts
- [x] `isWsConnected ? null` present in useLightsData.ts
- [x] `Object.entries(data.lights)` present in useLightsData.ts
