---
phase: 167-sonos-frontend-cutover
plan: 01
subsystem: api
tags: [sonos, nextjs, api-routes, jest, ha-proxy, auth0, v1-cutover]

# Dependency graph
requires:
  - phase: 160-sonos-gap-closure
    provides: 13 zone-level v1 routes (playback/play/pause/stop/next/previous/volume/seek/play-mode/queue/sleep-timer) + sonosProxy 28 functions + types/sonosProxy DTOs
  - phase: 166-hue-frontend-cutover
    provides: cutover playbook template (route wrapper → hook rewrite → legacy delete, 3-plan structure)
provides:
  - 11 new v1 Sonos route wrappers (14 handlers across 11 route.ts files)
  - Envelope contracts: /devices returns { devices }, /zones returns { zones } (LOAD-BEARING for Wave 2 hooks)
  - /history route pass-through of 7 legacy query params (type, speaker_uid, group_id, start, end, limit, offset)
  - Co-located Jest coverage: 29 tests (10 new suites + 1 zones root suite) all asserting 401 unauth + happy path
affects: [167-02-hook-rewrite, 167-03-legacy-delete]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Combined GET+PUT in single route.ts file (mirrors Phase 160 play-mode/sleep-timer; applied to speakers/volume, /eq, /home-theater)"
    - "Command route 202 Accepted envelope: success({ ...data, suggested_poll_delay_s: 1 }, null, HTTP_STATUS.ACCEPTED)"
    - "Envelope object for list routes: success({ devices: data }) / success({ zones: data }) — hooks unwrap body.devices / body.zones at top level (success() spreads, does not nest under .data)"
    - "jsdom-safe mock request helper: { headers.get, text, nextUrl } instead of new Request (parseJson + request.nextUrl compatibility)"

key-files:
  created:
    - app/api/v1/sonos/health/route.ts
    - app/api/v1/sonos/devices/route.ts
    - app/api/v1/sonos/zones/route.ts
    - app/api/v1/sonos/history/route.ts
    - app/api/v1/sonos/speakers/[uid]/volume/route.ts
    - app/api/v1/sonos/speakers/[uid]/mute/route.ts
    - app/api/v1/sonos/speakers/[uid]/eq/route.ts
    - app/api/v1/sonos/speakers/[uid]/home-theater/route.ts
    - app/api/v1/sonos/speakers/[uid]/source/route.ts
    - app/api/v1/sonos/speakers/[uid]/join/route.ts
    - app/api/v1/sonos/speakers/[uid]/unjoin/route.ts
    - app/api/v1/sonos/health/__tests__/route.test.ts
    - app/api/v1/sonos/devices/__tests__/route.test.ts
    - app/api/v1/sonos/zones/__tests__/route.test.ts
    - app/api/v1/sonos/history/__tests__/route.test.ts
    - app/api/v1/sonos/speakers/[uid]/volume/__tests__/route.test.ts
    - app/api/v1/sonos/speakers/[uid]/mute/__tests__/route.test.ts
    - app/api/v1/sonos/speakers/[uid]/eq/__tests__/route.test.ts
    - app/api/v1/sonos/speakers/[uid]/home-theater/__tests__/route.test.ts
    - app/api/v1/sonos/speakers/[uid]/source/__tests__/route.test.ts
    - app/api/v1/sonos/speakers/[uid]/join/__tests__/route.test.ts
    - app/api/v1/sonos/speakers/[uid]/unjoin/__tests__/route.test.ts
  modified: []

key-decisions:
  - "Response assertions use data.devices / data.zones / data.status / data.volume at top level (not data.data.*) — success() spreads payload, does not nest it (corrected plan test assertions)"
  - "Test request mocks use { headers.get, text, nextUrl } object pattern (matches Phase 160 zones/volume pattern) instead of new Request() — parseJson and request.nextUrl both work in JSDOM this way"
  - "unjoin route is bodyless POST: does NOT import parseJson, passes {} as request mock in tests"
  - "history route does NOT include cursor param (RESEARCH A5) — getHistory proxy signature accepts only 7 legacy params"

patterns-established:
  - "Read-only v1 sonos route: const GET = withAuthAndErrorHandler(async () => success(data as unknown as Record<string, unknown>), 'Sonos/<Tag>')"
  - "Envelope list route: success({ <key>: data }) — for arrays consumed by hooks expecting body.<key> unwrap"
  - "Write command route: success({ ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>, null, HTTP_STATUS.ACCEPTED)"
  - "Combined GET+PUT in single route.ts with distinct log tags (…/Get, …/Set)"
  - "jsdom-safe mock request: function makePutRequest(body) { return { headers: { get }, text: async () => JSON.stringify(body), nextUrl: { searchParams: new URLSearchParams() } } as any; }"

