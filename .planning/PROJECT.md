# Pannello Stufa - Smart Home Control PWA

## What This Is

PWA completa per controllo smart home: stufa Thermorossi, termostato Netatmo, luci Philips Hue, monitoraggio rete Fritz!Box, e monitoraggio server Raspberry Pi — tutti i dispositivi collegati tramite un unico client HomeAssistant API condiviso (singolo base URL + X-API-Key auth). Include sistema notifiche push production-ready con action buttons interattive, monitoring automatico stufa con cron GitHub Actions, offline mode avanzato con staleness indicators, PWA install prompt guidato, analytics dashboard GDPR-compliant con stima consumo pellet e correlazione meteo. Monitoraggio rete Fritz!Box con dashboard card, pagina dedicata /network con WAN status, device list con categorizzazione automatica, bandwidth charts con decimation LTTB, device history timeline, e correlazione bandwidth-stufa con consent gate. Monitoraggio Raspberry Pi con dashboard card (CPU/RAM/disk/temp/health) e pagina dedicata /raspi con statistiche complete. Dashboard home con masonry layout (flexbox two-column split) che elimina gap verticali tra card di altezze diverse, con Suspense streaming e skeleton fallback per card individuali. Applicazione resiliente con retry automatico + idempotency, error boundaries per crash isolation, adaptive polling via Page Visibility API con stagger iniziale per evitare thundering herd, e componenti refactored con orchestrator pattern (~85% LOC reduction). Performance ottimizzata con React Compiler auto-memoization, code splitting Recharts via next/dynamic, font self-hosted via next/font, e Web Vitals pipeline. Codebase interamente in TypeScript con strict mode completo e zero errori di compilazione.

## Core Value

I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## Current Milestone: v14.1 Tech Debt & Type Safety

**Goal:** Eliminare `as any` dai sorgenti, risolvere tutti i known issues, migliorare la leggibilita del codice.

**Target features:**
- Known issues fix (debug panel, dead code, type mismatches, design system compliance)
- `as any` elimination across lib/ and app/ (~81 occurrences in 36 files)
- Dead code & TODO cleanup

## Current State

**Version:** v14.1 (in progress)
**Status:** Phase 116 complete — all `as any` casts eliminated from app/ route files and page components (scheduler adminDbGet generics, Netatmo module typing, weather response interfaces, sw.ts declare global augmentations, page prop type alignment). lib/ + components/ + app/ routes & pages layers fully type-safe. All 5 device providers use shared HA proxy.

**Tech Stack:**
- Next.js 15.5 PWA with App Router
- React Compiler 1.0 (auto-memoization, 271/271 components)
- Firebase (Realtime Database for tokens/cache/analytics/network events, Firestore for history)
- Auth0 for authentication
- Playwright for E2E testing
- Recharts for visualization (code-split via next/dynamic on sub-pages)
- CVA (class-variance-authority) for type-safe component variants
- Radix UI primitives for accessible interactions
- react-error-boundary for crash isolation
- GitHub Actions for cron automation (5-min schedule)
- Fritz!Box TR-064 API integration via server-side proxy
- Shared HomeAssistant API client (`haGet`/`haPost`/`haPut`) for all 5 providers (Thermorossi, Netatmo, Fritz!Box, Raspberry Pi, Hue)
- Netatmo integration via local HomeAssistant proxy (X-API-Key auth, SQLite-backed)
- Raspberry Pi monitoring (health, CPU, memory, disk, system) via shared HA client
- Web Vitals pipeline (useReportWebVitals + sendBeacon + Firebase RTDB)
- ~103,000 lines TypeScript (strict: true, noUncheckedIndexedAccess, allowJs: false, React Compiler auto-memoization)

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

**v8.1 Masonry Dashboard (Shipped 2026-02-18):**

**Layout:**
- ✓ **LAYOUT-01**: Masonry layout su desktop (2 colonne, nessun gap verticale) — v8.1 (Phase 68)
- ✓ **LAYOUT-02**: Ordine card rispetta impostazioni utente (parity split) — v8.1 (Phase 68)
- ✓ **LAYOUT-03**: Layout mobile invariato (colonna singola) — v8.1 (Phase 68)

