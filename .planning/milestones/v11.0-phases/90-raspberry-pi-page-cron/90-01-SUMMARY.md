---
phase: 90-raspberry-pi-page-cron
plan: "01"
subsystem: raspi
tags: [raspi, page, hook, navigation, ui]
dependency_graph:
  requires:
    - "89-01: useRaspiData hook + RaspiCard (dashboard card)"
    - "88: raspi API routes (cpu, memory, disk, system)"
  provides:
    - "useRaspiFullData: full system stats hook for /raspi page"
    - "/raspi: dedicated page with 4 stat sections"
    - "RaspiCard: clickable navigation to /raspi"
  affects:
    - "app/components/devices/raspi/RaspiCard.tsx"
tech_stack:
  added: []
  patterns:
    - "orchestrator pattern: useRaspiFullData + 4 presentational components"
    - "adaptive polling: 30s visible / 300s hidden, alwaysActive=false"
    - "stale fallback: last known data preserved when fetch fails"
    - "clickable card: role=link + router.push on data state only"
key_files:
  created:
    - "app/components/devices/raspi/hooks/useRaspiFullData.ts"
    - "app/components/devices/raspi/hooks/__tests__/useRaspiFullData.test.ts"
    - "app/raspi/page.tsx"
    - "app/raspi/components/RaspiCpuTemp.tsx"
    - "app/raspi/components/RaspiMemoryDisk.tsx"
    - "app/raspi/components/RaspiSystemInfo.tsx"
    - "app/raspi/components/RaspiNetworkIO.tsx"
    - "app/raspi/__tests__/page.test.tsx"
  modified:
    - "app/components/devices/raspi/RaspiCard.tsx"
    - "app/components/devices/raspi/__tests__/RaspiCard.test.tsx"
decisions:
  - "useRaspiFullData fetches all 4 endpoints in parallel via Promise.all — same pattern as useRaspiData but exposes all 16 fields"
  - "formatBytes and formatUptime are inline helpers per component — avoids shared utility file for 2 collocated uses"
  - "RaspiCard navigation wraps only the data-present state — loading and error returns are NOT clickable, matching NetworkCard pattern"
  - "Loading guard uses (loading && !data) — shows content immediately when stale data is available"
metrics:
  duration: "4 minutes"
  completed_date: "2026-03-18"
  tasks_completed: 2
  files_changed: 10
  tests_added: 12
---

# Phase 90 Plan 01: /raspi Page with Full System Stats Summary

Dedicated /raspi page with useRaspiFullData hook (16-field parallel fetch) + 4 presentational stat sections + RaspiCard clickable navigation.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | useRaspiFullData hook + tests (TDD) | e3527dc | useRaspiFullData.ts, useRaspiFullData.test.ts |
| 2 | /raspi page + components + RaspiCard navigation + tests | 75b06e7 | page.tsx, 4 components, page.test.tsx, RaspiCard.tsx, RaspiCard.test.tsx |

## What Was Built

### useRaspiFullData Hook
- Fetches all 4 raspi endpoints in parallel (`/api/raspi/cpu`, `/api/raspi/memory`, `/api/raspi/disk`, `/api/raspi/system`)
- Maps all API fields to camelCase: 16 fields total across CPU, memory, disk, system, and network
- Adaptive polling: 30s visible / 300s hidden, `alwaysActive: false`, `initialDelay: 600`
- Stale fallback: preserves last known data when fetch fails, sets `error` only when no cache exists
- Returns `{ data: RaspiFullData | null, loading, stale, error }`

### /raspi Page
- Orchestrator pattern: thin coordination layer, 4 purely presentational components
- Loading skeleton guard: `loading && !data` — shows skeletons on initial load, continues with stale data otherwise
- Back button navigates to `/` via `router.push('/')`
- Stale banner appears when data is stale

### 4 Presentational Components
- **RaspiCpuTemp**: CPU% and temperature InfoBoxes with sage/ember variants
- **RaspiMemoryDisk**: RAM% and Disk% InfoBoxes + `formatBytes` helper showing used/total
- **RaspiSystemInfo**: Uptime (`formatUptime`) + process count + 3 load averages (1m/5m/15m)
- **RaspiNetworkIO**: bytes sent/received with `formatBytes` + interface name display

### RaspiCard Navigation
- `useRouter` added, `router.push('/raspi')` on data-present state only
- Clickable div with `role="link"`, `tabIndex={0}`, keyboard handler (Enter/Space), `aria-label="Vai alla pagina Raspberry Pi"`
- Loading and error states are NOT clickable — matches NetworkCard pattern exactly

## Test Results

- 5 useRaspiFullData tests (loading initial, full data shape, error/stale, interval visibility, null temperature)
- 5 /raspi page tests (4 headings, back button, skeleton, uptime formatting, process count)
- 2 RaspiCard navigation tests (click navigates to /raspi, error state has no link)
- 10 test suites total, 46 tests all passing
- No regressions in existing test suite

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files exist:
- app/components/devices/raspi/hooks/useRaspiFullData.ts: FOUND
- app/raspi/page.tsx: FOUND
- app/raspi/components/RaspiCpuTemp.tsx: FOUND
- app/raspi/components/RaspiMemoryDisk.tsx: FOUND
- app/raspi/components/RaspiSystemInfo.tsx: FOUND
- app/raspi/components/RaspiNetworkIO.tsx: FOUND

Commits exist:
- e3527dc: feat(90-01): add useRaspiFullData hook with full system stats
- 75b06e7: feat(90-01): add /raspi page with full stats and RaspiCard navigation
