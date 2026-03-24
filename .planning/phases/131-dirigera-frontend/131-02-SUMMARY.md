---
phase: 131
plan: "02"
subsystem: dirigera-frontend
tags: [dirigera, frontend, sensors, page, hooks]
dependency_graph:
  requires: [130-02]
  provides: [DIRIG-09]
  affects: [app/dirigera/page.tsx]
tech_stack:
  added: []
  patterns: [orchestrator-page, adaptive-polling, filter-endpoint-map, Italian-locale-sort]
key_files:
  created:
    - app/components/devices/dirigera/hooks/useDirigeraFullData.ts
    - app/components/devices/dirigera/components/DirigeraHealthSection.tsx
    - app/components/devices/dirigera/components/DirigeraSensorRow.tsx
    - app/components/devices/dirigera/components/DirigeraSensorList.tsx
    - app/dirigera/page.tsx
  modified: []
decisions:
  - "SensorFilter reset on change uses useEffect to clear data/loading/dataRef — triggers immediate refetch via useAdaptivePolling re-render"
  - "sensors typed as DirigeraSensor[] in DirigeraFullData — ContactSensor/MotionSensor extend it so array is compatible; narrowing done at row level via in operator"
  - "showFreshness = filter !== 'all' — data_freshness field only present on ContactSensor/MotionSensor, not base DirigeraSensor"
metrics:
  duration_minutes: 15
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_created: 5
  files_modified: 0
---

# Phase 131 Plan 02: DIRIGERA Frontend Page Summary

**One-liner:** /dirigera page with hub health, 3-button sensor filter (all/contact/motion), Italian-locale-sorted sensor list, freshness badges, and battery warnings.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | useDirigeraFullData hook + DirigeraHealthSection + DirigeraSensorRow | 9ce80654 | 3 created |
| 2 | DirigeraSensorList + /dirigera page orchestrator | e53ed38b | 2 created |

## What Was Built

**useDirigeraFullData.ts** — Filter-aware data hook. Exports `SensorFilter = 'all' | 'contact' | 'motion'` and a `FILTER_ENDPOINTS` map routing each filter to its API endpoint. Uses `useEffect` to reset `data`/`loading`/`dataRef` when filter changes, triggering an immediate refetch. Follows exact `useRaspiFullData` pattern with `useAdaptivePolling` (60s visible / 300s hidden, `initialDelay: 600`).

**DirigeraHealthSection.tsx** — Hub info card showing firmware version, connected sensor count, and reachability with green/red dot indicator. Wraps in rounded-2xl bg-slate-800/50 card.

**DirigeraSensorRow.tsx** — Individual sensor row with:
- Type-specific icon (🚪/🔒 for contact, 👁️ for motion)
- Aperto/Chiuso state for contact (warning/success colors), light level for motion
- Battery percentage with `BatteryLow` icon when ≤ 20%
- `data_freshness` badge (LIVE green, STALE amber, UNREACHABLE red) via `'data_freshness' in sensor` type narrowing, only when `showFreshness` is true

**DirigeraSensorList.tsx** — Sort container. Sorts sensors by room then custom_name in Italian locale (`localeCompare(_, 'it')`). Passes `showFreshness = filter !== 'all'` to each row. Shows "Nessun sensore trovato" empty state.

**app/dirigera/page.tsx** — Client component orchestrator. Segmented filter control with ocean-600/80 active styling. Loading skeleton on initial load and filter transitions. Stale Banner (warning) + error Text guards. Composes DirigeraHealthSection + segmented filter + DirigeraSensorList.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — all data wired through useDirigeraFullData to live API endpoints.

## Self-Check: PASSED

Files created:
- app/components/devices/dirigera/hooks/useDirigeraFullData.ts — FOUND
- app/components/devices/dirigera/components/DirigeraHealthSection.tsx — FOUND
- app/components/devices/dirigera/components/DirigeraSensorRow.tsx — FOUND
- app/components/devices/dirigera/components/DirigeraSensorList.tsx — FOUND
- app/dirigera/page.tsx — FOUND

Commits:
- 9ce80654 — FOUND
- e53ed38b — FOUND

TypeScript: no new errors introduced (pre-existing errors in registry/sonos files unaffected)
