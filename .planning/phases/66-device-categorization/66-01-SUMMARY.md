---
phase: 66-device-categorization
plan: 01
subsystem: network
tags:
  - device-categorization
  - vendor-mapping
  - firebase-cache
  - tdd
dependency_graph:
  requires:
    - Firebase RTDB admin functions
    - environmentHelper for path construction
  provides:
    - DeviceCategory types and interfaces
    - Vendor-to-category mapping logic
    - Firebase RTDB vendor cache layer
    - Manual category override storage
  affects:
    - Future API routes (Plan 02)
    - Future UI components (Plan 03)
tech_stack:
  added:
    - macvendors.com API integration
  patterns:
    - TDD (RED-GREEN-REFACTOR)
    - Firebase RTDB caching with TTL
    - Normalized MAC addresses for Firebase keys
    - Priority chain (override > cache > unknown)
key_files:
  created:
    - types/firebase/network.ts
    - lib/network/deviceCategories.ts
    - lib/network/vendorCache.ts
    - lib/network/__tests__/deviceCategories.test.ts
    - lib/network/__tests__/vendorCache.test.ts
  modified: []
decisions:
  - context: "Vendor keyword matching"
    choice: "Case-insensitive partial matching using includes()"
    rationale: "Handles vendor name variations (e.g., 'Espressif Inc.' matches 'Espressif' keyword)"
  - context: "Firebase RTDB update vs set"
    choice: "Use adminDbSet for override storage"
    rationale: "Setting entire object is clearer than update, avoids Record<string, unknown> type constraint"
  - context: "ASUS vendor categorization"
    choice: "Categorize as 'pc' (removed duplicate 'smart-home' entry)"
    rationale: "ASUS laptops are more common than ASUS routers in typical home networks"
  - context: "macvendors.com API error handling"
    choice: "Return null on any error, never throw"
    rationale: "Resilient fire-and-forget pattern, consistent with project's error handling approach"
metrics:
  duration_minutes: 6
  completed_date: "2026-02-16"
  tasks_completed: 2
  tests_added: 36
  files_created: 5
---

# Phase 66 Plan 01: Device Categorization Foundation Summary

**Device categorization foundation with vendor mapping, Firebase cache, and manual overrides**

## Objective

Create the device categorization foundation: DeviceCategory types, vendor-to-category mapping heuristics, Firebase RTDB vendor cache (7-day TTL), and manual override persistence layer.

This provides the business logic and data layer that API routes (Plan 02) and UI components (Plan 03) build upon.

## What Was Built

### Task 1: DeviceCategory Types and Vendor Mapping (TDD)

**Types Created** (`types/firebase/network.ts`):
- `DeviceCategory` type: `'iot' | 'mobile' | 'pc' | 'smart-home' | 'unknown'`
- `CategoryOverride` interface: category, overriddenAt, isManualOverride
- `VendorCacheEntry` interface: vendor, category, timestamp

**Core Logic** (`lib/network/deviceCategories.ts`):
- `categorizeByVendor()`: Maps 40+ vendor keywords to categories
  - Mobile: Apple, Samsung, Xiaomi, Huawei, Google, etc.
  - IoT: Raspberry Pi, Espressif, Arduino, Nordic, etc.
  - Smart Home: AVM, TP-Link, Philips, Netgear, Sonos, Amazon, etc.
  - PC: Dell, Intel, HP, Lenovo, ASUS, Acer, Microsoft, etc.
  - Case-insensitive partial matching
  - Returns 'unknown' for null/empty/unrecognized vendors

- `normalizeMacForFirebase()`: Converts MAC addresses to Firebase-safe keys
  - `AA:BB:CC:DD:EE:FF` → `aa_bb_cc_dd_ee_ff`
  - Handles both colon and dash separators
  - Lowercase for consistency

- `saveCategoryOverride()`: Persists manual category overrides to Firebase
  - Path: `network/deviceCategories/{normalizedMac}`
  - Stores: category, overriddenAt timestamp, isManualOverride flag

