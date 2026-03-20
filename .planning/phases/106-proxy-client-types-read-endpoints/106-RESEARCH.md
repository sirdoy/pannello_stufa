# Phase 106: Proxy Client + Types + Read Endpoints - Research

**Researched:** 2026-03-20
**Domain:** Hue proxy client migration (function module pattern, TypeScript types, Next.js API routes)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Client module structure**
- Function module pattern (not class) — consistent with thermorossiProxy.ts, netatmoProxy.ts, raspiClient.ts
- File: `lib/hue/hueProxy.ts` — reuse existing `lib/hue/` directory (legacy files will be deleted in Phase 109)
- Import haGet from `@/lib/haClient` for all read wrappers
- One exported convenience function per endpoint: getLights, getLight, getGroups, getGroup, getScenes, getHealth, getHistory

**Type organization**
- Separate file: `types/hueProxy.ts` — consistent with types/thermorossiProxy.ts
- Types match proxy API response shapes exactly as documented in docs/api/hue.md
- Interfaces: HueLight, HueGroup, HueScene, HueBridgeHealth, HueHistoryItem, HueHistoryResponse
- capability_tier as union type: `"white" | "ambiance" | "color"`
- data_freshness as union type: `"LIVE" | "STALE"` (UNREACHABLE triggers 503, never in body)
- HueHistoryItem.on_state and .reachable are `number | null` (0/1 integers from SQLite, not booleans)

**API route structure**
- Rewrite existing route files under `app/api/hue/` to proxy through hueProxy.ts instead of direct Bridge API
- Route mapping:
  - `app/api/hue/status/route.ts` → calls getHealth() (health endpoint)
  - `app/api/hue/lights/route.ts` → calls getLights()
  - `app/api/hue/lights/[id]/route.ts` → calls getLight(id) — GET handler only (PUT stays for Phase 107)
  - `app/api/hue/rooms/route.ts` → calls getGroups()
  - `app/api/hue/rooms/[id]/route.ts` → calls getGroup(id) — GET handler only (PUT stays for Phase 107)
  - `app/api/hue/scenes/route.ts` → calls getScenes(groupId?)
  - New: `app/api/hue/history/route.ts` → calls getHistory(params)
