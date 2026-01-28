# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** v3.0 Milestone Started - Design System Evolution

## Current Position

Phase: Research phase
Plan: N/A
Status: Researching design system ecosystem
Last activity: 2026-01-28 — v3.0 milestone started (Design System Evolution)

Progress: [████████████████████] v1.0: 29/29 plans, v2.0: 21/21 plans (100% complete), v3.0: 0/? plans

## Performance Metrics

**Velocity (v1.0 milestone):**
- Total plans completed: 29
- Average duration: ~5.1 min per plan
- Total execution time: ~2.33 hours

**By Phase (v1.0):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Token Management | 6 | 48.6 min | 8.1 min |
| 2. Monitoring & Dashboard | 7 | 26.9 min | 3.8 min |
| 3. User Preferences | 6 | 34.0 min | 5.7 min |
| 4. History & Device Mgmt | 5 | 17.5 min | 3.5 min |
| 5. Automation & Testing | 5 | 14.3 min | 4.8 min |

**v2.0 Progress (Phases 6-10):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 6. Netatmo Schedule API | 3/3 | 16.0 min | 5.3 min |
| 7. Health Monitoring Backend | 2/2 | 9.0 min | 4.5 min |
| 8. Stove-Thermostat Integration | 6/6 | 30.6 min | 5.1 min |
| 9. Schedule Management UI | 5/5 | 30.6 min | 6.1 min |
| 10. Monitoring Dashboard & Alerts UI | 5/5 | 31.4 min | 6.3 min |

**Recent Trend:**
- v1.0 completed successfully with consistent velocity
- v2.0 Phase 6 COMPLETE: 3 plans in 16 minutes (5.3 min/plan average)
- v2.0 Phase 7 COMPLETE: 2 plans in 9 minutes (4.5 min/plan average)
- v2.0 Phase 8 COMPLETE: 6 plans in 30.6 minutes (5.1 min/plan average)
  - 08-01: 5.4 min (foundation infrastructure)
  - 08-02: 4.6 min (notification throttle)
  - 08-03: 4.7 min (user intent and pause calculator)
  - 08-04: 3.8 min (boost mode and setpoint restoration)
  - 08-04b: 6.4 min (coordination orchestrator)
  - 08-05: 5.7 min (cron endpoint and event logging)
- v2.0 Phase 9 COMPLETE: 5 plans in 30.6 minutes (6.1 min/plan average)
  - 09-01: 5.8 min (schedule data hooks & helpers)
  - 09-02: 7.1 min (weekly timeline visualization)
  - 09-03: 4.3 min (schedule switcher UI)
  - 09-04: 5.4 min (manual override UI)
  - 09-05: 8.0 min (active override badge & navigation)
- v2.0 Phase 10 COMPLETE: 5 plans in 31.4 minutes (6.3 min/plan average)
  - 10-01: 1.8 min (health monitoring API routes)
  - 10-02: 2.95 min (status card components)
  - 10-03: 11.0 min (monitoring timeline components)
  - 10-04: 11.0 min (monitoring dashboard page & navigation)
  - 10-05: 4.4 min (health alert notification wiring - gap closure)
  - 10-05: 4.4 min (health alert notification wiring)

## Accumulated Context

### Decisions

All milestone decisions logged in PROJECT.md Key Decisions table.

Key architectural patterns from v1.0 + v2.0:
- Dual persistence strategy (IndexedDB + localStorage) for token survival
- Firebase RTDB for real-time state, Firestore for historical queries
- HMAC-secured cron webhooks for security without key rotation
- Fire-and-forget logging pattern (don't block critical operations)
- Promise.allSettled for parallel operations with graceful degradation
- Global 30-minute notification throttle across system events
- Conservative API rate limits with safety buffers
- Temporary setpoint overrides (mode='manual') preserve underlying schedules
- Schedule-aware pause calculations respect user workflow

### Pending Todos

**Operational Setup (v1.0 + v2.0 shipped, pending deployment):**
- Scheduler cron configuration (cron-job.org account, 15-30 min)
- Health monitoring cron (1-min frequency): `/api/health-monitoring/check`
- Coordination cron (1-min frequency): `/api/coordination/enforce`
- Firestore indexes: `firebase deploy --only firestore:indexes`

### Blockers/Concerns

**v1.0 + v2.0 Status:**
- ✅ All 50 plans complete (v1.0: 29, v2.0: 21)
- ✅ All 53 requirements satisfied (v1.0: 31, v2.0: 22) (100%)
- ⚠️ Operational setup pending (cron configuration, Firestore indexes)

**Known Tech Debt:**
- TODO: Track STARTING state entry time for grace period (Phase 7, low priority)
- Warning: DMS polling continues when page backgrounded (Phase 10, should use Page Visibility API)
- Coordination orchestrator bypasses Netatmo rate limiter (low risk - documented)

**v3.0 Milestone (In Progress):**
- Status: Research phase
- Focus: Design System Evolution & UI Consistency
- Target: Complete component library + consistent application across all pages

## Session Continuity

Last session: 2026-01-28
Stopped at: v3.0 milestone research phase started
Resume file: None

**Next action:** Complete research → define requirements → create roadmap
