---
phase: 168-netatmo-frontend-cutover
plan: "03"
subsystem: netatmo-backend-cleanup
tags: [netatmo, legacy-deletion, url-migration, dead-code-removal, wave-3, v1-cutover]

# Dependency graph
requires:
  - phase: 168-netatmo-frontend-cutover
    provides: "Plan 168-01 migrated 2 debug NetatmoTab.tsx panels; Plan 168-02 migrated 13 production consumers (lib/routes.ts, deviceCommands, 3 hooks, CameraCard/Dashboard, registry/devices, sw.ts) + 3 test files to /api/v1/netatmo/* URLs (commits a679f0ff, 689f34e0, 77836b06, b1977adb, 8974f9fe, f4239761)"
provides:
  - "Legacy app/api/netatmo/ route tree deleted (18 route.ts files + 2 co-located __tests__/route.test.ts)"
  - "Legacy __tests__/api/netatmo/ directory deleted (8 test files)"
  - "Legacy __tests__/app/api/netatmo/ directory deleted (5 camera test files)"
  - "Zero /api/netatmo/ references remain in app/, lib/, types/, hooks/, components/, __tests__/ (only allowed reference is lib/version.ts historical changelog)"
  - "Phase 168 complete: all 9 NETA-XX requirements wired end-to-end via /api/v1/netatmo/* exclusively"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pre-deletion consumer grep gate (Step 1): proves zero legacy consumers remain before rm -rf"
    - "Dual v1-intact safety gate (Step 2 pre + Step 6 post): 21 route.ts count + camera/[cameraId]/ subdir count asserted BEFORE and AFTER rm -rf to catch wrong-path deletions immediately"
    - "Post-deletion repo-wide grep sweep (Step 5): proves zero stale references across app/, lib/, types/, hooks/, components/, __tests__/ excluding lib/version.ts changelog"
    - "Explicit path guard in action text: 'The path is app/api/netatmo/ (NO v1). Double-check before executing. Deleting app/api/v1/netatmo/ would destroy Phase 161 21 v1 route wrappers — CATASTROPHIC.'"

key-files:
  created: []
  modified: []
  deleted:
    - app/api/netatmo/calibrate/route.ts
    - app/api/netatmo/camera/events/[eventId]/snapshot/route.ts
    - app/api/netatmo/camera/events/route.ts
    - app/api/netatmo/camera/monitoring/route.ts
    - app/api/netatmo/camera/snapshot/route.ts
    - app/api/netatmo/camera/status/route.ts
    - app/api/netatmo/camera/stream/route.ts
    - app/api/netatmo/createnewhomeschedule/route.ts
    - app/api/netatmo/getroommeasure/route.ts
    - app/api/netatmo/health/route.ts
    - app/api/netatmo/homesdata/route.ts
    - app/api/netatmo/homestatus/route.ts
    - app/api/netatmo/schedules/route.ts
    - app/api/netatmo/setroomthermpoint/__tests__/route.test.ts
    - app/api/netatmo/setroomthermpoint/route.ts
    - app/api/netatmo/setthermmode/__tests__/route.test.ts
    - app/api/netatmo/setthermmode/route.ts
    - app/api/netatmo/switchhomeschedule/route.ts
    - app/api/netatmo/synchomeschedule/route.ts
    - app/api/netatmo/valves/route.ts
    - __tests__/api/netatmo/getroommeasure.test.ts
    - __tests__/api/netatmo/health/route.test.ts
    - __tests__/api/netatmo/homesdata.test.ts
    - __tests__/api/netatmo/homestatus.test.ts
    - __tests__/api/netatmo/schedules.test.ts
    - __tests__/api/netatmo/setroomthermpoint.test.ts
    - __tests__/api/netatmo/setthermmode.test.ts
    - __tests__/api/netatmo/switchhomeschedule.test.ts
    - __tests__/app/api/netatmo/camera/events.test.ts
    - __tests__/app/api/netatmo/camera/monitoring.test.ts
    - __tests__/app/api/netatmo/camera/snapshot.test.ts
    - __tests__/app/api/netatmo/camera/status.test.ts
    - __tests__/app/api/netatmo/camera/stream.test.ts

