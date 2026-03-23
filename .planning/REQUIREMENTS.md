# Requirements: Pannello Stufa

**Defined:** 2026-03-23
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v16.0 Requirements

Requirements for Sonos, DIRIGERA & Fritz!Box Avanzato milestone. Each maps to roadmap phases.

### Sonos Infrastructure

- [x] **SONOS-01**: Proxy client per Sonos API con haGet/haPost/haPut transport (X-API-Key auth)
- [x] **SONOS-02**: TypeScript types per tutti i response interfaces Sonos (health, device, zone, playback, volume, EQ, queue, history)
- [ ] **SONOS-03**: GET /sonos/health — speaker connectivity, data freshness, device count
- [ ] **SONOS-04**: GET /sonos/devices — lista speaker con identity e topology
- [ ] **SONOS-05**: GET /sonos/devices/{uid} — dettaglio speaker con audio state on-demand
- [ ] **SONOS-06**: GET /sonos/zones — zone groups con coordinator e members

### Sonos Monitoring & Transport

- [ ] **SONOS-07**: GET /sonos/zones/{group_id}/playback — stato playback corrente per zona
- [ ] **SONOS-08**: GET /sonos/speakers/{uid}/volume — volume e mute state per speaker
- [ ] **SONOS-09**: POST /sonos/zones/{group_id}/play — play su zone coordinator
- [ ] **SONOS-10**: POST /sonos/zones/{group_id}/pause — pause zone coordinator
- [ ] **SONOS-11**: POST /sonos/zones/{group_id}/stop — stop zone coordinator
- [ ] **SONOS-12**: POST /sonos/zones/{group_id}/next — skip al brano successivo
- [ ] **SONOS-13**: POST /sonos/zones/{group_id}/previous — skip al brano precedente

### Sonos Volume & Seek

- [ ] **SONOS-14**: PUT /sonos/speakers/{uid}/volume — set volume speaker (0-100)
- [ ] **SONOS-15**: PUT /sonos/speakers/{uid}/mute — set mute state speaker
- [ ] **SONOS-16**: PUT /sonos/zones/{group_id}/volume — set volume per tutti gli speaker in una zona
- [ ] **SONOS-17**: PUT /sonos/zones/{group_id}/seek — seek a posizione nel brano (HH:MM:SS)

### Sonos Extended Controls

- [ ] **SONOS-18**: GET /sonos/speakers/{uid}/eq — EQ settings (bass, treble, loudness)
- [ ] **SONOS-19**: PUT /sonos/speakers/{uid}/eq — set EQ settings (partial update)
- [ ] **SONOS-20**: GET /sonos/zones/{group_id}/play-mode — play mode zona (shuffle, repeat, crossfade)
- [ ] **SONOS-21**: PUT /sonos/zones/{group_id}/play-mode — set play mode zona
- [ ] **SONOS-22**: GET /sonos/zones/{group_id}/queue — coda playback paginata
- [ ] **SONOS-23**: GET /sonos/speakers/{uid}/home-theater — settings soundbar home theater
- [ ] **SONOS-24**: PUT /sonos/speakers/{uid}/home-theater — set soundbar home theater (partial update)
- [ ] **SONOS-25**: POST /sonos/speakers/{uid}/source — switch audio source (tv o line_in)
- [ ] **SONOS-26**: POST /sonos/speakers/{uid}/join — join speaker a gruppo
- [ ] **SONOS-27**: POST /sonos/speakers/{uid}/unjoin — rimuovi speaker da gruppo
- [ ] **SONOS-28**: GET /sonos/zones/{group_id}/sleep-timer — sleep timer rimanente
- [ ] **SONOS-29**: PUT /sonos/zones/{group_id}/sleep-timer — set/cancel sleep timer
- [ ] **SONOS-30**: GET /sonos/history — volume/playback history con auto-granularity

### Sonos Frontend

