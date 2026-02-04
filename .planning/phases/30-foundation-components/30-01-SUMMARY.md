---
phase: 30-foundation-components
plan: 01
subsystem: ui-components
tags: [popover, radix-ui, cva, accessibility, ember-noir]
dependency-graph:
  requires: []
  provides: [popover-component, click-trigger, hover-trigger, size-variants, arrow-support]
  affects: [31-advanced-interactions, 32-data-input-components]
tech-stack:
  added: []
  patterns: [radix-popover-wrapper, cva-size-variants, namespace-pattern, portal-rendering]
key-files:
  created:
    - app/components/ui/Popover.js
    - app/components/ui/__tests__/Popover.test.js
  modified:
    - app/components/ui/index.js
decisions:
  - id: POPV-D1
    title: Hover mode via wrapper div
    rationale: Radix Popover does not natively support hover triggers. Wrapping in a div with onMouseEnter/onMouseLeave handlers provides hover trigger mode while preserving Radix accessibility.
  - id: POPV-D2
    title: Timeout refs for hover delays
    rationale: Used useRef instead of plain objects for timeout IDs to persist across renders and prevent stale closure issues.
metrics:
  duration: 8 min
  completed: 2026-02-04
---

# Phase 30 Plan 01: Popover Component Summary

**Popover component with Radix UI, CVA size variants, click/hover trigger modes, and optional arrow indicator.**

## What Was Built

### Popover Component (`app/components/ui/Popover.js`)
- **Lines:** 269
- **Radix Wrapper:** Uses `@radix-ui/react-popover` for accessibility, focus trap, Portal
- **CVA Variants:** Size variants (sm/md/lg) with max-width classes
- **Trigger Modes:** Click (default) and hover with configurable delays
- **Arrow Support:** Optional arrow indicator pointing to trigger
- **Namespace Pattern:** `Popover.Trigger`, `Popover.Content`, `Popover.Close`, `Popover.Arrow`
- **Ember Noir Styling:** Dark glassmorphism with blur, rounded corners, animation

### Test Suite (`app/components/ui/__tests__/Popover.test.js`)
- **Lines:** 559
- **Tests:** 38 passing
- **Coverage:**
  - Rendering (open/closed states)
  - Click trigger mode (open, close, toggle)
  - Keyboard navigation (Escape, Tab)
  - Click outside behavior
  - Hover trigger mode (wrapper div, controlled state)
  - Size variants (sm/md/lg)
  - Arrow rendering
  - Positioning props (side, align, sideOffset)
  - PopoverClose button
  - Accessibility (axe, aria-expanded)
  - Named exports and namespace components
  - Styling classes

### Barrel Export (`app/components/ui/index.js`)
- Added Popover exports at v4.0+ section

## Must-Haves Verification

| Truth | Status |
|-------|--------|
| User can click trigger to open/close Popover | PASS |
| Popover positions correctly within viewport | PASS (Radix Popper) |
| Click outside closes Popover | PASS |
| Escape key closes Popover | PASS |
| Focus is trapped within Popover when open | PASS (Radix handles) |

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `95b24bc` | feat | Create Popover component with CVA variants |
| `c42d8e6` | test | Add Popover tests and barrel export |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed hover mode timeout refs**
- **Found during:** Task 1 testing
- **Issue:** Timeout refs were plain objects (`{ current: null }`) that got recreated on each render, causing stale closure issues
- **Fix:** Changed to `useRef(null)` to persist across renders
- **Files modified:** `app/components/ui/Popover.js`
- **Commit:** `c42d8e6`

## Key Patterns Established

### Hover Trigger Mode
```javascript
// Wrap children in div with mouse handlers for hover mode
if (triggerMode === 'hover') {
  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>
    </PopoverPrimitive.Root>
  );
}
```

### CVA Size Variants
```javascript
const contentVariants = cva(
  ['z-50 rounded-2xl p-4', /* base styles */],
  {
    variants: {
      size: {
        sm: 'max-w-xs',  // 320px
        md: 'max-w-sm',  // 384px (default)
        lg: 'max-w-md',  // 448px
      },
    },
    defaultVariants: { size: 'md' },
  }
);
```

## Usage Examples

```jsx
// Basic click-triggered
<Popover>
  <Popover.Trigger asChild>
    <Button>Open Menu</Button>
  </Popover.Trigger>
  <Popover.Content>
    <p>Menu content</p>
  </Popover.Content>
</Popover>

// Hover-triggered with arrow
<Popover triggerMode="hover" openDelay={300}>
  <Popover.Trigger asChild>
    <span>Hover for info</span>
  </Popover.Trigger>
  <Popover.Content arrow size="sm">
    <p>Info tooltip</p>
  </Popover.Content>
</Popover>
```

## Next Phase Readiness

Ready for:
- Plan 30-02: DropdownMenu component (uses similar Radix pattern)
- Plan 30-03: HoverCard component (hover-triggered content)
- Future Command Palette and Context Menu will build on Popover patterns
