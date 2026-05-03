# Pannello Stufa - Smart Home Control PWA

## What This Is

PWA completa per controllo smart home: stufa Thermorossi, termostato Netatmo, luci Philips Hue, monitoraggio rete Fritz!Box, monitoraggio server Raspberry Pi, sistema audio Sonos (transport, EQ, queue, grouping, sleep timer, seek, history), sensori DIRIGERA (contatto e movimento), e smart plug Tuya (on/off, timer, energy history) — 8 provider collegati tramite un unico client HomeAssistant API condiviso (singolo base URL + X-API-Key auth, copertura API ~95%). Dati live via WebSocket con fallback automatico a polling HTTP per tutti gli 8 provider (singola connessione condivisa, topic dispatch, exponential backoff reconnect). Include Device Registry per gestione tipi e dispositivi registrati, sistema Rooms per organizzare dispositivi in stanze con stato aggregato per stanza e panoramica whole-house. Sistema notifiche push production-ready con action buttons interattive, monitoring automatico stufa con cron GitHub Actions, offline mode avanzato con staleness indicators, PWA install prompt guidato, analytics dashboard GDPR-compliant con stima consumo pellet e correlazione meteo. Monitoraggio rete Fritz!Box con dashboard card, pagina dedicata /network con WAN status, device list con categorizzazione automatica, bandwidth charts con decimation LTTB, device history timeline, e correlazione bandwidth-stufa con consent gate. Monitoraggio Raspberry Pi con dashboard card (CPU/RAM/disk/temp/health) e pagina dedicata /raspi con statistiche complete. Smart plug Tuya con dashboard card (potenza aggregata, plug count), pagina dedicata /tuya con griglia plug, toggle on/off, timer countdown, e grafici energy history con selettore periodo (24h/7g/30g). Dashboard home con masonry layout (flexbox two-column split) che elimina gap verticali tra card di altezze diverse, con Suspense streaming e skeleton fallback per card individuali. Indicatore stato connessione WebSocket in navbar e timestamp ultimo aggiornamento su ogni card. Applicazione resiliente con retry automatico + idempotency, error boundaries per crash isolation, adaptive polling via Page Visibility API con stagger iniziale per evitare thundering herd, e componenti refactored con orchestrator pattern (~85% LOC reduction). Performance ottimizzata con React Compiler auto-memoization, code splitting Recharts via next/dynamic, font self-hosted via next/font, e Web Vitals pipeline. Codebase interamente in TypeScript con strict mode completo e zero errori di compilazione.

## Core Value

I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## Current State

**Version:** v20.0 (shipped 2026-05-03)
**Status:** Active — between milestones, v20.0 Ember Glass Redesign just shipped, awaiting next milestone definition

## Next Milestone Goals

v20.0 closed Ember Glass UI rewrite over the v19.0 API surface. Candidate next-milestone themes (to be defined via `/gsd-new-milestone`):

- **Visual fidelity & UAT closure** — work through ~50+ deferred visual UAT items across phases 174/177/178/179/180/181/182 (real-device fidelity, motion curves, Italian copy parity, iOS safe-area, ambient gradient motion, blur fallback in non-supporting browsers)
- **Playwright runtime infrastructure** — unblock authored specs in 174/175/176/178/180/181/182: refresh Auth0 storageState, wire Firebase Database URL into worktree env, neutralize VersionEnforcer overlay in test mode
- **Legacy design-system retirement** — migrate live importers off `app/components/ui/Sheet.tsx` + `ui/BottomSheet.tsx` and delete (deferred from Phase 183 per RESEARCH grep evidence)
- **Production sheet adoption of Phase 182 primitives** — wire CircBtn + BigSlider into production sheets (CONTEXT D-07 deferral)
- **Scheduler API endpoints** — still explicitly deferred from v19.0 and v20.0
- **Personalization** — user-selectable accent hue per-account (post-v20.0 PERS-01), light-mode variant of Ember Glass (PERS-02), custom card ordering (PERS-03)
- **Automations advanced** — visual cron builder (AUTO-FUT-01), per-action retry/timeout config (AUTO-FUT-02), action templates/library (AUTO-FUT-03)

