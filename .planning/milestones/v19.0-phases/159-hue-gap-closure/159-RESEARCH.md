# Phase 159: Hue Gap Closure - Research

**Researched:** 2026-04-09
**Domain:** Next.js API route creation — Hue proxy wrapper routes under `/api/v1/hue/`
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Create new route files under `app/api/v1/hue/` following the established proxy pattern (withAuthAndErrorHandler + proxy function call). Do NOT move or delete old `/api/hue/*` routes — those remain for backwards compatibility.
- **D-02:** All new v1 routes follow the same structure as `app/api/v1/thermorossi/` routes: `export const dynamic = 'force-dynamic'`, `withAuthAndErrorHandler` wrapper, proxy function delegation.
- **D-03:** Create `app/api/v1/hue/groups/route.ts` (GET — calls `getGroups()`) — no existing old-path equivalent
- **D-04:** Create `app/api/v1/hue/groups/[groupId]/route.ts` (GET — calls `getGroup(groupId)`) — no existing old-path equivalent
- **D-05:** Create `app/api/v1/hue/groups/[groupId]/action/route.ts` (PUT — calls `setGroupAction(groupId, body)`) with Firebase log and 202 response — no existing old-path equivalent
- **D-06:** Each new v1 route gets a `__tests__/route.test.ts` co-located test file, adapting patterns from existing `app/api/hue/lights/__tests__/route.test.ts` and similar.

### Claude's Discretion

- Log messages for group action commands (Italian descriptions like existing light commands)
- Test assertion granularity and mock structure
- Whether to wrap response in `{ groups: data }` or return array directly (follow existing lights pattern: `{ lights: data }`)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HUE-01 | GET /api/v1/hue/health ritorna stato connettività bridge | `getHealth()` proxy exists; old route at `/api/hue/status`; pattern: `success(data as unknown as Record<string, unknown>)` |
| HUE-02 | GET /api/v1/hue/lights/{light_id} ritorna stato singola luce | `getLight(lightId)` proxy exists; old route at `/api/hue/lights/[id]`; path param via `getPathParam(context, 'lightId')` |
| HUE-03 | PUT /api/v1/hue/lights/{light_id}/state controlla singola luce | `setLightState(id, body)` proxy exists; old route at `/api/hue/lights/[id]` PUT; includes Firebase log + 202 response |
| HUE-04 | GET /api/v1/hue/groups ritorna lista gruppi | `getGroups()` proxy exists; old path `/api/hue/rooms`; net-new v1 route needed |
| HUE-05 | GET /api/v1/hue/groups/{group_id} ritorna stato singolo gruppo | `getGroup(groupId)` proxy exists; old path `/api/hue/rooms/[id]` GET; net-new v1 route needed |
| HUE-06 | POST /api/v1/hue/groups/{group_id}/scenes/{scene_id} attiva scena per gruppo | `activateScene(groupId, sceneId)` proxy exists; old path at `/api/hue/groups/[groupId]/scenes/[sceneId]`; v1 path is identical structure |
| HUE-07 | PUT /api/v1/hue/groups/{group_id}/action controlla luci del gruppo | `setGroupAction(groupId, body)` proxy exists; old path `/api/hue/rooms/[id]` PUT; net-new v1 action route needed |
</phase_requirements>

---

## Summary

Phase 159 is a route-creation phase with zero proxy implementation work. All proxy functions exist in `lib/hue/hueProxy.ts` and all TypeScript types exist in `types/hueProxy.ts`. The work is purely creating Next.js route handlers under `app/api/v1/hue/` that delegate to those proxy functions, following the identical pattern used by thermorossi v1 routes.

Of the 7 requirements (HUE-01 through HUE-07), 4 correspond to endpoint paths that already have old-path equivalents (under `/api/hue/`), and 3 are genuinely net-new routes with no old-path equivalent (groups list, single group, group action). Each requirement maps cleanly to one proxy function call.

The test strategy is mechanical: each route file gets a co-located `__tests__/route.test.ts` that mocks `@/lib/hue/hueProxy`, `@/lib/auth0`, and (for command routes) `@/lib/firebaseAdmin`, then asserts 401 unauthorized, the happy path, and 503 propagation.

