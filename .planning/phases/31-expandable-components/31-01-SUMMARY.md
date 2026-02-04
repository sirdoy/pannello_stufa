---
phase: 31-expandable-components
plan: 01
subsystem: ui-components
tags: [accordion, radix-ui, cva, animation, accessibility]

dependency-graph:
  requires: [30-foundation-components]
  provides: [accordion-component, expandable-ui-pattern]
  affects: [32-tabs-enhancement]

tech-stack:
  added: ["@radix-ui/react-accordion@1.2.12"]
  patterns: ["namespace-component", "cva-variants", "radix-primitives"]

key-files:
  created:
    - app/components/ui/Accordion.js
    - app/components/ui/__tests__/Accordion.test.js
  modified:
    - app/globals.css
    - app/components/ui/index.js
    - package.json
    - package-lock.json

decisions:
  - id: accordion-animation
    description: Use Radix CSS variables for height animation
    rationale: "--radix-accordion-content-height provides accurate content height measurement without JS calculations"
  - id: animation-forwards
    description: Use forwards on accordion-down, omit on accordion-up
    rationale: "Prevents React 18 flicker issue on close animation"
  - id: chevron-animation
    description: Rotate chevron via group-data state selector
    rationale: "Keeps animation logic in CSS, works with Radix state management"

metrics:
  duration: 5.7min
  completed: 2026-02-04
  tests: 45
  lines-added: 907
---

# Phase 31 Plan 01: Accordion Component Summary

**One-liner:** Radix-based Accordion with CVA variants, smooth height animation, and full accessibility for collapsible FAQ/help sections.

## What Was Built

### Accordion Component (`app/components/ui/Accordion.js`)
- **207 lines** of documented, accessible code
- Built on `@radix-ui/react-accordion` primitives
- Namespace pattern: `Accordion.Item`, `Accordion.Trigger`, `Accordion.Content`
- Full TypeScript-ready prop types via JSDoc

### Key Features Implemented

| Feature | Implementation |
|---------|----------------|
| Single mode | `type="single"` - one item open at a time |
| Multiple mode | `type="multiple"` - multiple items open |
| Collapsible | `collapsible={true}` allows closing all in single mode |
| Touch targets | 48px minimum height on triggers |
| Keyboard nav | Enter/Space toggle, Arrow keys, Home/End |
| Animation | Smooth height transition via Radix CSS variables |
| Chevron | Rotating indicator (180deg on open) |

### CSS Keyframes (`app/globals.css`)
```css
@keyframes accordion-down {
  from { height: 0; opacity: 0; }
  to { height: var(--radix-accordion-content-height); opacity: 1; }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); opacity: 1; }
  to { height: 0; opacity: 0; }
}
```

### CVA Variants
- `itemVariants`: Border styling with last-child exception
- `triggerVariants`: Touch target, focus ring, hover state, Ember Noir colors
- `contentVariants`: Overflow hidden, animation state selectors

## Test Coverage

**45 tests across 10 categories:**

| Category | Tests | Coverage |
|----------|-------|----------|
| Rendering | 5 | Default state, multiple items, defaultValue |
| Single Mode | 4 | Click open, close others, collapsible toggle |
| Multiple Mode | 3 | Multiple open, independent state |
| Keyboard | 8 | Enter/Space, arrows, Home/End, wrapping |
| Accessibility | 5 | aria-expanded, aria-controls, role=region, axe |
| Animation | 2 | Open/close animation classes |
| Styling | 7 | Touch target, chevron rotation, custom classes |
| Controlled | 3 | value/onValueChange, rerender updates |
| Exports | 5 | Named exports, namespace attachment |
| Refs | 3 | Ref forwarding on all components |

## Usage Examples

```jsx
// Single mode with collapsible
<Accordion type="single" defaultValue="faq-1" collapsible>
  <Accordion.Item value="faq-1">
    <Accordion.Trigger>How do I reset the stove?</Accordion.Trigger>
    <Accordion.Content>
      Hold the reset button for 5 seconds...
    </Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="faq-2">
    <Accordion.Trigger>When should I clean?</Accordion.Trigger>
    <Accordion.Content>
      Clean after every 24 hours of operation...
    </Accordion.Content>
  </Accordion.Item>
</Accordion>

// Multiple mode for device details
<Accordion type="multiple" defaultValue={['specs', 'status']}>
  <Accordion.Item value="specs">
    <Accordion.Trigger>Technical Specs</Accordion.Trigger>
    <Accordion.Content>Power: 9.5kW...</Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="status">
    <Accordion.Trigger>Current Status</Accordion.Trigger>
    <Accordion.Content>Running at 85%...</Accordion.Content>
  </Accordion.Item>
</Accordion>
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `172b226` | chore | Install @radix-ui/react-accordion, add CSS keyframes |
| `b45f59a` | feat | Create Accordion component with CVA variants |
| `41c03ed` | test | Add 45 tests and barrel export |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for Phase 31 Plan 02 (Sheet component)**:
- Accordion provides pattern for additional expandable components
- CSS keyframe animation pattern established
- Radix primitive integration validated
- No blockers identified
