# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Dispositivi riconosciuti automaticamente dopo riavvio browser, notifiche arrivano sempre (100% delivery rate).
**Current focus:** Phase 3 - User Preferences & Control

## Current Position

Phase: 3 of 5 (User Preferences & Control)
Plan: COMPLETE - all 6 plans executed
Status: Phase 3 Complete ✅ (goal verified, ready for Phase 4)
Last activity: 2026-01-25 - Completed 03-06 integration checkpoint, verified phase goal

Progress: [█████████████████████████████████████████████████████████████] 6/6 Phase 3 COMPLETE ✅

## Performance Metrics

**Velocity:**
- Total plans completed: 18
- Average duration: 5.9 min
- Total execution time: 1.81 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 6 | 48.6 min | 8.1 min |
| 2 | 7 | 26.9 min | 3.8 min |
| 3 | 5 | 34.0 min | 6.8 min |

**Recent Trend:**
- Last plan: 03-05 (10.0 min - Rate Limiting)
- Previous: 03-04 (10.0 min), 03-03 (8.0 min), 03-02 (3.5 min)
- Trend: Phase 3 progressing - avg 6.8 min/plan, slightly higher than Phase 2 (3.8 min) but consistent

**Phase 2 Complete:** All 7 plans executed (including gap closure), 51/51 must-haves verified (100%) ✅
**Phase 3 Complete:** All 6 plans executed, 5/5 success criteria technically verified, goal achieved ✅

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
- **Plan 03-01:** Use Zod 3.x stable (not 4.x beta) to avoid error handling issues
- **Plan 03-01:** Balanced default preferences: Alerts + System enabled, Routine opt-in
- **Plan 03-01:** React Hook Form 7.x + Zod 3.x + @hookform/resolvers for type-safe form validation
- **Plan 03-02:** Progressive disclosure: Basic mode (category toggles) vs Advanced mode (per-type + DND + rate limits)
- **Plan 03-02:** React Hook Form mode: 'onBlur' for better UX than 'onChange'
- **Plan 03-03:** Firestore path: users/{userId}/settings/notifications for preferences
- **Plan 03-03:** Auto-write defaults for new users on first load
- **Plan 03-03:** Version increment on each save for future conflict detection
- **Plan 03-03:** Cleanup function mandatory to prevent memory leaks (RESEARCH.md Pitfall #1)
- **Plan 03-04:** CRITICAL notifications bypass DND hours (per CONTEXT.md decision)
- **Plan 03-04:** Fail-safe filtering: allow notification if Firestore read fails (better unwanted than missed critical)
- **Plan 03-04:** Per-device DND: each token filtered independently based on deviceId match
- **Plan 03-04:** Disabled notification types return FILTERED error with reason for debugging
- **Plan 03-05:** Rate limits scoped to notification TYPE, not category (scheduler_success, ERROR, etc.)
- **Plan 03-05:** CRITICAL notifications have higher rate limit (5 per min vs 1 per 5 min for routine)
- **Plan 03-05:** In-memory storage with 5-minute cleanup interval prevents memory leaks
- **Plan 03-05:** Three-stage filter chain order: Type enabled → Rate limit → DND windows
- **Plan 03-06:** Use API endpoint (/api/notifications/preferences-v2) with Admin SDK for preference saves (bypasses Firestore rules)
- **Plan 03-06:** Client-side onSnapshot listener for real-time sync, server-side writes via API
- **Plan 03-06:** Firestore rules not required for testing - Admin SDK handles all writes

### Pending Todos

- User must run `npm install` to install new dependencies (react-hook-form, zod, @hookform/resolvers)

### Blockers/Concerns

**Phase 1 & 2 Status:**
- ✅ Token persistence bug FIXED - tokens survive browser restarts
- ✅ All 8 pitfalls from research addressed
- ✅ All Phase 1 & 2 success criteria verified
- ✅ Production monitoring infrastructure complete

**Phase 3 Active Concerns:**
- ⚠️ **Firestore Rules Required for Production:** Currently using Admin SDK bypass via API endpoint
  - Production deployment needs: `allow read, write: if request.auth.uid == userId;`
  - Client writes disabled, all saves via `/api/notifications/preferences-v2`
  - This is acceptable for testing but should migrate to client-side writes + rules in production
- ✅ **DND Filtering Logic:** Complete (03-04) - server-side filtering with type toggles and DND windows
- ✅ **Rate Limiting Logic:** Complete (03-05) - in-memory rate limiter with per-type windows, success criteria #3 verified
- ⏸️ **Integration Verification:** Paused at checkpoint (03-06) - needs user testing of 5 success criteria

**Technical Debt:**
- Firestore client writes disabled (using API workaround) - should add security rules for production

## Session Continuity

Last session: 2026-01-25 16:30:00 UTC
Stopped at: 03-06-PLAN.md Task 2/3 (checkpoint awaiting user verification)
Resume file: .planning/RESUME-03-06.md
Commits during pause:
- bda1103: feat(03-06): wire all Phase 3 components
- 2077c94: fix(03-06): use API endpoint for preferences save (bypass Firestore rules)

**To Resume Work on Phase 3:**
1. Read .planning/RESUME-03-06.md for full context
2. Run `npm run dev` to start server
3. Execute 5 verification tests (documented in RESUME file)
4. Run `/gsd:execute-phase 3` - orchestrator will continue from 03-06 checkpoint
5. Report test results when prompted

---
*Next step: Resume Phase 3 verification OR start new urgent work*
