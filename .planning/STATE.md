# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Dispositivi riconosciuti automaticamente dopo riavvio browser, notifiche arrivano sempre (100% delivery rate).
**Current focus:** Phase 4 - Notification History & Devices

## Current Position

Phase: 4 of 5 (Notification History & Devices)
Plan: 5 of 5 (Integration and Verification Checkpoint)
Status: Complete
Last activity: 2026-01-26 - Completed 04-05-PLAN.md (Phase 4 Verification)

Progress: [███████████████████████████████████████████████████████████████░] 24/24 (100%)

## Performance Metrics

**Velocity:**
- Total plans completed: 24
- Average duration: 5.3 min
- Total execution time: 2.12 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 6 | 48.6 min | 8.1 min |
| 2 | 7 | 26.9 min | 3.8 min |
| 3 | 6 | 34.0 min | 5.7 min |
| 4 | 5 | 17.5 min | 3.5 min |

**Recent Trend:**
- Last plan: 04-05 (2.5 min - Phase 4 Verification)
- Previous: 04-04 (3.0 min), 04-03 (5.5 min), 04-02 (3.0 min)
- Trend: Phase 4 complete with excellent velocity - 3.5 min avg (fastest phase)

**Phase 2 Complete:** All 7 plans executed (including gap closure), 51/51 must-haves verified (100%) ✅
**Phase 3 Complete:** All 6 plans executed, 5/5 success criteria technically verified, goal achieved ✅
**Phase 4 Complete:** All 5 plans executed, 5/5 success criteria verified, notification history and device management operational ✅

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
- **Plan 04-01:** Use Firestore cursor-based pagination (not offset) for O(1) performance per page
- **Plan 04-01:** Apply 90-day GDPR filter on ALL queries as safeguard against TTL deletion lag
- **Plan 04-01:** Base64 encode cursor with docId + timestamp for serializable client state
- **Plan 04-01:** Fetch limit+1 documents to determine hasMore without separate count query
- **Plan 04-02:** Max 50 chars for displayName to prevent UI overflow
- **Plan 04-02:** Trim displayName to prevent whitespace-only names
- **Plan 04-02:** Return 404 for both 'not found' and 'unauthorized' to prevent user enumeration
- **Plan 04-02:** Use await context.params for Next.js 15 dynamic route compatibility
- **Plan 04-03:** Install react-infinite-scroll-component for infinite scroll (industry standard, 5.5k+ stars)
- **Plan 04-03:** Max 200 notifications to prevent memory issues (per RESEARCH.md Pitfall #3)
- **Plan 04-03:** Filter changes reset list and cursor for clean state
- **Plan 04-03:** Italian locale (it from date-fns) for relative timestamps

### Pending Todos

- User must run `npm install` to install new dependencies (react-hook-form, zod, @hookform/resolvers)
- **Deploy Firestore indexes** for Phase 4: Run `firebase deploy --only firestore:indexes` OR wait for auto-creation via console link

### Blockers/Concerns

**Phase 1 & 2 & 3 Status:**
- ✅ All phases 1-3 complete with success criteria verified
- ✅ Token persistence, monitoring, and preferences infrastructure operational
- ✅ Production monitoring infrastructure complete

**Phase 4 Status:**
- ✅ All success criteria verified by user
- ✅ Notification history with infinite scroll operational
- ✅ Device management with naming and removal working
- ⚠️ **Firestore Indexes Not Deployed:** `firestore.indexes.json` created but not deployed
  - Queries will work but may be slow without indexes
  - First filtered query will log Firebase Console link for manual index creation
  - OR deploy via CLI: `firebase deploy --only firestore:indexes`
- ⚠️ **No Firestore TTL Policy:** 90-day GDPR filter applied in queries but no auto-cleanup configured
  - Consider adding TTL policy in future plan for automatic deletion
  - Current implementation safe with manual query filtering

**Technical Debt:**
- Firestore client writes disabled (using API workaround) - should add security rules for production
- No Firestore TTL policy configured (manual cleanup or Phase 5 enhancement)
- Firestore indexes need deployment for optimal query performance

## Session Continuity

Last session: 2026-01-26
Stopped at: Completed 04-05-PLAN.md (Phase 4 Verification)
Resume file: None (phase complete)
Commits in this session:
- 060e506: test(04-05): verify Phase 4 API endpoints structure
- Documentation updates pending

**Next Steps:**
1. **Phase 4 Complete** - All success criteria verified ✅
2. Optional: Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
3. Optional: Add Firestore TTL policy for automatic 90-day cleanup
4. Ready for Phase 5: Automation & Testing
5. Features available:
   - `/settings/notifications/history` - Notification history with infinite scroll
   - `/settings/notifications/devices` - Device management with naming/removal

---
*Next step: Begin Phase 5 planning (Automation & Testing)*
