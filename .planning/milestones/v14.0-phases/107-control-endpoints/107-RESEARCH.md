# Phase 107: Control Endpoints - Research

**Researched:** 2026-03-20
**Domain:** Hue proxy command wrappers + route migration (PUT light/group, POST scene activate)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Command wrapper design:**
- Add to existing `lib/hue/hueProxy.ts` — three new exports: `setLightState`, `setGroupAction`, `activateScene`
- `setLightState(lightId, body)` → `haPut<HueCommandResponse>('/api/v1/hue/lights/{lightId}/state', body)`
- `setGroupAction(groupId, body)` → `haPut<HueCommandResponse>('/api/v1/hue/groups/{groupId}/action', body)`
- `activateScene(groupId, sceneId)` → `haPost<HueCommandResponse>('/api/v1/hue/groups/{groupId}/scenes/{sceneId}', {})`
- Note: light state and group action use PUT (not POST) — check if haClient has `haPut` or need to add it

**Response and request types:**
- Add `HueLightStateRequest` interface to `types/hueProxy.ts` — fields: `on?`, `bri?`, `ct?`, `hue?`, `sat?`, `effect?`, `alert?` (v1 flat format, not CLIP v2 nested objects)
- Add `HueCommandResponse` interface to `types/hueProxy.ts` — fields: `command`, `status`, `suggested_poll_delay_s`, `poll_endpoint` + endpoint-specific fields (`light_id`/`group_id`/`scene_id`, `requested_state`)
- Body format is v1 flat: `{ on: true, bri: 200, ct: 370 }` — NOT CLIP v2 `{ on: { on: true }, dimming: { brightness: 80 } }`

**Route rewrite strategy:**
- `lights/[id]/route.ts PUT`: Rewrite to use `setLightState` via hueProxy — replace HueConnectionStrategy + CLIP v2 body format
- `rooms/[id]/route.ts PUT`: Rewrite to use `setGroupAction` via hueProxy — replace HueConnectionStrategy + CLIP v2 body format
- **Scene activation path change**: Old path was `PUT scenes/[id]/activate` — new path is `POST groups/[gid]/scenes/[sid]`. Create new route at `app/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts` with POST handler
- Old scene activate route (`scenes/[id]/activate/route.ts`) left in place until Phase 109 cleanup (or can be deleted now since route path changes)
- All migrated routes use `withAuthAndErrorHandler` (not `withHueHandler` which depends on HueConnectionStrategy)

**202 Accepted response pattern:**
- Routes return `NextResponse.json(proxyResponse, { status: 202 })` — pass through proxy's 202 response body
- Response includes `suggested_poll_delay_s` (typically 2) and `poll_endpoint` — frontend uses these for delayed refresh (Phase 108)
- Fire-and-forget: no logging change needed, existing adminDbPush logging pattern preserved

**Error handling:**
- 409 Conflict from proxy (light unreachable) — let haClient throw ApiError, route catches and returns 409 to frontend with `error: "light_unreachable"` detail
- 409 only applies to light state (PUT /lights/{id}/state) — group actions skip unreachable members silently
- 422 from proxy (empty body or invalid values) — pass through as 422
- 502/503/504 from proxy — haClient maps these to ApiError automatically
- No idempotency keys needed for Hue commands (Hue is idempotent by nature)

**Body format migration:**
- Current routes accept CLIP v2 body: `{ on: { on: boolean }, dimming: { brightness: number } }`
- New routes accept v1 flat body: `{ on: boolean, bri: number, ct: number }` — matching proxy API spec
- Breaking change for frontend callers — Phase 108 hooks will send v1 format
- During Phase 107, routes expect v1 format. Frontend calls break until Phase 108 completes

**Logging:**
- Preserve existing `adminDbPush('log', ...)` pattern for audit trail
- Adapt log extraction for v1 body format: `body.on` (boolean) instead of `body.on.on`, `body.bri` instead of `body.dimming.brightness`

