# Requirements: Pannello Stufa - Push Notifications

**Defined:** 2026-01-23
**Core Value:** Dispositivi riconosciuti automaticamente dopo riavvio browser, notifiche arrivano sempre (100% delivery rate).

## v1 Requirements

Requirements for production-grade push notification system. Each maps to roadmap phases.

### Token Management

- [x] **TOKEN-01**: Token FCM persiste automaticamente dopo chiusura browser e riavvio
- [x] **TOKEN-02**: Sistema verifica validità token all'avvio app e lo rigenera se necessario (refresh mensile minimo)
- [x] **TOKEN-03**: Token invalidati vengono automaticamente rimossi dal database (on FCM NotRegistered error)
- [x] **TOKEN-04**: Cleanup automatico token inattivi > 90 giorni (stale token detection)
- [x] **TOKEN-05**: Supporto multi-device: utente riceve notifiche su tutti i dispositivi registrati
- [x] **TOKEN-06**: Device fingerprinting: ogni dispositivo identificato univocamente (hash userAgent + platform)

### Monitoring & Observability

- [ ] **MONITOR-01**: Tracking delivery status: Sent/Delivered/Displayed per ogni notifica
- [ ] **MONITOR-02**: Error logging: fallimenti FCM salvati in Firebase con timestamp e device info
- [ ] **MONITOR-03**: Dashboard admin con metriche delivery rate (target 85%+)
- [ ] **MONITOR-04**: Lista dispositivi attivi con status (Active/Invalid/Revoked) e last-used timestamp
- [ ] **MONITOR-05**: Test send capability: admin può inviare notifica di test a dispositivo specifico
- [ ] **MONITOR-06**: Visualizzazioni Recharts: delivery rate charts, error trends, device activity

### User Preferences

- [ ] **PREF-01**: Controlli granulari per tipo notifica (scheduler, errors, maintenance)
- [ ] **PREF-02**: Do Not Disturb hours: utente imposta ore silenziose con timezone awareness
- [ ] **PREF-03**: Rate limiting: max 1 notifica per categoria ogni 5 minuti (previene spam)
- [ ] **PREF-04**: Preferenze sincronizzate tra tutti i dispositivi utente
- [ ] **PREF-05**: Default conservativi: solo CRITICAL + ERROR enabled inizialmente

### Notification History

- [x] **HIST-01**: Storage cronologia notifiche in Firestore (30-90 giorni retention)
- [x] **HIST-02**: UI in-app inbox: utente vede cronologia notifiche ricevute
- [x] **HIST-03**: Paginazione: infinite scroll con 50 items per pagina
- [x] **HIST-04**: Filtri: per data, tipo notifica, delivery status
- [x] **HIST-05**: Auto-cleanup notifiche > 90 giorni per GDPR compliance

### Device Management

- [x] **DEVICE-01**: Device naming: utente può etichettare dispositivi ("Kitchen iPad", "Bedroom Phone")
- [x] **DEVICE-02**: Device status tracking: stato Active/Invalid/Revoked visibile in UI
- [x] **DEVICE-03**: Remove device: utente può de-registrare dispositivo specifico
- [x] **DEVICE-04**: Device list UI: utente vede tutti dispositivi registrati con last-used timestamp

### Testing & Validation

- [ ] **TEST-01**: Pannello admin per test notifications
- [ ] **TEST-02**: Selezione target: test su singolo dispositivo o broadcast a tutti
- [ ] **TEST-03**: Verifica delivery immediata con feedback visivo
- [ ] **TEST-04**: Playwright E2E tests per service worker lifecycle

### Integration & Infrastructure

- [x] **INFRA-01**: Firestore per notification history (queries complesse)
- [x] **INFRA-02**: Realtime Database per FCM tokens (bassa latency)
- [ ] **INFRA-03**: React Hook Form + Zod per validation preferences
- [ ] **INFRA-04**: Recharts per dashboard visualizations
- [x] **INFRA-05**: date-fns per timestamp formatting
- [ ] **INFRA-06**: Cron job settimanale per token cleanup automation

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Analytics

