# Pannello Stufa - Smart Home Control PWA

## What This Is

PWA completa per controllo smart home: stufa Thermorossi, termostato Netatmo (con gestione schedule complete), luci Philips Hue, monitoraggio rete Fritz!Box. Include sistema notifiche push production-ready con action buttons interattive, monitoring automatico stufa con cron GitHub Actions, rate limiting persistente Firebase RTDB, offline mode avanzato con staleness indicators, PWA install prompt guidato, analytics dashboard GDPR-compliant con stima consumo pellet e correlazione meteo. Monitoraggio rete Fritz!Box con dashboard card, pagina dedicata /network con WAN status, device list con categorizzazione automatica, bandwidth charts con decimation LTTB, device history timeline, e correlazione bandwidth-stufa con consent gate. Applicazione resiliente con retry automatico + idempotency, error boundaries per crash isolation, adaptive polling via Page Visibility API, e componenti refactored con orchestrator pattern (~85% LOC reduction). Codebase interamente in TypeScript con strict mode completo e zero errori di compilazione.

## Core Value

I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## Current Milestone: v8.1 Masonry Dashboard

**Goal:** Layout masonry per le card della home su desktop — le card riempiono gli spazi vuoti verticali mantenendo l'ordine impostato dall'utente.

**Target features:**
- Masonry layout su desktop (2 colonne) che elimina i gap verticali tra card di altezza diversa
- Mobile invariato (1 colonna, layout lineare)
- Ordine card rispettato come da impostazioni utente

## Current State

**Version:** v8.0 (shipped 2026-02-16)
**Status:** Fritz!Box Network Monitor complete

**Tech Stack:**
- Next.js 15.5 PWA with App Router
- Firebase (Realtime Database for tokens/cache/analytics/network events, Firestore for history)
- Auth0 for authentication
- Playwright for E2E testing
- Recharts for visualization (bandwidth charts, correlation, analytics)
- CVA (class-variance-authority) for type-safe component variants
- Radix UI primitives for accessible interactions
- react-error-boundary for crash isolation
- GitHub Actions for cron automation (5-min schedule)
- Fritz!Box TR-064 API integration via server-side proxy
- ~106,000 lines TypeScript (strict: true, noUncheckedIndexedAccess, allowJs: false)

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
- ✓ Weather display with Open-Meteo API (current conditions, 5-day forecast, trends) — v3.2
- ✓ Location settings with geocoding, geolocation, Firebase persistence — v3.2
- ✓ Dashboard customization with per-user card reorder and visibility — v3.2
- ✓ Dynamic home page rendering from user preferences — v3.2

**v4.0 Advanced UI Components (Shipped 2026-02-05):**
- ✓ 12 advanced components (Popover, Tabs, Accordion, Sheet, RightClickMenu, CommandPalette, etc.) — v4.0
- ✓ Command Palette (Cmd+K) with fuzzy search and device commands — v4.0
- ✓ Context Menu on all device cards — v4.0
- ✓ Full-featured DataTable with sorting, filtering, pagination — v4.0
- ✓ CSS animation token system with reduced motion support — v4.0
- ✓ 419+ component tests — v4.0

**v5.0 TypeScript Migration (Shipped 2026-02-08):**
- ✓ 575 files migrated from JavaScript to TypeScript — v5.0
- ✓ Zero tsc errors, production build verified — v5.0
- ✓ `allowJs: false` enforced — v5.0
- ✓ 3028+ tests passing in TypeScript — v5.0

**v5.1 Tech Debt & Code Quality (Shipped 2026-02-10):**
- ✓ `strict: true` + `noUncheckedIndexedAccess` enabled — v5.1
- ✓ 1,841 + 436 TypeScript errors fixed to zero — v5.1
- ✓ 40 unused files, 4 deps, 203 exports eliminated — v5.1
- ✓ All 3,034 tests green — v5.1

**v7.0 Performance & Resilience (Shipped 2026-02-13):**

