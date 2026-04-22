# Phase 169: DIRIGERA Frontend Cutover — Research

**Researched:** 2026-04-22
**Domain:** Next.js API routes, React hooks, DIRIGERA proxy layer, legacy route migration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Create 5 v1 wrapper routes: `app/api/v1/dirigera/{health,sensors,sensors/summary,sensors/contact,sensors/motion}/route.ts`, each delegating to the corresponding proxy function (`getHealth`, `getSensors`, `getSensorSummary`, `getContactSensors`, `getMotionSensors`). Pattern: `withAuthAndErrorHandler` + proxy call + `success()` + `export const dynamic = 'force-dynamic'`.
- **D-02:** Copy response shape of each legacy route EXACTLY. The v1 wrapper for `/api/dirigera/sensors` must emit `success({ sensors, count, is_stale })` (not just `success(data)`) — same as the legacy route.
- **D-03:** Add co-located route tests for each of the 5 new v1 wrappers. Mock `@/lib/dirigera/dirigeraProxy`, assert auth wrapper applied, response body matches.
- **D-04:** `useDirigeraData.ts` — swap both `/api/dirigera/health` references (lines 51, 81) and `/api/dirigera/sensors/summary` (line 52) to the `/api/v1/dirigera/` prefix. No logic change.
- **D-05:** `useDirigeraFullData.ts` — swap `FILTER_ENDPOINTS` map (lines 16–20) and the health fetch (line 55) to the v1 prefix. No signature change.
- **D-06:** `useDirigeraData.test.ts` — update 3 assertions (lines 121, 122, 309) to v1 paths.
- **D-07:** Add three new hooks: `useDirigeraHistory(params?: SensorHistoryParams)`, `useDirigeraStats()`, `useDirigeraTelemetry(params?: SensorTelemetryParams)`. Independent hooks (not folded into `useDirigeraFullData`). Polling cadence: 300 s visible / 600 s hidden. HTTP-only (no WebSocket subscription).
- **D-08:** Render three new collapsible sections on `/dirigera` page appended after `DirigeraSensorList`: `DirigeraStatsPanel`, `DirigeraHistoryPanel`, `DirigeraTelemetryPanel`. Stats shows 4 tiles; History/Telemetry show paginated tables with "Load more".
- **D-09:** No filter controls in this phase. Hooks accept param objects so future phase can add them.
- **D-10:** Panel states: Loading (spinner), Stale re-fetch ("Aggiornamento…" badge), Ready, Stale/Error (stale badge + error copy), Empty. Italian copy per UI-SPEC.
- **D-11:** Delete entire `app/api/dirigera/` tree after hooks are on v1 and smoke tests pass. Pre/post grep sweeps must return zero `/api/dirigera/` matches (excluding `lib/version.ts` and `.planning/` archives).
- **D-12:** Two v1-intact safety gates assert `find app/api/v1/dirigera -name route.ts | wc -l == 8` pre- and post-deletion.
- **D-13:** Jest full suite must stay green after each wave.
- **D-14:** Playwright smoke — reuse existing `/dirigera` test from page-loads.spec.ts. Add assertion that stats/history/telemetry panels render without console errors. No `@smoke` tag infrastructure (fallback to direct spec run).
- **D-15:** No doc changes needed. `docs/api/dirigera.md` already documents all 8 v1 endpoints.
- **D-16:** Three-plan wave structure: Wave 1 (5 v1 routes + hook URL swap), Wave 2 (3 new hooks + 3 panels + page wiring), Wave 3 (legacy delete + grep sweep).

### Claude's Discretion

- Exact component names for the three new panels (`DirigeraStatsPanel`, `DirigeraHistoryPanel`, `DirigeraTelemetryPanel` are proposed; equivalent names acceptable).
- Whether to memoize the "Load more" offset state inside each hook vs lift to the panel component.
- Exact card layout inside `DirigeraStatsPanel` (4-up grid vs 2×2).
- Whether to reuse `DirigeraStats.tsx` (existing, fleet summary shaped) or build a dedicated `DirigeraStatsPanel`. **Recommendation: build new component — `DirigeraStats.tsx` renders `SensorSummaryResponse` (fleet tiles); the new panel renders `DirigeraStatsResponse` (aggregation/retention metadata). Different shapes, same file name would be misleading.**
- Order of sub-steps within each wave.

### Deferred Ideas (OUT OF SCOPE)

- Sensor-id picker and date-range/event-type filter UI on history/telemetry panels.
- Virtualization (react-window) for large history/telemetry tables.
- Debug DirigeraTab (no debug panel exists; future phase).
- Consolidation of `DirigeraStats.tsx` and `DirigeraStatsPanel.tsx`.
- Playwright `@smoke` tag infrastructure.
- Infinite scroll for history/telemetry.
- WebSocket push for sensor history events.
- `lib/routes.ts` entry for DIRIGERA routes.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DIR-01 | GET /api/v1/dirigera/history returns paginated sensor event history | v1 route already exists (Phase 163); hooks must consume it; `SensorHistoryResponse` type and `useDirigeraHistory` hook needed |
| DIR-02 | GET /api/v1/dirigera/stats returns aggregation and retention statistics | v1 route already exists (Phase 163); hooks must consume it; `DirigeraStatsResponse` type and `useDirigeraStats` hook needed |
| DIR-03 | GET /api/v1/dirigera/telemetry returns paginated sensor telemetry | v1 route already exists (Phase 163); hooks must consume it; `SensorTelemetryResponse` type and `useDirigeraTelemetry` hook needed |

</phase_requirements>

---

## Summary

