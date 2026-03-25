# Phase 134: Fritz!Box Frontend - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning
**Mode:** Auto (recommended defaults applied)

<domain>
## Phase Boundary

Enhance the existing /network page with Fritz!Box system info, WiFi clients tab, network services section (DHCP, port forwarding, UPnP, mesh), and multi-resolution bandwidth history charts with hourly/daily toggle. All data comes from API routes built in Phases 132-133. No new API routes needed.

</domain>

<decisions>
## Implementation Decisions

### Page layout reorganization
- **D-01:** Add a tab-based navigation below the existing WAN status card — tabs: "Dispositivi" (existing device list), "WiFi Clients", "Servizi di Rete" (network services), keeping the page scannable
- **D-02:** System info section is a new card at the top, between the page header and WAN status — always visible (not tabbed), showing router model, firmware version, and uptime
- **D-03:** Existing WAN status card, bandwidth chart, correlation chart, and device history timeline remain in place — they are NOT reorganized into tabs
- **D-04:** WiFi clients and network services are NEW tab content replacing/alongside the device list area — device list becomes one of the tabs

### Data fetching approach
- **D-05:** New dedicated hooks: `useFritzSystemInfo()`, `useFritzWifiClients()`, `useFritzNetworkServices()` — each with `useAdaptivePolling(60s)` matching existing hook-per-section pattern
- **D-06:** New hook: `useFritzBandwidthTiers()` for history tier toggle — manages hourly vs daily endpoint switching with internal state
- **D-07:** Existing hooks (`useNetworkData`, `useBandwidthHistory`, `useDeviceHistory`, `useBandwidthCorrelation`) remain untouched
- **D-08:** WiFi clients hook handles band filter state internally (all/2.4GHz/5GHz toggle)

### Network services presentation
- **D-09:** Network services displayed as collapsible sections within a single card — one Disclosure per service type: DHCP Reservations, Port Forwarding, UPnP Mappings, Mesh Topology
- **D-10:** Each service section shows a summary count in the header (e.g., "DHCP Reservations (12)") and expands to show the full list
- **D-11:** DHCP reservations and port forwarding rules displayed in DataTable (existing component) with sortable columns
- **D-12:** UPnP mappings in a simple table (typically small list), mesh topology as a node list with link indicators
- **D-13:** Mesh topology shows nodes with role (master/slave), connected status, and link quality — no graph visualization (flat list is sufficient for admin use)

### History tier toggle
- **D-14:** BandwidthChart gets an additional toggle: "Tempo reale" (existing real-time data) / "Orario" (hourly) / "Giornaliero" (daily)
- **D-15:** Toggle is a button group in the chart header area, beside the existing TimeRangeSelector — matches the established UI pattern
- **D-16:** Switching tiers fetches from the corresponding `/api/fritzbox/history/bandwidth/{tier}` endpoint
- **D-17:** Hourly/daily data uses the same Recharts chart component but with different data series (min/max/avg instead of instantaneous)
- **D-18:** Default view remains real-time (current behavior) — tier toggle is an opt-in for historical data

### WiFi clients tab
- **D-19:** WiFi clients displayed in DataTable with columns: device name, IP, MAC, signal strength (bar indicator), band (2.4GHz/5GHz badge), connected since
- **D-20:** Signal strength shown as visual bars (1-4 bars based on dBm ranges) — not raw dBm numbers
- **D-21:** Band filter toggle: All / 2.4 GHz / 5 GHz — filters the client list via query parameter to the API
- **D-22:** Sort by signal strength (strongest first) as default sort order

### System info card
- **D-23:** Compact card showing: router model name, firmware version (with update indicator if available), uptime formatted as "X giorni, Y ore"
- **D-24:** Uses `SmartHomeCard` or similar card pattern with subtle styling — this is informational, not interactive
- **D-25:** Fetches from `/api/fritzbox/system` via `useFritzSystemInfo()` hook

### Component organization
- **D-26:** New components in `app/network/components/`: SystemInfoCard, WifiClientsTable, NetworkServicesCard, HistoryTierToggle
- **D-27:** New hooks in `app/network/hooks/`: useFritzSystemInfo, useFritzWifiClients, useFritzNetworkServices, useFritzBandwidthTiers
- **D-28:** Collapsible sub-components: DhcpReservationsSection, PortForwardingSection, UpnpMappingsSection, MeshTopologySection — all inside NetworkServicesCard

