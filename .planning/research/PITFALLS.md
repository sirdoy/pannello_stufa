# Pitfalls Research

**Domain:** Operations Automation + PWA Improvements + Analytics (v6.0)
**Researched:** 2026-02-10
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Serverless Cron Persistent State Assumption

**What goes wrong:**
Developers assume Vercel cron jobs maintain in-memory state between executions, leading to broken rate limiters, PID controller state loss, and stale session data. The current in-memory rate limiter will reset on every cold start, allowing DoS attacks to bypass rate limits.

**Why it happens:**
Vercel serverless functions are stateless — each execution starts fresh with no shared memory between invocations. Node-cron patterns work locally but silently fail in production because the process starts, handles one request, then gets destroyed. There is no error and no warning.

**How to avoid:**
1. **Migrate to Firebase RTDB for ALL persistent state**:
   - Rate limiter: Store `requests/{userId}/{endpoint}/count` with timestamp
   - PID automation: Already implemented at `pidAutomation/state` (good pattern)
   - Cron health: Already using `cronHealth/lastCall` (correct)
   - Dead man's switch: Already using `healthMonitoring/lastCheck` (correct)

2. **Implement sliding window rate limiting**:
   ```typescript
   // BAD - In-memory (resets on cold start)
   const rateLimiter = new Map<string, number>();

   // GOOD - Firebase RTDB persistent
   const path = `rateLimit/${userId}/${endpoint}/${timestamp}`;
   const count = await adminDbGet(path) || 0;
   await adminDbSet(path, count + 1);
   // Cleanup old windows with transaction
   ```

3. **Test with forced cold starts**: Deploy to Vercel, wait 15+ minutes between requests to verify state persistence.

**Warning signs:**
- Rate limiter works for consecutive requests but resets after idle periods
- PID controller "forgets" integral/derivative terms between cron runs
- Users bypass rate limits by waiting for function cold start
- Cron interval tracking shows gaps or resets

**Phase to address:**
Phase 49 (Persistent Rate Limiting) - MUST complete before Phase 50 (Cron Configuration)

---

### Pitfall 2: Vercel Function Timeout During Cron Orchestration

**What goes wrong:**
The scheduler cron endpoint (`/api/scheduler/check`) performs 10+ operations sequentially (stove status, ignition, Netatmo sync, valve calibration, weather refresh, token cleanup, PID automation) and exceeds Vercel's 10-second default timeout, causing partial execution and data corruption.

**Why it happens:**
Heavy work in cron jobs — the current implementation performs all maintenance tasks inline. Vercel enforces a 10-second default timeout (60 seconds max), but the cron job can take longer if:
- Stove API is slow (3-5 seconds)
- Netatmo calibration iterates multiple valves (2-3 seconds per valve)
- Weather fetch has network latency (1-2 seconds)
- Multiple notifications triggered (FCM API calls)

**How to avoid:**
1. **Refactor to publish-subscribe pattern**:
   ```typescript
   // BAD - All work inline (current implementation)
   export const GET = withCronSecret(async () => {
     await fetchStoveStatus();      // 3-5s
     await trackMaintenance();      // 1-2s
     await calibrateValves();       // 6-9s (3 valves × 2-3s)
     await refreshWeather();        // 1-2s
     await cleanupTokens();         // 2-3s
     await runPIDAutomation();      // 1-2s
     // TOTAL: 14-24 seconds → TIMEOUT!
   });

   // GOOD - Orchestrator delegates to worker routes
   export const GET = withCronSecret(async () => {
     await adminDbSet('cronHealth/lastCall', new Date().toISOString());

     // Fire-and-forget workers (already partially implemented)
     Promise.all([
       fetch('/api/maintenance/track').catch(logError),
       fetch('/api/netatmo/calibrate').catch(logError),
       fetch('/api/weather/refresh').catch(logError),
       fetch('/api/notifications/cleanup').catch(logError),
     ]);

     // Only blocking: critical path (scheduler logic)
     const result = await executeSchedulerLogic();
     return success(result);
   });
   ```

2. **Set maxDuration in route config**:
   ```typescript
   export const dynamic = 'force-dynamic';
   export const maxDuration = 60; // Max for Hobby plan
   ```

3. **Monitor with dead man's switch**: Already implemented in `healthDeadManSwitch.ts` (correct pattern).

**Warning signs:**
- `FUNCTION_INVOCATION_TIMEOUT` errors in Vercel logs
- Partial state updates (stove ignited but notification not sent)
- Cron health timestamp updated but maintenance not tracked
- Dead man's switch alerts firing despite cron executing

