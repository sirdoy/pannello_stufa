# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-26)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 8 - Stove-Thermostat Integration Correction (COMPLETE)

## Current Position

Phase: 8 of 10 (Stove-Thermostat Integration Correction) — COMPLETE
Plan: 6 of 6 complete
Status: Complete
Last activity: 2026-01-27 — Phase 8 verified and complete

Progress: [████████░░░░░░░░░░░░] 42/TBD plans complete (v1.0: 29 plans, v2.0: 13 plans)

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
| 8. Stove-Thermostat Integration | 6/6 | 30.6 min | 5.1 min |

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
- v2.0 (08-02): 2-minute debounce for stove ON events (prevents premature coordination)
- v2.0 (08-02): 30-second retry timer for early shutoff (handles quick stove restarts)
- v2.0 (08-02): Global 30-minute notification throttle across ALL coordination events (not per-type like rateLimiter.js)
- v2.0 (08-02): In-memory timer storage (timers don't persist across restarts, but pendingDebounce flag does)
- v2.0 (08-03): 0.5°C setpoint tolerance prevents false positives from Netatmo API rounding
- v2.0 (08-03): Pause until next schedule slot (not fixed duration) respects user workflow
- v2.0 (08-03): Non-standard modes (away, hg, off) always indicate user intent
- v2.0 (08-03): UTC timestamps for schedule calculations match Netatmo API convention
- v2.0 (08-04): setRoomsToBoostMode applies configurable boost (+N°C) instead of fixed low temperature
- v2.0 (08-04): 30°C maximum cap prevents excessive heating (safety limit)
- v2.0 (08-04): restoreRoomSetpoints restores previous setpoint (not schedule) preserving user manual adjustments
- v2.0 (08-04): Promise.allSettled for multi-room operations (per-room failures don't block others)
- v2.0 (08-04b): processCoordinationCycle orchestrates complete workflow (state → intent → debounce → action → notification)
- v2.0 (08-04b): Zone-specific boost amounts override default boost preference
- v2.0 (08-04b): Explicit object property syntax for ESM compatibility (pausedUntil: pausedUntil vs shorthand)
- v2.0 (08-04b): Italian-localized coordination notifications match existing language
- v2.0 (08-04b): Graceful schedule fetch degradation (1-hour default pause if Netatmo API fails)
- v2.0 (08-05): Fire-and-forget Firestore logging pattern (coordination failures don't block logging)
- v2.0 (08-05): Single coordinationEvents collection (flat structure sufficient for coordination event volume)
- v2.0 (08-05): Cron endpoint logs summary events only (orchestrator logs all decision points)

### Pending Todos

**Operational Setup (v1.0 shipped, pending deployment):**
- Scheduler cron configuration required (cron-job.org account setup, 15-30 min)
- Health monitoring cron configuration required (separate endpoint, 1-min frequency)
- Coordination cron configuration required (/api/coordination/enforce, 1-min frequency)
- Firestore indexes need manual deployment: `firebase deploy --only firestore:indexes`

### Blockers/Concerns

**v1.0 Status:**
- ✅ All 5 phases complete (29 plans executed)
- ✅ All 31 v1.0 requirements satisfied (100%)
- ⚠️ Operational setup pending (cron configuration, Firestore indexes)

**v2.0 Status:**
- ✅ Phase 6 (Netatmo Schedule API): COMPLETE - 3 plans
- ✅ Phase 7 (Health Monitoring Backend): COMPLETE - 2 plans
- ✅ Phase 8 (Stove-Thermostat Integration): COMPLETE - 6 plans
- 🔜 Phase 9 (Device Management UI): NEXT
- 🔜 Phase 10 (Deployment & Documentation): FINAL

**v2.0 Research Flags:**
- Phases 9, 10: Standard patterns, existing infrastructure extends naturally

**Coverage (v2.0):**
- Total v2.0 requirements: 22
- Mapped to phases: 22 (100%)
- No orphaned requirements

## Session Continuity

Last session: 2026-01-27
Stopped at: Phase 8 complete and verified
Resume file: None

**Next action:** Proceed to Phase 9 planning (Schedule Management UI)
