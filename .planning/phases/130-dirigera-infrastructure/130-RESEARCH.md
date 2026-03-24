# Phase 130: DIRIGERA Infrastructure - Research

**Researched:** 2026-03-24
**Domain:** Proxy client + TypeScript types + API route infrastructure (read-only)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Single `lib/dirigera/dirigeraProxy.ts` function module — matches sonosProxy.ts, thermorossiProxy.ts, hueProxy.ts pattern
- **D-02:** Read-only provider: all wrappers use `haGet` transport exclusively — no haPost/haPut/haDelete needed
- **D-03:** 5 proxy functions: `getHealth`, `getSensors`, `getContactSensors`, `getMotionSensors`, `getSensorSummary`
- **D-04:** Single `types/dirigeraProxy.ts` file containing all DIRIGERA interfaces
- **D-05:** Define ALL types upfront (health, sensor, contact, motion, summary, history events, stats, telemetry) even though Phase 130 only uses health and sensor types — avoids rework in future phases
- **D-06:** Use exact field names and types from `docs/api/dirigera.md` TypeScript blocks — no renaming
- **D-07:** 3-state freshness on contact and motion endpoints: `LIVE` (reachable + last_seen ≤5min), `STALE` (reachable but last_seen >5min or null), `UNREACHABLE` (not reachable)
- **D-08:** `DirigeraDataFreshness = 'LIVE' | 'STALE' | 'UNREACHABLE'` — UNLIKE Sonos, UNREACHABLE IS returned in the response body (computed per-sensor, never triggers 503)
- **D-09:** `is_stale` boolean on list responses indicates cache-level staleness (separate from per-sensor `data_freshness`)
- **D-10:** All 5 routes are static paths — no dynamic segments needed in this phase
- **D-11:** Route paths: `/api/dirigera/health`, `/api/dirigera/sensors`, `/api/dirigera/sensors/contact`, `/api/dirigera/sensors/motion`, `/api/dirigera/sensors/summary`
- **D-12:** All routes use `withAuthAndErrorHandler` + `success()` pattern from `lib/core`
- **D-13:** All route files export `const dynamic = 'force-dynamic'`
- **D-14:** Array responses (sensors lists) wrapped in named object keys matching API spec (`sensors` key); object responses (health, summary) use double assertion for `success()` compatibility
- **D-15:** Let haGet propagate RFC 9457 errors — no extra error wrapping in proxy functions
- **D-16:** 503 for hub unreachable (from HA proxy), 401 for auth — pass through to client

### Claude's Discretion

- JSDoc comments on proxy functions (optional, brief)
- Test file structure and mock data shapes
- Whether to add query parameter forwarding for future history/telemetry routes

### Deferred Ideas (OUT OF SCOPE)

- GET /dirigera/history — paginated sensor event history (DIRIG-F01, future phase)
- GET /dirigera/stats — aggregation and retention statistics (DIRIG-F02, future phase)
- GET /dirigera/telemetry — sensor telemetry history (DIRIG-F03, future phase)
- DirigeraCard dashboard card + /dirigera page — Phase 131
- Device registry integration + navigation menu — Phase 131
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DIRIG-01 | Proxy client per DIRIGERA API con haGet transport (X-API-Key auth) | `haGet` from `lib/haClient.ts` is the sole transport; `dirigeraProxy.ts` wraps it with 5 typed functions |
| DIRIG-02 | TypeScript types per tutti i response interfaces DIRIGERA (health, sensor, contact, motion, summary) | All types defined upfront in `types/dirigeraProxy.ts` from `docs/api/dirigera.md` spec, including future-phase types |
| DIRIG-03 | GET /dirigera/health — hub connection status, firmware, connected sensors | `getHealth()` → `DirigeraHealthResponse`; static route file with double assertion |
| DIRIG-04 | GET /dirigera/sensors — lista completa sensori (contatto + movimento) | `getSensors()` → `DirigeraSensorsResponse`; array wrapped in `{ sensors: [...], count, is_stale }` |
| DIRIG-05 | GET /dirigera/sensors/contact — solo sensori contatto con data_freshness | `getContactSensors()` → `ContactSensorsResponse`; `data_freshness` per-sensor from 3-state enum |
| DIRIG-06 | GET /dirigera/sensors/motion — solo sensori movimento con light_level e data_freshness | `getMotionSensors()` → `MotionSensorsResponse`; `light_level: number \| null` on each sensor |
| DIRIG-07 | GET /dirigera/sensors/summary — summary flotta (total, open, offline, low battery) | `getSensorSummary()` → `SensorSummaryResponse`; object response with double assertion |
</phase_requirements>

