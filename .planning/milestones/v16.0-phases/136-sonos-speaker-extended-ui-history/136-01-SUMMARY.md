---
phase: 136-sonos-speaker-extended-ui-history
plan: 01
subsystem: sonos
tags: [hooks, components, eq, home-theater, grouping, history, recharts]
dependency_graph:
  requires:
    - types/sonosProxy.ts (SonosEqResponse, SonosHomeTheaterResponse, SonosHistoryResponse, SetEqRequest, SetHomeTheaterRequest, SwitchSourceRequest, JoinRequest)
    - lib/hooks/useRetryableCommand
    - app/components/devices/sonos/hooks/useSonosCommands.ts
    - app/components/devices/sonos/hooks/useSonosFullData.ts
  provides:
    - app/components/devices/sonos/hooks/useSonosHistory.ts (on-demand history hook)
    - app/components/devices/sonos/components/SonosEqControls.tsx
    - app/components/devices/sonos/components/SonosHomeTheater.tsx
    - app/components/devices/sonos/components/SonosSourceSwitch.tsx
    - app/components/devices/sonos/components/SonosGroupControls.tsx
    - app/components/devices/sonos/components/SonosHistoryChart.tsx
  affects:
    - plan 136-02 (wires components into zone page)
tech_stack:
  added: []
  patterns:
    - on-demand fetch hook with no auto-polling (useSonosHistory)
    - 250ms debounce with useRef + clearTimeout for sliders
    - hooks before early return (effects before role/data guards)
    - next/dynamic for Recharts tree-shaking (SonosVolumeChart)
    - soundbar role guard for SonosHomeTheater and SonosSourceSwitch
key_files:
  created:
    - app/components/devices/sonos/hooks/useSonosHistory.ts
    - app/components/devices/sonos/components/SonosEqControls.tsx
    - app/components/devices/sonos/components/SonosHomeTheater.tsx
    - app/components/devices/sonos/components/SonosSourceSwitch.tsx
    - app/components/devices/sonos/components/SonosGroupControls.tsx
    - app/components/devices/sonos/components/SonosHistoryChart.tsx
    - app/components/devices/sonos/components/SonosVolumeChart.tsx
    - app/components/devices/sonos/hooks/__tests__/useSonosHistory.test.ts
    - app/components/devices/sonos/components/__tests__/SonosEqControls.test.tsx
    - app/components/devices/sonos/components/__tests__/SonosHomeTheater.test.tsx
    - app/components/devices/sonos/components/__tests__/SonosSourceSwitch.test.tsx
    - app/components/devices/sonos/components/__tests__/SonosGroupControls.test.tsx
    - app/components/devices/sonos/components/__tests__/SonosHistoryChart.test.tsx
  modified:
    - app/components/devices/sonos/hooks/useSonosCommands.ts (5 new handlers + imports)
    - app/components/devices/sonos/hooks/useSonosFullData.ts (eqData + homeTheaterData)
    - app/components/devices/sonos/hooks/__tests__/useSonosCommands.test.ts (tests 13-14)
decisions:
  - SonosVolumeChart extracted as separate file for next/dynamic (not inline function — dynamic() requires a stable import path)
  - hooks (useEffect) placed before early-return guards to satisfy React hooks rules
  - fetchHistory wrapped in useCallback with all filter deps to allow useEffect dependency tracking in SonosHistoryChart
  - SonosHistoryChart test mocks next/dynamic with inline component to avoid SSR complexity
metrics:
  duration: 7m
  completed: 2026-03-25
  tasks_completed: 2
  files_modified: 15
---

# Phase 136 Plan 01: Sonos Extended UI Data Layer and Components Summary

Extend Sonos hooks with per-speaker EQ/HT data and 5 command handlers, create useSonosHistory on-demand hook, and build 5 new presentational components (EQ, HomeTheater, SourceSwitch, GroupControls, HistoryChart) with full unit test coverage.

## Completed Tasks

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Extend useSonosCommands + useSonosFullData + create useSonosHistory | f8f6e907 |
| 2 | Create 5 presentational components with tests | 5303b907 |

