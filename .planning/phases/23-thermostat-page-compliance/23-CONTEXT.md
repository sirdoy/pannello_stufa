# Phase 23: Thermostat Page Compliance - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete design system compliance for the thermostat page. Replace remaining raw HTML elements with design system components. The page already uses Button, Card, Heading, Text, Grid extensively from v3.0 migration — this phase addresses the remaining gaps: info stat boxes and PageLayout wrapper.

</domain>

<decisions>
## Implementation Decisions

### Info Box Component
- Create standalone `InfoBox` component (not Card namespace)
- Props: `label`, `value`, `variant` (for color tints)
- Variants should match design system palette (ember, sage, ocean, etc.)
- Replaces the 3 stat boxes (Casa, Stanze, Moduli) currently using raw divs
- Component exports from `@/components/ui` barrel

### PageLayout Wrapper
- Wrap thermostat page in full `PageLayout` component
- Use title prop: "Controllo Netatmo"
- Include subtitle: "Gestisci temperature e riscaldamento di tutte le stanze"
- Remove current manual `<div className="max-w-7xl mx-auto...">` wrapper

### Button Color Schemes
- Add `colorScheme` prop to Button component for full variant tinting
- colorScheme tints the button in its current variant style (subtle-sage, ghost-ocean, etc.)
- Remove current custom `activeClassName` overrides in favor of CVA-based colorScheme

### Claude's Discretion
- Exact colorScheme palette choices (pick based on design system consistency and practical needs)
- InfoBox internal styling (padding, backdrop blur, border radius)
- Whether to add accessibility tests for new InfoBox component

</decisions>

<specifics>
## Specific Ideas

- Mode buttons currently use: sage (schedule), warning (away), ocean (frost/hg), slate (off)
- The stat boxes pattern may be useful elsewhere — design for reuse
- Keep the liquid glass aesthetic for InfoBox (backdrop-blur)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 23-thermostat-page-compliance*
*Context gathered: 2026-02-02*
