# Phase 161: Netatmo Gap Closure - Research

**Researched:** 2026-04-09
**Domain:** Next.js 15.5 API routes — Netatmo proxy v1 route migration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Create v1 route files under `app/api/v1/netatmo/` for ALL 21 endpoints in the Netatmo API spec (not just the 9 gap requirements). This completes the full v1 migration for the Netatmo provider, matching the Phase 160 Sonos approach.
- **D-02:** All v1 routes follow the established pattern: `export const dynamic = 'force-dynamic'`, `withAuthAndErrorHandler` wrapper, proxy function delegation from `lib/netatmo/netatmoProxy.ts`.
- **D-03:** Add 4 new proxy functions to `lib/netatmo/netatmoProxy.ts`:
  - `getProxyThermState()` → `haGet('/api/v1/netatmo/getthermstate')`
  - `proxyCalibrateValve(moduleId)` → `haPost('/api/v1/netatmo/valves/{module_id}/calibrate', {})`
  - `proxyRenameHome(body)` → `haPost('/api/v1/netatmo/renamehome', body)`
  - `getProxyHomeData()` → `haGet('/api/v1/netatmo/gethomedata')`
- **D-04:** New types for these endpoints go in `types/netatmoProxy.ts` following existing patterns.
- **D-05:** Route-to-proxy-function mapping (21 routes) as specified in CONTEXT.md.
- **D-06:** Old `/api/netatmo/*` routes remain for backward compatibility. They are NOT moved or deleted in this phase.
- **D-07:** Frontend hooks are NOT updated in this phase.
- **D-08:** Each new v1 route gets a co-located `__tests__/route.test.ts` test file, following the Phase 160 Sonos route test pattern.
- **D-09:** V1 routes return identical response shapes to old routes. Command routes include `suggested_poll_delay_s: 1` in 202 responses.

### Claude's Discretion

- Log tag naming convention for `withAuthAndErrorHandler` (e.g., `'Netatmo/Health'`, `'Netatmo/Camera/Stream'`)
- Test assertion granularity and mock structure
- Query parameter parsing for `getroommeasure` endpoint

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NETA-01 | GET /api/v1/netatmo/getthermstate ritorna stato termostato corrente | New proxy fn `getProxyThermState()` + v1 route. `device_id` query param forwarded to HA proxy. |
| NETA-02 | POST /api/v1/netatmo/valves/calibrate calibra tutte le valvole | Proxy fn `proxyCalibrateValves()` already exists. Needs v1 route wrapper with 202 + `suggested_poll_delay_s: 1`. |
| NETA-03 | POST /api/v1/netatmo/valves/{module_id}/calibrate calibra singola valvola | New proxy fn `proxyCalibrateValve(moduleId)`. New v1 route with `[moduleId]` dynamic segment. 202 response. |
| NETA-04 | GET /api/v1/netatmo/camera/events/{event_id}/snapshot ritorna snapshot evento | Proxy fn `getProxyCameraEventSnapshot(eventId)` already exists. New v1 route mirrors old binary streaming pattern. |
| NETA-05 | GET /api/v1/netatmo/camera/{camera_id}/stream ritorna URL stream RTSP | Proxy fn `getProxyCameraStream(cameraId)` already exists. New v1 route with `[cameraId]` dynamic segment. |
| NETA-06 | GET /api/v1/netatmo/camera/{camera_id}/snapshot ritorna snapshot camera | Proxy fn `getProxyCameraSnapshot(cameraId)` already exists. New v1 route. |
| NETA-07 | POST /api/v1/netatmo/camera/{camera_id}/monitoring toggle monitoraggio camera | Proxy fn `proxySetCameraMonitoring(cameraId, body)` already exists. New v1 route with body parsing. 202 response. |
| NETA-08 | POST /api/v1/netatmo/renamehome rinomina un home | New proxy fn `proxyRenameHome(body)`. New v1 route with body parsing. 202 response. |
| NETA-09 | GET /api/v1/netatmo/gethomedata ritorna snapshot completo home | New proxy fn `getProxyHomeData()`. New v1 route. 200 response. |
</phase_requirements>

---

## Summary

