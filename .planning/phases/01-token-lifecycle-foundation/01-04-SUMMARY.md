---
phase: 01-token-lifecycle-foundation
plan: 04
subsystem: notifications
tags: [fcm, token-refresh, lifecycle, firebase-messaging, 30-day-refresh]

# Dependency graph
requires:
  - phase: 01-01
    provides: Token storage persistence (IndexedDB + localStorage)
  - phase: 01-02
    provides: Device fingerprinting for stable deviceId
provides:
  - Token refresh module with 30-day automatic refresh
  - App startup token age checking
  - Force refresh capability for manual intervention
affects: [01-05-integration, notifications, token-lifecycle]

# Tech tracking
tech-stack:
  added: []
  patterns: [proactive-token-refresh, explicit-token-deletion, graceful-degradation]

key-files:
  created: [lib/tokenRefresh.js, lib/__tests__/tokenRefresh.test.js]
  modified: []

key-decisions:
  - "30-day refresh threshold per Firebase recommendations"
  - "Explicit deleteToken before getToken for clean lifecycle"
  - "Preserve deviceId across refresh to prevent duplicate device entries"
  - "Removed dependency on debug log API (deleted in prior work)"

patterns-established:
  - "Proactive refresh pattern: Check age on startup, refresh if >30 days"
  - "Graceful degradation: Return stored token if refresh fails"
  - "Server-sync optional: Save locally even if server registration fails"

# Metrics
duration: 7.8min
completed: 2026-01-23
---

# Phase 01 Plan 04: Token Refresh Module Summary

**One-liner:** Proactive 30-day token refresh with explicit deletion before renewal, preserving deviceId across refresh cycles

## Performance

- **Duration:** 7.8 minutes
- **Started:** 2026-01-23T18:47:16Z
- **Completed:** 2026-01-23T18:55:06Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created tokenRefresh.js module with 238 lines implementing 30-day refresh cycle
- Implemented 4 exported functions: shouldRefreshToken, checkAndRefreshToken, initializeTokenManagement, forceTokenRefresh
- Created comprehensive test suite with 11 passing tests covering all edge cases
- Addresses TOKEN-02 requirement from research (proactive token refresh)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create tokenRefresh.js module** - `95bb9a0` (feat)
2. **Task 2: Create unit tests for tokenRefresh** - `53ad9a4` (test)

## Files Created/Modified

**Created (2):**
- `lib/tokenRefresh.js` - Token refresh module with 30-day age checking (238 lines)
- `lib/__tests__/tokenRefresh.test.js` - Unit tests for refresh logic (211 lines)

## Technical Implementation

### Token Refresh Flow

**Startup Check (checkAndRefreshToken):**

1. Load stored token from tokenStorage
2. Calculate token age via getTokenAge()
3. If age ≤ 30 days: Update lastUsed timestamp only
4. If age > 30 days: Execute refresh flow

**Refresh Flow:**

1. **Delete old token** - Explicit deleteToken(messaging) call to FCM
2. **Get service worker** - Retrieve active SW registration
3. **Request new token** - getToken(messaging, { vapidKey, serviceWorkerRegistration })
4. **Register with server** - POST /api/notifications/register
5. **Save locally** - saveToken with new token + reset createdAt
6. **Return result** - { refreshed: true, token: newToken }

**Key insight:** Explicit deleteToken before getToken ensures clean lifecycle per Firebase recommendations.

### Exports and Usage

**shouldRefreshToken()**
- Returns boolean: true if age > 30 days
- Used for UI indicators ("Token needs refresh")

**checkAndRefreshToken(userId)**
- Main refresh orchestrator
- Returns: { refreshed, token, error? }
- Called on app startup

**initializeTokenManagement(userId)**
- Convenience wrapper for app initialization
- Returns: { hasToken, token, wasRefreshed }
- Single call handles both check and refresh

**forceTokenRefresh(userId)**
- Manual refresh trigger
- Sets createdAt to epoch 0 to force refresh
- Returns: { success, token, error? }

### Error Handling

**Graceful degradation:**
- Delete failure → Continue with refresh anyway
- Server registration failure → Still save locally
- getToken failure → Return stored token
- No permission → Return error without attempting

**Fallback strategy:** Always prefer stored token over no token.

### Test Coverage

**11 tests, all passing:**

1. shouldRefreshToken - no token (false)
2. shouldRefreshToken - fresh token (false)
3. shouldRefreshToken - old token (true)
4. shouldRefreshToken - exactly at threshold (true)
5. checkAndRefreshToken - no stored token
6. checkAndRefreshToken - fresh token (updates lastUsed)
7. checkAndRefreshToken - old token (refreshes)
8. checkAndRefreshToken - no permission
9. checkAndRefreshToken - deleteToken failure (continues)
10. checkAndRefreshToken - server registration failure (saves locally)
11. checkAndRefreshToken - refresh failure (returns stored token)

## Decisions Made

**1. 30-day threshold**
- **Rationale:** Firebase recommendation for optimal deliverability
- **Impact:** Balance between freshness and unnecessary refreshes

**2. Explicit deleteToken before getToken**
- **Rationale:** Firebase best practice for clean token lifecycle
- **Impact:** Prevents token accumulation on FCM side

**3. Preserve deviceId across refresh**
- **Rationale:** Same device should keep same deviceId even after token refresh
- **Impact:** No duplicate device entries in Firebase, cleaner multi-device UI

**4. Removed debug log API dependency**
- **Rationale:** Debug log API was deleted in prior work (app/api/debug/log/route.js)
- **Impact:** Using console.log instead for debug output
- **Applied:** Deviation Rule 3 (auto-fix blocking issue)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Debug log API deleted**

- **Found during:** Task 1 implementation
- **Issue:** Plan template referenced `/api/debug/log` but git status shows `D app/api/debug/log/route.js`
- **Fix:** Changed debugLog function to use console.log only instead of fetch to debug API
- **Files modified:** lib/tokenRefresh.js (line 39-42)
- **Commit:** 95bb9a0

**Rationale:** This was a blocking issue - code would fail if debug API was called. Falling back to console.log maintains debug capability without external dependency.

## Issues Encountered

None - implementation followed research patterns from 01-RESEARCH.md TOKEN-02 specification.

## User Setup Required

None - module is ready for integration in notificationService.js in future plans.

**Environment variables already configured:**
- NEXT_PUBLIC_FIREBASE_VAPID_KEY (required for getToken)

## Next Phase Readiness

**Ready for plan 01-05 (integration):**
- Token refresh module complete and tested
- initializeTokenManagement() ready to be called on app startup
- checkAndRefreshToken() can be integrated into notificationService.js

**Dependencies satisfied:**
- tokenStorage.js provides loadToken, saveToken, getTokenAge, updateLastUsed
- deviceFingerprint.js provides getCurrentDeviceFingerprint
- firebase/messaging provides getToken, deleteToken

**Integration points for 01-05:**
- Call initializeTokenManagement(userId) on app load
- Call checkAndRefreshToken(userId) on scheduled intervals (optional)
- Expose forceTokenRefresh(userId) in settings UI for manual refresh

**No blockers:**
- All tests passing (11/11)
- No external service configuration needed
- Ready for integration

---
*Phase: 01-token-lifecycle-foundation*
*Completed: 2026-01-23*
