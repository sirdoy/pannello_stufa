# Project Research Summary

**Project:** Pannello Stufa v6.0
**Domain:** Smart Home IoT Dashboard - Operations, PWA & Analytics
**Researched:** 2026-02-10
**Confidence:** HIGH

## Executive Summary

v6.0 enhances the existing Next.js 15.5 PWA with operational automation, PWA improvements, and usage analytics. This is an **evolutionary enhancement** — all features integrate with existing patterns (Firebase RTDB/Firestore split, HMAC webhooks, Serwist service worker, Recharts visualization). No major architectural changes or new frameworks required.

The recommended approach builds on the validated v5.1 foundation (104K lines TypeScript strict mode, 3034 tests, zero tsc errors). Most features leverage existing stack: Firebase for persistent rate limiting, Serwist for offline mode, FCM for interactive notifications, Recharts for analytics visualization. Only **one new dependency** required: `idb` (IndexedDB wrapper for service worker, 1.19kB). Optional second dependency: `@omgovich/firebase-functions-rate-limiter` (evaluate during implementation — custom Firestore implementation likely sufficient).

**Key risks and mitigations:** (1) **Serverless state loss** — solved with Firebase RTDB transactions for rate limits and PID automation state (already validated pattern). (2) **Cron timeout** — refactor to orchestrator + fire-and-forget workers (existing pattern in scheduler/check route). (3) **FCM platform differences** — iOS requires platform-specific payload structure (detected via stored token metadata). (4) **GDPR analytics violation** — implement consent banner before ANY tracking (critical blocker for Phase 54). (5) **Stale cache safety** — add staleness indicators to offline UI (essential for device control app).

## Key Findings

### Recommended Stack

v6.0 requires minimal stack additions. **Core finding: NO major changes needed** — existing Serwist, Firebase, Recharts cover 90% of requirements.

**Core technologies:**
- **Firebase RTDB** (existing): Persistent rate limiting via transactions, cron health monitoring, PID automation state — replaces in-memory Map (critical for serverless)
- **Firestore** (existing): Historical analytics aggregation (monthly rollups), complex queries for dashboard — RTDB for real-time events, Firestore for long-term storage
- **Serwist v9** (existing): Enhanced offline mode with staleness indicators, install prompt handling, Background Sync for command queuing — no alternative needed
- **Recharts** (existing): Analytics visualization (usage timeline, pellet consumption, weather correlation) — pattern already proven in notification dashboard
- **idb v8.0.3** (NEW): IndexedDB wrapper for service worker (replaces raw IndexedDB boilerplate) — reduces code by 60%, better TypeScript support

**Critical version notes:**
- Next.js 16 defaults to Turbopack — must use `--webpack` flag for Serwist build
- @omgovich/firebase-functions-rate-limiter (fork) is only viable option for library-based rate limiting (original abandoned 4 years ago)
- Playwright auth state pattern requires v1.18+ (current v1.52.0 compatible)

**What NOT to add:**
- No separate cron service (node-cron, bull) — external HTTP scheduler (GitHub Actions, Upstash) + existing webhook pattern
- No Redis for rate limiting — Firebase RTDB transactions provide atomicity
- No Chart.js/Victory — Recharts already working
- No Playwright migration — Cypress covers 3034 tests (migration ROI too low)

### Expected Features

**Must have (table stakes):**
- **Cron automation** — Smart home platforms auto-poll devices every 5-30min (manual-only feels broken). Existing `/api/scheduler/check` needs external HTTP trigger.
- **Persistent rate limiting** — Vercel serverless = stateless, in-memory Map resets on cold starts (DoS vulnerability). Firebase RTDB transactions required.
- **Interactive push notifications** — Modern smart home apps (Home Assistant, SmartThings) allow direct action from notifications. "View only" notifications feel dated in 2026.
- **Offline mode indicators** — PWAs must show "You're offline" with last known state. Silent stale data is a safety risk for device control apps.
- **Analytics dashboard** — Energy monitoring core to smart home value prop (Google Nest, Ecobee all show usage dashboards). Users want "how much am I using?"

