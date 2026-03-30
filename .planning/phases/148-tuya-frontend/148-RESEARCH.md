# Phase 148: Tuya Frontend - Research

**Researched:** 2026-03-30
**Domain:** Next.js React components — WS-primary hook, dashboard card, sub-page, Recharts chart, device registry wiring
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** TuyaCard shows a compact summary: total plug count, active/inactive breakdown, total power draw (W), and a power gauge — click navigates to /tuya page

**D-02:** Multi-plug status uses aggregate view (N on / N off, total W, highlight highest consumer) — no per-plug detail on dashboard card

**D-03:** Card-per-plug responsive grid: 1-col mobile, 2-col tablet, 3-col desktop

**D-04:** Each plug card shows: on/off toggle, custom_name (or device_id fallback), power_w, countdown timer status, data_freshness badge, click/expand for energy chart

**D-05:** Recharts AreaChart with auto-granularity period selector (24h → raw, 7d → hourly, 30d → daily)

**D-06:** Primary metric: avg_power_w (or power_w for raw); secondary metric: energy_kwh_delta — use next/dynamic code splitting for chart component

**D-07:** Inline on plug card: number input (minutes) + "Imposta" button; active countdown shows as mm:ss with "Annulla" button

**D-08:** Timer set sends POST /api/tuya/plugs/{device_id}/timer with seconds = minutes * 60; cancel sends seconds = 0

### Claude's Discretion

- Color theme for TuyaCard (suggest "amber" or "cyan" to differentiate from existing devices)
- Skeleton component design for loading state
- Error/empty state copy (Italian locale)
- Power gauge component: reuse existing gauge patterns or simple bar — Claude decides based on what exists
- Stale state threshold values for WS data

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TUYA-09 | useTuyaData hook with WS-primary (`tuya` topic) and polling fallback | useRaspiData.ts pattern: subscribe in useEffect gated on isWsConnected, interval = isWsConnected ? null : pollInterval |
| TUYA-10 | useTuyaCommands hook for state toggle and timer control | useStoveCommands.ts pattern; Tuya uses simple fetch (no retry infra needed — synchronous 200 response) |
| TUYA-11 | TuyaCard dashboard card showing plug status, power gauge, freshness badge | RaspiCard.tsx pattern + DashboardCards.tsx registries |
| TUYA-12 | /tuya page with multi-plug grid, on/off toggles, energy charts, timer controls | raspi/page.tsx orchestrator pattern; new app/tuya/page.tsx |
| TUYA-13 | Tuya device registered in device registry and navigation menu | deviceTypes.ts: add 'tuya' to DeviceTypeId, DEVICE_TYPES, DEVICE_CONFIG, DEFAULT_DEVICE_ORDER |
| TUYA-14 | Energy history chart with auto-granularity period selector (24h/7d/30d) | SonosHistoryChart.tsx pattern with next/dynamic; AreaChart from recharts |
| UX-02 | TuyaCard displays LastUpdated timestamp | LastUpdated component, lastUpdatedAt from useTuyaData — same as RaspiCard line 81 |
</phase_requirements>

---

## Summary

Phase 148 is a pure-frontend implementation phase. The backend infrastructure (tuyaProxy.ts + 6 API routes) was fully built in Phase 147. All TypeScript types are defined in `types/tuyaProxy.ts` and `types/websocket.ts` already includes `TuyaData` and the `tuya` topic in the `Topic` union and `TopicDataMap`. This means WSTYPE-13/14 are already satisfied for Tuya.

The phase follows an exact parallel to Phase 146 (Raspi WS migration) and the established device onboarding pattern: types → proxy → routes → hook → card → page → registry. Steps 1-3 are complete. This phase covers steps 4-7: `useTuyaData` + `useTuyaCommands` hooks, `TuyaCard` dashboard card, `/tuya` page with plug grid + charts + timer controls, and registry/nav wiring.

The key technical challenge is the energy history chart (TUYA-14): the API returns different fields depending on granularity (`power_w` for raw, `avg_power_w`/`energy_kwh_delta` for aggregated). The chart component must branch on the `granularity` field from the response. The next/dynamic code-splitting pattern for Recharts charts is already established via `SonosHistoryChart.tsx`.