**Animation:**
- ✓ **ANIM-01**: Spring-in stagger animation con flat-index delay — v8.1 (Phase 68)
- ✓ **ANIM-02**: Transizione smooth altezza card (transition-all) — v8.1 (Phase 68)

**Edge Cases:**
- ✓ **EDGE-01**: Single card full-width (right column removed from DOM) — v8.1 (Phase 69)
- ✓ **EDGE-02**: Odd card count corretto (left.length === right.length + 1) — v8.1 (Phase 69)
- ✓ **EDGE-03**: ErrorFallback min-h-[160px] previene collasso colonna — v8.1 (Phase 69)

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

**v9.0 Performance Optimization (Shipped 2026-02-19):**

**Measurement & Baseline:**
- ✓ **MEAS-01**: Bundle size analysis with per-route JS breakdown — v9.0 (Phase 70)
- ✓ **MEAS-02**: Lighthouse performance score baseline — v9.0 (Phase 70)
- ✓ **MEAS-03**: Web Vitals pipeline (LCP, INP, CLS, FCP, TTFB) — v9.0 (Phase 70)
- ✓ **MEAS-04**: Phase-over-phase delta comparison script — v9.0 (Phase 70)

**Font & Resource Optimization:**
- ✓ **FONT-01**: Self-hosted fonts via next/font (zero CDN roundtrip) — v9.0 (Phase 70)
- ✓ **FONT-02**: Zero layout shift from font loading (CLS improvement) — v9.0 (Phase 70)
- ✓ **FONT-03**: Preconnect hints for Firebase, Auth0 — v9.0 (Phase 70)

**React Compiler:**
- ✓ **COMP-01**: Auto-memoization replacing manual useMemo/useCallback — v9.0 (Phase 71)
- ✓ **COMP-02**: Zero regressions after compiler enablement (4,004 tests) — v9.0 (Phase 71)
- ✓ **COMP-03**: Healthcheck validating Rules of React compliance (271/271) — v9.0 (Phase 71)

**Code Splitting:**
- ✓ **SPLIT-01**: Recharts deferred on /network via next/dynamic — v9.0 (Phase 72)
- ✓ **SPLIT-02**: Recharts deferred on /analytics via next/dynamic — v9.0 (Phase 72)
- ✓ **SPLIT-03**: Consent-gated chart never downloaded without consent — v9.0 (Phase 72)
- ✓ **SPLIT-04**: PWA offline functionality intact after code splitting — v9.0 (Phase 72)

**Render Optimization:**
- ✓ **REND-01**: Chart updates without full SVG re-render (React.memo) — v9.0 (Phase 73)
- ✓ **REND-02**: Staggered dashboard card loading (0-500ms spread) — v9.0 (Phase 73)
- ✓ **REND-03**: Stable data references preventing unnecessary re-renders — v9.0 (Phase 73)
- ✓ **REND-04**: Debounced thermostat writes (max 1 per 500ms) — v9.0 (Phase 73)

**Suspense Streaming:**
- ✓ **SUSP-01**: Skeleton fallbacks for each dashboard card during loading — v9.0 (Phase 74)
- ✓ **SUSP-02**: Cards stream in progressively as data available — v9.0 (Phase 74)
- ✓ **SUSP-03**: Stove card always loads first (safety-critical priority) — v9.0 (Phase 74)

**v10.0 Netatmo API Migration (Shipped 2026-03-16):**

**API Client:**
- ✓ **API-01**: Netatmo calls proxied through local API — v10.0 (Phase 75)
- ✓ **API-02**: X-API-Key authentication replacing OAuth — v10.0 (Phase 75, 80)
- ✓ **API-03**: Data freshness handling (LIVE/STALE/UNREACHABLE) — v10.0 (Phase 75)
- ✓ **API-04**: RFC 9457 error propagation — v10.0 (Phase 75)

