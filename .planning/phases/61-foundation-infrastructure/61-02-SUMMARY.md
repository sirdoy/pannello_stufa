---
phase: 61-foundation-infrastructure
plan: 02
subsystem: network-monitoring
tags: [fritzbox, api-routes, rate-limiting, cache, authentication]
dependency_graph:
  requires: [61-01-foundation, auth0-middleware, core-api-response, firebase-rtdb]
  provides: [fritzbox-health-endpoint, fritzbox-devices-endpoint, fritzbox-bandwidth-endpoint, fritzbox-wan-endpoint]
  affects: [api-infrastructure, fritzbox-integration]
tech_stack:
  added: []
  patterns: [api-proxy-pattern, withAuthAndErrorHandler, rate-limit-gate, cache-aside]
key_files:
  created:
    - app/api/fritzbox/health/route.ts
    - app/api/fritzbox/devices/route.ts
    - app/api/fritzbox/bandwidth/route.ts
    - app/api/fritzbox/wan/route.ts
    - app/api/fritzbox/health/__tests__/route.test.ts
    - app/api/fritzbox/devices/__tests__/route.test.ts
    - app/api/fritzbox/bandwidth/__tests__/route.test.ts
    - app/api/fritzbox/wan/__tests__/route.test.ts
  modified: []
decisions:
  - decision: No rate limiting on health endpoint
    rationale: Health check is lightweight (ping only, no data fetch) and needed before any other route to verify connectivity
    alternatives_considered: [apply same 10 req/min limit, separate health rate limit]
    impact: Health endpoint can be called frequently without hitting rate limits
  - decision: Spread ApiError details at top level in responses
    rationale: Follows existing project pattern (e.g., reconnect: true at top level, not nested)
    alternatives_considered: [nest details under details field]
    impact: Error responses have flat structure, easier to consume in client
  - decision: Italian error messages for rate limiting
    rationale: Consistent with existing project convention (all user-facing messages in Italian)
    alternatives_considered: [English messages]
    impact: Matches UI language, better UX for Italian users
metrics:
  duration_minutes: 5
  tasks_completed: 2
  files_created: 8
  files_modified: 0
  tests_added: 21
  test_coverage: 100%
  commits: 2
  completed_date: 2026-02-13
---

# Phase 61 Plan 02: Fritz!Box API Routes Summary

**One-liner:** Four Fritz!Box API proxy routes (health, devices, bandwidth, wan) with Auth0 authentication, 10 req/min rate limiting, 60s cache, and RFC 9457 error handling.

## Overview

Created all 4 Fritz!Box API routes following the established Netatmo/Hue proxy pattern. Health endpoint checks TR-064 connectivity without rate limiting (lightweight ping). Data endpoints (devices, bandwidth, wan) enforce 10 req/min rate limit and use 60s cache via the foundation layer from Plan 01. All routes require Auth0 authentication and return RFC 9457 error responses with Italian messages.

These routes expose Fritz!Box data to the client while keeping credentials server-side, forming the API layer between the future NetworkCard component and the Fritz!Box foundation.

## Tasks Completed

### Task 1: Health check and data proxy routes
**Files:** `app/api/fritzbox/health/route.ts`, `app/api/fritzbox/devices/route.ts`, `app/api/fritzbox/bandwidth/route.ts`, `app/api/fritzbox/wan/route.ts`
**Commit:** e36d846

Created all 4 API routes following the canonical pattern from `app/api/netatmo/homesdata/route.ts`:

**Health route** (`/api/fritzbox/health`):
- Checks TR-064 connectivity via `fritzboxClient.ping()` (10s timeout)
- No rate limiting (lightweight, just ping)
- No cache (always check real connectivity)
- Returns `{ status: 'connected', tr064Enabled: true }` on success
- Errors: 403 TR064_NOT_ENABLED (with setupGuideUrl), 504 FRITZBOX_TIMEOUT, 500 FRITZBOX_NOT_CONFIGURED

