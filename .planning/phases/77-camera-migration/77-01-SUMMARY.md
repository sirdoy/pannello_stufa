---
phase: 77-camera-migration
plan: 01
subsystem: netatmo-proxy-client
tags: [types, proxy-client, camera, tdd]
dependency_graph:
  requires: []
  provides: [camera-proxy-types, camera-proxy-wrappers]
  affects: [plans/77-02]
tech_stack:
  added: []
  patterns: [raw-fetch-binary-endpoint, optional-query-param, double-assertion-typed-body]
key_files:
  created:
    - __tests__/lib/netatmoProxy-camera.test.ts
  modified:
    - types/netatmoProxy.ts
    - lib/netatmoProxy.ts
decisions:
  - "getProxyCameraEventSnapshot uses raw fetch (not netatmoProxyGet) — binary endpoint returns Response directly for streaming"
  - "getProxyCameraEvents uses optional hours param: appends ?hours=N to path when provided"
  - "Tests use global.fetch mock (same pattern as netatmoProxy.test.ts) rather than module mock — camera wrappers call netatmoProxyGet internally in same module"
metrics:
  duration: 213s
  completed_date: "2026-03-15"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
---

# Phase 77 Plan 01: Camera Proxy Types and Convenience Wrappers Summary

**One-liner:** Camera proxy types (9 interfaces) and 6 typed convenience wrappers in netatmoProxy client, with TDD — binary snapshot endpoint returns raw Response for streaming.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add camera proxy types to types/netatmoProxy.ts | 6d878ce | types/netatmoProxy.ts |
| 2 | Add camera convenience wrappers + tests | 6a020dd | lib/netatmoProxy.ts, __tests__/lib/netatmoProxy-camera.test.ts |

## What Was Built

### Task 1: Camera Types (types/netatmoProxy.ts)

Added a new `// CAMERA TYPES` section with 9 exported interfaces:

- `CameraStatus` — camera_id, name, device_type, status, sd_status, alim_status, firmware, is_local (nullable except camera_id)
- `CameraStatusResponse` — cameras: CameraStatus[], data_freshness: DataFreshness
- `StreamUrls` — high, medium, low string fields
- `CameraStreamResponse` — camera_id, vpn_streams, is_local, local_streams? (optional)
- `CameraSnapshotUrlResponse` — camera_id, snapshot_url
- `SetMonitoringRequest` — monitoring: 'on' | 'off'
- `SetMonitoringResponse` — camera_id, monitoring, status: 'applied'
- `CameraEvent` — event_id, camera_id, event_type, timestamp, message/snapshot_url/person_id nullable
- `CameraEventsResponse` — events: CameraEvent[], count: number

All proxy field names used (event_id, event_type, timestamp) — not old Netatmo API field names.

### Task 2: Camera Convenience Wrappers (lib/netatmoProxy.ts)

Added `// CAMERA WRAPPERS` section with 6 exported functions:

- `getProxyCameraStatus()` — GET /camera/status
- `getProxyCameraStream(cameraId)` — GET /camera/{cameraId}/stream
- `getProxyCameraSnapshot(cameraId)` — GET /camera/{cameraId}/snapshot
- `proxySetCameraMonitoring(cameraId, body)` — POST /camera/{cameraId}/monitoring, double assertion for typed body
- `getProxyCameraEvents(hours?)` — GET /camera/events or /camera/events?hours=N
- `getProxyCameraEventSnapshot(eventId)` — raw binary fetch, returns Response directly (not JSON)

### Tests (__tests__/lib/netatmoProxy-camera.test.ts)

15 tests covering all 6 wrappers: endpoint path construction, response shape, request body, and binary fetch behavior.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

- [x] types/netatmoProxy.ts modified — 9 camera interfaces exported
- [x] lib/netatmoProxy.ts modified — 6 camera wrappers exported
- [x] __tests__/lib/netatmoProxy-camera.test.ts created — 15 tests, all passing
- [x] Commit 6d878ce exists (Task 1: types)
- [x] Commit 6a020dd exists (Task 2: wrappers + tests)
- [x] Zero TypeScript errors for camera-related code

## Self-Check: PASSED
