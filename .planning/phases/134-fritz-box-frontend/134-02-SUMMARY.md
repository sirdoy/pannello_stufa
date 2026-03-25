---
phase: 134
plan: "02"
subsystem: fritz-box-frontend
tags: [orchestrator, tabs, tier-toggle, bandwidth-chart, fritz-box, network, page]
dependency_graph:
  requires:
    - 134-01
  provides:
    - HistoryTierToggle
    - BandwidthChart (extended with tier support)
    - NetworkPage (updated orchestrator with tabs + SystemInfoCard)
  affects:
    - app/network/page.tsx (fully updated)
tech_stack:
  added: []
  patterns:
    - Tab navigation with cn-based active border styling (ember-400 border-b-2)
    - Conditional hook pausing via paused prop (wifi/servizi tabs only fetch when active)
    - Backward-compatible optional props with defaults for BandwidthChart extension
    - Tier-aware X-axis formatters (HH:mm:ss realtime, dd/MM HH:mm hourly, dd/MM daily)
key_files:
  created:
    - app/network/components/HistoryTierToggle.tsx
    - app/network/components/__tests__/HistoryTierToggle.test.tsx
  modified:
    - app/network/components/BandwidthChart.tsx
    - app/network/page.tsx
decisions:
  - "BandwidthChart tier props are all optional with defaults — fully backward-compatible (activeTier='realtime')"
  - "TimeRangeSelector hidden when activeTier is not 'realtime' — irrelevant for aggregated data"
  - "wifiClients/networkServices hooks paused when their tab is inactive — avoids unnecessary polling"
  - "Tab navigation uses native button elements with cn + ember-400 border-b-2 active styling — no extra UI component dependency"
metrics:
  duration: "~600 seconds (~10 minutes)"
  completed_date: "2026-03-25"
  tasks: 2
  files: 4
---

# Phase 134 Plan 02: Network Page Orchestrator & Tier Toggle Summary

**One-liner:** HistoryTierToggle component + BandwidthChart extended with tier support + /network page updated with SystemInfoCard, 3-tab navigation (Dispositivi/WiFi Clients/Servizi di Rete), and bandwidth tier wiring.

## What Was Built

### Task 1: HistoryTierToggle + BandwidthChart Extension

**`app/network/components/HistoryTierToggle.tsx`** — 3-option button group following TimeRangeSelector pattern. Options: "Tempo reale" (realtime), "Orario" (hourly), "Giornaliero" (daily). Active button uses ember variant, inactive uses subtle. Imports `BandwidthTier` type from hook.

**`app/network/components/BandwidthChart.tsx`** — Extended with 4 optional tier props (all backward-compatible with defaults):
- `activeTier?: BandwidthTier` (default: `'realtime'`)
- `onTierChange?: (tier: BandwidthTier) => void`
- `tierData?: BandwidthHistoryPoint[]` (default: `[]`)
- `tierLoading?: boolean` (default: `false`)

Tier-aware behavior:
- `isRealtime` flag determines which dataset (`data` vs `tierData`) flows to `<LineChart>`
- TimeRangeSelector shown only for realtime mode
- HistoryTierToggle shown only when `onTierChange` provided
- Separate loading/empty states for real-time vs historical modes
- X-axis formatter: `HH:mm:ss` (realtime), `dd/MM HH:mm` (hourly), `dd/MM` (daily)
- All existing isEmpty/isCollecting/isLoading behavior preserved for realtime mode

**`app/network/components/__tests__/HistoryTierToggle.test.tsx`** — 9 unit tests covering render, label, onClick callbacks for all 3 tiers, and active state per tier variant.

### Task 2: Network Page Orchestrator Update

**`app/network/page.tsx`** — Orchestrator updated with all Plan 01 hooks and components:

1. **SystemInfoCard** — rendered above WAN status card (useFritzSystemInfo)
2. **Tab navigation** — 3 tabs with cn-based active border styling:
   - `Dispositivi` → existing DeviceListTable (unchanged)
   - `WiFi Clients` → WifiClientsTable (useFritzWifiClients, paused when tab inactive)
   - `Servizi di Rete` → NetworkServicesCard (useFritzNetworkServices, paused when tab inactive)
3. **BandwidthChart** — now receives tier props from useFritzBandwidthTiers
4. **Loading skeleton** — updated with SystemInfoCard row and tab bar row
5. **All existing functionality preserved** — WAN status, correlation, device history, stovePowerRef, handleCategoryChange, all useEffect wiring

## Test Results

| Suite | Tests | Result |
|-------|-------|--------|
| HistoryTierToggle | 9 | PASS |
| BandwidthChart (all worktrees) | 60 | PASS |
| Full network suite | 1415 | PASS |

Full suite: 135 suites / 1415 tests — no regressions.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all components receive and render real data from their props/hooks. No hardcoded empty values or placeholder text.

## Self-Check: PASSED

Files created/modified:
- [x] app/network/components/HistoryTierToggle.tsx
- [x] app/network/components/__tests__/HistoryTierToggle.test.tsx
- [x] app/network/components/BandwidthChart.tsx (extended)
- [x] app/network/page.tsx (updated)

Commits:
- [x] e724a7cc — Task 1 (HistoryTierToggle + BandwidthChart extension + 9 tests)
- [x] 96babd18 — Task 2 (page.tsx orchestrator update)
