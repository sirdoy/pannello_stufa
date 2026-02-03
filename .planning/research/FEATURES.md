# Features Research: Advanced UI Components

**Domain:** Smart Home PWA - UI Component Library Extension
**Researched:** 2026-02-03
**Overall Confidence:** HIGH (verified against W3C APG, MDN, and multiple design system sources)

---

## Executive Summary

This research documents expected behaviors, accessibility requirements, and interaction patterns for 8 advanced UI components to be added to the Ember Noir design system. The existing design system already implements WCAG AA compliance with proper keyboard navigation, focus indicators, and screen reader support via Radix primitives.

The new components fall into three categories:
1. **Navigation/Organization:** Tabs, Accordion
2. **Data Display:** Data Table
3. **Quick Actions:** Command Palette, Context Menu, Popover/Dropdown
4. **Overlay Patterns:** Sheet/Drawer, Dialog variants (Confirmation, Form)

Key findings:
- All components must support keyboard navigation following W3C APG patterns
- Focus management is critical for overlays (focus trap, return focus)
- Mobile touch interactions require alternatives to complex gestures
- The existing Modal component provides a foundation for Dialog variants

---

## Component Behaviors

### Tabs / TabGroup

**Table stakes (must have):**
- [ ] **Structure:** `role="tablist"` on container, `role="tab"` on each tab, `role="tabpanel"` on content
- [ ] **ARIA:** `aria-selected="true|false"` on tabs, `aria-controls` linking tab to panel, `aria-labelledby` on panel
- [ ] **Keyboard - Arrow Keys:** Left/Right arrows switch between tabs (horizontal), Up/Down for vertical
- [ ] **Keyboard - Home/End:** Jump to first/last tab
- [ ] **Keyboard - Tab key:** Moves focus to tabpanel content, not between tabs (roving tabindex)
- [ ] **Keyboard - Enter/Space:** Activates focused tab (optional - can auto-activate on focus)
- [ ] **Focus indicator:** Visible ember glow ring on focused tab
- [ ] **Panel visibility:** Hidden panels use `hidden` attribute (not just CSS)
- [ ] **Touch:** 44px minimum tap targets

**Differentiators (nice-to-have):**
- Animated tab indicator sliding between tabs (respect `prefers-reduced-motion`)
- Scroll behavior for overflow tabs on mobile
- Badge/count support on tabs (e.g., "Schedules (3)")
- Vertical tab orientation option
- Lazy loading panel content (only render when first activated)

**Anti-features (do NOT build):**
- Tabs that only work with mouse hover
- Auto-cycling tabs (causes accessibility issues)
- Tabs without visible selected state
- Nested tabs (confusing navigation)

**Smart home use cases:**
- Thermostat page: "Schedule / Manual / History" tabs
- Settings page: "General / Notifications / Advanced" tabs
- Lights page: "Rooms / Scenes / Automations" tabs
- Device details: "Status / Settings / Logs" tabs

---

### Accordion / Collapsible

**Table stakes (must have):**
- [ ] **Structure:** Button as header trigger, panel as expandable content
- [ ] **ARIA:** `aria-expanded="true|false"` on button, `aria-controls` pointing to panel ID
- [ ] **Keyboard - Enter/Space:** Toggle expand/collapse on focused header
- [ ] **Keyboard - Tab:** Move between accordion headers (and into expanded content)
- [ ] **Keyboard - Arrow Up/Down:** Navigate between headers within accordion group
- [ ] **Keyboard - Home/End:** Jump to first/last accordion header
- [ ] **Hidden content:** Collapsed panels hidden from keyboard and screen readers (`hidden` attribute)
- [ ] **Focus indicator:** Visible ember glow ring on focused header
- [ ] **Touch:** 44px minimum header tap target

**Differentiators (nice-to-have):**
- Smooth expand/collapse animation (respect `prefers-reduced-motion`)
- Icon rotation animation (chevron)
- Allow multiple panels open simultaneously (configurable)
- Native `<details>`/`<summary>` option for simpler cases
- Nested accordions (with proper ARIA)

**Anti-features (do NOT build):**
- Accordion that only works with mouse clicks
- Headers that are not focusable
- Content that remains in tab order when collapsed
- Animations that cannot be disabled

**Smart home use cases:**
- FAQ/Help sections
- Advanced settings (grouped by category)
- Schedule details (expand to see time slots)
- Device troubleshooting steps
- Notification preferences by category

---

### Data Table

