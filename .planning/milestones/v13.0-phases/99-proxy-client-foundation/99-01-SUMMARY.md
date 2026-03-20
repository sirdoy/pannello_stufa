---
phase: 99-proxy-client-foundation
plan: "01"
subsystem: thermorossi-proxy
tags: [types, proxy-client, haClient, thermorossi]
dependency_graph:
  requires:
    - lib/haClient.ts
    - lib/core/apiErrors.ts
  provides:
    - types/thermorossiProxy.ts
    - lib/thermorossiProxy.ts
  affects:
    - Phase 100 (API routes will import these types and client)
tech_stack:
  added: []
  patterns:
    - function module proxy client (same as netatmoProxy, fritzboxProxy, raspiProxy)
    - haGet wrapper pattern with typed generic returns
    - TDD (RED-GREEN) for proxy client
key_files:
  created:
    - types/thermorossiProxy.ts
    - lib/thermorossiProxy.ts
    - __tests__/lib/thermorossiProxy.test.ts
  modified: []
decisions:
  - "DataFreshness is 'LIVE' | 'STALE' only (UNREACHABLE triggers 503, never appears in body)"
  - "No haPost in this module — command wrappers deferred to Phase 100"
  - "No retry logic — haClient handles timeouts via AbortController"
  - "getHistory accepts optional URLSearchParams, appends as query string"
metrics:
  duration: "156s"
  completed: "2026-03-19"
  tasks: 2
  files_created: 3
  files_modified: 0
---

# Phase 99 Plan 01: Thermorossi Proxy Client Foundation Summary

**One-liner:** TypeScript types for all 9 Thermorossi proxy response interfaces plus 5 haGet convenience wrappers with 11 unit tests.

## What Was Built

Created the typed proxy client foundation for the Thermorossi proxy migration.

### types/thermorossiProxy.ts

- `StoveState` — union of 7 stove states (`off | igniting | working | standby | cleaning | alarm | modulating`)
- `DataFreshness` — `'LIVE' | 'STALE'` only (UNREACHABLE maps to HTTP 503, never in body)
- `ThermorossiStatusResponse` — full stove status with alarm fields (error_code, error_description)
- `ThermorossiPowerResponse` — power_level with freshness metadata
- `ThermorossiFanResponse` — fan_level with freshness metadata
- `ThermorossiHealthResponse` — proxy health (ok | degraded)
- `ThermorossiCommandResponse` — 202 Accepted shape for Phase 100 command endpoints
- `ThermorossiHistoryItem` — raw/hourly/daily aggregation data point
- `ThermorossiHistoryResponse` — paginated history with granularity field

### lib/thermorossiProxy.ts

5 convenience wrappers over `haGet`:
- `getStatus()` → `/api/v1/thermorossi/status`
- `getPower()` → `/api/v1/thermorossi/power`
- `getFan()` → `/api/v1/thermorossi/fan-level`
- `getHealth()` → `/api/v1/thermorossi/health`
- `getHistory(params?)` → `/api/v1/thermorossi/history` (with optional URLSearchParams)

### __tests__/lib/thermorossiProxy.test.ts

11 tests covering: X-API-Key header, URL path for each wrapper, URLSearchParams appending, missing env vars, 503 SERVICE_UNAVAILABLE, AbortError TIMEOUT.

## Task Commits

| Task | Description | Commit |
|------|-------------|--------|
| 1 | TypeScript types (types/thermorossiProxy.ts) | 24f22fc |
| 2 RED | Failing unit tests | 73e820c |
| 2 GREEN | Proxy client implementation | 5e5cf2b |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] types/thermorossiProxy.ts — 9 exports, no UNREACHABLE in type
- [x] lib/thermorossiProxy.ts — 5 async functions, no haPost, no retry
- [x] __tests__/lib/thermorossiProxy.test.ts — 11 tests, all passing
- [x] Commits: 24f22fc, 73e820c, 5e5cf2b exist in git log
