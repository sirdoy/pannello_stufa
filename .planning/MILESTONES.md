# Project Milestones: Pannello Stufa

Historical record of shipped milestones for the Pannello Stufa smart home control PWA.

---

## v7.0 Performance & Resilience (Shipped: 2026-02-13)

**Delivered:** Application hardened with smart retry strategies for transient failures, adaptive polling for resource efficiency, graceful error boundaries for crash isolation, orchestrator pattern refactoring reducing 3 largest components by 82-87%, comprehensive scheduler route test coverage, and automated FCM token cleanup with audit trail.

**Phases completed:** 55-60 (22 plans total)

**Key accomplishments:**

- Retry infrastructure with exponential backoff, request deduplication (2-second window), and Firebase RTDB idempotency keys preventing duplicate stove safety commands
- Error boundaries (global + feature-level) isolating device card crashes with "Try Again" recovery, ValidationError bypass for safety-critical alerts, and fire-and-forget error logging
- Adaptive polling via Page Visibility API — pauses when tab hidden, adapts to network quality (30s fast / 60s slow), stove safety polling never pauses (alwaysActive flag)
- Orchestrator pattern refactoring: StoveCard 1510→188 LOC (-87%), LightsCard 1225→184 LOC (-85%), stove/page 1066→189 LOC (-82%) with custom hooks and presentational sub-components
- Scheduler route unit tests: 112 tests covering state transitions (OFF→START→WORK), error scenarios, fire-and-forget paths, achieving 80.07% branch coverage
- Automated FCM token cleanup service with delivery-based staleness detection (lastUsed timestamp), Firebase audit trail, and cron-triggered execution

**Stats:**

- 22 plans executed across 6 phases
- 30/30 v7.0 requirements satisfied (100%)
- 145 files changed (+31,231 insertions, -4,121 deletions)
- 495+ new tests across milestone
- 82 git commits with atomic changes
- 2 days from phase 55 start to completion (2026-02-11 → 2026-02-13)

**Git range:** `test(55-02)` (54da7fa) → `docs(60-05)` (85af0e5)

**Archives:**
- [Roadmap](milestones/v7.0-ROADMAP.md)
- [Requirements](milestones/v7.0-REQUIREMENTS.md)
- [Audit](milestones/v7.0-MILESTONE-AUDIT.md)

**Tech debt:** Monitor component_error events in production. Consider error boundaries for modal components. 3 pre-existing vibration API test warnings. Visual parity human verification pending for refactored components. Scheduler route at 80.07% (fire-and-forget helpers hard to test further).

**What's next:** Application is resilient with retry, error boundaries, adaptive polling, clean component architecture, and comprehensive test coverage. Ready for user feedback and next milestone planning.

---

## v6.0 Operations, PWA & Analytics (Shipped: 2026-02-11)

**Delivered:** Full operational stack with persistent rate limiting, automated cron scheduling, Playwright E2E tests with real Auth0, interactive push notifications with action buttons, enhanced PWA offline mode with staleness indicators and install prompt, and GDPR-compliant analytics dashboard with pellet consumption estimation, usage charts, and weather correlation.

**Phases completed:** 49-54 (29 plans total)

**Key accomplishments:**

- Firebase RTDB persistent rate limiter with transaction safety — notification and Netatmo rate limits survive cold starts and deployments
- GitHub Actions cron automation with 5-minute schedule triggering health monitoring, coordination, and dead man's switch tracking
- Playwright E2E test infrastructure with real Auth0 OAuth flow, session state caching, and GitHub Actions CI pipeline
- Interactive push notifications with "Spegni stufa" and "Imposta manuale" action buttons, platform-specific FCM payloads (iOS/Android/Web), and offline Background Sync
- PWA offline enhancements: Ember Noir offline banner, staleness indicators on device cards, disabled controls when offline, command queue UI, and guided install prompt with visit tracking
- GDPR-compliant analytics dashboard: consent banner blocking all tracking, pellet consumption estimation with user calibration, usage/consumption/weather correlation charts, daily aggregation cron, and consent header enforcement

**Stats:**

- 29 plans executed across 6 phases
- 42/42 v6.0 requirements satisfied (100%)
- 267 files changed (+30,256 insertions, -3,302 deletions)
- 151 git commits with atomic changes
- 2 days from phase 49 start to completion (2026-02-10 → 2026-02-11)

**Git range:** `feat(49-01)` → `docs(phase-54)`

**Archives:**
- [Roadmap](milestones/v6.0-ROADMAP.md)
- [Requirements](milestones/v6.0-REQUIREMENTS.md)

