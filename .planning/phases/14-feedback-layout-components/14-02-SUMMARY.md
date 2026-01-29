---
phase: 14-feedback-layout-components
plan: 02
subsystem: design-system/feedback
tags: [tooltip, radix-ui, accessibility, keyboard-navigation]

dependency-graph:
  requires:
    - 11-01 (cn utility)
    - 12-01 (JSDOM polyfills for Radix)
  provides:
    - Tooltip component with Radix primitive
    - TooltipProvider for global tooltip configuration
    - TooltipContent with Ember Noir styling
    - Simple and compound component APIs
  affects:
    - 14-05 (may use Tooltip for contextual help)
    - Future components needing tooltip functionality

tech-stack:
  added: []
  patterns:
    - Radix Tooltip primitive wrapping
    - Namespace compound components (Tooltip.Root, Tooltip.Trigger, etc.)
    - Simple API wrapper for common use case

file-tracking:
  created:
    - app/components/ui/Tooltip.js
    - app/components/ui/__tests__/Tooltip.test.js
  modified:
    - app/components/ui/index.js

decisions:
  - id: DEC-14-02-01
    choice: "400ms delay duration, 300ms skip delay"
    rationale: "Good UX balance - not too fast to annoy, not too slow to frustrate. Skip delay allows quick hovering between multiple tooltips."
  - id: DEC-14-02-02
    choice: "4px sideOffset default"
    rationale: "Comfortable spacing between trigger and tooltip while maintaining visual connection."
  - id: DEC-14-02-03
    choice: "Arrow included by default"
    rationale: "Arrows provide clear visual connection between trigger and tooltip content."
  - id: DEC-14-02-04
    choice: "Skip mouse leave test in JSDOM"
    rationale: "JSDOM doesn't properly simulate pointer events for Radix Tooltip's internal state machine. Behavior tested by Radix UI itself."

metrics:
  duration: "~3.5 minutes"
  completed: "2026-01-29"
---

# Phase 14 Plan 02: Tooltip Component Summary

Radix Tooltip primitive with Ember Noir styling, keyboard support, and auto-positioning.

## What Was Built

### Tooltip Component (`app/components/ui/Tooltip.js`)

A fully accessible tooltip component with two API patterns:

**Simple API** (recommended for most uses):
```jsx
<Tooltip content="Hello world">
  <Button>Hover me</Button>
</Tooltip>
```

**Compound API** (for advanced customization):
```jsx
<Tooltip.Root>
  <Tooltip.Trigger asChild>
    <Button>Custom trigger</Button>
  </Tooltip.Trigger>
  <Tooltip.Content side="right" sideOffset={8}>
    Custom content with more control
  </Tooltip.Content>
</Tooltip.Root>
```

### Features

1. **Radix Tooltip Primitive**: Full accessibility out of the box
2. **Keyboard Support**: Shows on focus, hides on blur
3. **Auto-positioning**: Collision avoidance with viewport edges
4. **Arrow**: Points to trigger for visual connection
5. **Delay Management**: 400ms show delay, 300ms skip delay between tooltips
6. **Ember Noir Styling**: Dark slate background, light text, subtle border
7. **Light Mode Support**: Proper styling via `[html:not(.dark)_&]`
8. **Animation**: fade-in/fade-out with reduced motion support

### Exports

```javascript
export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent };
export default Tooltip;

// Namespace components
Tooltip.Provider  // Global configuration wrapper
Tooltip.Root      // Individual tooltip root
Tooltip.Trigger   // Trigger element wrapper
Tooltip.Content   // Tooltip content with styling
```

## Technical Details

### Provider Pattern

TooltipProvider wraps the app once to configure global behavior:

```jsx
// In layout.js or providers
<Tooltip.Provider delayDuration={400} skipDelayDuration={300}>
  {children}
</Tooltip.Provider>
```

### Styling Classes

Content uses Tailwind classes for Ember Noir design:
- `bg-slate-800` (dark mode), `bg-slate-900` (light mode)
- `text-slate-100` for content
- `border-slate-700/50` for subtle border
- `rounded-lg shadow-lg` for shape
- `animate-fade-in` / `data-[state=closed]:animate-fade-out` for animation

## Tests

16 tests covering:
- Rendering (trigger visible, content hidden until hover)
- Keyboard interaction (focus shows, blur hides)
- Accessibility (no axe violations, role=tooltip)
- Positioning (all four sides)
- Simple API and compound components
- Controlled mode support

One test skipped (mouse leave) due to JSDOM limitations with Radix pointer events.

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| DEC-14-02-01 | 400ms/300ms delays | UX balance for show/skip behavior |
| DEC-14-02-02 | 4px sideOffset | Comfortable visual spacing |
| DEC-14-02-03 | Arrow by default | Clear trigger-content connection |
| DEC-14-02-04 | Skip JSDOM mouse test | Radix handles internally |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `97a64ab` | feat | Create Tooltip component with Radix primitive |
| `9c6df33` | test | Add Tooltip tests and export from index |

## Next Phase Readiness

Ready for:
- 14-03: Toast component with Radix Toast primitive
- 14-04: Spinner component
- Future plans using Tooltip for contextual help

No blockers identified.
