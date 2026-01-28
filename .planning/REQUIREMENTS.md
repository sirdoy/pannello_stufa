# Requirements: Pannello Stufa

**Defined:** 2026-01-28
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v3.0 Requirements (Design System Evolution)

Requirements for establishing complete, consistent, accessible UI component library.

### Design System Infrastructure

- [ ] **INFRA-01**: Install and configure CVA (class-variance-authority) for type-safe component variants
- [ ] **INFRA-02**: Install Radix UI primitives (Dialog, Dropdown, Select, Tooltip, Slider, Checkbox, Switch)
- [ ] **INFRA-03**: Set up jest-axe for automated accessibility testing
- [ ] **INFRA-04**: Configure ESLint rules to enforce design token usage (block hard-coded colors)
- [ ] **INFRA-05**: Create utility functions (clsx, tailwind-merge, cn helper)
- [ ] **INFRA-06**: Audit and centralize design tokens using Tailwind v4 @theme directive

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
| (To be filled by roadmapper) | | |

**Coverage:**
- v3.0 requirements: 48 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 48 ⚠️

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-28 after initial definition*