**Energy (Thermostat):**
- ✓ **ENERGY-01**: Room temperatures from proxy /homestatus — v10.0 (Phase 75)
- ✓ **ENERGY-02**: Home topology from proxy /homesdata — v10.0 (Phase 75)
- ✓ **ENERGY-03**: Set room temperature via proxy — v10.0 (Phase 76, 82)
- ✓ **ENERGY-04**: Set thermostat mode via proxy — v10.0 (Phase 76, 82)
- ✓ **ENERGY-05**: Switch schedule via proxy — v10.0 (Phase 76, 80)
- ✓ **ENERGY-06**: Sync schedule via proxy — v10.0 (Phase 76)
- ✓ **ENERGY-07**: Historical measurements via proxy — v10.0 (Phase 76)

**Camera:**
- ✓ **CAM-01**: Camera status via proxy — v10.0 (Phase 77)
- ✓ **CAM-02**: Camera stream URLs via proxy — v10.0 (Phase 77)
- ✓ **CAM-03**: Camera snapshot via proxy — v10.0 (Phase 77)
- ✓ **CAM-04**: Camera events via proxy — v10.0 (Phase 77)
- ✓ **CAM-05**: Camera monitoring toggle via proxy — v10.0 (Phase 77, 83)
- ✓ **CAM-06**: Event snapshot binary via proxy — v10.0 (Phase 77)

**Valve & Health:**
- ✓ **VALVE-01**: Valve status via dedicated proxy endpoint — v10.0 (Phase 78)
- ✓ **VALVE-02**: Valve calibration via proxy — v10.0 (Phase 78)
- ✓ **HEALTH-01**: Netatmo provider health via proxy — v10.0 (Phase 78)
- ✓ **HEALTH-02**: Cron health check uses proxy — v10.0 (Phase 78)

**Cleanup:**
- ✓ **CLEAN-01** through **CLEAN-07**: All OAuth infrastructure deleted — v10.0 (Phase 79, 80, 81)

**v11.0 API Unification & Raspberry Pi Monitor (Shipped 2026-03-18):**

**Shared API Infrastructure:**
- ✓ **API-01**: Shared HA proxy client with single base URL + X-API-Key auth — v11.0 (Phase 84)
- ✓ **API-02**: Generic GET/POST helpers with AbortController timeout + RFC 9457 — v11.0 (Phase 84)
- ✓ **API-03**: Single env var pair (HA_API_URL + HA_API_KEY) — v11.0 (Phase 84)
- ✓ **API-04**: Fritz!Box migrated to shared client (JWT removed) — v11.0 (Phase 85)
- ✓ **API-05**: Fritz!Box routes no behavior change — v11.0 (Phase 85)
- ✓ **API-06**: Fritz!Box caching + rate limiting preserved — v11.0 (Phase 85)
- ✓ **API-07**: Netatmo migrated to shared client (env vars removed) — v11.0 (Phase 86)
- ✓ **API-08**: Netatmo convenience wrappers preserved — v11.0 (Phase 86)
- ✓ **API-09**: Netatmo routes no behavior change — v11.0 (Phase 86)
- ✓ **API-10**: Dead client modules cleaned up — v11.0 (Phase 87)

**Raspberry Pi Monitoring:**
- ✓ **RASPI-01**: Proxy client for 5 endpoints — v11.0 (Phase 88)
- ✓ **RASPI-02**: TypeScript types matching API schemas — v11.0 (Phase 88)
- ✓ **RASPI-03**: Next.js API routes proxying endpoints — v11.0 (Phase 88)
- ✓ **RASPI-04**: Device registry + adaptive polling — v11.0 (Phase 89)
- ✓ **RASPI-05**: RaspiCard (CPU%, RAM%, disk%, temp, badge) — v11.0 (Phase 89)
- ✓ **RASPI-06**: /raspi page with full system stats — v11.0 (Phase 90)
- ✓ **RASPI-07**: Error boundary + loading skeleton — v11.0 (Phase 89)
- ✓ **RASPI-08**: Cron health includes Raspberry Pi — v11.0 (Phase 90)