**Tech debt:** Worker teardown warning persists (React 19 cosmetic). iOS notification category registration in PWA needs deeper verification. Consent enforcement is caller responsibility (not middleware-enforced).

**What's next:** App fully operational with cron automation, interactive notifications, offline resilience, and analytics. Ready for user feedback and next milestone planning.

---

## v5.1 Tech Debt & Code Quality (Shipped: 2026-02-10)

**Delivered:** Pristine TypeScript codebase with strict: true, noUncheckedIndexedAccess, zero tsc errors across all 531 source + 131 test files, all 3,034 tests green, and dead code removed (40 files, 4 deps, 203 exports eliminated).

**Phases completed:** 44-48 (39 plans total)

**Key accomplishments:**

- Enabled `strict: true` in tsconfig.json — fixed 1,841 TypeScript errors to zero across lib/, components/, app/, and test files
- Enabled `noUncheckedIndexedAccess` — resolved 436 additional index access errors with proper undefined checks
- Fixed all test failures: FormModal cancel behavior (root cause: double-fire from Radix + button), DataTable filter, worker teardown (documented as React 19 cosmetic)
- Dead code removal: 40 unused files deleted (5,702 LOC), 4 unused dependencies removed, 203 unused exports eliminated (53% reduction from 382 to 179)
- Full type safety enforced: strict mode + noUncheckedIndexedAccess across entire codebase with 3,034 tests passing

**Stats:**

- 39 plans executed across 5 phases
- 14/14 v5.1 requirements satisfied (100%)
- 406 files changed (+19,624 insertions, -8,843 deletions)
- 145 git commits with atomic changes
- 2 days from phase 44 start to completion (2026-02-09 → 2026-02-10)

**Git range:** `chore(44-01)` → `docs(phase-48)`

**Archives:**
- [Roadmap](milestones/v5.1-ROADMAP.md)
- [Requirements](milestones/v5.1-REQUIREMENTS.md)
- [Audit](milestones/v5.1-MILESTONE-AUDIT.md)

**Tech debt:** Worker teardown warning (React 19 cosmetic). 179 unused exports remain (131 intentional design system barrel, 48 utility). 2 knip false positive files (app/sw.ts, firebase-messaging-sw.js).

**What's next:** Codebase is pristine — zero tsc errors, full strict mode, all tests green, dead code removed. Ready for feature development or new milestone.

---

## v5.0 TypeScript Migration (Shipped: 2026-02-08)

**Delivered:** Complete TypeScript migration of 575 JavaScript/JSX files across all application layers — libraries, components, API routes, pages, tests, and config files — with zero tsc errors, passing production build, and `allowJs: false` enforcement preventing future regression.

**Phases completed:** 37-43 (56 plans total)

**Key accomplishments:**

- TypeScript foundation with 24 shared type definition files for Firebase, API, components, and config patterns
- Library migration (132 files): utilities, PWA, core infrastructure, repositories, external API clients, hooks — all with proper typing
- UI component migration (119 files): design system + application components with CVA variants, Radix UI wrappers, namespace patterns
- API route migration (90 files): all endpoints with typed request/response, inline body interfaces, pragmatic external API typing
- Pages migration (70 files): layouts, providers, co-located components with typed context values and prop interfaces
- Test migration (131 files): Jest configured for TypeScript, comprehensive mock typing with jest.mocked() pattern
- Final verification: production build passes (30.5s, 49 routes), tsc --noEmit zero errors, allowJs:false locked down

**Stats:**

- 56 plans executed across 7 phases
- 24/24 v5.0 requirements satisfied (100%)
- 759 files changed (+45,658 insertions, -8,084 deletions)
- 531 TypeScript source files (.ts/.tsx)
- 3028+ tests passing
- 237 git commits with atomic, well-documented changes
- 4 days from phase 37 start to completion (2026-02-05 → 2026-02-08)

**Git range:** `feat(37-01)` → `docs(43-08)`

**Archives:**
- [Roadmap](milestones/v5.0-ROADMAP.md)
- [Requirements](milestones/v5.0-REQUIREMENTS.md)

**Tech debt:** ~400 remaining mock type tsc errors in test files (compile-time only, all tests pass at runtime). 4 pre-existing ThermostatCard.schedule test failures.

**What's next:** TypeScript migration complete. Codebase is now fully typed with compile-time safety. Consider feature development or operational improvements for next milestone.

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


## v8.0 Fritz!Box Network Monitor (Shipped: 2026-02-16)

