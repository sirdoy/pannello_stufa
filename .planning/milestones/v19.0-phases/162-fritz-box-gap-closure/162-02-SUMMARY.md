---
phase: 162-fritz-box-gap-closure
plan: "02"
subsystem: fritzbox
tags: [api-routes, fritz-box, history, service-discovery, raw-passthrough]
dependency_graph:
  requires: [162-01]
  provides: [FRITZ-04, FRITZ-05, FRITZ-06, FRITZ-07]
  affects: [lib/fritzbox/fritzboxClient.ts]
tech_stack:
  added: []
  patterns: [raw-passthrough, regex-xml-parse, direct-fetch-for-xml]
key_files:
  created:
    - app/api/fritzbox/history/bandwidth/route.ts
    - app/api/fritzbox/history/bandwidth/__tests__/route.test.ts
    - app/api/fritzbox/history/device-events/route.ts
    - app/api/fritzbox/history/device-events/__tests__/route.test.ts
    - app/api/fritzbox/history/devices/route.ts
    - app/api/fritzbox/history/devices/__tests__/route.test.ts
    - app/api/fritzbox/service-discovery/route.ts
    - app/api/fritzbox/service-discovery/__tests__/route.test.ts
  modified:
    - lib/fritzbox/fritzboxClient.ts
decisions:
  - "Used direct fetch (not haGet) for getServiceDiscovery because haGet calls response.json() which fails on XML responses"
  - "Used regex-based XML parsing for TR-064 service discovery -- no external parser needed, structure is shallow and fixed"
  - "getDevicePresenceHistory added per D-05 conditional requirement even though endpoint may 404 at runtime"
metrics:
  duration: 15m
  completed: "2026-04-09"
  tasks_completed: 2
  files_created: 8
  files_modified: 1
---

# Phase 162 Plan 02: Fritz!Box Raw History Routes and Service Discovery Summary

**One-liner:** Raw bandwidth/device-events/device-presence history pass-through routes plus TR-064 service discovery with regex-based XML-to-JSON parsing.

## What Was Built

Four new API routes and four new client functions closing FRITZ-04 through FRITZ-07:

### Task 1: Raw History Routes (FRITZ-04, FRITZ-05, FRITZ-06)

Added three new functions to `fritzboxClient.ts`:
- `getBandwidthHistoryRaw(params?)` — raw pass-through to `/api/v1/fritzbox/history/bandwidth` (distinct from the existing `getBandwidthHistory` which transforms bps→Mbps)
- `getDeviceEventsRaw(params?)` — raw pass-through to `/api/v1/fritzbox/history/device-events` (distinct from existing `getDeviceEvents` which camelCases and converts timestamps)
- `getDevicePresenceHistory(params?)` — pass-through to `/api/v1/fritzbox/history/devices` (conditional per D-05, may 404 at runtime)

Three new API routes:
- `GET /api/fritzbox/history/bandwidth` — forwards hours/limit/offset params, cache key `history-bandwidth-raw`
- `GET /api/fritzbox/history/device-events` — forwards hours/limit/offset/mac params, cache key `history-device-events-raw`
- `GET /api/fritzbox/history/devices` — forwards limit/offset params, cache key `history-devices-raw`

### Task 2: Service Discovery (FRITZ-07)

Added `getServiceDiscovery()` and `parseServiceDiscoveryXml()` to `fritzboxClient.ts`:
- Uses direct `fetch` (not `haGet`) because `haGet` calls `response.json()` internally, which throws on XML responses
- Checks `content-type` header: JSON responses used directly, XML responses parsed via regex
- Regex parser extracts `<service>` blocks and pulls name, type, and url fields
- No external XML parser dependency added

New API route:
- `GET /api/fritzbox/service-discovery` — no query params, cache key `service-discovery`

## Test Results

- Task 1: 15 tests across 3 files — all passing
- Task 2: 5 tests — all passing
- Full Fritz!Box suite: 152/152 tests passing (no regressions)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All routes call real client functions that proxy to the HA backend.

## Threat Flags

All routes covered by plan's threat model (T-162-05 through T-162-09):
- `withAuthAndErrorHandler` enforces Auth0 session on every request (T-162-05)
- Only allowed query params forwarded; arbitrary params dropped (T-162-06)
- Rate limiting + caching on all routes (T-162-09)
- XML parsed via regex, no DOM parser with entity resolution (T-162-08, accepted)

## Self-Check: PASSED

Files exist:
- app/api/fritzbox/history/bandwidth/route.ts: FOUND
- app/api/fritzbox/history/device-events/route.ts: FOUND
- app/api/fritzbox/history/devices/route.ts: FOUND
- app/api/fritzbox/service-discovery/route.ts: FOUND

Commits exist:
- 38b8f31b (Task 1)
- ba27157c (Task 2)