**Table stakes (must have):**
- [ ] **Structure:** Native `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` elements
- [ ] **ARIA for sorting:** `aria-sort="ascending|descending|none"` on sortable column headers
- [ ] **Sortable headers:** Wrapped in `<button>` element for keyboard activation
- [ ] **Keyboard - Tab:** Move through interactive elements (sort buttons, row actions, pagination)
- [ ] **Keyboard - Enter/Space:** Activate sort or row action
- [ ] **Focus indicator:** Visible ember glow on focused interactive elements
- [ ] **Caption:** `<caption>` element or `aria-label` for table purpose
- [ ] **Touch:** 44px minimum tap targets for actions

**Differentiators (nice-to-have):**
- Row selection with checkboxes (shift-click for range)
- Inline row actions (edit, delete)
- Column resizing
- Sticky header on scroll
- Empty state component integration
- Loading skeleton rows
- Virtualization for large datasets (>100 rows)

**Anti-features (do NOT build):**
- Tables with `role="grid"` unless cells are editable (overly complex)
- Sorting that only works on click without keyboard
- Fixed column widths that cause horizontal scroll on mobile
- Pagination without keyboard support

**Smart home use cases:**
- Log viewer: timestamp, event, device columns
- Schedule list: time, mode, temperature columns
- Maintenance history: date, action, status columns
- Admin: User management, API logs

---

### Command Palette (Cmd+K)

**Table stakes (must have):**
- [ ] **Trigger:** Global keyboard shortcut (Cmd+K or Ctrl+K)
- [ ] **Structure:** `role="dialog"` with `aria-modal="true"`
- [ ] **Search input:** Auto-focused on open, `role="combobox"`
- [ ] **Results list:** `role="listbox"` with `role="option"` items
- [ ] **Keyboard - Arrow Up/Down:** Navigate through results
- [ ] **Keyboard - Enter:** Execute selected command
- [ ] **Keyboard - Escape:** Close palette, return focus to trigger
- [ ] **Focus trap:** Focus stays within palette while open
- [ ] **Fuzzy search:** Filter commands as user types
- [ ] **Touch:** Works on mobile (though less common)

**Differentiators (nice-to-have):**
- Command grouping by category
- Recent commands section
- Keyboard shortcut hints shown next to commands
- Nested navigation (e.g., "Go to > Lights > Living Room")
- Action preview before execution
- Undo last action support

**Anti-features (do NOT build):**
- Palette that steals focus from important forms
- Commands without keyboard shortcut hints
- More than 2 levels of nesting (confusing)
- Palette that doesn't close on command execution

**Smart home use cases:**
- Quick navigation: "Go to Thermostat", "Go to Settings"
- Quick actions: "Turn off all lights", "Set temperature to 20C"
- Search: "Find Living Room", "Search schedules"
- Mode switching: "Set Away mode", "Enable Night mode"

---

### Context Menu (Right-click)

**Table stakes (must have):**
- [ ] **Trigger:** Right-click (contextmenu event) or long-press on touch
- [ ] **Structure:** `role="menu"` container, `role="menuitem"` items
- [ ] **ARIA:** Trigger has `aria-haspopup="menu"`, menu has `aria-expanded`
- [ ] **Keyboard - Arrow Up/Down:** Navigate menu items
- [ ] **Keyboard - Enter/Space:** Execute selected action
- [ ] **Keyboard - Escape:** Close menu, return focus to trigger
- [ ] **Keyboard - Home/End:** Jump to first/last item
- [ ] **Keyboard - Character keys:** Typeahead to matching item
- [ ] **Focus management:** First item focused on open
- [ ] **Click outside:** Closes menu

**Differentiators (nice-to-have):**
- Submenus with `aria-haspopup` on parent items
- Separator/divider support
- Disabled items with `aria-disabled="true"`
- Icons for visual recognition
- Keyboard shortcut hints

**Anti-features (do NOT build):**
- Context menu as only way to access actions (always provide alternative)
- Menu that stays open after action execution
- Deep submenu nesting (>2 levels)
- Custom right-click that breaks browser context menu entirely

**Smart home use cases:**
- Device card: "Edit", "Rename", "Remove", "View logs"
- Schedule item: "Edit", "Duplicate", "Delete", "Disable"
- Light scene: "Activate", "Edit", "Rename", "Delete"
- Log entry: "Copy", "View details", "Create alert rule"

---

### Popover / Dropdown

**Table stakes (must have):**
- [ ] **Structure:** Trigger button + popover content
- [ ] **ARIA:** Trigger has `aria-haspopup="dialog"` or `"menu"`, `aria-expanded="true|false"`
- [ ] **ARIA:** Popover has `role="dialog"` (or `"menu"` for menus) and `aria-labelledby`
- [ ] **Keyboard - Enter/Space:** Open popover from trigger
- [ ] **Keyboard - Escape:** Close popover, return focus to trigger
- [ ] **Keyboard - Tab:** Navigate through popover content (trap if modal)
- [ ] **Focus management:** First focusable element receives focus on open
- [ ] **Click outside:** Closes popover (unless modal)
- [ ] **Position:** Auto-positions to stay in viewport

