# Roadmap: Pannello Stufa

## Milestones

- v1.0 Push Notifications System - Phases 1-5 (shipped 2026-01-26)
- v2.0 Netatmo Complete Control & Stove Monitoring - Phases 6-10 (shipped 2026-01-28)
- v3.0 Design System Evolution - Phases 11-18 (shipped 2026-01-30)
- v3.1 Design System Compliance - Phases 19-24 (in progress)

## Phases

<details>
<summary>v1.0 Push Notifications System (Phases 1-5) - SHIPPED 2026-01-26</summary>

### Phase 1: Token Persistence
**Goal**: Fix token persistence across browser restarts
**Plans**: 3 plans
- [x] 01-01: Dual persistence implementation (IndexedDB + localStorage)
- [x] 01-02: Token validation on app startup
- [x] 01-03: Multi-device support with fingerprinting

### Phase 2: Monitoring & Observability
**Goal**: Complete delivery visibility and admin dashboard
**Plans**: 6 plans
- [x] 02-01: Delivery status tracking (Sent/Delivered/Displayed)
- [x] 02-02: Error logging infrastructure
- [x] 02-03: Admin dashboard with metrics
- [x] 02-04: Recharts visualization
- [x] 02-05: Test send capability
- [x] 02-06: Device status tracking

### Phase 3: User Preferences
**Goal**: User control over notification behavior
**Plans**: 5 plans
- [x] 03-01: Type toggles (Alerts, Updates, System, Social)
- [x] 03-02: Do Not Disturb hours
- [x] 03-03: Rate limiting per type
- [x] 03-04: Cross-device sync via RTDB
- [x] 03-05: Conservative defaults

### Phase 4: History & Device Management
**Goal**: In-app notification history and device management
**Plans**: 7 plans
- [x] 04-01: Firestore storage infrastructure
- [x] 04-02: In-app inbox UI
- [x] 04-03: Infinite scroll pagination
- [x] 04-04: Filters (type, status)
- [x] 04-05: Device naming
- [x] 04-06: Device list UI
- [x] 04-07: Remove device

### Phase 5: Testing & Automation
**Goal**: Comprehensive E2E tests and automated cleanup
**Plans**: 8 plans
- [x] 05-01: Playwright E2E infrastructure
- [x] 05-02: Token persistence tests
- [x] 05-03: Admin dashboard tests
- [x] 05-04: Preferences tests
- [x] 05-05: History tests
- [x] 05-06: Device management tests
- [x] 05-07: CI/CD integration
- [x] 05-08: Cron job token cleanup

</details>

<details>
<summary>v2.0 Netatmo Complete Control & Stove Monitoring (Phases 6-10) - SHIPPED 2026-01-28</summary>

### Phase 6: Netatmo Schedule Infrastructure
**Goal**: Foundation for schedule management with caching and rate limiting
**Plans**: 5 plans
- [x] 06-01: Firebase schedule cache (5-min TTL)
- [x] 06-02: Per-user rate limiting (400/hr)
- [x] 06-03: Schedule fetching API
- [x] 06-04: Schedule switching API
- [x] 06-05: Atomic OAuth token refresh

### Phase 7: Stove Health Monitoring
**Goal**: Automated stove monitoring via cron with alerting
**Plans**: 5 plans
- [x] 07-01: Cron webhook infrastructure (HMAC security)
- [x] 07-02: Parallel API fetching
- [x] 07-03: Firestore logging (parent/subcollection)
- [x] 07-04: Dead man's switch (10-min threshold)
- [x] 07-05: Environment validation

### Phase 8: Stove-Thermostat Coordination
**Goal**: Intelligent coordination with user intent detection
**Plans**: 5 plans
- [x] 08-01: 2-minute debouncing logic
- [x] 08-02: User intent detection (0.5C tolerance)
- [x] 08-03: Schedule-aware pause calculation
- [x] 08-04: Multi-zone support
- [x] 08-05: Alert deduplication (30-min throttle)

### Phase 9: Schedule Management UI
**Goal**: Complete UI for schedule viewing, switching, and manual overrides
**Plans**: 4 plans
- [x] 09-01: 7-day timeline visualization
- [x] 09-02: Schedule switcher dropdown
- [x] 09-03: Manual override sheet (duration/temp pickers)
- [x] 09-04: Active override badges

### Phase 10: Monitoring Dashboard & Alerts
**Goal**: UI for viewing monitoring status and push notification alerts
**Plans**: 5 plans
- [x] 10-01: Connection status display
- [x] 10-02: Dead man's switch panel
- [x] 10-03: Infinite scroll timeline with filters
- [x] 10-04: Notification system integration
- [x] 10-05: Health alert notification wiring

