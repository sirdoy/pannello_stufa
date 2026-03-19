# Requirements: Pannello Stufa

**Defined:** 2026-03-19
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v13.0 Requirements

Requirements for Thermorossi Proxy Migration. Each maps to roadmap phases.

### Proxy Client

- [ ] **CLIENT-01**: Thermorossi proxy client uses shared `haGet`/`haPost` transport with X-API-Key auth
- [ ] **CLIENT-02**: TypeScript types for all proxy response interfaces (status, power, fan, history, command, health)
- [ ] **CLIENT-03**: Convenience wrappers for each endpoint (getStatus, getPower, getFan, getHealth, getHistory)

### Read Endpoints

- [ ] **READ-01**: GET /status migrated to proxy — returns stove_state, power_level, fan_level, data_freshness, error_code, error_description
- [ ] **READ-02**: GET /power migrated to proxy — returns power_level with data_freshness
- [ ] **READ-03**: GET /fan-level migrated to proxy — returns fan_level with data_freshness
- [ ] **READ-04**: GET /health migrated to proxy — returns provider health and cache freshness
- [ ] **READ-05**: GET /history available via proxy — paginated telemetry with auto-granularity (raw/hourly/daily)

### Control Endpoints

- [ ] **CMD-01**: POST /commands/ignit via proxy — handles 202 Accepted with suggested_poll_delay_s
- [ ] **CMD-02**: POST /commands/shutdown via proxy — handles 202 Accepted with suggested_poll_delay_s
- [ ] **CMD-03**: POST /settings/power via proxy — sends { value: N }, handles 202 Accepted
- [ ] **CMD-04**: POST /settings/fan-level via proxy — sends { value: N }, handles 202 Accepted
- [ ] **CMD-05**: POST /settings/temperature/water via proxy — sends { value: N }, range 40-80°C

### Frontend

- [ ] **UI-01**: useStoveData reads stove_state (exact equality), power_level, fan_level from proxy response
- [ ] **UI-02**: stoveStatusUtils rewritten for exact stove_state matching (working, off, igniting, standby, cleaning, alarm, modulating)
- [ ] **UI-03**: useStoveCommands handles 202 Accepted response pattern from proxy
- [ ] **UI-04**: Error display uses error_code and error_description from proxy status
- [ ] **UI-05**: data_freshness from proxy replaces custom staleness logic for stove provider

### Scheduler/Cron

- [ ] **CRON-01**: Scheduler reads stove_state instead of StatusDescription for state decisions
- [ ] **CRON-02**: Health monitoring reads error_code/error_description for alarm notifications
- [ ] **CRON-03**: All scheduler stove API calls route through proxy client

### Cleanup

- [ ] **CLEAN-01**: WiNet direct API client deleted (lib/stoveApi.ts cloud functions)
- [ ] **CLEAN-02**: WiNet API key removed from environment/config
- [ ] **CLEAN-03**: Sandbox mode removed (localhost WiNet simulation)
- [ ] **CLEAN-04**: Dead API routes removed (getRoomTemperature, getActualWaterTemperature, getWaterSetTemperature, settings, setSettings)

### Debug Panel

- [ ] **DEBUG-01**: StoveTab updated with proxy endpoint URLs and response formats

## Future Requirements

None — this milestone completes the proxy migration for all providers.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Stove telemetry dashboard page | History endpoint enables it, but UI deferred to future milestone |
| Proxy-side state gating changes | Proxy team owns state gating logic, PWA handles 409 responses |
| Stove PID automation rewrite | PID logic unchanged, only API transport layer migrated |
| New stove features (scheduling, presets) | Migration only — no new user-facing features |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLIENT-01 | — | Pending |
| CLIENT-02 | — | Pending |
| CLIENT-03 | — | Pending |
| READ-01 | — | Pending |
| READ-02 | — | Pending |
| READ-03 | — | Pending |
| READ-04 | — | Pending |
| READ-05 | — | Pending |
| CMD-01 | — | Pending |
| CMD-02 | — | Pending |
| CMD-03 | — | Pending |
| CMD-04 | — | Pending |
| CMD-05 | — | Pending |
| UI-01 | — | Pending |
| UI-02 | — | Pending |
| UI-03 | — | Pending |
| UI-04 | — | Pending |
| UI-05 | — | Pending |
| CRON-01 | — | Pending |
| CRON-02 | — | Pending |
| CRON-03 | — | Pending |
| CLEAN-01 | — | Pending |
| CLEAN-02 | — | Pending |
| CLEAN-03 | — | Pending |
| CLEAN-04 | — | Pending |
| DEBUG-01 | — | Pending |

**Coverage:**
- v13.0 requirements: 26 total
- Mapped to phases: 0
- Unmapped: 26 ⚠️

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after initial definition*
