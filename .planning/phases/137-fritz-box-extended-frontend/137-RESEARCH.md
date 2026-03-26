# Phase 137: Fritz!Box Extended Frontend - Research

**Researched:** 2026-03-26
**Domain:** Next.js 15 frontend — React hooks, Recharts AreaChart, tab extension, card components
**Confidence:** HIGH

## Summary

Phase 137 is a pure frontend phase that extends the existing `/network` page with four new features: a WiFi Networks tab, a device count history AreaChart, a budget stats card, and auto-granularity support for the bandwidth chart. All four backing API routes already exist and are verified. All TypeScript types are already defined in `lib/fritzbox/fritzboxClient.ts`. No new backend work is needed.

The scope is entirely additive: new hooks, new components, one extended type union, and wiring in `app/network/page.tsx`. Every pattern needed exists in the codebase — the WiFi Networks tab mirrors WifiClientsTable, the budget stats card mirrors SystemInfoCard, the device count chart mirrors BandwidthChart (but using AreaChart), and the auto-granularity tier mirrors how `hourly`/`daily` are handled today.

**Primary recommendation:** Follow established patterns exactly — `useAdaptivePolling` + `useVisibility` for polling hooks, `next/dynamic` for code-split charts, `Button.Group` for toggle controls, `Card` + `Skeleton` for card components, Italian labels throughout.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**WiFi Networks Placement**
- D-01: Add a 4th tab "Reti WiFi" to the existing tab bar (Dispositivi / WiFi Clients / Servizi di Rete / Reti WiFi)
- D-02: Each network row shows SSID, band (2.4GHz / 5GHz), channel, and enabled/disabled status badge — maps directly to WiFiNetworkModel fields
- D-03: Simple table/list layout similar to WifiClientsTable, with paused polling when tab not active

**Device Count Chart**
- D-04: Use Recharts AreaChart (not LineChart) to visually differentiate from existing bandwidth LineChart
- D-05: Place below tab content, above bandwidth chart
- D-06: Default to 30 days, matching /api/fritzbox/history/devices/daily API default
- D-07: Code-split via next/dynamic (same pattern as BandwidthChart and BandwidthCorrelationChart)

**Budget Stats Card**
- D-08: Compact card with progress bar showing utilization_percent, status badge (ok/warning/danger with color coding), key metrics (window_seconds, current_window_requests, soft/hard limits)
- D-09: Place below SystemInfoCard / WanStatusCard, above tab navigation
- D-10: Single fetch on mount (not polling) — budget data changes slowly, same pattern as SystemInfoCard

**Auto-Granularity Integration**
- D-11: Add "Auto" as a 4th option in HistoryTierToggle (Tempo reale / Orario / Giornaliero / Auto)
- D-12: When "Auto" selected, useFritzBandwidthTiers calls /api/fritzbox/history/bandwidth/auto
- D-13: Display a subtle indicator showing which granularity the server chose (e.g., "Auto: orario" or "Auto: giornaliero")

