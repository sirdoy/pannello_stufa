---
phase: 30-foundation-components
plan: 02
subsystem: ui-components
tags: [tabs, radix-ui, accessibility, keyboard-navigation, cva]
dependency-graph:
  requires: [30-01]
  provides: [tabs-component, tabs-namespace-pattern]
  affects: [30-03, thermostat-page, dashboard]
tech-stack:
  added: []
  patterns: [radix-tabs-primitive, sliding-indicator, tabs-context]
key-files:
  created:
    - app/components/ui/Tabs.js
    - app/components/ui/__tests__/Tabs.test.js
  modified:
    - app/components/ui/index.js
decisions:
  - id: tabs-context
    choice: "TabsContext for indicator positioning"
    reason: "Required to track current value for sliding indicator position"
  - id: orientation-prop
    choice: "Separate orientation prop on both Tabs and TabsList"
    reason: "Radix handles keyboard nav on root, CVA handles styles on List"
metrics:
  duration: ~4min
  completed: 2026-02-04
---

# Phase 30 Plan 02: Tabs Component Summary

**One-liner:** Radix Tabs with sliding ember underline indicator, horizontal/vertical orientation, icon support, CVA size variants.

## What Was Built

### Tabs Component (`app/components/ui/Tabs.js` - 263 lines)

Built on Radix Tabs primitive with Ember Noir styling:

1. **Sliding Indicator:**
   - `TabsContext` tracks current value for position calculation
   - `useLayoutEffect` measures active tab position
   - CSS transition with cubic-bezier easing (ease-out-expo)
   - Supports both horizontal (bottom) and vertical (right) orientations

2. **CVA Variants:**
   - `listVariants`: orientation (horizontal/vertical), overflow (scroll/wrap)
   - `triggerVariants`: size (sm/md/lg) with min-height for touch targets

3. **Namespace Pattern:**
   - `Tabs.List` - Container with sliding indicator
   - `Tabs.Trigger` - Tab button with icon support
   - `Tabs.Content` - Panel with fade animation

4. **Accessibility:**
   - WAI-ARIA Tabs pattern via Radix
   - Arrow key navigation (left/right horizontal, up/down vertical)
   - Focus management with visible focus ring
   - Screen reader announcements (role="tab", aria-selected)

### Tests (`app/components/ui/__tests__/Tabs.test.js` - 510 lines)

40 unit tests covering:
- Rendering and initial state
- Click and keyboard navigation
- Vertical orientation with arrow up/down
- Icon support with aria-hidden
- Size variants (sm, md, lg)
- Controlled and uncontrolled modes
- Indicator position updates
- Accessibility (axe, aria attributes)
- Ref forwarding
- Named exports

## Key Implementation Details

```javascript
// Sliding indicator with smooth transition
<span
  className={cn(
    'absolute bg-ember-500',
    'transition-all duration-300',
    '[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
    orientation === 'horizontal' ? 'bottom-0 h-0.5' : 'right-0 w-0.5',
  )}
  style={{ width, left, opacity }}
/>

// Context for value tracking
const TabsContext = createContext({ value: undefined });

// useLayoutEffect for DOM measurement
useLayoutEffect(() => {
  const activeTab = listRef.current?.querySelector('[data-state="active"]');
  if (activeTab) {
    setIndicatorStyle({
      width: activeTab.offsetWidth,
      left: activeTab.offsetLeft,
      opacity: 1,
    });
  }
}, [value, orientation]);
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 65a5285 | feat | Create Tabs component with sliding indicator |
| c92e226 | test | Add Tabs tests and barrel export |

## Verification Results

| Check | Status |
|-------|--------|
| Component renders | Pass |
| Click navigation | Pass |
| Keyboard navigation (arrow keys) | Pass |
| Sliding indicator animates | Pass |
| Vertical orientation | Pass |
| Icon support | Pass |
| Size variants | Pass |
| All tests pass (40/40) | Pass |
| Barrel export works | Pass |

## Usage Examples

```jsx
// Basic horizontal tabs
<Tabs defaultValue="schedule">
  <Tabs.List>
    <Tabs.Trigger value="schedule">Schedule</Tabs.Trigger>
    <Tabs.Trigger value="manual">Manual</Tabs.Trigger>
    <Tabs.Trigger value="history">History</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="schedule">Schedule content</Tabs.Content>
  <Tabs.Content value="manual">Manual content</Tabs.Content>
  <Tabs.Content value="history">History content</Tabs.Content>
</Tabs>

// With icons
<Tabs defaultValue="schedule">
  <Tabs.List>
    <Tabs.Trigger value="schedule" icon={<Calendar />}>Schedule</Tabs.Trigger>
    <Tabs.Trigger value="manual" icon={<Sliders />}>Manual</Tabs.Trigger>
  </Tabs.List>
  ...
</Tabs>

// Vertical orientation
<Tabs defaultValue="tab1" orientation="vertical">
  <Tabs.List orientation="vertical">
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  ...
</Tabs>
```

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for Plan 03 (Thermostat Tabs):**
- Tabs component exports from barrel: `import { Tabs } from '@/app/components/ui'`
- Horizontal tabs ready for Schedule/Manual/History pattern
- Icon support for visual distinction
- All accessibility requirements satisfied
