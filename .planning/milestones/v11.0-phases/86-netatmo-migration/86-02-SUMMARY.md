---
phase: 86
plan: 02
subsystem: netatmo-proxy
tags: [migration, tests, env-vars, haClient]
dependency_graph:
  requires: [lib/netatmoProxy.ts (post-Plan-01), lib/haClient.ts]
  provides: [updated tests, envValidator, getroommeasure route]
  affects: [all test suites for netatmoProxy, envValidator health checks]
tech_stack:
  added: []
  patterns: [HA_API_URL/HA_API_KEY env var pattern in tests and validator]
key_files:
  created: []
  modified:
    - __tests__/lib/netatmoProxy.test.ts
    - __tests__/lib/netatmoProxy-camera.test.ts
    - __tests__/lib/envValidator.test.ts
    - lib/envValidator.ts
    - app/api/netatmo/getroommeasure/route.ts
key_decisions:
  - "netatmoProxyGet describe block renamed to 'haGet transport (via getProxyHomestatus)' — tests now verify transport through wrapper, not deleted function"
  - "validateNetatmoEnv simplified — removed unreachable warnings array, returns directly"
  - "getroommeasure route RoomMeasureResponse type import removed — handled by getProxyRoomMeasure wrapper internally"
metrics:
  duration: ~5 minutes
  completed: 2026-03-17T12:01:00Z
  tasks_completed: 3
  files_changed: 5
requirements: [API-07, API-08, API-09]
---

# Phase 86 Plan 02: Test and Validator Alignment Summary

Tests, envValidator, and getroommeasure route aligned to netatmoProxy.ts haGet/haPost migration — all NETATMO_PROXY_URL/KEY references replaced with HA_API_URL/HA_API_KEY, 38 tests green.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update netatmoProxy tests for HA env vars and new URL paths | aa69631 | __tests__/lib/netatmoProxy.test.ts, __tests__/lib/netatmoProxy-camera.test.ts |
| 2 | Update envValidator and its tests for HA vars | 7256536 | lib/envValidator.ts, __tests__/lib/envValidator.test.ts |
| 3 | Update getroommeasure route to use new wrapper | 9ac3e66 | app/api/netatmo/getroommeasure/route.ts |

## What Was Built

**__tests__/lib/netatmoProxy.test.ts** rewritten:
- Removed `netatmoProxyGet` import (function deleted in Plan 01)
- Describe block renamed from `netatmoProxyGet` to `haGet transport (via getProxyHomestatus)`
- All 3 beforeEach/afterEach pairs: NETATMO_PROXY_URL → HA_API_URL, NETATMO_PROXY_API_KEY → HA_API_KEY
- Transport tests now call `getProxyHomestatus()` which routes through haGet
- URL assertions updated: `/homestatus` → `/api/v1/netatmo/homestatus`, `/homesdata` → `/api/v1/netatmo/homesdata`
- Missing env var tests updated: expect message to contain 'HA_API_URL' / 'HA_API_KEY'

**__tests__/lib/netatmoProxy-camera.test.ts** updated:
- 1 beforeEach/afterEach pair: NETATMO_PROXY_URL → HA_API_URL, NETATMO_PROXY_API_KEY → HA_API_KEY
- 7 URL assertions updated to include `/api/v1/netatmo/` prefix:
  - `/camera/status`, `/camera/{id}/stream`, `/camera/{id}/snapshot`
  - `/camera/{id}/monitoring`, `/camera/events`, `/camera/events?hours=72`
  - `/camera/events/{eventId}/snapshot` (binary endpoint)
- Comment updated: "via netatmoProxyGet/Post" → "via haGet/haPost"

**lib/envValidator.ts** updated:
- `validateHealthMonitoringEnv` optional list: `NETATMO_PROXY_URL/KEY` → `HA_API_URL/KEY`
- `validateNetatmoEnv`: reads `HA_API_URL`/`HA_API_KEY`, warning message updated to `'HA_API_URL or HA_API_KEY missing'`
- JSDoc updated to reflect HA proxy credentials
- Simplified: removed unused `warnings` array and unreachable console.warn call

**__tests__/lib/envValidator.test.ts** updated:
- 2 `validateHealthMonitoringEnv` tests updated (expected warnings array, env var assignments)
- All 5 `validateNetatmoEnv` tests updated (all NETATMO_PROXY_URL/KEY → HA_API_URL/KEY)
- Test descriptions updated: "NETATMO_PROXY_URL missing" → "HA_API_URL missing"
- Warning assertion updated to `'HA_API_URL or HA_API_KEY missing'`

**app/api/netatmo/getroommeasure/route.ts** updated:
- Import changed: `{ netatmoProxyGet }` → `{ getProxyRoomMeasure }`
- `RoomMeasureResponse` type import removed (handled internally by wrapper)
- Call changed: `netatmoProxyGet<RoomMeasureResponse>('/getroommeasure?...')` → `getProxyRoomMeasure(params)`
- No behavior change — same params forwarded, same data returned

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx jest --testPathPatterns="netatmoProxy|envValidator" --no-coverage` → 38 tests, 3 suites, all pass
- `grep -r 'NETATMO_PROXY_URL\|NETATMO_PROXY_API_KEY' lib/ app/ __tests__/ --include='*.ts'` → 0 matches
- `grep 'getProxyRoomMeasure' app/api/netatmo/getroommeasure/route.ts` → import + call found
- `grep 'netatmoProxyGet' app/api/netatmo/getroommeasure/route.ts` → not found

## Self-Check: PASSED

Files verified:
- FOUND: __tests__/lib/netatmoProxy.test.ts (contains HA_API_URL, no netatmoProxyGet, /api/v1/netatmo/homestatus)
- FOUND: __tests__/lib/netatmoProxy-camera.test.ts (contains HA_API_URL, /api/v1/netatmo/camera/status)
- FOUND: lib/envValidator.ts (contains HA_API_URL in validateNetatmoEnv and optional list)
- FOUND: __tests__/lib/envValidator.test.ts (contains HA_API_URL, no NETATMO_PROXY_URL)
- FOUND: app/api/netatmo/getroommeasure/route.ts (contains getProxyRoomMeasure, no netatmoProxyGet)
- FOUND: aa69631 (test commit)
- FOUND: 7256536 (feat commit)
- FOUND: 9ac3e66 (feat commit)
