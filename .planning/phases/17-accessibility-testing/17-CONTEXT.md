# Phase 17: Accessibility & Testing - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Ensure WCAG AA compliance and comprehensive accessibility testing across all design system components. This includes automated testing, keyboard navigation, focus indicators, color contrast, touch targets, and motion preferences. Does NOT add new components or change functionality — purely ensuring existing components are fully accessible.

</domain>

<decisions>
## Implementation Decisions

### Testing strategy
- Use jest-axe only (no Playwright a11y) — current setup sufficient
- Every component must have an explicit accessibility test, including simple ones
- If a component fails a11y tests, fix immediately — no deferring
- Include full keyboard navigation tests (Tab, Enter, Space, Arrows) not just axe violations

### Remediation priority
- Fix by severity: all critical violations first, then serious, then moderate
- Color contrast fixes proceed automatically — trust design token system
- For Radix primitive issues, update wrapper component to pass correct ARIA props

### Focus indicators
- Ember glow ring style: `focus-visible:ring-ember-500/50` — consistent with design system
- Show only on keyboard navigation (`focus-visible`), not mouse clicks
- Global focus style for all interactive elements — maximum consistency
- Consistent ring offset (2px) between element and ring

### Touch targets
- Claude's Discretion: Enforce 44px minimum via CSS or component props based on component type

### Motion & preferences
- Claude's Discretion: Determine which animations are essential (loading, progress) vs decorative (pulse, glow)
- Implementation: CSS media query for styling + useReducedMotion hook where logic needs to change
- Test key components (Spinner, Progress, Badge pulse) for reduced-motion behavior
- When reduced-motion enabled, disable/minimize ALL motion including brief transitions

</decisions>

<specifics>
## Specific Ideas

- Ember glow already established in form controls: `focus-visible:ring-ember-500/50`
- Existing patterns from STATE.md: `focus-visible:ring-ember-500/50 for all form controls (ember glow)`
- Ring offset 2px for clear visual separation
- Severity-based prioritization ensures critical a11y issues never ship

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 17-accessibility-testing*
*Context gathered: 2026-01-30*
