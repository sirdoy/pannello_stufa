# Phase 126: Sonos Infrastructure - Research

**Researched:** 2026-03-23
**Domain:** Sonos proxy client, TypeScript types, Next.js API routes (read-only infrastructure)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Single `lib/sonos/sonosProxy.ts` function module — matches thermorossiProxy.ts, hueProxy.ts, fritzboxProxy.ts pattern
- **D-02:** Phase 126 implements only read wrappers (getHealth, getDevices, getDevice, getZones) using `haGet` transport
- **D-03:** Future phases (127-128) add haPost/haPut wrappers to the same file — no split by concern
- **D-04:** Single `types/sonosProxy.ts` file containing all Sonos interfaces — matches existing provider type files
- **D-05:** Define ALL types upfront (health, device, zone, playback, volume, EQ, queue, history) even though Phase 126 only uses discovery types — avoids rework in phases 127-128
- **D-06:** Use exact field names and types from `docs/api/sonos.md` TypeScript blocks — no renaming
- **D-07:** Sonos uses 3-state freshness: `LIVE` (≤90s), `STALE` (>90s, still 200 OK), `UNREACHABLE` (3+ failures → 503)
- **D-08:** Define `SonosDataFreshness = 'LIVE' | 'STALE'` as provider-specific type — UNREACHABLE never appears in response body (triggers 503 at HA proxy level)
- **D-09:** No client-side staleness tracking in this phase — frontend hooks come in Phase 129
- **D-10:** Dynamic segments: `[uid]` for speakers, `[groupId]` for zones — camelCase in Next.js folder names per existing codebase convention
- **D-11:** All routes use `withAuthAndErrorHandler` + `success()` pattern from `lib/core`
- **D-12:** All route files export `const dynamic = 'force-dynamic'`
- **D-13:** Route naming maps to API doc paths: `/api/sonos/health`, `/api/sonos/devices`, `/api/sonos/devices/[uid]`, `/api/sonos/zones`
- **D-14:** Let haGet propagate RFC 9457 errors — no extra error wrapping in proxy functions
- **D-15:** 404 for unknown speaker UID (from HA proxy), 503 for UNREACHABLE — pass through to client

### Claude's Discretion

- JSDoc comments on proxy functions (optional, brief)
- Internal helper functions if needed for response mapping
- Test file structure and mock data shapes

### Deferred Ideas (OUT OF SCOPE)

- Sonos transport controls (play/pause/stop/next/prev) — Phase 127
- Volume and seek controls — Phase 127
- Extended controls (EQ, play-mode, queue, home theater, grouping, sleep timer, history) — Phase 128
- Frontend (SonosCard, /sonos page, device registry, nav menu) — Phase 129
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SONOS-01 | Proxy client per Sonos API con haGet/haPost/haPut transport (X-API-Key auth) | `lib/haClient.ts` already provides all 4 transports; sonosProxy.ts wraps haGet for this phase |
| SONOS-02 | TypeScript types per tutti i response interfaces Sonos (health, device, zone, playback, volume, EQ, queue, history) | All interfaces sourced directly from `docs/api/sonos.md` TypeScript blocks — exact field names confirmed |
| SONOS-03 | GET /sonos/health — speaker connectivity, data freshness, device count | HA endpoint: `/api/v1/sonos/health`; response shape: `SonosHealthResponse` |
| SONOS-04 | GET /sonos/devices — lista speaker con identity e topology | HA endpoint: `/api/v1/sonos/devices`; response: `SonosDeviceResponse[]` |
| SONOS-05 | GET /sonos/devices/{uid} — dettaglio speaker con audio state on-demand | HA endpoint: `/api/v1/sonos/devices/{uid}`; response: `SonosDeviceDetailResponse` (extends SonosDeviceResponse) |
| SONOS-06 | GET /sonos/zones — zone groups con coordinator e members | HA endpoint: `/api/v1/sonos/zones`; response: `SonosZoneResponse[]` (includes `SonosZoneMemberResponse[]`) |
</phase_requirements>

