# Roadmap: Pannello Stufa v4.0 Advanced UI Components

## Overview

This milestone adds 8 advanced UI components to the Ember Noir design system: Tabs, Accordion, Data Table, Command Palette, Context Menu, Popover, Sheet, and enhanced Dialog patterns. The approach builds from foundation (already-installed Radix primitives) through increasingly complex components, with immediate application after each component is built. The milestone concludes with a micro-interactions system and application-wide integration to ensure consistent UX across all pages.

## Milestones

- **v4.0 Advanced UI Components** - Phases 30-36 (current)

## Phases

- [x] **Phase 30: Foundation Components** - Popover and Tabs (zero new dependencies)
- [x] **Phase 31: Expandable Components** - Accordion and Sheet (new Radix packages)
- [x] **Phase 32: Action Components** - Context Menu and Command Palette (mobile critical)
- [x] **Phase 33: Dialog Patterns** - Confirmation and Form Modal
- [x] **Phase 34: Data Table** - Full-featured sortable, filterable, paginated table
- [x] **Phase 35: Micro-interactions** - CSS animation system with reduced motion support
- [ ] **Phase 36: Application Integration** - Quick actions and application-wide rollout

## Phase Details

### Phase 30: Foundation Components
**Goal**: Establish component patterns with Popover and Tabs using already-installed Radix primitives
**Depends on**: Nothing (first phase of v4.0)
**Requirements**: POPV-01, POPV-02, POPV-03, POPV-04, POPV-05, TABS-01, TABS-02, TABS-03, TABS-04, TABS-05
**Success Criteria** (what must be TRUE):
  1. User can click trigger to open/close Popover and it positions correctly within viewport
  2. User can navigate Popover with keyboard (Escape closes, focus trapped)
  3. User can switch between tabs by clicking and using arrow keys
  4. Screen reader announces tab role, selection state, and panel association
  5. Tabs work in both horizontal and vertical orientations
**Plans**: 3 plans in 2 waves

Plans:
- [x] 30-01-PLAN.md - Popover component with CVA variants and accessibility (Wave 1)
- [x] 30-02-PLAN.md - Tabs compound component with sliding indicator (Wave 1)
- [x] 30-03-PLAN.md - Apply Tabs to thermostat page (Schedule/Manual/History) (Wave 2)

---

### Phase 31: Expandable Components
**Goal**: Add Accordion and Sheet components for expandable content and mobile-friendly panels
**Depends on**: Phase 30 (uses established patterns)
**Requirements**: ACCR-01, ACCR-02, ACCR-03, ACCR-04, ACCR-05, SHEE-01, SHEE-02, SHEE-03, SHEE-04, SHEE-05
**Success Criteria** (what must be TRUE):
  1. User can expand/collapse Accordion sections with click or Enter/Space
  2. Accordion supports both single-open and multiple-open modes with smooth animation
  3. Sheet slides in from edge with backdrop and can be closed via backdrop click or Escape
  4. Focus is trapped within Sheet and returns to trigger on close
  5. Screen reader announces expanded/collapsed state via aria-expanded
**Plans**: 3 plans in 2 waves

Plans:
- [x] 31-01-PLAN.md - Accordion component with animation and modes (Wave 1)
- [x] 31-02-PLAN.md - Sheet component extending Modal foundation (Wave 1)
- [x] 31-03-PLAN.md - Apply Accordion and Sheet to design system page (Wave 2)

---

### Phase 32: Action Components
**Goal**: Add Context Menu and Command Palette for quick actions and power-user navigation
**Depends on**: Phase 31 (Modal foundation for Command Palette)
**Requirements**: CTXM-01, CTXM-02, CTXM-03, CTXM-04, CTXM-05, CTXM-06, CMDK-01, CMDK-02, CMDK-03, CMDK-04, CMDK-06 (CMDK-05 deferred per user decision: no recent commands)
**Success Criteria** (what must be TRUE):
  1. User can open Context Menu via right-click (desktop) or long-press (mobile)
  2. Context Menu positions within viewport and supports keyboard navigation
  3. User can open Command Palette with Cmd+K/Ctrl+K from any page
  4. Command Palette supports fuzzy search with arrow key navigation and Enter to execute
  5. Both components close on Escape and restore focus correctly
**Plans**: 3 plans in 2 waves

Plans:
- [x] 32-01-PLAN.md - RightClickMenu component with Radix Context Menu (Wave 1)
- [x] 32-02-PLAN.md - CommandPalette with cmdk integration and Kbd component (Wave 1)
- [x] 32-03-PLAN.md - Add Action Components to design system page (Wave 2)

---

### Phase 33: Dialog Patterns
**Goal**: Create standardized Confirmation Dialog and Form Modal patterns
**Depends on**: Phase 30 (Popover patterns), existing Modal foundation
**Requirements**: DLGC-01, DLGC-02, DLGC-03, DLGF-01, DLGF-02, DLGF-03
**Success Criteria** (what must be TRUE):
  1. Confirmation Dialog has cancel/confirm buttons with focus on cancel (safe default)
  2. Destructive actions use danger styling on confirm button
  3. Form Modal integrates with React Hook Form validation
  4. Form Modal shows loading state during submit and validation errors inline
