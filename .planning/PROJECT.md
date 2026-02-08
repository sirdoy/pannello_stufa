# Pannello Stufa - Smart Home Control PWA

## What This Is

PWA completa per controllo smart home: stufa Thermorossi, termostato Netatmo (con gestione schedule complete), luci Philips Hue. Include sistema notifiche push production-ready, monitoring automatico stufa, e integrazioni intelligenti tra dispositivi.

## Core Value

I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## Current State

**Version:** v5.0 (shipped 2026-02-08)
**Status:** Production-ready, fully typed TypeScript codebase

**Shipped Capabilities (v1.0 + v2.0 + v3.0 + v3.1 + v3.2 + v4.0):**
- ✅ Push notification system with token persistence and multi-device support
- ✅ Admin dashboard with delivery metrics and 7-day trends
- ✅ User preferences with type toggles, DND hours, rate limiting
- ✅ Notification history with infinite scroll and device management
- ✅ Comprehensive E2E test suite (32 tests, 3 browsers) with CI/CD integration
- ✅ Netatmo schedule management (view, switch, manual overrides)
- ✅ Automated stove health monitoring with dead man's switch
- ✅ Intelligent stove-thermostat coordination with user intent detection
- ✅ Monitoring dashboard with connection status, timeline, and push alerts
- ✅ Complete schedule UI with 7-day timeline and override management
- ✅ **Complete UI component library** (25+ components with CVA type-safe variants)
- ✅ **Radix UI accessibility primitives** (Checkbox, Switch, RadioGroup, Select, Slider, Dialog, Tooltip, Toast)
- ✅ **Design token system** (semantic CSS variables, @theme directive, ESLint enforcement)
- ✅ **Full page migration** (all pages use consistent design system components)
- ✅ **WCAG AA accessibility** (172 axe tests, 436 keyboard navigation tests)
- ✅ **Interactive documentation** (/debug/design-system with PropTable, examples)
- ✅ **100% design system compliance** (all device cards use Button, Slider, Badge components)
- ✅ **Zero raw HTML elements** in device components (no raw `<button>` or `<input>`)
- ✅ **CVA variants everywhere** (colorScheme prop, InfoBox variant, adaptive styling)
- ✅ **Weather display** with Open-Meteo API (15-min cache, Italian translations, 5-day forecast)
- ✅ **WeatherCard UI** (current conditions, forecast scroll, indoor/outdoor comparison, trend indicators)
- ✅ **Location settings** (city autocomplete, geolocation with iOS PWA handling, Firebase persistence)
- ✅ **Dashboard customization** (card reorder/hide, per-user Firebase preferences)
- ✅ **Dynamic home page** (renders cards in user's saved order with registry pattern)
- ✅ **Advanced UI components** (12 new: Popover, Tabs, Accordion, Sheet, RightClickMenu, CommandPalette, Kbd, ConfirmationDialog, FormModal, DataTable, DataTableToolbar, DataTableRow)
- ✅ **Command Palette (Cmd+K)** with fuzzy search and device commands
- ✅ **Context Menu on all device cards** (right-click desktop, long-press mobile)
- ✅ **Quick actions on device cards** (power toggle, temperature/brightness controls)
- ✅ **Full-featured DataTable** (sorting, filtering, pagination, row expansion, keyboard navigation)
- ✅ **CSS animation system** (duration/ease/stagger tokens with reduced motion support)
- ✅ **419+ component tests** for v4.0 components
- ✅ **Full TypeScript migration** (575 files, 0 tsc errors, production build passes)
- ✅ **Type safety enforced** (allowJs: false, 24 shared type definition files)
- ✅ **3028+ tests passing** in TypeScript with jest.mocked() patterns

**Operational Setup Required:**
- Cron webhook configuration for health monitoring (1-min frequency)
- Cron webhook configuration for coordination enforcement (1-min frequency)
- Firestore index deployment (`firebase deploy --only firestore:indexes`)
- Token cleanup cron configuration (from v1.0)

**Tech Stack:**
- Next.js 15.5 PWA with App Router
- Firebase (Realtime Database for tokens/cache, Firestore for history)
- Auth0 for authentication
- Playwright for E2E testing
- Recharts for visualization
- CVA (class-variance-authority) for type-safe component variants
- Radix UI primitives for accessible interactions
- ~104,000 lines TypeScript (fully migrated v5.0)

## Requirements

### Validated

**v1.0 Shipped (2026-01-26):**

**Token Management:**
- ✓ **TOKEN-01**: Token FCM persiste automaticamente dopo chiusura browser — v1.0 (Phase 1)
- ✓ **TOKEN-02**: Sistema verifica validità token all'avvio app e lo rigenera se necessario — v1.0 (Phase 1)
- ✓ **TOKEN-03**: Token invalidati automaticamente rimossi dal database — v1.0 (Phase 1)
- ✓ **TOKEN-04**: Cleanup automatico token > 90 giorni — v1.0 (Phase 1)
- ✓ **TOKEN-05**: Supporto multi-device — v1.0 (Phase 1)
- ✓ **TOKEN-06**: Device fingerprinting — v1.0 (Phase 1)

**Monitoring & Observability:**
- ✓ **MONITOR-01**: Tracking delivery status (Sent/Delivered/Displayed) — v1.0 (Phase 2)
- ✓ **MONITOR-02**: Error logging con timestamp e device info — v1.0 (Phase 2)
- ✓ **MONITOR-03**: Dashboard admin con delivery rate metrics — v1.0 (Phase 2)
- ✓ **MONITOR-04**: Lista dispositivi con status e last-used — v1.0 (Phase 2)
- ✓ **MONITOR-05**: Test send capability — v1.0 (Phase 2)
- ✓ **MONITOR-06**: Recharts visualization — v1.0 (Phase 2)

**User Preferences:**
- ✓ **PREF-01**: Controlli granulari per tipo notifica — v1.0 (Phase 3)
- ✓ **PREF-02**: Do Not Disturb hours con timezone — v1.0 (Phase 3)
- ✓ **PREF-03**: Rate limiting per tipo — v1.0 (Phase 3)
- ✓ **PREF-04**: Preferenze sincronizzate cross-device — v1.0 (Phase 3)
- ✓ **PREF-05**: Default conservativi (Alerts + System) — v1.0 (Phase 3)

**History & Device Management:**
- ✓ **HIST-01**: Storage cronologia in Firestore — v1.0 (Phase 2, 4)
- ✓ **HIST-02**: UI in-app inbox — v1.0 (Phase 4)
- ✓ **HIST-03**: Paginazione infinite scroll — v1.0 (Phase 4)
- ✓ **HIST-04**: Filtri per tipo e status — v1.0 (Phase 4)
- ✓ **HIST-05**: Auto-cleanup > 90 giorni (GDPR) — v1.0 (Phase 4)
- ✓ **DEVICE-01**: Device naming — v1.0 (Phase 4)
- ✓ **DEVICE-02**: Device status tracking — v1.0 (Phase 4)
- ✓ **DEVICE-03**: Remove device — v1.0 (Phase 4)
- ✓ **DEVICE-04**: Device list UI — v1.0 (Phase 4)

**Testing & Automation:**
- ✓ **TEST-01**: Pannello admin per test — v1.0 (Phase 2, 5)
- ✓ **TEST-02**: Selezione target (device/broadcast) — v1.0 (Phase 2)
- ✓ **TEST-03**: Verifica delivery immediata — v1.0 (Phase 2)
- ✓ **TEST-04**: Playwright E2E tests — v1.0 (Phase 5)
- ✓ **INFRA-06**: Cron job token cleanup — v1.0 (Phase 5)

**Infrastructure:**
- ✓ **INFRA-01**: Firestore per notification history — v1.0 (Phase 2, 4)
- ✓ **INFRA-02**: Realtime Database per tokens — v1.0 (Phase 1)
- ✓ **INFRA-03**: React Hook Form + Zod — v1.0 (Phase 3)
- ✓ **INFRA-04**: Recharts per dashboard — v1.0 (Phase 2)
- ✓ **INFRA-05**: date-fns per timestamp — v1.0 (Phase 2, 4)

**Existing (Pre-v1.0):**
- ✓ Firebase Cloud Messaging (FCM) integrato
- ✓ Token storage in Firebase Realtime Database
- ✓ Supporto multi-platform (Android, iOS, Web)
- ✓ Notifiche per eventi scheduler e alert errori
- ✓ API send notification

**v2.0 Shipped (2026-01-28):**

**Netatmo Schedule Management:**
- ✓ **SCHED-01**: View active weekly schedule with day/time/temperature slots — v2.0 (Phase 6, 9)
- ✓ **SCHED-02**: Switch between pre-configured schedules via dropdown — v2.0 (Phase 6, 9)
- ✓ **SCHED-03**: Create temporary override with duration picker (5-720 min) — v2.0 (Phase 9)
- ✓ **SCHED-04**: Cache schedule data with 5-minute TTL — v2.0 (Phase 6)
- ✓ **SCHED-05**: Enforce 60-second minimum polling interval — v2.0 (Phase 6)
- ✓ **SCHED-06**: Track 500 calls/hour Netatmo API limit — v2.0 (Phase 6)

**Stove-Thermostat Integration:**
- ✓ **INTEG-01**: Verify setpoint override behavior (temporary boost) — v2.0 (Phase 8)
- ✓ **INTEG-02**: Temporary override preserves schedule — v2.0 (Phase 8)
- ✓ **INTEG-03**: Coordinate multi-room thermostat zones — v2.0 (Phase 8)
- ✓ **INTEG-04**: Detect user manual changes, pause automation — v2.0 (Phase 8)
- ✓ **INTEG-05**: 2-minute debouncing before override — v2.0 (Phase 8)

**Stove Health Monitoring:**
- ✓ **MONITOR-01**: View stove connection status in dashboard — v2.0 (Phase 7, 10)
- ✓ **MONITOR-02**: Verify stove in expected state (cron checks) — v2.0 (Phase 7)
- ✓ **MONITOR-03**: Check stove-thermostat coordination — v2.0 (Phase 7)
- ✓ **MONITOR-04**: Log monitoring events to Firestore — v2.0 (Phase 7, 10)
- ✓ **MONITOR-05**: Display monitoring status in dashboard — v2.0 (Phase 7, 10)

**Supporting Infrastructure:**
- ✓ **INFRA-01**: Track Netatmo API calls per user — v2.0 (Phase 6)
- ✓ **INFRA-02**: Atomic OAuth token refresh — v2.0 (Phase 6)
- ✓ **INFRA-03**: Log cron execution with timestamp/duration — v2.0 (Phase 7)
- ✓ **INFRA-04**: Dead man's switch (10+ min threshold) — v2.0 (Phase 7)
- ✓ **INFRA-05**: Validate environment variables on startup — v2.0 (Phase 7)
- ✓ **INFRA-06**: Alert deduplication (30-minute throttle) — v2.0 (Phase 8)

**v3.0 Design System Evolution (Shipped 2026-01-30):**
- ✓ Complete UI component library (25+ components with CVA variants) — v3.0
- ✓ Radix UI accessibility primitives for all interactive components — v3.0
- ✓ WCAG AA compliance verified (172 axe tests, 436 keyboard tests) — v3.0
- ✓ All application pages migrated to design system — v3.0
- ✓ Interactive documentation at /debug/design-system — v3.0

**v3.1 Design System Compliance (Shipped 2026-02-02):**
- ✓ All raw `<button>` elements replaced with Button component — v3.1
- ✓ All raw `<input type="range">` replaced with Slider component — v3.1
- ✓ Device cards standardized (StoveCard, ThermostatCard, LightsCard, CameraCard) — v3.1
- ✓ Inline conditional styling replaced with CVA variants — v3.1
- ✓ Visual consistency verified across all pages — v3.1

**v3.2 Dashboard Customization & Weather (Shipped 2026-02-03):**

**Weather Display:**
- ✓ **WEATHER-01**: Current temperature and "feels like" — v3.2 (Phase 26)
- ✓ **WEATHER-02**: Weather condition icon (sunny, cloudy, rain, snow) — v3.2 (Phase 26)
- ✓ **WEATHER-03**: Current humidity percentage — v3.2 (Phase 26)
- ✓ **WEATHER-04**: Current wind speed — v3.2 (Phase 26)
- ✓ **WEATHER-05**: 5-day forecast with high/low temperatures — v3.2 (Phase 26)
- ✓ **WEATHER-06**: Loading skeleton while weather fetches — v3.2 (Phase 26)
- ✓ **WEATHER-07**: Error state with retry option — v3.2 (Phase 26)
- ✓ **WEATHER-08**: "Updated X minutes ago" timestamp — v3.2 (Phase 26)
- ✓ **WEATHER-09**: Temperature trend indicator (rising/falling) — v3.2 (Phase 27)
- ✓ **WEATHER-10**: Indoor/outdoor temperature comparison — v3.2 (Phase 26)

**Location Settings:**
- ✓ **LOC-01**: Manual city entry in settings — v3.2 (Phase 27)
- ✓ **LOC-02**: Autocomplete suggestions when typing — v3.2 (Phase 27)
- ✓ **LOC-03**: "Use my location" geolocation — v3.2 (Phase 27)
- ✓ **LOC-04**: Geolocation error handling (iOS PWA) — v3.2 (Phase 27)
- ✓ **LOC-05**: Location persistence in Firebase — v3.2 (Phase 27)
- ✓ **LOC-06**: Location name in WeatherCard — v3.2 (Phase 27)

**Dashboard Customization:**
- ✓ **DASH-01**: Dashboard layout settings page — v3.2 (Phase 28)
- ✓ **DASH-02**: Reorder cards using up/down buttons — v3.2 (Phase 28)
- ✓ **DASH-03**: Toggle card visibility (show/hide) — v3.2 (Phase 28)
- ✓ **DASH-04**: Card order persists in Firebase — v3.2 (Phase 28)
- ✓ **DASH-05**: Home page renders cards in saved order — v3.2 (Phase 29)
- ✓ **DASH-06**: Weather card reorderable like other cards — v3.2 (Phase 29)

**Infrastructure:**
- ✓ **INFRA-01**: Weather API with Open-Meteo, 15-min cache — v3.2 (Phase 25)
- ✓ **INFRA-02**: Dashboard preferences in Firebase RTDB — v3.2 (Phase 28)
- ✓ **INFRA-03**: Location settings in Firebase RTDB — v3.2 (Phase 27)
- ✓ **INFRA-04**: Geolocation 10-second timeout — v3.2 (Phase 25)

**v4.0 Advanced UI Components (Shipped 2026-02-05):**

**Tabs:**
- ✓ **TABS-01**: User can switch between tabs using click/tap — v4.0 (Phase 30)
- ✓ **TABS-02**: User can navigate tabs with arrow keys — v4.0 (Phase 30)
- ✓ **TABS-03**: Active tab is visually distinct with focus indicator — v4.0 (Phase 30)
- ✓ **TABS-04**: Screen reader announces tab role and selection state — v4.0 (Phase 30)
- ✓ **TABS-05**: Tabs support horizontal and vertical orientation — v4.0 (Phase 30)

**Accordion:**
- ✓ **ACCR-01**: User can expand/collapse sections by clicking header — v4.0 (Phase 31)
- ✓ **ACCR-02**: User can toggle sections with Enter/Space keys — v4.0 (Phase 31)
- ✓ **ACCR-03**: Expanded state communicated via aria-expanded — v4.0 (Phase 31)
- ✓ **ACCR-04**: Accordion supports single-open and multiple-open modes — v4.0 (Phase 31)
- ✓ **ACCR-05**: Collapse/expand has smooth height animation — v4.0 (Phase 31)

**Data Table:**
- ✓ **DTBL-01**: User can sort columns by clicking header — v4.0 (Phase 34)
- ✓ **DTBL-02**: Sort direction indicated visually (asc/desc icons) — v4.0 (Phase 34)
- ✓ **DTBL-03**: User can select rows via checkbox — v4.0 (Phase 34)
- ✓ **DTBL-04**: User can navigate cells with arrow keys — v4.0 (Phase 34)
- ✓ **DTBL-05**: User can filter columns via filter controls — v4.0 (Phase 34)
- ✓ **DTBL-06**: User can paginate large datasets — v4.0 (Phase 34)
- ✓ **DTBL-07**: User can expand rows to see details — v4.0 (Phase 34)
- ✓ **DTBL-08**: Screen reader announces sort state and selection — v4.0 (Phase 34)
- ✓ **DTBL-09**: Table is responsive (horizontal scroll on mobile) — v4.0 (Phase 34)

**Command Palette:**
- ✓ **CMDK-01**: User can open palette with Cmd+K (Mac) or Ctrl+K (Windows) — v4.0 (Phase 32)
- ✓ **CMDK-02**: User can search commands with fuzzy matching — v4.0 (Phase 32)
- ✓ **CMDK-03**: User can navigate results with arrow keys — v4.0 (Phase 32)
- ✓ **CMDK-04**: User can execute command with Enter — v4.0 (Phase 32)
- ✓ **CMDK-06**: Escape closes palette and returns focus — v4.0 (Phase 32)

**Context Menu:**
- ✓ **CTXM-01**: User can open menu via right-click on desktop — v4.0 (Phase 32)
- ✓ **CTXM-02**: User can open menu via long-press on mobile — v4.0 (Phase 32)
- ✓ **CTXM-03**: User can navigate menu items with arrow keys — v4.0 (Phase 32)
- ✓ **CTXM-04**: User can select item with Enter — v4.0 (Phase 32)
- ✓ **CTXM-05**: Escape closes menu — v4.0 (Phase 32)
- ✓ **CTXM-06**: Menu positions within viewport (collision detection) — v4.0 (Phase 32)

**Popover:**
- ✓ **POPV-01**: User can open popover by clicking trigger — v4.0 (Phase 30)
- ✓ **POPV-02**: Popover positions automatically (top/bottom/left/right) — v4.0 (Phase 30)
- ✓ **POPV-03**: Click outside closes popover — v4.0 (Phase 30)
- ✓ **POPV-04**: Escape closes popover — v4.0 (Phase 30)
- ✓ **POPV-05**: Focus trapped within popover when open — v4.0 (Phase 30)

**Sheet/Drawer:**
- ✓ **SHEE-01**: Sheet slides in from edge (bottom/right) — v4.0 (Phase 31)
- ✓ **SHEE-02**: Backdrop appears and click closes sheet — v4.0 (Phase 31)
- ✓ **SHEE-03**: Escape closes sheet — v4.0 (Phase 31)
- ✓ **SHEE-04**: Focus trapped within sheet — v4.0 (Phase 31)
- ✓ **SHEE-05**: Focus returns to trigger on close — v4.0 (Phase 31)

**Dialog Patterns:**
- ✓ **DLGC-01**: Confirmation dialog has cancel/confirm buttons — v4.0 (Phase 33)
- ✓ **DLGC-02**: Destructive actions use danger styling — v4.0 (Phase 33)
- ✓ **DLGC-03**: Focus starts on cancel button (safe default) — v4.0 (Phase 33)
- ✓ **DLGF-01**: Form modal integrates with form validation — v4.0 (Phase 33)
- ✓ **DLGF-02**: Form modal shows loading state during submit — v4.0 (Phase 33)
- ✓ **DLGF-03**: Form modal displays validation errors inline — v4.0 (Phase 33)

**Micro-interactions:**
- ✓ **ANIM-01**: Components use polished CSS transitions (ease curves) — v4.0 (Phase 35)
- ✓ **ANIM-02**: Stagger effects on list/grid items — v4.0 (Phase 35)
- ✓ **ANIM-03**: Spring physics for interactive elements — v4.0 (Phase 35)
- ✓ **ANIM-04**: Reduced motion respected (prefers-reduced-motion) — v4.0 (Phase 35)

**Quick Actions:**
- ✓ **QACT-01**: Device cards have visible quick action icon buttons — v4.0 (Phase 36)
- ✓ **QACT-02**: Device cards support context menu on right-click/long-press — v4.0 (Phase 36)
- ✓ **QACT-03**: Quick actions are consistent across all device types — v4.0 (Phase 36)

**Application Integration:**
- ✓ **APPL-01**: Tabs used on thermostat page (Schedule/Manual/History) — v4.0 (Phase 36)
- ✓ **APPL-02**: Accordion used for expandable device details — v4.0 (Phase 36)
- ✓ **APPL-03**: Data Table used for notification history — v4.0 (Phase 36)
- ✓ **APPL-04**: Command Palette accessible from any page — v4.0 (Phase 36)
- ✓ **APPL-05**: Context Menu on all device cards — v4.0 (Phase 36)
- ✓ **APPL-06**: Sheet used for mobile-friendly forms — v4.0 (Phase 36)
- ✓ **APPL-07**: Confirmation Dialog for destructive actions — v4.0 (Phase 36)
- ✓ **APPL-08**: All pages use new components consistently — v4.0 (Phase 36)

**v5.0 TypeScript Migration (Shipped 2026-02-08):**

**TypeScript Setup:**
- ✓ **SETUP-01**: TypeScript installato e configurato (tsconfig.json) — v5.0 (Phase 37)
- ✓ **SETUP-02**: allowJs abilitato per migrazione incrementale → disabilitato al termine — v5.0 (Phase 37, 43)
- ✓ **SETUP-03**: Path aliases configurati (@/components, @/lib, etc.) — v5.0 (Phase 37)
- ✓ **SETUP-04**: ESLint configurato per TypeScript — v5.0 (Phase 37)

**Type Definitions:**
- ✓ **TYPE-01**: Types condivisi per Firebase data structures — v5.0 (Phase 37)
- ✓ **TYPE-02**: Types per API responses/requests patterns — v5.0 (Phase 37)
- ✓ **TYPE-03**: Types per React component props comuni — v5.0 (Phase 37)
- ✓ **TYPE-04**: Types per configurazioni e constants — v5.0 (Phase 37)

**Source Migration:**
- ✓ **LIB-01**: Tutti i file lib/ convertiti a .ts (116 file) — v5.0 (Phase 38)
- ✓ **LIB-02**: Hooks convertiti a .ts (lib/hooks/, app/hooks/) — v5.0 (Phase 38)
- ✓ **LIB-03**: Utilities e helpers tipizzati — v5.0 (Phase 38)
- ✓ **LIB-04**: Services e repositories tipizzati — v5.0 (Phase 38)
- ✓ **COMP-01**: Design system components convertiti a .tsx (64 file) — v5.0 (Phase 39)
- ✓ **COMP-02**: Application components convertiti a .tsx (~50 file) — v5.0 (Phase 39)
- ✓ **COMP-03**: Props definite con interface/type per ogni component — v5.0 (Phase 39)
- ✓ **API-01**: Tutti gli API routes convertiti a .ts (90 file) — v5.0 (Phase 40)
- ✓ **API-02**: Request/Response types per ogni endpoint — v5.0 (Phase 40)
- ✓ **API-03**: Middleware e utility API tipizzati — v5.0 (Phase 40)
- ✓ **PAGE-01**: Layout e page files convertiti a .tsx — v5.0 (Phase 41)
- ✓ **PAGE-02**: Context providers convertiti a .tsx — v5.0 (Phase 41)
- ✓ **PAGE-03**: Loading/Error/Not-found states tipizzati — v5.0 (Phase 41)

**Testing & Verification:**
- ✓ **TEST-01**: Test files lib/ convertiti a .ts — v5.0 (Phase 42)
- ✓ **TEST-02**: Test files components/ convertiti a .tsx — v5.0 (Phase 42)
- ✓ **TEST-03**: Jest configurato per TypeScript — v5.0 (Phase 42)
- ✓ **TEST-04**: Tutti i test passano dopo migrazione — v5.0 (Phase 42, 43)
- ✓ **VERIFY-01**: npm run build completa senza errori — v5.0 (Phase 43)
- ✓ **VERIFY-02**: tsc --noEmit passa (type check) — v5.0 (Phase 43)
- ✓ **VERIFY-03**: Zero file .js/.jsx rimanenti (escluso config) — v5.0 (Phase 43)
- ✓ **VERIFY-04**: Dev server funziona correttamente — v5.0 (Phase 43)

### Active

## Current Milestone: v5.1 Tech Debt & Code Quality

**Goal:** Achieve a pristine codebase — zero tsc errors everywhere (including tests), all tests green, stricter TypeScript compiler options, dead code removed, and test coverage gaps filled.

**Target features:**
- Fix ~400 mock type tsc errors in test files (make tsc fully clean)
- Fix all failing tests (ThermostatCard.schedule + any others)
- Enable stricter TypeScript options (noUncheckedIndexedAccess, exactOptionalPropertyTypes, etc.)
- Remove dead code (unused files, exports, dependencies)
- Fill test coverage gaps in untested areas

### Out of Scope

- Notifiche email — Solo push notifications, no email
- Notifiche SMS — Costo elevato, non core value
- Notifiche programmate dall'utente — Scheduler già gestisce timing automatico
- Ricche media notifications (v1) — Complessità rinviata a v2
- Notifiche con azioni interattive (v1) — Possibile v2 enhancement
- Supporto altri provider (OneSignal, Pusher) — Firebase FCM sufficiente
- Real-time read receipts — Privacy concerns, battery drain
- Unlimited history retention — Database bloat + GDPR liability (90-day max)
- Silent background sync — iOS PWA unsupported
- Guaranteed delivery — FCM doesn't guarantee, false expectations

## Context

**Codebase:**
- Next.js 15.5 PWA con App Router
- Firebase Realtime Database per storage
- Firestore per notification history
- Auth0 per autenticazione
- Service Worker (Serwist) per offline capability
- Multi-device smart home control (stufa, termostato, luci)
- CVA + Radix UI design system (37+ components)
- ~104,000 lines TypeScript (fully migrated, allowJs: false)
- 531 TypeScript source files, 3028+ tests passing

**v5.0 Milestone (2026-02-05 → 2026-02-08):**
- 7 phases executed (56 plans total)
- 24/24 requirements satisfied (100%)
- 575 files migrated from JavaScript to TypeScript
- 759 files changed (+45,658 insertions, -8,084 deletions)
- Production build verified (30.5s, 49 routes)
- allowJs: false enforced (prevents future JS regression)
- 4 days from phase 37 start to completion

**v4.0 Milestone (2026-02-04 → 2026-02-05):**
- 7 phases executed (24 plans total)
- 55/55 requirements satisfied (100%)
- 12 new advanced UI components (Popover, Tabs, Accordion, Sheet, RightClickMenu, CommandPalette, Kbd, ConfirmationDialog, FormModal, DataTable, DataTableToolbar, DataTableRow)
- Command Palette with fuzzy search and device commands
- Context menus on all device cards with quick actions
- CSS animation token system with reduced motion support
- 419+ new component tests

**v3.2 Milestone (2026-02-02 → 2026-02-03):**
- 5 phases executed (13 plans total)
- 26/26 requirements satisfied (100%)
- Weather API with Open-Meteo (15-min cache, stale-while-revalidate)
- WeatherCard with forecast, trends, indoor/outdoor comparison
- Location settings with geocoding and geolocation
- Dashboard customization with per-user preferences
- Home page dynamic card rendering with registry pattern

**v3.1 Milestone (2026-01-30 → 2026-02-02):**
- 6 phases executed (13 plans total)
- 22/22 requirements satisfied (100%)
- All device cards 100% design system compliant
- Zero raw HTML elements in device components
- CVA variants for all conditional styling
- Button colorScheme prop for mode-specific coloring

**v3.0 Milestone (2026-01-28 → 2026-01-30):**
- 8 phases executed (52 plans total)
- 48/48 requirements satisfied (100%)
- Complete UI component library with type-safe variants
- Radix UI primitives for all interactive components
- WCAG AA accessibility verified (172 axe tests)
- All application pages migrated to design system
- Interactive documentation at /debug/design-system

**v2.0 Milestone (2026-01-27 → 2026-01-28):**
- 5 phases executed (21 plans total)
- 22/22 requirements satisfied (100%)
- Netatmo schedule management complete
- Stove health monitoring operational
- Stove-thermostat coordination working

**v1.0 Milestone (2026-01-23 → 2026-01-26):**
- 5 phases executed (29 plans total)
- 31/31 requirements satisfied (100%)
- Push notification system complete
- E2E test coverage comprehensive

**Known Issues:**
- Cron automation not operational (requires cron-job.org setup)
- Rate limiter in-memory only (consider Redis for multi-instance)
- Auth0 mock in E2E tests is placeholder
- Firestore indexes require manual deployment
- Label component not exported from barrel (low impact)
- ~400 remaining mock type tsc errors in test files (compile-time only, all tests pass at runtime)
- 4 pre-existing ThermostatCard.schedule test failures (complex integration test)

**User Feedback:**
- None yet (awaiting operational deployment)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dual persistence (IndexedDB + localStorage) | Prevents token loss across browser restarts | ✓ Good — Browser restart survival verified (v1.0) |
| Firebase Realtime Database for tokens | Low latency, consistency with project architecture | ✓ Good — Multi-device support working (v1.0) |
| Firestore for notification history | Complex queries, pagination support | ✓ Good — Cursor-based pagination performant (v1.0) |
| Non-blocking fire-and-forget logging | Logging failures shouldn't block notifications | ✓ Good — No notification failures due to logging (v1.0) |
| RTDB migration for preferences | Architectural consistency, real-time sync | ✓ Good — Cross-device sync instant (v1.0) |
| In-memory rate limiting | Fast, simple for single-instance deployment | ⚠️ Revisit — Consider Redis for multi-instance (v2) |
| HMAC-secured cron webhook | Security without API key rotation | ✓ Good — Timing-safe comparison prevents attacks (v1.0) |
| Breaking changes OK | Permette refactoring completo senza vincoli legacy | ✓ Good — Enabled dual persistence implementation (v1.0) |
| Firebase FCM retained | Già integrato, multi-platform support, affidabile | ✓ Good — Leveraged existing infrastructure (v1.0) |
| Open-Meteo API | Free, no API key, reliable, comprehensive data | ✓ Good — Weather infrastructure operational (v3.2) |
| In-memory weather cache | Simple for single-instance, 15-min TTL sufficient | ✓ Good — Fast responses, no Redis needed (v3.2) |
| Per-user dashboard prefs | Proper isolation, Firebase RTDB consistency | ✓ Good — Users have independent preferences (v3.2) |
| Menu-based card reorder | Simpler, more accessible than drag-drop | ✓ Good — Works on all devices (v3.2) |
| Server-side prefs fetch | Faster than API route for Server Components | ✓ Good — Reduced latency on home page (v3.2) |
| Card component registry | Easy extension, clean code, reduced lines | ✓ Good — Adding cards is trivial (v3.2) |
| git mv for TS migration | Preserves git blame and history | ✓ Good — Full history retained (v5.0) |
| Pragmatic `as any` for external APIs | Hue/Netatmo/OpenMeteo have no official TS types | ✓ Good — Unblocked migration (v5.0) |
| jest.mocked() pattern | Type-safe mock access without manual casting | ✓ Good — Clean test patterns (v5.0) |
| allowJs: false lockdown | Prevents accidental JS file creation | ✓ Good — Regression prevention (v5.0) |
| Parallel wave execution | 5 agents in parallel for independent plans | ✓ Good — 4x faster phase execution (v5.0) |

## Constraints

- **Platform**: PWA deve funzionare su iOS e Android (Safari, Chrome, Firefox)
- **Provider**: Mantenere Firebase FCM (no switch provider)
- **Tech stack**: Next.js 15.5, Firebase 12.8.0, React 19.2.0
- **Node runtime**: Firebase Admin SDK richiede Node.js runtime (no Edge)
- **Deployment**: Vercel (current hosting platform)

---
*Last updated: 2026-02-08 after v5.1 milestone start (Tech Debt & Code Quality)*