**v11.1 Test Suite & Tech Debt Cleanup (Shipped 2026-03-18):**

**Test Infrastructure:**
- ✓ **JEST-01**: Playwright .spec.ts files excluded from Jest runner — v11.1 (Phase 92)
- ✓ **JEST-02**: Flaky tests pass reliably in full suite run (no ordering dependency) — v11.1 (Phase 92)
- ✓ **TFIX-01** through **TFIX-08**: All 8 API/infrastructure test suites fixed — v11.1 (Phase 93)
- ✓ **TFIX-09** through **TFIX-12**: All 4 component/hook test suites fixed — v11.1 (Phase 94)

**Tech Debt:**
- ✓ **DEBT-01**: ~179 useMemo/useCallback call-sites removed (React Compiler handles it) — v11.1 (Phase 95)
- ✓ **DEBT-02**: 8 stale env vars removed from .env.local — v11.1 (Phase 95)

**v12.0 Data Fetching Simplification & E2E Verification (Shipped 2026-03-19):**

**Polling Simplification:**
- ✓ **POLL-01**: StoveCard usa useAdaptivePolling (60s) invece del polling loop custom — v12.0 (Phase 96)
- ✓ **POLL-02**: Firebase RTDB real-time listener della stufa rimosso — v12.0 (Phase 96)
- ✓ **POLL-03**: sync-external-state call rimossa dal ciclo fetch stufa — v12.0 (Phase 96)
- ✓ **POLL-04**: ThermostatCard polling esteso a 60s — v12.0 (Phase 96)
- ✓ **POLL-05**: LightsCard polling esteso a 60s — v12.0 (Phase 96)
- ✓ **POLL-06**: NetworkCard polling esteso a 60s visible / 5min hidden — v12.0 (Phase 96)
- ✓ **POLL-07**: RaspiCard polling esteso a 60s visible / 5min hidden — v12.0 (Phase 96)
- ✓ **POLL-08**: useDeviceStaleness polling rimosso o esteso a 60s — v12.0 (Phase 96)

**E2E Page Verification:**
- ✓ **E2E-01** through **E2E-10**: Playwright verification for all 9 pages — v12.0 (Phase 97)

**v13.0 Thermorossi Proxy Migration (Shipped 2026-03-20):**

**Proxy Client:**
- ✓ **CLIENT-01**: Thermorossi proxy client uses shared haGet/haPost transport — v13.0 (Phase 99)
- ✓ **CLIENT-02**: TypeScript types for all proxy response interfaces — v13.0 (Phase 99)
- ✓ **CLIENT-03**: Convenience wrappers for each endpoint — v13.0 (Phase 99)

**Read Endpoints:**
- ✓ **READ-01**: GET /status migrated with stove_state, data_freshness, error_code — v13.0 (Phase 99)
- ✓ **READ-02**: GET /power migrated with data_freshness — v13.0 (Phase 99)
- ✓ **READ-03**: GET /fan-level migrated with data_freshness — v13.0 (Phase 99)
- ✓ **READ-04**: GET /health migrated — v13.0 (Phase 99)
- ✓ **READ-05**: GET /history with auto-granularity pagination — v13.0 (Phase 100)

**Control Endpoints:**
- ✓ **CMD-01**: POST /commands/ignit via proxy (202 Accepted) — v13.0 (Phase 100)
- ✓ **CMD-02**: POST /commands/shutdown via proxy (202 Accepted) — v13.0 (Phase 100)
- ✓ **CMD-03**: POST /settings/power with { value: N } — v13.0 (Phase 104)
- ✓ **CMD-04**: POST /settings/fan-level with { value: N } — v13.0 (Phase 104)
- ✓ **CMD-05**: POST /settings/temperature/water — v13.0 (Phase 100)