---

## Summary

Phase 126 adds the fourth read-only device provider to the project following the established 7-step device onboarding path (steps 1-3: types → client → routes). The implementation pattern is thoroughly proven across thermorossiProxy.ts, hueProxy.ts, fritzboxProxy.ts, and raspiProxy — there is no design ambiguity.

The `lib/haClient.ts` transport layer (haGet/haPost/haPut/haDelete) is already in place and handles all auth, timeout, and RFC 9457 error mapping. The Sonos proxy adds zero new infrastructure — it is purely a typed thin wrapper around haGet for 4 HA endpoints. Environment variables `HA_API_URL` and `HA_API_KEY` are already configured.

The `docs/api/sonos.md` specification is authoritative and complete with exact TypeScript interface definitions. Decision D-05 requires defining ALL Sonos types upfront (not just discovery types), covering the full 28-endpoint surface area across phases 126-128. This is a one-time investment that avoids rework.

**Primary recommendation:** Copy the thermorossiProxy.ts function module structure exactly. The file is the simplest proxy in the codebase — four async functions, each a one-liner haGet call with a typed return. The hueProxy.ts is the reference for complex proxy shape but Phase 126 does not need its PUT path.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lib/haClient.ts` | project-internal | GET transport to HA proxy | Already used by all 5 providers; handles auth + timeout + RFC 9457 errors |
| `lib/core` | project-internal | withAuthAndErrorHandler + success() + getPathParam() | Required by all API routes in the project |
| TypeScript | 5.x | Type safety | Project-wide, strict + noUncheckedIndexedAccess enforced |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/server` (NextResponse) | Next.js 15.5 | API route response types | Implicit via lib/core helpers |

### No New Dependencies

This phase requires zero new npm packages. All transport, auth, and response utilities are in the existing project infrastructure.

---

## Architecture Patterns

### Recommended File Structure

```
lib/sonos/
├── sonosProxy.ts         # Function module: getHealth, getDevices, getDevice, getZones
app/api/sonos/
├── health/
│   └── route.ts          # GET /api/sonos/health
├── devices/
│   ├── route.ts          # GET /api/sonos/devices
│   └── [uid]/
│       └── route.ts      # GET /api/sonos/devices/[uid]
└── zones/
    └── route.ts          # GET /api/sonos/zones
types/
└── sonosProxy.ts         # All Sonos interfaces (Phase 126-128 types together)
lib/sonos/__tests__/
└── sonosProxy.test.ts    # Unit tests: jest.mock haClient, verify endpoint paths
```

### Pattern 1: Function Module Proxy (thermorossiProxy.ts model)

**What:** Each exported function is a single async wrapper around one haGet call with a typed return.
**When to use:** Read-only endpoints with no request body. This phase is all reads.

```typescript
// Source: lib/stove/thermorossiProxy.ts (existing pattern)
import { haGet } from '@/lib/haClient';
import type { SonosHealthResponse } from '@/types/sonosProxy';

/** Get Sonos speaker connectivity status and data freshness. */
export async function getHealth(): Promise<SonosHealthResponse> {
  return haGet<SonosHealthResponse>('/api/v1/sonos/health');
}

/** Get single speaker detail with on-demand audio state. */
export async function getDevice(uid: string): Promise<SonosDeviceDetailResponse> {
  return haGet<SonosDeviceDetailResponse>(`/api/v1/sonos/devices/${uid}`);
}
```

### Pattern 2: Route Handler (hue/lights/route.ts model)

**What:** `withAuthAndErrorHandler` wraps the entire handler; `success()` wraps the response.
**When to use:** All API routes in this project.

```typescript
// Source: app/api/hue/lights/route.ts (existing pattern)
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getDevices } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getDevices();
  return success({ devices: data });
}, 'Sonos/Devices');
```

