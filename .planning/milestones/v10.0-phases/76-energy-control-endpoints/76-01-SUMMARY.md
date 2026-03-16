---
phase: 76-energy-control-endpoints
plan: "01"
subsystem: netatmo-proxy-client
tags: [netatmo, proxy, post, types, control-endpoints]
dependency_graph:
  requires: [75-01]
  provides: [netatmoProxyPost, proxySetRoomThermpoint, proxySetThermMode, proxySwitchHomeSchedule, proxySyncHomeSchedule, proxyCreateNewHomeSchedule]
  affects: [76-02, 76-03, 76-04]
tech_stack:
  added: []
  patterns: [double-assertion-unknown, RFC-9457-error-mapping, AbortController-timeout]
key_files:
  created: []
  modified:
    - lib/netatmoProxy.ts
    - types/netatmoProxy.ts
decisions:
  - "Double assertion (as unknown as Record<string, unknown>) used for typed request bodies — TypeScript rejects direct assertion because interfaces don't structurally overlap with Record<string, unknown>"
  - "netatmoProxyPost mirrors netatmoProxyGet exactly: same env var check, same AbortController pattern, same RFC 9457 error parsing, same 401/503/other status mapping"
metrics:
  duration: "~2.5 minutes"
  completed_date: "2026-03-15"
  tasks_completed: 2
  files_modified: 2
---

# Phase 76 Plan 01: Control Endpoint Types and POST Foundation Summary

POST support added to Netatmo proxy client: `netatmoProxyPost<T>` with JSON body, X-API-Key auth, RFC 9457 error mapping, plus 5 typed convenience wrappers and 5 new TypeScript interfaces for control endpoint request/response bodies.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add control endpoint types to types/netatmoProxy.ts | 6d23c2f | types/netatmoProxy.ts |
| 2 | Add netatmoProxyPost and convenience wrappers to lib/netatmoProxy.ts | 11e40a8 | lib/netatmoProxy.ts |

## What Was Built

### types/netatmoProxy.ts — 5 new exported interfaces

- `SetRoomThermpointRequest` — POST /setroomthermpoint body (home_id, room_id, mode, optional temp/endtime)
- `SetThermmodeRequest` — POST /setthermmode body (home_id, mode: schedule|away|hg, optional endtime)
- `SetThermmodeResponse` — POST /setthermmode response (status, confirmed_mode, netatmo_response)
- `SwitchHomeScheduleRequest` — POST /switchhomeschedule body (home_id, schedule_id)
- `ProxyControlResponse` — generic success response for setroomthermpoint, switchhomeschedule, synchomeschedule, createnewhomeschedule

### lib/netatmoProxy.ts — POST core function + 5 convenience wrappers

`netatmoProxyPost<T>` mirrors `netatmoProxyGet<T>` exactly:
- Env var check (NETATMO_PROXY_URL, NETATMO_PROXY_API_KEY)
- AbortController with 15s default timeout
- fetch with `method: 'POST'`, `Content-Type: application/json`, `X-API-Key` header, JSON body
- RFC 9457 error body parsing with statusText fallback
- Status code mapping: 401 → UNAUTHORIZED, 503 → SERVICE_UNAVAILABLE, others → EXTERNAL_API_ERROR (BAD_GATEWAY)
- AbortError → ApiError.timeout()

Convenience wrappers:
- `proxySetRoomThermpoint(body: SetRoomThermpointRequest): Promise<ProxyControlResponse>`
- `proxySetThermMode(body: SetThermmodeRequest): Promise<SetThermmodeResponse>`
- `proxySwitchHomeSchedule(body: SwitchHomeScheduleRequest): Promise<ProxyControlResponse>`
- `proxySyncHomeSchedule(body: Record<string, unknown>): Promise<ProxyControlResponse>`
- `proxyCreateNewHomeSchedule(body: Record<string, unknown>): Promise<ProxyControlResponse>`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Double assertion required for typed request body wrappers**
- **Found during:** Task 2 verification
- **Issue:** `body as Record<string, unknown>` rejected by tsc for `SetRoomThermpointRequest`, `SetThermmodeRequest`, and `SwitchHomeScheduleRequest` — "Conversion may be a mistake because neither type sufficiently overlaps" (TS2352)
- **Fix:** Changed to `body as unknown as Record<string, unknown>` (double assertion via unknown) — consistent with existing project pattern for external API types
- **Files modified:** lib/netatmoProxy.ts
- **Commit:** 11e40a8 (included in task commit)

## Self-Check: PASSED

Files exist:
- lib/netatmoProxy.ts — FOUND
- types/netatmoProxy.ts — FOUND

Commits exist:
- 6d23c2f — FOUND (Task 1)
- 11e40a8 — FOUND (Task 2)
