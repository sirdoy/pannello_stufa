# Phase 15: Smart Home Components Refactor - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Standardize domain-specific smart home components with unified APIs. Deliver: StatusCard, DeviceCard, Badge (with pulse), ControlButton, ConnectionStatus, and HealthIndicator components. These replace scattered device-specific implementations with reusable, consistent patterns.

</domain>

<decisions>
## Implementation Decisions

### Card composition
- Hybrid slot structure: Named slots for common areas (Header, Status, Controls) + children slot for custom content
- Shared base component: Both StatusCard and DeviceCard extend a SmartHomeCard base with common styling/behavior
- Icon handling: Pass icon as prop `icon={<ThermometerIcon />}` rather than slots or auto-inference
- Two size variants: compact/default — compact for dashboard grids, default for full view

### Status visualization
- Badge pulse behavior: Always pulse when active/online states — continuous animation
- HealthIndicator colors: Claude's discretion — pick appropriate colors matching Ember Noir theme
- ConnectionStatus display: Icon + text label (e.g., ● Online, ○ Offline)
- Four connection states: online/offline/connecting/unknown for full coverage

### Control patterns
- Long-press support: Yes, constant repeat rate (not accelerating)
- Haptic feedback: Always provide vibration on mobile for tactile feedback
- Button styling: Reuse existing Button.Icon component styling for consistency
- Step size: Configurable via `step` prop (e.g., step={0.5} for temperature, step={10} for brightness)

### API consistency
- Loading state: Simple `isLoading={true}` boolean prop on all components
- Error state: `error={true}` with `errorMessage` prop for specific messages
- Event callbacks: React convention naming (onChange, onClick, onToggle)
- Disabled state: Uniform behavior across all smart home components with `disabled={true}`

### Claude's Discretion
- Exact color palette for HealthIndicator states
- Animation timing for pulse and transitions
- Internal component structure for SmartHomeCard base
- Specific error styling approach

</decisions>

<specifics>
## Specific Ideas

- Button.Icon reuse ensures visual consistency with existing design system
- Hybrid slots pattern similar to Card.Header/Card.Title from Phase 13
- Compact variant useful for dashboard overview grids

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-smart-home-components*
*Context gathered: 2026-01-29*
