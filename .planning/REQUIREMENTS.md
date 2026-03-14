# Requirements: Pannello Stufa

**Defined:** 2026-03-14
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v10.0 Requirements

Requirements for Netatmo API Migration. Each maps to roadmap phases.

### API Client

- [ ] **API-01**: Next.js API routes proxy Netatmo calls through local API (`/api/v1/netatmo/`) instead of `api.netatmo.com`
- [ ] **API-02**: Authentication uses API Key (`X-API-Key` header) instead of Netatmo OAuth tokens
- [ ] **API-03**: API client handles `data_freshness` field (`LIVE`/`STALE`/`UNREACHABLE`) from proxy responses
- [ ] **API-04**: API client propagates RFC 9457 error responses from proxy to frontend

### Energy (Thermostat)

- [ ] **ENERGY-01**: Room temperatures served from proxy `/homestatus` (SQLite-backed, no direct Netatmo call)
- [ ] **ENERGY-02**: Home topology served from proxy `/homesdata` (cached, no direct Netatmo call)
- [ ] **ENERGY-03**: Set room temperature via proxy `/setroomthermpoint`
- [ ] **ENERGY-04**: Set thermostat mode via proxy `/setthermmode`
- [ ] **ENERGY-05**: Switch schedule via proxy `/switchhomeschedule`
- [ ] **ENERGY-06**: Sync schedule via proxy `/synchomeschedule`
- [ ] **ENERGY-07**: Historical room measurements via proxy `/getroommeasure` (SQLite aggregation tiers)

### Valve

- [ ] **VALVE-01**: Valve status via dedicated proxy `/valves` endpoint (replaces parsing from homestatus)
- [ ] **VALVE-02**: Valve calibration via proxy `/valves/calibrate` (replaces synchomeschedule workaround)

### Camera

- [ ] **CAM-01**: Camera status via proxy `/camera/status`
- [ ] **CAM-02**: Camera stream URLs via proxy `/camera/{id}/stream` (HLS with VPN + local)
- [ ] **CAM-03**: Camera snapshot via proxy `/camera/{id}/snapshot`
- [ ] **CAM-04**: Camera events via proxy `/camera/events` (SQLite-backed, 7-day retention)
- [ ] **CAM-05**: Camera monitoring toggle via proxy `/camera/{id}/monitoring`
- [ ] **CAM-06**: Event snapshot binary via proxy `/camera/events/{id}/snapshot`

### Health & Monitoring

- [ ] **HEALTH-01**: Netatmo provider health via proxy `/health` (token status, data freshness, rate limit usage)
- [ ] **HEALTH-02**: Health monitoring cron uses proxy health endpoint instead of custom token checks

### Cleanup

- [ ] **CLEAN-01**: Delete `lib/netatmoTokenHelper.ts` (token management now in proxy)
- [ ] **CLEAN-02**: Delete `lib/netatmoCredentials.ts` (OAuth credentials not needed)
- [ ] **CLEAN-03**: Delete `lib/netatmoRateLimiter.ts` + `netatmoRateLimiterPersistent.ts` (rate limiting in proxy)
- [ ] **CLEAN-04**: Delete `lib/netatmoCacheService.ts` (caching in proxy)
- [ ] **CLEAN-05**: Delete OAuth callback route `app/api/netatmo/callback/` (OAuth flow removed)
- [ ] **CLEAN-06**: Remove Netatmo OAuth env vars (`NETATMO_CLIENT_SECRET`, `NEXT_PUBLIC_NETATMO_CLIENT_ID`, `NEXT_PUBLIC_NETATMO_REDIRECT_URI`)
- [ ] **CLEAN-07**: Update all tests to match new API proxy patterns

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
| API-01 | Pending | Pending |
| API-02 | Pending | Pending |
| API-03 | Pending | Pending |
| API-04 | Pending | Pending |
| ENERGY-01 | Pending | Pending |
| ENERGY-02 | Pending | Pending |
| ENERGY-03 | Pending | Pending |
| ENERGY-04 | Pending | Pending |
| ENERGY-05 | Pending | Pending |
| ENERGY-06 | Pending | Pending |
| ENERGY-07 | Pending | Pending |
| VALVE-01 | Pending | Pending |
| VALVE-02 | Pending | Pending |
| CAM-01 | Pending | Pending |
| CAM-02 | Pending | Pending |
| CAM-03 | Pending | Pending |
| CAM-04 | Pending | Pending |
| CAM-05 | Pending | Pending |
| CAM-06 | Pending | Pending |
| HEALTH-01 | Pending | Pending |
| HEALTH-02 | Pending | Pending |
| CLEAN-01 | Pending | Pending |
| CLEAN-02 | Pending | Pending |
| CLEAN-03 | Pending | Pending |
| CLEAN-04 | Pending | Pending |
| CLEAN-05 | Pending | Pending |
| CLEAN-06 | Pending | Pending |
| CLEAN-07 | Pending | Pending |

**Coverage:**
- v10.0 requirements: 28 total
- Mapped to phases: 0
- Unmapped: 28 ⚠️

---
*Requirements defined: 2026-03-14*
*Last updated: 2026-03-14 after initial definition*