**Phase to address:**
Phase 50 (Cron Configuration) - Split monolithic handler into orchestrator + workers

---

### Pitfall 3: FCM Interactive Notifications Platform-Specific Payload Structure

**What goes wrong:**
Action buttons work on Android but fail silently on iOS, or notification data exceeds platform limits (4KB iOS, 2KB Android), causing dropped notifications without user-visible errors.

**Why it happens:**
FCM notification payloads have different structures for Android vs iOS, and the current implementation sends uniform payloads. iOS requires `aps.category` with registered notification categories, while Android uses `android.actions`. Data size limits vary by platform.

**How to avoid:**
1. **Platform-specific payload construction**:
   ```typescript
   // BAD - Uniform payload (current pattern)
   const message = {
     notification: { title, body },
     data: { actionUrl, type },
     token,
   };

   // GOOD - Platform-specific
   const payload = token.platform === 'ios' ? {
     notification: { title, body },
     apns: {
       payload: {
         aps: {
           category: 'STOVE_ERROR',        // Must match iOS registration
           'mutable-content': 1,
         },
       },
     },
     data: { actionUrl, type },             // Max 4KB
     token,
   } : {
     notification: { title, body },
     android: {
       notification: {
         clickAction: 'FLUTTER_NOTIFICATION_CLICK',
       },
     },
     data: {
       actionUrl,
       type,
       actions: JSON.stringify([           // Max 2KB
         { action: 'VIEW', title: 'Visualizza' },
         { action: 'DISMISS', title: 'Chiudi' },
       ]),
     },
     token,
   };
   ```

2. **Validate payload size before sending**:
   ```typescript
   const payloadSize = JSON.stringify(payload).length;
   const maxSize = platform === 'ios' ? 4096 : 2048;
   if (payloadSize > maxSize) {
     console.error(`Payload too large: ${payloadSize}/${maxSize}`);
     // Truncate or simplify payload
   }
   ```

3. **Track platform in FCM token metadata**: Already storing `platform: 'ios|other'` in Firebase (correct).

**Warning signs:**
- Notifications arrive on Android but not iOS
- Action buttons visible only on specific devices
- Silent failures in FCM delivery reports (Firebase Console)
- `PayloadTooLarge` errors in server logs

**Phase to address:**
Phase 52 (Interactive Push Notifications) - Implement platform-specific payloads

---

### Pitfall 4: Auth0 Session State Leakage in Playwright E2E Tests

**What goes wrong:**
Tests pass locally but fail in CI with "Session expired" or "Unauthorized" errors because Auth0 session state persists between test runs in storageState, causing race conditions and false positives.

**Why it happens:**
Playwright's `storageState` caches cookies and localStorage across test runs for performance, but Auth0 uses short-lived refresh tokens that expire. Tests succeed on first run (fresh login) but fail on subsequent runs (stale session). CI environments have unpredictable cold start delays.

**How to avoid:**
1. **Separate auth fixture with explicit lifecycle**:
   ```typescript
   // BAD - Global storageState (shared across tests)
   test.use({ storageState: 'auth.json' });

   // GOOD - Per-test auth with cleanup
   test.beforeEach(async ({ page }) => {
     // Fresh login for each test
     await page.goto('/auth/login');
     await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL);
     await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD);
     await page.click('button[type="submit"]');
     await page.waitForURL('/');
   });

   test.afterEach(async ({ page }) => {
     // Explicit logout to clear session
     await page.goto('/auth/logout');
   });
   ```

2. **Mock Auth0 in CI environments**:
   ```typescript
   // Use TEST_MODE=true to bypass Auth0 middleware
   if (process.env.CI === 'true') {
     // Inject mock session directly
     await page.addInitScript(() => {
       localStorage.setItem('@@auth0spajs@@::mock', JSON.stringify({
         body: {
           decodedToken: {
             user: { sub: 'test|123', email: 'test@example.com' },
           },
         },
       }));
     });
   }
   ```

3. **Add session expiry checks**: Test with stale session to verify graceful degradation.

**Warning signs:**
- Tests pass locally but fail in GitHub Actions
- Intermittent "Unauthorized" errors in E2E suite
- Auth0 rate limiting errors in CI logs
- Session cookie timestamps show reuse across test runs

**Phase to address:**
Phase 51 (E2E Test Improvements) - Implement auth fixtures with lifecycle management

---

### Pitfall 5: Service Worker Cache Stale State During Offline Mode

