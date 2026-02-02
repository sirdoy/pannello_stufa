# Pannello Stufa - Smart Home Control PWA

## What This Is

PWA completa per controllo smart home: stufa Thermorossi, termostato Netatmo (con gestione schedule complete), luci Philips Hue. Include sistema notifiche push production-ready, monitoring automatico stufa, e integrazioni intelligenti tra dispositivi.

## Core Value

I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## Current State

**Version:** v3.1 (shipped 2026-02-02)
**Status:** Production-ready with 100% design system compliance

**Shipped Capabilities (v1.0 + v2.0 + v3.0 + v3.1):**
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
- ~104,000 lines JavaScript

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

### Active

No active requirements — awaiting next milestone definition.

**v3.1 Design System Compliance (Shipped 2026-02-02):**
- ✓ All raw `<button>` elements replaced with Button component — v3.1
- ✓ All raw `<input type="range">` replaced with Slider component — v3.1
- ✓ Device cards standardized (StoveCard, ThermostatCard, LightsCard, CameraCard) — v3.1
- ✓ Inline conditional styling replaced with CVA variants — v3.1
- ✓ Visual consistency verified across all pages — v3.1

**v3.0 Design System Evolution (Shipped 2026-01-30):**
- ✓ Complete UI component library (25+ components)
- ✓ CVA type-safe variants across all components
- ✓ Radix UI primitives for accessibility
- ✓ WCAG AA compliance verified
- ✓ All pages migrated to design system

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
- CVA + Radix UI design system (25+ components)
- ~104,000 lines JavaScript

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

## Constraints

- **Platform**: PWA deve funzionare su iOS e Android (Safari, Chrome, Firefox)
- **Provider**: Mantenere Firebase FCM (no switch provider)
- **Tech stack**: Next.js 15.5, Firebase 12.8.0, React 19.2.0
- **Node runtime**: Firebase Admin SDK richiede Node.js runtime (no Edge)
- **Deployment**: Vercel (current hosting platform)

---
*Last updated: 2026-02-02 after v3.1 milestone complete (Design System Compliance)*
