---
phase: 160-sonos-gap-closure
plan: "01"
subsystem: api/sonos
tags: [sonos, api, v1, routes, transport, playback]
dependency_graph:
  requires: [lib/sonos/sonosProxy.ts, lib/core]
  provides: [GET /api/v1/sonos/zones/{groupId}/playback, POST /api/v1/sonos/zones/{groupId}/play, POST /api/v1/sonos/zones/{groupId}/pause, POST /api/v1/sonos/zones/{groupId}/stop, POST /api/v1/sonos/zones/{groupId}/next, POST /api/v1/sonos/zones/{groupId}/previous]
  affects: []
tech_stack:
  added: []
  patterns: [withAuthAndErrorHandler, success() spread response, HTTP_STATUS.ACCEPTED 202, getPathParam async]
key_files:
  created:
    - app/api/v1/sonos/zones/[groupId]/playback/route.ts
    - app/api/v1/sonos/zones/[groupId]/playback/__tests__/route.test.ts
    - app/api/v1/sonos/zones/[groupId]/play/route.ts
    - app/api/v1/sonos/zones/[groupId]/play/__tests__/route.test.ts
    - app/api/v1/sonos/zones/[groupId]/pause/route.ts
    - app/api/v1/sonos/zones/[groupId]/pause/__tests__/route.test.ts
    - app/api/v1/sonos/zones/[groupId]/stop/route.ts
    - app/api/v1/sonos/zones/[groupId]/stop/__tests__/route.test.ts
    - app/api/v1/sonos/zones/[groupId]/next/route.ts
    - app/api/v1/sonos/zones/[groupId]/next/__tests__/route.test.ts
    - app/api/v1/sonos/zones/[groupId]/previous/route.ts
    - app/api/v1/sonos/zones/[groupId]/previous/__tests__/route.test.ts
  modified: []
decisions:
  - "success() spreads data at top level — test assertions use data.suggested_poll_delay_s not data.data.suggested_poll_delay_s"
metrics:
  duration_minutes: 12
  completed_date: "2026-04-09"
  tasks_completed: 2
  files_created: 12
  files_modified: 0
---

# Phase 160 Plan 01: Sonos Zone Playback and Transport Routes Summary

**One-liner:** 6 v1 Sonos zone routes (1 GET playback + 5 POST transport commands) wrapping sonosProxy functions via withAuthAndErrorHandler, all returning correct status codes with 12 passing tests.

## What Was Built

6 thin API route files under `app/api/v1/sonos/zones/[groupId]/`:

| Route | Method | Status | Handler |
|-------|--------|--------|---------|
| `/api/v1/sonos/zones/{groupId}/playback` | GET | 200 | `getPlayback(groupId)` |
| `/api/v1/sonos/zones/{groupId}/play` | POST | 202 | `play(groupId)` |
| `/api/v1/sonos/zones/{groupId}/pause` | POST | 202 | `pause(groupId)` |
| `/api/v1/sonos/zones/{groupId}/stop` | POST | 202 | `stop(groupId)` |
| `/api/v1/sonos/zones/{groupId}/next` | POST | 202 | `next(groupId)` |
| `/api/v1/sonos/zones/{groupId}/previous` | POST | 202 | `previous(groupId)` |

Each POST command includes `suggested_poll_delay_s: 1` in the response body. All routes reject unauthenticated requests with 401 via `withAuthAndErrorHandler`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create playback GET route + test (SONOS-01) | 6a565666 | route.ts + __tests__/route.test.ts (playback) |
| 2 | Create 5 transport POST routes + tests (SONOS-02–06) | c613758a | 5x route.ts + 5x __tests__/route.test.ts |

## Test Results

- 12 tests across 6 test suites: all passing
- 401 unauthenticated rejection: verified for all 6 routes
- 200/202 happy path: verified for all 6 routes
- Proxy function call with correct groupId: verified for all 6 routes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test assertion for spread response shape**
- **Found during:** Task 2 test execution
- **Issue:** Initial test files used `data.data.suggested_poll_delay_s` assuming nested response, but `success()` spreads data at the top level: `{ success: true, ...data }`
- **Fix:** Changed assertion to `data.suggested_poll_delay_s` in all 5 POST test files
- **Files modified:** All 5 `__tests__/route.test.ts` POST test files
- **Commit:** c613758a (corrected before commit)

## Known Stubs

None — all routes wire directly to sonosProxy functions with no placeholder data.

## Threat Flags

No new threat surface introduced. All routes are behind `withAuthAndErrorHandler` (T-160-01 mitigated). POST routes take no body (T-160-02 accepted). Error messages are generic via error handler (T-160-03 mitigated).

## Self-Check: PASSED

Files verified present:
- app/api/v1/sonos/zones/[groupId]/playback/route.ts: FOUND
- app/api/v1/sonos/zones/[groupId]/play/route.ts: FOUND
- app/api/v1/sonos/zones/[groupId]/pause/route.ts: FOUND
- app/api/v1/sonos/zones/[groupId]/stop/route.ts: FOUND
- app/api/v1/sonos/zones/[groupId]/next/route.ts: FOUND
- app/api/v1/sonos/zones/[groupId]/previous/route.ts: FOUND

Commits verified:
- 6a565666: FOUND (Task 1 — playback GET route)
- c613758a: FOUND (Task 2 — 5 POST transport routes)
