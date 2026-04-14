# Phase 163: DIRIGERA Gap Closure - Research

**Researched:** 2026-04-14
**Domain:** Next.js 15.5 API routes + HA proxy client wrappers (TypeScript strict)
**Confidence:** HIGH

## Summary

Phase 163 is a strict, small-surface gap closure: add three read-only v1 DIRIGERA endpoints (`history`, `stats`, `telemetry`) that route through the already-present shared HA proxy (`haGet`). All response types are already declared in `types/dirigeraProxy.ts` under a `FUTURE-PHASE TYPES` section. All infrastructure (middleware, auth wrapper, transport, test harness) is in place and battle-tested across 40+ existing v1 route tests.

The only non-mechanical decisions are: (1) query-string serialization style for the client functions (verified pattern exists — copy from `thermorossiProxy.getHistory`), and (2) route envelope (verified — `withAuthAndErrorHandler` does NOT auto-wrap; you must call `success()`, which spreads data at the top level under `{ success: true, ...data }`).

**Primary recommendation:** Mirror the `thermorossiProxy.getHistory(params?: URLSearchParams)` pattern for `getHistory` and `getTelemetry`, keep `getStats` zero-arg, and use the `app/api/v1/netatmo/getroommeasure` route + test pattern as the literal template for the three new route files.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Route Path Convention**
- **D-01:** Routes live at `app/api/v1/dirigera/{history,stats,telemetry}/route.ts` — literal roadmap spec match.
- **D-02:** Existing `/api/dirigera/*` routes are NOT migrated in this phase. Mixed state accepted.

**Client Function Signatures**
- **D-03:** Three new exported functions in `lib/dirigera/dirigeraProxy.ts`:
  - `getHistory(params?: SensorHistoryParams): Promise<SensorHistoryResponse>`
  - `getStats(): Promise<DirigeraStatsResponse>`
  - `getTelemetry(params?: SensorTelemetryParams): Promise<SensorTelemetryResponse>`
- **D-04:** Query params passed as a single object argument (not positional). `params` is optional; when omitted, proxy uses HA defaults (`limit=100`, `offset=0`).
- **D-05:** Client serializes params to a query string via `URLSearchParams`, skipping `null`/`undefined`. Only non-empty string/number values forwarded.

**Types & Envelopes**
- **D-06:** Reuse already-declared types in `types/dirigeraProxy.ts`: `SensorHistoryResponse`, `DirigeraStatsResponse`, `SensorTelemetryResponse` (and element types `SensorEvent`, `SensorTelemetryReading`, `AggregationStats`, `RetentionStats`). No new response types.
- **D-07:** Add two new param interfaces to `types/dirigeraProxy.ts`:
  - `SensorHistoryParams { sensor_id?, event_type?, start?, end?, limit?, offset? }`
  - `SensorTelemetryParams { sensor_id?, start?, end?, limit?, offset? }`
  Scoped to this file — do not export from `types/common.ts`.
- **D-08:** Do NOT use the generic `PaginatedResponse<T>` envelope. DIRIGERA responses use provider-specific field names (`events`, `telemetry`, `total`) — raw pass-through wins.

**Route Implementation**
- **D-09:** Routes follow `app/api/dirigera/sensors/route.ts` pattern: `export const dynamic = 'force-dynamic'`, `withAuthAndErrorHandler` wrapper from `@/lib/core`, delegate to proxy, return as-is.
- **D-10:** For history/telemetry, parse query params from `request.nextUrl.searchParams` and forward typed to the proxy. Invalid params dropped silently; HA proxy enforces 1-1000 clamping.
- **D-11:** No rate-limiting or caching wrapper — consistency with existing DIRIGERA routes.

**Tests**
- **D-12:** Extend `lib/dirigera/__tests__/dirigeraProxy.test.ts` with unit tests for `getHistory`, `getStats`, `getTelemetry` — mock `haGet`, assert endpoint path, query string serialization, response pass-through.
- **D-13:** Add co-located route tests under `app/api/v1/dirigera/{history,stats,telemetry}/__tests__/route.test.ts`.

**Documentation**
- **D-14:** `docs/api/dirigera.md` already documents these endpoints fully. No doc changes unless implementation diverges.

### Claude's Discretion
- Whether to split proxy functions and routes into one plan or two (likely one).
- Exact Jest mock shape for `haGet` in new tests (follow existing patterns).
- Whether `SensorHistoryParams`/`SensorTelemetryParams` live next to response types or in a dedicated section of the same file.