**What goes wrong:**
Users see outdated stove status (e.g., "OFF" when actually "ON") because the service worker serves stale cached responses without indicating data freshness, leading to dangerous user actions (attempting to ignite already-running stove).

**Why it happens:**
Serwist's `NetworkFirst` strategy caches `/api/stove/status` responses for 1 minute, but offline mode extends this indefinitely. The current implementation shows cached data without warning users it may be stale. IndexedDB `deviceState` stores timestamp but UI doesn't check it.

**How to avoid:**
1. **Add staleness indicator to cached responses**:
   ```typescript
   // In service worker (app/sw.ts)
   self.addEventListener('fetch', (event) => {
     if (event.request.url.includes('/api/stove/status')) {
       event.respondWith(
         caches.match(event.request).then((response) => {
           if (response) {
             const cachedTime = new Date(response.headers.get('Date'));
             const age = Date.now() - cachedTime.getTime();

             // Clone response and add staleness header
             const clonedResponse = response.clone();
             clonedResponse.headers.set('X-Cache-Age', age.toString());
             clonedResponse.headers.set('X-Cache-Stale', age > 30000 ? 'true' : 'false');

             return clonedResponse;
           }
           return fetch(event.request);
         })
       );
     }
   });
   ```

2. **UI warns when data is stale**:
   ```typescript
   const cacheAge = parseInt(response.headers.get('X-Cache-Age') || '0');
   const isStale = cacheAge > 30000; // 30 seconds

   if (isStale) {
     showBanner({
       variant: 'warning',
       title: 'Dati non aggiornati',
       description: `Ultimo aggiornamento: ${formatAge(cacheAge)} fa`,
     });
   }
   ```

3. **Enhanced offline page**: Already implemented in `app/offline/page.tsx` with stale warning (correct pattern).

**Warning signs:**
- User reports stove status doesn't match physical state
- Actions succeed in UI but fail server-side
- Offline banner shows recent timestamp but data is old
- IndexedDB deviceState timestamps older than 5 minutes

**Phase to address:**
Phase 53 (PWA Offline Improvements) - Add cache staleness indicators

---

### Pitfall 6: Analytics GDPR Violation Through Implicit Consent

**What goes wrong:**
The app tracks pellet consumption, stove usage patterns, and weather correlation without explicit user consent, violating GDPR Article 6 (lawful basis) and facing €20M fines or 4% global revenue.

**Why it happens:**
Developers assume "legitimate interest" covers analytics for device functionality, but GDPR requires opt-in consent for non-essential tracking. Energy usage patterns are potentially identifiable (can infer occupancy, habits). Firebase Analytics is a data processor under GDPR — app owner is the controller.

**How to avoid:**
1. **Implement consent banner before ANY analytics**:
   ```typescript
   // BAD - Track without consent (current pattern would do this)
   await logAnalytics('stove_ignited', { power, source });

   // GOOD - Check consent first
   const consent = await getUserConsent();
   if (consent.analytics) {
     await logAnalytics('stove_ignited', { power, source });
   }
   ```

2. **Consent categories with granular control**:
   ```typescript
   interface ConsentPreferences {
     essential: boolean;      // Always true (functional cookies)
     analytics: boolean;      // Opt-in required
     personalization: boolean; // Opt-in required
   }

   // Store in Firebase: users/{userId}/consent
   ```

3. **Anonymous aggregation only**:
   ```typescript
   // BAD - User-identifiable
   await logEvent('pellet_consumption', { userId, amount: 15 });

   // GOOD - Aggregated, non-identifiable
   await logEvent('pellet_consumption', {
     amount_bucket: '10-20kg',  // Binned
     timestamp: hourBucket(now), // Hourly aggregation
     // No userId
   });
   ```

4. **Right to deletion**: Implement `/api/user/delete-analytics` endpoint.

**Warning signs:**
- No consent banner on first app load
- Analytics events fire before user interaction
- User IDs in analytics payloads
- Firebase Analytics enabled in manifest without consent check