**Primary recommendation:** Create 7 route files and 7 test files. The old `/api/hue/*` routes are untouched. No types, no proxy changes, no frontend migration.

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.5 | Route handlers | Project standard [VERIFIED: package.json] |
| `@/lib/core` | n/a (internal) | `withAuthAndErrorHandler`, `success`, `getPathParam`, `parseJson` | All existing hue/thermorossi routes use these |
| `@/lib/hue/hueProxy` | n/a (internal) | Proxy functions (`getHealth`, `getLights`, `getLight`, `getGroups`, `getGroup`, `getScenes`, `setLightState`, `setGroupAction`, `activateScene`, `getHistory`) | All 10 functions implemented [VERIFIED: lib/hue/hueProxy.ts] |
| `@/types/hueProxy` | n/a (internal) | TypeScript types | All types defined [VERIFIED: types/hueProxy.ts] |
| `@/lib/firebaseAdmin` | n/a (internal) | `adminDbPush` for action logging | Used by all PUT/POST command routes |
| `@/lib/devices/deviceTypes` | n/a (internal) | `DEVICE_TYPES.LIGHTS` constant | Used by all light command logging |

**Installation:** No new dependencies required. [VERIFIED: all imports visible in existing old-path routes]

---

## Architecture Patterns

### Route File Structure

```
app/api/v1/hue/
├── health/
│   ├── route.ts                          # HUE-01: GET
│   └── __tests__/route.test.ts
├── lights/
│   └── [lightId]/
│       ├── route.ts                      # HUE-02: GET
│       ├── __tests__/route.test.ts
│       └── state/
│           ├── route.ts                  # HUE-03: PUT
│           └── __tests__/route.test.ts
└── groups/
    ├── route.ts                          # HUE-04: GET
    ├── __tests__/route.test.ts
    └── [groupId]/
        ├── route.ts                      # HUE-05: GET
        ├── __tests__/route.test.ts
        ├── action/
        │   ├── route.ts                  # HUE-07: PUT
        │   └── __tests__/route.test.ts
        └── scenes/
            └── [sceneId]/
                ├── route.ts              # HUE-06: POST
                └── __tests__/route.test.ts
```

### Pattern 1: Simple Read Route (GET, no path param)

Used by HUE-01 (health), HUE-04 (groups list).

```typescript
// Source: app/api/v1/thermorossi/health/route.ts — verified pattern
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHealth } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Hue/Health');
```

For groups list — wrap in `{ groups: data }` to match `{ lights: data }` pattern from `/api/hue/lights/route.ts`:

```typescript
// Source: app/api/hue/lights/route.ts — verified pattern
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getGroups();
  return success({ groups: data });
}, 'Hue/Groups');
```

### Pattern 2: Single-Resource Read Route (GET with path param)

Used by HUE-02 (single light), HUE-05 (single group).

```typescript
// Source: app/api/hue/lights/[id]/route.ts — verified pattern
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const id = await getPathParam(context, 'lightId');  // param name matches [lightId] folder
  const data = await getLight(id);
  return success(data as unknown as Record<string, unknown>);
}, 'Hue/Light/Get');
```

Note: The folder is `[lightId]` so `getPathParam(context, 'lightId')` must match. Same for `[groupId]`.

### Pattern 3: Command Route (PUT with path param + body, Firebase log, 202)

Used by HUE-03 (single light state), HUE-07 (group action).

```typescript
// Source: app/api/hue/lights/[id]/route.ts PUT — verified pattern
export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const id = await getPathParam(context, 'lightId');
  const body = await parseJson(request) as Record<string, unknown>;

  const proxyResponse = await setLightState(id, body);

  // Log (Italian descriptions, matching existing routes)
  const on = body.on as boolean | undefined;
  const bri = body.bri as number | undefined;
  const actionDescription = on !== undefined
    ? (on ? 'Luce accesa' : 'Luce spenta')
    : bri !== undefined
      ? 'Luminosita modificata'
      : 'Luce modificata';
  const value = bri !== undefined
    ? `${Math.round((bri / 254) * 100)}%`
    : on !== undefined ? (on ? 'ON' : 'OFF') : null;

  await adminDbPush('log', {
    action: actionDescription,
    device: DEVICE_TYPES.LIGHTS,
    value,
    lightId: id,
    timestamp: Date.now(),
    source: 'manual',
  });

  return NextResponse.json(proxyResponse, { status: 202 });
}, 'Hue/Light/Update');
```