**Request Resilience:**
- ✓ **RETRY-01**: User sees toast when device command fails — v7.0 (Phase 55)
- ✓ **RETRY-02**: Transient errors auto-retry with exponential backoff (max 3) — v7.0 (Phase 55)
- ✓ **RETRY-03**: Device-offline errors show toast with manual Retry — v7.0 (Phase 55)
- ✓ **RETRY-04**: Stove safety commands use idempotency keys — v7.0 (Phase 55)
- ✓ **RETRY-05**: Request deduplication prevents double-tap — v7.0 (Phase 55)
- ✓ **RETRY-06**: Single retry layer at API boundary — v7.0 (Phase 55)

**Adaptive Polling:**
- ✓ **POLL-01**: Polling pauses when tab hidden — v7.0 (Phase 57)
- ✓ **POLL-02**: Polling resumes when tab visible — v7.0 (Phase 57)
- ✓ **POLL-03**: Stove keeps fixed interval (safety-critical) — v7.0 (Phase 57)
- ✓ **POLL-04**: Non-critical data adapts to slow network — v7.0 (Phase 57)
- ✓ **POLL-05**: Staleness indicator shows when data old — v7.0 (Phase 57)

**Error Handling:**
- ✓ **ERR-01**: Global error boundary with fallback UI — v7.0 (Phase 56)
- ✓ **ERR-02**: Feature-level boundaries isolate device cards — v7.0 (Phase 56)
- ✓ **ERR-03**: User-friendly message with "Try Again" action — v7.0 (Phase 56)
- ✓ **ERR-04**: Retry-from-error resets and re-mounts — v7.0 (Phase 56)
- ✓ **ERR-05**: Errors logged to analytics (fire-and-forget) — v7.0 (Phase 56)
- ✓ **ERR-06**: ValidationError bypasses boundaries (safety) — v7.0 (Phase 56)

**Component Refactoring:**
- ✓ **REFAC-01**: StoveCard split (1510→188 LOC, -87%) — v7.0 (Phase 58)
- ✓ **REFAC-02**: LightsCard split (1225→184 LOC, -85%) — v7.0 (Phase 59)
- ✓ **REFAC-03**: stove/page.tsx split (1066→189 LOC, -82%) — v7.0 (Phase 59)
- ✓ **REFAC-04**: Complex state logic in custom hooks — v7.0 (Phase 58, 59)
- ✓ **REFAC-05**: Orchestrator pattern (parent state, children presentational) — v7.0 (Phase 58, 59)

**Critical Path Testing:**
- ✓ **TEST-01**: Unit tests for scheduler check all paths — v7.0 (Phase 60)
- ✓ **TEST-02**: Tests cover state transitions (OFF→START→WORK) — v7.0 (Phase 60)
- ✓ **TEST-03**: Tests cover error scenarios — v7.0 (Phase 60)
- ✓ **TEST-04**: 80%+ branch coverage on scheduler route (80.07%) — v7.0 (Phase 60)

**Token Lifecycle:**
- ✓ **TOKEN-01**: Automated cleanup via cron — v7.0 (Phase 60)
- ✓ **TOKEN-02**: Stale tokens by last delivery timestamp — v7.0 (Phase 60)
- ✓ **TOKEN-03**: Cleanup logs for audit trail — v7.0 (Phase 60)
- ✓ **TOKEN-04**: Active tokens never deleted — v7.0 (Phase 60)

**v8.0 Fritz!Box Network Monitor (Shipped 2026-02-16):**

**Infrastructure:**
- ✓ **INFRA-01**: Server-side proxy API routes for Fritz!Box API — v8.0 (Phase 61)
- ✓ **INFRA-02**: Fritz!Box client with rate limiting (10 req/min) — v8.0 (Phase 61)
- ✓ **INFRA-03**: Firebase RTDB cache with 60s TTL — v8.0 (Phase 61)
- ✓ **INFRA-04**: Network device in device registry — v8.0 (Phase 61)
- ✓ **INFRA-05**: RFC 9457 error handling — v8.0 (Phase 61)
- ✓ **INFRA-06**: Fritz!Box connectivity check with setup guide — v8.0 (Phase 61)

