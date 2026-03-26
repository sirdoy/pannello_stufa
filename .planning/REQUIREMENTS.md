# Requirements: Pannello Stufa

**Defined:** 2026-03-26
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v17.0 Requirements

Requirements for WebSocket Real-Time Transport milestone. Each maps to roadmap phases.

### WebSocket Infrastructure

- [ ] **WS-01**: App mantiene una singola connessione WebSocket condivisa verso `/ws/live` con auth via query parameter
- [ ] **WS-02**: Connessione supporta subscribe/unsubscribe per topic individuali (`fritzbox`, `dirigera`, `netatmo`, `thermorossi`, `hue`, `sonos`)
- [ ] **WS-03**: Messaggi in arrivo vengono dispatchati ai consumer registrati in base al campo `topic`
- [ ] **WS-04**: Connessione si riconnette automaticamente con exponential backoff (1s → 30s cap) dopo disconnessione
- [ ] **WS-05**: Tutti i topic vengono ri-sottoscritti automaticamente dopo ogni riconnessione
- [ ] **WS-06**: Tipi TypeScript per tutti i payload WS dei 6 provider derivati dalla spec `docs/api/websocket.md`

### Provider Migration — Stove

- [ ] **MIG-01**: `useStoveData` riceve dati stufa via WebSocket come canale primario
- [ ] **MIG-02**: `useStoveData` fallback automatico a polling HTTP se WebSocket non disponibile
- [ ] **MIG-03**: Comportamento `alwaysActive` preservato — polling fallback continua anche con tab nascosta

### Provider Migration — Network (Fritz!Box)

- [ ] **MIG-04**: `useNetworkData` riceve dati Fritz!Box (devices, bandwidth, wan) via WebSocket come canale primario
- [ ] **MIG-05**: `useNetworkData` fallback automatico a polling HTTP se WebSocket non disponibile
- [ ] **MIG-06**: Sparkline buffer e bandwidth history preservati durante transizioni WS/polling

### Provider Migration — Lights (Hue)

- [ ] **MIG-07**: `useLightsData` riceve dati luci via WebSocket come canale primario
- [ ] **MIG-08**: `useLightsData` fallback automatico a polling HTTP se WebSocket non disponibile

### Provider Migration — Sonos

- [ ] **MIG-09**: `useSonosData` riceve dati Sonos (speakers, groups) via WebSocket come canale primario
- [ ] **MIG-10**: `useSonosData` fallback automatico a polling HTTP se WebSocket non disponibile

### Provider Migration — DIRIGERA

- [ ] **MIG-11**: `useDirigeraData` riceve dati sensori via WebSocket come canale primario
- [ ] **MIG-12**: `useDirigeraData` fallback automatico a polling HTTP se WebSocket non disponibile

### Provider Migration — Netatmo

- [ ] **MIG-13**: `useThermostatData` riceve dati Netatmo via WebSocket come canale primario
- [ ] **MIG-14**: `useThermostatData` fallback automatico a polling HTTP se WebSocket non disponibile

### Connection UX

- [ ] **UX-01**: Indicatore visuale dello stato connessione WebSocket (connesso / riconnessione / fallback polling)
- [ ] **UX-02**: Transizione tra WebSocket e polling avviene senza flicker o perdita dati visibile
- [ ] **UX-03**: Dashboard card mostrano timestamp ultimo aggiornamento (da WS `ts` field o polling)

## Future Requirements

### WebSocket Enhancements

- **WSFU-01**: Supporto multi-tab con SharedWorker o BroadcastChannel per condividere la connessione WS
- **WSFU-02**: Offline queue per comandi inviati durante disconnessione
- **WSFU-03**: Metriche WS nel analytics dashboard (uptime, reconnections, fallback rate)

## Out of Scope

| Feature | Reason |
|---------|--------|
| WebSocket per comandi (write) | La spec `/ws/live` e' read-only push; i comandi restano via REST POST/PUT |
| SharedWorker multi-tab | Complessita' elevata, differibile a futuro milestone |
| Server-side WS in API routes | Il WS e' client-side diretto verso il proxy HA, non passa per Next.js API routes |
| Rimozione polling | Il polling resta come fallback; non viene eliminato in questo milestone |
| Raspberry Pi via WS | Il proxy HA non include Raspberry Pi nei 6 topic WS |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| WS-01 | — | Pending |
| WS-02 | — | Pending |
| WS-03 | — | Pending |
| WS-04 | — | Pending |
| WS-05 | — | Pending |
| WS-06 | — | Pending |
| MIG-01 | — | Pending |
| MIG-02 | — | Pending |
| MIG-03 | — | Pending |
| MIG-04 | — | Pending |
| MIG-05 | — | Pending |
| MIG-06 | — | Pending |
| MIG-07 | — | Pending |
| MIG-08 | — | Pending |
| MIG-09 | — | Pending |
| MIG-10 | — | Pending |
| MIG-11 | — | Pending |
| MIG-12 | — | Pending |
| MIG-13 | — | Pending |
| MIG-14 | — | Pending |
| UX-01 | — | Pending |
| UX-02 | — | Pending |
| UX-03 | — | Pending |

**Coverage:**
- v17.0 requirements: 23 total
- Mapped to phases: 0
- Unmapped: 23 ⚠️

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after initial definition*
