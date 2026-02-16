---
phase: 66-device-categorization
plan: 02
subsystem: network
tags: [api-routes, vendor-lookup, category-override, firebase-cache, auth0]
dependency_graph:
  requires: [66-01]
  provides: [vendor-lookup-api, category-override-api]
  affects: []
tech_stack:
  added: []
  patterns: [api-route, auth-middleware, validation, firebase-caching]
key_files:
  created:
    - app/api/network/vendor-lookup/route.ts
    - app/api/network/category-override/route.ts
    - app/api/network/vendor-lookup/__tests__/route.test.ts
    - app/api/network/category-override/__tests__/route.test.ts
  modified: []
decisions:
  - Mock request.json() directly instead of using native Request for POST body tests
  - No Content-Type header validation in route (middleware handles it)
  - Request mock pattern for POST routes uses json fn mock
metrics:
  duration: 7m
  completed: 2026-02-16
  tasks: 2
  files: 4
  tests_added: 12
  tests_passing: 12
---

# Phase 66 Plan 02: Vendor Lookup and Category Override API Routes

**One-liner:** Authenticated API routes for MAC vendor resolution with 7-day Firebase cache and manual category override persistence.

---

## Overview

Created two API routes that expose the categorization logic from Plan 01 as authenticated endpoints for UI consumption. Both routes follow the established Fritz!Box API proxy pattern with Auth0 authentication, RFC 9457 error handling, and Italian error messages.

---

## Tasks Completed

### Task 1: API Routes Implementation

**Files created:**
- `app/api/network/vendor-lookup/route.ts` - GET endpoint for MAC vendor lookup
- `app/api/network/category-override/route.ts` - POST endpoint for manual category override

**Key features:**

**Vendor Lookup Route (`GET /api/network/vendor-lookup?mac=XX:XX:XX:XX:XX:XX`):**
- Checks Firebase cache (7-day TTL) before calling macvendors.com API
- Returns `cached: true/false` flag to indicate cache hit/miss
- Returns vendor name and auto-assigned category
- Caches even unknown results to prevent repeated API calls
- No rate limiting (relies on 7-day cache to minimize external API calls)

**Category Override Route (`POST /api/network/category-override`):**
- Accepts `{ mac: string, category: DeviceCategory }` body
- Validates category against whitelist: `['iot', 'mobile', 'pc', 'smart-home', 'unknown']`
- Persists manual category choice to Firebase via `saveCategoryOverride`
- Returns `saved: true` confirmation

**Both routes:**
- Use `withAuthAndErrorHandler` for Auth0 authentication
- Follow RFC 9457 error format via `ApiError` class
- Return Italian error messages consistent with Fritz!Box routes
- Export `dynamic = 'force-dynamic'` for Next.js

**Commit:** `f75595d` (bundled with DeviceCategoryBadge)

---

### Task 2: API Route Unit Tests

**Files created:**
- `app/api/network/vendor-lookup/__tests__/route.test.ts` - 7 tests
- `app/api/network/category-override/__tests__/route.test.ts` - 5 tests

**Test coverage:**

**Vendor Lookup Tests (7 tests):**
1. Returns 401 when not authenticated
2. Returns 400 when MAC parameter missing
3. Returns 200 with cached vendor and `cached: true` on cache hit
4. Returns 200 with fresh vendor and `cached: false` on cache miss
5. Returns category 'unknown' when fetchVendorName returns null
6. Caches even unknown results to prevent repeated API calls
7. Handles fetchVendorName failure gracefully (returns unknown category)

**Category Override Tests (5 tests):**
1. Returns 401 when not authenticated
2. Returns 400 when MAC missing from body
3. Returns 400 when category is invalid (e.g., 'laptop')
4. Returns 200 and calls saveCategoryOverride with correct args on valid request
5. Returns `saved: true` confirmation in response