**Primary recommendation:** Model every file after its direct Raspi/Sonos counterpart. The implementation is additive — no existing code needs to be modified except the four registry files (deviceTypes.ts, DashboardCards.tsx, Skeleton.tsx, NavbarConnectionStatus.tsx — which already includes `tuya` in the Topic union but has no per-topic display logic to update).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (Next.js 15.5) | 15.5 | UI framework | Project standard |
| TypeScript | project default | Type safety | Strict mode enforced |
| Recharts | project installed | Energy history chart | Established — SonosVolumeChart, BandwidthChart use it |
| next/dynamic | built-in | Code-split Recharts chart | Established — SonosHistoryChart pattern |
| date-fns | project installed | Timestamp formatting in chart | Established — SonosHistoryChart imports format |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-use-websocket | project installed | WS subscription via useWebSocketContext | useTuyaData WS layer |
| useAdaptivePolling | internal lib hook | Polling fallback when WS disconnected | useTuyaData fallback |
| useVisibility | internal lib hook | Pause polling when tab hidden | useTuyaData, same as useRaspiData |

### No new installations needed
All dependencies are already in the project. This phase adds zero new packages.

---

## Architecture Patterns

### Recommended File Structure
```
app/components/devices/tuya/
├── hooks/
│   ├── useTuyaData.ts           # WS-primary + polling fallback
│   └── useTuyaCommands.ts       # setState, setTimer mutations
├── components/
│   ├── TuyaPlugCard.tsx         # Per-plug card (toggle, timer, power)
│   ├── TuyaSummary.tsx          # Aggregate view for dashboard card
│   └── TuyaEnergyChart.tsx      # Recharts AreaChart (lazy via next/dynamic)
├── __tests__/
│   ├── useTuyaData.test.ts
│   ├── useTuyaCommands.test.ts
│   └── TuyaCard.test.tsx
└── TuyaCard.tsx                 # Dashboard card orchestrator

app/tuya/
├── page.tsx                     # /tuya page orchestrator
└── components/
    └── (optional sub-components if page.tsx grows too large)
```

### Pattern 1: WS-Primary Hook (useTuyaData)

**What:** Subscribe to `tuya` WS topic for live `TuyaData` pushes. Fall back to polling `GET /api/tuya/plugs` when WS is disconnected. Gate subscription in `useEffect` on `isWsConnected`.

**Source:** `app/components/devices/raspi/hooks/useRaspiData.ts` — copy the pattern verbatim, adapting types.

```typescript
// Source: app/components/devices/raspi/hooks/useRaspiData.ts (adapted)
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import type { TuyaData } from '@/types/websocket';
import type { TuyaPlug } from '@/types/tuyaProxy';

export interface UseTuyaDataReturn {
  plugs: TuyaPlug[] | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
  lastUpdatedAt: number | null;
}

export function useTuyaData(): UseTuyaDataReturn {
  const [plugs, setPlugs] = useState<TuyaPlug[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const dataRef = useRef<TuyaPlug[] | null>(null);

  const isVisible = useVisibility();
  const interval = isVisible ? 60000 : 300000;

  const { subscribe, unsubscribe, readyState } = useWebSocketContext();
  const isWsConnected = readyState === ReadyState.OPEN;

  const fetchData = async () => {
    try {
      setError(null);
      const res = await fetch('/api/tuya/plugs');
      if (!res.ok) throw new Error('Tuya non raggiungibile');
      const data = await res.json() as TuyaPlug[];
      dataRef.current = data;
      setPlugs(data);
      setStale(false);
      setLastUpdatedAt(Date.now());
    } catch {
      setStale(true);
      if (!dataRef.current) setError('Tuya non raggiungibile');
    } finally {
      setLoading(false);
    }
  };

  // WS subscription (Phase 141 conditional guard pattern)
  useEffect(() => {
    if (!isWsConnected) return;
    const handleMessage = (raw: unknown) => {
      const wsData = raw as TuyaData;
      if (wsData.plugs !== null) {
        dataRef.current = wsData.plugs;
        setPlugs(wsData.plugs);
        setStale(false);
        setLoading(false);
        setError(null);
        setLastUpdatedAt(Date.now());
      }
    };
    subscribe('tuya', handleMessage);
    return () => { unsubscribe('tuya', handleMessage); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWsConnected, subscribe, unsubscribe]);

  useAdaptivePolling({
    callback: fetchData,
    interval: isWsConnected ? null : interval,
    alwaysActive: false,
    immediate: true,
    initialDelay: 600,
  });

  return { plugs, loading, error, stale, lastUpdatedAt };
}
```

