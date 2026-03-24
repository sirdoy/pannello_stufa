# Phase 131: DIRIGERA Frontend - Research

**Researched:** 2026-03-24
**Domain:** React/Next.js frontend — sensor dashboard card, dedicated page, device registry integration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Dashboard card (DirigeraCard)**
- D-01: Orchestrator pattern — `useDirigeraData` hook handles polling + state, `DirigeraCard` renders UI. Matches RaspiCard pattern.
- D-02: Card uses `SmartHomeCard` with `icon="🔌"` and `colorTheme="info"` — **CORRECTION: SmartHomeCard has no "info" variant. Available variants: ember, ocean, sage, warning, danger. Use `colorTheme="ocean"` (teal/blue palette, closest to "info" intent).**
- D-03: Card displays: total sensors count, open contacts count, offline sensors count, low battery count — from `/api/dirigera/sensors/summary`
- D-04: Card is clickable — navigates to `/dirigera` page on click
- D-05: Data fetched from 2 endpoints: `/api/dirigera/health` + `/api/dirigera/sensors/summary`
- D-06: Polling via `useAdaptivePolling` at 60s interval
- D-07: Loading state shows `Skeleton.DirigeraCard`
- D-08: Error state shows Banner variant="warning" with "Non raggiungibile"
- D-09: Stale state shows staleness banner when data exists but latest fetch failed
- D-10: Health computed from summary: error if offline_count > 0, warning if low_battery_count > 0, ok otherwise

**`/dirigera` page**
- D-11: Orchestrator pattern — `useDirigeraFullData` hook + page renders sections
- D-12: Page header: "DIRIGERA" heading + back button to `/` (PageLayout)
- D-13: Hub health section at top: firmware version, connected sensors count, hub reachable status
- D-14: Sensor list — each sensor shows: custom_name, room, type, battery_percentage, data_freshness badge, type-specific state (is_open for contact, light_level for motion)
- D-15: Filter control: toggle "Tutti" (all) / "Contatti" (contact) / "Movimento" (motion) — three-button segmented control
- D-16: No command hooks needed — DIRIGERA is read-only
- D-17: data_freshness badge colors: LIVE = green, STALE = amber, UNREACHABLE = red
- D-18: Battery percentage shows warning icon below 20% threshold
- D-19: Sensor list sorted by room name, then custom_name (alphabetical, Italian locale)

**DashboardCards integration**
- D-20: Add `dirigera: DirigeraCard` to `CARD_COMPONENTS` registry
- D-21: Add `dirigera: Skeleton.DirigeraCard` to `CARD_SKELETONS` registry
- D-22: Add `dirigera: { name: 'DIRIGERA', icon: '🔌' }` to `DEVICE_META` registry

**Device registry integration**
- D-23: Add `'dirigera'` to `DeviceTypeId` union in deviceTypes.ts
- D-24: Add `DIRIGERA: 'dirigera'` to `DEVICE_TYPES` constant
- D-25: Add DEVICE_CONFIG entry: id='dirigera', name='DIRIGERA', icon='🔌', color='info', enabled=true, routes={ main: '/dirigera' }, features={ hasSensors: true } — add `hasSensors` to `DeviceFeatures` interface. Note: `DeviceColor` union uses 'info' for DEVICE_CONFIG (not SmartHomeCard), so `color: 'info'` is a valid addition.
- D-26: Add `'dirigera'` to `DEFAULT_DEVICE_ORDER` after 'sonos'

**Navigation menu**
- D-27: Navigation is automatically derived from DEVICE_CONFIG — no Navbar.tsx edits needed
- D-28: No manual Navbar.tsx edits needed
- D-29: Mobile bottom nav priority unchanged

**File organization**
- D-30: New directory: `app/components/devices/dirigera/` with DirigeraCard.tsx + hooks/ + components/ subdirectories
- D-31: Hooks: `useDirigeraData.ts` (dashboard polling), `useDirigeraFullData.ts` (full page data)
- D-32: No command hook needed
- D-33: Page: `app/dirigera/page.tsx`
- D-34: Sub-components in `app/components/devices/dirigera/components/`: DirigeraStats, DirigeraSensorList, DirigeraSensorRow, DirigeraHealthSection