</details>

<details>
<summary>v3.0 Design System Evolution (Phases 11-18) - SHIPPED 2026-01-30</summary>

### v3.0 Design System Evolution

**Milestone Goal:** Establish complete, consistent, accessible UI component library based on evolved Ember Noir design system, then systematically apply it across all application pages for visual consistency and professional polish.

#### Phase 11: Foundation & Tooling
**Goal**: Establish infrastructure for type-safe, accessible component development
**Depends on**: Nothing (starts v3.0)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06
**Success Criteria** (what must be TRUE):
  1. CVA installed for type-safe variant APIs with autocomplete support
  2. Radix UI primitives are installed and accessible for complex interactive patterns
  3. All new components pass jest-axe automated accessibility tests
  4. ESLint warns on hard-coded colors, enforcing design token usage
  5. Design tokens are centralized and exposed as CSS variables for theming
**Plans**: 3 plans (complete)

Plans:
- [x] 11-01: CVA + cn() utility (clsx, tailwind-merge)
- [x] 11-02: Radix UI + jest-axe accessibility testing
- [x] 11-03: ESLint token enforcement + semantic design tokens

#### Phase 12: Core Interactive Components
**Goal**: Deliver missing table-stakes form controls with Radix UI accessibility
**Depends on**: Phase 11
**Requirements**: COMP-03, COMP-04, COMP-05, COMP-06, COMP-07, COMP-08
**Success Criteria** (what must be TRUE):
  1. User can select options using accessible Checkbox with keyboard navigation and indeterminate state
  2. User can toggle settings using accessible Switch with smooth animation
  3. User can select single option from Radio Group with keyboard navigation
  4. User can enter text in Input component with error states and validation feedback
  5. User can select from dropdown using accessible Select with search capability
  6. User can adjust temperature/brightness using accessible Slider with range support
**Plans**: 3 plans (complete)

Plans:
- [x] 12-01: Checkbox + Switch (Radix primitives with CVA)
- [x] 12-02: RadioGroup + Select (selection patterns)
- [x] 12-03: Input + Slider (value input controls)

#### Phase 13: Foundation Refactoring
**Goal**: Refactor existing foundation components to use CVA and consistent patterns
**Depends on**: Phase 11
**Requirements**: COMP-01, COMP-02, COMP-09, COMP-10, COMP-11, COMP-12
**Success Criteria** (what must be TRUE):
  1. Button component has type-safe CVA variants (ember, subtle, success, danger, outline, ghost)
  2. Card component has liquid glass variants with proper composition pattern (Card.Header, Card.Title, etc.)
  3. All form controls properly associate with Label component for accessibility
  4. Divider component supports solid, dashed, and gradient variants
  5. Heading and Text components implement complete typography system with all variants
**Plans**: 7 plans in 2 waves (complete)

Plans:
- [x] 13-01-PLAN.md: Button CVA refactor with namespace pattern (Button.Icon, Button.Group)
- [x] 13-02-PLAN.md: Card CVA refactor with namespace pattern (Card.Header, Card.Title, etc.)
- [x] 13-03-PLAN.md: Label component (Radix primitive) + Divider CVA refactor
- [x] 13-04-PLAN.md: Heading + Text CVA refactor with typography system
- [x] 13-05-PLAN.md: Migrate legacy Button props across codebase
- [x] 13-06-PLAN.md: Migrate legacy Card liquid prop across codebase
- [x] 13-07-PLAN.md: Gap closure: migrate remaining scheduler Card liquid props

#### Phase 14: Feedback & Layout Components
**Goal**: Deliver complete feedback and layout system for complex UI patterns
**Depends on**: Phase 12, Phase 13
**Requirements**: FEED-01, FEED-02, FEED-03, FEED-04, FEED-05, FEED-06, FEED-07, LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04
**Success Criteria** (what must be TRUE):
  1. User can interact with Modal/Dialog with focus trap, ESC close, and accessible ARIA patterns
  2. User receives contextual help via Tooltip with keyboard trigger support
  3. User sees Toast notifications with dismiss, auto-dismiss, and proper stacking behavior
  4. User sees Spinner/Loading states and Progress indicators during async operations
  5. User sees Empty State components with helpful guidance when no data exists
  6. All pages use consistent PageLayout and DashboardLayout components
  7. Sections and Grid components provide consistent spacing and responsive behavior
**Plans**: 7 plans in 2 waves (complete)