**Should have (competitive):**
- **Smart pellet estimation** — Pellet stoves lack built-in sensors. Software-only estimation (power level × runtime × weather correlation) is a differentiator vs Home Assistant (which requires hardware sensors).
- **Offline-capable notification actions** — Background Sync allows "Spegni stufa" button to work offline, queue action, execute when connection restored. Most smart home apps fail silently when offline.
- **Cron reliability monitoring** — Dead man's switch for automation itself. If cron stops running (Vercel issue), alert user within 10-15 minutes. Home Assistant doesn't monitor its own automations.
- **Realistic Auth0 E2E testing** — Real OAuth flow (not mocked) catches real bugs (CVE-2025-29927 showed middleware-only auth insufficient). Most tutorials mock auth completely.

**Defer (v2+):**
- **Weather correlation in pellet consumption** — HIGH complexity (timestamp joins, aggregation). Heuristic formula sufficient for v6.0.
- **Notification action undo** — Complex state management. Confirmation dialogs sufficient.
- **Token refresh E2E testing** — Requires 24hr wait or complex clock setup. Manual testing acceptable for v6.0.
- **Playwright migration** — No ROI for 3 weeks migration. Cypress works fine.
- **Real-time pellet sensor integration** — Hardware out of scope. Software estimation only.

### Architecture Approach

v6.0 integrates via **existing patterns** — HMAC webhooks (withCronSecret), Firebase RTDB/Firestore split (real-time vs historical), service worker message handlers (notificationclick), Serwist strategies (NetworkFirst with fallback). No new architectural paradigms introduced.

**Major components:**

1. **Cron Orchestrator** — External HTTP scheduler (GitHub Actions or Upstash) triggers existing `/api/scheduler/check` webhook. Refactor to fire-and-forget pattern for parallel tasks (already partially implemented). Pattern: `withCronSecret` middleware validates HMAC. Updates `cronHealth/lastCall` timestamp for dead man's switch monitoring.

2. **Persistent Rate Limiter** — Firebase RTDB replaces in-memory Map. Pattern: `runTransaction()` for atomic counter increments (existing pattern in `netatmoRateLimiter.ts`). Schema: `/rateLimits/{userId}/{notifType}/timestamps`. Cleanup via cron job (daily pruning of old windows).

3. **Interactive Notification Handler** — Service worker `notificationclick` event parses action from data payload, executes API call (or queues via Background Sync if offline). FCM payload includes `actions` array (platform-specific: iOS requires `apns.aps.category`, Android uses `android.notification.clickAction`). Pattern already exists in `app/sw.ts:143-171`, needs action detection enhancement.

4. **Offline State Manager** — Serwist NetworkFirst with cache staleness headers (`X-Cache-Age`, `X-Cache-Stale`). UI hook (`useOnlineStatus`) detects navigator.onLine, shows banner when offline, disables controls, displays cached state with timestamp warning. IndexedDB command queue (already implemented for Background Sync) gets UI feedback layer.

5. **Analytics Pipeline** — **RTDB for real-time events** (1-day retention) → **daily aggregation cron** → **RTDB for daily stats** (90-day retention) → **monthly aggregation cron** → **Firestore for historical data** (unlimited retention, complex queries). Client dashboard fetches RTDB daily stats for selected range (7/30/90 days), visualizes with Recharts (existing pattern from notification dashboard).

**Data flow changes:**
- Before: In-memory rate limit → cold start resets state
- After: Firebase RTDB transaction → persists across deployments
- Before: Notification tap → open app
- After: Notification action button → service worker API call → success notification
- Before: Offline → stale cache served silently
- After: Offline → staleness indicator + cached state warning + command queuing UI

### Critical Pitfalls

1. **Serverless state loss** — In-memory rate limiter resets on cold starts, allowing DoS bypass. **Solution:** Firebase RTDB transactions for ALL persistent state (rate limits, PID automation, cron health). Test with 15+ minute idle periods. Pattern already validated in `netatmoRateLimiter.ts`.