### Claude's Discretion
- Whether to add `haPut` to haClient.ts or reuse haPost with method override
- Unit test structure for control wrappers
- Whether to delete old scene activate route now or defer to Phase 109

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CMD-01 | PUT /lights/{light_id}/state via proxy (202 Accepted, v1 body format) | `setLightState` wrapper + route rewrite; `HueLightStateRequest` type; 202 pass-through pattern |
| CMD-02 | PUT /groups/{group_id}/action via proxy (202 Accepted) | `setGroupAction` wrapper + route rewrite; same request type; no 409 |
| CMD-03 | POST /groups/{group_id}/scenes/{scene_id} via proxy (202 Accepted) | `activateScene` wrapper + new route at groups/[groupId]/scenes/[sceneId]; empty body POST |
| CMD-04 | Frontend handles 409 Conflict for unreachable lights | haClient 409 path; route must not swallow it; `light_unreachable` detail preserved in pass-through |
</phase_requirements>

---

## Summary

Phase 107 adds command wrapper functions to the existing `lib/hue/hueProxy.ts` client and rewrites three legacy PUT/PUT/PUT route handlers that currently use `HueConnectionStrategy` (direct CLIP v2 Bridge access) to instead call the HA proxy via the new wrappers. The pattern is identical to v13.0 Thermorossi Phase 100 (command wrappers), with one important difference: Hue uses `PUT` for state control rather than `POST`, which means `haClient.ts` needs a `haPut` function added (haPost only exists currently).

The three routes being migrated are: `lights/[id]/route.ts` PUT handler, `rooms/[id]/route.ts` PUT handler (currently wrapped with `withIdempotency` — dropped for Phase 107 since Hue is idempotent), and a brand new route `groups/[groupId]/scenes/[sceneId]/route.ts` POST handler (replacing the old `scenes/[id]/activate/route.ts` PUT handler with a new path structure).

All control endpoints return 202 Accepted from the proxy and the routes pass that response through directly. The 409 Conflict case for unreachable lights (CMD-04) applies only to the light-state route, not group actions. The `haClient.mapResponseError` function currently maps non-2xx to ApiError, but 409 is not in its special-case list — it falls through to `EXTERNAL_API_ERROR` with 502. This needs attention: either haClient needs to preserve 409 status, or the route needs to detect 409 before haClient rejects.

**Primary recommendation:** Add `haPut` to haClient.ts (matching haPost structure, method `PUT`). For 409 pass-through, add 409 handling to `mapResponseError` so haClient throws `ApiError(CONFLICT, ..., 409)` which the route can catch and forward.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lib/haClient.ts` | project | Shared HA proxy transport (haGet/haPost) | All providers use this; handles auth, timeout, error mapping |
| `lib/hue/hueProxy.ts` | project | Hue-specific convenience wrappers | Phase 106 established this as the Hue client module |
| `types/hueProxy.ts` | project | TypeScript types for proxy responses | Phase 106 defined all read types here |
| `lib/core` | project | `withAuthAndErrorHandler`, `success`, `getPathParam`, `parseJson` | Standard route utilities used by all migrated routes |
| `lib/firebaseAdmin` | project | `adminDbPush` for audit logging | Established pattern in existing light/room/scene routes |

### No New External Dependencies

This phase adds no npm packages. All work is internal wiring between existing modules.

**Installation:** None required.

---

## Architecture Patterns

### haClient Extension: Adding haPut

The current `haClient.ts` exports `haGet` and `haPost`. The Hue proxy uses PUT for state control. `haPut` follows the same structure as `haPost` with `method: 'PUT'`.

```typescript
// Source: lib/haClient.ts (haPost reference — haPut is identical except method)
export async function haPut<T>(
  endpoint: string,
  body: Record<string, unknown>,
  options: HaRequestOptions = {}
): Promise<T> {
  const { baseUrl, apiKey } = getEnvConfig();
  const { timeout = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return await mapResponseError(response);
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    return mapCaughtError(error);
  }
}
```

### 409 Conflict Pass-Through

The current `mapResponseError` in haClient does not special-case 409. For CMD-04, the route needs to receive 409 from the proxy and return 409 to the frontend with the `light_unreachable` detail intact.

**Option A (recommended):** Add 409 case to `mapResponseError` in haClient:

```typescript
// In mapResponseError, before the final throw:
if (parsedStatus === 409) {
  throw new ApiError(
    ERROR_CODES.CONFLICT,  // if this code exists, else EXTERNAL_API_ERROR
    detail ?? 'Conflict',
    409
  );
}
```

Check `lib/core/apiErrors.ts` for whether `ERROR_CODES.CONFLICT` exists. If not, use `EXTERNAL_API_ERROR` with httpStatus 409.

**Option B:** Route catches all ApiError and re-checks the httpStatus to detect 409. Works without modifying haClient, but less clean.

### Command Wrappers Pattern (established — Thermorossi reference)

```typescript
// Source: lib/thermorossiProxy.ts — COMMAND WRAPPERS section
// Hue equivalent for setLightState:
export async function setLightState(
  lightId: string,
  body: HueLightStateRequest
): Promise<HueCommandResponse> {
  return haPut<HueCommandResponse>(
    `/api/v1/hue/lights/${lightId}/state`,
    body as Record<string, unknown>
  );
}

