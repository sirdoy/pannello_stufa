---
phase: 83-camera-monitoring-toggle-ui
plan: "01"
subsystem: camera-ui
tags: [camera, monitoring, toggle, switch, optimistic-update]
dependency_graph:
  requires: [77-camera-migration]
  provides: [CAM-05-frontend]
  affects: [CameraCard, CameraDashboard]
tech_stack:
  added: []
  patterns: [optimistic-update-with-rollback, per-camera-record-state]
key_files:
  created:
    - __tests__/app/components/devices/camera/CameraMonitoringToggle.test.tsx
  modified:
    - app/components/devices/camera/CameraCard.tsx
    - app/(pages)/camera/CameraDashboard.tsx
decisions:
  - CameraCard uses single boolean state (monitoringOn) since only one camera is selected at a time
  - CameraDashboard uses Record<string, boolean> maps for per-camera state since all cameras are visible simultaneously
  - isStale check in CameraCard uses dataFreshness === 'UNREACHABLE' inline (before const isStale is declared) to avoid hoisting issues
  - Monitoring state synced from camera.status via useEffect in CameraCard (not initialized in fetchCameras to keep state logic separate)
  - Monitoring states initialized inside fetchData in CameraDashboard alongside camera data load
metrics:
  duration_seconds: 206
  completed_date: "2026-03-16"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 3
---

# Phase 83 Plan 01: Camera Monitoring Toggle UI Summary

Wire camera monitoring on/off Switch (ocean variant) into CameraCard and CameraDashboard with optimistic update and rollback via POST /api/netatmo/camera/monitoring.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add monitoring toggle to CameraCard and CameraDashboard | 9c6f9fd | CameraCard.tsx, CameraDashboard.tsx, CameraMonitoringToggle.test.tsx |

## What Was Built

**CameraCard (homepage):**
- Added `monitoringOn: boolean` and `monitoringLoading: boolean` state
- `useEffect` syncs `monitoringOn` from `selectedCamera.status === 'on'` whenever the selected camera changes
- `handleMonitoringToggle(newValue)` sends POST to `CAMERA_ROUTES.monitoring` with `{ camera_id, monitoring: 'on'|'off' }`, rolls back on non-ok response or fetch rejection
- Switch rendered in the camera info footer row with `size="sm"`, `variant="ocean"`, disabled when `isStale || monitoringLoading`

**CameraDashboard (/camera page):**
- Added `monitoringStates: Record<string, boolean>` and `monitoringLoading: Record<string, boolean>` for per-camera tracking
- States initialized from `camera.status === 'on'` inside `fetchData` after camera list is loaded
- `handleMonitoringToggle(cameraId, newValue)` sends POST to `CAMERA_ROUTES.monitoring`, rolls back per-camera state on failure
- Switch rendered in new "Monitoraggio" grid cell in the camera info panel, disabled when `isStale || monitoringLoading[cameraId]`

**Tests (8 passing):**
- Initial state: `status === 'on'` maps to checked, anything else to unchecked
- POST body format: `{ camera_id: 'cam-1', monitoring: 'off' }` when toggling off
- POST body format: `{ camera_id: 'cam-1', monitoring: 'on' }` when toggling on
- Disabled when `isStale === true` (UNREACHABLE)
- Disabled during API call (monitoringLoading)
- Rollback on non-ok response (HTTP error)
- Rollback on fetch rejection (network error)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All created/modified files confirmed on disk. Commit 9c6f9fd confirmed in git history.
