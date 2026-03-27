---
phase: 141-fritz-box-hue-migration
plan: "01"
subsystem: network-hook
tags: [websocket, fritz-box, polling-fallback, tdd, mig-04, mig-05, mig-06]
dependency_graph:
  requires:
    - "Phase 139: WebSocketContext + useWebSocketManager"
    - "Phase 140: useStoveData WS migration pattern"
  provides:
    - "useNetworkData with WS-primary + polling-fallback"
    - "Fritz!Box sparkline continuity across WS/polling transitions"
  affects:
    - "app/components/devices/network/NetworkCard (uses useNetworkData)"
    - "All Fritz!Box network visualization (bandwidth charts, device list, WAN status)"
tech_stack:
  added: []
  patterns:
    - "isWsConnected conditional subscription (subscribe only when OPEN)"
    - "Separate health useEffect watching [bandwidth, wan, downloadHistory, uploadHistory]"
    - "enrichDevicesWithCategoriesRef for stale-closure-safe WS callback"
    - "interval: isWsConnected ? null : interval for polling suppression"
key_files:
  created: []
  modified:
    - "app/components/devices/network/hooks/useNetworkData.ts"
    - "app/components/devices/network/__tests__/useNetworkData.test.ts"
decisions:
  - "Conditional subscription (if !isWsConnected return) prevents spurious subscribe calls when WS is CLOSED"
  - "Health computation extracted to separate useEffect to avoid stale closure on sparkline state in fetchData"
  - "enrichDevicesWithCategoriesRef placed after function definition (not hoisted) to avoid undefined ref"
  - "alwaysActive:false preserved — Fritz!Box is non-safety-critical monitoring"
metrics:
  duration_seconds: 559
  tasks_completed: 2
  files_modified: 2
  completed_date: "2026-03-27"
requirements: [MIG-04, MIG-05, MIG-06]
---

# Phase 141 Plan 01: useNetworkData WS Migration Summary

WS-primary Fritz!Box hook with polling fallback: subscribe('fritzbox'), bps→Mbps mapping, device status 0|1→active, sparkline append without reset, health useEffect, interval suppression when OPEN.

## What Was Built

useNetworkData migrated from HTTP-only polling to WebSocket-primary with polling fallback, following the pattern established by useStoveData in Phase 140.

**Key behaviors implemented (MIG-04/05/06):**

- Subscribes to 'fritzbox' WS topic when `readyState === OPEN` — does NOT subscribe when CLOSED
- Maps `FritzBoxBandwidth.downstream_bps / 1_000_000` → `BandwidthData.download` (Mbps)
- Maps `FritzBoxDevice.status: 0|1` → `DeviceData.active: boolean`
- Maps `FritzBoxWan.is_connected` → `WanData.connected`, `max_downstream_bps/1_000_000` → `linkSpeed`
- Sparkline arrays append from both WS and HTTP paths — no reset on WS connect/disconnect
- Health computation moved to separate `useEffect([bandwidth, wan, downloadHistory, uploadHistory])` — runs on both WS and HTTP data updates
- Polling suppressed when WS OPEN: `interval: isWsConnected ? null : interval`
- `alwaysActive: false` preserved (non-safety-critical)

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Add WS integration tests for useNetworkData | aa4277b3 | useNetworkData.test.ts |
| 2 (GREEN) | Migrate useNetworkData to WS-primary | ef5d3deb | useNetworkData.ts |

## Test Results

- 90 tests total (78 existing HTTP + 12 new WS integration)
- All 90 pass
- RED phase: 8 WS tests failed (implementation not yet done)
- GREEN phase: all 90 tests pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Conditional subscription (if !isWsConnected return)**
- **Found during:** Task 2 GREEN — test "does NOT subscribe when readyState is CLOSED" failed
- **Issue:** Plan's WS useEffect template subscribed unconditionally; test verifies subscription is guarded by readyState
- **Fix:** Added `if (!isWsConnected) return;` guard at the top of the WS useEffect; added `isWsConnected` to the dependency array
- **Files modified:** app/components/devices/network/hooks/useNetworkData.ts
- **Commit:** ef5d3deb

**2. [Rule 2 - Missing] enrichDevicesWithCategoriesRef placement**
- **Found during:** Task 2 analysis — `enrichDevicesWithCategoriesRef = useRef(enrichDevicesWithCategories)` was placed before `enrichDevicesWithCategories` function definition (not hoisted for `const`)
- **Fix:** Moved ref declaration to AFTER the `enrichDevicesWithCategories` function definition
- **Files modified:** app/components/devices/network/hooks/useNetworkData.ts
- **Commit:** ef5d3deb

## Known Stubs

None — all WS fields are fully mapped and wired.

## Self-Check: PASSED