export async function setGroupAction(
  groupId: string,
  body: HueLightStateRequest
): Promise<HueCommandResponse> {
  return haPut<HueCommandResponse>(
    `/api/v1/hue/groups/${groupId}/action`,
    body as Record<string, unknown>
  );
}

export async function activateScene(
  groupId: string,
  sceneId: string
): Promise<HueCommandResponse> {
  return haPost<HueCommandResponse>(
    `/api/v1/hue/groups/${groupId}/scenes/${sceneId}`,
    {}
  );
}
```

### New Types in types/hueProxy.ts

```typescript
// Source: docs/api/hue.md — HueLightStateRequest (VERIFIED 2026-03-19)
export interface HueLightStateRequest {
  on?: boolean;
  bri?: number;                       // 0-254
  ct?: number;                        // 153-500 mirek
  hue?: number;                       // 0-65535
  sat?: number;                       // 0-254
  effect?: 'none' | 'colorloop';
  alert?: 'none' | 'select' | 'lselect';
}

// Source: docs/api/hue.md — 202 response shapes (VERIFIED 2026-03-19)
// Discriminated by 'command' field value
export interface HueCommandResponse {
  command: 'set_light_state' | 'set_group_action' | 'activate_scene';
  status: 'accepted';
  // set_light_state only:
  light_id?: string;
  // set_group_action only:
  group_id?: string;
  // activate_scene only:
  scene_id?: string;
  // set_light_state and set_group_action only:
  requested_state?: Partial<HueLightStateRequest>;
  suggested_poll_delay_s: number;
  poll_endpoint: string;
}
```

### Route Migration: PUT lights/[id]

Current: `withHueHandler` + `HueConnectionStrategy.getProvider()` + CLIP v2 body
New: `withAuthAndErrorHandler` + `setLightState` + v1 flat body

```typescript
// New PUT handler signature:
interface LightStateBody {
  on?: boolean;
  bri?: number;
  ct?: number;
  hue?: number;
  sat?: number;
  effect?: string;
  alert?: string;
}

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const id = await getPathParam(context, 'id');
  const body = await parseJson(request) as LightStateBody;

  const proxyResponse = await setLightState(id, body);

  // Log (adapted for v1 body format)
  const actionDescription = body.on !== undefined
    ? (body.on ? 'Luce accesa' : 'Luce spenta')
    : body.bri !== undefined
      ? 'Luminosita modificata'
      : 'Luce modificata';

  const value = body.bri !== undefined
    ? `${Math.round((body.bri / 254) * 100)}%`
    : body.on !== undefined
      ? (body.on ? 'ON' : 'OFF')
      : null;

  await adminDbPush('log', { action: actionDescription, ... });

  return NextResponse.json(proxyResponse, { status: 202 });
}, 'Hue/Light/Update');
```

### New Route: POST groups/[groupId]/scenes/[sceneId]

New file: `app/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts`

```typescript
export const POST = withAuthAndErrorHandler(async (request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const sceneId = await getPathParam(context, 'sceneId');

  const proxyResponse = await activateScene(groupId, sceneId);

  await adminDbPush('log', {
    action: 'Scena attivata',
    device: DEVICE_TYPES.LIGHTS,
    groupId,
    sceneId,
    timestamp: Date.now(),
    ...
  });

  return NextResponse.json(proxyResponse, { status: 202 });
}, 'Hue/Scene/Activate');
```

### Recommended Project Structure Changes

```
lib/
├── haClient.ts          # ADD haPut export
├── hue/
│   ├── hueProxy.ts      # ADD setLightState, setGroupAction, activateScene
│   └── __tests__/
│       └── hueProxy.test.ts   # ADD tests for 3 command wrappers
types/
└── hueProxy.ts          # ADD HueLightStateRequest, HueCommandResponse

