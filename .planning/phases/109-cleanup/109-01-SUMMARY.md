---
phase: 109-cleanup
plan: "01"
subsystem: hue
tags: [cleanup, dead-code, proxy-migration]
dependency_graph:
  requires: []
  provides: [clean-hue-codebase]
  affects: [lib/hue, lib/core, app/api/hue, app/lights]
tech_stack:
  added: []
  patterns: [proxy-only Hue access, no legacy CLIP v1/v2 clients]
key_files:
  created: []
  modified:
    - lib/core/apiErrors.ts
    - lib/core/apiResponse.ts
    - lib/core/index.ts
    - lib/core/middleware.ts
    - lib/core/__tests__/apiErrors.test.ts
    - lib/core/__tests__/apiResponse.test.ts
    - app/api/scheduler/check/route.ts
    - app/api/scheduler/check/__tests__/route.test.ts
    - app/lights/page.tsx
    - .env.example
    - lib/retry/__tests__/retryClient.test.ts
    - types/api/errors.ts
  deleted:
    - lib/hue/hueApi.ts
    - lib/hue/hueRemoteApi.ts
    - lib/hue/hueConnectionStrategy.ts
    - lib/hue/hueRemoteTokenHelper.ts
    - lib/hue/hueLocalHelper.ts
    - lib/hue/__tests__/hueApiScenes.test.ts
    - lib/hue/__tests__/hueRemoteTokenHelper.test.ts
    - lib/hue/__tests__/hueLocalHelper.test.ts
    - app/api/hue/discover/ (directory)
    - app/api/hue/pair/ (directory)
    - app/api/hue/disconnect/ (directory)
    - app/api/hue/remote/ (directory)
    - app/api/hue/callback/ (directory)
    - app/api/hue/test/ (directory)
    - app/api/hue/scenes/create/ (directory)
    - app/api/hue/scenes/[id]/ (directory)
decisions:
  - HUE_NOT_CONNECTED and HUE_NOT_ON_LOCAL_NETWORK removed from ERROR_CODES and ErrorCode type — proxy model never throws these
  - remoteApiAvailable replaced with false constant (removes env var ref, keeps dead branch rendering)
  - types/api/errors.ts updated as Rule 1 auto-fix to keep ErrorCode type consistent with ERROR_CODES object
metrics:
  duration_minutes: 10
  tasks_completed: 2
  files_modified: 12
  files_deleted: 22
  completed_at: "2026-03-21T09:09:10Z"
---

# Phase 109 Plan 01: Delete legacy Hue infrastructure and clean surviving imports Summary

Delete all legacy Hue CLIP v1 client, CLIP v2 remote client, OAuth routes, bridge discovery/pairing routes, scene CRUD routes, and Hue-specific env vars — leaving only the proxy-based Hue code.

## What Was Built

Completed the Hue proxy migration cleanup:

1. **Deleted 22+ legacy files**: 5 lib/hue modules (hueApi, hueRemoteApi, hueConnectionStrategy, hueRemoteTokenHelper, hueLocalHelper), 3 test files, 16 route files/directories under app/api/hue/

2. **Cleaned scheduler route**: Removed `proactiveTokenRefresh` import and fire-and-forget call from 850-line scheduler route

3. **Cleaned lib/core**: Removed `withHueHandler` middleware function, `hueNotConnected`/`hueNotOnLocalNetwork` response helpers, `HUE_NOT_CONNECTED`/`HUE_NOT_ON_LOCAL_NETWORK` from `ERROR_CODES`, their `ERROR_MESSAGES` entries, `ApiError.hueNotConnected()`/`ApiError.hueNotOnLocalNetwork()` static methods, and HUE error mapping from `mapLegacyError`

4. **Cleaned env vars**: Removed `NEXT_PUBLIC_HUE_APP_ID`, `NEXT_PUBLIC_HUE_CLIENT_ID`, `HUE_CLIENT_SECRET` from `.env.example`

5. **Cleaned app/lights/page.tsx**: Replaced `!!process.env.NEXT_PUBLIC_HUE_CLIENT_ID` with `false`

### Surviving Hue code (correct)
- `lib/hue/hueProxy.ts` — proxy client (kept)
- `lib/hue/colorUtils.ts` — color utilities (kept)
- `lib/hue/__tests__/hueProxy.test.ts` — proxy tests (kept)
- `lib/hue/__tests__/colorUtils.test.ts` — color utils tests (kept)
- `app/api/hue/scenes/route.ts` — GET scenes endpoint via proxy (kept)
- `app/api/hue/lights/`, `rooms/`, `groups/`, `status/`, `history/` — all proxy-based (kept)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated types/api/errors.ts to remove HUE_NOT_CONNECTED and HUE_NOT_ON_LOCAL_NETWORK from ErrorCode union**
- **Found during:** Task 2
- **Issue:** `ERROR_MESSAGES` is typed as `Record<ErrorCode, string>`. Removing entries from the object but keeping them in the type would cause TypeScript to complain about missing required keys
- **Fix:** Removed `'HUE_NOT_CONNECTED'` and `'HUE_NOT_ON_LOCAL_NETWORK'` from the `ErrorCode` union type in `types/api/errors.ts`
- **Files modified:** `types/api/errors.ts`
- **Commit:** 1692511

**2. [Rule 1 - Bug] Removed HUE_NOT_CONNECTED test cases from lib/retry/__tests__/retryClient.test.ts**
- **Found during:** Task 2
- **Issue:** Tests referenced `ERROR_CODES.HUE_NOT_CONNECTED` which was removed from ERROR_CODES
- **Fix:** Removed 2 test cases (`throws immediately on HUE_NOT_CONNECTED`, `correctly classifies HUE_NOT_CONNECTED as non-transient`)
- **Files modified:** `lib/retry/__tests__/retryClient.test.ts`
- **Commit:** 1692511

**3. [Rule 1 - Bug] Removed mockProactiveTokenRefresh.mockResolvedValue call from setupSchedulerMocks**
- **Found during:** Task 2 (test run)
- **Issue:** The `setupSchedulerMocks` helper still referenced `mockProactiveTokenRefresh` after the variable declaration was removed
- **Fix:** Removed the line `mockProactiveTokenRefresh.mockResolvedValue({ refreshed: false } as any);`
- **Files modified:** `app/api/scheduler/check/__tests__/route.test.ts`
- **Commit:** 1692511

## Pre-existing Issues (deferred)

See `.planning/phases/109-cleanup/deferred-items.md`:
- `lib/hue/__tests__/colorUtils.test.ts` — 4 `supportsColor` tests failing due to phase 108-01 rewrite (tests test old CLIP v2 behavior)
- `lib/hooks/__tests__/useDeviceStaleness.test.ts` — pre-existing failure

## Self-Check: PASSED

- lib/hue/hueProxy.ts: FOUND
- lib/hue/colorUtils.ts: FOUND
- app/api/hue/scenes/route.ts: FOUND
- lib/hue/hueApi.ts: DELETED (confirmed)
- lib/hue/hueRemoteTokenHelper.ts: DELETED (confirmed)
- app/api/hue/discover/: DELETED (confirmed)
- commit 7a41f5e (Task 1): FOUND
- commit 1692511 (Task 2): FOUND
