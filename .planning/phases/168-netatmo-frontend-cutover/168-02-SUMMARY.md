---
phase: 168-netatmo-frontend-cutover
plan: 02
subsystem: ui
tags: [netatmo, v1-api-cutover, production-consumers, url-rewrite, shape-unwrap, 302-redirect]

# Dependency graph
requires:
  - phase: 161-netatmo-v1-routes
    provides: v1 Netatmo routes that hooks/components now point at
  - phase: 168-01
    provides: debug panels already swapped so production cutover doesn't leave mixed surface
provides:
  - lib/routes.ts NETATMO_ROUTES + CAMERA_ROUTES emit /api/v1/netatmo/* paths (schedules key dropped per D-04; calibrate semantic-mapped to /valves/calibrate)
  - Production hooks (useThermostatData, useScheduleData, useRoomStatus) unwrap v1 raw-proxy shapes (body.homes[0], therm_setpoint_temperature → setpoint, heating_power_request > 0 → heating)
  - Camera consumers (CameraCard, CameraDashboard) use CAMERA_ROUTES.monitoring(cameraId) path-segment + body drops camera_id + cache-bust `?t=` prefix
  - v1 camera snapshot route emits NextResponse.redirect(snapshot_url, 302) preserving <img src> compat (Q3 decision)
  - Command palette hyphen bug fixed: executeThermostatAction fetches /api/v1/netatmo/${endpoint}; 3 callers pass 'setthermmode'
  - Service worker dead /api/netatmo/status branch deleted with breadcrumb
  - 3 test files rewritten to v1 URLs + v1 response shapes + dropped-endpoint assertions deleted
  - jest.setup.ts NextResponse mock gained static .redirect() (Rule 1 fix — Task 1 broke snapshot test)
affects:
  - 168-03 (legacy app/api/netatmo/ tree + __tests__/api/netatmo/ + __tests__/app/api/netatmo/ deletion — this plan leaves zero production refs to the legacy tree, so deletion is blast-radius-free)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Raw-proxy shape unwrap: hooks read data.body?.homes?.[0] from v1 /homesdata + data.rooms from v1 /homestatus (drops legacy flat shape with top-level home_id/home_name/modules)"
    - "v1 field rename mapping: therm_setpoint_temperature → setpoint, heating_power_request > 0 → heating, null-fallback for mode/endtime (consumers already null-guard per Q1 RESOLVED in RESEARCH)"
    - "Path-segment camera URLs via helper function: CAMERA_ROUTES.monitoring = (id) => string (previously a bare string constant)"
    - "NextResponse.redirect(url, { status, headers }) for legacy <img src> preservation instead of client-side rewrite"
    - "Cache-bust query-string prefix swap: path-segment URLs use `?t=${Date.now()}` (leading `?`) instead of legacy `&t=` (no existing query to append to)"
    - "Hyphen bug fix discipline: body URL swap (line 70) paired with 3 caller updates in same commit; acceptance criteria enforce both (zero 'set-therm-mode' + exactly 3 'setthermmode')"

key-files:
  created: []
  modified:
    - lib/routes.ts
    - lib/commands/deviceCommands.tsx
    - lib/hooks/useScheduleData.ts
    - lib/hooks/useRoomStatus.ts
    - app/api/v1/netatmo/camera/[cameraId]/snapshot/route.ts
    - app/api/v1/netatmo/camera/[cameraId]/snapshot/__tests__/route.test.ts
    - app/components/devices/thermostat/hooks/useThermostatData.ts
    - app/components/devices/thermostat/hooks/__tests__/useThermostatData.test.ts
    - app/components/devices/camera/CameraCard.tsx
    - app/(pages)/camera/CameraDashboard.tsx
    - app/registry/devices/page.tsx
    - app/sw.ts
    - app/thermostat/page.test.tsx
    - __tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx
    - __tests__/app/components/devices/camera/CameraMonitoringToggle.test.tsx
    - lib/hooks/__tests__/useScheduleData.test.ts
    - jest.setup.ts

key-decisions:
  - "302 redirect instead of client <img src> rewrite (Q3) — one line changed in the v1 snapshot route handler preserves all existing <img> consumers without touching CameraCard/CameraDashboard rendering"
  - "schedules endpoint dropped entirely (D-04) — no v1 equivalent exists; useScheduleData rewritten to extract schedules from /homesdata response body.homes[0].schedules instead"
  - "calibrate semantic-mapped to /valves/calibrate — not a bare prefix swap (v1 endpoint moved under /valves/ collection)"
  - "Rule 1 deviation: jest.setup.ts NextResponse mock needed .redirect() — Task 1's route change silently broke the co-located test; added shim + afterEach restore"
  - "Rule 1 deviation: useScheduleData test fixture + useThermostatData Test 13b mock updated to v1 shape — Task 2 rewrote these hooks but didn't update the test mocks, so fixtures were fetching legacy shape into v1 unwrap code"
  - "Scope boundary held: 8 pre-existing test failures (4 ThermostatCard.schedule + 4 app/thermostat/page) caused by missing OnlineStatusProvider/WebSocketProvider wrappers in older tests — these are infrastructure rot from earlier phases (143-02 WS adoption, 17b58d94 singleton OnlineStatus) and were NOT introduced by Plan 168-02; deferred per scope boundary rule"

patterns-established:
  - "Raw-proxy shape unwrap for v1 /homesdata + /homestatus consumers (any future hook reading these endpoints must unwrap body.homes[0])"
  - "Rule 1 auto-fix for co-located route handler tests when the route's response contract changes (jest.setup mock must mirror the Next.js surface the production code uses)"
  - "Test fixture shape parity discipline: when a hook is rewritten to unwrap a new response shape, EVERY test fixture that mocks a successful response must be updated in lockstep (not just the tests explicitly named in the plan's Task 4)"

requirements-completed: [NETA-01, NETA-02, NETA-03, NETA-04, NETA-05, NETA-06, NETA-07, NETA-08, NETA-09]

# Metrics
duration: ~9h (spanned discuss → execute window)
completed: 2026-04-21
---

# Phase 168 Plan 02: Netatmo Production Frontend Cutover Summary

**Production consumers (hooks + components + tests) cut over to v1 /api/v1/netatmo/\* surface; legacy schedules endpoint dropped; command-palette hyphen bug fixed; camera snapshot 302 redirect preserves <img src> compat; 3 test files rewritten + 2 Rule 1 regressions auto-fixed.**

## Performance

- **Duration:** 9h 5min wall-clock (first commit 2026-04-21T01:17Z; last commit 2026-04-21T10:14Z; pause between task 3 and task 4 resumption)
- **Active work:** ~1h30 (initial Tasks 1–3 at 01:17–01:25 + Task 4 continuation at 10:13–10:14)
- **Tasks:** 5 (1, 2, 2E, 3, 4)
- **Commits:** 6 (5 task commits + 1 Rule 1 fix commit)
- **Files modified:** 17 (13 production + 4 test)

## Accomplishments

- **lib/routes.ts** rewritten: 6-key NETATMO_ROUTES all point to /api/v1/netatmo/\*; CAMERA_ROUTES.monitoring redefined as function `(cameraId) => string`; stream/snapshot switched to path-segment shape; schedules key deleted; calibrate semantic-mapped to /valves/calibrate
- **lib/commands/deviceCommands.tsx**: executeThermostatAction fetches /api/v1/netatmo/\${endpoint}; 3 callers pass 'setthermmode' (latent hyphen bug fixed, RESEARCH Risk 9)
- **app/api/v1/netatmo/camera/[cameraId]/snapshot/route.ts**: NextResponse.redirect(snapshot_url, 302) replaces JSON response; co-located test updated to assert 302 + Location header
- **useThermostatData**: checkConnection unwraps data.body.homes[0]; fetchStatus reads v1 rooms (therm_setpoint_temperature → setpoint, heating_power_request > 0 → heating)
- **useScheduleData**: D-04 endpoint-drop rewrite — fetches /homesdata, extracts schedules from body.homes[0].schedules
- **useRoomStatus**: maps v1 /homestatus rooms (same renames as useThermostatData; mode/endtime null-fallback with explicit code comments)
- **registry/devices/page.tsx**: netatmo case unwraps json.body.homes[0].modules
- **CameraCard + CameraDashboard**: monitoring POST uses CAMERA_ROUTES.monitoring(cameraId) function-call form; body drops camera_id; cache-bust uses `?t=${Date.now()}` prefix
- **app/sw.ts**: dead `/api/netatmo/status` branch (lines 621–641) deleted; one-line breadcrumb comment left
- **3 test files (Task 4 per plan)**: page.test.tsx, ThermostatCard.schedule.test.tsx, CameraMonitoringToggle.test.tsx all swapped to v1 URLs + v1 response shapes; vacuous schedules-endpoint assertions deleted per D-04
- **Repo-wide grep sweep**: zero `/api/netatmo/` refs in app/ + lib/ + \_\_tests\_\_/ outside the legacy tree (app/api/netatmo/, \_\_tests\_\_/api/netatmo/, \_\_tests\_\_/app/api/netatmo/) and lib/version.ts changelog
- **2 Rule 1 auto-fixes** (caught by Task 4 Jest matrix): jest.setup.ts NextResponseMock gained static .redirect(); useScheduleData + useThermostatData Test 13b fixtures updated to v1 raw-proxy shape

## Task Commits

Each task was committed atomically:

1. **Task 1:** Rewrite lib/routes.ts NETATMO_ROUTES+CAMERA_ROUTES to v1 + fix command-palette hyphen bug + rewrite v1 camera snapshot route as 302 redirect — `a679f0ff` (refactor)
2. **Task 2:** Rewrite useThermostatData + useScheduleData + registry/devices netatmo case for v1 response shapes — `689f34e0` (refactor)
3. **Task 2E:** Rewrite useRoomStatus to map v1 /homestatus shape — `77836b06` (refactor)
4. **Task 3:** Camera consumers path-segment monitoring + cache-bust fix + sw.ts dead branch delete + JSDoc updates — `b1977adb` (refactor)
5. **Task 4:** Rewrite 3 test files to v1 URLs + drop legacy schedules assertions — `8974f9fe` (refactor)
6. **Rule 1 deviation fix:** NextResponse.redirect mock + v1 shape in pre-existing tests — `f4239761` (fix)

## Files Created/Modified

### Production code

- `lib/routes.ts` — NETATMO_ROUTES all v1; schedules key deleted; CAMERA_ROUTES.monitoring now `(cameraId) => string` function; stream/snapshot path-segment
- `lib/commands/deviceCommands.tsx` — executeThermostatAction body URL v1; 3 callers pass 'setthermmode' (hyphen fix)
- `lib/hooks/useScheduleData.ts` — endpoint-drop rewrite: reads NETATMO_ROUTES.homesData; extracts body.homes[0].schedules
- `lib/hooks/useRoomStatus.ts` — rooms[i].setpoint ← therm_setpoint_temperature; heating ← heating_power_request > 0; mode/endtime null-fallback
- `app/api/v1/netatmo/camera/[cameraId]/snapshot/route.ts` — NextResponse.redirect(snapshot_url, 302)
- `app/components/devices/thermostat/hooks/useThermostatData.ts` — checkConnection body.homes[0] unwrap; fetchStatus v1 field map
- `app/components/devices/camera/CameraCard.tsx` — monitoring POST path-segment + body drops camera_id; `?t=` cache-bust; JSDoc updated
- `app/(pages)/camera/CameraDashboard.tsx` — same shape as CameraCard
- `app/registry/devices/page.tsx` — netatmo case unwraps json.body.homes[0].modules
- `app/sw.ts` — dead /api/netatmo/status branch deleted + breadcrumb comment

### Test code

- `app/api/v1/netatmo/camera/[cameraId]/snapshot/__tests__/route.test.ts` — updated in Task 1 commit to assert 302 + Location header
- `app/thermostat/page.test.tsx` — mock NETATMO_ROUTES to v1; fetch-called-with assertion v1; mock bodies v1 raw-proxy shape
- `__tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx` — 4 urlString.includes() checks v1; mock bodies v1 shape; switchHomeSchedule assertion v1; DELETE vacuous (NETATMO_ROUTES as any).schedules assertion + schedulePostCall guard block
- `__tests__/app/components/devices/camera/CameraMonitoringToggle.test.tsx` — harness + 2 assertions use /api/v1/netatmo/camera/cam-1/monitoring path-segment; body drops camera_id
- `lib/hooks/__tests__/useScheduleData.test.ts` — SCHEDULES_PAYLOAD fixture updated to v1 raw-proxy shape (Rule 1 fix)
- `app/components/devices/thermostat/hooks/__tests__/useThermostatData.test.ts` — Test 13b topology fetch mock updated to v1 shape (Rule 1 fix)
- `jest.setup.ts` — added nextResponseRedirectImpl + static .redirect on NextResponseMock + afterEach restore (Rule 1 fix)

## Decisions Made

- **302 redirect over <img src> rewrite (Q3):** The v1 snapshot route now returns `NextResponse.redirect(snapshot_url, { status: 302, headers: { 'Cache-Control': 'no-cache, no-store' } })`. Browsers follow the redirect to the Netatmo CDN and load the JPEG directly, preserving `<img src={CAMERA_ROUTES.snapshot(id)}>` compatibility without touching any consumer. Auth gate still runs before the redirect, so security posture is unchanged.
- **schedules endpoint drop (D-04):** No v1 equivalent exists for GET /schedules. Schedules are embedded in the /homesdata response body. useScheduleData was rewritten to read NETATMO_ROUTES.homesData (now v1) and extract schedules from body.homes[0].schedules. The legacy `schedules` key was removed from NETATMO_ROUTES entirely (ALL consumers would get a TypeScript compilation error if they still referenced it — fail-loud safety feature).
- **calibrate semantic-mapping (D-04):** Plan-level decision was to map legacy `/api/netatmo/calibrate` to v1 `/api/v1/netatmo/valves/calibrate` (not a bare prefix swap — the endpoint moved under /valves/ collection in v1).
- **Rule 1 NextResponse.redirect mock:** Task 1's route-handler change broke its co-located route.test.ts because `jest.setup.ts`'s `NextResponseMock` only had static `.json()` — not `.redirect()`. Added `nextResponseRedirectImpl` that builds a shim Response with status + headers.set('location', url) + afterEach restore (to survive `jest.clearAllMocks()` that clears the mock.fn wrapper).
- **Rule 1 v1 shape in consumer tests:** Task 2 rewrote useScheduleData + useThermostatData to unwrap the v1 raw-proxy shape, but `lib/hooks/__tests__/useScheduleData.test.ts` `SCHEDULES_PAYLOAD` fixture and `useThermostatData.test.ts` Test 13b topology mock still used legacy flat shape, causing the hooks to read empty topology and the low-battery enrichment to return undefined. Updated both fixtures to v1 shape.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] NextResponse.redirect not in jest.setup mock**

- **Found during:** Task 4 Jest matrix run
- **Issue:** `app/api/v1/netatmo/camera/[cameraId]/snapshot/__tests__/route.test.ts` failed with `_server.NextResponse.redirect is not a function` → 500 returned instead of 302. Cause: jest.setup.ts's `NextResponseMock` provides static `.json()` only. Task 1 Edit 1D switched the route from `NextResponse.json(...)` to `NextResponse.redirect(...)`, but the mock was never updated.
- **Fix:** Added `nextResponseRedirectImpl` (mirrors Next.js `NextResponse.redirect(url, init?)` signature — accepts either status number or init object with `{ status, headers }`, returns a shim Response with status + headers.set('location', url.toString()) + async json). Added afterEach restore to survive jest.clearAllMocks().
- **Files modified:** `jest.setup.ts`
- **Commit:** `f4239761`

**2. [Rule 1 - Bug] useScheduleData test fixture using legacy shape**

- **Found during:** Task 4 Jest matrix run
- **Issue:** `lib/hooks/__tests__/useScheduleData.test.ts` `SCHEDULES_PAYLOAD` fixture returned `{ success: true, schedules: [...], home_id: 'home123', _source: 'api' }` (legacy flat shape). Task 2 rewrote `useScheduleData` to unwrap v1 raw-proxy shape `data.body?.homes?.[0]?.schedules`, so fixture became incompatible. 4 tests failed with empty schedules array.
- **Fix:** Updated fixture to v1 raw-proxy shape `{ body: { homes: [{ id: 'home123', schedules: [...] }] } }`. All 8 tests pass (including 503 retry + 429 rate-limit + unmount cleanup).
- **Files modified:** `lib/hooks/__tests__/useScheduleData.test.ts`
- **Commit:** `f4239761`

**3. [Rule 1 - Bug] useThermostatData Test 13b mock using legacy shape**

- **Found during:** Task 4 Jest matrix run
- **Issue:** Test 13b ("WS low-battery modules enriched with name/type from topology") mocked the topology fetch with `{ home_id: 'h1', home_name: 'Home', modules: [{...}] }` (legacy shape). Task 2 rewrote checkConnection to unwrap `data.body.homes[0]`, so the topology stayed empty and the lowBatteryModules enrichment (which looks up module name/type from topology) returned undefined.
- **Fix:** Updated mock to v1 raw-proxy shape `{ body: { homes: [{ id, name, rooms, modules, schedules }] } }`. Test passes; all 18 useThermostatData tests green.
- **Files modified:** `app/components/devices/thermostat/hooks/__tests__/useThermostatData.test.ts`
- **Commit:** `f4239761`

### Out-of-Scope (Deferred)

**[Pre-existing test infrastructure rot — not caused by Plan 168-02]**

The following 8 Jest failures exist at HEAD (verified by stashing my Task 4 edits — failures reproduce identically) and are caused by earlier phases that added React context usage to production code without updating the test wrappers:

- `app/thermostat/page.test.tsx` — 4 failures: `useWebSocketContext must be used within a WebSocketProvider` (introduced by Phase 143-02 WS integration; page.test.tsx never wrapped NetatmoPage in a WebSocketProvider)
- `__tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx` — 4 failures: `useOnlineStatusContext must be used within OnlineStatusProvider` (introduced by commit 17b58d94 singleton OnlineStatusContext; schedule.test never wrapped ThermostatCard in an OnlineStatusProvider)

Per the scope boundary rule (only auto-fix issues directly caused by the current plan's changes), these are out of scope for Plan 168-02. The acceptance criteria for Task 4 that DO belong to this plan (v1 URL swaps, v1 shape fixtures, dropped assertions) are all satisfied — the 4 ThermostatCard.schedule failures specifically fail BEFORE the test body runs (at render time during `render(<ThermostatCard />)`), so my Task 4 edits to those tests' inner assertions can't affect the outcome.

Logged in `.planning/phases/168-netatmo-frontend-cutover/168-DEFERRED.md` style note if maintainers want to track this for a future test-harness phase.

## Issues Encountered

None — no blockers. Two authentication-gate-adjacent surprises that turned out to be Rule 1 fixes in the same phase:

1. The `NextResponse.redirect` mock gap surfaced only when the snapshot route test was actually executed (Task 1 landed the route change but the co-located test was regressed; Task 4's full Jest matrix caught it).
2. The legacy SCHEDULES_PAYLOAD + useThermostatData Test 13b fixtures didn't surface in Task 2 because those tests import the HOOK directly, not through the Task 2 consumer (registry/devices/page.tsx). Task 4's broader Jest run exposed them.

Both are legitimate Rule 1 auto-fixes (caused by this plan's own Task 1/Task 2 edits, not pre-existing rot).

## Performance Metrics

- **Task commits:** 6 (5 task commits + 1 Rule 1 deviation commit)
- **Auto-fix retries per task:** 0 on Tasks 1–3; 2 Rule 1 fixes for Task 4 (both landed in one commit)
- **Grep-sweep final state:** 0 `/api/netatmo/` refs in app/ + lib/ outside app/api/netatmo/ (legacy tree for Plan 03 deletion) and lib/version.ts changelog
- **Jest matrix final state:** 35/37 suites green, 379/387 tests green; 8 remaining failures are pre-existing (4 missing WebSocketProvider + 4 missing OnlineStatusProvider) and confirmed NOT caused by this plan

## Self-Check: PASSED

- [x] SUMMARY.md created at `.planning/phases/168-netatmo-frontend-cutover/168-02-SUMMARY.md`
- [x] All 6 task commits verified in `git log` (a679f0ff, 689f34e0, 77836b06, b1977adb, 8974f9fe, f4239761)
- [x] All 17 modified files exist on disk (grep sweep + jest run both reference them successfully)
- [x] Final grep sweep returns zero matches in production surface (excluding legacy tree scoped for Plan 03)
- [x] Task 4 Jest matrix green for all test files rewritten by this plan
- [x] Rule 1 auto-fixes documented as deviations with clear Task/commit traceability

## Threat Flags

None. All files modified were listed in the plan's `<files_modified>` frontmatter and covered by the plan's STRIDE threat register. The Rule 1 fix to jest.setup.ts adds a static method to an existing mock; zero production surface impact.

## Known Stubs

None. All data flows are live-wired to v1 endpoints. Schedules continue to render through the existing UI via the useScheduleData → body.homes[0].schedules extraction path.
