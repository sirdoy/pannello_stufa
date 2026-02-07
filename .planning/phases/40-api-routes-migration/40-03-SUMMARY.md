---
phase: 40-api-routes-migration
plan: 03
subsystem: api
tags: [typescript, next.js, philips-hue, oauth, api-routes, dynamic-routes]

# Dependency graph
requires:
  - phase: 38-library-migration
    provides: Core middleware and type infrastructure
  - phase: 39-ui-components-migration
    provides: TypeScript patterns and conventions
provides:
  - All 18 Philips Hue API routes migrated to TypeScript
  - Dynamic route param typing with RouteContext interface
  - OAuth flow typing for remote Hue cloud authentication
  - Light/room/scene control typed request bodies
affects: [40-04, 40-05, 40-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RouteContext interface for dynamic params: Promise<{ id: string }>"
    - "Inline interface declarations for POST/PUT body types"
    - "Type-safe OAuth response handling with discriminated unions"
    - "Unknown type with type guards for error handling"

key-files:
  created: []
  modified:
    - app/api/hue/lights/[id]/route.ts
    - app/api/hue/rooms/[id]/route.ts
    - app/api/hue/scenes/[id]/route.ts
    - app/api/hue/scenes/[id]/activate/route.ts
    - app/api/hue/remote/callback/route.ts
    - app/api/hue/remote/pair/route.ts
    - app/api/hue/callback/route.ts
    - app/api/hue/disconnect/route.ts
    - app/api/hue/discover/route.ts
    - app/api/hue/lights/route.ts
    - app/api/hue/pair/route.ts
    - app/api/hue/rooms/route.ts
    - app/api/hue/scenes/route.ts
    - app/api/hue/scenes/create/route.ts
    - app/api/hue/status/route.ts
    - app/api/hue/test/route.ts
    - app/api/hue/remote/authorize/route.ts
    - app/api/hue/remote/disconnect/route.ts

key-decisions:
  - "RouteContext interface for all dynamic [id] routes with Promise pattern"
  - "Inline body interfaces (LightStateBody, CreateSceneRequestBody, etc.) instead of shared types"
  - "OAuth callback uses withErrorHandler (not withAuthAndErrorHandler) since redirects handle auth"
  - "Complex OAuth responses typed with local interfaces for type-safe parsing"

patterns-established:
  - "RouteContext: { params: Promise<{ id: string }> } for dynamic routes"
  - "Body interfaces with index signature for flexibility: [key: string]: unknown"
  - "Error handling: unknown type with instanceof Error type guards"
  - "OAuth response arrays typed as discriminated unions with success/error properties"

# Metrics
duration: 5min
completed: 2026-02-07
---

# Phase 40 Plan 03: Hue API Routes Migration Summary

**All 18 Philips Hue API routes migrated to TypeScript with typed dynamic params, OAuth flows, and light/scene control bodies**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-07T09:42:23Z
- **Completed:** 2026-02-07T09:47:11Z
- **Tasks:** 2
- **Files modified:** 18

## Accomplishments
- Migrated all 18 Hue API route files from JavaScript to TypeScript
- Added typed dynamic route params with RouteContext interface
- Typed complex OAuth flow responses (remote pairing, callback handling)
- Typed light/room/scene control request bodies with inline interfaces
- Preserved git history via git mv for all migrations

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate Hue simple routes, OAuth, and local endpoints (10 files)** - `afaa907` (feat)
2. **Task 2: Migrate Hue dynamic param routes and remote OAuth (8 files)** - `b4d6c5b` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified

### Dynamic Routes (with RouteContext)
- `app/api/hue/lights/[id]/route.ts` - Individual light GET/PUT with LightStateBody interface
- `app/api/hue/rooms/[id]/route.ts` - Room grouped light GET/PUT with GroupedLightStateBody interface
- `app/api/hue/scenes/[id]/route.ts` - Scene CRUD with UpdateSceneRequestBody interface
- `app/api/hue/scenes/[id]/activate/route.ts` - Scene activation PUT endpoint

### Remote OAuth Routes
- `app/api/hue/remote/authorize/route.ts` - OAuth authorization redirect (no changes needed)
- `app/api/hue/remote/callback/route.ts` - OAuth callback with typed error handling
- `app/api/hue/remote/disconnect/route.ts` - Remote token cleanup (no changes needed)
- `app/api/hue/remote/pair/route.ts` - Remote bridge pairing with LinkButtonError and CreateUserResponse interfaces

### Simple Routes
- `app/api/hue/callback/route.ts` - Re-export alias (no changes needed)
- `app/api/hue/disconnect/route.ts` - Clear Hue connection (no changes needed)
- `app/api/hue/discover/route.ts` - Bridge discovery (no changes needed)
- `app/api/hue/lights/route.ts` - List all lights (no changes needed)
- `app/api/hue/pair/route.ts` - Local bridge pairing with PairRequestBody interface
- `app/api/hue/rooms/route.ts` - List all rooms (no changes needed)
- `app/api/hue/scenes/route.ts` - List all scenes (no changes needed)
- `app/api/hue/scenes/create/route.ts` - Create scene with CreateSceneRequestBody interface
- `app/api/hue/status/route.ts` - Connection status (no changes needed)
- `app/api/hue/test/route.ts` - Test endpoint with typed error handling

## Decisions Made

**1. RouteContext interface for dynamic params**
- Next.js 15 requires dynamic route params as Promise<{ id: string }>
- Created RouteContext interface locally in each file for type safety
- Pattern: `interface RouteContext { params: Promise<{ id: string }> }`

**2. Inline body interfaces**
- Chose inline interface declarations over shared types for simplicity
- Each POST/PUT route has its own body interface (PairRequestBody, LightStateBody, etc.)
- Used index signature `[key: string]: unknown` for flexibility with Hue API

**3. OAuth callback uses withErrorHandler only**
- OAuth callback redirects on auth errors instead of returning JSON error responses
- Correctly uses withErrorHandler (not withAuthAndErrorHandler) as documented
- Auth check happens manually before OAuth processing

**4. Type-safe OAuth response parsing**
- Hue OAuth responses are arrays with success/error discriminated unions
- Created local interfaces: LinkButtonError, CreateUserResponse
- Type narrowing with .find() to extract success or error from response arrays

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all routes migrated smoothly following established TypeScript patterns.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 18 Hue routes successfully migrated to TypeScript
- Zero tsc errors introduced
- Ready to proceed with remaining API route migrations (Netatmo, Stove, etc.)
- No blockers or concerns

## Self-Check: PASSED

All 18 key files exist. All commits (afaa907, b4d6c5b) verified.

---
*Phase: 40-api-routes-migration*
*Completed: 2026-02-07*