Phase 161 creates the full set of `/api/v1/netatmo/*` Next.js route handlers — 21 routes covering all endpoints in `docs/api/netatmo.md`. Sixteen proxy functions already exist in `lib/netatmo/netatmoProxy.ts`; the phase adds 4 new ones for `getthermstate`, single-valve `calibrate`, `renamehome`, and `gethomedata`. All routes are thin wrappers: they authenticate via `withAuthAndErrorHandler`, delegate to a proxy function, and return `success()` (200) or `success({...data, suggested_poll_delay_s: 1}, null, HTTP_STATUS.ACCEPTED)` (202). The binary camera event snapshot endpoint is the only structural exception — it streams a raw JPEG response.

The pattern is fully established from Phase 160 (Sonos). Every new route gets a co-located `__tests__/route.test.ts` with two test cases: 401 when unauthenticated, and expected status code with proxy data on success.

**Primary recommendation:** Follow the Phase 160 Sonos pattern exactly. No new libraries or patterns are needed.

---

## Standard Stack

### Core (all already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.5 | Route handlers | Project framework [VERIFIED: package.json] |
| `lib/core` (`withAuthAndErrorHandler`, `success`, `getPathParam`, `parseJson`, `HTTP_STATUS`) | project | Auth, response helpers, param extraction | Established project pattern [VERIFIED: codebase] |
| `lib/haClient` (`haGet`, `haPost`) | project | HA proxy transport | Established for all 7 providers [VERIFIED: codebase] |
| `lib/netatmo/netatmoProxy.ts` | project | 16 existing + 4 new proxy functions | Established pattern [VERIFIED: codebase] |
| `types/netatmoProxy.ts` | project | TypeScript types for proxy responses | Established pattern [VERIFIED: codebase] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `NextResponse` | Next.js | Binary streaming for camera event snapshot | Only needed for binary endpoint |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Directory Structure

```
app/api/v1/netatmo/
├── health/route.ts
├── homesdata/route.ts
├── homestatus/route.ts
├── getthermstate/route.ts                      ← NEW
├── getroommeasure/route.ts
├── gethomedata/route.ts                        ← NEW
├── setroomthermpoint/route.ts
├── setthermmode/route.ts
├── switchhomeschedule/route.ts
├── synchomeschedule/route.ts
├── createnewhomeschedule/route.ts
├── renamehome/route.ts                         ← NEW
├── valves/
│   ├── route.ts                                (GET)
│   ├── calibrate/route.ts                      (POST)
│   └── [moduleId]/calibrate/route.ts           ← NEW
└── camera/
    ├── events/
    │   ├── route.ts                            (GET)
    │   └── [eventId]/snapshot/route.ts         ← NEW
    ├── status/route.ts
    └── [cameraId]/
        ├── stream/route.ts                     ← NEW
        ├── snapshot/route.ts                   ← NEW
        └── monitoring/route.ts                 ← NEW
```

Each route directory contains:
- `route.ts` — the handler
- `__tests__/route.test.ts` — co-located test

### Pattern 1: GET endpoint (200 OK)

```typescript
// Source: app/api/v1/thermorossi/status/route.ts [VERIFIED: codebase]
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyThermState } from '@/lib/netatmo/netatmoProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getProxyThermState();
  return success(data as unknown as Record<string, unknown>);
}, 'Netatmo/GetThermState');
```

### Pattern 2: GET with path param (200 OK)

```typescript
// Source: app/api/v1/sonos/zones/[groupId]/playback/route.ts [VERIFIED: codebase]
import { withAuthAndErrorHandler, success, getPathParam } from '@/lib/core';
import { getProxyCameraStream } from '@/lib/netatmo/netatmoProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const cameraId = await getPathParam(context, 'cameraId');
  const data = await getProxyCameraStream(cameraId);
  return success(data as unknown as Record<string, unknown>);
}, 'Netatmo/Camera/Stream');
```

### Pattern 3: GET with query params forwarded (200 OK)

For `getthermstate` which requires a `device_id` query param and `getroommeasure` which requires multiple params:

```typescript
// Source: app/api/netatmo/getroommeasure/route.ts pattern [ASSUMED - route not inspected]
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyThermState } from '@/lib/netatmo/netatmoProxy';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const data = await getProxyThermState(searchParams);
  return success(data as unknown as Record<string, unknown>);
}, 'Netatmo/GetThermState');
```

**Note:** The proxy function for `getthermstate` needs to accept and forward the `device_id` query parameter. See proxy function design below.

### Pattern 4: POST command (202 Accepted)