### Pattern 2: Commands Hook (useTuyaCommands)

**What:** Simple async functions for `setState` and `setTimer`. Unlike stove commands (202 Accepted + poll delay), Tuya commands return 200 synchronously with `TuyaPlugMutation`. Handle `data_confirmed: false` by waiting 2s and re-fetching.

**Source:** Phase 147 decision — "setState/setTimer return TuyaPlugMutation (200 pass-through) not 202 Accepted"

**Key difference from useStoveCommands:** No `useRetryableCommand` needed — the Tuya API is simpler (no scheduling, no 409 conflicts). Direct fetch with optimistic update pattern is appropriate.

```typescript
// Optimistic toggle pattern (from docs/api/tuya.md frontend suggestion)
async function togglePlug(deviceId: string, currentState: boolean) {
  // Optimistic: update local state immediately
  setPlugs(prev => prev?.map(p =>
    p.device_id === deviceId ? { ...p, switch_on: !currentState } : p
  ) ?? prev);

  const res = await fetch(`/api/tuya/plugs/${deviceId}/state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ on: !currentState }),
  });
  const mutation = await res.json() as TuyaPlugMutation;

  if (mutation.data_confirmed) {
    // Commit confirmed state from server
    setPlugs(prev => prev?.map(p =>
      p.device_id === deviceId ? { ...mutation } : p  // strip data_confirmed from TuyaPlug
    ) ?? prev);
  } else {
    // Revert optimistic update, re-fetch after 2s
    setTimeout(() => void refetchSinglePlug(deviceId), 2000);
  }
}
```

### Pattern 3: Dashboard Card (TuyaCard)

**What:** Orchestrator card following `RaspiCard.tsx`. Uses `useTuyaData` for data, renders `Skeleton.TuyaCard` while loading, `Banner` on error, aggregate summary (D-01/D-02) when data available. Clickable — navigates to `/tuya`.

**Color theme recommendation:** `"amber"` — differentiates from sage (raspi), ocean (dirigera), success (sonos). Amber evokes power/energy.

**Power gauge:** Use a simple visual bar showing total watts against a max scale (e.g. sum of all plugs × reasonable max per plug). No existing gauge component found in project — use a `<div>` with percentage width and amber gradient, consistent with Ember Noir design system.

### Pattern 4: Energy Chart (TuyaEnergyChart)

**What:** `next/dynamic` wrapper that lazy-loads a `TuyaEnergyChartInner` component containing the Recharts `AreaChart`. Branch on `granularity` from API response.

**Source:** `SonosHistoryChart.tsx` + `SonosVolumeChart.tsx` pattern.

```typescript
// TuyaEnergyChart.tsx (outer — lazy loader)
'use client';
import dynamic from 'next/dynamic';
const TuyaEnergyChartInner = dynamic(() => import('./TuyaEnergyChartInner'), { ssr: false });
export default TuyaEnergyChart;

