# Requirements: Pannello Stufa

**Defined:** 2026-03-23
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v16.0 Requirements

Requirements for Sonos, DIRIGERA & Fritz!Box Avanzato milestone. Each maps to roadmap phases.

### Sonos Infrastructure

- [x] **SONOS-01**: Proxy client per Sonos API con haGet/haPost/haPut transport (X-API-Key auth)
- [x] **SONOS-02**: TypeScript types per tutti i response interfaces Sonos (health, device, zone, playback, volume, EQ, queue, history)
- [x] **SONOS-03**: GET /sonos/health — speaker connectivity, data freshness, device count
- [ ] **SONOS-04**: GET /sonos/devices — lista speaker con identity e topology
- [ ] **SONOS-05**: GET /sonos/devices/{uid} — dettaglio speaker con audio state on-demand
- [x] **SONOS-06**: GET /sonos/zones — zone groups con coordinator e members

### Sonos Monitoring & Transport

- [x] **SONOS-07**: GET /sonos/zones/{group_id}/playback — stato playback corrente per zona
- [x] **SONOS-08**: GET /sonos/speakers/{uid}/volume — volume e mute state per speaker
- [x] **SONOS-09**: POST /sonos/zones/{group_id}/play — play su zone coordinator
- [x] **SONOS-10**: POST /sonos/zones/{group_id}/pause — pause zone coordinator
- [x] **SONOS-11**: POST /sonos/zones/{group_id}/stop — stop zone coordinator
- [x] **SONOS-12**: POST /sonos/zones/{group_id}/next — skip al brano successivo
- [x] **SONOS-13**: POST /sonos/zones/{group_id}/previous — skip al brano precedente

### Sonos Volume & Seek

- [x] **SONOS-14**: PUT /sonos/speakers/{uid}/volume — set volume speaker (0-100)
- [x] **SONOS-15**: PUT /sonos/speakers/{uid}/mute — set mute state speaker
- [ ] **SONOS-16**: PUT /sonos/zones/{group_id}/volume — set volume per tutti gli speaker in una zona
- [ ] **SONOS-17**: PUT /sonos/zones/{group_id}/seek — seek a posizione nel brano (HH:MM:SS)

### Sonos Extended Controls

- [x] **SONOS-18**: GET /sonos/speakers/{uid}/eq — EQ settings (bass, treble, loudness)
- [x] **SONOS-19**: PUT /sonos/speakers/{uid}/eq — set EQ settings (partial update)
- [x] **SONOS-20**: GET /sonos/zones/{group_id}/play-mode — play mode zona (shuffle, repeat, crossfade)
- [x] **SONOS-21**: PUT /sonos/zones/{group_id}/play-mode — set play mode zona
- [x] **SONOS-22**: GET /sonos/zones/{group_id}/queue — coda playback paginata
- [x] **SONOS-23**: GET /sonos/speakers/{uid}/home-theater — settings soundbar home theater
- [x] **SONOS-24**: PUT /sonos/speakers/{uid}/home-theater — set soundbar home theater (partial update)
- [x] **SONOS-25**: POST /sonos/speakers/{uid}/source — switch audio source (tv o line_in)
- [x] **SONOS-26**: POST /sonos/speakers/{uid}/join — join speaker a gruppo
- [x] **SONOS-27**: POST /sonos/speakers/{uid}/unjoin — rimuovi speaker da gruppo
- [x] **SONOS-28**: GET /sonos/zones/{group_id}/sleep-timer — sleep timer rimanente
- [x] **SONOS-29**: PUT /sonos/zones/{group_id}/sleep-timer — set/cancel sleep timer
- [x] **SONOS-30**: GET /sonos/history — volume/playback history con auto-granularity

### Sonos Frontend

- [x] **SONOS-31**: SonosCard dashboard card con now playing, zone status, speaker count
- [x] **SONOS-32**: /sonos page con zone list, playback controls, volume sliders
- [x] **SONOS-33**: Device registry integration per speaker Sonos
- [x] **SONOS-34**: Navigation menu entry per Sonos

### DIRIGERA Infrastructure

- [x] **DIRIG-01**: Proxy client per DIRIGERA API con haGet transport (X-API-Key auth)
- [x] **DIRIG-02**: TypeScript types per tutti i response interfaces DIRIGERA (health, sensor, contact, motion, summary)
- [x] **DIRIG-03**: GET /dirigera/health — hub connection status, firmware, connected sensors