### Pattern 3: Dynamic Segment Route (hue/lights/[id]/route.ts model)

**What:** `getPathParam(context, 'uid')` extracts the dynamic segment.
**When to use:** Any route with `[uid]` in the path.

```typescript
// Source: app/api/hue/lights/[id]/route.ts (existing pattern)
import { withAuthAndErrorHandler, success, getPathParam } from '@/lib/core';
import { getDevice } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const uid = await getPathParam(context, 'uid');
  const data = await getDevice(uid);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Device/Get');
```

### Pattern 4: All-Upfront Types File

**What:** `types/sonosProxy.ts` declares every Sonos interface even when only a subset is used in Phase 126.
**When to use:** Decision D-05 mandates this. Prevents SONOS-02 from requiring file modifications in phases 127-128.

Types to declare now (Phase 126 uses the first 4; the rest prepare phases 127-128):
1. `SonosDataFreshness` — union type
2. `SonosHealthResponse` — SONOS-03
3. `SonosDeviceResponse` — SONOS-04
4. `SonosDeviceDetailResponse` — SONOS-05 (extends SonosDeviceResponse)
5. `SonosZoneMemberResponse` — SONOS-06
6. `SonosZoneResponse` — SONOS-06
7. `SonosPlaybackResponse` — Phase 127 prep
8. `SonosVolumeResponse` — Phase 127 prep
9. `SonosEqResponse` — Phase 128 prep
10. `SonosPlayModeResponse` — Phase 128 prep
11. `SonosQueueItemResponse` — Phase 128 prep
12. `SonosQueueResponse` — Phase 128 prep
13. `SonosHomeTheaterResponse` — Phase 128 prep
14. `SonosSleepTimerResponse` — Phase 128 prep
15. `SonosVolumeHistoryItem` — Phase 128 prep
16. `SonosPlaybackHistoryItem` — Phase 128 prep
17. `SonosHistoryResponse` — Phase 128 prep
18. Command request interfaces (SetVolumeRequest, SetMuteRequest, etc.) — Phase 127-128 prep

### Anti-Patterns to Avoid

- **Renaming fields from the API spec:** Decision D-06 is explicit — use exact snake_case names from `docs/api/sonos.md`. Do not camelCase the interface fields.
- **Extra error wrapping in proxy functions:** Decision D-14 says let haGet propagate errors directly. Do not add try/catch in proxy functions.
- **Splitting types across multiple files:** All Sonos types go in `types/sonosProxy.ts` — single file per provider, matching thermorossiProxy.ts and hueProxy.ts convention.
- **Using `speakers` as the URL path:** The HA endpoint for device detail is `/api/v1/sonos/devices/{uid}` not `/api/v1/sonos/speakers/{uid}`. The `speakers` path is only used for volume, EQ, home-theater (Phases 127-128).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth checking in route handlers | Custom auth middleware | `withAuthAndErrorHandler` from `lib/core` | Already handles Auth0 JWT verification + error formatting |
| HTTP error mapping | Custom status code logic | `haGet` error propagation + `ApiError` class | RFC 9457 mapping already implemented in haClient.ts |
| Response envelope formatting | Custom JSON serializer | `success()` from `lib/core/apiResponse` | Consistent `{ success: true, ...data }` envelope across all routes |
| Path parameter extraction | `req.params` or URL parsing | `getPathParam(context, 'uid')` from `lib/core` | Type-safe async helper for Next.js dynamic segments |

**Key insight:** Every pattern needed for this phase already exists in the project. This phase is a copy-adapt exercise, not a build exercise.

---

## Complete Type Inventory (from docs/api/sonos.md)

All interfaces below are sourced verbatim from the API spec TypeScript blocks. The implementer MUST use these exact definitions.

### Discovery Types (Phase 126)