Phase 169 closes a v19.0 audit orphan: DIRIGERA is the only provider where legacy `/api/dirigera/*` routes still serve active frontend consumers. The work has two linked tracks.

Track 1 (Wave 1) is mechanical: create 5 thin v1 wrapper routes that mirror the existing legacy handlers, copy their exact response envelopes, and redirect the two consumer hooks (`useDirigeraData`, `useDirigeraFullData`) and their test to the new paths. This is verified code that already exists in the proxy layer — no new proxy functions, no response-shape changes.

Track 2 (Wave 2) is additive: three new independent hooks and three new UI panels expose the history, stats, and telemetry endpoints that Phase 163 shipped at the v1 level but left with no frontend consumer. The stats panel surfaces aggregation/retention metadata from `DirigeraStatsResponse` (structurally different from the existing `DirigeraStats.tsx` fleet-summary component). The history and telemetry panels use paginated tables with a "Load more" append pattern. All copy is Italian; all styling follows Ember Noir tokens from the existing DIRIGERA page.

Track 3 (Wave 3) is destructive: delete `app/api/dirigera/` (5 route files, no co-located tests in the legacy tree), run a repo-wide grep sweep to confirm zero residual refs, and assert the v1 tree has exactly 8 routes.

**Primary recommendation:** Execute three sequential waves matching D-16 exactly. Each wave ends with full Jest green + a Playwright page-loads run targeting `/dirigera`. The v1-intact gate (`wc -l == 8`) runs pre- and post-deletion in Wave 3.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Sensor state (health, sensors, summary) | API / Backend (HA proxy) | Frontend hooks (HTTP polling + WS fallback) | Data originates from IKEA DIRIGERA hub, proxied through HA |
| History/stats/telemetry reads | API / Backend (HA proxy) | Frontend hooks (HTTP polling only) | SQLite-backed on HA side; HTTP-only (no WS topic) |
| v1 route wrappers | API / Backend (Next.js API routes) | — | Thin adapter between frontend and HA proxy; auth enforced here |
| Hook URL management | Frontend Client (React hooks) | — | `useAdaptivePolling` + `useVisibility` cadence owned by hooks |
| UI panel rendering | Browser / Client | — | Client components with `'use client'` per existing DIRIGERA page pattern |
| Legacy route deletion | API / Backend (cleanup) | — | Files removed from Next.js API layer; no client impact after hook swap |

---

## Standard Stack

### Core (already in project — no installation)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 15.5 | App Router, API routes, `force-dynamic` | [VERIFIED: project package.json] |
| `react` | 19 | Hooks, client components | [VERIFIED: project package.json] |
| `@/lib/core` (`withAuthAndErrorHandler`, `success`) | project-local | Auth guard + response envelope | [VERIFIED: used by all 3 existing v1 dirigera routes] |
| `@/lib/haClient` (`haGet`) | project-local | Shared HA proxy transport | [VERIFIED: dirigeraProxy.ts imports haGet] |
| `@/lib/dirigera/dirigeraProxy` | project-local | All 8 proxy functions present | [VERIFIED: file read — getHealth, getSensors, getSensorSummary, getContactSensors, getMotionSensors, getHistory, getStats, getTelemetry] |
| `@/lib/hooks/useAdaptivePolling` | project-local | Interval-based polling with visibility + WS suppression | [VERIFIED: used by useDirigeraData, useDirigeraFullData] |
| `@/lib/hooks/useVisibility` | project-local | Page visibility for adaptive interval | [VERIFIED: used by both existing hooks] |
| `lucide-react` | already installed | Icons for panels | [VERIFIED: used by DirigeraSensorRow] |

### Supporting (design system primitives, project-native)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Heading`, `Text`, `Button`, `Badge`, `Spinner`, `Banner` | project-local at `/debug/design-system` | All new panel UI | For all panel headings, load-more button, stale badge |
| `cn` from `@/lib/utils/cn` | project-local | Conditional className | For conditional Tailwind classes in panels |
| `Intl.DateTimeFormat` | Web API | Timestamp formatting | `Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'medium' })` per UI-SPEC |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Three independent hooks | Folding into `useDirigeraFullData` | Independent hooks avoid re-fetch storms; lifecycle independence matches Sonos pattern |
| "Load more" button | Infinite scroll | "Load more" is keyboard-accessible, avoids virtualization complexity (D-08 locked choice) |
| New `DirigeraStatsPanel` | Reuse/extend `DirigeraStats.tsx` | Different data shapes (`SensorSummaryResponse` vs `DirigeraStatsResponse`) — separate components avoid confusion |

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (/dirigera page)
  │
  ├── useDirigeraFullData(filter)
  │     └── fetch('/api/v1/dirigera/{health,sensors,sensors/contact,sensors/motion}')
  │
  ├── useDirigeraData()  [DirigeraCard on dashboard]
  │     ├── WebSocket 'dirigera' topic (primary when connected)
  │     └── fetch('/api/v1/dirigera/{health,sensors/summary}')  (fallback polling)
  │
  ├── useDirigeraStats()            [new — Wave 2]
  │     └── fetch('/api/v1/dirigera/stats')  polls 300s/600s
  │
  ├── useDirigeraHistory(params)    [new — Wave 2]
  │     └── fetch('/api/v1/dirigera/history?limit=50&offset=N')  polls 300s/600s
  │
  └── useDirigeraTelemetry(params)  [new — Wave 2]
        └── fetch('/api/v1/dirigera/telemetry?limit=50&offset=N')  polls 300s/600s
              │