2. **Cron timeout** — Sequential operations (stove status + maintenance + calibration + weather + cleanup + PID) exceed 10s Vercel timeout, causing partial execution. **Solution:** Refactor to orchestrator + fire-and-forget workers (Promise.all with .catch). Set `maxDuration = 60` in route config. Dead man's switch monitors completion.

3. **FCM platform payload differences** — Action buttons work on Android but fail silently on iOS (requires `aps.category` with registered categories). Data size limits differ (4KB iOS, 2KB Android). **Solution:** Platform-specific payload construction based on stored token metadata (`fcmTokens/{token}/platform`). Validate payload size before sending.

4. **Auth0 session leakage in E2E tests** — Playwright storageState caches cookies across test runs, causing "Session expired" errors in CI. **Solution:** Per-test login fixture with beforeEach/afterEach lifecycle. Never commit storageState.json. Use TEST_MODE bypass in CI if needed.

5. **Stale cache safety risk** — Users act on outdated stove status (offline mode serves stale cache without warning), leading to dangerous actions (ignite already-running stove). **Solution:** Add cache staleness headers (`X-Cache-Age`) in service worker, UI shows "⚠️ Dati non aggiornati (X minuti fa)" banner when age >30 seconds. Disable controls when offline.

6. **GDPR violation** — Tracking analytics without explicit consent violates GDPR Article 6, facing €20M fines. **Solution:** Implement consent banner BEFORE ANY analytics tracking. Gate all `logAnalytics()` calls with consent check. Store `users/{userId}/consent` in Firebase. Right to deletion endpoint required.

## Implications for Roadmap

Based on research, suggested 6-phase structure:

### Phase 49: Persistent Rate Limiting
**Rationale:** Foundation for all other features. Current in-memory rate limiter breaks in serverless (DoS vulnerability). Must complete before Phase 50 (cron) and Phase 52 (interactive notifications).

**Delivers:** Firebase RTDB-backed rate limiter with transaction safety, sliding window algorithm, automatic cleanup, feature flag for gradual rollout.

**Addresses:** Critical pitfall #1 (state loss), MEDIUM complexity from STACK.md (Firebase transactions solve core problem).

**Avoids:** DoS attacks via cold start exploitation, API quota exhaustion (Netatmo 50 req/10s limit).

**Estimated effort:** 1 day (lib/rateLimiterPersistent.ts + tests + 24h monitoring).

**Research flag:** Standard pattern (Firebase RTDB transactions already proven in netatmoRateLimiter.ts) — skip `/gsd:research-phase`.

---

### Phase 50: Cron Automation Configuration
**Rationale:** Enables all background tasks (health monitoring, coordination, weather refresh). Existing endpoints already operational, just need HTTP trigger configuration.

**Delivers:** External HTTP scheduler setup (GitHub Actions cron.yml or Upstash), refactored `/api/scheduler/check` to orchestrator + fire-and-forget workers, `maxDuration = 60` config, dead man's switch integration.

**Uses:** HMAC webhook pattern (withCronSecret middleware already implemented).

**Implements:** Cron Orchestrator component from ARCHITECTURE.md.

**Avoids:** Critical pitfall #2 (timeout), ensures <10s critical path execution.

**Estimated effort:** 0.5 days (configuration + refactoring existing code).

**Research flag:** Standard pattern (cron-job.org or GitHub Actions well-documented) — skip `/gsd:research-phase`.

---

### Phase 51: E2E Test Improvements
**Rationale:** Validates security foundation before shipping new features. Auth0 CVE-2025-29927 showed mocking auth defeats E2E purpose. Can run parallel to Phase 52-53.

**Delivers:** Playwright auth.setup.ts with session state caching, 5 critical flow tests (ignite, thermostat, schedule, notification, PWA install), CI integration with GitHub Actions.

**Addresses:** Critical pitfall #4 (session leakage), MEDIUM complexity from FEATURES.md (Auth0 test tenant + cy.origin).

**Avoids:** False positives from stale sessions, flaky CI tests, Auth0 rate limiting.

**Estimated effort:** 1.5 days (setup + 5 tests + CI integration).

**Research flag:** Standard pattern (Playwright auth docs comprehensive) — skip `/gsd:research-phase`.

