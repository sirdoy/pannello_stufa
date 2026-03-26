# Phase 128: Sonos Extended Controls - Research

**Researched:** 2026-03-24
**Domain:** Sonos proxy API extension — EQ, play modes, queue, home theater, grouping, sleep timer, history
**Confidence:** HIGH

## Summary

Phase 128 extends the existing Sonos infrastructure (Phases 126-127) with 13 additional proxy wrappers and 13 Next.js API route files. All TypeScript types are pre-defined in `types/sonosProxy.ts` and do not need to be created. The implementation is purely mechanical: add ~12 wrappers to `lib/sonos/sonosProxy.ts` and create one route file per endpoint following the established Phase 127 patterns exactly.

The two transport patterns from Phase 127 apply uniformly: GET read wrappers use `haGet<T>(url)` returning `success(data)`, and mutation wrappers use `haPut` or `haPost` returning `success({ ...data, suggested_poll_delay_s: 1 }, null, HTTP_STATUS.ACCEPTED)`. Two endpoints require query parameter forwarding via `URLSearchParams`: the queue route (limit/offset) and the history route (type, speaker_uid, group_id, start, end, limit, offset).

The only non-trivial aspect is the history endpoint, which takes a required `type` parameter (`"volume"` or `"playback"`) and handles auto-granularity server-side. The Next.js route simply forwards query params — no client-side granularity logic is needed. The test file `lib/sonos/__tests__/sonosProxy.test.ts` must be extended with cases for all new wrappers.

**Primary recommendation:** Add all 12 proxy wrappers to `sonosProxy.ts` in one plan, then create route files in batches grouped by resource type (speaker routes vs. zone routes vs. history).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Add all new wrappers to existing `lib/sonos/sonosProxy.ts` — same file as Phases 126-127, matching function module pattern
- **D-02:** Read wrappers (getEq, getPlayMode, getQueue, getHomeTheater, getSleepTimer, getHistory) use `haGet`
- **D-03:** Mutation wrappers use `haPut` for EQ, play-mode, home-theater, sleep-timer (partial update/set semantics) and `haPost` for source, join, unjoin (action semantics)
- **D-04:** Queue and history wrappers accept query params and forward them via URL query string construction (URLSearchParams)
- **D-05:** All mutation routes return HTTP 202 Accepted with `suggested_poll_delay_s: 1` — consistent with Phase 127 transport/volume commands, even though upstream API returns 200
- **D-06:** Response body includes `{ ...data, suggested_poll_delay_s: 1 }` cast through `as unknown as Record<string, unknown>` (same pattern as Phase 127 routes)
- **D-07:** One route file per endpoint, matching Phase 126-127 directory structure under `app/api/sonos/`
- **D-08:** Speaker routes under `speakers/[uid]/` — eq, home-theater, source, join, unjoin
- **D-09:** Zone routes under `zones/[groupId]/` — play-mode, queue, sleep-timer
- **D-10:** History route at `app/api/sonos/history/route.ts` (no dynamic segment, uses query params)
- **D-11:** History route reads `type`, `speaker_uid`, `group_id`, `start`, `end`, `limit`, `offset` from `request.nextUrl.searchParams` and forwards non-null values via URLSearchParams to haGet
- **D-12:** Queue route reads `limit`, `offset` from searchParams, forwards to haGet
- **D-13:** POST /speakers/{uid}/unjoin uses `haPost` with empty body `{}` — same pattern as transport commands (play/pause/stop/next/previous)
- **D-14:** PUT routes for EQ and home-theater use `parseJson` to read the request body, pass directly to `haPut` — the HA proxy handles partial update semantics

### Claude's Discretion

