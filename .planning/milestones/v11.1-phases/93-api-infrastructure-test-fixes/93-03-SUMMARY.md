---
phase: 93-api-infrastructure-test-fixes
plan: "03"
subsystem: fritzbox-tests
tags: [test-fix, fritzbox, history, devices, TFIX-07, TFIX-08]
dependency_graph:
  requires: []
  provides: [TFIX-07, TFIX-08]
  affects: [app/api/fritzbox/history/route.ts, app/api/fritzbox/__tests__/history.test.ts, app/api/fritzbox/__tests__/devices-events.test.ts]
tech_stack:
  added: []
  patterns: [standalone-function-import, client-side-filter, negative-assertion-documentation]
key_files:
  created: []
  modified:
    - app/api/fritzbox/history/route.ts
    - app/api/fritzbox/__tests__/devices-events.test.ts
decisions:
  - "History route uses standalone getDeviceEvents(startTime, endTime) from deviceEventLogger, not fritzboxClient.getDeviceEvents(hours, device)"
  - "Devices route event detection moved to HA proxy — devices-events test documents this with negative assertions"
metrics:
  duration: 70s
  completed: 2026-03-18
  tasks_completed: 2
  files_modified: 2
---

# Phase 93 Plan 03: Fritz!Box History & Devices-Events Test Fixes Summary

**One-liner:** History route migrated to standalone `getDeviceEvents(startTime, endTime)` with client-side MAC filtering; devices-events test rewritten to match current route behavior (rate limit + cache, no event detection).

## What Was Built

### Task 1: History route uses standalone getDeviceEvents (TFIX-07)

The history route `app/api/fritzbox/history/route.ts` was calling `fritzboxClient.getDeviceEvents(hours, deviceParam)` — an HA proxy method with different signature and semantics. The test mocked the standalone `getDeviceEvents(startTime, endTime)` exported from `lib/fritzbox/deviceEventLogger.ts`.

Fixed by:
- Replacing `import { fritzboxClient }` with `import { getDeviceEvents }` from `@/lib/fritzbox`
- Computing `startTime = now - hours * 60 * 60 * 1000` and `endTime = now`
- Calling `getDeviceEvents(startTime, endTime)` to get all events from Firebase RTDB
- Applying client-side MAC filter: `allEvents.filter(e => e.deviceMac === deviceParam)` when `deviceParam` is set

All 6 history tests pass: default 24h range, 7d range, 1h range, device filter (returns 2/3 events), empty events, invalid range defaults to 24h.

### Task 2: Devices-events test rewritten for current behavior (TFIX-08)

The old `devices-events.test.ts` tested event detection logic (logDeviceEvent, getDeviceStates, updateDeviceStates calls) that was moved to the HA proxy and is no longer in the devices route. All 6 old tests were asserting on behavior that no longer exists.

Rewrote to test what the route actually does:
1. Returns devices list on success (200, data.devices, getCachedData called)
2. Returns empty array when no devices
3. Rate limit exceeded returns 429
4. Passes session user sub to rate limit check
5. getCachedData uses fritzboxClient.getDevices as fetcher (fetcher verification)
6. Does not call any event detection functions (negative assertion documenting architectural decision)

All 6 new tests pass.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

```
PASS app/api/fritzbox/__tests__/history.test.ts (6 tests)
PASS app/api/fritzbox/__tests__/devices-events.test.ts (6 tests)
Test Suites: 2 passed, 2 total
Tests: 12 passed, 12 total
```

## Commits

- `64cdf44` fix(93-03): update history route to use standalone getDeviceEvents(startTime, endTime)
- `2471f40` fix(93-03): rewrite devices-events test for current route behavior (TFIX-08)

## Self-Check: PASSED
