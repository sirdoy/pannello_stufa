# Requirements: Pannello Stufa

**Defined:** 2026-03-18
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v12.0 Requirements

Requirements for Data Fetching Simplification & E2E Verification milestone.

### Polling Simplification

- [x] **POLL-01**: StoveCard usa useAdaptivePolling (60s) invece del polling loop custom
- [x] **POLL-02**: Firebase RTDB real-time listener della stufa rimosso
- [x] **POLL-03**: sync-external-state call rimossa dal ciclo fetch stufa
- [x] **POLL-04**: ThermostatCard polling esteso a 60s (da 30s)
- [x] **POLL-05**: LightsCard polling esteso a 60s (da 30s)
- [x] **POLL-06**: NetworkCard polling esteso a 60s visible / 5min hidden (da 30s/5min)
- [x] **POLL-07**: RaspiCard polling esteso a 60s visible / 5min hidden (da 30s/5min)
- [x] **POLL-08**: useDeviceStaleness polling rimosso o esteso a 60s (da 5s)

### E2E Page Verification

- [x] **E2E-01**: Playwright verifica homepage carica tutte le card visibili senza errori
- [x] **E2E-02**: Playwright verifica /stove carica e mostra dati
- [x] **E2E-03**: Playwright verifica /thermostat carica e mostra dati
- [x] **E2E-04**: Playwright verifica /lights carica e mostra dati
- [x] **E2E-05**: Playwright verifica /network carica e mostra dati
- [x] **E2E-06**: Playwright verifica /raspi carica e mostra dati
- [x] **E2E-07**: Playwright verifica /analytics carica
- [x] **E2E-08**: Playwright verifica /settings carica
- [x] **E2E-09**: Playwright verifica /admin carica
- [x] **E2E-10**: Nessuna pagina ha console errors o loading infiniti

## Future Requirements

None deferred.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Global state management (Redux/Zustand) | Conservative approach — keep hook-based architecture |
| Server-side polling centralization | Requires new infrastructure, overkill for current needs |
| WebSocket real-time updates | Complexity vs polling not justified for this use case |
| Stove safety polling < 60s | Proxy cache has fresh data, 60s is sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| POLL-01 | Phase 96 | Complete |
| POLL-02 | Phase 96 | Complete |
| POLL-03 | Phase 96 | Complete |
| POLL-04 | Phase 96 | Complete |
| POLL-05 | Phase 96 | Complete |
| POLL-06 | Phase 96 | Complete |
| POLL-07 | Phase 96 | Complete |
| POLL-08 | Phase 96 | Complete |
| E2E-01 | Phase 97 | Complete |
| E2E-02 | Phase 97 | Complete |
| E2E-03 | Phase 97 | Complete |
| E2E-04 | Phase 97 | Complete |
| E2E-05 | Phase 97 | Complete |
| E2E-06 | Phase 97 | Complete |
| E2E-07 | Phase 97 | Complete |
| E2E-08 | Phase 97 | Complete |
| E2E-09 | Phase 97 | Complete |
| E2E-10 | Phase 97 | Complete |

**Coverage:**
- v12.0 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 — traceability filled after roadmap creation*