```typescript
// Source: app/api/v1/sonos/zones/[groupId]/play/route.ts [VERIFIED: codebase]
import { withAuthAndErrorHandler, success, getPathParam, HTTP_STATUS } from '@/lib/core';
import { proxyCalibrateValve } from '@/lib/netatmo/netatmoProxy';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (_request, context) => {
  const moduleId = await getPathParam(context, 'moduleId');
  const data = await proxyCalibrateValve(moduleId);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Netatmo/Valves/Calibrate');
```

### Pattern 5: POST command with body (202 Accepted)

```typescript
// Source: app/api/v1/sonos/zones/[groupId]/seek/route.ts [VERIFIED: codebase]
import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { proxySetCameraMonitoring } from '@/lib/netatmo/netatmoProxy';
import type { SetMonitoringRequest } from '@/types/netatmoProxy';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (request, context) => {
  const cameraId = await getPathParam(context, 'cameraId');
  const body = await parseJson(request) as SetMonitoringRequest;
  const data = await proxySetCameraMonitoring(cameraId, body);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Netatmo/Camera/Monitoring');
```

### Pattern 6: Binary streaming endpoint

```typescript
// Source: app/api/netatmo/camera/events/[eventId]/snapshot/route.ts [VERIFIED: codebase]
import { withAuthAndErrorHandler, getPathParam } from '@/lib/core';
import { getProxyCameraEventSnapshot } from '@/lib/netatmo/netatmoProxy';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const eventId = await getPathParam(context, 'eventId');
  const response = await getProxyCameraEventSnapshot(eventId);
  return new NextResponse(response.body, {
    status: 200,
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}, 'Netatmo/Camera/EventSnapshot');
```

### Pattern 7: Test file structure

```typescript
// Source: app/api/v1/sonos/zones/[groupId]/play/__tests__/route.test.ts [VERIFIED: codebase]
jest.mock('@/lib/netatmo/netatmoProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';  // or POST
import * as netatmoProxy from '@/lib/netatmo/netatmoProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockProxyFn = jest.mocked(netatmoProxy.getProxyThermState);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/v1/netatmo/getthermstate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/netatmo/getthermstate');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with therm state data', async () => {
    mockProxyFn.mockResolvedValue({ body: { status: 'ok' } } as any);
    const request = new Request('http://localhost:3000/api/v1/netatmo/getthermstate?device_id=09:00:00:aa:bb:cc');
    const response = await GET(request as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockProxyFn).toHaveBeenCalled();
  });
});
```

### Anti-Patterns to Avoid

- **Old-route camera monitoring body pattern:** The old `/api/netatmo/camera/monitoring` route reads `camera_id` from the body and uses `parseJsonOrThrow`. The new v1 route takes `cameraId` from the path param and uses `parseJson` from `@/lib/core` — do not copy the old pattern.
- **Firebase logging in v1 routes:** The Hue v1 light state route logs to Firebase; Sonos v1 routes do not. For Netatmo v1 thin wrappers, do NOT add Firebase logging (D-09: thin wrappers only).
- **Importing `NextRequest` for GET routes:** Only import when reading `request.url` for query params. Use `_request` as parameter name when request is not consumed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth + error handling | Custom middleware | `withAuthAndErrorHandler` from `@/lib/core` | Handles 401, 500, RFC 9457 error mapping consistently |
| Path param extraction | `context.params.xxx` directly | `getPathParam(context, 'xxx')` | Handles Next.js 15 async params pattern |
| JSON body parsing | `request.json()` directly | `parseJson(request)` from `@/lib/core` | Consistent error handling |
| 200 JSON response | `NextResponse.json(...)` | `success(data)` from `@/lib/core` | Consistent `{ success: true, ...data }` envelope |
| HA proxy HTTP calls | `fetch(HA_API_URL + ...)` | `haGet`/`haPost` from `@/lib/haClient` | Auth, timeout, error mapping built in |

**Key insight:** Every non-binary Netatmo v1 route is 8–12 lines. If a route is longer, something is being hand-rolled that shouldn't be.

---

## New Proxy Functions Needed

Four functions to add to `lib/netatmo/netatmoProxy.ts`:

