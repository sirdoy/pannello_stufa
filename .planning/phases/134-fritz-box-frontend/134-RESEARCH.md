# Phase 134: Fritz!Box Frontend - Research

**Researched:** 2026-03-25
**Domain:** Next.js frontend — React hooks, Recharts charts, DataTable components, tab navigation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Page layout reorganization**
- D-01: Add a tab-based navigation below the existing WAN status card — tabs: "Dispositivi" (existing device list), "WiFi Clients", "Servizi di Rete" (network services), keeping the page scannable
- D-02: System info section is a new card at the top, between the page header and WAN status — always visible (not tabbed), showing router model, firmware version, and uptime
- D-03: Existing WAN status card, bandwidth chart, correlation chart, and device history timeline remain in place — they are NOT reorganized into tabs
- D-04: WiFi clients and network services are NEW tab content replacing/alongside the device list area — device list becomes one of the tabs

**Data fetching approach**
- D-05: New dedicated hooks: `useFritzSystemInfo()`, `useFritzWifiClients()`, `useFritzNetworkServices()` — each with `useAdaptivePolling(60s)` matching existing hook-per-section pattern
- D-06: New hook: `useFritzBandwidthTiers()` for history tier toggle — manages hourly vs daily endpoint switching with internal state
- D-07: Existing hooks (`useNetworkData`, `useBandwidthHistory`, `useDeviceHistory`, `useBandwidthCorrelation`) remain untouched
- D-08: WiFi clients hook handles band filter state internally (all/2.4GHz/5GHz toggle)

**Network services presentation**
- D-09: Network services displayed as collapsible sections within a single card — one Disclosure per service type: DHCP Reservations, Port Forwarding, UPnP Mappings, Mesh Topology
- D-10: Each service section shows a summary count in the header (e.g., "DHCP Reservations (12)") and expands to show the full list
- D-11: DHCP reservations and port forwarding rules displayed in DataTable (existing component) with sortable columns
- D-12: UPnP mappings in a simple table (typically small list), mesh topology as a node list with link indicators
- D-13: Mesh topology shows nodes with role (master/slave), connected status, and link quality — no graph visualization (flat list is sufficient for admin use)

**History tier toggle**
- D-14: BandwidthChart gets an additional toggle: "Tempo reale" (existing real-time data) / "Orario" (hourly) / "Giornaliero" (daily)
- D-15: Toggle is a button group in the chart header area, beside the existing TimeRangeSelector — matches the established UI pattern
- D-16: Switching tiers fetches from the corresponding `/api/fritzbox/history/bandwidth/{tier}` endpoint
- D-17: Hourly/daily data uses the same Recharts chart component but with different data series (min/max/avg instead of instantaneous)
- D-18: Default view remains real-time (current behavior) — tier toggle is an opt-in for historical data

**WiFi clients tab**
- D-19: WiFi clients displayed in DataTable with columns: device name, IP, MAC, signal strength (bar indicator), band (2.4GHz/5GHz badge), connected since
- D-20: Signal strength shown as visual bars (1-4 bars based on dBm ranges) — not raw dBm numbers
- D-21: Band filter toggle: All / 2.4 GHz / 5 GHz — filters the client list via query parameter to the API
- D-22: Sort by signal strength (strongest first) as default sort order

**System info card**
- D-23: Compact card showing: router model name, firmware version (with update indicator if available), uptime formatted as "X giorni, Y ore"
- D-24: Uses `SmartHomeCard` or similar card pattern with subtle styling — this is informational, not interactive
- D-25: Fetches from `/api/fritzbox/system` via `useFritzSystemInfo()` hook

**Component organization**
- D-26: New components in `app/network/components/`: SystemInfoCard, WifiClientsTable, NetworkServicesCard, HistoryTierToggle
- D-27: New hooks in `app/network/hooks/`: useFritzSystemInfo, useFritzWifiClients, useFritzNetworkServices, useFritzBandwidthTiers
- D-28: Collapsible sub-components: DhcpReservationsSection, PortForwardingSection, UpnpMappingsSection, MeshTopologySection — all inside NetworkServicesCard

### Claude's Discretion
- Exact Tailwind classes for signal strength bars
- DataTable column widths and mobile responsiveness
- Whether to lazy-load WiFi clients and network services tabs
- Skeleton shapes for new sections
- Italian translations for column headers and labels

