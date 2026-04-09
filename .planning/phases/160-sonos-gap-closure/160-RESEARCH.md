# Phase 160: Sonos Gap Closure - Research

**Researched:** 2026-04-09
**Domain:** Next.js API Route Creation (v1 path wrapper pattern)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Create new route files under `app/api/v1/sonos/zones/[groupId]/` following the established proxy pattern (withAuthAndErrorHandler + proxy function call). Do NOT move or delete old `/api/sonos/zones/*` routes — those remain for backwards compatibility.
- **D-02:** All new v1 routes follow the same structure as `app/api/v1/thermorossi/` and `app/api/v1/hue/` routes: `export const dynamic = 'force-dynamic'`, `withAuthAndErrorHandler` wrapper, proxy function delegation.
- **D-03:** Route-to-proxy-function mapping (13 routes):
  - `GET  /api/v1/sonos/zones/[groupId]/playback` → `getPlayback(groupId)` — 200 OK
  - `POST /api/v1/sonos/zones/[groupId]/play` → `play(groupId)` — 202 Accepted
  - `POST /api/v1/sonos/zones/[groupId]/pause` → `pause(groupId)` — 202 Accepted
  - `POST /api/v1/sonos/zones/[groupId]/stop` → `stop(groupId)` — 202 Accepted
  - `POST /api/v1/sonos/zones/[groupId]/next` → `next(groupId)` — 202 Accepted
  - `POST /api/v1/sonos/zones/[groupId]/previous` → `previous(groupId)` — 202 Accepted
  - `PUT  /api/v1/sonos/zones/[groupId]/volume` → `setZoneVolume(groupId, volume)` — 202 Accepted
  - `PUT  /api/v1/sonos/zones/[groupId]/seek` → `seek(groupId, position)` — 202 Accepted
  - `GET  /api/v1/sonos/zones/[groupId]/play-mode` → `getPlayMode(groupId)` — 200 OK
  - `PUT  /api/v1/sonos/zones/[groupId]/play-mode` → `setPlayMode(groupId, body)` — 202 Accepted
  - `GET  /api/v1/sonos/zones/[groupId]/queue` → `getQueue(groupId, limit?, offset?)` — 200 OK
  - `GET  /api/v1/sonos/zones/[groupId]/sleep-timer` → `getSleepTimer(groupId)` — 200 OK
  - `PUT  /api/v1/sonos/zones/[groupId]/sleep-timer` → `setSleepTimer(groupId, body)` — 202 Accepted
- **D-04:** Frontend hooks are NOT updated in this phase. Old `/api/sonos/*` routes remain active.
- **D-05:** Each new v1 route gets a co-located `__tests__/route.test.ts` test file, following Phase 159 Hue route test pattern.
- **D-06:** V1 routes return identical response shapes to old routes. Command routes include `suggested_poll_delay_s: 1` in 202 responses.

### Claude's Discretion