### Claude's Discretion
- Loading/empty states for new components — follow existing patterns (Skeleton for loading, Text for empty)
- Exact color choices for AreaChart areas and budget status badges — use design system ember/copper accents
- Whether device count chart aggregates hour_buckets into daily totals or shows hourly granularity within days

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FRITZ-17 | WiFi networks section nella /network page (reti configurate con stato abilitato/disabilitato) | API route `/api/fritzbox/wifi/networks` → `{ networks: WiFiStatusResponse }`. Types: `WiFiNetworkModel` (service, band, ssid, channel, is_enabled). Hook pattern: useFritzWifiClients with paused option. Component pattern: WifiClientsTable with Card+DataTable. |
| FRITZ-18 | Device count daily chart nella /network page (grafico dispositivi connessi per giorno) | API route `/api/fritzbox/history/devices/daily` → `{ deviceCounts: PaginatedResponse<DeviceDailyRecord> }`. Type: `DeviceDailyRecord` (day_timestamp, hour_bucket 0-23, online_count, offline_count, total_devices). Pattern: next/dynamic AreaChart, on-demand fetch (useEffect on days param). |
| FRITZ-19 | Budget stats card nella /network page (consumo dati, percentuale utilizzo, stato ok/warning/danger) | API route `/api/fritzbox/budget-stats` → `{ stats: BudgetStats }`. Type: `BudgetStats` (utilization_percent, status: 'ok'/'warning'/'danger', window_seconds, current_window_requests, soft_limit, hard_limit, message). Single-fetch on mount, no polling. |
| FRITZ-20 | Auto-granularity toggle nella /network page bandwidth chart | API route `/api/fritzbox/history/bandwidth/auto` → `{ auto: PaginatedResponse<BandwidthAggregatedRecord> }`. Type: `BandwidthAggregatedRecord` (timestamp, granularity: 'hourly'/'daily', avg rates). Extend BandwidthTier union with 'auto'. Detect chosen granularity from first item's `granularity` field. |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 (via Next.js 15.5) | Component model | Project baseline |
| Recharts | Installed | AreaChart for device count chart | Already used for BandwidthChart, BandwidthCorrelationChart |
| next/dynamic | Built-in | Code-split chart components | Established pattern for all Recharts charts in /network |
| date-fns | Installed | Timestamp formatting in chart axes | Used in BandwidthChart already |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-table | Installed | DataTable for WiFi Networks list | Already used in WifiClientsTable — use same pattern |
| useAdaptivePolling | Internal | Polling with visibility adaptation | All Fritz!Box polling hooks use this |
| useVisibility | Internal | Tab visibility detection | Pair with useAdaptivePolling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| AreaChart (Recharts) | LineChart | Decision D-04 locked — AreaChart shows volume, differentiates from bandwidth LineChart |
| Single fetch on mount | useAdaptivePolling | Budget data is nearly static — polling would waste rate limit budget (D-10 locked) |
| DataTable for WiFi Networks | Custom list | DataTable is the established pattern for tabular data in this codebase |

**Installation:** No new packages needed. All dependencies already installed.

---

## Architecture Patterns

### Recommended Project Structure

New files for this phase:

```
app/network/
├── hooks/
│   ├── useFritzWifiNetworks.ts          # NEW — WiFi networks polling hook (paused option)
│   ├── useFritzBudgetStats.ts           # NEW — single-fetch budget stats hook
│   ├── useFritzDeviceCountHistory.ts    # NEW — on-demand device count fetch hook
│   └── useFritzBandwidthTiers.ts        # EXTEND — add 'auto' tier + granularity indicator
├── components/
│   ├── WifiNetworksTable.tsx            # NEW — FRITZ-17 display component
│   ├── BudgetStatsCard.tsx              # NEW — FRITZ-19 display component
│   ├── DeviceCountChart.tsx             # NEW — FRITZ-18 code-split AreaChart
│   └── HistoryTierToggle.tsx            # EXTEND — add 'Auto' button (D-11)
└── page.tsx                             # EXTEND — wire all 4 new features
```

### Pattern 1: Polling Hook with Paused Option (WiFi Networks)

Mirror `useFritzWifiClients` exactly. The `paused` option stops polling when the tab is not active.

```typescript
// Source: app/network/hooks/useFritzWifiClients.ts — established pattern
export function useFritzWifiNetworks(options: { paused?: boolean } = {}): {
  networks: WiFiNetworkModel[];
  loading: boolean;
  stale: boolean;
} {
  const { paused = false } = options;
  const [networks, setNetworks] = useState<WiFiNetworkModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const isVisible = useVisibility();
  const interval = paused ? null : (isVisible ? 60000 : 300000);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/fritzbox/wifi/networks');
      if (!res.ok) { setStale(true); return; }
      const json = await res.json() as { networks: WiFiStatusResponse };
      setNetworks(json.networks.networks);
      setStale(false);
    } catch { setStale(true); }
    finally { setLoading(false); }
  };

  useAdaptivePolling({ callback: fetchData, interval, alwaysActive: false, immediate: true, initialDelay: 0 });
  return { networks, loading, stale };
}
```

**Key detail:** API response shape is `{ networks: WiFiStatusResponse }` where `WiFiStatusResponse = { networks: WiFiNetworkModel[], is_stale, fetched_at }`. So the networks array is at `json.networks.networks`.

### Pattern 2: Single-Fetch Hook (Budget Stats)

For data that changes slowly. No `useAdaptivePolling` — single fetch on mount via `useEffect`.