### Deferred Ideas (OUT OF SCOPE)
- Telephony endpoints (DECT, calls, TAM) — explicitly excluded from v16.0 scope
- WiFi network management (enable/disable networks, change channels) — write operations, not in this read-only phase
- Advanced mesh visualization (graph/tree diagram) — not needed for 2-4 nodes
- Per-device bandwidth history charts — would require new per-device API endpoints
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FRITZ-13 | System info section nella /network page (model, firmware, uptime) | `useFritzSystemInfo` hook + `SystemInfoCard` using `/api/fritzbox/system` route (already exists), `SystemResponse` type in fritzboxClient.ts confirmed |
| FRITZ-14 | WiFi clients tab nella /network page con signal strength e band | `useFritzWifiClients` hook + `WifiClientsTable` using `/api/fritzbox/wifi/clients`, band filter via query param already supported in route |
| FRITZ-15 | Network services section (DHCP, port forwarding, UPnP, mesh) nella /network page | `useFritzNetworkServices` hook + `NetworkServicesCard` with 4 collapsible sub-sections, all 4 API routes confirmed existing |
| FRITZ-16 | History charts con hourly/daily toggle nella /network page | `useFritzBandwidthTiers` hook + `HistoryTierToggle` component; hourly/daily routes confirmed in Phase 133; chart reuses BandwidthChart |
</phase_requirements>

---

## Summary

Phase 134 is a pure frontend phase. All API routes are already implemented (Phases 132-133). The work is: 4 new React hooks, 4 new presentational components (plus 4 sub-components), a tab navigation refactor of `app/network/page.tsx`, and modification of `BandwidthChart.tsx` to support a tier toggle.

The existing codebase provides clear, consistent patterns to follow. Every pattern needed in this phase already exists in the codebase: `useAdaptivePolling` for polling hooks, `DataTable` for tabular data, `TimeRangeSelector` for button group toggles, `Card`/`InfoBox` for info display, and the DeviceListTable pattern for tab-scoped filter state.

The highest complexity is the `BandwidthChart` tier toggle: it must integrate with `useFritzBandwidthTiers` (a separate hook that fetches from the history tier endpoints) while keeping the existing real-time path (`useBandwidthHistory`) completely intact. The page orchestrator will need to pass both data sources and the tier state to the chart.

**Primary recommendation:** Build the two plans as: Plan 1 (hooks + system info + WiFi clients tab + network services) and Plan 2 (bandwidth tier toggle + page integration + tests).

---

## Standard Stack

### Core (already in project — no new installs)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x (Next.js 15.5) | Component framework | Project standard |
| @tanstack/react-table | existing | DataTable sortable columns | Already used in DeviceListTable |
| recharts | existing | LineChart for bandwidth tiers | Already used in BandwidthChart |
| date-fns | existing | Date formatting for uptime | Already used in WanStatusCard |
| tailwindcss | existing | Styling (dark-first Ember Noir) | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | existing | Icons (Copy, Check, ChevronDown) | Already used in CopyableIp and throughout |
| next/dynamic | existing | Code-split Recharts imports | Already used for BandwidthChart |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended File Structure
```
app/network/
├── page.tsx                          # MODIFIED: add SystemInfoCard, tab nav, new hook imports
├── hooks/
│   ├── useFritzSystemInfo.ts         # NEW: polls /api/fritzbox/system every 60s
│   ├── useFritzWifiClients.ts        # NEW: polls /api/fritzbox/wifi/clients, band filter state
│   ├── useFritzNetworkServices.ts    # NEW: polls 4 network services endpoints
│   └── useFritzBandwidthTiers.ts    # NEW: fetches hourly/daily on-demand with tier state
└── components/
    ├── SystemInfoCard.tsx             # NEW: model, firmware, uptime
    ├── WifiClientsTable.tsx           # NEW: DataTable with signal bars, band badges
    ├── NetworkServicesCard.tsx        # NEW: collapsible sections wrapper
    │   ├── DhcpReservationsSection   # (inline sub-component or separate file)
    │   ├── PortForwardingSection     # (inline sub-component or separate file)
    │   ├── UpnpMappingsSection       # (inline sub-component or separate file)
    │   └── MeshTopologySection       # (inline sub-component or separate file)
    ├── HistoryTierToggle.tsx         # NEW: "Tempo reale" / "Orario" / "Giornaliero"
    └── BandwidthChart.tsx            # MODIFIED: add tier toggle + tier data prop
```

