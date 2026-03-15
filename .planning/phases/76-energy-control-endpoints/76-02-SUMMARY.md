---
phase: 76-energy-control-endpoints
plan: 02
subsystem: netatmo-proxy
tags: [api-migration, tdd, thermostat-control, proxy-client]
dependency_graph:
  requires: [76-01]
  provides: [setroomthermpoint-proxy, setthermmode-proxy]
  affects: [netatmo-thermostat-control-routes]
tech_stack:
  added: []
  patterns: [proxy-client-post, failure-only-logging, body-forwarded-home-id]
key_files:
  created:
    - __tests__/api/netatmo/setroomthermpoint.test.ts
    - __tests__/api/netatmo/setthermmode.test.ts
  modified:
    - app/api/netatmo/setroomthermpoint/route.ts
    - app/api/netatmo/setthermmode/route.ts
    - app/api/netatmo/setroomthermpoint/__tests__/route.test.ts
    - app/api/netatmo/setthermmode/__tests__/route.test.ts
decisions:
  - "home_id sourced from request body not Firebase — client must send it"
  - "VALID_MODES for setroomthermpoint: ['manual', 'home'] — dropped 'max', 'off'"
  - "VALID_MODES for setthermmode: ['schedule', 'away', 'hg'] — dropped 'off'"
  - "Failure-only logging: adminDbPush called in catch block with error field, not on success"
metrics:
  duration_seconds: 347
  completed_date: "2026-03-15"
  tasks_completed: 2
  files_changed: 6
  tests_added: 16
requirements: [ENERGY-03, ENERGY-04]
---

# Phase 76 Plan 02: Thermostat Control Route Migration Summary

**One-liner:** setroomthermpoint and setthermmode routes migrated to proxy client with body-forwarded home_id and failure-only Firebase logging.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Migrate setroomthermpoint route (TDD) | 71659ab | route.ts, 2 test files |
| 2 | Migrate setthermmode route (TDD) | 91ecafd | route.ts, 2 test files |

## What Was Built

### setroomthermpoint route
- Replaced `NETATMO_API.setRoomThermpoint` with `proxySetRoomThermpoint`
- Removed `requireNetatmoToken`, `adminDbGet`, `getEnvironmentPath` (no token management, no Firebase home_id lookup)
- `home_id` now required in request body (client provides it)
- `VALID_MODES` narrowed from `['manual', 'home', 'max', 'off']` to `['manual', 'home']`
- Logging moved to catch block only — failure log with `error` field, success has no log

### setthermmode route
- Replaced `NETATMO_API.setThermMode` with `proxySetThermMode`
- Removed `requireNetatmoToken`, `adminDbGet`, `getEnvironmentPath`
- `home_id` now required in request body (client provides it)
- `VALID_MODES` narrowed from `['schedule', 'away', 'hg', 'off']` to `['schedule', 'away', 'hg']`
- Logging moved to catch block only — failure log with `error` field, success has no log

## Verification

```
Tests:       31 passed (across 4 test suites)
TypeScript:  0 errors for either route
requireNetatmoToken: not present in either route
NETATMO_API: not present in either route
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated co-located test files to match new implementation**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Existing co-located test files (`app/api/netatmo/setroomthermpoint/__tests__/route.test.ts` and `app/api/netatmo/setthermmode/__tests__/route.test.ts`) tested the old NETATMO_API-based implementation and failed after route rewrite
- **Fix:** Rewrote both co-located test files to test the new proxy-based behavior, matching the new interface (home_id in body, proxySetRoomThermpoint/proxySetThermMode, no-log-on-success pattern)
- **Files modified:** `app/api/netatmo/setroomthermpoint/__tests__/route.test.ts`, `app/api/netatmo/setthermmode/__tests__/route.test.ts`
- **Commits:** 71659ab, 91ecafd

**2. [Rule 1 - Bug] Fixed withAuthAndErrorHandler mock to catch validation errors**
- **Found during:** Task 1 (GREEN phase, first test run)
- **Issue:** Test mock used `withAuthAndErrorHandler: (fn) => fn` which doesn't catch errors thrown by `validateRequired`/`validateEnum`, causing test assertion failures instead of badRequest responses
- **Fix:** Changed mock to `(fn) => async (...args) => { try { return await fn(...args) } catch(e) { return badRequest(e.message) } }` matching real handler behavior
- **Files modified:** `__tests__/api/netatmo/setroomthermpoint.test.ts`
- **Commits:** 71659ab

## Self-Check: PASSED

All created files exist. Both commits verified in git log.