**Frontend:**
- ✓ **UI-01**: useStoveData reads stove_state exact equality — v13.0 (Phase 101)
- ✓ **UI-02**: stoveStatusUtils rewritten for exact matching — v13.0 (Phase 101)
- ✓ **UI-03**: useStoveCommands handles 202 Accepted — v13.0 (Phase 104)
- ✓ **UI-04**: Error display uses error_code/error_description — v13.0 (Phase 101)
- ✓ **UI-05**: data_freshness replaces custom staleness — v13.0 (Phase 101)

**Scheduler/Cron:**
- ✓ **CRON-01**: Scheduler reads stove_state instead of StatusDescription — v13.0 (Phase 102)
- ✓ **CRON-02**: Health monitoring reads error_code/error_description — v13.0 (Phase 102)
- ✓ **CRON-03**: All scheduler calls route through proxy client — v13.0 (Phase 102)

**Cleanup:**
- ✓ **CLEAN-01**: WiNet direct API client deleted — v13.0 (Phase 103)
- ✓ **CLEAN-02**: WiNet API key removed — v13.0 (Phase 103)
- ✓ **CLEAN-03**: Sandbox mode removed — v13.0 (Phase 103)
- ✓ **CLEAN-04**: Dead API routes removed — v13.0 (Phase 105)

**Debug Panel:**
- ✓ **DEBUG-01**: StoveTab updated with proxy endpoints — v13.0 (Phase 105)

**v14.0 Hue Proxy Migration (Shipped 2026-03-22):**

**Proxy Client:**
- ✓ **CLIENT-01**: Hue proxy client uses shared haGet/haPost transport (X-API-Key auth) — v14.0 (Phase 106)
- ✓ **CLIENT-02**: TypeScript types for all proxy response interfaces — v14.0 (Phase 106)
- ✓ **CLIENT-03**: Convenience wrappers for each endpoint — v14.0 (Phase 106)

**Read Endpoints:**
- ✓ **READ-01**: GET /lights migrated with capability_tier, ct_kelvin, room enrichment — v14.0 (Phase 106)
- ✓ **READ-02**: GET /lights/{light_id} migrated — v14.0 (Phase 106)
- ✓ **READ-03**: GET /groups migrated with member lights array — v14.0 (Phase 110)
- ✓ **READ-04**: GET /groups/{group_id} migrated — v14.0 (Phase 106)
- ✓ **READ-05**: GET /scenes migrated with group_id filter — v14.0 (Phase 106)
- ✓ **READ-06**: GET /health migrated with data_freshness — v14.0 (Phase 106)
- ✓ **READ-07**: GET /history migrated with auto-granularity pagination — v14.0 (Phase 106)

**Control Endpoints:**
- ✓ **CMD-01**: PUT /lights/{id}/state via proxy (202 Accepted, v1 body) — v14.0 (Phase 107, 110)
- ✓ **CMD-02**: PUT /groups/{id}/action via proxy (202 Accepted) — v14.0 (Phase 107, 110)
- ✓ **CMD-03**: POST /groups/{gid}/scenes/{sid} via proxy (202 Accepted) — v14.0 (Phase 107, 110)
- ✓ **CMD-04**: Frontend handles 409 Conflict for unreachable lights — v14.0 (Phase 107)

**Frontend:**
- ✓ **UI-01**: useLightsData reads proxy response shapes (flat format, capability_tier) — v14.0 (Phase 108, 110)
- ✓ **UI-02**: useLightsCommands sends v1 body format (on/bri/ct/xy) — v14.0 (Phase 108, 110)
- ✓ **UI-03**: Brightness conversion 0-100% ↔ 0-254 at client boundary — v14.0 (Phase 108)
- ✓ **UI-04**: Scene activate uses new path pattern — v14.0 (Phase 108, 110)
- ✓ **UI-05**: 202 Accepted + suggested_poll_delay_s drives delayed refresh — v14.0 (Phase 108)
- ✓ **UI-06**: data_freshness replaces custom staleness/connection checks — v14.0 (Phase 108)

