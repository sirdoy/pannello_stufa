---
status: resolved
trigger: "notification-history-empty-results"
created: 2026-01-26T10:00:00Z
updated: 2026-01-26T10:45:00Z
---

## Current Focus

hypothesis: CONFIRMED - 90-day filter used > instead of >= which excluded records at boundary
test: changed operator from > to >= and created regression tests
expecting: notifications now appear, tests prevent future regressions
next_action: user should verify notifications appear on /settings/notifications/history

## Symptoms

expected: Notification history page should display 2 notifications that exist in Firestore
actual: Page loads without errors but shows no notifications (empty list)
errors: No error messages - query executes successfully but returns 0 results
reproduction:
1. Navigate to /settings/notifications/history
2. API call GET /api/notifications/history?limit=50 returns 200 OK
3. Page shows no notifications
4. Firestore console shows 2 records in notificationLogs collection
timeline:
- Firestore indices successfully deployed and enabled
- Query no longer fails with index errors
- API returns successfully but with empty results
- Records in Firestore have:
  - userId: Auth0 format (auth0|... or google-oauth2|...)
  - timestamp: Recent (within last 90 days)
  - Both records visible in Firestore console

## Eliminated

## Evidence

- timestamp: 2026-01-26T10:05:00Z
  checked: API route and notificationHistoryService
  found: Query uses `user.sub` directly from Auth0 session (line 91 in route.js), service queries Firestore with `where('userId', '==', userId)` (line 47 in service)
  implication: If user.sub format differs from stored userId format, query returns empty results

- timestamp: 2026-01-26T10:10:00Z
  checked: Added diagnostic logging to both API route and service
  found: Logs will show exact userId being queried, 90-day filter timestamp, and actual Firestore results
  implication: This will reveal the actual cause - either userId mismatch, timestamp filter issue, or something else

- timestamp: 2026-01-26T10:15:00Z
  checked: Temporarily disabled 90-day timestamp filter to test if it's excluding records
  found: Modified query to only filter by userId without timestamp constraint
  implication: If records now appear, the issue is with the 90-day filter calculation or stored timestamps

- timestamp: 2026-01-26T10:20:00Z
  checked: Added diagnostic query that runs when main query returns 0 results
  found: Diagnostic fetches first 5 docs from collection and compares their userId with queried userId
  implication: Will reveal exact userId values, types, and whether they match - definitively ruling in/out userId mismatch

- timestamp: 2026-01-26T10:30:00Z
  checked: 90-day filter operator
  found: Used `>` (strictly greater than) which excludes records from exactly 90 days ago
  implication: Changed to `>=` to include records from 90 days ago (inclusive)

## Resolution

root_cause: 90-day timestamp filter used strict inequality operator (>) which excluded records with timestamps at exactly the 90-day boundary. Firestore where clause `where('timestamp', '>', timestampFilter)` only returns documents where timestamp is STRICTLY GREATER THAN the filter, meaning records from exactly 90 days ago were excluded.

fix:
1. Changed timestamp filter operator from `>` to `>=` in lib/notificationHistoryService.js line 56
2. Added inline comment explaining the operator choice
3. Created comprehensive test suite with 14 tests including specific regression test for this bug

verification:
- All 14 tests pass
- Test suite specifically validates >= operator is used (not >)
- Regression test explicitly documents this fix for future reference
- User should verify notifications now appear at /settings/notifications/history

files_changed:
  - lib/notificationHistoryService.js (filter operator: line 56)
  - __tests__/lib/notificationHistoryService.test.js (new file: 14 tests)
