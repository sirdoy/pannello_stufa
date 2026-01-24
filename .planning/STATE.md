# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Dispositivi riconosciuti automaticamente dopo riavvio browser, notifiche arrivano sempre (100% delivery rate).
**Current focus:** Phase 2 - Production Monitoring Infrastructure

## Current Position

Phase: 2 of 5 (Production Monitoring Infrastructure)
Plan: 7 of 7 in current phase
Status: **PHASE COMPLETE & VERIFIED** ✅
Last activity: 2026-01-24 - Phase 2 verified complete (51/51 must-haves, 100%)

Progress: [█████████████████████████████████████] 100% Phase 2 (7 plans executed: 02-01, 02-02, 02-03, 02-04, 02-05, 02-06, 02-07)

## Performance Metrics

**Velocity:**
- Total plans completed: 13
- Average duration: 5.4 min
- Total execution time: 1.20 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 6 | 48.6 min | 8.1 min |
| 2 | 7 | 26.9 min | 3.8 min |

**Recent Trend:**
- Last plan: 02-07 (1.0 min - gap closure, device API fields)
- Previous: 02-06 (2.9 min), 02-05 (2.9 min), 02-04 (6.3 min)
- Trend: Phase 2 completed efficiently - avg 3.8 min/plan, 53% faster than Phase 1

**Phase 2 Complete:** All 7 plans executed (including gap closure), 51/51 must-haves verified (100%) ✅

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
- **Plan 02-04:** Template-based notifications with 3 predefined templates (error_alert, scheduler_success, maintenance_reminder)
- **Plan 02-04:** Delivery trace returns sentAt, targetDevices, and success/failure counts for instant feedback
- **Plan 02-04:** Support both broadcast (all devices) and targeted (specific device) testing modes
- **Plan 02-05:** ComposedChart chosen for combining bars (volume) and line (rate) in single view
- **Plan 02-05:** 7-day default period balances detail vs comprehension (max 30 days)
- **Plan 02-05:** Trend threshold: ±5% change = improving/declining, otherwise stable
- **Plan 02-05:** Zero-fill missing days to ensure continuous timeline visualization
- **Plan 02-05:** Dual Y-axes prevent scale mismatch between count and percentage
- **Plan 02-06:** 85% delivery rate threshold triggers admin alerts (from success criteria)
- **Plan 02-06:** 1-hour alert cooldown prevents notification fatigue
- **Plan 02-06:** Alert state stored in Firestore systemConfig/rateAlert
- **Plan 02-06:** Cron endpoint checks 1-hour rolling window for delivery rate
- **Plan 02-06:** Admin user identified via ADMIN_USER_ID env var for explicit control
- **Plan 02-07:** Status thresholds: active (<7 days), stale (>30 days), unknown (no data)
- **Plan 02-07:** Token prefix: first 20 characters for dashboard display without exposing full token
- **Plan 02-07:** id field matches tokenKey for React key prop uniqueness

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

Last session: 2026-01-24 (phase execution + gap closure + verification)
Stopped at: Phase 2 complete - 7 plans executed, 51/51 must-haves verified (100%)
Resume file: None

---
*Next step: Phase 3 - User Preferences & Control (planning pending)*
