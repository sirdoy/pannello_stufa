---
phase: 126
plan: 01
subsystem: sonos
tags: [types, proxy-client, haGet, tdd]
dependency_graph:
  requires: [lib/haClient.ts, types/hueProxy.ts]
  provides: [types/sonosProxy.ts, lib/sonos/sonosProxy.ts]
  affects: [126-02-PLAN.md (API routes will import sonosProxy.ts)]
tech_stack:
  added: []
  patterns: [function-module-proxy, haGet-wrapper, tdd-red-green]
key_files:
  created:
    - types/sonosProxy.ts
    - lib/sonos/sonosProxy.ts
    - lib/sonos/__tests__/sonosProxy.test.ts
  modified: []
decisions:
  - "SonosDataFreshness union excludes UNREACHABLE (triggers 503, never in response body) — consistent with D-08"
  - "mute in SonosVolumeHistoryItem is number | null (not boolean) — exactly matches API spec"
  - "No try/catch in proxy functions — errors propagate from haGet per D-14"
metrics:
  duration: 3 minutes
  completed_date: "2026-03-23"
  tasks_completed: 2
  files_created: 3
  files_modified: 0
---

# Phase 126 Plan 01: Sonos Types and Proxy Client Summary

Sonos TypeScript type definitions and proxy client function module using haGet wrappers — establishes typed contract layer for all Sonos API routes in this phase and phases 127-128.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create complete Sonos TypeScript types file | 076a2e9e | types/sonosProxy.ts |
| 2 | Create sonosProxy.ts function module with unit tests | 7d692469 | lib/sonos/sonosProxy.ts, lib/sonos/__tests__/sonosProxy.test.ts |

## Verification

- `grep -c "^export" types/sonosProxy.ts` → 28 (20+ required)
- `grep -c "export async function" lib/sonos/sonosProxy.ts` → 4 (exactly 4 required)
- `npm test -- lib/sonos/__tests__/sonosProxy.test.ts` → 4/4 tests passing
- `npx tsc --noEmit --skipLibCheck` → 0 errors in sonosProxy.ts

## Types Inventory (28 exports)

### Discovery Types (Phase 126)
- `SonosDataFreshness` — `'LIVE' | 'STALE'`
- `SonosHealthResponse` — connected, data_freshness, device_count, last_poll_at, last_success_at
- `SonosDeviceResponse` — uid, name, ip, model, firmware, serial, role, is_visible, is_coordinator
- `SonosDeviceDetailResponse extends SonosDeviceResponse` — + volume, mute, bass, treble, loudness
- `SonosZoneMemberResponse` — uid, name, ip, role
- `SonosZoneResponse` — group_id, label, coordinator_uid, coordinator_name, member_count, members

### Monitoring Types (Phase 127 prep)
- `SonosPlaybackResponse` — group_id, transport_state, title, artist, album, album_art_url, position, duration, source_type
- `SonosVolumeResponse` — uid, volume, mute

### Extended Types (Phase 128 prep)
- `SonosEqResponse` — uid, bass, treble, loudness
- `SonosPlayMode` — NORMAL, REPEAT_ALL, SHUFFLE, SHUFFLE_NOREPEAT, SHUFFLE_REPEAT_ONE, REPEAT_ONE
- `SonosPlayModeResponse` — group_id, play_mode
- `SonosQueueItemResponse` — position, title, artist, album, album_art_url
- `SonosQueueResponse` — group_id, items, total, limit, offset
- `SonosHomeTheaterResponse` — uid, night_mode, dialog_mode, sub_enabled, sub_gain, surround_enabled, surround_volume_tv, surround_volume_music
- `SonosSleepTimerResponse` — group_id, remaining_seconds
- `SonosVolumeHistoryItem` — timestamp, speaker_uid, granularity, volume, **mute: number | null**, avg_volume, min_volume, max_volume, muted_minutes, sample_count
- `SonosPlaybackHistoryItem` — timestamp, group_id, transport_state, title, artist, album, source_type, duration_seconds
- `SonosHistoryResponse` — items, total, granularity, limit, offset

### Command Request Types (Phase 127-128 prep)
- `SetVolumeRequest`, `SetMuteRequest`, `SetSeekRequest`, `SetEqRequest`
- `SetPlayModeRequest`, `SetHomeTheaterRequest`, `SetSleepTimerRequest`
- `SwitchSourceRequest`, `JoinRequest`
- `SonosCommandOkResponse` — status, group_id?, uid?

## Proxy Functions

```typescript
export async function getHealth(): Promise<SonosHealthResponse>     // GET /api/v1/sonos/health
export async function getDevices(): Promise<SonosDeviceResponse[]>  // GET /api/v1/sonos/devices
export async function getDevice(uid: string): Promise<SonosDeviceDetailResponse>  // GET /api/v1/sonos/devices/{uid}
export async function getZones(): Promise<SonosZoneResponse[]>       // GET /api/v1/sonos/zones
```

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — this plan creates infrastructure types and proxy client only. No UI rendering, no data flow, no placeholders.

## Self-Check: PASSED

- [x] types/sonosProxy.ts exists
- [x] lib/sonos/sonosProxy.ts exists
- [x] lib/sonos/__tests__/sonosProxy.test.ts exists
- [x] Commit 076a2e9e found in git log
- [x] Commit 7d692469 found in git log
