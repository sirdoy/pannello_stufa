# Phase 19: StoveCard Compliance - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all raw HTML elements in StoveCard with design system components. Scheduler mode buttons, action buttons, and status displays must use Button, StatusCard, Badge, and other design system components with CVA variants. No new functionality — this is a compliance refactor.

</domain>

<decisions>
## Implementation Decisions

### Button variants
- Scheduler mode buttons (Manuale/Automatico/Semi) use `subtle` variant when inactive
- "Torna in Automatico" action button uses `ember` variant (primary action)
- Stove control buttons: `ember` for ignite, `danger` for turn off
- Text only on mode buttons — no icons

### Status display approach
- Stove state display uses `StatusCard` component (not Badge)
- Include `HealthIndicator` component showing ok/warning/error based on stove state
- Map stove states to health levels (e.g., RUNNING → ok, ALARM → error)

### Mode button layout
- Use `Button.Group` component for scheduler mode buttons (Manuale/Automatico/Semi)
- Buttons are visually connected with shared border

### Active state styling
- Active mode button uses `ember` variant (visual highlight)
- Inactive mode buttons use `subtle` variant
- Include `aria-pressed="true"` on active button for accessibility

### Claude's Discretion
- Button size (sm vs md) based on available space
- Temperature/power display typography (Heading/Text or preserve current)
- Error state handling (Banner for severe, StatusCard styling for moderate)
- Button.Group width (full vs natural)
- Button.Group position within card
- Disabled mode handling (disabled prop vs hide)
- Loading state feedback during mode switch (spinner vs disabled group)

</decisions>

<specifics>
## Specific Ideas

- Ember Noir design system — ember/copper accents for active states, dark-first
- StoveCard is a primary control surface — compliance should enhance, not change behavior
- HealthIndicator maps naturally to stove operational states

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 19-stove-card-compliance*
*Context gathered: 2026-01-31*