### DIRIGERA Sensors

- [x] **DIRIG-04**: GET /dirigera/sensors — lista completa sensori (contatto + movimento)
- [x] **DIRIG-05**: GET /dirigera/sensors/contact — solo sensori contatto con data_freshness
- [x] **DIRIG-06**: GET /dirigera/sensors/motion — solo sensori movimento con light_level e data_freshness
- [x] **DIRIG-07**: GET /dirigera/sensors/summary — summary flotta (total, open, offline, low battery)

### DIRIGERA Frontend

- [x] **DIRIG-08**: DirigeraCard dashboard card con sensor summary (total, open contacts, offline, low battery)
- [x] **DIRIG-09**: /dirigera page con lista sensori, stato real-time, filtro per tipo
- [x] **DIRIG-10**: Device registry integration per sensori DIRIGERA
- [x] **DIRIG-11**: Navigation menu entry per DIRIGERA

### Fritz!Box System & WiFi

- [x] **FRITZ-01**: GET /fritzbox/system — model, firmware, uptime, CPU load
- [x] **FRITZ-02**: GET /fritzbox/wifi/clients — WiFi clients con signal, band, speed (filtro per band)
- [x] **FRITZ-03**: GET /fritzbox/wifi/networks — reti WiFi configurate con stato

### Fritz!Box Network Services

- [x] **FRITZ-04**: GET /fritzbox/network/dhcp/reservations — DHCP leases statici
- [x] **FRITZ-05**: GET /fritzbox/network/port-forwarding — regole port forwarding attive
- [x] **FRITZ-06**: GET /fritzbox/network/upnp — stato UPnP e port mappings
- [x] **FRITZ-07**: GET /fritzbox/network/mesh — topologia mesh (nodi e link)

### Fritz!Box History Tiers & Budget

- [x] **FRITZ-08**: GET /fritzbox/history/bandwidth/hourly — bandwidth aggregato orario
- [x] **FRITZ-09**: GET /fritzbox/history/bandwidth/daily — bandwidth aggregato giornaliero
- [x] **FRITZ-10**: GET /fritzbox/history/devices/daily — device count giornaliero
- [x] **FRITZ-11**: GET /fritzbox/history/bandwidth/auto — auto-granularity (hour/day switch)
- [x] **FRITZ-12**: GET /fritzbox/budget-stats — statistiche budget dati

### Fritz!Box Frontend

- [x] **FRITZ-13**: System info section nella /network page (model, firmware, uptime)
- [x] **FRITZ-14**: WiFi clients tab nella /network page con signal strength e band
- [x] **FRITZ-15**: Network services section (DHCP, port forwarding, UPnP, mesh) nella /network page
- [x] **FRITZ-16**: History charts con hourly/daily toggle nella /network page

### Sonos Zone Extended UI

- [x] **SONOS-35**: Play mode controls per zona nella /sonos page (shuffle, repeat, crossfade toggle buttons)
- [x] **SONOS-36**: Sleep timer display e set/cancel per zona nella /sonos page
- [x] **SONOS-37**: Queue viewer paginato per zona nella /sonos page (lista brani con titolo, artista, durata)

### Sonos Speaker Extended UI & History

- [x] **SONOS-38**: EQ controls per speaker nella /sonos page (bass/treble sliders, loudness toggle)
- [x] **SONOS-39**: Home theater settings per soundbar nella /sonos page (night mode, speech enhance, sub, surround)
- [x] **SONOS-40**: Source switch (TV/line-in) per speaker nella /sonos page
- [x] **SONOS-41**: Group management per speaker nella /sonos page (join a gruppo, unjoin da gruppo)
- [x] **SONOS-42**: History chart nella /sonos page (volume/playback, selettore tipo, time range, filtro speaker/zona)

### Fritz!Box Extended Frontend

