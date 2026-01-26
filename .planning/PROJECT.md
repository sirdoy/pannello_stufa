# Pannello Stufa - Smart Home Control PWA

## What This Is

PWA completa per controllo smart home: stufa Thermorossi, termostato Netatmo (con gestione schedule complete), luci Philips Hue. Include sistema notifiche push production-ready, monitoring automatico stufa, e integrazioni intelligenti tra dispositivi.

## Core Value

I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## Current State

**Version:** v1.0 (shipped 2026-01-26)
**Status:** Production-ready, operational setup pending

**Shipped Capabilities:**
- ✅ Token persistence across browser restarts (dual persistence: IndexedDB + localStorage)
- ✅ Multi-device support with device fingerprinting
- ✅ Admin dashboard with delivery metrics and 7-day trends
- ✅ User preferences with type toggles, DND hours, rate limiting
- ✅ Notification history with infinite scroll and filters
- ✅ Device management UI with rename/remove capabilities
- ✅ Comprehensive E2E test suite (32 tests, 3 browsers)
- ✅ CI/CD integration with GitHub Actions

**Operational Setup Required:**
- Cron webhook configuration (cron-job.org account setup, 15-30 min)
- Firestore index deployment (`firebase deploy --only firestore:indexes`)
- E2E test execution validation (local build + test run)

## Current Milestone: v2.0 Netatmo Complete Control & Stove Monitoring

**Goal:** Controllo completo del termostato Netatmo con gestione schedule settimanali e monitoring automatico della stufa per rilevare anomalie.

**Target features:**
- **Netatmo Schedule Management:** Visualizzare, creare, modificare, eliminare programmazioni settimanali (CRUD completo)
- **Stove-Thermostat Integration Fix:** Override temporaneo setpoint (non modificare schedule) quando stufa accende/spegne
- **Stove Health Monitoring:** Cron job per verificare connessione, stato atteso vs reale, errori/anomalie, coordinazione con Netatmo
- **Alerting:** Dashboard warnings + notifiche push (sistema v1.0) per problemi rilevati

**Tech Stack:**
- Next.js 15.5 PWA with App Router
- Firebase (Realtime Database for tokens, Firestore for history)
- Auth0 for authentication
- Playwright for E2E testing
- Recharts for visualization
- ~70,000 lines TypeScript/JavaScript

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

### Active

**v2.0 Goals (In Definition):**

Target features identified:
- Netatmo schedule management (visualizzare, creare, modificare, eliminare)
- Stove-thermostat integration correction (setpoint override, not schedule modification)
- Stove health monitoring via cron (health check, state verification, error detection)
- Alerting system (dashboard + push notifications)

Requirements to be defined through research → requirements → roadmap cycle.

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
- Multi-device smart home control (stufa, termostato, luci, camera)
- ~70,000 lines TypeScript/JavaScript

**v1.0 Milestone (2026-01-23 → 2026-01-26):**
- 5 phases executed (29 plans total)
- 31/31 requirements satisfied (100%)
- Browser restart token persistence bug FIXED
- Complete delivery visibility implemented
- User control over notification behavior
- Comprehensive E2E test coverage
- Production-ready with operational setup pending

**Known Issues:**
- Cron automation not operational (requires cron-job.org setup)
- Rate limiter in-memory only (consider Redis for multi-instance)
- Auth0 mock in E2E tests is placeholder
- Firestore indexes require manual deployment

**User Feedback:**
- None yet (v1.0 just shipped, awaiting operational deployment)

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
*Last updated: 2026-01-26 after starting v2.0 milestone*
*Next: Research → Requirements → Roadmap for v2.0*
