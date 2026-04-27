---
phase: 156
phase_name: path-migration-common-endpoints
status: all_fixed
findings_in_scope: 7
fixed: 7
skipped: 0
iteration: 1
---

# Code Review Fix Report: Phase 156

## Fixes Applied

### CR-001: Duplicate `message` event listeners in service worker (critical)
**Status:** fixed
**Commit:** 02e26b95
**Changes:** Merged the second `addEventListener('message')` block (REGISTER_PERIODIC_SYNC, UNREGISTER_PERIODIC_SYNC, GET_PERIODIC_SYNC_STATUS) into the first handler's switch statement. Removed the duplicate listener registration entirely.

### CR-002: Duplicate `push` event listener shadows the first (critical)
**Status:** fixed
**Commit:** 02e26b95
**Changes:** Removed dead `originalPushHandler` variable and the second `push` listener. Merged `incrementBadge()` into the primary push handler using `Promise.all` inside `event.waitUntil`.

### CR-003: `/health` endpoint leaks provider topology unauthenticated (warning)
**Status:** fixed
**Commit:** 182ac219
**Changes:** Switched from `withErrorHandler` to `withAuthAndErrorHandler` so provider topology details require authentication. Updated JSDoc comment accordingly.

### CR-004: No input validation on numeric `value` in settings routes (warning)
**Status:** fixed
**Commit:** e2d420cb
**Changes:** Added `typeof value !== 'number' || !Number.isFinite(value)` guard returning 400 JSON error in all three routes: fan-level, power, and water temperature. Removed unsafe `as number` type assertions.

### CR-005: `StoveStatusResponse` type is stale (warning)
**Status:** fixed
**Commit:** 3dcc7175
**Changes:** Verified zero imports across codebase (only defined in responses.ts and re-exported in index.ts). Deleted the interface from `types/api/responses.ts` and removed the re-export from `types/api/index.ts`.

### CR-006: `getActionSuccessMessage` in SW uses stale endpoint path (warning)
**Status:** fixed
**Commit:** 7c4ac539
**Changes:** Updated notification action handler call from `'stove/shutdown'` to `'v1/thermorossi/commands/shutdown'` (resolves to `/api/v1/thermorossi/commands/shutdown`). Updated `getActionSuccessMessage` switch case to match the new path.

### CR-007: `checkStoveStatusBackground` checks wrong field names (warning)
**Status:** fixed
**Commit:** 7c4ac539
**Changes:** Changed `data.error || data.errorCode` to `data.error_code || data.stove_state === 'alarm'`. Updated error message to use `data.error_description` and `data.error_code`. Removed stale `data.maintenance?.needsCleaning` check since the status endpoint does not include maintenance data.
