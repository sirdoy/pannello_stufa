# Requirements: Pannello Stufa

**Defined:** 2026-01-28
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v3.0 Requirements (Design System Evolution)

Requirements for establishing complete, consistent, accessible UI component library.

### Design System Infrastructure

- [x] **INFRA-01**: Install and configure CVA (class-variance-authority) for type-safe component variants
- [x] **INFRA-02**: Install Radix UI primitives (Dialog, Dropdown, Select, Tooltip, Slider, Checkbox, Switch)
- [x] **INFRA-03**: Set up jest-axe for automated accessibility testing
- [x] **INFRA-04**: Configure ESLint rules to enforce design token usage (block hard-coded colors)
- [x] **INFRA-05**: Create utility functions (clsx, tailwind-merge, cn helper)
- [x] **INFRA-06**: Audit and centralize design tokens using Tailwind v4 @theme directive

### Foundation Components (Primitives)

- [ ] **COMP-01**: Refactor Button with CVA variants (primary, secondary, success, danger, outline, ghost)
- [ ] **COMP-02**: Refactor Card with liquid glass variants and proper composition
- [ ] **COMP-03**: Create Checkbox with Radix UI primitive (accessible, keyboard nav, indeterminate state)
- [ ] **COMP-04**: Create Switch/Toggle with Radix UI primitive (accessible, animated)
- [ ] **COMP-05**: Create Radio Group component (accessible, keyboard navigation)
- [ ] **COMP-06**: Create Input component (text, number, email, password variants with error states)
- [ ] **COMP-07**: Create Select/Dropdown with Radix UI primitive (accessible, searchable, multi-select)
- [ ] **COMP-08**: Create Slider with Radix UI primitive (accessible, range support)
- [ ] **COMP-09**: Create Label component (accessible association with form controls)
- [ ] **COMP-10**: Create Divider component (solid, dashed, gradient variants)
- [ ] **COMP-11**: Enhance Heading component with all variants (default, gradient, subtle, ember)
- [ ] **COMP-12**: Enhance Text component with typography variants (body, secondary, tertiary)

### Feedback Components

- [ ] **FEED-01**: Create Modal/Dialog with Radix UI primitive (accessible, focus trap, ESC close)
- [ ] **FEED-02**: Create Tooltip with Radix UI primitive (accessible, keyboard trigger)
- [ ] **FEED-03**: Refactor Toast system with dismiss, auto-dismiss, stacking
- [ ] **FEED-04**: Create Spinner/Loading component (sizes, ember variant)
- [ ] **FEED-05**: Create Progress component (linear, circular variants)
- [ ] **FEED-06**: Create Empty State component (icon, title, description, action)
- [ ] **FEED-07**: Standardize Banner component (info, warning, error, success variants)

### Layout Components

- [ ] **LAYOUT-01**: Create PageLayout component (consistent header, content, footer structure)
- [ ] **LAYOUT-02**: Create DashboardLayout component (grid system for device cards)
- [ ] **LAYOUT-03**: Enhance Section component (consistent spacing, title, description)
- [ ] **LAYOUT-04**: Enhance Grid component (responsive columns, gap variants)

### Smart Home Components Refactor

- [ ] **DOMAIN-01**: Standardize StatusCard component (unified API for all device status displays)
- [ ] **DOMAIN-02**: Standardize DeviceCard component (consistent structure for stove/thermostat/lights)
- [ ] **DOMAIN-03**: Extract and standardize Badge component (status indicators with pulse animation)
- [ ] **DOMAIN-04**: Standardize ControlButton component (increment/decrement with variants)
- [ ] **DOMAIN-05**: Create unified ConnectionStatus component (online/offline/connecting states)
- [ ] **DOMAIN-06**: Create unified HealthIndicator component (ok/warning/error/critical states)

### Page Refactoring & Application

- [ ] **PAGE-01**: Refactor Dashboard page to use new components
- [ ] **PAGE-02**: Refactor Stove page to use new DeviceCard and StatusCard
- [ ] **PAGE-03**: Refactor Thermostat page to use new components
- [ ] **PAGE-04**: Refactor Lights page to use new components
- [ ] **PAGE-05**: Refactor Camera page to use new components
- [ ] **PAGE-06**: Refactor Monitoring dashboard to use new components
- [ ] **PAGE-07**: Refactor Notifications page to use new components
- [ ] **PAGE-08**: Refactor Settings page to use new form components
- [ ] **PAGE-09**: Refactor Schedule UI to use new components
- [ ] **PAGE-10**: Refactor Admin pages to use new components

### Accessibility & Testing

- [ ] **A11Y-01**: All interactive components have keyboard navigation
- [ ] **A11Y-02**: All interactive components have focus indicators (ember glow ring)
- [ ] **A11Y-03**: All form controls have proper ARIA labels and associations
- [ ] **A11Y-04**: Color contrast meets WCAG AA (4.5:1 text, 3:1 large text)
- [ ] **A11Y-05**: Touch targets are 44px minimum on mobile
- [ ] **A11Y-06**: Reduced motion preferences respected (prefers-reduced-motion)
- [ ] **A11Y-07**: Screen reader support for dynamic content (ARIA live regions)
- [ ] **A11Y-08**: All components pass jest-axe automated tests