**Cleanup:**
- ✓ **CLEAN-01**: CLIP v2 local API client deleted — v14.0 (Phase 109)
- ✓ **CLEAN-02**: v1 remote/cloud API client deleted — v14.0 (Phase 109)
- ✓ **CLEAN-03**: Connection strategy deleted — v14.0 (Phase 109)
- ✓ **CLEAN-04**: Bridge discovery and pairing routes deleted — v14.0 (Phase 110)
- ✓ **CLEAN-05**: OAuth token management deleted — v14.0 (Phase 110)
- ✓ **CLEAN-06**: Firebase bridge credentials persistence deleted — v14.0 (Phase 110)
- ✓ **CLEAN-07**: Hue-specific env vars removed — v14.0 (Phase 109)

### Active

**v14.1 Tech Debt & Type Safety:**
- [ ] Known issues fix (debug panel, dead code, type mismatches, design system compliance)
- [ ] `as any` elimination in lib/ (16 occurrences, 6 files)
- [ ] `as any` elimination in app/ components (~35 occurrences)
- [ ] `as any` elimination in app/ routes & pages (~30 occurrences)
- [ ] Dead code & TODO cleanup (unused exports, lib/ TODOs)

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
- Next.js 15.5 PWA con App Router + React Compiler 1.0
- Firebase Realtime Database per storage, analytics, network events, Web Vitals
- Firestore per notification history
- Auth0 per autenticazione
- Service Worker (Serwist) per offline capability e notification actions
- Multi-device smart home control (stufa, termostato, luci, rete Fritz!Box, Raspberry Pi)
- CVA + Radix UI design system (37+ components)
- react-error-boundary per crash isolation
- Fritz!Box TR-064 API via server-side proxy con rate limiting
- Netatmo integration via local HomeAssistant proxy (X-API-Key auth, SQLite-backed data)
- Recharts code-split via next/dynamic su /network e /analytics
- Self-hosted Outfit + Space Grotesk fonts via next/font
- Web Vitals pipeline (useReportWebVitals → sendBeacon → Firebase RTDB → dashboard)
- Suspense streaming con loading.tsx skeleton shell + per-card boundaries
- ~103,000 lines TypeScript (strict: true, noUncheckedIndexedAccess, allowJs: false)
- 560+ TypeScript source files, 4,000+ tests passing
- GitHub Actions cron (5-min schedule) per health monitoring e coordination (stove, thermostat, Raspberry Pi)
- GDPR-compliant analytics con consent banner
- Playwright E2E smoke tests for all 9 app pages
- All device polling unified at 60s via useAdaptivePolling (no Firebase RTDB real-time listener)
- 19 milestones shipped, 112 phases, 398 plans executed

**v14.0 Milestone (2026-03-20 → 2026-03-22):**
- 7 phases executed (12 plans, 4 core + 3 gap closure)
- 27/27 requirements satisfied (100%)
- 124 files changed (+12,527 insertions, -7,269 deletions, net +5,258 LOC)
- 75 git commits with atomic changes
- 2 days from phase 106 start to completion
- All 5 device providers now use shared HA proxy (migration complete)