app/api/hue/
├── lights/[id]/route.ts     # REWRITE PUT handler
├── rooms/[id]/route.ts      # REWRITE PUT handler
├── groups/
│   └── [groupId]/
│       └── scenes/
│           └── [sceneId]/
│               └── route.ts  # NEW POST handler
└── scenes/[id]/activate/route.ts  # DELETE or keep (Claude's discretion)
```

### Anti-Patterns to Avoid

- **Keeping withHueHandler on migrated routes:** It depends on HueConnectionStrategy; use withAuthAndErrorHandler.
- **Keeping withIdempotency on rooms PUT:** The old rooms route had idempotency middleware. Hue is inherently idempotent (set state twice = same result), so this wrapper is unnecessary overhead.
- **Swallowing 409:** The 409 detail body `{ detail: { error: "light_unreachable", light_id, message } }` must reach the frontend (CMD-04). haClient must not remap 409 to 502.
- **Using CLIP v2 body in new routes:** New routes accept v1 flat keys (`on`, `bri`, `ct`), not nested objects.
- **Calling `success()` on 202 responses:** `success()` from lib/core wraps in `{ success: true, data: ... }` and returns 200. Use `NextResponse.json(proxyResponse, { status: 202 })` directly to preserve 202 status and proxy response shape.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP transport to proxy | Custom fetch | `haGet`/`haPost`/`haPut` from haClient | Auth, timeout, error mapping all handled |
| Auth middleware | Custom auth check | `withAuthAndErrorHandler` | Established pattern, consistent 401 handling |
| Error mapping | Custom status mapping | haClient `mapResponseError` + ApiError | RFC 9457 parsing, status normalization |
| Request logging | New audit system | `adminDbPush('log', ...)` | Existing Firebase audit trail pattern |
| 202 response | Custom wrapper | `NextResponse.json(proxyResponse, { status: 202 })` | Direct pass-through, no re-shaping needed |

---

## Common Pitfalls

### Pitfall 1: haClient swallows 409 as 502
**What goes wrong:** `mapResponseError` in haClient does not special-case 409. It falls through to `EXTERNAL_API_ERROR` with `HTTP_STATUS.BAD_GATEWAY` (502). The frontend receives 502, not 409, and CMD-04 fails.
**Why it happens:** haClient was built for GET-heavy use (no commands returning 409 before Phase 107).
**How to avoid:** Add 409 case to `mapResponseError` in haClient before implementing routes. Check `apiErrors.ts` for CONFLICT error code existence first.
**Warning signs:** Route test for unreachable light returns 502 instead of 409.

### Pitfall 2: 202 response becomes 200 via success()
**What goes wrong:** Using `return success(proxyResponse)` wraps in `{ success: true, data: ... }` and returns 200, dropping the 202 status and changing the response shape.
**Why it happens:** GET handlers use `success()` — easy to copy-paste into command handlers.
**How to avoid:** Command handlers must use `return NextResponse.json(proxyResponse, { status: 202 })` directly.
**Warning signs:** Route test expects 202 but gets 200.

### Pitfall 3: Log extraction uses CLIP v2 body keys
**What goes wrong:** Old log code reads `body.on.on` (CLIP v2 nested) and `body.dimming.brightness`. New body is v1 flat: `body.on` (boolean) and `body.bri` (number). TypeScript will catch this if `LightStateBody` interface is correctly typed.
**Why it happens:** Copy-paste from old route without updating log extraction.
**How to avoid:** Define `LightStateBody` interface with v1 keys before writing log code.
**Warning signs:** TypeScript error `Property 'dimming' does not exist on type LightStateBody`.

### Pitfall 4: Scene route creates [groupId]/scenes/[sceneId] but path param names mismatch
**What goes wrong:** Next.js dynamic route folder is `[groupId]` but `getPathParam(context, 'groupId')` must match exactly. If folder is `[id]` and code uses `getPathParam(context, 'groupId')`, it returns undefined.
**Why it happens:** Folder naming convention inconsistency.
**How to avoid:** Name folders `[groupId]` and `[sceneId]` to match `getPathParam` calls. Confirm by checking the existing `lights/[id]` pattern uses `getPathParam(context, 'id')`.
**Warning signs:** `getPathParam` returns null/throws at runtime.

### Pitfall 5: withIdempotency removed from rooms route causes 500 in tests
**What goes wrong:** Old rooms route test mocks `withIdempotency`. If test file is not updated after removing the middleware, imports may fail or mock expectations break.
**Why it happens:** Test file for rooms route was written with the old PUT handler.
**How to avoid:** Update the rooms route test file alongside the route rewrite.

---

## Code Examples

### Proxy 202 Response Shape (VERIFIED 2026-03-19)

```typescript
// Source: docs/api/hue.md — PUT /lights/{id}/state 202 response
{
  command: 'set_light_state',
  status: 'accepted',
  light_id: '1',
  requested_state: { on: true, bri: 200, ct: 370 },
  suggested_poll_delay_s: 2,
  poll_endpoint: '/api/v1/hue/lights/1'
}