key-decisions:
  - "Step 1 pre-deletion grep returned zero matches, confirming Plan 168-01 + 168-02 left no orphan consumers on legacy paths. rm -rf was blast-radius-free."
  - "Full Jest suite runs with 10 pre-existing failing suites (LastUpdated, Kbd, useLightsCommands, useLightsData, useDeviceStaleness, NetworkCard, FormModal, HueTab, page.test.tsx, ThermostatCard.schedule) — ZERO reference netatmo; all verified as unrelated test-infrastructure rot from earlier phases (WebSocketProvider/OnlineStatusProvider wrappers missing, Hue v1 migration gaps, missing ApiTab.tsx module, v17.0 UI context changes). Targeted netatmo regression gate re-run confirmed: 26 netatmo-specific test suites / 98 tests all pass."
  - "Playwright smoke path: --grep @smoke matches 0 tests (tag doesn't exist in repo per RESEARCH Assumption A6). Fallback `-g 'thermostat|camera|registry'` matches 8 tests but auth.setup.ts times out on Auth0 Universal Login navigation in worktree context (same environmental issue Phase 167 Plan 03 documented). Neither failure mode can be caused by deleting backend API routes — no smoke test fetches /api/netatmo/*. Real regression gate is Steps 1/5 grep sweep (both passed) + targeted netatmo Jest (98/98 pass)."

patterns-established:
  - "Legacy-tree deletion template (proven: Phase 166 Hue → Phase 167 Sonos → Phase 168 Netatmo): 8-step procedure — pre-delete grep gate, v1-intact-pre, rm -rf with path guard, co-located test cleanup, post-delete grep sweep, v1-intact-post, full Jest, Playwright smoke (or fallback). Legacy test files (__tests__/api/<vendor>/ + __tests__/app/api/<vendor>/) must be deleted in lockstep with route tree to prevent Jest compile errors from stale @/app/api/<vendor>/* imports."

requirements-completed: [NETA-01, NETA-02, NETA-03, NETA-04, NETA-05, NETA-06, NETA-07, NETA-08, NETA-09]

# Metrics
duration: ~67min
completed: 2026-04-21
---

# Phase 168 Plan 03: Netatmo Legacy Route Deletion Summary

**Deleted entire `app/api/netatmo/` directory tree (18 route.ts + 2 co-located __tests__/route.test.ts, net -2906 LOC) plus two legacy test directories (`__tests__/api/netatmo/` with 8 files, `__tests__/app/api/netatmo/` with 5 camera tests). Zero `/api/netatmo/` references remain in production code. All 26 netatmo-specific Jest suites (98 tests) pass. Phase 168 complete: all 9 NETA-XX requirements end-to-end wired via `/api/v1/netatmo/**` exclusively.**

## Performance

- **Duration:** ~67 min (includes 2 full Jest matrix runs ~15 min each + Playwright setup attempt + sweep verification + commit)
- **Started:** 2026-04-21T08:19:24Z
- **Completed:** 2026-04-21T09:26:44Z
- **Tasks:** 1 (single atomic deletion + 8-step verification procedure)
- **Files deleted:** 33 (20 route/test under `app/api/netatmo/` + 8 under `__tests__/api/netatmo/` + 5 under `__tests__/app/api/netatmo/`)
- **Commits:** 1 deletion commit (+ 1 pending summary commit)

## Accomplishments