### Pattern 1: New Hook with useAdaptivePolling

All new hooks follow the same structure as `useNetworkData`:

```typescript
// Source: app/components/devices/network/hooks/useNetworkData.ts (verified)
'use client';

import { useState } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

export function useFritzSystemInfo() {
  const [data, setData] = useState<SystemInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);

  const isVisible = useVisibility();
  const interval = isVisible ? 60000 : 300000; // 60s visible, 5min hidden

  const fetchData = async () => {
    try {
      const res = await fetch('/api/fritzbox/system');
      if (!res.ok) return;
      const json = await res.json();
      setData(json.system);
      setStale(false);
    } catch {
      setStale(true);
    } finally {
      setLoading(false);
    }
  };

  useAdaptivePolling({
    callback: fetchData,
    interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 0, // or small stagger if needed
  });

  return { data, loading, stale };
}
```

### Pattern 2: useFritzNetworkServices — Multiple Endpoints in One Hook

Since all 4 network services endpoints (DHCP, port forwarding, UPnP, mesh) are fetched together and displayed in the same card:

```typescript
// Fetch all 4 in parallel — independent failure OK
const fetchData = async () => {
  const [dhcpRes, pfRes, upnpRes, meshRes] = await Promise.allSettled([
    fetch('/api/fritzbox/network/dhcp/reservations?limit=1000'),
    fetch('/api/fritzbox/network/port-forwarding?limit=1000'),
    fetch('/api/fritzbox/network/upnp'),
    fetch('/api/fritzbox/network/mesh'),
  ]);
  // Parse each settled result independently — partial failure shows what we have
};
```

This matches the `Promise.allSettled` pattern already used for Sonos zones (per STATE.md).

### Pattern 3: useFritzWifiClients — Filter State in Hook

Band filter is managed inside the hook (D-08). When filter changes, re-fetch:

```typescript
const [band, setBand] = useState<'all' | '2.4GHz' | '5GHz'>('all');

const fetchData = async () => {
  const params = new URLSearchParams();
  if (band !== 'all') params.set('band', band);
  const res = await fetch(`/api/fritzbox/wifi/clients?${params}`);
  // ...
};

useEffect(() => {
  void fetchData();
}, [band]); // re-fetch on band change

// NOTE: useAdaptivePolling also calls fetchData via callback,
// which captures current band via closure (stable ref pattern)
```

The band filter re-fetch must use the `savedCallback` ref pattern that `useAdaptivePolling` already handles — as long as `fetchData` is redefined when `band` changes, the polling callback ref will be updated.

### Pattern 4: useFritzBandwidthTiers — On-Demand Fetch (Not Polling)