- [ ] **SONOS-31**: SonosCard dashboard card con now playing, zone status, speaker count
- [ ] **SONOS-32**: /sonos page con zone list, playback controls, volume sliders
- [ ] **SONOS-33**: Device registry integration per speaker Sonos
- [ ] **SONOS-34**: Navigation menu entry per Sonos

### DIRIGERA Infrastructure

- [ ] **DIRIG-01**: Proxy client per DIRIGERA API con haGet transport (X-API-Key auth)
- [ ] **DIRIG-02**: TypeScript types per tutti i response interfaces DIRIGERA (health, sensor, contact, motion, summary)
- [ ] **DIRIG-03**: GET /dirigera/health — hub connection status, firmware, connected sensors

### DIRIGERA Sensors

- [ ] **DIRIG-04**: GET /dirigera/sensors — lista completa sensori (contatto + movimento)
- [ ] **DIRIG-05**: GET /dirigera/sensors/contact — solo sensori contatto con data_freshness
- [ ] **DIRIG-06**: GET /dirigera/sensors/motion — solo sensori movimento con light_level e data_freshness
- [ ] **DIRIG-07**: GET /dirigera/sensors/summary — summary flotta (total, open, offline, low battery)

### DIRIGERA Frontend

- [ ] **DIRIG-08**: DirigeraCard dashboard card con sensor summary (total, open contacts, offline, low battery)
- [ ] **DIRIG-09**: /dirigera page con lista sensori, stato real-time, filtro per tipo
- [ ] **DIRIG-10**: Device registry integration per sensori DIRIGERA
- [ ] **DIRIG-11**: Navigation menu entry per DIRIGERA

### Fritz!Box System & WiFi

- [ ] **FRITZ-01**: GET /fritzbox/system — model, firmware, uptime, CPU load
- [ ] **FRITZ-02**: GET /fritzbox/wifi/clients — WiFi clients con signal, band, speed (filtro per band)
- [ ] **FRITZ-03**: GET /fritzbox/wifi/networks — reti WiFi configurate con stato

### Fritz!Box Network Services

- [ ] **FRITZ-04**: GET /fritzbox/network/dhcp/reservations — DHCP leases statici
- [ ] **FRITZ-05**: GET /fritzbox/network/port-forwarding — regole port forwarding attive
- [ ] **FRITZ-06**: GET /fritzbox/network/upnp — stato UPnP e port mappings
- [ ] **FRITZ-07**: GET /fritzbox/network/mesh — topologia mesh (nodi e link)

### Fritz!Box History Tiers & Budget

- [ ] **FRITZ-08**: GET /fritzbox/history/bandwidth/hourly — bandwidth aggregato orario
- [ ] **FRITZ-09**: GET /fritzbox/history/bandwidth/daily — bandwidth aggregato giornaliero
- [ ] **FRITZ-10**: GET /fritzbox/history/devices/daily — device count giornaliero
- [ ] **FRITZ-11**: GET /fritzbox/history/bandwidth/auto — auto-granularity (hour/day switch)
- [ ] **FRITZ-12**: GET /fritzbox/budget-stats — statistiche budget dati

### Fritz!Box Frontend

- [ ] **FRITZ-13**: System info section nella /network page (model, firmware, uptime)
- [ ] **FRITZ-14**: WiFi clients tab nella /network page con signal strength e band
- [ ] **FRITZ-15**: Network services section (DHCP, port forwarding, UPnP, mesh) nella /network page
- [ ] **FRITZ-16**: History charts con hourly/daily toggle nella /network page

## Future Requirements (v16.1+)

### DIRIGERA History & Stats

- **DIRIG-F01**: GET /dirigera/history — event history paginato con filtri
- **DIRIG-F02**: GET /dirigera/stats — statistiche aggregazione e retention
- **DIRIG-F03**: GET /dirigera/telemetry — telemetria sensori (batteria, luce)
- **DIRIG-F04**: /dirigera history page con timeline eventi e grafici telemetria

## Out of Scope

