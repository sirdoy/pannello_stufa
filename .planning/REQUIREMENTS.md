# Requirements: Pannello Stufa v4.0

**Defined:** 2026-02-03
**Core Value:** Advanced UI components that enhance device control UX with polished interactions and accessibility

## v4.0 Requirements

Requirements for Advanced UI Components milestone. Each maps to roadmap phases.

### Tabs

- [x] **TABS-01**: User can switch between tabs using click/tap
- [x] **TABS-02**: User can navigate tabs with arrow keys (left/right for horizontal)
- [x] **TABS-03**: Active tab is visually distinct with focus indicator
- [x] **TABS-04**: Screen reader announces tab role and selection state
- [x] **TABS-05**: Tabs support both horizontal and vertical orientation

### Accordion

- [x] **ACCR-01**: User can expand/collapse sections by clicking header
- [x] **ACCR-02**: User can toggle sections with Enter/Space keys
- [x] **ACCR-03**: Expanded state communicated via aria-expanded
- [x] **ACCR-04**: Accordion supports single-open and multiple-open modes
- [x] **ACCR-05**: Collapse/expand has smooth height animation

### Data Table

- [x] **DTBL-01**: User can sort columns by clicking header
- [x] **DTBL-02**: Sort direction indicated visually (asc/desc icons)
- [x] **DTBL-03**: User can select rows via checkbox
- [x] **DTBL-04**: User can navigate cells with arrow keys
- [x] **DTBL-05**: User can filter columns via filter controls
- [x] **DTBL-06**: User can paginate large datasets
- [x] **DTBL-07**: User can expand rows to see details
- [x] **DTBL-08**: Screen reader announces sort state and selection
- [x] **DTBL-09**: Table is responsive (horizontal scroll on mobile)

### Command Palette

- [x] **CMDK-01**: User can open palette with Cmd+K (Mac) or Ctrl+K (Windows)
- [x] **CMDK-02**: User can search commands with fuzzy matching
- [x] **CMDK-03**: User can navigate results with arrow keys
- [x] **CMDK-04**: User can execute command with Enter
- [x] **CMDK-05**: Palette shows recent commands
- [x] **CMDK-06**: Escape closes palette and returns focus

### Context Menu

- [x] **CTXM-01**: User can open menu via right-click on desktop
- [x] **CTXM-02**: User can open menu via long-press on mobile
- [x] **CTXM-03**: User can navigate menu items with arrow keys
- [x] **CTXM-04**: User can select item with Enter
- [x] **CTXM-05**: Escape closes menu
- [x] **CTXM-06**: Menu positions within viewport (collision detection)

### Popover

- [x] **POPV-01**: User can open popover by clicking trigger
- [x] **POPV-02**: Popover positions automatically (top/bottom/left/right)
- [x] **POPV-03**: Click outside closes popover
- [x] **POPV-04**: Escape closes popover
- [x] **POPV-05**: Focus trapped within popover when open

### Sheet/Drawer

- [x] **SHEE-01**: Sheet slides in from edge (bottom/right)
- [x] **SHEE-02**: Backdrop appears and click closes sheet
- [x] **SHEE-03**: Escape closes sheet
- [x] **SHEE-04**: Focus trapped within sheet
- [x] **SHEE-05**: Focus returns to trigger on close

### Dialog Patterns

- [x] **DLGC-01**: Confirmation dialog has cancel/confirm buttons
- [x] **DLGC-02**: Destructive actions use danger styling
- [x] **DLGC-03**: Focus starts on cancel button (safe default)
- [x] **DLGF-01**: Form modal integrates with form validation
- [x] **DLGF-02**: Form modal shows loading state during submit
- [x] **DLGF-03**: Form modal displays validation errors inline

### Micro-interactions

- [x] **ANIM-01**: Components use polished CSS transitions (ease curves)
- [x] **ANIM-02**: Stagger effects on list/grid items
- [x] **ANIM-03**: Spring physics for interactive elements
- [x] **ANIM-04**: Reduced motion respected (prefers-reduced-motion)

### Quick Actions

- [x] **QACT-01**: Device cards have visible quick action icon buttons
- [x] **QACT-02**: Device cards support context menu on right-click/long-press
- [x] **QACT-03**: Quick actions are consistent across all device types

### Application

- [x] **APPL-01**: Tabs used on thermostat page (Schedule/Manual/History)
- [x] **APPL-02**: Accordion used for expandable device details
- [x] **APPL-03**: Data Table used for notification history
- [x] **APPL-04**: Command Palette accessible from any page
- [x] **APPL-05**: Context Menu on all device cards
- [x] **APPL-06**: Sheet used for mobile-friendly forms
- [x] **APPL-07**: Confirmation Dialog for destructive actions
- [x] **APPL-08**: All pages use new components consistently