### Claude's Discretion
- Skeleton layout for Skeleton.DirigeraCard (2x2 grid matching 4 stats, or simpler)
- Exact spacing and layout within sensor list rows
- Whether sensor rows use cards or a table-like layout
- Filter segmented control styling (Tailwind)
- Battery warning icon choice (lucide-react)
- How to render light_level for motion sensors (lux value, bar, or descriptive)

### Deferred Ideas (OUT OF SCOPE)
- Sensor event history page (GET /dirigera/history) — future phase when DIRIG-F01 route exists
- Aggregation/retention stats display — future phase when DIRIG-F02 route exists
- Sensor telemetry charts (battery trends, light level over time) — future phase when DIRIG-F03 route exists
- Sensor push notifications (offline/low battery alerts) — backlog
- Room-grouped sensor view — backlog
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DIRIG-08 | DirigeraCard dashboard card con sensor summary (total, open contacts, offline, low battery) | useDirigeraData hook + SmartHomeCard + 2x2 DirigeraStats grid pattern from RaspiStats |
| DIRIG-09 | /dirigera page con lista sensori, stato real-time, filtro per tipo | useDirigeraFullData + segmented filter control + DirigeraSensorList with 3 filter states |
| DIRIG-10 | Device registry integration per sensori DIRIGERA | Add 'dirigera' to DeviceTypeId, DEVICE_TYPES, DEVICE_CONFIG (hasSensors feature), DEFAULT_DEVICE_ORDER |
| DIRIG-11 | Navigation menu entry per DIRIGERA | Automatic from DEVICE_CONFIG once D-23-D-26 done — no Navbar.tsx edits needed |
</phase_requirements>

## Summary

Phase 131 is a pure frontend phase. All API routes are already available from Phase 130 (`/api/dirigera/health`, `/api/dirigera/sensors`, `/api/dirigera/sensors/contact`, `/api/dirigera/sensors/motion`, `/api/dirigera/sensors/summary`). The task is to build the UI layer following the established device card/page orchestrator pattern, with DirigeraCard and `/dirigera` page matching the simplest device pattern in the codebase: RaspiCard.

The implementation has no novel patterns. Every component, hook, and integration point has a direct precedent in the codebase. DirigeraCard mirrors RaspiCard exactly (read-only, no commands, click-to-navigate, SmartHomeCard wrapper, 2x2 stats grid). The `/dirigera` page mirrors `/raspi/page.tsx` with the addition of a type filter (segmented control) and a sensor list. Device registry integration requires five coordinated changes to `deviceTypes.ts` and three registry additions to `DashboardCards.tsx` plus one to `Skeleton.tsx`.

**Primary recommendation:** Follow the RaspiCard pattern verbatim for DirigeraCard. For the `/dirigera` page, use `useState` for the active filter tab and switch between fetching all sensors vs. filtered type depending on the selection — the filter is local state, not a URL param.

