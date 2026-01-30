---
phase: 18-documentation-polish
plan: 02
subsystem: documentation
tags: [component-docs, accessibility, props, metadata]

dependency-graph:
  requires: [18-01]
  provides: [componentDocs, getComponentsByCategory, getCategories, getComponentDoc]
  affects: [18-03, 18-04]

tech-stack:
  added: []
  patterns:
    - componentDocs object structure with props, keyboard, aria, screenReader, codeExample
    - Category-based organization (Form Controls, Feedback, Layout, Smart Home)
    - Helper functions for component lookup and filtering

file-tracking:
  created:
    - app/debug/design-system/data/component-docs.js
  modified: []

decisions:
  - id: 18-02-01
    decision: "Single file for all component metadata rather than per-component files"
    rationale: "Easier to import, better for tree-shaking, simpler maintenance"
  - id: 18-02-02
    decision: "Italian default labels for ConnectionStatus and HealthIndicator documented"
    rationale: "Matches actual component implementation (Online, Offline, Connessione...)"
  - id: 18-02-03
    decision: "ControlButton documents keyboard as single press only"
    rationale: "Long-press uses mouse events for continuous adjustment, keyboard triggers single step"

metrics:
  duration: "~5 min"
  completed: "2026-01-30"
---

# Phase 18 Plan 02: Component Documentation Data Summary

Centralized metadata for 24 design system components with props, keyboard navigation, ARIA attributes, screen reader behavior, and code examples.

## Objective Achieved

Created `component-docs.js` as single source of truth for component documentation, enabling PropTable and AccessibilitySection components to render accurate documentation.

## Tasks Completed

| Task | Description | Outcome | Commit |
|------|-------------|---------|--------|
| 1 | Form Controls metadata | Button, Checkbox, Switch, Input, Select, Slider documented | bee09b1 |
| 2 | Feedback & Layout metadata | Modal, Toast, Banner, Tooltip, Spinner, Progress, EmptyState, Card, PageLayout, Section, Grid documented | bee09b1 |
| 3 | Smart Home metadata | Badge, ConnectionStatus, HealthIndicator, SmartHomeCard, StatusCard, DeviceCard, ControlButton documented | bee09b1 |

Note: All tasks completed in single commit since file was created with complete structure.

## Component Coverage

### Form Controls (6 components)
- **Button**: 9 props, 3 keyboard keys, namespace sub-components (Icon, Group)
- **Checkbox**: Radix primitives, indeterminate state, backwards-compatible onChange
- **Switch**: 250ms animation, onCheckedChange and legacy onChange
- **Input**: clearable, showCount, real-time validation, aria-invalid
- **Select**: Simple and compound APIs, typeahead keyboard navigation
- **Slider**: Single/range modes, aria-label on thumb (not root)

### Feedback (7 components)
- **Modal**: Focus trap, ESC close, mobile bottom sheet, Radix Dialog
- **Toast**: Success/error/warning/info variants, swipe-to-dismiss
- **Banner**: Persistent dismissal via localStorage, role="alert"
- **Tooltip**: Hover/focus trigger, Radix Tooltip, Provider pattern
- **Spinner**: SVG animation, aria-label, role="status"
- **Progress**: Determinate/indeterminate modes, Radix Progress
- **EmptyState**: Icon, title, description, action - presentational

### Layout (4 components)
- **Card**: 5 variants, namespace sub-components (Header, Title, Content, Divider, Footer)
- **PageLayout**: Header/footer slots, semantic elements
- **Section**: Heading level prop for accessibility hierarchy
- **Grid**: Responsive column patterns, polymorphic as prop

### Smart Home (7 components)
- **Badge**: 6 color variants, pulse animation, icon support
- **ConnectionStatus**: role="status", aria-live="polite", Italian labels
- **HealthIndicator**: 4 severity levels, lucide icons, pulse option
- **SmartHomeCard**: Accent bar, namespace sub-components (Header, Status, Controls)
- **StatusCard**: Extends SmartHomeCard with Badge and ConnectionStatus
- **DeviceCard**: Full legacy prop support, healthStatus, banners, footerActions
- **ControlButton**: Long-press via mouse events, keyboard for single step only

## Key Accessibility Documentation

### Keyboard Navigation
All interactive components document keyboard behavior:
- Tab navigation for focus management
- Enter/Space for activation
- Arrow keys for value adjustment (Select, Slider)
- Escape for close/cancel operations

### ARIA Attributes
- Form controls: aria-invalid, aria-describedby, aria-labelledby
- Live regions: role="status" with aria-live="polite"
- Dialogs: role="dialog", aria-modal
- Decorative elements: aria-hidden="true"

### Screen Reader Announcements
Each component documents expected announcements:
- State changes (checked/unchecked, on/off)
- Value updates (slider position)
- Error messages (via aria-describedby)
- Status changes (via aria-live regions)

## Verification Results

| Criteria | Status |
|----------|--------|
| componentDocs exports 20+ components | PASS (24 components) |
| Form Controls: 6 components | PASS |
| Feedback: 7 components | PASS |
| Layout: 4 components | PASS |
| Smart Home: 7 components | PASS |
| Props match actual implementations | PASS |
| Keyboard navigation documented | PASS |
| ARIA attributes documented | PASS |

## Files Created

```
app/debug/design-system/data/
  component-docs.js          # 980 lines - all component metadata
```

## Exports

```javascript
export const componentDocs = { ... };  // Main metadata object
export function getComponentsByCategory(category) { ... }  // Filter by category
export function getCategories() { ... }  // Get all category names
export function getComponentDoc(name) { ... }  // Get single component
```

## Usage

```javascript
import { componentDocs, getComponentsByCategory } from './data/component-docs';

// Get all form controls
const formControls = getComponentsByCategory('Form Controls');

// Render PropTable
<PropTable props={componentDocs.Button.props} />

// Render AccessibilitySection
<AccessibilitySection
  keyboard={componentDocs.Button.keyboard}
  aria={componentDocs.Button.aria}
  screenReader={componentDocs.Button.screenReader}
/>
```

## Next Steps

- 18-03: Component showcase pages using this metadata
- 18-04: Usage examples and guidelines integration
