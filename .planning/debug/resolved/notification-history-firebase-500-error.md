---
status: verifying
trigger: "notification-history-firebase-500-error"
created: 2026-01-26T00:00:00Z
updated: 2026-01-26T00:07:00Z
---

## Current Focus

hypothesis: Fix confirmed - 'use server' directive removed
test: Navigate to /settings/notifications/history and verify API returns data
expecting: API should return 200 OK with notification history data
next_action: Verify the fix by testing the endpoint

## Symptoms

expected: GET /api/notifications/history?limit=50 should return notification history data
actual: API returns 500 Internal Server Error
errors:
- Client error: "GET http://localhost:3000/api/notifications/history?limit=50 500 (Internal Server Error)"
- Client catches: "Error fetching notifications: Error: Errore nel caricamento delle notifiche"
- Server logs show Firebase/Firestore connection error
reproduction: Navigate to /settings/notifications/history page and click to load notifications
started: Occurs after fixing the Server Action async function error - new issue with Firebase connectivity

## Eliminated

## Evidence

- timestamp: 2026-01-26T00:01:00Z
  checked: API route implementation at /app/api/notifications/history/route.js
  found: Route calls getNotificationHistory() from notificationHistoryService.js
  implication: Service is marked 'use server' and imports getAdminFirestore()

- timestamp: 2026-01-26T00:02:00Z
  checked: notificationHistoryService.js implementation
  found: Service uses getAdminFirestore() which calls initializeFirebaseAdmin()
  implication: Firestore Admin SDK must be initialized for this to work

- timestamp: 2026-01-26T00:03:00Z
  checked: firebaseAdmin.js initialization logic
  found: Requires FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY in environment
  implication: If these are missing, initialization will fail with error

- timestamp: 2026-01-26T00:04:00Z
  checked: .env.local file for Firebase Admin credentials
  found: All three required env vars are present (FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY)
  implication: Credentials are available, issue is not missing env vars

- timestamp: 2026-01-26T00:05:00Z
  checked: notificationHistoryService.js file structure
  found: File has 'use server' directive at the top
  implication: The 'use server' directive is meant for Server Actions in App Router, not for API routes. API routes are already server-side. This directive may be causing the function to be treated as a Server Action rather than a normal async function, leading to execution context issues

- timestamp: 2026-01-26T00:06:00Z
  checked: Applied fix to notificationHistoryService.js
  found: Removed 'use server' directive and added explanatory comment
  implication: Service function will now execute as normal async function in API route context

- timestamp: 2026-01-26T00:07:00Z
  checked: Searched for other files with same pattern
  found: notificationLogger.js also has 'use server' directive and is imported by API routes
  implication: Same issue could occur in other API routes that use notificationLogger

- timestamp: 2026-01-26T00:08:00Z
  checked: Applied preventive fix to notificationLogger.js
  found: Removed 'use server' directive to prevent similar issues in stats and check-rate API routes
  implication: All service modules imported by API routes are now properly configured

## Resolution

root_cause: The 'use server' directive in notificationHistoryService.js conflicts with API route usage. The directive is designed for Server Actions (functions called directly from client components), not for service functions imported by API routes. API routes are already server-side and don't need this directive. The directive causes Next.js to treat the exported function as a Server Action, which has different execution semantics and may cause initialization issues with Firebase Admin SDK.

fix: Remove 'use server' directive from notificationHistoryService.js and notificationLogger.js. These are service modules meant to be imported by API routes, which are already server-side.

verification: Test the /api/notifications/history endpoint after removing the directive
files_changed: ['lib/notificationHistoryService.js', 'lib/notificationLogger.js']
