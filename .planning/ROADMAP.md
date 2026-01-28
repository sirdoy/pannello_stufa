# Roadmap: Pannello Stufa

## Milestones

- ✅ **v1.0 Push Notifications System** - Phases 1-5 (shipped 2026-01-26)
- ✅ **v2.0 Netatmo Complete Control & Stove Monitoring** - Phases 6-10 (shipped 2026-01-28)
- 🚧 **v3.0 Design System Evolution** - Phases 11-18 (in progress)

## Phases

<details>
<summary>✅ v1.0 Push Notifications System (Phases 1-5) - SHIPPED 2026-01-26</summary>

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
<summary>✅ v2.0 Netatmo Complete Control & Stove Monitoring (Phases 6-10) - SHIPPED 2026-01-28</summary>

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
- [x] 08-02: User intent detection (0.5°C tolerance)
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

### 🚧 v3.0 Design System Evolution (In Progress)

**Milestone Goal:** Establish complete, consistent, accessible UI component library based on evolved Ember Noir design system, then systematically apply it across all application pages for visual consistency and professional polish.

#### Phase 11: Foundation & Tooling ✓
**Goal**: Establish infrastructure for type-safe, accessible component development
**Depends on**: Nothing (starts v3.0)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06
**Success Criteria** (what must be TRUE):
  1. ✓ CVA installed for type-safe variant APIs with autocomplete support
  2. ✓ Radix UI primitives are installed and accessible for complex interactive patterns
  3. ✓ All new components pass jest-axe automated accessibility tests
  4. ✓ ESLint warns on hard-coded colors, enforcing design token usage
  5. ✓ Design tokens are centralized and exposed as CSS variables for theming
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
**Plans**: TBD

Plans:
- [ ] 12-01: TBD

#### Phase 13: Foundation Refactoring
**Goal**: Refactor existing foundation components to use CVA and consistent patterns
**Depends on**: Phase 11
**Requirements**: COMP-01, COMP-02, COMP-09, COMP-10, COMP-11, COMP-12, COMP-13
**Success Criteria** (what must be TRUE):
  1. Button component has type-safe CVA variants (primary, secondary, success, danger, outline, ghost)
  2. Card component has liquid glass variants with proper composition pattern
  3. All form controls properly associate with Label component for accessibility
  4. Divider component supports solid, dashed, and gradient variants
  5. Heading and Text components implement complete typography system with all variants
**Plans**: TBD

Plans:
- [ ] 13-01: TBD

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
**Plans**: TBD

Plans:
- [ ] 14-01: TBD

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
**Plans**: TBD

Plans:
- [ ] 15-01: TBD

#### Phase 16: Page Migration & Application
**Goal**: Apply design system to all application pages for visual consistency
**Depends on**: Phase 15
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05, PAGE-06, PAGE-07, PAGE-08, PAGE-09, PAGE-10
**Success Criteria** (what must be TRUE):
  1. Dashboard page uses new layout and device card components
  2. Stove page uses new DeviceCard and StatusCard components
  3. Thermostat page uses new form controls and schedule components
  4. Lights page uses new Slider and color picker components
  5. Camera page uses new layout and status components
  6. Monitoring dashboard uses new timeline and status components
  7. Notifications page uses new list and badge components
  8. Settings page uses new form components (Input, Select, Switch, Checkbox)
  9. Schedule UI uses new calendar and override components
  10. Admin pages use new dashboard layout and data display components
**Plans**: TBD

Plans:
- [ ] 16-01: TBD

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
**Plans**: TBD

Plans:
- [ ] 17-01: TBD

#### Phase 18: Documentation & Polish
**Goal**: Complete component documentation and migration guide
**Depends on**: Phase 17
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05
**Success Criteria** (what must be TRUE):
  1. /debug/design-system page displays all components with interactive examples
  2. All components have documented APIs (props, variants, usage examples)
  3. Migration guide exists showing how to convert old patterns to new components
  4. docs/design-system.md documents new Ember Noir v2 patterns and best practices
  5. Each component documents its accessibility features and keyboard interactions
**Plans**: TBD

Plans:
- [ ] 18-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18

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
| 12. Core Interactive Components | v3.0 | 0/TBD | Not started | - |
| 13. Foundation Refactoring | v3.0 | 0/TBD | Not started | - |
| 14. Feedback & Layout Components | v3.0 | 0/TBD | Not started | - |
| 15. Smart Home Components Refactor | v3.0 | 0/TBD | Not started | - |
| 16. Page Migration & Application | v3.0 | 0/TBD | Not started | - |
| 17. Accessibility & Testing | v3.0 | 0/TBD | Not started | - |
| 18. Documentation & Polish | v3.0 | 0/TBD | Not started | - |