**Plans**: 3 plans in 2 waves

Plans:
- [x] 33-01-PLAN.md - ConfirmationDialog component with danger variant (Wave 1)
- [x] 33-02-PLAN.md - FormModal component with validation integration (Wave 1)
- [x] 33-03-PLAN.md - Add Dialog Patterns to design system page (Wave 2)

---

### Phase 34: Data Table
**Goal**: Build full-featured Data Table with sorting, filtering, selection, and pagination
**Depends on**: Phase 30 (Popover for filters), Phase 32 (Context Menu for row actions)
**Requirements**: DTBL-01, DTBL-02, DTBL-03, DTBL-04, DTBL-05, DTBL-06, DTBL-07, DTBL-08, DTBL-09
**Success Criteria** (what must be TRUE):
  1. User can sort columns by clicking headers with visual direction indicators
  2. User can select rows via checkbox and navigate cells with arrow keys
  3. User can filter columns and paginate through large datasets
  4. User can expand rows to see additional details
  5. Table is responsive (horizontal scroll on mobile) with proper ARIA announcements
**Plans**: 4 plans in 4 waves

Plans:
- [x] 34-01-PLAN.md - DataTable base with TanStack Table, sorting, and ARIA (Wave 1)
- [x] 34-02-PLAN.md - DataTable selection, filtering, and pagination (Wave 2)
- [x] 34-03-PLAN.md - DataTable row expansion and responsive behavior (Wave 3)
- [x] 34-04-PLAN.md - Apply DataTable to notification history (Wave 4)

---

### Phase 35: Micro-interactions
**Goal**: Implement polished CSS animation system with reduced motion support
**Depends on**: Phases 30-34 (components to animate)
**Requirements**: ANIM-01, ANIM-02, ANIM-03, ANIM-04
**Success Criteria** (what must be TRUE):
  1. Components use polished CSS transitions with consistent ease curves
  2. List/grid items have stagger animation effects
  3. Interactive elements use spring physics for natural feel
  4. All animations respect prefers-reduced-motion (disabled or reduced)
**Plans**: 4 plans in 3 waves

Plans:
- [x] 35-01-PLAN.md - Animation tokens and stagger system foundation (Wave 1)
- [x] 35-02-PLAN.md - Button, Card, Switch with animation tokens (Wave 2)
- [x] 35-03-PLAN.md - Badge, Tabs, Accordion with animation tokens (Wave 2)
- [x] 35-04-PLAN.md - Device list stagger animations (Wave 3)

---

### Phase 36: Application Integration
**Goal**: Add quick actions to device cards and ensure consistent component usage across all pages
**Depends on**: All previous phases (uses all components)
**Requirements**: QACT-01, QACT-02, QACT-03, APPL-01, APPL-02, APPL-03, APPL-04, APPL-05, APPL-06, APPL-07, APPL-08
**Success Criteria** (what must be TRUE):
  1. Device cards have visible quick action icon buttons
  2. Device cards support context menu on right-click/long-press
  3. Quick actions are consistent across all device types (Stove, Thermostat, Lights, Camera)
  4. Command Palette accessible from any page with relevant commands
  5. All pages use new components consistently (verified via audit)
**Plans**: 3 plans in 2 waves

Plans:
- [ ] 36-01-PLAN.md - Quick actions and context menu for device cards (Wave 1)
- [ ] 36-02-PLAN.md - Command Palette global commands and navigation (Wave 1)
- [ ] 36-03-PLAN.md - Application-wide audit and component consistency (Wave 2)

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 30. Foundation Components | 3/3 | Complete | 2026-02-04 |
| 31. Expandable Components | 3/3 | Complete | 2026-02-04 |
| 32. Action Components | 3/3 | Complete | 2026-02-04 |
| 33. Dialog Patterns | 3/3 | Complete | 2026-02-04 |
| 34. Data Table | 4/4 | Complete | 2026-02-05 |
| 35. Micro-interactions | 4/4 | Complete | 2026-02-05 |
| 36. Application Integration | 0/3 | Planned | - |

**Total:** 20/24 plans (83%)

---

*Roadmap created: 2026-02-03*
*Phase 30 planned: 2026-02-03*
*Phase 30 completed: 2026-02-04*
*Phase 31 planned: 2026-02-04*
*Phase 31 completed: 2026-02-04*
*Phase 32 planned: 2026-02-04*
*Phase 32 completed: 2026-02-04*
*Phase 33 planned: 2026-02-04*
*Phase 33 completed: 2026-02-04*
*Phase 34 planned: 2026-02-04*
*Phase 34 completed: 2026-02-05*
*Phase 35 planned: 2026-02-05*
*Phase 35 completed: 2026-02-05*
*Phase 36 planned: 2026-02-05*
*Milestone: v4.0 Advanced UI Components*
*Requirements coverage: 55/55 (100%)*
