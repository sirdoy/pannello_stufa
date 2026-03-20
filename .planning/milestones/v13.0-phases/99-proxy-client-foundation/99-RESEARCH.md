# Phase 99: Proxy Client Foundation - Research

**Researched:** 2026-03-19
**Domain:** TypeScript proxy client module + Next.js API route migration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Client pattern:**
- Function module at `lib/thermorossiProxy.ts` — identical pattern to `lib/netatmoProxy.ts`
- Import `haGet` from `lib/haClient.ts` — X-API-Key auth handled by shared transport
- Convenience wrappers: `getStatus()`, `getPower()`, `getFan()`, `getHealth()`
- No retry logic in the proxy client — `haClient.ts` handles timeouts, the HA proxy handles retries to WiNet

**Type definitions:**
- Separate types file at `types/thermorossiProxy.ts` — matches `types/netatmoProxy.ts` pattern
- Interfaces defined per API doc spec: `ThermorossiStatusResponse`, `ThermorossiPowerResponse`, `ThermorossiFanResponse`, `ThermorossiHealthResponse`
- Also define `ThermorossiCommandResponse` (202 Accepted shape) and `ThermorossiHistoryResponse`/`ThermorossiHistoryItem` now — Phase 100 will use them
- `stove_state` typed as union literal: `"off" | "igniting" | "working" | "standby" | "cleaning" | "alarm" | "modulating"`
- `data_freshness` typed as `"LIVE" | "STALE"` (UNREACHABLE triggers 503, never appears in response body)

**API route migration:**
- Keep existing route paths: `/api/stove/status`, `/api/stove/getPower`, `/api/stove/getFan`
- Each route handler calls the new proxy convenience wrapper instead of `lib/stoveApi.ts`
- Routes return the proxy response shape directly (new shape replaces old WiNet shape)
- Health route: new `/api/stove/health` route (or update existing health check path)
- `export const dynamic = 'force-dynamic'` on all routes

**Error handling:**
- RFC 9457 errors from proxy mapped to ApiError via haClient's `mapResponseError()`
- 503 from proxy (UNREACHABLE) → pass through as 503 to frontend
- No custom error mapping needed in the proxy client — haClient covers all cases

### Claude's Discretion
- Whether to add `getHistory()` convenience wrapper now or defer to Phase 100
- Exact JSDoc comment style on convenience wrappers
- Whether to create a barrel export or keep direct imports

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLIENT-01 | Thermorossi proxy client uses shared `haGet`/`haPost` transport with X-API-Key auth | `lib/haClient.ts` is the established transport; `lib/netatmoProxy.ts` is the direct template |
| CLIENT-02 | TypeScript types for all proxy response interfaces (status, power, fan, history, command, health) | `docs/api/thermorossi.md` contains all interface definitions verbatim; `types/netatmoProxy.ts` is the file structure template |
| CLIENT-03 | Convenience wrappers for each endpoint (getStatus, getPower, getFan, getHealth, getHistory) | `lib/netatmoProxy.ts` provides exact wrapper shape; getHistory scope is Claude's discretion |
| READ-01 | GET /status migrated to proxy — returns stove_state, power_level, fan_level, data_freshness, error_code, error_description | `app/api/stove/status/route.ts` currently calls `getStoveStatus()` — swap to `getStatus()` from new proxy client |
| READ-02 | GET /power migrated to proxy — returns power_level with data_freshness | `app/api/stove/getPower/route.ts` currently calls `getPowerLevel()` — swap to `getPower()` |
| READ-03 | GET /fan-level migrated to proxy — returns fan_level with data_freshness | `app/api/stove/getFan/route.ts` currently calls `getFanLevel()` — swap to `getFan()` |
| READ-04 | GET /health migrated to proxy — returns provider health and cache freshness | New route at `app/api/stove/health/route.ts` — no existing health route for stove |
</phase_requirements>

---

## Summary

Phase 99 is a pure proxy client scaffolding and API route migration task. The pattern is well-established in this codebase: `lib/netatmoProxy.ts` and `lib/raspiClient.ts` both follow the exact function-module pattern over `haGet`/`haPost`. The TypeScript interfaces are fully specified in `docs/api/thermorossi.md` — no guesswork needed.

The migration replaces three existing route handlers that call `lib/stoveApi.ts` (direct WiNet cloud client with sandbox mode and retry logic) with thin wrappers that delegate to the new `lib/thermorossiProxy.ts`. A fourth new route (`/api/stove/health`) must be created. The existing routes' paths are preserved so no frontend changes are needed in this phase.

