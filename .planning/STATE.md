# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Dispositivi riconosciuti automaticamente dopo riavvio browser, notifiche arrivano sempre (100% delivery rate).
**Current focus:** Phase 1 - Token Lifecycle Foundation

## Current Position

Phase: 1 of 5 (Token Lifecycle Foundation)
Plan: 4 of TBD in current phase (01-01, 01-02, 01-04 complete)
Status: In progress
Last activity: 2026-01-23 - Completed 01-04-PLAN.md (Token Refresh Module)

Progress: [█████░░░░░] ~50% (3 plans executed: 01-01, 01-02, 01-04)

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 5.0 min
- Total execution time: 0.25 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 3 | 15.0 min | 5.0 min |

**Recent Trend:**
- Last plan: 01-04 (7.8 min)
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
- **Plan 01-04:** 30-day token refresh threshold per Firebase recommendations
- **Plan 01-04:** Explicit deleteToken before getToken for clean lifecycle
- **Plan 01-04:** Preserve deviceId across refresh to prevent duplicate device entries

### Pending Todos

None yet.

### Blockers/Concerns

**Foundation Priority:**
- Token persistence bug is critical - must fix completely in Phase 1 before adding features
- Research identifies 8 pitfalls, 3 are CRITICAL and addressed in Phase 1
- All phases depend on Phase 1 success - no shortcuts

**Technical Debt:**
- cleanupOldTokens() currently disabled (lines 480-483 in lib/notificationService.js)
- Must implement cleanup with Admin SDK write access
- Token accumulation confirmed in existing Firebase data

## Session Continuity

Last session: 2026-01-23 (plan execution)
Stopped at: Completed 01-04-PLAN.md execution - Token Refresh Module created
Resume file: None

---
*Next step: Continue Phase 1 planning and execution*