---

### Phase 52: Interactive Push Notifications
**Rationale:** Biggest UX improvement (action buttons in notifications). Depends on Phase 49 (rate limiter) to prevent notification spam. Independent of Phase 50 (cron) and Phase 53 (offline).

**Delivers:** FCM action buttons (platform-specific payloads), service worker notificationclick handler with action detection, server-side notification triggers with action arrays, manual test on Android Chrome + iOS Safari PWA.

**Addresses:** Table stakes feature from FEATURES.md (HIGH value, HIGH complexity), Critical pitfall #3 (platform differences).

**Implements:** Interactive Notification Handler component from ARCHITECTURE.md.

**Avoids:** Silent iOS failures (platform detection + graceful degradation), payload size errors (2KB Android, 4KB iOS limits).

**Estimated effort:** 1 day (service worker + 4 notification triggers).

**Research flag:** **Needs deeper research** during planning — FCM platform-specific payload structure complex, iOS category registration unclear from sources.

---

### Phase 53: PWA Offline Improvements
**Rationale:** Safety enhancement (stale cache warning critical for device control app). Builds on Phase 52 (notification actions can queue offline). Independent of Phase 50-51.

**Delivers:** useOnlineStatus hook, offline banner + cached state UI in StoveCard/ThermostatCard, cache staleness headers in service worker, command queue UI feedback (pending count + sync success toast), install prompt (beforeinstallprompt event + localStorage tracking).

**Addresses:** Table stakes feature from FEATURES.md (offline indicators), Critical pitfall #5 (stale cache safety).

**Implements:** Offline State Manager component from ARCHITECTURE.md.

**Avoids:** Users acting on outdated state (safety risk), silent command failures (queuing feedback).

**Estimated effort:** 2 days (1.5 offline UI + 0.5 install prompt).

**Research flag:** Standard pattern (Serwist + beforeinstallprompt well-documented) — skip `/gsd:research-phase`, but note Next.js 16 Turbopack conflict requires `--webpack` flag.

---

### Phase 54: Analytics Dashboard
**Rationale:** Final feature (requires data accumulation from Phase 50 cron). MUST implement consent banner before ANY tracking (GDPR blocker).

**Delivers:** Consent banner (blocking, granular categories), analyticsLogger.ts (event collection to RTDB), /api/analytics/aggregate-daily cron endpoint, /app/analytics/page.tsx dashboard (usage timeline, pellet consumption, weather correlation charts), stats cards (totals, automation %).

**Addresses:** Table stakes feature from FEATURES.md (analytics dashboard MEDIUM-HIGH complexity), Critical pitfall #6 (GDPR violation).

**Implements:** Analytics Pipeline component from ARCHITECTURE.md.

**Avoids:** €20M GDPR fines (consent-first), unbounded Firestore growth (2-year TTL policy).

**Estimated effort:** 4 days (1 consent + 1 collection + 1 aggregation + 2 dashboard).

**Research flag:** **Needs research** during planning — GDPR consent implementation patterns, Firestore aggregation query optimization, pellet consumption estimation formula validation.

---

### Phase Ordering Rationale

**Sequential dependencies:**
- Phase 49 (rate limiting) → Phase 52 (notifications) — prevent notification spam
- Phase 50 (cron) → Phase 54 (analytics) — data accumulation for dashboard
- Phase 52 (notifications) → Phase 53 (offline actions) — Background Sync integration

**Parallelizable:**
- Phase 51 (E2E tests) — independent, validates auth only
- Phase 53 (PWA offline) — after Phase 52, can run parallel to Phase 54

**Critical path:** 49 → 50 → 52 → 53 → 54 (with Phase 51 parallel to 52-53).

**Risk mitigation order:**
- Phase 49 first — fixes DoS vulnerability (serverless state loss)
- Phase 50 second — enables automation before analytics data collection
- Phase 54 last — requires consent banner (GDPR blocker, no shortcuts allowed)

**Complexity sequencing:**
- LOW → MEDIUM → HIGH: Start with rate limiting (MEDIUM, proven pattern), end with analytics (HIGH, new patterns)
- Standard patterns first (49-51), novel patterns last (52-54)