### `getProxyThermState(params: URLSearchParams)`
```typescript
// Calls GET /api/v1/netatmo/getthermstate?device_id=... on the HA proxy.
export async function getProxyThermState(params: URLSearchParams): Promise<NetatmoThermstateResponse> {
  return haGet<NetatmoThermstateResponse>(`/api/v1/netatmo/getthermstate?${params.toString()}`);
}
```

### `proxyCalibrateValve(moduleId: string)`
```typescript
// Calls POST /api/v1/netatmo/valves/{moduleId}/calibrate on the HA proxy.
export async function proxyCalibrateValve(moduleId: string): Promise<CalibrateValveResponse> {
  return haPost<CalibrateValveResponse>(`/api/v1/netatmo/valves/${moduleId}/calibrate`, {});
}
```

### `proxyRenameHome(body: RenameHomeRequest)`
```typescript
// Calls POST /api/v1/netatmo/renamehome on the HA proxy.
export async function proxyRenameHome(body: RenameHomeRequest): Promise<ProxyControlResponse> {
  return haPost<ProxyControlResponse>('/api/v1/netatmo/renamehome', body as unknown as Record<string, unknown>);
}
```

### `getProxyHomeData()`
```typescript
// Calls GET /api/v1/netatmo/gethomedata on the HA proxy.
export async function getProxyHomeData(): Promise<NetatmoHomedataResponse> {
  return haGet<NetatmoHomedataResponse>('/api/v1/netatmo/gethomedata');
}
```

---

## New Types Needed

Three new types to add to `types/netatmoProxy.ts`:

```typescript
// From docs/api/netatmo.md [VERIFIED: codebase]

/** GET /getthermstate response */
interface NetatmoSetpoint {
  setpoint_mode: string;
  setpoint_temp: number | null;
  setpoint_endtime: number | null;
}
interface NetatmoThermProgram {
  program_id: string;
  name: string;
  selected: number;
  timetable: Record<string, unknown>[];
}
export interface NetatmoThermstateResponse {
  body: {
    status: string;
    setpoint: NetatmoSetpoint;
    therm_program_list: NetatmoThermProgram[];
    device_id: string;
  };
  status: string;
  time_exec: number;
  time_server: number;
}

/** POST /renamehome request body */
export interface RenameHomeRequest {
  home_id: string;
  name: string;
}

/** GET /gethomedata response */
export interface NetatmoHomedataResponse {
  body: {
    homes: Array<{
      id: string;
      cameras: Record<string, unknown>[];
      smokedetectors: Record<string, unknown>[];
      persons: Record<string, unknown>[];
    }>;
    global_info: Record<string, unknown>;
  };
  status: string;
  time_exec: number;
  time_server: number;
}

/** POST /valves/{module_id}/calibrate response */
export interface CalibrateValveResponse {
  status: 'accepted';
  module_id: string;
  poll_endpoint: string;
}
```

Note: `ProxyControlResponse` (already in types file) covers the `renamehome` response — no new type needed for response. The `RenameHomeRequest` interface is new.

---

## Existing Routes in Old Path (NOT touched)

The following old routes exist in `app/api/netatmo/` and are preserved as-is per D-06:

| Old route | Notes |
|-----------|-------|
| `camera/events/[eventId]/snapshot` | Binary streaming — has exact same implementation needed for v1 |
| `camera/monitoring` | Takes `camera_id` from body — v1 version takes it from path |
| `camera/snapshot` | No camera_id path param in old route — v1 adds `[cameraId]` |
| `camera/stream` | No camera_id path param in old route — v1 adds `[cameraId]` |
| `camera/status` | Straightforward |
| `camera/events` | Straightforward |

**Key structural difference:** Old camera routes for snapshot/stream/monitoring embed `camera_id` in the request body or have no ID. V1 routes use URL path params — this is intentional per the API spec.

---

## Common Pitfalls

### Pitfall 1: Next.js 15 async path params
**What goes wrong:** Accessing `context.params.xxx` directly throws because params is a Promise in Next.js 15.
**Why it happens:** App Router changed params to async in Next.js 15.
**How to avoid:** Always use `await getPathParam(context, 'paramName')` — never `context.params.xxx`.
**Warning signs:** TypeScript error on `context.params`; runtime error about `.then is not a function`.

### Pitfall 2: `suggested_poll_delay_s` spread on non-command routes
**What goes wrong:** Including `suggested_poll_delay_s: 1` in 200 GET responses.
**Why it happens:** Copy-paste from command route template.
**How to avoid:** Only 202 command routes include `suggested_poll_delay_s`. Check D-09 in CONTEXT.md.

