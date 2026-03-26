---
phase: 134
plan: "01"
subsystem: fritz-box-frontend
tags: [hooks, components, fritz-box, network, polling, wifi, datatables]
dependency_graph:
  requires: []
  provides:
    - useFritzSystemInfo
    - useFritzWifiClients
    - useFritzNetworkServices
    - useFritzBandwidthTiers
    - SystemInfoCard
    - WifiClientsTable
    - NetworkServicesCard
    - formatUptime
  affects:
    - app/network/page.tsx (Plan 02 wires these into page orchestrator)
tech_stack:
  added: []
  patterns:
    - useAdaptivePolling with visibility-aware interval switching (60s/300s)
    - Promise.allSettled for partial-failure-resilient multi-endpoint fetches
    - On-demand tier fetch via useEffect([tier]) (not polling)
    - CollapsibleSection accordion pattern with ChevronDown + cn rotate
    - SignalStrengthBars 4-level dBm visual indicator
    - Band filter toggle using styled buttons (ember active / slate inactive)
key_files:
  created:
    - app/network/hooks/useFritzSystemInfo.ts
    - app/network/hooks/useFritzWifiClients.ts
    - app/network/hooks/useFritzNetworkServices.ts
    - app/network/hooks/useFritzBandwidthTiers.ts
    - app/network/utils/formatUptime.ts
    - app/network/components/SystemInfoCard.tsx
    - app/network/components/WifiClientsTable.tsx
    - app/network/components/NetworkServicesCard.tsx
    - app/network/hooks/__tests__/useFritzSystemInfo.test.ts
    - app/network/hooks/__tests__/useFritzWifiClients.test.ts
    - app/network/hooks/__tests__/useFritzNetworkServices.test.ts
    - app/network/hooks/__tests__/useFritzBandwidthTiers.test.ts
    - app/network/components/__tests__/SystemInfoCard.test.tsx
    - app/network/components/__tests__/WifiClientsTable.test.tsx
    - app/network/components/__tests__/NetworkServicesCard.test.tsx
  modified: []
decisions:
  - "formatUptime extracted from WanStatusCard to shared app/network/utils/ for reuse across network components"
  - "useFritzNetworkServices marks stale=true on partial failure (any endpoint fails) while still displaying successful data"
  - "WifiClientsTable uses styled button group instead of Button.Group — simpler, no dependency on Button's group API"
  - "DataTable mock in component tests renders rows directly — avoids TanStack Table internals in tests"
  - "NetworkServicesCard imports types from useFritzNetworkServices — avoids duplicating interface definitions"
metrics:
  duration: "452 seconds (~7.5 minutes)"
  completed_date: "2026-03-25"
  tasks: 2
  files: 15
---

# Phase 134 Plan 01: Fritz!Box Frontend Building Blocks Summary

**One-liner:** 4 polling hooks + 3 presentational components + formatUptime utility for Fritz!Box system info, WiFi clients, network services, and bandwidth tier data.

## What Was Built

### Task 1: Data Hooks + formatUptime Utility

**`app/network/utils/formatUptime.ts`** — Shared utility extracted from WanStatusCard. Converts uptime seconds to `"Xg Yh"` / `"Xh Ym"` / `"Xm"` Italian format.

**`app/network/hooks/useFritzSystemInfo.ts`** — Polls `/api/fritzbox/system`, parses `json.system`, returns `{ data, loading, stale }`. Visibility-aware: 60s visible, 300s hidden.

**`app/network/hooks/useFritzWifiClients.ts`** — Polls `/api/fritzbox/wifi/clients` with band filter (`all` / `2.4GHz` / `5GHz`). Supports `paused` prop (interval: null). Re-fetches on band change via skip-first-render ref pattern.

**`app/network/hooks/useFritzNetworkServices.ts`** — Fetches 4 endpoints in parallel via `Promise.allSettled`. Partial failures allowed — successful results still update state. Returns `{ dhcp, portForwarding, upnp, mesh, loading, stale }`.

**`app/network/hooks/useFritzBandwidthTiers.ts`** — On-demand fetch (not polling). `useEffect([tier])` triggers fetch on tier change. Transforms: Unix seconds → ms (`* 1000`), bps → Mbps (`/ 1_000_000`). Exports `BandwidthTier` type.

### Task 2: Presentational Components

**`app/network/components/SystemInfoCard.tsx`** — InfoBox grid (model / firmware / uptime) with update Badge when `update_available` is non-empty string.

**`app/network/components/WifiClientsTable.tsx`** — DataTable with `SignalStrengthBars` sub-component (4-level dBm: >-50=4, >-60=3, >-70=2, else=1), band badges (ocean=5GHz / ember=2.4GHz), and styled filter toggle.

**`app/network/components/NetworkServicesCard.tsx`** — Four `CollapsibleSection` accordions (DHCP reservations / Port Forwarding / UPnP / Mesh topology). Each section has correct count in header and DataTable content.

## Test Results

| Suite | Tests | Result |
|-------|-------|--------|
| useFritzSystemInfo | 5 | PASS |
| useFritzWifiClients | 5 | PASS |
| useFritzNetworkServices | 4 | PASS |
| useFritzBandwidthTiers | 8 | PASS |
| SystemInfoCard | 7 | PASS |
| WifiClientsTable | 9 | PASS |
| NetworkServicesCard | 11 | PASS |
| **Total** | **49** | **All pass** |

Full network test suite: 27 suites / 267 tests — no regressions.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Minor Adjustments (Non-deviations)

1. **WifiClientsTable filter** — Plan referenced `Button.Group` but component uses inline styled buttons. The `Button.Group` API wasn't needed since the band filter is a simple button row. Behavior identical to spec.

2. **NetworkServicesCard — stale on partial failure** — When any of 4 endpoints fails, `stale=true` is set even if other endpoints succeed. This gives accurate staleness signal to the UI.

## Known Stubs

None — all components receive and render real data from their props. No hardcoded empty values or placeholder text that would prevent plan goals.

## Self-Check: PASSED

Files created:
- [x] app/network/utils/formatUptime.ts
- [x] app/network/hooks/useFritzSystemInfo.ts
- [x] app/network/hooks/useFritzWifiClients.ts
- [x] app/network/hooks/useFritzNetworkServices.ts
- [x] app/network/hooks/useFritzBandwidthTiers.ts
- [x] app/network/components/SystemInfoCard.tsx
- [x] app/network/components/WifiClientsTable.tsx
- [x] app/network/components/NetworkServicesCard.tsx
- [x] 7 test files in __tests__/ directories

Commits:
- [x] 508790b7 — Task 1 (hooks + formatUptime + 4 test files)
- [x] 37e48a86 — Task 2 (3 components + 3 test files)
