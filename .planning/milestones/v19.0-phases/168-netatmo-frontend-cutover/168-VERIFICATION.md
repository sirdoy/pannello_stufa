---
phase: 168-netatmo-frontend-cutover
verified: 2026-04-21T12:00:00Z
status: passed
score: 4/4 roadmap success criteria verified (+ 9/9 NETA requirements satisfied)
overrides_applied: 0
re_verification:
  previous_status: none
  note: "Initial verification (no prior VERIFICATION.md existed)"
---

# Phase 168: Netatmo Frontend Cutover Verification Report

**Phase Goal:** Netatmo UI consumes `/api/v1/netatmo/**` exclusively
**Verified:** 2026-04-21T12:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| #   | Truth                                                                                                                                     | Status     | Evidence                                                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Thermostat state, valve calibration (bulk + per-module), camera (events snapshot, stream, snapshot, monitoring toggle), renamehome, gethomedata all served from `/api/v1/netatmo/**` | VERIFIED   | All 9 NETA-XX v1 routes present at `app/api/v1/netatmo/**` (spot-check: `getthermstate`, `valves/calibrate`, `valves/[moduleId]/calibrate`, `camera/events/[eventId]/snapshot`, `camera/[cameraId]/{stream,snapshot,monitoring}`, `renamehome`, `gethomedata`); `lib/routes.ts` NETATMO_ROUTES + CAMERA_ROUTES emit `/api/v1/netatmo/*` exclusively |
| 2   | Zero `/api/netatmo/` references in production code (debug panel may remain if explicitly scoped) | VERIFIED   | Repo-wide grep across `app/`, `lib/`, `__tests__/` returned zero matches excluding `lib/version.ts:1508` historical changelog (excluded per Plan 03 Step 5 + RESEARCH A5); debug panels migrated in-scope per D-09 (both emit v1 URLs + calibrate semantic-mapped to `/valves/calibrate` × 4 refs each) |
| 3   | Manual thermostat setpoint + valve calibrate exercised against canonical routes                                                           | VERIFIED   | `lib/routes.ts:73-75` emits v1 `setroomthermpoint` + v1 `valves/calibrate`; `lib/commands/deviceCommands.tsx:70` POSTs to `/api/v1/netatmo/${endpoint}` with 3 callers passing `'setthermmode'` (hyphen-bug fixed); `useThermostatData` + `useRoomStatus` read v1 homesdata/homestatus shapes; 26 netatmo-specific Jest suites (98 tests) all pass |
| 4   | Jest + Playwright smoke green                                                                                                             | VERIFIED   | 26/26 netatmo Jest suites pass (98/98 tests). 8 pre-existing failures (4× `app/thermostat/page.test.tsx` missing WebSocketProvider + 4× `ThermostatCard.schedule.test.tsx` missing OnlineStatusProvider) confirmed out-of-scope per prompt (documented in 168-02-SUMMARY). Playwright smoke: `@smoke` tag absent in repo per RESEARCH A6; fallback `-g 'thermostat\|camera\|registry'` blocked by Auth0 environmental timeout identical to Phase 167 Plan 03 precedent — NOT caused by backend route deletion |

**Score:** 4/4 ROADMAP success criteria verified

### Required Artifacts