// Source: docs/api/hue.md — PUT /groups/{id}/action 202 response
{
  command: 'set_group_action',
  status: 'accepted',
  group_id: '1',
  requested_state: { on: true, bri: 200 },
  suggested_poll_delay_s: 2,
  poll_endpoint: '/api/v1/hue/groups/1'
}

// Source: docs/api/hue.md — POST /groups/{gid}/scenes/{sid} 202 response
{
  command: 'activate_scene',
  status: 'accepted',
  group_id: '1',
  scene_id: 'Ab1Cd2Ef3G',
  suggested_poll_delay_s: 2,
  poll_endpoint: '/api/v1/hue/groups/1'
}
```

### 409 Conflict Response Body (VERIFIED 2026-03-19)

```typescript
// Source: docs/api/hue.md — PUT /lights/{id}/state 409 body
{
  detail: {
    error: 'light_unreachable',
    light_id: '5',
    message: 'Light 5 is unreachable — command not forwarded'
  }
}
```

### Existing hueProxy.test.ts Pattern (use for command wrapper tests)

```typescript
// Source: lib/hue/__tests__/hueProxy.test.ts
// Pattern for testing command wrappers:
jest.mock('@/lib/haClient');
import { haPost } from '@/lib/haClient';  // add haPut
const mockHaPut = jest.mocked(haPut);

describe('setLightState', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls haPut with /api/v1/hue/lights/{lightId}/state and body', async () => {
    mockHaPut.mockResolvedValue(mockCommandResponse);

    const body = { on: true, bri: 200 };
    const result = await setLightState('1', body);

    expect(mockHaPut).toHaveBeenCalledWith(
      '/api/v1/hue/lights/1/state',
      body
    );
    expect(result).toEqual(mockCommandResponse);
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct CLIP v2 Bridge access via HueConnectionStrategy | Proxy via haPut/haPost | Phase 107 | Removes local Bridge dependency, consistent auth |
| Nested CLIP v2 body `{ on: { on: bool }, dimming: { brightness } }` | Flat v1 body `{ on: bool, bri: number }` | Phase 107 | Simpler types, matches proxy API |
| withHueHandler (session + HueConnectionStrategy) | withAuthAndErrorHandler (session only) | Phase 107 | Cleaner, no legacy strategy dependency |
| withIdempotency on rooms PUT | No idempotency middleware | Phase 107 | Hue is inherently idempotent |
| Scene activate: PUT /scenes/[id]/activate | Scene activate: POST /groups/[gid]/scenes/[sid] | Phase 107 | New path matches proxy API structure |

---

## Open Questions

1. **Does ERROR_CODES include CONFLICT (409)?**
   - What we know: `lib/core/apiErrors.ts` exports `ERROR_CODES` — not yet read
   - What's unclear: Whether a CONFLICT code exists or needs to be added
   - Recommendation: Read `lib/core/apiErrors.ts` at plan time; if no CONFLICT code, add it alongside the haPut addition, or use `EXTERNAL_API_ERROR` with `httpStatus: 409`

2. **Delete old scene activate route now or defer?**
   - What we know: `scenes/[id]/activate/route.ts` uses old path pattern; new route is at `groups/[groupId]/scenes/[sceneId]/route.ts`
   - What's unclear: Whether any frontend caller still points to old path (Phase 108 hasn't run yet)
   - Recommendation: Leave old route in place for Phase 109 cleanup; no risk since it's on a different path and Phase 108 will update callers