**Dashboard & Network Page:**
- ✓ **DASH-01**: NetworkCard WAN status badge — v8.0 (Phase 62)
- ✓ **DASH-02**: Connected device count — v8.0 (Phase 62)
- ✓ **DASH-03**: Aggregate bandwidth display — v8.0 (Phase 62)
- ✓ **DASH-04**: NetworkCard links to /network — v8.0 (Phase 62)
- ✓ **DASH-05**: Health indicator with hysteresis — v8.0 (Phase 62)
- ✓ **WAN-01**: External IP with copy-to-clipboard — v8.0 (Phase 63)
- ✓ **WAN-02**: WAN status with uptime — v8.0 (Phase 63)
- ✓ **WAN-03**: DNS server and connection info — v8.0 (Phase 63)
- ✓ **DEV-01**: Device list with name/IP/MAC/status — v8.0 (Phase 63)
- ✓ **DEV-02**: Sort by any column — v8.0 (Phase 63)
- ✓ **DEV-03**: Search/filter devices — v8.0 (Phase 63)
- ✓ **DEV-04**: Paginated (25/page) with DataTable — v8.0 (Phase 63)
- ✓ **DEV-05**: Offline devices show last seen — v8.0 (Phase 63)

**Bandwidth & History:**
- ✓ **BW-01**: Real-time bandwidth chart (upload/download) — v8.0 (Phase 64)
- ✓ **BW-02**: Time range selection (1h/24h/7d) — v8.0 (Phase 64)
- ✓ **BW-03**: LTTB data decimation for 7-day view — v8.0 (Phase 64)
- ✓ **BW-04**: Adaptive polling (30s/5min) — v8.0 (Phase 64)
- ✓ **HIST-01**: Device event timeline — v8.0 (Phase 65)
- ✓ **HIST-02**: Filter by device — v8.0 (Phase 65)
- ✓ **HIST-03**: 24h default with 7-day option — v8.0 (Phase 65)

**Categorization & Correlation:**
- ✓ **CAT-01**: MAC vendor auto-categorization — v8.0 (Phase 66)
- ✓ **CAT-02**: Manual category override — v8.0 (Phase 66)
- ✓ **CAT-03**: Color-coded category badges — v8.0 (Phase 66)
- ✓ **CORR-01**: Bandwidth-stove power chart overlay — v8.0 (Phase 67)
- ✓ **CORR-02**: Analytics consent gate — v8.0 (Phase 67)
- ✓ **CORR-03**: Correlation insight text — v8.0 (Phase 67)

**v6.0 Operations, PWA & Analytics (Shipped 2026-02-11):**

**Persistent Rate Limiting:**
- ✓ **RATE-01**: Rate limiter notifiche usa Firebase RTDB transactions — v6.0 (Phase 49)
- ✓ **RATE-02**: Rate limits persistono tra cold starts Vercel — v6.0 (Phase 49)
- ✓ **RATE-03**: Sliding window con cleanup automatico — v6.0 (Phase 49)
- ✓ **RATE-04**: Rate limiter Netatmo API migrato a Firebase RTDB — v6.0 (Phase 49)
- ✓ **RATE-05**: Feature flag per rollout graduale — v6.0 (Phase 49)

**Cron Automation:**
- ✓ **CRON-01**: Health monitoring automatico ogni 5 minuti — v6.0 (Phase 50)
- ✓ **CRON-02**: Coordinazione stufa-termostato automatica — v6.0 (Phase 50)
- ✓ **CRON-03**: Scheduler entro timeout Vercel (fire-and-forget) — v6.0 (Phase 50)
- ✓ **CRON-04**: Dead man's switch per cron — v6.0 (Phase 50)
- ✓ **CRON-05**: Log esecuzione cron in dashboard — v6.0 (Phase 50)

**E2E Test Improvements:**
- ✓ **E2E-01**: Playwright auth setup con Auth0 reale — v6.0 (Phase 51)
- ✓ **E2E-02**: Session state caching (storageState) — v6.0 (Phase 51)
- ✓ **E2E-03**: Test accensione stufa — v6.0 (Phase 51)
- ✓ **E2E-04**: Test cambio schedule termostato — v6.0 (Phase 51)
- ✓ **E2E-05**: Test invio notifica push — v6.0 (Phase 51)
- ✓ **E2E-06**: CI GitHub Actions — v6.0 (Phase 51)