- `getCategoryOverride()`: Retrieves manual overrides from Firebase
  - Returns category if exists, null otherwise

- `getDeviceCategory()`: Priority chain for category resolution
  1. Manual override (highest priority)
  2. Cached category from vendor lookup
  3. 'unknown' fallback

**Tests** (`lib/network/__tests__/deviceCategories.test.ts`):
- 25 tests covering all categorization logic
- Vendor mapping for 10+ known vendors
- Edge cases: null, empty string, case sensitivity
- Firebase path construction with normalized MACs
- Priority chain validation

### Task 2: Vendor Cache Layer with TTL (TDD)

**Cache Implementation** (`lib/network/vendorCache.ts`):
- `VENDOR_CACHE_TTL_MS`: 7-day TTL constant (604,800,000 ms)

- `getCachedVendor()`: Retrieves cached vendor info with TTL validation
  - Returns entry if within 7-day TTL
  - Returns null if expired or missing
  - Path: `network/vendorCache/{normalizedMac}`

- `cacheVendor()`: Stores vendor info in Firebase RTDB
  - Accepts VendorCacheEntry (vendor, category, timestamp)
  - Uses normalized MAC for Firebase key

- `fetchVendorName()`: Fetches vendor from macvendors.com API
  - GET request to `https://api.macvendors.com/{mac}`
  - Returns vendor string on 200 response
  - Returns null on 404 (unknown MAC)
  - Returns null on network error (never throws)
  - Graceful error handling for resilience

**Tests** (`lib/network/__tests__/vendorCache.test.ts`):
- 11 tests covering cache operations
- TTL validation (within 7 days, expired, missing)
- Firebase path construction
- macvendors.com API calls with proper URL encoding
- Error handling (404, network errors, non-200 responses)

## Test Coverage

**Total: 36 tests (all passing)**
- deviceCategories.test.ts: 25 tests
- vendorCache.test.ts: 11 tests

**Coverage Areas:**
- ✅ Vendor-to-category mapping (10+ vendors, case-insensitive, partial matching)
- ✅ MAC address normalization (colons, dashes, lowercase)
- ✅ Firebase override storage and retrieval
- ✅ Priority chain (override > cache > unknown)
- ✅ Cache TTL validation (7-day expiration)
- ✅ macvendors.com API integration
- ✅ Error handling (graceful null returns, no throws)

## Technical Decisions

### 1. Vendor Keyword Matching Strategy
**Decision:** Case-insensitive partial matching using `includes()`

**Rationale:**
- Handles vendor name variations (e.g., "Espressif Inc." matches "Espressif")
- Flexible for different MAC vendor API response formats
- Simple implementation with good accuracy

**Alternative Considered:**
- Exact string matching — rejected (too brittle for vendor name variations)

### 2. Firebase Admin Function Choice
**Decision:** Use `adminDbSet` for override storage (changed from `adminDbUpdate`)

**Rationale:**
- Setting entire object is semantically clearer
- Avoids TypeScript `Record<string, unknown>` constraint
- No partial updates needed for this use case

**Discovery:** Initial implementation used `adminDbUpdate`, but TypeScript complained about CategoryOverride type compatibility. Fixed by switching to `adminDbSet`.

### 3. ASUS Categorization
**Decision:** Categorize as 'pc' (removed duplicate 'smart-home' entry)

**Issue:** ASUS appeared twice in CATEGORY_MAPPINGS (smart-home and pc)

**Rationale:**
- ASUS laptops/motherboards are more common in home networks
- Users more likely to encounter ASUS PCs than ASUS routers
- Can be manually overridden if wrong for specific device

### 4. macvendors.com Error Handling
**Decision:** Return null on any error, never throw