- Exact proxy wrapper function signatures (parameter naming)
- Test mock data values
- JSDoc comment wording
- Import grouping within route files

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SONOS-18 | GET /sonos/speakers/{uid}/eq — EQ settings (bass, treble, loudness) | haGet wrapper + GET route in `speakers/[uid]/eq/route.ts` |
| SONOS-19 | PUT /sonos/speakers/{uid}/eq — set EQ settings (partial update) | haPut wrapper + PUT handler in same file, body `SetEqRequest` |
| SONOS-20 | GET /sonos/zones/{group_id}/play-mode — play mode zona (shuffle, repeat, crossfade) | haGet wrapper + GET route in `zones/[groupId]/play-mode/route.ts` |
| SONOS-21 | PUT /sonos/zones/{group_id}/play-mode — set play mode zona | haPut wrapper + PUT handler in same file, body `SetPlayModeRequest` |
| SONOS-22 | GET /sonos/zones/{group_id}/queue — coda playback paginata | haGet wrapper with URLSearchParams(limit, offset) + GET route in `zones/[groupId]/queue/route.ts` |
| SONOS-23 | GET /sonos/speakers/{uid}/home-theater — settings soundbar home theater | haGet wrapper + GET route in `speakers/[uid]/home-theater/route.ts` |
| SONOS-24 | PUT /sonos/speakers/{uid}/home-theater — set soundbar home theater (partial update) | haPut wrapper + PUT handler in same file, body `SetHomeTheaterRequest` |
| SONOS-25 | POST /sonos/speakers/{uid}/source — switch audio source (tv o line_in) | haPost wrapper + POST route in `speakers/[uid]/source/route.ts`, body `SwitchSourceRequest` |
| SONOS-26 | POST /sonos/speakers/{uid}/join — join speaker a gruppo | haPost wrapper + POST route in `speakers/[uid]/join/route.ts`, body `JoinRequest` |
| SONOS-27 | POST /sonos/speakers/{uid}/unjoin — rimuovi speaker da gruppo | haPost wrapper with empty body + POST route in `speakers/[uid]/unjoin/route.ts` |
| SONOS-28 | GET /sonos/zones/{group_id}/sleep-timer — sleep timer rimanente | haGet wrapper + GET route in `zones/[groupId]/sleep-timer/route.ts` |
| SONOS-29 | PUT /sonos/zones/{group_id}/sleep-timer — set/cancel sleep timer | haPut wrapper + PUT handler in same file, body `SetSleepTimerRequest` |
| SONOS-30 | GET /sonos/history — volume/playback history con auto-granularity | haGet wrapper with URLSearchParams forwarding all query params + GET route at `history/route.ts` |
</phase_requirements>

---

## Standard Stack

### Core (already installed — no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.5 | Route handlers (`app/api/`) | Project standard |
| `lib/haClient` | internal | haGet/haPost/haPut transport | Project shared transport |
| `lib/core` | internal | withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS | Project route utilities |
| `types/sonosProxy` | internal | All 13 Phase 128 types pre-defined | No new types needed |

### No New Dependencies

All libraries required are already in the project. No `npm install` needed.

## Architecture Patterns

### Route File Organization (from Phase 126-127, verified)

```
app/api/sonos/
├── speakers/[uid]/
│   ├── eq/route.ts          (GET + PUT) — SONOS-18, SONOS-19
│   ├── home-theater/route.ts (GET + PUT) — SONOS-23, SONOS-24
│   ├── source/route.ts      (POST)       — SONOS-25
│   ├── join/route.ts        (POST)       — SONOS-26
│   └── unjoin/route.ts      (POST)       — SONOS-27
├── zones/[groupId]/
│   ├── play-mode/route.ts   (GET + PUT)  — SONOS-20, SONOS-21
│   ├── queue/route.ts       (GET)        — SONOS-22
│   └── sleep-timer/route.ts (GET + PUT)  — SONOS-28, SONOS-29
└── history/route.ts         (GET)        — SONOS-30
```

Note: EQ and home-theater, play-mode, and sleep-timer each combine GET+PUT in a single route file (same pattern as Phase 127 `volume/route.ts`). Source, join, and unjoin are POST-only, one handler each.

### Pattern 1: GET Read Route (no query params)

```typescript
// Source: app/api/sonos/zones/[groupId]/playback/route.ts (Phase 127)
import { withAuthAndErrorHandler, success, getPathParam } from '@/lib/core';
import { getEq } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const uid = await getPathParam(context, 'uid');
  const data = await getEq(uid);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Speakers/Eq/Get');
```

### Pattern 2: PUT Mutation Route (202 Accepted)

```typescript
// Source: app/api/sonos/speakers/[uid]/volume/route.ts (Phase 127)
export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const uid = await getPathParam(context, 'uid');
  const body = await parseJson(request) as SetEqRequest;
  const data = await setEq(uid, body);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Speakers/Eq/Set');
```

### Pattern 3: POST Action Route (202 Accepted, no body or typed body)

```typescript
// Source: app/api/sonos/zones/[groupId]/play/route.ts (Phase 127) — for unjoin (no body)
export const POST = withAuthAndErrorHandler(async (_request, context) => {
  const uid = await getPathParam(context, 'uid');
  const data = await unjoin(uid);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Speakers/Unjoin');

// For join/source (with body):
export const POST = withAuthAndErrorHandler(async (request, context) => {
  const uid = await getPathParam(context, 'uid');
  const body = await parseJson(request) as JoinRequest;
  const data = await join(uid, body.target_uid);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Speakers/Join');
```

