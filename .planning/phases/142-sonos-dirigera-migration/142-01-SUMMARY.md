---
phase: 142-sonos-dirigera-migration
plan: "01"
subsystem: sonos
tags: [websocket, migration, polling-fallback, hooks]
requirements_completed: [MIG-09, MIG-10]
dependency_graph:
  requires: []
  provides: [useSonosData-ws-primary]
  affects: [SonosCard, useSonosFullData, useSonosCommands]
tech_stack:
  added: []
  patterns: [ws-primary-with-polling-fallback, ref-pattern-stale-closure, fire-and-forget-side-fetch]
key_files:
  created: []
  modified:
    - app/components/devices/sonos/hooks/useSonosData.ts
    - app/components/devices/sonos/hooks/__tests__/useSonosData.test.ts
key_decisions:
  - "Groups from WS map to SonosZoneResponse[] via cast (identical shape, no adapter needed)"
  - "fetchHealthRef/fetchPlaybackRef prevent stale closures in WS useEffect (Phase 140/141 pattern)"
  - "speakerCount/zoneCount derived from WS payload (speakers.length / groups.length), not from health.device_count"
metrics:
  duration: "~15 minutes"
  completed: 2026-03-27
  tasks_completed: 2
  files_modified: 2
requirements: [MIG-09, MIG-10]
---

# Phase 142 Plan 01: useSonosData WS Migration Summary

Migrated `useSonosData` from HTTP-only polling to WebSocket-primary with HTTP polling fallback using the established Phase 141 pattern. Added comprehensive WS test coverage.

## What Was Built

**useSonosData.ts** — WS-primary Sonos data hook with polling fallback:
- Subscribes to `'sonos'` WS topic via `useWebSocketContext()` when connection is OPEN
- Maps `WsSonosData.groups` directly to `SonosZoneResponse[]` (shapes are compatible — cast via `unknown`)
- Derives `speakerCount` from `wsData.speakers?.length ?? 0` and `zoneCount` from `groups.length`
- Fires playback and health as fire-and-forget HTTP side-fetches after each WS message
- Gates polling: `interval: isWsConnected ? null : interval` (suppresses polling while WS is live)
- `fetchHealthRef` / `fetchPlaybackRef` pattern prevents stale closure bugs in WS useEffect

**useSonosData.test.ts** — WS test cases added (7 new tests):
1. Subscribes to `sonos` topic when WS is OPEN
2. Does not subscribe when WS is CLOSED
3. Maps WS groups to zones and derives speakerCount/zoneCount
4. Fires playback side-fetch after WS data update
5. Fires health side-fetch after WS data update
6. Suppresses polling interval (passes `null`) when WS connected
7. Cleans up subscription on unmount

All 49 tests pass (7 existing HTTP + 7 new WS + 35 from other test suites in the same run).

## Public Interface

`UseSonosDataReturn` and `SonosData` interfaces unchanged — no downstream component changes needed.

## Commits

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Migrate useSonosData to WS-primary | 2b2e185b |
| 2 | Add WS test cases to useSonosData | 64a0c2d2 |

## Deviations from Plan

None — plan executed exactly as written. The Phase 141 pattern applied cleanly to Sonos. WS `SonosData.groups` maps to `SonosZoneResponse[]` without an adapter layer (shapes match).

## Self-Check: PASSED

- `app/components/devices/sonos/hooks/useSonosData.ts` — exists, contains `subscribe('sonos'`, `isWsConnected ? null : interval`
- `app/components/devices/sonos/hooks/__tests__/useSonosData.test.ts` — exists, contains `readyState: ReadyState.OPEN`, `describe('WebSocket primary channel'`
- Commit `2b2e185b` — present in git log
- Commit `64a0c2d2` — present in git log
- `npm test -- --testPathPatterns="useSonosData" --no-coverage` — 49 passed, 0 failed