**Differentiators (nice-to-have):**
- Arrow/caret pointing to trigger
- Multiple placement options (top, right, bottom, left)
- Controlled open state (for forms)
- Close on scroll option
- Animation (respect `prefers-reduced-motion`)
- Native Popover API where supported (Chrome 114+, Safari 17+)

**Anti-features (do NOT build):**
- Popover that opens on hover only (inaccessible)
- Popover without Escape key support
- Content that overflows viewport on mobile
- Multiple popovers open simultaneously (confusing)

**Smart home use cases:**
- User profile dropdown
- Notification dropdown with list
- Quick settings popover (brightness, sound)
- Help tooltip with rich content
- Device quick actions

---

### Sheet / Drawer

**Table stakes (must have):**
- [ ] **Structure:** `role="dialog"` with `aria-modal="true"`
- [ ] **ARIA:** `aria-labelledby` pointing to title, `aria-describedby` for description
- [ ] **Keyboard - Escape:** Close drawer
- [ ] **Keyboard - Tab:** Navigate within drawer (focus trap)
- [ ] **Focus trap:** Focus cannot leave drawer while open
- [ ] **Focus return:** Focus returns to trigger element on close
- [ ] **Backdrop:** Semi-transparent overlay indicating modal state
- [ ] **Placement:** Support for left, right, bottom positions
- [ ] **Touch - Close button:** Visible, 44px minimum target

**Differentiators (nice-to-have):**
- Swipe to close gesture (bottom drawer) with touch
- Partial height option for bottom sheets
- Snap points (25%, 50%, 100% height)
- Drag handle indicator for touch
- Animation slide-in/out (respect `prefers-reduced-motion`)
- Stacked drawers management
- Body scroll lock

**Anti-features (do NOT build):**
- Drawer without visible close button
- Swipe-only close (no button alternative)
- Drawer that doesn't trap focus
- Animations without reduced motion support

**Smart home use cases:**
- Mobile navigation menu (left drawer)
- Device settings panel (right drawer)
- Quick actions panel (bottom sheet)
- Filter panel for logs/history
- Add new schedule form

---

### Dialog Patterns (Confirmation, Form)

