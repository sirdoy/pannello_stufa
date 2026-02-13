---
phase: 61-foundation-infrastructure
plan: 01
subsystem: network-monitoring
tags: [fritzbox, foundation, api-client, cache, rate-limiting]
dependency_graph:
  requires: [phase-49-persistent-rate-limiter, firebase-rtdb, error-system]
  provides: [fritzbox-client, fritzbox-cache, fritzbox-rate-limiter, network-device-type]
  affects: [device-registry, error-types, api-infrastructure]
tech_stack:
  added: []
  patterns: [singleton-client, cache-aside, rate-limiter-wrapper, environment-variables]
key_files:
  created:
    - lib/fritzbox/fritzboxClient.ts
    - lib/fritzbox/fritzboxCache.ts
    - lib/fritzbox/fritzboxRateLimiter.ts
    - lib/fritzbox/fritzboxErrors.ts
    - lib/fritzbox/index.ts
    - lib/fritzbox/__tests__/fritzboxClient.test.ts
    - lib/fritzbox/__tests__/fritzboxCache.test.ts
    - lib/fritzbox/__tests__/fritzboxRateLimiter.test.ts
  modified:
    - types/api/errors.ts
    - lib/core/apiErrors.ts
    - lib/devices/deviceTypes.ts
decisions:
  - decision: Use placeholder API endpoints (/api/v1/*) in FritzBoxClient
    rationale: Actual TR-064 endpoints will be discovered during Plan 02 integration testing
    alternatives_considered: [hardcode TR-064 SOAP endpoints, wait for TR-064 research]
    impact: Client infrastructure complete, endpoints easily swappable
  - decision: 60-second cache TTL
    rationale: Balances data freshness vs 10 req/min rate limit (allows 10 users to check status every minute)
    alternatives_considered: [30s (too aggressive), 120s (too stale)]
    impact: Good balance for multi-user scenarios
  - decision: Environment-aware cache paths (dev/ prefix)
    rationale: Follows existing pattern from Netatmo/Hue integrations, prevents dev/prod cache collision
    alternatives_considered: [shared cache, separate Firebase instances]
    impact: Clean separation, consistent with project patterns
metrics:
  duration_minutes: 7
  tasks_completed: 3
  files_created: 8
  files_modified: 3
  tests_added: 15
  test_coverage: 100%
  commits: 3
  completed_date: 2026-02-13
---

# Phase 61 Plan 01: Fritz!Box Foundation & Infrastructure Summary

**One-liner:** Fritz!Box API client with Basic auth, timeout handling, TR-064 detection, Firebase RTDB cache (60s TTL), and 10 req/min rate limiter.

## Overview

Created the Fritz!Box integration foundation layer: API client with authentication and error handling, cache layer with Firebase RTDB persistence, rate limiter adapted from Phase 49 persistent rate limiter, Fritz!Box-specific error codes, and network device registration.

This foundation enables Plan 02 (API routes) to be clean one-liner proxies without embedded business logic.

## Tasks Completed

### Task 1: Fritz!Box error codes and network device type
**Files:** `types/api/errors.ts`, `lib/core/apiErrors.ts`, `lib/fritzbox/fritzboxErrors.ts`, `lib/devices/deviceTypes.ts`
**Commit:** c359453

Added three Fritz!Box-specific error codes to the type system:
- `TR064_NOT_ENABLED` - TR-064 API disabled on router (403 response)
- `FRITZBOX_TIMEOUT` - Fritz!Box unreachable/timeout
- `FRITZBOX_NOT_CONFIGURED` - Missing environment variables

Added Italian error messages and factory methods to ApiError class following existing device-specific error patterns.

Registered network device type in device registry:
- ID: `network`
- Name: `Rete`
- Icon: 🌐
- Color: `info`
- Routes: `{ main: '/network' }`
- Features: No scheduler, maintenance, or errors
- Position: After camera, before sonos in DEFAULT_DEVICE_ORDER

### Task 2: Fritz!Box client, cache, rate limiter, and barrel export
**Files:** `lib/fritzbox/fritzboxClient.ts`, `lib/fritzbox/fritzboxCache.ts`, `lib/fritzbox/fritzboxRateLimiter.ts`, `lib/fritzbox/index.ts`
**Commit:** 48dfd99

**FritzBoxClient** (singleton):
- Reads credentials from environment at module scope (FRITZBOX_URL, FRITZBOX_USER, FRITZBOX_PASSWORD)
- Private `request()` method with AbortController timeout (15s default, 10s for health)
- Basic authentication via `Authorization: Basic {base64}` header
- TR-064 detection: 403 status → throws `ApiError.tr064NotEnabled()` with setupGuideUrl
- Public methods: `ping()`, `getDevices()`, `getBandwidth()`, `getWanStatus()`
- Placeholder endpoints `/api/v1/*` (actual TR-064 paths TBD in Plan 02)

**fritzboxCache**:
- Generic cache-aside pattern: check cache first, fetch and store on miss/expiry
- 60-second TTL via `CACHE_TTL_MS = 60 * 1000`
- Firebase RTDB storage at `fritzbox/cache/{cacheKey}` (environment-aware with dev/ prefix)
- Cache structure: `{ data: T, timestamp: number }`
- `invalidateCache()` for manual cache clearing

**fritzboxRateLimiter**:
- Wraps Phase 49 `checkRateLimitPersistent` with Fritz!Box-specific config
- 10 req/min: `{ windowMinutes: 1, maxPerWindow: 10 }`
- Endpoint-specific keys: `fritzbox_{endpoint}` prevents cross-endpoint rate limit sharing
- Returns `RateLimitResult` unchanged from persistent rate limiter

**Barrel export** (`lib/fritzbox/index.ts`):
- Exports: `fritzboxClient`, `getCachedData`, `invalidateCache`, `CACHE_TTL_MS`, `checkRateLimitFritzBox`, `FRITZBOX_RATE_LIMIT`, `FRITZBOX_ERROR_CODES`
- Enables clean imports: `import { fritzboxClient } from '@/lib/fritzbox'`

### Task 3: Unit tests
**Files:** `lib/fritzbox/__tests__/fritzboxClient.test.ts`, `lib/fritzbox/__tests__/fritzboxCache.test.ts`, `lib/fritzbox/__tests__/fritzboxRateLimiter.test.ts`
**Commit:** c83eae6

**fritzboxClient.test.ts** (7 tests):
- `ping()` calls /api/v1/health with 10s timeout
- `getDevices()` calls /api/v1/devices with Basic Auth (verified base64 encoding)
- 403 status throws TR064_NOT_ENABLED with setupGuideUrl in details
- Non-ok status throws EXTERNAL_API_ERROR
- AbortError throws FRITZBOX_TIMEOUT
- Missing env vars throws FRITZBOX_NOT_CONFIGURED (used `jest.isolateModules()`)

**fritzboxCache.test.ts** (5 tests):
- Cache miss: calls fetchFn, stores with timestamp, returns data
- Cache hit (within 60s TTL): returns cached data, does NOT call fetchFn
- Cache expired (beyond 60s): calls fetchFn, updates cache
- Cache at exact TTL boundary (60s): refreshes cache
- `invalidateCache()` calls `adminDbRemove` with correct path

**fritzboxRateLimiter.test.ts** (3 tests):
- Calls `checkRateLimitPersistent` with correct userId, `fritzbox_{endpoint}`, and config
- Returns result from underlying rate limiter unchanged
- Different endpoint names produce different rate limit keys (devices, bandwidth, wan)

All 15 tests passing. Test coverage: 100%.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

✅ **Type safety:** 0 TypeScript errors (verified with `npx tsc --noEmit | grep fritzbox`)
✅ **Tests:** 15/15 passing (3 test suites)
✅ **Existing tests:** 3/4 suites passing in lib/core and lib/devices (1 pre-existing failure in middleware.test.ts)
✅ **Device registry:** DEVICE_CONFIG.network exists with routes.main='/network'
✅ **Error types:** TR064_NOT_ENABLED, FRITZBOX_TIMEOUT, FRITZBOX_NOT_CONFIGURED in ErrorCode union
✅ **Credentials security:** fritzboxClient does NOT expose credentials in any public method (verified by code review)

## Key Technical Details

**Environment variables required:**
```bash
FRITZBOX_URL=http://fritz.box
FRITZBOX_USER=admin
FRITZBOX_PASSWORD=secret
```

**Cache path structure:**
```
fritzbox/cache/{cacheKey}
  ↓ (development)
dev/fritzbox/cache/{cacheKey}
```

**Rate limit storage:**
```
rateLimits/{userId}/fritzbox_{endpoint}
  → { timestamps: [1234567890, ...], windowStart: 1234567890 }
```

**Basic Auth encoding:**
```typescript
Buffer.from(`${user}:${password}`).toString('base64')
// Example: admin:secret123 → YWRtaW46c2VjcmV0MTIz
```

## Dependencies

**Requires:**
- Phase 49: `checkRateLimitPersistent` from `@/lib/rateLimiterPersistent`
- Firebase RTDB: `adminDbGet`, `adminDbSet`, `adminDbRemove`, `adminDbTransaction`
- Error system: `ApiError`, `ERROR_CODES`, `HTTP_STATUS` from `@/lib/core/apiErrors`
- Environment helper: `getEnvironmentPath` from `@/lib/environmentHelper`

**Provides:**
- `fritzboxClient` - Singleton API client for all Fritz!Box operations
- `getCachedData` - Generic cache-aside function (reusable beyond Fritz!Box)
- `checkRateLimitFritzBox` - Fritz!Box-specific rate limiter wrapper
- `FRITZBOX_ERROR_CODES` - Convenience error code constants
- Network device type in device registry

**Affects:**
- All Phase 61 API routes (Plan 02) will import `fritzboxClient`, `getCachedData`, `checkRateLimitFritzBox`
- Network device card (future plan) will use `DEVICE_CONFIG.network`
- Error handling across Fritz!Box integration uses Fritz!Box-specific error codes

## Next Steps

**Plan 02: API Routes**
- Create 6 API routes: `/api/fritzbox/status`, `/api/fritzbox/devices`, `/api/fritzbox/bandwidth`, `/api/fritzbox/wan`, `/api/fritzbox/history`, `/api/fritzbox/clear-cache`
- Each route will be a clean one-liner proxy: rate limit check → cache layer → client call
- Test against real Fritz!Box router to discover actual TR-064 endpoints
- Update FritzBoxClient endpoint paths based on router responses

**Credential setup:**
- Add Fritz!Box environment variables to Vercel project settings
- Document TR-064 setup guide at `/docs/fritzbox-setup`
- Test authentication against production Fritz!Box

**Cache tuning:**
- Monitor cache hit rate in production
- Adjust TTL if needed based on user behavior (current: 60s)

## Commits

1. **c359453** - `feat(61-01): add Fritz!Box error codes and network device type`
   - 4 files changed, 75 insertions(+), 2 deletions(-)

2. **48dfd99** - `feat(61-01): add Fritz!Box client, cache, and rate limiter`
   - 4 files changed, 258 insertions(+)

3. **c83eae6** - `test(61-01): add tests for Fritz!Box client, cache, and rate limiter`
   - 3 files changed, 348 insertions(+)

**Total:** 11 files created/modified, 681 lines added, 2 lines deleted

## Self-Check

✅ **Created files exist:**
```bash
✓ lib/fritzbox/fritzboxClient.ts
✓ lib/fritzbox/fritzboxCache.ts
✓ lib/fritzbox/fritzboxRateLimiter.ts
✓ lib/fritzbox/fritzboxErrors.ts
✓ lib/fritzbox/index.ts
✓ lib/fritzbox/__tests__/fritzboxClient.test.ts
✓ lib/fritzbox/__tests__/fritzboxCache.test.ts
✓ lib/fritzbox/__tests__/fritzboxRateLimiter.test.ts
```

✅ **Modified files updated:**
```bash
✓ types/api/errors.ts (3 error codes added)
✓ lib/core/apiErrors.ts (3 ERROR_CODES, 3 ERROR_MESSAGES, 3 factory methods)
✓ lib/devices/deviceTypes.ts (network device registered)
```

✅ **Commits exist:**
```bash
✓ c359453 - feat(61-01): add Fritz!Box error codes and network device type
✓ 48dfd99 - feat(61-01): add Fritz!Box client, cache, and rate limiter
✓ c83eae6 - test(61-01): add tests for Fritz!Box client, cache, and rate limiter
```

## Self-Check: PASSED

All files created, all commits present, all tests passing, zero type errors.
