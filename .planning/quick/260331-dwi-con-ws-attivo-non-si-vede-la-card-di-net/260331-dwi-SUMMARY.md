---
phase: quick
plan: 260331-dwi
subsystem: camera
tags: [bug-fix, hooks, polling, camera]
dependency_graph:
  requires: [useAdaptivePolling, useVisibility, CAMERA_ROUTES]
  provides: [useCameraData]
  affects: [CameraCard, homepage-dashboard]
tech_stack:
  patterns: [useAdaptivePolling-polling, retry-loop, hook-extraction]
key_files:
  created:
    - app/components/devices/camera/hooks/useCameraData.ts
    - app/components/devices/camera/hooks/__tests__/useCameraData.test.ts
  modified:
    - app/components/devices/camera/CameraCard.tsx
decisions:
  - Loop-based retry instead of recursive retry to avoid double-finally setState issues
  - Once-only polling mock flag to prevent re-render triggering duplicate callback invocations
metrics:
  duration: 8 minutes
  completed: 2026-03-31
  tasks: 2
  files: 3
---

# Quick Task 260331-dwi: Fix CameraCard not rendering with WebSocket active

Camera data hook with useAdaptivePolling replacing fragile one-shot fetch + connectionCheckedRef guard

## What Changed

### Task 1: Create useCameraData hook (TDD)

Created `app/components/devices/camera/hooks/useCameraData.ts` following the useRaspiData pattern:

- Polls camera status every 60s (visible) / 300s (background) via `useAdaptivePolling`
- Loop-based retry (1 retry, 1500ms delay) instead of recursive retry
- Exports `UseCameraDataReturn` interface with cameras, loading, error, connected, stale, dataFreshness, lastUpdatedAt, refresh
- No WebSocket subscription (camera is not a WS topic)
- No connectionCheckedRef guard -- useAdaptivePolling handles mount/unmount correctly

5 unit tests covering: initial loading state, successful fetch, network error without prior data, stale state with prior data, polling configuration.

### Task 2: Refactor CameraCard to consume hook

Simplified CameraCard.tsx by removing all inline data fetching:

- Removed: `connectionCheckedRef`, mount `useEffect`, inline `fetchCameras` function
- Removed: manual `loading`, `error`, `connected`, `cameras`, `dataFreshness` state
- Added: `useCameraData()` hook import providing all data state
- Error state retry button calls `refresh()` from hook
- All UI rendering, snapshot/stream/monitoring logic preserved exactly

Net result: -55 lines from CameraCard (392 -> 337 lines).

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 96807e3e | feat(260331-dwi): add useCameraData hook with useAdaptivePolling |
| 2 | 221f4efb | fix(260331-dwi): refactor CameraCard to use useCameraData hook |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Loop-based retry instead of recursive retry**
- **Found during:** Task 1
- **Issue:** Recursive `fetchCameras(retryCount + 1)` causes `finally { setLoading(false) }` to run for each recursion level. Combined with React's mock calling the callback on every render, `setError(null)` at the top of each call would overwrite the error set by the final retry.
- **Fix:** Replaced recursion with a for-loop (`for attempt = 0..MAX_RETRIES`), so `finally` runs exactly once.
- **Files modified:** app/components/devices/camera/hooks/useCameraData.ts

**2. [Rule 1 - Bug] Once-only polling mock in tests**
- **Found during:** Task 1
- **Issue:** The `useAdaptivePolling` mock fired `callback()` on every render via `setTimeout(0)`, causing the fetch to restart (and `setError(null)`) before the error state committed.
- **Fix:** Added `pollingStarted` flag to mock so callback fires only once.
- **Files modified:** app/components/devices/camera/hooks/__tests__/useCameraData.test.ts

## Verification

- All 77 camera-related tests pass across 10 test suites
- useCameraData hook: 5/5 tests pass
- CameraCard: no connectionCheckedRef, no inline fetchCameras
- React strict mode safe (no ref-based one-shot guard)

## Known Stubs

None -- all data paths are wired to live API endpoints.
