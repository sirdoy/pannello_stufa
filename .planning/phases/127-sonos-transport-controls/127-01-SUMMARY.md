---
phase: 127-sonos-transport-controls
plan: "01"
subsystem: sonos
tags: [proxy, transport-controls, volume, tdd]
dependency_graph:
  requires: [lib/haClient.ts, types/sonosProxy.ts]
  provides: [lib/sonos/sonosProxy.ts (11 new exports)]
  affects: [app/api/sonos/zones/*/play, app/api/sonos/zones/*/pause, app/api/sonos/zones/*/stop, app/api/sonos/zones/*/next, app/api/sonos/zones/*/previous, app/api/sonos/speakers/*/volume, app/api/sonos/speakers/*/mute, app/api/sonos/zones/*/volume, app/api/sonos/zones/*/seek]
tech_stack:
  added: []
  patterns: [haPost with empty body for transport commands, haPut with typed body for volume/mute/seek]
key_files:
  created:
    - __tests__/lib/sonosProxy.test.ts
  modified:
    - lib/sonos/sonosProxy.ts
decisions:
  - Transport commands (play/pause/stop/next/previous) use haPost with empty {} body, not haPut
  - Volume/mute/seek use haPut with typed body matching SetVolumeRequest / SetMuteRequest / SetSeekRequest interfaces
  - No idempotency wrappers per plan decision D-04
metrics:
  duration_seconds: 95
  completed_date: "2026-03-24"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 1
requirements:
  - SONOS-07
  - SONOS-08
  - SONOS-09
  - SONOS-10
  - SONOS-11
  - SONOS-12
  - SONOS-13
  - SONOS-14
  - SONOS-15
  - SONOS-16
  - SONOS-17
---

# Phase 127 Plan 01: Sonos Transport/Volume/Seek Proxy Wrappers Summary

**One-liner:** 11 typed proxy wrappers for Sonos transport (haPost) and volume/mute/seek (haPut) commands with full unit test coverage.

## What Was Built

Added 11 new exported async functions to `lib/sonos/sonosProxy.ts`, grouped into three sections:

**Monitoring wrappers (haGet):**
- `getPlayback(groupId)` — GET /api/v1/sonos/zones/{groupId}/playback
- `getSpeakerVolume(uid)` — GET /api/v1/sonos/speakers/{uid}/volume

**Transport command wrappers (haPost + empty body):**
- `play(groupId)` — POST /api/v1/sonos/zones/{groupId}/play
- `pause(groupId)` — POST /api/v1/sonos/zones/{groupId}/pause
- `stop(groupId)` — POST /api/v1/sonos/zones/{groupId}/stop
- `next(groupId)` — POST /api/v1/sonos/zones/{groupId}/next
- `previous(groupId)` — POST /api/v1/sonos/zones/{groupId}/previous

**Volume/mute/seek wrappers (haPut + typed body):**
- `setSpeakerVolume(uid, volume)` — PUT /api/v1/sonos/speakers/{uid}/volume
- `setSpeakerMute(uid, mute)` — PUT /api/v1/sonos/speakers/{uid}/mute
- `setZoneVolume(groupId, volume)` — PUT /api/v1/sonos/zones/{groupId}/volume
- `seek(groupId, position)` — PUT /api/v1/sonos/zones/{groupId}/seek

Total exported async functions: 15 (4 Phase 126 reads + 11 new).

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add proxy wrappers + unit tests | 3ce997bb | lib/sonos/sonosProxy.ts, __tests__/lib/sonosProxy.test.ts |

## Verification

```
grep -c "export async function" lib/sonos/sonosProxy.ts
# → 15 ✓

npm test -- --testPathPattern="sonosProxy" --no-coverage
# → 15/15 passed ✓
```

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all functions are fully implemented and wired to haGet/haPost/haPut transport.

## Self-Check: PASSED

- `lib/sonos/sonosProxy.ts` exists: FOUND
- `__tests__/lib/sonosProxy.test.ts` exists: FOUND
- Commit 3ce997bb exists: FOUND
- 15 exported async functions: FOUND
- 15 tests passing: FOUND