### Pattern 4: GET Route with URLSearchParams Forwarding

```typescript
// For queue: limit + offset
export const GET = withAuthAndErrorHandler(async (request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const { searchParams } = request.nextUrl;
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  const data = await getQueue(groupId, limit ?? undefined, offset ?? undefined);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Zones/Queue');

// Proxy wrapper with URLSearchParams:
export async function getQueue(
  groupId: string,
  limit?: string,
  offset?: string
): Promise<SonosQueueResponse> {
  const params = new URLSearchParams();
  if (limit != null) params.set('limit', limit);
  if (offset != null) params.set('offset', offset);
  const qs = params.toString();
  return haGet<SonosQueueResponse>(
    `/api/v1/sonos/zones/${groupId}/queue${qs ? `?${qs}` : ''}`
  );
}
```

### Pattern 5: History Route (7 query params, no dynamic segment)

```typescript
// app/api/sonos/history/route.ts
export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = request.nextUrl;
  const data = await getHistory({
    type: searchParams.get('type') ?? undefined,
    speaker_uid: searchParams.get('speaker_uid') ?? undefined,
    group_id: searchParams.get('group_id') ?? undefined,
    start: searchParams.get('start') ?? undefined,
    end: searchParams.get('end') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    offset: searchParams.get('offset') ?? undefined,
  });
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/History');
```

### Proxy Wrapper Section Structure for sonosProxy.ts

Add a new section comment after the existing Phase 127 sections:

```typescript
// =============================================================================
// EXTENDED CONTROL READ WRAPPERS (Phase 128 — haGet)
// =============================================================================

// =============================================================================
// EXTENDED CONTROL MUTATION WRAPPERS (Phase 128 — haPut / haPost)
// =============================================================================
```

### Anti-Patterns to Avoid

- **Implementing granularity logic in Next.js route:** The HA proxy computes granularity server-side. The route must forward query params as-is.
- **Using `haDelete` for unjoin:** Unjoin is `haPost` with empty body `{}`, not DELETE (per D-13 and API spec).
- **Spreading body in mutation wrappers:** PUT EQ and home-theater pass the whole body object directly to `haPut` (partial update semantics, HA proxy handles field filtering). Do not decompose fields.
- **Missing `export const dynamic = 'force-dynamic'`:** Every route file must export this constant.
- **Omitting `as unknown as Record<string, unknown>` cast:** Required for `success()` compatibility per Phase 127 pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Granularity computation | Custom time-window → granularity logic | Forward `start`/`end` params to HA proxy | HA proxy handles auto-granularity server-side |
| Partial update field filtering | Client-side EQ/home-theater field pruning | Pass body directly to `haPut` | HA proxy does partial update semantics |
| Auth/error handling | Per-route auth checks | `withAuthAndErrorHandler` wrapper | Established project pattern |

## Common Pitfalls

### Pitfall 1: History `type` param is required but not validated client-side
**What goes wrong:** Calling GET /api/sonos/history without `type` param — upstream returns 422.
**Why it happens:** `type` has no default value in the API spec.
**How to avoid:** Route forwards params as-is; upstream 422 is mapped to ApiError via `withAuthAndErrorHandler`. No client-side validation needed in the route — just forward.
**Warning signs:** 422 response from history endpoint.

### Pitfall 2: Home theater endpoints return 404 for non-soundbar speakers
**What goes wrong:** Calling /home-theater or /source on a regular speaker returns 404.
**Why it happens:** These routes only work for `role: "soundbar"` devices.
**How to avoid:** No client-side gating needed in the route — upstream 404 is handled by error mapping. Document in JSDoc that these are soundbar-only.
**Warning signs:** 404 Not Found with body `{"detail": "Not a soundbar speaker"}`.

### Pitfall 3: URLSearchParams appended even when no params provided
**What goes wrong:** Appending `?` with empty string to URL — some proxies mishandle this.
**How to avoid:** Only append `?${qs}` when `qs` is non-empty (ternary guard as shown in Pattern 4).
**Warning signs:** Test asserting exact URL `haGet('/api/v1/sonos/zones/{id}/queue')` fails because `?` is appended.

### Pitfall 4: Test file not updated for new proxy wrappers
**What goes wrong:** New wrappers added to `sonosProxy.ts` without corresponding test cases in `sonosProxy.test.ts`.
**Why it happens:** Test file currently only covers Phase 126 read wrappers (getHealth, getDevices, getDevice, getZones). Phase 127 wrappers and Phase 128 wrappers are not yet tested.
**How to avoid:** Add `describe` blocks for each new wrapper in `lib/sonos/__tests__/sonosProxy.test.ts`.
**Warning signs:** Coverage drops, CI flags untested exports.

