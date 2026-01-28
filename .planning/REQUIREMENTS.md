# Requirements: Pannello Stufa v2.0

**Defined:** 2026-01-26
**Core Value:** Dispositivi riconosciuti automaticamente dopo riavvio browser, notifiche arrivano sempre (100% delivery rate)

## v2.0 Requirements

Requirements for milestone v2.0: Netatmo Complete Control & Stove Monitoring

### Netatmo Schedule Management

- [x] **SCHED-01**: User can view current active weekly schedule with day/time/temperature slots
- [x] **SCHED-02**: User can switch between pre-configured Netatmo schedules via dropdown selector
- [x] **SCHED-03**: User can create temporary override (manual boost) with duration picker (5 min - 12 hours)
- [x] **SCHED-04**: System caches schedule data with 5-minute TTL to avoid API rate limiting
- [x] **SCHED-05**: System enforces 60-second minimum polling interval for schedule updates
- [x] **SCHED-06**: System tracks Netatmo API calls and enforces 500 calls/hour per user limit

### Stove-Thermostat Integration

- [x] **INTEG-01**: System verifies existing setpoint override behavior works correctly (stufa ignition → Netatmo temporary boost)
- [x] **INTEG-02**: Temporary setpoint override preserves underlying schedule (no schedule modification)
- [x] **INTEG-03**: System coordinates multi-room thermostat zones when stove is active
- [x] **INTEG-04**: System detects user manual thermostat changes and pauses automation (respect user intent)
- [x] **INTEG-05**: System applies 2-minute debouncing before triggering setpoint override (avoid rapid cycles)

### Stove Health Monitoring

- [x] **MONITOR-01**: User can view stove connection status (online/offline/last-seen) in dashboard
- [x] **MONITOR-02**: System verifies stove is in expected state every cron cycle (scheduled ON → actually running)
- [x] **MONITOR-03**: System checks stove-thermostat coordination is working (detects drift between expected and actual)
- [x] **MONITOR-04**: System logs monitoring events to Firestore with timestamp and status
- [x] **MONITOR-05**: System displays monitoring status in dashboard (last check time, status indicator)

### Supporting Infrastructure

- [x] **INFRA-01**: System tracks Netatmo API call count per user with Redis or in-memory store
- [x] **INFRA-02**: System refreshes OAuth tokens atomically (access + refresh token rotation)
- [x] **INFRA-03**: System logs every cron execution with timestamp, duration, and status
- [x] **INFRA-04**: System implements dead man's switch (alerts if cron hasn't run in 10+ minutes)
- [x] **INFRA-05**: System validates environment variables on startup (dev vs prod Netatmo credentials)
- [x] **INFRA-06**: System enforces alert deduplication (max 1 notification per alert type per 30 minutes)

## Future Requirements (v2.1+)

Deferred to future release. Tracked but not in current roadmap.

### Advanced Schedule Management

- **SCHED-07**: User can create new custom weekly schedules from scratch
- **SCHED-08**: User can edit existing schedule slots (change times and temperatures)
- **SCHED-09**: User can delete custom schedules
- **SCHED-10**: System validates schedule conflicts (no overlapping time slots)

### Enhanced Monitoring

- **MONITOR-06**: System detects and categorizes Thermorossi error codes (pellet, cleaning, temperature)
- **MONITOR-07**: System provides error code translations in Italian with troubleshooting tips
- **MONITOR-08**: System tracks stove performance metrics over time (efficiency trends, pellet consumption)

### Integration Enhancements

- **INTEG-06**: User can configure custom setpoint boost amount (+1°C to +5°C)
- **INTEG-07**: User can configure custom boost duration (5 min to 12 hours)
- **INTEG-08**: System learns optimal boost parameters based on room insulation and weather

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full schedule CRUD in v2.0 | HIGH complexity (4-5 plans), official Netatmo app already excellent for this |
| Real-time schedule sync | Netatmo API doesn't provide webhooks, polling with 60s interval sufficient |
| Thermorossi error code parsing | HIGH complexity, error categories sufficient for v2.0 |
| Multi-home support | User has single home, defer until needed |
| Predictive maintenance | Requires 90+ days data, defer to v2.1+ |
| Energy correlation analysis | Requires data warehousing, out of scope for PWA |
| Custom alert thresholds | Fixed thresholds sufficient for v2.0, make configurable in v2.1+ |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHED-01 | Phase 6, 9 | Complete |
| SCHED-02 | Phase 6, 9 | Complete |
| SCHED-03 | Phase 9 | Complete |
| SCHED-04 | Phase 6 | Complete |
| SCHED-05 | Phase 6 | Complete |
| SCHED-06 | Phase 6 | Complete |
| INTEG-01 | Phase 8 | Complete |
| INTEG-02 | Phase 8 | Complete |
| INTEG-03 | Phase 8 | Complete |
| INTEG-04 | Phase 8 | Complete |
| INTEG-05 | Phase 8 | Complete |
| MONITOR-01 | Phase 7, 10 | Complete |
| MONITOR-02 | Phase 7 | Complete |
| MONITOR-03 | Phase 7 | Complete |
| MONITOR-04 | Phase 7, 10 | Complete |
| MONITOR-05 | Phase 7, 10 | Complete |
| INFRA-01 | Phase 6 | Complete |
| INFRA-02 | Phase 6 | Complete |
| INFRA-03 | Phase 7 | Complete |
| INFRA-04 | Phase 7 | Complete |
| INFRA-05 | Phase 7 | Complete |
| INFRA-06 | Phase 8 | Complete |

**Coverage:**
- v2.0 requirements: 22 total
- Mapped to phases: 22 (100%)
- Unmapped: 0 ✅

---
*Requirements defined: 2026-01-26*
*Last updated: 2026-01-28 after Phase 10 completion (v2.0 milestone complete)*
