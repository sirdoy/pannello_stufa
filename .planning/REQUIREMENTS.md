# Requirements: Pannello Stufa

**Defined:** 2026-03-14
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v10.0 Requirements

Requirements for Netatmo API Migration. Each maps to roadmap phases.

### API Client

- [x] **API-01**: Next.js API routes proxy Netatmo calls through local API (`/api/v1/netatmo/`) instead of `api.netatmo.com`
- [x] **API-02**: Authentication uses API Key (`X-API-Key` header) instead of Netatmo OAuth tokens
- [x] **API-03**: API client handles `data_freshness` field (`LIVE`/`STALE`/`UNREACHABLE`) from proxy responses
- [x] **API-04**: API client propagates RFC 9457 error responses from proxy to frontend

### Energy (Thermostat)

- [x] **ENERGY-01**: Room temperatures served from proxy `/homestatus` (SQLite-backed, no direct Netatmo call)
- [x] **ENERGY-02**: Home topology served from proxy `/homesdata` (cached, no direct Netatmo call)
- [x] **ENERGY-03**: Set room temperature via proxy `/setroomthermpoint`
- [x] **ENERGY-04**: Set thermostat mode via proxy `/setthermmode`
- [ ] **ENERGY-05**: Switch schedule via proxy `/switchhomeschedule`
- [x] **ENERGY-06**: Sync schedule via proxy `/synchomeschedule`
- [x] **ENERGY-07**: Historical room measurements via proxy `/getroommeasure` (SQLite aggregation tiers)

### Valve

- [x] **VALVE-01**: Valve status via dedicated proxy `/valves` endpoint (replaces parsing from homestatus)
- [x] **VALVE-02**: Valve calibration via proxy `/valves/calibrate` (replaces synchomeschedule workaround)

### Camera

- [x] **CAM-01**: Camera status via proxy `/camera/status`
- [x] **CAM-02**: Camera stream URLs via proxy `/camera/{id}/stream` (HLS with VPN + local)
- [x] **CAM-03**: Camera snapshot via proxy `/camera/{id}/snapshot`
- [x] **CAM-04**: Camera events via proxy `/camera/events` (SQLite-backed, 7-day retention)
- [x] **CAM-05**: Camera monitoring toggle via proxy `/camera/{id}/monitoring`
- [x] **CAM-06**: Event snapshot binary via proxy `/camera/events/{id}/snapshot`

### Health & Monitoring

- [x] **HEALTH-01**: Netatmo provider health via proxy `/health` (token status, data freshness, rate limit usage)
- [x] **HEALTH-02**: Health monitoring cron uses proxy health endpoint instead of custom token checks

### Cleanup

- [x] **CLEAN-01**: Delete `lib/netatmoTokenHelper.ts` (token management now in proxy)
- [ ] **CLEAN-02**: Delete `lib/netatmoCredentials.ts` (OAuth credentials not needed)
- [x] **CLEAN-03**: Delete `lib/netatmoRateLimiter.ts` + `netatmoRateLimiterPersistent.ts` (rate limiting in proxy)
- [x] **CLEAN-04**: Delete `lib/netatmoCacheService.ts` (caching in proxy)
- [x] **CLEAN-05**: Delete OAuth callback route `app/api/netatmo/callback/` (OAuth flow removed)
- [x] **CLEAN-06**: Remove Netatmo OAuth env vars (`NETATMO_CLIENT_SECRET`, `NEXT_PUBLIC_NETATMO_CLIENT_ID`, `NEXT_PUBLIC_NETATMO_REDIRECT_URI`)
- [x] **CLEAN-07**: Update all tests to match new API proxy patterns

## Future Requirements

### Automation

- **AUTO-01**: Automation rules via proxy `/api/v1/automations` (deferred to proxy v2.4+)

### Schedule CRUD

- **SCHED-01**: Create/edit/delete schedules in-app (deferred — Netatmo app sufficient)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Netatmo OAuth login flow | Proxy handles authentication — no user-facing OAuth needed |
| Schedule CRUD UI (create/edit/delete) | Existing limitation, deferred to future |
| Camera recording playback | Proxy provides events + snapshots, video playback not in scope |
| Automation endpoints | Scaffolded in proxy but not yet operational (deferred to v2.4+) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | Phase 75 | Complete |
| API-02 | Phase 80 | Complete |
| API-03 | Phase 75 | Complete |
| API-04 | Phase 75 | Complete |
| ENERGY-01 | Phase 75 | Complete |
| ENERGY-02 | Phase 75 | Complete |
| ENERGY-03 | Phase 76 | Complete |
| ENERGY-04 | Phase 76 | Complete |
| ENERGY-05 | Phase 80 | Pending |
| ENERGY-06 | Phase 76 | Complete |
| ENERGY-07 | Phase 76 | Complete |
| VALVE-01 | Phase 78 | Complete |
| VALVE-02 | Phase 78 | Complete |
| CAM-01 | Phase 77 | Complete |
| CAM-02 | Phase 77 | Complete |
| CAM-03 | Phase 77 | Complete |
| CAM-04 | Phase 77 | Complete |
| CAM-05 | Phase 77 | Complete |
| CAM-06 | Phase 77 | Complete |
| HEALTH-01 | Phase 78 | Complete |
| HEALTH-02 | Phase 78 | Complete |
| CLEAN-01 | Phase 79 | Complete |
| CLEAN-02 | Phase 81 | Pending |
| CLEAN-03 | Phase 79 | Complete |
| CLEAN-04 | Phase 79 | Complete |
| CLEAN-05 | Phase 79 | Complete |
| CLEAN-06 | Phase 80 | Complete |
| CLEAN-07 | Phase 79 | Complete |

**Coverage:**
- v10.0 requirements: 28 total
- Satisfied: 24
- Pending (gap closure): 4 (API-02, ENERGY-05, CLEAN-02, CLEAN-06)
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-14*
*Last updated: 2026-03-15 — gap closure phases 80-81 added*
