---
phase: 159-hue-gap-closure
plan: "02"
subsystem: hue-api
tags: [hue, api-routes, v1, groups, scenes, firebase-logging]
dependency_graph:
  requires: [lib/hue/hueProxy.ts, lib/core, lib/firebaseAdmin]
  provides: [GET /api/v1/hue/groups, GET /api/v1/hue/groups/{id}, PUT /api/v1/hue/groups/{id}/action, POST /api/v1/hue/groups/{id}/scenes/{sceneId}]
  affects: []
tech_stack:
  added: []
  patterns: [withAuthAndErrorHandler, force-dynamic, adminDbPush logging, 202 Accepted, jest.mocked]
key_files:
  created:
    - app/api/v1/hue/groups/route.ts
    - app/api/v1/hue/groups/__tests__/route.test.ts
    - app/api/v1/hue/groups/[groupId]/route.ts
    - app/api/v1/hue/groups/[groupId]/__tests__/route.test.ts
    - app/api/v1/hue/groups/[groupId]/action/route.ts
    - app/api/v1/hue/groups/[groupId]/action/__tests__/route.test.ts
    - app/api/v1/hue/groups/[groupId]/scenes/[sceneId]/route.ts
    - app/api/v1/hue/groups/[groupId]/scenes/[sceneId]/__tests__/route.test.ts
  modified: []
decisions:
  - "Group action PUT uses Italian action descriptions (Gruppo acceso/spento/Luminosita gruppo modificata/Luci gruppo modificate) matching existing room route pattern"
  - "Scene activation route is a near-copy of existing /api/hue/groups/[groupId]/scenes/[sceneId]/route.ts, moved under v1 path"
metrics:
  duration: "4 minutes"
  completed: "2026-04-09"
  tasks: 1
  files: 8
---

# Phase 159 Plan 02: Hue Groups, Group Action, and Scene Activation v1 Routes Summary

**One-liner:** v1 Hue group endpoints — list, get, action PUT, and scene activation POST — all delegating to hueProxy with Firebase logging and 202 Accepted responses.

## What Was Built

Created 4 route files and 4 co-located test files under `app/api/v1/hue/groups/`:

| Route | Method | Handler | Response |
|-------|--------|---------|----------|
| `/api/v1/hue/groups` | GET | `getGroups()` → `{ groups: data }` | 200 |
| `/api/v1/hue/groups/[groupId]` | GET | `getGroup(groupId)` | 200 |
| `/api/v1/hue/groups/[groupId]/action` | PUT | `setGroupAction(groupId, body)` + Firebase log | 202 |
| `/api/v1/hue/groups/[groupId]/scenes/[sceneId]` | POST | `activateScene(groupId, sceneId)` + Firebase log | 202 |

All routes use `withAuthAndErrorHandler` (returns 401 if unauthenticated) and `export const dynamic = 'force-dynamic'`.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create v1 Hue groups list, single group, group action, and scene activation routes with tests | 30f2ae53 | 8 files created |

## Test Results

```
PASS app/api/v1/hue/groups/__tests__/route.test.ts
PASS app/api/v1/hue/groups/[groupId]/action/__tests__/route.test.ts
PASS app/api/v1/hue/groups/[groupId]/__tests__/route.test.ts
PASS app/api/v1/hue/groups/[groupId]/scenes/[sceneId]/__tests__/route.test.ts

Test Suites: 4 passed, 4 total
Tests:       8 passed, 8 total
```

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None - all routes authenticated via `withAuthAndErrorHandler` (T-159-04 mitigated), body parsed via `parseJson` (T-159-05 mitigated), path params validated by proxy against bridge cache (T-159-06 mitigated).

## Self-Check: PASSED

Files exist:
- app/api/v1/hue/groups/route.ts: FOUND
- app/api/v1/hue/groups/__tests__/route.test.ts: FOUND
- app/api/v1/hue/groups/[groupId]/route.ts: FOUND
- app/api/v1/hue/groups/[groupId]/__tests__/route.test.ts: FOUND
- app/api/v1/hue/groups/[groupId]/action/route.ts: FOUND
- app/api/v1/hue/groups/[groupId]/action/__tests__/route.test.ts: FOUND
- app/api/v1/hue/groups/[groupId]/scenes/[sceneId]/route.ts: FOUND
- app/api/v1/hue/groups/[groupId]/scenes/[sceneId]/__tests__/route.test.ts: FOUND

Commit 30f2ae53: FOUND