- Log tag naming convention for `withAuthAndErrorHandler` (e.g., `'Sonos/Zones/Playback'`)
- Test assertion granularity and mock structure
- Query parameter parsing for queue endpoint (limit, offset)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SONOS-01 | GET /api/v1/sonos/zones/{group_id}/playback returns current playback state | `getPlayback(groupId)` proxy function exists; old route pattern confirmed |
| SONOS-02 | POST /api/v1/sonos/zones/{group_id}/play sends play command | `play(groupId)` proxy function exists; 202 pattern from old route confirmed |
| SONOS-03 | POST /api/v1/sonos/zones/{group_id}/pause sends pause command | `pause(groupId)` proxy function exists |
| SONOS-04 | POST /api/v1/sonos/zones/{group_id}/stop sends stop command | `stop(groupId)` proxy function exists |
| SONOS-05 | POST /api/v1/sonos/zones/{group_id}/next skips to next track | `next(groupId)` proxy function exists |
| SONOS-06 | POST /api/v1/sonos/zones/{group_id}/previous skips to previous | `previous(groupId)` proxy function exists |
| SONOS-07 | PUT /api/v1/sonos/zones/{group_id}/volume controls zone volume | `setZoneVolume(groupId, volume)` proxy function exists; body type `SetVolumeRequest` |
| SONOS-08 | PUT /api/v1/sonos/zones/{group_id}/seek seeks to position | `seek(groupId, position)` proxy function exists; body type `SetSeekRequest` |
| SONOS-09 | GET /api/v1/sonos/zones/{group_id}/play-mode returns play mode | `getPlayMode(groupId)` proxy function exists |
| SONOS-10 | PUT /api/v1/sonos/zones/{group_id}/play-mode sets play mode | `setPlayMode(groupId, body)` proxy function exists; body type `SetPlayModeRequest` |
| SONOS-11 | GET /api/v1/sonos/zones/{group_id}/queue returns queue | `getQueue(groupId, limit?, offset?)` proxy function exists; query param parsing confirmed |
| SONOS-12 | GET /api/v1/sonos/zones/{group_id}/sleep-timer returns sleep timer | `getSleepTimer(groupId)` proxy function exists |
| SONOS-13 | PUT /api/v1/sonos/zones/{group_id}/sleep-timer sets sleep timer | `setSleepTimer(groupId, body)` proxy function exists; body type `SetSleepTimerRequest` |

</phase_requirements>

---

## Summary

Phase 160 is a pure route-creation exercise. All 13 zone-level proxy functions already exist in `lib/sonos/sonosProxy.ts` and are fully typed in `types/sonosProxy.ts`. The old-path routes at `app/api/sonos/zones/[groupId]/` also already exist and contain exact implementation patterns to replicate under the `app/api/v1/sonos/zones/[groupId]/` tree.

The new v1 directory `app/api/v1/sonos/` does not exist yet and must be created. Each new route is a thin wrapper: `withAuthAndErrorHandler` + `getPathParam` + optional `parseJson` + proxy call + `success()`. Tests follow the Phase 159 Hue pattern exactly: `jest.mock` the proxy module + `auth0`, import the handler, assert 401 on no session and correct status on success.

**Primary recommendation:** Copy old-path routes wholesale into the v1 path tree, adjust log tags to follow `'Sonos/Zones/Xxx'` convention, and add co-located `__tests__/route.test.ts` for each.

---

## Standard Stack

### Core (all already installed)
[VERIFIED: codebase grep]

| Library | Import Path | Purpose |
|---------|-------------|---------|
| `withAuthAndErrorHandler` | `@/lib/core` | Auth + error handling wrapper |
| `success` | `@/lib/core` | Builds 200 JSON response |
| `getPathParam` | `@/lib/core` | Extracts dynamic segment from route context |
| `parseJson` | `@/lib/core` | Parses request body |
| `HTTP_STATUS` | `@/lib/core` | Status code constants (ACCEPTED = 202) |
| `sonosProxy.ts` | `@/lib/sonos/sonosProxy` | All 13 proxy functions |
| `types/sonosProxy.ts` | `@/types/sonosProxy` | Request/response types |

### No new dependencies required
This phase installs nothing. All imports are already available in the codebase.

---

## Architecture Patterns

### Recommended Directory Structure
[VERIFIED: codebase inspection]

```
app/api/v1/sonos/zones/[groupId]/
├── playback/
│   ├── route.ts
│   └── __tests__/route.test.ts
├── play/
│   ├── route.ts
│   └── __tests__/route.test.ts
├── pause/
│   ├── route.ts
│   └── __tests__/route.test.ts
├── stop/
│   ├── route.ts
│   └── __tests__/route.test.ts
├── next/
│   ├── route.ts
│   └── __tests__/route.test.ts
├── previous/
│   ├── route.ts
│   └── __tests__/route.test.ts
├── volume/
│   ├── route.ts
│   └── __tests__/route.test.ts
├── seek/
│   ├── route.ts
│   └── __tests__/route.test.ts
├── play-mode/
│   ├── route.ts
│   └── __tests__/route.test.ts
├── queue/
│   ├── route.ts
│   └── __tests__/route.test.ts
└── sleep-timer/
    ├── route.ts
    └── __tests__/route.test.ts
```