**Interactive Push Notifications:**
- ✓ **PUSH-01**: Action button "Spegni stufa" — v6.0 (Phase 52)
- ✓ **PUSH-02**: Action button "Imposta manuale" — v6.0 (Phase 52)
- ✓ **PUSH-03**: Service worker notificationclick handler — v6.0 (Phase 52)
- ✓ **PUSH-04**: Platform-specific FCM payloads — v6.0 (Phase 52)
- ✓ **PUSH-05**: Graceful degradation — v6.0 (Phase 52)
- ✓ **PUSH-06**: Offline Background Sync — v6.0 (Phase 52)

**PWA Offline & Install:**
- ✓ **PWA-01**: Banner "Sei offline" con timestamp — v6.0 (Phase 53)
- ✓ **PWA-02**: Staleness indicator su device cards — v6.0 (Phase 53)
- ✓ **PWA-03**: Controlli disabilitati offline — v6.0 (Phase 53)
- ✓ **PWA-04**: Coda comandi offline visibile — v6.0 (Phase 53)
- ✓ **PWA-05**: Toast conferma sync — v6.0 (Phase 53)
- ✓ **PWA-06**: Install prompt dopo 2+ visite — v6.0 (Phase 53)
- ✓ **PWA-07**: UI guidata install — v6.0 (Phase 53)
- ✓ **PWA-08**: Dismissal 30 giorni — v6.0 (Phase 53)

**Analytics Dashboard:**
- ✓ **ANLY-01**: Consent banner GDPR — v6.0 (Phase 54)
- ✓ **ANLY-02**: Modalità essenziali senza consenso — v6.0 (Phase 54)
- ✓ **ANLY-03**: Tracking ore accensione con power level — v6.0 (Phase 54)
- ✓ **ANLY-04**: Stima consumo pellet — v6.0 (Phase 54)
- ✓ **ANLY-05**: Grafico timeline utilizzo — v6.0 (Phase 54)
- ✓ **ANLY-06**: Grafico consumo pellet — v6.0 (Phase 54)
- ✓ **ANLY-07**: Correlazione meteo-consumi — v6.0 (Phase 54)
- ✓ **ANLY-08**: Stats cards con totali — v6.0 (Phase 54)
- ✓ **ANLY-09**: Aggregazione giornaliera via cron — v6.0 (Phase 54)
- ✓ **ANLY-10**: Dashboard pagina /analytics — v6.0 (Phase 54)
- ✓ **ANLY-11**: Calibrazione stima pellet — v6.0 (Phase 54)

### Active

**v8.1 Masonry Dashboard:**
- [ ] Masonry layout per card dashboard su desktop
- [ ] Ordine card preservato dalle impostazioni utente
- [ ] Mobile layout invariato (1 colonna)

### Out of Scope

- Notifiche email — Solo push notifications, no email
- Notifiche SMS — Costo elevato, non core value
- Notifiche programmate dall'utente — Scheduler già gestisce timing automatico
- Supporto altri provider (OneSignal, Pusher) — Firebase FCM sufficiente
- Real-time read receipts — Privacy concerns, battery drain
- Unlimited history retention — Database bloat + GDPR liability (90-day max)
- Silent background sync — iOS PWA unsupported
- Guaranteed delivery — FCM doesn't guarantee, false expectations
- Redis per rate limiting — Firebase RTDB transactions sufficient (validated v6.0)
- Real-time pellet sensor — Hardware out of scope, software estimation only
- Complex ML models per consumi — Euristica sufficient, ML deferred to future
- Third-party analytics (GA, Mixpanel) — Privacy-first approach, Firebase only
- Cron UI builder — Configuration via code sufficient

## Context