**Rationale:**
- Consistent with project's resilient fire-and-forget pattern
- Vendor lookup is non-critical (falls back to 'unknown' category)
- Prevents vendor API failures from breaking device list functionality

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Duplicate ASUS vendor mapping**
- **Found during:** Task 1 GREEN phase (TypeScript compilation)
- **Issue:** 'asus' keyword appeared in both smart-home and pc categories (line 40 and 53)
- **Fix:** Removed smart-home entry, kept pc category
- **Files modified:** lib/network/deviceCategories.ts
- **Commit:** dbfff45 (Task 1)

**2. [Rule 1 - Bug] adminDbUpdate type incompatibility**
- **Found during:** Task 2 verification (TypeScript compilation)
- **Issue:** CategoryOverride interface not assignable to Record<string, unknown>
- **Fix:** Changed adminDbUpdate to adminDbSet (semantically more correct)
- **Files modified:** lib/network/deviceCategories.ts, lib/network/__tests__/deviceCategories.test.ts
- **Commit:** 6df359d (Task 2)

## Integration Points

### Imports
- `@/lib/firebaseAdmin`: adminDbGet, adminDbSet for Firebase RTDB operations
- `@/lib/environmentHelper`: getEnvironmentPath for multi-environment support
- `@/types/firebase/network`: DeviceCategory, CategoryOverride, VendorCacheEntry types

### Exports
**types/firebase/network.ts:**
- DeviceCategory type
- CategoryOverride interface
- VendorCacheEntry interface

**lib/network/deviceCategories.ts:**
- categorizeByVendor(vendor)
- normalizeMacForFirebase(mac)
- saveCategoryOverride(mac, category)
- getCategoryOverride(mac)
- getDeviceCategory(mac, cachedCategory)

**lib/network/vendorCache.ts:**
- VENDOR_CACHE_TTL_MS constant
- getCachedVendor(mac)
- cacheVendor(mac, entry)
- fetchVendorName(mac)

### Used By (Future Plans)
- **Plan 02 (API Routes):** Will use these functions for device category assignment
- **Plan 03 (UI Components):** Will display categories and allow manual overrides

## Verification

✅ All 36 tests pass
✅ No new TypeScript errors
✅ All required exports present
✅ Firebase paths use normalized MAC addresses
✅ Vendor cache respects 7-day TTL
✅ Manual override priority chain works correctly
✅ fetchVendorName handles all error cases gracefully

**Commands Run:**
```bash
npx jest lib/network/__tests__/ --verbose  # 36 passed
npx tsc --noEmit                          # No errors in new files
```

## Next Steps

**Plan 02:** API routes for device category lookup and override management
- GET endpoint to fetch device category (uses getDeviceCategory)
- POST endpoint to save manual override (uses saveCategoryOverride)
- Integration with existing /api/network/fritzbox/devices endpoint

**Plan 03:** UI components for category display and manual override
- Category badge/icon in device list
- Manual override dialog
- Italian labels for categories (IoT, Mobile, PC, Smart Home, Sconosciuto)

## Performance Notes

- Vendor cache reduces macvendors.com API calls (7-day TTL)
- Firebase RTDB reads/writes are async but fast (<100ms typical)
- categorizeByVendor is synchronous and runs in <1ms (keyword lookup)
- No performance concerns for expected device list sizes (10-50 devices)

## Self-Check: PASSED

**Created files exist:**
```bash
FOUND: types/firebase/network.ts
FOUND: lib/network/deviceCategories.ts
FOUND: lib/network/vendorCache.ts
FOUND: lib/network/__tests__/deviceCategories.test.ts
FOUND: lib/network/__tests__/vendorCache.test.ts
```

**Commits exist:**
```bash
FOUND: dbfff45 (Task 1: Device categorization with vendor mapping)
FOUND: 6df359d (Task 2: Vendor cache with 7-day TTL)
```

**Tests pass:**
```bash
✓ 36 tests pass (25 deviceCategories + 11 vendorCache)
```

**TypeScript compilation:**
```bash
✓ No errors in new files
```

All success criteria met. Plan execution complete.