---

## Summary

Phase 130 is a pure infrastructure phase: proxy client, TypeScript types, and 5 read-only API routes. No new libraries are needed — all transport, auth, and error handling is provided by the existing `haGet` function in `lib/haClient.ts`. The pattern is established and verified across 5 prior providers (Thermorossi, Netatmo, Fritz!Box, Raspberry Pi, Hue, Sonos).

The primary implementation work is type definition (from `docs/api/dirigera.md` spec verbatim), proxy function authoring (5 haGet wrappers), and route scaffolding (5 static GET routes using `withAuthAndErrorHandler`). The key DIRIGERA-specific subtlety is the 3-state `DirigeraDataFreshness` union that includes `UNREACHABLE` in the response body — unlike Sonos which returns 503 for unreachable state.

The nested route structure `app/api/dirigera/sensors/contact/route.ts` and `app/api/dirigera/sensors/motion/route.ts` follows Next.js filesystem routing and requires creating nested directories — verified pattern from existing nested routes in the project.

**Primary recommendation:** Copy the sonosProxy.ts + types/sonosProxy.ts structure exactly, substituting DIRIGERA types from spec. The route files are each 8-12 lines — boilerplate with a single proxy call.

---

## Standard Stack

### Core (all pre-existing — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lib/haClient.ts` (internal) | current | haGet transport with X-API-Key auth, RFC 9457 error mapping | Shared by all 6 providers; no direct device access |
| `lib/core/apiResponse.ts` (internal) | current | `withAuthAndErrorHandler`, `success()`, `error()` | Auth guard + response wrapper for all routes |
| Next.js App Router | 15.5 | Filesystem route handler via `app/api/dirigera/...` | Project standard |
| TypeScript strict + noUncheckedIndexedAccess | current | Type safety | Project enforced |

**Installation:** None required — all dependencies exist.

---

## Architecture Patterns

### Recommended Project Structure

```
lib/
└── dirigera/
    └── dirigeraProxy.ts     # 5 haGet wrappers (DIRIG-01)

types/
└── dirigeraProxy.ts         # All DIRIGERA interfaces upfront (DIRIG-02)

app/api/dirigera/
├── health/
│   └── route.ts             # GET /api/dirigera/health (DIRIG-03)
└── sensors/
    ├── route.ts             # GET /api/dirigera/sensors (DIRIG-04)
    ├── contact/
    │   └── route.ts         # GET /api/dirigera/sensors/contact (DIRIG-05)
    ├── motion/
    │   └── route.ts         # GET /api/dirigera/sensors/motion (DIRIG-06)
    └── summary/
        └── route.ts         # GET /api/dirigera/sensors/summary (DIRIG-07)

__tests__/
└── lib/
    └── dirigeraProxy.test.ts   # Unit tests for all 5 proxy wrappers
```

### Pattern 1: Proxy Function Module (function module, not class)

**What:** Each provider has a `lib/{provider}/{provider}Proxy.ts` file exporting individual async functions. Each function calls `haGet<ResponseType>('/api/v1/{provider}/{endpoint}')`.

**When to use:** Always for DIRIGERA (haGet-only provider).

**Example (verified from lib/sonos/sonosProxy.ts):**
```typescript
// Source: lib/sonos/sonosProxy.ts
import { haGet } from '@/lib/haClient';
import type { DirigeraHealthResponse } from '@/types/dirigeraProxy';

export async function getHealth(): Promise<DirigeraHealthResponse> {
  return haGet<DirigeraHealthResponse>('/api/v1/dirigera/health');
}

export async function getSensors(): Promise<DirigeraSensorsResponse> {
  return haGet<DirigeraSensorsResponse>('/api/v1/dirigera/sensors');
}
```

### Pattern 2: Object Response Route (double assertion)

**What:** Endpoints returning a single object (not wrapped in a named array key) require double assertion to satisfy `success()` type signature.

**When to use:** Health and summary endpoints (DIRIG-03, DIRIG-07).

**Example (verified from app/api/sonos/health/route.ts):**
```typescript
// Source: app/api/sonos/health/route.ts
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHealth } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Dirigera/Health');
```

### Pattern 3: Array Response Route (named key wrapping)

**What:** Endpoints returning arrays wrap in a named object key matching the spec's JSON shape.