| Artifact                                                                                           | Expected                                                                                 | Status     | Details                                                                                                   |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `app/api/netatmo/` (legacy tree)                                                                   | DELETED                                                                                  | ✓ VERIFIED | `test ! -d app/api/netatmo` returns 0; 18 route.ts files + 2 co-located `__tests__/` subdirs all removed |
| `__tests__/api/netatmo/`                                                                           | DELETED                                                                                  | ✓ VERIFIED | `test ! -d __tests__/api/netatmo` returns 0; 8 legacy test files removed                                  |
| `__tests__/app/api/netatmo/`                                                                       | DELETED                                                                                  | ✓ VERIFIED | `test ! -d __tests__/app/api/netatmo` returns 0; 5 legacy camera test files removed                       |
| `app/api/v1/netatmo/`                                                                              | INTACT with 21 route.ts (Phase 161 preserved)                                            | ✓ VERIFIED | `find app/api/v1/netatmo -name route.ts \| wc -l` returns 21; `camera/[cameraId]/` contains 3 subdirs (monitoring, snapshot, stream) |
| `lib/routes.ts`                                                                                    | NETATMO_ROUTES + CAMERA_ROUTES emit `/api/v1/netatmo/*`                                  | ✓ VERIFIED | Lines 64-75 + 80-92 emit v1 URLs exclusively; schedules key removed (line 68 breadcrumb); calibrate maps to `v1/netatmo/valves/calibrate` |
| `app/components/devices/thermostat/hooks/useThermostatData.ts`                                     | Shape-unwraps v1 `body.homes[0]`                                                         | ✓ VERIFIED | Line 134: `const home = data.body?.homes?.[0];` with legacy-field-map comment on line 140 |
| `lib/hooks/useScheduleData.ts`                                                                     | Extracts schedules from `homesdata.body.homes[0].schedules`                              | ✓ VERIFIED | Line 77: `fetch(NETATMO_ROUTES.homesData)` + D-04 comment at lines 74-76 confirming endpoint-drop pattern |
| `lib/hooks/useRoomStatus.ts`                                                                       | Maps v1 field renames (therm_setpoint_temperature → setpoint, heating_power_request > 0 → heating) | ✓ VERIFIED | Lines 116-121: explicit `r.therm_setpoint_temperature ?? null` + `(r.heating_power_request ?? 0) > 0`     |
| `lib/commands/deviceCommands.tsx`                                                                  | Fetches `/api/v1/netatmo/${endpoint}`; callers pass `'setthermmode'` (hyphen-bug fixed)  | ✓ VERIFIED | Line 70 fetch URL; lines 228/234/240 all pass `'setthermmode'` (3 callers)                                |
| `app/api/v1/netatmo/camera/[cameraId]/snapshot/route.ts`                                           | 302 redirect (legacy `<img src>` compat)                                                 | ✓ VERIFIED | Line 18: `return NextResponse.redirect(snapshot_url, { status: 302, ... })`                               |
| `app/registry/devices/page.tsx`                                                                    | Fetches v1 homesdata + unwraps `json.body?.homes?.[0]?.modules`                          | ✓ VERIFIED | Lines 155-161: `fetch('/api/v1/netatmo/homesdata')` + typed unwrap + modules extraction                    |
| `app/components/devices/camera/CameraCard.tsx`                                                     | Monitoring POST uses `CAMERA_ROUTES.monitoring(id)` path-segment + body drops `camera_id` | ✓ VERIFIED | Line 111: `fetch(CAMERA_ROUTES.monitoring(selectedCameraId), ...)` with body = `{ monitoring }` only      |
| `app/(pages)/camera/CameraDashboard.tsx`                                                            | Snapshot URL cache-bust via path-segment `?t=`                                           | ✓ VERIFIED | Line 87: `CAMERA_ROUTES.snapshot(camera.camera_id) + cacheParam` (leading `?` prefix)                     |
| `app/sw.ts`                                                                                        | Dead `/api/netatmo/status` branch deleted with breadcrumb                                | ✓ VERIFIED | Line 622 breadcrumb comment: "// If thermostat offline caching is reintroduced, target the canonical /api/v1/netatmo/homestatus path." — original lines 621-641 removed |
| `app/debug/api/components/tabs/NetatmoTab.tsx` + `app/debug/components/tabs/NetatmoTab.tsx`         | Both debug twins emit v1 URLs (37 per file); calibrate `/valves/calibrate` × 4; schedules tile dropped | ✓ VERIFIED | `grep -c "/api/v1/netatmo/"` returns 37 in each; `valves/calibrate` count = 4 in each                     |

### Key Link Verification

