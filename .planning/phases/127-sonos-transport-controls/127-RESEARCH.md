# Phase 127: Sonos Transport Controls - Research

**Researched:** 2026-03-24
**Domain:** Next.js API routes — Sonos proxy transport controls and volume/seek commands
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Add command wrappers to existing `lib/sonos/sonosProxy.ts` — same file as Phase 126 read wrappers, matching established pattern (thermorossiProxy.ts, hueProxy.ts)
- **D-02:** Transport commands (play/pause/stop/next/previous) use `haPost` with empty body `{}` — HA API returns `SonosCommandOkResponse`
- **D-03:** Volume/mute/seek commands use `haPut` with typed request body — `SetVolumeRequest`, `SetMuteRequest`, `SetSeekRequest`
- **D-04:** No idempotency wrapper on Sonos commands — transport controls are inherently idempotent (play when playing = no-op) and volume is last-write-wins
- **D-05:** GET `/api/sonos/zones/[groupId]/playback` returns `SonosPlaybackResponse` from cache — uses `haGet` + existing `getPathParam()` for `[groupId]`
- **D-06:** GET `/api/sonos/speakers/[uid]/volume` returns `SonosVolumeResponse` from cache — reuses `[uid]` dynamic segment pattern from Phase 126
- **D-07:** 5 POST routes under `/api/sonos/zones/[groupId]/{play|pause|stop|next|previous}` — each calls its `haPost` wrapper, returns 202 Accepted with `suggested_poll_delay_s`
- **D-08:** All transport POST routes have no request body — `haPost` receives empty `{}`
- **D-09:** 422 not_coordinator errors pass through from HA proxy — no client-side coordinator validation
- **D-10:** PUT `/api/sonos/speakers/[uid]/volume` sets speaker volume (0-100) — uses `haPut` with `SetVolumeRequest`
- **D-11:** PUT `/api/sonos/speakers/[uid]/mute` sets speaker mute state — uses `haPut` with `SetMuteRequest`
- **D-12:** PUT `/api/sonos/zones/[groupId]/volume` sets zone-wide volume — uses `haPut` with `SetVolumeRequest`
- **D-13:** All PUT command routes return 202 Accepted with `suggested_poll_delay_s` — consistent with Thermorossi/Hue command pattern
- **D-14:** PUT `/api/sonos/zones/[groupId]/seek` accepts `SetSeekRequest` with `position` in "HH:MM:SS" format — returns 202 Accepted
- **D-15:** No position format validation at Next.js layer — HA proxy returns 422 for invalid format or non-seekable content
- **D-16:** All command routes return `success(data as unknown as Record<string, unknown>, null, HTTP_STATUS.ACCEPTED)` — double assertion pattern matching Phase 126 and existing stove/hue routes
- **D-17:** `suggested_poll_delay_s: 1` added to all command responses — frontend can use this to refresh playback/volume state after commands

### Claude's Discretion
- Proxy function naming (e.g., `play`, `pause`, `setVolume`, `setSpeakerMute`)
- Test file organization and mock data
- JSDoc on new proxy functions (brief, optional)
- Whether to group route files or keep flat structure under zones/speakers

### Deferred Ideas (OUT OF SCOPE)
- Extended controls (EQ, play-mode, queue, home theater, grouping, sleep timer, history) — Phase 128
- Frontend (SonosCard, /sonos page, device registry, nav menu) — Phase 129
- Idempotency wrappers for critical commands — not needed (transport controls are naturally idempotent)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SONOS-07 | GET /sonos/zones/{group_id}/playback — stato playback corrente per zona | haGet wrapper + dynamic route with getPathParam('groupId') |
| SONOS-08 | GET /sonos/speakers/{uid}/volume — volume e mute state per speaker | haGet wrapper + dynamic route under speakers/[uid]/ |
| SONOS-09 | POST /sonos/zones/{group_id}/play — play su zone coordinator | haPost with {} + 202 response pattern |
| SONOS-10 | POST /sonos/zones/{group_id}/pause — pause zone coordinator | haPost with {} + 202 response pattern |
| SONOS-11 | POST /sonos/zones/{group_id}/stop — stop zone coordinator | haPost with {} + 202 response pattern |
| SONOS-12 | POST /sonos/zones/{group_id}/next — skip al brano successivo | haPost with {} + 202 response pattern |
| SONOS-13 | POST /sonos/zones/{group_id}/previous — skip al brano precedente | haPost with {} + 202 response pattern |
| SONOS-14 | PUT /sonos/speakers/{uid}/volume — set volume speaker (0-100) | haPut with SetVolumeRequest + parseJson + 202 response |
| SONOS-15 | PUT /sonos/speakers/{uid}/mute — set mute state speaker | haPut with SetMuteRequest + parseJson + 202 response |
| SONOS-16 | PUT /sonos/zones/{group_id}/volume — set volume per tutti gli speaker in una zona | haPut with SetVolumeRequest + parseJson + 202 response |
| SONOS-17 | PUT /sonos/zones/{group_id}/seek — seek a posizione nel brano (HH:MM:SS) | haPut with SetSeekRequest + parseJson + 202 response |
</phase_requirements>