**When to use:** Sensors list endpoints (DIRIG-04, DIRIG-05, DIRIG-06).

**Example (verified from app/api/sonos/zones/route.ts):**
```typescript
// Source: app/api/sonos/zones/route.ts
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getSensors } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getSensors();
  return success({ sensors: data.sensors, count: data.count, is_stale: data.is_stale });
}, 'Dirigera/Sensors');
```

**Note:** The proxy function returns the full `DirigeraSensorsResponse` object (not just the array), so the route can pass it through directly or spread its fields as above.

### Pattern 4: Type File Organization (all types upfront)

**What:** The types file defines all interfaces for current AND future phases — avoids rework when history/stats/telemetry routes are added.

**When to use:** Always (decision D-05).

**Example shape (from types/sonosProxy.ts pattern + docs/api/dirigera.md):**
```typescript
// Source: docs/api/dirigera.md — verbatim field names required (D-06)

export type DirigeraDataFreshness = 'LIVE' | 'STALE' | 'UNREACHABLE';

// Phase 130 types
export interface DirigeraHealthResponse { ... }
export interface DirigeraSensor { ... }
export interface DirigeraSensorsResponse { sensors: DirigeraSensor[]; count: number; is_stale: boolean; }
export interface ContactSensor extends DirigeraSensor { ... }
export interface MotionSensor extends DirigeraSensor { ... }
export interface SensorSummaryResponse { ... }

// Future-phase types (DIRIG-F01, DIRIG-F02, DIRIG-F03) — defined now
export interface SensorEvent { ... }
export interface SensorHistoryResponse { ... }
export interface AggregationStats { ... }
export interface RetentionStats { ... }
export interface DirigeraStatsResponse { ... }
export interface SensorTelemetryReading { ... }
export interface SensorTelemetryResponse { ... }
```

### Pattern 5: Test via mocked haClient

**What:** The proxy test file mocks `lib/haClient` at module level, then uses `jest.mocked(haGet)` to verify each wrapper calls the correct path. Verified in `lib/sonos/__tests__/sonosProxy.test.ts`.

**When to use:** Primary test pattern for proxy functions.

**Example (verified from lib/sonos/__tests__/sonosProxy.test.ts):**
```typescript
// Source: lib/sonos/__tests__/sonosProxy.test.ts
jest.mock('@/lib/haClient');
import { haGet } from '@/lib/haClient';
import { getHealth, getSensors } from '../dirigeraProxy';

const mockHaGet = jest.mocked(haGet);

it('getHealth() calls GET /api/v1/dirigera/health', async () => {
  mockHaGet.mockResolvedValueOnce({ firmware_version: '2.465.0', connected_sensors: 6, is_reachable: true });
  await getHealth();
  expect(mockHaGet).toHaveBeenCalledWith('/api/v1/dirigera/health');
});
```

### Anti-Patterns to Avoid

- **Wrapping haGet errors:** haGet already maps all errors to RFC 9457 / ApiError. No extra try/catch in proxy functions (D-15).
- **Dynamic route segments for Phase 130:** All 5 routes are static paths — no `[id]` segments in scope.
- **Class-based proxy:** Project uses function module pattern throughout — no class with constructor.
- **Skipping `is_stale` in route response:** The spec includes `is_stale` in all list and summary responses — it must propagate from proxy through to the route response.
- **Treating UNREACHABLE as 503:** Unlike Sonos, DIRIGERA `UNREACHABLE` is a per-sensor `data_freshness` value in the response body — NOT a proxy-level 503. The hub being unreachable (different from a sensor being unreachable) triggers 503 from HA proxy (D-08).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP transport + auth | Custom fetch with X-API-Key | `haGet` from `lib/haClient.ts` | Handles timeout, error mapping, env config |
| Route auth guard | Manual session check | `withAuthAndErrorHandler` | Auth0 integration, error formatting, consistent 401 |
| JSON response formatting | Manual `NextResponse.json()` | `success()` from `lib/core/apiResponse.ts` | Consistent envelope, type safe |
| RFC 9457 error propagation | Custom error catch | haGet's built-in `mapResponseError` | Handles 401/429/503/other correctly |

**Key insight:** DIRIGERA infrastructure is pure wiring — all hard problems (auth, transport, error handling) are solved by existing lib/core utilities.

---

## Complete Type Inventory (from docs/api/dirigera.md)

All types to define in `types/dirigeraProxy.ts`, organized by phase:

### Phase 130 Types (actively used by routes)

