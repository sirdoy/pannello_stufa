---
phase: 100-control-endpoints
verified: 2026-03-19T14:30:00Z
status: passed
score: 11/11 must-haves verified
re_verification: false
---

# Phase 100: Control Endpoints Verification Report

**Phase Goal:** All stove commands and settings can be sent through the proxy, and telemetry history is available
**Verified:** 2026-03-19
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `sendIgnit()` calls haPost with path `/api/v1/thermorossi/commands/ignit` and empty body | VERIFIED | `lib/thermorossiProxy.ts` line 89-93; test at line 249-258 |
| 2 | `sendShutdown()` calls haPost with path `/api/v1/thermorossi/commands/shutdown` and empty body | VERIFIED | `lib/thermorossiProxy.ts` line 100-104; test at line 260-267 |
| 3 | `setPower(value)` calls haPost with path `/api/v1/thermorossi/settings/power` and body `{ value }` | VERIFIED | `lib/thermorossiProxy.ts` line 112-116; test at line 269-276 |
| 4 | `setFan(value)` calls haPost with path `/api/v1/thermorossi/settings/fan-level` and body `{ value }` | VERIFIED | `lib/thermorossiProxy.ts` line 124-128; test at line 278-285 |
| 5 | `setWaterTemp(value)` calls haPost with path `/api/v1/thermorossi/settings/temperature/water` and body `{ value }` | VERIFIED | `lib/thermorossiProxy.ts` line 136-140; test at line 287-294 |
| 6 | POST /api/stove/ignite calls `sendIgnit()` and returns HTTP 202 | VERIFIED | `app/api/stove/ignite/route.ts` line 2, 18, 29 |
| 7 | POST /api/stove/shutdown calls `sendShutdown()` and returns HTTP 202 | VERIFIED | `app/api/stove/shutdown/route.ts` line 2, 18, 29 |
| 8 | POST /api/stove/setPower reads `body.value` and calls `setPower(value)`, returns HTTP 202 | VERIFIED | `app/api/stove/setPower/route.ts` line 2, 17-19, 30 |
| 9 | POST /api/stove/setFan reads `body.value` and calls `setFan(value)`, returns HTTP 202 | VERIFIED | `app/api/stove/setFan/route.ts` line 2, 16-18, 20 |
| 10 | POST /api/stove/setWaterTemperature reads `body.value` and calls `setWaterTemp(value)`, returns HTTP 202 | VERIFIED | `app/api/stove/setWaterTemperature/route.ts` line 2, 16-18, 20 |
| 11 | GET /api/stove/history forwards query params via `getHistory()` and returns 200 | VERIFIED | `app/api/stove/history/route.ts` line 2, 13-16, 18, 20 |

