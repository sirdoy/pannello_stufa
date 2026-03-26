---
phase: 136-sonos-speaker-extended-ui-history
plan: 02
subsystem: sonos
tags: [components, integration, eq, home-theater, grouping, history, page]
dependency_graph:
  requires:
    - app/components/devices/sonos/components/SonosEqControls.tsx (plan 136-01)
    - app/components/devices/sonos/components/SonosHomeTheater.tsx (plan 136-01)
    - app/components/devices/sonos/components/SonosSourceSwitch.tsx (plan 136-01)
    - app/components/devices/sonos/components/SonosGroupControls.tsx (plan 136-01)
    - app/components/devices/sonos/components/SonosHistoryChart.tsx (plan 136-01)
    - app/components/devices/sonos/hooks/useSonosFullData.ts (eqData + homeTheaterData fields)
    - app/components/devices/sonos/hooks/useSonosCommands.ts (5 extended handlers)
  provides:
    - app/components/devices/sonos/components/SonosSpeakerVolume.tsx (extended with 4 sub-components)
    - app/components/devices/sonos/components/SonosZoneSection.tsx (passes extended data to speakers)
    - app/sonos/page.tsx (Cronologia section below zones)
    - __tests__/components/devices/sonos/components/SonosZoneSection.test.tsx
  affects:
    - /sonos page: per-speaker EQ/HT/source/group controls visible to user
    - /sonos page: history chart at bottom of page
tech_stack:
  added: []
  patterns:
    - prop threading: eqData/homeTheaterData keyed by uid, allZones for group controls
    - soundbar role guard: SonosSourceSwitch and SonosHomeTheater self-render null for non-soundbar
    - EQ null guard: SonosEqControls self-renders null when all fields null
    - group controls: join dropdown for standalone coordinator, unjoin for non-coordinator member
    - history speakers array: derived from flatMap over zones.members with dedup via Set
key_files:
  created:
    - __tests__/components/devices/sonos/components/SonosZoneSection.test.tsx
  modified:
    - app/components/devices/sonos/components/SonosSpeakerVolume.tsx (4 new imports + 8 new props + 4 sub-component render slots)
    - app/components/devices/sonos/components/SonosZoneSection.tsx (3 new props + extended speaker prop passthrough)
    - app/sonos/page.tsx (SonosHistoryChart import + render + 3 new SonosZoneSection props)
decisions:
  - SonosSourceSwitch and SonosGroupControls rendered outside the main volume row div (below it) to keep the row layout clean
  - speakers prop for SonosHistoryChart uses Set dedup to handle members appearing in multiple zones edge case
  - SonosZoneSection allZones filter excludes current zone.group_id for join target list (user cannot join their own zone)
metrics:
  duration: 5m
  completed: 2026-03-25
  tasks_completed: 2
  files_modified: 4
---

# Phase 136 Plan 02: Sonos Extended UI Integration Summary

Wire the 5 new components from Plan 01 into SonosSpeakerVolume, SonosZoneSection, and the /sonos page — per-speaker EQ/HT/source/group controls + Cronologia history section.

## What Was Built

### SonosSpeakerVolume — Extended with 4 sub-component slots

Added 9 new props: `role`, `eqData`, `htData`, `currentSource`, `isCoordinator`, `zoneMemberCount`, `availableZones`, and 5 command handlers (`onSetEq`, `onSetHomeTheater`, `onSwitchSource`, `onJoinGroup`, `onUnjoinGroup`).

Each speaker row now renders below the volume slider:
- `SonosSourceSwitch` — TV/Line-in buttons, visible only for soundbar role
- `SonosGroupControls` — join dropdown (standalone coordinators) or unjoin button (non-coordinator members)
- `SonosEqControls` — expandable bass/treble/loudness panel, hidden when no EQ data
- `SonosHomeTheater` — expandable HT panel (night mode, dialog, sub, surround), soundbar only

### SonosZoneSection — Extended data passthrough

Added `eqData: Record<string, SonosEqResponse>`, `homeTheaterData: Record<string, SonosHomeTheaterResponse>`, `allZones: SonosZoneResponse[]` to props interface.

Each `SonosSpeakerVolume` receives:
- `eqData={eqData[member.uid]}` — per-speaker EQ data lookup
- `htData={homeTheaterData[member.uid]}` — per-speaker HT data lookup
- `currentSource={playback?.source_type ?? null}` — zone-level source for source switch
- `isCoordinator={member.uid === zone.coordinator_uid}` — derived from zone data
- `availableZones` filtered to exclude current zone (join target list)
- All 5 extended command handlers from `commands`

### /sonos page.tsx — SonosHistoryChart and extended zone data

- Added `import SonosHistoryChart from '@/app/components/devices/sonos/components/SonosHistoryChart'`
- Each `SonosZoneSection` now receives `eqData={data.eqData}`, `homeTheaterData={data.homeTheaterData}`, `allZones={data.zones}`
- `SonosHistoryChart` renders below all zone sections when at least one zone exists
- `speakers` prop built via `flatMap` + `Set` dedup on all zone members

### SonosZoneSection.test.tsx

New test suite with 5 tests:
- Renders zone label
- Renders SonosSpeakerVolume for each zone member
- Passes eqData to correct speaker (RINCON_A has EQ data, RINCON_B does not)
- Renders NowPlaying, TransportControls, QueueViewer sub-sections
- Renders member count in header

All 17 sonos test suites in the working tree pass.

## Deviations from Plan

None — plan executed exactly as written. The SonosSourceSwitch and SonosGroupControls were placed below the volume row (not inline within the flex row as the plan sketch suggested) to preserve the volume row layout integrity — inline insertion would break the `flex items-center` layout with the range slider.

## Self-Check: PASSED