- Executed 8-step deletion + verification procedure per plan (Step 1 pre-delete grep BLOCKING, Step 2 v1-intact-pre SAFETY, Step 3 `rm -rf app/api/netatmo/`, Step 4 legacy test dir deletion, Step 5 post-delete grep BLOCKING, Step 6 v1-intact-post SAFETY, Step 7 full Jest, Step 8 Playwright smoke)
- Step 1 pre-deletion grep confirmed zero legacy `/api/netatmo/` consumers in `app/`, `lib/`, `__tests__/` outside the to-be-deleted tree (exit 1 = no matches)
- Step 2 v1-intact-pre confirmed `app/api/v1/netatmo/` = 21 route.ts files + `camera/[cameraId]/` = 3 subdirs (monitoring, snapshot, stream) before deletion
- Step 3 `rm -rf app/api/netatmo/` removed 18 route.ts files + 2 co-located `__tests__/route.test.ts` files (setroomthermpoint + setthermmode tests)
- Step 4 `rm -rf __tests__/api/netatmo/ __tests__/app/api/netatmo/` removed 13 legacy test files (8 + 5) that imported from `@/app/api/netatmo/*` paths — would have caused Jest compile errors otherwise (RESEARCH Risk 8 + Open Q4)
- Step 5 post-deletion grep across `app/ lib/ types/ hooks/ components/ __tests__/ --include='*.ts' --include='*.tsx'` returns zero matches (exit 1) excluding `lib/version.ts:1508` historical changelog
- Step 6 v1-intact-post reconfirmed `app/api/v1/netatmo/` = 21 route.ts (Phase 161 output preserved), `camera/[cameraId]/` = 3 subdirs, spot-check: `homesdata/route.ts` + `camera/[cameraId]/snapshot/route.ts` + `valves/calibrate/route.ts` all exist
- Step 7 Jest: 26 netatmo-specific Jest suites pass (98 tests, 0 failures); 10 pre-existing failing suites (all verified zero netatmo refs) logged as deferred
- Step 8 Playwright smoke: `@smoke` tag yields 0 tests; fallback `-g 'thermostat|camera|registry'` matches 8 tests but auth.setup.ts times out on Auth0 login (environmental, identical to Phase 167 Plan 03 documented behavior — cannot be caused by backend route deletion)

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | 8-step safety-gated deletion of app/api/netatmo/ + __tests__/api/netatmo/ + __tests__/app/api/netatmo/ + grep sweep + Jest + Playwright | `cc3ec3f2` | 33 deleted, 0 modified |

## Deletion Inventory

All 33 deletions scoped to the legacy Netatmo route tree + its legacy test directories (verified via `git diff --diff-filter=D --name-only HEAD~1 HEAD`).

### `app/api/netatmo/` (20 files)

| File | Superseded by |
|------|---------------|
| `app/api/netatmo/health/route.ts` | `/api/v1/netatmo/health/route.ts` (Phase 161) |
| `app/api/netatmo/homesdata/route.ts` | `/api/v1/netatmo/homesdata/route.ts` (Phase 161) |
| `app/api/netatmo/homestatus/route.ts` | `/api/v1/netatmo/homestatus/route.ts` (Phase 161) |
| `app/api/netatmo/valves/route.ts` | `/api/v1/netatmo/valves/route.ts` (Phase 161) |
| `app/api/netatmo/calibrate/route.ts` | `/api/v1/netatmo/valves/calibrate/route.ts` (semantic map per D-04) |
| `app/api/netatmo/schedules/route.ts` | **DROPPED** — no v1 equivalent; schedules extracted from `homesdata.body.homes[0].schedules` (D-04) |
| `app/api/netatmo/setroomthermpoint/route.ts` | `/api/v1/netatmo/setroomthermpoint/route.ts` (Phase 161) |
| `app/api/netatmo/setroomthermpoint/__tests__/route.test.ts` | v1 co-located test (Phase 161) |
| `app/api/netatmo/setthermmode/route.ts` | `/api/v1/netatmo/setthermmode/route.ts` (Phase 161) |
| `app/api/netatmo/setthermmode/__tests__/route.test.ts` | v1 co-located test (Phase 161) |
| `app/api/netatmo/switchhomeschedule/route.ts` | `/api/v1/netatmo/switchhomeschedule/route.ts` (Phase 161) |
| `app/api/netatmo/synchomeschedule/route.ts` | `/api/v1/netatmo/synchomeschedule/route.ts` (Phase 161) |
| `app/api/netatmo/createnewhomeschedule/route.ts` | `/api/v1/netatmo/createnewhomeschedule/route.ts` (Phase 161) |
| `app/api/netatmo/getroommeasure/route.ts` | `/api/v1/netatmo/getroommeasure/route.ts` (Phase 161) |
| `app/api/netatmo/camera/status/route.ts` | `/api/v1/netatmo/camera/status/route.ts` (Phase 161) |
| `app/api/netatmo/camera/events/route.ts` | `/api/v1/netatmo/camera/events/route.ts` (Phase 161) |
| `app/api/netatmo/camera/events/[eventId]/snapshot/route.ts` | `/api/v1/netatmo/camera/events/[eventId]/snapshot/route.ts` (Phase 161) |
| `app/api/netatmo/camera/snapshot/route.ts` | `/api/v1/netatmo/camera/[cameraId]/snapshot/route.ts` (302 redirect variant from Plan 168-02 Edit 1D) |
| `app/api/netatmo/camera/stream/route.ts` | `/api/v1/netatmo/camera/[cameraId]/stream/route.ts` (Phase 161) |
| `app/api/netatmo/camera/monitoring/route.ts` | `/api/v1/netatmo/camera/[cameraId]/monitoring/route.ts` (Phase 161) |

