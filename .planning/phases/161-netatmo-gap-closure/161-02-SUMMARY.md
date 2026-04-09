---
phase: 161-netatmo-gap-closure
plan: "02"
subsystem: netatmo-camera-api
tags: [netatmo, camera, api-routes, v1, binary-streaming]
dependency_graph:
  requires:
    - lib/netatmo/netatmoProxy.ts (existing proxy functions)
    - lib/core (withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS)
    - types/netatmoProxy.ts (SetMonitoringRequest)
  provides:
    - GET /api/v1/netatmo/camera/events
    - GET /api/v1/netatmo/camera/events/[eventId]/snapshot
    - GET /api/v1/netatmo/camera/status
    - GET /api/v1/netatmo/camera/[cameraId]/stream
    - GET /api/v1/netatmo/camera/[cameraId]/snapshot
    - POST /api/v1/netatmo/camera/[cameraId]/monitoring
  affects: []
tech_stack:
  added: []
  patterns:
    - Binary streaming via NextResponse with raw body (no success() wrapper)
    - Optional query param via URL.searchParams (not parseQuery helper)
    - cameraId from URL path param replacing camera_id from body
    - 202 Accepted with suggested_poll_delay_s: 1 for command endpoints
key_files:
  created:
    - app/api/v1/netatmo/camera/events/route.ts
    - app/api/v1/netatmo/camera/events/__tests__/route.test.ts
    - app/api/v1/netatmo/camera/events/[eventId]/snapshot/route.ts
    - app/api/v1/netatmo/camera/events/[eventId]/snapshot/__tests__/route.test.ts
    - app/api/v1/netatmo/camera/status/route.ts
    - app/api/v1/netatmo/camera/status/__tests__/route.test.ts
    - app/api/v1/netatmo/camera/[cameraId]/stream/route.ts
    - app/api/v1/netatmo/camera/[cameraId]/stream/__tests__/route.test.ts
    - app/api/v1/netatmo/camera/[cameraId]/snapshot/route.ts
    - app/api/v1/netatmo/camera/[cameraId]/snapshot/__tests__/route.test.ts
    - app/api/v1/netatmo/camera/[cameraId]/monitoring/route.ts
    - app/api/v1/netatmo/camera/[cameraId]/monitoring/__tests__/route.test.ts
  modified: []
decisions:
  - Binary snapshot uses NextResponse directly — success() wrapper would corrupt JPEG binary
  - Monitoring cameraId from URL path (not body) — aligns with v1 REST conventions, differs from old route
  - Response mock uses plain object {body: null} to avoid jsdom's missing Response global
metrics:
  duration: "~8 minutes"
  completed_date: "2026-04-09"
  tasks_completed: 2
  files_created: 12
  tests_added: 13
---

# Phase 161 Plan 02: Netatmo Camera v1 Routes Summary

6 v1 Netatmo camera API route wrappers with co-located tests: events list, event snapshot (binary JPEG), camera status, camera stream, camera snapshot, and monitoring toggle — all wrapping existing proxy functions with proper auth guards.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Camera events, event snapshot, status routes + tests | 2e38e63a | 6 files |
| 2 | Camera stream, snapshot, monitoring routes + tests | fd784b74 | 6 files |

## What Was Built

**Task 1 (NETA-04):**
- `GET /api/v1/netatmo/camera/events` — forwards optional `hours` query param via `URL.searchParams`
- `GET /api/v1/netatmo/camera/events/[eventId]/snapshot` — binary JPEG streaming via `NextResponse` (not `success()`); sets `Content-Type: image/jpeg` and `Cache-Control: public, max-age=3600`
- `GET /api/v1/netatmo/camera/status` — no params, delegates to `getProxyCameraStatus()`

**Task 2 (NETA-05, NETA-06, NETA-07):**
- `GET /api/v1/netatmo/camera/[cameraId]/stream` — extracts `cameraId` via `getPathParam`, returns stream URLs
- `GET /api/v1/netatmo/camera/[cameraId]/snapshot` — extracts `cameraId` via `getPathParam`, returns snapshot URL
- `POST /api/v1/netatmo/camera/[cameraId]/monitoring` — `cameraId` from URL path + `{ monitoring: 'on' | 'off' }` body; returns 202 Accepted with `suggested_poll_delay_s: 1`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `Response is not defined` in jsdom test environment**
- **Found during:** Task 1 test run
- **Issue:** The plan instructed `new Response(new Blob(['fake-jpeg']), { status: 200 })` in the snapshot test, but jsdom does not expose `Response` globally
- **Fix:** Replaced with a plain mock object `{ body: null, status: 200 }` — the route only pipes `response.body` to `NextResponse`, so the mock value is sufficient for the assertion
- **Files modified:** `app/api/v1/netatmo/camera/events/[eventId]/snapshot/__tests__/route.test.ts`
- **Commit:** 2e38e63a

## Verification

```
Test Suites: 6 passed, 6 total
Tests:       13 passed, 13 total
```

All 6 route files + 6 test files exist. All 13 tests pass. All routes reject with 401 when unauthenticated.

## Self-Check: PASSED

- All 12 created files exist on disk
- Commit 2e38e63a verified: `git log --oneline | grep 2e38e63a`
- Commit fd784b74 verified: `git log --oneline | grep fd784b74`
- 13/13 tests green