### Deferred Ideas (OUT OF SCOPE)
- Migrate existing `/api/dirigera/*` routes to `/api/v1/dirigera/*`.
- Frontend UI for sensor history / telemetry charts (LineChart/AreaChart).
- Rate-limiting / caching for history/telemetry reads.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DIR-01 | GET /api/v1/dirigera/history ritorna storico eventi sensori paginato | `docs/api/dirigera.md` §History documents shape, response types already declared; reference client = `thermorossiProxy.getHistory` (URLSearchParams pattern). Route template = `app/api/v1/netatmo/getroommeasure/route.ts`. |
| DIR-02 | GET /api/v1/dirigera/stats ritorna statistiche aggregazione e retention | `docs/api/dirigera.md` §Statistics documents shape; `DirigeraStatsResponse` already declared in `types/dirigeraProxy.ts`. Zero-arg proxy call; route template = `app/api/v1/hue/health/route.ts` (zero-param proxy pattern). |
| DIR-03 | GET /api/v1/dirigera/telemetry ritorna storico telemetria sensori paginato | `docs/api/dirigera.md` §Telemetry documents shape; `SensorTelemetryResponse` already declared. Same route template as DIR-01. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **NEVER** break existing functionality — this phase only adds; no modification of existing DIRIGERA code.
- **NEVER** run `npm run build` or `npm install` — skip these in any task instructions.
- **PREFER** editing existing files over creating new — the 3 new route files are necessary (new paths); `dirigeraProxy.ts` and `types/dirigeraProxy.ts` are extended, not duplicated.
- **ALWAYS** create/update unit tests — covered by D-12 (lib tests extended) and D-13 (route tests added).
- **NEVER** commit/push without explicit request — planner should mark commits as user-gated.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5 | App Router API routes | Project framework [VERIFIED: CLAUDE.md] |
| TypeScript | strict + noUncheckedIndexedAccess | Type checking | Project standard since Phase 47 [VERIFIED: MEMORY.md] |
| `@/lib/haClient` (internal) | n/a | `haGet<T>(path, opts?)` transport | Shared across all 7 device providers [VERIFIED: lib/haClient.ts, MEMORY.md v14.0] |
| `@/lib/core` (internal) | n/a | `withAuthAndErrorHandler`, `success` | Standard middleware across all v1 routes [VERIFIED: lib/core/middleware.ts, 40+ route files] |
| Jest | project-configured | Unit + route tests | Project standard [VERIFIED: existing test files using `jest.mocked`] |

### Supporting
No new libraries. Everything required is already in the codebase.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `URLSearchParams` from object params | String template concatenation | URLSearchParams handles encoding correctly + skips falsy automatically via `append` guards. [VERIFIED: thermorossiProxy.getHistory precedent] |
| Zod validation on query params | Raw pass-through (chosen per D-10) | HA proxy is source of truth for clamping/validation; adding zod duplicates validation. Consistent with Phase 162 raw pass-through. |
| Custom route envelope | `success()` helper | `success()` is the established response shape across all v1 routes; swapping would break tests and frontend assumptions. [VERIFIED: lib/core/apiResponse.ts + all v1 routes] |

**Installation:** None required.

**Version verification:** Not applicable — no new dependencies.

## Architecture Patterns

### Recommended Project Structure
```
lib/dirigera/
├── dirigeraProxy.ts                    # APPEND 3 functions
└── __tests__/
    └── dirigeraProxy.test.ts           # EXTEND with 3 describe blocks

types/
└── dirigeraProxy.ts                    # APPEND 2 param interfaces

app/api/v1/dirigera/                    # NEW directory
├── history/
│   ├── route.ts                        # NEW
│   └── __tests__/
│       └── route.test.ts               # NEW
├── stats/
│   ├── route.ts                        # NEW
│   └── __tests__/
│       └── route.test.ts               # NEW
└── telemetry/
    ├── route.ts                        # NEW
    └── __tests__/
        └── route.test.ts               # NEW
```