Total: 11 directories × 2 files = 22 new files. (play-mode and sleep-timer each have GET + PUT handlers in a single route.ts, same as old-path.)

### Pattern 1: GET route (read — 200 OK)
[VERIFIED: app/api/sonos/zones/[groupId]/playback/route.ts]

```typescript
import { withAuthAndErrorHandler, success, getPathParam } from '@/lib/core';
import { getPlayback } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/sonos/zones/[groupId]/playback
 * Returns current playback state for a zone.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const data = await getPlayback(groupId);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Zones/Playback');
```

### Pattern 2: POST command route (no body — 202 Accepted)
[VERIFIED: app/api/sonos/zones/[groupId]/play/route.ts]

```typescript
import { withAuthAndErrorHandler, success, getPathParam, HTTP_STATUS } from '@/lib/core';
import { play } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/sonos/zones/[groupId]/play
 * Resumes playback for a zone.
 * Protected: Requires Auth0 authentication
 * Returns: 202 Accepted with suggested_poll_delay_s
 */
export const POST = withAuthAndErrorHandler(async (_request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const data = await play(groupId);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Zones/Play');
```

The same pattern applies for pause, stop, next, previous — only import and tag change.

### Pattern 3: PUT command route (with body — 202 Accepted)
[VERIFIED: app/api/sonos/zones/[groupId]/volume/route.ts]

```typescript
import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { setZoneVolume } from '@/lib/sonos/sonosProxy';
import type { SetVolumeRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/v1/sonos/zones/[groupId]/volume
 * Sets volume for all speakers in a zone.
 * Protected: Requires Auth0 authentication
 * Returns: 202 Accepted with suggested_poll_delay_s
 */
export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const body = await parseJson(request) as SetVolumeRequest;
  const data = await setZoneVolume(groupId, body.volume);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Zones/SetVolume');
```

Seek uses `SetSeekRequest` and `body.position` as the argument. Play-mode PUT uses `SetPlayModeRequest` and passes `body` directly. Sleep-timer PUT uses `SetSleepTimerRequest` and passes `body` directly.

### Pattern 4: GET+PUT in same route file (dual-export)
[VERIFIED: app/api/sonos/zones/[groupId]/play-mode/route.ts and sleep-timer/route.ts]

`play-mode` and `sleep-timer` each export both `GET` and `PUT` from the same `route.ts`. This is the existing old-path pattern and must be replicated exactly in the v1 path. The file exports two named handlers:

```typescript
export const GET = withAuthAndErrorHandler(async (_request, context) => { ... }, 'Sonos/Zones/PlayMode/Get');
export const PUT = withAuthAndErrorHandler(async (request, context) => { ... }, 'Sonos/Zones/PlayMode/Set');
```

### Pattern 5: GET route with query params (queue)
[VERIFIED: app/api/sonos/zones/[groupId]/queue/route.ts]

```typescript
export const GET = withAuthAndErrorHandler(async (request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const { searchParams } = request.nextUrl;
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  const data = await getQueue(groupId, limit ?? undefined, offset ?? undefined);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Zones/Queue');
```

Note: `request.nextUrl` is available inside `withAuthAndErrorHandler` — the wrapper passes the original `NextRequest`.

### Pattern 6: Test file structure
[VERIFIED: app/api/v1/hue/health/__tests__/route.test.ts and related]

```typescript
jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';  // or POST / PUT
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetPlayback = jest.mocked(sonosProxy.getPlayback);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/v1/sonos/zones/[groupId]/playback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/v1/sonos/zones/RINCON_123/playback');
    const response = await GET(req as any, { params: Promise.resolve({ groupId: 'RINCON_123' }) } as any);
    expect(response.status).toBe(401);
  });

  it('should return 200 with playback data', async () => {
    mockGetPlayback.mockResolvedValue({ group_id: 'RINCON_123', transport_state: 'PLAYING', ... } as any);
    const req = new Request('http://localhost:3000/api/v1/sonos/zones/RINCON_123/playback');
    const response = await GET(req as any, { params: Promise.resolve({ groupId: 'RINCON_123' }) } as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetPlayback).toHaveBeenCalledWith('RINCON_123');
  });
});
```