**Phase to address:**
Phase 54 (Analytics Dashboard) - Implement consent management BEFORE any tracking

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skipping consent banner for "internal use only" | Faster MVP launch | GDPR violations, €20M fines, reputational damage | **Never** (even single-user apps can be audited) |
| Using in-memory rate limiter | Simpler code, no DB dependency | DoS vulnerability, broken in serverless | **Never** in production (only local dev) |
| Uniform FCM payload for all platforms | Fewer code paths | iOS notifications fail silently | **Never** (action buttons are core feature) |
| Reusing Auth0 session across E2E tests | Faster test suite (no repeated logins) | Flaky CI, false positives, hard-to-debug failures | Local dev only (CI must use fresh sessions) |
| Serving stale cache without staleness indicator | Better perceived performance | Safety risk (users act on outdated state) | **Never** for device control apps |
| Inline cron operations (no orchestrator) | Simpler mental model | Timeout errors, partial execution | Small apps (<3 operations), non-critical tasks |
| localStorage for offline device state | Standard API, simple usage | 5-10MB limit, string-only, sync blocking | **Never** (use IndexedDB for structured data) |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Vercel Cron** | Using `vercel.json` `crons` field for 5-minute intervals | Use external service (cron-job.org, EasyCron) — Vercel cron minimum is 1 hour for Hobby plan |
| **Firebase RTDB** | Assuming transactions prevent all race conditions | Transactions work per-path only; use separate paths for concurrent updates (e.g., `rateLimit/{userId}/{endpoint}` not `rateLimit/{userId}`) |
| **FCM (iOS)** | Sending notifications to PWA without app installed | Check `fcmTokens/{token}/isPWA` flag; iOS requires PWA installed (Safari Add to Home) |
| **Auth0 + Playwright** | Using global `storageState` for all tests | Per-test fixtures with `beforeEach` login and `afterEach` logout |
| **Serwist** | Using Turbopack (Next.js 16 default) | Serwist requires Webpack — update `package.json`: `"build": "next build --webpack"` |
| **IndexedDB** | Assuming synchronous reads like localStorage | Always use async/await: `const data = await get(STORES.DEVICE_STATE, 'stove')` |
| **Open-Meteo API** | Caching weather indefinitely | Refresh every 30 minutes (already implemented in `refreshWeatherIfNeeded()` — good pattern) |
| **Firebase Analytics** | Enabling by default in `manifest.json` | Disable until consent obtained: `ga_config.anonymize_ip: true`, check consent before `logEvent()` |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Sequential cron operations** | Timeout errors, partial execution | Parallelize independent tasks with `Promise.all()` | >3 operations OR total time >8s |
| **N+1 FCM token queries** | Slow notification delivery (2-3s per user) | Batch Firebase reads: `db.ref('users').once('value')` instead of per-user queries | >10 active users |
| **Uncompressed notification payloads** | `PayloadTooLarge` errors | Compress JSON, remove whitespace, truncate long strings | Payload >2KB (Android), >4KB (iOS) |
| **Service worker precaching all pages** | Laggy SW installation (5-10s), poor UX | Cache in groups of 10: `precacheController.addToCacheList(chunk)` in loop | >50 static pages |
| **Polling stove API every 1 second** | Stove API rate limits, battery drain | 5-second polling (current implementation is correct) | <5s interval |
| **Storing full weather forecast in RTDB** | Firebase bandwidth costs, slow reads | Store only next 24h: `weatherCache/{lat}_{lon}/forecast` with TTL | Forecast >7 days |
| **Blocking cron on notification delivery** | Cron timeout if FCM is slow | Fire-and-forget: `sendNotification().catch(logError)` (already partially implemented) | >5 notifications per cron run |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Exposing CRON_SECRET in client code** | Attackers can trigger cron manually, DoS attack | Only use in server-side routes, verify header: `Authorization: Bearer ${CRON_SECRET}` |
| **No rate limiting on `/api/notifications/send`** | Spam notifications to all users | Implement persistent rate limiter (Phase 49) BEFORE Phase 52 (notifications) |
| **Storing FCM tokens without encryption** | Token theft → unauthorized notifications | Tokens are not sensitive (per FCM docs), but apply Firebase Security Rules: deny client writes |
| **Analytics tracking before consent** | GDPR violation, €20M fine | Implement consent banner (Phase 54), gate ALL analytics with consent check |
| **Stale Auth0 sessions in E2E tests** | Session fixation attack surface | Always logout in `afterEach`, never commit `storageState.json` |
| **Admin endpoints without auth check** | Unauthorized access to sync, cleanup, etc. | Use `withAdminSecret()` middleware (already implemented for `/api/admin/sync-changelog`) |
| **Unvalidated cron webhook URLs** | SSRF attack, internal network scanning | Whitelist allowed domains: `ALLOWED_CRON_PROVIDERS = ['cron-job.org', 'easycron.com']` |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **No visual feedback during offline command queuing** | User retries → duplicate commands | Show toast: "Comando in coda (offline)" with pending count |
| **Stale cache served without warning** | User acts on wrong state → safety risk | Banner: "⚠️ Dati non aggiornati (X minuti fa)" |
| **Silent notification permission denial** | User expects alerts, never receives them | Persistent banner: "Attiva notifiche per ricevere avvisi stufa" |
| **No progress indicator during cron operations** | User doesn't know if action succeeded | Real-time status: "🔄 Accensione in corso..." via WebSocket or polling |
| **Consent banner blocks entire UI** | User can't access emergency controls | Allow "Essential only" mode → functional controls work, analytics disabled |
| **E2E test failures not visible to developers** | Broken features ship to production | Require CI passing for PRs, Slack notifications on failure |
| **Analytics dashboard shows empty state** | User thinks feature is broken | "Raccogli dati per 24h prima di visualizzare grafici" placeholder |

