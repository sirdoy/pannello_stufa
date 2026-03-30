# Phase 147: Tuya Infrastructure - Research

**Researched:** 2026-03-30
**Domain:** Next.js API route proxies + TypeScript function module client
**Confidence:** HIGH

## Summary

Phase 147 is a pure infrastructure phase: create `lib/tuya/tuyaProxy.ts` (proxy client) and 6 API route files under `app/api/tuya/`. No frontend code. All patterns are already established and proven by 7 prior providers (Sonos, DIRIGERA, Fritz!Box, Netatmo, Hue, Raspberry Pi, Thermorossi).

The types are already created in `types/tuyaProxy.ts` (Phase 145 delivered all 8 interfaces). The haGet/haPost transport in `lib/haClient.ts` is the sole dependency. The key decision is that POST command routes (`/state`, `/timer`) return **200 pass-through** (not 202 Accepted) because the Tuya upstream returns 200 with a `data_confirmed` boolean — a different confirmation pattern from Thermorossi's fire-and-forget 202.

The `GET /api/tuya/health` endpoint uses `withErrorHandler` (no auth) per D-04. All other 5 routes use `withAuthAndErrorHandler`. The upstream base path is `/api/v1/tuya/...`.

**Primary recommendation:** Follow DIRIGERA + Sonos as reference implementations. Copy DIRIGERA's proxy client structure (simple read wrappers) plus add Sonos-style haPost wrappers for state/timer commands. History route follows Sonos history pattern (searchParams forwarding). POST routes pass through 200 directly (no HTTP_STATUS.ACCEPTED, no suggested_poll_delay_s).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** POST command routes (`/state`, `/timer`) return **200 pass-through** (not 202 Accepted). The Tuya backend returns 200 with a `data_confirmed` boolean that signals whether the re-poll succeeded, which is a different confirmation pattern from Thermorossi's fire-and-forget 202. Pass through the upstream status code.
- **D-02:** Routes nest under `app/api/tuya/` matching the upstream API path structure: `health/route.ts`, `plugs/route.ts`, `plugs/[device_id]/route.ts`, `plugs/[device_id]/state/route.ts`, `plugs/[device_id]/timer/route.ts`, `plugs/[device_id]/history/route.ts`.
- **D-03:** Upstream 503 (UNREACHABLE device) is mapped through haClient's standard RFC 9457 error mapping to `ApiError(SERVICE_UNAVAILABLE)`. No custom error handling needed beyond what haClient already provides.
- **D-04:** `GET /api/tuya/health` calls `haGet` without auth requirement on the Next.js side (the upstream endpoint requires no auth). All other routes require standard session auth via middleware.
- **D-05:** `lib/tuya/tuyaProxy.ts` function module following the established pattern (sonosProxy, dirigeraProxy, hueProxy). Imports `haGet`/`haPost` from `@/lib/haClient`. Types already exist in `types/tuyaProxy.ts`.