```typescript
// Source: docs/api/sonos.md — SonosHealthResponse
export type SonosDataFreshness = 'LIVE' | 'STALE';
// Note: UNREACHABLE triggers 503 — never appears in response body

export interface SonosHealthResponse {
  connected: boolean;
  data_freshness: SonosDataFreshness;
  device_count: number;
  last_poll_at: string | null;       // ISO 8601
  last_success_at: string | null;    // ISO 8601
}

// Source: docs/api/sonos.md — SonosDeviceResponse
export interface SonosDeviceResponse {
  uid: string;            // RINCON_... device UID
  name: string;           // Human-readable player name
  ip: string;             // Speaker IP on local network
  model: string | null;   // e.g. "Sonos Beam (Gen 2)"
  firmware: string | null;
  serial: string | null;
  role: 'soundbar' | 'sub' | 'surround' | 'speaker';
  is_visible: boolean;    // false for surrounds, Sub
  is_coordinator: boolean;
}

// Source: docs/api/sonos.md — SonosDeviceDetailResponse
export interface SonosDeviceDetailResponse extends SonosDeviceResponse {
  volume: number | null;    // 0-100
  mute: boolean | null;
  bass: number | null;      // -10 to +10
  treble: number | null;    // -10 to +10
  loudness: boolean | null;
}

// Source: docs/api/sonos.md — SonosZoneMemberResponse
export interface SonosZoneMemberResponse {
  uid: string;
  name: string;
  ip: string;
  role: 'soundbar' | 'sub' | 'surround' | 'speaker';
}

// Source: docs/api/sonos.md — SonosZoneResponse
export interface SonosZoneResponse {
  group_id: string;           // coordinator UID (use as group_id for zone commands)
  label: string;              // human-readable zone label from SoCo
  coordinator_uid: string;    // UID of the zone coordinator
  coordinator_name: string;   // player name of the coordinator
  member_count: number;
  members: SonosZoneMemberResponse[];
}
```

### Monitoring Types (Phase 127 prep)

```typescript
// Source: docs/api/sonos.md — SonosPlaybackResponse
export interface SonosPlaybackResponse {
  group_id: string;
  transport_state: 'PLAYING' | 'PAUSED_PLAYBACK' | 'STOPPED' | 'TRANSITIONING' | null;
  title: string | null;
  artist: string | null;
  album: string | null;
  album_art_url: string | null;
  position: string | null;     // "HH:MM:SS" format
  duration: string | null;     // "HH:MM:SS" format
  source_type: 'tv' | 'streaming' | 'radio' | 'line_in' | 'airplay' | 'unknown' | null;
}

// Source: docs/api/sonos.md — SonosVolumeResponse
export interface SonosVolumeResponse {
  uid: string;
  volume: number | null;  // 0-100
  mute: boolean | null;
}
```

### Extended Types (Phase 128 prep)