### Pitfall 5: `haPost` vs `haPut` confusion for mutation verbs
**What goes wrong:** Using wrong transport method — source/join/unjoin must be POST (action semantics), not PUT.
**Why it happens:** EQ/play-mode/home-theater/sleep-timer are PUT (set/partial update), source/join/unjoin are POST (imperative actions).
**How to avoid:** Follow D-03 exactly: haPut for set operations, haPost for action operations.

## Code Examples

### Complete sonosProxy.ts wrapper examples for Phase 128

```typescript
// Source: docs/api/sonos.md §Extended Controls — verified

// READ WRAPPERS
export async function getEq(uid: string): Promise<SonosEqResponse> {
  return haGet<SonosEqResponse>(`/api/v1/sonos/speakers/${uid}/eq`);
}

export async function getPlayMode(groupId: string): Promise<SonosPlayModeResponse> {
  return haGet<SonosPlayModeResponse>(`/api/v1/sonos/zones/${groupId}/play-mode`);
}

export async function getQueue(
  groupId: string,
  limit?: string,
  offset?: string
): Promise<SonosQueueResponse> {
  const params = new URLSearchParams();
  if (limit != null) params.set('limit', limit);
  if (offset != null) params.set('offset', offset);
  const qs = params.toString();
  return haGet<SonosQueueResponse>(
    `/api/v1/sonos/zones/${groupId}/queue${qs ? `?${qs}` : ''}`
  );
}

export async function getHomeTheater(uid: string): Promise<SonosHomeTheaterResponse> {
  return haGet<SonosHomeTheaterResponse>(`/api/v1/sonos/speakers/${uid}/home-theater`);
}

export async function getSleepTimer(groupId: string): Promise<SonosSleepTimerResponse> {
  return haGet<SonosSleepTimerResponse>(`/api/v1/sonos/zones/${groupId}/sleep-timer`);
}

export async function getHistory(params: {
  type?: string;
  speaker_uid?: string;
  group_id?: string;
  start?: string;
  end?: string;
  limit?: string;
  offset?: string;
}): Promise<SonosHistoryResponse> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null) qs.set(key, value);
  }
  const queryString = qs.toString();
  return haGet<SonosHistoryResponse>(
    `/api/v1/sonos/history${queryString ? `?${queryString}` : ''}`
  );
}

// MUTATION WRAPPERS (haPut — set semantics)
export async function setEq(uid: string, body: SetEqRequest): Promise<SonosCommandOkResponse> {
  return haPut<SonosCommandOkResponse>(`/api/v1/sonos/speakers/${uid}/eq`, body);
}

export async function setPlayMode(groupId: string, body: SetPlayModeRequest): Promise<SonosCommandOkResponse> {
  return haPut<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/play-mode`, body);
}

export async function setHomeTheater(uid: string, body: SetHomeTheaterRequest): Promise<SonosCommandOkResponse> {
  return haPut<SonosCommandOkResponse>(`/api/v1/sonos/speakers/${uid}/home-theater`, body);
}

export async function setSleepTimer(groupId: string, body: SetSleepTimerRequest): Promise<SonosCommandOkResponse> {
  return haPut<SonosCommandOkResponse>(`/api/v1/sonos/zones/${groupId}/sleep-timer`, body);
}

// ACTION WRAPPERS (haPost — imperative semantics)
export async function switchSource(uid: string, source: 'tv' | 'line_in'): Promise<SonosCommandOkResponse> {
  return haPost<SonosCommandOkResponse>(`/api/v1/sonos/speakers/${uid}/source`, { source });
}

export async function join(uid: string, targetUid: string): Promise<SonosCommandOkResponse> {
  return haPost<SonosCommandOkResponse>(`/api/v1/sonos/speakers/${uid}/join`, { target_uid: targetUid });
}

export async function unjoin(uid: string): Promise<SonosCommandOkResponse> {
  return haPost<SonosCommandOkResponse>(`/api/v1/sonos/speakers/${uid}/unjoin`, {});
}
```

### Test pattern for new wrappers (extends existing sonosProxy.test.ts)

```typescript
// Source: lib/sonos/__tests__/sonosProxy.test.ts (Phase 126 pattern)
// Add haPost and haPut to the mock imports:
jest.mock('@/lib/haClient');
import { haGet, haPost, haPut } from '@/lib/haClient';
const mockHaPost = jest.mocked(haPost);
const mockHaPut = jest.mocked(haPut);