**Delivered:** Fritz!Box network monitoring integrated as a new device in the PWA — dashboard card with connection/device/bandwidth summary, dedicated /network page with WAN status, paginated device list with search/sort/categorization, real-time bandwidth charts with LTTB decimation, device history timeline with Firebase event logging, MAC vendor auto-categorization with manual override, and bandwidth-stove power correlation with GDPR consent gating.

**Phases completed:** 61-67 (18 plans, 38 tasks)

**Key accomplishments:**

- Fritz!Box API integration with rate limiting (10 req/min, 6s delay), 60s Firebase RTDB cache, secure server-side proxy routes, and RFC 9457 error handling
- NetworkCard dashboard component with health algorithm (hysteresis-based status), sparkline buffering, adaptive polling, and setup guide for TR-064 configuration
- Dedicated /network page with WAN status details (external IP copy, uptime, DNS), paginated device list (25/page) with search/sort/filter and Italian locale formatting
- Real-time bandwidth visualization with LTTB decimation algorithm (10080 → 500 points), dual upload/download Recharts LineChart, and time range selection (1h/24h/7d)
- Device history timeline with date-keyed Firebase event logging, fire-and-forget event detection, date-grouped Italian display, and per-device filtering
- Device auto-categorization by MAC vendor lookup (40+ keyword mappings, 7-day cache, macvendors.com API) with manual override persistence and color-coded badges with inline editing
- Bandwidth-stove power correlation with Pearson analysis, dual y-axis chart (step chart for power levels), Italian insight text, and GDPR analytics consent gate

**Stats:**

- 18 plans executed across 7 phases
- 32/32 v8.0 requirements satisfied (100%)
- 136 files changed (+25,643 insertions, -89 deletions)
- 229+ new tests across milestone
- 81 git commits with atomic changes
- 3 days from phase 61 start to completion (2026-02-13 → 2026-02-16)

**Git range:** `feat(61-01)` (c359453) → `docs(phase-67)` (2dff5c7)

**Archives:**
- [Roadmap](milestones/v8.0-ROADMAP.md)
- [Requirements](milestones/v8.0-REQUIREMENTS.md)

**Tech debt:** INFRA requirements unchecked in traceability (Phase 61 complete but tracking not updated). Rate limit budget shared across all Fritz!Box API calls (10 req/min). Self-hosted API connectivity depends on myfritz.net. Plain button in CopyableIp (avoided design system Button for test simplicity).

**What's next:** Fritz!Box network monitoring fully operational. Consider advanced monitoring (guest network, anomaly detection, per-device usage tracking) for future milestones.

---


## v8.1 Masonry Dashboard (Shipped: 2026-02-18)

**Delivered:** Masonry dashboard layout replacing CSS Grid with two-column flexbox split by index parity — eliminates vertical gaps between cards of different heights on desktop while preserving Firebase-configured card order and leaving mobile untouched. Edge cases handled for all card counts, error boundary fallback with minimum height, and unit test coverage.

**Phases completed:** 68-69 (3 plans, 5 tasks)

**Key accomplishments:**

- Two-column flexbox masonry layout replacing CSS Grid — cards fill vertical space with no gaps, parity-based column assignment (even→left, odd→right) preserves Firebase card order
- Dual render blocks (sm:hidden flat list + hidden sm:flex masonry) prevent mobile column-first ordering pitfall
- splitIntoColumns pure utility extracted for testability — generic array-to-columns function with flatIndex tracking for animation stagger
- EDGE-01 fix: right column removed from DOM entirely when empty (1-card fills full width), EDGE-03 fix: ErrorFallback min-h-[160px] prevents column collapse
- Unit tests covering all edge-case card counts (0, 1, 2, 3, 5, 6) with explicit flatIndex assertions for animation stagger correctness

**Stats:**

- 3 plans executed across 2 phases
- 8/8 v8.1 requirements satisfied (100%)
- 24 files changed (+3,465 insertions, -1,248 deletions)
- 19 git commits with atomic changes
- 1 day from phase 68 start to completion (2026-02-17 → 2026-02-18)

**Git range:** `docs: start milestone v8.1` (06d261c) → `fix(ci)` (a358b57)

**Archives:**
- [Roadmap](milestones/v8.1-ROADMAP.md)
- [Requirements](milestones/v8.1-REQUIREMENTS.md)

**Tech debt:** None accumulated during v8.1.

**What's next:** Dashboard layout optimized. Consider next milestone for new features or operational improvements.

---