**Source design bundle (v20.0, archived for reference):** `.planning/inbox/ember-glass-design/` (README + chats/chat1.md + 7 .jsx component prototipi, ~4800 LOC)

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
- Shared HomeAssistant API client (`haGet`/`haPost`/`haPut`/`haDelete`) for all 8 providers (Thermorossi, Netatmo, Fritz!Box, Raspberry Pi, Hue, Sonos, DIRIGERA, Tuya)
- Sonos integration via HA proxy: sonosProxy.ts (28 functions), 23 API routes, transport/EQ/queue/grouping/sleep timer/seek/history
- DIRIGERA integration via HA proxy: dirigeraProxy.ts (5 functions), 5 API routes, contact/motion sensor data
- Tuya smart plug integration via HA proxy: tuyaProxy.ts (6 functions), 6 API routes, hooks (useTuyaData WS+polling, useTuyaCommands), TuyaCard dashboard, /tuya page with plug grid + energy charts + timer controls
- Netatmo integration via local HomeAssistant proxy (X-API-Key auth, SQLite-backed)
- Raspberry Pi monitoring (health, CPU, memory, disk, system) via shared HA client, WS-primary with polling fallback
- Web Vitals pipeline (useReportWebVitals + sendBeacon + Firebase RTDB)
- ~113,000 lines TypeScript (strict: true, noUncheckedIndexedAccess, allowJs: false, React Compiler auto-memoization)

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

**v14.1 Tech Debt & Type Safety (Shipped 2026-03-22):**

**Known Issues:**
- ✓ **ISSUE-01** through **ISSUE-06**: All 6 known issues from v14.0 audit resolved — v14.1 (Phase 113)

**Type Safety:**
- ✓ **TYPE-01** through **TYPE-06**: All `as any` eliminated from lib/ (adminDbGet generics, browser API types, room/device interfaces) — v14.1 (Phase 114)
- ✓ **TYPE-07** through **TYPE-12**: All `as any` eliminated from app/ components (icon props, spread patterns, variant unions, DeviceCard interfaces) — v14.1 (Phase 115)
- ✓ **TYPE-13** through **TYPE-17**: All `as any` eliminated from API routes & pages (scheduler generics, sw.ts augmentations, page prop alignment) — v14.1 (Phase 116)

**Dead Code & Cleanup:**
- ✓ **CLEAN-01**: 50+ unused exports removed across 32 files — v14.1 (Phase 117)
- ✓ **CLEAN-02**: notificationService disabled block removed — v14.1 (Phase 117)
- ✓ **CLEAN-03**: healthMonitoring STARTING grace period implemented — v14.1 (Phase 117)

**v15.0 Rooms & Device Registry (Shipped 2026-03-23):**

**Device Registry Infrastructure:**
- ✓ **INFRA-01**: Proxy client per Device Registry API con haGet/haPost transport — v15.0 (Phase 118)
- ✓ **INFRA-02**: TypeScript types per DeviceType, RegistryDevice, RegistryHealth — v15.0 (Phase 118)
- ✓ **INFRA-05**: Next.js API routes per Device Registry (8 endpoint proxy) — v15.0 (Phase 118)

**Rooms Infrastructure:**
- ✓ **INFRA-03**: Proxy client per Rooms API con haGet/haPost/haPut/haDelete transport — v15.0 (Phase 119)
- ✓ **INFRA-04**: TypeScript types per Room, DeviceAssignment, RoomStatus, HouseStatus, RoomsHealth — v15.0 (Phase 119)
- ✓ **INFRA-06**: Next.js API routes per Rooms (11 endpoint proxy) — v15.0 (Phase 119)

**Device Types & Registry UI:**
- ✓ **DTYPE-01**: View list of all device types (built-in + custom) — v15.0 (Phase 120)
- ✓ **DTYPE-02**: Create custom device type with slug and label — v15.0 (Phase 120)
- ✓ **DTYPE-03**: Delete custom device type (built-in protected) — v15.0 (Phase 120)
- ✓ **DREG-01**: Paginated list of registered devices — v15.0 (Phase 121)
- ✓ **DREG-02**: Filter device list by provider — v15.0 (Phase 121)
- ✓ **DREG-03**: Register new device (provider, device_id, name, type) — v15.0 (Phase 121)
- ✓ **DREG-04**: Update device name and type — v15.0 (Phase 121)
- ✓ **DREG-05**: Unregister device with confirmation — v15.0 (Phase 121)
- ✓ **DREG-06**: Registry health stats — v15.0 (Phase 121)

