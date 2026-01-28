# Phase 12: Core Interactive Components - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver missing table-stakes form controls with Radix UI accessibility: Checkbox, Switch, Radio Group, Input, Select, and Slider. These components enable user configuration and input throughout the app. Creating new page layouts or integrating with existing pages is a separate phase.

</domain>

<decisions>
## Implementation Decisions

### Visual Style & States
- Focus indicator: Ember glow ring (subtle orange/copper glow around focused element)
- Disabled appearance: Reduced opacity (50%) — same colors but faded
- Animation timing: Smooth 250ms transitions for hover, focus, and toggle states
- Error states: Red border + error icon (icon appears inside/beside field)

### Input Field Behavior
- Validation timing: Real-time validation as user types
- Error message placement: Claude's discretion based on context
- Clear button: Optional prop (`clearable={true}`) — opt-in per instance
- Character count: Optional prop (`showCount={true}`) when needed, separate from maxLength

### Selection Patterns
- Select search: Optional prop (`searchable={true}`) — opt-in per instance
- Multi-select: Separate MultiSelect component (not a prop on Select)
- Checkbox indeterminate: Support in component API, but no current use case in app
- Radio Group layout: Vertical stack by default (standard form layout)

### Slider Interaction
- Step granularity: Configurable via `step` prop, default is 1
- Range support: Optional prop (`range={true}`) enables dual-handle min/max selection
- Value display: Tooltip appears on thumb while dragging
- Primary use cases: Temperature adjustment (thermostat) and brightness control (lights) — equally important

### Claude's Discretion
- Error message placement (below field vs inline tooltip)
- Exact ember glow color values and spread
- Touch target sizing within 44px minimum
- Keyboard navigation implementation details

</decisions>

<specifics>
## Specific Ideas

- Ember glow should match the existing Ember Noir design system focus treatment
- Both temperature (18-25°C range) and brightness (0-100%) are primary slider use cases
- MultiSelect warrants its own component rather than overloading Select

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-core-interactive-components*
*Context gathered: 2026-01-28*
