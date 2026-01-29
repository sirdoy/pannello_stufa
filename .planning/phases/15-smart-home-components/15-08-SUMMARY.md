---
phase: 15-smart-home-components
plan: 08
subsystem: ui
tags: [LightsCard, ControlButton, long-press, haptic-feedback, brightness-control, Philips-Hue]

# Dependency graph
requires:
  - phase: 15-01
    provides: useLongPress hook, ControlButton component with CVA
provides:
  - Long-press brightness adjustment in LightsCard
  - Haptic feedback on brightness changes (mobile)
  - Continuous value adjustment UX pattern
affects: [16-page-migration, lights-page, brightness-controls]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ControlButton onChange(delta) API for step-based adjustment"
    - "Long-press pattern for continuous brightness control"
    - "Haptic feedback default-enabled for touch devices"

key-files:
  created: []
  modified:
    - app/components/devices/lights/LightsCard.js

key-decisions:
  - "ControlButton step=5 matches original 5% increment behavior"
  - "onChange(delta) uses delta to calculate new bounded value"
  - "Remove font-display from className (built-in via CVA)"
  - "Haptic enabled by default (ControlButton default)"

patterns-established:
  - "ControlButton integration: onChange with Math.max/min bounds checking"
  - "Brightness control: step={5} for 5% increments with min=1, max=100"

# Metrics
duration: 4min
completed: 2026-01-29
---

# Phase 15 Plan 08: LightsCard Brightness Control Summary

**LightsCard brightness +/- controls replaced with ControlButton for long-press continuous adjustment and haptic feedback**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-29T15:45:00Z
- **Completed:** 2026-01-29T15:49:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Replaced Button-based brightness controls with ControlButton
- Enabled long-press for continuous brightness adjustment
- Added haptic feedback on value changes (mobile devices)
- Preserved existing variant/size/disabled behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Import ControlButton** - `cb53e94` (feat)
2. **Task 2: Replace brightness buttons** - `3015d88` (feat)

## Files Created/Modified

- `app/components/devices/lights/LightsCard.js` - Replaced brightness +/- Button with ControlButton

## Decisions Made

1. **step={5} matches original behavior:** Original buttons changed brightness by 5%, step prop preserves this
2. **onChange(delta) with bounds checking:** Using `avgBrightness + delta` with Math.max(1) / Math.min(100) for safe range
3. **Removed font-display className:** ControlButton has font-display built-in via CVA base classes
4. **Self-closing ControlButton tags:** No children needed - ControlButton displays + or - symbol based on type

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward component replacement following established ControlButton API from 15-01.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- LightsCard now has consistent long-press UX with other smart home controls
- Pattern established for ControlButton integration in brightness/temperature controls
- Ready for Phase 16 page migration

---
*Phase: 15-smart-home-components*
*Completed: 2026-01-29*