// TuyaEnergyChartInner.tsx (actual Recharts)
// For granularity="raw": AreaChart with dataKey="power_w"
// For granularity="hourly"/"daily": AreaChart with dataKey="avg_power_w",
//   secondary area with dataKey="energy_kwh_delta" (right Y axis)
// Period selector buttons: "24h" | "7g" | "30g" (Italian labels)
```

**History fetch hook:** `useTuyaHistory(deviceId, period)` — fetches `GET /api/tuya/plugs/[device_id]/history?period=...`, manages loading/error state, re-fetches when period changes via `useEffect`.

### Pattern 5: Timer Display

**What:** Client-side countdown display. Read `countdown_s` from plug state. If > 0, decrement every second via `useInterval` or `setInterval` + cleanup. When reaches 0, trigger a re-fetch of the plug state (docs/api/tuya.md recommendation).

```typescript
// Countdown display (mm:ss format)
function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
```

### Pattern 6: Registry Wiring (TUYA-13)

Four files need edits to register Tuya as a device:

1. **`lib/devices/deviceTypes.ts`:**
   - Add `'tuya'` to `DeviceTypeId` union
   - Add `DEVICE_TYPES.TUYA = 'tuya'`
   - Add entry to `DEVICE_CONFIG` with `color: 'warning'` (amber maps to warning palette)
   - Add `'tuya'` to `DEFAULT_DEVICE_ORDER`

2. **`app/components/DashboardCards.tsx`:**
   - Import `TuyaCard`
   - Add to `CARD_COMPONENTS`, `CARD_SKELETONS`, `DEVICE_META`

3. **`app/components/ui/Skeleton.tsx`:**
   - Add `Skeleton.TuyaCard` function — amber accent bar, header skeleton, 3 metric boxes (total plugs, total W, on/off count)

4. **`lib/services/unifiedDeviceConfigService.ts`:**
   - The service delegates to `DEVICE_CONFIG` for metadata — adding to deviceTypes.ts is sufficient. Verify no hardcoded device list exists.

**Note on NavbarConnectionStatus (UX-02):** The current `NavbarConnectionStatus.tsx` shows a single WS connection status (OPEN/CONNECTING/CLOSED) — it does NOT show per-topic subscription state. UX-02 requires `TuyaCard` to display `LastUpdated`. The `tuya` topic is already in `Topic` union and `TopicDataMap` in `types/websocket.ts` — no NavbarConnectionStatus changes needed for UX-02. The REQUIREMENTS.md note "UX-01: NavbarConnectionStatus includes raspi and tuya WS topic subscriptions" is about the WS transport layer registering these topics, not about per-topic UI indicators.

### Anti-Patterns to Avoid

- **Calling setState/setTimer and then polling with a delay:** Tuya is synchronous (200 response), not async 202. No poll delay needed when `data_confirmed: true`.
- **Not handling `null` plugs in TuyaData:** WS payload has `plugs: TuyaPlug[] | null`. Guard against null before mapping.
- **Direct Recharts import (no next/dynamic):** Always use `next/dynamic({ ssr: false })` for chart components — established project pattern for bundle optimization.
- **Adding 'tuya' to NavbarConnectionStatus subscription list:** The component shows global WS readyState, not per-topic. Adding topic tracking there would be a scope violation.
- **Using `useRetryableCommand` for Tuya:** Overkill for Tuya — no 202/409 pattern, simpler optimistic update suffices.
- **Forgetting `data_freshness === 'UNREACHABLE'` null-safety:** `switch_on`, `power_w`, and all energy fields are null when UNREACHABLE. Always null-check before rendering.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WS subscription lifecycle | Custom WS hook | `useWebSocketContext` + `subscribe`/`unsubscribe` | Singleton manager handles reconnect, auth |
| Polling with visibility awareness | Custom interval | `useAdaptivePolling` with `interval = isWsConnected ? null : pollInterval` | Already handles visibility, cleanup, immediate |
| Recharts lazy loading | Import Recharts directly | `next/dynamic({ ssr: false })` wrapping chart component | Bundle size — Recharts is large |
| Italian locale timestamps | Manual date formatting | `LastUpdated` component | Already uses Italian relative time |
| Error isolation | Try/catch at card level | `DeviceCardErrorBoundary` | Per-card isolation already established |
| Loading skeleton | Inline shimmer divs in card | `Skeleton.TuyaCard` (add to Skeleton.tsx) | Registered in DashboardCards.tsx |
| Device color palette | Arbitrary CSS | `DeviceColor` palette from deviceTypes.ts | Design system enforces consistent colors |

**Key insight:** This phase is purely additive. Every component has a direct equivalent in the raspi/sonos/dirigera devices. Clone and adapt rather than invent.

---

## Common Pitfalls

### Pitfall 1: Granularity Field Branching in Chart
**What goes wrong:** Chart renders with wrong dataKey (e.g. uses `avg_power_w` for raw granularity where it's always null)
**Why it happens:** The API returns different non-null fields depending on `granularity`. Raw = `power_w`; hourly/daily = `avg_power_w` + `energy_kwh_delta`.
**How to avoid:** Branch on `response.granularity` to select dataKeys. Pass `granularity` as prop to `TuyaEnergyChartInner`.
**Warning signs:** Chart renders with empty lines / all zero values

### Pitfall 2: Optimistic Toggle Revert on `data_confirmed: false`
**What goes wrong:** UI shows toggle flipped but server state is old (data_confirmed=false means re-poll failed)
**Why it happens:** Command was sent but re-poll timed out — the old state persists in the response
**How to avoid:** When `data_confirmed: false`, revert optimistic update and schedule a re-fetch after 2s
**Warning signs:** Toggle appears stuck or flips back unexpectedly

### Pitfall 3: Timer Countdown Drift
**What goes wrong:** Client-side `setInterval` countdown drifts from actual plug state
**Why it happens:** JS `setInterval` is not precise; WS pushes may arrive and override countdown_s
**How to avoid:** Reset the countdown when a new WS snapshot arrives (always trust server value over client decrement). Clear interval on unmount. When countdown reaches 0, trigger a data re-fetch.
**Warning signs:** Timer shows negative values or persists after expiry

### Pitfall 4: Missing `'tuya'` in `DEFAULT_DEVICE_ORDER`
**What goes wrong:** TuyaCard never appears on dashboard (getVisibleDashboardCards filters by deviceConfig, which seeds from DEFAULT_DEVICE_ORDER)
**Why it happens:** Adding to DEVICE_CONFIG but forgetting DEFAULT_DEVICE_ORDER means new users don't get the card
**How to avoid:** Add `'tuya'` to `DEFAULT_DEVICE_ORDER` array in deviceTypes.ts
**Warning signs:** TuyaCard absent from dashboard even after full registration

### Pitfall 5: `DeviceTypeId` Type Narrowing Failures
**What goes wrong:** TypeScript errors in unifiedDeviceConfigService or deviceTypes when `'tuya'` not in the union
**Why it happens:** `DeviceTypeId` is a strict union type. Adding to DEVICE_TYPES object is not enough.
**How to avoid:** Update `DeviceTypeId` union type literal in deviceTypes.ts: `'stove' | ... | 'dirigera' | 'tuya'`
**Warning signs:** `tsc` errors on DEVICE_CONFIG key access

---

## Code Examples

### useTuyaData — WS handler inline mapping
```typescript
// Source: useRaspiData.ts pattern (Phase 146)
// Inline mapping in handleMessage — no standalone adapter
const handleMessage = (raw: unknown) => {
  const wsData = raw as TuyaData;
  if (wsData.plugs !== null) {          // guard — null when UNREACHABLE
    dataRef.current = wsData.plugs;
    setPlugs(wsData.plugs);
    setStale(wsData.data_freshness !== 'LIVE');
    setLoading(false);
    setError(null);
    setLastUpdatedAt(Date.now());
  }
};
```

### TuyaCard — skeleton + loading guard
```typescript
// Source: RaspiCard.tsx pattern
if (loading) return <Skeleton.TuyaCard />;
if (error && !plugs) {
  return (
    <SmartHomeCard icon="🔌" title="Tuya" colorTheme="amber">
      <SmartHomeCard.Controls>
        <Banner variant="warning" title="Non raggiungibile" compact={false}>
          <p className="text-sm text-slate-300 [html:not(.dark)_&]:text-slate-600">{error}</p>
        </Banner>
      </SmartHomeCard.Controls>
    </SmartHomeCard>
  );
}
```

### TuyaCard — aggregate summary (D-01/D-02)
```typescript
// Derived from plugs array
const activeCount = plugs.filter(p => p.switch_on === true).length;
const inactiveCount = plugs.filter(p => p.switch_on === false || p.switch_on === null).length;
const totalPowerW = plugs.reduce((sum, p) => sum + (p.power_w ?? 0), 0);
const highestConsumer = plugs.reduce((max, p) =>
  (p.power_w ?? 0) > (max.power_w ?? 0) ? p : max, plugs[0]);