Command routes assert `response.status` is 202. Dual-export routes (play-mode, sleep-timer) test both GET and PUT handlers in the same test file.

### Anti-Patterns to Avoid

- **Do not import `NextResponse` directly** — always use `success()` from `@/lib/core` for read routes and `success(..., null, HTTP_STATUS.ACCEPTED)` for command routes. The Hue light/state route (`app/api/v1/hue/lights/[lightId]/state/route.ts`) is an exception because it also calls `adminDbPush` for logging — Sonos routes do NOT log to Firebase.
- **Do not add Firebase logging** — Sonos v1 routes are thin wrappers; the Hue state route's adminDbPush is specific to Hue, not a pattern to copy here.
- **Do not pass `null` as the `limit`/`offset` argument** — use `null ?? undefined` coercion (`searchParams.get('limit') ?? undefined`) when passing optionals to the proxy.
- **Do not create a shared `[groupId]/route.ts`** — each sub-resource gets its own named sub-directory with `route.ts`, not a route-level handler.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Auth check | Custom session validation | `withAuthAndErrorHandler` from `@/lib/core` |
| Path param extraction | `context.params` direct access | `getPathParam(context, 'groupId')` |
| JSON body parsing | `request.json()` directly | `parseJson(request)` from `@/lib/core` |
| Success response shape | `NextResponse.json(...)` | `success(data as unknown as Record<string, unknown>)` |
| 202 Accepted response | Custom NextResponse | `success({...data, suggested_poll_delay_s: 1}, null, HTTP_STATUS.ACCEPTED)` |
| Query params | Manual URL parsing | `request.nextUrl.searchParams.get(key)` |

---

## Grouping Routes by Implementation Plan

The 13 routes can be grouped by pattern similarity for parallel plan execution:

**Group A — 5 no-body POST commands** (identical pattern, only name changes):
play, pause, stop, next, previous

**Group B — 2 single-field PUT commands**:
volume (`body.volume`), seek (`body.position`)

**Group C — 1 GET read with query params**:
queue

**Group D — 2 GET reads (simple)**:
playback, play-mode GET

**Group E — 2 dual-export GET+PUT routes**:
play-mode (GET+PUT), sleep-timer (GET+PUT)

Note: play-mode appears in both D and E — it is one route file with dual export. Treat as Group E (dual-export).

Revised grouping for plans:
- Plan 1: Group A (play, pause, stop, next, previous) — 5 routes + 5 test files
- Plan 2: Group B+C+D (volume, seek, queue, playback) — 4 routes + 4 test files
- Plan 3: Group E (play-mode, sleep-timer) — 2 routes + 2 test files

---

## Common Pitfalls

### Pitfall 1: Forgetting `export const dynamic = 'force-dynamic'`
**What goes wrong:** Next.js static analysis may cache the route response, defeating real-time API behavior.
**Why it happens:** New file creation without template.
**How to avoid:** Every route.ts must include this as the first non-import export.
**Warning signs:** Response returns stale data or build warning about static routes.

### Pitfall 2: Using `null` instead of `undefined` for optional proxy args
**What goes wrong:** `getQueue(groupId, null, null)` — TypeScript error; the proxy signature expects `string | undefined`.
**Why it happens:** `searchParams.get()` returns `string | null`, not `string | undefined`.
**How to avoid:** Use `searchParams.get('limit') ?? undefined` pattern (confirmed in old-path queue route).

### Pitfall 3: Test mock not using `jest.mock` hoisting
**What goes wrong:** `jest.mock` calls placed after imports are ignored by Jest's hoisting mechanism.
**Why it happens:** Forgetting that `jest.mock` must appear before all imports.
**How to avoid:** Follow Phase 159 pattern exactly — `jest.mock(...)` at top of file before any imports.