**Critical correction:** CONTEXT.md D-02 specifies `colorTheme="info"` for SmartHomeCard, but this variant does not exist. The valid SmartHomeCard colorTheme values are `ember`, `ocean`, `sage`, `warning`, `danger`. Use `colorTheme="ocean"` (teal/blue) to match the info-device aesthetic. The `DeviceConfig.color` field separately accepts `'info'` (it is a different type from SmartHomeCard's colorTheme).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18 (via Next.js 15.5) | UI components | Project standard |
| Next.js App Router | 15.5 | page.tsx routing | Project standard |
| TypeScript (strict) | 5.x | Type safety | Project standard — strict + noUncheckedIndexedAccess |
| Tailwind CSS | 3.x | Styling | Project standard — dark-first Ember Noir design |
| lucide-react | installed | Icons (battery warning) | Used throughout project for icons |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| useAdaptivePolling | project hook | 60s/300s polling with visibility awareness | Both data hooks |
| useVisibility | project hook | Page Visibility API integration | Both data hooks |
| SmartHomeCard | project component | Card wrapper with colorTheme and health | DirigeraCard wrapper |
| PageLayout | project component | Page structure with header slot | /dirigera page |
| Banner | project component | Warning/stale state banners | Error + stale states |
| Skeleton | project component | Loading states with shimmer animation | Skeleton.DirigeraCard |
| HealthIndicator | project component | Hub health dot in card header | DirigeraCard headerActions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local filter state (useState) | URL search param | URL param enables shareable links but adds complexity; local state matches pattern of other pages |
| `ocean` colorTheme | `sage` colorTheme | `ocean` is teal/blue (matching info intent); `sage` is green (used by Raspi/Network/Sonos) |

**Installation:** No new packages needed. All dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
app/
├── dirigera/
│   └── page.tsx                    # /dirigera page (client component, orchestrator)
└── components/
    └── devices/
        └── dirigera/
            ├── DirigeraCard.tsx     # Dashboard card (client component)
            ├── hooks/
            │   ├── useDirigeraData.ts       # Card polling hook (60s/300s)
            │   └── useDirigeraFullData.ts   # Full page data hook (60s/300s)
            ├── components/
            │   ├── DirigeraStats.tsx        # 2x2 stats grid for card
            │   ├── DirigeraHealthSection.tsx # Hub info for page
            │   ├── DirigeraSensorList.tsx   # Sensor list container
            │   └── DirigeraSensorRow.tsx    # Individual sensor row
            └── __tests__/
                └── DirigeraCard.test.tsx    # Card unit test
```

### Pattern 1: useDirigeraData (Dashboard Hook)
**What:** Minimal hook that polls health + summary in parallel, derives health signal, returns `{ data, loading, error, stale, health }`
**When to use:** DirigeraCard only

```typescript
// Source: app/components/devices/raspi/hooks/useRaspiData.ts (adapted)
export type DirigeraHealth = 'ok' | 'warning' | 'error';

export interface DirigeraCardData {
  health: DirigeraHealthResponse;
  summary: SensorSummaryResponse;
}

function computeDirigeraHealth(summary: SensorSummaryResponse): DirigeraHealth {
  if (summary.offline_count > 0) return 'error';
  if (summary.low_battery_count > 0) return 'warning';
  return 'ok';
}

export function useDirigeraData() {
  const [data, setData] = useState<DirigeraCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const dataRef = useRef<DirigeraCardData | null>(null);

  const isVisible = useVisibility();
  const interval = isVisible ? 60000 : 300000;

  const fetchData = async () => {
    try {
      setError(null);
      const [healthRes, summaryRes] = await Promise.all([
        fetch('/api/dirigera/health'),
        fetch('/api/dirigera/sensors/summary'),
      ]);
      if (!healthRes.ok || !summaryRes.ok) {
        throw new Error('DIRIGERA endpoints unavailable');
      }
      const [health, summary] = await Promise.all([
        healthRes.json() as Promise<DirigeraHealthResponse>,
        summaryRes.json() as Promise<SensorSummaryResponse>,
      ]);
      const newData = { health, summary };
      dataRef.current = newData;
      setData(newData);
      setStale(false);
    } catch {
      setStale(true);
      if (!dataRef.current) {
        setError('DIRIGERA non raggiungibile');
      }
    } finally {
      setLoading(false);
    }
  };

  useAdaptivePolling({ callback: fetchData, interval, alwaysActive: false, immediate: true, initialDelay: 600 });

  const health: DirigeraHealth = data ? computeDirigeraHealth(data.summary) : 'ok';
  return { data, loading, error, stale, health };
}
```

### Pattern 2: useDirigeraFullData (Page Hook with Filter)
**What:** Hook that fetches health + sensors list (all / contact / motion based on filter parameter)
**When to use:** `/dirigera` page

```typescript
// Source: adapted from useRaspiFullData.ts
export type SensorFilter = 'all' | 'contact' | 'motion';

type SensorData = DirigeraSensor[] | ContactSensor[] | MotionSensor[];

export interface DirigeraFullData {
  health: DirigeraHealthResponse;
  sensors: SensorData;
  filter: SensorFilter;
}

// Endpoint map
const FILTER_ENDPOINTS: Record<SensorFilter, string> = {
  all: '/api/dirigera/sensors',
  contact: '/api/dirigera/sensors/contact',
  motion: '/api/dirigera/sensors/motion',
};

export function useDirigeraFullData(filter: SensorFilter) {
  // ... same useState/useRef/useAdaptivePolling pattern as useRaspiFullData
  // fetch('/api/dirigera/health') + fetch(FILTER_ENDPOINTS[filter]) in parallel
}
```

### Pattern 3: DirigeraCard (Dashboard Card)
**What:** Follows RaspiCard exactly — loading → error → main card with stale banner
**When to use:** Dashboard integration

```typescript
// Source: app/components/devices/raspi/RaspiCard.tsx (adapted)
export default function DirigeraCard() {
  const router = useRouter();
  const { data, loading, error, stale, health } = useDirigeraData();

  if (loading) return <Skeleton.DirigeraCard />;

  if (error && !data) {
    return (
      <SmartHomeCard icon="🔌" title="DIRIGERA" colorTheme="ocean">
        <SmartHomeCard.Controls>
          <Banner variant="warning" title="Non raggiungibile" compact={false}>
            <p className="text-sm text-slate-300 [html:not(.dark)_&]:text-slate-600">{error}</p>
          </Banner>
        </SmartHomeCard.Controls>
      </SmartHomeCard>
    );
  }

  return (
    <div onClick={() => router.push('/dirigera')} className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]" role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/dirigera'); } }} aria-label="Vai alla pagina DIRIGERA">
      <SmartHomeCard icon="🔌" title="DIRIGERA" colorTheme="ocean" headerActions={<HealthIndicator status={health} size="sm" showIcon={true} label="" />}>
        {stale && (
          <SmartHomeCard.Controls>
            <Banner variant="warning" title="Dati non aggiornati" compact={true}>
              <p className="text-xs text-slate-400">Ultimo aggiornamento non riuscito</p>
            </Banner>
          </SmartHomeCard.Controls>
        )}
        {data && (
          <SmartHomeCard.Controls>
            <DirigeraStats summary={data.summary} />
          </SmartHomeCard.Controls>
        )}
      </SmartHomeCard>
    </div>
  );
}
```

### Pattern 4: DirigeraStats (2x2 Grid)
**What:** Pure presentational component rendering 4 count metrics in 2x2 grid
**When to use:** Inside DirigeraCard

```typescript
// Source: app/components/devices/raspi/components/RaspiStats.tsx (adapted)
export default function DirigeraStats({ summary }: { summary: SensorSummaryResponse }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Cell pattern: label + value */}
      <StatCell label="Sensori totali" value={summary.total_sensors} />
      <StatCell label="Contatti aperti" value={summary.open_count} />
      <StatCell label="Offline" value={summary.offline_count} highlight={summary.offline_count > 0 ? 'error' : undefined} />
      <StatCell label="Batteria bassa" value={summary.low_battery_count} highlight={summary.low_battery_count > 0 ? 'warning' : undefined} />
    </div>
  );
}
```

### Pattern 5: Segmented Filter Control
**What:** Three-button tab control for "Tutti" / "Contatti" / "Movimento"
**When to use:** `/dirigera` page above sensor list

```typescript
// Pattern: local useState in page, buttons styled with conditional bg
const FILTERS: { key: SensorFilter; label: string }[] = [
  { key: 'all', label: 'Tutti' },
  { key: 'contact', label: 'Contatti' },
  { key: 'motion', label: 'Movimento' },
];