## Future Requirements

Deferred to v4.1 or later.

### Advanced Features

- **TABS-ADV-01**: Animated tab indicator sliding between tabs
- **TABS-ADV-02**: Disabled tab state with visual and aria indication
- **ACCR-ADV-01**: Custom chevron/icon for expand indicator
- **CMDK-ADV-01**: Nested command groups/subcommands
- **CMDK-ADV-02**: Keyboard shortcut hints next to commands
- **CTXM-ADV-01**: Nested submenus
- **CTXM-ADV-02**: Keyboard shortcut display
- **SHEE-ADV-01**: Swipe to dismiss gesture
- **SHEE-ADV-02**: Snap points for partial open states

## Out of Scope

Explicitly excluded from v4.0. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Drag-and-drop reorder | High complexity, defer to customization milestone |
| Virtualized Data Table | Only needed for 100+ rows, current use cases are smaller |
| Real-time collaborative editing | Not applicable to smart home control |
| Voice commands | Accessibility enhancement for future |
| Framer Motion animations | Bundle size concern, CSS sufficient for v4.0 scope |
| TanStack Table advanced (grouping, column resize) | Over-engineering for current needs |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TABS-01 | Phase 30 | Complete |
| TABS-02 | Phase 30 | Complete |
| TABS-03 | Phase 30 | Complete |
| TABS-04 | Phase 30 | Complete |
| TABS-05 | Phase 30 | Complete |
| ACCR-01 | Phase 31 | Complete |
| ACCR-02 | Phase 31 | Complete |
| ACCR-03 | Phase 31 | Complete |
| ACCR-04 | Phase 31 | Complete |
| ACCR-05 | Phase 31 | Complete |
| DTBL-01 | Phase 34 | Complete |
| DTBL-02 | Phase 34 | Complete |
| DTBL-03 | Phase 34 | Complete |
| DTBL-04 | Phase 34 | Complete |
| DTBL-05 | Phase 34 | Complete |
| DTBL-06 | Phase 34 | Complete |
| DTBL-07 | Phase 34 | Complete |
| DTBL-08 | Phase 34 | Complete |
| DTBL-09 | Phase 34 | Complete |
| CMDK-01 | Phase 32 | Complete |
| CMDK-02 | Phase 32 | Complete |
| CMDK-03 | Phase 32 | Complete |
| CMDK-04 | Phase 32 | Complete |
| CMDK-05 | Phase 32 | Complete |
| CMDK-06 | Phase 32 | Complete |
| CTXM-01 | Phase 32 | Complete |
| CTXM-02 | Phase 32 | Complete |
| CTXM-03 | Phase 32 | Complete |
| CTXM-04 | Phase 32 | Complete |
| CTXM-05 | Phase 32 | Complete |
| CTXM-06 | Phase 32 | Complete |
| POPV-01 | Phase 30 | Complete |
| POPV-02 | Phase 30 | Complete |
| POPV-03 | Phase 30 | Complete |
| POPV-04 | Phase 30 | Complete |
| POPV-05 | Phase 30 | Complete |
| SHEE-01 | Phase 31 | Complete |
| SHEE-02 | Phase 31 | Complete |
| SHEE-03 | Phase 31 | Complete |
| SHEE-04 | Phase 31 | Complete |
| SHEE-05 | Phase 31 | Complete |
| DLGC-01 | Phase 33 | Complete |
| DLGC-02 | Phase 33 | Complete |
| DLGC-03 | Phase 33 | Complete |
| DLGF-01 | Phase 33 | Complete |
| DLGF-02 | Phase 33 | Complete |
| DLGF-03 | Phase 33 | Complete |
| ANIM-01 | Phase 35 | Complete |
| ANIM-02 | Phase 35 | Complete |
| ANIM-03 | Phase 35 | Complete |
| ANIM-04 | Phase 35 | Complete |
| QACT-01 | Phase 36 | Complete |
| QACT-02 | Phase 36 | Complete |
| QACT-03 | Phase 36 | Complete |
| APPL-01 | Phase 36 | Complete |
| APPL-02 | Phase 36 | Complete |
| APPL-03 | Phase 36 | Complete |
| APPL-04 | Phase 36 | Complete |
| APPL-05 | Phase 36 | Complete |
| APPL-06 | Phase 36 | Complete |
| APPL-07 | Phase 36 | Complete |
| APPL-08 | Phase 36 | Complete |

**Coverage:**
- v4.0 requirements: 55 total
- Mapped to phases: 55
- Unmapped: 0

---
*Requirements defined: 2026-02-03*
*Last updated: 2026-02-05 after Phase 36 completion*
*All v4.0 requirements complete*
