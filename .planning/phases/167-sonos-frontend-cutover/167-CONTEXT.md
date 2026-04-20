# Phase 167: Sonos Frontend Cutover - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate all frontend Sonos consumers (5 hooks: `useSonosData`, `useSonosFullData`, `useSonosCommands`, `useSonosQueue`, `useSonosHistory` + their 4 test files) from legacy `/api/sonos/*` paths to canonical `/api/v1/sonos/*` paths. Create the 15 missing v1 route wrappers that cover every legacy endpoint exercised by the frontend (health, devices list, zones list, speaker volume/mute/eq/home-theater/source/join/unjoin, history). Delete the entire legacy `app/api/sonos/` tree after the cutover is verified. Phase 160 already produced the 13 zone-level v1 routes (`playback`, `play`, `pause`, `stop`, `next`, `previous`, `volume`, `seek`, `play-mode`, `queue`, `sleep-timer`). No debug-panel, command-palette, service-worker, or `lib/routes.ts` touchpoints exist for Sonos — cutover surface is hooks + tests only.

</domain>

<decisions>
## Implementation Decisions

### Missing V1 Routes (15 wrappers)
- **D-01:** Create `app/api/v1/sonos/health/route.ts` — `GET` → `getHealth()` — 200 OK
- **D-02:** Create `app/api/v1/sonos/devices/route.ts` — `GET` → `getDevices()` — 200 OK
- **D-03:** Create `app/api/v1/sonos/zones/route.ts` — `GET` → `getZones()` — 200 OK
- **D-04:** Create `app/api/v1/sonos/history/route.ts` — `GET` → `getHistory({ type, start, end, limit, speaker_uid?, group_id?, cursor? })` — 200 OK (parse query params)
- **D-05:** Create `app/api/v1/sonos/speakers/[uid]/volume/route.ts` — `GET` → `getSpeakerVolume(uid)` (200), `PUT` → `setSpeakerVolume(uid, body.volume)` (202 + `suggested_poll_delay_s: 1`)
- **D-06:** Create `app/api/v1/sonos/speakers/[uid]/mute/route.ts` — `PUT` → `setSpeakerMute(uid, body.mute)` (202 + `suggested_poll_delay_s: 1`)
- **D-07:** Create `app/api/v1/sonos/speakers/[uid]/eq/route.ts` — `GET` → `getEq(uid)` (200), `PUT` → `setEq(uid, body)` (202 + `suggested_poll_delay_s: 1`)
- **D-08:** Create `app/api/v1/sonos/speakers/[uid]/home-theater/route.ts` — `GET` → `getHomeTheater(uid)` (200), `PUT` → `setHomeTheater(uid, body)` (202 + `suggested_poll_delay_s: 1`)
- **D-09:** Create `app/api/v1/sonos/speakers/[uid]/source/route.ts` — `POST` → `switchSource(uid, body.source)` (202 + `suggested_poll_delay_s: 1`)
- **D-10:** Create `app/api/v1/sonos/speakers/[uid]/join/route.ts` — `POST` → `join(uid, body.target_uid)` (202 + `suggested_poll_delay_s: 1`)
- **D-11:** Create `app/api/v1/sonos/speakers/[uid]/unjoin/route.ts` — `POST` → `unjoin(uid)` (202 + `suggested_poll_delay_s: 1`)
- **D-12:** Skip `GET /api/v1/sonos/devices/[uid]` — spec defines it but no frontend consumer exists; legacy route deleted with rest of tree. Mirrors Phase 166 approach (create only what frontend uses).

### URL Mapping (legacy → v1) — direct rewrite, identical suffix
- **D-13:** All paths map 1:1 with `/api/sonos/` → `/api/v1/sonos/` prefix swap. No path splits, no semantic changes:
  - `/api/sonos/health` → `/api/v1/sonos/health`
  - `/api/sonos/devices` → `/api/v1/sonos/devices`
  - `/api/sonos/zones` → `/api/v1/sonos/zones`
  - `/api/sonos/zones/{group_id}/*` → `/api/v1/sonos/zones/{group_id}/*` (13 endpoints — already exist from Phase 160)
  - `/api/sonos/speakers/{uid}/*` → `/api/v1/sonos/speakers/{uid}/*`
  - `/api/sonos/history` → `/api/v1/sonos/history`