- Each route: `export const dynamic = 'force-dynamic'`, auth check, try/catch with ApiError handling
- Legacy routes not needed for reads (discover, pair, remote/*, disconnect, test) left untouched — Phase 109 cleanup

**Error handling strategy**
- Let haClient mapResponseError handle 503 (SERVICE_UNAVAILABLE), 401 (UNAUTHORIZED), 429 (RATE_LIMITED) automatically
- 404 from proxy (light/group not found) passes through as ApiError with BAD_GATEWAY — routes can catch and re-throw as 404
- No special retry logic for read endpoints (haClient default 15s timeout is sufficient)

### Claude's Discretion
- Exact JSDoc wording on convenience wrappers
- Whether to add query parameter builder utility for history endpoint
- Test file structure and mock patterns

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLIENT-01 | Hue proxy client uses shared haGet/haPost transport (X-API-Key auth) | haClient.ts haGet<T> signature confirmed; same pattern as thermorossiProxy.ts |
| CLIENT-02 | TypeScript types for all proxy response interfaces (HueLight, HueGroup, HueScene, HueBridgeHealth, HueHistoryItem) | All interface shapes verified from docs/api/hue.md (HIGH confidence, source: live proxy verification 2026-03-19) |
| CLIENT-03 | Convenience wrappers for each endpoint (getLights, getGroups, getScenes, getHealth, getHistory) | Function signature pattern from thermorossiProxy.ts; history wrapper needs URLSearchParams forwarding |
| READ-01 | GET /lights migrated with capability_tier, ct_kelvin, room enrichment | Proxy returns these in HueLight shape; route rewrites getLights() and returns data directly |
| READ-02 | GET /lights/{light_id} migrated | GET handler in lights/[id]/route.ts rewritten to call getLight(id); PUT handler left alone until Phase 107 |
| READ-03 | GET /groups migrated with member lights array | HueGroup.lights is string[] (not light_ids); rooms/route.ts rewritten to call getGroups() |
| READ-04 | GET /groups/{group_id} migrated | GET handler in rooms/[id]/route.ts rewritten; uses `id` path param |
| READ-05 | GET /scenes migrated with group_id filter support | scenes/route.ts rewritten; group_id optional query param forwarded |
| READ-06 | GET /health migrated with data_freshness (LIVE/STALE/UNREACHABLE→503) | status/route.ts rewritten to call getHealth(); 503 propagated automatically by haClient |
| READ-07 | GET /history migrated with auto-granularity pagination | New route app/api/hue/history/route.ts; history uses page/page_size (not limit/offset) |
</phase_requirements>

---

## Summary

Phase 106 creates the Hue proxy client foundation: one type file, one client module, and seven API route rewrites/additions. The work is structurally identical to v13.0 Phase 99 (Thermorossi proxy client) and v10.0 Phase 75 (Netatmo proxy migration). All response shapes are fully verified against the live proxy as of 2026-03-19 with HIGH confidence — no guessing required.

The most significant difference from the Thermorossi migration is the history endpoint: Hue history uses page/page_size pagination (not limit/offset), and its items carry a granularity discriminator that determines which fields are populated. The HueHistoryItem type requires special care: `on_state` and `reachable` are `number | null` (SQLite integers), not booleans, unlike the live `HueLight.reachable` which is a boolean.

The routes being rewritten (`lights/`, `rooms/`, `scenes/`, `status/`) currently use `withHueHandler` + `HueConnectionStrategy` — these will become `withAuthAndErrorHandler` + direct proxy calls, dropping 4+ imports per file. The GET handler in `lights/[id]/route.ts` and `rooms/[id]/route.ts` must be rewritten while leaving the PUT handlers intact (Phase 107 concern).

**Primary recommendation:** Follow thermorossiProxy.ts exactly for client and type structure. Use stove/status/route.ts and stove/history/route.ts as the canonical route templates.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@/lib/haClient` (haGet/haPost) | project-internal | Shared transport for all HA proxy providers | Handles auth, timeout, RFC 9457 error mapping — already used by stove, raspi, netatmo, fritz |
| `@/lib/core` (withAuthAndErrorHandler, success) | project-internal | Route auth wrapper + JSON response helper | Consistent pattern across all migrated routes |
| `@/lib/core/apiErrors` (ApiError, ERROR_CODES, HTTP_STATUS) | project-internal | Typed error throw/catch | Used by all API routes in the project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| URLSearchParams (Web API) | built-in | History query parameter forwarding | Same pattern as thermorossi getHistory() — build from request.nextUrl.searchParams |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| haGet<T> | Direct fetch | haGet already handles auth, timeout, AbortController, RFC 9457 parsing — never hand-roll |
| withAuthAndErrorHandler | withHueHandler | withHueHandler is legacy (uses HueConnectionStrategy) — must switch to withAuthAndErrorHandler |

**Installation:** No new packages required — all dependencies are project-internal.

---

## Architecture Patterns

### New Files
```
lib/
└── hue/
    └── hueProxy.ts          # NEW: function module client (alongside legacy hueApi.ts)
types/
└── hueProxy.ts              # NEW: TypeScript interfaces for proxy responses
app/api/hue/
├── status/route.ts          # REWRITE: getHealth()
├── lights/route.ts          # REWRITE: getLights()
├── lights/[id]/route.ts     # REWRITE GET handler: getLight(id); keep PUT for Phase 107
├── rooms/route.ts           # REWRITE: getGroups()
├── rooms/[id]/route.ts      # REWRITE GET handler: getGroup(id); keep PUT for Phase 107
├── scenes/route.ts          # REWRITE: getScenes(groupId?)
└── history/route.ts         # NEW: getHistory(params)
```

### Pattern 1: Function Module Proxy Client (hueProxy.ts)

**What:** Named export functions that call haGet<T> with typed generics.
**When to use:** All proxy providers in this project.

```typescript
// Source: lib/thermorossiProxy.ts — canonical pattern to mirror
import { haGet } from '@/lib/haClient';
import type { HueLight, HueGroup, ... } from '@/types/hueProxy';

export async function getLights(): Promise<HueLight[]> {
  return haGet<HueLight[]>('/api/v1/hue/lights');
}

export async function getLight(lightId: string): Promise<HueLight> {
  return haGet<HueLight>(`/api/v1/hue/lights/${lightId}`);
}

export async function getGroups(): Promise<HueGroup[]> {
  return haGet<HueGroup[]>('/api/v1/hue/groups');
}

export async function getGroup(groupId: string): Promise<HueGroup> {
  return haGet<HueGroup>(`/api/v1/hue/groups/${groupId}`);
}

export async function getScenes(groupId?: string): Promise<HueScene[]> {
  const endpoint = groupId
    ? `/api/v1/hue/scenes?group_id=${groupId}`
    : '/api/v1/hue/scenes';
  return haGet<HueScene[]>(endpoint);
}

export async function getHealth(): Promise<HueBridgeHealth> {
  return haGet<HueBridgeHealth>('/api/v1/hue/health');
}

export async function getHistory(params?: URLSearchParams): Promise<HueHistoryResponse> {
  const endpoint = params?.size
    ? `/api/v1/hue/history?${params.toString()}`
    : '/api/v1/hue/history';
  return haGet<HueHistoryResponse>(endpoint);
}
```

### Pattern 2: Simple Proxy Route (no path params)

**What:** withAuthAndErrorHandler, call proxy function, return success(data).
**When to use:** All GET-only routes reading from proxy.

```typescript
// Source: app/api/stove/status/route.ts — canonical route template
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getLights } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getLights();
  return success(data as unknown as Record<string, unknown>);
}, 'Hue/Lights');
```

### Pattern 3: Route with Path Param (single GET handler)

**What:** Extract path param from context, call proxy, return success.
**When to use:** lights/[id] and rooms/[id] — GET handler only, PUT left for Phase 107.

```typescript
// Source: app/api/raspi/health/route.ts + existing lights/[id]/route.ts structure
import { withAuthAndErrorHandler, success, getPathParam } from '@/lib/core';
import { getLight } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const id = await getPathParam(context, 'id');
  const data = await getLight(id);
  return success(data as unknown as Record<string, unknown>);
}, 'Hue/Light/Get');

// PUT handler stays here until Phase 107 — do not remove
export const PUT = withHueHandler(async (request, context, session) => {
  // ... existing PUT implementation unchanged
}, 'Hue/Light/Update');
```

### Pattern 4: Route with Query Params (history + scenes)

**What:** Forward searchParams to proxy via URLSearchParams.
**When to use:** History (from/to/light_id/page/page_size) and scenes (group_id filter).

```typescript
// Source: app/api/stove/history/route.ts — canonical query-forwarding template
export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = request.nextUrl;
  const params = searchParams.size > 0
    ? new URLSearchParams(searchParams.toString())
    : undefined;
  const data = await getHistory(params);
  return success(data as unknown as Record<string, unknown>);
}, 'Hue/History');
```

### Pattern 5: TypeScript Type File (types/hueProxy.ts)

**What:** Interfaces matching proxy response shapes exactly, with JSDoc from API spec.
**When to use:** Every proxy provider has a matching types file.

```typescript
// Source: types/thermorossiProxy.ts — canonical type file structure
// types/hueProxy.ts

export type HueCapabilityTier = 'white' | 'ambiance' | 'color';
export type HueDataFreshness = 'LIVE' | 'STALE';
export type HueColorMode = 'ct' | 'hs' | 'xy';
export type HueHistoryGranularity = 'raw' | 'hourly' | 'daily';

export interface HueLight { ... }        // 15 fields — see docs/api/hue.md
export interface HueGroup { ... }        // 10 fields
export interface HueScene { ... }        // 6 fields
export interface HueBridgeHealth { ... } // 7 fields
export interface HueHistoryItem { ... }  // 16 fields (on_state/reachable are number|null)
export interface HueHistoryResponse { items: HueHistoryItem[]; total: number; page: number; page_size: number; granularity: HueHistoryGranularity; from: number | null; to: number | null; }
```

### Anti-Patterns to Avoid
- **Wrapping data in `{ lights: [...] }`**: Old routes wrapped arrays (e.g. `return success({ lights: response.data || [] })`). New proxy routes return the data directly via `success(data as unknown as Record<string, unknown>)`. The proxy already returns the correct shape.
- **Using withHueHandler for new routes**: `withHueHandler` couples to `HueConnectionStrategy` (legacy). Use `withAuthAndErrorHandler` exclusively for all proxy routes.
- **Removing PUT handlers in Phase 106**: `lights/[id]/route.ts` and `rooms/[id]/route.ts` have PUT handlers that must remain untouched — Phase 107 rewrites them.
- **Typing HueHistoryItem.on_state as boolean**: SQLite stores 0/1 integers. The Pydantic model declares `Optional[int]`. TypeScript type MUST be `number | null`.
- **Using `from_ts`/`to_ts` as query param names**: The FastAPI serialization alias exposes `from` and `to` as URL params (not `from_ts`/`to_ts`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth header injection | Custom fetch wrapper | `haGet<T>` from haClient | haGet already reads HA_API_URL + HA_API_KEY and injects X-API-Key |
| Timeout handling | Manual AbortController | `haGet<T>` from haClient | haClient creates AbortController with 15s default, clears it on completion |
| RFC 9457 error parsing | Custom error mapper | `haGet<T>` from haClient | mapResponseError parses body and throws typed ApiError instances |
| Request authentication | Session checks | `withAuthAndErrorHandler` | Handles Auth0 getSession, returns 401 on missing session |
| JSON response formatting | `NextResponse.json()` | `success()` from @/lib/core | Consistent `{ success: true, ...data }` shape |

**Key insight:** All proxy providers in this project follow the same 3-line route pattern: withAuthAndErrorHandler → proxy call → success(). Everything else is handled by haClient and the core wrappers.

---

## Common Pitfalls

### Pitfall 1: Wrapping proxy arrays in an extra object key
**What goes wrong:** Old routes returned `{ lights: [...] }` or `{ rooms: [...] }`. Frontend hooks currently expect these shapes. Phase 106 routes should return the proxy data directly. Phase 108 will update the frontend hooks to match.
**Why it happens:** The old routes constructed response objects around the provider's data format.
**How to avoid:** Use `success(data as unknown as Record<string, unknown>)` directly — the proxy returns the final shape already.
**Warning signs:** If frontend breaks on Phase 106 routes, it means the hook still expects the old wrapped format — that's expected and will be fixed in Phase 108.

### Pitfall 2: Modifying PUT handlers in mixed GET/PUT route files
**What goes wrong:** `lights/[id]/route.ts` and `rooms/[id]/route.ts` each contain both GET and PUT handlers. Phase 106 only rewrites the GET handlers.
**Why it happens:** The file structure couples GET and PUT in the same file.
**How to avoid:** Only replace the GET handler export. Keep the existing PUT export and all its imports intact.
**Warning signs:** Compilation error if withHueHandler or HueConnectionStrategy imports are removed while PUT still uses them.

### Pitfall 3: History pagination mismatch (page/page_size vs limit/offset)
**What goes wrong:** Other endpoints in this project use limit/offset pagination. The history endpoint uses page/page_size.
**Why it happens:** The Hue proxy uses FastAPI's page-based pagination for history, distinct from the limit/offset used by fritz/netatmo.
**How to avoid:** Forward searchParams as-is via URLSearchParams — don't translate to limit/offset.
**Warning signs:** Zero results or off-by-one counts when paginating history.

### Pitfall 4: data_freshness "UNREACHABLE" in types
**What goes wrong:** Including `"UNREACHABLE"` in `HueDataFreshness` union type.
**Why it happens:** The API docs mention UNREACHABLE but it triggers HTTP 503 — it is never in the response body.
**How to avoid:** `type HueDataFreshness = 'LIVE' | 'STALE'` — two values only.
**Warning signs:** TypeScript code trying to handle `data_freshness === 'UNREACHABLE'` can never be reached.

### Pitfall 5: Scenes route losing group_id filter
**What goes wrong:** The existing `scenes/route.ts` does not accept a `group_id` query param. The new proxy route must support it.
**Why it happens:** Old route fetched all scenes; filtering wasn't supported via the CLIP v2 API.
**How to avoid:** In the new scenes route, read `request.nextUrl.searchParams.get('group_id')` and pass to `getScenes(groupId)`.
**Warning signs:** Frontend requests for `?group_id=1` return all scenes instead of filtered results.

---

## Code Examples

Verified patterns from the project's canonical sources:

### hueProxy.ts — getHistory with URLSearchParams forwarding
```typescript
// Source: lib/thermorossiProxy.ts getHistory() — identical pattern
export async function getHistory(params?: URLSearchParams): Promise<HueHistoryResponse> {
  const endpoint = params
    ? `/api/v1/hue/history?${params.toString()}`
    : '/api/v1/hue/history';
  return haGet<HueHistoryResponse>(endpoint);
}
```

### app/api/hue/history/route.ts
```typescript
// Source: app/api/stove/history/route.ts — canonical template
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHistory } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = request.nextUrl;
  const params = searchParams.size > 0
    ? new URLSearchParams(searchParams.toString())
    : undefined;
  const data = await getHistory(params);
  return success(data as unknown as Record<string, unknown>);
}, 'Hue/History');
```

### app/api/hue/scenes/route.ts — with optional group_id filter
```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getScenes } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request) => {
  const groupId = request.nextUrl.searchParams.get('group_id') ?? undefined;
  const data = await getScenes(groupId);
  return success(data as unknown as Record<string, unknown>);
}, 'Hue/Scenes');
```

### Test pattern for proxy routes
```typescript
// Source: app/api/raspi/health/__tests__/route.test.ts — canonical test template
jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { auth0 } from '@/lib/auth0';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetLights = jest.mocked(hueProxy.getLights);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/hue/lights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
  });

  it('returns 401 when not authenticated', async () => { ... });
  it('returns 200 with lights array', async () => { ... });
  it('propagates 503 when proxy unavailable', async () => {
    mockGetLights.mockRejectedValue(
      new ApiError(ERROR_CODES.SERVICE_UNAVAILABLE, 'Bridge unreachable', HTTP_STATUS.SERVICE_UNAVAILABLE)
    );
    const response = await GET(mockRequest as any, {} as any);
    expect(response.status).toBe(503);
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `withHueHandler` + `HueConnectionStrategy` | `withAuthAndErrorHandler` + `hueProxy.ts` functions | Phase 106 (v14.0) | Removes CLIP v2 local/remote connection strategy — proxy handles Bridge connectivity |
| `provider.getLights()` returning CLIP v2 format | `getLights()` returning flat proxy format | Phase 106 (v14.0) | Flat format: light_id strings, capability_tier, ct_kelvin pre-computed |
| `{ lights: response.data || [] }` wrapped response | Direct proxy data via `success(data)` | Phase 106 (v14.0) | Frontend hooks (Phase 108) must be updated to read new shapes |
| Promise.all([getRooms(), getZones()]) in rooms route | Single `getGroups()` call | Phase 106 (v14.0) | Proxy merges rooms+zones server-side into HueGroup[] |

**Deprecated/outdated:**
- `withHueHandler`: Couples to HueConnectionStrategy — replaced by withAuthAndErrorHandler in all proxy routes
- `HueConnectionStrategy.getProvider()`: Legacy connection strategy — not used in new routes
- Wrapped response shapes `{ lights: [], rooms: [], scenes: [] }`: Proxy returns arrays directly

---

## Open Questions

1. **scenes/route.ts also has a POST handler (create scene)**
   - What we know: scenes/create/route.ts exists separately; scenes/route.ts only has GET per current code
   - What's unclear: Does scenes/route.ts have a POST export that must be preserved (like lights/[id] PUT)?
   - Recommendation: Read scenes/route.ts before implementing — it currently only has GET, so rewrite is straightforward. scenes/create/route.ts is a separate legacy file (Phase 109 cleanup).

2. **haClient does not have a haPut function**
   - What we know: haClient.ts exports only haGet and haPost — no haPut
   - What's unclear: Phase 107 will need PUT support for lights/state and groups/action
   - Recommendation: Not a Phase 106 concern — Phase 107 will add haPut or use haPost. Phase 106 only uses haGet.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (project-wide) |
| Config file | jest.config.ts |
| Quick run command | `npm test -- --testPathPattern="hue" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLIENT-01 | haGet called with correct Hue paths | unit | `npm test -- --testPathPattern="hueProxy"` | ❌ Wave 0 |
| CLIENT-02 | TypeScript compilation with correct interfaces | unit (tsc) | `npx tsc --noEmit` | ❌ Wave 0 |
| CLIENT-03 | Each wrapper function returns typed response | unit | `npm test -- --testPathPattern="hueProxy"` | ❌ Wave 0 |
| READ-01 | GET /api/hue/lights returns 200 with HueLight[] | unit | `npm test -- --testPathPattern="hue/lights"` | ❌ Wave 0 |
| READ-02 | GET /api/hue/lights/[id] returns 200 with HueLight | unit | `npm test -- --testPathPattern="hue/lights"` | ❌ Wave 0 |
| READ-03 | GET /api/hue/rooms returns 200 with HueGroup[] | unit | `npm test -- --testPathPattern="hue/rooms"` | ❌ Wave 0 |
| READ-04 | GET /api/hue/rooms/[id] returns 200 with HueGroup | unit | `npm test -- --testPathPattern="hue/rooms"` | ❌ Wave 0 |
| READ-05 | GET /api/hue/scenes + ?group_id filter | unit | `npm test -- --testPathPattern="hue/scenes"` | ❌ Wave 0 |
| READ-06 | GET /api/hue/status returns 200 / 503 propagated | unit | `npm test -- --testPathPattern="hue/status"` | ❌ Wave 0 |
| READ-07 | GET /api/hue/history forwards pagination params | unit | `npm test -- --testPathPattern="hue/history"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="hue" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `lib/hue/__tests__/hueProxy.test.ts` — unit tests for all 7 convenience wrappers (CLIENT-01, CLIENT-03)
- [ ] `app/api/hue/lights/__tests__/route.test.ts` — READ-01
- [ ] `app/api/hue/lights/[id]/__tests__/route.test.ts` — READ-02
- [ ] `app/api/hue/rooms/__tests__/route.test.ts` — READ-03
- [ ] `app/api/hue/rooms/[id]/__tests__/route.test.ts` — READ-04
- [ ] `app/api/hue/scenes/__tests__/route.test.ts` — READ-05
- [ ] `app/api/hue/status/__tests__/route.test.ts` — READ-06
- [ ] `app/api/hue/history/__tests__/route.test.ts` — READ-07

*(TypeScript compilation CLIENT-02 is verified by the full `npx tsc --noEmit` run — no dedicated test file needed)*

---

## Sources

### Primary (HIGH confidence)
- `docs/api/hue.md` — Complete proxy API reference, all endpoint shapes, TypeScript interfaces verified against live Bridge 2026-03-19
- `lib/thermorossiProxy.ts` — Canonical function module client pattern
- `types/thermorossiProxy.ts` — Canonical type file structure
- `lib/haClient.ts` — Transport implementation (haGet/haPost signatures, error mapping)
- `lib/core/apiErrors.ts` — ApiError class and ERROR_CODES
- `app/api/stove/status/route.ts` — Canonical simple proxy route template
- `app/api/stove/history/route.ts` — Canonical query-forwarding route template
- `app/api/raspi/health/route.ts` — Canonical simple proxy route template
- `app/api/raspi/health/__tests__/route.test.ts` — Canonical test structure

### Secondary (MEDIUM confidence)
- `app/api/hue/lights/[id]/route.ts` — Current PUT handler to preserve in Phase 106
- `app/api/hue/rooms/[id]/route.ts` — Current PUT handler to preserve in Phase 106
- `app/api/hue/scenes/route.ts` — Confirms GET-only (no POST) — safe to rewrite

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies are project-internal with confirmed usage patterns
- Architecture: HIGH — direct mirror of thermorossiProxy.ts + stove route templates verified from actual files
- Type interfaces: HIGH — all 7 interfaces verified from live proxy responses (docs/api/hue.md Field Verification Status 2026-03-19)
- Pitfalls: HIGH — identified from actual legacy code inspection (old response wrapping, mixed GET/PUT files)

**Research date:** 2026-03-20
**Valid until:** 2026-06-20 (stable — no external dependencies)