---

## Summary

Phase 127 extends the Sonos infrastructure built in Phase 126 by adding transport control, volume control, and seek capabilities to the existing proxy and API routes. All the TypeScript types needed for this phase (`SonosPlaybackResponse`, `SonosVolumeResponse`, `SetVolumeRequest`, `SetMuteRequest`, `SetSeekRequest`, `SonosCommandOkResponse`) were pre-defined in `types/sonosProxy.ts` during Phase 126.

The implementation follows the established two-layer pattern used by all five device providers: proxy wrappers in `lib/sonos/sonosProxy.ts` and thin route handlers in `app/api/sonos/`. Transport commands (play/pause/stop/next/previous) require no request body and use `haPost({})`. Volume, mute, and seek commands use `haPut` with typed bodies parsed via `parseJson`. All mutations return 202 Accepted with `suggested_poll_delay_s: 1`. There is no idempotency wrapper (D-04).

The route directory structure requires two new dynamic route segments: `app/api/sonos/zones/[groupId]/` and `app/api/sonos/speakers/[uid]/`. The `[uid]` pattern already exists in Phase 126 under `app/api/sonos/devices/[uid]/route.ts`. The `[groupId]` segment is new. Under each dynamic segment, multiple leaf routes (playback, play, pause, stop, next, previous, volume, seek for zones; volume, mute for speakers) each live in their own `route.ts` file per Next.js App Router conventions.

**Primary recommendation:** Add ~10 proxy functions to `sonosProxy.ts`, then create 11 new route files. All patterns are already established — this is mechanical application of Phase 126 and Thermorossi/Hue patterns.

---

## Standard Stack

### Core (all already installed, no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.5 | Route handlers with dynamic segments | Project framework |
| `lib/haClient.ts` | project | `haGet`, `haPost`, `haPut` transports | Shared HA proxy client |
| `lib/core/apiResponse.ts` | project | `success()`, `HTTP_STATUS.ACCEPTED` | Consistent response format |
| `lib/core/middleware.ts` | project | `withAuthAndErrorHandler` | Auth + error boundary |
| `lib/core/requestParser.ts` | project | `getPathParam`, `parseJson` | Path/body parsing |
| `types/sonosProxy.ts` | project | All Sonos TypeScript types | Pre-defined in Phase 126 |

**No new packages required.**

---

## Architecture Patterns

### Recommended File Structure

New files this phase:

```
lib/sonos/
└── sonosProxy.ts           # MODIFY: add ~10 new exported functions

app/api/sonos/
├── zones/
│   ├── route.ts                      # existing (GET /zones)
│   └── [groupId]/
│       ├── playback/route.ts         # NEW: GET playback state
│       ├── play/route.ts             # NEW: POST play
│       ├── pause/route.ts            # NEW: POST pause
│       ├── stop/route.ts             # NEW: POST stop
│       ├── next/route.ts             # NEW: POST next
│       ├── previous/route.ts         # NEW: POST previous
│       ├── volume/route.ts           # NEW: PUT zone volume
│       └── seek/route.ts             # NEW: PUT seek
└── speakers/
    └── [uid]/
        ├── volume/route.ts           # NEW: GET + PUT speaker volume
        └── mute/route.ts             # NEW: PUT speaker mute

__tests__/lib/
└── sonosProxy.test.ts                # NEW: proxy wrapper tests
__tests__/app/api/sonos/
└── transport-controls.test.ts        # NEW (or per-route): route handler tests
```

### Pattern 1: Read Route with Dynamic Segment

Used for GET /zones/[groupId]/playback and GET /speakers/[uid]/volume.