### Pattern 1: Proxy client with optional query params (object argument)
**What:** A named async function that takes an optional params object, serializes non-null/undefined fields via `URLSearchParams`, and delegates to `haGet`.
**When to use:** Every DIRIGERA read endpoint that accepts query filters.
**Example:**
```typescript
// Source: Mirrors lib/stove/thermorossiProxy.ts:72-77 (URLSearchParams pattern) + D-04/D-05 (object arg)
import { haGet } from '@/lib/haClient';
import type { SensorHistoryParams, SensorHistoryResponse } from '@/types/dirigeraProxy';

/** Get paginated sensor event history from the DIRIGERA proxy. */
export async function getHistory(
  params?: SensorHistoryParams
): Promise<SensorHistoryResponse> {
  const qs = buildQueryString(params);
  const endpoint = qs ? `/api/v1/dirigera/history?${qs}` : '/api/v1/dirigera/history';
  return haGet<SensorHistoryResponse>(endpoint);
}

/** Serialize a params object to a URLSearchParams string, skipping null/undefined/empty. */
function buildQueryString(
  params?: Record<string, string | number | null | undefined>
): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue;
    sp.append(key, String(value));
  }
  return sp.toString();
}
```

### Pattern 2: Zero-arg proxy wrapper (stats)
**What:** Simplest possible wrapper — one line delegating to `haGet`.
**When to use:** `getStats()` and any endpoint with no query params.
**Example:**
```typescript
// Source: Identical to existing dirigeraProxy.ts:38-40 (getHealth pattern)
import type { DirigeraStatsResponse } from '@/types/dirigeraProxy';

/** Get DIRIGERA aggregation and retention statistics. */
export async function getStats(): Promise<DirigeraStatsResponse> {
  return haGet<DirigeraStatsResponse>('/api/v1/dirigera/stats');
}
```

### Pattern 3: Thin v1 API route with query-param forwarding
**What:** `withAuthAndErrorHandler` wraps a handler that reads `request.nextUrl.searchParams`, shapes them into the typed params object, calls the proxy, and returns `success(data)`.
**When to use:** For every route in this phase.
**Example:**
```typescript
// Source: Template is app/api/v1/netatmo/getroommeasure/route.ts (verified) + D-09/D-10
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHistory } from '@/lib/dirigera/dirigeraProxy';
import type { SensorHistoryParams } from '@/types/dirigeraProxy';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/dirigera/history
 * Returns paginated sensor event history. Query params forwarded.
 * Protected: Requires Auth0 authentication.
 */
export const GET = withAuthAndErrorHandler(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;

  // Shape: only forward present, non-empty keys
  const params: SensorHistoryParams = {};
  const sensorId = searchParams.get('sensor_id');
  const eventType = searchParams.get('event_type');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');

  if (sensorId) params.sensor_id = sensorId;
  if (eventType) params.event_type = eventType;
  if (start && !Number.isNaN(Number(start))) params.start = Number(start);
  if (end && !Number.isNaN(Number(end))) params.end = Number(end);
  if (limit && !Number.isNaN(Number(limit))) params.limit = Number(limit);
  if (offset && !Number.isNaN(Number(offset))) params.offset = Number(offset);

  const data = Object.keys(params).length > 0
    ? await getHistory(params)
    : await getHistory();

  return success(data as unknown as Record<string, unknown>);
}, 'Dirigera/History');
```

### Pattern 4: Zero-arg v1 API route (stats)
**What:** `withAuthAndErrorHandler` wraps a one-line call to the proxy.
**Example:**
```typescript
// Source: app/api/v1/hue/health/route.ts:23-26 (verified)
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getStats } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getStats();
  return success(data as unknown as Record<string, unknown>);
}, 'Dirigera/Stats');
```

