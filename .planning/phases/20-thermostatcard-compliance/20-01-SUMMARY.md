---
phase: 20-thermostatcard-compliance
plan: 01
subsystem: ui
tags: [react, design-system, button, thermostat, accessibility]

# Dependency graph
requires:
  - phase: 03-design-system
    provides: Button component with variants, loading states, accessibility features
provides:
  - ThermostatCard mode grid using design system Button component
  - ThermostatCard calibrate action using design system Button with loading state
  - Accessibility attributes (aria-pressed) on mode selection buttons
affects: [thermostat, design-system-compliance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Button component className overrides for theme-specific styling (ocean, sage, warning, slate)"
    - "cn utility for conditional className merging"
    - "aria-pressed for toggle button accessibility"

key-files:
  created: []
  modified:
    - app/components/devices/thermostat/ThermostatCard.js

key-decisions:
  - "Use variant=\"subtle\" as base for all migrated buttons to maintain existing visual style"
  - "Preserve color-coded mode styling via className overrides rather than creating new variants"
  - "Use Button loading prop for calibrate action instead of manual disabled state"

patterns-established:
  - "Button className overrides: Preserve theme-specific styling while using design system base"
  - "aria-pressed attribute: Communicate toggle state to assistive technologies"

# Metrics
duration: 2.5min
completed: 2026-01-31
---

# Phase 20 Plan 01: ThermostatCard Button Compliance Summary

**Mode grid and calibrate buttons migrated to design system Button component with accessibility improvements and loading states**

## Performance

- **Duration:** 2 min 30 sec
- **Started:** 2026-01-31T09:09:10Z
- **Completed:** 2026-01-31T09:11:38Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- Replaced 4 mode grid raw buttons (Auto, Away, Gelo, Off) with Button component
- Replaced calibrate button with Button component using loading state
- Added aria-pressed accessibility attribute to mode buttons
- Maintained visual consistency with color-coded mode states via className overrides

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace mode grid raw buttons with Button component** - `5a63fd6` (feat)
2. **Task 2: Replace calibrate button with Button component** - `b2c1022` (feat)
3. **Task 3: Verify no raw button elements remain** - (verification only, no commit)

## Files Created/Modified
- `app/components/devices/thermostat/ThermostatCard.js` - All button elements now use design system Button component

## Decisions Made

1. **Use variant="subtle" for all buttons** - Provides clean base styling while allowing theme-specific overrides via className
2. **Preserve color-coded mode styling via className** - Rather than creating new Button variants (sage, warning, ocean, slate), we override className to maintain existing visual design
3. **Use Button loading prop for calibrate** - Leverages Button's built-in loading state (spinner) instead of manual disabled state with hourglass emoji

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

ThermostatCard button compliance complete. Ready for:
- Phase 20 Plan 02 (if additional ThermostatCard compliance work exists)
- Phase 21 or next design system compliance phase

**Button migration pattern established:**
- Import cn utility for conditional className merging
- Use variant="subtle" as base
- Override className for theme-specific styling
- Add accessibility attributes (aria-pressed for toggles)
- Use loading prop for async actions

**Current state:**
- 0 raw `<button>` elements in ThermostatCard
- 8 Button component instances (2 temp controls, 4 mode grid, 1 calibrate, 1 navigation)
- All interactive buttons now use design system component

---
*Phase: 20-thermostatcard-compliance*
*Completed: 2026-01-31*