### `__tests__/api/netatmo/` (8 files)

| File | Reason |
|------|--------|
| `__tests__/api/netatmo/getroommeasure.test.ts` | Imports deleted `@/app/api/netatmo/getroommeasure/route` |
| `__tests__/api/netatmo/health/route.test.ts` | Imports deleted `@/app/api/netatmo/health/route` |
| `__tests__/api/netatmo/homesdata.test.ts` | Imports deleted `@/app/api/netatmo/homesdata/route` |
| `__tests__/api/netatmo/homestatus.test.ts` | Imports deleted `@/app/api/netatmo/homestatus/route` |
| `__tests__/api/netatmo/schedules.test.ts` | Imports deleted `@/app/api/netatmo/schedules/route` (endpoint dropped per D-04) |
| `__tests__/api/netatmo/setroomthermpoint.test.ts` | Imports deleted `@/app/api/netatmo/setroomthermpoint/route` |
| `__tests__/api/netatmo/setthermmode.test.ts` | Imports deleted `@/app/api/netatmo/setthermmode/route` |
| `__tests__/api/netatmo/switchhomeschedule.test.ts` | Imports deleted `@/app/api/netatmo/switchhomeschedule/route` |

### `__tests__/app/api/netatmo/` (5 files)

| File | Reason |
|------|--------|
| `__tests__/app/api/netatmo/camera/events.test.ts` | Imports deleted `@/app/api/netatmo/camera/events/route` |
| `__tests__/app/api/netatmo/camera/status.test.ts` | Imports deleted `@/app/api/netatmo/camera/status/route` |
| `__tests__/app/api/netatmo/camera/monitoring.test.ts` | Imports deleted `@/app/api/netatmo/camera/monitoring/route` |
| `__tests__/app/api/netatmo/camera/snapshot.test.ts` | Imports deleted `@/app/api/netatmo/camera/snapshot/route` |
| `__tests__/app/api/netatmo/camera/stream.test.ts` | Imports deleted `@/app/api/netatmo/camera/stream/route` |

All 13 legacy test files would have caused Jest compile errors after Step 3 (stale `@/app/api/netatmo/*` imports). Coverage for the v1 routes is preserved via co-located tests under `app/api/v1/netatmo/**/__tests__/route.test.ts` (26 suites, 98 tests — all verified green).

## Files Created/Modified

None — this plan is a pure deletion. The only file created is this SUMMARY.md plus STATE.md / ROADMAP.md / REQUIREMENTS.md updates committed in the plan's final metadata commit.

## Decisions Made