```typescript
// Source: docs/api/sonos.md — SonosEqResponse
export interface SonosEqResponse {
  uid: string;
  bass: number | null;      // -10 to +10
  treble: number | null;    // -10 to +10
  loudness: boolean | null;
}

// Source: docs/api/sonos.md — SonosPlayModeResponse
export type SonosPlayMode =
  | 'NORMAL' | 'REPEAT_ALL' | 'SHUFFLE'
  | 'SHUFFLE_NOREPEAT' | 'SHUFFLE_REPEAT_ONE' | 'REPEAT_ONE';

export interface SonosPlayModeResponse {
  group_id: string;
  play_mode: SonosPlayMode | null;
}

// Source: docs/api/sonos.md — SonosQueueItemResponse
export interface SonosQueueItemResponse {
  position: number;
  title: string | null;
  artist: string | null;
  album: string | null;
  album_art_url: string | null;
}

// Source: docs/api/sonos.md — SonosQueueResponse
export interface SonosQueueResponse {
  group_id: string;
  items: SonosQueueItemResponse[];
  total: number;
  limit: number;
  offset: number;
}

// Source: docs/api/sonos.md — SonosHomeTheaterResponse
export interface SonosHomeTheaterResponse {
  uid: string;
  night_mode: boolean | null;
  dialog_mode: boolean | null;
  sub_enabled: boolean | null;
  sub_gain: number | null;               // -15 to +15
  surround_enabled: boolean | null;
  surround_volume_tv: number | null;     // -15 to +15
  surround_volume_music: number | null;  // -15 to +15
}

// Source: docs/api/sonos.md — SonosSleepTimerResponse
export interface SonosSleepTimerResponse {
  group_id: string;
  remaining_seconds: number | null;  // null when no timer active
}

// Source: docs/api/sonos.md — SonosVolumeHistoryItem
export interface SonosVolumeHistoryItem {
  timestamp: number;         // Unix epoch int
  speaker_uid: string;
  granularity: 'raw' | 'hourly' | 'daily';
  volume: number | null;     // 0-100 (raw only)
  mute: number | null;       // 0 or 1 integer (NOT boolean) — raw only
  avg_volume: number | null;
  min_volume: number | null;
  max_volume: number | null;
  muted_minutes: number | null;
  sample_count: number | null;
}

// Source: docs/api/sonos.md — SonosPlaybackHistoryItem
export interface SonosPlaybackHistoryItem {
  timestamp: number;          // Unix epoch int
  group_id: string;
  transport_state: string;
  title: string;
  artist: string;
  album: string;
  source_type: string;
  duration_seconds: number | null;
}

// Source: docs/api/sonos.md — SonosHistoryResponse
export interface SonosHistoryResponse {
  items: SonosVolumeHistoryItem[] | SonosPlaybackHistoryItem[];
  total: number;
  granularity: 'raw' | 'hourly' | 'daily';
  limit: number;
  offset: number;
}
```

### Command Request Types (Phase 127-128 prep)

```typescript
// Source: docs/api/sonos.md — various SetXxxRequest interfaces
export interface SetVolumeRequest { volume: number; }        // 0-100
export interface SetMuteRequest { mute: boolean; }
export interface SetSeekRequest { position: string; }        // "HH:MM:SS"
export interface SetEqRequest { bass?: number; treble?: number; loudness?: boolean; }
export interface SetPlayModeRequest { mode: SonosPlayMode; }
export interface SetHomeTheaterRequest {
  night_mode?: boolean;
  dialog_mode?: boolean;
  sub_enabled?: boolean;
  sub_gain?: number;            // -15 to +15
  surround_enabled?: boolean;
  surround_volume_tv?: number;  // -15 to +15
  surround_volume_music?: number;
}
export interface SetSleepTimerRequest { duration: number; }  // 0-86399 (0 = cancel)
export interface SwitchSourceRequest { source: 'tv' | 'line_in'; }
export interface JoinRequest { target_uid: string; }

// Generic command acknowledgment (used for play/pause/stop/next/previous/unjoin)
export interface SonosCommandOkResponse {
  status: 'ok';
  group_id?: string;
  uid?: string;
}
```

---

## HA Endpoint Mapping (Phase 126 routes)

| Next.js route | HA endpoint | Proxy function | Response type |
|---------------|-------------|----------------|---------------|
| `GET /api/sonos/health` | `GET /api/v1/sonos/health` | `getHealth()` | `SonosHealthResponse` |
| `GET /api/sonos/devices` | `GET /api/v1/sonos/devices` | `getDevices()` | `SonosDeviceResponse[]` |
| `GET /api/sonos/devices/[uid]` | `GET /api/v1/sonos/devices/{uid}` | `getDevice(uid)` | `SonosDeviceDetailResponse` |
| `GET /api/sonos/zones` | `GET /api/v1/sonos/zones` | `getZones()` | `SonosZoneResponse[]` |

---

## Common Pitfalls