```typescript
// Source: Single-fetch pattern (budget data is nearly static per D-10)
export function useFritzBudgetStats(): {
  data: BudgetStats | null;
  loading: boolean;
  error: boolean;
} {
  const [data, setData] = useState<BudgetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/fritzbox/budget-stats')
      .then(r => r.json())
      .then((json: { stats: BudgetStats }) => { setData(json.stats); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
```

**Key detail:** API response shape is `{ stats: BudgetStats }` (verified from `app/api/fritzbox/budget-stats/route.ts`).

### Pattern 3: On-Demand Fetch Hook (Device Count History)

Same pattern as `useFritzBandwidthTiers` — fetch triggers on state change (days param), not polling.

```typescript
// Source: app/network/hooks/useFritzBandwidthTiers.ts — established on-demand pattern
export function useFritzDeviceCountHistory(): {
  days: number;
  setDays: (d: number) => void;
  chartData: DeviceCountPoint[];   // { date, online, offline, total }
  loading: boolean;
} {
  const [days, setDays] = useState(30);
  const [chartData, setChartData] = useState<DeviceCountPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/fritzbox/history/devices/daily?days=${days}`)
      .then(r => r.json())
      .then((json: { deviceCounts: { items: DeviceDailyRecord[] } }) => {
        setChartData(aggregateToDailyTotals(json.deviceCounts.items));
      })
      .catch(() => setChartData([]))
      .finally(() => setLoading(false));
  }, [days]);

  return { days, setDays, chartData, loading };
}
```

**Key detail:** `DeviceDailyRecord` has `hour_bucket` (0-23) — 24 records per day. The hook should aggregate these into daily totals by grouping on `day_timestamp` and taking max `online_count` (peak per day) or avg. Claude's Discretion: whether to show hourly granularity within days or daily totals. Recommendation: aggregate to daily totals (one point per day) — simpler, cleaner AreaChart with 30 points over 30 days.

### Pattern 4: Extending BandwidthTier Union (Auto-Granularity)

Two-file change to add 'auto' tier:

**useFritzBandwidthTiers.ts changes:**
1. Add `'auto'` to `BandwidthTier` union: `export type BandwidthTier = 'realtime' | 'hourly' | 'daily' | 'auto'`
2. Add branch in `useEffect` for `tier === 'auto'`:

```typescript
// Source: app/network/hooks/useFritzBandwidthTiers.ts — extend existing useEffect
if (tier === 'auto') {
  // Fetch with default days=7 (auto route decides hourly vs daily server-side)
  fetch('/api/fritzbox/history/bandwidth/auto?days=7')
    .then(r => r.json())
    .then((json: { auto: { items: BandwidthAggregatedRecord[] } }) => {
      const items = json.auto?.items ?? [];
      // Detect chosen granularity from first item
      const chosenGranularity = items[0]?.granularity ?? null;
      setAutoGranularity(chosenGranularity);
      setTierData(mapAutoToChartPoints(items));
    })
    ...
}
```

3. Return `autoGranularity: 'hourly' | 'daily' | null` from hook for the D-13 indicator.

**HistoryTierToggle.tsx changes:**
1. Add `{ value: 'auto' as const, label: 'Auto' }` to the `tiers` array.
2. No other changes — the existing `Button.Group` loop renders it automatically.

**BandwidthChart.tsx changes for D-13 indicator:**
- When `activeTier === 'auto'` and `autoGranularity` is not null, render a small `Text` label next to the toggle: e.g., "Auto: orario" or "Auto: giornaliero".
- Pass `autoGranularity` as an optional prop from `page.tsx` → `BandwidthChart` → display inline.

### Pattern 5: Code-Split AreaChart Component (Device Count)

Exact mirror of BandwidthCorrelationChart's next/dynamic pattern:

```typescript
// Source: app/network/page.tsx — established code-split pattern
const DeviceCountChart = dynamic(
  () => import('./components/DeviceCountChart'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-slate-800/30 [html:not(.dark)_&]:bg-white rounded-2xl p-6 h-[320px] flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-xl" />
      </div>
    ),
  }
);
```

Inside `DeviceCountChart.tsx` — use Recharts `AreaChart` with:
- `online_count` as the primary area (sage/green color — "devices connected")
- X axis: formatted day label (`dd/MM`)
- Y axis: integer count
- Responsive container

### Pattern 6: Tab Extension (WiFi Networks Tab)

```typescript
// Source: app/network/page.tsx — extend existing tab definitions
type NetworkTab = 'dispositivi' | 'wifi' | 'servizi' | 'reti-wifi';  // add new tab key