### Anti-Patterns to Avoid
- **Wrapping in `PaginatedResponse<T>`** — D-08 explicitly forbids. DIRIGERA uses `events`, `telemetry`, `total` (not `items`, `total_count`).
- **Adding `try/catch` inside the handler** — `withAuthAndErrorHandler` already wraps the handler in error mapping via `withErrorHandler`. [VERIFIED: lib/core/middleware.ts:102-109, 152-154]
- **Calling `NextResponse.json(data)` directly** — all other v1 routes use `success(data)`; staying consistent keeps the frontend contract uniform. [VERIFIED: 40+ v1 route files]
- **Passing the raw `URLSearchParams` object to the proxy** — D-04 mandates a typed object argument. The thermorossi pattern passes `URLSearchParams` directly, but the CONTEXT.md decision is explicitly to use a typed object here.
- **Validating query params with Zod before forwarding** — D-10 says invalid params are dropped silently; HA proxy is the source of truth for clamping.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth check | Custom session reading | `withAuthAndErrorHandler` from `@/lib/core` | Already handles Auth0 + BYPASS_AUTH dev flag + uniform 401 response. [VERIFIED: lib/core/middleware.ts:121-135] |
| Error mapping | Custom try/catch + status codes | `withAuthAndErrorHandler` (wraps with `withErrorHandler`) | Automatically maps `ApiError` instances to RFC-9457 responses. [VERIFIED: lib/core/middleware.ts:102-109] |
| HTTP transport to HA proxy | Custom `fetch` with X-API-Key | `haGet<T>(endpoint)` from `@/lib/haClient` | Handles env config, timeouts (15s default), abort, RFC 9457 parsing, 401/429/503/conflict mapping. [VERIFIED: lib/haClient.ts:142-169] |
| Success response envelope | Custom `NextResponse.json({...})` | `success(data)` from `@/lib/core` | Uniform `{ success: true, ...data }` shape used by every v1 route. [VERIFIED: lib/core/apiResponse.ts:34-49] |
| Query-string building | Manual string concatenation | `URLSearchParams` (existing precedent) | Handles URI encoding, boolean/number coercion via `String()`, and is the established pattern. [VERIFIED: thermorossiProxy.ts:72-77] |
| Response type definitions | New interfaces | Reuse `SensorHistoryResponse`, `DirigeraStatsResponse`, `SensorTelemetryResponse` | Already declared in `types/dirigeraProxy.ts` lines 97-163 under FUTURE-PHASE TYPES. [VERIFIED: types/dirigeraProxy.ts] |

**Key insight:** The codebase has been standardized across 6+ gap-closure phases. Every primitive needed here exists and has been exercised by 200+ unit/route tests. The work in this phase is composition, not authoring.

## Common Pitfalls

### Pitfall 1: Calling `success()` with the data object
**What goes wrong:** `success()` spreads the input into the response (`{ success: true, ...data }`) — it does NOT put data under a `data` key. Tests asserting `data.data.events` will fail.
**Why it happens:** Developer assumption that `success()` wraps; it actually flattens.
**How to avoid:** Route tests assert top-level: `expect(data.events).toEqual(...)`, `expect(data.total).toBe(...)`. Cast proxy response with `data as unknown as Record<string, unknown>` to satisfy the `success()` signature (this double cast pattern is already used in other v1 routes — see `app/api/v1/thermorossi/history/route.ts:20` and `app/api/v1/sonos/zones/[groupId]/queue/route.ts:18`).
**Warning signs:** TypeScript errors complaining about `Record<string, unknown>` being incompatible with the proxy response type — resolve with the established double cast, not with a new overload. [VERIFIED: lib/core/apiResponse.ts:34-49 + existing v1 route precedents]

### Pitfall 2: Passing `URLSearchParams` directly as the proxy arg
**What goes wrong:** Thermorossi's pattern uses `URLSearchParams`; the existing proxy test mocks use string-equal assertions on the endpoint. D-04 requires a typed object, so mirroring thermorossi verbatim violates the context decision.
**Why it happens:** Easy to copy-paste the thermorossi pattern wholesale.
**How to avoid:** Define `SensorHistoryParams` / `SensorTelemetryParams` in `types/dirigeraProxy.ts` (per D-07). The proxy function accepts the object, builds the URLSearchParams internally. This is a small internal detail — D-04 binds the public contract, D-05 binds the serialization.
**Warning signs:** Route handler passes `searchParams` (URLSearchParams) straight to `getHistory(searchParams)` — refactor to shape a typed object first.

### Pitfall 3: Forgetting `export const dynamic = 'force-dynamic'`
**What goes wrong:** Next.js 15 App Router may try to statically generate or cache the route, breaking auth-gated dynamic behavior.
**Why it happens:** Omitted when copy-pasting a minimal handler.
**How to avoid:** Every existing v1 route has this export — always include it. [VERIFIED: app/api/v1/**/route.ts — all 50+ files]
**Warning signs:** Build-time warnings about dynamic usage, or route responses being cached incorrectly in production.