// Segmented control: flex row, each button active/inactive styling
<div className="flex rounded-lg border border-slate-700/50 overflow-hidden [html:not(.dark)_&]:border-slate-200">
  {FILTERS.map(f => (
    <button key={f.key} onClick={() => setFilter(f.key)}
      className={cn('flex-1 px-3 py-1.5 text-sm font-medium transition-colors',
        activeFilter === f.key
          ? 'bg-ocean-600/80 text-white'
          : 'bg-transparent text-slate-400 hover:text-slate-200 [html:not(.dark)_&]:text-slate-600'
      )}>
      {f.label}
    </button>
  ))}
</div>
```

### Pattern 6: data_freshness Badge
**What:** Color-coded badge showing LIVE/STALE/UNREACHABLE
**When to use:** Each DirigeraSensorRow

```typescript
const FRESHNESS_COLORS: Record<DirigeraDataFreshness, string> = {
  LIVE: 'bg-success-500/20 text-success-400',
  STALE: 'bg-warning-500/20 text-warning-400',
  UNREACHABLE: 'bg-danger-500/20 text-danger-400',
};
```

### Pattern 7: deviceTypes.ts Additions
**What:** Five coordinated additions to enable automatic nav + registry
**When to use:** DIRIG-10 and DIRIG-11

```typescript
// 1. DeviceTypeId union (add 'dirigera')
export type DeviceTypeId = 'stove' | 'thermostat' | 'camera' | 'lights' | 'sonos' | 'network' | 'raspi' | 'dirigera';

// 2. DeviceColor — 'info' already exists in union (confirmed in deviceTypes.ts line 10)
// DeviceColor = 'primary' | 'info' | 'ocean' | 'warning' | 'success'