- **ANALYTICS-01**: Real-Time Delivery Dashboard (HIGH complexity, requires BigQuery + WebSocket)
- **ANALYTICS-02**: Delivery Rate Trends (needs 90+ days data volume)
- **ANALYTICS-03**: Notification Categories visual grouping
- **ANALYTICS-04**: User engagement metrics (open rate, dismiss rate)

### Enhanced User Experience

- **UX-01**: Custom notification sounds per type (browser API limitations)
- **UX-02**: Notification editing/recall capability (FCM doesn't support)
- **UX-03**: Rich media notifications (images, videos)
- **UX-04**: Interactive notification actions (buttons, quick reply)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-Time Read Receipts | Privacy concerns + battery drain, not core value |
| Unlimited History Retention | Database bloat + GDPR liability (90-day max sufficient) |
| Silent Background Sync | iOS PWA unsupported, unreliable cross-platform |
| Guaranteed Delivery | FCM doesn't guarantee delivery, creates false expectations |
| Custom notification sounds (per-device) | Browser API limitations, inconsistent support |
| Email notifications fallback | Out of scope, focus on push only |
| SMS notifications fallback | Cost prohibitive, not needed |
| Notification scheduling by users | Scheduler already handles automated timing |
| Per-notification priority overrides | System-level DND handling sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TOKEN-01 | Phase 1 | Complete |
| TOKEN-02 | Phase 1 | Complete |
| TOKEN-03 | Phase 1 | Complete |
| TOKEN-04 | Phase 1 | Complete |
| TOKEN-05 | Phase 1 | Complete |
| TOKEN-06 | Phase 1 | Complete |
| MONITOR-01 | Phase 2 | Complete |
| MONITOR-02 | Phase 2 | Complete |
| MONITOR-03 | Phase 2 | Complete |
| MONITOR-04 | Phase 2 | Complete |
| MONITOR-05 | Phase 2 | Complete |
| MONITOR-06 | Phase 2 | Complete |
| PREF-01 | Phase 3 | Pending |
| PREF-02 | Phase 3 | Pending |
| PREF-03 | Phase 3 | Pending |
| PREF-04 | Phase 3 | Pending |
| PREF-05 | Phase 3 | Pending |
| HIST-01 | Phase 4 | Pending |
| HIST-02 | Phase 4 | Pending |
| HIST-03 | Phase 4 | Pending |
| HIST-04 | Phase 4 | Pending |
| HIST-05 | Phase 4 | Pending |
| DEVICE-01 | Phase 4 | Pending |
| DEVICE-02 | Phase 4 | Pending |
| DEVICE-03 | Phase 4 | Pending |
| DEVICE-04 | Phase 4 | Pending |
| TEST-01 | Phase 5 | Complete |
| TEST-02 | Phase 5 | Complete |
| TEST-03 | Phase 5 | Complete |
| TEST-04 | Phase 5 | Complete |
| INFRA-01 | Phase 2, Phase 4 | Complete (Phase 2) |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 3 | Pending |
| INFRA-04 | Phase 2 | Complete |
| INFRA-05 | Phase 2, Phase 4 | Complete (Phase 2) |
| INFRA-06 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31 (100%)
- Unmapped: 0

**Phase Distribution:**
- Phase 1 (Token Lifecycle Foundation): 7 requirements (TOKEN-01 to TOKEN-06, INFRA-02)
- Phase 2 (Production Monitoring Infrastructure): 9 requirements (MONITOR-01 to MONITOR-06, INFRA-01, INFRA-04, INFRA-05)
- Phase 3 (User Preferences & Control): 6 requirements (PREF-01 to PREF-05, INFRA-03)
- Phase 4 (Notification History & Devices): 11 requirements (HIST-01 to HIST-05, DEVICE-01 to DEVICE-04, INFRA-01, INFRA-05)
- Phase 5 (Automation & Testing): 5 requirements (TEST-01 to TEST-04, INFRA-06)

**Note:** INFRA requirements are cross-cutting and mapped to multiple phases where implemented.

---
*Requirements defined: 2026-01-23*
*Last updated: 2026-01-24 after Phase 2 completion (MONITOR-01 to MONITOR-06, INFRA-01, INFRA-04, INFRA-05 marked Complete)*