```

### Timer input (D-07/D-08) — inline on plug card
```typescript
// Set timer: POST /api/tuya/plugs/{device_id}/timer with { seconds: minutes * 60 }
// Cancel: POST same with { seconds: 0 }
const [timerMinutes, setTimerMinutes] = useState('');
const handleSetTimer = () => {
  const minutes = parseInt(timerMinutes, 10);
  if (isNaN(minutes) || minutes <= 0) return;
  void onSetTimer(deviceId, minutes * 60);
  setTimerMinutes('');
};
// Active countdown display when countdown_s > 0
const [remaining, setRemaining] = useState(countdown_s ?? 0);
useEffect(() => {
  if (remaining <= 0) return;
  const id = setInterval(() => setRemaining(r => {
    if (r <= 1) { clearInterval(id); onCountdownEnd(); return 0; }
    return r - 1;
  }), 1000);
  return () => clearInterval(id);
}, [remaining > 0]);
```

### next/dynamic for chart (D-06)
```typescript
// Source: SonosHistoryChart.tsx pattern
import dynamic from 'next/dynamic';
const TuyaEnergyChartInner = dynamic(
  () => import('./TuyaEnergyChartInner'),
  { ssr: false, loading: () => <div className="h-[200px] rounded-xl bg-slate-700/30 animate-pulse" /> }
);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling-only device hooks | WS-primary + polling fallback | v17.0 (Phase 139-144) | Live updates without page reload |
| Direct device API calls | HA proxy via haGet/haPost | v13.0-v14.0 | All 7 providers unified |
| Direct Recharts import | next/dynamic lazy load | v9.0 (Phase 72) | Bundle size optimization |
| Firebase RTDB listener for stove | useAdaptivePolling(60s) | v12.0 (Phase 96) | Simplified data layer |