requirements-completed: [SONOS-01, SONOS-02, SONOS-03, SONOS-04, SONOS-05, SONOS-06, SONOS-07, SONOS-08, SONOS-09, SONOS-10, SONOS-11, SONOS-12, SONOS-13]

# Metrics
duration: ~35min
completed: 2026-04-20
---

# Phase 167 Plan 01: v1 Sonos Route Wrappers Summary

**11 new v1 Sonos route wrappers (14 handlers) with envelope-correct list responses, 7-param history pass-through, and 202-Accepted command contracts — unblocking Wave 2 frontend cutover.**

## Performance

- **Duration:** ~35 min
- **Tasks:** 3 (executed sequentially, all verified via Jest)
- **Files created:** 22 (11 route.ts + 11 __tests__/route.test.ts)
- **Tests added:** 29 (all passing)

## Accomplishments

- 4 read-only routes: health, devices, zones, history — list routes use envelope-wrapped responses matching hook contracts
- 3 combined GET+PUT speaker routes: volume, eq, home-theater — mirror Phase 160 play-mode/sleep-timer pattern
- 4 write-only speaker routes: mute (PUT), source (POST), join (POST), unjoin (POST bodyless)
- All 11 routes wrapped with `withAuthAndErrorHandler`; every test suite asserts 401 UNAUTHORIZED when `auth0.getSession()` returns null
- All 7 command handlers return 202 Accepted with `suggested_poll_delay_s: 1` in body
- /history route passes the 7 legacy query params through to `getHistory` proxy (no `cursor` — matches proxy signature)

## Task Commits

1. **Task 1: 4 read-only routes (health, devices, zones, history)** — `62daa2d3` (feat)
2. **Task 2: 3 combined GET+PUT speaker routes (volume, eq, home-theater)** — `19eaaee4` (feat)
3. **Task 3: 4 write-only speaker routes (mute, source, join, unjoin)** — `67cddde2` (feat)

## Files Created

All 22 files listed under `key-files.created` above. High-level breakdown:

- `app/api/v1/sonos/health/route.ts` — GET wrapper over `getHealth()`
- `app/api/v1/sonos/devices/route.ts` — GET, `success({ devices: data })` envelope (LOAD-BEARING for Wave 2 `useSonosFullData.ts:44`)
- `app/api/v1/sonos/zones/route.ts` — GET, `success({ zones: data })` envelope (LOAD-BEARING for `useSonosData.ts:59` and `useSonosFullData.ts:44`)
- `app/api/v1/sonos/history/route.ts` — GET, 7-param pass-through to `getHistory()` via `request.nextUrl.searchParams`
- `app/api/v1/sonos/speakers/[uid]/volume/route.ts` — GET getSpeakerVolume + PUT setSpeakerVolume(body.volume)
- `app/api/v1/sonos/speakers/[uid]/mute/route.ts` — PUT setSpeakerMute(body.mute)
- `app/api/v1/sonos/speakers/[uid]/eq/route.ts` — GET getEq + PUT setEq(body) (full body, partial EQ fields)
- `app/api/v1/sonos/speakers/[uid]/home-theater/route.ts` — GET getHomeTheater + PUT setHomeTheater(body)
- `app/api/v1/sonos/speakers/[uid]/source/route.ts` — POST switchSource(uid, body.source) (state transition, not PUT)
- `app/api/v1/sonos/speakers/[uid]/join/route.ts` — POST join(uid, body.target_uid) (snake_case body field)
- `app/api/v1/sonos/speakers/[uid]/unjoin/route.ts` — POST unjoin(uid) (bodyless, no `parseJson` import)

Plus 11 co-located `__tests__/route.test.ts` files covering all handlers.

## Decisions Made