**Score: 11/11 truths verified**

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/thermorossiProxy.ts` | 5 command wrappers using haPost | VERIFIED | Exports `sendIgnit`, `sendShutdown`, `setPower`, `setFan`, `setWaterTemp` — all substantive, wired to haPost |
| `__tests__/lib/thermorossiProxy.test.ts` | Unit tests for all 5 command wrappers | VERIFIED | `describe('command wrappers', ...)` block with 5 passing tests; 16/16 total pass |
| `app/api/stove/ignite/route.ts` | Proxy-backed ignite endpoint | VERIFIED | Contains `sendIgnit`, returns 202, no StoveService remnants |
| `app/api/stove/shutdown/route.ts` | Proxy-backed shutdown endpoint | VERIFIED | Contains `sendShutdown`, returns 202, no StoveService remnants |
| `app/api/stove/setPower/route.ts` | Proxy-backed setPower endpoint | VERIFIED | Contains `setPower`, reads `body['value']`, returns 202 |
| `app/api/stove/setFan/route.ts` | Proxy-backed setFan endpoint | VERIFIED | Contains `setFan`, reads `body['value']`, returns 202 |
| `app/api/stove/setWaterTemperature/route.ts` | Proxy-backed setWaterTemp endpoint | VERIFIED | Contains `setWaterTemp`, includes `withIdempotency`, returns 202 |
| `app/api/stove/history/route.ts` | New history endpoint | VERIFIED | Created fresh; contains `getHistory`, forwards `searchParams`, returns 200 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/thermorossiProxy.ts` | `lib/haClient.ts` | `import { haGet, haPost }` | WIRED | Line 21: `import { haGet, haPost } from '@/lib/haClient'`; haPost confirmed exported from haClient.ts at line 172 |
| `app/api/stove/ignite/route.ts` | `lib/thermorossiProxy.ts` | `import { sendIgnit }` | WIRED | Line 2: `import { sendIgnit } from '@/lib/thermorossiProxy'`; called at line 18 |
| `app/api/stove/history/route.ts` | `lib/thermorossiProxy.ts` | `import { getHistory }` | WIRED | Line 2: `import { getHistory } from '@/lib/thermorossiProxy'`; called at line 18 |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CMD-01 | 100-01, 100-02 | POST /commands/ignit via proxy — handles 202 Accepted with suggested_poll_delay_s | SATISFIED | `sendIgnit()` wrapper + `ignite/route.ts` both verified |
| CMD-02 | 100-01, 100-02 | POST /commands/shutdown via proxy — handles 202 Accepted with suggested_poll_delay_s | SATISFIED | `sendShutdown()` wrapper + `shutdown/route.ts` both verified |
| CMD-03 | 100-01, 100-02 | POST /settings/power via proxy — sends `{ value: N }`, handles 202 Accepted | SATISFIED | `setPower(value)` wrapper + `setPower/route.ts` both verified |
| CMD-04 | 100-01, 100-02 | POST /settings/fan-level via proxy — sends `{ value: N }`, handles 202 Accepted | SATISFIED | `setFan(value)` wrapper + `setFan/route.ts` both verified |
| CMD-05 | 100-01, 100-02 | POST /settings/temperature/water via proxy — sends `{ value: N }`, range 40-80°C | SATISFIED | `setWaterTemp(value)` wrapper + `setWaterTemperature/route.ts` both verified; range delegated to proxy (422) |
| READ-05 | 100-02 | GET /history available via proxy — paginated telemetry with auto-granularity | SATISFIED | `history/route.ts` forwards URLSearchParams via `getHistory(params)` |

No orphaned requirements — all 6 IDs claimed by plans and verified in code.

---

### Anti-Patterns Found

Scanned all 8 files modified/created in this phase. No anti-patterns found in the 6 route files or 2 proxy files.

Note: `stoveApi` imports remain in OTHER unrelated routes (`getActualWaterTemperature`, `setSettings`, `getRoomTemperature`, `getWaterSetTemperature`, `settings`) — these are legacy routes outside phase 100 scope and not a concern here.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None found | — | — |

---

### Commit Verification

All 4 documented commits confirmed present in git log:

| Commit | Description |
|--------|-------------|
| `236566b` | test(100-01): add failing tests for 5 command wrappers |
| `55b9558` | feat(100-01): add 5 command wrappers to thermorossiProxy |
| `fc52efc` | feat(100-02): migrate ignite, shutdown, setPower routes to thermorossiProxy |
| `f9654c1` | feat(100-02): migrate setFan, setWaterTemperature routes + create history route |

---

### Test Results

- `thermorossiProxy` test suite: **16/16 pass** (verified by running `npm test -- --testPathPatterns=thermorossiProxy`)
- Full suite: 3893/3899 pass (6 pre-existing failures in `useDeviceStaleness` — timing tests unrelated to this phase, per SUMMARY-02)

---

### Human Verification Required

None — all phase goals are verifiable programmatically. The routes are server-side proxy delegates with no visual component changes in this phase.

---

## Summary

Phase 100 goal is fully achieved. All stove commands (`ignit`, `shutdown`, `setPower`, `setFan`, `setWaterTemperature`) and telemetry history are available through the proxy layer:

1. **Proxy library (Plan 01):** `lib/thermorossiProxy.ts` gained 5 `haPost`-backed command wrappers, each mapping to the correct HA proxy path with the correct body shape. 16 unit tests cover all wrappers (GREEN).

2. **Route migration (Plan 02):** All 5 command routes replaced StoveService/stoveApi calls with proxy wrappers and return HTTP 202. The new `GET /api/stove/history` route forwards query params and returns 200. No legacy validator or service imports remain in any of the 6 migrated/created files.

3. **Requirements:** CMD-01 through CMD-05 and READ-05 are all satisfied. No orphaned requirements detected.

---

_Verified: 2026-03-19_
_Verifier: Claude (gsd-verifier)_