### Pitfall 4: Query-param parsing traps when `limit` is `0` or `"0"`
**What goes wrong:** `if (limit)` is falsy for `"0"` only if coerced; `Number("0")` is `0` and `Number.isNaN(0)` is `false`. An explicit `limit=0` would pass through and the HA proxy would clamp (per docs, valid range 1-1000).
**Why it happens:** Short-circuit `if (limit)` vs explicit `!= null` check difference.
**How to avoid:** The filter pattern `if (limit && !Number.isNaN(Number(limit)))` handles this safely — empty string is falsy, `"0"` is truthy string, `Number("0")` is valid, and the HA proxy clamps out-of-range server-side. Document the behavior in the route's JSDoc.
**Warning signs:** History returns an empty page when user passes `?limit=0` — this is actually correct upstream behavior; don't "fix" in the client.

### Pitfall 5: Running build/install from an agent task
**What goes wrong:** CLAUDE.md explicitly forbids `npm run build` and `npm install`. Executing these will violate project policy.
**Why it happens:** Default impulse for a code change.
**How to avoid:** Plan tasks must explicitly forbid these commands. Type-checking happens via existing `tsc --noEmit` in dev; tests run via `npm test` (allowed).
**Warning signs:** Task instructions include build/install steps — strike them.

### Pitfall 6: Shared describe-block state bleeding between proxy tests
**What goes wrong:** If `beforeEach(jest.clearAllMocks)` is skipped in a new describe, `mockHaGet.toHaveBeenCalledWith(...)` asserts match stale invocations.
**How to avoid:** Existing test uses top-level `beforeEach(jest.clearAllMocks)`. When extending the file, keep the structure — don't add nested describes without their own `beforeEach`. [VERIFIED: lib/dirigera/__tests__/dirigeraProxy.test.ts:103-107]

## Code Examples

### Verified existing pattern: proxy test mock shape
```typescript
// Source: lib/dirigera/__tests__/dirigeraProxy.test.ts:1-24 (VERIFIED)
jest.mock('@/lib/haClient');

import { haGet } from '@/lib/haClient';
import { getHealth, getSensors /* ... */ } from '../dirigeraProxy';

const mockHaGet = jest.mocked(haGet);

describe('dirigeraProxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getHealth() calls /api/v1/dirigera/health', async () => {
    mockHaGet.mockResolvedValueOnce(mockHealth);
    const result = await getHealth();
    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/dirigera/health');
    expect(result.firmware_version).toBe('2.465.0');
  });
});
```

### New proxy test: query-string assertion (DIR-01)
```typescript
// Source: Extends the above using the pattern from (verifiable) existing tests
const mockHistoryResponse: SensorHistoryResponse = {
  events: [
    {
      id: 1042,
      sensor_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      sensor_name: 'MYGGBETT Ingresso',
      event_type: 'open',
      recorded_at: 1773330000,
    },
  ],
  total: 1,
  limit: 100,
  offset: 0,
};

it('getHistory() without params calls /api/v1/dirigera/history (no query string)', async () => {
  mockHaGet.mockResolvedValueOnce(mockHistoryResponse);
  const result = await getHistory();
  expect(mockHaGet).toHaveBeenCalledWith('/api/v1/dirigera/history');
  expect(result.events).toHaveLength(1);
});

it('getHistory() with params builds query string, skipping null/undefined', async () => {
  mockHaGet.mockResolvedValueOnce(mockHistoryResponse);
  await getHistory({
    sensor_id: 'abc',
    event_type: 'open',
    limit: 50,
    offset: undefined, // should be skipped
    start: undefined,  // should be skipped
  });
  expect(mockHaGet).toHaveBeenCalledWith(
    '/api/v1/dirigera/history?sensor_id=abc&event_type=open&limit=50'
  );
});

it('getStats() calls /api/v1/dirigera/stats', async () => {
  const mockStats: DirigeraStatsResponse = {
    aggregation: {
      last_run_at: 1773244800,
      last_run_status: 'ok',
      rows_aggregated_last_run: 248,
      total_runs: 7,
      total_rows_aggregated: 1736,
    },
    retention: {
      last_run_at: 1773244800,
      last_run_status: 'ok',
      rows_deleted_last_run: 0,
      total_runs: 7,
      total_rows_deleted: 42,
    },
  };
  mockHaGet.mockResolvedValueOnce(mockStats);
  const result = await getStats();
  expect(mockHaGet).toHaveBeenCalledWith('/api/v1/dirigera/stats');
  expect(result.aggregation.total_runs).toBe(7);
});
```