---

## "Looks Done But Isn't" Checklist

- [ ] **Persistent Rate Limiter:** Often missing cleanup of old rate limit windows — verify garbage collection runs (e.g., delete entries older than 1 hour)
- [ ] **Interactive Notifications:** Often missing platform detection — verify `fcmTokens/{token}/platform` is set and payload changes per platform
- [ ] **Offline Mode:** Often missing staleness indicator — verify UI shows "⚠️ Dati non aggiornati" when cache age >30 seconds
- [ ] **E2E Tests:** Often missing session cleanup — verify `afterEach` logs out and no `storageState.json` committed
- [ ] **Analytics Consent:** Often missing consent persistence — verify Firebase stores `users/{userId}/consent` and checks before every `logEvent()`
- [ ] **Cron Orchestration:** Often missing error handling for parallel tasks — verify `Promise.all()` has `.catch()` on each operation
- [ ] **FCM Payload Size:** Often missing size validation — verify logs show payload size before sending (should be <2KB Android, <4KB iOS)
- [ ] **Weather Cache TTL:** Often missing expiry check — verify `weatherCache/{location}/timestamp` is checked and refetch if stale
- [ ] **Dead Man's Switch:** Often missing alert delivery confirmation — verify notification actually sends when cron goes stale (test by pausing cron for 15 minutes)
- [ ] **PID State Persistence:** Often missing state restoration — verify `pidAutomation/state` is read on every cron run and integral/derivative terms persist

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **In-memory rate limiter bypassed** | MEDIUM | 1. Deploy persistent rate limiter immediately 2. Monitor Firebase RTDB for abuse patterns 3. Temporarily increase rate limits if false positives |
| **Cron timeout causing partial execution** | LOW | 1. Check Vercel logs for `FUNCTION_INVOCATION_TIMEOUT` 2. Increase `maxDuration` to 60s 3. Refactor to orchestrator pattern (Phase 50) |
| **iOS notifications not working** | LOW | 1. Check Firebase Console delivery reports 2. Verify iOS PWA installation 3. Re-register FCM token with correct platform flag |
| **E2E tests flaky in CI** | LOW | 1. Clear `storageState.json` from repo 2. Implement per-test login fixture 3. Add Auth0 mock for CI environment |
| **Stale cache causing safety issue** | HIGH | 1. Immediately disable offline mode in service worker 2. Add prominent "⚠️ DATI NON RECENTI" warning 3. Implement cache staleness headers |
| **GDPR violation (no consent)** | CRITICAL | 1. Disable ALL analytics immediately 2. Deploy consent banner (blocking) 3. Purge historical analytics data 4. Notify users of data deletion |
| **Weather cache stale** | LOW | 1. Force refresh: `DELETE /weatherCache` in Firebase Console 2. Verify `refreshWeatherIfNeeded()` runs in cron 3. Check Open-Meteo API rate limits |
| **FCM payload too large** | MEDIUM | 1. Truncate notification body to 100 chars 2. Remove unnecessary data fields 3. Implement payload size logging before send |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| In-memory rate limiter | Phase 49 (Persistent Rate Limiting) | Load test: 100 requests → only 10 succeed, state persists after 15-min idle |
| Cron timeout | Phase 50 (Cron Configuration) | Monitor: all operations complete <10s, no `FUNCTION_INVOCATION_TIMEOUT` errors |
| Auth0 session leakage | Phase 51 (E2E Test Improvements) | CI passes: 10 consecutive test runs with fresh sessions each time |
| Platform-specific FCM payloads | Phase 52 (Interactive Push Notifications) | Manual test: action buttons work on iOS Safari PWA AND Android Chrome |
| Stale cache without warning | Phase 53 (PWA Offline Improvements) | Offline test: UI shows "⚠️ Dati non aggiornati (X min fa)" after 30 seconds |
| Analytics without consent | Phase 54 (Analytics Dashboard) | Audit: Firebase Analytics disabled until banner accepted, no events before consent |
| Service worker Turbopack conflict | Phase 53 (PWA Offline Improvements) | Build succeeds: `public/sw.js` generated, Webpack used despite Next.js 16 default |
| PID state loss on cold start | Phase 49 (Persistent Rate Limiting) | Cron test: PID integral persists across 2+ hour gap between cron runs |