The only design decision left to Claude is whether to include `getHistory()` in the proxy client now (types are being defined anyway; the wrapper is a one-liner) or defer it to Phase 100. Given that Phase 100 will immediately use it, including it now avoids a one-line change between phases.

**Primary recommendation:** Model `lib/thermorossiProxy.ts` exactly after `lib/netatmoProxy.ts`. Copy types verbatim from `docs/api/thermorossi.md`. Migrate three routes by replacing the import + call, create one new route. Include `getHistory()` wrapper now since the types are already being defined.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lib/haClient.ts` | project-local | Shared GET/POST transport with X-API-Key, timeout, RFC 9457 error mapping | All providers (Fritz!Box, Netatmo, Raspi) use this — no new fetch code needed |
| `lib/core/apiErrors.ts` | project-local | `ApiError`, `ERROR_CODES`, `HTTP_STATUS` | Used by every API route handler in the project |
| `lib/core` (withAuthAndErrorHandler, success) | project-local | Route handler wrapper with Auth0 auth + error boundary | Used by all 13 existing stove routes |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `types/netatmoProxy.ts` | project-local | Template for types file structure | Direct structural reference for `types/thermorossiProxy.ts` |
| `lib/netatmoProxy.ts` | project-local | Template for proxy client module | Direct structural reference for `lib/thermorossiProxy.ts` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Function module | Class with state | No state needed — function module is project standard |
| Separate types file | Inline types in proxy client | Separate file is project standard; types also used by route handlers |
| Direct `haGet` import | Re-implementing fetch | haClient already handles all edge cases |

**Installation:** No new packages required. All dependencies are project-local.

---

## Architecture Patterns

### Recommended File Structure

```
lib/
└── thermorossiProxy.ts     # New: convenience wrappers over haGet/haPost

types/
└── thermorossiProxy.ts     # New: all proxy response + request interfaces

app/api/stove/
├── status/route.ts         # Migrate: getStoveStatus() → getStatus()
├── getPower/route.ts       # Migrate: getPowerLevel() → getPower()
├── getFan/route.ts         # Migrate: getFanLevel() → getFan()
└── health/route.ts         # New: getHealth() → success(data)

__tests__/lib/
└── thermorossiProxy.test.ts  # New: mirror netatmoProxy.test.ts structure
```

### Pattern 1: Function Module Proxy Client

**What:** A module that exports named async functions, each wrapping a single `haGet` call with the correct endpoint path and return type.
**When to use:** All proxy clients in this project use this pattern.

```typescript
// lib/thermorossiProxy.ts — Source: lib/netatmoProxy.ts (project reference)
import { haGet } from '@/lib/haClient';
import type {
  ThermorossiStatusResponse,
  ThermorossiPowerResponse,
  ThermorossiFanResponse,
  ThermorossiHealthResponse,
  ThermorossiHistoryResponse,
} from '@/types/thermorossiProxy';

/**
 * Get combined stove telemetry (state, power, fan, freshness, errors).
 * Calls GET /api/v1/thermorossi/status on the HA proxy.
 */
export async function getStatus(): Promise<ThermorossiStatusResponse> {
  return haGet<ThermorossiStatusResponse>('/api/v1/thermorossi/status');
}

export async function getPower(): Promise<ThermorossiPowerResponse> {
  return haGet<ThermorossiPowerResponse>('/api/v1/thermorossi/power');
}

export async function getFan(): Promise<ThermorossiFanResponse> {
  return haGet<ThermorossiFanResponse>('/api/v1/thermorossi/fan-level');
}

export async function getHealth(): Promise<ThermorossiHealthResponse> {
  return haGet<ThermorossiHealthResponse>('/api/v1/thermorossi/health');
}

// Optional: include now since types are defined and Phase 100 needs it
export async function getHistory(params?: URLSearchParams): Promise<ThermorossiHistoryResponse> {
  const endpoint = params
    ? `/api/v1/thermorossi/history?${params.toString()}`
    : '/api/v1/thermorossi/history';
  return haGet<ThermorossiHistoryResponse>(endpoint);
}
```

### Pattern 2: Types File — Verbatim from API Spec

**What:** All proxy response interfaces defined in a separate `types/thermorossiProxy.ts`. Interfaces are copied directly from `docs/api/thermorossi.md` — the spec is the source of truth.

**Key type details from the spec:**

```typescript
// types/thermorossiProxy.ts — Source: docs/api/thermorossi.md

export type StoveState =
  | 'off' | 'igniting' | 'working' | 'standby'
  | 'cleaning' | 'alarm' | 'modulating';

export type DataFreshness = 'LIVE' | 'STALE';
// Note: UNREACHABLE triggers 503 — never appears in response body

