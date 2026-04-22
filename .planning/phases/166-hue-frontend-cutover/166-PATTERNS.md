# Phase 166: Hue Frontend Cutover - Pattern Map

**Mapped:** 2026-04-16
**Files analyzed:** 12 new/modified files
**Analogs found:** 12 / 12

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/api/v1/hue/lights/route.ts` | route | request-response | `app/api/v1/hue/groups/route.ts` | exact |
| `app/api/v1/hue/scenes/route.ts` | route | request-response | `app/api/hue/scenes/route.ts` + groups pattern | exact |
| `app/api/v1/hue/lights/__tests__/route.test.ts` | test | — | `app/api/v1/hue/groups/__tests__/route.test.ts` | exact |
| `app/api/v1/hue/scenes/__tests__/route.test.ts` | test | — | `app/api/v1/hue/groups/__tests__/route.test.ts` | exact |
| `app/components/devices/lights/hooks/useLightsData.ts` | hook | request-response | self (URL string replacement only) | exact |
| `app/components/devices/lights/hooks/useLightsCommands.ts` | hook | request-response | self (URL string replacement only) | exact |
| `app/lights/page.tsx` | page | request-response | self (URL string replacement + path split) | exact |
| `app/lights/scenes/page.tsx` | page | request-response | self (URL string replacement only) | exact |
| `app/components/lights/CreateSceneModal.tsx` | component | request-response | self (1 URL string replacement) | exact |
| `app/components/lights/EditSceneModal.tsx` | component | request-response | self (1 URL string replacement) | exact |
| `app/debug/components/tabs/HueTab.tsx` | component | request-response | self (~15 URL replacements) | exact |
| `app/debug/api/components/tabs/HueTab.tsx` | component | request-response | self (~15 URL replacements) | exact |
| `app/debug/components/tabs/__tests__/HueTab.test.tsx` | test | — | self (3 assertion updates) | exact |
| `app/debug/api/components/tabs/__tests__/HueTab.test.tsx` | test | — | self (3 assertion updates) | exact |
| `app/registry/devices/page.tsx` | page | request-response | self (1 URL replacement, NOT in D-09 but required) | exact |

---

## Pattern Assignments

### `app/api/v1/hue/lights/route.ts` (route, GET list)

**Analog:** `app/api/v1/hue/groups/route.ts`

**Full file pattern** (lines 1-14):
```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getGroups } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hue/groups
 * Returns all Hue groups from the HA proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getGroups();
  return success({ groups: data });
}, 'Hue/Groups');
```

**Substitutions for lights list:**
- Import `getLights` instead of `getGroups`
- Envelope key: `{ lights: data }` (not `{ groups: data }`)
- Route label: `'Hue/Lights'`
- JSDoc path: `GET /api/v1/hue/lights`

**Complete new file:**
```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getLights } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hue/lights
 * Returns all Hue lights from the HA proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getLights();
  return success({ lights: data });
}, 'Hue/Lights');
```

---

### `app/api/v1/hue/scenes/route.ts` (route, GET list with optional query param)

**Analog:** `app/api/v1/hue/groups/route.ts` + `app/api/hue/scenes/route.ts` pattern for query param

**Pattern — query param extraction + conditional proxy call:**
```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getScenes } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hue/scenes
 * Returns all Hue scenes from the HA proxy, optionally filtered by group_id.
 * Query params: group_id (optional)
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const groupId = request.nextUrl.searchParams.get('group_id') ?? undefined;
  const data = await getScenes(groupId);
  return success({ scenes: data });
}, 'Hue/Scenes');
```

**Critical:** Envelope key must be `{ scenes: data }` — this is what `useLightsData.fetchScenes()` reads via `data.scenes`.

---

### `app/api/v1/hue/lights/__tests__/route.test.ts` (test for new lights list route)

**Analog:** `app/api/v1/hue/groups/__tests__/route.test.ts` (lines 1-75)

**Full test pattern to copy and adapt:**
```typescript
/**
 * Tests for GET /api/v1/hue/lights
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetLights = jest.mocked(hueProxy.getLights);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/v1/hue/lights', () => {
  // ... mock data with HueLight shape (light_id, name, on, brightness, etc.)

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/v1/hue/lights');
    const response = await GET(req as any, {} as any);
    expect(response.status).toBe(401);
  });

  it('should return 200 with lights array', async () => {
    mockGetLights.mockResolvedValue(mockLightsData as any);
    const req = new Request('http://localhost:3000/api/v1/hue/lights');
    const response = await GET(req as any, {} as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.lights).toBeInstanceOf(Array);
    expect(mockGetLights).toHaveBeenCalled();
  });
});
```

**Substitutions vs groups test:** `getGroups` → `getLights`, `data.groups` → `data.lights`, mock data shape uses HueLight fields.

---

### `app/api/v1/hue/scenes/__tests__/route.test.ts` (test for new scenes list route)

**Analog:** `app/api/v1/hue/groups/__tests__/route.test.ts`

**Additional test needed** (query param support):
```typescript
it('should pass group_id query param to getScenes', async () => {
  mockGetScenes.mockResolvedValue(mockScenesData as any);
  const req = new Request('http://localhost:3000/api/v1/hue/scenes?group_id=1');
  const response = await GET(req as any, {} as any);
  const data = await response.json();
  expect(response.status).toBe(200);
  expect(data.scenes).toBeInstanceOf(Array);
  expect(mockGetScenes).toHaveBeenCalledWith('1');
});
```

---

### `app/components/devices/lights/hooks/useLightsData.ts` (hook, URL migration)

**Analog:** self — 6 targeted string replacements

**Current → replacement mapping (verified line numbers from RESEARCH.md):**

| Line | Find | Replace |
|------|------|---------|
| 7 (JSDoc) | `/api/hue/status` | `/api/v1/hue/health` |
| 136 | `fetch('/api/hue/status')` | `fetch('/api/v1/hue/health')` |
| 160 | `fetch('/api/hue/scenes')` | `fetch('/api/v1/hue/scenes')` |
| 216 | `fetch('/api/hue/rooms')` | `fetch('/api/v1/hue/groups')` |
| 217 | `fetch('/api/hue/lights')` | `fetch('/api/v1/hue/lights')` |
| 218 | `fetch('/api/hue/scenes')` | `fetch('/api/v1/hue/scenes')` |

**checkConnection pattern** (lines 132-155) — URL is the only change, response shape is identical:
```typescript
// BEFORE (line 136):
const response = await fetch('/api/hue/status');

// AFTER:
const response = await fetch('/api/v1/hue/health');
```

**fetchData pattern** (lines 212-247) — 3 URLs change, response shapes are identical:
```typescript
// BEFORE (lines 215-218):
const [groupsRes, lightsRes, scenesRes] = await Promise.all([
  fetch('/api/hue/rooms'),
  fetch('/api/hue/lights'),
  fetch('/api/hue/scenes'),
]);

// AFTER:
const [groupsRes, lightsRes, scenesRes] = await Promise.all([
  fetch('/api/v1/hue/groups'),
  fetch('/api/v1/hue/lights'),
  fetch('/api/v1/hue/scenes'),
]);
```

**fetchScenes pattern** (line 160) — URL only:
```typescript
// BEFORE:
const res = await fetch('/api/hue/scenes');

// AFTER:
const res = await fetch('/api/v1/hue/scenes');
```

**No structural changes** — hook logic, response shape handling, WS pattern, polling pattern are all unchanged.

---

### `app/components/devices/lights/hooks/useLightsCommands.ts` (hook, URL migration)

**Analog:** self — 4 targeted string replacements

**Current → replacement mapping (verified line numbers from RESEARCH.md):**

| Line | Find | Replace |
|------|------|---------|
| 85 | `` `/api/hue/rooms/${groupId}` `` | `` `/api/v1/hue/groups/${groupId}/action` `` |
| 121 | `` `/api/hue/rooms/${groupId}` `` | `` `/api/v1/hue/groups/${groupId}/action` `` |
| 155 | `` `/api/hue/groups/${groupId}/scenes/${sceneId}` `` | `` `/api/v1/hue/groups/${groupId}/scenes/${sceneId}` `` |
| 188 | `` `/api/hue/rooms/${group.group_id}` `` | `` `/api/v1/hue/groups/${group.group_id}/action` `` |

**handleRoomToggle pattern** (lines 80-107) — URL is the only change:
```typescript
// BEFORE (line 85):
const response = await hueRoomCmd.execute(`/api/hue/rooms/${groupId}`, {

// AFTER:
const response = await hueRoomCmd.execute(`/api/v1/hue/groups/${groupId}/action`, {
```

**handleSceneActivate pattern** (lines 149-174) — prefix only:
```typescript
// BEFORE (line 155):
const response = await hueSceneCmd.execute(`/api/hue/groups/${groupId}/scenes/${sceneId}`, {

// AFTER:
const response = await hueSceneCmd.execute(`/api/v1/hue/groups/${groupId}/scenes/${sceneId}`, {
```

**handleAllLightsToggle pattern** (lines 180-204) — Promise.all map:
```typescript
// BEFORE (line 188):
hueRoomCmd.execute(`/api/hue/rooms/${group.group_id}`, {

// AFTER:
hueRoomCmd.execute(`/api/v1/hue/groups/${group.group_id}/action`, {
```

---

### `app/lights/page.tsx` (page, URL migration + PATH SPLIT)

**Analog:** self — 3 targeted replacements, all requiring path split from `/lights/${id}` to `/lights/${id}/state`

**Current → replacement mapping (verified line numbers from RESEARCH.md):**

| Line | Function | Find | Replace |
|------|----------|------|---------|
| 26 | `handleLightToggle` | `` `/api/hue/lights/${lightId}` `` | `` `/api/v1/hue/lights/${lightId}/state` `` |
| 42 | `handleLightBrightnessChange` | `` `/api/hue/lights/${lightId}` `` | `` `/api/v1/hue/lights/${lightId}/state` `` |
| 58 | `handleLightColorChange` | `` `/api/hue/lights/${lightId}` `` | `` `/api/v1/hue/lights/${lightId}/state` `` |

**handleLightToggle pattern** (lines 22-36) — path split:
```typescript
// BEFORE (line 26):
const res = await fetch(`/api/hue/lights/${lightId}`, {
  method: 'PUT', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ on }),
});

// AFTER — note /state appended:
const res = await fetch(`/api/v1/hue/lights/${lightId}/state`, {
  method: 'PUT', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ on }),
});
```

All three functions follow identical pattern — only the URL string differs. Method (PUT), headers, body shape, and response handling (`suggested_poll_delay_s`) are unchanged.

---

### `app/lights/scenes/page.tsx` (page, URL migration)

**Analog:** self — 3 targeted string replacements

**Current → replacement mapping (verified line numbers from RESEARCH.md):**

| Line | Context | Find | Replace |
|------|---------|------|---------|
| 63 | `fetchData` Promise.all | `fetch('/api/hue/scenes')` | `fetch('/api/v1/hue/scenes')` |
| 64 | `fetchData` Promise.all | `fetch('/api/hue/rooms')` | `fetch('/api/v1/hue/groups')` |
| 90 | `checkConnection` | `fetch('/api/hue/status')` | `fetch('/api/v1/hue/health')` |

**fetchData pattern** (lines 59-84):
```typescript
// BEFORE (lines 62-65):
const [scenesRes, roomsRes] = await Promise.all([
  fetch('/api/hue/scenes'),
  fetch('/api/hue/rooms'),
]);

// AFTER:
const [scenesRes, roomsRes] = await Promise.all([
  fetch('/api/v1/hue/scenes'),
  fetch('/api/v1/hue/groups'),
]);
```

**checkConnection pattern** (lines 86-101):
```typescript
// BEFORE (line 90):
const response = await fetch('/api/hue/status');

// AFTER:
const response = await fetch('/api/v1/hue/health');
```

No structural changes — response shape handling (`data.connected`, `data.groups`, `data.scenes`) is identical.

---

### `app/components/lights/CreateSceneModal.tsx` (component, 1 URL replacement)

**Analog:** self — 1 targeted string replacement

| Line | Find | Replace |
|------|------|---------|
| 90 | `fetch('/api/hue/lights')` | `fetch('/api/v1/hue/lights')` |

**fetchRoomLights pattern** (lines 85-104):
```typescript
// BEFORE (line 90):
const response = await fetch('/api/hue/lights');

// AFTER:
const response = await fetch('/api/v1/hue/lights');
```

Response shape (`data.lights`) is unchanged — new route uses same `{ lights: data }` envelope.

---

### `app/components/lights/EditSceneModal.tsx` (component, 1 URL replacement)

**Analog:** self — 1 targeted string replacement

| Line | Find | Replace |
|------|------|---------|
| 94 | `fetch('/api/hue/lights')` | `fetch('/api/v1/hue/lights')` |

Identical pattern to `CreateSceneModal.tsx` — same line context (`fetchRoomLights` function), same response shape.

---

### `app/debug/components/tabs/HueTab.tsx` (component, ~15 URL replacements)

**Analog:** self — targeted string replacements across fetchAllGetEndpoints + EndpointCard props + callPutEndpoint calls

**fetchAllGetEndpoints function** (lines 53-58) — 4 replacements:
```typescript
// BEFORE:
const fetchAllGetEndpoints = () => {
  fetchGetEndpoint('status', '/api/hue/status');
  fetchGetEndpoint('lights', '/api/hue/lights');
  fetchGetEndpoint('rooms', '/api/hue/rooms');
  fetchGetEndpoint('scenes', '/api/hue/scenes');
};

// AFTER:
const fetchAllGetEndpoints = () => {
  fetchGetEndpoint('status', '/api/v1/hue/health');
  fetchGetEndpoint('lights', '/api/v1/hue/lights');
  fetchGetEndpoint('rooms', '/api/v1/hue/groups');
  fetchGetEndpoint('scenes', '/api/v1/hue/scenes');
};
```

**EndpointCard url props** (lines 152, 164, 175, 188) — 4 replacements:
```typescript
// BEFORE/AFTER pairs:
url="/api/hue/status"        → url="/api/v1/hue/health"
url="/api/hue/lights"        → url="/api/v1/hue/lights"
url="/api/hue/rooms"         → url="/api/v1/hue/groups"
url="/api/hue/scenes"        → url="/api/v1/hue/scenes"
```

**EndpointCard onRefresh callbacks** (lines 157, 169, 181, 193) — 4 replacements:
```typescript
// BEFORE/AFTER pairs:
onRefresh={() => fetchGetEndpoint('status', '/api/hue/status')}  → '/api/v1/hue/health'
onRefresh={() => fetchGetEndpoint('lights', '/api/hue/lights')}  → '/api/v1/hue/lights'
onRefresh={() => fetchGetEndpoint('rooms', '/api/hue/rooms')}    → '/api/v1/hue/groups'
onRefresh={() => fetchGetEndpoint('scenes', '/api/hue/scenes')}  → '/api/v1/hue/scenes'
```

**PostEndpointCard "Control Light"** (lines 208-226):
```typescript
// url prop display label:
url="/api/hue/lights/[id]"  →  url="/api/v1/hue/lights/[id]/state"

// onExecute callPutEndpoint target (line 219):
// BEFORE:
callPutEndpoint('controlLight', `/api/hue/lights/${values.lightId}`, { ... })
// AFTER:
callPutEndpoint('controlLight', `/api/v1/hue/lights/${values.lightId}/state`, { ... })
```

**PostEndpointCard "Control Room"** (lines 228-248):
```typescript
// url prop display label:
url="/api/hue/rooms/[id]"  →  url="/api/v1/hue/groups/[id]/action"

// onExecute callPutEndpoint target (line 241):
// BEFORE:
callPutEndpoint('controlRoom', `/api/hue/rooms/${values.roomId}`, { ... })
// AFTER:
callPutEndpoint('controlRoom', `/api/v1/hue/groups/${values.roomId}/action`, { ... })
```

**PostEndpointCard "Activate Scene"** (lines 250-264):
```typescript
// url prop display label:
url="/api/hue/groups/[groupId]/scenes/[sceneId]"  →  url="/api/v1/hue/groups/[groupId]/scenes/[sceneId]"

// onExecute callPostEndpoint target (line 261):
// BEFORE:
callPostEndpoint('activateScene', `/api/hue/groups/${values.groupId}/scenes/${values.sceneId}`, {})
// AFTER:
callPostEndpoint('activateScene', `/api/v1/hue/groups/${values.groupId}/scenes/${values.sceneId}`, {})
```

---

### `app/debug/api/components/tabs/HueTab.tsx` (component, identical to above)

**Analog:** `app/debug/components/tabs/HueTab.tsx` — the two files are identical in structure.

Apply the exact same 15 replacements as documented above for `app/debug/components/tabs/HueTab.tsx`.

---

### `app/debug/components/tabs/__tests__/HueTab.test.tsx` (test, 3 assertion updates)

**Analog:** self — 3 `stringContaining` assertion updates

**Test file structure to preserve** (lines 1-98):
- Mock pattern for `EndpointCard`/`PostEndpointCard` — unchanged
- `mockFetch` global setup — unchanged
- `console.error` suppression block — unchanged
- Fake timers pattern — unchanged

**3 assertion replacements** (lines 62, 72, 82):
```typescript
// it('Control Light calls fetch with PUT method') — line 62:
// BEFORE:
expect(mockFetch).toHaveBeenCalledWith(
  expect.stringContaining('/api/hue/lights/'),
  expect.objectContaining({ method: 'PUT' })
);
// AFTER:
expect(mockFetch).toHaveBeenCalledWith(
  expect.stringContaining('/api/v1/hue/lights/'),
  expect.objectContaining({ method: 'PUT' })
);

// it('Control Room calls fetch with PUT method') — line 72:
// BEFORE:
expect(mockFetch).toHaveBeenCalledWith(
  expect.stringContaining('/api/hue/rooms/'),
  expect.objectContaining({ method: 'PUT' })
);
// AFTER:
expect(mockFetch).toHaveBeenCalledWith(
  expect.stringContaining('/api/v1/hue/groups/'),
  expect.objectContaining({ method: 'PUT' })
);

// it('Activate Scene calls correct URL...') — line 82:
// BEFORE:
expect(mockFetch).toHaveBeenCalledWith(
  expect.stringContaining('/api/hue/groups/test-id/scenes/test-id'),
  expect.objectContaining({ method: 'POST' })
);
// AFTER:
expect(mockFetch).toHaveBeenCalledWith(
  expect.stringContaining('/api/v1/hue/groups/test-id/scenes/test-id'),
  expect.objectContaining({ method: 'POST' })
);
```

**it('Activate Scene card shows correct url label')** at line 87 — check if `url` prop of PostEndpointCard needs updating too:
```typescript
// If url label was "/api/hue/groups/[groupId]/scenes/[sceneId]", update assertion to match new label:
expect(urlSpan.textContent).toContain('groups/[groupId]/scenes/[sceneId]');
// This test does NOT check /api/ prefix — it only checks the path segment. Safe to leave as-is
// if the new url prop still contains 'groups/[groupId]/scenes/[sceneId]'. It will.
```

---

### `app/debug/api/components/tabs/__tests__/HueTab.test.tsx` (test, identical 3 assertion updates)

Apply the exact same 3 assertion replacements as documented above for `app/debug/components/tabs/__tests__/HueTab.test.tsx`.

---

### `app/registry/devices/page.tsx` (page, 1 URL replacement — NOT in D-09 but required)

**Analog:** self — 1 targeted string replacement

| Line | Find | Replace |
|------|------|---------|
| 149 | `fetch('/api/hue/lights')` | `fetch('/api/v1/hue/lights')` |

**Critical:** This file is not listed in D-09 but was confirmed by codebase grep. Failing to update it will cause a 404 on `/registry/devices` after legacy route deletion. Response shape (`data.lights`) is unchanged.

---

## Shared Patterns

### withAuthAndErrorHandler (all new v1 routes)
**Source:** `app/api/v1/hue/groups/route.ts` lines 1-14
**Apply to:** `app/api/v1/hue/lights/route.ts`, `app/api/v1/hue/scenes/route.ts`
```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
// ...
export const dynamic = 'force-dynamic';
export const GET = withAuthAndErrorHandler(async () => {
  // ...
}, 'Hue/RouteName');
```

### Response Envelope Convention
**Apply to:** All new v1 list routes
- `getLights()` → wrap with `success({ lights: data })` — matches `useLightsData` reads `lightsData.lights`
- `getScenes()` → wrap with `success({ scenes: data })` — matches `useLightsData` reads `data.scenes`
- Never use `success(data)` directly for list routes — consumers expect named envelope keys

### Path Split Rule (lights PUT)
**Source:** `app/api/v1/hue/lights/[lightId]/state/route.ts` vs `app/api/v1/hue/lights/[lightId]/route.ts`
**Apply to:** All 3 PUT calls in `app/lights/page.tsx` (lines 26, 42, 58)
- Legacy: `PUT /api/hue/lights/${id}` (GET+PUT on same route)
- V1: `GET /api/v1/hue/lights/${id}` and `PUT /api/v1/hue/lights/${id}/state` (separate routes)
- Frontend PUT calls MUST append `/state`

### 202 + suggested_poll_delay_s (command response handling)
**Source:** `app/lights/page.tsx` lines 31-33, `app/components/devices/lights/hooks/useLightsCommands.ts` lines 96-98
**Apply to:** All command hooks — pattern is unchanged after URL migration
```typescript
const data = await res.json() as { suggested_poll_delay_s?: number };
await new Promise<void>(r => setTimeout(r, (data.suggested_poll_delay_s ?? 2) * 1000));
await lightsData.fetchData();
```

### Jest mock pattern for v1 route tests
**Source:** `app/api/v1/hue/groups/__tests__/route.test.ts` lines 1-16
**Apply to:** New test files for lights and scenes routes
```typescript
jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));
// Static imports after jest.mock calls:
import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { auth0 } from '@/lib/auth0';
const mockGetSession = jest.mocked(auth0.getSession);
```

---

## Legacy Route Deletion Scope (D-11)

After Wave 2 frontend migration is confirmed, delete entire `app/api/hue/` directory tree.

Verify no remaining `/api/hue` references in non-legacy files before deletion:
```bash
grep -r "/api/hue" app/ --include="*.ts" --include="*.tsx" | grep -v "app/api/hue"
```
Expected result: zero matches.

---

## No Analog Found

None — all files have exact or near-exact analogs in the codebase.

---

## Metadata

**Analog search scope:** `app/api/v1/hue/`, `app/components/devices/lights/`, `app/lights/`, `app/debug/`
**Files scanned:** 15 source files + 7 existing test files
**Pattern extraction date:** 2026-04-16
