# Project Milestones: Pannello Stufa

Historical record of shipped milestones for the Pannello Stufa smart home control PWA.

---

## v4.0 Advanced UI Components (Shipped: 2026-02-05)

**Delivered:** 12 advanced UI components (Popover, Tabs, Accordion, Sheet, RightClickMenu, CommandPalette, Kbd, ConfirmationDialog, FormModal, DataTable, DataTableToolbar, DataTableRow) with CSS animation system and application-wide integration including quick actions on all device cards.

**Phases completed:** 30-36 (24 plans total)

**Key accomplishments:**

- Foundation UI components: Popover with CVA variants, Tabs compound component with sliding indicator, applied to thermostat page
- Expandable components: Accordion with single/multiple modes, Sheet sliding panels for mobile-friendly forms
- Action components: RightClickMenu with mobile long-press, CommandPalette (Cmd+K) with fuzzy search and device commands
- Dialog patterns: ConfirmationDialog with danger variant, FormModal with React Hook Form integration
- Full-featured DataTable: TanStack Table with sorting, filtering, pagination, row expansion, keyboard navigation
- CSS animation token system: Duration/ease/stagger tokens, reduced motion accessibility support
- Application integration: Quick actions on all device cards, context menus, axe-core accessibility auditing

**Stats:**

- 24 plans executed across 7 phases
- 55/55 v4.0 requirements satisfied (100%)
- 419+ component tests
- 2 days from phase 30 start to completion (2026-02-04 → 2026-02-05)

**Git range:** `feat(30-01)` → `docs(36)`

**Archives:**
- [Roadmap](milestones/v4.0-ROADMAP.md)
- [Requirements](milestones/v4.0-REQUIREMENTS.md)
- [Audit](milestones/v4.0-MILESTONE-AUDIT.md)

**Tech debt:** None accumulated during v4.0.

**What's next:** Advanced UI components complete. Design system now has all major component patterns. Consider v4.1 for advanced features (nested submenus, swipe gestures) or v5.0 for new feature work.

---

## v3.2 Dashboard Customization & Weather (Shipped: 2026-02-03)

**Delivered:** Weather display with Open-Meteo API and dashboard customization allowing users to personalize their home page card order and visibility.

**Phases completed:** 25-29 (13 plans total)

**Key accomplishments:**

- Weather API infrastructure with Open-Meteo wrapper, 15-minute cache with stale-while-revalidate, and Italian WMO code translations (26 weather descriptions)
- Complete WeatherCard UI with current conditions, 5-day horizontal scroll forecast, indoor/outdoor temperature comparison, skeleton loading, and error states
- Location settings with city autocomplete search via geocoding, browser geolocation with 10s timeout and iOS PWA error handling, Firebase persistence
- Temperature trend indicators showing rising/falling arrows based on 6-hour historical analysis with 1°C threshold
- Dashboard customization settings page with up/down card reordering and visibility toggles, per-user Firebase persistence
- Home page dynamic rendering from user preferences with registry pattern for easy card extension, server-side fetch for performance

**Stats:**

- 13 plans executed across 5 phases
- 26/26 v3.2 requirements satisfied (100%)
- 76 files changed (+13,760 insertions, -173 deletions)
- 73 git commits with atomic, well-documented changes
- 2 days from phase 25 start to completion (2026-02-02 → 2026-02-03)

**Git range:** `docs(25)` → `docs(29)`

**Archives:**
- [Roadmap](milestones/v3.2-ROADMAP.md)
- [Requirements](milestones/v3.2-REQUIREMENTS.md)
- [Audit](milestones/v3.2-MILESTONE-AUDIT.md)

**Tech debt:** None accumulated during v3.2.

**What's next:** Weather and dashboard customization complete. Consider v3.3 for weather enhancements (hourly forecast, alerts) or v4.0 for new feature work (weather-based automation, drag-drop reordering).

---

## v3.1 Design System Compliance (Shipped: 2026-02-02)

**Delivered:** 100% design system compliance across all device cards and pages — every raw HTML element replaced with design system components, all styling using CVA variants.

**Phases completed:** 19-24 (13 plans total)

**Key accomplishments:**

- StoveCard fully compliant with Button.Group for mode buttons, CVA-based status display with Badge and HealthIndicator
- ThermostatCard fully compliant with Button component for mode grid, temperature display verified using Text component patterns
- LightsCard fully compliant with Slider component replacing raw `<input type="range">`, scene buttons migrated to Button
- CameraCard fully compliant with Button.Icon for all interactive elements (refresh, close, play, fullscreen)
- Thermostat page migrated to PageLayout with InfoBox components, Button colorScheme prop added for consistent mode button styling
- Complete verification: zero raw `<button>` or `<input>` elements, ESLint clean, visual consistency verified with 10 badge migrations

**Stats:**

- 13 plans executed across 6 phases
- 22/22 v3.1 requirements satisfied (100%)
- 159 files changed (+25,027 insertions, -1,179 deletions)
- 128 git commits with atomic, well-documented changes
- 4 days from phase 19 start to completion (2026-01-30 → 2026-02-02)

**Git range:** `feat(19-01)` → `feat(24)`

**Archives:**
- [Roadmap](milestones/v3.1-ROADMAP.md)
- [Requirements](milestones/v3.1-REQUIREMENTS.md)
- [Audit](milestones/v3.1-MILESTONE-AUDIT.md)

**Tech debt:** None accumulated during v3.1.

**What's next:** Design system is now 100% compliant. Consider v4.0 for new feature work (advanced components like Tabs, Accordion, Command Palette) or operational improvements.

---

## v3.0 Design System Evolution (Shipped: 2026-01-30)