Plans:
- [x] 14-01-PLAN.md: Modal/Dialog with Radix Dialog + CVA sizes + mobile bottom sheet
- [x] 14-02-PLAN.md: Tooltip with Radix Tooltip primitive
- [x] 14-03-PLAN.md: Toast system with Radix Toast + provider pattern + stacking
- [x] 14-04-PLAN.md: Spinner + Progress with Radix Progress
- [x] 14-05-PLAN.md: EmptyState + Banner CVA standardization
- [x] 14-06-PLAN.md: PageLayout + DashboardLayout with collapsible sidebar
- [x] 14-07-PLAN.md: Section + Grid CVA enhancements

#### Phase 15: Smart Home Components Refactor
**Goal**: Standardize domain-specific smart home components with unified APIs
**Depends on**: Phase 13, Phase 14
**Requirements**: DOMAIN-01, DOMAIN-02, DOMAIN-03, DOMAIN-04, DOMAIN-05, DOMAIN-06
**Success Criteria** (what must be TRUE):
  1. All device status displays use standardized StatusCard component with unified API
  2. All device controls use standardized DeviceCard component with consistent structure
  3. All status indicators use standardized Badge component with pulse animation
  4. All increment/decrement controls use standardized ControlButton component
  5. All connection states use unified ConnectionStatus component (online/offline/connecting)
  6. All health indicators use unified HealthIndicator component (ok/warning/error/critical)
**Plans**: 9 plans (complete)

Plans:
- [x] 15-01-PLAN.md: useLongPress hook + ControlButton CVA refactor
- [x] 15-02-PLAN.md: Badge component with CVA and pulse animation
- [x] 15-03-PLAN.md: ConnectionStatus + HealthIndicator components
- [x] 15-04-PLAN.md: SmartHomeCard base component with namespace pattern
- [x] 15-05-PLAN.md: StatusCard extending SmartHomeCard
- [x] 15-06-PLAN.md: DeviceCard refactor with backwards compatibility
- [x] 15-07-PLAN.md: Gap closure: Fix home page Grid props
- [x] 15-08-PLAN.md: Gap closure: Integrate ControlButton into LightsCard
- [x] 15-09-PLAN.md: Gap closure: Add Phase 15 components to design system page

#### Phase 16: Page Migration & Application
**Goal**: Apply design system to all application pages for visual consistency
**Depends on**: Phase 15
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-06, PAGE-07, PAGE-08, PAGE-09, PAGE-10
**Success Criteria** (what must be TRUE):
  1. Dashboard page uses new layout and device card components
  2. Stove page uses new DeviceCard and StatusCard components
  3. Thermostat page uses new form controls and schedule components
  4. Lights page uses new Slider and color picker components
  5. Monitoring dashboard uses new timeline and status components
  6. Notifications page uses new list and badge components
  7. Settings pages use new form components (Input, Select, Switch, Checkbox)
  8. Schedule UI uses new calendar and override components
  9. Admin pages use new dashboard layout and data display components
**Plans**: 11 plans in 5 waves

Note: PAGE-05 (Camera page) does not exist in current codebase - requirement removed.

Plans:
- [x] 16-01-PLAN.md: Dashboard page migration (audit and cleanup)
- [x] 16-02-PLAN.md: Stove page migration (Button, Badge cleanup, preserve theming)
- [x] 16-03-PLAN.md: Thermostat page mode buttons and Grid migration
- [x] 16-04-PLAN.md: Lights page Slider, Badge, and styling migration
- [x] 16-05-PLAN.md: Monitoring page layout migration (Section, Grid)
- [x] 16-06-PLAN.md: Schedule page verification and cleanup
- [x] 16-07-PLAN.md: Notifications settings Banner and Badge migration
- [x] 16-08-PLAN.md: Design system page PageLayout wrapper
- [x] 16-09-PLAN.md: Final verification and human review checkpoint
- [x] 16-10-PLAN.md: Settings pages (devices, theme) migration
- [x] 16-11-PLAN.md: Admin/Debug pages migration (main, logs, transitions)

#### Phase 17: Accessibility & Testing
**Goal**: Ensure WCAG AA compliance and comprehensive accessibility testing
**Depends on**: Phase 16
**Requirements**: A11Y-01, A11Y-02, A11Y-03, A11Y-04, A11Y-05, A11Y-06, A11Y-07, A11Y-08
**Success Criteria** (what must be TRUE):
  1. All interactive components support full keyboard navigation (Tab, Enter, Space, Arrows)
  2. All interactive components have visible ember glow focus indicators
  3. All form controls have proper ARIA labels and associations
  4. All text meets WCAG AA color contrast ratios (4.5:1 text, 3:1 large text)
  5. All touch targets are 44px minimum on mobile devices
  6. All animations respect prefers-reduced-motion user preference
  7. All dynamic content uses ARIA live regions for screen reader announcements
  8. All components pass jest-axe automated accessibility tests