**Data routes** (`/api/fritzbox/devices`, `/api/fritzbox/bandwidth`, `/api/fritzbox/wan`):
- All follow identical pattern:
  1. Rate limit check: `checkRateLimitFritzBox(session.user.sub, endpoint)`
  2. If rate limited: throw ApiError with 429, Italian message, retryAfter
  3. Fetch with cache: `getCachedData(cacheKey, () => fritzboxClient.getX())`
  4. Return success: `success({ [endpoint]: data })`
- Each endpoint has independent rate limit (no cross-endpoint sharing)
- 60s cache TTL from foundation layer
- Italian error messages: `"Troppe richieste. Riprova tra ${retryAfter}s"`

**Imports and exports:**
- All routes: `export const dynamic = 'force-dynamic'`
- All routes: `export const GET = withAuthAndErrorHandler(...)`
- Health: imports fritzboxClient only (no rate limiter, no cache)
- Data routes: import fritzboxClient, getCachedData, checkRateLimitFritzBox, ApiError, ERROR_CODES, HTTP_STATUS

### Task 2: Unit tests for all API routes
**Files:** `app/api/fritzbox/health/__tests__/route.test.ts`, `app/api/fritzbox/devices/__tests__/route.test.ts`, `app/api/fritzbox/bandwidth/__tests__/route.test.ts`, `app/api/fritzbox/wan/__tests__/route.test.ts`
**Commit:** e06c0da

Created comprehensive unit tests (21 test cases total):

**Health route tests** (6 tests):
- Returns 401 when not authenticated
- Returns 200 with connected status on successful ping
- Returns 403 with TR064_NOT_ENABLED code when TR-064 disabled (includes setupGuideUrl at top level)
- Returns 504 with FRITZBOX_TIMEOUT code when ping times out
- Returns 500 with FRITZBOX_NOT_CONFIGURED when env vars missing
- Verifies health does NOT call rate limiter (health checks are unlimited)

**Data route tests** (5 tests each, 15 total):
- Returns 401 when not authenticated
- Returns 200 with data when rate limit allows and cache provides data
- Returns 429 with RATE_LIMITED code and retryAfter when rate limit exceeded
- Calls getCachedData with correct cache key and fritzboxClient method as fetch function
- Propagates errors from fritzboxClient

**Test infrastructure:**
- Mock `@/lib/fritzbox` (fritzboxClient, getCachedData, checkRateLimitFritzBox)
- Mock `@/lib/auth0` to control authentication
- Mock console.error/console.warn to suppress test output (follows existing pattern)
- Use `jest.mocked()` for type-safe mock access
- RateLimitResult includes `suppressedCount` field (from Phase 49 persistent rate limiter)

All 21 tests passing, zero regressions in lib/fritzbox tests.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

✅ **Type safety:** 0 TypeScript errors (verified with `npx tsc --noEmit | grep fritzbox`)
✅ **Tests:** 21/21 passing (4 test suites for routes)
✅ **Foundation tests:** 15/15 passing (lib/fritzbox tests still pass)
✅ **Combined tests:** 36/36 passing (routes + foundation)
✅ **Routes export GET and dynamic:** Verified in all 4 route files
✅ **Health no rate limit:** Health route does NOT import checkRateLimitFritzBox
✅ **Error response format:** Details spread at top level (setupGuideUrl, retryAfter)

## Key Technical Details

**API endpoints:**
```
GET /api/fritzbox/health
  → { status: 'connected', tr064Enabled: true }
  → No rate limit, no cache

GET /api/fritzbox/devices
  → { devices: [...] }
  → 10 req/min rate limit, 60s cache

GET /api/fritzbox/bandwidth
  → { bandwidth: {...} }
  → 10 req/min rate limit, 60s cache

GET /api/fritzbox/wan
  → { wan: {...} }
  → 10 req/min rate limit, 60s cache
```

**Error responses (RFC 9457 format):**
```json
{
  "success": false,
  "error": "Troppe richieste. Riprova tra 42s",
  "code": "RATE_LIMITED",
  "retryAfter": 42
}
```