### Claude's Discretion
- JSDoc comment depth and internal helper organization within tuyaProxy.ts
- Whether to export individual route handlers or use inline handlers (follow whichever pattern is most common in recent providers)
- Test file organization (co-located vs `__tests__/lib/`)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TUYA-01 | tuyaProxy.ts function module with haGet/haPost transport for all 6 endpoints | lib/haClient.ts provides haGet/haPost; pattern from dirigeraProxy.ts + sonosProxy.ts |
| TUYA-02 | TypeScript interfaces for TuyaPlug, TuyaPlugMutation, TuyaHealth, TuyaHistoryResponse | Already complete in types/tuyaProxy.ts — no new work needed |
| TUYA-03 | API route proxy GET /api/tuya/health (no auth) | withErrorHandler pattern from app/api/health/route.ts |
| TUYA-04 | API route proxy GET /api/tuya/plugs (list all plugs) | withAuthAndErrorHandler + success() from dirigera/sonos routes |
| TUYA-05 | API route proxy GET /api/tuya/plugs/[device_id] (single plug) | getPathParam from lib/core + dynamic route pattern |
| TUYA-06 | API route proxy POST /api/tuya/plugs/[device_id]/state (toggle on/off) | parseJson + haPost; 200 pass-through per D-01 |
| TUYA-07 | API route proxy POST /api/tuya/plugs/[device_id]/timer (countdown) | parseJson + haPost; 200 pass-through per D-01; seconds validated 0–86400 by upstream |
| TUYA-08 | API route proxy GET /api/tuya/plugs/[device_id]/history (energy history) | searchParams forwarding pattern from sonos/history/route.ts |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@/lib/haClient` | project-internal | haGet/haPost transport | All 7 providers use this; X-API-Key auth, RFC 9457 errors, timeout |
| `@/lib/core` | project-internal | withAuthAndErrorHandler, withErrorHandler, success, getPathParam, parseJson, HTTP_STATUS | All routes use lib/core helpers |
| `@/types/tuyaProxy` | project-internal | All 8 TypeScript interfaces | Already created in Phase 145 — do not recreate |

### No new npm packages required
All infrastructure re-uses existing project libraries. No `npm install` needed.

## Architecture Patterns

### Recommended Project Structure (files to create)

```
lib/
└── tuya/
    ├── tuyaProxy.ts          # NEW — proxy client function module
    └── __tests__/
        └── tuyaProxy.test.ts # NEW — unit tests for proxy client

app/api/tuya/
├── health/
│   └── route.ts              # NEW — GET (no auth, withErrorHandler)
├── plugs/
│   ├── route.ts              # NEW — GET (withAuthAndErrorHandler)
│   └── [device_id]/
│       ├── route.ts          # NEW — GET single plug
│       ├── state/
│       │   └── route.ts      # NEW — POST toggle on/off
│       ├── timer/
│       │   └── route.ts      # NEW — POST countdown timer
│       └── history/
│           └── route.ts      # NEW — GET energy history
```

**10 files total** (1 proxy client + 1 test + 6 route files + 2 `__tests__` dirs implied by test structure).

### Pattern 1: Proxy Client Function Module (tuyaProxy.ts)

```typescript
// Source: lib/dirigera/dirigeraProxy.ts + lib/sonos/sonosProxy.ts
import { haGet, haPost } from '@/lib/haClient';
import type {
  TuyaHealth,
  TuyaPlug,
  TuyaPlugMutation,
  TuyaHistoryResponse,
  TuyaSetStateRequest,
  TuyaSetTimerRequest,
} from '@/types/tuyaProxy';

export async function getHealth(): Promise<TuyaHealth> {
  return haGet<TuyaHealth>('/api/v1/tuya/health');
}

export async function getPlugs(): Promise<TuyaPlug[]> {
  return haGet<TuyaPlug[]>('/api/v1/tuya/plugs');
}

export async function getPlug(deviceId: string): Promise<TuyaPlug> {
  return haGet<TuyaPlug>(`/api/v1/tuya/plugs/${deviceId}`);
}

export async function setState(deviceId: string, body: TuyaSetStateRequest): Promise<TuyaPlugMutation> {
  return haPost<TuyaPlugMutation>(`/api/v1/tuya/plugs/${deviceId}/state`, body);
}

export async function setTimer(deviceId: string, body: TuyaSetTimerRequest): Promise<TuyaPlugMutation> {
  return haPost<TuyaPlugMutation>(`/api/v1/tuya/plugs/${deviceId}/timer`, body);
}