### Pitfall 3: Binary endpoint returns `success()` wrapper
**What goes wrong:** Wrapping camera event snapshot in `success()` returns JSON instead of binary.
**Why it happens:** Forgetting the special case for binary endpoints.
**How to avoid:** Camera event snapshot route must use `new NextResponse(response.body, { status: 200, headers: { 'Content-Type': 'image/jpeg', ... } })` — never `success()`.

### Pitfall 4: `getthermstate` query param not forwarded
**What goes wrong:** Route calls proxy without forwarding `device_id` — HA proxy returns 422.
**Why it happens:** Simple GET routes don't usually need request access; `getthermstate` is an exception.
**How to avoid:** The proxy function signature must accept `URLSearchParams`. The route must read `new URL(request.url).searchParams` and pass it through. Use `(request: NextRequest)` (not `_request`) for this route.

### Pitfall 5: Missing `__tests__` for some routes
**What goes wrong:** Planner creates routes but skips tests for simpler endpoints (health, valves GET).
**Why it happens:** D-08 says ALL new v1 routes get a test — easy to overlook the simple ones.
**How to avoid:** Every one of the 21 route files must have a co-located `__tests__/route.test.ts`.

### Pitfall 6: Naming `[moduleId]` vs `[module_id]`
**What goes wrong:** Using `[module_id]` creates a Next.js dynamic segment with underscore in the param name; `getPathParam(context, 'module_id')` works, but inconsistency with Sonos pattern (`groupId`) makes code less uniform.
**How to avoid:** Use camelCase `[moduleId]` for dynamic segments and `getPathParam(context, 'moduleId')` — consistent with Sonos `[groupId]` / `getPathParam(context, 'groupId')` pattern.

---

## Route-to-Function-to-Test Map

Complete map of all 21 routes (planner-ready):

| Method | V1 Path | Proxy Function | Response | New? |
|--------|---------|----------------|----------|------|
| GET | `/health` | `getProxyHealth()` | 200 | Route only |
| GET | `/homesdata` | `getProxyHomesdata()` | 200 | Route only |
| GET | `/homestatus` | `getProxyHomestatus()` | 200 | Route only |
| GET | `/getthermstate` | `getProxyThermState(params)` | 200 | Proxy fn + route |
| GET | `/getroommeasure` | `getProxyRoomMeasure(params)` | 200 | Route only |
| GET | `/gethomedata` | `getProxyHomeData()` | 200 | Proxy fn + route |
| POST | `/setroomthermpoint` | `proxySetRoomThermpoint(body)` | 202 | Route only |
| POST | `/setthermmode` | `proxySetThermMode(body)` | 202 | Route only |
| POST | `/switchhomeschedule` | `proxySwitchHomeSchedule(body)` | 202 | Route only |
| POST | `/synchomeschedule` | `proxySyncHomeSchedule(body)` | 202 | Route only |
| POST | `/createnewhomeschedule` | `proxyCreateNewHomeSchedule(body)` | 202 | Route only |
| POST | `/renamehome` | `proxyRenameHome(body)` | 202 | Proxy fn + route |
| GET | `/valves` | `getProxyValves()` | 200 | Route only |
| POST | `/valves/calibrate` | `proxyCalibrateValves()` | 202 | Route only |
| POST | `/valves/[moduleId]/calibrate` | `proxyCalibrateValve(moduleId)` | 202 | Proxy fn + route |
| GET | `/camera/events` | `getProxyCameraEvents(hours?)` | 200 | Route only |
| GET | `/camera/events/[eventId]/snapshot` | `getProxyCameraEventSnapshot(eventId)` | 200 binary | Route only |
| GET | `/camera/status` | `getProxyCameraStatus()` | 200 | Route only |
| GET | `/camera/[cameraId]/stream` | `getProxyCameraStream(cameraId)` | 200 | Route only |
| GET | `/camera/[cameraId]/snapshot` | `getProxyCameraSnapshot(cameraId)` | 200 | Route only |
| POST | `/camera/[cameraId]/monitoring` | `proxySetCameraMonitoring(cameraId, body)` | 202 | Route only |