### New route test: auth + query forwarding (DIR-01)
```typescript
// Source: Template is app/api/v1/netatmo/getroommeasure/__tests__/route.test.ts (VERIFIED)
jest.mock('@/lib/dirigera/dirigeraProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as dirigeraProxy from '@/lib/dirigera/dirigeraProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetHistory = jest.mocked(dirigeraProxy.getHistory);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

const mockHistoryData = {
  events: [
    { id: 1, sensor_id: 'abc', sensor_name: 'Door', event_type: 'open', recorded_at: 1 },
  ],
  total: 1,
  limit: 100,
  offset: 0,
};

describe('GET /api/v1/dirigera/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/dirigera/history');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with history data when authenticated (no query params)', async () => {
    mockGetHistory.mockResolvedValue(mockHistoryData as any);
    const request = new Request('http://localhost:3000/api/v1/dirigera/history');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.events).toEqual(mockHistoryData.events);
    expect(data.total).toBe(1);
    expect(mockGetHistory).toHaveBeenCalledWith();
  });

  it('forwards typed query params to proxy', async () => {
    mockGetHistory.mockResolvedValue(mockHistoryData as any);
    const request = new Request(
      'http://localhost:3000/api/v1/dirigera/history?sensor_id=abc&event_type=open&limit=50&offset=10'
    );
    await GET(request as any, {} as any);
    expect(mockGetHistory).toHaveBeenCalledWith({
      sensor_id: 'abc',
      event_type: 'open',
      limit: 50,
      offset: 10,
    });
  });

  it('drops invalid numeric params silently', async () => {
    mockGetHistory.mockResolvedValue(mockHistoryData as any);
    const request = new Request(
      'http://localhost:3000/api/v1/dirigera/history?limit=not-a-number'
    );
    await GET(request as any, {} as any);
    // Handler called with empty object (no numeric params survived the isNaN check)
    expect(mockGetHistory).toHaveBeenCalledWith();
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Object export with methods (Fritz!Box style: `fritzboxClient.getX()`) | Named function exports (DIRIGERA style: `import { getX }`) | Phase 130 (DIRIGERA infrastructure) | Consistent within DIRIGERA module; don't switch styles here. |
| Positional args for optional filters | Single typed object arg (this phase, D-04) | Phase 163 | Scales past 2-3 params cleanly, per Sonos/Automations precedent. |
| Raw-pass-through vs envelope | Raw pass-through via `success(data)` flattening | Phase 162 | Field names (`events`, `telemetry`, `total`) are stable API contract from `docs/api/dirigera.md`. |

**Deprecated/outdated:**
- None. DIRIGERA module has only existed since Phase 130 and all patterns are current.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | HA proxy returns the exact shape documented in `docs/api/dirigera.md` §History/Statistics/Telemetry (verified against TypeScript declarations in `types/dirigeraProxy.ts`, which were prospectively aligned during Phase 130) | Standard Stack, Runtime State | If HA proxy drifts from docs, type-cast responses may runtime-mismatch. Mitigation: existing test pattern uses typed fixtures — any drift surfaces on first real call. [ASSUMED based on documented spec + Phase 130 type scaffolding; no integration test in this phase] |

**Integration verification:** This research did not issue a live call to the HA proxy — all shape data comes from `docs/api/dirigera.md` and the pre-declared TypeScript interfaces. Execution phase should include at least a manual smoke test against staging before merging.

## Runtime State Inventory

**Not applicable** — this phase is additive greenfield (3 new routes, 3 new proxy functions, 2 new param interfaces). No rename, refactor, or migration of existing state. Explicitly:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no database schema changes | None |
| Live service config | None — HA proxy endpoints already exist upstream | None |
| OS-registered state | None | None |
| Secrets/env vars | None — reuses existing `HA_API_URL` / `HA_API_KEY` | None |
| Build artifacts | None — no compiled outputs affected | None |

## Environment Availability

**Not applicable** — this phase is pure code + config changes within the existing Next.js + Jest toolchain. No new external tools, services, or runtimes are required.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js + Next.js dev server | Route handlers | ✓ | Next.js 15.5 | — |
| Jest | Unit + route tests | ✓ | project-configured | — |
| HA proxy (runtime) | Integration (not research) | Assumed reachable via `HA_API_URL` | per deployment | Tests mock `haGet` — no live proxy needed for verification. |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (project-configured in `jest.config.js`) |
| Config file | `jest.config.js` (exists — confirmed by Phase 92 baseline and 3012+ passing tests across v11.1) |
| Quick run command | `npm test -- lib/dirigera/__tests__/dirigeraProxy.test.ts app/api/v1/dirigera` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| DIR-01 | `getHistory()` proxy no-params call | unit | `npm test -- lib/dirigera/__tests__/dirigeraProxy.test.ts -t "getHistory.*no.*params"` | ❌ Wave 0 (extend existing file) |
| DIR-01 | `getHistory()` proxy with-params serialization + skip null | unit | `npm test -- lib/dirigera/__tests__/dirigeraProxy.test.ts -t "getHistory.*query string"` | ❌ Wave 0 (extend existing file) |
| DIR-01 | `GET /api/v1/dirigera/history` 401 when unauthenticated | route | `npm test -- app/api/v1/dirigera/history -t "401"` | ❌ Wave 0 (new file) |
| DIR-01 | `GET /api/v1/dirigera/history` 200 + top-level `events[]`/`total` fields | route | `npm test -- app/api/v1/dirigera/history -t "200"` | ❌ Wave 0 (new file) |
| DIR-01 | `GET /api/v1/dirigera/history` forwards typed query params | route | `npm test -- app/api/v1/dirigera/history -t "query params"` | ❌ Wave 0 (new file) |
| DIR-01 | `GET /api/v1/dirigera/history` drops invalid numerics | route | `npm test -- app/api/v1/dirigera/history -t "invalid"` | ❌ Wave 0 (new file) |
| DIR-02 | `getStats()` proxy call path assertion | unit | `npm test -- lib/dirigera/__tests__/dirigeraProxy.test.ts -t "getStats"` | ❌ Wave 0 (extend existing file) |
| DIR-02 | `GET /api/v1/dirigera/stats` 401 + 200 | route | `npm test -- app/api/v1/dirigera/stats` | ❌ Wave 0 (new file) |
| DIR-03 | `getTelemetry()` proxy no-params + with-params (same shape as DIR-01) | unit | `npm test -- lib/dirigera/__tests__/dirigeraProxy.test.ts -t "getTelemetry"` | ❌ Wave 0 (extend existing file) |
| DIR-03 | `GET /api/v1/dirigera/telemetry` 401 + 200 + query forwarding | route | `npm test -- app/api/v1/dirigera/telemetry` | ❌ Wave 0 (new file) |

### Sampling Rate
- **Per task commit:** `npm test -- lib/dirigera app/api/v1/dirigera` (target tests only; < 10s locally).
- **Per wave merge:** `npm test -- lib/dirigera app/api/v1/dirigera` + a broader smoke (`npm test -- lib app/api/v1`) to catch mock bleed.
- **Phase gate:** Full suite green before `/gsd-verify-work` — matches the v11.1 standard where `npm test` runs the full ~3000-test suite.

### Wave 0 Gaps
- [ ] `lib/dirigera/__tests__/dirigeraProxy.test.ts` — extend with 3 describe blocks (getHistory, getStats, getTelemetry); file already exists.
- [ ] `app/api/v1/dirigera/history/__tests__/route.test.ts` — new file.
- [ ] `app/api/v1/dirigera/stats/__tests__/route.test.ts` — new file.
- [ ] `app/api/v1/dirigera/telemetry/__tests__/route.test.ts` — new file.
- [ ] Framework install: N/A — Jest already configured.

All test infrastructure (auth0 mock factory, `jest.mocked` helper, `jest.clearAllMocks` in `beforeEach`, console silencing) is established and reused verbatim from the reference templates.

### Security Domain

Project does not have an explicit `security_enforcement` flag in `.planning/config.json`. Treating as enabled.

**Applicable ASVS Categories:**

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Auth0 session check via `withAuthAndErrorHandler` → `withAuth` → `auth0.getSession(request)`. 401 on missing session. [VERIFIED: lib/core/middleware.ts:121-135] |
| V3 Session Management | yes (inherited) | Auth0-managed; no new session handling. |
| V4 Access Control | no | No per-user authorization rules — any authenticated user can read DIRIGERA diagnostics (consistent with all other DIRIGERA routes). |
| V5 Input Validation | yes (pass-through) | Query params parsed as strings, coerced to numbers with `Number.isNaN` guards; invalid params silently dropped (D-10). HA proxy is authoritative for range clamping (limit 1-1000). |
| V6 Cryptography | no | No crypto operations; `HA_API_KEY` is read from env and never logged. [VERIFIED: haClient.ts] |

**Known Threat Patterns for Next.js API routes + HA proxy transport:**

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Auth bypass via missing middleware | Spoofing | Use `withAuthAndErrorHandler` — never `withErrorHandler` alone on protected routes. |
| Open redirect / SSRF via query params | Tampering | Proxy path is hard-coded (`/api/v1/dirigera/*`); user input only fills query string, never the path. [VERIFIED: proposed client pattern] |
| API key leakage in logs | Information Disclosure | `haGet` sets `X-API-Key` header only; never logged or echoed. [VERIFIED: lib/haClient.ts:152-156] |
| Unbounded pagination abuse | Denial of Service | HA proxy clamps `limit` to 1-1000 per docs. No client-side enforcement needed. |
| Stack trace / internal error leakage | Information Disclosure | `withErrorHandler` → `handleError` sanitizes; `ApiError` is mapped to RFC 9457 format. |

No new attack surface beyond what already exists for `/api/dirigera/sensors`. The phase is strictly additive.

## Open Questions (RESOLVED)

1. **Should `SensorHistoryParams` live in a dedicated section or next to `SensorHistoryResponse`?** — **RESOLVED:** Place each param interface immediately before its corresponding response type. Adopted in Task 1 of `163-01-PLAN.md` per D-07 placement guidance. Locality > separation for small modules.

2. **One plan or two for this phase?** — **RESOLVED:** One plan (`163-01-PLAN.md`). Surface area is 9 files total (2 edits + 7 new), all tightly coupled, zero cross-plan dependencies. Confirmed in CONTEXT.md Claude's Discretion.

3. **Should the proxy's `buildQueryString` helper be module-local or exported?** — **RESOLVED:** Module-local (not exported). Avoids expanding the public surface; if a second consumer later needs the same logic, promote then. Adopted in Task 1 of `163-01-PLAN.md`.

## Sources

### Primary (HIGH confidence)
- `lib/haClient.ts:142-169` — `haGet` signature and error mapping behavior
- `lib/core/middleware.ts:102-154` — `withAuthAndErrorHandler` + `withErrorHandler` source
- `lib/core/apiResponse.ts:34-49` — `success()` flattening behavior (`{ success: true, ...data }`)
- `lib/dirigera/dirigeraProxy.ts` — current 5-function module, append pattern
- `lib/dirigera/__tests__/dirigeraProxy.test.ts` — exact Jest mock setup pattern
- `types/dirigeraProxy.ts:97-163` — pre-declared FUTURE-PHASE TYPES (SensorEvent, SensorHistoryResponse, DirigeraStatsResponse, SensorTelemetryReading, SensorTelemetryResponse, AggregationStats, RetentionStats)
- `app/api/dirigera/sensors/route.ts` — reference for old-style DIRIGERA route (uses `success({ sensors, count, is_stale })`)
- `app/api/v1/netatmo/getroommeasure/route.ts` + `__tests__/route.test.ts` — literal template for history/telemetry (query params + no path params)
- `app/api/v1/hue/health/route.ts` + `__tests__/route.test.ts` — literal template for stats (zero-arg)
- `app/api/v1/thermorossi/history/route.ts` + `lib/stove/thermorossiProxy.ts:67-77` — URLSearchParams serialization precedent
- `app/api/v1/sonos/zones/[groupId]/queue/route.ts` — additional query-param forwarding precedent
- `docs/api/dirigera.md` §History, §Statistics, §Telemetry — authoritative response shapes
- `.planning/phases/162-fritz-box-gap-closure/162-CONTEXT.md` — raw pass-through precedent

### Secondary (MEDIUM confidence)
- None — all evidence is verified in-repo.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all primitives verified by reading source + 40+ existing v1 route files.
- Architecture: HIGH — four distinct working templates exist in-repo (netatmo/getroommeasure, hue/health, thermorossi/history, sonos/queue).
- Pitfalls: HIGH — `success()` spread behavior, double-cast idiom, and `jest.clearAllMocks` requirement all verified against working code.
- Integration: MEDIUM (A1) — HA proxy response shapes are asserted by spec + prospective TypeScript declarations but not live-tested in this research pass.

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (30 days — stable infrastructure, no external dependency version risk)
