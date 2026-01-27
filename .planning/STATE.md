# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-26)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 8 - Stove-Thermostat Integration Correction (IN PROGRESS)

## Current Position

Phase: 8 of 10 (Stove-Thermostat Integration Correction)
Plan: 1 of 4 complete
Status: In progress
Last activity: 2026-01-27 — Completed 08-01-PLAN.md (foundation infrastructure)

Progress: [████████░░░░░░░░░░░░] 37/TBD plans complete (v1.0: 29 plans, v2.0: 8 plans)

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

**v2.0 Progress (Phases 6-8):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 6. Netatmo Schedule API | 3/3 | 16.0 min | 5.3 min |
| 7. Health Monitoring Backend | 2/2 | 9.0 min | 4.5 min |
| 8. Stove-Thermostat Integration | 1/4 | 5.4 min | 5.4 min |

**Recent Trend:**
- v1.0 completed successfully with consistent velocity
- v2.0 Phase 6 COMPLETE: 3 plans in 16 minutes (5.3 min/plan average)
- v2.0 Phase 7 COMPLETE: 2 plans in 9 minutes (4.5 min/plan average)
- v2.0 Phase 8 IN PROGRESS: 1 plan in 5.4 minutes (foundation infrastructure)

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v1.0: Dual persistence (IndexedDB + localStorage) prevents token loss across browser restarts
- v1.0: Firebase Realtime Database for tokens, Firestore for notification history
- v1.0: In-memory rate limiting sufficient for single-instance deployment (consider Redis for v2 multi-instance)
- v1.0: HMAC-secured cron webhook for security without API key rotation
- v2.0: Backend-first approach recommended (establish APIs before UI)
- v2.0: Temporary setpoint overrides (not schedule modifications) for stove-thermostat coordination
- v2.0: Zero new npm dependencies - existing v1.0 stack handles all requirements
- v2.0 (06-01): 5-minute TTL balances schedule freshness with API rate limit prevention (500 calls/hour)
- v2.0 (06-01): Timestamp-based cache validation follows netatmoTokenHelper.js pattern
- v2.0 (06-02): Conservative 400 calls/hour limit (100 buffer) prevents Netatmo 429 errors
- v2.0 (06-02): In-memory Map storage with 2-hour retention matches existing rateLimiter.js pattern
- v2.0 (06-03): Control operations (POST) never cached - only read operations use cache
- v2.0 (06-03): Cache invalidation after schedule switch ensures frontend consistency
- v2.0 (06-03): Integration tests focus on service integration to avoid auth0 mocking complexity
- v2.0 (07-01): Promise.allSettled for parallel API fetching with graceful degradation (health checks tolerate partial failures)
- v2.0 (07-01): STARTING states have 15-min grace period (avoid false alerts during stove startup)
- v2.0 (07-01): Firestore parent/subcollection structure (aggregated queries + detailed drill-down)
- v2.0 (07-01): Fire-and-forget logging pattern (Firestore errors don't block health checks)
- v2.0 (07-02): 10-minute threshold for dead man's switch (10 missed cron runs = admin alert)
- v2.0 (07-02): updateDeadManSwitch() runs FIRST before any processing (proves cron ran even if health check fails)
- v2.0 (07-02): Environment validation logs warnings but continues (partial functionality better than complete failure)
- v2.0 (07-02): Firestore logging uses fire-and-forget (health check execution more important than logging)
- v2.0 (08-01): State stored at coordination/state in RTDB (single shared state for coordination logic)
- v2.0 (08-01): Preferences stored at coordination/preferences/{userId} (per-user configuration)
- v2.0 (08-01): Boost range constrained to 0.5-5°C with default 2°C (sensible heating adjustments)
- v2.0 (08-01): Version tracking on preferences enables conflict detection across devices

### Pending Todos

**Operational Setup (v1.0 shipped, pending deployment):**
- Scheduler cron configuration required (cron-job.org account setup, 15-30 min)
- Health monitoring cron configuration required (separate endpoint, 1-min frequency)
- Firestore indexes need manual deployment: `firebase deploy --only firestore:indexes`

### Blockers/Concerns

**v1.0 Status:**
- ✅ All 5 phases complete (29 plans executed)
- ✅ All 31 v1.0 requirements satisfied (100%)
- ⚠️ Operational setup pending (cron configuration, Firestore indexes)

**v2.0 Research Flags:**
- Phase 8 (Stove-Thermostat Integration): MEDIUM complexity - Multi-room atomicity and rollback patterns need validation during planning
- Phases 6, 7, 9, 10: Standard patterns, existing infrastructure extends naturally

**Coverage (v2.0):**
- Total v2.0 requirements: 22
- Mapped to phases: 22 (100%)
- No orphaned requirements

## Session Continuity

Last session: 2026-01-27T13:26:00Z
Stopped at: Completed 08-01-PLAN.md (foundation infrastructure)
Resume file: None

**Next action:** Execute 08-02-PLAN.md (coordination logic service)