**New proxy functions:** 4 (getthermstate, gethomedata, renamehome, valves/[moduleId]/calibrate)
**New types:** 4 (NetatmoThermstateResponse, RenameHomeRequest, NetatmoHomedataResponse, CalibrateValveResponse)
**New route files:** 21
**New test files:** 21

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="app/api/v1/netatmo" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NETA-01 | GET /getthermstate returns 200 with therm state | unit | `npm test -- --testPathPattern="v1/netatmo/getthermstate"` | No — Wave 0 |
| NETA-02 | POST /valves/calibrate returns 202 with results | unit | `npm test -- --testPathPattern="v1/netatmo/valves/calibrate"` | No — Wave 0 |
| NETA-03 | POST /valves/[moduleId]/calibrate returns 202 | unit | `npm test -- --testPathPattern="v1/netatmo/valves"` | No — Wave 0 |
| NETA-04 | GET /camera/events/[eventId]/snapshot streams binary | unit | `npm test -- --testPathPattern="v1/netatmo/camera/events"` | No — Wave 0 |
| NETA-05 | GET /camera/[cameraId]/stream returns 200 with URLs | unit | `npm test -- --testPathPattern="v1/netatmo/camera"` | No — Wave 0 |
| NETA-06 | GET /camera/[cameraId]/snapshot returns 200 | unit | `npm test -- --testPathPattern="v1/netatmo/camera"` | No — Wave 0 |
| NETA-07 | POST /camera/[cameraId]/monitoring returns 202 | unit | `npm test -- --testPathPattern="v1/netatmo/camera"` | No — Wave 0 |
| NETA-08 | POST /renamehome returns 202 | unit | `npm test -- --testPathPattern="v1/netatmo/renamehome"` | No — Wave 0 |
| NETA-09 | GET /gethomedata returns 200 with home data | unit | `npm test -- --testPathPattern="v1/netatmo/gethomedata"` | No — Wave 0 |

### Wave 0 Gaps
- [ ] All 21 `__tests__/route.test.ts` files — none exist yet (new route tree)

---

## Environment Availability

Step 2.6: SKIPPED — phase is code-only changes; no new external dependencies. Existing HA proxy connection via `HA_API_URL`/`HA_API_KEY` env vars is already operational from Phase 75+.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `getroommeasure` v1 route follows same query-param-forwarding approach as the old route | Route-to-Function map | Low risk — old route exists in `app/api/netatmo/getroommeasure/` and pattern is consistent with other param-forwarding routes |
| A2 | `getthermstate` proxy function should accept `URLSearchParams` and forward as query string | New Proxy Functions section | Medium — if HA proxy does not accept query params in this format, the route would need adjustment |

**Note:** A1 was [ASSUMED] because the old `getroommeasure/route.ts` was not read. The pattern is consistent with the codebase. A2 follows directly from the API spec which states `device_id` is a required query parameter.

---

## Sources

### Primary (HIGH confidence)
- `lib/netatmo/netatmoProxy.ts` — all 16 existing proxy functions verified [VERIFIED: codebase]
- `types/netatmoProxy.ts` — all existing types verified [VERIFIED: codebase]
- `docs/api/netatmo.md` — all 21 endpoint specs, request/response shapes, TypeScript types [VERIFIED: codebase]
- `app/api/v1/sonos/zones/[groupId]/play/route.ts` — canonical 202 command route pattern [VERIFIED: codebase]
- `app/api/v1/sonos/zones/[groupId]/playback/route.ts` — canonical 200 GET with path param [VERIFIED: codebase]
- `app/api/v1/sonos/zones/[groupId]/seek/route.ts` — canonical 202 with body parsing [VERIFIED: codebase]
- `app/api/v1/sonos/zones/[groupId]/play/__tests__/route.test.ts` — canonical test pattern [VERIFIED: codebase]
- `app/api/v1/thermorossi/status/route.ts` — canonical simple GET 200 pattern [VERIFIED: codebase]
- `app/api/netatmo/camera/events/[eventId]/snapshot/route.ts` — binary streaming pattern [VERIFIED: codebase]

### Secondary (MEDIUM confidence)
- `app/api/netatmo/camera/monitoring/route.ts` — old camera monitoring route, shows body-parsing approach that v1 replaces with path param [VERIFIED: codebase]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project, verified
- Architecture patterns: HIGH — direct code inspection of canonical reference files
- Pitfalls: HIGH — identified from code differences between old/new patterns and Next.js 15 param handling

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable — no external dependencies)
