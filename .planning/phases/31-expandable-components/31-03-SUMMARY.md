---
phase: 31
plan: 03
subsystem: Design System Integration
tags: [accordion, sheet, expandable-components, design-system, ui-components]

depends_on:
  - 31-01-Accordion-Component-Implementation
  - 31-02-Sheet-Component-Implementation

provides:
  - Design system demo page with expandable component examples
  - Visual testing environment for Accordion and Sheet
  - Real-world usage patterns documented

affects:
  - Future component documentation
  - Design system maintenance
  - Developer onboarding

completed: 2026-02-04
duration: 22 minutes
---

# Plan 31-03: Apply Accordion and Sheet to Design System

**Status:** COMPLETE
**Duration:** 22 minutes
**Verified:** User approved all functionality

## One-Liner

Accordion and Sheet components demonstrated on design system debug page with real-world patterns and full accessibility support.

## Deliverables

### Files Modified

| File | Changes |
|------|---------|
| `app/(dashboard)/debug/design-system/page.js` | Added Accordion and Sheet demo sections + table of contents with anchor links |

### Commits

| Hash | Type | Description |
|------|------|-------------|
| 2d98948 | feat | Add Accordion section to design system page |
| b96dce0 | feat | Add Sheet section to design system page |
| fd522ae | feat | Add table of contents with anchor links to design system page |

## What Was Built

### Accordion Section

**Single Mode Demo:**
- FAQ-style pattern with only one item open at a time
- Italian locale content (stove setup, maintenance, thermostat)
- Collapsible (same item click closes it)
- Three FAQ items demonstrating typical stove usage questions

**Multiple Mode Demo:**
- Device info pattern with multiple items independently expandable
- Three sections: Device info, Usage stats, Scheduled maintenance
- All three can be open simultaneously
- Shows realistic device monitoring use case

### Sheet Section

**Four directional variants:**

1. **Bottom Sheet** - Settings form pattern
   - Stove settings (target temperature, mode)
   - Cancel/Save actions in footer
   - Typical mobile settings dialog

2. **Right Sheet** - Detail view pattern
   - Device details (state, temperature, hours)
   - Side panel for desktop-like views
   - Display-only information layout

3. **Left Sheet** - Navigation pattern
   - Menu items (Dashboard, Devices, Settings, Help)
   - Responsive sidebar alternative
   - Ghost button styling for nav items

4. **Top Sheet** - Notification pattern
   - Simple notification with action
   - Minimal content, centered message
   - OK action to dismiss

### Table of Contents

- Index card with anchor links to all 23 sections
- Quick navigation for design system page
- Links updated with smooth scrolling

## Verification Results

User verified in browser at http://localhost:3000/debug/design-system:

### Accordion Testing
- ✓ Single mode: Only one item open at a time
- ✓ Single mode: Same item click closes (collapsible)
- ✓ Single mode: Keyboard navigation works (arrow keys, Enter/Space)
- ✓ Single mode: Focus ring visible on triggers
- ✓ Multiple mode: First two items open by default
- ✓ Multiple mode: Third item can open independently
- ✓ Multiple mode: All items operate independently
- ✓ Accordion expand/collapse animations smooth, no flicker

### Sheet Testing
- ✓ Bottom sheet slides up from bottom
- ✓ Bottom sheet backdrop click closes smoothly
- ✓ Right sheet slides in from right side
- ✓ Left sheet slides in from left side
- ✓ Top sheet slides down from top
- ✓ All sheets close with Escape key
- ✓ Focus trapped within open sheet
- ✓ Focus returns correctly on close
- ✓ Sheet slide animations smooth and fluid

### Accessibility
- ✓ All accordion triggers keyboard accessible
- ✓ Focus visible on interactive elements
- ✓ Tab navigation within sheets works
- ✓ Escape key closes sheets and returns focus
- ✓ ARIA roles properly applied

## Deviations from Plan

None - plan executed exactly as written.

The orchestrator added a bonus commit (fd522ae) to add table of contents with anchor links to the design system page. This enhancement improves navigation and wasn't in the original plan but aligns with design system best practices.

## Technical Details

### Component Patterns Used

**Accordion:**
- Single/Multiple modes via type prop
- Controlled open state for multiple mode
- Collapsible single item support
- Italian UI text for stove domain

**Sheet:**
- Side props for directional control (bottom, right, left, top)
- Size props for responsive widths (sm, md)
- Controlled open state via useState
- Sheet.Header/Title/Description for headers
- Sheet.Footer for action buttons
- Backdrop click and Escape key support

### Design System Integration

- Used existing design system components (Heading, Text, Button)
- Ember Noir styling applied consistently
- Italian locale throughout
- Real-world use cases from stove monitoring domain
- Responsive grid layout for sheet demo buttons

## Code Quality

- All imports use UI barrel (`@/app/components/ui`)
- Consistent with existing design system patterns
- Full accessibility support (keyboard nav, focus management, ARIA)
- Real-world content patterns (settings, details, nav, notifications)
- Smooth animations, no flicker or jank

## Next Phase Readiness

- Design system now documents all expandable components
- Real usage patterns established for future developers
- Accessible implementations set precedent for other UI work
- Table of contents improves design system navigation
- Ready for production component usage

## Session Summary

Completed the final task in Phase 31 (Expandable Components). The design system page now comprehensively documents Accordion and Sheet components with real-world patterns, full keyboard accessibility, and smooth animations. User verified all functionality works correctly in the browser.

This concludes Phase 31 Wave 2, completing the expandable components implementation and design system documentation.