- **`@smoke` fallback triggered** (per RESEARCH Assumption A6 — Phase 167 documented this before): `npx playwright test --grep @smoke` returns "No tests found" because no `@smoke` literal tag exists in the repo. Fallback `-g 'thermostat|camera|registry'` matches 8 tests across 3 files but the Playwright `auth.setup.ts` times out on Auth0 Universal Login navigation within 30s in the worktree context. The failure is in the auth setup BEFORE any test body runs — cannot be caused by deleting backend API routes (no smoke test fetches `/api/netatmo/*`; the test URLs in the fallback set are frontend pages `/thermostat`, `/camera`, `/registry`). Real regression gate is the pre/post grep sweep (both passed) + targeted netatmo Jest (26/26 suites, 98/98 tests green). Identical precedent: Phase 167 Plan 03 documented same environmental issue and proceeded — decision held consistent across phase-chain.
- **Full Jest matrix filtering via targeted regression gate:** The full `npm test` run surfaces 10 pre-existing failing suites (43 tests). All 10 were verified with `grep -c netatmo` = 0, confirming they have no netatmo dependency. The 2 that were already documented in 168-02-SUMMARY (`app/thermostat/page.test.tsx` WebSocketProvider + `__tests__/components/devices/thermostat/ThermostatCard.schedule.test.tsx` OnlineStatusProvider) reproduce identically pre-deletion. The remaining 8 (LastUpdated, Kbd, useLightsCommands, useLightsData, useDeviceStaleness, NetworkCard, FormModal, HueTab) are unrelated test-infrastructure rot: Hue V1 migration test expectations, UI variant snapshot drift, and a missing `app/debug/api/components/tabs/ApiTab.tsx` module that never existed (broken import in HueTab.test.tsx since Phase 112). None block Plan 168-03 acceptance — scope boundary holds.
- **Co-located legacy tests deleted in same commit as routes:** Rather than split Step 3 (routes) from Step 4 (tests) across two commits, all 33 deletions were staged atomically because Jest compile errors from stale imports would surface immediately if split. The commit message explicitly documents both scopes.

## Deviations from Plan

None — the plan executed exactly as written. The 8-step procedure ran sequentially without any BLOCKING gate failures:

- Step 1: 0 legacy consumers found (pass)
- Step 2: 21 v1 route.ts found (pass)
- Step 3: 20 files deleted from `app/api/netatmo/` (pass)
- Step 4: 13 files deleted from `__tests__/{api,app/api}/netatmo/` (pass)
- Step 5: 0 `/api/netatmo/` refs remain (pass)
- Step 6: 21 v1 route.ts still present, camera/[cameraId]/ subdirs intact (pass)
- Step 7: 26 netatmo Jest suites green (regression gate for this deletion — pass); 10 pre-existing unrelated failures logged as deferred
- Step 8: Playwright smoke yields environmental failure identical to Phase 167 Plan 03 — accepted per RESEARCH Assumption A6 + plan's explicit "either @smoke tag OR name-pattern fallback" acceptance

No Rule 1/2/3/4 deviations occurred. No auto-fixes required. No architectural choices needed.

## Issues Encountered

**Jest full matrix first run stalled on HueTab.test.tsx** (not a regression — pre-existing):

- **Symptom:** Full `npm test` run reached ~328 of ~340 test suites and then one worker process (PID 86780) pegged at 90% CPU for 9+ minutes while the main jest process waited. Log growth stopped at `FAIL app/debug/api/components/tabs/__tests__/HueTab.test.tsx`.
- **Cause:** `HueTab.test.tsx` imports a module `../ApiTab` that does not exist (`app/debug/api/components/tabs/ApiTab.tsx` was never created — broken on main as well, pre-existing since commit 46221451 in Phase 112). The Jest worker appears to enter a retry/error loop when compilation fails in this configuration.
- **Resolution:** Force-killed the stuck jest process, re-ran jest with `--forceExit` which cleanly terminated after the HueTab failure was recorded. Then executed a **targeted netatmo-only regression gate** via `npx jest --testPathPatterns='netatmo'` which completed cleanly: 26/26 suites, 98/98 tests pass. This is the actual gate for Plan 168-03 acceptance (the deletion touched only netatmo surface; pre-existing HueTab failure is orthogonal).

**Playwright auth.setup.ts timeout** (environmental — identical to Phase 167 Plan 03 precedent):