**WS topic `tuya` already registered:** `types/websocket.ts` already includes `TuyaData`, `tuya` in `Topic` union, and `tuya: TuyaData` in `TopicDataMap`. No WS infrastructure changes needed.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified — pure frontend code/component additions, all required packages already installed)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library |
| Config file | jest.config.ts |
| Quick run command | `npm test -- --testPathPattern="tuya" --watchAll=false` |
| Full suite command | `npm test -- --watchAll=false` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TUYA-09 | useTuyaData: WS data updates plugs state | unit | `npm test -- --testPathPattern="useTuyaData" --watchAll=false` | ❌ Wave 0 |
| TUYA-09 | useTuyaData: polling fallback when WS disconnected | unit | same | ❌ Wave 0 |
| TUYA-09 | useTuyaData: sets stale=true on fetch error | unit | same | ❌ Wave 0 |
| TUYA-10 | useTuyaCommands: toggle calls POST state endpoint | unit | `npm test -- --testPathPattern="useTuyaCommands" --watchAll=false` | ❌ Wave 0 |
| TUYA-10 | useTuyaCommands: timer sets seconds = minutes * 60 | unit | same | ❌ Wave 0 |
| TUYA-10 | useTuyaCommands: cancel timer sends seconds = 0 | unit | same | ❌ Wave 0 |
| TUYA-11 | TuyaCard renders skeleton on loading | unit | `npm test -- --testPathPattern="TuyaCard" --watchAll=false` | ❌ Wave 0 |
| TUYA-11 | TuyaCard renders aggregate summary with data | unit | same | ❌ Wave 0 |
| TUYA-11 | TuyaCard renders error banner when no data | unit | same | ❌ Wave 0 |
| UX-02 | TuyaCard renders LastUpdated when lastUpdatedAt set | unit | same | ❌ Wave 0 |
| TUYA-12 | /tuya page renders plug grid | unit (smoke) | `npm test -- --testPathPattern="tuya/page" --watchAll=false` | ❌ Wave 0 |
| TUYA-13 | deviceTypes includes 'tuya' in DeviceTypeId | unit | `npm test -- --testPathPattern="deviceTypes" --watchAll=false` | ❌ (add to existing or new) |
| TUYA-14 | TuyaEnergyChart renders with correct dataKey per granularity | unit | `npm test -- --testPathPattern="TuyaEnergyChart" --watchAll=false` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="tuya" --watchAll=false`
- **Per wave merge:** `npm test -- --watchAll=false`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/components/devices/tuya/hooks/__tests__/useTuyaData.test.ts` — covers TUYA-09
- [ ] `app/components/devices/tuya/hooks/__tests__/useTuyaCommands.test.ts` — covers TUYA-10
- [ ] `app/components/devices/tuya/__tests__/TuyaCard.test.tsx` — covers TUYA-11, UX-02
- [ ] `app/components/devices/tuya/components/__tests__/TuyaEnergyChart.test.tsx` — covers TUYA-14
- [ ] `app/tuya/__tests__/page.test.tsx` — covers TUYA-12 (smoke)