// 3. DeviceFeatures — add hasSensors
interface DeviceFeatures {
  // ...existing...
  hasSensors?: boolean;
}

// 4. DEVICE_TYPES constant
export const DEVICE_TYPES = {
  // ...existing...
  DIRIGERA: 'dirigera',
} as const;

// 5. DEVICE_CONFIG entry
[DEVICE_TYPES.DIRIGERA]: {
  id: 'dirigera',
  name: 'DIRIGERA',
  icon: '🔌',
  color: 'info',        // DeviceColor 'info' is valid (used by thermostat too)
  enabled: true,
  routes: { main: '/dirigera' },
  features: { hasSensors: true },
},

// 6. DEFAULT_DEVICE_ORDER — add after 'sonos'
export const DEFAULT_DEVICE_ORDER: string[] = ['stove', 'thermostat', 'weather', 'lights', 'camera', 'network', 'raspi', 'sonos', 'dirigera'];
```

### Pattern 8: Skeleton.DirigeraCard
**What:** Shimmer skeleton matching DirigeraCard layout (header + 2x2 grid)
**When to use:** DirigeraCard loading state + CARD_SKELETONS registry

```typescript
// Source: Skeleton.RaspiCard pattern (it has identical 2x2 grid)
Skeleton.DirigeraCard = function SkeletonDirigeraCard() {
  const SkeletonPulse = ({ className = '' }: { className?: string }) => (
    <div className={`relative overflow-hidden rounded-xl bg-slate-700/50 [html:not(.dark)_&]:bg-slate-200 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-slate-600/30 to-transparent [html:not(.dark)_&]:via-slate-400/40" />
    </div>
  );
  return (
    <Skeleton.Card className="overflow-visible transition-all duration-500">
      {/* Ocean/info accent bar */}
      <div className="h-1 bg-gradient-to-r from-ocean-500/50 via-ocean-400/50 to-ocean-600/50" />
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <SkeletonPulse className="w-8 h-8 rounded-lg" />
          <SkeletonPulse className="w-28 h-6 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SkeletonPulse className="h-20 rounded-lg" />
          <SkeletonPulse className="h-20 rounded-lg" />
          <SkeletonPulse className="h-20 rounded-lg" />
          <SkeletonPulse className="h-20 rounded-lg" />
        </div>
      </div>
    </Skeleton.Card>
  );
};
```

### Anti-Patterns to Avoid
- **Using `colorTheme="info"` on SmartHomeCard:** That variant does not exist. Use `colorTheme="ocean"`.
- **Fetching all three sensor endpoints simultaneously for the filter:** Fetch only the active filter's endpoint to avoid unnecessary load.
- **Putting filter state in the hook:** Filter is page-level local state; pass `filter` as a parameter to `useDirigeraFullData` or re-use the hook as a dependency trigger.
- **Deriving health from health endpoint's `is_reachable` alone:** D-10 specifies health logic from summary counts (offline_count and low_battery_count), not from the health endpoint.
- **Forgetting `data_freshness` is only on ContactSensor and MotionSensor, not DirigeraSensor:** When showing all sensors, `data_freshness` is absent; hide the freshness badge for the "Tutti" filter view (or cast to typed sensor if possible).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Polling with visibility | Custom interval/timeout | `useAdaptivePolling` + `useVisibility` | Already handles focus/blur, cleanup, initialDelay |
| Card error isolation | Manual try/catch in card | `DeviceCardErrorBoundary` in DashboardCards.tsx | Already wraps all cards; handles React render errors |
| Shimmer skeleton | Custom CSS animation | `Skeleton` compound component with static properties | Pattern established for all 8 existing cards |
| Italian locale sort | Manual localeCompare | `sort((a, b) => a.room?.localeCompare(b.room ?? '', 'it') ?? 0)` | Native Intl.Collator / localeCompare with 'it' locale |
| Page header layout | Custom div layout | `PageLayout` + `PageLayout.Header` | Consistent header across all device pages |
| Card navigation | Manual routing | `useRouter().push('/dirigera')` + `role="link"` pattern | Established accessible navigation in RaspiCard |

**Key insight:** This phase is pure assembly. The framework (hooks, components, registries) already exists. The risk is incorrect wiring (wrong registry key, missing static property attachment) rather than any novel logic.

## Common Pitfalls

### Pitfall 1: colorTheme="info" doesn't exist on SmartHomeCard
**What goes wrong:** TypeScript error or silent fallback to ember theme.
**Why it happens:** CONTEXT.md D-02 says "info" but that's the `DeviceColor` vocabulary, not SmartHomeCard's `colorTheme`.
**How to avoid:** Use `colorTheme="ocean"` on SmartHomeCard. Use `color: 'info'` in DEVICE_CONFIG (valid there).
**Warning signs:** TypeScript CVA type error at DirigeraCard.tsx:SmartHomeCard.

### Pitfall 2: data_freshness absent on DirigeraSensor (all-sensors response)
**What goes wrong:** Runtime error or TypeScript error accessing `sensor.data_freshness` on DirigeraSensor type.
**Why it happens:** `DirigeraSensor` (base type, from `/api/dirigera/sensors`) does not have `data_freshness`. Only `ContactSensor` and `MotionSensor` (from their respective filtered endpoints) include it.
**How to avoid:** When rendering sensor rows from `/api/dirigera/sensors` (Tutti filter), either omit the freshness badge or type-narrow with `'data_freshness' in sensor`.
**Warning signs:** `Property 'data_freshness' does not exist on type 'DirigeraSensor'`.

### Pitfall 3: Skeleton static property not attached before component export
**What goes wrong:** `Skeleton.DirigeraCard` is undefined at runtime; DashboardCards.tsx renders null fallback.
**Why it happens:** Static property must be attached to the `Skeleton` default export function in `Skeleton.tsx` — same file.
**How to avoid:** Add the `Skeleton.DirigeraCard = function ...` assignment before the end of Skeleton.tsx.
**Warning signs:** No error, just missing skeleton — card shows blank during loading.

### Pitfall 4: deviceTypes.ts DeviceTypeId union not updated before DEVICE_CONFIG
**What goes wrong:** TypeScript error `Type '"dirigera"' is not assignable to type 'DeviceTypeId'` in DEVICE_CONFIG Record key.
**Why it happens:** The Record type uses DeviceTypeId as key — all 5 changes must be coordinated (union, const, config, feature, order).
**How to avoid:** Make all five changes in a single file edit to `deviceTypes.ts`.
**Warning signs:** tsc errors in deviceTypes.ts.

### Pitfall 5: Filter trigger causes unnecessary re-renders
**What goes wrong:** Changing filter tab fires a new fetch even if data was just loaded.
**Why it happens:** Hook depends on `filter` parameter but doesn't debounce.
**How to avoid:** Accept this behavior (it is intentional — switching filter fetches the filtered endpoint). Each filter maps to a different API endpoint. The data is not pre-filtered client-side.

### Pitfall 6: DashboardCards.tsx import not added
**What goes wrong:** Card registered in CARD_COMPONENTS but import statement missing — runtime error.
**Why it happens:** Easy to add registry entry but forget the ES module import at top of file.
**How to avoid:** Add `import DirigeraCard from './devices/dirigera/DirigeraCard';` alongside the registry addition.

## Code Examples

Verified patterns from existing codebase:

### Locale sort for sensor list
```typescript
// Source: app/raspi/ and rooms patterns — Italian locale sort
const sorted = [...sensors].sort((a, b) => {
  const roomCmp = (a.room ?? '').localeCompare(b.room ?? '', 'it');
  if (roomCmp !== 0) return roomCmp;
  return a.custom_name.localeCompare(b.custom_name, 'it');
});
```

### Battery warning icon (lucide-react)
```typescript
import { BatteryLow } from 'lucide-react';
// Battery percentage <= 20
{battery_percentage !== null && battery_percentage <= 20 && (
  <BatteryLow className="h-4 w-4 text-warning-400" aria-label="Batteria bassa" />
)}
```

### Type-safe sensor narrowing for data_freshness
```typescript
// Only ContactSensor and MotionSensor have data_freshness
type TypedSensor = ContactSensor | MotionSensor;
const hasFreshness = (s: DirigeraSensor): s is TypedSensor => 'data_freshness' in s;
```

### DeviceTypeId addition pattern
```typescript
// Source: lib/devices/deviceTypes.ts — add to union (line 7 currently)
export type DeviceTypeId = 'stove' | 'thermostat' | 'camera' | 'lights' | 'sonos' | 'network' | 'raspi' | 'dirigera';
```

### DashboardCards three-registry addition
```typescript
// Source: app/components/DashboardCards.tsx — add to all three registries
const CARD_COMPONENTS: Record<string, React.ComponentType> = {
  // ...existing...
  dirigera: DirigeraCard,
};
const CARD_SKELETONS: Record<string, React.ComponentType> = {
  // ...existing...
  dirigera: Skeleton.DirigeraCard,
};
const DEVICE_META: Record<string, { name: string; icon: string }> = {
  // ...existing...
  dirigera: { name: 'DIRIGERA', icon: '🔌' },
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct device API calls | HA proxy client (haGet) | v13.0-v14.0 | All device reads go through shared haClient |
| JWT auth | X-API-Key via haClient | v11.0 | Simpler, consistent across all providers |
| Firebase RTDB listener | useAdaptivePolling | v12.0 | Unified polling pattern across all device hooks |

**No new patterns introduced in this phase.** DIRIGERA is the 6th device provider; all patterns established.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + @testing-library/react |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern=DirigeraCard` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIRIG-08 | DirigeraCard renders 4 stat values | unit | `npm test -- --testPathPattern=DirigeraCard` | No — Wave 0 |
| DIRIG-08 | DirigeraCard loading shows skeleton | unit | `npm test -- --testPathPattern=DirigeraCard` | No — Wave 0 |
| DIRIG-08 | DirigeraCard error state shows banner | unit | `npm test -- --testPathPattern=DirigeraCard` | No — Wave 0 |
| DIRIG-08 | DirigeraCard stale shows banner + data | unit | `npm test -- --testPathPattern=DirigeraCard` | No — Wave 0 |
| DIRIG-08 | DirigeraCard click navigates to /dirigera | unit | `npm test -- --testPathPattern=DirigeraCard` | No — Wave 0 |
| DIRIG-09 | Filter state switches sensor endpoint | unit (hook) | `npm test -- --testPathPattern=useDirigeraFullData` | No — Wave 0 |
| DIRIG-10 | deviceTypes.ts exports 'dirigera' in DeviceTypeId | unit | via tsc | No — Wave 0 |
| DIRIG-11 | Navigation auto-derived from DEVICE_CONFIG | integration (E2E) | Playwright smoke test | Partially (E2E-01 tests dashboard) |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern=DirigeraCard --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/components/devices/dirigera/__tests__/DirigeraCard.test.tsx` — covers DIRIG-08
- [ ] `app/components/devices/dirigera/__tests__/useDirigeraData.test.ts` (optional — if hook logic warrants isolation)

*(DashboardCards.tsx, Skeleton.tsx, deviceTypes.ts changes are verified implicitly by the DirigeraCard render test and the TypeScript compiler)*

## Sources

### Primary (HIGH confidence)
- Codebase: `app/components/devices/raspi/RaspiCard.tsx` — direct implementation model
- Codebase: `app/components/devices/raspi/hooks/useRaspiData.ts` — hook pattern
- Codebase: `app/components/devices/raspi/hooks/useRaspiFullData.ts` — page hook pattern
- Codebase: `app/components/ui/SmartHomeCard.tsx` — confirmed colorTheme variants (ember, ocean, sage, warning, danger)
- Codebase: `lib/devices/deviceTypes.ts` — confirmed DeviceColor includes 'info', DeviceTypeId union, DEVICE_CONFIG pattern
- Codebase: `app/components/DashboardCards.tsx` — confirmed 3 registry structure
- Codebase: `app/components/ui/Skeleton.tsx` — confirmed static property pattern for RaspiCard/SonosCard
- Codebase: `types/dirigeraProxy.ts` — all types confirmed present
- Codebase: `docs/api/dirigera.md` — response shapes verified

### Secondary (MEDIUM confidence)
- Codebase: `app/sonos/page.tsx` — page orchestrator pattern (no commands needed for /dirigera)
- Codebase: `app/components/devices/raspi/__tests__/RaspiCard.test.tsx` — test boilerplate to follow exactly

### Tertiary (LOW confidence)
None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against installed packages and codebase
- Architecture: HIGH — direct precedent in RaspiCard/RaspiPage, zero novel patterns
- Pitfalls: HIGH — colorTheme bug confirmed by reading SmartHomeCard.tsx; data_freshness type gap confirmed by reading dirigeraProxy.ts
- Test patterns: HIGH — RaspiCard.test.tsx and SonosCard.test.tsx are direct templates

**Research date:** 2026-03-24
**Valid until:** 2026-04-23 (stable project conventions)