### Frontend Files to Rewrite (9 total: 5 hooks + 4 tests)
- **D-14:** Hooks (5):
  - `app/components/devices/sonos/hooks/useSonosData.ts` — 3 fetch calls (`health`, `zones`, `zones/{gid}/playback`)
  - `app/components/devices/sonos/hooks/useSonosFullData.ts` — 8 fetch calls (`devices`, `zones`, `zones/{gid}/playback`, `speakers/{uid}/volume`, `speakers/{uid}/eq`, `speakers/{uid}/home-theater`, `zones/{gid}/play-mode`, `zones/{gid}/sleep-timer`)
  - `app/components/devices/sonos/hooks/useSonosCommands.ts` — 14 `execute()` calls (all transport, speaker, zone commands)
  - `app/components/devices/sonos/hooks/useSonosQueue.ts` — 1 fetch (`zones/{gid}/queue?limit&offset`)
  - `app/components/devices/sonos/hooks/useSonosHistory.ts` — 1 fetch (`history?type&start&end&limit`)
- **D-15:** Tests (4):
  - `__tests__/useSonosData.test.ts` — assertion URL updates
  - `__tests__/useSonosCommands.test.ts` — 15+ assertion URL updates
  - `__tests__/useSonosQueue.test.ts` — 2 assertion URL updates
  - `__tests__/useSonosFullData.test.ts` — 9 conditional URL matchers
- **D-16:** `useSonosHistory` has no existing test file — leave as-is (no regression risk, mirrors Phase 166 where untested files were not retroactively covered).

### Legacy Route Cleanup
- **D-17:** Delete entire `app/api/sonos/` directory tree after frontend cutover verified. Includes: `health`, `history`, `devices`, `devices/[uid]`, `zones`, `zones/[groupId]/*` (11 subdirs), `speakers/[uid]/*` (7 subdirs) and all co-located `__tests__/`. Final repo-wide grep proving zero `/api/sonos/` refs outside archived `.planning/` docs.

### Firebase Command Logging
- **D-18:** Not applicable — neither legacy `/api/sonos/*` routes nor existing v1 zone routes call `adminDbPush`. Sonos has no command-log pattern. New v1 routes do NOT add logging. This diverges from Hue (Phase 166 D-05) intentionally: Sonos success criteria do not mention Firebase logging.

### Response Shape Consistency
- **D-19:** V1 routes are thin wrappers over the same `lib/sonos/sonosProxy.ts` functions that legacy routes already wrap. Response shapes identical by construction. No adapter work in hooks.

### Test Strategy (new v1 routes)
- **D-20:** Each new v1 route gets a co-located `__tests__/route.test.ts` mirroring the pattern used by existing Phase 160 v1 zone route tests and Phase 166 Hue route tests. Mock `lib/sonos/sonosProxy.ts`, assert status code + body + `suggested_poll_delay_s` for command routes.

### Plan Structure (3 plans)
- **D-21:** Mirror Phase 166 three-plan structure:
  1. Create all 15 missing v1 route wrappers + tests
  2. Rewrite 5 hooks + 4 test files to canonical paths
  3. Delete `app/api/sonos/` legacy tree + repo-wide grep sweep + Jest/Playwright smoke green

