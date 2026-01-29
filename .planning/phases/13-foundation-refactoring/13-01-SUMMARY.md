---
phase: 13-foundation-refactoring
plan: 01
status: complete
subsystem: design-system
tags: [button, cva, accessibility, jest-axe]

dependency_graph:
  requires: [11-01, 12-01]
  provides: [Button-CVA, buttonVariants, Button.Icon, Button.Group]
  affects: [13-02, 13-03, 13-04, 13-05, 14-x]

tech_stack:
  added: []
  patterns: [CVA-button-variants, namespace-components, forwardRef-wrapper]

key_files:
  created: []
  modified:
    - app/components/ui/Button.js
    - app/components/ui/__tests__/Button.test.js

decisions:
  - id: 13-01-D1
    decision: "Remove legacy props entirely (no backwards compatibility)"
    reason: "Clean break - legacy props (primary, secondary, liquid) mapped to new names adds complexity"
  - id: 13-01-D2
    decision: "Button.Icon defaults to ghost variant"
    reason: "Icon buttons are typically secondary actions, ghost provides subtle appearance"
  - id: 13-01-D3
    decision: "Compound variants for iconOnly sizing"
    reason: "Size + iconOnly need coordinated padding and min-width for proper touch targets"

metrics:
  duration: "2 min"
  completed: "2026-01-29"
---

# Phase 13 Plan 01: Button CVA Refactor Summary

**One-liner:** Button refactored to CVA with 6 variants, 3 sizes, compound iconOnly sizing, and Button.Icon/Button.Group namespace components.

## What Was Built

Refactored Button component from manual class string concatenation to CVA (Class Variance Authority) pattern, matching Phase 12 component architecture.

### Key Changes

1. **CVA Configuration**
   - 6 variants: ember (gradient), subtle (glass), ghost (transparent), success (sage), danger (red), outline (border)
   - 3 sizes: sm (44px), md (48px), lg (56px) - iOS minimum touch targets
   - fullWidth and iconOnly boolean variants
   - Compound variants for iconOnly + size padding/min-width

2. **Namespace Components**
   - `Button.Icon`: Wrapper for icon-only buttons with required aria-label
   - `Button.Group`: Flex container with gap-2 and role="group"

3. **forwardRef Support**
   - Both Button and Button.Icon forward refs properly

4. **Exports**
   - Default export: Button (with .Icon and .Group attached)
   - Named exports: Button, buttonVariants, ButtonIcon, ButtonGroup

### Legacy Props Removed

- `liquid` - No longer needed
- `variant="primary"` - Use `variant="ember"`
- `variant="secondary"` - Use `variant="subtle"`
- No backwards compatibility mapping - clean break

## Deviations from Plan

None - plan executed exactly as written.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Refactor Button with CVA variants | bb30348 | Button.js |
| 2 | Create comprehensive Button tests | 34f8d7d | Button.test.js |

## Verification Results

1. `npm test -- --testPathPatterns="Button.test.js"` - 42 tests pass
2. Button.js exports buttonVariants - VERIFIED
3. No legacy prop handling exists - VERIFIED

## Files Changed

### Modified: `app/components/ui/Button.js`
- Replaced 269 lines with 288 lines (CVA pattern is more verbose but cleaner)
- Added CVA imports and buttonVariants configuration
- Added forwardRef wrapper
- Added namespace sub-components
- Removed legacy prop mapping

### Modified: `app/components/ui/__tests__/Button.test.js`
- Replaced 187 lines with 343 lines
- Added jest-axe accessibility tests (9 tests)
- Added CVA variant tests (12 tests)
- Added compound variant tests (3 tests)
- Added focus ring tests (2 tests)
- Added namespace component tests (3 tests)
- Added ref forwarding tests (2 tests)
- Added export verification tests (3 tests)

## Test Coverage

- **Accessibility:** 9 tests (all 6 variants + disabled + loading + iconOnly)
- **CVA Variants:** 12 tests (all variants and sizes)
- **Compound Variants:** 3 tests (iconOnly + size combinations)
- **States:** 5 tests (disabled, loading, click handlers)
- **Focus Ring:** 2 tests (ring-2, ember-500/50)
- **Namespace:** 3 tests (Button.Icon, Button.Group)
- **Ref Forwarding:** 2 tests (Button, Button.Icon)
- **Exports:** 3 tests (buttonVariants, ButtonIcon, ButtonGroup)

**Total:** 42 tests (all passing)

## Next Phase Readiness

**Ready for:**
- Plan 13-02 (Card component) - No blockers
- Plan 13-03 (Label component) - No blockers
- Consumers can import buttonVariants for custom button styling

**Pattern established:**
- CVA for variant management
- Namespace pattern for compound components
- forwardRef for all interactive components
- jest-axe for accessibility testing