### Pitfall 4: Wrong context shape in tests for dynamic segments
**What goes wrong:** Passing `{ params: { groupId: 'RINCON_123' } }` instead of `{ params: Promise.resolve({ groupId: 'RINCON_123' }) }`.
**Why it happens:** Next.js 15 changed route context `params` to be a Promise.
**How to avoid:** Use `params: Promise.resolve({ groupId: '...' })` in test context — confirmed in all Phase 159 tests.

### Pitfall 5: Dual-export route test file only tests one method
**What goes wrong:** Test for `play-mode` only tests GET, misses PUT coverage.
**Why it happens:** Forgetting the route has two exports.
**How to avoid:** Import both `GET` and `PUT` from `../route` in the test file and write separate `describe` blocks.

---

## Code Examples

### Seek route body extraction (body.position, not spread body)
[VERIFIED: app/api/sonos/zones/[groupId]/seek/route.ts]

```typescript
const body = await parseJson(request) as SetSeekRequest;
const data = await seek(groupId, body.position);
```

Note: `seek` takes `(groupId: string, position: string)` — the position string is extracted from the body, not the body object itself.

### Volume route body extraction (body.volume, not spread body)
[VERIFIED: app/api/sonos/zones/[groupId]/volume/route.ts]

```typescript
const body = await parseJson(request) as SetVolumeRequest;
const data = await setZoneVolume(groupId, body.volume);
```

### Play-mode and sleep-timer pass full body object
[VERIFIED: app/api/sonos/zones/[groupId]/play-mode/route.ts, sleep-timer/route.ts]

```typescript
// play-mode:
const body = await parseJson(request) as SetPlayModeRequest;
const data = await setPlayMode(groupId, body);  // body = { mode: SonosPlayMode }

// sleep-timer:
const body = await parseJson(request) as SetSleepTimerRequest;
const data = await setSleepTimer(groupId, body);  // body = { duration: number }
```

---

## Runtime State Inventory

Not applicable — this phase creates new route files and does not rename, migrate, or refactor existing code.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 160 is purely code/config changes. No external tools, services, CLIs, or runtimes required beyond the existing Next.js codebase.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest |
| Config file | jest.config.ts (root) |
| Quick run command | `npm test -- app/api/v1/sonos` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SONOS-01 | GET playback returns 200 with data | unit | `npm test -- app/api/v1/sonos/zones/\\[groupId\\]/playback` | ❌ Wave 0 |
| SONOS-02 | POST play returns 202 | unit | `npm test -- app/api/v1/sonos/zones/\\[groupId\\]/play` | ❌ Wave 0 |
| SONOS-03 | POST pause returns 202 | unit | `npm test -- app/api/v1/sonos/zones/\\[groupId\\]/pause` | ❌ Wave 0 |
| SONOS-04 | POST stop returns 202 | unit | `npm test -- app/api/v1/sonos/zones/\\[groupId\\]/stop` | ❌ Wave 0 |
| SONOS-05 | POST next returns 202 | unit | `npm test -- app/api/v1/sonos/zones/\\[groupId\\]/next` | ❌ Wave 0 |
| SONOS-06 | POST previous returns 202 | unit | `npm test -- app/api/v1/sonos/zones/\\[groupId\\]/previous` | ❌ Wave 0 |
| SONOS-07 | PUT volume returns 202 | unit | `npm test -- app/api/v1/sonos/zones/\\[groupId\\]/volume` | ❌ Wave 0 |
| SONOS-08 | PUT seek returns 202 | unit | `npm test -- app/api/v1/sonos/zones/\\[groupId\\]/seek` | ❌ Wave 0 |
| SONOS-09 | GET play-mode returns 200 | unit | `npm test -- app/api/v1/sonos/zones/\\[groupId\\]/play-mode` | ❌ Wave 0 |
| SONOS-10 | PUT play-mode returns 202 | unit | `npm test -- app/api/v1/sonos/zones/\\[groupId\\]/play-mode` | ❌ Wave 0 |
| SONOS-11 | GET queue returns 200, passes limit/offset | unit | `npm test -- app/api/v1/sonos/zones/\\[groupId\\]/queue` | ❌ Wave 0 |
| SONOS-12 | GET sleep-timer returns 200 | unit | `npm test -- app/api/v1/sonos/zones/\\[groupId\\]/sleep-timer` | ❌ Wave 0 |
| SONOS-13 | PUT sleep-timer returns 202 | unit | `npm test -- app/api/v1/sonos/zones/\\[groupId\\]/sleep-timer` | ❌ Wave 0 |

