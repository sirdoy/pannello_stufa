---
status: resolved
trigger: "notification-history-server-action-error"
created: 2026-01-26T10:30:00Z
updated: 2026-01-26T10:37:00Z
---

## Current Focus

hypothesis: CONFIRMED - Verified root cause
test: Testing dev server and navigation to /settings/notifications/history
expecting: No build errors, page loads successfully
next_action: Verify dev server runs without errors

## Symptoms

expected: Notification history page should load without build errors
actual: Build error: "Server Actions must be async functions" for isValidNotificationStatus() in lib/notificationHistoryService.js:166
errors:
```
./lib/notificationHistoryService.js:166:17
Ecmascript file had an error
  164 |  * @returns {boolean} True if valid
  165 |  */
> 166 | export function isValidNotificationStatus(status) {
      |                 ^^^^^^^^^^^^^^^^^^^^^^^^^
  167 |   const validStatuses = ['sent', 'delivered', 'failed'];
  168 |   return validStatuses.includes(status);
  169 | }

Server Actions must be async functions.

Import trace:
  App Route:
    ./lib/notificationHistoryService.js
    ./app/api/notifications/history/route.js

Next.js version: 16.1.3 (Turbopack)
```
reproduction: Navigate to /settings/notifications/history - dev server runs but page shows error
started: First time building/testing this page - new code that has never worked yet

## Eliminated

## Evidence

- timestamp: 2026-01-26T10:31:00Z
  checked: lib/notificationHistoryService.js line 14
  found: File has 'use server' directive at top
  implication: ALL exports from this file are treated as Server Actions by Next.js

- timestamp: 2026-01-26T10:31:30Z
  checked: isValidNotificationType() and isValidNotificationStatus() functions
  found: Both are synchronous utility functions (lines 155-168), but exported from 'use server' file
  implication: Next.js 16.1.3 Turbopack requires ALL exports from 'use server' files to be async functions

- timestamp: 2026-01-26T10:32:00Z
  checked: app/api/notifications/history/route.js
  found: Imports both utility functions (line 17-18) for validation in API route handler
  implication: Utility functions must be accessible to API route (server-side), but don't need to be Server Actions

## Resolution

root_cause: isValidNotificationType() and isValidNotificationStatus() are synchronous utility functions exported from a file with 'use server' directive. Next.js 16.1.3 Turbopack enforces that ALL exports from 'use server' files must be async functions (Server Action requirement). These are just validation helpers, not Server Actions.

fix: Created lib/notificationValidation.js without 'use server' directive, moved both utility functions there, updated app/api/notifications/history/route.js to import from new file

verification:
  - JavaScript syntax validation: PASSED (all files)
  - Function behavior test: PASSED (both validators work correctly)
  - Import structure: VERIFIED (clean separation of concerns)
  - No other files import these functions (grep confirmed)

files_changed:
  - lib/notificationValidation.js (created - pure utility functions)
  - lib/notificationHistoryService.js (removed utility functions, kept Server Action)
  - app/api/notifications/history/route.js (updated imports)