// In the tiers array:
{ key: 'reti-wifi' as const, label: 'Reti WiFi' },

// Paused polling:
const wifiNetworks = useFritzWifiNetworks({ paused: activeTab !== 'reti-wifi' });

// Tab content:
{activeTab === 'reti-wifi' && (
  <WifiNetworksTable networks={wifiNetworks.networks} loading={wifiNetworks.loading} stale={wifiNetworks.stale} />
)}
```

### Pattern 7: Budget Stats Card Layout

Compact card with progress bar — no existing `ProgressBar` component found; use native `div` with Tailwind width style.

```typescript
// Budget status color mapping
const STATUS_COLORS = {
  ok: 'bg-sage-500',       // green
  warning: 'bg-amber-500', // amber
  danger: 'bg-red-500',    // red
};

// Progress bar (utilization_percent 0-100)
<div className="w-full bg-slate-700/50 rounded-full h-2">
  <div
    className={`h-2 rounded-full ${STATUS_COLORS[data.status]}`}
    style={{ width: `${Math.min(data.utilization_percent, 100)}%` }}
  />
</div>
```

Status badge uses existing `Badge` component: `variant="sage"` (ok), `variant="ember"` (warning), `variant="rose"` (danger) — or custom color classes.

### Anti-Patterns to Avoid

- **Don't use polling for budget stats:** Budget changes slowly; single fetch on mount is sufficient (D-10). Using `useAdaptivePolling` would waste the rate limit (10 req/min per endpoint).
- **Don't aggregate DeviceDailyRecord in the component:** Aggregation logic belongs in the hook, not the chart component.
- **Don't skip code-splitting for DeviceCountChart:** All Recharts charts in /network use `next/dynamic` (D-07).
- **Don't put budget stats inside a tab:** It's system-level info (D-09) — place above tab navigation alongside SystemInfoCard and WanStatusCard.
- **Don't forget paused polling for WiFi Networks tab:** Apply the same `paused: activeTab !== 'reti-wifi'` pattern as wifiClients and networkServices.
- **Don't change BandwidthChart's existing tier rendering logic for 'hourly'/'daily':** The new 'auto' case should be additive — check `tier === 'auto'` before the existing `hourly`/`daily` branches.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Table for WiFi Networks list | Custom table markup | `DataTable` from design system | Already used in WifiClientsTable — consistent sorting, density, accessibility |
| Button group toggles | Custom button styles | `Button.Group` + `Button variant="ember"/"subtle"` | Established pattern in TimeRangeSelector and HistoryTierToggle |
| Card container | Custom div + className | `Card variant="elevated"` | Design system component with dark/light mode support |
| Loading skeletons | Custom shimmer | `Skeleton` component | Consistent with every other card in /network |
| Status badges | Custom span | `Badge` component | Design system component with variant system |
| Chart responsiveness | Manual container sizing | `ResponsiveContainer` from Recharts | Already used in BandwidthChart and BandwidthCorrelationChart |

**Key insight:** This phase adds zero new UI primitives. Every visual element maps to an existing design system component or established pattern.

---

## Common Pitfalls

### Pitfall 1: DeviceDailyRecord Has 24 Rows Per Day
**What goes wrong:** Treating each record as one day in the AreaChart, producing 24x too many X-axis points for a 30-day chart (720 points instead of 30).
**Why it happens:** `DeviceDailyRecord.hour_bucket` is 0-23 — there are 24 records per `day_timestamp`.
**How to avoid:** Aggregate by `day_timestamp` in the hook before passing to the chart. Group records by `day_timestamp`, compute `max(online_count)` or `avg(online_count)` per day.
**Warning signs:** X-axis shows timestamps spaced 1 hour apart instead of 1 day apart.

### Pitfall 2: WiFi Networks API Response Shape Nesting
**What goes wrong:** Accessing `json.networks` expecting `WiFiNetworkModel[]` but getting the full `WiFiStatusResponse` object.
**Why it happens:** The route returns `success({ networks })` where `networks = WiFiStatusResponse` (an object). So the array is at `json.networks.networks`.
**How to avoid:** In the hook: `const json = await res.json() as { networks: WiFiStatusResponse }; setNetworks(json.networks.networks);`
**Warning signs:** TypeScript error "networks.map is not a function" or empty table when API returns data.

### Pitfall 3: BandwidthTier Type Not Exported to BandwidthChart
**What goes wrong:** After adding 'auto' to `BandwidthTier`, the `BandwidthChart` component's `activeTier` prop type becomes stale, causing TypeScript errors when passing 'auto'.
**Why it happens:** `BandwidthChart.tsx` imports `BandwidthTier` from `useFritzBandwidthTiers.ts` — updating the union in the hook file automatically updates the chart's type too (no separate action needed).
**How to avoid:** Verify the `BandwidthChart` import: `import type { BandwidthTier } from '../hooks/useFritzBandwidthTiers'` — this import is already in place and will pick up the extended union.
**Warning signs:** TypeScript error "Argument of type 'auto' is not assignable to type BandwidthTier".

### Pitfall 4: Auto Tier formatXAxis in BandwidthChart
**What goes wrong:** BandwidthChart's `formatXAxis` uses `activeTier` to pick format (`'daily'` → `dd/MM`, `'hourly'` → `dd/MM HH:mm`). With `activeTier === 'auto'`, it falls through to the realtime formatter (`HH:mm`).
**Why it happens:** The existing switch only handles `'daily'` and `'hourly'`.
**How to avoid:** In `BandwidthChart.formatXAxis`, add a case for `'auto'` that reads from `autoGranularity` (passed as prop) to determine the format:
```typescript
if (activeTier === 'auto') {
  return autoGranularity === 'daily'
    ? format(timestamp, 'dd/MM')
    : format(timestamp, 'dd/MM HH:mm');
}
```
**Warning signs:** Auto tier shows timestamps formatted as `HH:mm` only instead of dates.

### Pitfall 5: BandwidthAggregatedRecord Uses `timestamp` Not `hour_timestamp`/`day_timestamp`
**What goes wrong:** Auto tier mapping function tries to read `hour_timestamp` or `day_timestamp` from `BandwidthAggregatedRecord`, getting `undefined`.
**Why it happens:** `BandwidthAggregatedRecord` uses a unified `timestamp` field (not the tier-specific names). Only `BandwidthHourlyRecord` uses `hour_timestamp` and `BandwidthDailyRecord` uses `day_timestamp`.
**How to avoid:** In `mapAutoToChartPoints`, read `record.timestamp` (not `record.hour_timestamp`).

### Pitfall 6: page.test.tsx Needs Updates for New Hooks
**What goes wrong:** Existing `page.test.tsx` renders `NetworkPage` but doesn't mock the new hooks (`useFritzWifiNetworks`, `useFritzBudgetStats`, `useFritzDeviceCountHistory`). Tests fail with "fetch is not defined" or React state update errors.
**Why it happens:** `page.tsx` calls the new hooks unconditionally on render.
**How to avoid:** Add jest.mock entries for all three new hooks in `page.test.tsx` (similar to existing mocks for `useFritzSystemInfo`, `useFritzWifiClients`, `useFritzNetworkServices`).

---

## Code Examples

### WiFiNetworkModel Fields (verified from fritzboxClient.ts §237-245)
```typescript
interface WiFiNetworkModel {
  service: number;
  band: string;          // e.g., "2.4GHz", "5GHz"
  ssid: string;
  channel: number;
  possible_channels: string;
  is_enabled: boolean;
  beacon_type: string;
}
```

### BudgetStats Fields (verified from fritzboxClient.ts §415-425)
```typescript
interface BudgetStats {
  window_seconds: number;
  current_window_requests: number;
  soft_limit: number;
  hard_limit: number;
  total_lifetime_requests: number;
  warning_count: number;
  utilization_percent: number;
  status: 'ok' | 'warning' | 'danger';
  message: string;
}
```

### DeviceDailyRecord Fields (verified from fritzboxClient.ts §391-397)
```typescript
interface DeviceDailyRecord {
  day_timestamp: number;    // Unix seconds (day boundary)
  hour_bucket: number;      // 0-23 — 24 records per day
  online_count: number;
  offline_count: number;
  total_devices: number;
}
```

### BandwidthAggregatedRecord Fields (verified from fritzboxClient.ts §399-412)
```typescript
interface BandwidthAggregatedRecord {
  timestamp: number;          // unified — not hour_timestamp or day_timestamp
  granularity: 'hourly' | 'daily';   // discriminator — read this for D-13 indicator
  avg_upstream_rate: number;
  avg_downstream_rate: number;
  // ...min/max/sample_count fields
}
```

### API Response Shapes (verified from route files)
```typescript
// /api/fritzbox/wifi/networks
{ networks: WiFiStatusResponse }   // WiFiStatusResponse.networks is WiFiNetworkModel[]