*(TUYA-13 can be verified by extending existing deviceTypes tests if any exist, or adding a new minimal test)*

---

## Open Questions

1. **Power gauge max scale**
   - What we know: power_w can be null (UNREACHABLE) or a positive float
   - What's unclear: What's the typical max wattage of a Tuya plug (Antela)? 3500W (EU standard 16A)?
   - Recommendation: Claude's discretion — use 3500W as max scale for gauge bar (EU plug max). Or derive from highest observed plug reading.

2. **History pagination for 30d chart**
   - What we know: 30d at daily granularity = ~30 items (well within page_size=100 default)
   - What's unclear: Whether the chart fetches all pages or just page 1
   - Recommendation: For 24h/7d/30d the item counts are small (≤2880 raw, ≤168 hourly, ≤30 daily). For chart display, fetch page 1 with page_size=500 — sufficient for all three periods. No pagination needed in the chart hook.

3. **UX-02 vs UX-01 scope**
   - What we know: UX-01 (NavbarConnectionStatus includes raspi and tuya WS topics) is marked complete in REQUIREMENTS.md. UX-02 is TuyaCard LastUpdated.
   - What's unclear: The NavbarConnectionStatus currently shows global WS status only — no per-topic indicators. Whether UX-01 "complete" means the topic is registered in the WS type system (done in Phase 145) or needs UI indicators.
   - Recommendation: UX-01 is satisfied by the type system registration. UX-02 is satisfied by `<LastUpdated tsMs={lastUpdatedAt} />` in TuyaCard. No NavbarConnectionStatus changes needed this phase.

---

## Sources

### Primary (HIGH confidence)
- `types/tuyaProxy.ts` — All Tuya type definitions verified directly
- `types/websocket.ts` — TuyaData, Topic union, TopicDataMap confirmed
- `docs/api/tuya.md` — Full API spec including frontend patterns and WS subscription
- `lib/tuya/tuyaProxy.ts` — Confirmed proxy client functions available
- `app/components/devices/raspi/hooks/useRaspiData.ts` — Direct pattern source
- `app/components/devices/raspi/RaspiCard.tsx` — Direct pattern source
- `app/components/DashboardCards.tsx` — Registry structure confirmed
- `lib/devices/deviceTypes.ts` — DeviceTypeId union, DEVICE_CONFIG, DEFAULT_DEVICE_ORDER confirmed
- `app/components/devices/sonos/components/SonosHistoryChart.tsx` — next/dynamic chart pattern
- `app/components/layout/NavbarConnectionStatus.tsx` — Shows global WS status, no per-topic UI

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — Phase 147 decisions: 200 not 202, no retry infra needed
- `app/components/ui/Skeleton.tsx` — Confirmed existing skeleton patterns for new TuyaCard entry

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies verified present in project
- Architecture: HIGH — direct analogs exist and were read (useRaspiData, RaspiCard, SonosHistoryChart)
- Pitfalls: HIGH — derived from API spec and existing Phase 147 decisions
- Registry wiring: HIGH — deviceTypes.ts and DashboardCards.tsx read and understood

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable project — no external API changes expected)
