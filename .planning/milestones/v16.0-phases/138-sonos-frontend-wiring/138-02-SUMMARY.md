---
phase: 138-sonos-frontend-wiring
plan: "02"
subsystem: sonos-frontend
tags: [sonos, seek, zone-volume, components, ui]
dependency_graph:
  requires: [138-01]
  provides: [sonos-seek-control-ui, sonos-zone-volume-ui]
  affects: [app/components/devices/sonos/components/SonosZoneSection.tsx]
tech_stack:
  added: []
  patterns: [optimistic-state-debounce, isDragging-ref, hhmmss-time-utils]
key_files:
  created:
    - app/components/devices/sonos/components/SonosSeekControl.tsx
    - app/components/devices/sonos/components/__tests__/SonosSeekControl.test.tsx
  modified:
    - app/components/devices/sonos/components/SonosZoneSection.tsx
    - __tests__/components/devices/sonos/components/SonosZoneSection.test.tsx
decisions:
  - "SonosSeekControl uses isDragging ref (not state) to prevent position sync during slider drag — avoids extra re-renders"
  - "Zone volume slider defaults to coordinator volume (volumes[zone.coordinator_uid]?.volume ?? 50) — same pattern as SonosSpeakerVolume"
  - "onMouseUp + onTouchEnd both trigger seek call — covers desktop and mobile drag release"
metrics:
  duration_minutes: 10
  completed_date: "2026-03-26"
  tasks_completed: 2
  files_modified: 4
---

# Phase 138 Plan 02: Sonos Seek Control and Zone Volume UI Summary

SonosSeekControl component with hhmmss time utilities, disabled states for stopped/live streams, and zone volume slider wired into SonosZoneSection with 250ms debounce pattern.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Create SonosSeekControl component with tests | bf0b1d6b | SonosSeekControl.tsx, SonosSeekControl.test.tsx |
| 2 | Wire SonosSeekControl and zone volume slider into SonosZoneSection | aec7c11c | SonosZoneSection.tsx, SonosZoneSection.test.tsx |

## Decisions Made

1. **isDragging ref for seek sync** — Using a ref (not state) to track drag state prevents the position from snapping back to server value mid-drag. The ref doesn't trigger re-renders and correctly guards the useEffect sync.

2. **Zone volume defaults to coordinator volume** — `volumes[zone.coordinator_uid]?.volume ?? 50` gives a sensible starting point matching the actual coordinator speaker volume.

3. **Both mouseUp and touchEnd trigger seek** — Desktop and mobile both need the drag-release event to fire the API call.

## Verification Results

- All 7 SonosSeekControl tests pass (disabled states, time display, seek callback)
- All 9 SonosZoneSection tests pass (existing 5 + 4 new)
- 18/18 Sonos test suites in main repo pass (0 regressions)
- SonosZoneSection layout: NowPlaying > Transport > SeekControl > PlayMode+SleepTimer > QueueViewer > ZoneVolume > SpeakerVolumes

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. SonosSeekControl is wired to `commands.handleSeek` (implemented in plan 01) and zone volume is wired to `commands.handleSetZoneVolume` (implemented in plan 01).

## Self-Check: PASSED

- `app/components/devices/sonos/components/SonosSeekControl.tsx` — exists, contains `function hhmmssToSeconds(`, `function secondsToHhmmss(`, `onMouseUp={handleRelease}`, `onSeek(groupId,`
- `app/components/devices/sonos/components/__tests__/SonosSeekControl.test.tsx` — exists, 7 tests, min_lines satisfied
- `app/components/devices/sonos/components/SonosZoneSection.tsx` — exists, contains `import SonosSeekControl`, `SonosSeekControl`, `Volume Zona`, `handleSetZoneVolume`, `setTimeout` with 250 delay
- Commit bf0b1d6b — verified in git log
- Commit aec7c11c — verified in git log