The tier hook is NOT a polling hook — it fetches once when the tier changes (historical data doesn't update in real-time):

```typescript
type BandwidthTier = 'realtime' | 'hourly' | 'daily';

export function useFritzBandwidthTiers() {
  const [tier, setTier] = useState<BandwidthTier>('realtime');
  const [tierData, setTierData] = useState<TierChartPoint[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch when tier changes (not on 'realtime' — parent handles that)
  useEffect(() => {
    if (tier === 'realtime') {
      setTierData([]); // Clear — parent uses bandwidthHistory data
      return;
    }

    const endpoint = tier === 'hourly'
      ? '/api/fritzbox/history/bandwidth/hourly?days=7'
      : '/api/fritzbox/history/bandwidth/daily?days=30';

    setLoading(true);
    fetch(endpoint)
      .then(r => r.json())
      .then(json => {
        // Transform hourly/daily records to chart points
        const items = json.hourly?.items ?? json.daily?.items ?? [];
        setTierData(mapToChartPoints(items, tier));
      })
      .catch(() => setTierData([]))
      .finally(() => setLoading(false));
  }, [tier]);

  return { tier, setTier, tierData, loading };
}
```

### Pattern 5: BandwidthChart Tier Integration

BandwidthChart needs to accept both real-time data and tier data. The cleanest approach: add optional props, show tier data when `activeTier !== 'realtime'`.

```typescript
// Extended interface — backward compatible (all new props optional with defaults)
interface BandwidthChartProps {
  // Existing real-time props (unchanged):
  data: BandwidthHistoryPoint[];
  timeRange: BandwidthTimeRange;
  onTimeRangeChange: (range: BandwidthTimeRange) => void;
  isEmpty: boolean;
  isCollecting: boolean;
  isLoading?: boolean;
  pointCount: number;
  // New tier props:
  activeTier?: BandwidthTier;            // default: 'realtime'
  onTierChange?: (tier: BandwidthTier) => void;
  tierData?: TierChartPoint[];           // hourly/daily chart points
  tierLoading?: boolean;
}
```

The chart renders `data` when `activeTier === 'realtime'`, and `tierData` otherwise. The TimeRangeSelector is hidden when showing tier data (irrelevant for historical aggregates).

### Pattern 6: Tab Navigation in page.tsx

The tab pattern follows the DeviceListTable status filter and the DIRIGERA filter segmented control. Use local `activeTab` state in the page orchestrator:

```typescript
type NetworkTab = 'dispositivi' | 'wifi' | 'servizi';
const [activeTab, setActiveTab] = useState<NetworkTab>('dispositivi');

// Tab bar renders between WanStatusCard and the tab content
// Tab content renders conditionally based on activeTab
```

**Important:** The new hooks (`useFritzWifiClients`, `useFritzNetworkServices`) should only poll when their tab is active — use `interval: activeTab === 'wifi' ? 60000 : null` to pause polling on inactive tabs.

### Pattern 7: Signal Strength Bars

Visual bars using dBm thresholds (from CONTEXT.md specifics):

```typescript
function SignalStrengthBars({ dbm }: { dbm: number }) {
  const bars = dbm > -50 ? 4 : dbm > -60 ? 3 : dbm > -70 ? 2 : 1;
  return (
    <div className="flex items-end gap-0.5">
      {[1, 2, 3, 4].map(b => (
        <div
          key={b}
          className={`w-1.5 rounded-sm transition-colors ${
            b <= bars ? 'bg-sage-400' : 'bg-slate-600'
          }`}
          style={{ height: `${b * 4}px` }}
        />
      ))}
    </div>
  );
}
```

### Pattern 8: Collapsible Section (Disclosure Pattern)

The project uses `cn` utility and standard Tailwind for toggles — no HeadlessUI Disclosure. Implement with local `isOpen` state per section:

```typescript
function CollapsibleSection({
  title, count, children
}: { title: string; count: number; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="font-medium">{title} ({count})</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  );
}
```

### Pattern 9: Uptime Formatting

Reuse the `formatUptime` function from `WanStatusCard.tsx` (D-23 says "X giorni, Y ore"):

```typescript
// Source: app/network/components/WanStatusCard.tsx (verified)
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}g ${hours}h`;
  // ...
}
```

Either import from a shared util or copy pattern. Prefer moving to a util if reused across 2+ components.

### Anti-Patterns to Avoid

- **Polling inactive tabs:** Don't start `useAdaptivePolling` for WiFi/services when their tab is not active — pass `interval: null` to pause
- **Modifying existing hooks:** D-07 locks: `useNetworkData`, `useBandwidthHistory`, `useDeviceHistory`, `useBandwidthCorrelation` must NOT be changed
- **New API routes:** The phase explicitly has no new routes (all from Phases 132-133)
- **Importing BandwidthChart SSR:** It must remain in a `dynamic(() => import(...), { ssr: false })` wrapper — Recharts requires client-only
- **Using `as any` in new types:** The project is zero-as-any in production code (v14.1 milestone)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sortable data table | Custom table with sort logic | `DataTable` from `@/app/components/ui` | Already handles TanStack Table, pagination, global filter |
| Time range button group | Custom toggle | `TimeRangeSelector` pattern + `Button.Group` | Established pattern, consistent styling |
| Copy IP to clipboard | Custom copy button | `CopyableIp` component | Already handles feedback state, keyboard accessibility |
| Status badges | Custom badge divs | `Badge` from `@/app/components/ui` | Consistent variant system (sage/ocean/ember/danger) |
| Card wrapper | Custom div | `Card variant="elevated"` | Dark/light mode handled, border/shadow included |
| Info grid row | Custom layout | `InfoBox` component | Emoji + label + value pattern, all variants defined |

---

## API Response Shapes (Verified from fritzboxClient.ts)

### /api/fritzbox/system → `{ system: SystemResponse }`
```typescript
interface SystemResponse {
  model: string;
  firmware_version: string;
  update_available: string;       // string, not boolean — check if non-empty
  device_uptime_seconds: number;
  device_uptime_formatted: string;
  is_stale: boolean;
  fetched_at: string | null;
}
```

### /api/fritzbox/wifi/clients → `{ clients: PaginatedResponse<WiFiClientModel> }`
```typescript
interface WiFiClientModel {
  hostname: string;
  mac: string;
  ip: string;
  band: string;               // e.g. "2.4GHz" or "5GHz"
  ssid: string;
  signal_strength: number;    // dBm (negative integer)
  link_speed_mbps: number;
  is_active: boolean;
}
```

### /api/fritzbox/network/dhcp/reservations → `{ reservations: PaginatedResponse<DhcpReservationModel> }`
```typescript
interface DhcpReservationModel {
  ip: string;
  name: string;
  mac: string;
  interface_type: string;
  address_source: string;
}
```

### /api/fritzbox/network/port-forwarding → `{ rules: PaginatedResponse<PortForwardingRuleModel> }`
```typescript
interface PortForwardingRuleModel {
  external_port: number;
  internal_port: number;
  protocol: 'TCP' | 'UDP';
  internal_client: string;
  enabled: boolean;
  description: string;
  lease_duration: number;
}
```

### /api/fritzbox/network/upnp → `{ upnp: UPnPStatusResponse }`
```typescript
interface UPnPStatusResponse {
  enabled: boolean;
  upnp_ports: PortForwardingRuleModel[];  // same shape as port forwarding
  is_stale: boolean;
  fetched_at: string | null;
}
```

### /api/fritzbox/network/mesh → `{ mesh: MeshTopologyResponse }`
```typescript
interface MeshTopologyResponse {
  schema_version: string | null;
  node_count: number;
  link_count: number;
  nodes: MeshNodeModel[];
  links: MeshLinkModel[];
  is_stale: boolean;
  fetched_at: string | null;
}