```typescript
// Data freshness — 3-state, UNREACHABLE appears in response body
export type DirigeraDataFreshness = 'LIVE' | 'STALE' | 'UNREACHABLE';

// DIRIG-03
export interface DirigeraHealthResponse {
  firmware_version: string;
  connected_sensors: number;
  is_reachable: boolean;
}

// DIRIG-04 base sensor
export interface DirigeraSensor {
  id: string;
  type: 'openCloseSensor' | 'occupancySensor' | string;
  custom_name: string;
  room: string | null;
  firmware_version: string | null;
  battery_percentage: number | null;
  is_reachable: boolean;
  is_open: boolean | null;    // null for motion sensors
  last_seen: string | null;   // ISO 8601
}

export interface DirigeraSensorsResponse {
  sensors: DirigeraSensor[];
  count: number;
  is_stale: boolean;
}

// DIRIG-05 — is_open narrowed to boolean (never null for contact sensors)
export interface ContactSensor extends DirigeraSensor {
  data_freshness: DirigeraDataFreshness;
  is_open: boolean;
}

export interface ContactSensorsResponse {
  sensors: ContactSensor[];
  count: number;
  is_stale: boolean;
}

// DIRIG-06 — light_level is motion-sensor-only
export interface MotionSensor extends DirigeraSensor {
  light_level: number | null;
  data_freshness: DirigeraDataFreshness;
}

export interface MotionSensorsResponse {
  sensors: MotionSensor[];
  count: number;
  is_stale: boolean;
}

// DIRIG-07
export interface SensorSummaryResponse {
  total_sensors: number;
  open_count: number;
  offline_count: number;
  low_battery_count: number;
  is_stale: boolean;
}
```

### Future-Phase Types (defined now per D-05, routes deferred)

```typescript
// DIRIG-F01 — history
export interface SensorEvent {
  id: number;
  sensor_id: string;
  sensor_name: string | null;
  event_type: 'open' | 'close' | 'motion_detected' | 'motion_cleared' | string;
  recorded_at: number;  // Unix timestamp
}

export interface SensorHistoryResponse {
  events: SensorEvent[];
  total: number;
  limit: number;
  offset: number;
}

// DIRIG-F02 — stats
export interface AggregationStats {
  last_run_at: number | null;
  last_run_status: string | null;
  rows_aggregated_last_run: number;
  total_runs: number;
  total_rows_aggregated: number;
}

export interface RetentionStats {
  last_run_at: number | null;
  last_run_status: string | null;
  rows_deleted_last_run: number;
  total_runs: number;
  total_rows_deleted: number;
}

export interface DirigeraStatsResponse {
  aggregation: AggregationStats;
  retention: RetentionStats;
}

// DIRIG-F03 — telemetry
export interface SensorTelemetryReading {
  id: number;
  sensor_id: string;
  battery_percentage: number | null;
  light_level: number | null;
  timestamp: number;  // Unix timestamp (seconds)
}

export interface SensorTelemetryResponse {
  telemetry: SensorTelemetryReading[];
  total: number;
  limit: number;
  offset: number;
}
```

---

## Common Pitfalls

### Pitfall 1: DirigeraDataFreshness vs SonosDataFreshness Confusion
**What goes wrong:** Developer copies Sonos pattern and excludes `UNREACHABLE` from the freshness type (Sonos uses 2-state `'LIVE' | 'STALE'` because UNREACHABLE triggers 503).
**Why it happens:** DIRIGERA freshness is computed per-sensor; a sensor can be UNREACHABLE while the hub is fine and returns 200.
**How to avoid:** `DirigeraDataFreshness = 'LIVE' | 'STALE' | 'UNREACHABLE'` — 3-state union, explicitly documented in D-08.
**Warning signs:** If `data_freshness` is typed as `'LIVE' | 'STALE'` only, TypeScript won't catch UNREACHABLE values from the API.

### Pitfall 2: Missing `is_stale` on Sensors Response
**What goes wrong:** Route returns `{ sensors: [...] }` but omits `count` and `is_stale` top-level fields.
**Why it happens:** Developer treats `DirigeraSensorsResponse.sensors` as the full payload when the spec wraps it.
**How to avoid:** Proxy function returns the full response object (`DirigeraSensorsResponse`). Route passes it through or spreads all fields.
**Warning signs:** Frontend receives `{ sensors: [...] }` but can't access `is_stale`.

