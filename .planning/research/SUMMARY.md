# Project Research Summary

**Project:** Production-Grade PWA Push Notifications Enhancement
**Domain:** PWA Push Notification System (Firebase Cloud Messaging)
**Researched:** 2026-01-23
**Confidence:** HIGH

## Executive Summary

This project enhances an existing PWA notification system to achieve production-grade reliability. The current implementation has FCM integration but suffers from critical token persistence issues after browser restarts. Research reveals this is a well-understood problem with documented solutions: robust token lifecycle management, delivery monitoring, and user preference controls.

The recommended approach builds incrementally on the existing Firebase stack. No migrations needed - we ADD capabilities (token refresh, history tracking, monitoring) to current FCM setup. Core technologies are already in place (Next.js 16, Firebase 12.8.0, Serwist 9.0). New additions are lightweight (Recharts for dashboards, React Hook Form + Zod for preferences, Firestore for history storage alongside existing Realtime DB for tokens).

Key risk is the foundational token persistence bug. If not fixed first, all enhancement features will be undermined by unreliable delivery. Research shows this requires: startup token checking, monthly refresh cadence, timestamp tracking, and stale token cleanup. Fix the foundation before building features. Secondary risk is iOS PWA permission state lies - mitigate with test notifications and delivery monitoring.

## Key Findings

### Recommended Stack

Existing stack is current and production-ready - no changes needed. Research focused on identifying what to ADD, not replace.

**Core technologies (keep existing):**
- Next.js 16.1.0 - App Router framework, current version
- Firebase Client SDK 12.8.0 - FCM messaging, already integrated
- Firebase Admin SDK 13.6.0 - Server-side operations, fully compatible
- Serwist 9.0 - Service Worker management, PWA infrastructure
- Auth0 4.13.1 - Authentication, session management

**New additions (required):**
- Firestore - Notification history storage with better querying than Realtime DB (complex filters by date/type/status)
- Recharts 2.x - Dashboard charts/graphs (shadcn/ui official choice, SVG-based, dark mode via CSS variables)
- date-fns 4.1.0 - Date utilities (tree-shakeable, 1.6KB per function vs 66KB Moment.js)
- React Hook Form 7.54.0 + Zod 3.24.0 - Preference forms (shadcn/ui documented pattern, type-safe validation)
- Playwright 1.49.0 - Service Worker E2E testing (Jest mocks insufficient for SW lifecycle)

**New additions (optional):**
- react-hot-toast 2.4.1 - In-app notification toasts (2KB, lightweight)
- clsx + tailwind-merge - Conditional Tailwind classes (standard pattern)
- fcm-push-cli - Automated FCM testing in CI/CD

**Total added bundle size:** ~120KB (minimal impact)

### Expected Features

Research analyzed industry-standard PWA notification systems (Firebase, MoEngage, OneSignal) to identify table stakes vs differentiators.

**Must have (table stakes):**
- Token Auto-Recovery - Persist across browser restarts without manual re-subscription
- Invalid Token Cleanup - Automatic detection and removal on FCM error codes
- Multi-Device Support - Users expect notifications on all logged-in devices (1:N user-to-tokens mapping)
- Basic Delivery Status - Track send success/failure for debugging
- Error Logging - Store failed deliveries in Firebase
- Permission Handling - Contextual UI for requesting permission (not on page load)
- Test Send Capability - Admin panel for testing before production sends

**Should have (competitive advantage):**
- Granular User Preferences - Per-notification-type controls (scheduler, errors, maintenance)
- Notification History UI - In-app inbox for past notifications
- Stale Token Detection - Identify inactive devices (>30 days)
- Active Device List - Dashboard showing registered devices per user
- Scheduled Token Cleanup - Automated job removing expired tokens (>270 days)
- Device Naming - Users label devices ("Kitchen iPad", "Bedroom Phone")
- Do Not Disturb Hours - Per-user quiet hours with timezone awareness

**Defer (v2+):**
- Real-Time Delivery Dashboard - HIGH complexity, requires BigQuery + WebSocket updates
- Delivery Rate Trends - Needs 90+ days data volume to show meaningful trends
- Notification Categories - Only useful with large history volume (100+ notifications)

**Industry benchmarks:**
- Delivery rate: 85-95% for active devices
- Open rate: 3-15% (4.6% Android avg, 3.4% iOS avg)
- Opt-in rate: 45-90% (context-dependent)
- Frequency: <5 notifications per week per user
- Token refresh: Monthly minimum
- Stale threshold: 30 days inactivity

### Architecture Approach

Standard production PWA notification architecture uses layered Repository Pattern aligned with existing codebase structure.