Next.js API Layer (/api/v1/dirigera/*)
  ├── health/route.ts       → withAuthAndErrorHandler → getHealth() → success(data)
  ├── sensors/route.ts      → withAuthAndErrorHandler → getSensors() → success({sensors,count,is_stale})
  ├── sensors/summary/route.ts → ... → getSensorSummary() → success(data)
  ├── sensors/contact/route.ts → ... → getContactSensors() → success({sensors,count,is_stale})
  ├── sensors/motion/route.ts  → ... → getMotionSensors() → success({sensors,count,is_stale})
  ├── history/route.ts      → ... → getHistory(params) → success(data)  [Phase 163]
  ├── stats/route.ts        → ... → getStats() → success(data)          [Phase 163]
  └── telemetry/route.ts    → ... → getTelemetry(params) → success(data) [Phase 163]
              │
HA Proxy (external)
  └── dirigeraProxy.ts → haGet('/api/v1/dirigera/*') → DIRIGERA hub
```

### Recommended Project Structure (additions only)

```
app/api/v1/dirigera/
├── health/
│   ├── route.ts            [new Wave 1]
│   └── __tests__/route.test.ts  [new Wave 1]
├── sensors/
│   ├── route.ts            [new Wave 1]
│   ├── __tests__/route.test.ts  [new Wave 1]
│   ├── summary/
│   │   ├── route.ts        [new Wave 1]
│   │   └── __tests__/route.test.ts  [new Wave 1]
│   ├── contact/
│   │   ├── route.ts        [new Wave 1]
│   │   └── __tests__/route.test.ts  [new Wave 1]
│   └── motion/
│       ├── route.ts        [new Wave 1]
│       └── __tests__/route.test.ts  [new Wave 1]
├── history/route.ts + __tests__/  [Phase 163 — already exists]
├── stats/route.ts + __tests__/    [Phase 163 — already exists]
└── telemetry/route.ts + __tests__/ [Phase 163 — already exists]

app/components/devices/dirigera/
├── hooks/
│   ├── useDirigeraData.ts       [modified Wave 1]
│   ├── useDirigeraFullData.ts   [modified Wave 1]
│   ├── useDirigeraHistory.ts    [new Wave 2]
│   ├── useDirigeraStats.ts      [new Wave 2]
│   ├── useDirigeraTelemetry.ts  [new Wave 2]
│   └── __tests__/
│       ├── useDirigeraData.test.ts      [modified Wave 1]
│       ├── useDirigeraHistory.test.ts   [new Wave 2]
│       ├── useDirigeraStats.test.ts     [new Wave 2]
│       └── useDirigeraTelemetry.test.ts [new Wave 2]
└── components/
    ├── DirigeraStatsPanel.tsx   [new Wave 2]
    ├── DirigeraHistoryPanel.tsx [new Wave 2]
    └── DirigeraTelemetryPanel.tsx [new Wave 2]

app/dirigera/page.tsx  [modified Wave 2 — add 3 sections]

# Wave 3 deletion target:
app/api/dirigera/  [entire tree — 5 route files]
```

---

## Pattern 1: V1 Wrapper Route — Simple (no params)

**What:** Wrap a legacy route that takes no query params. Delegate to proxy, return proxy result as-is or with explicit field spreading if the legacy route did explicit field spreading.

**When to use:** `health`, `sensors/summary` (no query params, full data passthrough)

**Example — `app/api/v1/dirigera/health/route.ts`:**
```typescript
// Source: mirrors app/api/dirigera/health/route.ts exactly, path prefix only changes
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHealth } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Dirigera/Health');
```

**Example — `app/api/v1/dirigera/sensors/summary/route.ts`:**
```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getSensorSummary } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getSensorSummary();
  return success(data as unknown as Record<string, unknown>);
}, 'Dirigera/SensorsSummary');
```

---

## Pattern 2: V1 Wrapper Route — Explicit Field Spreading

**What:** Three legacy sensor routes (`sensors`, `sensors/contact`, `sensors/motion`) do NOT pass the raw proxy result through. They explicitly spread `{ sensors, count, is_stale }`. The v1 wrapper MUST replicate this or the hook receives unexpected shapes.

**When to use:** `sensors`, `sensors/contact`, `sensors/motion`

**Example — `app/api/v1/dirigera/sensors/route.ts`:**
```typescript
// Source: mirrors app/api/dirigera/sensors/route.ts (explicit field spread)
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getSensors } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getSensors();
  return success({ sensors: data.sensors, count: data.count, is_stale: data.is_stale });
}, 'Dirigera/Sensors');
```

**Critical:** `sensors/contact` and `sensors/motion` use the same `{ sensors, count, is_stale }` spreading pattern — confirmed in the legacy routes. The v1 wrappers must match.

---

## Pattern 3: Hook URL Swap

**What:** Mechanical string replacement in two hook files. No logic change. WebSocket subscription in `useDirigeraData` is orthogonal to HTTP fetch URLs and is untouched.

**useDirigeraData.ts changes (3 sites):**
- Line 51: `fetch('/api/dirigera/health')` → `fetch('/api/v1/dirigera/health')`
- Line 52: `fetch('/api/dirigera/sensors/summary')` → `fetch('/api/v1/dirigera/sensors/summary')`
- Line 81: `fetch('/api/dirigera/health')` → `fetch('/api/v1/dirigera/health')`

**useDirigeraFullData.ts changes (4 sites):**
- Lines 16–19 (`FILTER_ENDPOINTS` map):
  ```typescript
  // Before:
  const FILTER_ENDPOINTS: Record<SensorFilter, string> = {
    all: '/api/dirigera/sensors',
    contact: '/api/dirigera/sensors/contact',
    motion: '/api/dirigera/sensors/motion',
  };
  // After:
  const FILTER_ENDPOINTS: Record<SensorFilter, string> = {
    all: '/api/v1/dirigera/sensors',
    contact: '/api/v1/dirigera/sensors/contact',
    motion: '/api/v1/dirigera/sensors/motion',
  };
  ```
- Line 55: `fetch('/api/dirigera/health')` → `fetch('/api/v1/dirigera/health')`

**useDirigeraData.test.ts changes (3 assertion sites):**
- Line 121: `'/api/dirigera/health'` → `'/api/v1/dirigera/health'`
- Line 122: `'/api/dirigera/sensors/summary'` → `'/api/v1/dirigera/sensors/summary'`
- Line 309: `'/api/dirigera/health'` → `'/api/v1/dirigera/health'`

---

## Pattern 4: New Hooks (useDirigeraHistory / useDirigeraStats / useDirigeraTelemetry)

**What:** Independent polling hooks following the existing DIRIGERA hook pattern. Use `useAdaptivePolling` + `useVisibility`. No WebSocket. Support `loadMore()` pagination for history and telemetry.

**Polling cadence:**
- Visible: 300 000 ms (300 s)
- Hidden: 600 000 ms (600 s)
- No `alwaysActive: true` (non-safety-critical)

**State shape for history and telemetry hooks:**
```typescript
// Source: [VERIFIED by project patterns + UI-SPEC §Interaction Contract]
interface UseHistoryReturn {
  items: SensorEvent[];       // accumulated array (append on loadMore)
  total: number;              // from API response
  loading: boolean;           // initial fetch
  isLoadingMore: boolean;     // loadMore in-flight
  error: string | null;
  stale: boolean;
  loadMore: () => void;
}
```

**State shape for stats hook:**
```typescript
interface UseStatsReturn {
  data: DirigeraStatsResponse | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
}
```

**Load more mechanics (for history and telemetry):**
- Internal `offsetRef` tracks current offset (not state, to avoid re-render on increment).
- `loadMore()` increments offset by 50 and fires a fetch; appends results to `items`.
- `isLoadingMore` state signals the in-progress append fetch.
- Button hides when `items.length >= total`.
- Polling resets offset to 0 and replaces items on each auto-refresh cycle (monotonic data; latest page is always freshest).

**URL construction pattern (mirrors `getHistory` in dirigeraProxy.ts):**
```typescript
// Source: [VERIFIED: dirigeraProxy.ts buildQueryString pattern]
const params = new URLSearchParams();
params.set('limit', '50');
if (offset > 0) params.set('offset', String(offset));
const url = `/api/v1/dirigera/history?${params.toString()}`;
```

---

## Pattern 5: New Panel Components

**What:** Three presentational components following the `DirigeraHealthSection` and `DirigeraSensorList` structural analogs. State machine handled by each component based on hook return values.

**`DirigeraStatsPanel` state map:**

| Hook state | Rendered output |
|------------|----------------|
| `loading && !data` | Full-panel centered spinner |
| `loading && data` | Data visible + "Aggiornamento…" badge in heading area |
| `!loading && data && !stale` | 4 stat tiles (2×2 mobile, 4×1 sm+) |
| `stale && data` | Data visible + "Dati non aggiornati" stale badge |
| `error && !data` | "Impossibile caricare le statistiche" error copy centered |
| `!data && !loading && !error` | "Statistiche non disponibili" empty copy centered |

**`DirigeraStatsPanel` tile content (from `DirigeraStatsResponse`):**

| Tile label | Value source |
|------------|-------------|
| "Eventi totali" | `stats.aggregation.total_rows_aggregated` |
| "Giorni di retention" | Derived: `stats.retention.total_rows_deleted > 0` → retention is active; show `retention.total_runs` or a computed proxy. **Note:** the API does not expose a `retention_days` field directly — this tile should show `stats.retention.total_runs` (total retention cleanup runs) or be labelled "Esecuzioni retention". Planner should pick a safe representation. |
| "Sensore più attivo" | Not in `DirigeraStatsResponse` — this field is **not available** in the stats endpoint. The UI-SPEC lists it as a stat tile, but the API shape does not carry `most_active_sensor`. Planner must either: (a) omit this tile in Wave 2 (safe), or (b) compute it from the history endpoint (extra HTTP call). Recommended: omit in this phase (scope D-09 applies). |
| "Eventi ultime 24h" | Not in `DirigeraStatsResponse` — same issue. The API only has `rows_aggregated_last_run` and `total_rows_aggregated` — no 24h window count. Recommended: show `aggregation.rows_aggregated_last_run` (last aggregation run rows) as a proxy, label it "Ultima aggregazione". |

**IMPORTANT — Stats tile discrepancy:** The UI-SPEC tile labels ("Sensore più attivo", "Eventi ultime 24h") are aspirational and do not map to fields in `DirigeraStatsResponse`. The planner must adapt the tile set to what the API actually returns. The canonical shape is:
```typescript
// Source: [VERIFIED: docs/api/dirigera.md + types/dirigeraProxy.ts]
interface DirigeraStatsResponse {
  aggregation: {
    last_run_at: number | null;       // Unix timestamp
    last_run_status: string | null;
    rows_aggregated_last_run: number;
    total_runs: number;
    total_rows_aggregated: number;
  };
  retention: {
    last_run_at: number | null;
    last_run_status: string | null;
    rows_deleted_last_run: number;
    total_runs: number;
    total_rows_deleted: number;
  };
}
```

Pragmatic 4-tile set using available fields: "Righe aggregate totali" (`total_rows_aggregated`), "Ultima aggregazione" (`rows_aggregated_last_run`), "Righe eliminate" (`total_rows_deleted`), "Stato aggregazione" (`last_run_status`).

**`DirigeraHistoryPanel` table columns:**

| Column | Source | Notes |
|--------|--------|-------|
| Sensore | `event.sensor_name ?? event.sensor_id` | Show name, fallback to ID |
| Tipo evento | `event.event_type` | `open`, `close`, `motion_detected`, `motion_cleared` |
| Data/ora | `Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(event.recorded_at * 1000))` | Unix seconds × 1000 for JS Date |

**`DirigeraTelemetryPanel` table columns:**

| Column | Source | Notes |
|--------|--------|-------|
| Sensore | `reading.sensor_id` | No `sensor_name` in telemetry shape |
| Batteria | `reading.battery_percentage !== null ? reading.battery_percentage + '%' : '—'` | |
| Lux | `reading.light_level !== null ? reading.light_level + ' lux' : '—'` | |
| Data/ora | `Intl.DateTimeFormat('it-IT', ...)` applied to `reading.timestamp * 1000` | |

---

## Pattern 6: Legacy Deletion and Grep Sweep

**What:** Atomic tree deletion after all consumers are on v1.

**Pre-deletion safety gate:**
```bash
# Assert exactly 8 v1 routes (3 from Phase 163 + 5 from Wave 1)
find app/api/v1/dirigera -name route.ts | wc -l
# Expected: 8
```

**Deletion:**
```bash
rm -rf app/api/dirigera/
```

**Post-deletion grep sweep:**
```bash
grep -rn "/api/dirigera/" app/ lib/ types/ --include="*.ts" --include="*.tsx" \
  | grep -v "/api/v1/dirigera/" \
  | grep -v "lib/version.ts"
# Expected: zero matches
```

**Post-deletion safety gate (repeat):**
```bash
find app/api/v1/dirigera -name route.ts | wc -l
# Expected still: 8
```

**Note:** The grep sweep should also exclude `.planning/` directory (archival docs reference legacy paths by design).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL query string serialization for history/telemetry params | Custom serializer | `URLSearchParams` (Web API) | Already used in `dirigeraProxy.ts` `buildQueryString`; handle null/undefined skipping with value checks |
| Authentication in v1 routes | Custom auth guard | `withAuthAndErrorHandler` from `@/lib/core` | Ensures consistent 401 handling; used by all existing v1 routes |
| Response envelope | Custom wrapper | `success()` from `@/lib/core` | Consistent `{ success: true, ...data }` shape expected by hooks |
| Adaptive polling | Manual setInterval | `useAdaptivePolling` from `@/lib/hooks` | Handles visibility, WS-suppression, `immediate`, `initialDelay` |
| Timestamp formatting | Manual format string | `Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'medium' })` | Italian locale, matches existing DIRIGERA page convention |
| Pagination state | Redux or context | Hook-local `useRef` for offset + `useState` for items/isLoadingMore | Scope is per-panel; no cross-panel sharing needed |

---

## Common Pitfalls

### Pitfall 1: Mismatching Response Envelope on `sensors`, `sensors/contact`, `sensors/motion`

**What goes wrong:** Writing the v1 wrapper as `success(data as unknown as Record<string, unknown>)` (full passthrough) instead of explicitly spreading `{ sensors, count, is_stale }`.

**Why it happens:** The proxy functions for `getSensors`, `getContactSensors`, `getMotionSensors` return typed objects that include additional internal fields. The legacy routes deliberately project only `{ sensors, count, is_stale }`.

**How to avoid:** Inspect each legacy route body. The pattern is not uniform: `health` and `summary` do full passthrough (`success(data as unknown as ...)`); `sensors`, `sensors/contact`, `sensors/motion` do explicit field spreading. Match each exactly.

**Warning signs:** Hook receives unexpected field names; TypeScript type assertions fail at parse site.

---

### Pitfall 2: Touching the WebSocket Subscription Path in `useDirigeraData`

**What goes wrong:** Accidentally renaming the `'dirigera'` topic string in the `subscribe`/`unsubscribe` calls during the URL swap.

**Why it happens:** The file contains both WebSocket subscription code and HTTP fetch URLs. An over-eager search-and-replace on `dirigera` could corrupt the WS topic key.

**How to avoid:** Only replace the three literal strings that begin with `/api/dirigera/` (lines 51, 52, 81). The `subscribe('dirigera', ...)` calls are orthogonal and must remain unchanged. Verify with `grep -n "subscribe" useDirigeraData.ts` after edit.

**Warning signs:** WebSocket data stops flowing to `DirigeraCard`; `handleMessage` is never called.

---

### Pitfall 3: Stats Tile Content Does Not Match API Shape

**What goes wrong:** Implementing the UI-SPEC tile labels verbatim ("Sensore più attivo", "Eventi ultime 24h") only to discover `DirigeraStatsResponse` has neither field.

**Why it happens:** UI-SPEC was written aspirationally; the API spec and type definitions are the ground truth.

**How to avoid:** Reference `DirigeraStatsResponse` in `types/dirigeraProxy.ts` (verified) and `docs/api/dirigera.md` §Statistics (verified) before implementing `DirigeraStatsPanel`. Use available fields: `aggregation.total_rows_aggregated`, `aggregation.rows_aggregated_last_run`, `retention.total_rows_deleted`, `aggregation.last_run_status`.

**Warning signs:** TypeScript compiler errors when accessing `stats.most_active_sensor` or `stats.events_last_24h`.

---

### Pitfall 4: Wave 3 Deletes Legacy Before Wave 1 Hook Swap is Committed

**What goes wrong:** Deleting `app/api/dirigera/` before the hook URL swap lands, causing 404s in production (or during the test run).

**Why it happens:** Wave ordering confusion in parallel execution mode.

**How to avoid:** The three-wave structure is sequential by design (D-16). Wave 3 must only run after Wave 1 Jest and Playwright are green. The pre-deletion v1-intact gate (`wc -l == 8`) is a programmatic check.

**Warning signs:** Jest reports 404 errors in `useDirigeraData.test.ts` during Wave 3; the safety gate count is 3 (Phase 163 only) instead of 8.

---

### Pitfall 5: DirigeraStats.tsx Naming Collision

**What goes wrong:** Naming the new stats panel `DirigeraStats.tsx` or importing it as `DirigeraStats`, shadowing the existing component that renders `SensorSummaryResponse`.

**Why it happens:** The existing component is in `components/DirigeraStats.tsx`; a naive naming convention produces the same file name.

**How to avoid:** Use `DirigeraStatsPanel.tsx` for the new component (confirmed in D-08 and CONTEXT discretion section). Both files can coexist in the same `components/` directory.

**Warning signs:** TypeScript module resolution picks the wrong component; `DirigeraCard` receives wrong data shape.

---

### Pitfall 6: "Load more" Offset Reset on Polling Cycle

**What goes wrong:** Auto-polling the history/telemetry hooks replaces the accumulated `items` array with only the latest page, discarding rows the user loaded via "Load more".

**Why it happens:** Polling re-fetches with default `offset=0`; if the code does `setItems(response.events)` instead of appending, loaded pages are lost.

**How to avoid:** The polling callback always fetches `limit=50, offset=0` and replaces the entire items array. `loadMore()` appends. This is the expected UX: auto-refresh shows latest 50; user clicks "Load more" to see older rows. Document in hook JSDoc so implementors don't "fix" it.

**Warning signs:** User clicks "Load more", sees older rows, then on next polling cycle they disappear.

---

## Code Examples

### Route test template (from Phase 163)

```typescript
// Source: [VERIFIED: app/api/v1/dirigera/history/__tests__/route.test.ts]
jest.mock('@/lib/dirigera/dirigeraProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as dirigeraProxy from '@/lib/dirigera/dirigeraProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetHealth = jest.mocked(dirigeraProxy.getHealth);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/v1/dirigera/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/dirigera/health');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with health data when authenticated', async () => {
    const mockHealthData = { firmware_version: '2.465.0', connected_sensors: 6, is_reachable: true };
    mockGetHealth.mockResolvedValue(mockHealthData as any);
    const request = new Request('http://localhost:3000/api/v1/dirigera/health');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.firmware_version).toBe('2.465.0');
    expect(mockGetHealth).toHaveBeenCalledWith();
  });
});
```

### New hook URL fetch pattern (useDirigeraHistory skeleton)

```typescript
// Source: [VERIFIED by project patterns — useAdaptivePolling + useVisibility already in useDirigeraFullData.ts]
'use client';

import { useState, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import type { SensorHistoryResponse, SensorHistoryParams, SensorEvent } from '@/types/dirigeraProxy';

export interface UseDirigeraHistoryReturn {
  items: SensorEvent[];
  total: number;
  loading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  stale: boolean;
  loadMore: () => void;
}

export function useDirigeraHistory(params?: SensorHistoryParams): UseDirigeraHistoryReturn {
  const [items, setItems] = useState<SensorEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const offsetRef = useRef(0);

  const isVisible = useVisibility();
  const interval = isVisible ? 300_000 : 600_000;

  const fetchPage = async (offset: number, append: boolean) => {
    const sp = new URLSearchParams({ limit: '50', offset: String(offset) });
    if (params?.sensor_id) sp.set('sensor_id', params.sensor_id);
    if (params?.event_type) sp.set('event_type', params.event_type);

    const res = await fetch(`/api/v1/dirigera/history?${sp.toString()}`);
    if (!res.ok) throw new Error('Impossibile caricare lo storico');
    const data = (await res.json()) as SensorHistoryResponse;
    if (append) {
      setItems(prev => [...prev, ...data.events]);
    } else {
      setItems(data.events);
      offsetRef.current = 0;
    }
    setTotal(data.total);
    setStale(false);
    setError(null);
  };

  const pollCallback = async () => {
    try {
      await fetchPage(0, false);  // Always reset on poll cycle
    } catch {
      setStale(true);
      if (items.length === 0) setError('Impossibile caricare lo storico');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextOffset = offsetRef.current + 50;
    offsetRef.current = nextOffset;
    setIsLoadingMore(true);
    void fetchPage(nextOffset, true).finally(() => setIsLoadingMore(false));
  };

  useAdaptivePolling({ callback: pollCallback, interval, alwaysActive: false, immediate: true, initialDelay: 600 });

  return { items, total, loading, isLoadingMore, error, stale, loadMore };
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Legacy `/api/dirigera/*` flat routes | Canonical `/api/v1/dirigera/*` with provider prefix | Phases 130→163 | All providers now under versioned namespace |
| Direct device API calls (CLIP v1, WiNet, OAuth) | Shared HA proxy via `haGet` / `haPut` | Phases 99→114 | Single auth token, single error mapping |
| Polling-only hooks | WS-primary + polling-fallback | Phase 139–144 | DIRIGERA health/sensors on WS; history/stats/telemetry are HTTP-only (no WS topic) |

**Deprecated/outdated:**
- `/api/dirigera/*` (legacy flat routes): will be deleted in Wave 3. No replacement needed for the 5 routes being wrapped — their v1 equivalents take over.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `sensors/contact` and `sensors/motion` v1 wrappers should use explicit `{ sensors, count, is_stale }` spreading (same as legacy) | Pattern 2, Pitfall 1 | If wrong, hook receives extra proxy fields; low breakage risk but violates D-02 |
| A2 | "Sensore più attivo" and "Eventi ultime 24h" UI-SPEC tile labels are not available in `DirigeraStatsResponse` | Pattern 5 / Pitfall 3 | If wrong (API was updated), tile content is available and the recommended omission is unnecessary |
| A3 | Playwright `@smoke` tag infrastructure still absent (noted Phase 167) | Validation Architecture | If tags now exist, smoke test command can be scoped to `@smoke`; otherwise use full spec run |

**Verified claims:** All other claims in this document were verified by reading source files in this session.

---

## Open Questions

1. **Stats panel tile content**
   - What we know: `DirigeraStatsResponse` has `aggregation` and `retention` nested objects with `total_rows_aggregated`, `rows_aggregated_last_run`, `total_rows_deleted`, `last_run_status`, `total_runs`.
   - What's unclear: UI-SPEC requests "Sensore più attivo" and "Eventi ultime 24h" — neither field exists in the spec or type definitions.
   - Recommendation: Planner should adapt tile labels to available data. Suggested set: "Righe aggregate" (`total_rows_aggregated`), "Ultima aggregazione" (`rows_aggregated_last_run`), "Righe eliminate" (`total_rows_deleted`), "Stato" (`last_run_status`). Defer the aspirational metrics to a future phase that adds a dedicated analytics endpoint.

2. **Playwright smoke assertion for new panels**
   - What we know: `/dirigera` is not in the existing `page-loads.spec.ts` test suite (the current spec covers: `/`, `/stove`, `/thermostat`, `/lights`, `/network`, `/raspi`, `/settings`, `/debug`).
   - What's unclear: D-14 says "reuse the existing `/dirigera` smoke test from Phase 97" — but there is no existing `/dirigera` test in `tests/smoke/page-loads.spec.ts`. Phase 97 may have added it in a different file or it may have been removed.
   - Recommendation: Wave 1 executor should add a `/dirigera` test case to `page-loads.spec.ts` matching the pattern of other device pages (navigate, wait for `main`, assert no console errors). Wave 2 extends that test to assert the panels render.

---

## Environment Availability

Step 2.6: SKIPPED — This phase has no external service dependencies beyond the project's own codebase. The HA proxy is already configured and running. No new CLIs, runtimes, or services are required.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (next/jest transformer) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="dirigera"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIR-01 | `/api/v1/dirigera/history` returns paginated events | unit (route) | `npm test -- --testPathPattern="v1/dirigera/history"` | ✅ `app/api/v1/dirigera/history/__tests__/route.test.ts` |
| DIR-02 | `/api/v1/dirigera/stats` returns aggregation/retention | unit (route) | `npm test -- --testPathPattern="v1/dirigera/stats"` | ✅ `app/api/v1/dirigera/stats/__tests__/route.test.ts` |
| DIR-03 | `/api/v1/dirigera/telemetry` returns paginated readings | unit (route) | `npm test -- --testPathPattern="v1/dirigera/telemetry"` | ✅ `app/api/v1/dirigera/telemetry/__tests__/route.test.ts` |
| SC-1 | `useDirigeraData` fetches v1 URLs only | unit (hook) | `npm test -- --testPathPattern="useDirigeraData"` | ✅ (modified) `hooks/__tests__/useDirigeraData.test.ts` |
| SC-2 | Zero `/api/dirigera/` refs outside legacy tree | grep sweep | `grep -rn "/api/dirigera/" app/ lib/ types/ --include="*.ts" --include="*.tsx" \| grep -v "v1" \| grep -v "version.ts"` | ❌ Performed in Wave 3 (no file) |
| SC-3 | `/dirigera` page renders history/stats/telemetry | smoke (Playwright) | `npx playwright test tests/smoke/page-loads.spec.ts` | ❌ `/dirigera` test case missing from spec — Wave 1 gap |
| SC-4 | Full Jest + Playwright smoke green | integration | `npm test && npx playwright test tests/smoke/page-loads.spec.ts` | ✅ (infrastructure exists) |

### New v1 Route Tests (Wave 1 — all Wave 0 gaps)

| File | Covers | Pattern |
|------|--------|---------|
| `app/api/v1/dirigera/health/__tests__/route.test.ts` | 401 / 200 / correct proxy call | Mirror `history/__tests__/route.test.ts` |
| `app/api/v1/dirigera/sensors/__tests__/route.test.ts` | 401 / 200 / `{ sensors, count, is_stale }` shape | Same pattern |
| `app/api/v1/dirigera/sensors/summary/__tests__/route.test.ts` | 401 / 200 / full passthrough | Same pattern |
| `app/api/v1/dirigera/sensors/contact/__tests__/route.test.ts` | 401 / 200 / `{ sensors, count, is_stale }` | Same pattern |
| `app/api/v1/dirigera/sensors/motion/__tests__/route.test.ts` | 401 / 200 / `{ sensors, count, is_stale }` | Same pattern |

### New Hook Tests (Wave 2 — all Wave 0 gaps)

| File | Covers |
|------|--------|
| `hooks/__tests__/useDirigeraHistory.test.ts` | URL assertion (`/api/v1/dirigera/history`), `loadMore()` offset increment, empty state, error state |
| `hooks/__tests__/useDirigeraStats.test.ts` | URL assertion, data mapping, stale/error states |
| `hooks/__tests__/useDirigeraTelemetry.test.ts` | URL assertion, `loadMore()`, empty/error states |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="dirigera" --passWithNoTests`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full Jest suite green + Playwright `page-loads.spec.ts` green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/smoke/page-loads.spec.ts` — add `/dirigera` page test case (navigate + `main` attached + no console errors)
- [ ] `app/api/v1/dirigera/health/__tests__/route.test.ts` — new file, Wave 1
- [ ] `app/api/v1/dirigera/sensors/__tests__/route.test.ts` — new file, Wave 1
- [ ] `app/api/v1/dirigera/sensors/summary/__tests__/route.test.ts` — new file, Wave 1
- [ ] `app/api/v1/dirigera/sensors/contact/__tests__/route.test.ts` — new file, Wave 1
- [ ] `app/api/v1/dirigera/sensors/motion/__tests__/route.test.ts` — new file, Wave 1
- [ ] `hooks/__tests__/useDirigeraHistory.test.ts` — new file, Wave 2
- [ ] `hooks/__tests__/useDirigeraStats.test.ts` — new file, Wave 2
- [ ] `hooks/__tests__/useDirigeraTelemetry.test.ts` — new file, Wave 2

---

## Security Domain

> `security_enforcement` not explicitly set to false — treating as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `withAuthAndErrorHandler` from `@/lib/core` — Auth0 session check on all v1 routes |
| V3 Session Management | no | Sessions managed by Auth0; not modified in this phase |
| V4 Access Control | no | No role differentiation; all authenticated users have equal access |
| V5 Input Validation | yes | Query params (`limit`, `offset`, `sensor_id`) validated in route handlers — invalid numerics dropped silently, HA proxy clamps `limit` 1–1000 |
| V6 Cryptography | no | `haGet` transport uses HTTPS to HA proxy; no crypto in scope |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated access to sensor data | Information Disclosure | `withAuthAndErrorHandler` on all 5 new v1 routes — same as Phase 163 |
| Query param injection in history/telemetry | Tampering | `URLSearchParams` serialization + type coercion (string/number checks) — no raw string interpolation into SQL (HA proxy handles SQLite queries) |
| Excessive limit values | DoS | HA proxy clamps `limit` 1–1000; Next.js routes pass through but do not amplify |

---

## Sources

### Primary (HIGH confidence)
- `app/api/v1/dirigera/history/route.ts` — verified route pattern (auth wrapper, params forwarding, `success()` call)
- `app/api/v1/dirigera/stats/route.ts` — verified simple route pattern
- `app/api/v1/dirigera/telemetry/route.ts` — verified route with params
- `app/api/v1/dirigera/history/__tests__/route.test.ts` — verified test template (mock setup, 401/200/params assertions)
- `app/api/dirigera/health/route.ts` — verified legacy response shape (full passthrough)
- `app/api/dirigera/sensors/route.ts` — verified legacy response shape (explicit `{ sensors, count, is_stale }` spread)
- `app/api/dirigera/sensors/contact/route.ts` — verified explicit spread
- `app/api/dirigera/sensors/motion/route.ts` — verified explicit spread
- `app/api/dirigera/sensors/summary/route.ts` — verified full passthrough
- `lib/dirigera/dirigeraProxy.ts` — verified all 8 proxy functions present
- `types/dirigeraProxy.ts` — verified all DTOs including `SensorHistoryParams`, `SensorTelemetryParams`
- `app/components/devices/dirigera/hooks/useDirigeraData.ts` — verified 3 legacy URL sites + WS subscription code
- `app/components/devices/dirigera/hooks/useDirigeraFullData.ts` — verified 4 legacy URL sites (FILTER_ENDPOINTS + health fetch)
- `app/components/devices/dirigera/hooks/__tests__/useDirigeraData.test.ts` — verified 3 assertion sites at lines 121, 122, 309
- `app/dirigera/page.tsx` — verified composition target and insertion point for 3 new sections
- `app/components/devices/dirigera/components/DirigeraStats.tsx` — verified fleet-summary component (different from new stats panel)
- `app/components/devices/dirigera/components/DirigeraHealthSection.tsx` — verified structural analog for panels
- `app/components/devices/dirigera/components/DirigeraSensorList.tsx` — verified table pattern analog
- `docs/api/dirigera.md` — authoritative 8-endpoint spec with full DTOs
- `tests/smoke/page-loads.spec.ts` — verified absence of `/dirigera` test case
- `.planning/config.json` — verified `nyquist_validation: true`
- `jest.config.ts` — verified test config, testPathIgnorePatterns

### Secondary (MEDIUM confidence)
- `.planning/phases/169-dirigera-frontend-cutover/169-CONTEXT.md` — D-01..D-17 decisions (locked)
- `.planning/phases/169-dirigera-frontend-cutover/169-UI-SPEC.md` — panel interaction contract, copy, tokens
- `.planning/phases/168-netatmo-frontend-cutover/168-CONTEXT.md` — 3-plan wave structural template
- `.planning/phases/163-dirigera-gap-closure/163-CONTEXT.md` — Phase 163 scope boundaries (what was deferred to this phase)
- `grep -rn "/api/dirigera/"` sweep — confirmed exactly 8 legacy-path references (3 in hooks + test assertions + 5 in legacy route JSDoc); no other consumers

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified from source files
- Architecture: HIGH — data flow verified end-to-end from proxy to hooks to page
- Pitfalls: HIGH — envelope-mismatch risk verified from legacy route code; WS subscription risk verified from hook code
- Stats tile content: MEDIUM — UI-SPEC aspirational labels verified as absent from API spec; planner must adapt

**Research date:** 2026-04-22
**Valid until:** 2026-05-22 (stable codebase; HA proxy API schema unlikely to change)