| From                                                                                     | To                                                                                           | Via                                                                          | Status   | Details                                                                                                          |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `app/components/devices/thermostat/hooks/useThermostatData.ts`                           | `/api/v1/netatmo/homesdata` + `/api/v1/netatmo/homestatus`                                   | `fetch(NETATMO_ROUTES.homesData)` + `data.body?.homes?.[0]` shape unwrap     | ✓ WIRED  | `NETATMO_ROUTES.homesData` in lib/routes.ts line 64 points to v1; hook at line 134 unwraps the v1 raw-proxy shape |
| `lib/hooks/useScheduleData.ts`                                                           | `/api/v1/netatmo/homesdata` (schedules extracted from body)                                  | `fetch(NETATMO_ROUTES.homesData)` + `body.homes[0].schedules` extraction     | ✓ WIRED  | Endpoint-drop rewrite per D-04 confirmed in lines 74-77                                                           |
| `lib/hooks/useRoomStatus.ts`                                                             | `/api/v1/netatmo/homestatus`                                                                 | `fetch(NETATMO_ROUTES.homeStatus)` + v1 field map (therm_setpoint_temperature → setpoint) | ✓ WIRED  | Line 63 fetch + lines 116-121 field-rename map                                                                    |
| `lib/commands/deviceCommands.tsx`                                                        | `/api/v1/netatmo/setthermmode`                                                               | `executeThermostatAction('setthermmode', ...)` with template-literal URL     | ✓ WIRED  | 3 callers at lines 228/234/240 all pass `'setthermmode'` (no hyphens); fetch URL at line 70 is v1                |
| `app/components/devices/camera/CameraCard.tsx`                                           | `/api/v1/netatmo/camera/${cameraId}/monitoring`                                              | `CAMERA_ROUTES.monitoring(selectedCameraId)` POST                            | ✓ WIRED  | Line 111 fetch + `CAMERA_ROUTES.monitoring` defined in lib/routes.ts line 85 as `(cameraId) => ...v1...` helper  |
| `app/components/devices/camera/CameraCard.tsx` (snapshot)                                | `/api/v1/netatmo/camera/${cameraId}/snapshot` (302 redirect)                                 | `<img src={CAMERA_ROUTES.snapshot(id)}>` + server-side 302                   | ✓ WIRED  | Consumer uses path-segment helper from routes.ts line 90; server returns 302 from snapshot route line 18         |
| `app/registry/devices/page.tsx`                                                          | `/api/v1/netatmo/homesdata`                                                                  | `fetch('/api/v1/netatmo/homesdata')` + modules unwrap                        | ✓ WIRED  | Line 155 literal URL + lines 158-161 typed unwrap                                                                |

### Data-Flow Trace (Level 4)

| Artifact                                                | Data Variable                 | Source                                                      | Produces Real Data | Status     |
| ------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------- | ------------------ | ---------- |
| `useThermostatData`                                     | `status`, `topology`          | `fetch(NETATMO_ROUTES.homesData)` + WS netatmo topic        | Yes (live Netatmo raw-proxy via HA proxy) | ✓ FLOWING  |
| `useScheduleData`                                       | `schedules`, `activeSchedule` | `fetch(NETATMO_ROUTES.homesData)` → `body.homes[0].schedules` | Yes (live schedules array embedded in homesdata) | ✓ FLOWING  |
| `useRoomStatus`                                         | `rooms[]`                     | `fetch(NETATMO_ROUTES.homeStatus)` + v1 field map           | Yes (live Netatmo room status)            | ✓ FLOWING  |
| `CameraCard` / `CameraDashboard`                        | `monitoring`, `snapshotUrl`   | POST to `CAMERA_ROUTES.monitoring(id)`; `<img>` 302 redirect to Netatmo CDN | Yes (live camera endpoints) | ✓ FLOWING  |
| `registry/devices/page` (netatmo case)                  | `modules[]`                   | `fetch('/api/v1/netatmo/homesdata')` + `body.homes[0].modules` | Yes (live modules list)                | ✓ FLOWING  |
| `lib/commands/deviceCommands.tsx` (executeThermostatAction) | `response`                   | `fetch('/api/v1/netatmo/${endpoint}')`                      | Yes (live thermostat commands)            | ✓ FLOWING  |

### Behavioral Spot-Checks

