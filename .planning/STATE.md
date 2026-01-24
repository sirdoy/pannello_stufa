# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Dispositivi riconosciuti automaticamente dopo riavvio browser, notifiche arrivano sempre (100% delivery rate).
**Current focus:** Phase 2 - Production Monitoring Infrastructure

## Current Position

Phase: 2 of 5 (Production Monitoring Infrastructure)
Plan: 3 of 6 in current phase
Status: In progress
Last activity: 2026-01-24 - Completed 02-03-PLAN.md (Admin Notifications Dashboard)

Progress: [████████████████████████████░░] 50.0% Phase 2 (3 plans executed: 02-01, 02-02, 02-03)

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: 6.7 min
- Total execution time: 1.02 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 6 | 48.6 min | 8.1 min |
| 2 | 3 | 13.8 min | 4.6 min |

**Recent Trend:**
- Last plan: 02-03 (3.4 min - admin dashboard)
- Previous: 02-02 (5.4 min), 02-01 (5.0 min), 01-06 (15.0 min)
- Trend: Phase 2 accelerating, dashboard tasks highly efficient

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
- **Plan 01-06:** Named import for ua-parser-js (no default export in v2)
- **Plan 01-06:** Load token on page mount via initializeNotifications()
- **Plan 01-06:** Register service worker in PWAInitializer on app load
- **Plan 01-06:** Setup foreground notification listener globally in PWAInitializer
- **Plan 01-06:** Real Firebase credentials in service worker (env vars unavailable in SW context)
- **Plan 02-01:** Use Firestore (not Realtime Database) for structured notification logs with querying
- **Plan 02-01:** Non-blocking logging: never block notification send on logging failure
- **Plan 02-01:** Truncate notification body to 200 chars to prevent doc size bloat
- **Plan 02-01:** Track FCM errors with tokenPrefix (first 20 chars) for debugging without exposing full token
- **Plan 02-02:** Fire-and-forget error tracking pattern prevents blocking notification sends
- **Plan 02-02:** Error logs stored in notificationErrors/{pushKey} in Firebase RTDB
- **Plan 02-02:** 30-day retention policy for error logs with automatic cleanup
- **Plan 02-02:** Device context enriched via lookupDeviceIdForToken() helper
- **Plan 02-03:** Manual refresh only (no auto-polling) per 02-CONTEXT.md decision
- **Plan 02-03:** Delivery rate color thresholds: 85%+ green, 70-84% yellow, <70% red
- **Plan 02-03:** Device status based on lastUsed: active (<7 days), stale (>30 days), unknown
- **Plan 02-03:** Admin view shows all users' devices for comprehensive monitoring

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 1 Status:**
- ✅ Token persistence bug FIXED - tokens survive browser restarts
- ✅ All 8 pitfalls from research addressed
- ✅ All Phase 1 success criteria verified
- ✅ Foundation solid - ready for Phase 2

**Technical Debt:**
- ~~cleanupOldTokens() currently disabled~~ ✅ RESOLVED in 01-05
- ✅ Cleanup implemented with Admin SDK in /api/notifications/cleanup
- ✅ Real-time invalid token detection working
- ✅ Service worker properly configured and registered
- ✅ Foreground notifications working
- Ready for cron-job.org integration in Phase 5

## Session Continuity

Last session: 2026-01-24 (phase execution)
Stopped at: Completed 02-03-PLAN.md (Admin Notifications Dashboard)
Resume file: None

---
*Next step: Continue Phase 2 execution with plan 02-04*