describe('getEq', () => {
  beforeEach(() => { jest.resetAllMocks(); });
  it('calls haGet with /api/v1/sonos/speakers/{uid}/eq', async () => {
    const mockEq: SonosEqResponse = { uid: 'RINCON_B8E9378A123401400', bass: 0, treble: 0, loudness: false };
    mockHaGet.mockResolvedValue(mockEq);
    const result = await getEq('RINCON_B8E9378A123401400');
    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/sonos/speakers/RINCON_B8E9378A123401400/eq');
    expect(result).toEqual(mockEq);
  });
});
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (project standard) |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern=sonosProxy` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SONOS-18 | getEq calls haGet with correct URL | unit | `npm test -- --testPathPattern=sonosProxy` | ❌ Wave 0 gap |
| SONOS-19 | setEq calls haPut with correct URL + body | unit | `npm test -- --testPathPattern=sonosProxy` | ❌ Wave 0 gap |
| SONOS-20 | getPlayMode calls haGet with correct URL | unit | `npm test -- --testPathPattern=sonosProxy` | ❌ Wave 0 gap |
| SONOS-21 | setPlayMode calls haPut with correct URL + body | unit | `npm test -- --testPathPattern=sonosProxy` | ❌ Wave 0 gap |
| SONOS-22 | getQueue builds URLSearchParams correctly | unit | `npm test -- --testPathPattern=sonosProxy` | ❌ Wave 0 gap |
| SONOS-23 | getHomeTheater calls haGet with correct URL | unit | `npm test -- --testPathPattern=sonosProxy` | ❌ Wave 0 gap |
| SONOS-24 | setHomeTheater calls haPut with correct URL + body | unit | `npm test -- --testPathPattern=sonosProxy` | ❌ Wave 0 gap |
| SONOS-25 | switchSource calls haPost with correct URL + body | unit | `npm test -- --testPathPattern=sonosProxy` | ❌ Wave 0 gap |
| SONOS-26 | join calls haPost with correct URL + { target_uid } body | unit | `npm test -- --testPathPattern=sonosProxy` | ❌ Wave 0 gap |
| SONOS-27 | unjoin calls haPost with correct URL + empty body | unit | `npm test -- --testPathPattern=sonosProxy` | ❌ Wave 0 gap |
| SONOS-28 | getSleepTimer calls haGet with correct URL | unit | `npm test -- --testPathPattern=sonosProxy` | ❌ Wave 0 gap |
| SONOS-29 | setSleepTimer calls haPut with correct URL + body | unit | `npm test -- --testPathPattern=sonosProxy` | ❌ Wave 0 gap |
| SONOS-30 | getHistory builds URLSearchParams for all 7 params | unit | `npm test -- --testPathPattern=sonosProxy` | ❌ Wave 0 gap |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern=sonosProxy`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
All 13 new wrapper test cases must be added to the existing `lib/sonos/__tests__/sonosProxy.test.ts`. This is an extension of an existing file — no new test file creation needed.

- [ ] Add mock imports for `haPost` and `haPut` to `sonosProxy.test.ts`
- [ ] Add 13 `describe` blocks for new wrappers (SONOS-18 through SONOS-30)
- [ ] URLSearchParams coverage: at least one test with params provided and one with no params for `getQueue` and `getHistory`

## Open Questions

None — all decisions are locked and API spec is fully documented in `docs/api/sonos.md`.

## Sources

### Primary (HIGH confidence)
- `docs/api/sonos.md` lines 1020-1819 — Full Extended Controls and History endpoint specs with request/response shapes
- `types/sonosProxy.ts` — All Phase 128 types verified as pre-defined
- `lib/sonos/sonosProxy.ts` — Existing 16-wrapper function module (Phase 126-127 patterns)
- `app/api/sonos/zones/[groupId]/play/route.ts` — POST command route pattern (202 Accepted)
- `app/api/sonos/speakers/[uid]/volume/route.ts` — GET+PUT combined route pattern

### Secondary (MEDIUM confidence)
None needed — all findings from authoritative internal sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and verified in use
- Architecture: HIGH — Phase 127 patterns fully established and verified from source files
- Pitfalls: HIGH — derived from API spec (soundbar-only endpoints, required `type` param) and code inspection (URLSearchParams guard, test gaps)

**Research date:** 2026-03-24
**Valid until:** Until `docs/api/sonos.md` is updated (internal doc — stable)
