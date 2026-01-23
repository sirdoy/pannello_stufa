# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Dispositivi riconosciuti automaticamente dopo riavvio browser, notifiche arrivano sempre (100% delivery rate).
**Current focus:** Phase 1 - Token Lifecycle Foundation

## Current Position

Phase: 1 of 5 (Token Lifecycle Foundation)
Plan: 5 of 6 in current phase (01-01, 01-02, 01-03, 01-04, 01-05 complete)
Status: In progress
Last activity: 2026-01-23 - Completed 01-05-PLAN.md (Invalid Token Cleanup)

Progress: [████████░░] ~83% Phase 1 (5 plans executed: 01-01, 01-02, 01-03, 01-04, 01-05)

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 6.7 min
- Total execution time: 0.56 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 5 | 33.6 min | 6.7 min |

**Recent Trend:**
- Last plan: 01-05 (10.0 min)
- Previous: 01-03 (8.6 min), 01-04 (7.8 min), 01-02 (2.6 min)
- Trend: Consistent execution, on track

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Sviluppo a fasi (Reliability → Features): Fix problema critico prima, poi features - ship incrementale
- Breaking changes OK: Permette refactoring completo senza vincoli legacy
- Firebase FCM retained: Già integrato, multi-platform support, affidabile
- Auto-cleanup token 90+ giorni: Previene crescita unbounded, migliora delivery rate
- **Plan 01-01:** Use Dexie.js wrapper instead of raw IndexedDB API for browser compatibility
- **Plan 01-01:** Dual persistence strategy (IndexedDB primary, localStorage fallback) for maximum reliability
- **Plan 01-01:** Request navigator.storage.persist() on first save to prevent eviction
- **Plan 01-03:** Device deduplication via Firebase orderByChild('deviceId').equalTo() query
- **Plan 01-03:** Preserve createdAt when updating existing device token
- **Plan 01-03:** Return action: 'updated'|'created' for client awareness
- **Plan 01-03:** Local persistence occurs AFTER successful Firebase registration
- **Plan 01-04:** 30-day token refresh threshold per Firebase recommendations
- **Plan 01-04:** Explicit deleteToken before getToken for clean lifecycle
- **Plan 01-04:** Preserve deviceId across refresh to prevent duplicate device entries
- **Plan 01-05:** Remove invalid tokens asynchronously on FCM send errors
- **Plan 01-05:** Use 90-day threshold for stale token cleanup
- **Plan 01-05:** Batch database updates for cleanup efficiency

### Pending Todos

None yet.

### Blockers/Concerns

**Foundation Priority:**
- Token persistence bug is critical - must fix completely in Phase 1 before adding features
- Research identifies 8 pitfalls, 3 are CRITICAL and addressed in Phase 1
- All phases depend on Phase 1 success - no shortcuts

**Technical Debt:**
- ~~cleanupOldTokens() currently disabled~~ ✅ RESOLVED in 01-05
- ✅ Cleanup implemented with Admin SDK in /api/notifications/cleanup
- ✅ Real-time invalid token detection working
- Ready for cron-job.org integration

## Session Continuity

Last session: 2026-01-23 (plan execution)
Stopped at: Completed 01-05-PLAN.md execution - Invalid Token Cleanup with real-time detection and scheduled cleanup
Resume file: None

---
*Next step: Continue Phase 1 planning and execution*