**Rate limiting:**
- Independent per endpoint: `fritzbox_devices`, `fritzbox_bandwidth`, `fritzbox_wan`
- 10 requests per minute per user per endpoint
- Rate limit state stored in Firebase RTDB: `rateLimits/{userId}/fritzbox_{endpoint}`

**Caching:**
- 60-second TTL (from Plan 01 foundation)
- Cache keys: `devices`, `bandwidth`, `wan`
- Cache storage: `fritzbox/cache/{cacheKey}` (environment-aware with dev/ prefix)
- Cache miss → fetch → store → return
- Cache hit (within TTL) → return cached → no fetch

**Authentication:**
- All routes use `withAuthAndErrorHandler` middleware
- Requires Auth0 session (user.sub)
- Returns 401 UNAUTHORIZED if no session

## Dependencies

**Requires:**
- Plan 01: `fritzboxClient`, `getCachedData`, `checkRateLimitFritzBox` from `@/lib/fritzbox`
- Auth0: `withAuthAndErrorHandler` from `@/lib/core/middleware`
- Core: `success`, `ApiError`, `ERROR_CODES`, `HTTP_STATUS` from `@/lib/core`
- Firebase RTDB: Rate limit storage, cache storage (via foundation layer)

**Provides:**
- `/api/fritzbox/health` - TR-064 connectivity check
- `/api/fritzbox/devices` - Network device list proxy
- `/api/fritzbox/bandwidth` - Bandwidth stats proxy
- `/api/fritzbox/wan` - WAN connection status proxy

**Affects:**
- Future NetworkCard component will consume these endpoints
- Dashboard will display Fritz!Box status via these routes
- Rate limit budget shared across all authenticated users (10 req/min per user per endpoint)

## Next Steps

**Plan 03: NetworkCard Component (Dashboard Integration)**
- Create NetworkCard orchestrator component
- Create NetworkStatus, DeviceList, BandwidthChart presentational components
- Use adaptive polling hooks (useVisibility, useNetworkQuality, useAdaptivePolling)
- Display Fritz!Box health, devices, bandwidth, WAN status
- Handle TR-064 setup guide if health returns 403
- Handle rate limiting with graceful degradation

**Environment setup:**
- Add Fritz!Box credentials to Vercel environment:
  - `FRITZBOX_URL` (e.g., http://fritz.box)
  - `FRITZBOX_USER` (admin username)
  - `FRITZBOX_PASSWORD` (admin password)
- Enable TR-064 API in Fritz!Box admin panel
- Test health endpoint against production router

**Error handling patterns:**
- TR-064 disabled → Show setup guide with link to `/docs/fritzbox-setup`
- Rate limited → Show "Too many requests" banner with retryAfter countdown
- Timeout → Show "Router unreachable" banner
- Not configured → Show "Fritz!Box not set up" error (admin only)

## Commits

1. **e36d846** - `feat(61-02): add Fritz!Box API proxy routes (health, devices, bandwidth, wan)`
   - 4 files changed, 130 insertions(+)

2. **e06c0da** - `test(61-02): add unit tests for Fritz!Box API routes`
   - 4 files changed, 461 insertions(+)

**Total:** 8 files created, 591 lines added, 0 lines deleted

## Self-Check

✅ **Created files exist:**
```bash
✓ app/api/fritzbox/health/route.ts
✓ app/api/fritzbox/devices/route.ts
✓ app/api/fritzbox/bandwidth/route.ts
✓ app/api/fritzbox/wan/route.ts
✓ app/api/fritzbox/health/__tests__/route.test.ts
✓ app/api/fritzbox/devices/__tests__/route.test.ts
✓ app/api/fritzbox/bandwidth/__tests__/route.test.ts
✓ app/api/fritzbox/wan/__tests__/route.test.ts
```

✅ **Commits exist:**
```bash
✓ e36d846 - feat(61-02): add Fritz!Box API proxy routes (health, devices, bandwidth, wan)
✓ e06c0da - test(61-02): add unit tests for Fritz!Box API routes
```

## Self-Check: PASSED

All files created, all commits present, all tests passing, zero type errors.
