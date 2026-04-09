# Phase 160: Sonos Gap Closure - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Create canonical `/api/v1/sonos/zones/{group_id}/*` routes for all 13 zone-level Sonos endpoints: playback state (GET), transport commands (play, pause, stop, next, previous — POST), volume (PUT), seek (PUT), play-mode (GET/PUT), queue (GET), sleep timer (GET/PUT). All proxy functions already exist in `lib/sonos/sonosProxy.ts` — this phase creates v1 Next.js route wrappers.

</domain>

<decisions>
## Implementation Decisions

### Route Migration Strategy
- **D-01:** Create new route files under `app/api/v1/sonos/zones/[groupId]/` following the established proxy pattern (withAuthAndErrorHandler + proxy function call). Do NOT move or delete old `/api/sonos/zones/*` routes — those remain for backwards compatibility.
- **D-02:** All new v1 routes follow the same structure as `app/api/v1/thermorossi/` and `app/api/v1/hue/` routes: `export const dynamic = 'force-dynamic'`, `withAuthAndErrorHandler` wrapper, proxy function delegation.

### Endpoint Mapping (13 routes)
- **D-03:** Route-to-proxy-function mapping:
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

### Frontend Update Scope
- **D-04:** Frontend hooks (`useSonosData`, `useSonosCommands`, `useSonosQueue`) are NOT updated in this phase. Old `/api/sonos/*` routes remain active. Frontend migration is a separate concern.

### Test Strategy
- **D-05:** Each new v1 route gets a co-located `__tests__/route.test.ts` test file, following the same pattern as Phase 159 Hue route tests.

### Response Consistency
- **D-06:** V1 routes return identical response shapes to the old routes — they are thin wrappers around the same proxy functions. Command routes include `suggested_poll_delay_s: 1` in 202 responses.

### Claude's Discretion
- Log tag naming convention for `withAuthAndErrorHandler` (e.g., `'Sonos/Zones/Playback'`)
- Test assertion granularity and mock structure
- Query parameter parsing for queue endpoint (limit, offset)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API Specification
- `docs/api/sonos.md` — Authoritative Sonos API spec with all endpoints, request/response shapes

### Existing Implementation (patterns to follow)
- `lib/sonos/sonosProxy.ts` — All proxy functions already exist (getPlayback, play, pause, stop, next, previous, setZoneVolume, seek, getPlayMode, setPlayMode, getQueue, getSleepTimer, setSleepTimer)
- `types/sonosProxy.ts` — All TypeScript types already defined
- `app/api/v1/hue/lights/[lightId]/state/route.ts` — Reference pattern for v1 PUT routes with body parsing
- `app/api/v1/thermorossi/status/route.ts` — Reference pattern for v1 GET routes
- `app/api/sonos/zones/[groupId]/play/route.ts` — Existing old-path route pattern with 202 Accepted

### API Patterns
- `docs/api-routes.md` — Project API route conventions and patterns
- `docs/api/README.md` — API authentication patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/sonos/sonosProxy.ts`: All 13 zone-level proxy functions already implemented — routes just need to call them
- `types/sonosProxy.ts`: Complete type coverage — no new types needed
- `lib/core`: `withAuthAndErrorHandler`, `success`, `getPathParam`, `parseJson`, `HTTP_STATUS` utilities

### Established Patterns
- v1 route structure: `app/api/v1/{provider}/{resource}/route.ts`
- Auth wrapper: `withAuthAndErrorHandler(async (request, context) => { ... }, 'Tag')`
- Read routes: `success(data as unknown as Record<string, unknown>)`
- Command routes: `success({ ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>, null, HTTP_STATUS.ACCEPTED)`
- Path params: `await getPathParam(context, 'groupId')`
- Body parsing: `await parseJson(request)` for PUT/POST with body

### Integration Points
- Old routes at `app/api/sonos/zones/*` continue to work (no frontend migration needed)
- New v1 routes are for API alignment — frontend can migrate later
- All 13 routes are wrappers around existing proxy functions (no new proxy code needed)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The phase is straightforward: create v1 route wrappers around existing proxy functions, identical to the Phase 159 Hue pattern.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 160-sonos-gap-closure*
*Context gathered: 2026-04-09*