interface MeshNodeModel {
  uid: string;
  name: string;
  model: string;
  mac: string;
  vendor: string;
  is_meshed: boolean;
  device_category: string;
}

interface MeshLinkModel {
  source_uid: string; source_name: string;
  target_uid: string; target_name: string;
  type: string | null; state: string | null;
  cur_rx_kbps: number | null; cur_tx_kbps: number | null;
  max_rx_kbps: number | null; max_tx_kbps: number | null;
}
```

### /api/fritzbox/history/bandwidth/hourly → `{ hourly: PaginatedResponse<BandwidthHourlyRecord> }`
```typescript
interface BandwidthHourlyRecord {
  hour_timestamp: number;         // Unix seconds
  avg_downstream_rate: number;    // bps
  min_downstream_rate: number;
  max_downstream_rate: number;
  avg_upstream_rate: number;
  // ... (min/max upstream, bytes, sample_count)
}
```

### /api/fritzbox/history/bandwidth/daily → `{ daily: PaginatedResponse<BandwidthDailyRecord> }`
Same shape as hourly but with `day_timestamp` instead of `hour_timestamp`.

---

## Common Pitfalls

### Pitfall 1: Tier Chart Data Shape Mismatch
**What goes wrong:** Hourly/daily records have `avg_downstream_rate` in bps, but BandwidthChart expects `download` in Mbps with `time` in milliseconds.
**Why it happens:** The existing chart was built for real-time polling (already transformed in fritzboxClient). Historical tiers are raw from the API (bps, Unix seconds).
**How to avoid:** Transform in `useFritzBandwidthTiers` before returning `tierData`: divide by 1,000,000, multiply timestamp by 1000.
**Warning signs:** Chart shows enormous values or x-axis shows 1970 dates.

### Pitfall 2: BandwidthChart SSR Import
**What goes wrong:** Importing BandwidthChart directly in page.tsx breaks SSR because Recharts uses `window`.
**Why it happens:** BandwidthChart already uses `next/dynamic`. If someone moves the import or adds a wrapper, SSR breaks.
**How to avoid:** Keep BandwidthChart inside the existing `dynamic(() => import('./components/BandwidthChart'), { ssr: false })` wrapper. Do NOT change the import pattern.

### Pitfall 3: WiFi Band Filter Causes Double-Fetch on Mount
**What goes wrong:** Hook calls `fetchData` in `useAdaptivePolling` (via `immediate: true`) AND in a `useEffect([band])`. On mount both fire.
**Why it happens:** Both effects run on initial render.
**How to avoid:** Use a ref to track if the initial fetch has been done by `useAdaptivePolling`, or set `immediate: false` and rely solely on the `useEffect([band])` for fetching. Simplest: let `useAdaptivePolling` do the initial fetch and only the `useEffect` with `[band]` handle subsequent band changes (skip on initial render using `useRef(true)`).

### Pitfall 4: Port Forwarding Route Returns `rules` Not `reservations`
**What goes wrong:** The API route response key for port forwarding is named `rules`, not `forwarding` or `ports`.
**Why it happens:** Convention inconsistency between routes.
**How to avoid:** Check each route's actual `success({ ... })` wrapper key before wiring. Verified: system→`system`, wifi clients→`clients`, dhcp→`reservations`, port-forwarding→`rules` (inferred from route pattern), upnp→`upnp`, mesh→`mesh`.

**CRITICAL:** The port-forwarding route must be confirmed — read `app/api/fritzbox/network/port-forwarding/route.ts` before implementing the hook. (Not read during research — this is the one route I did not verify the response key for.)

### Pitfall 5: update_available Is a String
**What goes wrong:** Code does `if (system.update_available)` expecting boolean, but `update_available` is a `string` in `SystemResponse`.
**Why it happens:** The HA proxy returns a string (e.g., empty string `""` = no update, firmware version string = update available).
**How to avoid:** Check `system.update_available.length > 0` or `system.update_available !== ''` for the update indicator badge.

### Pitfall 6: Inactive Tab Hook Polling
**What goes wrong:** useFritzWifiClients and useFritzNetworkServices keep polling even when their tabs are not visible — wastes API budget.
**Why it happens:** Hooks start polling unconditionally on mount.
**How to avoid:** Pass `interval: activeTab === 'wifi' ? 60000 : null` down from page.tsx to the hooks, or accept a `paused: boolean` prop. The `null` interval in `useAdaptivePolling` correctly stops polling.

### Pitfall 7: Collapsible Sections All Closed = Empty Card Height
**What goes wrong:** NetworkServicesCard looks like an empty card when all 4 sections are collapsed, especially on first load.
**Why it happens:** No loading indicator, and collapsed sections show only headers.
**How to avoid:** Show a compact summary line per section in collapsed state (the count badge per D-10 handles this). The card should always look populated.

---

## Code Examples

### TimeRangeSelector as Model for HistoryTierToggle
```typescript
// Source: app/network/components/TimeRangeSelector.tsx (verified)
// HistoryTierToggle follows the exact same pattern:
const tiers: { value: BandwidthTier; label: string }[] = [
  { value: 'realtime', label: 'Tempo reale' },
  { value: 'hourly', label: 'Orario' },
  { value: 'daily', label: 'Giornaliero' },
];
// Renders Button.Group with ember variant for active, subtle for inactive
```

### DataTable Column Definition for WiFi Clients
```typescript
// Source: app/network/components/DeviceListTable.tsx (verified)
const columns: ColumnDef<WiFiClientModel>[] = [
  {
    accessorKey: 'hostname',
    header: 'Nome',
    enableSorting: true,
  },
  {
    accessorKey: 'signal_strength',
    header: 'Segnale',
    enableSorting: true,
    sortingFn: (rowA, rowB) =>
      rowB.original.signal_strength - rowA.original.signal_strength, // strongest first (less negative = stronger)
    cell: ({ row }) => <SignalStrengthBars dbm={row.original.signal_strength} />,
  },
  {
    accessorKey: 'band',
    header: 'Banda',
    cell: ({ row }) => (
      <Badge variant={row.original.band === '5GHz' ? 'ocean' : 'ember'} size="sm">
        {row.original.band}
      </Badge>
    ),
  },
];
```

### Tier Data Transformation
```typescript
// bps → Mbps, Unix seconds → ms (matches BandwidthHistoryPoint shape)
function mapHourlyToChartPoints(items: BandwidthHourlyRecord[]): BandwidthHistoryPoint[] {
  return items.map(r => ({
    time: r.hour_timestamp * 1000,
    download: r.avg_downstream_rate / 1_000_000,
    upload: r.avg_upstream_rate / 1_000_000,
  })).sort((a, b) => a.time - b.time);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct Fritz!Box API calls | HA proxy via haGet | v11.0 | All routes now use shared client |
| JWT auth | X-API-Key auth | v11.0 | Simpler, no token refresh |
| Firebase RTDB listener (stove) | useAdaptivePolling(60s) | v12.0 | Standard polling for all hooks |
| Multiple Promise.all fetches | Promise.allSettled for independent sources | v16.0 (Sonos) | Partial failure doesn't break whole section |

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 134 |
|-----------|---------------------|
| NEVER break existing functionality | `useNetworkData`, `useBandwidthHistory`, `useDeviceHistory`, `useBandwidthCorrelation` must be untouched (D-07 aligns) |
| WAIT for user confirmation before version updates | No new packages in this phase — no version updates needed |
| PREFER editing existing files over creating new | BandwidthChart and page.tsx are edited; only add new files where there's no existing home |
| NEVER execute `npm run build` or `npm install` | Tests only via `npm test` |
| ALWAYS create/update unit tests | Every new hook and component needs unit tests |
| USE design system from `/debug/design-system` | Use: Card, Button, Badge, DataTable, Skeleton, Heading, Text, InfoBox — verified all exist |
| NEVER commit/push without explicit request | Research and plan files only; implementation commits require explicit request |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + @testing-library/react |
| Config file | `jest.config.ts` (root) |
| Quick run command | `npm test -- --testPathPattern="network" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FRITZ-13 | useFritzSystemInfo returns model/firmware/uptime from API | unit (hook) | `npm test -- --testPathPattern="useFritzSystemInfo"` | Wave 0 |
| FRITZ-13 | SystemInfoCard renders model, firmware, formatted uptime | unit (component) | `npm test -- --testPathPattern="SystemInfoCard"` | Wave 0 |
| FRITZ-14 | useFritzWifiClients fetches with band filter param | unit (hook) | `npm test -- --testPathPattern="useFritzWifiClients"` | Wave 0 |
| FRITZ-14 | WifiClientsTable renders DataTable with signal bars and band badges | unit (component) | `npm test -- --testPathPattern="WifiClientsTable"` | Wave 0 |
| FRITZ-15 | useFritzNetworkServices fetches all 4 endpoints via Promise.allSettled | unit (hook) | `npm test -- --testPathPattern="useFritzNetworkServices"` | Wave 0 |
| FRITZ-15 | NetworkServicesCard shows 4 collapsible sections with counts | unit (component) | `npm test -- --testPathPattern="NetworkServicesCard"` | Wave 0 |
| FRITZ-16 | useFritzBandwidthTiers fetches hourly/daily on tier change, clears on realtime | unit (hook) | `npm test -- --testPathPattern="useFritzBandwidthTiers"` | Wave 0 |
| FRITZ-16 | BandwidthChart renders tier toggle and switches data source on tier change | unit (component) | `npm test -- --testPathPattern="BandwidthChart"` | Exists (needs update) |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="network" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/network/hooks/__tests__/useFritzSystemInfo.test.ts` — covers FRITZ-13
- [ ] `app/network/hooks/__tests__/useFritzWifiClients.test.ts` — covers FRITZ-14
- [ ] `app/network/hooks/__tests__/useFritzNetworkServices.test.ts` — covers FRITZ-15
- [ ] `app/network/hooks/__tests__/useFritzBandwidthTiers.test.ts` — covers FRITZ-16
- [ ] `app/network/components/__tests__/SystemInfoCard.test.tsx` — covers FRITZ-13
- [ ] `app/network/components/__tests__/WifiClientsTable.test.tsx` — covers FRITZ-14
- [ ] `app/network/components/__tests__/NetworkServicesCard.test.tsx` — covers FRITZ-15

`app/network/components/BandwidthChart.tsx` has no existing test file — add one in Wave 0.

---

## Open Questions

1. **Port forwarding route response key**
   - What we know: The pattern for all other routes is `success({ [singular_noun]: data })` — system→`system`, upnp→`upnp`, mesh→`mesh`, reservations→`reservations`
   - What's unclear: The port forwarding route key is likely `rules` but not explicitly verified during research (the route file was not read)
   - Recommendation: Read `app/api/fritzbox/network/port-forwarding/route.ts` in the plan before finalizing the hook's response parsing

2. **formatUptime sharing between WanStatusCard and SystemInfoCard**
   - What we know: The identical function exists in `WanStatusCard.tsx` (verified)
   - What's unclear: Whether to duplicate or extract to shared util
   - Recommendation: Extract to `app/network/utils/formatUptime.ts` and import in both — avoids duplication, keeps the plan clean

3. **Tab-conditional polling stagger**
   - What we know: Dashboard hooks use `initialDelay: 500` to avoid thundering herd
   - What's unclear: Whether WiFi/services hooks need stagger since they're conditionally activated (tab switch)
   - Recommendation: No stagger needed on tab activation — user already sees the page, the tab content fetch is intentional user action

---

## Environment Availability

Step 2.6: SKIPPED — phase is purely code/config changes for Next.js frontend. No external CLI tools, databases, or runtimes beyond the existing Node.js/npm environment are required.

---

## Sources

### Primary (HIGH confidence)
- `lib/fritzbox/fritzboxClient.ts` — All TypeScript interfaces for Fritz!Box API responses (SystemResponse, WiFiClientModel, DhcpReservationModel, PortForwardingRuleModel, UPnPStatusResponse, MeshTopologyResponse, BandwidthHourlyRecord, BandwidthDailyRecord)
- `app/api/fritzbox/system/route.ts` — Response key: `{ system: ... }`, cache key: `'system'`
- `app/api/fritzbox/wifi/clients/route.ts` — Band/limit/offset params, response key: `{ clients: ... }`
- `app/api/fritzbox/network/dhcp/reservations/route.ts` — Response key: `{ reservations: ... }`
- `app/api/fritzbox/network/upnp/route.ts` — Response key: `{ upnp: ... }`
- `app/api/fritzbox/network/mesh/route.ts` — Response key: `{ mesh: ... }`
- `app/api/fritzbox/history/bandwidth/hourly/route.ts` — Response key: `{ hourly: ... }`, days param
- `app/network/page.tsx` — Current orchestrator structure (5 sections, hook wiring pattern)
- `app/network/components/BandwidthChart.tsx` — Full component interface, Recharts usage
- `app/network/components/TimeRangeSelector.tsx` — Button group pattern for HistoryTierToggle
- `app/network/components/DeviceListTable.tsx` — DataTable column definition pattern, tab filter pattern
- `app/network/components/WanStatusCard.tsx` — Card/InfoBox pattern, formatUptime function
- `app/network/hooks/useBandwidthHistory.ts` — History buffer pattern
- `app/components/devices/network/hooks/useNetworkData.ts` — useAdaptivePolling + useVisibility pattern
- `lib/hooks/useAdaptivePolling.ts` — Full hook interface (interval: null pauses polling)

### Secondary (MEDIUM confidence)
- `app/dirigera/page.tsx` — Tab filter + segmented control pattern (cn + inline button styles)
- `app/components/ui/InfoBox.tsx` — Verified variant system and layout options
- `.planning/phases/134-fritz-box-frontend/134-CONTEXT.md` — All locked decisions (D-01 to D-28)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified present in project; no new installs required
- Architecture: HIGH — every pattern verified from existing codebase files; no new patterns introduced
- API response shapes: HIGH — all interfaces read directly from fritzboxClient.ts (source of truth)
- Pitfalls: HIGH — derived from direct code inspection; one open question (port-forwarding response key)
- Test infrastructure: HIGH — Jest + @testing-library/react confirmed; existing test patterns verified

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable codebase — no external API volatility)