- [x] **FRITZ-17**: WiFi networks section nella /network page (reti configurate con stato abilitato/disabilitato)
- [x] **FRITZ-18**: Device count daily chart nella /network page (grafico dispositivi connessi per giorno)
- [x] **FRITZ-19**: Budget stats card nella /network page (consumo dati, percentuale utilizzo, stato ok/warning/danger)
- [x] **FRITZ-20**: Auto-granularity toggle nella /network page bandwidth chart (sostituzione o integrazione tier manuale)

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
| SONOS-03 | Phase 126 | Complete |
| SONOS-04 | Phase 138 | Pending |
| SONOS-05 | Phase 138 | Pending |
| SONOS-06 | Phase 126 | Complete |
| SONOS-07 | Phase 127 | Complete |
| SONOS-08 | Phase 127 | Complete |
| SONOS-09 | Phase 127 | Complete |
| SONOS-10 | Phase 127 | Complete |
| SONOS-11 | Phase 127 | Complete |
| SONOS-12 | Phase 127 | Complete |
| SONOS-13 | Phase 127 | Complete |
| SONOS-14 | Phase 127 | Complete |
| SONOS-15 | Phase 127 | Complete |
| SONOS-16 | Phase 138 | Pending |
| SONOS-17 | Phase 138 | Pending |
| SONOS-18 | Phase 128 | Complete |
| SONOS-19 | Phase 128 | Complete |
| SONOS-20 | Phase 128 | Complete |
| SONOS-21 | Phase 128 | Complete |
| SONOS-22 | Phase 128 | Complete |
| SONOS-23 | Phase 128 | Complete |
| SONOS-24 | Phase 128 | Complete |
| SONOS-25 | Phase 128 | Complete |
| SONOS-26 | Phase 128 | Complete |
| SONOS-27 | Phase 128 | Complete |
| SONOS-28 | Phase 128 | Complete |
| SONOS-29 | Phase 128 | Complete |
| SONOS-30 | Phase 128 | Complete |
| SONOS-31 | Phase 129 | Complete |
| SONOS-32 | Phase 129 | Complete |
| SONOS-33 | Phase 129 | Complete |
| SONOS-34 | Phase 129 | Complete |
| DIRIG-01 | Phase 130 | Complete |
| DIRIG-02 | Phase 130 | Complete |
| DIRIG-03 | Phase 130 | Complete |
| DIRIG-04 | Phase 130 | Complete |
| DIRIG-05 | Phase 130 | Complete |
| DIRIG-06 | Phase 130 | Complete |
| DIRIG-07 | Phase 130 | Complete |
| DIRIG-08 | Phase 131 | Complete |
| DIRIG-09 | Phase 131 | Complete |
| DIRIG-10 | Phase 131 | Complete |
| DIRIG-11 | Phase 131 | Complete |
| FRITZ-01 | Phase 132 | Complete |
| FRITZ-02 | Phase 132 | Complete |
| FRITZ-03 | Phase 132 | Complete |
| FRITZ-04 | Phase 132 | Complete |
| FRITZ-05 | Phase 132 | Complete |
| FRITZ-06 | Phase 132 | Complete |
| FRITZ-07 | Phase 132 | Complete |
| FRITZ-08 | Phase 133 | Complete |
| FRITZ-09 | Phase 133 | Complete |
| FRITZ-10 | Phase 133 | Complete |
| FRITZ-11 | Phase 133 | Complete |
| FRITZ-12 | Phase 133 | Complete |
| FRITZ-13 | Phase 134 | Complete |
| FRITZ-14 | Phase 134 | Complete |
| FRITZ-15 | Phase 134 | Complete |
| FRITZ-16 | Phase 134 | Complete |
| SONOS-35 | Phase 135 | Complete |
| SONOS-36 | Phase 135 | Complete |
| SONOS-37 | Phase 135 | Complete |
| SONOS-38 | Phase 136 | Complete |
| SONOS-39 | Phase 136 | Complete |
| SONOS-40 | Phase 136 | Complete |
| SONOS-41 | Phase 136 | Complete |
| SONOS-42 | Phase 136 | Complete |
| FRITZ-17 | Phase 137 | Complete |
| FRITZ-18 | Phase 137 | Complete |
| FRITZ-19 | Phase 137 | Complete |
| FRITZ-20 | Phase 137 | Complete |

**Coverage:**
- v16.0 requirements: 62 total
- Mapped to phases: 62
- Unmapped: 0

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-26 — gap closure: SONOS-04/05/16/17 reassigned to Phase 138, traceability drift fixed (12 reqs Planned→Complete)*
