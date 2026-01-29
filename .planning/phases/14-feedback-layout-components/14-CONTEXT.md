# Phase 14: Feedback & Layout Components - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver complete feedback components (Modal, Tooltip, Toast, Spinner, Progress, Empty State) and layout components (PageLayout, DashboardLayout, Section, Grid) for consistent UI patterns across the application. These are foundational components that other phases will use.

</domain>

<decisions>
## Implementation Decisions

### Modal/Dialog behavior
- Five sizes available: sm, md, lg, xl, full
- Mobile behavior: bottom sheet (slide up from bottom, swipe to dismiss)
- No nested modals — one modal at a time, simpler UX
- Animation: fade + scale (95% to 100% with fade-in), modern feel
- Standard features: focus trap, ESC close, backdrop click close, ARIA patterns

### Toast notifications
- Position: bottom-right corner
- Stacking: vertical stack, newest on top, max 3 visible (older queued)
- Four variants: success, error, warning, info with distinct colors
- Actions: optional action button supported (Undo, View, Retry patterns)
- Auto-dismiss with manual dismiss option

### Loading & Progress patterns
- Primary pattern: skeleton screens (content-shaped placeholders that pulse)
- Spinner also available for buttons and inline loading states
- Progress bar: determinate (percentage) + indeterminate (animated stripe)
- Use skeleton for content areas, spinner for buttons/inline

### Empty State components
- Structure: illustration + message + action button (CTA)
- All three elements present for complete guidance
- Flexible props for customization per context

### Layout components
- DashboardLayout: collapsible sidebar (full → icons on toggle)
- PageLayout: header slot with title + optional action buttons
- Grid: Tailwind default breakpoints (sm, md, lg, xl, 2xl)
- Section: predefined spacing sizes (sm, md, lg) using consistent tokens

### Claude's Discretion
- Tooltip trigger behavior (hover vs click)
- Exact animation durations (respecting prefers-reduced-motion)
- Skeleton pulse animation timing
- Toast auto-dismiss duration
- Sidebar collapse breakpoint

</decisions>

<specifics>
## Specific Ideas

- Bottom sheet on mobile should feel native (swipe gesture to dismiss)
- Toast stacking similar to Sonner/react-hot-toast pattern
- Skeleton screens should match the shape of actual content
- Empty states should guide users toward productive action

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-feedback-layout-components*
*Context gathered: 2026-01-29*