**Test pattern:**
- Mock request.json() directly for POST body parsing (native Request doesn't support json() in Jest)
- Mock console.error/warn to suppress test output
- Use `jest.mocked()` for type-safe mock access
- Follow existing Fritz!Box route test structure

**Results:**
- All 12 tests passing
- No regressions in Fritz!Box route tests (33 tests still green)

**Commit:** `3e9d087`

---

## Deviations from Plan

**Auto-fixed Issues:**

**1. [Rule 3 - Blocking] POST request body mocking in tests**
- **Found during:** Task 2 test execution
- **Issue:** Native `Request` object in Jest doesn't support `.json()` method, causing 500 errors
- **Fix:** Mock request object with `json: jest.fn().mockResolvedValue(body)` instead of `new Request()`
- **Files modified:** `app/api/network/category-override/__tests__/route.test.ts`
- **Commit:** `3e9d087`

---

## Verification Results

**Task 1 Verification:**
- ✅ `npx tsc --noEmit` - No new TypeScript errors in network routes
- ✅ Files exist at expected paths

**Task 2 Verification:**
- ✅ `npx jest app/api/network/ --verbose` - All 12 tests pass
- ✅ `npx jest app/api/fritzbox/ --verbose` - All 33 Fritz!Box tests pass (no regressions)

**Overall Plan Verification:**
- ✅ Vendor lookup returns vendor name + category for any MAC address
- ✅ Cache hit returns result without calling macvendors.com (cached flag)
- ✅ Category override persists valid categories to Firebase
- ✅ Invalid categories rejected with 400 and Italian message
- ✅ All routes require Auth0 authentication (401 without session)

---

## Key Decisions

**Decision 1:** Mock request.json() directly for POST route tests
- **Context:** Native Request object in Jest doesn't implement json() method
- **Choice:** Use `{ json: jest.fn().mockResolvedValue(body) }` pattern
- **Rationale:** Simplest approach that works with existing middleware
- **Impact:** Sets pattern for future POST route tests

**Decision 2:** No rate limiting on vendor-lookup endpoint
- **Context:** Plan specified no rate limiting, unlike Fritz!Box routes
- **Choice:** Rely on 7-day Firebase cache to minimize external API calls
- **Rationale:** Home networks (20-30 devices) only need initial lookups once per week
- **Impact:** If macvendors.com rate limit becomes issue, can add later

---

## Dependencies

**Requires (from Plan 01):**
- `lib/network/vendorCache.ts` - getCachedVendor, cacheVendor, fetchVendorName
- `lib/network/deviceCategories.ts` - categorizeByVendor, saveCategoryOverride
- `types/firebase/network.ts` - DeviceCategory type

**Provides (for Plan 03):**
- `GET /api/network/vendor-lookup` - MAC to vendor/category API
- `POST /api/network/category-override` - Manual category persistence API

---

## Self-Check: PASSED

**Files verification:**
```bash
✅ app/api/network/vendor-lookup/route.ts
✅ app/api/network/category-override/route.ts
✅ app/api/network/vendor-lookup/__tests__/route.test.ts
✅ app/api/network/category-override/__tests__/route.test.ts
```

**Commits verification:**
```bash
✅ f75595d - feat(66-03): add DeviceCategoryBadge component (includes Task 1 routes)
✅ 3e9d087 - test(66-02): add API route unit tests for vendor lookup and category override
```

**Tests verification:**
```bash
✅ 12 new tests passing (7 vendor-lookup + 5 category-override)
✅ 33 Fritz!Box tests still passing (no regressions)
```

---

## Next Steps

**Plan 03:** DeviceListTable integration
- Add category column to device list table
- Integrate DeviceCategoryBadge component
- Add interactive category override via modal
- Wire up to vendor-lookup and category-override APIs

---

**Status:** ✅ Complete
**Completion Date:** 2026-02-16
**Duration:** 7 minutes
**Total Tests Added:** 12
**Total Tests Passing:** 12
