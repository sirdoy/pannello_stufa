# Requirements: Pannello Stufa v11.0

**Defined:** 2026-03-17
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v11.0 Requirements

Requirements for API Unification & Raspberry Pi Monitor milestone.

### API Client (Shared Infrastructure)

- [x] **API-01**: Shared HA proxy client module with single base URL + X-API-Key auth
- [x] **API-02**: Generic GET/POST helpers with AbortController timeout and RFC 9457 error mapping
- [x] **API-03**: Single env var pair (HA_API_URL + HA_API_KEY) replacing all provider-specific vars
- [x] **API-04**: Fritz!Box client migrated to shared HA client (JWT login flow removed)
- [x] **API-05**: Fritz!Box API routes updated to use new client (no behavior change)
- [x] **API-06**: Fritz!Box caching and rate limiting preserved on top of shared transport
- [x] **API-07**: Netatmo client migrated to shared HA client (separate env vars removed)
- [x] **API-08**: Netatmo convenience wrappers preserved on top of shared transport
- [ ] **API-09**: Netatmo API routes updated to use new client (no behavior change)
- [ ] **API-10**: Old client modules deleted after migration verified

### Raspberry Pi (New Device)

- [ ] **RASPI-01**: Proxy client functions for all 4 Raspberry Pi endpoints (health, cpu, memory, disk, system)
- [ ] **RASPI-02**: TypeScript types matching API response schemas
- [ ] **RASPI-03**: Next.js API routes proxying Raspberry Pi endpoints
- [ ] **RASPI-04**: Raspberry Pi registered in device registry with adaptive polling
- [ ] **RASPI-05**: RaspiCard dashboard component (CPU%, RAM%, disk%, temperature, health badge)
- [ ] **RASPI-06**: Dedicated /raspi page with full system stats (uptime, load avgs, network I/O, process count)
- [ ] **RASPI-07**: Error boundary and loading skeleton for RaspiCard
- [ ] **RASPI-08**: Raspberry Pi health included in 5-min cron monitoring check

## Future Requirements

### DIRIGERA Integration (Deferred)

- **DIRIGERA-01**: IKEA contact sensor dashboard card
- **DIRIGERA-02**: IKEA motion sensor dashboard card
- **DIRIGERA-03**: Dedicated /sensors page with history and telemetry

### Thermorossi Proxy Migration (Deferred)

- **STOVE-01**: Migrate stove from WiNet cloud to local proxy API
- **STOVE-02**: Remove WiNet direct dependency

## Out of Scope

| Feature | Reason |
|---------|--------|
| DIRIGERA sensors integration | Deferred — user explicitly excluded from v11.0 |
| Thermorossi proxy migration | Deferred — user explicitly excluded from v11.0 |
| Raspberry Pi historical data / charts | No persistence on proxy (live data only, no database) |
| Raspberry Pi process list | API only exposes count, not individual processes |
| JWT login fallback | API Key auth replaces JWT entirely, no backward compatibility |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | Phase 84 | Complete |
| API-02 | Phase 84 | Complete |
| API-03 | Phase 84 | Complete |
| API-04 | Phase 85 | Complete |
| API-05 | Phase 85 | Complete |
| API-06 | Phase 85 | Complete |
| API-07 | Phase 86 | Complete |
| API-08 | Phase 86 | Complete |
| API-09 | Phase 86 | Pending |
| API-10 | Phase 87 | Pending |
| RASPI-01 | Phase 88 | Pending |
| RASPI-02 | Phase 88 | Pending |
| RASPI-03 | Phase 88 | Pending |
| RASPI-04 | Phase 89 | Pending |
| RASPI-05 | Phase 89 | Pending |
| RASPI-07 | Phase 89 | Pending |
| RASPI-06 | Phase 90 | Pending |
| RASPI-08 | Phase 90 | Pending |

**Coverage:**
- v11.0 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-03-17 — traceability updated after roadmap creation (phases 84-90)*
