---
phase: 118-registry-infrastructure
plan: 02
subsystem: api
tags: [registry, next.js, api-routes, proxy, devices]

requires:
  - phase: 118-01
    provides: registryProxy.ts function module with all 8 proxy methods

provides:
  - GET /api/registry/types (public)
  - POST /api/registry/types (protected, 201)
  - DELETE /api/registry/types/[slug] (protected, 204)
  - GET /api/registry/devices (protected, paginated with limit/offset/provider_name)
  - POST /api/registry/devices (protected, 201)
  - PUT /api/registry/devices/[device_id] (protected, 200)
  - DELETE /api/registry/devices/[device_id] (protected, 204)
  - GET /api/registry/health (public)

affects: [119-rooms-infrastructure, 120-registry-ui, 121-rooms-ui]

tech-stack:
  added: []
  patterns: [withErrorHandler for public routes, withAuthAndErrorHandler for protected routes, await context.params for Next.js 15 dynamic segments, double assertion data as unknown as Record<string,unknown>]

key-files:
  created:
    - app/api/registry/types/route.ts
    - app/api/registry/types/[slug]/route.ts
    - app/api/registry/devices/route.ts
    - app/api/registry/devices/[device_id]/route.ts
    - app/api/registry/health/route.ts
  modified:
    - lib/core/index.ts

key-decisions:
  - "GET /registry/types and GET /registry/health are public (withErrorHandler) per D-12; all device routes are protected (withAuthAndErrorHandler)"
  - "created() helper added to lib/core/index.ts export — was defined in apiResponse.ts but not re-exported"

patterns-established:
  - "Registry routes: public endpoints use withErrorHandler, protected endpoints use withAuthAndErrorHandler"
  - "Next.js 15 async params: use await context.params then index with bracket notation to satisfy noUncheckedIndexedAccess"
  - "Query param forwarding: sp.has('limit') ? Number(sp.get('limit')) : undefined avoids defaulting to 0"

requirements-completed: [INFRA-05]

duration: 8min
completed: 2026-03-22
---

# Phase 118 Plan 02: Registry API Routes Summary

**5 Next.js route files covering all 8 Device Registry endpoint proxies (types CRUD + devices CRUD + health), with correct auth tiers (public GET vs protected mutations)**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-22T21:05:00Z
- **Completed:** 2026-03-22T21:13:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created all 5 API route files under app/api/registry/ covering all 8 endpoints
- GET /registry/types and GET /registry/health are public (no auth required per D-12)
- All device routes and POST/DELETE for types require Auth0 authentication
- GET /registry/devices forwards limit, offset, provider_name query params to the proxy
- Dynamic segment routes use `await context.params` (Next.js 15)
- Added `created()` 201 helper to lib/core/index.ts export

## Task Commits

Each task was committed atomically:

1. **Task 1: Types + health route files** - `666626a8` (feat)
2. **Task 2: Devices route files** - `e6ff4b60` (feat)

**Plan metadata:** (final commit below)

## Files Created/Modified
- `app/api/registry/types/route.ts` - GET (public) + POST (protected, 201)
- `app/api/registry/types/[slug]/route.ts` - DELETE (protected, 204)
- `app/api/registry/devices/route.ts` - GET paginated (protected) + POST register (protected, 201)
- `app/api/registry/devices/[device_id]/route.ts` - PUT update (protected, 200) + DELETE unregister (protected, 204)
- `app/api/registry/health/route.ts` - GET (public)
- `lib/core/index.ts` - Added `created` to the re-export list

## Decisions Made
- `created()` was defined in apiResponse.ts but not exported from lib/core/index.ts — added it to unblock importing from `@/lib/core` as the plan prescribed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `created` export to lib/core/index.ts**
- **Found during:** Task 1 (types route implementation)
- **Issue:** `created()` helper exists in lib/core/apiResponse.ts but was not re-exported from lib/core/index.ts; importing from `@/lib/core` as the plan prescribes would fail at runtime
- **Fix:** Added `created` to the RESPONSES export block in lib/core/index.ts
- **Files modified:** lib/core/index.ts
- **Verification:** `npx tsc --noEmit` exits with 0 errors
- **Committed in:** 666626a8 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed `context.params` string | undefined type error**
- **Found during:** Task 1 (types/[slug] route)
- **Issue:** Destructuring `{ slug }` from `Record<string, string>` yields `string | undefined` with noUncheckedIndexedAccess; TypeScript error TS2345
- **Fix:** Use bracket notation `params['slug'] ?? ''` instead of destructuring; same pattern applied to `device_id` in devices/[device_id]/route.ts
- **Files modified:** app/api/registry/types/[slug]/route.ts, app/api/registry/devices/[device_id]/route.ts
- **Verification:** `npx tsc --noEmit` exits with 0 errors
- **Committed in:** 666626a8 and e6ff4b60

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 8 Device Registry endpoints are now exposed as Next.js API routes
- Phase 119 (rooms-infrastructure) can proceed: registryProxy.ts and the routes it provides are both ready
- Phase 120 (registry-ui) can call these routes from client components

---
*Phase: 118-registry-infrastructure*
*Completed: 2026-03-22*
