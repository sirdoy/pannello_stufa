# Phase 128: Sonos Extended Controls - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Add proxy wrappers and Next.js API routes for Sonos extended controls: EQ settings, play modes, queue, home theater, source switching, speaker grouping (join/unjoin), sleep timer, and volume/playback history. Frontend is Phase 129. All types are pre-defined in `types/sonosProxy.ts`.

</domain>

<decisions>
## Implementation Decisions

### Proxy wrapper structure
- **D-01:** Add all new wrappers to existing `lib/sonos/sonosProxy.ts` — same file as Phases 126-127, matching function module pattern
- **D-02:** Read wrappers (getEq, getPlayMode, getQueue, getHomeTheater, getSleepTimer, getHistory) use `haGet`
- **D-03:** Mutation wrappers use `haPut` for EQ, play-mode, home-theater, sleep-timer (partial update/set semantics) and `haPost` for source, join, unjoin (action semantics)
- **D-04:** Queue and history wrappers accept query params and forward them via URL query string construction (URLSearchParams)

### Mutation response pattern
- **D-05:** All mutation routes return HTTP 202 Accepted with `suggested_poll_delay_s: 1` — consistent with Phase 127 transport/volume commands, even though upstream API returns 200
- **D-06:** Response body includes `{ ...data, suggested_poll_delay_s: 1 }` cast through `as unknown as Record<string, unknown>` (same pattern as Phase 127 routes)

### Route file organization
- **D-07:** One route file per endpoint, matching Phase 126-127 directory structure under `app/api/sonos/`
- **D-08:** Speaker routes under `speakers/[uid]/` — eq, home-theater, source, join, unjoin
- **D-09:** Zone routes under `zones/[groupId]/` — play-mode, queue, sleep-timer
- **D-10:** History route at `app/api/sonos/history/route.ts` (no dynamic segment, uses query params)

### Query parameter handling
- **D-11:** History route reads `type`, `speaker_uid`, `group_id`, `start`, `end`, `limit`, `offset` from `request.nextUrl.searchParams` and forwards non-null values via URLSearchParams to haGet
- **D-12:** Queue route reads `limit`, `offset` from searchParams, forwards to haGet

### Unjoin special case
- **D-13:** POST /speakers/{uid}/unjoin uses `haPost` with empty body `{}` — same pattern as transport commands (play/pause/stop/next/previous)

### EQ and home-theater partial update
- **D-14:** PUT routes for EQ and home-theater use `parseJson` to read the request body, pass directly to `haPut` — the HA proxy handles partial update semantics

### Claude's Discretion
- Exact proxy wrapper function signatures (parameter naming)
- Test mock data values
- JSDoc comment wording
- Import grouping within route files

</decisions>

<specifics>
## Specific Ideas

- History endpoint has complex auto-granularity logic server-side — the Next.js route just forwards query params, no client-side granularity selection needed
- `mute` field in volume history is an integer (0/1), not boolean — types already capture this correctly
- Home theater routes only work for `role: "soundbar"` speakers — upstream returns 404 for non-soundbar, no client-side gating needed
- Source switch only supports `"tv"` and `"line_in"` — TypeScript union type already constrains this

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Sonos API specification
- `docs/api/sonos.md` §Extended Controls (line 1020) — EQ, play-mode, queue, home-theater, source, join, unjoin, sleep-timer endpoint specs
- `docs/api/sonos.md` §History (line 1762) — History endpoint with auto-granularity, query params, response shapes

### Existing implementation (extend these files)
- `lib/sonos/sonosProxy.ts` — Add new proxy wrappers here (16 functions currently, adding ~12 more)
- `types/sonosProxy.ts` — All types pre-defined (SonosEqResponse, SonosPlayModeResponse, SonosQueueResponse, SonosHomeTheaterResponse, SonosSleepTimerResponse, SonosHistoryResponse, and all Set*Request types)
- `lib/haClient.ts` — haGet/haPost/haPut transport functions

### Phase 127 route pattern (reference for consistency)
- `app/api/sonos/zones/[groupId]/play/route.ts` — POST command route pattern (202 Accepted)
- `app/api/sonos/speakers/[uid]/volume/route.ts` — PUT command route pattern (202 Accepted)

### Prior decisions
- `.planning/phases/126-sonos-infrastructure/126-CONTEXT.md` — Proxy architecture, type strategy, error handling
- `.planning/phases/127-sonos-transport-controls/127-CONTEXT.md` — Command wrapper pattern, 202 Accepted convention

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sonosProxy.ts`: Function module with 16 wrappers — add ~12 more following identical pattern
- `types/sonosProxy.ts`: All 13 Phase 128 types pre-defined (EQ, PlayMode, Queue, HomeTheater, SleepTimer, History + request types)
- `withAuthAndErrorHandler`: Route wrapper handling auth + error mapping
- `success()`, `getPathParam()`, `parseJson()`, `HTTP_STATUS`: Route utilities from `lib/core`

### Established Patterns
- GET routes: `haGet<T>(url)` → `success(data)`
- PUT/POST mutation routes: `haPut/haPost<T>(url, body)` → `success({ ...data, suggested_poll_delay_s: 1 }, null, HTTP_STATUS.ACCEPTED)`
- Dynamic segments: `[uid]` for speakers, `[groupId]` for zones
- All routes export `const dynamic = 'force-dynamic'`

### Integration Points
- New proxy functions imported by new route files
- Types already imported from `@/types/sonosProxy` — no new type definitions needed
- Test file `lib/sonos/__tests__/sonosProxy.test.ts` needs new test cases for added wrappers

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 128-sonos-extended-controls*
*Context gathered: 2026-03-24*
