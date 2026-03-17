# Phase 88: Raspberry Pi API Layer - Research

**Researched:** 2026-03-17
**Domain:** Next.js API routes + TypeScript proxy client for Raspberry Pi system stats
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Client module structure**
- Function module pattern with exported convenience wrappers calling `haGet` internally — matches Fritz!Box (Phase 85) and Netatmo (Phase 86) patterns
- Export as object with methods: `raspiClient.getHealth()`, `raspiClient.getCpu()`, `raspiClient.getMemory()`, `raspiClient.getDisk()`, `raspiClient.getSystem()`
- File location: `lib/raspi/raspiClient.ts` with barrel `lib/raspi/index.ts`
- No response transformation needed — Raspberry Pi API responses are already clean
- All endpoints are GET-only (no POST needed for Raspberry Pi)

**API route design**
- 5 routes matching the 5 HA proxy endpoints: health, cpu, memory, disk, system
- Route path: `/api/raspi/[endpoint]` — consistent with `/api/fritzbox/` and `/api/netatmo/` patterns
- All routes use `withAuthAndErrorHandler` wrapper and `success()` response helper
- All routes set `export const dynamic = 'force-dynamic'` (live data, no caching)
- No caching layer needed (live data via psutil, no database)
- No rate limiting needed (local to HA server, no external API throttling)

**Type organization**
- Types file: `types/raspi.ts`
- Interfaces: `RaspiHealthResponse`, `CpuResponse`, `MemoryResponse`, `DiskResponse`, `SystemResponse`, `NetworkStats`
- All match API response schemas from `docs/api/raspberry-pi.md` exactly

**Health endpoint behavior**
- Minimal transformation — return status and data_freshness
- Consistent with Fritz!Box health route pattern

### Claude's Discretion
- Whether to include a `ping()` convenience method (like Fritz!Box) or just use `getHealth()`
- Exact error messages for Raspberry Pi-specific failures
- Whether routes need any response enrichment beyond raw proxy data

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RASPI-01 | Proxy client functions for all 4 Raspberry Pi endpoints (health, cpu, memory, disk, system) | `haGet<T>` transport in `lib/haClient.ts` is ready; function module pattern confirmed in `lib/fritzbox/fritzboxClient.ts` |
| RASPI-02 | TypeScript types matching API response schemas | All 5 interfaces fully specified in `docs/api/raspberry-pi.md`; pattern mirrors `types/netatmoProxy.ts` and `types/haClient.ts` |
| RASPI-03 | Next.js API routes proxying Raspberry Pi endpoints | Route pattern confirmed in `app/api/fritzbox/health/route.ts` and `app/api/fritzbox/wan/route.ts`; `withAuthAndErrorHandler` + `success()` + `force-dynamic` |
</phase_requirements>

---

## Summary

Phase 88 is a mechanical replication of the Fritz!Box client layer (Phase 85) for a new provider: Raspberry Pi. The shared transport (`haGet` in `lib/haClient.ts`) is already implemented and handles all authentication, timeout, and RFC 9457 error mapping. The implementation requires three artifacts: a types file, a client module, and 5 API routes.

The Raspberry Pi API is simpler than Fritz!Box: all endpoints are GET-only, responses are already in clean format (no unit conversions or field renaming needed), there is no caching layer, and no rate limiting. The `data_freshness` field is always `"LIVE"` for all endpoints since psutil collects live data on every request.

The critical difference from Fritz!Box is the health route behavior: while Fritz!Box's health pings a generic `/health` and maps `providers`, the Raspberry Pi health route calls `/api/v1/raspi/health` and returns `{ status, data_freshness }` directly — no provider map to extract.

**Primary recommendation:** Clone the Fritz!Box pattern wholesale, remove caching/rate-limiting wrappers, keep the direct `success(data)` return pattern, and use typed generics for all 5 client methods.

---

## Standard Stack

### Core (already installed, no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lib/haClient.ts` | project | Shared HA proxy transport (`haGet<T>`) | Single source of truth for auth, timeout, RFC 9457 error mapping |
| `lib/core` | project | `withAuthAndErrorHandler`, `success()`, `ApiError` | All existing routes use this — Auth0 session validation + consistent responses |
| Next.js App Router | 15.5 | API route handlers | Project standard |
| TypeScript | project | Static typing | Project standard (strict mode + noUncheckedIndexedAccess enabled) |

### No new packages required