### Pitfall 3: Nested Route Directory Not Created
**What goes wrong:** `app/api/dirigera/sensors/contact/route.ts` not reachable because `sensors/contact/` directory doesn't exist.
**Why it happens:** `sensors/route.ts` exists but the subdirectories `contact/`, `motion/`, `summary/` need to be created separately.
**How to avoid:** Create the full nested directory structure explicitly. Next.js App Router requires each segment to be a real directory.
**Warning signs:** 404 from `/api/dirigera/sensors/contact` even though `/api/dirigera/sensors` works.

### Pitfall 4: Object Response Without Double Assertion
**What goes wrong:** TypeScript error on `success(data)` when `data` is a typed interface (not `Record<string, unknown>`).
**Why it happens:** `success()` signature requires `Record<string, unknown>`. Direct interfaces don't satisfy this without assertion.
**How to avoid:** Use `success(data as unknown as Record<string, unknown>)` for object responses (health, summary). Array response routes spread into a new object literal which already satisfies the type.
**Warning signs:** `tsc` error on `success(data)` in health or summary route.

### Pitfall 5: `ContactSensor.is_open` Not Narrowed to `boolean`
**What goes wrong:** `ContactSensor` extends `DirigeraSensor` where `is_open: boolean | null`, but contact sensors always have a boolean value. If not narrowed, frontend must handle null unnecessarily.
**Why it happens:** Developers copy the base interface without overriding the field.
**How to avoid:** `interface ContactSensor extends DirigeraSensor { is_open: boolean; ... }` — the spec shows `is_open` is always boolean for contact sensors.
**Warning signs:** Frontend code sees `is_open: boolean | null` for contact sensors.

---

## Code Examples

### Complete proxy module structure

```typescript
// Source: lib/dirigera/dirigeraProxy.ts — modeled on lib/sonos/sonosProxy.ts
import { haGet } from '@/lib/haClient';
import type {
  DirigeraHealthResponse,
  DirigeraSensorsResponse,
  ContactSensorsResponse,
  MotionSensorsResponse,
  SensorSummaryResponse,
} from '@/types/dirigeraProxy';

export async function getHealth(): Promise<DirigeraHealthResponse> {
  return haGet<DirigeraHealthResponse>('/api/v1/dirigera/health');
}

export async function getSensors(): Promise<DirigeraSensorsResponse> {
  return haGet<DirigeraSensorsResponse>('/api/v1/dirigera/sensors');
}

export async function getContactSensors(): Promise<ContactSensorsResponse> {
  return haGet<ContactSensorsResponse>('/api/v1/dirigera/sensors/contact');
}

export async function getMotionSensors(): Promise<MotionSensorsResponse> {
  return haGet<MotionSensorsResponse>('/api/v1/dirigera/sensors/motion');
}

export async function getSensorSummary(): Promise<SensorSummaryResponse> {
  return haGet<SensorSummaryResponse>('/api/v1/dirigera/sensors/summary');
}
```

### Sensors list route (named key wrapping)

```typescript
// Source: app/api/dirigera/sensors/route.ts — modeled on app/api/sonos/zones/route.ts
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getSensors } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getSensors();
  return success({ sensors: data.sensors, count: data.count, is_stale: data.is_stale });
}, 'Dirigera/Sensors');
```

### Summary route (double assertion — object response)

```typescript
// Source: app/api/dirigera/sensors/summary/route.ts — modeled on app/api/sonos/health/route.ts
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getSensorSummary } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getSensorSummary();
  return success(data as unknown as Record<string, unknown>);
}, 'Dirigera/SensorSummary');
```

### Test pattern for proxy wrappers