**Major components:**

1. **Token Lifecycle Service** - Business logic for token registration, refresh, cleanup (new)
   - Sanitize token as Firebase key (existing pattern in code)
   - Check for existing token before creating duplicate
   - Track timestamps (createdAt, lastUsed) for staleness detection
   - Cleanup stale tokens via scheduled job or manual trigger

2. **Notification History Service** - Audit trail for all sent notifications (new)
   - Log every notification with delivery result
   - Store in Firestore (better querying than Realtime DB for filtering)
   - Support pagination (limit 50, cursor-based for infinite scroll)
   - Update daily stats for monitoring dashboard

3. **Preference-Aware Trigger Service** - Check user preferences before every send (extends existing)
   - Resolve notification typeId to category + field
   - Query user preferences from Firebase
   - Fail-safe: send critical notifications even if preference check fails
   - Log history after successful send

4. **Repository Layer** - Data access with Admin SDK (extends existing BaseRepository pattern)
   - NotificationTokenRepository - CRUD for FCM tokens in Realtime DB
   - NotificationHistoryRepository - CRUD for history in Firestore
   - Consistent with StoveStateRepository, MaintenanceRepository patterns
   - Automatic undefined filtering (Firebase requirement)

**Data flow:**
- Client: Request permission → Get FCM token → POST /api/notifications/register
- Server: Validate session → TokenService.registerToken → TokenRepository.createToken → Firebase
- Trigger: Event occurs → TriggerService.trigger → Check preferences → Send via Admin SDK → Log history
- Monitor: Admin opens dashboard → Fetch stats → Aggregate from history → Display charts

**Scaling considerations:**
- 0-1k users: Current architecture sufficient, weekly manual cleanup
- 1k-10k users: Add pagination, daily cron cleanup, database indexes
- 10k-100k users: Cloud Functions, monitor FCM quota (1M free/month), batch sends
- 100k+ users: Shard history by month, migrate to Firestore for queries, rate limiting

### Critical Pitfalls

Research identified 8 major pitfalls with 100% focus on token persistence as foundational issue.

1. **FCM Tokens Not Persisting After Browser Restart** (CRITICAL)
   - Current bug: Token obtained once but not recovered on browser restart
   - Fix: Startup token check, monthly refresh, timestamp tracking, service worker persistence
   - Warning signs: "Worked once then stopped", NotRegistered errors, token accumulation
   - Address: Phase 1 - foundational fix before any features

2. **Service Worker Scope and Registration Timing Issues** (CRITICAL)
   - Multiple SWs conflict (Serwist + Firebase), wrong scope, MIME type errors
   - Fix: Merge Firebase handlers into Serwist SW, verify Content-Type, user gesture requirement
   - Warning signs: 404 on SW registration, text/html MIME type, production vs dev inconsistency
   - Address: Phase 1 & 2 - fix registration, then merge SWs

3. **iOS PWA Permission State Lies** (HIGH)
   - Notification.permission returns incorrect state after iOS Settings changes
   - Fix: Don't trust permission alone, add test notification, monitor delivery failures
   - Warning signs: Permission granted but delivery fails (iOS only)
   - Address: Phase 2 - delivery monitoring and test feature

4. **Token Accumulation Without Cleanup** (HIGH)
   - Existing code has cleanup commented out (lines 483-510), accumulates stale tokens
   - Fix: Server-side cleanup API with Admin SDK, remove on NotRegistered error, age-based (>90 days)
   - Warning signs: 10+ tokens per user, increasing send time, high NotRegistered errors
   - Address: Phase 1 - implement cleanup immediately

5. **No Delivery Monitoring = Silent Failures** (HIGH)
   - Only tracking FCM send success, not actual delivery or display
   - Fix: Track Sent/Delivered/Displayed separately, client-side delivery reporting, message ID correlation
   - Warning signs: "Never received" but server shows "sent successfully", high Sends but low Impressions
   - Address: Phase 2 - build monitoring before scaling

6. **Ignoring Notification Preferences = Notification Fatigue** (MEDIUM)
   - Too many notifications lead to OS-level disable, losing critical alert capability
   - Fix: Conservative defaults (CRITICAL + ERROR only), rate limiting (1 per category per 5 min)
   - Warning signs: Users disable at OS level shortly after enabling
   - Address: Phase 2 rate limiting, Phase 3 enhanced preferences

7. **Service Worker Update Conflicts** (MEDIUM)
   - New SW waits forever if user never closes tabs, causing stale notification handlers
   - Fix: skipWaiting() with caution, update check on focus, reload prompt to user
   - Warning signs: "Waiting to activate" SW never activates, different behaviors after deployment
   - Address: Phase 2 - SW update detection

