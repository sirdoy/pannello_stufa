---
phase: 166-hue-frontend-cutover
plan: "03"
subsystem: hue-frontend
tags: [hue, legacy-deletion, url-migration, dead-code-removal]
dependency_graph:
  requires: [166-02]
  provides: [hue-legacy-routes-deleted]
  affects: [app/api/hue, lib/commands/deviceCommands]
tech_stack:
  added: []
  patterns: [legacy-route-deletion, pre-deletion-verification]
key_files:
  created: []
  modified:
    - lib/commands/deviceCommands.tsx
  deleted:
    - app/api/hue/status/route.ts
    - app/api/hue/status/__tests__/route.test.ts
    - app/api/hue/lights/route.ts
    - app/api/hue/lights/__tests__/route.test.ts
    - app/api/hue/lights/[id]/route.ts
    - app/api/hue/lights/[id]/__tests__/route.test.ts
    - app/api/hue/rooms/route.ts
    - app/api/hue/rooms/__tests__/route.test.ts
    - app/api/hue/rooms/[id]/route.ts
    - app/api/hue/rooms/[id]/__tests__/route.test.ts
    - app/api/hue/scenes/route.ts
    - app/api/hue/scenes/__tests__/route.test.ts
    - app/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts
    - app/api/hue/groups/[groupId]/scenes/[sceneId]/__tests__/route.test.ts
    - app/api/hue/history/route.ts
    - app/api/hue/history/__tests__/route.test.ts
decisions:
  - "Historical changelog strings in lib/version.ts left intact (not active route consumers)"
  - "types/hueProxy.ts doc references to docs/api/hue.md file path left intact (not URL routes)"
  - "deviceCommands.tsx group action path split: rooms/${id} PUT → groups/${id}/action PUT"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-18T08:30:00Z"
  tasks_completed: 1
  tasks_total: 1
  files_deleted: 16
  files_modified: 1
---

# Phase 166 Plan 03: Hue Legacy Route Deletion Summary

Deleted entire `app/api/hue/` directory tree (16 files) per D-11. Fixed one previously missed consumer in `lib/commands/deviceCommands.tsx` before deletion. Phase 166 complete: all Hue UI now consumes `/api/v1/hue/*` exclusively.

## What Was Built

Pre-deletion grep confirmed zero `/api/hue/` references outside the legacy tree (excluding the file being deleted itself). Deleted 8 legacy route files and 8 associated test files. Fixed `lib/commands/deviceCommands.tsx` which had three active `/api/hue/` fetch calls missed by Plan 02.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Delete legacy app/api/hue/ tree + fix deviceCommands | d62cad86 | -16 deleted, 1 modified |

## Deletion Inventory

| File | Reason |
|------|--------|
| `app/api/hue/status/route.ts` | Superseded by `/api/v1/hue/health/route.ts` |
| `app/api/hue/lights/route.ts` | Superseded by `/api/v1/hue/lights/route.ts` (created plan 166-01) |
| `app/api/hue/lights/[id]/route.ts` | Superseded by `/api/v1/hue/lights/[lightId]/route.ts` (GET) and `/api/v1/hue/lights/[lightId]/state/route.ts` (PUT) |
| `app/api/hue/rooms/route.ts` | Superseded by `/api/v1/hue/groups/route.ts` |
| `app/api/hue/rooms/[id]/route.ts` | Superseded by `/api/v1/hue/groups/[groupId]/action/route.ts` |
| `app/api/hue/scenes/route.ts` | Superseded by `/api/v1/hue/scenes/route.ts` (created plan 166-01) |
| `app/api/hue/groups/[groupId]/scenes/[sceneId]/route.ts` | Superseded by `/api/v1/hue/groups/[groupId]/scenes/[sceneId]/route.ts` |
| `app/api/hue/history/route.ts` | No v1 equivalent needed (history not used in frontend) |
| All 8 `__tests__/route.test.ts` files | Deleted with their source files |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed missed legacy consumers in lib/commands/deviceCommands.tsx**
- **Found during:** Post-deletion verification grep (Task 1 Step 3)
- **Issue:** `executeLightsAction()` used `/api/hue/${endpoint}` prefix. Two `lights-all-on/off` command handlers fetched `/api/hue/rooms`. These active consumers would have broken after legacy deletion.
- **Fix:**
  - Changed `executeLightsAction` prefix: `/api/hue/` → `/api/v1/hue/`
  - Changed rooms fetch: `/api/hue/rooms` → `/api/v1/hue/groups`
  - Changed response field: `roomsData.rooms` → `roomsData.groups`
  - Changed group action endpoints: `rooms/${groupedLightId}` PUT → `groups/${groupedLightId}/action` PUT (path split required by v1)
- **Files modified:** `lib/commands/deviceCommands.tsx`
- **Commit:** d62cad86

### Non-functional Remaining Matches

Two files contain the string `/api/hue` but are NOT active route consumers:
- `lib/version.ts` (lines 892, 895, 1508): Historical changelog entries documenting past API endpoints that were deleted in Phase 109. These are string literals in a version history array, not fetch calls.
- `types/hueProxy.ts` (lines 8, 192, 208): JSDoc comments referencing `docs/api/hue.md` (the documentation file path). The grep matches substring `/api/hue` within the doc path, not a route URL.

Both are intentionally preserved as accurate historical/documentary information.

## Pre-existing Issues (Out of Scope)

**debug/api HueTab test** (`app/debug/api/components/tabs/__tests__/HueTab.test.tsx`): Continues to fail with `Cannot find module '../ApiTab'` — pre-existing failure documented in 166-02-SUMMARY. Not introduced or worsened by this plan.

## Verification

```
test ! -d app/api/hue          → OK: deleted
grep active /api/hue/ consumers → 0 (all fixed)
11 v1 hue test suites          → PASS
1 pre-existing test failure    → debug/api HueTab (pre-existing, documented in 166-02)
```

## Known Stubs

None.

## Threat Flags

None — deletion removes code, no new trust boundaries introduced. T-166-06 mitigated: pre-deletion grep confirmed zero active consumers before deletion.

## Self-Check: PASSED

- [x] `app/api/hue/` directory does not exist (`test ! -d app/api/hue` returns 0)
- [x] Zero active `/api/hue/` fetch consumers in app/, lib/, types/
- [x] `lib/commands/deviceCommands.tsx` — fixed and committed d62cad86
- [x] Commit d62cad86 exists in git log
- [x] 11 v1 hue test suites PASS
- [x] 16 files deleted (8 routes + 8 tests) — all in app/api/hue/
