# Phase 30: Foundation Components - Context

**Gathered:** 2026-02-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Build Popover and Tabs UI components using already-installed Radix primitives. Establish component patterns with CVA variants, keyboard navigation, and accessibility. Apply Tabs to thermostat page (Schedule/Manual/History). No new dependencies required.

</domain>

<decisions>
## Implementation Decisions

### Popover behavior
- Support both click and hover trigger modes (developer chooses per-instance)
- Default position: bottom-center relative to trigger
- Auto-flip when near viewport edges
- Arrow indicator optional (off by default, can be enabled)
- Content-driven width with max-width constraint (e.g., 320px)

### Tabs visual style
- Underline indicator style (bottom border on active tab)
- Support icon + text labels together (icon left of label)
- Horizontal scroll with fade edges when tabs overflow
- Overflow behavior on mobile: swipe to reveal more tabs

### Interaction patterns
- Tab indicator: sliding animation when switching tabs (250-300ms)
- Popover: scale + fade in animation on open (95% to 100%)
- Tab content: simple fade transition between panels
- Animation duration: medium timing (250-300ms)
- All animations must respect prefers-reduced-motion

### Thermostat page tabs
- Three tabs: Schedule, Manual, History
- Icons required: calendar (Schedule), sliders (Manual), clock (History)
- Position: bottom of screen on mobile, below header on desktop
- Responsive breakpoint for position change (mobile → desktop)
- Default selection: Schedule tab

### Claude's Discretion
- Active tab indicator color (choose from Ember Noir design tokens)
- Exact max-width value for Popover
- Specific icon choices for thermostat tabs (from existing icon set)
- Exact animation easing curves
- Focus ring styling

</decisions>

<specifics>
## Specific Ideas

- Tab indicator should slide smoothly from old position to new, not jump
- Popover animation should feel "modern and subtle" - scale from 95% creates depth
- Thermostat tabs at bottom feels like native mobile apps - thumb-friendly
- On desktop, standard top position is more expected UX

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 30-foundation-components*
*Context gathered: 2026-02-03*