### Claude's Discretion
- Exact Tailwind classes for signal strength bars
- DataTable column widths and mobile responsiveness
- Whether to lazy-load WiFi clients and network services tabs
- Skeleton shapes for new sections
- Italian translations for column headers and labels

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Fritz!Box API specification
- `docs/api/fritzbox.md` — Complete endpoint specification with TypeScript interfaces. Relevant sections: §System (system info fields), §WiFi (client list with signal/band), §Network Services (DHCP/port forwarding/UPnP/mesh), §Historical Data (hourly/daily/auto tiers with record formats)

### Existing /network page
- `app/network/page.tsx` — Current page orchestrator (5 sections: WAN status, device list, bandwidth chart, correlation chart, device history timeline)
- `app/network/components/WanStatusCard.tsx` — WAN status card pattern
- `app/network/components/DeviceListTable.tsx` — DataTable usage pattern for device data
- `app/network/components/BandwidthChart.tsx` — Recharts chart with TimeRangeSelector
- `app/network/components/TimeRangeSelector.tsx` — Time range toggle pattern (reusable for tier toggle)

### Data hooks
- `app/network/hooks/useBandwidthHistory.ts` — History buffer hook pattern
- `app/network/hooks/useDeviceHistory.ts` — Device event history hook
- `app/components/devices/network/hooks/useNetworkData.ts` — Main network data polling hook

### Fritz!Box infrastructure (Phases 132-133)
- `lib/fritzbox/fritzboxClient.ts` — Client with 18 methods including all Phase 132-133 additions (getSystemInfo, getWifiClients, getWifiNetworks, getDhcpReservations, getPortForwarding, getUpnpStatus, getMeshTopology, getBandwidthHourly, getBandwidthDaily, getBandwidthAuto, getDevicesDaily, getBudgetStats)

### UI components
- `app/components/ui/` — Design system: Heading, Button, Skeleton, Badge, DataTable, SmartHomeCard
- `app/components/ui/DataTable.tsx` — Sortable data table with column definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DataTable` component: Sortable columns, pagination — use for WiFi clients, DHCP reservations, port forwarding
- `TimeRangeSelector`: Button group toggle — pattern for history tier toggle
- `SmartHomeCard`: Card wrapper with color themes — use for system info card
- `Badge`: Status/category badges — use for WiFi band labels (2.4GHz/5GHz)
- `DeviceCategoryBadge`: Existing badge pattern — reference for WiFi band badges
- `CopyableIp`: IP display with copy-to-clipboard — reuse for WiFi clients and DHCP tables
- `useAdaptivePolling`: Standard polling hook at 60s — use for all new data hooks
- `Skeleton`: Loading skeletons — create variants for new sections

### Established Patterns
- Orchestrator pattern: page.tsx coordinates hooks, passes data to presentational components (~80 lines orchestrator)
- Code-split Recharts: `dynamic(() => import(...), { ssr: false })` with Skeleton loading
- Dark-first styling: `bg-slate-800/30 [html:not(.dark)_&]:bg-white` card backgrounds
- Italian labels: all UI text in Italian ("Dispositivi", "Rete", "Indietro")
- Stale state: `isStale` boolean prop with banner indicator

### Integration Points
- `app/network/page.tsx` — Add SystemInfoCard, tab navigation, new hooks imports
- `app/network/components/BandwidthChart.tsx` — Add tier toggle (or wrap in a parent component)
- No changes to API routes, fritzboxClient, or dashboard card needed

</code_context>

<specifics>
## Specific Ideas

- WiFi signal strength bars: 4-bar indicator based on dBm thresholds (>-50: excellent 4 bars, >-60: good 3 bars, >-70: fair 2 bars, else: weak 1 bar)
- Budget stats could appear in the system info card as a utilization progress bar (status: ok/warning/danger maps to green/amber/red)
- Device daily count chart could be an optional addition to the device history section — shows how many devices were online per hour over the selected period
- Mesh topology is typically 2-4 nodes max (Fritz!Box + repeaters) — flat list with connection status is sufficient

</specifics>

<deferred>
## Deferred Ideas

- Telephony endpoints (DECT, calls, TAM) — explicitly excluded from v16.0 scope
- WiFi network management (enable/disable networks, change channels) — write operations, not in this read-only phase
- Advanced mesh visualization (graph/tree diagram) — not needed for 2-4 nodes
- Per-device bandwidth history charts — would require new per-device API endpoints

</deferred>

---

*Phase: 134-fritz-box-frontend*
*Context gathered: 2026-03-25*
