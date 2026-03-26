# Phase 137: Fritz!Box Extended Frontend - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the existing /network page with four new frontend features that consume already-built API endpoints:
1. WiFi networks display (configured SSIDs with status)
2. Device count history chart (daily connected devices over time)
3. Budget statistics card (data consumption with progress bar)
4. Auto-granularity mode for bandwidth chart

All backend APIs and TypeScript types already exist in `lib/fritzbox/fritzboxClient.ts`. This phase is purely frontend — new hooks, components, and page wiring.

</domain>

<decisions>
## Implementation Decisions

### WiFi Networks Placement
- **D-01:** Add a 4th tab "Reti WiFi" to the existing tab bar (Dispositivi / WiFi Clients / Servizi di Rete / Reti WiFi) — consistent with existing tab navigation pattern
- **D-02:** Each network row shows SSID, band (2.4GHz / 5GHz), channel, and enabled/disabled status badge — maps directly to WiFiNetworkModel fields
- **D-03:** Use a simple table/list layout similar to WifiClientsTable, with paused polling when tab not active (same pattern as existing tabs)

### Device Count Chart
- **D-04:** Use Recharts AreaChart (not LineChart) to visually differentiate from existing bandwidth LineChart and to show volume — stacked area with online count line
- **D-05:** Place below tab content, above bandwidth chart — groups chronological data together
- **D-06:** Default to 30 days, matching the /api/fritzbox/history/devices/daily API default. Use TimeRangeSelector-like control if range selection is needed
- **D-07:** Code-split via next/dynamic (same pattern as BandwidthChart and BandwidthCorrelationChart)

### Budget Stats Card
- **D-08:** Compact card with progress bar showing utilization_percent, status badge (ok/warning/danger with color coding), and key metrics (window_seconds, current_window_requests, soft/hard limits)
- **D-09:** Place below SystemInfoCard / WanStatusCard, above tab navigation — budget is system-level info, not tab-specific
- **D-10:** Single fetch on mount (not polling) — budget data changes slowly, same pattern as SystemInfoCard

### Auto-Granularity Integration
- **D-11:** Add "Auto" as a 4th option in HistoryTierToggle (Tempo reale / Orario / Giornaliero / Auto) — minimal change to existing component
- **D-12:** When "Auto" selected, useFritzBandwidthTiers calls /api/fritzbox/history/bandwidth/auto which server-side decides hourly vs daily based on time range
- **D-13:** Display a subtle indicator showing which granularity the server chose (e.g., "Auto: orario" or "Auto: giornaliero")

### Claude's Discretion
- Loading/empty states for new components — follow existing patterns (Skeleton for loading, Text for empty)
- Exact color choices for AreaChart areas and budget status badges — use design system ember/copper accents
- Whether device count chart aggregates hour_buckets into daily totals or shows hourly granularity within days

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Network Page
- `app/network/page.tsx` — Current page orchestrator with tab navigation, bandwidth chart, and correlation chart
- `app/network/components/HistoryTierToggle.tsx` — Tier toggle component to extend with "Auto" option
- `app/network/hooks/useFritzBandwidthTiers.ts` — Hook to extend with auto-granularity support

### Fritz!Box Client & Types
- `lib/fritzbox/fritzboxClient.ts` §236-260 — WiFiNetworkModel, WiFiStatusResponse, getWifiNetworks()
- `lib/fritzbox/fritzboxClient.ts` §360-454 — History tier types (BandwidthHourlyRecord, BandwidthDailyRecord, DeviceDailyRecord, BandwidthAggregatedRecord, BudgetStats) and client methods
- `app/api/fritzbox/wifi/networks/route.ts` — WiFi networks API route
- `app/api/fritzbox/budget-stats/route.ts` — Budget stats API route
- `app/api/fritzbox/history/bandwidth/auto/route.ts` — Auto-granularity bandwidth route
- `app/api/fritzbox/history/devices/daily/route.ts` — Device count history route

### UI Patterns
- `app/network/components/WifiClientsTable.tsx` — Table pattern for WiFi data (similar to WiFi networks)
- `app/network/components/SystemInfoCard.tsx` — Card pattern for system-level info (similar to budget stats)
- `app/network/components/BandwidthChart.tsx` — Recharts LineChart pattern (device count chart uses AreaChart)
- `app/network/components/TimeRangeSelector.tsx` — Button group selector pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `HistoryTierToggle` — Extend with 'auto' option (add to BandwidthTier union + tiers array)
- `useFritzBandwidthTiers` — Extend with auto tier fetching logic
- `TimeRangeSelector` — Reusable for device count chart time range if needed
- `BandwidthChart` — Pattern reference for code-split Recharts chart
- `SystemInfoCard` — Pattern reference for card with loading/stale states
- Design system: `Button`, `Button.Group`, `Heading`, `Text`, `Skeleton`, `PageLayout`

### Established Patterns
- Tab navigation with paused polling (`useFritzWifiClients({ paused: activeTab !== 'wifi' })`)
- Code-split charts via `next/dynamic` with Skeleton loading fallback
- Hooks return `{ data, loading, stale }` shape
- Italian labels throughout UI (Reti WiFi, Dispositivi connessi, Consumo dati, etc.)

### Integration Points
- `app/network/page.tsx` — Add new hooks, budget stats card, device count chart, new tab
- `app/network/hooks/useFritzBandwidthTiers.ts` — Extend BandwidthTier type + auto logic
- `app/network/components/HistoryTierToggle.tsx` — Add "Auto" tier button

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following existing codebase patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 137-fritz-box-extended-frontend*
*Context gathered: 2026-03-26*