export async function getHistory(deviceId: string, params: Record<string, string | undefined>): Promise<TuyaHistoryResponse> {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)) as Record<string, string>
  ).toString();
  const endpoint = qs
    ? `/api/v1/tuya/plugs/${deviceId}/history?${qs}`
    : `/api/v1/tuya/plugs/${deviceId}/history`;
  return haGet<TuyaHistoryResponse>(endpoint);
}
```

**Note on getHistory:** Sonos history uses a helper function that builds the query string in the proxy. The route passes `searchParams` values → the proxy appends them to the endpoint path. An alternative is to forward raw query string from the route. Either works; the proxy-side approach keeps the route thin.

### Pattern 2: Unauthenticated Health Route

```typescript
// Source: app/api/health/route.ts — withErrorHandler (no session)
import { withErrorHandler, success } from '@/lib/core';
import { getHealth } from '@/lib/tuya/tuyaProxy';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async () => {
  const data = await getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Tuya/Health');
```

**Key:** Use `withErrorHandler` (not `withAuthAndErrorHandler`) per D-04.

### Pattern 3: Authenticated GET Route with Dynamic Segment

```typescript
// Source: app/api/dirigera/health/route.ts + path param pattern
import { withAuthAndErrorHandler, success, getPathParam } from '@/lib/core';
import { getPlug } from '@/lib/tuya/tuyaProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const deviceId = await getPathParam(context, 'device_id');
  const data = await getPlug(deviceId);
  return success(data as unknown as Record<string, unknown>);
}, 'Tuya/Plugs/GetOne');
```

**Note:** The dynamic segment folder is `[device_id]`, so `getPathParam(context, 'device_id')` matches.

### Pattern 4: POST Command Route — 200 Pass-Through (D-01)

```typescript
// D-01: 200 pass-through, NOT 202 Accepted — unlike Thermorossi/Sonos
import { withAuthAndErrorHandler, success, getPathParam, parseJson } from '@/lib/core';
import { setState } from '@/lib/tuya/tuyaProxy';
import type { TuyaSetStateRequest } from '@/types/tuyaProxy';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (request, context) => {
  const deviceId = await getPathParam(context, 'device_id');
  const body = await parseJson(request) as TuyaSetStateRequest;
  const data = await setState(deviceId, body);
  return success(data as unknown as Record<string, unknown>);
}, 'Tuya/Plugs/SetState');
```

**Critical difference:** No `HTTP_STATUS.ACCEPTED` as third arg to `success()`. No `suggested_poll_delay_s`. The `data_confirmed` field in the response body handles consumer re-poll logic.

### Pattern 5: History Route with Query Params Forwarding

```typescript
// Source: app/api/sonos/history/route.ts — searchParams forwarding
import { withAuthAndErrorHandler, success, getPathParam } from '@/lib/core';
import { getHistory } from '@/lib/tuya/tuyaProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request, context) => {
  const deviceId = await getPathParam(context, 'device_id');
  const { searchParams } = request.nextUrl;
  const data = await getHistory(deviceId, {
    period:    searchParams.get('period')    ?? undefined,
    from:      searchParams.get('from')      ?? undefined,
    to:        searchParams.get('to')        ?? undefined,
    page:      searchParams.get('page')      ?? undefined,
    page_size: searchParams.get('page_size') ?? undefined,
  });
  return success(data as unknown as Record<string, unknown>);
}, 'Tuya/Plugs/History');
```

### Pattern 6: Proxy Client Unit Test Structure

```typescript
// Source: lib/dirigera/__tests__/dirigeraProxy.test.ts
jest.mock('@/lib/haClient');

import { haGet, haPost } from '@/lib/haClient';
import { getHealth, getPlugs, getPlug, setState, setTimer, getHistory } from '../tuyaProxy';

const mockHaGet = jest.mocked(haGet);
const mockHaPost = jest.mocked(haPost);