**Room Management & Status:**
- ✓ **ROOM-01**: View rooms with device counts — v15.0 (Phase 122)
- ✓ **ROOM-02**: Create room with name and description — v15.0 (Phase 122)
- ✓ **ROOM-03**: Edit room name and description — v15.0 (Phase 122)
- ✓ **ROOM-04**: Delete room with confirmation — v15.0 (Phase 122)
- ✓ **ROOM-05**: View devices assigned to a room — v15.0 (Phase 123)
- ✓ **ROOM-06**: Assign device to room (implicit move) — v15.0 (Phase 123)
- ✓ **ROOM-07**: Remove device from room — v15.0 (Phase 123)
- ✓ **RSTAT-01**: Aggregated device status per room — v15.0 (Phase 124)
- ✓ **RSTAT-02**: Whole-house status (all rooms) — v15.0 (Phase 124)
- ✓ **RSTAT-03**: Rooms health stats — v15.0 (Phase 124)

**v17.0 WebSocket Real-Time Transport (Shipped 2026-03-28):**

**WebSocket Infrastructure:**
- ✓ **WS-01** through **WS-06**: Shared WS connection manager, topic subscribe/unsubscribe, message dispatch, exponential backoff reconnect, auto re-subscribe, TypeScript types for all 6 provider payloads — v17.0 (Phase 139)

**Provider Migration:**
- ✓ **MIG-01** through **MIG-03**: useStoveData WS-primary with alwaysActive polling fallback — v17.0 (Phase 140)
- ✓ **MIG-04** through **MIG-08**: useNetworkData and useLightsData WS-primary with sparkline/history preservation — v17.0 (Phase 141)
- ✓ **MIG-09** through **MIG-12**: useSonosData and useDirigeraData WS-primary with polling fallback — v17.0 (Phase 142)
- ✓ **MIG-13** through **MIG-14**: useThermostatData WS-primary with adapter layer for raw WS payload — v17.0 (Phase 143)

**Connection UX:**
- ✓ **UX-01**: Visual connection status indicator (connected/reconnecting/fallback) — v17.0 (Phase 144)
- ✓ **UX-02**: Flicker-free WS/polling transitions — v17.0 (Phase 144)
- ✓ **UX-03**: Per-card last updated timestamps — v17.0 (Phase 144)

**v17.1 WebSocket Alignment & Tuya Integration (Shipped 2026-03-30):**

**WS Type Alignment:**
- ✓ **WSTYPE-01** through **WSTYPE-14**: All 8 WS topic payload types enriched with data_freshness, custom_name, device_type fields, TopicDataMap includes raspi+tuya — v17.1 (Phase 145)

**Raspi WS Migration:**
- ✓ **RASPI-01** through **RASPI-04**: useRaspiData WS-primary with polling fallback, RaspiCard LastUpdated — v17.1 (Phase 146)

**Tuya Integration:**
- ✓ **TUYA-01** through **TUYA-08**: tuyaProxy.ts function module + 6 API route proxies — v17.1 (Phase 147)
- ✓ **TUYA-09** through **TUYA-14**: useTuyaData/useTuyaCommands hooks, TuyaCard, /tuya page with plug grid + energy charts + timer — v17.1 (Phase 148)

**Connection UX:**
- ✓ **UX-01** through **UX-03**: NavbarConnectionStatus includes raspi+tuya, LastUpdated on TuyaCard and RaspiCard — v17.1 (Phases 146, 148)

**v16.0 Sonos, DIRIGERA & Fritz!Box Avanzato (Shipped 2026-03-26):**

**Sonos Integration (42 requirements):**
- ✓ **SONOS-01** through **SONOS-06**: Proxy client, types, health/devices/zones routes — v16.0 (Phase 126)
- ✓ **SONOS-07** through **SONOS-17**: Transport controls, volume, seek — v16.0 (Phases 127, 138)
- ✓ **SONOS-18** through **SONOS-30**: Extended controls (EQ, play mode, queue, home theater, grouping, sleep timer, history) — v16.0 (Phase 128)
- ✓ **SONOS-31** through **SONOS-34**: Frontend (SonosCard, /sonos page, device registry, nav) — v16.0 (Phases 129, 138)
- ✓ **SONOS-35** through **SONOS-37**: Zone extended UI (play mode, sleep timer, queue viewer) — v16.0 (Phase 135)
- ✓ **SONOS-38** through **SONOS-42**: Speaker extended UI & history (EQ, home theater, source, grouping, history chart) — v16.0 (Phase 136)

