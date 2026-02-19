---
phase: 73-render-optimization
plan: 02
subsystem: ui
tags: [react, polling, debounce, performance, thundering-herd, thermostat]

# Dependency graph
requires:
  - phase: 73-render-optimization
    provides: useAdaptivePolling hook (existing, pre-plan)
provides:
  - useAdaptivePolling with initialDelay parameter (backward-compatible, default 0)
  - Dashboard card stagger: thermostat 50ms, lights 100ms, weather 250ms, camera 400ms, network 500ms
  - Thermostat setpoint debounced writes (500ms, optimistic UI)
affects: [any future hook using useAdaptivePolling, thermostat UX]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "initialDelay gate: useState(initialDelay===0) + useEffect setTimeout to resolve gate — guards both immediate-call and interval-setup effects"
    - "Thundering herd mitigation: stagger dashboard card initial API calls across 0-500ms window using initialDelay or setTimeout"
    - "Debounced optimistic UI: local pendingSetpoint state + useDebounce(500ms) effect that fires actual API write — display shows pending value immediately"

key-files:
  created: []
  modified:
    - lib/hooks/useAdaptivePolling.ts
    - lib/hooks/__tests__/useAdaptivePolling.test.ts
    - app/components/devices/thermostat/ThermostatCard.tsx
    - app/components/devices/lights/hooks/useLightsData.ts
    - app/components/devices/camera/CameraCard.tsx
    - app/components/devices/weather/WeatherCardWrapper.tsx
    - app/components/devices/network/hooks/useNetworkData.ts

key-decisions:
  - "initialDelay default=0 preserves full backward-compatibility — no changes to existing callers except the 5 dashboard hooks"
  - "Visibility-restore effect does NOT need delayDone guard — visibility changes after mount, by which time delay has elapsed"
  - "useStoveData is NOT modified — uses Firebase RTDB onValue() listener as primary path, not useAdaptivePolling; safety-critical data path untouched"
  - "CameraCard uses setTimeout(400ms) directly (not initialDelay) because it uses a custom useEffect pattern, not useAdaptivePolling"
  - "WeatherCardWrapper uses setTimeout(250ms) with proper cleanup ref — location subscription fires synchronously from localStorage cache, so timeout debounces first call"
  - "Thermostat pendingSetpoint reset on selectedRoomId change prevents stale cross-room writes when user switches rooms during debounce window"

patterns-established:
  - "initialDelay pattern: add to UseAdaptivePollingOptions interface; useState gate; useEffect with setTimeout to resolve gate; guard immediate-call + interval effects"
  - "Debounced API write with optimistic UI: pendingSetpoint state + useDebounce(X) + useEffect on debouncedValue to fire API + display shows pending ?? server"

requirements-completed: [REND-02, REND-04]

# Metrics
duration: 13min
completed: 2026-02-19
---

# Phase 73 Plan 02: Adaptive Polling Stagger + Thermostat Debounce Summary

**`initialDelay` parameter added to `useAdaptivePolling` spreads 5 dashboard card initial fetches across 0-500ms window; thermostat +/- buttons debounce API writes to max 1 per 500ms with immediate optimistic UI update**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-02-19T08:24:21Z
- **Completed:** 2026-02-19T08:37:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added `initialDelay?: number` to `useAdaptivePolling` with backward-compatible default of 0 — all 10 existing tests pass unchanged; 2 new tests validate delay and no-delay behavior
- Spread 5 non-stove dashboard card initial API calls: thermostat 50ms, lights 100ms, weather 250ms, camera 400ms, network 500ms — stove uses Firebase RTDB listener at t=0 (untouched)
- Thermostat setpoint +/- buttons now update display immediately (optimistic UI via `pendingSetpoint`) and fire at most one API write per 500ms burst; room change resets pending state to prevent cross-room writes

## Task Commits

Each task was committed atomically:

1. **Task 1: Add initialDelay parameter to useAdaptivePolling + update tests** - `a88af5f` (feat)
2. **Task 2: Stagger dashboard card initial fetches + thermostat debounced writes** - `f42ae6b` (feat)

## Files Created/Modified
- `lib/hooks/useAdaptivePolling.ts` - Added `initialDelay` option with useState gate pattern; guards immediate-call + interval effects; visibility-restore effect unchanged
- `lib/hooks/__tests__/useAdaptivePolling.test.ts` - Added 2 new tests for initialDelay behavior; all 12 tests pass
- `app/components/devices/thermostat/ThermostatCard.tsx` - `initialDelay: 50`, `useDebounce` import, `pendingSetpoint` state, debounced write effect, room-change reset, optimistic button handlers
- `app/components/devices/lights/hooks/useLightsData.ts` - `initialDelay: 100`
- `app/components/devices/camera/CameraCard.tsx` - `setTimeout(fetchCameras, 400)` with cleanup
- `app/components/devices/weather/WeatherCardWrapper.tsx` - `setTimeout(fetchWeather, 250)` with timeout ref cleanup
- `app/components/devices/network/hooks/useNetworkData.ts` - `initialDelay: 500`

## Decisions Made
- `initialDelay` default is 0 to preserve full backward-compatibility — all existing callers work unchanged
- Visibility-restore effect not guarded by `delayDone` — by the time visibility changes (user switches tabs), the delay has already elapsed; adding the guard would break tab-restore behavior
- `useStoveData` untouched — uses Firebase RTDB `onValue()` listener, not polling; stove data arrives at t=0 via Firebase subscription (safety-critical path)
- `CameraCard` uses `setTimeout` directly because it uses a custom `useEffect + connectionCheckedRef` pattern, not `useAdaptivePolling`
- `WeatherCardWrapper` uses `setTimeout` with a `weatherTimeout` ref to handle the case where location fires synchronously from localStorage cache on mount

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 73-02 complete — all thundering herd mitigation implemented
- Phase 73 (render-optimization) has 2 plans: both now complete
- Ready to move to next phase in v9.0 sequence (Phase 74 Suspense — conditional based on LCP/TTI results)

---
*Phase: 73-render-optimization*
*Completed: 2026-02-19*
