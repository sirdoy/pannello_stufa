---
phase: 04-notification-history-devices
plan: 02
subsystem: api
tags: [device-management, firebase-rtdb, rest-api, device-naming, device-removal]

# Dependency graph
requires:
  - phase: 01-device-management
    provides: Firebase Admin SDK with adminDbGet, adminDbUpdate, adminDbRemove
  - phase: 02-reliability-monitoring
    provides: Device registration and tracking in users/{userId}/fcmTokens
provides:
  - Device naming endpoint (PATCH /api/notifications/devices/[tokenKey])
  - Device removal endpoint (DELETE /api/notifications/devices/[tokenKey])
  - Ownership validation for device modifications
affects: [04-03, 04-04, device-management-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Dynamic route parameters with Next.js 15 (await context.params)
    - Ownership validation pattern for device operations
    - Firebase RTDB adminDbRemove for safe device deletion

key-files:
  created:
    - app/api/notifications/devices/[tokenKey]/route.js
  modified: []

key-decisions:
  - "Max 50 chars for displayName to prevent UI overflow"
  - "Trim displayName to prevent whitespace-only names"
  - "Verify device ownership before ANY modification (404 if unauthorized)"
  - "Use adminDbRemove for device deletion (already exists in firebaseAdmin.js)"
  - "Return 404 for both 'not found' and 'unauthorized' to prevent user enumeration"

patterns-established:
  - "Device ownership validation: adminDbGet before adminDbUpdate/adminDbRemove"
  - "Dynamic route pattern: await context.params (Next.js 15 requirement)"
  - "Input sanitization: trim strings, validate length before database write"

# Metrics
duration: 3min
completed: 2026-01-25
---

# Phase 04 Plan 02: Device Management Endpoints Summary

**PATCH and DELETE endpoints for device naming and removal with ownership validation and input sanitization**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-25T19:12:35Z
- **Completed:** 2026-01-25T19:15:50Z
- **Tasks:** 2
- **Files modified:** 1 (pre-existing from 04-01)

## Accomplishments
- Verified device management endpoint with PATCH and DELETE handlers
- Confirmed displayName validation (max 50 chars, non-empty, trimmed)
- Validated ownership verification before modifications
- Confirmed adminDbRemove function availability in firebaseAdmin.js

## Task Commits

**Work already completed in plan 04-01:**
- Device management endpoint created in commit `687ed29` (plan 04-01 Task 1)

**Current plan verification:**
1. **Task 1: Create device management endpoint (PATCH + DELETE)** - Pre-existing (687ed29)
2. **Task 2: Verify adminDbRemove exists in firebaseAdmin.js** - Verified (lines 137-140)

**No new commits required** - all functionality was already implemented in plan 04-01 as a "deviation" (pre-existing file).

## Files Created/Modified

- `app/api/notifications/devices/[tokenKey]/route.js` - Already created in 04-01 (commit 687ed29)
  - PATCH handler for updating displayName
  - DELETE handler for removing device
  - Both handlers verify device ownership

## Decisions Made

**1. DisplayName validation**
- Max 50 characters to prevent UI overflow in device lists
- Non-empty string requirement (no whitespace-only names)
- Trim input to remove leading/trailing whitespace

**2. Security approach**
- Always verify device ownership via `adminDbGet(users/{userId}/fcmTokens/{tokenKey})`
- Return 404 for both "not found" and "unauthorized" to prevent user enumeration
- Use authenticated userId from session (session.user.sub)

**3. Next.js 15 compatibility**
- Use `await context.params` pattern (required in Next.js 15)
- Dynamic route parameters are now async

**4. Database operations**
- Use `adminDbUpdate` for partial updates (preserves other fields)
- Add `updatedAt` timestamp on PATCH operations
- Use `adminDbRemove` for complete device deletion

## Deviations from Plan

None - plan was already executed in 04-01.

**Context:**
- Plan 04-01 created the device management endpoint as part of Task 1
- The 04-01 SUMMARY documented this as "Rule 2 - Missing Critical" deviation
- File was staged automatically by git from prior session work
- This plan (04-02) verifies the implementation meets all requirements

## Issues Encountered

None - all verification criteria met on first check.

## API Endpoints

### PATCH /api/notifications/devices/[tokenKey]

**Request:**
```json
{
  "displayName": "Kitchen iPad"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Device name updated",
    "displayName": "Kitchen iPad",
    "tokenKey": "abc123..."
  }
}
```

**Errors:**
- 400: displayName validation error (empty, >50 chars)
- 404: Device not found or unauthorized
- 401: Not authenticated

### DELETE /api/notifications/devices/[tokenKey]

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Device removed successfully",
    "tokenKey": "abc123..."
  }
}
```

**Errors:**
- 404: Device not found or unauthorized
- 401: Not authenticated

**Security:** Both endpoints verify device ownership. Users cannot modify other users' devices.

## Verification Checklist

All success criteria verified:

- ✅ PATCH request with `{ displayName: "Kitchen iPad" }` updates device name
- ✅ DELETE request removes device from user's fcmTokens
- ✅ Unauthorized users cannot modify other users' devices (404 error)
- ✅ Invalid tokenKey returns 404 error

All must-haves verified:

- ✅ User can rename their devices via PATCH request
- ✅ User can remove their devices via DELETE request
- ✅ Only device owner can modify their own devices
- ✅ Removed device stops receiving notifications (adminDbRemove deletes from fcmTokens)

## Next Phase Readiness

**Ready for Phase 04 Plan 03 (Device Management UI):**
- ✅ Backend API complete for device naming and removal
- ✅ Ownership validation ensures security
- ✅ Input validation prevents bad data
- ✅ Error responses provide clear feedback for UI

**No blockers** - API ready for frontend integration.

**Enhancement opportunities:**
- Consider adding bulk device operations (rename/remove multiple devices)
- Consider adding device metadata updates (platform, browser, OS)
- Consider adding "last used" timestamp update on device operations
- Consider adding device deactivation (soft delete) instead of hard delete

---
*Phase: 04-notification-history-devices*
*Completed: 2026-01-25*