All 13 tests also verify 401 when unauthenticated.

### Sampling Rate
- **Per task commit:** `npm test -- app/api/v1/sonos`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
All 11 test files are Wave 0 gaps (created alongside their route files):

- [ ] `app/api/v1/sonos/zones/[groupId]/playback/__tests__/route.test.ts`
- [ ] `app/api/v1/sonos/zones/[groupId]/play/__tests__/route.test.ts`
- [ ] `app/api/v1/sonos/zones/[groupId]/pause/__tests__/route.test.ts`
- [ ] `app/api/v1/sonos/zones/[groupId]/stop/__tests__/route.test.ts`
- [ ] `app/api/v1/sonos/zones/[groupId]/next/__tests__/route.test.ts`
- [ ] `app/api/v1/sonos/zones/[groupId]/previous/__tests__/route.test.ts`
- [ ] `app/api/v1/sonos/zones/[groupId]/volume/__tests__/route.test.ts`
- [ ] `app/api/v1/sonos/zones/[groupId]/seek/__tests__/route.test.ts`
- [ ] `app/api/v1/sonos/zones/[groupId]/play-mode/__tests__/route.test.ts`
- [ ] `app/api/v1/sonos/zones/[groupId]/queue/__tests__/route.test.ts`
- [ ] `app/api/v1/sonos/zones/[groupId]/sleep-timer/__tests__/route.test.ts`

Framework install: NOT required — Jest already configured.

---

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `withAuthAndErrorHandler` — rejects with 401 when `auth0.getSession` returns null |
| V3 Session Management | no | Session managed by Auth0, not by these routes |
| V4 Access Control | no | Single-user app, no role-based access needed |
| V5 Input Validation | yes | TypeScript type casting on parsed body; proxy validates upstream |
| V6 Cryptography | no | No crypto operations in route wrappers |

Authentication is handled uniformly by `withAuthAndErrorHandler` — no route needs custom auth code.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `withAuthAndErrorHandler` passes `request.nextUrl` through to the handler unchanged | Architecture Patterns (Pattern 5) | Queue route `request.nextUrl.searchParams` would not work — but this is confirmed in the old-path queue route which already uses this pattern [VERIFIED] |

No unverified assumptions remain — all patterns confirmed from existing codebase.

---

## Open Questions

None. All patterns are fully confirmed from the existing codebase. The phase is a direct replication of known-good patterns.

---

## Sources

### Primary (HIGH confidence)
- `lib/sonos/sonosProxy.ts` — All 13 proxy functions verified present and typed
- `types/sonosProxy.ts` — All request/response types verified
- `app/api/sonos/zones/[groupId]/*/route.ts` — 11 old-path route files, all verified
- `app/api/v1/hue/*/route.ts` + `__tests__/route.test.ts` — 7 reference v1 route + test files, all verified
- `app/api/v1/thermorossi/status/route.ts` — GET read pattern, verified
- `.planning/config.json` — nyquist_validation: true confirmed

### Secondary
None required — all information sourced directly from codebase.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all utilities and types confirmed in codebase
- Architecture: HIGH — patterns copied verbatim from existing routes
- Pitfalls: HIGH — identified from Next.js 15 params Promise behavior and existing test patterns

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable codebase patterns)