- **success() envelope semantics:** The `success()` helper in `lib/core/apiResponse.ts:34-49` spreads `data` at the top level of the response (`{ success: true, ...data }`), not nested under `.data`. The plan's test assertions used `data.data.devices` / `data.data.status` etc. which would have failed. Corrected to `data.devices` / `data.status` at top level. This also verifies that the hook contract (`body.devices`, `body.zones`) is honored: the hooks read the same top-level fields the tests now assert.
- **Test mock request shape:** Using `new Request(url, { method, body })` for PUT/POST tests is fragile in JSDOM. Followed the established Phase 160 pattern (`{ headers: { get: name => ... }, text: async () => JSON.stringify(body), nextUrl: { searchParams: new URLSearchParams() } }`) used in `zones/[groupId]/volume/__tests__/route.test.ts`. Routes that read `request.nextUrl.searchParams` (history) also required an explicit `nextUrl` mock property since plain `Request` has no such field.
- **unjoin test mock:** Bodyless POST; passes `{} as any` as request because the route destructures only `context`, never touches `request`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test assertions referenced wrong response envelope shape**
- **Found during:** Task 1 (first Jest run after writing health/devices/zones tests)
- **Issue:** The plan's test assertions used `data.data.status` / `data.data.devices` / `data.data.zones`, predicting a `{ success: true, data: {…} }` envelope. The actual `success()` helper in `lib/core/apiResponse.ts` does `{ success: true, ...data }` — spreads fields at top level with no `data:` key. Tests failed with `TypeError: Cannot read properties of undefined (reading 'status'/'devices'/'zones')`.
- **Fix:** Changed all three top-level assertions to `data.status` / `data.devices` / `data.zones` — matching both the actual envelope AND the Wave 2 hook contract (`useSonosData.ts:59` reads `zonesBody.zones`, `useSonosFullData.ts:44` reads `devicesBody.devices`). Also applied to `data.volume` / `data.bass` / `data.night_mode` in Task 2 tests preemptively.
- **Files modified:** `app/api/v1/sonos/health/__tests__/route.test.ts`, `app/api/v1/sonos/devices/__tests__/route.test.ts`, `app/api/v1/sonos/zones/__tests__/route.test.ts` (via Write tool; no Edit needed mid-session since same tests were adjusted right after they failed)
- **Verification:** Re-ran `npx jest --testPathPatterns="…"` — all 7 tests in 3 suites passed
- **Committed in:** `62daa2d3` (Task 1 commit)

**2. [Rule 3 - Blocking] Test request mock pattern incompatible with parseJson + request.nextUrl**
- **Found during:** Writing Task 1 tests (before first run) — noticed plan specified `new Request(...)` but pattern inspection of sibling v1 tests (`queue`, `play-mode`, `sleep-timer`, `volume`) showed they all use `{ nextUrl: ..., headers: {...}, text: ... }` mock objects
- **Issue:** (a) The history route reads `request.nextUrl.searchParams` — plain `Request` has no `nextUrl` property and tests would throw. (b) The codebase runs Jest under `jest-environment-jsdom`; PUT/POST tests using `new Request(url, { body })` can fail to expose `request.text()` reliably, and the existing pattern sidesteps this.
- **Fix:** Implemented `makePutRequest(body)` / `makePostRequest(body)` helper in each PUT/POST test that produces `{ headers: { get }, text: async () => JSON.stringify(body), nextUrl: { searchParams: new URLSearchParams() } }` — mirrors the Phase 160 `zones/[groupId]/volume/__tests__/route.test.ts` helper exactly. For history, a `makeGetRequest(query)` helper returning `{ nextUrl: { searchParams: new URLSearchParams(query) } }` mirrors the `queue` test helper.
- **Files modified:** All 8 test files in Tasks 1–3 that test routes with bodies or query params (health + devices + zones + unjoin tests do not need this helper — they pass `{}` for unauth case and nothing for handlers that ignore the request)
- **Verification:** All 29 tests across 11 suites pass
- **Committed in:** `62daa2d3`, `19eaaee4`, `67cddde2` (inline in each task commit)

---

**Total deviations:** 2 auto-fixed (1 test-assertion bug, 1 test-mock pattern alignment)
**Impact on plan:** Both auto-fixes were correctness fixes for test code only. No production behavior changed from plan intent. The route implementations match the plan verbatim. Envelope expectations (`{ devices }`, `{ zones }`) and 202 + `suggested_poll_delay_s: 1` contracts are preserved and now verified against actual response shape.

## Issues Encountered

- Initial run of Task 1 tests showed 2 assertion failures (wrong envelope shape) — diagnosed by reading `lib/core/apiResponse.ts:34-49` and cross-checking Wave 2 hook consumers. Fixed and re-verified within 2 minutes.
- Jest warns "A worker process has failed to exit gracefully" after every suite run — pre-existing issue, unrelated to this plan (appears in isolated sibling test runs). Not addressed.

## Self-Check: PASSED

- All 22 files verified to exist via filesystem check
- All 3 task commits present in git log: `62daa2d3`, `19eaaee4`, `67cddde2`
- 29 tests passing across 11 test suites (verified via two `npx jest` runs — 10-suite pattern + zones root)
- No modifications to STATE.md or ROADMAP.md (those show pre-existing orchestrator edits)

## Next Phase Readiness

- **Wave 2 (167-02) ready:** All `/api/v1/sonos/*` endpoints consumed by the 5 hooks now exist. Hook rewrite can proceed (mechanical prefix swap `/api/sonos/` → `/api/v1/sonos/`).
- **Wave 3 (167-03) ready:** No new legacy references introduced; the entire `app/api/sonos/` tree can be deleted once Wave 2 verifies the hooks.
- **No blockers.**

---
*Phase: 167-sonos-frontend-cutover*
*Plan: 01*
*Completed: 2026-04-20*