8. **Multi-Device Synchronization Race Conditions** (MEDIUM)
   - Device A disables notifications but Device B/C not updated, inconsistent delivery
   - Fix: Device identification (hash of userAgent), token status field (active/invalid/revoked)
   - Warning signs: "Works on phone but not tablet", duplicate tokens, race condition errors
   - Address: Phase 1 device ID, Phase 3 device management UI

## Implications for Roadmap

Based on research, recommended 4-phase structure prioritizing foundation before features.

### Phase 1: Token Lifecycle Fixes (FOUNDATION)
**Rationale:** Critical bug fix - all features depend on reliable token persistence. Research shows this is root cause of current issues.

**Delivers:**
- Startup token checking (detect existing valid token before requesting new)
- Token refresh logic (monthly minimum, triggered on app launch if >7 days old)
- Timestamp tracking (createdAt, lastUsed, lastRefreshed)
- Stale token cleanup API (remove tokens with lastUsed >90 days)
- Device identification (hash of userAgent + platform)
- Token deduplication (check if device already registered)

**Addresses features:**
- Token Auto-Recovery (table stakes)
- Invalid Token Cleanup (table stakes)
- Multi-Device Support foundation (table stakes)

**Avoids pitfalls:**
- Pitfall 1: FCM Tokens Not Persisting (CRITICAL fix)
- Pitfall 4: Token Accumulation (implement cleanup commented out in code)
- Pitfall 8: Multi-Device Race Conditions (add device ID)

**Implementation:**
- NotificationTokenRepository (extends BaseRepository)
- NotificationTokenService (business logic)
- /api/notifications/cleanup route (requires Admin SDK write access)
- Service worker token refresh listener

**Success criteria:**
- Token persists across browser restart (manual test)
- Max 3-5 tokens per user (1 per device type)
- Token age tracked, cleanup removes >90 day tokens
- No NotRegistered errors in FCM logs

**Research flag:** STANDARD PATTERNS - Well-documented FCM token management, skip phase research

### Phase 2: Production Infrastructure (MONITORING)
**Rationale:** Can't scale without visibility. Must detect silent failures before they become widespread.

**Delivers:**
- Notification history storage (Firestore collection)
- NotificationHistoryService (audit logging)
- Delivery status tracking (sent/delivered/displayed)
- Basic monitoring dashboard (admin-only)
- Test notification feature (user self-verification)
- Service worker update detection
- Rate limiting (1 notification per category per 5 minutes)

**Uses from STACK.md:**
- Firestore for history (better querying than Realtime DB)
- Recharts for basic delivery charts
- date-fns for timestamp display

**Implements architecture:**
- NotificationHistoryRepository
- NotificationHistoryService
- /api/notifications/history (get user history)
- /api/notifications/stats (admin metrics)
- MonitoringPanel component (admin conditional UI)
- TestPanel component (admin testing tools)

**Addresses features:**
- Basic Delivery Status (table stakes)
- Error Logging (table stakes)
- Test Send Capability (table stakes)
- Stale Token Detection (differentiator)

**Avoids pitfalls:**
- Pitfall 5: No Delivery Monitoring (build visibility)
- Pitfall 3: iOS Permission State Lies (test notification mitigates)
- Pitfall 6: Notification Fatigue (rate limiting prevents spam)
- Pitfall 7: Service Worker Update Conflicts (add update detection)

**Success criteria:**
- All notifications logged to history with delivery result
- Admin dashboard shows delivery rate (target 85%+)
- Test notification button works for all users
- Rate limiting prevents >1 notification per category per 5 minutes

**Research flag:** STANDARD PATTERNS - Firestore queries and monitoring dashboards well-documented

### Phase 3: User Features (UX ENHANCEMENT)
**Rationale:** Foundation solid, monitoring in place, now enhance user experience and control.

**Delivers:**
- Granular preference controls (per notification type)
- Preference form with validation (React Hook Form + Zod)
- Notification history UI (user-facing inbox)
- Active device list (user sees registered devices)
- Device naming (user labels devices)
- Pagination for history (infinite scroll)

**Uses from STACK.md:**
- React Hook Form + Zod for preferences (shadcn/ui pattern)
- date-fns for relative timestamps ("2 hours ago")
- Recharts for user-level charts (optional)

**Implements architecture:**
- HistoryPanel component
- Enhanced PreferencesPanel
- Device management UI
- /api/notifications/preferences updates

**Addresses features:**
- Granular User Preferences (differentiator)
- Notification History UI (differentiator)
- Active Device List (differentiator)
- Device Naming (differentiator)

