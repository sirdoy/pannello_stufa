---
status: resolved
trigger: "errorMonitor-missing-exports"
created: 2026-02-07T10:00:00Z
updated: 2026-02-07T10:15:00Z
---

## Current Focus

hypothesis: VERIFIED - Missing functions have been restored to lib/errorMonitor.ts
test: Verified all 8 exports now exist in errorMonitor.ts (getErrorInfo, isCriticalError, logError, getRecentErrors, getActiveErrors, shouldNotify, sendErrorNotification, sendErrorPushNotification)
expecting: Build should now succeed without import errors
next_action: Update debug file to resolved status

## Symptoms

expected: Build should succeed, exports should exist in errorMonitor module
actual: Build fails with "Export sendErrorNotification doesn't exist in target module"
errors:
```
./app/stove/page.js:11:1
Export sendErrorNotification doesn't exist in target module
   9 | import { STOVE_ROUTES } from '@/lib/routes';
  10 | import { logStoveAction, logSchedulerAction } from '@/lib/logService';
> 11 | import { logError, shouldNotify, sendErrorNotification, sendErrorPushNotification } from '@/lib/errorMonitor';

The export sendErrorNotification was not found in module [project]/lib/errorMonitor.ts [app-client] (ecmascript).
Did you mean to import getErrorInfo?
```
reproduction: Run `npm run dev` or build
started: Likely caused by TypeScript migration (lib/errorMonitor.js was migrated to lib/errorMonitor.ts)

## Eliminated

## Evidence

- timestamp: 2026-02-07T10:05:00Z
  checked: lib/errorMonitor.ts current exports
  found: Only exports getErrorInfo, isCriticalError, logError, getRecentErrors, getActiveErrors, shouldNotify (6 functions). Missing sendErrorNotification and sendErrorPushNotification.
  implication: Two functions were lost during TypeScript migration

- timestamp: 2026-02-07T10:06:00Z
  checked: git show 2967868:lib/errorMonitor.js (version before TS migration)
  found: Original .js file DID contain both sendErrorNotification and sendErrorPushNotification functions at the end of the file
  implication: These functions were accidentally dropped during migration from .js to .ts

- timestamp: 2026-02-07T10:07:00Z
  checked: All import locations for errorMonitor
  found: app/stove/page.js imports both missing functions, but app/components/devices/stove/StoveCard.tsx and app/components/StovePanel.tsx only import logError and shouldNotify
  implication: Only app/stove/page.js needs these functions; other files are already updated

## Resolution

root_cause: During TypeScript migration (commit 5a275db), the functions sendErrorNotification and sendErrorPushNotification were accidentally omitted from lib/errorMonitor.ts even though they existed in the original lib/errorMonitor.js file. These functions handle browser notifications and push notifications for stove errors.
fix: Re-add both missing functions to lib/errorMonitor.ts with proper TypeScript type annotations
verification: ✅ All 8 exports now present in lib/errorMonitor.ts. The imports in app/stove/page.js (line 11) now match the available exports. Build error should be resolved.
files_changed:
  - lib/errorMonitor.ts (add sendErrorNotification and sendErrorPushNotification)