```typescript
// Source: app/api/sonos/devices/[uid]/route.ts (Phase 126 reference)
import { withAuthAndErrorHandler, success, getPathParam } from '@/lib/core';
import { getPlayback } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const data = await getPlayback(groupId);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Zones/Playback');
```

Key points:
- `getPathParam` is async — must `await`
- Single object response uses double assertion `data as unknown as Record<string, unknown>`
- Log context string follows `'Sonos/Resource/Action'` convention

### Pattern 2: Transport POST Route (no request body)

Used for play/pause/stop/next/previous.

```typescript
// Source: modeled on app/api/stove/ignit route pattern (no withIdempotency per D-04)
import { withAuthAndErrorHandler, success, getPathParam, HTTP_STATUS } from '@/lib/core';
import { play } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (_request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const data = await play(groupId);
  return success(data as unknown as Record<string, unknown>, null, HTTP_STATUS.ACCEPTED);
}, 'Sonos/Zones/Play');
```

Key points:
- No `parseJson` — body is empty `{}` sent by the proxy wrapper, not by the route handler
- Returns `HTTP_STATUS.ACCEPTED` (202) per D-13, D-16
- No `withIdempotency` wrapper per D-04
- The proxy function receives `groupId` and calls `haPost('/api/v1/sonos/zones/{groupId}/play', {})`

### Pattern 3: Volume/Mute/Seek PUT Route (typed request body)

Used for PUT /speakers/[uid]/volume, PUT /speakers/[uid]/mute, PUT /zones/[groupId]/volume, PUT /zones/[groupId]/seek.

```typescript
// Source: modeled on app/api/hue/lights/[id]/route.ts PUT pattern
import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { setSpeakerVolume } from '@/lib/sonos/sonosProxy';
import type { SetVolumeRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const uid = await getPathParam(context, 'uid');
  const body = await parseJson(request) as SetVolumeRequest;
  const data = await setSpeakerVolume(uid, body.volume);
  return success(data as unknown as Record<string, unknown>, null, HTTP_STATUS.ACCEPTED);
}, 'Sonos/Speakers/SetVolume');
```

Key points:
- `parseJson` (not `parseJsonOrThrow`) — consistent with hue route pattern
- Cast body to typed request interface
- `HTTP_STATUS.ACCEPTED` for 202 per D-13

### Pattern 4: Proxy Command Wrapper (haPost, no body)

```typescript
// Source: lib/stove/thermorossiProxy.ts sendIgnit() pattern
export async function play(groupId: string): Promise<SonosCommandOkResponse> {
  return haPost<SonosCommandOkResponse>(
    `/api/v1/sonos/zones/${groupId}/play`,
    {}
  );
}
```

### Pattern 5: Proxy Command Wrapper (haPut, typed body)

```typescript
// Source: lib/hue/hueProxy.ts setLightState() pattern adapted
export async function setSpeakerVolume(uid: string, volume: number): Promise<SonosCommandOkResponse> {
  return haPut<SonosCommandOkResponse>(
    `/api/v1/sonos/speakers/${uid}/volume`,
    { volume }
  );
}
```

### Pattern 6: Command Response with suggested_poll_delay_s

Per D-17, all command routes add `suggested_poll_delay_s: 1` to the HA response before returning. The `SonosCommandOkResponse` from the HA proxy contains `{ status: 'ok', group_id?: string, uid?: string }`. The route spreads this with the poll delay:

```typescript
return success(
  { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
  null,
  HTTP_STATUS.ACCEPTED
);
```

### Pattern 7: Speaker volume route with GET + PUT on same file

`app/api/sonos/speakers/[uid]/volume/route.ts` exports both `GET` (returns current volume) and `PUT` (sets volume). This matches the pattern used for other resource routes that support both read and write.

### Anti-Patterns to Avoid