**Avoids pitfalls:**
- Pitfall 6: Notification Fatigue (granular controls give user power)
- Pitfall 8: Multi-Device Synchronization (device management UI)

**Success criteria:**
- Users can disable specific notification types
- History shows last 50 notifications with pagination
- Users can name and remove devices
- Preferences validated client and server-side (Zod schema)

**Research flag:** STANDARD PATTERNS - React Hook Form + Zod well-documented

### Phase 4: Automation & Polish (OPTIMIZATION)
**Rationale:** Manual processes work, now automate for hands-off operation.

**Delivers:**
- Scheduled token cleanup (weekly cron)
- Automated stale token detection job
- Notification categories (visual grouping)
- Enhanced monitoring charts
- Playwright E2E tests for service worker

**Uses from STACK.md:**
- Playwright for SW testing
- fcm-push-cli for CI/CD testing (optional)

**Implements architecture:**
- Cron job for cleanup (/api/cron/cleanup-tokens)
- Automated staleness detection
- Category filtering in history
- E2E test suite

**Addresses features:**
- Scheduled Token Cleanup (differentiator)
- Notification Categories (defer-but-easy)

**Success criteria:**
- Cleanup runs weekly automatically
- E2E tests verify token persistence across browser restart
- Categories filter history effectively
- Zero manual intervention needed for token hygiene

**Research flag:** STANDARD PATTERNS - Cron jobs and Playwright well-documented

### Phase Ordering Rationale

**Why this order:**
1. **Phase 1 first:** Token persistence bug is foundational. Without reliable tokens, all features fail. Research shows this is root cause.
2. **Phase 2 before Phase 3:** Need monitoring to validate Phase 1 fixes working. Can't build user features without knowing delivery is reliable.
3. **Phase 3 before Phase 4:** Manual processes prove value before automation. User features validated before investing in automation.
4. **Phase 4 last:** Automation polishes stable system. Safe to automate only after manual processes proven.

**Dependencies identified:**
- All phases depend on Phase 1 token persistence
- Phase 3 user history depends on Phase 2 history storage
- Phase 4 automation depends on Phase 1 cleanup API existing
- Monitoring (Phase 2) informs preference defaults (Phase 3)

**Architecture alignment:**
- Phase 1 builds repository + service layer (foundation)
- Phase 2 builds API routes + admin UI (infrastructure)
- Phase 3 builds user-facing UI (features)
- Phase 4 adds automation (optimization)

**Pitfall avoidance:**
- Phase 1 fixes 3 critical pitfalls before proceeding
- Phase 2 addresses silent failure risk before scaling
- Phase 3 prevents notification fatigue with controls
- Phase 4 eliminates manual toil

### Research Flags

**Phases with STANDARD PATTERNS (skip phase research):**
- Phase 1: Token Lifecycle - Firebase token management extensively documented
- Phase 2: Production Infrastructure - Firestore queries and monitoring dashboards well-covered
- Phase 3: User Features - React Hook Form + Zod official patterns from shadcn/ui
- Phase 4: Automation - Cron jobs and Playwright testing well-documented

**Verdict:** All phases use well-established patterns. No phase needs `/gsd:research-phase` during planning.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack current (verified Jan 2026). New additions from official docs (Firebase, shadcn/ui). Version compatibility verified. |
| Features | HIGH | Based on Firebase official docs + analysis of 3 major competitors (OneSignal, MoEngage, Braze). Industry benchmarks from multiple sources. |
| Architecture | HIGH | Patterns align with existing codebase (Repository Pattern verified in code). Firebase FCM architecture from official docs. Scaling guidance from Firebase blog. |
| Pitfalls | HIGH | Token persistence bug confirmed in existing code. iOS issues documented in Apple Developer Forums. FCM pitfalls from Firebase official best practices. |

**Overall confidence:** HIGH

Research based on:
- Official documentation (Firebase, Apple Developer, MDN) updated Jan 2026
- Existing codebase analysis (confirmed patterns, identified commented-out cleanup code)
- Industry best practices (Firebase blog, established PWA patterns)
- Community validation (GitHub issues, developer forums for iOS-specific issues)

### Gaps to Address

No critical gaps requiring resolution before planning. Minor areas needing validation during implementation:

**Token refresh frequency:**
- Research shows "monthly minimum" but doesn't specify optimal cadence
- Plan: Start with weekly refresh, monitor delivery rate, adjust if needed
- Validation: Phase 2 monitoring will reveal if weekly sufficient

**iOS PWA permission state:**
- Research confirms iOS lies about permission state but solutions vary
- Plan: Implement test notification + delivery monitoring (multi-layered approach)
- Validation: Phase 2 test panel will confirm if iOS users can self-verify