| Feature | Reason |
|---------|--------|
| Fritz!Box Telephony (DECT, calls, TAM) | User excluded — non necessario |
| Auth API (JWT/API key management) | App usa Auth0 — documentazione non rilevante |
| Automations engine (rule CRUD) | Scope separato, milestone dedicato futuro |
| Common /api/v1/devices aggregated | Redundante con Device Registry |
| Sonos TTS/announcement | Non documentato nell'API |
| DIRIGERA light control (bulbs) | Solo sensori in scope, luci gestite da Hue |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SONOS-01 | Phase 126 | Complete |
| SONOS-02 | Phase 126 | Complete |
| SONOS-03 | Phase 126 | Pending |
| SONOS-04 | Phase 126 | Pending |
| SONOS-05 | Phase 126 | Pending |
| SONOS-06 | Phase 126 | Pending |
| SONOS-07 | Phase 127 | Pending |
| SONOS-08 | Phase 127 | Pending |
| SONOS-09 | Phase 127 | Pending |
| SONOS-10 | Phase 127 | Pending |
| SONOS-11 | Phase 127 | Pending |
| SONOS-12 | Phase 127 | Pending |
| SONOS-13 | Phase 127 | Pending |
| SONOS-14 | Phase 127 | Pending |
| SONOS-15 | Phase 127 | Pending |
| SONOS-16 | Phase 127 | Pending |
| SONOS-17 | Phase 127 | Pending |
| SONOS-18 | Phase 128 | Pending |
| SONOS-19 | Phase 128 | Pending |
| SONOS-20 | Phase 128 | Pending |
| SONOS-21 | Phase 128 | Pending |
| SONOS-22 | Phase 128 | Pending |
| SONOS-23 | Phase 128 | Pending |
| SONOS-24 | Phase 128 | Pending |
| SONOS-25 | Phase 128 | Pending |
| SONOS-26 | Phase 128 | Pending |
| SONOS-27 | Phase 128 | Pending |
| SONOS-28 | Phase 128 | Pending |
| SONOS-29 | Phase 128 | Pending |
| SONOS-30 | Phase 128 | Pending |
| SONOS-31 | Phase 129 | Pending |
| SONOS-32 | Phase 129 | Pending |
| SONOS-33 | Phase 129 | Pending |
| SONOS-34 | Phase 129 | Pending |
| DIRIG-01 | Phase 130 | Pending |
| DIRIG-02 | Phase 130 | Pending |
| DIRIG-03 | Phase 130 | Pending |
| DIRIG-04 | Phase 130 | Pending |
| DIRIG-05 | Phase 130 | Pending |
| DIRIG-06 | Phase 130 | Pending |
| DIRIG-07 | Phase 130 | Pending |
| DIRIG-08 | Phase 131 | Pending |
| DIRIG-09 | Phase 131 | Pending |
| DIRIG-10 | Phase 131 | Pending |
| DIRIG-11 | Phase 131 | Pending |
| FRITZ-01 | Phase 132 | Pending |
| FRITZ-02 | Phase 132 | Pending |
| FRITZ-03 | Phase 132 | Pending |
| FRITZ-04 | Phase 132 | Pending |
| FRITZ-05 | Phase 132 | Pending |
| FRITZ-06 | Phase 132 | Pending |
| FRITZ-07 | Phase 132 | Pending |
| FRITZ-08 | Phase 133 | Pending |
| FRITZ-09 | Phase 133 | Pending |
| FRITZ-10 | Phase 133 | Pending |
| FRITZ-11 | Phase 133 | Pending |
| FRITZ-12 | Phase 133 | Pending |
| FRITZ-13 | Phase 134 | Pending |
| FRITZ-14 | Phase 134 | Pending |
| FRITZ-15 | Phase 134 | Pending |
| FRITZ-16 | Phase 134 | Pending |

**Coverage:**
- v16.0 requirements: 50 total
- Mapped to phases: 50
- Unmapped: 0

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 — traceability populated after roadmap creation*
