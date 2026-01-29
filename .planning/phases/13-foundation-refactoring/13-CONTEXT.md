# Phase 13: Foundation Refactoring - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Refactor existing foundation components (Button, Card, Label, Divider, Heading, Text) to use CVA patterns established in Phase 11-12. This includes migrating to type-safe variant APIs, cleaning up legacy props, and applying consistent patterns across the component library.

Components in scope: Button, IconButton, ButtonGroup, Card (+ CardHeader, CardTitle, CardContent, CardFooter, CardDivider), Heading, Text, Divider, Label.

</domain>

<decisions>
## Implementation Decisions

### API Compatibility
- **Clean break from legacy props** — Remove all deprecated props (`liquid`, `glass`, `primary`, `secondary`, `elevation`). Update all usages in codebase rather than maintaining backwards compatibility
- **Align naming with Phase 12** — Match prop naming patterns from Checkbox/Switch/Slider components for consistency across design system
- **Namespace pattern for compound components** — Convert `CardHeader`, `CardTitle`, `CardFooter` to `Card.Header`, `Card.Title`, `Card.Footer` (Radix-style composition)
- Same for Button: `IconButton` → `Button.Icon`, `ButtonGroup` → `Button.Group`

### Variant Consolidation
- **Ember glow everywhere** — All interactive foundation components get ember glow focus states (`focus-visible:ring-ember-500/50`) for consistent brand identity
- Applies to: Button, Card (when hover=true), any clickable element

### CVA Structure
- **Compound variants for iconOnly** — Use CVA compoundVariants when size + iconOnly interact (e.g., size=md AND iconOnly=true → different padding)
- **CVA in same file** — Keep CVA definitions at top of component file, matching Phase 12 pattern
- **cn() pattern** — Use `cn(baseClasses, variantClasses, className)` where className wins conflicts

### Test Coverage
- **Unit + a11y testing** — Jest unit tests + jest-axe accessibility tests (Phase 12 pattern)
- **Replace existing tests** — Delete old tests (Button.test.js, Card.test.js), write new ones following Phase 12 test patterns
- **Test all variant combinations** — Comprehensive coverage: every variant × size combination tested
- Accessibility tests for all interactive elements

### Claude's Discretion
- **Theme handling** — Claude decides whether to use internal `[html:not(.dark)_&]` selectors or reference semantic CSS variables from Phase 11
- **Button variant consolidation** — Claude analyzes actual usage and recommends which of the 7 variants to keep
- **Card variant consolidation** — Claude analyzes usage patterns for the 5 card variants
- **Typography variant unification** — Claude determines if Heading/Text color variants should align with Button/Card or stay domain-specific
- **Card hover/glow CVA structure** — Claude evaluates whether these work better as CVA boolean variants or conditional props
- **Heading size auto-calculation** — Claude decides if level→size mapping stays or becomes explicit
- **Test file location** — Claude follows existing project conventions

</decisions>

<specifics>
## Specific Ideas

- Namespace pattern should feel like Radix: `<Card.Header>`, `<Card.Title>`, `<Button.Group>`
- Current Button has loading spinner overlay — preserve this behavior in CVA refactor
- Current Card has `data-liquid-glass` attribute for JS hooks — evaluate if still needed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-foundation-refactoring*
*Context gathered: 2026-01-29*