**Known Issues:**
- Worker teardown warning (React 19 cosmetic, not actionable)
- 179 unused exports remain (131 intentional design system barrel, 48 utility)
- 2 knip false positives (app/sw.ts, firebase-messaging-sw.js)
- iOS notification category registration in PWA needs verification
- Consent enforcement is caller responsibility (not middleware-enforced)
- Visual parity human verification pending for refactored LightsCard and stove/page.tsx
- 3 pre-existing vibration API test warnings
- 1 FormModal isolation flake in full-suite runs (pre-existing, passes in isolation)
- Fritz!Box rate limit budget shared across all API calls (10 req/min)
- Self-hosted Fritz!Box API connectivity depends on myfritz.net (may timeout off-network)
- CopyableIp uses plain button instead of design system Button (test simplicity)
- 3 Netatmo routes without frontend consumer (synchomeschedule, createnewhomeschedule, getroommeasure)
- Netatmo proxy connectivity depends on myfritz.net (same risk as Fritz!Box)
- DataTable retains 5 useMemo for TanStack Table referential stability (intentional exception)

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
| Two-column flexbox split by parity | CSS columns fill column-first (breaks order), Grid masonry spec unstable, JS libraries overkill | ✓ Good — SSR-safe, zero deps, preserves Firebase order (v8.1) |
| Dual render blocks (sm:hidden + hidden sm:flex) | Single responsive block risks column-first ordering on mobile | ✓ Good — Mobile stays flat, desktop gets masonry (v8.1) |
| splitIntoColumns pure utility extraction | Testable in isolation, reusable pattern | ✓ Good — 7 unit tests covering all edge cases (v8.1) |
| Self-hosted fonts via next/font | Eliminates Google CDN roundtrip, adjustFontFallback prevents CLS | ✓ Good — Zero external font requests (v9.0) |
| Web Vitals not consent-gated | Technical infrastructure data, not user behavioral analytics | ✓ Good — Metrics available without GDPR opt-in (v9.0) |
| React Compiler 1.0 global enablement | 271/271 components pass healthcheck, no opt-outs needed | ✓ Good — Zero new regressions, auto-memoization (v9.0) |
| next/dynamic for Recharts code splitting | ssr: false defers ~200 KB chart JS from initial payload | ✓ Good — Sub-pages load faster (v9.0) |
| initialDelay for useAdaptivePolling | Backward-compatible (default 0), staggers dashboard fetches | ✓ Good — Thundering herd eliminated (v9.0) |
| Thermostat debounced writes (500ms) | Reduces API calls during rapid setpoint adjustments | ✓ Good — Max 1 write per 500ms burst (v9.0) |
| DashboardCards async Server Component | Extracts auth + deviceConfig fetch from page shell | ✓ Good — Page renders synchronously, data streams (v9.0) |
| Per-card Suspense with CARD_SKELETONS registry | Mirrors CARD_COMPONENTS exactly, declarative fallback lookup | ✓ Good — Cards stream individually (v9.0) |
| DeviceCardErrorBoundary outside Suspense | Error boundaries must catch Suspense errors, not vice versa | ✓ Good — Correct error/loading hierarchy (v9.0) |
| Local proxy replacing Netatmo Cloud API | Eliminates OAuth complexity, single API key auth, SQLite-backed data | ✓ Good — Net -3,848 lines, simpler architecture (v10.0) |
| Function module for proxy client | No JWT state to manage, simpler than class-based Fritz!Box client | ✓ Good — Testable, consistent pattern (v10.0) |
| RFC 9457 error mapping | Structured error responses from proxy mapped to ApiError instances | ✓ Good — Frontend error boundaries handle cleanly (v10.0) |
| Audit-driven gap closure phases | Milestone audit identified integration gaps before shipping | ✓ Good — Caught home_id missing, camera toggle missing (v10.0) |
| homeId as optional prop threading | Pass from topology state through component tree, not re-fetched | ✓ Good — Single source of truth (v10.0) |
| Shared haClient function module | Single transport for all HA providers, eliminates duplicated fetch logic | ✓ Good — 3 providers share one client (v11.0) |
| X-API-Key replacing JWT + OAuth | One env var pair for all providers, no token refresh complexity | ✓ Good — Dramatic simplification (v11.0) |
| Function module for all provider clients | Consistent pattern: fritzboxClient, netatmoProxy, raspiClient as function modules | ✓ Good — No class state, testable, matches haClient (v11.0) |
| Raspberry Pi informational cron | Pi failure uses console.warn, isolated try/catch, never blocks stove/thermostat | ✓ Good — Non-critical monitoring doesn't affect safety-critical paths (v11.0) |
| 302 redirect for camera snapshot | Browser loads CDN URL directly, resilient to server network topology | ✓ Good — Handles proxy deployment variations (v11.0) |
| SERVICE_UNAVAILABLE retry (5 attempts) | Proxy warm-up is transient, not fatal — 3s delay between retries | ✓ Good — Schedule/room data loads reliably after cold start (v11.0) |
| testPathIgnorePatterns for Playwright | Cleanly separates Jest unit tests from Playwright E2E .spec.ts files | ✓ Good — No false failures from Playwright discovery (v11.1) |
| resetAllMocks + explicit beforeEach | clearAllMocks doesn't reset mockReturnValue/mockImplementation | ✓ Good — 4 flaky suites fixed, ordering-independent (v11.1) |
| Static imports for Jest mock interception | Dynamic `await import()` inside functions bypasses Jest module mocks | ✓ Good — withIdempotency tests pass reliably (v11.1) |
| React Compiler replaces manual memoization | 271/271 components auto-memoized, manual useMemo/useCallback redundant | ✓ Good — ~179 call-sites removed, net -264 LOC (v11.1) |
| DataTable useMemo exception | TanStack Table requires stable references for columns/data config | ✓ Good — 5 useMemo retained as intentional exception (v11.1) |
| useAdaptivePolling(60s) for stove | Replaces Firebase RTDB listener + custom polling loop, alwaysActive preserves safety | ✓ Good — Simpler architecture, consistent with all device hooks (v12.0) |
| SPARKLINE_MAX_POINTS stays at 120 | 2h of sparkline history at 60s intervals is acceptable | ✓ Good — No user-visible regression (v12.0) |
| Stove-specific staleness thresholds | 90s when on, 180s when off via optional thresholdMs param | ✓ Good — Safety-critical staleness detection preserved (v12.0) |
| collectConsoleErrors helper pattern | Attach listener before goto, cleanup before assertion | ✓ Good — Prevents late-arriving messages from polluting error arrays (v12.0) |
| E2E-09 /admin maps to /debug | No /admin route exists, debug page serves admin function | ✓ Good — Requirement satisfied by existing route (v12.0) |
| Thermorossi proxy as function module | Consistent with Netatmo/Fritz!Box/Raspi pattern, no class state | ✓ Good — Unified 4 providers on same pattern (v13.0) |
| stove_state exact equality (switch/case) | TypeScript exhaustiveness check, no regex/substring on status strings | ✓ Good — Catches missing state variants at compile time (v13.0) |
| 202 Accepted + suggested_poll_delay_s | Proxy convention for async commands, drives delayed refresh timing | ✓ Good — 15s for ignit/shutdown, 5s for settings (v13.0) |
| Single getStatus() replacing 3-way Promise.all | Proxy response includes fan_level and power_level in status | ✓ Good — Scheduler reduced from 3 calls to 1 (v13.0) |
| Audit-driven gap closure (Phases 104-105) | Milestone audit found 3 integration breaks before shipping | ✓ Good — Body key mismatch + debug URLs caught pre-ship (v13.0) |
| Hue proxy with haPut transport | PUT method for light/group control, consistent with haGet/haPost pattern | ✓ Good — All 5 providers unified on shared transport (v14.0) |
| CLIP v1 flat body format via proxy | Proxy uses v1 (on/bri/ct/xy) not CLIP v2 nested objects — simpler, sufficient | ✓ Good — Frontend code dramatically simplified (v14.0) |
| Audit-driven gap closure (Phases 110-112) | 3 audit rounds caught 7 integration gaps (full pages, types, debug panel) | ✓ Good — All gaps resolved pre-ship (v14.0) |
| Scene CRUD deferred | Proxy endpoints marked "planned" but not yet available | — Pending — Revisit when proxy team implements |

## Constraints

- **Platform**: PWA deve funzionare su iOS e Android (Safari, Chrome, Firefox)
- **Provider**: Mantenere Firebase FCM (no switch provider)
- **Tech stack**: Next.js 15.5, Firebase 12.8.0, React 19.2.0
- **Node runtime**: Firebase Admin SDK richiede Node.js runtime (no Edge)
- **Deployment**: Vercel (current hosting platform)
- **Privacy**: GDPR-compliant analytics (consent-first, no third-party tracking)

---
*Last updated: 2026-03-22 after Phase 116 complete — Type Safety app/ Routes & Pages*