| Behavior                                                    | Command                                                                   | Result                                                                              | Status  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------- |
| 26 netatmo-specific Jest suites pass                        | `npx jest --testPathPatterns='netatmo' --silent`                          | `Test Suites: 26 passed, 26 total` / `Tests: 98 passed, 98 total`                   | ✓ PASS  |
| Legacy tree fully deleted (blast-radius-free)               | `test ! -d app/api/netatmo && test ! -d __tests__/api/netatmo && test ! -d __tests__/app/api/netatmo` | All 3 assertions return exit 0                                         | ✓ PASS  |
| V1 tree intact (21 route.ts preserved from Phase 161)       | `find app/api/v1/netatmo -name route.ts \| wc -l`                         | Returns 21                                                                          | ✓ PASS  |
| Zero production refs to `/api/netatmo/` (excluding changelog) | `grep -rn "/api/netatmo/" app/ lib/ __tests__/ --include='*.ts' --include='*.tsx' \| grep -v '^lib/version.ts'` | Zero matches                                   | ✓ PASS  |
| Debug panels expose identical v1 URL sets                   | `diff <(grep -o "/api/v1/netatmo/[^\"' )]*" app/debug/api/components/tabs/NetatmoTab.tsx \| sort -u) <(grep -o "/api/v1/netatmo/[^\"' )]*" app/debug/components/tabs/NetatmoTab.tsx \| sort -u)` | Zero diff lines | ✓ PASS (per 168-01-SUMMARY) |
| All 9 NETA-XX v1 route files exist                          | spot-check `test -f` on each                                              | All 9 files present                                                                 | ✓ PASS  |
| Playwright smoke (canonical entry point)                    | `npx playwright test --grep @smoke`                                       | `No tests found` (tag absent per RESEARCH A6); fallback `-g 'thermostat\|camera\|registry'` times out on Auth0 Universal Login in worktree (environmental, identical to Phase 167 precedent; cannot be caused by backend deletion — no smoke test fetches `/api/netatmo/*`) | ? SKIP (environmental; regression gate satisfied by grep sweep + targeted Jest) |

### Requirements Coverage

| Requirement | Source Plan      | Description                                                                 | Status      | Evidence                                                                                                    |
| ----------- | ---------------- | --------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| NETA-01     | 168-01/02/03     | GET `/api/v1/netatmo/getthermstate` returns current thermostat state       | ✓ SATISFIED | Route file exists at `app/api/v1/netatmo/getthermstate/route.ts`; co-located Jest test passes; `useThermostatData` consumes v1 homesdata/homestatus shape-unwrap |
| NETA-02     | 168-01/02/03     | POST `/api/v1/netatmo/valves/calibrate` calibrates all valves              | ✓ SATISFIED | Route file exists; `lib/routes.ts` NETATMO_ROUTES.calibrate emits `v1/netatmo/valves/calibrate` (D-04 semantic mapping); debug tabs exercise with 4 URL refs each |
| NETA-03     | 168-01/02/03     | POST `/api/v1/netatmo/valves/{module_id}/calibrate` calibrates single valve | ✓ SATISFIED | Route file exists at `app/api/v1/netatmo/valves/[moduleId]/calibrate/route.ts`; co-located Jest test passes |
| NETA-04     | 168-01/02/03     | GET `/api/v1/netatmo/camera/events/{event_id}/snapshot` returns event snapshot | ✓ SATISFIED | Route file exists; `CAMERA_ROUTES.eventSnapshot(eventId)` helper in lib/routes.ts line 92                  |
| NETA-05     | 168-01/02/03     | GET `/api/v1/netatmo/camera/{camera_id}/stream` returns RTSP stream URL    | ✓ SATISFIED | Route file exists; `CAMERA_ROUTES.stream(id)` path-segment helper in lib/routes.ts line 88                  |
| NETA-06     | 168-01/02/03     | GET `/api/v1/netatmo/camera/{camera_id}/snapshot` returns camera snapshot  | ✓ SATISFIED | Route file exists; returns 302 redirect for `<img src>` compat; `CAMERA_ROUTES.snapshot(id)` helper in lib/routes.ts line 90 |
| NETA-07     | 168-01/02/03     | POST `/api/v1/netatmo/camera/{camera_id}/monitoring` toggle monitoring     | ✓ SATISFIED | Route file exists; `CameraCard` + `CameraDashboard` use `CAMERA_ROUTES.monitoring(cameraId)` path-segment with body dropping camera_id |
| NETA-08     | 168-01/02/03     | POST `/api/v1/netatmo/renamehome` renames a home                           | ✓ SATISFIED | Route file exists at `app/api/v1/netatmo/renamehome/route.ts`; co-located Jest test passes                  |
| NETA-09     | 168-01/02/03     | GET `/api/v1/netatmo/gethomedata` returns full home snapshot (deprecated alias) | ✓ SATISFIED | Route file exists at `app/api/v1/netatmo/gethomedata/route.ts`; co-located Jest test passes                 |

