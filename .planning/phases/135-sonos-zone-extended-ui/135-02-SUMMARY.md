---
phase: 135-sonos-zone-extended-ui
plan: "02"
subsystem: sonos-ui
tags: [sonos, ui, play-mode, sleep-timer, queue, presentational-components]
dependency_graph:
  requires: [135-01-sonos-hooks]
  provides: [play-mode-controls-ui, sleep-timer-ui, queue-viewer-ui, zone-section-extended]
  affects: []
tech_stack:
  added: []
  patterns: [presentational components wired via zone section, on-demand expand for queue, decomposePlayMode/composePlayMode truth table]
key_files:
  created:
    - app/components/devices/sonos/components/SonosPlayModeControls.tsx
    - app/components/devices/sonos/components/SonosSleepTimer.tsx
    - app/components/devices/sonos/components/SonosQueueViewer.tsx
    - app/components/devices/sonos/components/__tests__/SonosPlayModeControls.test.tsx
    - app/components/devices/sonos/components/__tests__/SonosSleepTimer.test.tsx
    - app/components/devices/sonos/components/__tests__/SonosQueueViewer.test.tsx
  modified:
    - app/components/devices/sonos/components/SonosZoneSection.tsx
    - app/sonos/page.tsx
decisions:
  - "SonosPlayModeControls: crossfade intentionally omitted — not available in HA proxy API per research pitfall 2"
  - "composePlayMode truth table: SHUFFLE=shuffle+repeat, SHUFFLE_NOREPEAT=shuffle only, REPEAT_ALL=repeat only, NORMAL=neither"
  - "SonosQueueViewer: expand state lives in component (not parent) — on-demand fetch on first expand per D-10 and research pitfall 5"
  - "SonosZoneSection layout: NowPlaying > Transport > PlayMode+SleepTimer row (flex-col sm:flex-row) > QueueViewer > Volume"
metrics:
  duration_minutes: 12
  completed_date: "2026-03-25"
  tasks_completed: 2
  tasks_total: 2
  files_created: 6
  files_modified: 2
requirements: [SONOS-35, SONOS-36, SONOS-37]
---

# Phase 135 Plan 02: Sonos Zone Extended UI Summary

**One-liner:** Three presentational components (play mode toggles, sleep timer presets, expandable queue) wired into SonosZoneSection with ember active styling and correct layout order.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create SonosPlayModeControls, SonosSleepTimer, SonosQueueViewer with tests | 6a216a4e | 6 created |
| 2 | Wire new components into SonosZoneSection and page orchestrator | 1ea6d656 | 2 modified |

## What Was Built

### SonosPlayModeControls

- `decomposePlayMode(mode)` → `{ isShuffle, isRepeat }` — handles all 6 SonosPlayMode enum values
- `composePlayMode(currentMode, toggle)` → new SonosPlayMode — flips requested toggle, preserves the other
- Shuffle button: active (`bg-ember-500/20 text-ember-400`) when `isShuffle`, inactive otherwise
- Repeat button: same active/inactive pattern
- `SHUFFLE` enum maps to shuffle+repeat (both active) per Sonos API semantics
- No crossfade control (not in API)

### SonosSleepTimer

- 5 preset buttons: 15, 30, 45, 60, 90 min (seconds: 900, 1800, 2700, 3600, 5400)
- `formatRemainingTime(seconds)` → "MM:SS" with zero-padding
- Active timer row: Timer icon + countdown in `text-ember-400` + cancel (X) button
- Cancel calls `onSetTimer(0)` per API convention
- Presets always visible regardless of timer state

### SonosQueueViewer

- `isExpanded` state local to component — triggers `fetchInitial()` on first expand
- Header button: "Coda" or "Coda (N brani)" with ListMusic icon + chevron
- Empty state: "Coda vuota" when items=[] and not loading
- Track row: position (fixed-width dim) + title (flex-1 truncated) + artist (max-w-[120px] truncated)
- "Carica altri" button visible when `hasMore && !loading`
- Loading states for both initial load and load-more

### SonosZoneSection (extended)

- New props: `playMode: SonosPlayModeResponse | undefined` and `sleepTimer: SonosSleepTimerResponse | undefined`
- Layout order: NowPlaying → Transport → PlayMode+SleepTimer row → QueueViewer → Volume
- PlayMode+SleepTimer flex row: `flex-col sm:flex-row sm:items-center sm:justify-between gap-3`
- Null-safe prop access: `playMode?.play_mode ?? null` and `sleepTimer?.remaining_seconds ?? null`

### page.tsx (sonos)

- Passes `playMode={data.playModes[zone.group_id]}` and `sleepTimer={data.sleepTimers[zone.group_id]}` to each SonosZoneSection

## Test Coverage

| File | Tests | Status |
|------|-------|--------|
| SonosPlayModeControls.test.tsx | 8 | All pass |
| SonosSleepTimer.test.tsx | 7 | All pass |
| SonosQueueViewer.test.tsx | 7 | All pass |
| **New total** | **22** | **All pass** |
| **Full Sonos suite** | **94** | **All pass (no regressions)** |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all components receive real data from Plan 01's hooks which call live API endpoints.

## Self-Check: PASSED
