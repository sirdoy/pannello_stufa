---
phase: 14-feedback-layout-components
plan: 04
subsystem: design-system
tags: [spinner, progress, loading, radix, cva, accessibility]

dependency-graph:
  requires: [11-01, 12-01]
  provides: [Spinner, spinnerVariants, Progress, progressVariants]
  affects: [14-05, 14-06, 14-07, 15, 16, 17, 18]

tech-stack:
  added: []
  patterns: [CVA, Radix Progress, indeterminate animation]

key-files:
  created:
    - app/components/ui/Spinner.js
    - app/components/ui/Progress.js
    - app/components/ui/__tests__/Spinner.test.js
    - app/components/ui/__tests__/Progress.test.js
  modified:
    - app/components/ui/index.js
    - app/globals.css

decisions:
  - id: 14-04-01
    decision: Spinner uses SVG with two circles (background + spinning arc)
    rationale: Simple, performant, and works with any color variant
  - id: 14-04-02
    decision: Progress uses aria-label prop (default 'Progress') for axe compliance
    rationale: Radix Progress requires accessible name for progressbar role
  - id: 14-04-03
    decision: Progress auto-detects indeterminate when value is undefined/null
    rationale: Better DX - just omit value for loading state
  - id: 14-04-04
    decision: Keep ProgressBar.js for backwards compatibility
    rationale: Existing code uses ProgressBar with different API (label, leftContent, rightContent)

metrics:
  duration: ~5 min
  completed: 2026-01-29
---

# Phase 14 Plan 04: Spinner and Progress Components Summary

**One-liner:** Spinner with CVA size/color variants, Progress with Radix primitive and indeterminate animation.

## What Was Built

### Spinner Component
- **File:** `app/components/ui/Spinner.js`
- **Purpose:** Animated loading indicator for inline/button loading states
- **Features:**
  - 5 size variants: xs (h-3), sm (h-4), md (h-6), lg (h-8), xl (h-12)
  - 4 color variants: ember, white, current, muted
  - Accessible with role="status" and aria-label
  - CSS animation via Tailwind's animate-spin
  - CVA variant export for external styling

### Progress Component
- **File:** `app/components/ui/Progress.js`
- **Purpose:** Accessible progress bar with determinate/indeterminate states
- **Features:**
  - Built on @radix-ui/react-progress for ARIA compliance
  - 3 size variants: sm (h-1.5), md (h-2.5), lg (h-4)
  - 5 color variants: ember, ocean, sage, warning, danger
  - Indeterminate animation when value is undefined/null
  - forwardRef support for composability
  - aria-label prop for accessibility

### Animation Added
- `animate-progress-indeterminate` keyframes in globals.css
- Smooth translateX animation (0% -> 400%) at 1.5s interval

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 2108ccf | feat | Create Spinner component with CVA variants |
| 689649b | feat | Create Progress component with Radix primitive |
| 63c4e20 | chore | Export Spinner and Progress components |

## Test Coverage

| Component | Tests | Status |
|-----------|-------|--------|
| Spinner | 20 | PASS |
| Progress | 28 | PASS |

### Test Categories
- Rendering (basic mount, role verification)
- Size variants (all sizes applied correctly)
- Color variants (all colors applied correctly)
- Accessibility (axe compliance, aria-label, role)
- Indeterminate state (animation class, value handling)
- Custom props (className, ref forwarding)

## API Reference

### Spinner
```jsx
import { Spinner, spinnerVariants } from '@/components/ui';

<Spinner size="lg" variant="ember" label="Loading..." />
<Button disabled><Spinner size="sm" variant="current" /> Saving...</Button>
```

### Progress
```jsx
import { Progress, progressVariants } from '@/components/ui';

// Determinate (with value)
<Progress value={75} variant="ember" size="md" />

// Indeterminate (loading)
<Progress indeterminate variant="ocean" />
<Progress />  // auto-indeterminate when value omitted

// With custom label
<Progress value={50} label="Upload progress" />
```

## Backwards Compatibility

- `ProgressBar` export maintained for existing code
- ProgressBar has different API (label, leftContent, rightContent props)
- New Progress component is simpler, Radix-based with proper ARIA

## Deviations from Plan

### [Rule 2 - Missing Critical] Added aria-label prop to Progress
- **Found during:** Task 2 testing
- **Issue:** axe reported "ARIA progressbar nodes must have an accessible name"
- **Fix:** Added label prop with default value "Progress", passed as aria-label
- **Files modified:** app/components/ui/Progress.js
- **Commit:** 689649b

## Next Phase Readiness

Ready for 14-05 (Skeleton with shimmer/pulse variants). Spinner and Progress provide loading feedback patterns that complement Skeleton for content loading states.
