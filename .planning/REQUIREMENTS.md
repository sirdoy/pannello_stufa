# Requirements: Pannello Stufa v19.0

**Defined:** 2026-04-03
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v19.0 Requirements

Requirements for API Alignment & Full Coverage milestone. Each maps to roadmap phases.

### Path Migration & Common

- [ ] **PATH-01**: Tutte le route thermorossi migrate da /api/stove/* a /api/v1/thermorossi/*
- [ ] **PATH-02**: Frontend (hooks, componenti, debug panels) aggiornato ai nuovi path thermorossi
- [ ] **COMMON-01**: GET /health ritorna stato aggregato di tutti i provider
- [ ] **COMMON-02**: GET /api/v1/devices ritorna lista aggregata dispositivi cross-provider

### Auth

- [ ] **AUTH-01**: User può autenticarsi via POST /auth/login con credenziali form-based e ricevere JWT
- [ ] **AUTH-02**: User può creare API key via POST /auth/api-keys
- [ ] **AUTH-03**: User può listare le proprie API key via GET /auth/api-keys
- [ ] **AUTH-04**: User può revocare una API key via DELETE /auth/api-keys/{key_id}

### Automations

- [ ] **AUTO-01**: User può listare le regole di automazione (paginato) via GET /api/v1/automations
- [ ] **AUTO-02**: User può creare una regola di automazione via POST /api/v1/automations
- [ ] **AUTO-03**: User può vedere una singola regola via GET /api/v1/automations/{rule_id}
- [ ] **AUTO-04**: User può aggiornare una regola via PATCH /api/v1/automations/{rule_id}
- [ ] **AUTO-05**: User può eliminare una regola via DELETE /api/v1/automations/{rule_id}
- [ ] **AUTO-06**: User può vedere lo storico esecuzioni via GET /api/v1/automations/{rule_id}/executions

### Hue

- [ ] **HUE-01**: GET /api/v1/hue/health ritorna stato connettività bridge
- [ ] **HUE-02**: GET /api/v1/hue/lights/{light_id} ritorna stato singola luce
- [ ] **HUE-03**: PUT /api/v1/hue/lights/{light_id}/state controlla singola luce
- [ ] **HUE-04**: GET /api/v1/hue/groups ritorna lista gruppi
- [ ] **HUE-05**: GET /api/v1/hue/groups/{group_id} ritorna stato singolo gruppo
- [ ] **HUE-06**: POST /api/v1/hue/groups/{group_id}/scenes/{scene_id} attiva scena per gruppo
- [ ] **HUE-07**: PUT /api/v1/hue/groups/{group_id}/action controlla luci del gruppo

### Sonos

- [ ] **SONOS-01**: GET /api/v1/sonos/zones/{group_id}/playback ritorna stato playback corrente
- [ ] **SONOS-02**: POST /api/v1/sonos/zones/{group_id}/play invia comando play
- [ ] **SONOS-03**: POST /api/v1/sonos/zones/{group_id}/pause invia comando pause
- [ ] **SONOS-04**: POST /api/v1/sonos/zones/{group_id}/stop invia comando stop
- [ ] **SONOS-05**: POST /api/v1/sonos/zones/{group_id}/next passa traccia successiva
- [ ] **SONOS-06**: POST /api/v1/sonos/zones/{group_id}/previous passa traccia precedente
- [ ] **SONOS-07**: PUT /api/v1/sonos/zones/{group_id}/volume controlla volume zona
- [ ] **SONOS-08**: PUT /api/v1/sonos/zones/{group_id}/seek seek a posizione
- [ ] **SONOS-09**: GET /api/v1/sonos/zones/{group_id}/play-mode ritorna play mode
- [ ] **SONOS-10**: PUT /api/v1/sonos/zones/{group_id}/play-mode imposta play mode
- [ ] **SONOS-11**: GET /api/v1/sonos/zones/{group_id}/queue ritorna coda di riproduzione
- [ ] **SONOS-12**: GET /api/v1/sonos/zones/{group_id}/sleep-timer ritorna stato sleep timer
- [ ] **SONOS-13**: PUT /api/v1/sonos/zones/{group_id}/sleep-timer imposta sleep timer

### Netatmo

- [ ] **NETA-01**: GET /api/v1/netatmo/getthermstate ritorna stato termostato corrente
- [ ] **NETA-02**: POST /api/v1/netatmo/valves/calibrate calibra tutte le valvole
- [ ] **NETA-03**: POST /api/v1/netatmo/valves/{module_id}/calibrate calibra singola valvola
- [ ] **NETA-04**: GET /api/v1/netatmo/camera/events/{event_id}/snapshot ritorna snapshot evento
- [ ] **NETA-05**: GET /api/v1/netatmo/camera/{camera_id}/stream ritorna URL stream RTSP
- [ ] **NETA-06**: GET /api/v1/netatmo/camera/{camera_id}/snapshot ritorna snapshot camera
- [ ] **NETA-07**: POST /api/v1/netatmo/camera/{camera_id}/monitoring toggle monitoraggio camera
- [ ] **NETA-08**: POST /api/v1/netatmo/renamehome rinomina un home
- [ ] **NETA-09**: GET /api/v1/netatmo/gethomedata ritorna snapshot completo home (alias deprecato)

### Fritz!Box

- [ ] **FRITZ-01**: GET /api/v1/fritzbox/telephony/dect ritorna handset DECT registrati
- [ ] **FRITZ-02**: GET /api/v1/fritzbox/telephony/calls ritorna storico chiamate paginato
- [ ] **FRITZ-03**: GET /api/v1/fritzbox/telephony/tam ritorna stato segreteria telefonica
- [ ] **FRITZ-04**: GET /api/v1/fritzbox/history/bandwidth ritorna raw bandwidth history
- [ ] **FRITZ-05**: GET /api/v1/fritzbox/history/devices ritorna raw device presence history
- [ ] **FRITZ-06**: GET /api/v1/fritzbox/history/device-events ritorna log eventi join/leave
- [ ] **FRITZ-07**: GET /api/v1/fritzbox/service-discovery ritorna TR-064 service descriptor

### DIRIGERA

- [ ] **DIR-01**: GET /api/v1/dirigera/history ritorna storico eventi sensori paginato
- [ ] **DIR-02**: GET /api/v1/dirigera/stats ritorna statistiche aggregazione e retention
- [ ] **DIR-03**: GET /api/v1/dirigera/telemetry ritorna storico telemetria sensori paginato

## Future Requirements

### Scheduler

- **SCHED-XX**: Scheduler endpoints — esclusi da v19.0, da implementare in milestone futuro

## Out of Scope

| Feature | Reason |
|---------|--------|
| Scheduler API endpoints | Escluso esplicitamente dall'utente per questo milestone |
| WebSocket server-side | Il client WS è già implementato; il server WS è nel HA proxy, non nel frontend Next.js |
| UI per nuovi endpoint | v19.0 copre solo proxy client + API routes; UI dedicate in milestone futuro se necessario |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PATH-01 | Phase 156 | Pending |
| PATH-02 | Phase 156 | Pending |
| COMMON-01 | Phase 156 | Pending |
| COMMON-02 | Phase 156 | Pending |
| AUTH-01 | Phase 157 | Pending |
| AUTH-02 | Phase 157 | Pending |
| AUTH-03 | Phase 157 | Pending |
| AUTH-04 | Phase 157 | Pending |
| AUTO-01 | Phase 158 | Pending |
| AUTO-02 | Phase 158 | Pending |
| AUTO-03 | Phase 158 | Pending |
| AUTO-04 | Phase 158 | Pending |
| AUTO-05 | Phase 158 | Pending |
| AUTO-06 | Phase 158 | Pending |
| HUE-01 | Phase 159 | Pending |
| HUE-02 | Phase 159 | Pending |
| HUE-03 | Phase 159 | Pending |
| HUE-04 | Phase 159 | Pending |
| HUE-05 | Phase 159 | Pending |
| HUE-06 | Phase 159 | Pending |
| HUE-07 | Phase 159 | Pending |
| SONOS-01 | Phase 160 | Pending |
| SONOS-02 | Phase 160 | Pending |
| SONOS-03 | Phase 160 | Pending |
| SONOS-04 | Phase 160 | Pending |
| SONOS-05 | Phase 160 | Pending |
| SONOS-06 | Phase 160 | Pending |
| SONOS-07 | Phase 160 | Pending |
| SONOS-08 | Phase 160 | Pending |
| SONOS-09 | Phase 160 | Pending |
| SONOS-10 | Phase 160 | Pending |
| SONOS-11 | Phase 160 | Pending |
| SONOS-12 | Phase 160 | Pending |
| SONOS-13 | Phase 160 | Pending |
| NETA-01 | Phase 161 | Pending |
| NETA-02 | Phase 161 | Pending |
| NETA-03 | Phase 161 | Pending |
| NETA-04 | Phase 161 | Pending |
| NETA-05 | Phase 161 | Pending |
| NETA-06 | Phase 161 | Pending |
| NETA-07 | Phase 161 | Pending |
| NETA-08 | Phase 161 | Pending |
| NETA-09 | Phase 161 | Pending |
| FRITZ-01 | Phase 162 | Pending |
| FRITZ-02 | Phase 162 | Pending |
| FRITZ-03 | Phase 162 | Pending |
| FRITZ-04 | Phase 162 | Pending |
| FRITZ-05 | Phase 162 | Pending |
| FRITZ-06 | Phase 162 | Pending |
| FRITZ-07 | Phase 162 | Pending |
| DIR-01 | Phase 163 | Pending |
| DIR-02 | Phase 163 | Pending |
| DIR-03 | Phase 163 | Pending |

**Coverage:**
- v19.0 requirements: 52 total
- Mapped to phases: 52
- Unmapped: 0

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 after roadmap creation*