### Documentation

- [ ] **DOC-01**: Update /debug/design-system page with all new components
- [ ] **DOC-02**: Document component APIs (props, variants, examples)
- [ ] **DOC-03**: Create migration guide for developers
- [ ] **DOC-04**: Update docs/design-system.md with new patterns
- [ ] **DOC-05**: Document accessibility features per component

## v3.1+ Requirements (Future)

Deferred to post-v3.0 milestones.

### Advanced Components
- **ADV-01**: Tabs component (accessible, keyboard navigation)
- **ADV-02**: Accordion component (single/multiple expand)
- **ADV-03**: Command Palette (search, keyboard shortcuts)
- **ADV-04**: Combobox (autocomplete, filtering)
- **ADV-05**: Data Table (sorting, filtering, pagination)

### Enhanced Features
- **ENH-01**: Drag and Drop support
- **ENH-02**: Virtual scrolling for large lists
- **ENH-03**: Animation library (Framer Motion integration)
- **ENH-04**: Form validation library integration (React Hook Form + Zod)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Storybook | React 19 compatibility issues, `/debug/design-system` sufficient for single-developer project |
| CSS-in-JS | Tailwind CSS already configured and working well |
| Component library npm package | Not planning to publish, internal use only |
| Visual regression testing | Defer to post-v3.0, manual testing sufficient initially |
| TypeScript conversion | JavaScript working well, TypeScript adds conversion effort without immediate benefit |
| Full theming engine | Two themes (dark/light) sufficient, no need for arbitrary theme customization |
| Kitchen sink components | Avoid 35+ prop components, keep APIs simple |
| Premature abstractions | Build for actual use cases, not hypothetical future needs |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 11 | Complete |
| INFRA-02 | Phase 11 | Complete |
| INFRA-03 | Phase 11 | Complete |
| INFRA-04 | Phase 11 | Complete |
| INFRA-05 | Phase 11 | Complete |
| INFRA-06 | Phase 11 | Complete |
| COMP-03 | Phase 12 | Pending |
| COMP-04 | Phase 12 | Pending |
| COMP-05 | Phase 12 | Pending |
| COMP-06 | Phase 12 | Pending |
| COMP-07 | Phase 12 | Pending |
| COMP-08 | Phase 12 | Pending |
| COMP-01 | Phase 13 | Pending |
| COMP-02 | Phase 13 | Pending |
| COMP-09 | Phase 13 | Pending |
| COMP-10 | Phase 13 | Pending |
| COMP-11 | Phase 13 | Pending |
| COMP-12 | Phase 13 | Pending |
| FEED-01 | Phase 14 | Pending |
| FEED-02 | Phase 14 | Pending |
| FEED-03 | Phase 14 | Pending |
| FEED-04 | Phase 14 | Pending |
| FEED-05 | Phase 14 | Pending |
| FEED-06 | Phase 14 | Pending |
| FEED-07 | Phase 14 | Pending |
| LAYOUT-01 | Phase 14 | Pending |
| LAYOUT-02 | Phase 14 | Pending |
| LAYOUT-03 | Phase 14 | Pending |
| LAYOUT-04 | Phase 14 | Pending |
| DOMAIN-01 | Phase 15 | Pending |
| DOMAIN-02 | Phase 15 | Pending |
| DOMAIN-03 | Phase 15 | Pending |
| DOMAIN-04 | Phase 15 | Pending |
| DOMAIN-05 | Phase 15 | Pending |
| DOMAIN-06 | Phase 15 | Pending |
| PAGE-01 | Phase 16 | Pending |
| PAGE-02 | Phase 16 | Pending |
| PAGE-03 | Phase 16 | Pending |
| PAGE-04 | Phase 16 | Pending |
| PAGE-05 | Phase 16 | Pending |
| PAGE-06 | Phase 16 | Pending |
| PAGE-07 | Phase 16 | Pending |
| PAGE-08 | Phase 16 | Pending |
| PAGE-09 | Phase 16 | Pending |
| PAGE-10 | Phase 16 | Pending |
| A11Y-01 | Phase 17 | Pending |
| A11Y-02 | Phase 17 | Pending |
| A11Y-03 | Phase 17 | Pending |
| A11Y-04 | Phase 17 | Pending |
| A11Y-05 | Phase 17 | Pending |
| A11Y-06 | Phase 17 | Pending |
| A11Y-07 | Phase 17 | Pending |
| A11Y-08 | Phase 17 | Pending |
| DOC-01 | Phase 18 | Pending |
| DOC-02 | Phase 18 | Pending |
| DOC-03 | Phase 18 | Pending |
| DOC-04 | Phase 18 | Pending |
| DOC-05 | Phase 18 | Pending |

**Coverage:**
- v3.0 requirements: 48 total
- Mapped to phases: 48 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-28 after roadmap creation*