**Plans**: 7 plans in 3 waves

Plans:
- [x] 17-01-PLAN.md: useReducedMotion hook + Spinner/Progress reduced motion tests
- [x] 17-02-PLAN.md: Keyboard navigation tests for Button, Checkbox, Switch, RadioGroup
- [x] 17-03-PLAN.md: Keyboard navigation tests for Select, Slider, Input
- [x] 17-04-PLAN.md: Accessibility tests for Modal, Tooltip, Toast, Banner, EmptyState
- [x] 17-05-PLAN.md: Accessibility tests for Card, Badge, Label, Divider, Heading, Text
- [x] 17-06-PLAN.md: Accessibility tests for smart home components
- [x] 17-07-PLAN.md: Comprehensive accessibility.test.js + verification checkpoint

#### Phase 18: Documentation & Polish
**Goal**: Complete component documentation with interactive examples and accessibility guide
**Depends on**: Phase 17
**Requirements**: DOC-01, DOC-02, DOC-04, DOC-05 (DOC-03 migration guide NOT needed per user decision)
**Success Criteria** (what must be TRUE):
  1. /debug/design-system page displays components with interactive code examples (copy-to-clipboard)
  2. All components have documented APIs (props, variants, usage examples)
  3. docs/design-system.md documents v3.0 patterns and best practices
  4. docs/accessibility.md provides centralized accessibility reference
  5. Each interactive component documents keyboard navigation and ARIA attributes
**Plans**: 4 plans in 2 waves

Plans:
- [x] 18-01-PLAN.md: Documentation infrastructure (CodeBlock, PropTable, AccessibilitySection components)
- [x] 18-02-PLAN.md: Component metadata (component-docs.js with props, keyboard, ARIA)
- [x] 18-03-PLAN.md: Integrate documentation into design-system page
- [x] 18-04-PLAN.md: Update docs/design-system.md and create docs/accessibility.md

</details>

### v3.1 Design System Compliance (In Progress)

**Milestone Goal:** Achieve 100% design system compliance across all device cards and pages. Every raw HTML element (buttons, inputs) replaced with design system components. All styling uses CVA variants instead of inline/hard-coded values.

#### Phase 19: StoveCard Compliance
**Goal**: Replace all raw HTML elements in StoveCard with design system components
**Depends on**: Phase 18
**Requirements**: STOVE-01, STOVE-02, STOVE-03, STOVE-04
**Success Criteria** (what must be TRUE):
  1. User sees scheduler mode buttons (Manuale/Automatico/Semi) rendered using Button component with consistent styling
  2. User sees "Torna in Automatico" action rendered using Button component
  3. Stove status info uses CVA variants for consistent status styling across states
  4. Status display uses standardized StatusCard or Badge components
**Plans**: 2 plans in 1 wave

Plans:
- [x] 19-01-PLAN.md — Button migration for mode action buttons (Torna in Automatico, Configura Pianificazione)
- [x] 19-02-PLAN.md — Status display CVA refactor with Badge and HealthIndicator

#### Phase 20: ThermostatCard Compliance
**Goal**: Replace all raw HTML elements in ThermostatCard with design system components
**Depends on**: Phase 19
**Requirements**: THERM-01, THERM-02, THERM-03, THERM-04
**Success Criteria** (what must be TRUE):
  1. User sees mode selection grid buttons rendered using Button component with proper variants
  2. User sees calibrate action button rendered using Button component
  3. Mode buttons use consistent ButtonGroup or variant pattern for visual grouping
  4. Temperature display uses standardized component pattern with consistent typography
**Plans**: 2 plans in 1 wave

Plans:
- [x] 20-01-PLAN.md — Button migration for mode grid (4 buttons) and calibrate action
- [x] 20-02-PLAN.md — Temperature display verification and data-component standardization

#### Phase 21: LightsCard Compliance
**Goal**: Replace all raw HTML elements in LightsCard with design system components
**Depends on**: Phase 20
**Requirements**: LIGHT-01, LIGHT-02, LIGHT-03, LIGHT-04
**Success Criteria** (what must be TRUE):
  1. User can adjust brightness using design system Slider component with proper styling
  2. User sees scene buttons rendered using Button component with consistent variants
  3. Adaptive styling (based on light state) uses CVA variants instead of inline styles
  4. Brightness panel uses standardized component pattern with consistent layout
**Plans**: TBD

