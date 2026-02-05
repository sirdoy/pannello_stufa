---
phase: 35-micro-interactions
plan: 01
subsystem: design-system
tags: [css, animation, accessibility, reduced-motion, stagger]

dependency_graph:
  requires: []
  provides:
    - animation-timing-tokens
    - stagger-animation-system
    - reduced-motion-support
  affects:
    - 35-02 (will use timing tokens for component animations)
    - 35-03 (will use stagger system for list animations)
    - 35-04 (will verify reduced motion compliance)

tech_stack:
  added: []
  patterns:
    - CSS custom properties for animation tokens
    - CSS calc() with custom property for stagger delays
    - prefers-reduced-motion media query with :not() selector exclusions

key_files:
  created: []
  modified:
    - app/globals.css

decisions:
  - id: animation-token-location
    choice: CSS custom properties in @theme block
    rationale: Native CSS variables work everywhere, Tailwind 4 @theme provides global scope
  - id: stagger-implementation
    choice: CSS calc() with --stagger-index custom property
    rationale: Pure CSS solution, no JS needed, works with any list rendering
  - id: reduced-motion-approach
    choice: Selective disabling with :not() exclusions for functional animations
    rationale: Preserves loading indicators while disabling decorative animations

metrics:
  duration: 2 min
  completed: 2026-02-05
---

# Phase 35 Plan 01: Animation Token Foundation Summary

**One-liner:** CSS animation token system with duration/ease/stagger tokens, stagger classes, and accessibility-first reduced motion support.

## What Was Built

### Animation Timing Tokens
Added to `@theme` block in globals.css:
- **Duration tokens:** `--duration-instant` (0ms), `--duration-fast` (150ms), `--duration-smooth` (300ms), `--duration-slow` (500ms)
- **Ease curve tokens:** `--ease-enter` (ease-out-expo), `--ease-exit` (ease-in-quad), `--ease-move` (ease-in-out), `--ease-spring-subtle` (5% overshoot)
- **Stagger tokens:** `--stagger-fast` (30ms), `--stagger-base` (50ms), `--stagger-slow` (80ms)

### Stagger Animation System
Pure CSS stagger system using `--stagger-index` custom property:
```css
.stagger-item {
  animation: stagger-fade-in var(--duration-smooth) var(--ease-enter) both;
  animation-delay: calc(var(--stagger-index, 0) * var(--stagger-base));
}
```

Usage in React:
```jsx
{items.map((item, index) => (
  <li style={{ '--stagger-index': index }} className="stagger-item">
    {item.content}
  </li>
))}
```

Variants available: `.stagger-item-fast` (30ms delay), `.stagger-item-slow` (80ms delay)

### Reduced Motion Support
Refined accessibility rules per user decision:
- **Decorative animations:** Disabled completely (instant state changes)
- **Functional animations:** Preserved (spinners, shimmer, progress indicators)
- **Transitions:** 0.01ms duration (effectively instant)
- **Stagger items:** Show all instantly (no cascade)

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Token location | CSS @theme block | Native CSS variables, global scope, Tailwind 4 compatible |
| Stagger mechanism | calc() with --stagger-index | Pure CSS, no JS library needed |
| Reduced motion | Selective :not() exclusions | Functional animations (loading) preserved |
| Duration naming | Semantic (instant/fast/smooth/slow) | Intent-based, easier to choose correct value |
| Ease naming | Use-case based (enter/exit/move) | Clear guidance on when to use each curve |

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

### Token Design Rationale
- `--duration-smooth` (300ms) chosen as default - fast enough to feel responsive, slow enough to perceive
- `--ease-enter` uses ease-out-expo for snappy response to user actions
- `--ease-spring-subtle` has only 5% overshoot per CONTEXT.md guidance (barely perceptible)

### Reduced Motion Implementation
The `:not()` selector chain excludes functional animation classes:
```css
*:not(.animate-spin):not(.animate-shimmer):not(.animate-progress-indeterminate)
```
This ensures loading states remain visible and meaningful during async operations.

## Next Phase Readiness

### Ready For
- Plan 35-02: Can apply timing tokens to component hover/focus states
- Plan 35-03: Can apply stagger classes to list components
- Plan 35-04: Reduced motion rules in place for verification

### No Blockers
All tokens and systems are in place and ready for component-level integration.

---

*Completed: 2026-02-05 | Commit: e3e5f1a*