- **Using `withIdempotency` on transport commands:** D-04 explicitly excludes it — Sonos controls are inherently idempotent
- **Using `parseJsonOrThrow` instead of `parseJson`:** Hue and Sonos routes use `parseJson`; stove routes use `parseJsonOrThrow`. Use `parseJson` for consistency with existing Sonos/Hue pattern
- **Validating HH:MM:SS format in Next.js layer:** D-15 delegates format validation entirely to HA proxy (returns 422 on invalid)
- **Wrapping single-object responses in a named key:** Only array responses get a named key wrapper (per Phase 126 precedent: `{ devices: [...] }`, `{ zones: [...] }`). Single objects use double assertion
- **Coordinator validation in Next.js layer:** D-09 — 422 not_coordinator errors pass through from HA proxy

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth + error wrapping | Custom try/catch in each route | `withAuthAndErrorHandler` | Handles Auth0 session, ApiError mapping, logging |
| Path param extraction | `context.params.groupId` directly | `getPathParam(context, 'groupId')` | Handles async params in Next.js 15 |
| Body parsing | `request.json()` directly | `parseJson(request)` | Handles content-type and parse errors consistently |
| 202 status code | `NextResponse.json(data, { status: 202 })` | `success(data, null, HTTP_STATUS.ACCEPTED)` | Consistent `success: true` wrapper |
| Transport layer | Direct fetch to HA proxy | `haGet/haPost/haPut` from `lib/haClient.ts` | Auth headers, timeout, RFC 9457 error mapping |

**Key insight:** Every pattern needed for Phase 127 already exists and is proven in Phase 126 + Thermorossi + Hue. The implementation is application of existing patterns, not new design work.

---

## Common Pitfalls

### Pitfall 1: Forgetting `await` on `getPathParam`
**What goes wrong:** TypeScript will not catch this — `getPathParam` returns `Promise<string>` which is truthy, so the URL will contain `[object Promise]`.
**Why it happens:** In Next.js 15 App Router, `context.params` is a Promise. `getPathParam` wraps the await, but callers must also await it.
**How to avoid:** Always `const groupId = await getPathParam(context, 'groupId')`.
**Warning signs:** API requests to HA proxy fail with 404 (URL contains literal `[object Promise]`).

### Pitfall 2: Wrong dynamic segment name
**What goes wrong:** Route file at `app/api/sonos/zones/[groupId]/play/route.ts` uses `getPathParam(context, 'group_id')` (snake_case) instead of `getPathParam(context, 'groupId')` (camelCase).
**Why it happens:** The HA API spec uses `group_id` (snake_case); Next.js folder names use whatever you choose; CONTEXT.md D-05 specifies `[groupId]`.
**How to avoid:** Folder name is `[groupId]`, param name is `'groupId'`. The HA proxy URL still uses `/api/v1/sonos/zones/${groupId}/...` (the variable is just a JS variable at that point).
**Warning signs:** `getPathParam` throws or returns empty string.

### Pitfall 3: Zone volume vs. transport coordinator check
**What goes wrong:** Applying same coordinator-routing logic to zone volume as transport commands.
**Why it happens:** Transport controls (play/pause/stop/next/prev) require the coordinator UID and return 422 for member UIDs. Zone volume does NOT have this restriction (per API spec §Volume Controls note).
**How to avoid:** Zone volume accepts any valid `group_id` from `GET /zones`. No special handling needed — just pass through.
**Warning signs:** 422 errors on PUT /zones/[groupId]/volume that wouldn't be expected.

### Pitfall 4: Import path for haPut
**What goes wrong:** Importing `haPut` from `@/lib/haClient` but the current `sonosProxy.ts` only imports `haGet`. Need to add `haPut` and `haPost` to the import.
**Why it happens:** Phase 126 sonosProxy.ts only needed haGet (read-only).
**How to avoid:** Update the import line: `import { haGet, haPost, haPut } from '@/lib/haClient';`

### Pitfall 5: Forgetting `suggested_poll_delay_s` in command responses
**What goes wrong:** Routes return raw `SonosCommandOkResponse` without the poll delay hint, breaking the frontend polling contract set by D-17.
**Why it happens:** The HA proxy response does NOT include `suggested_poll_delay_s` — it must be added by the Next.js layer (same pattern as Thermorossi).
**How to avoid:** Always spread `{ ...data, suggested_poll_delay_s: 1 }` before passing to `success()`.

---

## Code Examples

### sonosProxy.ts additions

```typescript
// Source: lib/stove/thermorossiProxy.ts sendIgnit() pattern + D-02
import { haGet, haPost, haPut } from '@/lib/haClient';
import type { SonosCommandOkResponse, SonosPlaybackResponse, SonosVolumeResponse } from '@/types/sonosProxy';

// READ WRAPPERS (new for Phase 127)
export async function getPlayback(groupId: string): Promise<SonosPlaybackResponse> {
  return haGet<SonosPlaybackResponse>(`/api/v1/sonos/zones/${groupId}/playback`);
}

export async function getSpeakerVolume(uid: string): Promise<SonosVolumeResponse> {
  return haGet<SonosVolumeResponse>(`/api/v1/sonos/speakers/${uid}/volume`);
}

// TRANSPORT COMMAND WRAPPERS (D-02: haPost with empty body)
export async function play(groupId: string): Promise<SonosCommandOkResponse> {
  return haPost<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/play`, {});
}