```typescript
// Source: lib/sonos/__tests__/sonosProxy.test.ts — verified pattern
jest.mock('@/lib/haClient');
import { haGet } from '@/lib/haClient';
import { getHealth, getSensors, getContactSensors, getMotionSensors, getSensorSummary } from '../dirigeraProxy';

const mockHaGet = jest.mocked(haGet);

const mockHealth = { firmware_version: '2.465.0', connected_sensors: 6, is_reachable: true };

describe('dirigeraProxy', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('getHealth() calls /api/v1/dirigera/health', async () => {
    mockHaGet.mockResolvedValueOnce(mockHealth);
    await getHealth();
    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/dirigera/health');
  });
});
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (jest.config.ts) |
| Config file | `/jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern=dirigeraProxy` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIRIG-01 | `getHealth/getSensors/getContactSensors/getMotionSensors/getSensorSummary` call correct haGet paths | unit | `npm test -- --testPathPattern=dirigeraProxy` | ❌ Wave 0 |
| DIRIG-02 | All TypeScript interfaces compile with tsc | type-check | `npx tsc --noEmit` | ❌ Wave 0 |
| DIRIG-03 | GET /api/dirigera/health returns `DirigeraHealthResponse` shape | unit | `npm test -- --testPathPattern=dirigera/health` | ❌ Wave 0 |
| DIRIG-04 | GET /api/dirigera/sensors returns `{ sensors, count, is_stale }` | unit | `npm test -- --testPathPattern=dirigera/sensors` | ❌ Wave 0 |
| DIRIG-05 | GET /api/dirigera/sensors/contact returns ContactSensor array with data_freshness | unit | `npm test -- --testPathPattern=sensors/contact` | ❌ Wave 0 |
| DIRIG-06 | GET /api/dirigera/sensors/motion returns MotionSensor array with light_level | unit | `npm test -- --testPathPattern=sensors/motion` | ❌ Wave 0 |
| DIRIG-07 | GET /api/dirigera/sensors/summary returns fleet totals | unit | `npm test -- --testPathPattern=sensors/summary` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern=dirigeraProxy`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `lib/dirigera/__tests__/dirigeraProxy.test.ts` — covers DIRIG-01 (proxy function paths)
- [ ] `__tests__/api/dirigera/health.test.ts` — covers DIRIG-03 (optional, proxy test may suffice)
- [ ] `types/dirigeraProxy.ts` — must exist for tsc to pass (DIRIG-02)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct device API calls | HA proxy via haGet | v13.0 (Phase 99-103) | No direct device access anywhere |
| JWT-based auth on each provider | Shared X-API-Key via haClient | v11.0 (Phase 84-86) | Single HA_API_KEY env var for all providers |
| Per-route error handling | withAuthAndErrorHandler + RFC 9457 pass-through | v7.0+ | Consistent error envelope |

**Deprecated/outdated:**
- Direct DIRIGERA REST API (not applicable — HA proxy pattern is project standard since v13.0)
- JWT tokens per-provider — replaced by X-API-Key in HA_API_KEY env var

---

## Open Questions

1. **HA proxy base path for DIRIGERA**
   - What we know: Context states `/api/v1/dirigera/...` (from code_context D-04)
   - What's unclear: Not independently verified against a live proxy — only stated in CONTEXT.md
   - Recommendation: Treat as HIGH confidence given the explicit CONTEXT.md statement and consistency with other providers (`/api/v1/sonos/...`, `/api/v1/thermorossi/...`)

2. **Route handler naming convention for nested sensors routes**
   - What we know: `withAuthAndErrorHandler` second arg is a string label for logging (`'Sonos/Health'`, `'Sonos/Zones'`)
   - What's unclear: Exact convention for nested paths — e.g. `'Dirigera/SensorsContact'` vs `'Dirigera/Sensors/Contact'`
   - Recommendation: Use `'Dirigera/SensorsContact'`, `'Dirigera/SensorsMotion'`, `'Dirigera/SensorsSummary'` — flat camelCase matching existing Sonos labels

---

## Sources

### Primary (HIGH confidence)
- `docs/api/dirigera.md` — authoritative DIRIGERA endpoint spec, all TypeScript types extracted verbatim
- `lib/sonos/sonosProxy.ts` — most recent proxy pattern; DIRIGERA structure mirrors this exactly
- `lib/haClient.ts` — transport implementation, confirms haGet signature and error handling
- `app/api/sonos/health/route.ts` — double assertion pattern for object responses
- `app/api/sonos/zones/route.ts` — named key wrapping for array responses
- `lib/sonos/__tests__/sonosProxy.test.ts` — verified test pattern using jest.mock + jest.mocked

### Secondary (MEDIUM confidence)
- `.planning/phases/130-dirigera-infrastructure/130-CONTEXT.md` — locked decisions (D-01 through D-16)
- `types/sonosProxy.ts` — type file organizational pattern (types sections by phase)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are pre-existing in the project
- Architecture: HIGH — direct application of sonosProxy.ts pattern, verified from source
- Type definitions: HIGH — copied verbatim from docs/api/dirigera.md spec
- Pitfalls: HIGH — identified from pattern differences between DIRIGERA and Sonos (3-state freshness, nested routes)

**Research date:** 2026-03-24
**Valid until:** 2026-04-23 (stable internal patterns, no external library changes)