**Delivered:** Complete, consistent, and accessible UI component library based on evolved Ember Noir design system, systematically applied across all application pages for visual consistency and professional polish.

**Phases completed:** 11-18 (52 plans total)

**Key accomplishments:**

- Complete UI component library with 25+ production-ready components using CVA type-safe variants (Button, Card, Modal, Toast, Slider, Checkbox, Switch, Select, RadioGroup, etc.)
- Radix UI accessibility foundation for all interactive components with proper keyboard navigation, focus management, and ARIA patterns
- Comprehensive accessibility testing infrastructure with 172 jest-axe tests, 436 keyboard navigation tests, WCAG AA verified
- Design token system with semantic CSS variables via @theme directive, ESLint enforcement, and consistent Ember Noir styling
- Full application migration of all pages (Dashboard, Stove, Thermostat, Lights, Monitoring, Settings, Admin) to design system components
- Documentation infrastructure with interactive design system page, PropTable, CodeBlock, AccessibilitySection components, and comprehensive markdown docs

**Stats:**

- 52 plans executed across 8 phases
- 48/48 v3.0 requirements satisfied (100%)
- 250 files changed (+48,039 insertions, -2,634 deletions)
- ~104,000 lines of JavaScript codebase
- 1,361+ component tests passing
- 3 days from phase 11 start to completion (2026-01-28 → 2026-01-30)
- 194 git commits with atomic, well-documented changes

**Git range:** `feat(11-01)` → `feat(18-04)`

**Archives:**
- [Roadmap](milestones/v3.0-ROADMAP.md)
- [Requirements](milestones/v3.0-REQUIREMENTS.md)
- [Audit](milestones/v3.0-MILESTONE-AUDIT.md)

**Tech debt:** Label component not exported from barrel (low impact, used internally).

**What's next:** Design system establishes solid foundation for future development. Consider v3.1 for advanced components (Tabs, Accordion, Command Palette, Data Table) or v4.0 for new feature work.

---

## v2.0 Netatmo Complete Control & Stove Monitoring (Shipped: 2026-01-28)

**Delivered:** Complete Netatmo thermostat control with weekly schedule management, automated stove health monitoring via cron, intelligent stove-thermostat coordination with user intent detection, and comprehensive monitoring dashboard with push notification alerts.

**Phases completed:** 6-10 (21 plans total)

**Key accomplishments:**

- Complete Netatmo schedule infrastructure with Firebase caching (5-min TTL), per-user rate limiting (400/hr), and schedule switching API
- Automated stove health monitoring with parallel API fetching, Firestore logging (parent/subcollection pattern), and dead man's switch (10-min threshold)
- Intelligent stove-thermostat coordination with 2-minute debouncing, user intent detection (0.5°C tolerance), schedule-aware pause calculation, and multi-zone support
- Schedule management UI with 7-day timeline visualization, schedule switcher, manual override sheet with duration/temperature pickers, and active override badges
- Monitoring dashboard with connection status display, dead man's switch panel, infinite scroll timeline with filters, and push notification alerts (3 alert types)
- Production-ready notification system with 30-minute throttle for alert deduplication and fire-and-forget pattern in cron integration

**Stats:**

- 21 plans executed across 5 phases
- 22/22 v2.0 requirements satisfied (100%)
- 124 files changed (+25,721 insertions, -71 deletions)
- ~5,271 lines of new production code
- 233+ tests passing (coordination, health monitoring, schedule helpers, UI components)
- 1.4 days from phase 6 start to completion (2026-01-27 → 2026-01-28)

**Git range:** `feat(06-01)` (1763a1d) → `feat(10-05)` (575a214)

**Archives:**
- [Roadmap](milestones/v2.0-ROADMAP.md)
- [Requirements](milestones/v2.0-REQUIREMENTS.md)
- [Audit](milestones/v2.0-MILESTONE-AUDIT.md)

**What's next:** System delivers complete Netatmo schedule management (view, switch, manual overrides), automated stove health monitoring with alerting, and enhanced stove-thermostat coordination. Full schedule CRUD deferred to v2.1+ (official Netatmo app sufficient for editing). Next focus TBD.

---

## v1.0 Push Notifications System (Shipped: 2026-01-26)

**Delivered:** Production-grade push notification system with token persistence, delivery monitoring, user preferences, history management, and automated testing.

**Phases completed:** 1-5 (29 plans total)

**Key accomplishments:**

- Fixed critical token persistence bug - tokens survive browser restarts via dual persistence (IndexedDB + localStorage)
- Complete delivery visibility with admin dashboard, 7-day trends visualization, and error logging
- User control over notification behavior with type toggles, DND hours, and rate limiting
- In-app notification history with infinite scroll and device management UI
- Comprehensive E2E test suite (32 tests) with CI/CD integration and automated token cleanup

**Stats:**

- 29 plans executed across 5 phases
- 31/31 v1 requirements satisfied (100%)
- ~70,000 lines of TypeScript/JavaScript
- 4 days from initialization to ship (2026-01-23 → 2026-01-26)
- 50+ git commits with atomic, well-documented changes

**Git range:** `feat(01-01)` → `docs(05)`

**Archives:**
- [Roadmap](milestones/v1.0-ROADMAP.md)
- [Requirements](milestones/v1.0-REQUIREMENTS.md)
- [Audit](milestones/v1.0-MILESTONE-AUDIT.md)

**What's next:** System is production-ready with full functionality operational. Operational setup items documented (cron configuration, Firestore index deployment). Future enhancements tracked in v2 requirements (advanced analytics, rich media notifications, user engagement metrics).

---

_For current project status, see `.planning/PROJECT.md`_
_To start next milestone, run `/gsd:new-milestone`_