export async function pause(groupId: string): Promise<SonosCommandOkResponse> {
  return haPost<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/pause`, {});
}

export async function stop(groupId: string): Promise<SonosCommandOkResponse> {
  return haPost<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/stop`, {});
}

export async function next(groupId: string): Promise<SonosCommandOkResponse> {
  return haPost<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/next`, {});
}

export async function previous(groupId: string): Promise<SonosCommandOkResponse> {
  return haPost<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/previous`, {});
}

// VOLUME/MUTE/SEEK COMMAND WRAPPERS (D-03: haPut with typed body)
export async function setSpeakerVolume(uid: string, volume: number): Promise<SonosCommandOkResponse> {
  return haPut<SonosCommandOkResponse>(`/api/v1/sonos/speakers/${uid}/volume`, { volume });
}

export async function setSpeakerMute(uid: string, mute: boolean): Promise<SonosCommandOkResponse> {
  return haPut<SonosCommandOkResponse>(`/api/v1/sonos/speakers/${uid}/mute`, { mute });
}

export async function setZoneVolume(groupId: string, volume: number): Promise<SonosCommandOkResponse> {
  return haPut<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/volume`, { volume });
}

export async function seek(groupId: string, position: string): Promise<SonosCommandOkResponse> {
  return haPut<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/seek`, { position });
}
```

### Complete POST transport route example

```typescript
// Source: pattern from app/api/sonos/devices/[uid]/route.ts + thermorossi command routes
// app/api/sonos/zones/[groupId]/play/route.ts
import { withAuthAndErrorHandler, success, getPathParam, HTTP_STATUS } from '@/lib/core';
import { play } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

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

### Complete PUT volume route example

