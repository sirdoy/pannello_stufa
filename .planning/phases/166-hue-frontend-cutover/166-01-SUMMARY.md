---
phase: 166-hue-frontend-cutover
plan: "01"
subsystem: hue-api
tags: [hue, api-routes, v1, list-routes]
dependency_graph:
  requires: []
  provides: [GET /api/v1/hue/lights, GET /api/v1/hue/scenes]
  affects: [useLightsData, useLightsCommands, lights/page, lights/scenes/page]
tech_stack:
  added: []
  patterns: [withAuthAndErrorHandler, force-dynamic, proxy-delegation, nextUrl.searchParams]
key_files:
  created:
    - app/api/v1/hue/lights/route.ts
    - app/api/v1/hue/lights/__tests__/route.test.ts
    - app/api/v1/hue/scenes/route.ts
    - app/api/v1/hue/scenes/__tests__/route.test.ts
  modified: []
decisions:
  - "Used request.nextUrl.searchParams for scenes group_id param (not new Request() which lacks nextUrl)"
  - "Test mock pattern: { nextUrl: { searchParams: new URLSearchParams(...) } } for routes reading query params"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-18T07:30:12Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 0
---

# Phase 166 Plan 01: Create V1 Hue List Routes Summary

Two missing v1 list routes created (GET /api/v1/hue/lights and GET /api/v1/hue/scenes) with full test coverage, enabling Wave 2 frontend hook cutover to v1 paths.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create v1 lights list route + test | e20bc1bc | app/api/v1/hue/lights/route.ts, app/api/v1/hue/lights/__tests__/route.test.ts |
| 2 | Create v1 scenes list route + test | a3df1904 | app/api/v1/hue/scenes/route.ts, app/api/v1/hue/scenes/__tests__/route.test.ts |

## What Was Built

### GET /api/v1/hue/lights
- `app/api/v1/hue/lights/route.ts`: Delegates to `getLights()` proxy, returns `{ success: true, lights: HueLight[] }` via `withAuthAndErrorHandler` + `success()` wrapper. `export const dynamic = 'force-dynamic'`.
- Test: 401 unauthenticated, 200 with lights array (2 tests, all pass).

### GET /api/v1/hue/scenes
- `app/api/v1/hue/scenes/route.ts`: Delegates to `getScenes(groupId?)` proxy. Reads optional `group_id` from `request.nextUrl.searchParams`. Returns `{ success: true, scenes: HueScene[] }`.
- Test: 401 unauthenticated, 200 with scenes array, group_id query param forwarded to proxy (3 tests, all pass).

## Verification

```
Test Suites: 2 passed, 2 total
Tests:       5 passed, 5 total
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed scenes test mock request type**
- **Found during:** Task 2 verification
- **Issue:** Plan showed `new Request('http://localhost:3000/api/v1/hue/scenes')` for test requests, but `request.nextUrl` is a Next.js extension not present on the standard `Request` class. Routes reading `request.nextUrl.searchParams` fail at runtime with 500 when given a bare `Request`.
- **Fix:** Used `{ nextUrl: { searchParams: new URLSearchParams(...) } } as any` mock objects for scenes tests, matching the established pattern in other v1 route tests (e.g. sonos queue tests).
- **Files modified:** `app/api/v1/hue/scenes/__tests__/route.test.ts`
- **Commit:** a3df1904 (included in task commit)

## Known Stubs

None — both routes are fully wired to live proxy functions.

## Threat Flags

None — both new routes are wrapped in `withAuthAndErrorHandler` (T-166-01 and T-166-02 mitigated). The `group_id` query param is a plain string passed directly to the proxy function with no injection risk (T-166-03 accepted per plan).

## Self-Check: PASSED

- [x] `app/api/v1/hue/lights/route.ts` exists
- [x] `app/api/v1/hue/lights/__tests__/route.test.ts` exists
- [x] `app/api/v1/hue/scenes/route.ts` exists
- [x] `app/api/v1/hue/scenes/__tests__/route.test.ts` exists
- [x] Commit e20bc1bc exists (lights)
- [x] Commit a3df1904 exists (scenes)
- [x] 5/5 tests pass