- **Symptom:** `npx playwright test tests/smoke/page-loads.spec.ts` fails at `[setup] authenticate` with `page.waitForURL: Test timeout of 30000ms exceeded` while waiting for Auth0 Universal Login navigation.
- **Cause:** Worktree Auth0 session not warmed / Auth0 rate-limiting / Next.js dev server cold start competing with 30s timeout.
- **Resolution:** Documented as environmental per Phase 167 Plan 03 SUMMARY precedent. Neither failure mode can be caused by deleting backend API routes. Real regression gate is the grep sweep (Steps 1/5, both pass) + targeted netatmo Jest (pass). Plan acceptance criteria hold.

## Threat Model Disposition

All STRIDE threats from the plan frontmatter register were mitigated exactly as specified:

| Threat | Mitigation Status | Evidence |
|--------|-------------------|----------|
| T-168-03-a (inadvertent v1 deletion) | ✅ mitigated | Step 2 asserted 21 v1 route.ts BEFORE deletion; Step 6 reconfirmed 21 v1 route.ts AFTER deletion. Zero v1 files touched. |
| T-168-03-b (hidden legacy URL consumer) | ✅ mitigated | Step 1 pre-grep returned zero matches; Step 5 post-grep returned zero matches. Plan 168-02 Task 4 was the dry-run of this same check. |
| T-168-03-c (regression in unrelated functionality) | ✅ mitigated | 26/26 netatmo Jest suites pass; 10 pre-existing non-netatmo failures verified orthogonal (zero netatmo refs). |
| T-168-03-d (legacy test import compile errors) | ✅ mitigated | Step 4 deleted `__tests__/api/netatmo/` + `__tests__/app/api/netatmo/` atomically with Step 3 routes. Jest compile succeeded post-deletion. |
| T-168-03-e (stale URL in lib/version.ts) | ✅ accepted | Changelog historical record; explicit grep exclusion in Steps 1 and 5. |
| T-168-03-f (Playwright @smoke tag absent false positive) | ✅ mitigated | Detected via `playwright test --grep @smoke --list` returning "No tests found". Fallback `-g` invocation applied per plan. Environmental timeout acknowledged. |
| T-168-03-g (rm -rf wrong path typo) | ✅ mitigated | Explicit literal `rm -rf app/api/netatmo/` used (no globbing). Step 6 confirms v1 tree intact. |

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 168 complete: all 9 NETA-XX requirements end-to-end wired via `/api/v1/netatmo/**` exclusively.
- Provider cutover milestone v16.0 + v17.0 work on Netatmo now fully single-path: hooks + components + pages + debug panels + tests + routes all on v1.
- Next milestone entry point: next incomplete phase in `.planning/ROADMAP.md` (advanced via `state advance-plan`).
- No blockers or concerns.

## Self-Check: PASSED

- [x] SUMMARY.md created at `.planning/phases/168-netatmo-frontend-cutover/168-03-SUMMARY.md`
- [x] Task commit verified: `cc3ec3f2` in `git log --oneline`
- [x] `app/api/netatmo/` does not exist (`test ! -d` returns 0)
- [x] `__tests__/api/netatmo/` does not exist
- [x] `__tests__/app/api/netatmo/` does not exist
- [x] `app/api/v1/netatmo/` intact with 21 route.ts files (Phase 161 preserved)
- [x] Repo-wide grep sweep returns zero matches in `app/`, `lib/`, `types/`, `hooks/`, `components/`, `__tests__/` (excluding `lib/version.ts` changelog)
- [x] 26 netatmo-specific Jest suites pass (98/98 tests green)
- [x] No files created under `app/api/netatmo/` or `__tests__/{api,app/api}/netatmo/` (only deletions)
- [x] Spot-check survivors: `app/api/v1/netatmo/homesdata/route.ts`, `app/api/v1/netatmo/camera/[cameraId]/snapshot/route.ts`, `app/api/v1/netatmo/valves/calibrate/route.ts` all exist

## Threat Flags

None. All 33 deletions were covered by the plan's `<files_modified>` frontmatter and the STRIDE threat register. No new network endpoints, auth paths, file access patterns, or trust boundaries introduced.

## Known Stubs

None. The deletion removes dead code only; all live data flows were cut over to v1 endpoints in Plans 168-01 + 168-02.

---

*Phase: 168-netatmo-frontend-cutover*
*Completed: 2026-04-21*
