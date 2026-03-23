---
phase: 124-room-status-views
plan: 01
subsystem: ui
tags: [rooms, device-status, house-status, next-js, react, testing-library]

requires:
  - phase: 123-room-device-assignment
    provides: Room detail page with device assignment UI — status page uses same providers (hue/netatmo/thermorossi badge helpers) and similar card layout patterns
  - phase: 119-rooms-infrastructure
    provides: /api/rooms/house/status and /api/rooms/health API routes consumed by this page

provides:
  - app/rooms/status/page.tsx — whole-house status page with per-room device status cards
  - app/rooms/page.tsx — updated with Stato navigation button

affects: [v15.0-final, dashboard, rooms-navigation]

tech-stack:
  added: []
  patterns:
    - useHouseStatus inline hook: fetch /api/rooms/house/status with loading/error/refetch state (no polling, manual Aggiorna button only)
    - useRoomsHealth inline hook: silently ignores errors (non-critical stats)
    - renderDeviceData switch/case: maps device_type to human-readable Italian string with provider-specific metrics
    - getProviderBadgeVariant: shared helper pattern copied from room detail page (hue=ocean, netatmo/thermorossi=ember, else neutral)

key-files:
  created:
    - app/rooms/status/page.tsx
    - app/rooms/status/__tests__/page.test.tsx
  modified:
    - app/rooms/page.tsx
    - app/rooms/__tests__/page.test.tsx

key-decisions:
  - "renderDeviceData returns null for unavailable devices (data: null) — only status badge shown, no data row"
  - "Aggiorna button calls both refetch() and healthRefetch() — both datasets refreshed together"
  - "Rooms sorted by Italian locale (localeCompare 'it') matching the same pattern used in rooms/page.tsx"
  - "Test for error banner uses data-variant attribute query instead of text match — error message content varies (fetch error message passed through)"
  - "Test for RSTAT-02 uses getAllByText instead of getByText for counts that appear in both house stats and health stats"

patterns-established:
  - "Status page pattern: useHouseStatus + useRoomsHealth + manual Aggiorna button (no polling) for status/dashboard pages"
  - "renderDeviceData: centralized switch/case provider data renderer returns null-or-string for clean conditional rendering"

requirements-completed: [RSTAT-01, RSTAT-02, RSTAT-03]

duration: 4min
completed: 2026-03-23
---

# Phase 124 Plan 01: Room Status Views Summary

**Whole-house device status page at /rooms/status with per-room cards showing provider-specific live metrics, Aggiorna refresh button, and Stato navigation from the rooms list**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-23T19:34:27Z
- **Completed:** 2026-03-23T19:38:24Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created app/rooms/status/page.tsx with useHouseStatus + useRoomsHealth inline hooks, per-room cards with device status, provider badges, device type codes, and provider-specific data rendering for all 6 device types (light, sensor, thermostat, speaker, stove, camera)
- Added whole-house summary stats (total_devices, total_available, total_unavailable) and health stats (room_count, total_device_count, orphan_device_count) in a single stats row
- Added "Stato" ghost button to rooms list toolbar navigating to /rooms/status
- 11 tests for status page (RSTAT-01, RSTAT-02, RSTAT-03, D-20, loading, error, empty, empty room, sort); 1 new test for Stato navigation button on rooms page

## Task Commits

Each task was committed atomically:

1. **Task 1: Create room status page with useHouseStatus hook, provider rendering, and tests** - `db8427af` (feat)
2. **Task 2: Add Stato navigation button to rooms list page** - `536f11a9` (feat)

## Files Created/Modified
- `app/rooms/status/page.tsx` - New whole-house status page with inline hooks and renderDeviceData
- `app/rooms/status/__tests__/page.test.tsx` - 11 tests covering all requirements and edge states
- `app/rooms/page.tsx` - Added Stato ghost button + gap-2 to toolbar
- `app/rooms/__tests__/page.test.tsx` - Added test 18 for Stato navigation

## Decisions Made
- `renderDeviceData` returns `null` for unavailable devices (data is null) — only the "Non disponibile" badge is shown, no data row
- Test assertions for RSTAT-02 use `getAllByText` for counts like "3" and "1" that appear multiple times (total_devices:3 also matches total_device_count:3 from health stats)
- Error banner test uses `data-variant="error"` attribute query instead of text match since error message content flows directly from fetch error (varies by error type)

## Deviations from Plan

None - plan executed exactly as written. Minor test assertion adjustments made during TDD RED→GREEN cycle (not deviations from requirements).

## Issues Encountered
- RSTAT-02 test initially used `getByText('3')` which found multiple elements (total_devices:3 and total_device_count:3 both render as "3"). Fixed to `getAllByText('3')` — expected behavior given the data.
- Error banner test searched for `/Errore/` text but the error message passed through directly from `useHouseStatus` catch block ("Errore sconosciuto" only when err is not Error instance). Fixed to query by `data-variant="error"` attribute.
- Sort test initially used `screen.getByRole('main')` which doesn't exist in mocked SettingsLayout. Fixed to `document.body.innerHTML`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- v15.0 milestone is complete — all 7 phases (118-124) delivered
- /rooms/status page is live and navigable from /rooms via the Stato button
- All 50 rooms-related tests pass across 3 test files

---
*Phase: 124-room-status-views*
*Completed: 2026-03-23*