### Pitfall 1: Confusing /devices/{uid} with /speakers/{uid}

**What goes wrong:** The HA Sonos API uses `/devices/{uid}` for speaker detail (read) but `/speakers/{uid}` for volume/EQ/home-theater (Phase 127-128). Using the wrong path will cause 404 errors.
**Why it happens:** The API naming is inconsistent between discovery (devices) and control (speakers).
**How to avoid:** Phase 126 uses only `/api/v1/sonos/devices/{uid}` for `getDevice()`. The `speakers` path is NOT used in this phase.
**Warning signs:** 404 Not Found responses from HA proxy on device detail calls.

### Pitfall 2: group_id URL-encoding

**What goes wrong:** Zone group_ids have the format `RINCON_xxx:N` — the colon must be percent-encoded as `%3A` in URLs. If passed raw in query params, the HA proxy may reject or misroute them.
**Why it happens:** Standard URL special character handling.
**How to avoid:** Phase 126 has no group_id in URL paths (zones is a list endpoint). This becomes relevant in Phase 127 when zone commands are added. Document in types JSDoc. The proxy functions should use `encodeURIComponent(groupId)` when interpolating group_ids into paths.
**Warning signs:** 404 on zone command endpoints when group_id contains colon.

### Pitfall 3: mute field is integer in volume history (not boolean)

**What goes wrong:** `SonosVolumeHistoryItem.mute` is `number | null` (0 or 1), not `boolean | null`. SQLite stores it as an integer.
**Why it happens:** HA proxy's Pydantic model declares `Optional[int]` for the SQLite column.
**How to avoid:** The `SonosVolumeHistoryItem` interface declares `mute: number | null` — follow the spec exactly.
**Warning signs:** TypeScript strict mode will catch any `=== true` comparisons on a `number` field.

### Pitfall 4: Defining SonosDataFreshness as a provider-local type

**What goes wrong:** Other providers use `DataFreshness = 'LIVE' | 'STALE'` from their own types files. Creating a global shared type would require a shared types file.
**Why it happens:** Each provider is self-contained.
**How to avoid:** Define `SonosDataFreshness = 'LIVE' | 'STALE'` in `types/sonosProxy.ts` — same pattern as `DataFreshness` in `types/thermorossiProxy.ts`. No cross-provider sharing.

### Pitfall 5: success() with array response

**What goes wrong:** `success()` expects `Record<string, unknown>` but device list and zones return arrays.
**Why it happens:** The `success()` utility spreads the argument into `{ success: true, ...data }`. Arrays cannot be spread this way.
**How to avoid:** Wrap arrays in an object key: `success({ devices: data })` for device list, `success({ zones: data })` for zones. Check the existing hue/lights route pattern: `return success({ lights: data })`.

---

## Code Examples

### sonosProxy.ts complete skeleton (Phase 126 read functions)

```typescript
// Source: lib/stove/thermorossiProxy.ts — adapted for Sonos
import { haGet } from '@/lib/haClient';
import type {
  SonosHealthResponse,
  SonosDeviceResponse,
  SonosDeviceDetailResponse,
  SonosZoneResponse,
} from '@/types/sonosProxy';

export async function getHealth(): Promise<SonosHealthResponse> {
  return haGet<SonosHealthResponse>('/api/v1/sonos/health');
}

export async function getDevices(): Promise<SonosDeviceResponse[]> {
  return haGet<SonosDeviceResponse[]>('/api/v1/sonos/devices');
}

export async function getDevice(uid: string): Promise<SonosDeviceDetailResponse> {
  return haGet<SonosDeviceDetailResponse>(`/api/v1/sonos/devices/${uid}`);
}

export async function getZones(): Promise<SonosZoneResponse[]> {
  return haGet<SonosZoneResponse[]>('/api/v1/sonos/zones');
}
```

### Test pattern (hue/__tests__/hueProxy.test.ts model)