**DIRIGERA Integration (11 requirements):**
- ✓ **DIRIG-01** through **DIRIG-07**: Proxy client, types, health/sensors routes — v16.0 (Phase 130)
- ✓ **DIRIG-08** through **DIRIG-11**: Frontend (DirigeraCard, /dirigera page, device registry, nav) — v16.0 (Phase 131)

**Fritz!Box Advanced (20 requirements):**
- ✓ **FRITZ-01** through **FRITZ-07**: System info, WiFi clients/networks, DHCP, port forwarding, UPnP, mesh — v16.0 (Phase 132)
- ✓ **FRITZ-08** through **FRITZ-12**: Bandwidth history tiers, device count, budget stats — v16.0 (Phase 133)
- ✓ **FRITZ-13** through **FRITZ-16**: Frontend system info, WiFi clients, network services, history charts — v16.0 (Phase 134)
- ✓ **FRITZ-17** through **FRITZ-20**: Extended frontend (WiFi networks, device count chart, budget stats, auto-granularity) — v16.0 (Phase 137)

**v18.0 Dark-Only & Mobile-First (Shipped 2026-04-02):**
- ✓ ThemeContext / ThemeProvider / theme API route / theme settings page deleted; `class="dark"` hardcoded on `<html>` — v18.0 (Phase 149)
- ✓ ~170 files cleaned of `dark:` Tailwind variants and `html:not(.dark)` selectors — v18.0 (Phase 150)
- ✓ Design system mobile-first: ButtonGroup flex-wrap, all 12 layout components verified at 375px — v18.0 (Phase 151)
- ✓ All 30+ pages/sub-pages verified at 375px viewport via Playwright scrollWidth checks — v18.0 (Phases 152-154)

**v19.0 API Alignment & Full Coverage (Shipped 2026-04-27):**
- ✓ All 8 device providers unified on canonical `/api/v1/{provider}/*` namespace — v19.0 (Phases 156, 172)
- ✓ ~80 missing HA proxy endpoints exposed across Hue, Sonos, Netatmo, Fritz!Box, DIRIGERA, auth, automations — v19.0 (Phases 157-163)
- ✓ Every gap-closure endpoint wired to production UI (Hue, Sonos, Netatmo, DIRIGERA, Auth UI, Fritz!Box) — v19.0 (Phases 166-171)
- ✓ Cross-provider device aggregator `/api/v1/devices` via Promise.allSettled fan-out — v19.0 (Phase 173)
- ✓ 52/52 v19.0 requirements satisfied (audit-passed 2026-04-27)

**v20.0 Ember Glass Redesign (Shipped 2026-05-03):**

**Design System (Ember Glass tokens):**
- ✓ **DS-01** through **DS-06**: Tokens on `:root`, no hardcoded glass/blur/accent in components, oklch accent + 6 hues, Outfit/Inter via next/font, ambient glow togglable + persisted, backdrop-filter + WebKit fallback + @supports graceful degradation — v20.0 (Phase 174)
- ✓ **DS-07**: Card press animation (`scale(0.97)` cubic-bezier .34,1.56,.64,1 / 220ms) shared via `<Pressable>` + `usePressed` + `.press-anim` — v20.0 (Phase 175)

**Splash (post-Auth0):**
- ✓ **SPLASH-01** through **SPLASH-05**: Splash renders post-auth, ~2s sequence, reduced-motion fallback (200ms opacity), never re-runs in-session, non-blocking initial fetches — v20.0 (Phase 176)

**Dashboard (equal-size glass cards):**
- ✓ **DASH-01** through **DASH-12**: 2-col 1:1 glass card grid, 10 device cards (Stove/Climate/Lights/Sonos/Weather/Camera/Network/Raspi/Tuya/Plugs), per-card content shape verified, modal-sheet on tap (Weather + Raspi read-only), v9.0 stagger preserved, React Compiler clean — v20.0 (Phase 177)

**Modal Sheets (per-device):**
- ✓ **SHEET-01**: Bottom sheet primitive (Radix Dialog facade) — translucent + backdrop-blur, off-screen translate cubic-bezier .22,1,.36,1 / 400ms, Escape/backdrop/close dismissal, body scroll-lock — v20.0 (Phase 175)
- ✓ **SHEET-02** through **SHEET-06**: StoveSheet (FlameViz hero + steppers), ClimateSheet (zone chips + radial dial), LightsSheet (4 scenes + per-room), SonosSheet (group list + master), PlugsSheet (per-plug toggles inside sheet only) — v20.0 (Phase 178)

