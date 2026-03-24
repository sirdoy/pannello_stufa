---
phase: 129
plan: "02"
subsystem: sonos-frontend
tags: [sonos, frontend, hooks, page, transport-controls, volume]
dependency_graph:
  requires: ["129-01", "126-01", "126-02", "127-01", "127-02", "128-01", "128-02"]
  provides: ["sonos-page", "useSonosFullData", "useSonosCommands", "sonos-zone-components"]
  affects: ["app/sonos/page.tsx", "navigation"]
tech_stack:
  added: []
  patterns: ["orchestrator-hook-pattern", "Promise.allSettled-resilience", "202-poll-pattern", "debounced-input"]
key_files:
  created:
    - app/components/devices/sonos/hooks/useSonosFullData.ts
    - app/components/devices/sonos/hooks/useSonosCommands.ts
    - app/components/devices/sonos/hooks/__tests__/useSonosFullData.test.ts
    - app/components/devices/sonos/hooks/__tests__/useSonosCommands.test.ts
    - app/components/devices/sonos/components/SonosNowPlaying.tsx
    - app/components/devices/sonos/components/SonosTransportControls.tsx
    - app/components/devices/sonos/components/SonosSpeakerVolume.tsx
    - app/components/devices/sonos/components/SonosZoneSection.tsx
    - app/sonos/page.tsx
  modified: []
decisions:
  - "[Phase 129-02]: useSonosFullData exposes fetchData for command hook — enables post-command refresh without prop drilling"
  - "[Phase 129-02]: SonosSpeakerVolume uses 250ms debounce with localVolume optimistic state — avoids flooding PUT requests on slider drag"
  - "[Phase 129-02]: Promise.allSettled for both playback and volume fetches — individual zone/speaker failures don't break the whole page"
metrics:
  duration_seconds: 266
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_created: 9
  files_modified: 0
requirements:
  - SONOS-32
---

# Phase 129 Plan 02: Sonos Frontend Page Summary

**One-liner:** /sonos page with zone-based playback controls, transport buttons (play/pause/stop/next/prev), and per-speaker volume sliders with 250ms debounce using useSonosFullData + useSonosCommands hooks.

## What Was Built

A complete /sonos page following the orchestrator pattern (same as /raspi and /lights). The page displays all Sonos zones, each with:
- Current track information (now-playing or "Nessuna riproduzione" fallback)
- Transport controls (previous/play-pause/stop/next)
- Per-speaker volume sliders with debouncing and mute toggles
- Loading skeleton on initial load
- Stale/error banners

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | useSonosFullData + useSonosCommands hooks + unit tests | 1310cf1f | 4 files (2 hooks + 2 test files) |
| 2 | Presentational sub-components + /sonos page orchestrator | 1c99eab7 | 5 files (4 components + page) |

## Key Design Decisions

1. **useSonosFullData exposes fetchData** — command hook receives it as param rather than re-fetching internally, following the useLightsCommands pattern
2. **Promise.allSettled for playback + volume** — zone/speaker failures are isolated; if one zone's playback fails (e.g., disappeared zone), others still render
3. **250ms debounce with optimistic localVolume state** — slider shows immediate feedback while debounced PUT fires after drag settles
4. **Two separate useRetryableCommand hooks** — `sonosTransportCmd` (POST transport) and `sonosVolumeCmd` (PUT volume/mute) at top level per React hooks rules

## Testing

- 16 unit tests for hooks (7 for useSonosFullData, 9 for useSonosCommands)
- All 59 Sonos tests pass (includes pre-existing tests from earlier phases)
- TDD: RED (tests written first, confirmed failing) → GREEN (implementation makes tests pass)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data is wired from real API endpoints via useSonosFullData.

## Self-Check: PASSED

Files created:
- FOUND: app/components/devices/sonos/hooks/useSonosFullData.ts
- FOUND: app/components/devices/sonos/hooks/useSonosCommands.ts
- FOUND: app/components/devices/sonos/hooks/__tests__/useSonosFullData.test.ts
- FOUND: app/components/devices/sonos/hooks/__tests__/useSonosCommands.test.ts
- FOUND: app/components/devices/sonos/components/SonosNowPlaying.tsx
- FOUND: app/components/devices/sonos/components/SonosTransportControls.tsx
- FOUND: app/components/devices/sonos/components/SonosSpeakerVolume.tsx
- FOUND: app/components/devices/sonos/components/SonosZoneSection.tsx
- FOUND: app/sonos/page.tsx

Commits present:
- FOUND: 1310cf1f (feat(129-02): hooks + tests)
- FOUND: 1c99eab7 (feat(129-02): components + page)
