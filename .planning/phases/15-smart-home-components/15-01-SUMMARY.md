---
phase: 15-smart-home-components
plan: 01
subsystem: ui
tags: [useLongPress, ControlButton, CVA, haptic-feedback, continuous-adjustment, vibration-api]

# Dependency graph
requires:
  - phase: 11-foundation-tooling
    provides: cn utility, CVA setup
  - phase: lib/pwa/vibration.js
    provides: vibrateShort for haptic feedback
provides:
  - useLongPress hook with constant repeat rate
  - ControlButton component with CVA variants
  - Long-press continuous value adjustment
  - Haptic feedback integration
affects: [15-02, 15-03, 15-04, 15-05, 15-06, smart-home-controls, temperature-controls]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useLongPress: refs for timeout/interval to avoid re-renders"
    - "Long-press constant rate (not accelerating) for predictable UX"
    - "ControlButton onChange(delta) API with step size"
    - "Haptic via vibrateShort on each callback"
    - "touch-manipulation + select-none for mobile optimization"

key-files:
  created:
    - app/hooks/useLongPress.js
    - app/hooks/__tests__/useLongPress.test.js
    - app/components/ui/__tests__/ControlButton.test.js
  modified:
    - app/components/ui/ControlButton.js

key-decisions:
  - "useLongPress uses refs (not state) for timer IDs to avoid re-renders"
  - "Constant repeat rate (not accelerating) for predictable UX"
  - "onChange(delta) API replaces onClick for step-based adjustment"
  - "Haptic enabled by default, opt-out via haptic=false"
  - "Backwards compatible with onClick (deprecated warning in dev)"
  - "aria-label Incrementa/Decrementa for Italian accessibility"
  - "touch-manipulation prevents scroll interference during long-press"

patterns-established:
  - "Long-press hook pattern: useRef for timers, isActiveRef guard, callbackRef for latest closure"
  - "ControlButton API: onChange(delta), step, longPressDelay, longPressInterval, haptic props"
  - "Haptic integration: vibrateShort from @/lib/pwa/vibration on each callback"

# Metrics
duration: 8min
completed: 2026-01-29
---

# Phase 15 Plan 01: Long-press Hook and ControlButton Summary

**useLongPress hook with constant repeat rate and ControlButton refactored with CVA, long-press, and haptic feedback for continuous value adjustment**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-29T15:35:00Z
- **Completed:** 2026-01-29T15:43:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created useLongPress hook with configurable delay/interval/haptic options
- Refactored ControlButton to use CVA for variant management
- Integrated long-press for continuous temperature/brightness adjustment
- Added haptic feedback via vibrateShort for tactile mobile experience
- Added comprehensive test coverage (53 tests total)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useLongPress hook** - `c395016` (feat)
2. **Task 2: Refactor ControlButton with CVA and long-press** - `dcb2224` (feat)

## Files Created/Modified

- `app/hooks/useLongPress.js` - Long-press hook with delay/interval/haptic options
- `app/hooks/__tests__/useLongPress.test.js` - 16 tests for hook behavior
- `app/components/ui/ControlButton.js` - CVA refactor with long-press integration
- `app/components/ui/__tests__/ControlButton.test.js` - 37 tests for component

## Decisions Made

1. **Refs over state for timer IDs:** Using useRef instead of useState for timeout/interval IDs avoids unnecessary re-renders and stale closure issues
2. **Constant repeat rate:** Not accelerating rate provides predictable UX - users know exactly how fast values will change
3. **onChange(delta) API:** New API passes +step or -step value, making it clear what change occurred (replaces simple onClick)
4. **Haptic by default:** Mobile users benefit from tactile feedback; opt-out available via haptic=false
5. **Italian aria-labels:** "Incrementa"/"Decrementa" for accessibility in target locale
6. **touch-manipulation class:** Prevents accidental scrolling during long-press gestures

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation straightforward following established CVA patterns from Phase 11-14.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- useLongPress hook ready for use in other components (e.g., SliderControl, BrightnessControl)
- ControlButton ready for integration with temperature/Hue controls
- Pattern established for continuous adjustment UI components

---
*Phase: 15-smart-home-components*
*Completed: 2026-01-29*