describe('tuyaProxy', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('getHealth() calls /api/v1/tuya/health', async () => {
    mockHaGet.mockResolvedValueOnce({ status: 'ok', devices: [] });
    await getHealth();
    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/tuya/health');
  });

  it('setState() calls /api/v1/tuya/plugs/{id}/state via haPost', async () => {
    mockHaPost.mockResolvedValueOnce({ device_id: 'abc', data_confirmed: true });
    await setState('abc', { on: true });
    expect(mockHaPost).toHaveBeenCalledWith(
      '/api/v1/tuya/plugs/abc/state',
      { on: true }
    );
  });
  // ... etc
});
```

### Anti-Patterns to Avoid
- **Using HTTP_STATUS.ACCEPTED for /state or /timer:** D-01 locked 200 pass-through. Do not add `suggested_poll_delay_s` — the `data_confirmed` field already handles re-poll signaling.
- **Using withAuthAndErrorHandler for /health:** D-04 locked no auth on health. Use `withErrorHandler`.
- **Recreating types:** All 8 interfaces already exist in `types/tuyaProxy.ts`. Import, don't redefine.
- **Custom error handling for 503:** D-03 locked — haClient's standard RFC 9457 mapping handles UNREACHABLE → SERVICE_UNAVAILABLE automatically.
- **Putting routes under `/api/v1/tuya/` (Next.js path):** The Next.js routes live at `app/api/tuya/` (no `/v1/`). The `/v1/` prefix belongs to the HA upstream endpoint path only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth + error wrapping | Custom auth middleware | `withAuthAndErrorHandler` from `@/lib/core` | Handles Auth0 session, ApiError mapping, logging |
| Unauthenticated error wrapping | Custom try/catch | `withErrorHandler` from `@/lib/core` | Consistent error response format |
| HTTP transport + auth header | Custom fetch wrapper | `haGet`/`haPost` from `@/lib/haClient` | Handles X-API-Key, timeout, RFC 9457 parsing |
| Dynamic path param extraction | `params.device_id` direct access | `getPathParam(context, 'device_id')` | Async-safe, throws ApiError on missing param |
| JSON body parsing | `await request.json()` directly | `parseJson(request)` from `@/lib/core` | Handles empty/invalid body gracefully |
| JSON success response | `NextResponse.json(data, {status: 200})` | `success(data)` from `@/lib/core` | Standard envelope format expected by clients |

## Common Pitfalls

### Pitfall 1: 202 vs 200 for POST Command Routes
**What goes wrong:** Copying Sonos/Thermorossi POST route and adding `HTTP_STATUS.ACCEPTED` and `suggested_poll_delay_s` to the response.
**Why it happens:** All other provider POST command routes use 202 Accepted fire-and-forget.
**How to avoid:** Tuya's confirmation pattern is different — the upstream already re-polls and returns `data_confirmed: true/false` in the 200 body. Use plain `success(data)` with no status override.
**Warning signs:** `HTTP_STATUS.ACCEPTED` or `suggested_poll_delay_s` appearing in state/timer routes.

### Pitfall 2: Auth on Health Route
**What goes wrong:** Using `withAuthAndErrorHandler` for `GET /api/tuya/health`.
**Why it happens:** All other routes in the provider use `withAuthAndErrorHandler`.
**How to avoid:** Health is explicitly no-auth per D-04 and the upstream API spec. Use `withErrorHandler`.
**Warning signs:** `withAuthAndErrorHandler` in `health/route.ts`.

### Pitfall 3: History Route Missing Device ID in Upstream Path
**What goes wrong:** Calling `/api/v1/tuya/history` (no device_id) instead of `/api/v1/tuya/plugs/{device_id}/history`.
**Why it happens:** Sonos history is at a top-level `/history` endpoint. Tuya history is per-device.
**How to avoid:** History endpoint is `GET /api/v1/tuya/plugs/{device_id}/history` — both the Next.js route and the upstream path include `device_id`.
**Warning signs:** Proxy function `getHistory` accepting no `deviceId` parameter.

### Pitfall 4: Dynamic Folder Named `[id]` Instead of `[device_id]`
**What goes wrong:** Creating `app/api/tuya/plugs/[id]/` instead of `app/api/tuya/plugs/[device_id]/`.
**Why it happens:** Using a generic `[id]` pattern.
**How to avoid:** D-02 and the API spec use `device_id` as the parameter name. Folder must be `[device_id]` and `getPathParam(context, 'device_id')` must match exactly.
**Warning signs:** `getPathParam(context, 'id')` in route files.

### Pitfall 5: Importing Types That Already Exist
**What goes wrong:** Defining TypeScript interfaces in `tuyaProxy.ts` or route files instead of importing from `@/types/tuyaProxy`.
**Why it happens:** Implementer doesn't check what Phase 145 already delivered.
**How to avoid:** `types/tuyaProxy.ts` contains all 8 interfaces. Always import from there.
**Warning signs:** Inline interface definitions in proxy client or route files.

## Code Examples

### History Query String Building in Proxy

```typescript
// Approach: proxy builds the query string (keeps routes thin)
export async function getHistory(
  deviceId: string,
  params: {
    period?: string;
    from?: string;
    to?: string;
    page?: string;
    page_size?: string;
  }
): Promise<TuyaHistoryResponse> {
  const defined = Object.entries(params).filter(([, v]) => v !== undefined);
  const qs = defined.length > 0
    ? '?' + new URLSearchParams(defined as [string, string][]).toString()
    : '';
  return haGet<TuyaHistoryResponse>(`/api/v1/tuya/plugs/${deviceId}/history${qs}`);
}
```

### lib/core Exports Used in This Phase

```typescript
// Source: lib/core/index.ts (existing exports)
import {
  withAuthAndErrorHandler,   // authenticated routes
  withErrorHandler,          // health route (no auth)
  success,                   // 200 JSON response
  getPathParam,              // async-safe dynamic param extraction
  parseJson,                 // body parsing for POST routes
  HTTP_STATUS,               // constants (not needed for 200 pass-through)
} from '@/lib/core';
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct Tuya LAN API | HA proxy with haGet/haPost | v13.0+ | All device APIs go through shared proxy |
| Provider-specific auth | Shared X-API-Key via HA_API_KEY env var | v11.0 | No per-provider credentials |
| 202 Accepted for commands | 200 pass-through for Tuya commands | Phase 147 D-01 | Different from all other providers — Tuya confirms via data_confirmed field |