---

## Sources

**Vercel Serverless & Cron:**
- [Cron Jobs in Next.js: Serverless vs Serverful | Medium](https://yagyaraj234.medium.com/running-cron-jobs-in-nextjs-guide-for-serverful-and-stateless-server-542dd0db0c4c)
- [How to use cron jobs with Vercel? · vercel/vercel · Discussion #5344](https://github.com/vercel/vercel/discussions/5344)
- [What can I do about Vercel Functions timing out? | Vercel Knowledge Base](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out)
- [Testing Next.js Cron Jobs Locally | Medium](https://medium.com/@quentinmousset/testing-next-js-cron-jobs-locally-my-journey-from-frustration-to-solution-6ffb2e774d7a)

**Firebase Rate Limiting & Persistent Storage:**
- [Realtime Database Limits | Firebase](https://firebase.google.com/docs/database/usage/limits)
- [Rate limiting - Firestore and Firebase cloud functions](https://ramblings.mcpher.com/going-serverless-with-firebase/rate-limiting-firestore-and-firebase-cloud-functions/)
- [firebase-functions-rate-limiter GitHub](https://github.com/Jblew/firebase-functions-rate-limiter)

**FCM Interactive Notifications:**
- [Implementing Action Buttons in Push Notifications using Firebase and Notifee | Medium](https://medium.com/@hassem_mahboob/implementing-action-buttons-in-push-notifications-using-firebase-and-notifee-f5743bdb28bc)
- [Firebase Cloud Messaging troubleshooting & FAQ](https://firebase.google.com/docs/cloud-messaging/troubleshooting)
- [Customize a message across platforms | FCM](https://firebase.google.com/docs/cloud-messaging/customize-messages/cross-platform)

**PWA Offline Mode & Serwist:**
- [Build a Next.js 16 PWA with true offline support - LogRocket](https://blog.logrocket.com/nextjs-16-pwa-offline-support/)
- [Offline mode not working · serwist/serwist · Discussion #205](https://github.com/serwist/serwist/discussions/205)
- [Building Native-Like Offline Experience in Next.js PWAs | Fishtank](https://www.getfishtank.com/insights/building-native-like-offline-experience-in-nextjs-pwas)

**Playwright & Auth0 E2E Testing:**
- [End-to-End Testing Auth Flows with Playwright and Next.js](https://testdouble.com/insights/how-to-test-auth-flows-with-playwright-and-next-js)
- [Authentication | Playwright](https://playwright.dev/docs/auth)
- [Mock auth0 login and MFA flow for E2E testing - Auth0 Community](https://community.auth0.com/t/mock-auth0-login-and-mfa-flow-for-e2e-testing-using-playwright/131872)
- [Playwright e2e test fails in CI with real Auth0 login flow · Issue #37158](https://github.com/microsoft/playwright/issues/37158)

**Analytics & GDPR:**
- [GDPR Compliance Checklist for Next.js Apps | Medium](https://medium.com/@kidane10g/gdpr-compliance-checklist-for-next-js-apps-801c9ea75780)
- [Privacy and Security in Firebase](https://firebase.google.com/support/privacy)
- [@next/third-parties Google Analytics compliance · Discussion #67440](https://github.com/vercel/next.js/discussions/67440)
- [Best Privacy-Compliant Analytics Tools for 2026](https://www.mitzu.io/post/best-privacy-compliant-analytics-tools-for-2026)

**Smart Home IoT & Energy Analytics:**
- [Smart energy management: real-time prediction and optimization for IoT-enabled smart homes](https://www.tandfonline.com/doi/full/10.1080/23311916.2024.2390674)
- [Predictive Analytics of Energy Usage by IoT-Based Smart Home Appliances](https://dl.acm.org/doi/10.1145/3426970)

---

*Pitfalls research for: v6.0 Operations, PWA & Analytics*
*Researched: 2026-02-10*
