---
phase: 132-fritz-box-system-network-services
plan: "01"
subsystem: fritz-box
tags: [fritz-box, api-client, api-routes, wifi, system-info, unit-tests]
dependency_graph:
  requires: []
  provides: [fritzbox-system-route, fritzbox-wifi-clients-route, fritzbox-wifi-networks-route, fritzbox-7-new-client-methods]
  affects: [lib/fritzbox/fritzboxClient.ts, lib/fritzbox/__tests__/fritzboxClient.test.ts]
tech_stack:
  added: []
  patterns: [haGet-raw-passthrough, getCachedData, checkRateLimitFritzBox, withAuthAndErrorHandler]
key_files:
  created:
    - app/api/fritzbox/system/route.ts
    - app/api/fritzbox/wifi/clients/route.ts
    - app/api/fritzbox/wifi/networks/route.ts
  modified:
    - lib/fritzbox/fritzboxClient.ts
    - lib/fritzbox/__tests__/fritzboxClient.test.ts
decisions:
  - "7 new methods are raw haGet pass-through (no field transformation) matching the plan's D-01/D-02/D-03/D-04/D-05 decisions"
  - "getWifiClients and getDhcpReservations/getPortForwarding accept optional URLSearchParams for query forwarding"
  - "UPnPStatusResponse.upnp_ports reuses PortForwardingRuleModel (same shape per API spec)"
metrics:
  duration: "~8 minutes"
  completed_date: "2026-03-25"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 2
---

# Phase 132 Plan 01: Fritz!Box Client Methods + System/WiFi Routes Summary

**One-liner:** 7 new haGet pass-through methods on fritzboxClient (system, wifi, network endpoints) plus 3 API routes (system, wifi/clients, wifi/networks) with rate limiting and caching.

## What Was Built

**Task 1: 7 new fritzboxClient methods + unit tests**

Added 7 async functions with inline TypeScript interfaces to `lib/fritzbox/fritzboxClient.ts`, all appended after the existing `getDeviceEvents` function and exported on the `fritzboxClient` object:

| Method | Endpoint | Requirement |
|--------|----------|-------------|
| `getSystemInfo()` | `/api/v1/fritzbox/system` | FRITZ-01 |
| `getWifiClients(params?)` | `/api/v1/fritzbox/wifi/clients` | FRITZ-02 |
| `getWifiNetworks()` | `/api/v1/fritzbox/wifi/networks` | FRITZ-03 |
| `getDhcpReservations(params?)` | `/api/v1/fritzbox/network/dhcp/reservations` | FRITZ-04 |
| `getPortForwarding(params?)` | `/api/v1/fritzbox/network/port-forwarding` | FRITZ-05 |
| `getUpnpStatus()` | `/api/v1/fritzbox/network/upnp` | FRITZ-06 |
| `getMeshTopology()` | `/api/v1/fritzbox/network/mesh` | FRITZ-07 |

Added 7 new `describe` blocks (17 new test cases) to `fritzboxClient.test.ts`. All 32 tests pass.

**Task 2: 3 new API routes**

| Route file | Endpoint | Pattern |
|------------|----------|---------|
| `app/api/fritzbox/system/route.ts` | `GET /api/fritzbox/system` | canonical devices/route.ts |
| `app/api/fritzbox/wifi/clients/route.ts` | `GET /api/fritzbox/wifi/clients` | with band/limit/offset forwarding |
| `app/api/fritzbox/wifi/networks/route.ts` | `GET /api/fritzbox/wifi/networks` | canonical devices/route.ts |

All routes follow the canonical pattern: `force-dynamic`, `withAuthAndErrorHandler`, `checkRateLimitFritzBox`, `getCachedData`, `success()`.

## Verification

- `npx jest --testPathPatterns="fritzboxClient"`: 32 tests pass (2 suites)
- All 3 route files confirmed to exist with correct exports
- All 7 methods exported on `fritzboxClient` object

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all 7 client methods call real HA proxy endpoints. Routes wire directly to client methods.

## Self-Check: PASSED

- lib/fritzbox/fritzboxClient.ts: FOUND (contains getSystemInfo, getWifiClients, getWifiNetworks, getDhcpReservations, getPortForwarding, getUpnpStatus, getMeshTopology)
- lib/fritzbox/__tests__/fritzboxClient.test.ts: FOUND (contains describe('getSystemInfo()'), describe('getMeshTopology()'))
- app/api/fritzbox/system/route.ts: FOUND
- app/api/fritzbox/wifi/clients/route.ts: FOUND
- app/api/fritzbox/wifi/networks/route.ts: FOUND
- Commits: d01552b1, 38dbadc5