Plans:
- [ ] 21-01: LightsCard Slider migration (replace raw input range)
- [ ] 21-02: LightsCard Button migration (scene buttons + CVA adaptive styling)

#### Phase 22: CameraCard Compliance
**Goal**: Replace all raw HTML elements in camera components with design system components
**Depends on**: Phase 21
**Requirements**: CAM-01, CAM-02, CAM-03
**Success Criteria** (what must be TRUE):
  1. CameraCard interactive elements use Button component with proper styling
  2. EventPreviewModal close and navigation buttons use Button component
  3. HlsPlayer controls use Button component for play/pause/fullscreen actions
**Plans**: TBD

Plans:
- [ ] 22-01: CameraCard and EventPreviewModal Button migration
- [ ] 22-02: HlsPlayer Button migration for player controls

#### Phase 23: Thermostat Page Compliance
**Goal**: Replace all raw HTML elements on thermostat page with design system components
**Depends on**: Phase 22
**Requirements**: PAGE-01, PAGE-02, PAGE-03
**Success Criteria** (what must be TRUE):
  1. User sees mode buttons on thermostat page rendered using Button component variants
  2. User sees info boxes using standardized InfoBox or Card component
  3. Thermostat page wrapped in PageLayout for consistent page structure
**Plans**: TBD

Plans:
- [ ] 23-01: Thermostat page Button migration (mode buttons)
- [ ] 23-02: Thermostat page InfoBox + PageLayout wrapper

#### Phase 24: Verification & Polish
**Goal**: Verify complete design system compliance across all device components
**Depends on**: Phase 23
**Requirements**: VERIFY-01, VERIFY-02, VERIFY-03, VERIFY-04
**Success Criteria** (what must be TRUE):
  1. All device cards pass ESLint with no hard-coded color warnings
  2. Zero raw `<button>` elements remain in device components (all use Button)
  3. Zero raw `<input>` elements remain in device components (all use Input/Slider/etc)
  4. Visual inspection confirms consistent styling across all device cards
**Plans**: TBD

Plans:
- [ ] 24-01: ESLint verification and hard-coded color cleanup
- [ ] 24-02: Raw element elimination verification
- [ ] 24-03: Visual consistency verification and final polish

## Progress

**Execution Order:**
Phases execute in numeric order: 19 -> 20 -> 21 -> 22 -> 23 -> 24

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Token Persistence | v1.0 | 3/3 | Complete | 2026-01-24 |
| 2. Monitoring & Observability | v1.0 | 6/6 | Complete | 2026-01-25 |
| 3. User Preferences | v1.0 | 5/5 | Complete | 2026-01-25 |
| 4. History & Device Management | v1.0 | 7/7 | Complete | 2026-01-25 |
| 5. Testing & Automation | v1.0 | 8/8 | Complete | 2026-01-26 |
| 6. Netatmo Schedule Infrastructure | v2.0 | 5/5 | Complete | 2026-01-27 |
| 7. Stove Health Monitoring | v2.0 | 5/5 | Complete | 2026-01-27 |
| 8. Stove-Thermostat Coordination | v2.0 | 5/5 | Complete | 2026-01-27 |
| 9. Schedule Management UI | v2.0 | 4/4 | Complete | 2026-01-28 |
| 10. Monitoring Dashboard & Alerts | v2.0 | 5/5 | Complete | 2026-01-28 |
| 11. Foundation & Tooling | v3.0 | 3/3 | Complete | 2026-01-28 |
| 12. Core Interactive Components | v3.0 | 3/3 | Complete | 2026-01-28 |
| 13. Foundation Refactoring | v3.0 | 7/7 | Complete | 2026-01-29 |
| 14. Feedback & Layout Components | v3.0 | 7/7 | Complete | 2026-01-29 |
| 15. Smart Home Components Refactor | v3.0 | 9/9 | Complete | 2026-01-29 |
| 16. Page Migration & Application | v3.0 | 11/11 | Complete | 2026-01-30 |
| 17. Accessibility & Testing | v3.0 | 7/7 | Complete | 2026-01-30 |
| 18. Documentation & Polish | v3.0 | 4/4 | Complete | 2026-01-30 |
| 19. StoveCard Compliance | v3.1 | 2/2 | Complete | 2026-01-31 |
| 20. ThermostatCard Compliance | v3.1 | 2/2 | Complete | 2026-01-31 |
| 21. LightsCard Compliance | v3.1 | 0/2 | Not started | - |
| 22. CameraCard Compliance | v3.1 | 0/2 | Not started | - |
| 23. Thermostat Page Compliance | v3.1 | 0/2 | Not started | - |
| 24. Verification & Polish | v3.1 | 0/3 | Not started | - |
