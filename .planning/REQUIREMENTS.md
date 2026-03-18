# Requirements: Pannello Stufa

**Defined:** 2026-03-18
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v12.0 Requirements

Requirements for Data Fetching Simplification & E2E Verification milestone.

### Polling Simplification

- [ ] **POLL-01**: StoveCard usa useAdaptivePolling (60s) invece del polling loop custom
- [ ] **POLL-02**: Firebase RTDB real-time listener della stufa rimosso
- [ ] **POLL-03**: sync-external-state call rimossa dal ciclo fetch stufa
- [ ] **POLL-04**: ThermostatCard polling esteso a 60s (da 30s)
- [ ] **POLL-05**: LightsCard polling esteso a 60s (da 30s)
- [ ] **POLL-06**: NetworkCard polling esteso a 60s visible / 5min hidden (da 30s/5min)
- [ ] **POLL-07**: RaspiCard polling esteso a 60s visible / 5min hidden (da 30s/5min)
- [ ] **POLL-08**: useDeviceStaleness polling rimosso o esteso a 60s (da 5s)

### E2E Page Verification

- [ ] **E2E-01**: Playwright verifica homepage carica tutte le card visibili senza errori
- [ ] **E2E-02**: Playwright verifica /stove carica e mostra dati
- [ ] **E2E-03**: Playwright verifica /thermostat carica e mostra dati
- [ ] **E2E-04**: Playwright verifica /lights carica e mostra dati
- [ ] **E2E-05**: Playwright verifica /network carica e mostra dati
- [ ] **E2E-06**: Playwright verifica /raspi carica e mostra dati
- [ ] **E2E-07**: Playwright verifica /analytics carica
- [ ] **E2E-08**: Playwright verifica /settings carica
- [ ] **E2E-09**: Playwright verifica /admin carica
- [ ] **E2E-10**: Nessuna pagina ha console errors o loading infiniti

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
| POLL-01 | — | Pending |
| POLL-02 | — | Pending |
| POLL-03 | — | Pending |
| POLL-04 | — | Pending |
| POLL-05 | — | Pending |
| POLL-06 | — | Pending |
| POLL-07 | — | Pending |
| POLL-08 | — | Pending |
| E2E-01 | — | Pending |
| E2E-02 | — | Pending |
| E2E-03 | — | Pending |
| E2E-04 | — | Pending |
| E2E-05 | — | Pending |
| E2E-06 | — | Pending |
| E2E-07 | — | Pending |
| E2E-08 | — | Pending |
| E2E-09 | — | Pending |
| E2E-10 | — | Pending |

**Coverage:**
- v12.0 requirements: 18 total
- Mapped to phases: 0
- Unmapped: 18 ⚠️

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after initial definition*