## What Was Built

### Task 1: Hook Extensions

**useSonosCommands.ts** — 5 new handlers added to the existing `sonosExtendedCmd` command:
- `handleSetEq(uid, eq)` → PUT `/api/sonos/speakers/${uid}/eq`
- `handleSetHomeTheater(uid, settings)` → PUT `/api/sonos/speakers/${uid}/home-theater`
- `handleSwitchSource(uid, source)` → POST `/api/sonos/speakers/${uid}/source`
- `handleJoinGroup(uid, targetUid)` → POST `/api/sonos/speakers/${uid}/join`
- `handleUnjoinGroup(uid)` → POST `/api/sonos/speakers/${uid}/unjoin`

All follow the 202 + poll delay + fetchData pattern from handleSetPlayMode.

**useSonosFullData.ts** — Added step 4b in fetchData: parallel `Promise.all([Promise.allSettled(eq...), Promise.allSettled(ht...)])` for all speaker UIDs. Results stored in `eqData` and `homeTheaterData` records (keyed by uid). Failures are silently skipped (Promise.allSettled pattern).

**useSonosHistory.ts** — New on-demand hook. Does NOT auto-poll. State: historyType, timeRange, speakerFilter, zoneFilter. `fetchHistory()` computes ISO start/end from timeRange offsets, builds `/api/sonos/history?type=...&start=...&end=...&limit=200` URL with optional filters. Error sets `'Cronologia non disponibile'`.

### Task 2: Presentational Components

**SonosEqControls** — Expandable EQ panel with bass/treble sliders (-10 to +10) and loudness toggle. Returns null if eqData undefined or all-null. 250ms debounce on sliders, immediate call on loudness.

**SonosHomeTheater** — Expandable HT panel for soundbar role only. 4 toggle buttons (night mode, dialog, sub, surround). Sub gain slider (-15 to +15) visible only when sub_enabled=true. Surround TV + music sliders visible only when surround_enabled=true. All debounced at 250ms.

**SonosSourceSwitch** — Soundbar-only inline segmented button. TV and Line-in options. Active source highlighted with amber-500/80. onClick calls onSwitchSource immediately.

**SonosGroupControls** — Unjoin "Separa" button for non-coordinator members in multi-member zones. Join "Unisci a..." dropdown for standalone coordinators. Excludes own zone from dropdown. Renders nothing for coordinator in multi-member zone.

**SonosHistoryChart** — Full history section with Cronologia heading, type selector (Volume/Riproduzione), time range picker (24h/7g/30g), filter dropdown (speaker or zone per type), loading skeleton, error state, volume LineChart (via next/dynamic), and playback table with empty state.

## Test Coverage

- useSonosCommands.test.ts: 14 tests (Tests 13-14 added for handleSetEq + handleUnjoinGroup)
- useSonosHistory.test.ts: 6 tests (URL construction, filters, error handling)
- SonosEqControls.test.tsx: 8 tests
- SonosHomeTheater.test.tsx: 8 tests
- SonosSourceSwitch.test.tsx: 8 tests
- SonosGroupControls.test.tsx: 6 tests
- SonosHistoryChart.test.tsx: 8 tests
- **Total new tests: 48 | Full Sonos suite: 142 tests, all passing**

## Deviations from Plan

### Non-Deviations (Clarifications)

**SonosVolumeChart as separate file** — The plan mentioned creating it as a "separate non-exported component within the same file or as a small sibling file". Created as a sibling file `SonosVolumeChart.tsx` because `next/dynamic(() => import('./path'))` requires a stable static import path that cannot be an inline function defined in the same module.

None — plan executed as written. All hooks-before-early-return patterns followed React rules (effects placed before conditional returns).

## Known Stubs

None. All components are data-driven with real prop interfaces. SonosHistoryChart uses real useSonosHistory hook. The chart renders only when data is available (not mocked). Plan 136-02 will wire these into the page.

## Self-Check: PASSED