All dependencies are already installed. This phase only creates new files using existing infrastructure.

---

## Architecture Patterns

### Recommended Project Structure

```
lib/raspi/
├── raspiClient.ts       # function module: haGet wrappers, exported as raspiClient object
└── index.ts             # barrel: exports raspiClient

types/
└── raspi.ts             # TypeScript interfaces for all 5 API response schemas

app/api/raspi/
├── health/
│   └── route.ts         # GET /api/raspi/health
├── cpu/
│   └── route.ts         # GET /api/raspi/cpu
├── memory/
│   └── route.ts         # GET /api/raspi/memory
├── disk/
│   └── route.ts         # GET /api/raspi/disk
└── system/
    └── route.ts         # GET /api/raspi/system
```

### Pattern 1: Client Module (function module with object export)

**What:** Individual `async function` declarations each calling `haGet<T>` with the correct endpoint path and return type. All bundled into a single exported const object.

**When to use:** Always — this is the locked pattern from CONTEXT.md.

**Example (from `lib/fritzbox/fritzboxClient.ts`):**
```typescript
// Source: lib/fritzbox/fritzboxClient.ts (verified in codebase)
import { haGet } from '@/lib/haClient';

async function getHealth(): Promise<RaspiHealthResponse> {
  return haGet<RaspiHealthResponse>('/api/v1/raspi/health');
}

async function getCpu(): Promise<CpuResponse> {
  return haGet<CpuResponse>('/api/v1/raspi/cpu');
}

// ... other methods

export const raspiClient = {
  getHealth,
  getCpu,
  getMemory,
  getDisk,
  getSystem,
};
```