Group action variant uses `groupId` field and Italian descriptions like the existing `/api/hue/rooms/[id]` PUT (verified):

- `'Gruppo acceso'` / `'Gruppo spento'` for on/off
- `'Luminosita gruppo modificata'` for brightness
- `'Luci gruppo modificate'` as fallback

### Pattern 4: Scene Activation Route (POST, two path params, Firebase log, 202)

Used by HUE-06.

```typescript
// Source: app/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts — verified pattern
export const POST = withAuthAndErrorHandler(async (_request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const sceneId = await getPathParam(context, 'sceneId');

  const proxyResponse = await activateScene(groupId, sceneId);

  await adminDbPush('log', {
    action: 'Scena attivata',
    device: DEVICE_TYPES.LIGHTS,
    groupId,
    sceneId,
    timestamp: Date.now(),
    source: 'manual',
  });

  return NextResponse.json(proxyResponse, { status: 202 });
}, 'Hue/Scene/Activate');
```

### Anti-Patterns to Avoid

- **Deleting old `/api/hue/*` routes:** D-01 is explicit — those stay for backwards compatibility.
- **Using different param names in `getPathParam` vs folder name:** `[groupId]` folder must use `getPathParam(context, 'groupId')` — mismatch causes runtime 500.
- **Returning 200 for command routes:** Command routes (PUT/POST) always return 202 + `NextResponse.json(proxyResponse, { status: 202 })` — never use `success()` for command responses.
- **Skipping `export const dynamic = 'force-dynamic'`:** Every route file needs this; Next.js will otherwise try to statically analyze the route.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth enforcement | Custom session check | `withAuthAndErrorHandler` wrapper | Handles 401, error mapping, and tag logging in one call |
| Path param extraction | `context.params.lightId` direct access | `getPathParam(context, 'lightId')` | `params` is a Promise in Next.js 15 App Router — direct access skips await |
| JSON body parsing | `request.json()` | `parseJson(request)` | Handles content-type validation and parse errors consistently |
| Success response shape | `NextResponse.json(data, { status: 200 })` | `success(data)` | Wraps in `{ success: true, ...data }` shape expected by all clients |
| Firebase logging | Custom adminDb write | `adminDbPush('log', {...})` | Handles path + push key generation |

---

## Route-by-Route Implementation Map

| Req | Method | v1 Path | Folder | Proxy fn | Response | Firebase log |
|-----|--------|---------|--------|----------|----------|--------------|
| HUE-01 | GET | `/api/v1/hue/health` | `health/` | `getHealth()` | `success(data)` | No |
| HUE-02 | GET | `/api/v1/hue/lights/{light_id}` | `lights/[lightId]/` | `getLight(lightId)` | `success(data)` | No |
| HUE-03 | PUT | `/api/v1/hue/lights/{light_id}/state` | `lights/[lightId]/state/` | `setLightState(lightId, body)` | 202 `NextResponse.json` | Yes — light action |
| HUE-04 | GET | `/api/v1/hue/groups` | `groups/` | `getGroups()` | `success({ groups: data })` | No |
| HUE-05 | GET | `/api/v1/hue/groups/{group_id}` | `groups/[groupId]/` | `getGroup(groupId)` | `success(data)` | No |
| HUE-06 | POST | `/api/v1/hue/groups/{group_id}/scenes/{scene_id}` | `groups/[groupId]/scenes/[sceneId]/` | `activateScene(groupId, sceneId)` | 202 `NextResponse.json` | Yes — scene activated |
| HUE-07 | PUT | `/api/v1/hue/groups/{group_id}/action` | `groups/[groupId]/action/` | `setGroupAction(groupId, body)` | 202 `NextResponse.json` | Yes — group action |

**Key observation:** HUE-06's v1 path `groups/{group_id}/scenes/{scene_id}` is identical to the existing old-path at `app/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts`. The v1 route is an independent copy under `app/api/v1/hue/` — same logic, different path prefix.

---

## Common Pitfalls