// /api/fritzbox/budget-stats
{ stats: BudgetStats }

// /api/fritzbox/history/devices/daily
{ deviceCounts: PaginatedResponse<DeviceDailyRecord> }   // items array has 24 records/day

// /api/fritzbox/history/bandwidth/auto
{ auto: PaginatedResponse<BandwidthAggregatedRecord> }   // days<=7 → hourly, days>7 → daily
```

### Test Patterns (verified from existing hook tests)
```typescript
// Hook test pattern — from useFritzSystemInfo.test.ts
jest.mock('@/lib/hooks/useAdaptivePolling', () => ({
  useAdaptivePolling: ({ callback }: { callback: () => void }) => { callback(); },
}));
jest.mock('@/lib/hooks/useVisibility', () => ({
  useVisibility: () => true,
}));

// For single-fetch hooks (no useAdaptivePolling), mock useEffect via global.fetch directly
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ stats: mockBudgetStats }),
}) as jest.Mock;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct Fritz!Box API calls | Shared HA proxy via haGet/haPost | v13.0 | All fritzbox routes use fritzboxClient |
| Firebase RTDB polling | useAdaptivePolling | v12.0 | Standard hook for all device polling |
| LineChart for all data | AreaChart for volume data | Phase 137 (this phase) | Device count chart differentiates visually |