**Codebase:**
- Next.js 15.5 PWA con App Router
- Firebase Realtime Database per storage, analytics, network events
- Firestore per notification history
- Auth0 per autenticazione
- Service Worker (Serwist) per offline capability e notification actions
- Multi-device smart home control (stufa, termostato, luci, rete Fritz!Box)
- CVA + Radix UI design system (37+ components)
- react-error-boundary per crash isolation
- Fritz!Box TR-064 API via server-side proxy con rate limiting
- ~106,000 lines TypeScript (strict: true, noUncheckedIndexedAccess, allowJs: false)
- 550+ TypeScript source files, 3,700+ tests passing
- GitHub Actions cron (5-min schedule) per health monitoring e coordination
- GDPR-compliant analytics con consent banner
- 11 milestones shipped, 67 phases, 316 plans executed

**v8.0 Milestone (2026-02-13 → 2026-02-16):**
- 7 phases executed (18 plans, 38 tasks)
- 32/32 requirements satisfied (100%)
- 136 files changed (+25,643 insertions, -89 deletions)
- 81 git commits with atomic changes
- 3 days from phase 61 start to completion

**Known Issues:**
- Worker teardown warning (React 19 cosmetic, not actionable)
- 179 unused exports remain (131 intentional design system barrel, 48 utility)
- 2 knip false positives (app/sw.ts, firebase-messaging-sw.js)
- iOS notification category registration in PWA needs verification
- Consent enforcement is caller responsibility (not middleware-enforced)
- Visual parity human verification pending for refactored LightsCard and stove/page.tsx
- 3 pre-existing vibration API test warnings
- Fritz!Box rate limit budget shared across all API calls (10 req/min)
- Self-hosted Fritz!Box API connectivity depends on myfritz.net (may timeout off-network)
- CopyableIp uses plain button instead of design system Button (test simplicity)