### Research Flags

**Needs `/gsd:research-phase` during planning:**

- **Phase 52 (Interactive Push Notifications)** — FCM platform-specific payload structure complex. iOS category registration process unclear. Action button limitations vary by platform (2 actions Android, 4 actions iOS). Research needed: official FCM docs for apns.aps.category structure, iOS UNNotificationCategory registration in PWA context.

- **Phase 54 (Analytics Dashboard)** — Three sub-areas need research:
  1. GDPR consent implementation patterns (banner UI, consent storage, retroactive data deletion)
  2. Firestore aggregation query optimization (write-time vs read-time aggregation, cost tradeoffs)
  3. Pellet consumption estimation formula validation (powerLevel × runtime heuristic accuracy, weather correlation algorithm)

**Standard patterns (skip research-phase):**

- **Phase 49 (Persistent Rate Limiting)** — Firebase RTDB transactions already validated in netatmoRateLimiter.ts. Sliding window algorithm well-documented.
- **Phase 50 (Cron Configuration)** — HMAC webhook pattern exists (withCronSecret). GitHub Actions cron syntax standard. Fire-and-forget Promise.all pattern proven.
- **Phase 51 (E2E Tests)** — Playwright auth state pattern official docs comprehensive. Auth0 test tenant setup straightforward.
- **Phase 53 (PWA Offline)** — Serwist NetworkFirst + beforeinstallprompt event well-documented. useOnlineStatus hook standard React pattern. Note: Next.js 16 Turbopack conflict documented in sources (requires `--webpack` flag).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing technologies cover 90% of requirements. Only 1 new dependency (idb). Versions verified compatible. No major framework changes. |
| Features | HIGH | Table stakes well-defined (smart home platform comparisons clear). Differentiators validated (pellet estimation novel but feasible). Anti-features explicit (no Playwright migration). |
| Architecture | HIGH | All patterns already exist in codebase (HMAC webhooks, Firebase splits, service worker handlers, Recharts). Integration points documented with line numbers. No architectural rewrites. |
| Pitfalls | HIGH | Sources authoritative (official Vercel/Firebase/FCM docs, Anthropic research, Auth0 community). All 6 critical pitfalls have proven solutions. Recovery strategies documented. |

**Overall confidence:** HIGH

Research quality indicators met:
- Official sources for all critical technologies (Vercel serverless limits, Firebase transaction safety, FCM payload structure, Playwright auth patterns)
- Existing codebase validation (Firebase RTDB pattern proven in netatmoRateLimiter.ts, Recharts proven in notification dashboard, service worker handlers exist)
- Pitfall prevention documented (each pitfall maps to specific phase, recovery steps provided)
- Stack decisions justified (NO Redis, NO Playwright migration, NO complex ML models — pragmatic choices)

### Gaps to Address

**Gap 1: FCM iOS category registration in PWA context**
- Research shows iOS requires `aps.category` matching registered UNNotificationCategory, but unclear how to register categories in PWA (not native app)
- **Handling:** Needs deeper research in Phase 52 planning. Fallback: iOS action buttons only work if PWA installed (standalone mode), document limitation for users.

**Gap 2: Pellet consumption estimation accuracy**
- Heuristic formula (powerLevel × runtime × weatherFactor) unverified. Research shows ML models achieve 80%+ accuracy, but heuristic approach accuracy unknown.
- **Handling:** Start with simple formula, add user calibration UI ("I refilled 15kg today"), improve with feedback data. Weather correlation deferred to v6.1 (HIGH complexity).

**Gap 3: Firestore vs RTDB cost tradeoffs for analytics**
- Research recommends RTDB for real-time, Firestore for historical, but cost implications unclear for 90-day daily stats (potential duplication)
- **Handling:** Start with RTDB-only (90-day retention, simple queries). Migrate to Firestore monthly rollups only if RTDB queries become slow (>10 users, >1000 data points).