export interface ThermorossiStatusResponse {
  stove_state: StoveState;
  power_level: number | null;       // 1-5
  fan_level: number | null;         // 1-6
  data_freshness: DataFreshness;
  last_poll_at: string | null;      // ISO 8601
  error_code: number | null;        // only when stove_state === 'alarm'
  error_description: string | null; // only when stove_state === 'alarm'
}

export interface ThermorossiPowerResponse {
  power_level: number | null;       // 1-5
  data_freshness: DataFreshness;
  last_poll_at: string | null;
}

export interface ThermorossiFanResponse {
  fan_level: number | null;         // 1-6
  data_freshness: DataFreshness;
  last_poll_at: string | null;
}

export interface ThermorossiHealthResponse {
  status: 'ok' | 'degraded';
  data_freshness: DataFreshness;
  last_poll_at: string | null;
}

// 202 Accepted shape (for Phase 100 — define now)
export interface ThermorossiCommandResponse {
  command: string;
  status: 'accepted';
  previous_state: StoveState;
  suggested_poll_delay_s: number;
  poll_endpoint: string;
  requested_value: number | null;
}

// History types (for Phase 100 — define now)
export interface ThermorossiHistoryItem {
  timestamp: number;
  stove_state: string | null;
  power_level: number | null;
  fan_level: number | null;
  avg_power_level: number | null;
  min_power_level: number | null;
  max_power_level: number | null;
  avg_fan_level: number | null;
  min_fan_level: number | null;
  max_fan_level: number | null;
  working_minutes: number | null;
  sample_count: number | null;
}

export interface ThermorossiHistoryResponse {
  items: ThermorossiHistoryItem[];
  total_count: number;
  limit: number;
  offset: number;
  granularity: 'raw' | 'hourly' | 'daily';
}
```

### Pattern 3: Migrated Route Handler

**What:** Replace the `lib/stoveApi.ts` import and call with the new proxy wrapper. Keep `withAuthAndErrorHandler` + `success()` pattern. Add `export const dynamic = 'force-dynamic'`.

**Existing routes are currently missing `export const dynamic = 'force-dynamic'`** — this must be added during migration.

```typescript
// app/api/stove/status/route.ts — after migration
// Source: app/api/netatmo/health/route.ts (project reference)

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getStatus } from '@/lib/thermorossiProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stove/status
 * Returns combined stove telemetry from the HA proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getStatus();
  return success(data as unknown as Record<string, unknown>);
}, 'Stove/Status');
```

```typescript
// app/api/stove/health/route.ts — new file
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHealth } from '@/lib/thermorossiProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stove/health
 * Returns Thermorossi proxy health and cache freshness.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Stove/Health');