---

## Open Questions

None — all technical unknowns resolved by code inspection. The only open items are Claude's Discretion choices:

1. **Device count aggregation granularity:** Recommendation is daily totals (one point per day). Use `max(online_count)` per day_timestamp to show peak connected devices per day. This gives a clean 30-point AreaChart.

2. **Budget status badge variants:** Design system `Badge` component has variants. Recommendation: `variant="sage"` for 'ok', `variant="ember"` for 'warning', custom className for 'danger' (use `bg-red-500/20 text-red-400 border-red-400/20` if no rose variant, or check design system for exact variant name).

3. **Auto tier days param:** D-12 says useFritzBandwidthTiers calls `/api/fritzbox/history/bandwidth/auto`. The auto route's threshold is `days<=7` → hourly, `days>7` → daily. Default fetch with `?days=7` will return hourly data. Consider making days configurable alongside an existing time range control — or use `days=30` to get daily data by default. Given the D-13 indicator will show what was chosen, start with `days=7` (hourly) as the default for the 'auto' tier.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely frontend code changes. No external tools, services, or CLI utilities beyond the project's own Next.js dev server are required.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="app/network" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FRITZ-17 | useFritzWifiNetworks: fetches /api/fritzbox/wifi/networks, returns networks array, supports paused option | unit | `npm test -- --testPathPattern="useFritzWifiNetworks"` | ❌ Wave 0 |
| FRITZ-17 | WifiNetworksTable: renders SSID, band, channel, enabled/disabled badge | unit | `npm test -- --testPathPattern="WifiNetworksTable"` | ❌ Wave 0 |
| FRITZ-18 | useFritzDeviceCountHistory: fetches /api/fritzbox/history/devices/daily, aggregates to daily totals | unit | `npm test -- --testPathPattern="useFritzDeviceCountHistory"` | ❌ Wave 0 |
| FRITZ-19 | useFritzBudgetStats: single fetch, returns BudgetStats, handles error | unit | `npm test -- --testPathPattern="useFritzBudgetStats"` | ❌ Wave 0 |
| FRITZ-19 | BudgetStatsCard: renders utilization_percent progress bar, status badge, key metrics | unit | `npm test -- --testPathPattern="BudgetStatsCard"` | ❌ Wave 0 |
| FRITZ-20 | useFritzBandwidthTiers: 'auto' tier fetches /bandwidth/auto, returns tierData + autoGranularity | unit | `npm test -- --testPathPattern="useFritzBandwidthTiers"` | ✅ (extend existing) |
| FRITZ-20 | HistoryTierToggle: renders 4 buttons including 'Auto', clicking calls onChange with 'auto' | unit | `npm test -- --testPathPattern="HistoryTierToggle"` | ✅ (extend existing) |
| ALL | page.tsx: renders budget stats card, device count chart, WiFi Networks tab, auto tier option | integration | `npm test -- --testPathPattern="network/.*page"` | ✅ (extend existing) |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="app/network" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/network/hooks/__tests__/useFritzWifiNetworks.test.ts` — covers FRITZ-17 hook
- [ ] `app/network/components/__tests__/WifiNetworksTable.test.tsx` — covers FRITZ-17 component
- [ ] `app/network/hooks/__tests__/useFritzDeviceCountHistory.test.ts` — covers FRITZ-18 hook
- [ ] `app/network/hooks/__tests__/useFritzBudgetStats.test.ts` — covers FRITZ-19 hook
- [ ] `app/network/components/__tests__/BudgetStatsCard.test.tsx` — covers FRITZ-19 component
- [ ] Extend `app/network/hooks/__tests__/useFritzBandwidthTiers.test.ts` — add 'auto' tier cases
- [ ] Extend `app/network/components/__tests__/HistoryTierToggle.test.tsx` — add 'Auto' button test
- [ ] Extend `app/network/__tests__/page.test.tsx` — mock new hooks, verify new sections render

---

## Sources

### Primary (HIGH confidence)
- `lib/fritzbox/fritzboxClient.ts` §236-454 — WiFiNetworkModel, WiFiStatusResponse, BandwidthHourlyRecord, BandwidthDailyRecord, DeviceDailyRecord, BandwidthAggregatedRecord, BudgetStats — verified field names and types
- `app/api/fritzbox/wifi/networks/route.ts` — response shape `{ networks: WiFiStatusResponse }` verified
- `app/api/fritzbox/budget-stats/route.ts` — response shape `{ stats: BudgetStats }` verified
- `app/api/fritzbox/history/bandwidth/auto/route.ts` — response shape `{ auto: PaginatedResponse<BandwidthAggregatedRecord> }`, days threshold behavior verified
- `app/api/fritzbox/history/devices/daily/route.ts` — response shape `{ deviceCounts: PaginatedResponse<DeviceDailyRecord> }` verified
- `app/network/hooks/useFritzBandwidthTiers.ts` — BandwidthTier union, mapToChartPoints pattern, useEffect on tier state
- `app/network/hooks/useFritzWifiClients.ts` — paused polling pattern with useAdaptivePolling + useVisibility
- `app/network/hooks/useFritzSystemInfo.ts` — single-fetch-like pattern (polling but same structure)
- `app/network/page.tsx` — tab navigation pattern, next/dynamic usage, hook wiring
- `app/network/components/BandwidthChart.tsx` — tier handling, formatXAxis, HistoryTierToggle integration
- `app/network/components/WifiClientsTable.tsx` — DataTable + Band badge + Card pattern
- `app/network/components/SystemInfoCard.tsx` — Skeleton loading, null guard, Card layout
- `app/network/components/HistoryTierToggle.tsx` — Button.Group pattern, BandwidthTier import
- `app/network/hooks/__tests__/useFritzBandwidthTiers.test.ts` — test mock patterns for on-demand fetch hooks
- `app/network/hooks/__tests__/useFritzSystemInfo.test.ts` — test mock patterns for polling hooks
- `app/network/components/__tests__/HistoryTierToggle.test.tsx` — component test patterns

### Secondary (MEDIUM confidence)
- None required — all findings sourced from codebase inspection.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified as installed and used in existing /network components
- Architecture: HIGH — patterns copied directly from verified existing code
- Pitfalls: HIGH — identified by reading the exact type definitions and response shapes

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (stable phase — no fast-moving dependencies)