**User Feedback:**
- None yet (awaiting operational deployment)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dual persistence (IndexedDB + localStorage) | Prevents token loss across browser restarts | ✓ Good — Browser restart survival verified (v1.0) |
| Firebase Realtime Database for tokens | Low latency, consistency with project architecture | ✓ Good — Multi-device support working (v1.0) |
| Firestore for notification history | Complex queries, pagination support | ✓ Good — Cursor-based pagination performant (v1.0) |
| Non-blocking fire-and-forget logging | Logging failures shouldn't block notifications | ✓ Good — Pattern reused in analytics (v1.0, v6.0) |
| RTDB migration for preferences | Architectural consistency, real-time sync | ✓ Good — Cross-device sync instant (v1.0) |
| HMAC-secured cron webhook | Security without API key rotation | ✓ Good — Timing-safe comparison prevents attacks (v1.0) |
| Breaking changes OK | Permette refactoring completo senza vincoli legacy | ✓ Good — Enabled dual persistence implementation (v1.0) |
| Firebase FCM retained | Già integrato, multi-platform support, affidabile | ✓ Good — Leveraged existing infrastructure (v1.0) |
| Open-Meteo API | Free, no API key, reliable, comprehensive data | ✓ Good — Weather infrastructure operational (v3.2) |
| Per-user dashboard prefs | Proper isolation, Firebase RTDB consistency | ✓ Good — Users have independent preferences (v3.2) |
| Card component registry | Easy extension, clean code, reduced lines | ✓ Good — Adding cards is trivial (v3.2) |
| git mv for TS migration | Preserves git blame and history | ✓ Good — Full history retained (v5.0) |
| Pragmatic `as any` for external APIs | Hue/Netatmo/OpenMeteo have no official TS types | ✓ Good — Unblocked migration (v5.0) |
| jest.mocked() pattern | Type-safe mock access without manual casting | ✓ Good — Clean test patterns (v5.0) |
| allowJs: false lockdown | Prevents accidental JS file creation | ✓ Good — Regression prevention (v5.0) |
| Parallel wave execution | 5 agents in parallel for independent plans | ✓ Good — 4x faster phase execution (v5.0) |
| Enable strict: true incrementally | Fix lib/ → components → app/ → tests layer by layer | ✓ Good — Zero cascade regressions (v5.1) |
| noUncheckedIndexedAccess | Full index safety across arrays and objects | ✓ Good — Catches real bugs at compile time (v5.1) |
| knip for dead code analysis | Automated unused file/dep/export detection | ✓ Good — Found 40 files, 4 deps, 203 exports (v5.1) |
| Firebase RTDB for rate limiting | Transactions provide atomicity without Redis | ✓ Good — Survives cold starts, no extra infra (v6.0) |
| GitHub Actions for cron | External HTTP scheduler, no stateful server | ✓ Good — 5-min schedule operational (v6.0) |
| Playwright with real Auth0 | Session caching prevents redundant logins | ✓ Good — Realistic E2E without mocks (v6.0) |
| Platform-specific FCM payloads | iOS aps.category, Android clickAction | ✓ Good — Cross-platform actions (v6.0) |
| Consent-first analytics | GDPR blocks all tracking without opt-in | ✓ Good — Compliant by default (v6.0) |
| Fire-and-forget analytics | Errors logged but never thrown | ✓ Good — Analytics never blocks stove control (v6.0) |
| 7-day retention for analytics events | Balances dashboard utility with storage costs | ✓ Good — Matches cronExecutionLogger pattern (v6.0) |
| Visual parity GDPR buttons | Accept/Reject identical styling per EU 2026 | ✓ Good — No dark patterns (v6.0) |
| Exponential backoff retry client | Auto-retry transient network errors, manual retry device-offline | ✓ Good — Single retry layer prevents amplification (v7.0) |
| Firebase RTDB idempotency keys | Dual storage (by ID + by hash) with 1-hour TTL | ✓ Good — Prevents duplicate stove commands (v7.0) |
| react-error-boundary library | Battle-tested, hooks support, better than manual implementation | ✓ Good — Clean error isolation per device card (v7.0) |
| ValidationError bypass | Safety-critical errors (needsCleaning) propagate through boundaries | ✓ Good — Safety alerts never swallowed (v7.0) |
| Page Visibility API for polling | Pause non-critical polling when tab hidden | ✓ Good — Resource savings without safety compromise (v7.0) |
| alwaysActive flag for stove | Stove polling never pauses regardless of visibility | ✓ Good — Safety-critical polling preserved (v7.0) |
| Orchestrator pattern for components | Custom hooks + presentational sub-components, ~200 LOC orchestrator | ✓ Good — 82-87% LOC reduction, testable (v7.0) |
| Token cleanup by delivery timestamp | lastUsed updated on FCM delivery, not app open | ✓ Good — Accurate stale detection (v7.0) |
| Server-side API proxy for Fritz!Box | API key never exposed to client, rate limiting on server | ✓ Good — Secure integration (v8.0) |
| Fritz!Box rate limiting (10 req/min, 6s delay) | Prevents overwhelming home router with API calls | ✓ Good — Balanced with 60s cache TTL (v8.0) |
| Firebase RTDB for network event logging | Date-keyed paths for efficient range queries, fire-and-forget pattern | ✓ Good — Multi-day queries via Promise.all (v8.0) |
| LTTB decimation algorithm | Reduces 10080 → 500 data points for 7-day bandwidth chart | ✓ Good — Renders <1s on mobile (v8.0) |
| MAC vendor auto-categorization | macvendors.com API with 7-day cache, Firebase override priority | ✓ Good — Self-heals on failure, batch enrichment (v8.0) |
| Pearson correlation for bandwidth-stove | Minute-aligned buffering, consent-gated, Italian insight text | ✓ Good — Meaningful analysis with 30+ data points (v8.0) |
| No new dependencies for v8.0 | Recharts, DataTable, date-fns already in codebase | ✓ Good — Zero dependency growth (v8.0) |

## Constraints

- **Platform**: PWA deve funzionare su iOS e Android (Safari, Chrome, Firefox)
- **Provider**: Mantenere Firebase FCM (no switch provider)
- **Tech stack**: Next.js 15.5, Firebase 12.8.0, React 19.2.0
- **Node runtime**: Firebase Admin SDK richiede Node.js runtime (no Edge)
- **Deployment**: Vercel (current hosting platform)
- **Privacy**: GDPR-compliant analytics (consent-first, no third-party tracking)

---
*Last updated: 2026-02-17 after v8.1 milestone start (Masonry Dashboard)*