### Claude's Discretion
- Log-tag naming for `withAuthAndErrorHandler` (e.g., `'Sonos/Health'`, `'Sonos/Speakers/Eq/Get'`)
- Query-parameter parsing for history endpoint (which params pass through vs validate)
- Body-interface typing for speakers `source` and `join` routes (single-field request DTOs)
- Order of sub-steps within each plan
- Whether to batch speakers/* test creation in a single pass or per-route

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API Specification
- `docs/api/sonos.md` — Authoritative Sonos API spec (all 28+ endpoints, request/response DTOs, auto-granularity rules for /history)
- `docs/api/README.md` — API authentication patterns (X-API-Key)

### Existing V1 Routes (pattern reference — Phase 160 output)
- `app/api/v1/sonos/zones/[groupId]/playback/route.ts` — GET pattern (200 OK, proxy delegation)
- `app/api/v1/sonos/zones/[groupId]/play/route.ts` — POST command pattern (202 Accepted + `suggested_poll_delay_s`)
- `app/api/v1/sonos/zones/[groupId]/volume/route.ts` — PUT with body pattern
- `app/api/v1/sonos/zones/[groupId]/seek/route.ts` — PUT with body pattern
- `app/api/v1/sonos/zones/[groupId]/play-mode/route.ts` — GET + PUT combined route pattern
- `app/api/v1/sonos/zones/[groupId]/sleep-timer/route.ts` — GET + PUT combined route pattern
- `app/api/v1/sonos/zones/[groupId]/queue/route.ts` — GET with query params pattern

### Legacy Route References (template for wrapping + to delete)
- `app/api/sonos/health/route.ts`
- `app/api/sonos/devices/route.ts`
- `app/api/sonos/devices/[uid]/route.ts`
- `app/api/sonos/zones/route.ts`
- `app/api/sonos/speakers/[uid]/volume/route.ts`
- `app/api/sonos/speakers/[uid]/mute/route.ts`
- `app/api/sonos/speakers/[uid]/eq/route.ts`
- `app/api/sonos/speakers/[uid]/home-theater/route.ts`
- `app/api/sonos/speakers/[uid]/source/route.ts`
- `app/api/sonos/speakers/[uid]/join/route.ts`
- `app/api/sonos/speakers/[uid]/unjoin/route.ts`
- `app/api/sonos/history/route.ts`

### Proxy Layer
- `lib/sonos/sonosProxy.ts` — 28 proxy functions (all required: `getHealth`, `getDevices`, `getDevice`, `getZones`, `getPlayback`, `getSpeakerVolume`, `setSpeakerVolume`, `setSpeakerMute`, `getEq`, `setEq`, `getHomeTheater`, `setHomeTheater`, `switchSource`, `join`, `unjoin`, `getHistory`, plus the 13 already wired by Phase 160)
- `types/sonosProxy.ts` — all Sonos TypeScript types (`SonosHealthResponse`, `SonosDeviceResponse`, `SonosZoneResponse`, `SetVolumeRequest`, `SetMuteRequest`, `SetEqRequest`, `SetHomeTheaterRequest`, `SetSourceRequest`, `SetJoinRequest`, etc.)

### Frontend Files to Modify
- `app/components/devices/sonos/hooks/useSonosData.ts`
- `app/components/devices/sonos/hooks/useSonosFullData.ts`
- `app/components/devices/sonos/hooks/useSonosCommands.ts`
- `app/components/devices/sonos/hooks/useSonosQueue.ts`
- `app/components/devices/sonos/hooks/useSonosHistory.ts`
- `app/components/devices/sonos/hooks/__tests__/useSonosData.test.ts`
- `app/components/devices/sonos/hooks/__tests__/useSonosCommands.test.ts`
- `app/components/devices/sonos/hooks/__tests__/useSonosQueue.test.ts`
- `app/components/devices/sonos/hooks/__tests__/useSonosFullData.test.ts`

### Prior Phase Context
- `.planning/phases/160-sonos-gap-closure/160-CONTEXT.md` — Phase 160 created the 13 zone-level v1 routes; D-04 explicitly deferred frontend migration: "Frontend hooks (useSonosData, useSonosCommands, useSonosQueue) are NOT updated in this phase. Old /api/sonos/* routes remain active. Frontend migration is a separate concern." — that deferral is what this phase closes.
- `.planning/phases/166-hue-frontend-cutover/166-CONTEXT.md` — Direct template for this phase (same cutover shape, different provider). Same 3-plan structure reused.
- `.planning/phases/164-regression-fix/164-01-PLAN.md` — Regression-fix template: how to scrub `/api/sonos/` refs across routes/sw/commands/debug panels (none of those surfaces exist for Sonos, but the cleanup discipline applies).

### Core Utilities (used by new v1 routes)
- `lib/core` — `withAuthAndErrorHandler`, `success`, `getPathParam`, `parseJson`, `HTTP_STATUS.ACCEPTED`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/sonos/sonosProxy.ts`: All 28 proxy functions already implemented — every new v1 route is a ~10-line wrapper (no new proxy code needed).
- `types/sonosProxy.ts`: Complete DTO coverage — all request/response types pre-defined.
- Phase 160 v1 zone routes: 13 concrete examples of the exact wrapper pattern (`withAuthAndErrorHandler` + proxy delegation + `success(data, null, HTTP_STATUS.ACCEPTED)` for commands).
- Phase 166 cutover mechanics: hooks rewrite pattern (string-replace prefix in fetch URLs, update test assertions), final grep sweep, legacy-tree deletion — reusable muscle memory.

### Established Patterns
- Read routes: `export const GET = withAuthAndErrorHandler(async (_request, context) => { const x = await getPathParam(context, 'name'); const data = await proxyFn(x); return success(data as unknown as Record<string, unknown>); }, 'Tag');`
- Command routes (POST/PUT): return `success({ ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>, null, HTTP_STATUS.ACCEPTED);`
- Combined GET + PUT/POST in one file (precedent: zones/play-mode, zones/sleep-timer) — apply to `speakers/[uid]/volume`, `speakers/[uid]/eq`, `speakers/[uid]/home-theater`.
- Frontend hooks: fetch URLs are string literals / template literals — mechanical prefix rewrite.

### Integration Points
- WS dispatch layer (`app/components/devices/sonos/hooks/*` WS-primary / polling-fallback) is orthogonal to HTTP path — no changes needed to WS code.
- `useSonosCommands` uses retry wrapper `sonosTransportCmd.execute` / `sonosVolumeCmd.execute` / `sonosExtendedCmd.execute`; only the URL string passed in changes.
- No `lib/routes.ts` entry, no `app/sw.ts` cache rule, no command-palette (`lib/commands/*`), no debug panel, no nav menu — Sonos is entirely consumed via the 5 hooks.

</code_context>

<specifics>
## Specific Ideas

- Sonos differs from Hue in that no Firebase command logging was ever wired server-side — do NOT add it during cutover (out of scope, diverges from existing behavior).
- `app/api/sonos/devices/[uid]/route.ts` has no frontend consumer — deleted with the rest of the legacy tree without a v1 replacement. If a future phase needs speaker detail, v1 wrapper can be added then (proxy function `getDevice(uid)` already exists).
- History endpoint has multiple optional query params (`type`, `start`, `end`, `limit`, `speaker_uid`, `group_id`, `cursor`) — route must pass through all of them to `getHistory(params)`; current frontend usage (`useSonosHistory`) only sets `type`, `start`, `end`, `limit`, but the v1 route should not narrow the contract.
- Three speaker endpoints (volume, eq, home-theater) combine GET + PUT — use single `route.ts` file per endpoint, mirroring Phase 160's `play-mode` and `sleep-timer` pattern, not two separate files.

</specifics>

<deferred>
## Deferred Ideas

- `GET /api/v1/sonos/devices/[uid]` — v1 route not created in this phase (no frontend consumer). Add when a consumer appears.
- Firebase command logging for Sonos commands — not part of current scope or success criteria. Could be added as a follow-up analytics/observability phase if desired.

</deferred>

---

*Phase: 167-sonos-frontend-cutover*
*Context gathered: 2026-04-20*
