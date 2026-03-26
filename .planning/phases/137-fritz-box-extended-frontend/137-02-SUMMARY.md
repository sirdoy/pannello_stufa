---
phase: 137-fritz-box-extended-frontend
plan: "02"
subsystem: network/fritz-box
tags: [fritz-box, components, ui, wifi, budget, history, recharts]
dependency_graph:
  requires:
    - "137-01: useFritzWifiNetworks, useFritzBudgetStats, useFritzDeviceCountHistory, useFritzBandwidthTiers (extended)"
  provides:
    - "WifiNetworksTable: DataTable showing configured WiFi networks with band/status badges"
    - "BudgetStatsCard: progress bar with ok/warning/danger color coding"
    - "DeviceCountChart: code-split Recharts AreaChart for daily device count history"
    - "HistoryTierToggle: extended with Auto option"
    - "BandwidthChart: extended with autoGranularity prop and indicator text"
    - "/network page: 4 new features wired in correct layout positions"
  affects:
    - "app/network/page.tsx (4th Reti WiFi tab, new components, new hooks)"
tech_stack:
  added: []
  patterns:
    - "DataTable + ColumnDef for WiFi networks list (same as WifiClientsTable)"
    - "Progress bar with status color mapping via Record<status, className>"
    - "next/dynamic code-split for DeviceCountChart (Recharts — heavy)"
    - "paused: activeTab !== 'reti-wifi' to stop polling when tab not visible"
    - "Budget stats rendered above tab navigation (system-level info, always visible)"
key_files:
  created:
    - "app/network/components/WifiNetworksTable.tsx"
    - "app/network/components/BudgetStatsCard.tsx"
    - "app/network/components/DeviceCountChart.tsx"
    - "app/network/components/__tests__/WifiNetworksTable.test.tsx"
    - "app/network/components/__tests__/BudgetStatsCard.test.tsx"
  modified:
    - "app/network/components/HistoryTierToggle.tsx (Auto tier added)"
    - "app/network/components/BandwidthChart.tsx (autoGranularity prop + indicator)"
    - "app/network/components/__tests__/HistoryTierToggle.test.tsx (+2 tests)"
    - "app/network/page.tsx (3 new hooks + 3 new components + 4th tab)"
    - "app/network/__tests__/page.test.tsx (mocks + 4 new tests)"
decisions:
  - "WifiNetworksTable empty state returns Card with Text (not null) — consistent with showing the tab content area"
  - "BudgetStatsCard returns null when no data — avoids empty card placeholder in layout"
  - "DeviceCountChart uses next/dynamic (ssr:false) — Recharts is heavy and chart-only component"
  - "BudgetStatsCard placed above tab nav — budget is system-level info, not tab-specific"
  - "DeviceCountChart placed below tab content, above BandwidthChart — shows device trends before bandwidth"
metrics:
  duration: "4 minutes"
  completed_date: "2026-03-26"
  tasks_completed: 2
  files_changed: 10
---

# Phase 137 Plan 02: Fritz!Box Extended Frontend UI Components Summary

Three new UI components plus two extended components wiring all Fritz!Box extended data hooks into the /network page with correct layout positions.

## What Was Built

**WifiNetworksTable** — DataTable of configured WiFi networks. Columns: SSID, Band (ocean badge), Channel, Status (sage=Attiva, ember=Disattiva). Loading state shows skeletons. Empty state shows "Nessuna rete WiFi configurata". Stale indicator in header. Mirrors WifiClientsTable pattern.

**BudgetStatsCard** — API budget statistics card. Progress bar with status color coding (bg-sage-500=ok, bg-amber-500=warning, bg-red-500=danger). Badge shows OK/Attenzione/Critico. Metrics grid: window duration, current requests, soft/hard limits. Returns null when no data (avoids empty card placeholder).

**DeviceCountChart** — Code-split Recharts AreaChart via `next/dynamic`. Two areas: Online (emerald) and Total (slate gray). Custom tooltip with date formatted as dd/MM/yyyy. X-axis formatted as dd/MM. Loading/empty states with centered text. Dynamic import avoids Recharts in initial bundle.

**HistoryTierToggle (extended)** — Added `{ value: 'auto', label: 'Auto' }` as 4th entry in tiers array. Button.Group loop renders it automatically.

**BandwidthChart (extended)** — Added `autoGranularity?: 'hourly' | 'daily' | null` prop. Updated `formatXAxis` to handle 'auto' tier branching on `autoGranularity`. Added conditional indicator text "Auto: giornaliero/orario" below tier toggle.

**/network page.tsx (updated)** — Wired all 4 new features:
- BudgetStatsCard rendered between WanStatusCard and tab navigation (D-09)
- 4th tab "Reti WiFi" added; useFritzWifiNetworks paused when tab not active
- WifiNetworksTable shown in reti-wifi tab content
- DeviceCountChart (dynamic) below tab content, above BandwidthChart (D-05)
- autoGranularity={bandwidthTiers.autoGranularity} passed to BandwidthChart

## Test Results

- 9 new tests in WifiNetworksTable.test.tsx (all passing)
- 11 new tests in BudgetStatsCard.test.tsx (all passing)
- 2 new tests added to HistoryTierToggle.test.tsx (all passing)
- 4 new tests added to page.test.tsx (all passing)
- 571 total tests in app/network pass with 0 failures

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 4ae2e0ed | feat(137-02): create WifiNetworksTable, BudgetStatsCard, DeviceCountChart and extend HistoryTierToggle + BandwidthChart |
| 2 | a25208bd | feat(137-02): wire WifiNetworksTable, BudgetStatsCard, DeviceCountChart into /network page |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all components wire to real hooks consuming live API routes.

## Self-Check: PASSED
