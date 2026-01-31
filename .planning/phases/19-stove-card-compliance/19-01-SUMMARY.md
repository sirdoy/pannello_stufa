---
phase: 19-stove-card-compliance
plan: 01
subsystem: ui
tags: [design-system, button, button-group, accessibility, ember-noir, stove-card]

# Dependency graph
requires:
  - phase: 12-design-system-core
    provides: Button component with CVA variants and Button.Group composite
provides:
  - StoveCard scheduler mode selection using Button.Group
  - Interactive mode buttons (Manuale/Automatica/Semi-manual) with aria-pressed
  - Action buttons using design system Button component with proper accessibility
affects: [20-lights-card-compliance, 21-thermostat-card-compliance, design-system-compliance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Button.Group for mode selection with active state tracking via aria-pressed"
    - "ember variant for primary/active actions, subtle variant for secondary/inactive"
    - "Mode switching handlers using existing /api/scheduler/update endpoint"

key-files:
  created: []
  modified:
    - app/components/devices/stove/StoveCard.js

key-decisions:
  - "Use Button.Group with 3 mode buttons (Manuale/Automatica/Semi-man.) instead of text-only display"
  - "Active mode button uses ember variant, inactive use subtle variant"
  - "Semi-manual mode button disabled (read-only indicator, cannot be selected directly)"
  - "aria-pressed attribute indicates current active mode for screen readers"
  - "Torna in Automatico uses ember variant (primary action), Configura Pianificazione uses subtle (secondary)"

patterns-established:
  - "Mode selection pattern: Button.Group with aria-pressed on active button"
  - "Action button pattern: variant based on action priority (ember=primary, subtle=secondary)"

# Metrics
duration: 2min
completed: 2026-01-31
---

# Phase 19 Plan 01: StoveCard Button Migration Summary

**StoveCard mode selection and action buttons migrated to design system Button and Button.Group with interactive mode switching and proper accessibility**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-31T11:04:56Z
- **Completed:** 2026-01-31T11:07:05Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Replaced mode text display with interactive Button.Group for scheduler mode selection
- Added mode switching handlers (handleSetManualMode, handleSetAutomaticMode) using existing /api/scheduler/update endpoint
- Replaced raw action buttons with design system Button component
- All buttons now have proper accessibility (aria-pressed for modes, aria-label for actions)
- Consistent design system styling (ember glow focus ring, hover states, variants)

## Task Commits

Each task was committed atomically:

1. **Tasks 1-2: Mode selection Button.Group + action button migration** - `b476906` (feat)

**Plan metadata:** Pending

## Files Created/Modified
- `app/components/devices/stove/StoveCard.js` - Added Button.Group for mode selection (lines 1053-1081), replaced raw action buttons with Button component (lines 1118-1134), added mode switching handlers (lines 559-596)

## Decisions Made

1. **Button.Group for mode selection**: Migrated from text-only display to interactive Button.Group with 3 mode buttons (Manuale/Automatica/Semi-man.). Active mode uses ember variant, inactive use subtle. Semi-manual is disabled (read-only indicator).

2. **Mode switching handlers**: Added handleSetManualMode and handleSetAutomaticMode that use existing `/api/scheduler/update` endpoint with operations `setSchedulerMode` (enabled: true/false) and `clearSemiManualMode`. No new API endpoints created.

3. **Action button variants**: "Torna in Automatico" uses ember variant (primary action to exit semi-manual), "Configura Pianificazione" uses subtle variant (secondary navigation action).

4. **Accessibility attributes**: Used aria-pressed (true on active mode button) for mode selection, aria-label on action buttons for screen reader context.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- StoveCard compliant with design system Button and Button.Group patterns
- Mode selection is now interactive (users can switch modes directly from card)
- Accessibility attributes in place for screen readers
- Ready for Phase 19 Plan 02 (remaining StoveCard compliance: Text, Heading, Divider components)
- Pattern established for LightsCard and ThermostatCard compliance phases

---
*Phase: 19-stove-card-compliance*
*Completed: 2026-01-31*
