---
phase: 77-camera-migration
plan: 02
subsystem: api
tags: [netatmo, camera, proxy-client, tdd, migration]

dependency_graph:
  requires:
    - phase: 77-01
      provides: camera-proxy-types and 6 typed convenience wrappers in lib/netatmoProxy.ts
  provides:
    - camera-status-route (GET /api/netatmo/camera/status)
    - camera-stream-route (GET /api/netatmo/camera/stream)
    - camera-snapshot-route (GET /api/netatmo/camera/snapshot - rewritten)
    - camera-events-route (GET /api/netatmo/camera/events - rewritten)
    - camera-event-snapshot-route (GET /api/netatmo/camera/events/[eventId]/snapshot)
    - camera-monitoring-route (POST /api/netatmo/camera/monitoring)
    - updated-camera-routes-constants
  affects: [plans/77-03, camera-ui-components]

tech-stack:
  added: []
  patterns:
    - proxy-only camera routes (no requireNetatmoToken, no NETATMO_CAMERA_API imports)
    - hours-clamping for optional query param (1-168 range)
    - binary stream forwarding via NextResponse(response.body) with image/jpeg headers
    - failure-only logging via adminDbPush in catch block

key-files:
  created:
    - app/api/netatmo/camera/status/route.ts
    - app/api/netatmo/camera/stream/route.ts
    - app/api/netatmo/camera/events/[eventId]/snapshot/route.ts
    - app/api/netatmo/camera/monitoring/route.ts
    - __tests__/app/api/netatmo/camera/status.test.ts
    - __tests__/app/api/netatmo/camera/events.test.ts
    - __tests__/app/api/netatmo/camera/monitoring.test.ts
  modified:
    - app/api/netatmo/camera/snapshot/route.ts
    - app/api/netatmo/camera/events/route.ts
    - app/api/netatmo/camera/route.ts
    - lib/routes.ts
  deleted:
    - app/api/netatmo/camera/[cameraId]/events/route.ts

key-decisions:
  - "Old /camera/[cameraId]/events route deleted — events now come from /camera/events (proxy aggregates by camera_id)"
  - "Old /camera root route kept as thin backward-compat alias calling getProxyCameraStatus()"
  - "hours param clamped 1-168, NaN treated as no hours (undefined passed to proxy)"
  - "Binary JPEG streamed via NextResponse(response.body) with Content-Type image/jpeg, Cache-Control max-age=3600"
  - "Monitoring route uses failure-only logging pattern (adminDbPush in catch only)"

patterns-established:
  - "Camera proxy route pattern: import wrapper from netatmoProxy, call with typed params, return success(result as unknown as Record)"
  - "Optional numeric query param: parse, isNaN check, clamp, pass undefined if absent"

requirements-completed: [CAM-01, CAM-02, CAM-03, CAM-04, CAM-05, CAM-06]

duration: 10min
completed: "2026-03-15"
---

# Phase 77 Plan 02: Camera Route Migration Summary

**6 camera API routes migrated to proxy client — no OAuth token management, no NETATMO_CAMERA_API imports, binary event snapshot streaming, 19 tests green.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-15T12:31:36Z
- **Completed:** 2026-03-15T12:41:00Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 11 (4 new routes, 3 rewritten, 3 tests, 1 routes.ts)

## Accomplishments

- 4 new camera proxy routes created (status, stream, monitoring, event snapshot)
- 2 routes rewritten to remove legacy OAuth/Firebase cache patterns (snapshot, events)
- Old `[cameraId]/events` route deleted; root `/camera` gutted to thin backward-compat alias
- CAMERA_ROUTES updated with `status`, `stream`, `monitoring`, `eventSnapshot` keys
- 19 tests pass covering status, events, and monitoring routes (happy path + error cases)

## Task Commits

TDD task:

1. **RED: failing tests** - `2adf980` (test)
2. **GREEN: implementation** - `2a328e9` (feat)

## Files Created/Modified

- `app/api/netatmo/camera/status/route.ts` — GET endpoint calling getProxyCameraStatus()
- `app/api/netatmo/camera/stream/route.ts` — GET endpoint calling getProxyCameraStream(cameraId)
- `app/api/netatmo/camera/snapshot/route.ts` — Rewritten, calls getProxyCameraSnapshot(cameraId)
- `app/api/netatmo/camera/events/route.ts` — Rewritten, calls getProxyCameraEvents(hours?), clamps 1-168
- `app/api/netatmo/camera/events/[eventId]/snapshot/route.ts` — Streams binary JPEG from proxy
- `app/api/netatmo/camera/monitoring/route.ts` — POST calling proxySetCameraMonitoring, failure-only logging
- `app/api/netatmo/camera/route.ts` — Gutted to thin alias calling getProxyCameraStatus()
- `lib/routes.ts` — CAMERA_ROUTES updated with status, stream, monitoring, eventSnapshot
- `__tests__/app/api/netatmo/camera/status.test.ts` — 5 tests
- `__tests__/app/api/netatmo/camera/events.test.ts` — 7 tests (including hours clamping behavior)
- `__tests__/app/api/netatmo/camera/monitoring.test.ts` — 7 tests (validation + failure logging)

## Decisions Made

- Old `[cameraId]/events` route deleted — proxy aggregates all events, filtering by camera_id is a client concern
- hours param: NaN treated as undefined (no hours), valid values clamped to 1-168 range
- Binary JPEG response: `new NextResponse(response.body, { status: 200, headers: { 'Content-Type': 'image/jpeg', ... } })`
- Monitoring POST: validates camera_id required, monitoring must be "on" or "off"
- Failure-only logging consistent with Phase 76 pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 6 camera proxy endpoints have corresponding Next.js routes
- Routes use proxy client wrappers from Plan 01
- No OAuth token management or Firebase camera cache writes in any camera route
- CAMERA_ROUTES matches new route structure
- Ready for Plan 03 (camera UI migration to use new routes)

---
*Phase: 77-camera-migration*
*Completed: 2026-03-15*