## Environment Availability

Step 2.6: SKIPPED — Phase 147 is purely code/config changes. No new external dependencies. The HA proxy (HA_API_URL + HA_API_KEY env vars) is already in use by 7 other providers and confirmed working.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (via next/jest) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="tuya" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TUYA-01 | tuyaProxy functions call haGet/haPost with correct paths | unit | `npm test -- --testPathPattern="tuyaProxy"` | ❌ Wave 0 |
| TUYA-02 | Types compile without errors | compile | `npx tsc --noEmit` | ✅ types/tuyaProxy.ts exists |
| TUYA-03 | GET /api/tuya/health returns 200, no auth required | unit | `npm test -- --testPathPattern="api/tuya/health"` | ❌ Wave 0 |
| TUYA-04 | GET /api/tuya/plugs returns 200, requires auth | unit | `npm test -- --testPathPattern="api/tuya/plugs"` | ❌ Wave 0 |
| TUYA-05 | GET /api/tuya/plugs/[device_id] returns 200 with device_id param | unit | `npm test -- --testPathPattern="api/tuya/plugs"` | ❌ Wave 0 |
| TUYA-06 | POST /api/tuya/plugs/[device_id]/state returns 200, passes body | unit | `npm test -- --testPathPattern="api/tuya/plugs"` | ❌ Wave 0 |
| TUYA-07 | POST /api/tuya/plugs/[device_id]/timer returns 200, passes body | unit | `npm test -- --testPathPattern="api/tuya/plugs"` | ❌ Wave 0 |
| TUYA-08 | GET /api/tuya/plugs/[device_id]/history forwards query params | unit | `npm test -- --testPathPattern="api/tuya/plugs"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="tuya" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `lib/tuya/__tests__/tuyaProxy.test.ts` — covers TUYA-01 (proxy function → haGet/haPost path assertions)
- [ ] `app/api/tuya/health/__tests__/route.test.ts` — covers TUYA-03 (no auth, 200)
- [ ] `app/api/tuya/plugs/__tests__/route.test.ts` — covers TUYA-04 (auth required, list)
- [ ] `app/api/tuya/plugs/[device_id]/__tests__/route.test.ts` — covers TUYA-05 (single plug, path param)
- [ ] `app/api/tuya/plugs/[device_id]/state/__tests__/route.test.ts` — covers TUYA-06 (POST 200)
- [ ] `app/api/tuya/plugs/[device_id]/timer/__tests__/route.test.ts` — covers TUYA-07 (POST 200)
- [ ] `app/api/tuya/plugs/[device_id]/history/__tests__/route.test.ts` — covers TUYA-08 (query forwarding)

## Open Questions

1. **History query string: proxy-side vs route-side building**
   - What we know: Sonos history builds the query string inside the proxy function. The route just passes `searchParams` values as a params object.
   - What's unclear: Whether to match Sonos exactly (proxy builds QS) or use a simpler approach where the route constructs the full query string.
   - Recommendation: Match Sonos pattern for consistency — proxy function accepts optional params object and builds the QS internally.

2. **GET /api/tuya/plugs/[device_id] route name in logContext**
   - What we know: Convention is `'Provider/Resource/Action'` (e.g., `'Sonos/Zones/Play'`).
   - Recommendation: Use `'Tuya/Plugs/GetOne'`, `'Tuya/Plugs/SetState'`, `'Tuya/Plugs/SetTimer'`, `'Tuya/Plugs/History'`.

## Project Constraints (from CLAUDE.md)

- **NEVER** break existing functionality
- **WAIT** for user confirmation before version updates
- **PREFER** editing existing files over creating new (N/A — all files in this phase are new)
- **NEVER** execute `npm run build` or `npm install`
- **ALWAYS** create/update unit tests (Wave 0 gaps listed above)
- **USE** design system (N/A — no UI in this phase)
- **NEVER** commit/push without explicit request

## Sources

### Primary (HIGH confidence)
- `lib/haClient.ts` — verified haGet/haPost/haPut/haDelete signatures, error handling, env var names
- `lib/dirigera/dirigeraProxy.ts` — verified proxy client function module pattern (read-only, haGet only)
- `lib/sonos/sonosProxy.ts` — verified proxy client with haPost command wrappers
- `app/api/dirigera/health/route.ts` — verified withAuthAndErrorHandler + success() pattern
- `app/api/sonos/health/route.ts` — verified route pattern
- `app/api/sonos/zones/[groupId]/play/route.ts` — verified POST with getPathParam + 202 pattern (contrast with Tuya 200)
- `app/api/sonos/zones/[groupId]/volume/route.ts` — verified PUT with parseJson + typed body
- `app/api/sonos/history/route.ts` — verified searchParams forwarding to proxy
- `app/api/health/route.ts` — verified withErrorHandler (no auth) pattern
- `lib/dirigera/__tests__/dirigeraProxy.test.ts` — verified test structure: jest.mock haClient, jest.mocked, beforeEach clearAllMocks
- `app/api/raspi/health/__tests__/route.test.ts` — verified route test structure
- `types/tuyaProxy.ts` — verified all 8 interfaces exist and are correctly typed
- `docs/api/tuya.md` — authoritative API spec: all 6 endpoints, request/response shapes, error codes
- `jest.config.ts` — verified `__tests__/` directory convention, testPathIgnorePatterns

### Secondary (MEDIUM confidence)
- `.planning/phases/147-tuya-infrastructure/147-CONTEXT.md` — user decisions D-01 through D-05

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libs are internal project code, fully verified by reading source
- Architecture patterns: HIGH — verified against 4 reference implementations
- Pitfalls: HIGH — derived from direct comparison with existing provider implementations
- Test patterns: HIGH — verified against dirigeraProxy.test.ts and raspi route.test.ts

**Research date:** 2026-03-30
**Valid until:** Stable (no external dependencies)
