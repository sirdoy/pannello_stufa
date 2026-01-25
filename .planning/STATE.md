# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Dispositivi riconosciuti automaticamente dopo riavvio browser, notifiche arrivano sempre (100% delivery rate).
**Current focus:** Phase 3 - User Preferences & Control

## Current Position

Phase: 3 of 5 (User Preferences & Control)
Plan: 3 of 7 in current phase
Status: In progress
Last activity: 2026-01-25 - Completed 03-03-PLAN.md (Firestore Real-Time Sync Hook)

Progress: [███████████████████████████████████████████░░░░░] 3/7 Phase 3 (plans executed: 03-01, 03-02, 03-03)

## Performance Metrics

**Velocity:**
- Total plans completed: 16
- Average duration: 5.6 min
- Total execution time: 1.49 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 6 | 48.6 min | 8.1 min |
| 2 | 7 | 26.9 min | 3.8 min |
| 3 | 3 | 14.0 min | 4.7 min |

**Recent Trend:**
- Last plan: 03-03 (8.0 min - Firestore real-time sync hook)
- Previous: 03-02 (3.5 min), 03-01 (2.5 min), 02-07 (1.0 min)
- Trend: Phase 3 progressing steadily - avg 4.7 min/plan

**Phase 2 Complete:** All 7 plans executed (including gap closure), 51/51 must-haves verified (100%) ✅
**Phase 3 Progress:** 3/7 plans complete (43%)

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

### Pending Todos

- User must run `npm install` to install new dependencies (react-hook-form, zod, @hookform/resolvers)

### Blockers/Concerns

**Phase 1 & 2 Status:**
- ✅ Token persistence bug FIXED - tokens survive browser restarts
- ✅ All 8 pitfalls from research addressed
- ✅ All Phase 1 & 2 success criteria verified
- ✅ Production monitoring infrastructure complete

**Phase 3 Active Concerns:**
- ⚠️ **Firestore Rules Required:** Must configure security rules for `users/{userId}/settings/notifications` before production
  - Example: `allow read, write: if request.auth.uid == userId;`
  - Without rules: all preference operations will fail with permission denied
- 🔜 **DND Filtering Logic:** Next step (03-04) - implement server-side filtering using preferences
- 🔜 **Rate Limiting Logic:** Following step (03-05) - implement in-memory rate limiter

**Technical Debt:**
- None from Phase 3 so far - clean implementation

## Session Continuity

Stopped at: Completed 03-03-PLAN.md - Firestore real-time sync hook
Resume file: None

---
*Next step: Phase 3 - Continue with 03-04 (DND Window Filtering) and 03-05 (Rate Limiting)*