**Service worker merge complexity:**
- Research shows Serwist + Firebase can coexist but merge preferred
- Plan: Phase 1 uses coexistence, Phase 2 evaluates merge necessity
- Validation: If no conflicts in Phase 1, defer merge to Phase 4 polish

**Firestore vs Realtime DB cost:**
- Research recommends Firestore for history but didn't analyze cost at scale
- Plan: Start with Firestore, 30-day retention, monitor costs in Phase 2
- Validation: If costs exceed budget, reduce retention to 7 days

**Rate limiting values:**
- Research suggests "1 notification per category per 5 minutes" but not validated for this domain
- Plan: Start conservative (5 min), adjust based on Phase 2 monitoring feedback
- Validation: User feedback + delivery patterns in Phase 2 will inform tuning

## Sources

### Primary (HIGH confidence)

**Firebase Official Documentation:**
- [FCM Token Management Best Practices](https://firebase.google.com/docs/cloud-messaging/manage-tokens) - Updated Jan 15, 2026
- [Understanding Message Delivery](https://firebase.google.com/docs/cloud-messaging/understand-delivery) - Updated Jan 8, 2026
- [FCM Architectural Overview](https://firebase.google.com/docs/cloud-messaging/fcm-architecture)
- [Choose a Database: Firestore vs Realtime DB](https://firebase.google.com/docs/database/rtdb-vs-firestore) - Updated Jan 22, 2026
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model) - Updated Jan 22, 2026

**shadcn/ui Official Documentation:**
- [Chart Component](https://ui.shadcn.com/docs/components/chart) - Recharts integration
- [React Hook Form Pattern](https://ui.shadcn.com/docs/forms/react-hook-form) - Zod validation

**Apple Developer:**
- [Sending Web Push Notifications](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)

**MDN Web Docs:**
- [Re-engageable Notifications and Push APIs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/Re-engageable_Notifications_Push)

### Secondary (MEDIUM confidence)

**Firebase Blog:**
- [Managing Cloud Messaging Tokens](https://firebase.blog/posts/2023/04/managing-cloud-messaging-tokens/) - Token lifecycle patterns
- [Understanding FCM Delivery Rates](https://firebase.blog/posts/2024/07/understand-fcm-delivery-rates/) - Android delivery metrics

**Industry Guides:**
- [Scalable Notification System for PWA Using FCM](https://amal-krishna.medium.com/scalable-notification-system-for-a-pwa-using-fcm-6a4b8aa093af) - Architecture patterns
- [How To Build Robust Push Notifications for PWAs](https://yundrox.dev/posts/claritybox/how-to-build-robust-pwa-push-notification/) - Best practices
- [Push Notification Metrics: Measuring ROI](https://www.moengage.com/blog/push-notification-metrics/) - Industry benchmarks (4.6% Android, 3.4% iOS open rates)

**Community Patterns:**
- [Lifecycle of FCM Device Tokens](https://medium.com/@chunilalkukreja/lifecycle-of-fcm-device-tokens-61681bb6fbcf) - Token lifecycle
- [Firebase Push Tokens Are Device-Specific](https://dev.to/sangwoo_rhie/firebase-push-tokens-are-device-specific-not-user-specific-a-critical-refactoring-ppi) - Critical concept validation

### Tertiary (LOW confidence, used for validation only)

**Testing Tools:**
- [FCM Test Online](https://fcmtest.com/) - Manual testing
- [fcm-push-cli on GitHub](https://github.com/tastydev/fcm-push-cli) - CLI testing

**Known Issues (GitHub/Forums):**
- [FCM Push notifications stop working on PWA](https://developer.apple.com/forums/thread/745759) - Apple Developer Forums (iOS bug)
- [Firebase Service Worker Registration Issues](https://github.com/firebase/flutterfire/issues/12586) - GitHub (MIME type errors)
- [PWA Notification Permission Not Persistent on iOS](https://github.com/odoo/odoo/issues/165822) - GitHub (iOS permission state bug)

### Existing Codebase Analysis

**Files examined:**
- lib/notificationService.js (lines 24-26: VAPID key loading, lines 211-214: dev mode SW handling, lines 290-292: device fingerprinting)
- app/api/notifications/register/route.js (lines 483-510: commented-out cleanup code requiring Admin SDK migration)
- Current patterns: Repository Pattern (StoveStateRepository, MaintenanceRepository), filterUndefined for Firebase writes, withAuthAndErrorHandler for API routes

---

*Research completed: 2026-01-23*
*Ready for roadmap: YES*
*Next step: Roadmapper agent can use this summary to structure milestone phases*