**Rooms Tab (data-driven):**
- ✓ **ROOMS-01** through **ROOMS-05**: Data-driven from existing state, 3×2 chip grid + "+N" overflow, RoomSheet expanded device cards with type-specific bodies (Stove/Thermo/Light/Plug/Sonos/TV/Blind/Camera/Humidity) — v20.0 (Phase 179)

**Automations Tab (full editor):**
- ✓ **AUTO-01** through **AUTO-08**: List with status pills, 4-tab editor, 2 API trigger types (D-08), AND/OR depth-2 condition nesting, 11 API action types (D-09), reorder + cooldown + save guard + edit/delete — v20.0 (Phase 180)

**Navigation (glass tab bar):**
- ✓ **NAV-01** through **NAV-04**: Glass bottom tab bar (Home/Stanze/Automazioni/Altro), accent-glow active, hidden under open sheets via SheetCounter, iOS safe-area respect — v20.0 (Phase 181)

**Design System Reference:**
- ✓ **DSREF-01** through **DSREF-03**: `/debug/design-system-v2` single source of truth, 13 live primitive samples, dev accent picker inline — v20.0 (Phase 182)

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
- Fritz!Box Telephony (DECT, calls, TAM) — User excluded, non necessario
- Sonos TTS/announcement — Non documentato nell'API
- DIRIGERA light control (bulbs) — Solo sensori in scope, luci gestite da Hue
- Automations engine (rule CRUD) — Scope separato, milestone dedicato futuro
- WebSocket per comandi (write) — Spec `/ws/live` is read-only push; commands stay via REST POST/PUT
- SharedWorker multi-tab WS — Complexity deferred, single tab WS sufficient
- Tuya device discovery/pairing — Handled by tinytuya CLI on server side
- Tuya firmware updates — Hardware vendor responsibility
- Tuya scenes/automation — Not in API docs

## Context

**Codebase:**
- Next.js 15.5 PWA con App Router + React Compiler 1.0
- Firebase Realtime Database per storage, analytics, network events, Web Vitals
- Firestore per notification history
- Auth0 per autenticazione
- Service Worker (Serwist) per offline capability e notification actions
- Multi-device smart home control (stufa, termostato, luci, rete Fritz!Box, Raspberry Pi, Sonos, DIRIGERA)
- CVA + Radix UI design system (37+ components)
- react-error-boundary per crash isolation
- Fritz!Box TR-064 API via server-side proxy con rate limiting
- Netatmo integration via local HomeAssistant proxy (X-API-Key auth, SQLite-backed data)
- Recharts code-split via next/dynamic su /network e /analytics
- Self-hosted Outfit + Space Grotesk fonts via next/font
- Web Vitals pipeline (useReportWebVitals → sendBeacon → Firebase RTDB → dashboard)
- Suspense streaming con loading.tsx skeleton shell + per-card boundaries
- ~131,000 lines TypeScript (strict: true, noUncheckedIndexedAccess, allowJs: false)
- 750+ TypeScript source files, 4,000+ tests passing
- GitHub Actions cron (5-min schedule) per health monitoring e coordination (stove, thermostat, Raspberry Pi)
- GDPR-compliant analytics con consent banner
- Playwright E2E smoke tests for all app pages
- WebSocket real-time transport (react-use-websocket) for all 8 providers with HTTP polling fallback
- All device polling unified at 60s via useAdaptivePolling (fallback when WS disconnected)
- Device Registry + Rooms frontend with typed proxy clients and 19 API route proxies
- 24 milestones shipped, 148 phases, 467 plans executed

**v17.1 Milestone (2026-03-30):**
- 4 phases executed (10 plans)
- 35/35 requirements satisfied (100%)
- 84 files changed (+10,102 insertions, -89 deletions, net +10,013 LOC)
- 3 days from start to completion
- All 8 device providers now receive live data via WebSocket with HTTP polling fallback
- Tuya smart plug integrated as 8th provider end-to-end
- react-use-websocket added as dependency
- 3 Tuya human verification items pending (plug toggle, energy chart granularity, timer countdown) — require live Tuya hub
- GET /api/tuya/plugs/[device_id] single-plug route has no frontend caller (consistent with other providers)

