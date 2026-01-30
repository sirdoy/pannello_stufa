# Phase 18: Documentation & Polish - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete component documentation and migration guide for the design system. Expand `/debug/design-system` page with interactive examples and create comprehensive `docs/design-system.md` with API reference, usage patterns, and accessibility documentation.

**Note:** Migration guide NOT needed — all code already uses new components.

</domain>

<decisions>
## Implementation Decisions

### Documentation Structure
- Components grouped by category (Form Controls, Feedback, Layout, Smart Home) — mirrors phase structure
- Two locations: `docs/design-system.md` for written reference, `/debug/design-system` for interactive demos
- Claude's Discretion: Props-first vs examples-first ordering
- Claude's Discretion: Grid vs sequential for variant comparisons

### Interactive Examples
- Code snippets have copy button (one-click copy to clipboard)
- Side-by-side layout: code on left, rendered component on right
- Full JSX syntax highlighting (imports, components, props, strings colored)
- Claude's Discretion: Whether to add interactive playground controls

### Accessibility Documentation
- Both per-component a11y sections AND centralized accessibility reference page
- Document screen reader behavior: ARIA roles and what gets announced
- Claude's Discretion: Keyboard shortcut format (table vs inline)
- Claude's Discretion: WCAG compliance badges (if verifiable)

### Claude's Discretion
- Document structure ordering (props-first or examples-first)
- Variant display format (grid comparison or sequential)
- Interactive playground controls (yes/no based on complexity)
- Keyboard shortcut documentation format
- WCAG badge inclusion

</decisions>

<specifics>
## Specific Ideas

- "Non mi interessa la migration guide. Voglio che tutto sia con i componenti nuovi" — skip migration guide entirely, all code already migrated
- Categories should match phase structure: Form Controls, Feedback, Layout, Smart Home

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 18-documentation-polish*
*Context gathered: 2026-01-30*