3. **Does haPost body type accept HueLightStateRequest directly?**
   - What we know: `haPost` accepts `body: Record<string, unknown>`. `HueLightStateRequest` has optional fields (all primitive/string union types). TypeScript may require assertion.
   - What's unclear: Whether `as Record<string, unknown>` assertion is needed or if structural typing suffices.
   - Recommendation: Use `body as Record<string, unknown>` in wrapper function bodies — same pattern used in existing route handlers (see rooms route `body as any`).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (project-wide) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="hueProxy|hue/lights|hue/rooms|hue/groups" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CMD-01 | `setLightState` calls haPut with correct path and body | unit | `npm test -- --testPathPattern="lib/hue/__tests__/hueProxy"` | ✅ (extend existing) |
| CMD-01 | PUT /api/hue/lights/[id] returns 202 with proxy body | unit | `npm test -- --testPathPattern="app/api/hue/lights/__tests__"` | ✅ (extend existing) |
| CMD-02 | `setGroupAction` calls haPut with correct path and body | unit | `npm test -- --testPathPattern="lib/hue/__tests__/hueProxy"` | ✅ (extend existing) |
| CMD-02 | PUT /api/hue/rooms/[id] returns 202 with proxy body | unit | `npm test -- --testPathPattern="app/api/hue/rooms/__tests__"` | ✅ (extend existing) |
| CMD-03 | `activateScene` calls haPost with correct path | unit | `npm test -- --testPathPattern="lib/hue/__tests__/hueProxy"` | ✅ (extend existing) |
| CMD-03 | POST /api/hue/groups/[groupId]/scenes/[sceneId] returns 202 | unit | `npm test -- --testPathPattern="hue/groups"` | ❌ Wave 0 |
| CMD-04 | PUT /api/hue/lights/[id] returns 409 when proxy returns 409 | unit | `npm test -- --testPathPattern="app/api/hue/lights/__tests__"` | ✅ (extend existing) |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="hueProxy|hue/lights|hue/rooms|hue/groups" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/api/hue/groups/[groupId]/scenes/[sceneId]/__tests__/route.test.ts` — covers CMD-03 (new route, no test file exists yet)

---

## Sources

### Primary (HIGH confidence)
- `docs/api/hue.md` — Complete proxy API spec for control endpoints; 202 response shapes, 409 body, HueLightStateRequest interface — VERIFIED 2026-03-19 against live proxy
- `lib/haClient.ts` — Source of truth for haGet/haPost implementation; confirmed haPut does NOT exist
- `lib/hue/hueProxy.ts` — Current read wrappers; add COMMAND WRAPPERS section here
- `types/hueProxy.ts` — Current type definitions; confirmed no HueLightStateRequest or HueCommandResponse
- `lib/thermorossiProxy.ts` — Reference implementation for command wrapper pattern
- `lib/core/index.ts` — Confirmed exports: withAuthAndErrorHandler, success, getPathParam, parseJson
- `app/api/hue/lights/[id]/route.ts` — Current PUT handler (CLIP v2 body, withHueHandler)
- `app/api/hue/rooms/[id]/route.ts` — Current PUT handler (CLIP v2 body, withHueHandler + withIdempotency)
- `app/api/hue/scenes/[id]/activate/route.ts` — Current scene activate (withHueHandler + withIdempotency)
- `lib/hue/__tests__/hueProxy.test.ts` — Test pattern for proxy wrappers (jest.mock + mockHaGet)
- `app/api/hue/lights/__tests__/route.test.ts` — Test pattern for route handlers

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` accumulated decisions — 202 + suggested_poll_delay_s applies to Hue (same as Thermorossi v13.0)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified by direct file read
- Architecture: HIGH — response shapes and 202 pattern VERIFIED 2026-03-19 against live proxy
- Pitfalls: HIGH — 409 haClient gap confirmed by reading mapResponseError code; others from direct code inspection
- Open questions: MEDIUM — apiErrors.ts not read; all other gaps are minor implementation details

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable internal APIs)