**Table stakes (must have):**
- [ ] **Structure:** `role="dialog"` (confirmation) or `role="alertdialog"` (destructive)
- [ ] **ARIA:** `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
- [ ] **Keyboard - Escape:** Close dialog (confirmation), may not close (form with unsaved)
- [ ] **Keyboard - Tab:** Navigate within dialog (focus trap)
- [ ] **Focus trap:** Focus cannot leave dialog while open
- [ ] **Initial focus:** Set to first interactive element OR primary action
- [ ] **Focus return:** Returns to trigger on close
- [ ] **Button order:** Cancel/secondary on left, Confirm/primary on right
- [ ] **Touch:** All buttons 44px minimum target

**Confirmation Dialog specifics:**
- [ ] Clear, concise message describing the action
- [ ] Destructive actions use danger variant button
- [ ] Primary focus on safe action (Cancel) for destructive dialogs
- [ ] Escape key should close (non-destructive confirmation)

**Form Modal specifics:**
- [ ] Form validation before submission
- [ ] Unsaved changes warning on close attempt
- [ ] Loading state during submission
- [ ] Error display within modal
- [ ] Success feedback (toast after close or inline)

**Differentiators (nice-to-have):**
- Size variants (sm, md, lg, full)
- Scrollable content for long forms
- Form step indicator for multi-step
- Autosave draft support
- Shake animation on validation error (respect `prefers-reduced-motion`)

**Anti-features (do NOT build):**
- Confirmation dialog without clear action description
- Form modal without Cancel option
- Dialog that can only be closed by completing action
- Nested modals (use steps or navigation instead)

**Smart home use cases:**
- Confirmation: "Delete schedule?", "Turn off all devices?", "Reset settings?"
- Form: "Add new schedule", "Rename device", "Configure automation"
- Form: "Edit thermostat settings", "Create light scene"
- Alert: "Maintenance required - cleaning needed"

---

## Micro-interactions

Animation and feedback patterns across all components. All animations MUST respect `prefers-reduced-motion`.

### Timing Guidelines

| Interaction Type | Duration | Easing |
|------------------|----------|--------|
| Hover state | 150-200ms | ease-out |
| Focus ring | 150ms | ease-out |
| Expand/collapse | 200-250ms | ease-out-expo |
| Slide in (drawer) | 250-300ms | ease-out-expo |
| Fade in (modal) | 200ms | ease-out |
| Tab indicator slide | 200ms | ease-spring |

### Feedback Patterns

| Component | Feedback | Reduced Motion Alternative |
|-----------|----------|---------------------------|
| Tabs | Indicator slides to active tab | Instant position change |
| Accordion | Content expands smoothly | Instant show/hide |
| Data Table | Sort icon rotates | Instant icon swap |
| Command Palette | Results fade in | Instant appearance |
| Context Menu | Subtle scale-in | Instant appearance |
| Popover | Scale + fade from trigger | Instant appearance |
| Sheet/Drawer | Slide from edge | Instant appearance |
| Dialog | Scale + fade from center | Instant appearance |

### Touch Feedback

- Active state on touch (slight scale or opacity change)
- Haptic feedback option for destructive actions (existing `ControlButton` pattern)
- Visual feedback on long-press for context menu trigger

---

## Implementation Notes for Existing Design System

### Leveraging Radix Primitives

The existing design system uses Radix UI for several components. Recommended Radix primitives for new components:

| Component | Radix Primitive |
|-----------|-----------------|
| Tabs | `@radix-ui/react-tabs` |
| Accordion | `@radix-ui/react-accordion` |
| Popover | `@radix-ui/react-popover` |
| Context Menu | `@radix-ui/react-context-menu` |
| Dialog (Confirmation/Form) | Extend existing Modal (uses `@radix-ui/react-dialog`) |
| Dropdown Menu | `@radix-ui/react-dropdown-menu` |

### Components Without Radix Equivalent

| Component | Recommended Approach |
|-----------|---------------------|
| Data Table | Native HTML table + custom sorting logic (or TanStack Table) |
| Command Palette | `cmdk` library (used by Linear, Raycast, Vercel) |
| Sheet/Drawer | `vaul` library (by Vercel) or extend Modal |

### Consistency with Existing Patterns

1. **CVA Variants:** Use `class-variance-authority` for all variants (size, variant props)
2. **Namespace Pattern:** Use compound components (e.g., `Tabs.List`, `Tabs.Trigger`, `Tabs.Content`)
3. **Dark-first:** All colors use dark mode as default with `[html:not(.dark)_&]:` overrides
4. **Focus ring:** Use existing `focus-visible:ring-2 focus-visible:ring-ember-500/50` pattern
5. **Touch targets:** Minimum 44px for all interactive elements

---

## Sources

### W3C WAI-ARIA Authoring Practices
- [Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)
- [Sortable Table Example](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/)
- [Menu and Menubar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)
- [Menu Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
- [Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [Keyboard Interface Guide](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)

### MDN Web Docs
- [ARIA: menu role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/menu_role)
- [ARIA: aria-expanded](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-expanded)
- [ARIA: aria-sort](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-sort)
- [ARIA: dialog role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/dialog_role)
- [Using the Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using)

### Accessibility Resources
- [A11Y Collective: Building Accessible Tab Interfaces](https://www.a11y-collective.com/blog/accessibility-tab/)
- [A11Y Collective: Accessible Accordion](https://www.a11y-collective.com/blog/accessible-accordion/)
- [A11Y Collective: Mastering Accessible Modals](https://www.a11y-collective.com/blog/modal-accessibility/)
- [Aditus: Accessible Accordion Patterns](https://www.aditus.io/patterns/accordion/)
- [Knowbility: Accessible Slide-Out Navigation](https://knowbility.org/blog/2020/accessible-slide-menus)
- [TestParty: Accessible Modal Dialogs](https://testparty.ai/blog/modal-dialog-accessibility)

### Design Systems
- [Radix Primitives](https://www.radix-ui.com/primitives)
- [Carbon Design System: Accordion Accessibility](https://carbondesignsystem.com/components/accordion/accessibility/)
- [Adobe React Aria: Table](https://react-spectrum.adobe.com/react-aria/Table.html)
- [Telerik: Drawer Accessibility](https://www.telerik.com/design-system/docs/components/drawer/accessibility/)
- [Mantine: Drawer](https://mantine.dev/core/drawer/)

### Command Palette Resources
- [cmdk Library](https://github.com/pacocoursey/cmdk)
- [react-cmdk](https://react-cmdk.com/)
- [Mobbin: Command Palette UI Design](https://mobbin.com/glossary/command-palette)

### Animation and Motion
- [Pope Tech: Design Accessible Animation](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/)
- [GSAP: Accessible Animation](https://gsap.com/resources/a11y/)
- [W3C: Animation from Interactions (WCAG 2.3.3)](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)

### Mobile and Touch
- [Codebridge: Impact of Gestures on Mobile UX](https://www.codebridge.tech/articles/the-impact-of-gestures-on-mobile-user-experience)
- [ACM Queue: Accessibility Considerations for Mobile](https://queue.acm.org/detail.cfm?id=3704628)

---

*Researched: 2026-02-03*
