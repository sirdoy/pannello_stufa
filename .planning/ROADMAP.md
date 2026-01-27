# Roadmap: Pannello Stufa

## Milestones

- ✅ **v1.0 Push Notifications System** - Phases 1-5 (shipped 2026-01-26)
- 🚧 **v2.0 Netatmo Complete Control & Stove Monitoring** - Phases 6-10 (in progress)

## Phases

<details>
<summary>✅ v1.0 Push Notifications System (Phases 1-5) - SHIPPED 2026-01-26</summary>

### Phase 1: Token Management & Persistence
**Goal**: Token FCM persiste automaticamente dopo chiusura browser
**Plans**: 6 plans

Plans:
- [x] 01-01: Dual persistence (IndexedDB + localStorage)
- [x] 01-02: Token validation on startup
- [x] 01-03: Auto-cleanup invalid tokens
- [x] 01-04: Token rotation (90-day expiry)
- [x] 01-05: Multi-device support
- [x] 01-06: Device fingerprinting

### Phase 2: Delivery Monitoring & Admin Dashboard
**Goal**: Complete visibility into notification delivery status
**Plans**: 6 plans

Plans:
- [x] 02-01: Delivery status tracking (Sent/Delivered/Displayed)
- [x] 02-02: Error logging with device info
- [x] 02-03: Admin dashboard with metrics
- [x] 02-04: Device list with status
- [x] 02-05: Test send capability
- [x] 02-06: Recharts visualization

### Phase 3: User Preferences & Control
**Goal**: Users can control notification behavior granularly
**Plans**: 5 plans

Plans:
- [x] 03-01: Granular type toggles
- [x] 03-02: Do Not Disturb hours
- [x] 03-03: Rate limiting per type
- [x] 03-04: Cross-device sync
- [x] 03-05: Conservative defaults

### Phase 4: History & Device Management UI
**Goal**: Users can view notification history and manage devices
**Plans**: 7 plans

Plans:
- [x] 04-01: Firestore history storage
- [x] 04-02: In-app inbox UI
- [x] 04-03: Infinite scroll pagination
- [x] 04-04: Filters (type, status)
- [x] 04-05: Auto-cleanup (90 days)
- [x] 04-06: Device naming
- [x] 04-07: Device removal

### Phase 5: Automation & Testing
**Goal**: Production-ready automation and comprehensive test coverage
**Plans**: 5 plans

Plans:
- [x] 05-01: E2E test suite (Playwright)
- [x] 05-02: Multi-browser testing
- [x] 05-03: Cron webhook security
- [x] 05-04: Token cleanup cron
- [x] 05-05: CI/CD integration

</details>

### 🚧 v2.0 Netatmo Complete Control & Stove Monitoring (In Progress)

**Milestone Goal:** Controllo completo del termostato Netatmo con gestione schedule settimanali e monitoring automatico della stufa per rilevare anomalie.

#### Phase 6: Netatmo Schedule API Infrastructure
**Goal**: Backend infrastructure for Netatmo schedule operations with caching and rate limiting
**Depends on**: Nothing (starts v2.0)
**Requirements**: SCHED-01, SCHED-02, SCHED-04, SCHED-05, SCHED-06, INFRA-01, INFRA-02
**Success Criteria** (what must be TRUE):
  1. System can fetch current active weekly schedule from Netatmo API
  2. System can list all available pre-configured schedules for user's home
  3. System enforces 60-second minimum polling interval and tracks 500 calls/hour limit
  4. Schedule data caches in Firebase with 5-minute TTL to avoid rate limiting
  5. OAuth token refresh works atomically without invalidating active sessions
**Plans**: 3 plans

Plans:
- [x] 06-01: Firebase-based cache service with 5-minute TTL
- [x] 06-02: Per-user Netatmo API rate limiter (400/500 calls/hour)
- [x] 06-03: Schedule API routes (GET list, POST switch)

