---
phase: 46
plan: 04
subsystem: api-routes
tags: [typescript, strict-mode, type-safety, hue, netatmo, stove]
dependency_graph:
  requires: [46-03]
  provides: [strict-mode-compliant-api-routes]
  affects: [lib/core/middleware.ts, hue-api-routes, netatmo-api-routes, stove-api-routes]
tech_stack:
  added: []
  patterns: [NextResponse-type-compatibility, null-guards, non-null-assertions]
key_files:
  created: []
  modified:
    - lib/core/middleware.ts
    - app/api/hue/lights/[id]/route.ts
    - app/api/hue/rooms/[id]/route.ts
    - app/api/hue/scenes/[id]/route.ts
    - app/api/hue/scenes/[id]/activate/route.ts
    - app/api/hue/remote/pair/route.ts
    - app/api/netatmo/camera/[cameraId]/events/route.ts
    - app/api/netatmo/camera/[cameraId]/snapshot/route.ts
    - app/api/netatmo/setroomthermpoint/route.ts
    - app/api/netatmo/setthermmode/route.ts
    - app/api/netatmo/stove-sync/route.ts
    - app/api/stove/ignite/route.ts
    - app/api/stove/shutdown/route.ts
decisions:
  - title: Updated middleware AuthedHandler types to accept NextResponse<unknown>
    rationale: NextResponse.json() returns NextResponse<T> which is incompatible with bare NextResponse. Rather than casting every return statement, we updated the middleware type definitions to match the actual return types from Next.js.
  - title: Removed local RouteContext interfaces
    rationale: Local RouteContext interfaces with specific param shapes (e.g., { id: string }) conflicted with middleware's generic RouteContext. Removing them allows TypeScript to infer the correct type from middleware.
  - title: Used non-null assertions for validated parameters
    rationale: After validateRequired() calls, values are guaranteed to be non-null, but TypeScript doesn't track this. Non-null assertions (!) are safe here and more precise than nullish coalescing.
metrics:
  duration: 953s
  tasks_completed: 2
  files_modified: 13
  commits: 2
  errors_fixed: 22
  tests_passing: n/a
completed_at: 2026-02-09T13:30:02Z
---

# Phase 46 Plan 04: Hue/Netatmo/Stove API Route Strict Mode Compliance Summary

**One-liner:** Fixed AuthedHandler signature mismatch and null-safety issues across 12 API route files (Hue, Netatmo, Stove endpoints)

## Objective

Fix 22 strict-mode TypeScript errors across 12 API route files for Hue, Netatmo, and Stove endpoints. These routes shared a common pattern: AuthedHandler signature mismatch (TS2345) and possibly-undefined property access (TS18048).

## Tasks Completed

### Task 1: Fix AuthedHandler signature mismatch in Hue/Netatmo/Notification routes

**Files:**
- `app/api/hue/lights/[id]/route.ts`
- `app/api/hue/rooms/[id]/route.ts`
- `app/api/hue/scenes/[id]/route.ts`
- `app/api/hue/scenes/[id]/activate/route.ts`
- `app/api/netatmo/camera/[cameraId]/events/route.ts`
- `app/api/netatmo/camera/[cameraId]/snapshot/route.ts`
- `lib/core/middleware.ts`

**Changes:**
- Updated `AuthedHandler`, `OptionalAuthHandler`, and `UnauthHandler` types in middleware to accept `Promise<NextResponse<unknown>>` instead of `Promise<NextResponse>`
- Removed local `RouteContext` interfaces that conflicted with middleware's generic `RouteContext`
- Added `session` parameter to GET handlers (was missing)
- Added null guard for `cameraData.cameras` in snapshot route

**Errors fixed:** 10 (9 TS2345 + 1 TS18048)

**Commit:** `096d3a6`

### Task 2: Fix Hue pair, Netatmo thermostat, and Stove route errors

**Files:**
- `app/api/hue/remote/pair/route.ts`
- `app/api/netatmo/setroomthermpoint/route.ts`
- `app/api/netatmo/setthermmode/route.ts`
- `app/api/netatmo/stove-sync/route.ts`
- `app/api/stove/ignite/route.ts`
- `app/api/stove/shutdown/route.ts`

**Changes:**
- **Hue pair route:** Added null guards before accessing `hasError.error`, `errorItem.error`, and `successItem.success` properties
- **Setroomthermpoint:** Added non-null assertions (`!`) for `room_id` and `mode` after validation
- **Setthermmode:** Added non-null assertion for `mode` after validation
- **Stove-sync:** Removed duplicate `synced` property in result object (was in both explicit field and spread operator)
- **Stove ignite/shutdown:** Added type assertions for `result` as `Record<string, unknown>` when passing to `success()`

**Errors fixed:** 12 (7 TS18048 + 2 TS2322 + 1 TS2783 + 2 TS2345)

**Commit:** `481cb17`

## Deviations from Plan

None - plan executed exactly as written.

## Verification

```bash
# Zero errors in all 12 API route files (excluding tests)
npx tsc --noEmit 2>&1 | grep -E "app/api/(hue|netatmo|stove/(ignite|shutdown))" | grep -v "__tests__" | wc -l
# Result: 0
```

**Before:** 22 tsc errors across 12 files
**After:** 0 tsc errors

## Key Learnings

1. **NextResponse type compatibility:** `NextResponse.json()` returns `NextResponse<T>` (generic), not bare `NextResponse`. Middleware types must match actual Next.js return types.

2. **RouteContext conflicts:** Local `RouteContext` interfaces with specific param shapes (`{ id: string }`) create type conflicts with middleware's generic `RouteContext` (`Record<string, string>`). Removing local interfaces and relying on type inference is cleaner.

3. **Non-null assertions after validation:** After `validateRequired()` calls, values are guaranteed non-null, but TypeScript doesn't track this. Non-null assertions (`!`) are the correct pattern here (more precise than `?? ''`).

4. **Spread operator property order:** When using spread operators, properties defined AFTER the spread override properties IN the spread. Duplicate properties cause TS2783 errors.

## Impact

- **12 API route files** now compile with zero strict-mode errors
- **lib/core/middleware.ts** types updated to match Next.js reality
- **Consistent pattern** established for AuthedHandler usage across all routes
- **No behavioral changes** - only type safety improvements

## Next Steps

Continue with remaining API route files in phase 46 (plans 46-05, 46-06, 46-07).

---

**Phase 46 Plan 04 complete** - All Hue, Netatmo camera, and Stove API routes now strict-mode compliant