```typescript
// Source: lib/hue/__tests__/hueProxy.test.ts — adapted pattern
jest.mock('@/lib/haClient');
import { haGet } from '@/lib/haClient';
import { getHealth, getDevices, getDevice, getZones } from '../sonosProxy';

const mockHaGet = jest.mocked(haGet);

describe('getHealth', () => {
  it('calls /api/v1/sonos/health', async () => {
    mockHaGet.mockResolvedValueOnce({ connected: true, data_freshness: 'LIVE', device_count: 5, last_poll_at: null, last_success_at: null });
    await getHealth();
    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/sonos/health');
  });
});

describe('getDevice', () => {
  it('calls correct uid path', async () => {
    const uid = 'RINCON_B8E9378A123401400';
    mockHaGet.mockResolvedValueOnce({ uid, name: 'Soggiorno', /* ... */ });
    await getDevice(uid);
    expect(mockHaGet).toHaveBeenCalledWith(`/api/v1/sonos/devices/${uid}`);
  });
});
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (existing project setup) |
| Config file | `jest.config.ts` (project root) |
| Quick run command | `npm test -- lib/sonos` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SONOS-01 | sonosProxy.ts exports haGet wrappers | unit | `npm test -- lib/sonos/__tests__/sonosProxy.test.ts` | Wave 0 |
| SONOS-02 | TypeScript compiles types/sonosProxy.ts (tsc check) | static | tsc via `npm test` (jest runs tsc) | Wave 0 |
| SONOS-03 | getHealth() calls `/api/v1/sonos/health` | unit | `npm test -- sonosProxy` | Wave 0 |
| SONOS-04 | getDevices() calls `/api/v1/sonos/devices` | unit | `npm test -- sonosProxy` | Wave 0 |
| SONOS-05 | getDevice(uid) calls `/api/v1/sonos/devices/${uid}` | unit | `npm test -- sonosProxy` | Wave 0 |
| SONOS-06 | getZones() calls `/api/v1/sonos/zones` | unit | `npm test -- sonosProxy` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- lib/sonos`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `lib/sonos/__tests__/sonosProxy.test.ts` — covers SONOS-01, SONOS-03, SONOS-04, SONOS-05, SONOS-06
- [ ] `lib/sonos/` directory — needs to be created

*(types/sonosProxy.ts has no separate test file needed — TypeScript compilation validates it)*

---

## Sources

### Primary (HIGH confidence)

- `docs/api/sonos.md` — Complete 28-endpoint specification with TypeScript interfaces and response examples (project-internal, authoritative)
- `lib/haClient.ts` — Transport layer implementation verified directly
- `lib/stove/thermorossiProxy.ts` — Reference proxy pattern verified directly
- `lib/hue/__tests__/hueProxy.test.ts` — Test pattern verified directly
- `types/thermorossiProxy.ts` — Reference types file pattern verified directly
- `app/api/hue/lights/route.ts` — Route pattern (list endpoint) verified directly
- `app/api/hue/lights/[id]/route.ts` — Route pattern (dynamic segment) verified directly
- `lib/core/apiResponse.ts` — success() signature and behavior verified directly

### Secondary (MEDIUM confidence)

- `app/api/hue/` directory structure — confirms route folder naming conventions
- `.planning/phases/126-sonos-infrastructure/126-CONTEXT.md` — all implementation decisions locked

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries are project-internal and verified by direct file read
- Architecture: HIGH — exact patterns sourced from existing proxy implementations in the codebase
- Type definitions: HIGH — sourced verbatim from authoritative `docs/api/sonos.md` spec
- Pitfalls: HIGH — two pitfalls (URL encoding, mute integer type) are explicitly documented in the API spec; others derived from existing proxy patterns

**Research date:** 2026-03-23
**Valid until:** Stable — internal project patterns; changes only if haClient.ts or core utilities are refactored