```typescript
// app/api/sonos/speakers/[uid]/volume/route.ts
import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { getSpeakerVolume, setSpeakerVolume } from '@/lib/sonos/sonosProxy';
import type { SetVolumeRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const uid = await getPathParam(context, 'uid');
  const data = await getSpeakerVolume(uid);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Speakers/Volume/Get');

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const uid = await getPathParam(context, 'uid');
  const body = await parseJson(request) as SetVolumeRequest;
  const data = await setSpeakerVolume(uid, body.volume);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Speakers/Volume/Set');
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (existing) |
| Config file | `jest.config.ts` (existing) |
| Quick run command | `npm test -- --testPathPattern="sonosProxy"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SONOS-07 | `getPlayback(groupId)` calls correct HA URL | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ Wave 0 |
| SONOS-08 | `getSpeakerVolume(uid)` calls correct HA URL | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ Wave 0 |
| SONOS-09 | `play(groupId)` sends haPost to correct URL with `{}` | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ Wave 0 |
| SONOS-10 | `pause(groupId)` sends haPost to correct URL with `{}` | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ Wave 0 |
| SONOS-11 | `stop(groupId)` sends haPost to correct URL with `{}` | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ Wave 0 |
| SONOS-12 | `next(groupId)` sends haPost to correct URL with `{}` | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ Wave 0 |
| SONOS-13 | `previous(groupId)` sends haPost to correct URL with `{}` | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ Wave 0 |
| SONOS-14 | `setSpeakerVolume(uid, volume)` sends haPut with `{ volume }` | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ Wave 0 |
| SONOS-15 | `setSpeakerMute(uid, mute)` sends haPut with `{ mute }` | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ Wave 0 |
| SONOS-16 | `setZoneVolume(groupId, volume)` sends haPut with `{ volume }` | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ Wave 0 |
| SONOS-17 | `seek(groupId, position)` sends haPut with `{ position }` | unit | `npm test -- --testPathPattern="sonosProxy"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="sonosProxy" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `__tests__/lib/sonosProxy.test.ts` — covers all SONOS-07 through SONOS-17 proxy function URLs and request bodies
- [ ] Follow `__tests__/lib/thermorossiProxy.test.ts` structure exactly: mock global fetch, set env vars in beforeEach, test URL + method + body for each function

---

## Route Inventory

Complete list of new files:

| File | HTTP Method | Handler | SONOS Req |
|------|-------------|---------|-----------|
| `app/api/sonos/zones/[groupId]/playback/route.ts` | GET | `getPlayback` | SONOS-07 |
| `app/api/sonos/speakers/[uid]/volume/route.ts` | GET | `getSpeakerVolume` | SONOS-08 |
| `app/api/sonos/zones/[groupId]/play/route.ts` | POST | `play` | SONOS-09 |
| `app/api/sonos/zones/[groupId]/pause/route.ts` | POST | `pause` | SONOS-10 |
| `app/api/sonos/zones/[groupId]/stop/route.ts` | POST | `stop` | SONOS-11 |
| `app/api/sonos/zones/[groupId]/next/route.ts` | POST | `next` | SONOS-12 |
| `app/api/sonos/zones/[groupId]/previous/route.ts` | POST | `previous` | SONOS-13 |
| `app/api/sonos/speakers/[uid]/volume/route.ts` | PUT | `setSpeakerVolume` | SONOS-14 |
| `app/api/sonos/speakers/[uid]/mute/route.ts` | PUT | `setSpeakerMute` | SONOS-15 |
| `app/api/sonos/zones/[groupId]/volume/route.ts` | PUT | `setZoneVolume` | SONOS-16 |
| `app/api/sonos/zones/[groupId]/seek/route.ts` | PUT | `seek` | SONOS-17 |

Note: `speakers/[uid]/volume/route.ts` exports both GET and PUT (same file, two handlers).

---

## Open Questions

1. **suggested_poll_delay_s placement**
   - What we know: D-17 says `suggested_poll_delay_s: 1` goes in all command responses
   - What's unclear: Whether to spread into `data` before the double assertion, or add as a top-level field alongside `data`
   - Recommendation: Spread into data — `{ ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>` — this keeps the response shape flat and consistent with how Thermorossi command routes work

2. **GET on speakers/[uid]/volume/route.ts**
   - What we know: SONOS-08 requires `GET /sonos/speakers/{uid}/volume`. The same file will also handle `PUT`.
   - What's unclear: Whether to co-locate GET and PUT in one file or split into separate files
   - Recommendation: Co-locate in one `route.ts` (matches `app/api/hue/lights/[id]/route.ts` which has both GET and PUT)

---

## Sources

### Primary (HIGH confidence)
- `docs/api/sonos.md` §Monitoring (lines 403-530) — GET playback and volume response shapes
- `docs/api/sonos.md` §Transport Controls (lines 533-749) — POST play/pause/stop/next/previous, 422 coordinator check
- `docs/api/sonos.md` §Volume Controls (lines 752-940) — PUT speaker volume, PUT speaker mute, PUT zone volume, partial failure body
- `docs/api/sonos.md` §Seek (lines 944-999) — PUT seek, position format, non-seekable content 422
- `types/sonosProxy.ts` — All types pre-verified as existing and correct
- `lib/sonos/sonosProxy.ts` — Existing proxy (Phase 126), confirmed haGet-only; will add haPost/haPut
- `lib/haClient.ts` — Verified haPost and haPut signatures
- `lib/core/apiResponse.ts` — Verified success() signature and HTTP_STATUS.ACCEPTED
- `app/api/sonos/devices/[uid]/route.ts` — Reference dynamic GET route
- `app/api/sonos/zones/route.ts` — Reference list GET route
- `lib/stove/thermorossiProxy.ts` — Reference command wrapper functions (sendIgnit, setPower patterns)
- `app/api/stove/setPower/route.ts` — Reference POST command route with parseJsonOrThrow
- `app/api/hue/lights/[id]/route.ts` — Reference PUT command route with parseJson

### Secondary (MEDIUM confidence)
- `.planning/phases/126-sonos-infrastructure/126-02-PLAN.md` — Confirmed established patterns and decisions from Phase 126

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are existing project infrastructure, verified by reading source files
- Architecture: HIGH — patterns verified directly in existing route implementations and proxy modules
- Pitfalls: HIGH — verified by reading existing code and understanding Next.js 15 async params behavior
- API shapes: HIGH — all types pre-defined in types/sonosProxy.ts, API spec read directly from docs/api/sonos.md

**Research date:** 2026-03-24
**Valid until:** 2026-06-01 (stable — all sources are internal project files)
