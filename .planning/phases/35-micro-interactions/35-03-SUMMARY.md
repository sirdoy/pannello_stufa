---
phase: 35-micro-interactions
plan: 03
subsystem: design-system
tags: [css, animation, badge, tabs, accordion, spring-physics]

dependency_graph:
  requires:
    - 35-01 (animation token foundation)
  provides:
    - badge-animation-tokens
    - tabs-spring-indicator
    - accordion-animation-tokens
  affects:
    - 35-04 (will verify reduced motion compliance)

tech_stack:
  added: []
  patterns:
    - CSS custom properties for animation tokens
    - Spring easing for polished indicator movement

key_files:
  created: []
  modified:
    - app/components/ui/Badge.js
    - app/components/ui/Tabs.js
    - app/components/ui/Accordion.js
    - app/components/ui/__tests__/Badge.test.js

decisions:
  - id: tabs-spring-easing
    choice: --ease-spring-subtle for sliding indicator
    rationale: Subtle 5% overshoot creates polished feel without being distracting
  - id: trigger-timing
    choice: --duration-fast (150ms) for hover states
    rationale: Small UI elements need snappy feedback on hover/focus

metrics:
  duration: 2 min
  completed: 2026-02-05
---

# Phase 35 Plan 03: Secondary Interactive Components Summary

**One-liner:** Badge, Tabs, and Accordion updated with animation tokens; Tabs indicator has spring physics for polished tab switching.

## What Was Built

### Badge Animation Token
Updated Badge component to use `--duration-fast` (150ms) for hover/focus transitions:
```javascript
'transition-all duration-[var(--duration-fast)]',
```
Badge is a small status indicator - fast timing ensures snappy visual feedback.

### Tabs Animation Tokens + Spring Indicator
Updated Tabs component with two animation token applications:

1. **Trigger hover:** `duration-[var(--duration-fast)]` (150ms)
2. **Sliding indicator:** `duration-[var(--duration-smooth)]` (300ms) + `ease-[var(--ease-spring-subtle)]`

The spring easing creates a polished bounce effect on the sliding indicator when switching tabs. The 5% overshoot is subtle but noticeable.

```javascript
// Trigger hover
'transition-colors duration-[var(--duration-fast)]',

// Sliding indicator with spring physics
'transition-all duration-[var(--duration-smooth)]',
'ease-[var(--ease-spring-subtle)]',
```

### Accordion Animation Tokens
Updated Accordion component with token-based timing:

1. **Trigger hover:** `duration-[var(--duration-fast)]` (150ms)
2. **Chevron rotation:** `duration-[var(--duration-smooth)]` (300ms)

Content expand/collapse already uses `@keyframes accordion-down/up` which are handled separately.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tabs indicator easing | --ease-spring-subtle | 5% overshoot creates polished feel |
| Trigger hover timing | --duration-fast | Small elements need snappy feedback |
| Chevron rotation timing | --duration-smooth | Rotation should be smooth, not jarring |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated Badge test assertion**
- **Found during:** Task 1
- **Issue:** Badge.test.js expected `duration-200` but Badge now uses `duration-[var(--duration-fast)]`
- **Fix:** Updated test to expect new class
- **Files modified:** `app/components/ui/__tests__/Badge.test.js`
- **Commit:** f5302e1

## Technical Notes

### Animation Token Mapping
| Component | Element | Token | Value |
|-----------|---------|-------|-------|
| Badge | hover/focus | --duration-fast | 150ms |
| Tabs | trigger hover | --duration-fast | 150ms |
| Tabs | indicator slide | --duration-smooth | 300ms |
| Tabs | indicator ease | --ease-spring-subtle | cubic-bezier(0.34, 1.56, 0.64, 1) |
| Accordion | trigger hover | --duration-fast | 150ms |
| Accordion | chevron rotation | --duration-smooth | 300ms |

### Spring Physics for Tabs
The `--ease-spring-subtle` curve creates a subtle bounce effect:
- Overshoot: ~5% (barely perceptible)
- Purpose: Makes tab switching feel responsive and polished
- Controlled: Duration prevents overshoot from feeling jarring

## Next Phase Readiness

### Ready For
- Plan 35-04: Can verify reduced motion compliance across all updated components

### No Blockers
All three components updated and tests passing.

---

*Completed: 2026-02-05 | Commits: f5302e1, 334f6c0, 9fa7627*