### Pitfall 1: Path param name mismatch
**What goes wrong:** `getPathParam(context, 'id')` in a `[groupId]` folder returns undefined → 500
**Why it happens:** Next.js maps params to the folder segment name exactly
**How to avoid:** The string passed to `getPathParam` must equal the folder name minus brackets — `[groupId]` → `'groupId'`, `[lightId]` → `'lightId'`
**Warning signs:** Route returns 500 with "param not found" on first hit

### Pitfall 2: Using `success()` for command responses
**What goes wrong:** Command response is wrapped in `{ success: true }` and loses 202 status code
**Why it happens:** `success()` always returns 200
**How to avoid:** Command routes (PUT/POST that return `HueCommandResponse`) always use `NextResponse.json(proxyResponse, { status: 202 })`
**Warning signs:** Test expects `response.status` to be 202 but gets 200

### Pitfall 3: Missing `parseJson` import for PUT routes
**What goes wrong:** TypeScript compile error — `parseJson` not imported from `@/lib/core`
**How to avoid:** PUT/POST routes need `{ withAuthAndErrorHandler, getPathParam, parseJson }` — GET routes only need `{ withAuthAndErrorHandler, success, getPathParam }`

### Pitfall 4: Double-nesting path params in test context
**What goes wrong:** Test passes `{ params: { groupId: '1', sceneId: 'x' } }` but route expects `Promise`
**Why it happens:** Next.js 15 App Router wraps `params` in a Promise
**How to avoid:** Test context: `{ params: Promise.resolve({ groupId: '1', sceneId: 'Ab1Cd2Ef3G' }) }` — see all existing tests [VERIFIED: multiple test files]

---

## Code Examples

### Minimal GET route (read, no path param) — HUE-01
```typescript
// Source: app/api/v1/thermorossi/health/route.ts
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHealth } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Hue/Health');
```

### GET route with path param — HUE-02, HUE-05
```typescript
// Source: app/api/hue/lights/[id]/route.ts (adapted for v1 path param name)
import { withAuthAndErrorHandler, success, getPathParam } from '@/lib/core';
import { getLight } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const lightId = await getPathParam(context, 'lightId');
  const data = await getLight(lightId);
  return success(data as unknown as Record<string, unknown>);
}, 'Hue/Light/Get');
```

### Test pattern for GET with path param
```typescript
// Source: app/api/hue/lights/[id]/__tests__/route.test.ts
jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth0', () => ({ auth0: { getSession: jest.fn() } }));

import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetLight = jest.mocked(hueProxy.getLight);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/v1/hue/lights/[lightId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/v1/hue/lights/5');
    const ctx = { params: Promise.resolve({ lightId: '5' }) };
    const response = await GET(req as any, ctx as any);
    expect(response.status).toBe(401);
  });

  it('should return 200 with single light data', async () => {
    mockGetLight.mockResolvedValue({ light_id: '5', name: 'Test' } as any);
    const req = new Request('http://localhost:3000/api/v1/hue/lights/5');
    const ctx = { params: Promise.resolve({ lightId: '5' }) };
    const response = await GET(req as any, ctx as any);
    expect(response.status).toBe(200);
    expect(mockGetLight).toHaveBeenCalledWith('5');
  });
});
```

---

## State of the Art