**Gap 4: External HTTP scheduler free tier limits**
- GitHub Actions cron: 5-minute minimum interval (acceptable), but unknown reliability for critical health checks
- Upstash: Free tier unknown limits
- **Handling:** Start with GitHub Actions (zero cost). Monitor reliability for 1 week. Migrate to Upstash if >5% missed executions (dead man's switch will alert).

**Gap 5: Consent banner UX optimization**
- GDPR requires opt-in, but modal blocking UI may frustrate users on first load
- **Handling:** Allow "Essential only" mode → functional controls work, analytics disabled. Persistent banner (non-blocking) for "Enable analytics" after user explores app.

## Sources

### Primary (HIGH confidence)

**Stack recommendations:**
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs) — serverless cron patterns, CRON_SECRET authentication
- [Firebase Realtime Database Transactions](https://firebase.google.com/docs/database/web/read-and-write#save_data_as_transactions) — atomic operations for rate limiting
- [idb - npm](https://www.npmjs.com/package/idb) — IndexedDB wrapper for service workers
- [Serwist Documentation](https://serwist.pages.dev/docs) — Next.js 15+ PWA configuration
- [Playwright Authentication](https://playwright.dev/docs/auth) — session state reuse patterns

**Feature validation:**
- [Home Assistant Schedule Integration](https://www.home-assistant.io/integrations/schedule/) — smart home automation patterns
- [Google Nest Energy History](https://support.google.com/googlenest/answer/9247296) — energy analytics UX patterns
- [Firebase Cloud Messaging Web Push](https://firebase.google.com/docs/cloud-messaging/js/receive) — notification action buttons

**Architecture patterns:**
- [End-to-End Testing Auth Flows with Playwright and Next.js](https://testdouble.com/insights/how-to-test-auth-flows-with-playwright-and-next-js) — session state management
- [Tutorial: Firestore Rate Limiting | Fireship.io](https://fireship.io/lessons/how-to-rate-limit-writes-firestore/) — distributed rate limiting patterns
- [Build an Offline-First Mood Journal PWA with Next.js & IndexedDB](https://www.wellally.tech/blog/build-offline-first-pwa-nextjs-indexeddb) — offline state management

**Pitfall prevention:**
- [What can I do about Vercel Functions timing out? | Vercel KB](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out) — serverless timeout mitigation
- [Implementing Action Buttons in Push Notifications using Firebase and Notifee](https://medium.com/@hassem_mahboob/implementing-action-buttons-in-push-notifications-using-firebase-and-notifee-f5743bdb28bc) — platform-specific FCM payloads
- [GDPR Compliance Checklist for Next.js Apps](https://medium.com/@kidane10g/gdpr-compliance-checklist-for-next-js-apps-801c9ea75780) — consent implementation

### Secondary (MEDIUM confidence)

- [Cron Jobs in Next.js: Serverless vs Serverful](https://yagyaraj234.medium.com/running-cron-jobs-in-nextjs-guide-for-serverful-and-stateless-server-542dd0db0c4c) — comparison of cron approaches
- [How to Build a Distributed Rate Limiter with Redis](https://oneuptime.com/blog/post/2026-01-21-redis-distributed-rate-limiter/view) — alternative rate limiting patterns (Redis comparison)
- [Cypress vs Playwright: I Ran 500 E2E Tests in Both](https://medium.com/lets-code-future/cypress-vs-playwright-i-ran-500-e2e-tests-in-both-heres-what-broke-2afc448470ee) — E2E framework comparison (validates Cypress retention decision)

### Tertiary (LOW confidence)

- [Tracking wood pellet consumption - Home Assistant Community](https://community.home-assistant.io/t/tracking-wood-pellet-consumption/783104) — community approaches to pellet estimation (no validation)
- [Novel approach to energy consumption estimation in smart homes](https://www.frontiersin.org/journals/energy-research/articles/10.3389/fenrg.2024.1361803/full) — ML models for energy prediction (academic, not production-tested)

---
*Research completed: 2026-02-10*
*Ready for roadmap: yes*
*Total plans required: 6 phases (49-54)*
*Estimated implementation: 10 days (1 rate limiting + 0.5 cron + 1.5 E2E + 1 notifications + 2 offline + 4 analytics)*
