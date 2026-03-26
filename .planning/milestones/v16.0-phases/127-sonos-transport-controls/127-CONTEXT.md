# Phase 127: Sonos Transport Controls - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning
**Mode:** Auto (recommended defaults applied)

<domain>
## Phase Boundary

Add playback state/control routes (play/pause/stop/next/prev), volume routes (get/set per speaker and zone), mute, and seek to the Sonos proxy. Users can control Sonos playback and volume from the application. Extended controls (EQ, play-mode, queue, home theater, grouping, sleep timer, history) are Phase 128. Frontend is Phase 129.

</domain>

<decisions>
## Implementation Decisions

### Proxy command wrappers
- **D-01:** Add command wrappers to existing `lib/sonos/sonosProxy.ts` — same file as Phase 126 read wrappers, matching established pattern (thermorossiProxy.ts, hueProxy.ts)
- **D-02:** Transport commands (play/pause/stop/next/previous) use `haPost` with empty body `{}` — HA API returns `SonosCommandOkResponse`
- **D-03:** Volume/mute/seek commands use `haPut` with typed request body — `SetVolumeRequest`, `SetMuteRequest`, `SetSeekRequest`
- **D-04:** No idempotency wrapper on Sonos commands — transport controls are inherently idempotent (play when playing = no-op) and volume is last-write-wins

### Read routes (monitoring)
- **D-05:** GET `/api/sonos/zones/[groupId]/playback` returns `SonosPlaybackResponse` from cache — uses `haGet` + existing `getPathParam()` for `[groupId]`
- **D-06:** GET `/api/sonos/speakers/[uid]/volume` returns `SonosVolumeResponse` from cache — reuses `[uid]` dynamic segment pattern from Phase 126

### Transport control routes
- **D-07:** 5 POST routes under `/api/sonos/zones/[groupId]/{play|pause|stop|next|previous}` — each calls its `haPost` wrapper, returns 202 Accepted with `suggested_poll_delay_s`
- **D-08:** All transport POST routes have no request body — `haPost` receives empty `{}`
- **D-09:** 422 not_coordinator errors pass through from HA proxy — no client-side coordinator validation

### Volume control routes
- **D-10:** PUT `/api/sonos/speakers/[uid]/volume` sets speaker volume (0-100) — uses `haPut` with `SetVolumeRequest`
- **D-11:** PUT `/api/sonos/speakers/[uid]/mute` sets speaker mute state — uses `haPut` with `SetMuteRequest`
- **D-12:** PUT `/api/sonos/zones/[groupId]/volume` sets zone-wide volume — uses `haPut` with `SetVolumeRequest`
- **D-13:** All PUT command routes return 202 Accepted with `suggested_poll_delay_s` — consistent with Thermorossi/Hue command pattern

### Seek route
- **D-14:** PUT `/api/sonos/zones/[groupId]/seek` accepts `SetSeekRequest` with `position` in "HH:MM:SS" format — returns 202 Accepted
- **D-15:** No position format validation at Next.js layer — HA proxy returns 422 for invalid format or non-seekable content

### Response pattern
- **D-16:** All command routes return `success(data as unknown as Record<string, unknown>, null, HTTP_STATUS.ACCEPTED)` — double assertion pattern matching Phase 126 and existing stove/hue routes
- **D-17:** `suggested_poll_delay_s: 1` added to all command responses — frontend can use this to refresh playback/volume state after commands

### Claude's Discretion
- Proxy function naming (e.g., `play`, `pause`, `setVolume`, `setSpeakerMute`)
- Test file organization and mock data
- JSDoc on new proxy functions (brief, optional)
- Whether to group route files or keep flat structure under zones/speakers

</decisions>

<specifics>
## Specific Ideas

- Transport POST endpoints have NO request body — simpler than stove commands (no `parseJsonOrThrow` needed, just `haPost` with `{}`)
- Zone volume does NOT gate on coordinator routing per API spec — no 422 for slave UIDs on PUT zone volume
- Transport controls DO require coordinator UID — 422 returned with correct coordinator_uid hint if member UID supplied
- `SonosPlaybackResponse` type already exists in `types/sonosProxy.ts` from Phase 126 — no new types needed for playback monitoring
- `SonosVolumeResponse`, `SetVolumeRequest`, `SetMuteRequest`, `SetSeekRequest`, `SonosCommandOkResponse` all pre-defined in Phase 126

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Sonos API specification
- `docs/api/sonos.md` §Monitoring — Playback and volume read endpoints (lines 403-530)
- `docs/api/sonos.md` §Transport Controls — play/pause/stop/next/previous endpoints (lines 533-749)
- `docs/api/sonos.md` §Volume Controls — speaker volume, speaker mute, zone volume (lines 752-940)
- `docs/api/sonos.md` §Seek — zone seek endpoint (lines 944-999)

### Existing Sonos infrastructure (Phase 126)
- `lib/sonos/sonosProxy.ts` — Current read-only proxy, add command wrappers here
- `types/sonosProxy.ts` — All types pre-defined (SonosPlaybackResponse, SonosVolumeResponse, SetVolumeRequest, SetMuteRequest, SetSeekRequest, SonosCommandOkResponse)
- `app/api/sonos/` — Existing route structure (health, devices, zones)

### Reference command implementations
- `app/api/stove/setPower/route.ts` — POST with 202 Accepted pattern + parseJsonOrThrow
- `app/api/hue/lights/[id]/route.ts` — PUT command with getPathParam + 202 response
- `lib/haClient.ts` — haPost and haPut signatures

### Core utilities
- `lib/core/apiResponse.ts` — success(), withAuthAndErrorHandler(), getPathParam(), parseJson(), HTTP_STATUS
- `lib/core/` — All shared route utilities

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `haPost<T>(endpoint, body)` from `lib/haClient.ts`: For transport control commands (play/pause/stop/next/prev)
- `haPut<T>(endpoint, body)` from `lib/haClient.ts`: For volume, mute, and seek commands
- `haGet<T>(endpoint)` from `lib/haClient.ts`: For playback and volume read routes
- `getPathParam(context, 'groupId')` / `getPathParam(context, 'uid')`: Extract dynamic path segments
- `parseJson(request)` from `lib/core`: Parse PUT request bodies
- All Sonos TypeScript types pre-defined in `types/sonosProxy.ts`

### Established Patterns
- Function module pattern: add `play(groupId)`, `pause(groupId)`, `setVolume(uid, volume)` etc. as exported async functions
- 202 Accepted for all mutations — consistent with Thermorossi and Hue command routes
- `suggested_poll_delay_s` in command responses — frontend polls after delay to see updated state
- Double assertion `data as unknown as Record<string, unknown>` for `success()` calls with typed responses

### Integration Points
- `lib/sonos/sonosProxy.ts` gains ~10 new exported functions (5 transport + 3 volume/mute + 1 seek + 2 read)
- New routes under `app/api/sonos/zones/[groupId]/` (playback, play, pause, stop, next, previous, volume, seek)
- New routes under `app/api/sonos/speakers/[uid]/` (volume, mute)
- HA proxy paths: `/api/v1/sonos/zones/{group_id}/...` and `/api/v1/sonos/speakers/{uid}/...`

</code_context>

<deferred>
## Deferred Ideas

- Extended controls (EQ, play-mode, queue, home theater, grouping, sleep timer, history) — Phase 128
- Frontend (SonosCard, /sonos page, device registry, nav menu) — Phase 129
- Idempotency wrappers for critical commands — not needed (transport controls are naturally idempotent)

</deferred>

---

*Phase: 127-sonos-transport-controls*
*Context gathered: 2026-03-23*
