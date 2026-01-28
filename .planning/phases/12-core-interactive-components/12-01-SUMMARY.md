---
phase: 12
plan: 01
subsystem: design-system
tags:
  - radix-ui
  - checkbox
  - switch
  - cva
  - accessibility
  - a11y
dependency-graph:
  requires:
    - phase-11 (Foundation & Tooling - cn utility, Radix packages, jest-axe)
  provides:
    - Checkbox component with Radix UI
    - Switch component with Radix UI
    - CVA variant patterns for form controls
    - Toggle backwards compatibility layer
  affects:
    - 12-02 (RadioGroup - same CVA patterns)
    - 12-03 (Input - same focus ring patterns)
    - 12-04 (Select - same Radix patterns)
tech-stack:
  added:
    - "@radix-ui/react-checkbox (already installed 1.3.3)"
    - "@radix-ui/react-switch (already installed 1.2.6)"
  patterns:
    - CVA variants for size and color
    - Radix Primitive wrapping pattern
    - forwardRef pattern for ref forwarding
    - Backwards compatibility with legacy onChange handler
key-files:
  created:
    - app/components/ui/Switch.js
    - app/components/ui/__tests__/Checkbox.test.js
    - app/components/ui/__tests__/Switch.test.js
  modified:
    - app/components/ui/Checkbox.js
    - app/components/ui/Toggle.js
decisions:
  - id: checkbox-radix
    choice: "Replace custom implementation with Radix CheckboxPrimitive"
    rationale: "Full WAI-ARIA compliance, keyboard navigation out of the box"
  - id: switch-250ms
    choice: "Use duration-250 for switch animation"
    rationale: "Per CONTEXT decision for smooth 250ms transitions"
  - id: toggle-deprecation
    choice: "Convert Toggle.js to re-export Switch"
    rationale: "Backwards compatibility while encouraging new Switch import"
  - id: ember-focus-glow
    choice: "focus-visible:ring-ember-500/50 for all form controls"
    rationale: "Consistent ember glow focus indicator per CONTEXT decision"
metrics:
  duration: "5 minutes"
  completed: "2026-01-28"
---

# Phase 12 Plan 01: Checkbox + Switch Summary

Radix-based Checkbox and Switch components with CVA variants, full a11y compliance, and backwards compatibility.

## What Was Built

### Checkbox Component
- **File:** `app/components/ui/Checkbox.js`
- **Radix primitive:** `@radix-ui/react-checkbox`
- **States:** unchecked, checked, indeterminate (via `checked="indeterminate"`)
- **Size variants:** sm (16px), md (20px), lg (24px)
- **Color variants:** primary, ember, ocean, sage, flame
- **A11y:** Full keyboard navigation (Space toggle), proper ARIA attributes
- **Focus:** Ember glow ring (`focus-visible:ring-ember-500/50`)
- **Backwards compat:** Legacy `onChange` handler supported

### Switch Component
- **File:** `app/components/ui/Switch.js`
- **Radix primitive:** `@radix-ui/react-switch`
- **Animation:** 250ms smooth transition on toggle
- **Size variants:** sm (h-6 w-11), md (h-8 w-14), lg (h-10 w-[4.5rem])
- **Color variants:** ember (gradient), ocean (gradient), sage (gradient)
- **A11y:** Full keyboard navigation (Space toggle), role="switch"
- **Focus:** Ember glow ring consistent with Checkbox

### Toggle Deprecation
- **File:** `app/components/ui/Toggle.js`
- **Change:** Re-exports Switch for backwards compatibility
- **Deprecation notice:** Comment indicating to use Switch instead

## Technical Details

### CVA Pattern Established
```javascript
const checkboxVariants = cva(
  // Base classes array
  ['rounded-md border-2 transition-all duration-200', ...],
  {
    variants: {
      size: { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' },
      variant: { ember: [...], ocean: [...], sage: [...] }
    },
    defaultVariants: { size: 'md', variant: 'ocean' }
  }
);
```

### Radix Data Attributes
- `data-[state=checked]` - Checked state styling
- `data-[state=unchecked]` - Unchecked state styling
- `data-[state=indeterminate]` - Mixed/partial selection

### Light Mode Override Pattern
```css
[html:not(.dark)_&]:focus-visible:ring-offset-slate-50
[html:not(.dark)_&]:data-[state=checked]:bg-ember-600
```

## Test Coverage

### Checkbox Tests (19 tests)
- Accessibility: 5 jest-axe tests (unchecked, checked, indeterminate, disabled, with label)
- Keyboard: 3 tests (Space toggle, Tab focus, disabled prevention)
- States: 4 tests (unchecked, checked, indeterminate, disabled)
- Variants: 2 tests (sizes, colors)
- Backwards compat: 2 tests (legacy onChange, both handlers)
- Label: 2 tests (renders, htmlFor association)
- Focus ring: 1 test (ember glow classes)

### Switch Tests (14 tests)
- Accessibility: 4 jest-axe tests + role verification
- Keyboard: 3 tests (Space toggle, Tab focus, disabled prevention)
- States: 3 tests (unchecked, checked, disabled)
- Variants: 4 tests (size sm/md/lg, color variants)
- Animation: 2 tests (duration-250 on track and thumb)
- Backwards compat: 2 tests (legacy onChange, both handlers)
- Focus ring: 1 test (ember glow classes)
- Label: 1 test (aria-label from label prop)

## Commits

| Hash | Message |
|------|---------|
| d80c95d | feat(12-01): Checkbox with Radix primitive and CVA variants |
| b6ab5cb | feat(12-01): Switch with Radix primitive and CVA variants |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for 12-02:** RadioGroup will follow identical patterns:
- CVA variants for size and color
- Radix primitive wrapping
- Same focus ring treatment
- Same test patterns with jest-axe
