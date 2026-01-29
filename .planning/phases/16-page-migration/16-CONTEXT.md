# Phase 16: Page Migration & Application - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply design system components to all 10 application pages for visual consistency. This is a migration phase — converting existing pages to use new components from Phases 11-15. No new features, no new components, just systematic application of the design system.

</domain>

<decisions>
## Implementation Decisions

### Migration Strategy
- Page-by-page migration (complete one page fully before moving to next)
- Breaking changes OK — no backwards compatibility period, each page fully converted in one pass
- Migrate shared components first (header, navigation, device status) before any page migration
- One commit per component group within each page (e.g., "Dashboard layout", "Dashboard cards", "Dashboard forms")

### Visual Consistency
- Functional variations OK — components can be extended for page-specific needs, but core styling stays consistent
- Enforce Grid/Section for all layouts — all pages must use Grid and Section components for consistent spacing
- Remove all custom styling — replace inline styles and one-off Tailwind classes with design system tokens and CVA variants
- Information density: Claude's discretion — evaluate whether current density makes sense for each page's purpose

### Priority Ordering
- Most used pages first: Dashboard → Stove → Thermostat → Lights
- Batch similar pages together: Device pages (Stove, Thermostat, Lights, Camera) migrated as a group
- Admin pages deferred to end — migrate last, after all user-facing pages
- debug/design-system page: Migrate fully to use PageLayout and all Phase 14+ patterns

### Testing Approach
- Component interaction tests for each migrated page — test key interactions (buttons, forms, navigation)
- No visual regression tests — rely on component tests and manual QA
- Accessibility (axe) tests required for all migrated pages — every page must pass jest-axe
- Completion criteria: Tests pass + manual review on desktop/mobile

### Claude's Discretion
- Information density per page — evaluate whether current density makes sense for each page's purpose
- Exact commit boundaries within component groups
- Order within batched page groups

</decisions>

<specifics>
## Specific Ideas

- Shared components migrated first ensures all pages inherit consistent header/nav immediately
- Component group commits allow fine-grained rollback if a specific area has issues
- Device pages batched together so patterns discovered on Stove can be reused on Thermostat/Lights/Camera

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-page-migration*
*Context gathered: 2026-01-29*
