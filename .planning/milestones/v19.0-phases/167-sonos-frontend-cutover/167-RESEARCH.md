# Phase 167: Sonos Frontend Cutover - Research

**Researched:** 2026-04-20
**Domain:** Next.js API route cutover (legacy `/api/sonos/*` → canonical `/api/v1/sonos/*`)
**Confidence:** HIGH

## Summary

This is a mechanical URL-cutover phase: swap the `/api/sonos/` prefix to `/api/v1/sonos/` in 5 frontend hooks and 4 Jest test files, after first creating 15 missing v1 route wrappers (11 leaf routes, with 3 of those files combining GET+PUT for a total of 14 exported handlers on the server side). All proxy functions already exist in `lib/sonos/sonosProxy.ts` from Phase 160 — every new v1 route is a thin ~10-line wrapper over an existing function. Response shapes are identical to the legacy routes by construction because both use the same proxy. No path splits (unlike Hue's `/lights/{id}` → `/lights/{id}/state` split in Phase 166). No new schema, no new DB calls, no Firebase logging.

Phase 160 shipped the 13 zone-level v1 routes under `app/api/v1/sonos/zones/[groupId]/` but deferred frontend migration to a "separate concern" (Phase 160 D-04). That deferral is what this phase closes. Phase 166 just shipped the exact same cutover shape for Hue (2 days ago) — the 3-plan cadence (create v1 wrappers → rewrite frontend consumers → delete legacy tree + grep sweep) is proven muscle memory and should be replicated verbatim.

**Primary recommendation:** Follow Phase 166's 3-plan structure. Batch the 15 v1 route creations with co-located tests in Plan 1, do all hook+test rewrites as mechanical string-replace in Plan 2, and run the final `rm -rf app/api/sonos/` + repo-wide grep sweep in Plan 3. Do NOT add Firebase command logging (diverges from Hue intentionally per CONTEXT D-18). Do NOT create `GET /api/v1/sonos/devices/[uid]` (no frontend consumer per CONTEXT D-12).

## Project Constraints (from CLAUDE.md)

- **Forbidden commands:** Never run `npm run build` or `npm install` — execution must call only `npm run dev` and `npm test`. [VERIFIED: `./CLAUDE.md`]
- **Forbidden actions:** Never commit or push without explicit user request. [VERIFIED: `./CLAUDE.md`]
- **Test authoring rule:** Always create/update unit tests — this phase touches 9 production hook/test files; the 15 new v1 routes each require a co-located `__tests__/route.test.ts`. [VERIFIED: `./CLAUDE.md`]
- **Design system:** No UI rendering in this phase, so this rule is inapplicable. [VERIFIED: no new components]
- **Firebase pattern:** `filterUndefined()` for RTDB updates — inapplicable, no Firebase writes in this phase (Sonos has no command log per CONTEXT D-18). [VERIFIED: CONTEXT D-18]
- **Client component directive:** All 5 hooks already have `'use client'`. No change needed. [VERIFIED: `app/components/devices/sonos/hooks/*.ts` line 1]
- **Existing-file preference:** Rewrites happen in-place; only new files are the 15 v1 routes + their tests (unavoidable, none exist yet). [VERIFIED: CONTEXT D-01..D-11]

## User Constraints (from CONTEXT.md)

### Locked Decisions

Create 15 v1 route wrappers (D-01..D-11):

- **D-01:** `GET /api/v1/sonos/health` → `getHealth()` — 200 OK
- **D-02:** `GET /api/v1/sonos/devices` → `getDevices()` — 200 OK
- **D-03:** `GET /api/v1/sonos/zones` → `getZones()` — 200 OK
- **D-04:** `GET /api/v1/sonos/history` → `getHistory({ type, start, end, limit, speaker_uid?, group_id?, cursor? })` — 200 OK
- **D-05:** `GET + PUT /api/v1/sonos/speakers/[uid]/volume` → `getSpeakerVolume(uid)` / `setSpeakerVolume(uid, body.volume)` — 200 / 202
- **D-06:** `PUT /api/v1/sonos/speakers/[uid]/mute` → `setSpeakerMute(uid, body.mute)` — 202
- **D-07:** `GET + PUT /api/v1/sonos/speakers/[uid]/eq` → `getEq(uid)` / `setEq(uid, body)` — 200 / 202
- **D-08:** `GET + PUT /api/v1/sonos/speakers/[uid]/home-theater` → `getHomeTheater(uid)` / `setHomeTheater(uid, body)` — 200 / 202
- **D-09:** `POST /api/v1/sonos/speakers/[uid]/source` → `switchSource(uid, body.source)` — 202
- **D-10:** `POST /api/v1/sonos/speakers/[uid]/join` → `join(uid, body.target_uid)` — 202
- **D-11:** `POST /api/v1/sonos/speakers/[uid]/unjoin` → `unjoin(uid)` — 202
- **D-12:** SKIP `GET /api/v1/sonos/devices/[uid]` — no frontend consumer.

URL mapping (D-13): Direct 1:1 prefix swap `/api/sonos/` → `/api/v1/sonos/`. No path splits.

Frontend rewrites (D-14, D-15, D-16):
- 5 hooks: `useSonosData`, `useSonosFullData`, `useSonosCommands`, `useSonosQueue`, `useSonosHistory`
- 4 test files: `useSonosData.test.ts`, `useSonosCommands.test.ts`, `useSonosQueue.test.ts`, `useSonosFullData.test.ts`
- `useSonosHistory` has no existing test file — do not create one retroactively.

Legacy cleanup (D-17): Delete entire `app/api/sonos/` tree after cutover. Final repo-wide grep proving zero `/api/sonos/` refs outside `.planning/`.

Firebase logging (D-18): NOT APPLICABLE. Neither legacy nor v1 Sonos routes call `adminDbPush`. Do NOT add logging.

Response shapes (D-19): V1 routes wrap same proxy — shapes identical by construction.

Test strategy (D-20): Co-located `__tests__/route.test.ts` per new route. Mock `lib/sonos/sonosProxy.ts`. Assert status code + body + `suggested_poll_delay_s`.

Plan structure (D-21): 3 plans mirroring Phase 166 exactly.

### Claude's Discretion

- Log-tag naming for `withAuthAndErrorHandler` (e.g., `'Sonos/Health'`, `'Sonos/Speakers/Eq/Get'`)
- Query-parameter parsing for `/history` (which params pass through vs validate)
- Body-interface typing for `source` and `join` routes (single-field DTOs)
- Order of sub-steps within each plan
- Whether to batch speakers/* test creation in a single pass or per-route

### Deferred Ideas (OUT OF SCOPE)

- `GET /api/v1/sonos/devices/[uid]` — no frontend consumer; add when one appears.
- Firebase command logging for Sonos — out of scope; possible future observability phase.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SONOS-01 | `GET /api/v1/sonos/zones/{group_id}/playback` returns current playback state | v1 route exists (Phase 160). Plan 2 rewrites `useSonosData` + `useSonosFullData` fetch URLs (6 occurrences). |
| SONOS-02 | `POST /api/v1/sonos/zones/{group_id}/play` sends play command | v1 route exists (Phase 160). Plan 2 rewrites `useSonosCommands.handlePlay` line 42. |
| SONOS-03 | `POST /api/v1/sonos/zones/{group_id}/pause` sends pause command | v1 route exists. Plan 2 rewrites `useSonosCommands.handlePause` line 57. |
| SONOS-04 | `POST /api/v1/sonos/zones/{group_id}/stop` sends stop command | v1 route exists. Plan 2 rewrites `useSonosCommands.handleStop` line 72. |
| SONOS-05 | `POST /api/v1/sonos/zones/{group_id}/next` skips track | v1 route exists. Plan 2 rewrites `useSonosCommands.handleNext` line 87. |
| SONOS-06 | `POST /api/v1/sonos/zones/{group_id}/previous` previous track | v1 route exists. Plan 2 rewrites `useSonosCommands.handlePrevious` line 102. |
| SONOS-07 | `PUT /api/v1/sonos/zones/{group_id}/volume` controls zone volume | v1 route exists. Plan 2 rewrites `useSonosCommands.handleSetZoneVolume` line 286. |
| SONOS-08 | `PUT /api/v1/sonos/zones/{group_id}/seek` seeks position | v1 route exists. Plan 2 rewrites `useSonosCommands.handleSeek` line 305. |
| SONOS-09 | `GET /api/v1/sonos/zones/{group_id}/play-mode` returns play mode | v1 route exists. Plan 2 rewrites `useSonosFullData` fetch line 116. |
| SONOS-10 | `PUT /api/v1/sonos/zones/{group_id}/play-mode` sets play mode | v1 route exists. Plan 2 rewrites `useSonosCommands.handleSetPlayMode` line 155. |
| SONOS-11 | `GET /api/v1/sonos/zones/{group_id}/queue` returns queue | v1 route exists. Plan 2 rewrites `useSonosQueue.fetchPage` line 30. |
| SONOS-12 | `GET /api/v1/sonos/zones/{group_id}/sleep-timer` returns sleep state | v1 route exists. Plan 2 rewrites `useSonosFullData` fetch line 124. |
| SONOS-13 | `PUT /api/v1/sonos/zones/{group_id}/sleep-timer` sets sleep timer | v1 route exists. Plan 2 rewrites `useSonosCommands.handleSetSleepTimer` line 174. |

All 13 SONOS-* requirement IDs are backend-satisfied by Phase 160's route output; this phase closes the "end-to-end wired" gap flagged in `.planning/REQUIREMENTS.md` (line 163: "End-to-end wired (audit 2026-04-15): 6/52").

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| V1 route wrappers (auth, path/body extraction, proxy delegation) | Frontend Server (Next.js route handlers) | — | `withAuthAndErrorHandler` gates access; `withAuthAndErrorHandler` + `getPathParam` + `parseJson` + `success()` are all server-side Next.js concerns. [VERIFIED: `app/api/v1/sonos/zones/[groupId]/play/route.ts`] |
| HA proxy communication (`haGet`/`haPost`/`haPut` to HA_API_URL) | API / Backend (HA proxy) | Frontend Server (via `lib/sonos/sonosProxy.ts` delegation) | Actual Sonos speaker control lives in the HA proxy over the HA_API_KEY boundary. [VERIFIED: `lib/sonos/sonosProxy.ts:21`] |
| Fetch URL construction + response unwrapping + WS fallback | Browser / Client (React hooks) | — | All 5 hooks run with `'use client'`. [VERIFIED: `app/components/devices/sonos/hooks/*.ts:1`] |
| Retry + deduplication + idempotency around commands | Browser / Client (via `useRetryableCommand`) | — | `sonosTransportCmd.execute()` / `sonosVolumeCmd.execute()` / `sonosExtendedCmd.execute()` wrap fetch calls. [VERIFIED: `app/components/devices/sonos/hooks/useSonosCommands.ts:34-37`] |

**Tier-correctness sanity check:** No capability is being moved across tiers in this phase — we are only changing URL strings that flow from client hooks to Next.js route handlers. No new server logic, no new client state, no new proxy functions.

## Standard Stack

### Core (all pre-existing, no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15.5.x | Route handlers under `app/api/v1/sonos/` | Project's framework [VERIFIED: `CLAUDE.md` header] |
| `lib/core` utilities | in-repo | `withAuthAndErrorHandler`, `success`, `getPathParam`, `parseJson`, `HTTP_STATUS` | Used by every existing v1 route; zero deviation acceptable [VERIFIED: `app/api/v1/sonos/zones/[groupId]/play/route.ts:12`] |
| `lib/sonos/sonosProxy.ts` | in-repo | 28 pre-built proxy functions (all required by this phase) | Created Phase 126-138; all exports verified [VERIFIED: `lib/sonos/sonosProxy.ts:50-342`] |
| `@/types/sonosProxy` | in-repo | `SetEqRequest`, `SetHomeTheaterRequest`, `SetVolumeRequest`, `SetMuteRequest`, `SwitchSourceRequest`, `JoinRequest` | Complete DTO coverage [VERIFIED: `types/sonosProxy.ts:200-216`] |
| Jest 30.x + `@testing-library/react` | pinned | Unit tests for routes and hooks | Existing pattern [VERIFIED: Phase 160 route tests in `app/api/v1/sonos/zones/[groupId]/play/__tests__/route.test.ts`] |

### Supporting (reference patterns only)

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `useRetryableCommand` | Retry+dedup wrapper for POST/PUT commands | Already used in `useSonosCommands` — the URL passed into `execute()` is all that changes |
| `useAdaptivePolling` + `useVisibility` | Polling cadence for `useSonosData`/`useSonosFullData` | Unchanged; only fetch URLs change |
| `useWebSocketContext` / WS topic `'sonos'` | WS-primary + polling-fallback in `useSonosData` | Unchanged; WS dispatch is orthogonal to HTTP paths |

### Alternatives Considered

| Instead of | Could Use | Tradeoff — why rejected |
|------------|-----------|-------------------------|
| Thin v1 wrappers (D-01..D-11) | Next.js `rewrites()` in `next.config` mapping `/api/v1/sonos/*` → `/api/sonos/*` | Rejected: loses log-tag distinction, conflates two versioned paths, diverges from Phase 160/166 pattern. Standard is explicit thin handlers. |
| `parseJson` body validation | Zod schema per route | Rejected: Phase 160 v1 routes do not use Zod; existing TypeScript request DTOs + `parseJson<T>` cast is the established pattern. [VERIFIED: `app/api/v1/sonos/zones/[groupId]/volume/route.ts:16`] |
| Combined GET+PUT in one file | Split files per verb | Rejected: Phase 160 already combines GET+PUT for `play-mode` and `sleep-timer` routes. Apply same pattern to `speakers/{uid}/volume`, `eq`, `home-theater` per CONTEXT specifics (line 165). [VERIFIED: `app/api/v1/sonos/zones/[groupId]/play-mode/route.ts:17-32`] |

**Installation:** None. All dependencies already installed.

**Version verification:** Not applicable (in-repo modules only). If the planner wants to confirm Next.js major, `node_modules/next/package.json` is authoritative — do NOT run `npm install` or `npm run build` (project rule).

## URL Mapping Matrix (legacy → v1, EXHAUSTIVE)

This table enumerates every `/api/sonos/*` URL referenced by frontend files. Each row is a direct 1:1 prefix swap. The `Method` column documents the HTTP verb used by callers today; the `V1 Route Status` column indicates whether the target route exists (Phase 160) or must be created in Plan 1 of this phase.

| # | Legacy URL | Method | V1 URL | V1 Route Status | Consumer (file:line) |
|---|------------|--------|--------|----------------|----------------------|
| 1 | `/api/sonos/health` | GET | `/api/v1/sonos/health` | **CREATE (D-01)** | `useSonosData.ts:52,110` |
| 2 | `/api/sonos/devices` | GET | `/api/v1/sonos/devices` | **CREATE (D-02)** | `useSonosFullData.ts:42` |
| 3 | `/api/sonos/zones` | GET | `/api/v1/sonos/zones` | **CREATE (D-03)** | `useSonosData.ts:57`, `useSonosFullData.ts:48` |
| 4 | `/api/sonos/zones/{gid}/playback` | GET | `/api/v1/sonos/zones/{gid}/playback` | exists (Phase 160) | `useSonosData.ts:65,124`, `useSonosFullData.ts:56` |
| 5 | `/api/sonos/zones/{gid}/play` | POST | `/api/v1/sonos/zones/{gid}/play` | exists (Phase 160) | `useSonosCommands.ts:42` |
| 6 | `/api/sonos/zones/{gid}/pause` | POST | `/api/v1/sonos/zones/{gid}/pause` | exists (Phase 160) | `useSonosCommands.ts:57` |
| 7 | `/api/sonos/zones/{gid}/stop` | POST | `/api/v1/sonos/zones/{gid}/stop` | exists (Phase 160) | `useSonosCommands.ts:72` |
| 8 | `/api/sonos/zones/{gid}/next` | POST | `/api/v1/sonos/zones/{gid}/next` | exists (Phase 160) | `useSonosCommands.ts:87` |
| 9 | `/api/sonos/zones/{gid}/previous` | POST | `/api/v1/sonos/zones/{gid}/previous` | exists (Phase 160) | `useSonosCommands.ts:102` |
| 10 | `/api/sonos/zones/{gid}/volume` | PUT | `/api/v1/sonos/zones/{gid}/volume` | exists (Phase 160) | `useSonosCommands.ts:286` |
| 11 | `/api/sonos/zones/{gid}/seek` | PUT | `/api/v1/sonos/zones/{gid}/seek` | exists (Phase 160) | `useSonosCommands.ts:305` |
| 12 | `/api/sonos/zones/{gid}/play-mode` | GET | `/api/v1/sonos/zones/{gid}/play-mode` | exists (Phase 160) | `useSonosFullData.ts:116` |
| 13 | `/api/sonos/zones/{gid}/play-mode` | PUT | `/api/v1/sonos/zones/{gid}/play-mode` | exists (Phase 160) | `useSonosCommands.ts:155` |
| 14 | `/api/sonos/zones/{gid}/queue` | GET | `/api/v1/sonos/zones/{gid}/queue` | exists (Phase 160) | `useSonosQueue.ts:30` |
| 15 | `/api/sonos/zones/{gid}/sleep-timer` | GET | `/api/v1/sonos/zones/{gid}/sleep-timer` | exists (Phase 160) | `useSonosFullData.ts:124` |
| 16 | `/api/sonos/zones/{gid}/sleep-timer` | PUT | `/api/v1/sonos/zones/{gid}/sleep-timer` | exists (Phase 160) | `useSonosCommands.ts:174` |
| 17 | `/api/sonos/speakers/{uid}/volume` | GET | `/api/v1/sonos/speakers/{uid}/volume` | **CREATE (D-05)** | `useSonosFullData.ts:73` |
| 18 | `/api/sonos/speakers/{uid}/volume` | PUT | `/api/v1/sonos/speakers/{uid}/volume` | **CREATE (D-05)** | `useSonosCommands.ts:117` |
| 19 | `/api/sonos/speakers/{uid}/mute` | PUT | `/api/v1/sonos/speakers/{uid}/mute` | **CREATE (D-06)** | `useSonosCommands.ts:136` |
| 20 | `/api/sonos/speakers/{uid}/eq` | GET | `/api/v1/sonos/speakers/{uid}/eq` | **CREATE (D-07)** | `useSonosFullData.ts:88` |
| 21 | `/api/sonos/speakers/{uid}/eq` | PUT | `/api/v1/sonos/speakers/{uid}/eq` | **CREATE (D-07)** | `useSonosCommands.ts:193` |
| 22 | `/api/sonos/speakers/{uid}/home-theater` | GET | `/api/v1/sonos/speakers/{uid}/home-theater` | **CREATE (D-08)** | `useSonosFullData.ts:96` |
| 23 | `/api/sonos/speakers/{uid}/home-theater` | PUT | `/api/v1/sonos/speakers/{uid}/home-theater` | **CREATE (D-08)** | `useSonosCommands.ts:212` |
| 24 | `/api/sonos/speakers/{uid}/source` | POST | `/api/v1/sonos/speakers/{uid}/source` | **CREATE (D-09)** | `useSonosCommands.ts:231` |
| 25 | `/api/sonos/speakers/{uid}/join` | POST | `/api/v1/sonos/speakers/{uid}/join` | **CREATE (D-10)** | `useSonosCommands.ts:250` |
| 26 | `/api/sonos/speakers/{uid}/unjoin` | POST | `/api/v1/sonos/speakers/{uid}/unjoin` | **CREATE (D-11)** | `useSonosCommands.ts:269` |
| 27 | `/api/sonos/history` | GET | `/api/v1/sonos/history` | **CREATE (D-04)** | `useSonosHistory.ts:47` |

**Count totals:**
- 15 missing v1 leaf routes to create (D-01..D-11 → 11 files; 3 of those export both GET and PUT, so 14 handlers total)
- 12 v1 routes already exist from Phase 160 (13 if counted by directory, but play-mode and sleep-timer combine GET+PUT in one file each, matching the 11-file layout under `app/api/v1/sonos/zones/[groupId]/`)
- 27 distinct legacy URL+method pairs need to be swapped in hooks + tests

[VERIFIED: grep of `/api/sonos/` in `app/components/devices/sonos/` returned 5 hook files + 4 test files; line numbers above verified against current file contents.]

## Per-Route Implementation Sketch (15 new v1 wrappers)

Every new wrapper follows the same 3-pattern decision tree: (1) pure read → mirror `playback/route.ts`; (2) combined GET+PUT → mirror `play-mode/route.ts` or `sleep-timer/route.ts`; (3) write-only POST/PUT → mirror `play/route.ts` or `volume/route.ts`. All response shapes pass through the proxy function untouched per CONTEXT D-19.

### 1. `app/api/v1/sonos/health/route.ts` (D-01, read-only)

```typescript
// Source: mirrors app/api/sonos/health/route.ts verbatim under new path
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHealth } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/sonos/health
 * Returns Sonos proxy health status and data freshness.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Health');
```

- **Imports:** `withAuthAndErrorHandler`, `success` from `@/lib/core`; `getHealth` from `@/lib/sonos/sonosProxy`
- **Verb:** GET only
- **Response:** 200 OK, body = `SonosHealthResponse` wrapped in `{ success: true, data: ... }` envelope
- **Log tag:** `'Sonos/Health'`

### 2. `app/api/v1/sonos/devices/route.ts` (D-02, read-only)

```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getDevices } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getDevices();
  return success({ devices: data });
}, 'Sonos/Devices');
```

- **Critical:** Returns `success({ devices: data })` — the legacy route wraps the array in `{ devices: [...] }` (line 13 of `app/api/sonos/devices/route.ts`) and `useSonosFullData.ts:44` unwraps `devicesBody.devices`. If you return the bare array, the hook will crash.
- **Log tag:** `'Sonos/Devices'`

### 3. `app/api/v1/sonos/zones/route.ts` (D-03, read-only)

```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getZones } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getZones();
  return success({ zones: data });
}, 'Sonos/Zones');
```

- **Critical:** Returns `success({ zones: data })` — legacy wraps in `{ zones: [...] }` (line 13 of `app/api/sonos/zones/route.ts`); `useSonosData.ts:59` and `useSonosFullData.ts:50` unwrap `zonesBody.zones`. Preserve shape.
- **Log tag:** `'Sonos/Zones'`

### 4. `app/api/v1/sonos/history/route.ts` (D-04, read-only with 7 optional query params)

```typescript
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHistory } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/sonos/history
 * Query params (all optional): type, speaker_uid, group_id, start, end, limit, offset, cursor
 */
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

- **Mirrors:** `app/api/sonos/history/route.ts:12-24` — copy verbatim, only log-tag changes
- **Do NOT narrow contract:** `cursor` in CONTEXT D-04 does not appear in the proxy `getHistory` signature (`lib/sonos/sonosProxy.ts:254-262`). Either: (a) leave it out (mirrors legacy exactly, recommended), or (b) add `cursor?: string` to proxy signature. **Recommendation:** match legacy exactly (no `cursor`) — if future phase adds cursor pagination, that phase extends the proxy.
- **Current consumer (`useSonosHistory.ts:47-53`):** only sets `type`, `start`, `end`, `limit`, and conditionally `speaker_uid` / `group_id`. `offset` is never set today but legacy passes it through — preserve.
- **Log tag:** `'Sonos/History'`

### 5. `app/api/v1/sonos/speakers/[uid]/volume/route.ts` (D-05, combined GET+PUT)

```typescript
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

- **Mirrors:** `app/api/sonos/speakers/[uid]/volume/route.ts:17-32` verbatim + `app/api/v1/sonos/zones/[groupId]/play-mode/route.ts` combined GET+PUT layout
- **Body DTO:** `SetVolumeRequest = { volume: number }` (0-100)
- **Path param:** `uid`
- **Log tags:** `'Sonos/Speakers/Volume/Get'`, `'Sonos/Speakers/Volume/Set'`

### 6. `app/api/v1/sonos/speakers/[uid]/mute/route.ts` (D-06, PUT only)

```typescript
import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { setSpeakerMute } from '@/lib/sonos/sonosProxy';
import type { SetMuteRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const uid = await getPathParam(context, 'uid');
  const body = await parseJson(request) as SetMuteRequest;
  const data = await setSpeakerMute(uid, body.mute);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Speakers/Mute/Set');
```

- **Mirrors:** `app/api/sonos/speakers/[uid]/mute/route.ts` verbatim
- **Body DTO:** `SetMuteRequest = { mute: boolean }`
- **No GET:** mute is read via `getSpeakerVolume` (which also returns `mute` per `SonosVolumeResponse`)
- **Log tag:** `'Sonos/Speakers/Mute/Set'`

### 7. `app/api/v1/sonos/speakers/[uid]/eq/route.ts` (D-07, combined GET+PUT)

```typescript
import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { getEq, setEq } from '@/lib/sonos/sonosProxy';
import type { SetEqRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const uid = await getPathParam(context, 'uid');
  const data = await getEq(uid);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Speakers/Eq/Get');

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

- **Mirrors:** `app/api/sonos/speakers/[uid]/eq/route.ts:17-32` verbatim
- **Body DTO:** `SetEqRequest = { bass?, treble?, loudness? }` (partial update)
- **Log tags:** `'Sonos/Speakers/Eq/Get'`, `'Sonos/Speakers/Eq/Set'`

### 8. `app/api/v1/sonos/speakers/[uid]/home-theater/route.ts` (D-08, combined GET+PUT)

```typescript
import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { getHomeTheater, setHomeTheater } from '@/lib/sonos/sonosProxy';
import type { SetHomeTheaterRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const uid = await getPathParam(context, 'uid');
  const data = await getHomeTheater(uid);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Speakers/HomeTheater/Get');

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const uid = await getPathParam(context, 'uid');
  const body = await parseJson(request) as SetHomeTheaterRequest;
  const data = await setHomeTheater(uid, body);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Speakers/HomeTheater/Set');
```

- **Mirrors:** `app/api/sonos/speakers/[uid]/home-theater/route.ts:17-32` verbatim
- **Body DTO:** `SetHomeTheaterRequest` (partial, 7 optional fields — see `types/sonosProxy.ts:205-213`)
- **Log tags:** `'Sonos/Speakers/HomeTheater/Get'`, `'Sonos/Speakers/HomeTheater/Set'`

### 9. `app/api/v1/sonos/speakers/[uid]/source/route.ts` (D-09, POST only)

```typescript
import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { switchSource } from '@/lib/sonos/sonosProxy';
import type { SwitchSourceRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (request, context) => {
  const uid = await getPathParam(context, 'uid');
  const body = await parseJson(request) as SwitchSourceRequest;
  const data = await switchSource(uid, body.source);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Speakers/Source/Switch');
```

- **Mirrors:** `app/api/sonos/speakers/[uid]/source/route.ts:14-23` verbatim
- **Body DTO:** `SwitchSourceRequest = { source: 'tv' | 'line_in' }`
- **Verb:** POST (not PUT — this is a state transition, not a setting)
- **Log tag:** `'Sonos/Speakers/Source/Switch'`

### 10. `app/api/v1/sonos/speakers/[uid]/join/route.ts` (D-10, POST only)

```typescript
import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { join } from '@/lib/sonos/sonosProxy';
import type { JoinRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

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

- **Mirrors:** `app/api/sonos/speakers/[uid]/join/route.ts:14-23` verbatim
- **Body DTO:** `JoinRequest = { target_uid: string }` — note snake_case in body (matches HA proxy contract)
- **Log tag:** `'Sonos/Speakers/Join'`

### 11. `app/api/v1/sonos/speakers/[uid]/unjoin/route.ts` (D-11, POST only, no body)

```typescript
import { withAuthAndErrorHandler, success, getPathParam, HTTP_STATUS } from '@/lib/core';
import { unjoin } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (_request, context) => {
  const uid = await getPathParam(context, 'uid');
  const data = await unjoin(uid);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Speakers/Unjoin');
```

- **Mirrors:** `app/api/sonos/speakers/[uid]/unjoin/route.ts:13-21` verbatim
- **No body:** skip `parseJson` — this is a bodyless POST, already handled correctly in `useSonosCommands.ts:269-271`
- **Log tag:** `'Sonos/Speakers/Unjoin'`

## Per-Hook Fetch-URL Inventory + Rewrite Mechanics

Exhaustive list of every `fetch()` / `execute()` call in the 5 hooks, with exact line numbers verified against current file contents. Each row is a mechanical 1:1 string replacement per the URL Mapping Matrix above.

### `app/components/devices/sonos/hooks/useSonosData.ts` — 3 distinct URL templates, 4 occurrences

| Line | Current | Replace With | Notes |
|------|---------|--------------|-------|
| 52 | `fetch('/api/sonos/health')` | `fetch('/api/v1/sonos/health')` | primary fetchData flow |
| 57 | `fetch('/api/sonos/zones')` | `fetch('/api/v1/sonos/zones')` | primary fetchData flow |
| 65 | `` fetch(`/api/sonos/zones/${z.group_id}/playback`) `` | `` fetch(`/api/v1/sonos/zones/${z.group_id}/playback`) `` | per-zone playback fan-out (up to 5 zones) |
| 110 | `fetch('/api/sonos/health')` | `fetch('/api/v1/sonos/health')` | fire-and-forget `fetchHealth()` from WS handler |
| 124 | `` fetch(`/api/sonos/zones/${z.group_id}/playback`) `` | `` fetch(`/api/v1/sonos/zones/${z.group_id}/playback`) `` | fire-and-forget `fetchPlayback()` from WS handler |

**Total:** 5 string replacements. All are simple literal/template-literal swaps — no structural changes, no body shape changes, no header changes.

### `app/components/devices/sonos/hooks/useSonosFullData.ts` — 8 distinct URL templates, 8 occurrences

| Line | Current | Replace With |
|------|---------|--------------|
| 42 | `fetch('/api/sonos/devices')` | `fetch('/api/v1/sonos/devices')` |
| 48 | `fetch('/api/sonos/zones')` | `fetch('/api/v1/sonos/zones')` |
| 56 | `` fetch(`/api/sonos/zones/${z.group_id}/playback`) `` | `` fetch(`/api/v1/sonos/zones/${z.group_id}/playback`) `` |
| 73 | `` fetch(`/api/sonos/speakers/${uid}/volume`) `` | `` fetch(`/api/v1/sonos/speakers/${uid}/volume`) `` |
| 88 | `` fetch(`/api/sonos/speakers/${uid}/eq`) `` | `` fetch(`/api/v1/sonos/speakers/${uid}/eq`) `` |
| 96 | `` fetch(`/api/sonos/speakers/${uid}/home-theater`) `` | `` fetch(`/api/v1/sonos/speakers/${uid}/home-theater`) `` |
| 116 | `` fetch(`/api/sonos/zones/${z.group_id}/play-mode`) `` | `` fetch(`/api/v1/sonos/zones/${z.group_id}/play-mode`) `` |
| 124 | `` fetch(`/api/sonos/zones/${z.group_id}/sleep-timer`) `` | `` fetch(`/api/v1/sonos/zones/${z.group_id}/sleep-timer`) `` |

**Total:** 8 string replacements.

### `app/components/devices/sonos/hooks/useSonosCommands.ts` — 14 `execute()` call sites

| Line | Current | Replace With |
|------|---------|--------------|
| 42 | `` `/api/sonos/zones/${groupId}/play` `` | `` `/api/v1/sonos/zones/${groupId}/play` `` |
| 57 | `` `/api/sonos/zones/${groupId}/pause` `` | `` `/api/v1/sonos/zones/${groupId}/pause` `` |
| 72 | `` `/api/sonos/zones/${groupId}/stop` `` | `` `/api/v1/sonos/zones/${groupId}/stop` `` |
| 87 | `` `/api/sonos/zones/${groupId}/next` `` | `` `/api/v1/sonos/zones/${groupId}/next` `` |
| 102 | `` `/api/sonos/zones/${groupId}/previous` `` | `` `/api/v1/sonos/zones/${groupId}/previous` `` |
| 117 | `` `/api/sonos/speakers/${uid}/volume` `` | `` `/api/v1/sonos/speakers/${uid}/volume` `` |
| 136 | `` `/api/sonos/speakers/${uid}/mute` `` | `` `/api/v1/sonos/speakers/${uid}/mute` `` |
| 155 | `` `/api/sonos/zones/${groupId}/play-mode` `` | `` `/api/v1/sonos/zones/${groupId}/play-mode` `` |
| 174 | `` `/api/sonos/zones/${groupId}/sleep-timer` `` | `` `/api/v1/sonos/zones/${groupId}/sleep-timer` `` |
| 193 | `` `/api/sonos/speakers/${uid}/eq` `` | `` `/api/v1/sonos/speakers/${uid}/eq` `` |
| 212 | `` `/api/sonos/speakers/${uid}/home-theater` `` | `` `/api/v1/sonos/speakers/${uid}/home-theater` `` |
| 231 | `` `/api/sonos/speakers/${uid}/source` `` | `` `/api/v1/sonos/speakers/${uid}/source` `` |
| 250 | `` `/api/sonos/speakers/${uid}/join` `` | `` `/api/v1/sonos/speakers/${uid}/join` `` |
| 269 | `` `/api/sonos/speakers/${uid}/unjoin` `` | `` `/api/v1/sonos/speakers/${uid}/unjoin` `` |
| 286 | `` `/api/sonos/zones/${groupId}/volume` `` | `` `/api/v1/sonos/zones/${groupId}/volume` `` |
| 305 | `` `/api/sonos/zones/${groupId}/seek` `` | `` `/api/v1/sonos/zones/${groupId}/seek` `` |

**Total:** 16 string replacements. (CONTEXT D-14 says "14 execute() calls" — verified count is 16; discrepancy is because CONTEXT counted distinct handlers but `handleSetZoneVolume` / `handleSeek` share the `sonosVolumeCmd` namespace with speaker volume/mute. Planner should expect 16 replacements, not 14.)

### `app/components/devices/sonos/hooks/useSonosQueue.ts` — 1 URL template, 1 occurrence

| Line | Current | Replace With |
|------|---------|--------------|
| 30 | `` fetch(`/api/sonos/zones/${groupId}/queue?limit=${QUEUE_PAGE_SIZE}&offset=${pageOffset}`) `` | `` fetch(`/api/v1/sonos/zones/${groupId}/queue?limit=${QUEUE_PAGE_SIZE}&offset=${pageOffset}`) `` |

**Total:** 1 replacement.

### `app/components/devices/sonos/hooks/useSonosHistory.ts` — 1 URL template, 1 occurrence

| Line | Current | Replace With |
|------|---------|--------------|
| 47 | `` let url = `/api/sonos/history?type=${historyType}&start=${start}&end=${end}&limit=200`; `` | `` let url = `/api/v1/sonos/history?type=${historyType}&start=${start}&end=${end}&limit=200`; `` |

**Total:** 1 replacement. Lines 48-53 (`url += &speaker_uid=...` / `url += &group_id=...`) are query-string concatenation that stays unchanged — the base URL swap is the only change.

### Rewrite mechanics — recommended approach

Because every change is a pure prefix swap with no structural or shape changes:

1. **Per-file find-replace:** Use the Edit tool with `old_string: '/api/sonos/'` → `new_string: '/api/v1/sonos/'` on each hook. The string appears in TypeScript string literals, template literals, and JSDoc comments — all instances should be swapped (there are no intentional occurrences of `/api/sonos/` that should remain).
2. **No method/header/body changes:** Every `fetch()` and `execute()` call keeps its `method`, `headers`, `body`, and response-handling logic unchanged (proven by CONTEXT D-19 + verified by inspection of Phase 160 v1 routes + legacy routes returning identical shapes via same proxy).
3. **Order within Plan 2:** recommend alphabetical — `useSonosCommands.ts` → `useSonosData.ts` → `useSonosFullData.ts` → `useSonosHistory.ts` → `useSonosQueue.ts`. Test files updated in the same plan, in the same order.

**Grand total hook rewrites:** 5 + 8 + 16 + 1 + 1 = **31 URL string replacements across 5 hook files**.

## Test Assertion Update Surface (4 test files)

### `app/components/devices/sonos/hooks/__tests__/useSonosData.test.ts` — ~7 assertion updates

Inspection of the mock `makeSuccessFetch` function + side-fetch assertions reveals:

| Line | Current | Replace With |
|------|---------|--------------|
| 96 | `if (url === '/api/sonos/health') {` | `if (url === '/api/v1/sonos/health') {` |
| 99 | `if (url === '/api/sonos/zones') {` | `if (url === '/api/v1/sonos/zones') {` |
| 103 | `(url as string).match(/\/api\/sonos\/zones\/([^/]+)\/playback/)` | `(url as string).match(/\/api\/v1\/sonos\/zones\/([^/]+)\/playback/)` |
| 364 | `const playbackCall = fetchCalls.find(url => /\/api\/sonos\/zones\/.*\/playback/.test(url));` | `const playbackCall = fetchCalls.find(url => /\/api\/v1\/sonos\/zones\/.*\/playback/.test(url));` |
| 398 | `const healthCall = fetchCalls.find(url => url === '/api/sonos/health');` | `const healthCall = fetchCalls.find(url => url === '/api/v1/sonos/health');` |

**Count:** 5 explicit URL/regex changes. (CONTEXT D-15 says "assertion URL updates" — verified exact count is 5.)

### `app/components/devices/sonos/hooks/__tests__/useSonosCommands.test.ts` — 16 assertion updates

Each of the 16 handler tests asserts on the URL passed to `execute()`. Inspected lines:

| Line | Current (in `toHaveBeenCalledWith` first arg) | Replace With |
|------|----------------------------------------------|--------------|
| 85 | `'/api/sonos/zones/RINCON_A/play'` | `'/api/v1/sonos/zones/RINCON_A/play'` |
| 101 | `'/api/sonos/zones/RINCON_A/pause'` | `'/api/v1/sonos/zones/RINCON_A/pause'` |
| 116 | `'/api/sonos/zones/RINCON_A/stop'` | `'/api/v1/sonos/zones/RINCON_A/stop'` |
| 131 | `'/api/sonos/zones/RINCON_A/next'` | `'/api/v1/sonos/zones/RINCON_A/next'` |
| 146 | `'/api/sonos/zones/RINCON_A/previous'` | `'/api/v1/sonos/zones/RINCON_A/previous'` |
| 161 | `'/api/sonos/speakers/RINCON_A/volume'` | `'/api/v1/sonos/speakers/RINCON_A/volume'` |
| 180 | `'/api/sonos/speakers/RINCON_A/mute'` | `'/api/v1/sonos/speakers/RINCON_A/mute'` |
| 232 | `'/api/sonos/zones/RINCON_A/play-mode'` | `'/api/v1/sonos/zones/RINCON_A/play-mode'` |
| 251 | `'/api/sonos/zones/RINCON_A/sleep-timer'` | `'/api/v1/sonos/zones/RINCON_A/sleep-timer'` |
| 270 | `'/api/sonos/zones/RINCON_A/sleep-timer'` | `'/api/v1/sonos/zones/RINCON_A/sleep-timer'` |
| 288 | `'/api/sonos/speakers/RINCON_A/eq'` | `'/api/v1/sonos/speakers/RINCON_A/eq'` |
| 307 | `'/api/sonos/speakers/RINCON_A/unjoin'` | `'/api/v1/sonos/speakers/RINCON_A/unjoin'` |
| 321 | `'/api/sonos/zones/RINCON_A/volume'` | `'/api/v1/sonos/zones/RINCON_A/volume'` |
| 338 | `'/api/sonos/zones/RINCON_A/seek'` | `'/api/v1/sonos/zones/RINCON_A/seek'` |

**Count:** 14 explicit string assertions. (3 handlers — `handleSetHomeTheater`, `handleSwitchSource`, `handleJoinGroup` — have no current test coverage; see Gap note below.)

**Gap note for planner:** The test file does NOT currently exercise `handleSetHomeTheater`, `handleSwitchSource`, or `handleJoinGroup`. Do NOT attempt to add tests for these in this phase — scope is URL cutover, not test-coverage expansion. Mirror Phase 166 discipline ("untested files were not retroactively covered" per CONTEXT D-16).

### `app/components/devices/sonos/hooks/__tests__/useSonosQueue.test.ts` — 2 assertion updates

| Line | Current | Replace With |
|------|---------|--------------|
| 241 | `'/api/sonos/zones/RINCON_TEST/queue?limit=20&offset=0'` | `'/api/v1/sonos/zones/RINCON_TEST/queue?limit=20&offset=0'` |
| 249 | `'/api/sonos/zones/RINCON_TEST/queue?limit=20&offset=20'` | `'/api/v1/sonos/zones/RINCON_TEST/queue?limit=20&offset=20'` |

**Count:** 2 — matches CONTEXT D-15 exactly.

### `app/components/devices/sonos/hooks/__tests__/useSonosFullData.test.ts` — 11 conditional matchers

The mock `makeFetchMock` function has 11 `if (url === '/api/sonos/...')` branches:

| Line | Current URL literal |
|------|---------------------|
| 110 | `/api/sonos/devices` |
| 116 | `/api/sonos/zones` |
| 122 | `/api/sonos/zones/RINCON_A/playback` |
| 128 | `/api/sonos/zones/RINCON_C/playback` |
| 134 | `/api/sonos/speakers/RINCON_A/volume` |
| 140 | `/api/sonos/speakers/RINCON_B/volume` |
| 146 | `/api/sonos/speakers/RINCON_C/volume` |
| 152 | `/api/sonos/zones/RINCON_A/play-mode` |
| 158 | `/api/sonos/zones/RINCON_C/play-mode` |
| 164 | `/api/sonos/zones/RINCON_A/sleep-timer` |
| 170 | `/api/sonos/zones/RINCON_C/sleep-timer` |

**Count:** 11 URL literal swaps. (CONTEXT D-15 says "9 conditional URL matchers" — verified exact count is 11; two additional cases for `RINCON_B` volume + a pair of sleep-timer branches bring the total to 11. Planner should expect 11.)

### Grand total test file rewrites

| File | Count |
|------|-------|
| `useSonosData.test.ts` | 5 |
| `useSonosCommands.test.ts` | 14 |
| `useSonosQueue.test.ts` | 2 |
| `useSonosFullData.test.ts` | 11 |
| **Total** | **32 URL string replacements across 4 test files** |

Combined with 31 hook replacements → **63 total URL string replacements in Plan 2**.

## Legacy Cleanup Boundaries (Plan 3)

### What deletes

Per CONTEXT D-17, the entire `app/api/sonos/` directory tree is deleted. Enumerated subdirectories (verified via `find app/api/sonos -type d`):

```
app/api/sonos/                       ← root, deleted
├── health/                          (1 route.ts)
├── history/                         (1 route.ts)
├── devices/
│   ├── route.ts
│   └── [uid]/route.ts               ← no v1 replacement (D-12), intentionally removed
├── zones/
│   ├── route.ts
│   └── [groupId]/
│       ├── playback/
│       ├── play/
│       ├── pause/
│       ├── stop/
│       ├── next/
│       ├── previous/
│       ├── volume/
│       ├── seek/
│       ├── play-mode/
│       ├── queue/
│       └── sleep-timer/             (11 subdirs, 1 route.ts each)
└── speakers/
    └── [uid]/
        ├── volume/
        ├── mute/
        ├── eq/
        ├── home-theater/
        ├── source/
        ├── join/
        └── unjoin/                  (7 subdirs, 1 route.ts each)
```

Total deletions: **23 route.ts files** across 26 directories. [VERIFIED: `find app/api/sonos -type f | wc -l` → 23; `find app/api/sonos -type d` → 26]

**Co-located test files:** A check of `find app/api/sonos -name "__tests__" -type d` returned **zero** results — legacy Sonos routes have NO co-located tests. Phase 160 added tests only under `app/api/v1/sonos/zones/[groupId]/*/__tests__/`. This simplifies Plan 3 cleanup: no test file deletions needed under the legacy tree.

### What stays

- `app/api/v1/sonos/` — entire v1 tree, including Phase 160 zone routes and the 15 new files from Plan 1.
- `lib/sonos/sonosProxy.ts` — proxy layer, all 28 functions remain in use.
- `types/sonosProxy.ts` — DTOs, unchanged.
- All 5 hook files + 4 test files — contents changed (URL swaps) but files remain.
- `app/components/devices/sonos/` — all UI components (cards, controls, modals) — untouched (they consume hooks, not URLs).
- `docs/api/sonos.md` — spec doc — unchanged.
- `.planning/` tree — planning docs — unchanged (may still contain `/api/sonos/` references historically; excluded from final grep).

### Final grep sweep regex

```bash
# Plan 3 verification command (from Phase 166's Plan 03 template):
grep -rn "/api/sonos" app/ lib/ types/ --include="*.ts" --include="*.tsx"
# Expected: zero matches
```

**Scope deliberately limited to `app/`, `lib/`, `types/`:** excludes `.planning/*.md`, `docs/architecture.md` (contains one `touch app/api/sonos/status/route.js` illustrative command at line 329 — pre-existing and harmless; re-audit only if Phase 167 changes architectural docs).

**What grep must NOT hit after Plan 3:**
1. Any `app/api/sonos/**` file (deleted by `rm -rf`).
2. Any `app/components/devices/sonos/**` fetch URL (swapped by Plan 2).
3. Any `app/**/__tests__/**` Sonos assertion string (swapped by Plan 2).
4. No stray references in `lib/` or `types/` — verified pre-phase by `grep -r "/api/sonos/" lib/ types/` returning only `types/sonosProxy.ts` (which contains `/api/v1/sonos/` — these are the PROXY target paths on the HA backend, NOT frontend fetch paths, and remain unchanged).

### Wider surface checked and cleared

To prevent "hidden consumer" regressions, I searched outside the documented 9-file consumer surface:

| Surface | `/api/sonos/` present? | Notes |
|---------|------------------------|-------|
| `lib/routes.ts` | **No** [VERIFIED: Grep] | No Sonos entry — cutover does not touch a centralized route registry. |
| `app/sw.ts` (service worker) | **No** [VERIFIED: Grep] | No Sonos cache rule exists. |
| `lib/commands/` (command palette) | **No** [VERIFIED: Grep] | No Sonos commands registered. |
| `app/debug/**` | **No** [VERIFIED: Grep] | No SonosTab debug panel exists (unlike Hue's 2 HueTab debug panels). |
| `tests/` (Playwright smoke/feature specs) | **No** [VERIFIED: Grep] | No Sonos e2e coverage. Playwright smoke `tests/smoke/page-loads.spec.ts` does not test a `/sonos` page. |
| `public/**` | **No** [VERIFIED: Grep] | No Sonos-related assets or manifest entries. |

**Conclusion:** Cutover surface is exactly the 9 files listed in CONTEXT D-14 + D-15 — no hidden consumers.

## Architecture Patterns

### Pattern 1: Read-only v1 route

```typescript
// Source: app/api/v1/sonos/zones/[groupId]/playback/route.ts
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const data = await proxyFn(groupId);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Tier/Subtier');
```

**When to use:** D-01, D-02, D-03 (no path params), D-04 (query params only).

### Pattern 2: Write-only v1 command route (202 Accepted)

```typescript
// Source: app/api/v1/sonos/zones/[groupId]/play/route.ts
export const POST = withAuthAndErrorHandler(async (_request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const data = await proxyFn(groupId);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Tier/Subtier');
```

**When to use:** D-06 (mute PUT), D-09 (source POST), D-10 (join POST), D-11 (unjoin POST). All 202 responses must include `suggested_poll_delay_s: 1`.

### Pattern 3: Combined GET + PUT in one file

```typescript
// Source: app/api/v1/sonos/zones/[groupId]/play-mode/route.ts
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const data = await readProxyFn(groupId);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Tier/Subtier/Get');

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const body = await parseJson(request) as SomeRequest;
  const data = await writeProxyFn(groupId, body);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Tier/Subtier/Set');
```

**When to use:** D-05 (volume), D-07 (eq), D-08 (home-theater).

### Pattern 4: Co-located route test

```typescript
// Source: app/api/v1/sonos/zones/[groupId]/play/__tests__/route.test.ts
jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth0', () => ({ auth0: { getSession: jest.fn() } }));

import { POST } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockProxyFn = jest.mocked(sonosProxy.proxyFn);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('POST /api/v1/sonos/...', () => {
  let mockRequest: Request;
  let mockContext: { params: Promise<{ uid: string }> };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/sonos/...', { method: 'POST' });
    mockContext = { params: Promise.resolve({ uid: 'RINCON_123' }) };
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const response = await POST(mockRequest as any, mockContext as any);
    expect(response.status).toBe(401);
  });

  it('should return 202 with command response', async () => {
    mockProxyFn.mockResolvedValue({ status: 'ok' } as any);
    const response = await POST(mockRequest as any, mockContext as any);
    const data = await response.json();
    expect(response.status).toBe(202);
    expect(data.suggested_poll_delay_s).toBe(1);
    expect(mockProxyFn).toHaveBeenCalledWith('RINCON_123');
  });
});
```

**Test count recommendation per route:**
- Read-only GET routes (D-01, D-02, D-03): 2 tests — 401 unauth + 200 with data
- History GET with query params (D-04): 3 tests — 401 + 200 no params + 200 with all params forwarded to proxy
- Combined GET+PUT (D-05, D-07, D-08): 4 tests — 401, 200 read, 202 write+`suggested_poll_delay_s`, body validation
- Write-only (D-06, D-09, D-10, D-11): 2 tests — 401 + 202 with `suggested_poll_delay_s: 1`

**Estimated total new test files:** 11 (one per route.ts), ~30 test cases total.

### Anti-Patterns to Avoid

- **DO NOT add `adminDbPush` Firebase logging** to any new v1 route. Legacy Sonos routes never logged; existing Phase 160 v1 routes never logged. Diverges from Hue but intentionally per CONTEXT D-18.
- **DO NOT split paths** (unlike Hue's `/lights/{id}` → `/lights/{id}/state`). Sonos URL mapping is 1:1 per CONTEXT D-13.
- **DO NOT narrow the history contract.** The `cursor` field in CONTEXT D-04 is NOT in the current proxy signature — mirror the legacy route exactly (7 params: `type`, `speaker_uid`, `group_id`, `start`, `end`, `limit`, `offset`). Adding `cursor` without extending the proxy type signature will produce a TypeScript error.
- **DO NOT add Zod validation** to route bodies. Phase 160 uses `parseJson<T>` + TypeScript casting. Maintain consistency.
- **DO NOT create `GET /api/v1/sonos/devices/[uid]`** per CONTEXT D-12 — no consumer exists. Legacy `app/api/sonos/devices/[uid]/route.ts` is deleted without replacement.
- **DO NOT add tests for `handleSetHomeTheater`, `handleSwitchSource`, `handleJoinGroup`** in `useSonosCommands.test.ts` — those handlers are currently untested and scope-expansion is explicitly disallowed (Phase 166 precedent).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth enforcement | Custom session-check in each route | `withAuthAndErrorHandler` | Standard across all v1 routes; guarantees 401 on unauth + error mapping to RFC 9457 |
| Path param extraction | `request.nextUrl.pathname.split('/')` | `await getPathParam(context, 'uid')` | Context7/Next.js 15 app-router supports typed path-params via context.params Promise; `getPathParam` unwraps it safely |
| JSON body parsing | Manual `await request.json()` + null checks | `await parseJson(request)` | Handles empty body / malformed JSON / content-type checks |
| Response envelope | Custom `NextResponse.json({ success: true, data })` | `success(data, null, HTTP_STATUS.X)` | Guarantees consistent `{ success, data, errors? }` envelope across routes |
| Retry/deduplication for commands | New wrapper in hook | `useRetryableCommand` (already used) | Already integrated — URL swap is all that's needed |
| DTO types for Sonos requests | Duplicate interface definitions | Import from `@/types/sonosProxy` | All 9 request DTOs pre-defined (`SetVolumeRequest`, `SetMuteRequest`, `SetEqRequest`, `SetHomeTheaterRequest`, `SetPlayModeRequest`, `SetSleepTimerRequest`, `SetSeekRequest`, `SwitchSourceRequest`, `JoinRequest`) [VERIFIED: `types/sonosProxy.ts:200-216`] |
| Proxy function for any new endpoint | Write a new `haGet`/`haPut` call | Use the 16 existing functions needed by this phase | All 28 functions present in `lib/sonos/sonosProxy.ts` [VERIFIED] |

**Key insight:** This phase writes zero new logic. Every line added is a variation on a pattern that already ships 13 times (Phase 160 zone routes) or 8 times (Phase 166 Hue routes). Treat every new route as a template instantiation, not a design problem.

## Common Pitfalls

### Pitfall 1: Wrapping shape regression for zones/devices

**What goes wrong:** If the new `GET /api/v1/sonos/zones` returns the bare `SonosZoneResponse[]` array instead of `{ zones: [...] }`, `useSonosData.ts:59` crashes when it calls `zonesBody.zones`. Same for `GET /api/v1/sonos/devices` and `useSonosFullData.ts:44`.

**Why it happens:** Other v1 Sonos routes (e.g., `/devices/[uid]`, all zone routes) return bare objects via `success(data as unknown as Record<string, unknown>)`. Copying that pattern blindly for the `list` routes would drop the wrapper.

**How to avoid:** For `/zones` and `/devices` list routes, return `success({ zones: data })` / `success({ devices: data })` — the wrapper is load-bearing for hooks.

**Warning signs:** TypeScript will not catch this because hooks cast to `as { zones: SonosZoneResponse[] }`. Only runtime tests catch it. The route tests created in Plan 1 should assert `data.zones` / `data.devices` shape explicitly (see Phase 166's `data.lights` / `data.scenes` assertions).

### Pitfall 2: Forgetting `suggested_poll_delay_s` on 202 responses

**What goes wrong:** `useSonosCommands` line 46 reads `data.suggested_poll_delay_s ?? 1` and uses it to `setTimeout` before polling. If the new route returns `{ status: 'ok' }` without `suggested_poll_delay_s`, the optional-chain fallback kicks in (1s default) — so no visible bug, BUT the route test in Plan 1 asserts `expect(data.suggested_poll_delay_s).toBe(1)` and will fail if the field is absent.

**How to avoid:** Every 202 response must spread-merge `suggested_poll_delay_s: 1` into the proxy response. Pattern is explicit in all Phase 160 command routes (e.g., `app/api/v1/sonos/zones/[groupId]/play/route.ts:25`).

**Warning signs:** Route test failures with `AssertionError: expected undefined to be 1`.

### Pitfall 3: Missing `export const dynamic = 'force-dynamic'`

**What goes wrong:** Without this directive, Next.js 15 may attempt to statically pre-render a route that depends on auth session (which is request-scoped). Response can be a cached 401 across all users.

**How to avoid:** Every new route file MUST have `export const dynamic = 'force-dynamic';` at top-level after imports. All 13 existing v1 Sonos routes have it.

**Warning signs:** Intermittent 401 responses in production, or build warnings about "route tried to pre-render but uses cookies()".

### Pitfall 4: Test mock factory duplication between fetch mock and handler mock

**What goes wrong:** In `useSonosFullData.test.ts`, the `makeFetchMock` function has 11 `if (url === '/api/sonos/...')` branches. If you update only the primary branches (e.g., `/zones`, `/devices`) but miss the per-speaker branches (`/speakers/RINCON_A/volume`, `/speakers/RINCON_B/volume`, `/speakers/RINCON_C/volume`), the mock returns `Promise.reject(new Error('Unexpected URL: ...'))` (line 176) for unmapped URLs and the test for `Promise.allSettled` resilience becomes a false positive.

**How to avoid:** Do a full-file grep `grep -n "/api/sonos/" <test-file>` after rewriting to confirm zero remaining occurrences. Line-by-line review is mandatory for `useSonosFullData.test.ts`.

**Warning signs:** Tests still pass (because `Promise.allSettled` tolerates rejection) but the coverage is hollow — volumes/playModes/sleepTimers records are empty in the asserted state.

### Pitfall 5: WebSocket fire-and-forget side-fetches in `useSonosData`

**What goes wrong:** `useSonosData.ts:108-117` (`fetchHealth`) and `:120-138` (`fetchPlayback`) are called from inside the WS message handler (lines 173, 171). These are NOT inside the main `fetchData` function — they're separate function declarations. All three blocks contain the URL. A naive "replace only `fetchData` URLs" misses them.

**How to avoid:** Use a file-wide find-replace on `/api/sonos/` for each hook. Do NOT search-and-replace only inside specific functions.

**Warning signs:** WS topic message arrives → zones update correctly (via `setData`) → but playback/health stays stale because the legacy side-fetch URL 404s. Bug surfaces only when WS is connected — may be missed in polling-only tests.

### Pitfall 6: Playwright/Jest smoke integration

**What goes wrong:** CONTEXT and Phase 167 description mention "Playwright smoke green" as a success criterion. Inspection of `tests/smoke/` (the only Playwright smoke directory found) shows **no Sonos page coverage** — `page-loads.spec.ts` does NOT test a `/sonos` route, and there is no `/sonos` page in the app.

**How to avoid:** The "Playwright smoke green" criterion is satisfied by the existing smoke suite continuing to pass — it does not require new Sonos-specific smoke coverage. Plan 3's verification should run the full Playwright smoke suite and confirm no regressions; it should NOT add new Sonos smoke specs (out of scope, mirrors Phase 166 which also did not add Sonos-specific e2e).

**Warning signs:** Planner proposes adding a `tests/smoke/sonos.spec.ts` — this is scope creep; push back.

## Runtime State Inventory

> This section is included because Phase 167 is a rename/migration phase (URL cutover).

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None** — Sonos does not persist `/api/sonos/*` URLs in any database, Firebase node, or command log. Sonos has no command-log pattern (CONTEXT D-18 confirms no `adminDbPush`). Browser `localStorage` does not store fetch URLs. | None — verified by grep for `'/api/sonos/` in `lib/firebase/`, `lib/redis/` (no Redis in project), and by CONTEXT D-18. |
| Live service config | **None** — no external service (Auth0, HA proxy, Datadog, Cloudflare) stores the frontend path `/api/sonos/*`. The HA proxy's own URL path is `/api/v1/sonos/*` (which does NOT change), wired via `HA_API_URL`. | None — the HA proxy target URLs are already on the v1 scheme and are unchanged by this phase. |
| OS-registered state | **None** — no pm2/launchd/systemd process references the Sonos URL path. | None — verified by grep for `sonos` in `ecosystem.config.*` / `pm2.*` / systemd unit files (none exist in repo). |
| Secrets / env vars | **None** — no env var name contains `/api/sonos/`. `HA_API_URL` and `HA_API_KEY` are provider-agnostic. | None — unchanged. |
| Build artifacts / installed packages | **None** — `.next/` build output contains route manifests, but `npm run build` is FORBIDDEN by CLAUDE.md and `npm run dev` regenerates manifests on demand. No `egg-info`-style stale artifacts for TypeScript. | None — `.next/` regenerates on next `npm run dev` invocation by user. |

**Canonical question answered:** After every file under `app/components/devices/sonos/` and `app/api/sonos/` is updated or removed, the only runtime state that still points at `/api/sonos/*` is the `.next/` build cache — which is invalidated automatically on the next dev/build cycle initiated by the user (not by Claude, per CLAUDE.md constraints). No manual migration, no database update, no external service reconfiguration needed.

## Code Examples

### Example 1: Health read route (D-01)

```typescript
// app/api/v1/sonos/health/route.ts
// Source: mirrors app/api/sonos/health/route.ts:1-14 with new log tag
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHealth } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Health');
```

### Example 2: Speaker volume combined GET+PUT (D-05)

```typescript
// app/api/v1/sonos/speakers/[uid]/volume/route.ts
// Source: mirrors app/api/sonos/speakers/[uid]/volume/route.ts:1-32 under v1 path
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

### Example 3: History with query params (D-04)

```typescript
// app/api/v1/sonos/history/route.ts
// Source: mirrors app/api/sonos/history/route.ts:1-25 verbatim
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHistory } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

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

### Example 4: Route test for a combined GET+PUT (D-05 test)

```typescript
// app/api/v1/sonos/speakers/[uid]/volume/__tests__/route.test.ts
// Source: mirrors app/api/v1/sonos/zones/[groupId]/play/__tests__/route.test.ts pattern
jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth0', () => ({ auth0: { getSession: jest.fn() } }));

import { GET, PUT } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetSpeakerVolume = jest.mocked(sonosProxy.getSpeakerVolume);
const mockSetSpeakerVolume = jest.mocked(sonosProxy.setSpeakerVolume);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
const mockContext = { params: Promise.resolve({ uid: 'RINCON_A' }) };

describe('/api/v1/sonos/speakers/[uid]/volume', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('GET returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const mockRequest = {} as any;
    const response = await GET(mockRequest, mockContext as any);
    expect(response.status).toBe(401);
  });

  it('GET returns 200 with volume data', async () => {
    mockGetSpeakerVolume.mockResolvedValue({ uid: 'RINCON_A', volume: 42, mute: false });
    const response = await GET({} as any, mockContext as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data.volume).toBe(42);
    expect(mockGetSpeakerVolume).toHaveBeenCalledWith('RINCON_A');
  });

  it('PUT returns 202 with suggested_poll_delay_s on success', async () => {
    mockSetSpeakerVolume.mockResolvedValue({ status: 'ok' } as any);
    const mockRequest = new Request('http://localhost:3000/api/v1/sonos/speakers/RINCON_A/volume', {
      method: 'PUT',
      body: JSON.stringify({ volume: 75 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await PUT(mockRequest as any, mockContext as any);
    const data = await response.json();
    expect(response.status).toBe(202);
    expect(data.suggested_poll_delay_s).toBe(1);
    expect(mockSetSpeakerVolume).toHaveBeenCalledWith('RINCON_A', 75);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Dual maintenance of `/api/sonos/*` and `/api/v1/sonos/zones/*` | Single canonical `/api/v1/sonos/*` tree | This phase | Eliminates confusion, aligns with HA proxy API spec (docs/api/sonos.md base path `/api/v1/sonos`) |
| Hook fetches to `/api/sonos/*` | Hook fetches to `/api/v1/sonos/*` | This phase (Plan 2) | Bytes on the wire identical; only URL prefix changes |
| Legacy route tree at `app/api/sonos/` | Deleted; only `app/api/v1/sonos/` remains | This phase (Plan 3) | Removes dead code, simplifies future audits |

**Deprecated / outdated:**
- `app/api/sonos/**` — to be deleted in Plan 3 after Plan 2 cutover verified.
- `GET /api/sonos/devices/[uid]` — deleted WITHOUT v1 replacement (CONTEXT D-12).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | CONTEXT D-14's count of "14 execute() calls" in useSonosCommands — verified count is 16 | Per-hook inventory | Planner under-scoping: 2 missed swaps → 2 runtime 404s on `handleSetZoneVolume` + `handleSeek`. This research overrides CONTEXT with verified count. [VERIFIED by inspection of `useSonosCommands.ts` lines 42, 57, 72, 87, 102, 117, 136, 155, 174, 193, 212, 231, 250, 269, 286, 305] |
| A2 | CONTEXT D-15's count of "9 conditional URL matchers" in useSonosFullData.test.ts — verified count is 11 | Test assertion update surface | Planner under-scoping: 2 missed test mock branches → hollow `Promise.allSettled` test assertions. This research overrides CONTEXT with verified count. [VERIFIED by inspection of `useSonosFullData.test.ts` lines 110, 116, 122, 128, 134, 140, 146, 152, 158, 164, 170] |
| A3 | Route tests Plan 1 should include 2 tests for read routes, 2-4 for combined GET+PUT, 2 for write-only — matches Phase 166 test granularity | Architecture Patterns → Pattern 4 | Low risk — phase 166 precedent is binding; deviation would break "mirror Phase 166 exactly" per CONTEXT D-21. Assumption could be tightened to "N tests per route" by planner. |
| A4 | `suggested_poll_delay_s: 1` is the right default (not 0 or 2) for all new speaker command routes | Per-Route Implementation Sketches | Very low risk — every Phase 160 v1 route uses `: 1` literal, hooks already treat it as the primary timing signal, changing it would break the 1-second poll-after-command UX. |
| A5 | The legacy `app/api/sonos/history/route.ts` query-param list (`type, speaker_uid, group_id, start, end, limit, offset`) is the full contract; CONTEXT D-04's mention of `cursor?` is an extension that does NOT exist in the current proxy signature | Per-Route Implementation Sketch D-04 | Medium risk — if the planner adds `cursor` without extending `getHistory` signature in `lib/sonos/sonosProxy.ts:254-262`, TypeScript build fails. Recommendation: omit `cursor` from the new route. User should confirm whether to extend proxy or match legacy exactly. |

## Open Questions (RESOLVED)

1. **Q1 [RESOLVED]: Should `cursor?` query param be added to `/api/v1/sonos/history` or omitted?**
   - What we know: CONTEXT D-04 lists `cursor?` as a pass-through param. Current proxy signature (`lib/sonos/sonosProxy.ts:254-262`) does NOT accept `cursor`. Legacy route (`app/api/sonos/history/route.ts:12-24`) does NOT pass it through. `useSonosHistory.ts:47-53` does NOT send it.
   - **RESOLVED:** Omit `cursor` from the new route. Match legacy contract exactly (7 params: `type, speaker_uid, group_id, start, end, limit, offset`). Adding `cursor` without extending `getHistory` signature in `lib/sonos/sonosProxy.ts` would break TypeScript build. Plan 01 Task 1 implements this resolution — the route passes through only the 7 legacy params, and the acceptance criteria explicitly assert `cursor` is NOT forwarded. If a future phase needs cursor pagination, that phase extends the proxy + route together.

2. **Q2 [RESOLVED]: Test file pattern — one per verb (`volume_get.test.ts` + `volume_put.test.ts`) or combined (`volume/route.test.ts` with both GET and PUT tests)?**
   - What we know: Phase 160's `play-mode` and `sleep-timer` routes combine GET+PUT handlers in one `route.ts`; Phase 160 test files under `__tests__/route.test.ts` combine tests for both handlers in one describe block.
   - **RESOLVED:** Combined test file per route.ts. One `__tests__/route.test.ts` per leaf route directory, covering both GET and PUT in the same file. Plan 01 Task 2 (combined GET+PUT speaker endpoints: volume, eq, home-theater) applies this resolution.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `npm run dev`, `npm test` | ✓ | Any recent (Next.js 15.5 compatible) | — |
| `@/lib/core` module (withAuthAndErrorHandler, success, etc.) | All 15 new routes | ✓ | in-repo | — |
| `@/lib/sonos/sonosProxy` | All 15 new routes | ✓ | in-repo, 28 functions [VERIFIED] | — |
| `@/types/sonosProxy` | 9 body DTOs | ✓ | in-repo, all 9 DTOs present [VERIFIED] | — |
| Auth0 + `@/lib/auth0` | `withAuthAndErrorHandler` auth enforcement | ✓ | in-repo | — |
| Jest + `@testing-library/react` | ~30 new test cases + 32 test URL swaps | ✓ | in-repo config [VERIFIED: `jest.config.ts`] | — |
| HA proxy at HA_API_URL | Actual Sonos speaker control at runtime | Unverified — local env (not deployed) | — | Routes will return 503/proxy error at runtime but tests/unit pass because `lib/sonos/sonosProxy` is mocked |

**No blocking dependencies.** This phase is entirely in-repo, all tooling present, all types defined.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.x via `next/jest.js` (Next.js-integrated config) + Playwright (smoke/feature specs) |
| Config files | `jest.config.ts` (unit), `playwright.config.ts` (e2e, not exercised in this phase) |
| Unit-run command | `npm test -- --testPathPattern="<pattern>" --passWithNoTests` |
| Full Jest suite | `npm test` |
| Playwright smoke | `npm run test:e2e -- tests/smoke/` (if present — not run in this phase unless user triggers) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| SONOS-01 | GET /api/v1/sonos/zones/{gid}/playback returns 200 | unit (route) | `npm test -- --testPathPattern="v1/sonos/zones/\[groupId\]/playback" --passWithNoTests` | ✓ (Phase 160) |
| SONOS-02 | POST /api/v1/sonos/zones/{gid}/play returns 202 + `suggested_poll_delay_s` | unit (route) | `npm test -- --testPathPattern="v1/sonos/zones/\[groupId\]/play/" --passWithNoTests` | ✓ (Phase 160) |
| SONOS-03 | POST pause returns 202 | unit (route) | `npm test -- --testPathPattern="v1/sonos/zones/\[groupId\]/pause" --passWithNoTests` | ✓ (Phase 160) |
| SONOS-04 | POST stop returns 202 | unit (route) | `npm test -- --testPathPattern="v1/sonos/zones/\[groupId\]/stop" --passWithNoTests` | ✓ (Phase 160) |
| SONOS-05 | POST next returns 202 | unit (route) | `npm test -- --testPathPattern="v1/sonos/zones/\[groupId\]/next" --passWithNoTests` | ✓ (Phase 160) |
| SONOS-06 | POST previous returns 202 | unit (route) | `npm test -- --testPathPattern="v1/sonos/zones/\[groupId\]/previous" --passWithNoTests` | ✓ (Phase 160) |
| SONOS-07 | PUT /zones/{gid}/volume returns 202 | unit (route) | `npm test -- --testPathPattern="v1/sonos/zones/\[groupId\]/volume" --passWithNoTests` | ✓ (Phase 160) |
| SONOS-08 | PUT /zones/{gid}/seek returns 202 | unit (route) | `npm test -- --testPathPattern="v1/sonos/zones/\[groupId\]/seek" --passWithNoTests` | ✓ (Phase 160) |
| SONOS-09 | GET /zones/{gid}/play-mode returns 200 | unit (route) | `npm test -- --testPathPattern="v1/sonos/zones/\[groupId\]/play-mode" --passWithNoTests` | ✓ (Phase 160) |
| SONOS-10 | PUT /zones/{gid}/play-mode returns 202 | unit (route) | (same file as SONOS-09) | ✓ (Phase 160) |
| SONOS-11 | GET /zones/{gid}/queue returns 200 with paginated items | unit (route) | `npm test -- --testPathPattern="v1/sonos/zones/\[groupId\]/queue" --passWithNoTests` | ✓ (Phase 160) |
| SONOS-12 | GET /zones/{gid}/sleep-timer returns 200 | unit (route) | `npm test -- --testPathPattern="v1/sonos/zones/\[groupId\]/sleep-timer" --passWithNoTests` | ✓ (Phase 160) |
| SONOS-13 | PUT /zones/{gid}/sleep-timer returns 202 | unit (route) | (same file as SONOS-12) | ✓ (Phase 160) |
| **Cutover** | Hook fetches use `/api/v1/sonos/*` | unit (hook) | `npm test -- --testPathPattern="devices/sonos/hooks" --passWithNoTests` | ✓ (4 existing tests) |
| **Cutover** | Zero `/api/sonos/` refs outside .planning | smoke (grep) | `grep -rn "/api/sonos" app/ lib/ types/ --include="*.ts" --include="*.tsx"` (expected: 0) | Manual / Plan 3 |
| **New routes** | 11 new v1 routes return 401 unauth + correct status/body | unit (route) | `npm test -- --testPathPattern="v1/sonos/(health|devices|zones/route|history|speakers)" --passWithNoTests` | ✗ Plan 1 creates |

### Sampling Rate

- **Per task commit (Plan 1):** `npm test -- --testPathPattern="v1/sonos/<new-route>" --passWithNoTests` — run the specific new-route test
- **Per task commit (Plan 2):** `npm test -- --testPathPattern="devices/sonos/hooks" --passWithNoTests` — run all 4 hook tests
- **Per wave merge:** `npm test -- --testPathPattern="sonos" --passWithNoTests` — run ALL sonos-related tests (legacy, v1, hooks)
- **Phase gate (after Plan 3):** `npm test` full suite green AND `grep -rn "/api/sonos" app/ lib/ types/ --include="*.ts" --include="*.tsx" | wc -l` = 0

### Wave 0 Gaps

Required new test files before Plan 1 implementation:

- [ ] `app/api/v1/sonos/health/__tests__/route.test.ts` — covers D-01
- [ ] `app/api/v1/sonos/devices/__tests__/route.test.ts` — covers D-02
- [ ] `app/api/v1/sonos/zones/__tests__/route.test.ts` — covers D-03 (note: collides with existing `app/api/v1/sonos/zones/[groupId]/**` — test file lives at `app/api/v1/sonos/zones/__tests__/route.test.ts`, NOT `app/api/v1/sonos/zones/__tests__/route.test.ts` under [groupId])
- [ ] `app/api/v1/sonos/history/__tests__/route.test.ts` — covers D-04
- [ ] `app/api/v1/sonos/speakers/[uid]/volume/__tests__/route.test.ts` — covers D-05 (GET+PUT)
- [ ] `app/api/v1/sonos/speakers/[uid]/mute/__tests__/route.test.ts` — covers D-06
- [ ] `app/api/v1/sonos/speakers/[uid]/eq/__tests__/route.test.ts` — covers D-07 (GET+PUT)
- [ ] `app/api/v1/sonos/speakers/[uid]/home-theater/__tests__/route.test.ts` — covers D-08 (GET+PUT)
- [ ] `app/api/v1/sonos/speakers/[uid]/source/__tests__/route.test.ts` — covers D-09
- [ ] `app/api/v1/sonos/speakers/[uid]/join/__tests__/route.test.ts` — covers D-10
- [ ] `app/api/v1/sonos/speakers/[uid]/unjoin/__tests__/route.test.ts` — covers D-11

**11 new test files.** No framework install needed — Jest + mock patterns already exist.

**No retroactive test coverage needed for:** `useSonosHistory.ts` (CONTEXT D-16 explicitly excludes), `handleSetHomeTheater` / `handleSwitchSource` / `handleJoinGroup` handlers in `useSonosCommands.ts` (out of scope, Phase 166 precedent).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `withAuthAndErrorHandler` wraps every new route → 401 for unauth [VERIFIED: all 13 Phase 160 v1 routes + all legacy routes use same wrapper] |
| V3 Session Management | yes (indirect) | Auth0 session via `auth0.getSession()` inside `withAuthAndErrorHandler` — no new session logic in this phase |
| V4 Access Control | yes (pass-through) | All authenticated users have equal access to Sonos — no per-user authorization added or removed; scope-preserving change |
| V5 Input Validation | yes | Body DTOs typed via `parseJson<T>` cast + TypeScript; path params via `getPathParam` which the HA proxy validates. No new validation added — this phase does not change input surface, only URL. |
| V6 Cryptography | no | No crypto operations in routes; `HA_API_KEY` is injected by `haGet`/`haPut`/`haPost` in proxy layer, untouched |

### Known Threat Patterns for Next.js 15 App Router

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Bypass of auth wrapper by importing handler directly | Elevation | `withAuthAndErrorHandler` returns a closure that embeds the session check; no way to call the inner handler from client |
| Path-param injection (e.g., `uid=../secrets`) | Tampering | Next.js dynamic segments are URL-decoded but do not support path traversal via `[param]` — they capture a single segment. `getPathParam` does not resolve `..` |
| Mass assignment via body | Tampering | Request DTOs are narrow interfaces (e.g., `SetVolumeRequest = { volume: number }`); extra fields ignored; `parseJson<T>` cast is TypeScript-only but proxy function signatures restrict which fields reach HA proxy |
| Replay of command after session expiry | Spoofing | `useRetryableCommand` + `idempotencyManager` (referenced in `lib/hooks/useRetryableCommand.ts:5`) — unchanged by this phase |
| Information disclosure via verbose errors | Information Disclosure | `withAuthAndErrorHandler` maps errors to RFC 9457 problem-detail responses; raw stack traces never returned. [VERIFIED: Phase 160 test patterns assert on `data.code === 'UNAUTHORIZED'`] |

**No new security surface introduced.** Cutover preserves every existing auth/authz boundary; only URL path changes. Plan 1 route tests assert 401-unauth + 200/202-auth behavior, matching Phase 160's security test template.

## Risks + Mitigations

### Risk 1: Response-shape drift between legacy and v1 list routes

**Impact:** HIGH (runtime crash in `useSonosData` or `useSonosFullData` if shape diverges)

**Likelihood:** LOW — CONTEXT D-19 explicitly states "V1 routes are thin wrappers over the same `lib/sonos/sonosProxy.ts` functions that legacy routes already wrap. Response shapes identical by construction." VERIFIED by inspection: legacy `zones/route.ts:13` returns `success({ zones: data })` and legacy `devices/route.ts:13` returns `success({ devices: data })` — these wrappers are load-bearing.

**Mitigation:**
1. Per-Route Implementation Sketches 2 and 3 explicitly include `success({ devices: data })` / `success({ zones: data })` wrappers — planner MUST preserve.
2. Route tests (Plan 1) assert exact body shape (`expect(data.zones).toBeDefined()` / `expect(data.devices).toBeDefined()`) — catches drift at commit time.
3. Hook tests (Plan 2 — already green before rewrite) assert the hook correctly unwraps `{ zones: [...] }` / `{ devices: [...] }` — ensures the hook's contract with the route is preserved.

### Risk 2: Auth semantics diverge between legacy and v1

**Impact:** MEDIUM (401 where 200 expected, or vice versa)

**Likelihood:** VERY LOW — both legacy and v1 Sonos routes use the same `withAuthAndErrorHandler` wrapper from `@/lib/core`. Phase 160 shipped 13 zone routes that have been running in production since 2026-04-09 with no auth issues [inferred from STATE.md showing no blocker entries].

**Mitigation:**
1. Every new route test includes `'should return 401 when not authenticated'` per Phase 160 template.
2. No auth logic is rewritten — wrapper is pure reuse.
3. Rollback: if auth diverges, Plan 3 grep sweep will fail (hook tests will fail on 401 responses), preventing legacy-tree deletion.

### Risk 3: Query-param pass-through for `/history` breaks filtering

**Impact:** MEDIUM (history view shows wrong data or 500s on query)

**Likelihood:** LOW — legacy route `app/api/sonos/history/route.ts:14-22` reads all 7 params via `searchParams.get(...)` and passes to `getHistory(params)`. Proxy `getHistory` (`lib/sonos/sonosProxy.ts:254-262`) builds a URLSearchParams from whatever is non-null. Mirroring the legacy verbatim (see Per-Route Sketch D-04) preserves the contract.

**Mitigation:**
1. Plan 1 history route test includes: (a) 401 unauth, (b) 200 with no params (all undefined passed to proxy), (c) 200 with full param set and `mockGetHistory.toHaveBeenCalledWith({ type: 'volume', start: '...', ... })` assertion.
2. Planner MUST NOT narrow the param list. If cursor needs to be added, extend `lib/sonos/sonosProxy.ts:254-262` first (which is out-of-scope for this phase per Assumption A5 — flag to user).

### Risk 4: WebSocket `subscribe('sonos', ...)` unaffected but side-fetches point at wrong URLs

**Impact:** MEDIUM (WS-connected users see stale playback/health)

**Likelihood:** HIGH if rewrite misses `useSonosData.ts:110` and `:124` (fire-and-forget side-fetches inside the WS handler).

**Mitigation:**
1. Per-hook inventory table explicitly lists both fire-and-forget fetch call sites (lines 110 and 124) — planner should NOT rely on the WS `subscribe`/`unsubscribe` scaffolding remaining unchanged as signal that no URL swaps are needed.
2. Use file-wide find-replace (`/api/sonos/` → `/api/v1/sonos/`) per Pitfall 5 mitigation, then visually verify every hit.
3. Hook test `useSonosData.test.ts:364` asserts `fetchCalls.find(url => /\/api\/sonos\/zones\/.*\/playback/.test(url))` — this REGEX will still match `/api/v1/sonos/zones/.../playback` because `/api/sonos/` is a prefix of `/api/v1/sonos/`... WAIT: the regex is `/\/api\/sonos\/zones\//` literally, which does NOT match `/api/v1/sonos/zones/`. Test will FAIL if the regex is not also updated. This test update is captured in the Test Assertion Update Surface section (line 364 entry).

### Risk 5: Plan 3 grep hits a hidden consumer

**Impact:** MEDIUM (legacy tree deletion breaks a consumer not yet catalogued)

**Likelihood:** VERY LOW — comprehensive search of `lib/routes.ts`, `app/sw.ts`, `lib/commands/`, `app/debug/`, `tests/`, and `public/` found ZERO references. The 9-file consumer surface is complete.

**Mitigation:**
1. Plan 3's pre-deletion grep (`grep -r "/api/sonos" app/ --include="*.ts" --include="*.tsx" | grep -v "app/api/sonos"`) MUST return zero results before `rm -rf` — this is the Phase 166 Plan 3 template.
2. Rollback: if pre-deletion grep fails, STOP and triage. Do NOT proceed with deletion. Recovery: git restore the hook file that missed the swap, re-run Plan 2 verification.
3. Post-deletion grep across `app/`, `lib/`, `types/` — any hit is a bug.

### Risk 6: CONTEXT count discrepancies (A1, A2) mislead the planner

**Impact:** LOW (underscoping → leftover legacy URLs in 2 handlers / 2 test branches)

**Likelihood:** MEDIUM if planner uses CONTEXT D-14/D-15 counts verbatim without checking this research's verified counts.

**Mitigation:**
1. Assumptions Log explicitly flags A1 (16 vs 14 execute() calls) and A2 (11 vs 9 fullData matchers) with line-number evidence.
2. Plan 2 verification grep `grep -n "/api/sonos/" app/components/devices/sonos/hooks/**/*.ts` should return EXACTLY zero after rewrite — catches any missed occurrences.

## Sources

### Primary (HIGH confidence)

- `app/api/v1/sonos/zones/[groupId]/playback/route.ts` — Phase 160 read-route pattern (VERIFIED file contents)
- `app/api/v1/sonos/zones/[groupId]/play/route.ts` — Phase 160 write-route (202 + `suggested_poll_delay_s`) pattern (VERIFIED)
- `app/api/v1/sonos/zones/[groupId]/play-mode/route.ts` — Phase 160 combined GET+PUT pattern (VERIFIED)
- `app/api/v1/sonos/zones/[groupId]/sleep-timer/route.ts` — Phase 160 combined GET+PUT with body (VERIFIED)
- `app/api/v1/sonos/zones/[groupId]/queue/route.ts` — Phase 160 query-param pattern (VERIFIED)
- `app/api/sonos/**/*.ts` — All 11 legacy route files used as templates (VERIFIED by inspection)
- `lib/sonos/sonosProxy.ts` — 28 proxy functions, all required signatures (VERIFIED lines 50-342)
- `types/sonosProxy.ts` — All 9 request DTOs (VERIFIED lines 200-216)
- All 5 hook files + 4 test files — fetch-URL line numbers (VERIFIED by line-by-line read)
- `.planning/phases/166-hue-frontend-cutover/166-{01,02,03}-PLAN.md` — Direct template for this phase's 3-plan cadence (VERIFIED)
- `.planning/phases/167-sonos-frontend-cutover/167-CONTEXT.md` — Locked decisions (VERIFIED)
- `./CLAUDE.md` — Project rules (VERIFIED)

### Secondary (MEDIUM confidence)

- `docs/api/sonos.md` — HA proxy API spec; authoritative for response shapes and query params, consulted for `/history` contract (VERIFIED first 400 lines; full file exceeds 25k tokens but relevant sections consumed)
- Phase 166 Hue cutover execution commits (STATE.md + memory) — empirical precedent for 3-plan cadence success

### Tertiary (LOW confidence / unverified)

- None in this research — all claims tied to verified file contents or CONTEXT decisions.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every dependency verified in-repo
- URL mapping matrix: HIGH — every consumer line number verified against current file contents
- Per-route sketches: HIGH — every one mirrors a Phase 160 or legacy route file byte-for-byte (modulo the prefix change)
- Test assertion counts: HIGH — line-by-line verified (and CONTEXT counts in 2 places noted as undercounting per A1, A2)
- Pitfalls: HIGH — all 6 pitfalls traced to verifiable line numbers or documented patterns
- Security domain: HIGH — cutover-preserving, no new surface; ASVS controls unchanged
- Legacy cleanup scope: HIGH — 23 files across 26 dirs confirmed by `find`; no co-located tests in legacy tree; `app/`+`lib/`+`types/` grep scope defined

**Research date:** 2026-04-20
**Valid until:** 2026-05-05 (15 days; stable internal codebase, no external-library moving parts)