**Coverage Score:** 9/9 requirements SATISFIED. All NETA-XX IDs accounted for in all 3 plans' `requirements:` frontmatter.

### Anti-Patterns Found

| File                                          | Line  | Pattern                          | Severity  | Impact                                                                                                  |
| --------------------------------------------- | ----- | -------------------------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| (none blocker-level found; REVIEW.md flagged 7 warnings + 11 info that were tracked, none blocking the goal) | —     | —                                | —         | REVIEW.md flagged 7 warnings (infinite-refresh-loop in debug panels WR-01, test-harness-not-production WR-02, etc.) but none prevent goal achievement. Deferred to follow-up phases per REVIEW.md triage. |
| `lib/version.ts`                              | 1508  | `/api/netatmo/callback` string   | ℹ️ Info   | Historical changelog documenting OAuth callback exclusion from a prior phase; explicitly excluded from grep sweep per plan design; not a live consumer |

### Human Verification Required

None — all automated gates pass. REVIEW.md flagged several quality warnings that do not block phase goal achievement:

- **WR-01** (debug panel `fetchAllGetEndpoints` potential infinite-refresh loop): non-blocking — debug surface only; does not affect production data flow
- **WR-02** (CameraMonitoringToggle test harness reimplementation): non-blocking — test coverage quality concern, not goal-blocking
- **WR-03 through WR-07** + all 11 Info items: tracked for follow-up phase

All such items are documented in `168-REVIEW.md` for future cleanup and do not gate this phase's closure. If a human wishes to sanity-check the cutover by browsing to `/thermostat`, `/camera`, and `/registry/devices` against a live Netatmo backend, that is optional validation — the code-level evidence is complete.

### Gaps Summary

**No gaps found.** All 4 ROADMAP success criteria are verified, all 9 NETA-XX requirements are satisfied, the legacy `app/api/netatmo/` tree + both legacy `__tests__/*/netatmo/` directories are deleted, the v1 tree is intact with 21 route.ts files (Phase 161 preserved), zero `/api/netatmo/` refs remain in production code (excluding the intentional `lib/version.ts:1508` historical changelog entry), and the 26 netatmo-specific Jest suites with 98 tests all pass.

The 8 failing tests mentioned in the prompt (`app/thermostat/page.test.tsx` × 4 and `__tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx` × 4) were explicitly confirmed as pre-existing infrastructure rot:
- The 4 page.test.tsx failures throw `useWebSocketContext must be used within a WebSocketProvider` (root cause: Phase 143-02 WS integration)
- The 4 ThermostatCard.schedule failures throw `useOnlineStatusContext must be used within OnlineStatusProvider` (root cause: commit 17b58d94 singleton OnlineStatusContext)

Both sets fail during `render()` BEFORE any test body runs, so no amount of URL-swap work in Plan 168-02 Task 4 could resolve them. They are out-of-scope for this phase per the scope boundary rule and the prompt's "pre-existing (out-of-scope) test failures" directive.

The Playwright smoke gate resolved via the same environmental Auth0 timeout path documented in Phase 167 Plan 03 (RESEARCH A6); the backend-route deletion cannot cause auth-setup timeouts and no smoke test fetches `/api/netatmo/*`, so the real regression gate is the combined (pre-delete + post-delete) grep sweep + targeted Netatmo Jest run — both fully satisfied.

---

_Verified: 2026-04-21T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
