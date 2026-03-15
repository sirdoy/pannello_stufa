---
phase: 77-camera-migration
plan: "03"
subsystem: camera-frontend
tags: [camera, netatmo, proxy-migration, oauth-removal, frontend]
dependency_graph:
  requires: [77-02]
  provides: [camera-frontend-proxy-migration]
  affects: [app/components/devices/camera, app/(pages)/camera]
tech_stack:
  added: []
  patterns:
    - DataFreshness string union for staleness ('LIVE' | 'STALE' | 'UNREACHABLE')
    - Split fetches (status + events in parallel via Promise.all)
    - On-demand stream URL fetch when entering live mode
    - event.snapshot_url directly from proxy (no URL construction)
key_files:
  created: []
  modified:
    - lib/netatmoCameraApi.ts
    - app/components/devices/camera/CameraCard.tsx
    - app/(pages)/camera/CameraDashboard.tsx
    - app/(pages)/camera/events/CameraEventsPage.tsx
    - app/components/devices/camera/EventPreviewModal.tsx
    - __tests__/lib/netatmoCameraApi.test.ts
decisions:
  - "DataFreshness is a string union ('LIVE'|'STALE'|'UNREACHABLE'), not an object — components use dataFreshness === 'UNREACHABLE' directly"
  - "EventPreviewModal now requires only CameraEvent (no camera prop) — camera context not needed for display"
  - "Stream URL fetched on demand when user clicks Live button, not on component mount"
  - "Video playback removed from EventPreviewModal as out of scope per REQUIREMENTS.md"
metrics:
  duration_seconds: 367
  completed_date: "2026-03-15"
  tasks_completed: 2
  files_modified: 6
---

# Phase 77 Plan 03: Camera Frontend Migration Summary

**One-liner:** Camera UI fully migrated to proxy routes and field names — OAuth reauth removed, netatmoCameraApi.ts reduced to 5 display helpers, proxy field names (event_id, event_type, timestamp, camera_id, device_type) used everywhere.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Strip netatmoCameraApi.ts to display helpers only | e8f1944 | lib/netatmoCameraApi.ts |
| 2 | Update frontend components to proxy routes and field names | a074abe | CameraCard.tsx, CameraDashboard.tsx, CameraEventsPage.tsx, EventPreviewModal.tsx, netatmoCameraApi.test.ts |

## What Changed

### Task 1: netatmoCameraApi.ts cleanup
- Deleted 13 functions: getCamerasData, getCameraEvents, getEventsUntil, makeRequest, parseCameras, parsePersons, parseEvents, getSnapshotUrl, getLiveStreamUrl, getEventSnapshotUrl, getEventVideoUrl, getEventVideoThumbnail, getEventVideoDownloadUrl
- Deleted 7 types: NetatmoCamera, NetatmoPerson, NetatmoEvent, NetatmoCameraHome, ParsedCamera, ParsedPerson, ParsedEvent + RequestOptions + NetatmoApiResponse + NETATMO_API_BASE constant
- File reduced from 627 to 109 lines — keeps only 5 display helpers
- Updated header comment to "Camera Display Helpers"

### Task 2: Frontend component migration
- **CameraCard**: CAMERA_ROUTES.status, camera_id/device_type, data_freshness staleness banner, on-demand stream URL, removed needsReauth/handleReauthorize/NETATMO_ROUTES import
- **CameraDashboard**: Split parallel fetches (CAMERA_ROUTES.status + allEvents), proxy field names throughout, removed OAuth reauth block, staleness Banner
- **CameraEventsPage**: CAMERA_ROUTES.allEvents + CAMERA_ROUTES.status parallel fetch, event_id/event_type/timestamp/snapshot_url field names, removed sub_type/video_id/video_status references
- **EventPreviewModal**: CameraEvent type (proxy), removed camera prop entirely, uses event.snapshot_url + CAMERA_ROUTES.eventSnapshot fallback, removed video playback + HlsPlayer + downloadHlsVideo, simplified to snapshot-only display
- **netatmoCameraApi.test.ts**: Rewrote to test only 5 display helpers, added negative assertion that deleted API functions are undefined on default export

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DataFreshness type mismatch**
- **Found during:** Task 2 — TypeScript error in CameraCard and CameraDashboard
- **Issue:** Plan description said to check `data_freshness.status === 'UNREACHABLE'` but `DataFreshness` is a string union type `'LIVE' | 'STALE' | 'UNREACHABLE'`, not an object
- **Fix:** Changed staleness check to `dataFreshness === 'UNREACHABLE'` (direct string comparison)
- **Files modified:** CameraCard.tsx, CameraDashboard.tsx
- **Commit:** a074abe

**2. [Rule 2 - Missing critical functionality] netatmoCameraApi.test.ts needed rewrite**
- **Found during:** Task 1 — After stripping the lib file, the test file imported 5 deleted functions (parseCameras, parsePersons, parseEvents, getSnapshotUrl, getEventSnapshotUrl)
- **Fix:** Rewrote test to cover the 5 remaining display helpers plus a negative assertion confirming deleted functions are gone
- **Files modified:** __tests__/lib/netatmoCameraApi.test.ts
- **Commit:** a074abe

**3. [Rule 1 - Bug] EventPreviewModal camera prop removal**
- **Found during:** Task 2 — After removing video functions, the camera prop served no purpose
- **Fix:** Removed camera prop from EventPreviewModal entirely (simplified interface), updated callers (CameraDashboard, CameraEventsPage) to not pass camera
- **Files modified:** EventPreviewModal.tsx, CameraDashboard.tsx, CameraEventsPage.tsx
- **Commit:** a074abe

## Verification Results

```
npx jest "camera|netatmoCameraApi" --no-coverage
  6 suites, 49 tests — ALL PASS

grep for needsReauth|handleReauthorize|Riautorizza in camera dirs: 0 matches
grep for event.id|event.type|event.time in camera dirs: 0 matches
grep for NETATMO_CAMERA_API.get|parse|getSnapshot|getLiveStream|getEvent in app/: 0 matches
```

## Self-Check

- [x] lib/netatmoCameraApi.ts exists with 5 display helpers only
- [x] app/components/devices/camera/CameraCard.tsx — uses CAMERA_ROUTES.status
- [x] app/(pages)/camera/CameraDashboard.tsx — uses CAMERA_ROUTES.status + allEvents
- [x] app/(pages)/camera/events/CameraEventsPage.tsx — uses CAMERA_ROUTES.allEvents + status
- [x] app/components/devices/camera/EventPreviewModal.tsx — uses CameraEvent type
- [x] __tests__/lib/netatmoCameraApi.test.ts — 10 tests passing
- [x] Commits e8f1944 and a074abe present

## Self-Check: PASSED