**ping() decision (Claude's Discretion):** The Fritz!Box client has `ping()` which calls `/health` with a custom 10s timeout. For Raspberry Pi, `getHealth()` already covers the same use case since the health endpoint is lightweight. Recommendation: include `getHealth()` only (no separate `ping()`), consistent with the Netatmo pattern which also has no `ping()`.

### Pattern 2: API Route Handler

**What:** Each route imports from the raspi barrel, calls the corresponding client method, and returns with `success()`. No caching, no rate limiting.

**When to use:** All 5 routes follow this exact structure.

**Example (simpler than `app/api/fritzbox/health/route.ts` since no type assertions needed):**
```typescript
// Source: app/api/fritzbox/health/route.ts (verified in codebase)
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { raspiClient } from '@/lib/raspi';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await raspiClient.getHealth();
  return success(data);
}, 'Raspi/Health');
```

**Key:** The second argument to `withAuthAndErrorHandler` is the route label string (used for logging). Follow `'Raspi/Health'`, `'Raspi/Cpu'`, etc. pattern.

### Pattern 3: Types File

**What:** Pure TypeScript interfaces matching the API response schemas from `docs/api/raspberry-pi.md` verbatim. The `data_freshness` field is a string literal type `"LIVE"` not the wider `DataFreshness` union (which is a Netatmo-specific type including `"STALE"` and `"UNREACHABLE"`).

**When to use:** `types/raspi.ts` — separate file mirroring `types/haClient.ts` and `types/netatmoProxy.ts`.

```typescript
// Source: docs/api/raspberry-pi.md (verified in codebase)
export interface RaspiHealthResponse {
  status: "ok";
  data_freshness: "LIVE";
}

export interface CpuResponse {
  cpu_percent: number;
  data_freshness: "LIVE";
}

export interface MemoryResponse {
  used_bytes: number;
  total_bytes: number;
  percent: number;
  data_freshness: "LIVE";
}

export interface DiskResponse {
  used_bytes: number;
  total_bytes: number;
  percent: number;
  mount_point: "/";
  data_freshness: "LIVE";
}

export interface NetworkStats {
  bytes_sent: number;
  bytes_recv: number;
  interface: string;
}

export interface SystemResponse {
  cpu_temperature: number | null;  // null if sensor unavailable
  uptime_seconds: number;
  load_avg_1: number;
  load_avg_5: number;
  load_avg_15: number;
  process_count: number;
  network: NetworkStats;
  data_freshness: "LIVE";
}
```

**Critical TypeScript note:** `cpu_temperature: number | null` must be typed as nullable — the API docs explicitly state it returns `null` on platforms where the thermal sensor is unavailable.

### Pattern 4: Barrel Export

**What:** `lib/raspi/index.ts` re-exports `raspiClient` for clean import paths.

**Example (from `lib/fritzbox/index.ts`):**
```typescript
// Source: lib/fritzbox/index.ts (verified in codebase)
export { raspiClient } from './raspiClient';
```

Note: Fritz!Box barrel also exports cache and rate limiter — Raspberry Pi barrel only needs `raspiClient` since no caching or rate limiting.

### Anti-Patterns to Avoid

- **Importing types from `netatmoProxy.ts` DataFreshness:** The Netatmo `DataFreshness` union includes `"STALE"` and `"UNREACHABLE"`. Raspberry Pi always returns `"LIVE"`. Use string literal `"LIVE"` directly in Raspi types, not the Netatmo union.
- **Adding caching layer:** Explicitly out of scope. Do not add `getCachedData` calls — Raspberry Pi collects live data on each request.
- **Adding rate limiting:** Explicitly out of scope. Do not add `checkRateLimit` calls.
- **Type assertion for route handlers:** Fritz!Box health route casts the ping response `as { status: string; ... }` because the return type is `unknown`. Since `raspiClient.getHealth()` returns a typed `Promise<RaspiHealthResponse>`, no type assertion is needed in routes.
- **Transformation in client methods:** Unlike Fritz!Box (bps→Mbps, status→active), Raspberry Pi responses pass through unchanged. Return `haGet<T>(endpoint)` directly without mapping.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| X-API-Key auth + timeout + RFC 9457 error mapping | Custom fetch wrapper | `haGet<T>` from `lib/haClient.ts` | Already handles all edge cases including AbortController, RATE_LIMITED 429 mapping |
| Auth0 session validation in routes | Manual `getSession()` checks | `withAuthAndErrorHandler` from `lib/core` | Handles 401 consistently across all routes |
| JSON response envelope | `NextResponse.json({ success: true, ... })` | `success()` from `lib/core` | Consistent response shape across all 50+ API routes |
| Error-to-HTTP-status mapping | Custom error handling | `ApiError` propagation through `withAuthAndErrorHandler` | haClient throws ApiError; withAuthAndErrorHandler catches and serializes it |

**Key insight:** `haGet` already does exactly what `raspiClient` methods need — authenticated fetch, timeout abort, RFC 9457 error surface as `ApiError`. The client methods are thin wrappers that exist only to provide typed return values and semantic method names.

---

## Common Pitfalls

### Pitfall 1: Mismatched Endpoint Paths

**What goes wrong:** Using `/raspi/health` instead of `/api/v1/raspi/health` as the haGet path.

**Why it happens:** The Next.js routes are at `/api/raspi/health` (short path), but the HA proxy paths are at `/api/v1/raspi/health` (full versioned path). The paths are different.

**How to avoid:** Client methods call `haGet('/api/v1/raspi/health')`. The Next.js route is at `app/api/raspi/health/route.ts`. These are two different URL spaces — the Next.js route is what the browser calls, and the client method is what the server calls on the HA proxy.

**Warning signs:** 404 errors from the HA proxy despite route appearing to work locally.

### Pitfall 2: Using DataFreshness from netatmoProxy.ts

**What goes wrong:** `import { DataFreshness } from '@/types/netatmoProxy'` and using it in Raspi types.

**Why it happens:** The Netatmo `DataFreshness` type looks reusable, and `"LIVE"` is one of its values.

**How to avoid:** Raspi always returns `"LIVE"`. Type the field as the string literal `"LIVE"` directly. Do not share the Netatmo union type.

**Warning signs:** TypeScript not narrowing `data_freshness` correctly in downstream code expecting only `"LIVE"`.

### Pitfall 3: Forgetting `export const dynamic = 'force-dynamic'`

**What goes wrong:** Next.js 15 statically analyzes and potentially caches routes that don't opt out. Raspberry Pi data is live system stats — caching would serve stale CPU/memory readings.

**Why it happens:** Easy to omit since it's a module-level export not part of the function.

**How to avoid:** All 5 routes must have `export const dynamic = 'force-dynamic'` as the first export after imports.

**Warning signs:** CPU/memory values not updating between refreshes in development.

### Pitfall 4: Wrong label string in withAuthAndErrorHandler

**What goes wrong:** Passing an empty string or undefined as the second arg to `withAuthAndErrorHandler`.

**Why it happens:** The label is optional but used for error logging — omitting it makes debugging harder.

**How to avoid:** Follow the pattern `'Raspi/Health'`, `'Raspi/Cpu'`, `'Raspi/Memory'`, `'Raspi/Disk'`, `'Raspi/System'`.

---

## Code Examples

### Complete raspiClient.ts

```typescript
// Pattern source: lib/fritzbox/fritzboxClient.ts (verified in codebase)
import { haGet } from '@/lib/haClient';
import type {
  RaspiHealthResponse,
  CpuResponse,
  MemoryResponse,
  DiskResponse,
  SystemResponse,
} from '@/types/raspi';

async function getHealth(): Promise<RaspiHealthResponse> {
  return haGet<RaspiHealthResponse>('/api/v1/raspi/health');
}

async function getCpu(): Promise<CpuResponse> {
  return haGet<CpuResponse>('/api/v1/raspi/cpu');
}

async function getMemory(): Promise<MemoryResponse> {
  return haGet<MemoryResponse>('/api/v1/raspi/memory');
}

async function getDisk(): Promise<DiskResponse> {
  return haGet<DiskResponse>('/api/v1/raspi/disk');
}

async function getSystem(): Promise<SystemResponse> {
  return haGet<SystemResponse>('/api/v1/raspi/system');
}

export const raspiClient = {
  getHealth,
  getCpu,
  getMemory,
  getDisk,
  getSystem,
};
```

### Simple data route (cpu, memory, disk, system)

```typescript
// Pattern source: app/api/fritzbox/wan/route.ts (simplified — no cache/rate limit)
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { raspiClient } from '@/lib/raspi';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await raspiClient.getCpu();
  return success(data);
}, 'Raspi/Cpu');
```

### Health route

```typescript
// Note: health returns data directly — no provider map extraction needed
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { raspiClient } from '@/lib/raspi';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await raspiClient.getHealth();
  return success(data);
}, 'Raspi/Health');
```

### Test pattern for client (mock haGet)

```typescript
// Pattern source: lib/fritzbox/__tests__/fritzboxClient.test.ts (verified in codebase)
import { raspiClient } from '../raspiClient';
import { haGet } from '@/lib/haClient';

jest.mock('@/lib/haClient', () => ({
  haGet: jest.fn(),
}));

const mockHaGet = jest.mocked(haGet);

describe('raspiClient', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('getCpu()', () => {
    it('calls haGet with correct endpoint', async () => {
      mockHaGet.mockResolvedValue({ cpu_percent: 23.5, data_freshness: 'LIVE' });
      const result = await raspiClient.getCpu();
      expect(mockHaGet).toHaveBeenCalledWith('/api/v1/raspi/cpu');
      expect(result.cpu_percent).toBe(23.5);
    });
  });
});
```

### Test pattern for route (mock raspiClient)

```typescript
// Pattern source: app/api/fritzbox/health/__tests__/route.test.ts (verified in codebase)
jest.mock('@/lib/raspi');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import { raspiClient } from '@/lib/raspi';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockRaspiClient = jest.mocked(raspiClient);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/raspi/cpu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
  });

  it('returns cpu data on success', async () => {
    mockRaspiClient.getCpu.mockResolvedValue({ cpu_percent: 42.1, data_freshness: 'LIVE' });
    const req = new Request('http://localhost:3000/api/raspi/cpu');
    const res = await GET(req as any, {} as any);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.cpu_percent).toBe(42.1);
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/raspi/cpu');
    const res = await GET(req as any, {} as any);
    expect(res.status).toBe(401);
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Provider-specific fetch clients (JWT, separate env vars) | Shared `haGet` transport (X-API-Key, single HA_API_URL) | Phase 84 | All providers use same transport; no per-provider auth logic |
| Class-based clients | Function module with object export | Phase 85 | Simpler, no constructor, consistent with functional style |
| Netatmo `DataFreshness` union with STALE/UNREACHABLE | Raspi `"LIVE"` literal only | Phase 88 | Raspi has no polling cache; literal type is more precise |

---

## Open Questions

1. **Health route response shape**
   - What we know: The HA proxy `/api/v1/raspi/health` returns `{ status: "ok", data_freshness: "LIVE" }`. Fritz!Box health wraps provider metadata. Raspberry Pi has no provider metadata.
   - What's unclear: Whether the route should return the raw response or wrap it (e.g., `{ status: "connected", ... }`).
   - Recommendation (Claude's Discretion): Return raw `success(data)` — no transformation needed since the response is already clean. This is simpler than the Fritz!Box health which remaps `status === 'ok' ? 'connected' : 'degraded'`.

2. **ping() method**
   - What we know: Fritz!Box has `ping()` calling `/health` with 10s timeout. Netatmo has no `ping()`.
   - What's unclear: Whether dashboard/monitoring code in future phases will expect `raspiClient.ping()`.
   - Recommendation (Claude's Discretion): Skip `ping()` — `getHealth()` covers the same use case. Phase 89 (device registry, cron) can call `getHealth()` directly if needed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (via next/jest), jest-environment-jsdom |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="raspi" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RASPI-01 | `raspiClient.getX()` calls `haGet` with correct endpoint path | unit | `npm test -- --testPathPattern="lib/raspi"` | ❌ Wave 0 |
| RASPI-01 | `raspiClient` propagates `ApiError` from `haGet` unchanged | unit | `npm test -- --testPathPattern="lib/raspi"` | ❌ Wave 0 |
| RASPI-02 | TypeScript types compile without errors (0 tsc errors) | static | `npx tsc --noEmit` | ❌ Wave 0 (types file) |
| RASPI-03 | Route returns 200 with data when authenticated | unit | `npm test -- --testPathPattern="app/api/raspi"` | ❌ Wave 0 |
| RASPI-03 | Route returns 401 when unauthenticated | unit | `npm test -- --testPathPattern="app/api/raspi"` | ❌ Wave 0 |
| RASPI-03 | Route propagates ApiError from client (e.g., SERVICE_UNAVAILABLE → 503) | unit | `npm test -- --testPathPattern="app/api/raspi"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --testPathPattern="raspi" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `lib/raspi/__tests__/raspiClient.test.ts` — covers RASPI-01 (endpoint paths, no transformation, error propagation)
- [ ] `app/api/raspi/health/__tests__/route.test.ts` — covers RASPI-03 (auth, success, error)
- [ ] `app/api/raspi/cpu/__tests__/route.test.ts` — covers RASPI-03
- [ ] `app/api/raspi/memory/__tests__/route.test.ts` — covers RASPI-03
- [ ] `app/api/raspi/disk/__tests__/route.test.ts` — covers RASPI-03
- [ ] `app/api/raspi/system/__tests__/route.test.ts` — covers RASPI-03
- [ ] `types/raspi.ts` — covers RASPI-02 (tsc validation via noEmit)

---

## Sources

### Primary (HIGH confidence)

- `lib/haClient.ts` — verified transport API: `haGet<T>(endpoint, options?)`, env var names (`HA_API_URL`, `HA_API_KEY`), error mapping behavior
- `lib/fritzbox/fritzboxClient.ts` — verified function module pattern, object export shape
- `lib/fritzbox/index.ts` — verified barrel export pattern
- `app/api/fritzbox/health/route.ts` — verified route pattern: `withAuthAndErrorHandler`, `success()`, `force-dynamic`
- `app/api/fritzbox/wan/route.ts` — verified data route pattern with rate limiting (to contrast against simpler raspi routes)
- `lib/core/apiErrors.ts` — verified `ApiError`, `ERROR_CODES`, `HTTP_STATUS` constants
- `lib/core/index.ts` — verified exports: `withAuthAndErrorHandler`, `success`
- `types/haClient.ts` — verified `RFC9457ProblemDetail`, `HaRequestOptions` interfaces
- `types/netatmoProxy.ts` — verified `DataFreshness` type (to confirm raspi should NOT use it)
- `docs/api/raspberry-pi.md` — verified all 5 endpoint schemas and TypeScript interfaces
- `lib/fritzbox/__tests__/fritzboxClient.test.ts` — verified test pattern: mock `haGet`, `jest.mocked()`, describe structure
- `app/api/fritzbox/health/__tests__/route.test.ts` — verified route test pattern: mock barrel, mock auth0

### Secondary (MEDIUM confidence)

None — all findings verified against in-project source files.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies are existing in-project files, no new packages
- Architecture: HIGH — exact patterns verified from Fritz!Box implementation (Phase 85)
- Pitfalls: HIGH — verified from type definitions and existing code
- Types: HIGH — all interfaces directly from `docs/api/raspberry-pi.md`

**Research date:** 2026-03-17
**Valid until:** Indefinite — based on in-project source files, not external APIs
