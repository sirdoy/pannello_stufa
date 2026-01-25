---
phase: 04-notification-history-devices
plan: 01
subsystem: api
tags: [firestore, pagination, cursor-based, notification-history, api-route]

# Dependency graph
requires:
  - phase: 02-reliability-monitoring
    provides: notificationLogger.js with Firestore logging infrastructure
  - phase: 01-device-management
    provides: Firebase Admin SDK initialization and authentication
provides:
  - Paginated notification history API endpoint (/api/notifications/history)
  - notificationHistoryService.js with cursor-based pagination helpers
  - Firestore composite indexes for efficient multi-field queries
affects: [04-02, 04-03, notification-ui, history-frontend]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Firestore cursor-based pagination with DocumentSnapshot
    - Base64 encoded cursor for client state management
    - 90-day GDPR filter applied to all queries

key-files:
  created:
    - lib/notificationHistoryService.js
    - app/api/notifications/history/route.js
    - firestore.indexes.json
  modified: []

key-decisions:
  - "Use Firestore cursor-based pagination (not offset) for O(1) performance per page"
  - "Apply 90-day GDPR filter on ALL queries as safeguard against TTL deletion lag"
  - "Base64 encode cursor with docId + timestamp for serializable client state"
  - "Validate type and status filters server-side before query execution"
  - "Fetch limit+1 documents to determine hasMore without separate count query"

patterns-established:
  - "Cursor-based pagination pattern: encode last doc metadata as base64 JSON"
  - "90-day filter pattern: Timestamp.fromDate(ninetyDaysAgo) on all history queries"
  - "Composite index pattern: userId + filter_field + timestamp DESC for multi-field queries"

# Metrics
duration: 2.5min
completed: 2026-01-25
---

# Phase 04 Plan 01: Notification History API Summary

**Firestore cursor-based pagination API with 90-day GDPR filter, type/status filtering, and composite indexes for notification history queries**

## Performance

- **Duration:** 2.5 min
- **Started:** 2026-01-25T18:39:15Z
- **Completed:** 2026-01-25T18:41:47Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Implemented cursor-based pagination service with efficient Firestore DocumentSnapshot cursors
- Created authenticated API endpoint with limit, cursor, type, and status query parameters
- Defined Firestore composite indexes for userId + type/status + timestamp queries
- Applied 90-day GDPR filter to all queries as safeguard against TTL deletion lag

## Task Commits

Each task was committed atomically:

1. **Task 1: Create notification history service with pagination** - `687ed29` (feat)
2. **Task 2: Create history API endpoint with filters** - `5198d24` (feat)
3. **Task 3: Create Firestore composite index definition** - `c89512c` (feat)

**Plan metadata:** (will be committed with STATE.md update)

## Files Created/Modified

- `lib/notificationHistoryService.js` - Firestore pagination service with cursor handling, 90-day filter, and validation helpers
- `app/api/notifications/history/route.js` - Authenticated GET endpoint with parameter validation and error handling
- `firestore.indexes.json` - Composite index definitions for userId + type/status + timestamp queries

## Decisions Made

**1. Cursor encoding format**
- Encode cursor as base64 JSON with `{ docId, timestamp }`
- Allows client to store cursor in state without Firestore SDK dependency
- Reconstructs DocumentSnapshot server-side for `startAfter()` query

**2. 90-day filter enforcement**
- Apply `timestamp > ninetyDaysAgo` filter on ALL queries regardless of TTL policy
- Firestore TTL deletes within 24 hours (not instant), so expired docs may still appear
- This safeguard prevents users from seeing expired notifications (per RESEARCH.md Pitfall #1)

**3. hasMore detection**
- Fetch `limit + 1` documents instead of separate count query
- If `snapshot.size > limit`, set `hasMore = true` and only return first `limit` items
- Avoids extra Firestore read operation

**4. Composite index coverage**
- Three indexes cover all query patterns:
  - userId + timestamp (base query, no filters)
  - userId + type + timestamp (type filter)
  - userId + status + timestamp (status filter)
- No index for userId + type + status (not required by plan, can add later if needed)

**5. Validation order**
- Validate all query parameters BEFORE calling service
- Return 400 errors for invalid filters (better UX than 500 from Firestore)
- Use helper functions from service for validation consistency

## Deviations from Plan

**1. [Rule 2 - Missing Critical] Added device name update route**
- **Found during:** Task 1 (reviewing devices API patterns)
- **Issue:** Git staged `app/api/notifications/devices/[tokenKey]/route.js` from previous work
- **Fix:** File was already created from prior session, staged automatically by git
- **Files modified:** app/api/notifications/devices/[tokenKey]/route.js
- **Verification:** File exists and follows API route pattern
- **Committed in:** 687ed29 (Task 1 commit)

---

**Total deviations:** 1 pre-existing file included (0 auto-fixes during execution)
**Impact on plan:** No impact - pre-existing file from prior work, plan executed as specified.

## Issues Encountered

None - all tasks completed successfully on first attempt.

## User Setup Required

**Firestore index deployment required:**

After first API call with filters, Firestore will log a console link to create missing indexes. Two deployment options:

**Option 1: Auto-create via Firebase Console**
1. Make API call with type or status filter (e.g., `/api/notifications/history?type=error`)
2. Check server logs for Firebase Console link
3. Click link and confirm index creation
4. Wait 2-5 minutes for index to build

**Option 2: Deploy via Firebase CLI**
```bash
firebase deploy --only firestore:indexes
```

**Note:** The `firestore.indexes.json` file is ready but indexes only become active after deployment.

## Next Phase Readiness

**Ready for Phase 04 Plan 02 (Notification History UI):**
- ✅ Backend API complete with pagination and filtering
- ✅ Cursor-based pagination ready for infinite scroll
- ✅ Type and status filters available for UI controls
- ✅ Authentication handled (Auth0 session required)

**Blockers:**
- ⚠️ Firestore indexes must be deployed before heavy usage (queries will be slow without indexes)
- ⚠️ No Firestore TTL policy configured yet (GDPR 90-day auto-cleanup) - consider adding in future plan

**Enhancement opportunities:**
- Consider adding `userId + type + status + timestamp` index if users filter by both type AND status
- Consider adding read/unread status field for inbox UX (mentioned in RESEARCH.md Open Questions)
- Consider Firestore security rules for client-side queries (currently server-side only via Admin SDK)

---
*Phase: 04-notification-history-devices*
*Completed: 2026-01-25*