```

### Anti-Patterns to Avoid

- **Retry logic in the proxy client:** haClient handles timeouts; the HA proxy handles WiNet retries. Adding retry in the proxy client creates double-retry behavior.
- **Inline type definitions:** Types must be in `types/thermorossiProxy.ts` so route handlers can import them independently.
- **UNREACHABLE in DataFreshness union:** The proxy returns 503 on UNREACHABLE — it never appears in the JSON body. `DataFreshness = 'LIVE' | 'STALE'` only (unlike `types/netatmoProxy.ts` which incorrectly includes UNREACHABLE).
- **Missing `export const dynamic = 'force-dynamic'`:** The three existing stove read routes are missing this directive. It must be added during migration (see Pitfall 2).
- **Keeping `lib/stoveApi.ts` imports:** After migration, route files must import from `lib/thermorossiProxy.ts`, not `lib/stoveApi.ts`. Phase 103 deletes stoveApi.ts, so dangling imports would break then.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP fetch with timeout | Custom fetch wrapper | `haGet` from `lib/haClient.ts` | Already handles AbortController, X-API-Key header, RFC 9457 error mapping |
| RFC 9457 error parsing | Custom error parser | `mapResponseError` inside haClient (called automatically) | All error mapping is done transparently |
| Auth header injection | Manual header construction | `haGet`/`haPost` (reads HA_API_KEY env var) | Consistent with all other providers |
| TypeScript generics for response | Any cast | `haGet<ThermorossiStatusResponse>(endpoint)` | Type safety at compile time |

**Key insight:** The haClient + function-module pattern already solves every plumbing concern. The proxy client is literally just named wrappers over `haGet`.

---

## Common Pitfalls

### Pitfall 1: UNREACHABLE in DataFreshness type

**What goes wrong:** Including `'UNREACHABLE'` in the `DataFreshness` union (copying from `types/netatmoProxy.ts` which has it).
**Why it happens:** The Netatmo proxy type file includes `'UNREACHABLE'` as a documented value. The Thermorossi proxy spec explicitly states UNREACHABLE triggers HTTP 503 and never appears in the response body.
**How to avoid:** Define `DataFreshness = 'LIVE' | 'STALE'` — two values only. Document why in the JSDoc comment.
**Warning signs:** If a test passes mock data with `data_freshness: 'UNREACHABLE'` without TypeScript error.

### Pitfall 2: Missing `export const dynamic = 'force-dynamic'`

**What goes wrong:** Existing stove routes (`status`, `getPower`, `getFan`) do not have `export const dynamic = 'force-dynamic'`. After migration, without this directive, Next.js may cache the route or throw a build warning about dynamic server usage.
**Why it happens:** The original WiNet routes predate the project convention of adding this to all API routes.
**How to avoid:** Add `export const dynamic = 'force-dynamic'` to all three migrated routes and the new health route.
**Warning signs:** Build output shows static route warnings for stove endpoints.

### Pitfall 3: Proxy path mismatch

**What goes wrong:** Using the wrong base path. The HA proxy serves thermorossi at `/api/v1/thermorossi/` — not `/api/thermorossi/` and not `/stove/`.
**Why it happens:** Confusion between the Next.js app's own route paths (`/api/stove/*`) and the upstream HA proxy paths (`/api/v1/thermorossi/*`).
**How to avoid:** All `haGet` calls in `lib/thermorossiProxy.ts` use `/api/v1/thermorossi/{endpoint}`. The Next.js routes remain at `/api/stove/{endpoint}` (frontend-facing paths are unchanged).
**Warning signs:** 404 responses from the HA proxy.

### Pitfall 4: `/commands/ignit` URL vs `"ignite"` in response

**What goes wrong:** Creating a POST wrapper with path `/api/v1/thermorossi/commands/ignite` (with trailing `e`).
**Why it happens:** The API spec explicitly notes: "the URL path is `/commands/ignit` (no trailing `e`); the response body uses `"command": "ignite"`".
**How to avoid:** Use `/api/v1/thermorossi/commands/ignit` as the path. This is a Phase 100 concern but worth noting in the types file JSDoc.

### Pitfall 5: `withAuthAndErrorHandler` wraps errors already thrown as ApiError

**What goes wrong:** Adding try/catch inside the route handler when `withAuthAndErrorHandler` already catches and formats errors.
**Why it happens:** Porting the error-handling pattern from the old `lib/stoveApi.ts` routes which had explicit catches.
**How to avoid:** The migrated routes should be as thin as the netatmo health route: call wrapper, return `success(data)`. No try/catch needed — `withAuthAndErrorHandler` handles it.

---

## Code Examples

Verified patterns from project source code:

### Thin Route Handler (reference: app/api/netatmo/health/route.ts)

```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyHealth } from '@/lib/netatmoProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getProxyHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Netatmo/Health');
```

### haGet with type parameter (reference: lib/netatmoProxy.ts)

```typescript
export async function getProxyHomestatus(): Promise<NetatmoProxyHomestatusResponse> {
  return haGet<NetatmoProxyHomestatusResponse>('/api/v1/netatmo/homestatus');
}
```

### haGet with query parameters (reference: lib/netatmoProxy.ts)

```typescript
export async function getProxyRoomMeasure(params: URLSearchParams): Promise<RoomMeasureResponse> {
  return haGet<RoomMeasureResponse>(`/api/v1/netatmo/getroommeasure?${params.toString()}`);
}
```

### Test pattern for proxy convenience wrapper (reference: __tests__/lib/netatmoProxy.test.ts)

```typescript
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('haGet transport (via getStatus)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HA_API_URL = 'https://proxy.example.com';
    process.env.HA_API_KEY = 'test-api-key-12345';
  });

  afterEach(() => {
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  it('calls the correct full URL', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await getStatus();
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://proxy.example.com/api/v1/thermorossi/status');
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct WiNet cloud calls (`lib/stoveApi.ts`) | HA proxy client (`lib/thermorossiProxy.ts`) | v13.0 Phase 99 | Stove data served from 60s cache; no direct internet calls from PWA |
| `StatusDescription` string for state matching | `stove_state` literal union | v13.0 Phase 99 | Exact equality checks replace substring matching |
| Sandbox mode + retry in stoveApi | No retry in proxy client | v13.0 Phase 99 | haClient handles timeouts; HA proxy handles WiNet retries |
| Routes without `force-dynamic` | `export const dynamic = 'force-dynamic'` | v13.0 Phase 99 | Consistent with all other dynamic API routes |

**Deprecated/outdated in this phase:**
- `lib/stoveApi.ts` imports in the four migrated routes (replaced by `lib/thermorossiProxy.ts`)
- Sandbox mode check in route handlers (proxy handles data source abstraction)

---

## Open Questions

1. **Should `getHistory()` be included in Phase 99 or deferred to Phase 100?**
   - What we know: `ThermorossiHistoryResponse`/`ThermorossiHistoryItem` types are being defined in this phase regardless. The wrapper is a ~5-line function.
   - What's unclear: Phase 100 scope may be large enough that adding one more function now simplifies it.
   - Recommendation: Include `getHistory()` now. The types are already defined; the wrapper is trivial; Phase 100 benefits from finding it ready.

2. **Health route path: `/api/stove/health` or something else?**
   - What we know: No existing stove health route. The CONTEXT.md says "new `/api/stove/health` route (or update existing health check path)".
   - What's unclear: Whether there is a broader `/api/health` check that already exists and might conflict.
   - Recommendation: Create `app/api/stove/health/route.ts` at `/api/stove/health` — consistent with the netatmo pattern (`/api/netatmo/health`).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (project-wide) |
| Config file | `jest.config.js` (project root) |
| Quick run command | `npm test -- --testPathPattern="thermorossiProxy" --no-coverage` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLIENT-01 | `getStatus()` sends X-API-Key header | unit | `npm test -- --testPathPattern="thermorossiProxy" --no-coverage` | ❌ Wave 0 |
| CLIENT-01 | `getStatus()` calls `/api/v1/thermorossi/status` | unit | same | ❌ Wave 0 |
| CLIENT-02 | `ThermorossiStatusResponse` type compiles | type-check | `npx tsc --noEmit` | ❌ Wave 0 |
| CLIENT-03 | `getPower()`, `getFan()`, `getHealth()` wrappers return typed responses | unit | same as CLIENT-01 | ❌ Wave 0 |
| READ-01 | Status route returns proxy response shape | unit | `npm test -- --testPathPattern="stove/status" --no-coverage` | ❌ Wave 0 |
| READ-02 | Power route returns proxy response shape | unit | `npm test -- --testPathPattern="stove/getPower" --no-coverage` | ❌ Wave 0 |
| READ-03 | Fan route returns proxy response shape | unit | `npm test -- --testPathPattern="stove/getFan" --no-coverage` | ❌ Wave 0 |
| READ-04 | Health route returns proxy health shape | unit | `npm test -- --testPathPattern="stove/health" --no-coverage` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="thermorossiProxy" --no-coverage`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `__tests__/lib/thermorossiProxy.test.ts` — covers CLIENT-01, CLIENT-03 (mirror of `__tests__/lib/netatmoProxy.test.ts`)
- [ ] `__tests__/app/api/stove/status.test.ts` — covers READ-01
- [ ] `__tests__/app/api/stove/getPower.test.ts` — covers READ-02
- [ ] `__tests__/app/api/stove/getFan.test.ts` — covers READ-03
- [ ] `__tests__/app/api/stove/health.test.ts` — covers READ-04

---

## Sources

### Primary (HIGH confidence)

- `lib/haClient.ts` — Complete transport implementation: `haGet`, `haPost`, env var validation, RFC 9457 error mapping
- `lib/netatmoProxy.ts` — Reference proxy client: exact structural template for `lib/thermorossiProxy.ts`
- `types/netatmoProxy.ts` — Reference types file: structural template for `types/thermorossiProxy.ts`
- `docs/api/thermorossi.md` — Authoritative Thermorossi proxy API spec: all 10 endpoints, response interfaces, state mapping table (live-verified 2026-03-18)
- `docs/api/README.md` — HA proxy auth (X-API-Key), RFC 9457 error format
- `lib/core/apiErrors.ts` — ApiError class, ERROR_CODES, HTTP_STATUS constants
- `app/api/stove/status/route.ts`, `getPower/route.ts`, `getFan/route.ts` — Existing routes being migrated
- `app/api/netatmo/health/route.ts` — Reference thin route handler pattern
- `__tests__/lib/netatmoProxy.test.ts` — Reference test file structure

### Secondary (MEDIUM confidence)

- `.planning/phases/99-proxy-client-foundation/99-CONTEXT.md` — User decisions verified against existing code patterns

### Tertiary (LOW confidence)

None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components are project-local with direct reference implementations
- Architecture: HIGH — interfaces are verbatim from live-verified API spec; code patterns are direct copies of established project patterns
- Pitfalls: HIGH — identified from direct code inspection of existing routes and spec notes

**Research date:** 2026-03-19
**Valid until:** Stable indefinitely — all sources are project-local; no external dependency versions involved