#### Phase 7: Stove Health Monitoring Backend
**Goal**: Automated stove health checks and monitoring infrastructure via cron
**Depends on**: Phase 6
**Requirements**: MONITOR-01, MONITOR-02, MONITOR-03, MONITOR-04, MONITOR-05, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. System verifies stove connection status every minute via cron job
  2. System detects when stove is in unexpected state (scheduled ON but actually OFF)
  3. System logs all monitoring events to Firestore with timestamp and status
  4. Dead man's switch alerts if cron hasn't executed in 10+ minutes
  5. Cron execution logs include timestamp, duration, and success/failure status
**Plans**: 2 plans

Plans:
- [x] 07-01: Health check core logic and Firestore logging service
- [x] 07-02: Cron endpoint, dead man's switch, environment validation

#### Phase 8: Stove-Thermostat Integration Correction
**Goal**: Verify and enhance stove-thermostat coordination using temporary setpoint overrides (not schedule modifications)
**Depends on**: Phase 7
**Requirements**: INTEG-01, INTEG-02, INTEG-03, INTEG-04, INTEG-05, INFRA-06
**Success Criteria** (what must be TRUE):
  1. Stove ignition triggers temporary Netatmo setpoint boost without modifying underlying schedule
  2. User manual thermostat changes pause automation for 30 minutes (respect user intent)
  3. System applies 2-minute debouncing before triggering setpoint override (avoid rapid cycles)
  4. Multi-room thermostat zones coordinate properly when stove is active
  5. Alert deduplication prevents notification spam (max 1 per alert type per 30 minutes)
**Plans**: 5 plans

Plans:
- [ ] 08-01: Coordination state service and user preferences with Zod schema
- [ ] 08-02: Debounce timer and global notification throttle services
- [ ] 08-03: User intent detection and schedule-aware pause calculation
- [ ] 08-04: Coordination orchestrator and enhanced netatmoStoveSync
- [ ] 08-05: Cron endpoint and Firestore event logging

#### Phase 9: Schedule Management UI
**Goal**: User interface for viewing, switching schedules, and creating temporary overrides
**Depends on**: Phase 6
**Requirements**: SCHED-01, SCHED-02, SCHED-03
**Success Criteria** (what must be TRUE):
  1. User can view current active weekly schedule with day/time/temperature slots in dashboard
  2. User can switch between pre-configured schedules via dropdown selector
  3. User can create temporary override (manual boost) with duration picker (5 min to 12 hours)
  4. Schedule UI clearly distinguishes between permanent schedules and temporary overrides
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

#### Phase 10: Monitoring Dashboard & Alerts UI
**Goal**: Dashboard for stove health status with visual indicators and push notification alerts
**Depends on**: Phase 7
**Requirements**: MONITOR-01, MONITOR-04, MONITOR-05
**Success Criteria** (what must be TRUE):
  1. User can view stove connection status (online/offline/last-seen) in dashboard
  2. Dashboard displays monitoring status with last check time and status indicator
  3. System triggers push notifications for critical health issues (connection lost, unexpected state)
  4. Monitoring history shows past 7 days of cron execution logs and issues
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 6 → 7 → 8 → 9 → 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Token Management & Persistence | v1.0 | 6/6 | Complete | 2026-01-23 |
| 2. Delivery Monitoring & Admin Dashboard | v1.0 | 6/6 | Complete | 2026-01-24 |
| 3. User Preferences & Control | v1.0 | 5/5 | Complete | 2026-01-25 |
| 4. History & Device Management UI | v1.0 | 7/7 | Complete | 2026-01-25 |
| 5. Automation & Testing | v1.0 | 5/5 | Complete | 2026-01-26 |
| 6. Netatmo Schedule API Infrastructure | v2.0 | 3/3 | Complete | 2026-01-27 |
| 7. Stove Health Monitoring Backend | v2.0 | 2/2 | Complete | 2026-01-27 |
| 8. Stove-Thermostat Integration Correction | v2.0 | 0/5 | Not started | - |
| 9. Schedule Management UI | v2.0 | 0/TBD | Not started | - |
| 10. Monitoring Dashboard & Alerts UI | v2.0 | 0/TBD | Not started | - |