**Known Issues:**
- Worker teardown warning (React 19 cosmetic, not actionable)
- 2 knip false positives (app/sw.ts, firebase-messaging-sw.js)
- iOS notification category registration in PWA needs verification
- Consent enforcement is caller responsibility (not middleware-enforced)
- Visual parity human verification pending for refactored LightsCard and stove/page.tsx
- 3 pre-existing vibration API test warnings
- Fritz!Box rate limit budget shared across all API calls (10 req/min)
- Self-hosted Fritz!Box API connectivity depends on myfritz.net (may timeout off-network)
- 3 Netatmo routes without frontend consumer (synchomeschedule, createnewhomeschedule, getroommeasure)
- Netatmo proxy connectivity depends on myfritz.net (same risk as Fritz!Box)
- DataTable retains 5 useMemo for TanStack Table referential stability (intentional exception)
- 26 Sonos/Fritz!Box/DIRIGERA human verification items requiring live devices (v16.0 tech debt)
- SONOS-05: GET /api/sonos/devices/[uid] route exists but no frontend consumer for per-device detail
- SonosZoneSection.test.tsx mock uses fields not in SonosPlaybackResponse type

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
| Generic adminDbGet<T>() | Type parameter eliminates `as any` at all Firebase read call sites | ✓ Good — Zero unsafe casts in Firebase layer (v14.1) |
| Browser API type aliases (NetworkInformation, NotificationWithMaxActions) | Augment missing browser API types without global pollution | ✓ Good — Type-safe access without `as any` (v14.1) |
| Icon prop widening to React.ComponentType | Lucide icons are ComponentType, not specific icon type | ✓ Good — No icon casting needed anywhere (v14.1) |
| WeakSet for ControlButton _warned | Private warning tracker without polluting component props | ✓ Good — No `as any` for private state (v14.1) |
| declare global for sw.ts APIs | Badging API and PeriodicSync not in standard TypeScript lib | ✓ Good — Service worker fully typed (v14.1) |
| De-export pattern for dead code | Remove `export` keyword but keep function if internally used | ✓ Good — Smaller public API without breaking internals (v14.1) |
| STARTING grace period in healthMonitoring | Firebase RTDB tracks stove_starting_since timestamp, 5-min grace | ✓ Good — No false alerts during normal startup (v14.1) |
| haDelete transport for Rooms API | DELETE method added to haClient.ts, 204 returns void | ✓ Good — Clean resource deletion without JSON parse (v15.0) |
| PaginatedResponse<T> in types/common.ts | Shared by registry, rooms, automations — not scoped to one module | ✓ Good — Reusable pagination type (v15.0) |
| Public GET vs protected mutations | GET /registry/types and /registry/health public; device CRUD protected | ✓ Good — Read-only data accessible, mutations auth-gated (v15.0) |
| FormModal render-prop with Control<T> | Typed render-prop for react-hook-form Controller in modals | ✓ Good — noImplicitAny satisfied, reusable pattern (v15.0) |
| Italian locale sort (localeCompare 'it') | All list pages sort with it-IT locale | ✓ Good — Consistent Italian ordering (v15.0) |
| Inline hooks for select dropdowns | useDeviceTypesForSelect, useRegistryDevicesForSelect as inline hooks | ✓ Good — Non-critical, errors silently ignored (v15.0) |
| Manual refresh only for status page | No polling — Aggiorna button triggers refetch (D-20 spec) | ✓ Good — No unnecessary API load for status views (v15.0) |
| Gap closure phase for navigation | Audit caught missing nav menu entry for v15.0 pages | ✓ Good — All pages reachable from hamburger menu (v15.0) |
| Scene CRUD deferred | Proxy endpoints marked "planned" but not yet available | — Pending — Revisit when proxy team implements |
| Sonos 28-function proxy module | Consistent with Thermorossi/Netatmo/Hue proxy pattern, haGet/haPost/haPut | ✓ Good — Unified transport across all 7 providers (v16.0) |
| DIRIGERA read-only (haGet only) | Only sensors in scope, no control endpoints available | ✓ Good — Minimal surface, expandable later (v16.0) |
| Fritz!Box extends existing infrastructure | Phases 61-67 client extended with 13 new methods, not rewritten | ✓ Good — No regressions on existing /network features (v16.0) |
| Promise.allSettled for zone/speaker batches | Individual zone/speaker failures don't break entire page | ✓ Good — Resilient to partial Sonos outages (v16.0) |
| SonosCard picks first PLAYING zone | Promise.allSettled for up to 5 zones, first PLAYING wins | ✓ Good — Dashboard shows most relevant state (v16.0) |
| 250ms debounce on volume sliders | localVolume optimistic state + debounced PUT | ✓ Good — Smooth UX, avoids flooding (v16.0) |
| SonosSeekControl isDragging ref | Prevents position_ms sync during slider drag | ✓ Good — Smooth seek UX without jumps (v16.0) |
| Phase 138 gap closure | Milestone audit identified 4 gaps (nav 404, devices fetch, zone volume, seek) | ✓ Good — All gaps resolved pre-ship (v16.0) |
| Auto-granularity for bandwidth/history | Fritz!Box and Sonos history routes switch hourly/daily based on time range | ✓ Good — User doesn't need to choose resolution (v16.0) |
| DeviceCountChart via next/dynamic | Recharts is heavy, chart-only component deferred with ssr:false | ✓ Good — Consistent with existing chart code-splitting (v16.0) |
| react-use-websocket for WS client | Mature library, exponential backoff built-in, React hooks API | ✓ Good — Single shared connection with topic dispatch (v17.0) |
| Singleton WS via React Context | WebSocketProvider in ClientProviders ensures one connection per app | ✓ Good — MAX 2 connections respected, no duplicate subs (v17.0) |
| WS-primary with polling fallback pattern | All 6 hooks: interval = isWsConnected ? null : pollInterval | ✓ Good — Zero behavior change from user perspective (v17.0) |
| Conditional WS subscription guard | Subscribe only when isWsConnected=true, prevents dead subscriptions | ✓ Good — Clean lifecycle, no spurious subscribe calls (v17.0) |
| Ref pattern for stale closure avoidance | fetchRef for side-fetch functions in WS useEffect callbacks | ✓ Good — Prevents stale closures across all 6 provider hooks (v17.0) |
| Standalone Netatmo WS adapter | Pure function adaptNetatmoWsPayload for raw→typed conversion | ✓ Good — Independently testable, no coupling to hook (v17.0) |
| lastUpdatedAt derived from existing state | Stove: lastPollAt→ms, Network: alias, others: new state | ✓ Good — Minimal changes, backward compatible (v17.0) |
| Italian connection status labels | WS_STATUS_LABELS: Connesso via WS / Riconnessione / Polling attivo | ✓ Good — Consistent with app's Italian UI (v17.0) |
| Enriched WS types with registry metadata | data_freshness, custom_name, device_type added to all 8 topic types | ✓ Good — WS types match REST shapes exactly (v17.1) |
| Inline WS payload mapping for Raspi | No standalone adapter needed — computeRaspiHealth inline in handleMessage | ✓ Good — Simpler than Netatmo adapter (fewer fields) (v17.1) |
| Tuya 200 OK (not 202 Accepted) | Tuya proxy confirms commands synchronously via data_confirmed field | ✓ Good — Consistent with Tuya proxy behavior (v17.1) |
| TuyaPlugMutation extends TuyaPlug | Inheritance avoids field duplication between read and write types | ✓ Good — Clean type hierarchy (v17.1) |
| useTuyaCommands with plain fetch | Matches simpler hooks like useDirigeraCommands, no useRetryableCommand | ✓ Good — Appropriate for synchronous-confirm API (v17.1) |
| TuyaEnergyChart via next/dynamic | Recharts deferred with ssr:false, consistent with all chart code-splitting | ✓ Good — /tuya page loads fast (v17.1) |
| Two useEffects for timer countdown | Sync from plug.countdown_s (WS push) + interval tick for smooth countdown | ✓ Good — Accurate to WS state, smooth UX (v17.1) |

## Constraints

- **Platform**: PWA deve funzionare su iOS e Android (Safari, Chrome, Firefox)
- **Provider**: Mantenere Firebase FCM (no switch provider)
- **Tech stack**: Next.js 15.5, Firebase 12.8.0, React 19.2.0
- **Node runtime**: Firebase Admin SDK richiede Node.js runtime (no Edge)
- **Deployment**: Vercel (current hosting platform)
- **Privacy**: GDPR-compliant analytics (consent-first, no third-party tracking)

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-03 after v20.0 Ember Glass Redesign milestone close — 50/50 v20.0 requirements moved to Validated; ROADMAP.md collapsed; REQUIREMENTS.md archived to milestones/v20.0-REQUIREMENTS.md; awaiting `/gsd-new-milestone` for next cycle.*
