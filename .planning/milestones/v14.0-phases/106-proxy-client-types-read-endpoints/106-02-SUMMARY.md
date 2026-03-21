---
phase: 106-proxy-client-types-read-endpoints
plan: "02"
subsystem: hue
tags: [api-routes, hue, proxy-migration, tests]
dependency_graph:
  requires: [106-01]
  provides: [hue-read-routes-migrated]
  affects: [app/api/hue/*, frontend-hooks]
tech_stack:
  added: []
  patterns: [withAuthAndErrorHandler-for-GET, PUT-handler-preserved, query-forwarding]
key_files:
  created:
    - app/api/hue/history/route.ts
    - app/api/hue/status/__tests__/route.test.ts
    - app/api/hue/lights/__tests__/route.test.ts
    - app/api/hue/lights/[id]/__tests__/route.test.ts
    - app/api/hue/rooms/__tests__/route.test.ts
    - app/api/hue/rooms/[id]/__tests__/route.test.ts
    - app/api/hue/scenes/__tests__/route.test.ts
    - app/api/hue/history/__tests__/route.test.ts
  modified:
    - app/api/hue/status/route.ts
    - app/api/hue/lights/route.ts
    - app/api/hue/lights/[id]/route.ts
    - app/api/hue/rooms/route.ts
    - app/api/hue/rooms/[id]/route.ts
    - app/api/hue/scenes/route.ts
decisions:
  - GET handlers in lights/[id] and rooms/[id] migrated to withAuthAndErrorHandler; PUT handlers kept unchanged for Phase 107
  - rooms/route.ts no longer does Promise.all(rooms+zones); getGroups() returns both from proxy
  - scenes/route.ts uses getScenes(groupId) not URLSearchParams — single param, simpler API
metrics:
  duration: 15m
  completed: "2026-03-20"
  tasks_completed: 2
  files_created: 8
  files_modified: 6
---

# Phase 106 Plan 02: Hue Read Routes Migration Summary

6 existing Hue API GET routes rewritten to use hueProxy.ts and 1 new history endpoint created, all via withAuthAndErrorHandler pattern, with 7 unit test suites (24 tests, all passing).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewrite 6 routes + create history route | 83edcce | 7 routes |
| 2 | Create unit tests for all 7 routes | 0365944 | 7 test files |

## What Was Built

### Routes Rewritten (6)

**`app/api/hue/status/route.ts`** — Full rewrite calling `getHealth()`. Replaced complex local+remote status assembly (hueLocalHelper, determineConnectionMode, hasRemoteTokens, getUsername) with single proxy call.

**`app/api/hue/lights/route.ts`** — Full rewrite calling `getLights()`. Replaced `withHueHandler` + `HueConnectionStrategy.getProvider()` + `provider.getLights()` with direct proxy call.

**`app/api/hue/lights/[id]/route.ts`** — GET rewritten to call `getLight(id)` via `withAuthAndErrorHandler`. PUT handler preserved intact (will be migrated in Phase 107).

**`app/api/hue/rooms/route.ts`** — Full rewrite calling `getGroups()`. Removed `Promise.all([getRooms(), getZones()])` merge logic — proxy returns combined groups.

**`app/api/hue/rooms/[id]/route.ts`** — GET rewritten to call `getGroup(id)` via `withAuthAndErrorHandler`. PUT handler with `withIdempotency` preserved intact.

**`app/api/hue/scenes/route.ts`** — Full rewrite calling `getScenes(groupId)` with `group_id` query param support.

### Route Created (1)

**`app/api/hue/history/route.ts`** — New endpoint calling `getHistory(params)`. Follows canonical stove history pattern: forwards all query params as URLSearchParams when present, passes undefined otherwise.

### Tests (7 suites, 24 tests)

All tests follow the canonical pattern from `app/api/raspi/health/__tests__/route.test.ts`:
- 401 unauthenticated path for every route
- 200 success path with typed mock data
- 503 error propagation for status and list routes
- scenes test verifies `getScenes(undefined)` vs `getScenes('1')` for group_id filter
- history test verifies URLSearchParams forwarding with correct from/to values

## Verification

```
npx tsc --noEmit      → 0 errors in hue routes
npx jest hue          → 94 tests, 13 suites, all PASS
```

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files verified:
- app/api/hue/history/route.ts: FOUND
- app/api/hue/status/route.ts contains getHealth: FOUND
- app/api/hue/lights/route.ts contains getLights: FOUND
- app/api/hue/lights/[id]/route.ts contains PUT: FOUND
- app/api/hue/rooms/route.ts contains getGroups: FOUND
- app/api/hue/rooms/[id]/route.ts contains PUT: FOUND
- app/api/hue/scenes/route.ts contains getScenes: FOUND
- app/api/hue/history/route.ts contains getHistory: FOUND
- Commits 83edcce and 0365944: FOUND