No breaking changes apply to this phase. The patterns in the codebase are already established and working. This phase follows the same pattern as Phase 106-112 (Hue Proxy Migration) and Phase 156 (Thermorossi path migration).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (via Next.js built-in) |
| Config file | `jest.config.ts` (root) |
| Quick run command | `npm test -- --testPathPattern=api/v1/hue` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HUE-01 | GET health returns 200 with bridge status | unit | `npm test -- --testPathPattern=v1/hue/health` | ❌ Wave 0 |
| HUE-02 | GET lights/[lightId] returns 200 with light | unit | `npm test -- --testPathPattern=v1/hue/lights` | ❌ Wave 0 |
| HUE-03 | PUT lights/[lightId]/state returns 202 | unit | `npm test -- --testPathPattern=v1/hue/lights` | ❌ Wave 0 |
| HUE-04 | GET groups returns 200 with groups array | unit | `npm test -- --testPathPattern=v1/hue/groups` | ❌ Wave 0 |
| HUE-05 | GET groups/[groupId] returns 200 with group | unit | `npm test -- --testPathPattern=v1/hue/groups` | ❌ Wave 0 |
| HUE-06 | POST groups/[groupId]/scenes/[sceneId] returns 202 | unit | `npm test -- --testPathPattern=v1/hue/groups` | ❌ Wave 0 |
| HUE-07 | PUT groups/[groupId]/action returns 202 | unit | `npm test -- --testPathPattern=v1/hue/groups` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern=api/v1/hue`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

All 7 test files must be created as part of implementation:
- [ ] `app/api/v1/hue/health/__tests__/route.test.ts` — covers HUE-01
- [ ] `app/api/v1/hue/lights/[lightId]/__tests__/route.test.ts` — covers HUE-02
- [ ] `app/api/v1/hue/lights/[lightId]/state/__tests__/route.test.ts` — covers HUE-03
- [ ] `app/api/v1/hue/groups/__tests__/route.test.ts` — covers HUE-04
- [ ] `app/api/v1/hue/groups/[groupId]/__tests__/route.test.ts` — covers HUE-05
- [ ] `app/api/v1/hue/groups/[groupId]/scenes/[sceneId]/__tests__/route.test.ts` — covers HUE-06
- [ ] `app/api/v1/hue/groups/[groupId]/action/__tests__/route.test.ts` — covers HUE-07

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified — all code/config changes within the existing Next.js project)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `withAuthAndErrorHandler` — enforces Auth0 session, returns 401 if missing |
| V3 Session Management | no | Sessions managed by Auth0/existing middleware — no new session logic |
| V4 Access Control | no | All routes at same privilege level as existing hue routes |
| V5 Input Validation | yes (PUT routes) | `parseJson` handles malformed bodies; `HueLightStateRequest` types constrain accepted fields at proxy level |
| V6 Cryptography | no | No new crypto operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated route access | Spoofing | `withAuthAndErrorHandler` wrapper — 401 if no session [VERIFIED: all existing route tests confirm 401 behavior] |
| Path traversal via light_id/group_id | Tampering | IDs passed directly to proxy; proxy validates against Bridge cache — no filesystem access |
| Malformed JSON body (PUT) | Tampering | `parseJson` returns 400 on parse failure — verified via existing pattern |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Groups list should be wrapped as `{ groups: data }` to follow the `{ lights: data }` pattern | Route-by-Route Map | Planner may choose flat array — low risk, Claude's Discretion area |
| A2 | Italian log descriptions for group action: `'Gruppo acceso'` / `'Gruppo spento'` / `'Luminosita gruppo modificata'` | Architecture Patterns | No functional impact — log message phrasing only |

---

## Open Questions

None — all decisions are locked or delegated to Claude's Discretion.

---

## Sources

### Primary (HIGH confidence)
- `lib/hue/hueProxy.ts` — verified all 10 proxy functions exist with correct signatures
- `types/hueProxy.ts` — verified all required types: HueLight, HueGroup, HueScene, HueBridgeHealth, HueLightStateRequest, HueCommandResponse
- `app/api/hue/lights/[id]/route.ts` — reference GET+PUT pattern with Firebase logging
- `app/api/hue/rooms/route.ts` — reference groups list pattern (`{ groups: data }` wrapping)
- `app/api/hue/rooms/[id]/route.ts` — reference group GET+PUT (action) pattern
- `app/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts` — reference scene POST pattern
- `app/api/v1/thermorossi/health/route.ts` — reference v1 route structure
- `app/api/hue/lights/[id]/__tests__/route.test.ts` — reference test pattern (GET+PUT, path param)
- `app/api/hue/rooms/__tests__/route.test.ts` — reference test pattern (GET, no path param)
- `app/api/hue/rooms/[id]/__tests__/route.test.ts` — reference test pattern (GET+PUT, groupId param)
- `app/api/hue/groups/[groupId]/scenes/[sceneId]/__tests__/route.test.ts` — reference test pattern (POST, two path params)
- `.planning/config.json` — `nyquist_validation: true` confirmed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all proxy functions and types verified in source files
- Architecture patterns: HIGH — verbatim patterns extracted from existing old-path routes and thermorossi v1 routes
- Pitfalls: HIGH — derived from verified code patterns in Next.js 15 App Router behavior (params as Promise)

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable — no external dependencies, all internal patterns)
