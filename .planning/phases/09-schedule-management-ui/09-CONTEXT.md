# Phase 9: Schedule Management UI - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

User interface for viewing Netatmo thermostat weekly schedules, switching between pre-configured schedules, and creating temporary temperature overrides (manual boosts). This phase focuses on the UI layer only - backend APIs exist from Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Schedule Visualization
- **Layout type**: Timeline view (continuous timeline showing temperature changes throughout the week)
- **Slot detail**: Show temperature + time range (e.g., "08:00-12:00: 20°C")
- **Temperature encoding**: Color gradient from cold to hot (blue for low temps, red for high temps)
- **Visual at a glance**: Users can quickly scan week and understand heating patterns

### Schedule Switching
- **Available schedules**: Display name only in selector (e.g., "Work Week", "Vacation")
- **Keep it simple**: No previews or mini-timelines, just schedule names

### Temporary Override UI
- **Initiation**: "Manual Boost" button positioned near timeline (direct and discoverable)
- **Duration control**: Slider from 5 minutes to 12 hours (continuous, precise control)
- **Temperature control**: Allow custom temperature selection (not just preference boost amount)
- **User has full control**: Can set exact target temperature and duration for override

### Visual Distinction
- **Active override indicator**: Overlay badge on timeline (e.g., "22°C until 14:30")
- **Badge content**: Shows target temperature + end time (when override expires)
- **Cancellation**: Tap badge to cancel override early (opens confirmation)
- **Conflict resolution**: User manual override takes precedence over stove-triggered coordination (Phase 8 automation pauses during manual override)

### Claude's Discretion
- Timeline scroll direction (horizontal vs vertical) - choose based on mobile usability
- Selector location (dropdown, FAB, dedicated page) - choose based on usage frequency
- Switch confirmation flow (immediate vs dialog) - choose based on undo capability
- Active schedule indication (checkmark, header, both) - choose based on clarity
- Override confirmation flow (single modal, wizard, bottom sheet) - choose based on mobile UX patterns

</decisions>

<specifics>
## Specific Ideas

- Timeline should integrate with Ember Noir design system (dark-first, ember/copper accents)
- Color gradient must respect accessibility (sufficient contrast for color-blind users)
- Manual override UI should feel immediate and responsive (no friction)
- Badge tap-to-cancel provides quick escape hatch without cluttering UI
- User intent is paramount: manual overrides always win over automation

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 09-schedule-management-ui*
*Context gathered: 2026-01-27*
