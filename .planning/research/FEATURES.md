# Feature Landscape - v6.0 Operations, PWA & Analytics

**Domain:** Smart Home IoT Dashboard - Operational Resilience & Analytics
**Researched:** 2026-02-10
**Project:** Pannello Stufa v6.0
**Context:** Subsequent milestone building on complete push notification system, Netatmo integration, stove monitoring, and Next.js 15.5 PWA foundation

---

## Executive Summary

This research covers six new feature areas for v6.0: (1) **Cron automation** for health monitoring and stove-thermostat coordination, (2) **persistent rate limiting** using Firebase instead of in-memory stores, (3) **E2E test improvements** for realistic Auth0 testing, (4) **interactive push notifications** with action buttons, (5) **PWA offline mode** enhancements, and (6) **analytics dashboard** for stove usage tracking and pellet consumption estimation.

**Table stakes are minimal** because the foundation already exists: Firebase RTDB + Firestore, FCM push system, Serwist service worker, Recharts for visualization, and comprehensive monitoring infrastructure. The only truly new functionality is interactive notification actions (requires service worker message handling) and analytics visualization (requires new Firestore queries and chart components).

**Key differentiators** center on: (1) **smart pellet consumption estimation** using ML-inspired heuristics (weather + runtime correlation), (2) **notification actions that actually work offline** via Background Sync, (3) **distributed rate limiting with Firebase transactions** (not just Redis patterns), (4) **cron reliability monitoring** (dead man's switch for automation itself), and (5) **realistic E2E auth testing** that doesn't mock Auth0 away.

**Critical anti-features:** No cron UI builder (cron stays in code), no third-party analytics services (privacy-first, Firebase only), no complex ML models (heuristics sufficient for single-user app), no multi-tenant rate limiting complexity (family app, not SaaS), and no Playwright migration (Cypress already covers 3034 passing tests).

---

## Table Stakes

Features users expect from smart home IoT dashboards. Missing these = product feels incomplete.

### 1. Cron Automation (Background Task Scheduling)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Scheduled health checks** | Smart home devices poll status every 5-30min automatically | Low | Vercel Cron (cron.yaml), /api/scheduler/check already exists |
| **Auto-coordination tasks** | Stove-thermostat coordination shouldn't require manual triggers | Low | Existing logic in /api/stove/ignite, needs cron trigger |
| **Dead man's switch monitoring** | If cron fails, system alerts user within 10-15min | Medium | Firebase lastRun timestamp + monitoring UI |
| **Configurable intervals** | Different tasks run at different frequencies (5min vs 1hr) | Low | Environment variables per endpoint |
| **Graceful degradation** | If external API fails (Netatmo, stove), cron doesn't crash | Low | Try-catch + error logging already in place |

**Why table stakes:** Home Assistant, SmartThings, and all major platforms auto-poll devices. Manual-only operation feels broken. Users expect "set schedule and forget."

**Existing foundation:** The app already has /api/scheduler/check (stove health monitoring), /api/netatmo/coordination (stove-thermostat logic), and Firebase monitoring infrastructure. Just needs cron triggers.

**Complexity:** LOW - Vercel Cron is declarative YAML configuration pointing to existing API routes.

---

### 2. Persistent Rate Limiting (Distributed Counters)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **API rate limits** | Prevent accidental API quota exhaustion (Netatmo 50 req/10s) | Medium | Firebase transactions for atomic increments |
| **Per-user quotas** | Prevent one user/device from consuming all quota | Low | Single-user app, but good practice |
| **Time-window buckets** | Sliding window or fixed window (1min, 10s, 1hr) | Medium | Store currentBucket + previousBucket counters |
| **Graceful rejection** | HTTP 429 with Retry-After header | Low | NextResponse with custom headers |
| **Cross-instance consistency** | Works across multiple Vercel serverless instances | High | Firebase transactions provide atomicity |

**Why table stakes:** Vercel serverless = stateless instances. In-memory rate limiting doesn't work across edge functions. Firebase/Redis required for distributed systems.

**Existing foundation:** Firebase RTDB already in use. Atomic operations via `transaction()` method available.

**Complexity:** MEDIUM - Distributed rate limiting is non-trivial (race conditions, clock skew), but Firebase transactions solve core problem. Sliding window algorithm adds complexity.

---

### 3. E2E Test Improvements (Realistic Auth Testing)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Auth0 login flow testing** | Can't ship auth changes without E2E coverage | Medium | Use Auth0 test tenant + real OAuth flow |
| **Session persistence** | Test that sessions survive page reloads | Low | Cypress cy.getCookie(), cy.setCookie() |
| **Protected route access** | Verify middleware blocks unauthenticated users | Low | cy.visit() + expect redirect to /auth/login |
| **Token refresh testing** | Verify refresh tokens work before 24hr expiry | Medium | Cypress clock manipulation or real wait |
| **Parallel test isolation** | Tests don't interfere (separate test users) | Medium | Auth0 test tenant supports multiple users |

**Why table stakes:** Auth0 has CVE-2025-29927 (middleware bypass vulnerability). Testing auth is critical. Mocking auth completely defeats the purpose of E2E tests.

**Existing foundation:** 3034 passing Cypress tests, TEST_MODE bypass in middleware, existing /auth/login and /auth/callback routes.

**Complexity:** MEDIUM - Auth0 recommends programmatic login via custom database connection or test tenant. Clock manipulation for token refresh requires careful Cypress setup.

**Explicit anti-feature:** Do NOT migrate to Playwright. Cypress already works, migration would take 3 weeks full-time for 500-3000 tests with marginal benefit for single-user app.

---

### 4. Interactive Push Notifications (Action Buttons)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Notification actions** | "Spegni stufa", "Posticipa 30min" buttons in notification | High | Service worker notificationclick event handler |
| **Offline action queuing** | If offline, queue action via Background Sync | High | IndexedDB + Background Sync API |
| **Action feedback** | After tapping "Spegni", show success toast | Medium | Service worker → client messaging via postMessage |
| **Permission prompting** | Don't show actions until notification permission granted | Low | Check Notification.permission before showing |
| **Platform compatibility** | Works on Android Chrome, iOS Safari PWA standalone | High | iOS Safari supports actions only in standalone PWA mode |

**Why table stakes:** Modern smart home apps (Home Assistant, SmartThings) allow direct action from notifications. "View only" notifications feel dated in 2026.

**Existing foundation:** FCM push working, Serwist service worker installed, existing /api/stove/off endpoint for shutdown action.

**Complexity:** HIGH - Service worker notificationclick handler must parse action, call API (or queue via Background Sync if offline), handle errors, show feedback to user. iOS Safari requires standalone PWA mode (not browser).

**Critical dependency:** Requires notification permission already granted. If denied, actions won't display.

---

### 5. PWA Offline Mode Enhancements

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Offline page with status** | Show "You're offline" with last known device states | Low | Serwist already caches /offline page |
| **Cache-first for static assets** | Instant load times for UI components | Low | Serwist runtimeCaching config |
| **Network-first for API routes** | Fresh data when online, fallback to cache when offline | Medium | Serwist strategy per route pattern |
| **Install prompt** | Encourage users to install PWA (increases engagement) | Medium | beforeinstallprompt event + custom UI |
| **Background Sync** | Queue failed API requests, retry when online | High | Background Sync API + IndexedDB queue |

**Why table stakes:** PWAs in 2026 are expected to work offline. Users in areas with spotty WiFi (basements, rural) need graceful degradation. Install prompts increase retention by 2-3x.

**Existing foundation:** Serwist already installed, /offline page exists, manifest.json configured, service worker registered.

**Complexity:** LOW-MEDIUM - Install prompt requires beforeinstallprompt event handling + localStorage to track dismissals. Background Sync requires service worker sync event handler + IndexedDB.

**Platform quirks:** iOS Safari shows install prompt only in standalone browsing context. Android Chrome supports beforeinstallprompt event natively.

---

### 6. Analytics Dashboard (Usage Tracking & Insights)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Usage history timeline** | "Stufa accesa 4h today, 6h yesterday" line chart | Medium | Firestore query: stove status changes → aggregate runtime |
| **Pellet consumption estimate** | "~3kg consumed today" based on power level + runtime | High | Heuristic formula: powerLevel × runtime × pelletRate |
| **Weekly/monthly trends** | Compare this week vs last week usage | Medium | Recharts line chart with comparison mode |
| **Weather correlation** | "High usage correlates with outdoor temp < 10°C" | High | Join stove runtime with Open-Meteo temperature data |
| **Cost estimation** | "€15 pellet cost this month" if pelletPricePerKg provided | Low | Simple multiplication: consumption × price |

**Why table stakes:** Energy monitoring is core to smart home value prop in 2026. Users want to see "how much am I using?" and "am I wasting energy?" Google Nest, Ecobee, Vivint all show usage dashboards.

**Existing foundation:** Recharts already installed, Firebase RTDB logs stove status changes, Open-Meteo weather data already fetched and stored.

**Complexity:** MEDIUM-HIGH - Requires new Firestore collection for aggregated stats (to avoid scanning all status changes), heuristic pellet consumption formula (no direct pellet sensor), weather correlation algorithm (join timestamps).

**Critical anti-feature:** Do NOT integrate third-party analytics (Google Analytics, Mixpanel). Privacy-first, family app. All data stays in Firebase.

---

## Differentiators

Features that set the product apart. Not expected, but highly valued.

### 1. Smart Pellet Consumption Estimation (ML-Inspired Heuristics)

**What:** Estimate pellet consumption without physical sensor using power level, runtime, and weather correlation.

**Why valuable:** Pellet stoves don't have built-in pellet sensors. Most users manually track consumption ("filled hopper 3 days ago, filled again today = 15kg / 3 days = 5kg/day"). Automated estimation is a game-changer.

**How it works:**
```javascript
// Heuristic formula (inspired by machine learning regression but simpler)
const pelletConsumptionKg = (powerLevel / 5) * (runtimeHours / 1) * PELLET_RATE_KG_PER_HOUR;
const PELLET_RATE_KG_PER_HOUR = 0.5; // Calibrated via user input

// Weather correlation adjustment
if (outdoorTemp < 5) {
  pelletConsumptionKg *= 1.2; // 20% higher consumption in extreme cold
} else if (outdoorTemp > 15) {
  pelletConsumptionKg *= 0.8; // 20% lower in mild weather
}
```

**Complexity:** HIGH - Requires:
1. Firestore aggregation queries for daily runtime by power level
2. Weather data join (outdoor temp from Open-Meteo at stove ignition time)
3. User calibration UI ("I refilled 15kg today, adjust estimates")
4. Accuracy improves over time as calibration data accumulates

**Competitive advantage:** Home Assistant pellet integrations require hardware sensors or manual logging. This is software-only estimation.

**Confidence:** MEDIUM - Formula is unverified, but research shows 80%+ accuracy for ML models in building energy prediction. Heuristic approach should achieve 70-80% with calibration.

---

### 2. Offline-Capable Notification Actions (Background Sync)

**What:** Tapping "Spegni stufa" in notification works even if phone is offline. Action queues via Background Sync, executes when connection restored.

**Why valuable:** Most smart home apps fail silently when offline. Users tap "Turn off" → nothing happens → frustration. This app queues the action and retries automatically.

**How it works:**
```javascript
// Service worker notificationclick handler
self.addEventListener('notificationclick', (event) => {
  if (event.action === 'turn_off') {
    event.waitUntil(
      fetch('/api/stove/off', { method: 'POST' })
        .catch(() => {
          // Offline: queue via Background Sync
          return self.registration.sync.register('stove-off-action');
        })
    );
  }
});

// Background Sync handler
self.addEventListener('sync', (event) => {
  if (event.tag === 'stove-off-action') {
    event.waitUntil(fetch('/api/stove/off', { method: 'POST' }));
  }
});
```

**Complexity:** HIGH - Requires:
1. Service worker message routing (notificationclick → API call)
2. Background Sync registration when offline
3. IndexedDB queue for pending actions (in case sync fails)
4. User feedback via client messaging (postMessage to app window)

**Competitive advantage:** Home Assistant requires internet connection for all actions. This works offline.

**Confidence:** HIGH - Background Sync API is well-documented, supported in Chrome/Edge/Samsung Internet, gracefully degrades in Safari (action executes immediately or fails).

---

### 3. Distributed Rate Limiting with Firebase Transactions (Not Redis)

**What:** Rate limiting that works across Vercel serverless instances using Firebase RTDB transactions instead of Redis.

**Why valuable:** Most tutorials recommend Redis for distributed rate limiting. Firebase RTDB is already in the stack, avoids new dependency + monthly Redis cost.

**How it works:**
```javascript
// Sliding window rate limiting with Firebase transactions
import { ref, runTransaction } from 'firebase/database';

async function checkRateLimit(userId, limit, windowSeconds) {
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);
  const rateLimitRef = ref(db, `rateLimit/${userId}`);

  const result = await runTransaction(rateLimitRef, (current) => {
    if (!current) current = { requests: [] };

    // Remove expired requests
    current.requests = current.requests.filter(ts => ts > windowStart);

    // Check limit
    if (current.requests.length >= limit) {
      return; // Abort transaction (rate limited)
    }

    // Add current request
    current.requests.push(now);
    return current;
  });

  return result.committed; // true = allowed, false = rate limited
}
```

**Complexity:** MEDIUM-HIGH - Firebase transactions solve race conditions, but:
1. Must handle transaction conflicts (automatic retry)
2. Sliding window requires filtering expired timestamps (O(n) scan)
3. Cleanup of old data required (prevent unbounded growth)

**Competitive advantage:** No Redis dependency, works with existing Firebase setup, atomic operations guaranteed.

**Confidence:** HIGH - Firebase transactions provide strong consistency. Pattern is documented in Firebase docs and community guides.

---

### 4. Cron Reliability Monitoring (Dead Man's Switch for Automation)

**What:** Monitor the cron automation itself. If cron stops running (Vercel issue, misconfiguration), alert user within 10-15 minutes.

**Why valuable:** Most automation systems assume cron "just works." When it breaks silently, critical tasks stop (stove health checks, coordination). This detects and alerts immediately.

**How it works:**
```javascript
// Each cron job updates lastRun timestamp
// /api/scheduler/check
await update(ref(db, 'monitoring/cronHealth/healthCheck'), {
  lastRun: Date.now(),
  status: 'success'
});

// Client-side dead man's switch monitor (runs in StoveCard polling)
const lastHealthCheck = await get(ref(db, 'monitoring/cronHealth/healthCheck/lastRun'));
const minutesSinceLastRun = (Date.now() - lastHealthCheck.val()) / 60000;

if (minutesSinceLastRun > 15) {
  // CRITICAL: Cron is down, show alert
  showNotification({
    title: 'Sistema di Monitoraggio Non Funzionante',
    body: `Ultimo check: ${minutesSinceLastRun} minuti fa`,
    urgency: 'critical'
  });
}
```

**Complexity:** MEDIUM - Requires:
1. Timestamp tracking per cron job
2. Client-side monitoring logic (piggybacks on existing 5s polling)
3. Configurable thresholds (15min for critical, 60min for non-critical)
4. Alert deduplication (don't spam user every 5s)

**Competitive advantage:** Home Assistant doesn't monitor its own automations. This is self-healing infrastructure.

**Confidence:** HIGH - Pattern is simple timestamp comparison, well-tested in production monitoring systems.

---

### 5. Realistic Auth0 E2E Testing (No Mocks)

**What:** E2E tests use real Auth0 test tenant with actual OAuth flow, not mocked sessions.

**Why valuable:** CVE-2025-29927 showed that middleware-only auth protection is insufficient. Mocking auth in tests creates false confidence. Real OAuth flow catches real bugs.

**How it works:**
```javascript
// cypress/support/commands.js
Cypress.Commands.add('loginAuth0', (username, password) => {
  cy.visit('/auth/login');
  cy.origin(Cypress.env('AUTH0_DOMAIN'), { args: { username, password } }, ({ username, password }) => {
    cy.get('input[name=username]').type(username);
    cy.get('input[name=password]').type(password);
    cy.get('button[type=submit]').click();
  });
  cy.url().should('include', '/'); // Redirected to homepage
});

// Test
it('protects /dashboard from unauthenticated users', () => {
  cy.visit('/dashboard');
  cy.url().should('include', '/auth/login?returnTo=%2Fdashboard');

  cy.loginAuth0('test@example.com', 'TestPassword123!');
  cy.url().should('eq', Cypress.config().baseUrl + '/dashboard');
});
```

**Complexity:** MEDIUM - Requires:
1. Auth0 test tenant setup (separate from production)
2. Cypress cy.origin() for cross-domain auth flow
3. Cookie/session persistence between tests
4. Test user cleanup (or pre-seeded test users)

**Competitive advantage:** Most tutorials mock auth completely. This catches real auth bugs (CSRF, token expiry, redirect loops).

**Confidence:** HIGH - Auth0 official docs recommend this pattern. Cypress cy.origin() stable since v9.6.0.

---

## Anti-Features

Features to explicitly NOT build. Scope creep prevention.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Cron UI builder** | Over-engineering for single-user app. Cron syntax in code is fine for 5-10 jobs. | Keep cron schedules in vercel.json or cron.yaml. Document in /docs/cron.md. |
| **Third-party analytics (GA, Mixpanel)** | Privacy invasion, adds external dependency, not needed for family app. | Use Firebase Firestore for all analytics. Custom dashboard with Recharts. |
| **Complex ML models for pellet estimation** | Overkill for single stove. Heuristic formula sufficient with calibration. | Simple formula: powerLevel × runtime × calibrationFactor. User adjusts factor. |
| **Multi-tenant rate limiting** | App is single-user/family. Distributed rate limiting needed for Vercel, but not multi-tenant. | Use Firebase transactions for atomicity, but single userId or global limits. |
| **Playwright migration** | Cypress already has 3034 passing tests. Playwright is 2.3x faster but migration takes 3 weeks. | Keep Cypress. Add new tests in Cypress. Playwright ROI too low for this app. |
| **Real-time pellet sensor integration** | Pellet stoves don't have standard pellet sensors. Hardware DIY is out of scope. | Software estimation only. Document "How to add sensor" for advanced users. |
| **Notification action undo** | "Undo" button after action requires complex state management. Confirmation dialogs sufficient. | Use confirmable actions ("Hold to confirm") instead of undo. |
| **Periodic Background Sync** | Chrome-only API, battery drain, not needed for family app with manual triggers. | Use regular Background Sync for offline action queuing only. |
| **Advanced cron scheduling (dynamic schedules)** | Changing cron schedules dynamically requires database + scheduler service. Static is fine. | If user needs custom schedule, they edit vercel.json and redeploy (rare). |
| **Redis for rate limiting** | Adds monthly cost (~$10-30), new dependency, overkill when Firebase already in stack. | Use Firebase RTDB transactions for distributed counters. |

---

## Feature Dependencies

Dependencies between features (must build X before Y).

```
Cron Automation
  ↓ (requires baseline automation)
Cron Reliability Monitoring

Interactive Push Notifications
  ↓ (requires service worker message handling)
Offline-Capable Notification Actions

PWA Offline Mode (install prompt)
  ↓ (no dependency, but enhances UX)
Interactive Push Notifications

Persistent Rate Limiting
  ↓ (no dependency, independent feature)
(none)

Analytics Dashboard
  ↓ (requires runtime data)
Cron Automation (optional but recommended for data accumulation)

E2E Test Improvements
  ↓ (no dependency, but validates all features)
All features
```

**Critical path:**
1. Persistent Rate Limiting (independent, protects APIs)
2. Cron Automation (enables background tasks)
3. Cron Reliability Monitoring (ensures automation works)
4. Interactive Push Notifications (core UX improvement)
5. PWA Offline Mode (install prompt + Background Sync)
6. Analytics Dashboard (requires data from automation)
7. E2E Test Improvements (validates everything)

**Parallelizable:**
- Persistent Rate Limiting (independent)
- PWA Install Prompt (independent of notifications)
- E2E Auth Testing (independent of features, validates auth only)

---

## MVP Recommendation

Prioritize features for maximum value with minimum complexity.

### Phase 1: Operational Resilience (Weeks 1-2)

**Build first:**
1. **Persistent Rate Limiting** - Protects Netatmo API from quota exhaustion (MEDIUM complexity, HIGH value)
2. **Cron Automation** - Makes existing health checks and coordination actually run (LOW complexity, CRITICAL value)
3. **Cron Reliability Monitoring** - Alerts if automation breaks (MEDIUM complexity, HIGH value)

**Rationale:** These features are foundational. Without them, the app relies on manual user polling (bad UX) and risks API quota issues (breaks app).

**Test coverage:** Add unit tests for rate limiting (Firebase transaction logic), integration tests for cron endpoints (call /api/scheduler/check directly), monitoring UI tests (simulate lastRun > 15min).

---

### Phase 2: Interactive Engagement (Weeks 3-4)

**Build next:**
4. **Interactive Push Notifications** - Action buttons in notifications (HIGH complexity, HIGH value)
5. **PWA Install Prompt** - Encourage installation for better offline support (LOW complexity, MEDIUM value)

**Defer to later:**
- Offline-capable notification actions (Background Sync) - HIGH complexity, MEDIUM value (most users have internet)

**Rationale:** Notification actions are the biggest UX improvement ("Spegni stufa" from notification). Install prompt increases retention. Background Sync is nice-to-have, not critical.

**Test coverage:** Cypress E2E tests for install prompt flow, service worker tests for notificationclick handler.

---

### Phase 3: Analytics & Insights (Weeks 5-6)

**Build last:**
6. **Analytics Dashboard** - Usage timeline, pellet consumption, trends (MEDIUM-HIGH complexity, MEDIUM value)

**MVP scope:**
- Daily/weekly runtime line chart (Recharts)
- Simple pellet consumption estimate (heuristic formula, no weather correlation yet)
- Cost estimation if user enters pellet price

**Defer to v6.1:**
- Weather correlation (HIGH complexity)
- ML-inspired consumption refinement (HIGH complexity)
- Monthly comparisons (LOW complexity but lower priority)

**Rationale:** Analytics are valuable but not critical. Users can live without them initially. Prioritize operational reliability first.

**Test coverage:** Unit tests for consumption formula, Firestore query tests, snapshot tests for chart components.

---

### Phase 4: Testing & Quality (Week 7)

**Build finally:**
7. **E2E Test Improvements** - Realistic Auth0 testing (MEDIUM complexity, HIGH value for long-term stability)

**Scope:**
- Auth0 test tenant setup
- Login flow E2E test (cy.origin)
- Protected route access test
- Session persistence test

**Defer to later:**
- Token refresh testing (requires 24hr wait or complex clock manipulation)
- Parallel test isolation (single-user app, less critical)

**Rationale:** Auth tests validate the security foundation. Should be done before v6.0 ships, but can be done in parallel with Phase 3.

**Test coverage:** E2E tests themselves are the deliverable. Add tests for login, logout, middleware protection, session persistence.

---

## Deferred Features (Out of Scope for v6.0)

**Save for v6.1 or later:**

1. **Weather correlation in pellet consumption** - HIGH complexity, requires timestamp join + aggregation. Heuristic formula sufficient for v6.0.

2. **Notification action undo** - Complex state management. Confirmation dialogs sufficient for v6.0.

3. **Periodic Background Sync** - Chrome-only, battery drain concerns. Regular Background Sync sufficient.

4. **Token refresh E2E testing** - Requires 24hr wait or complex Cypress clock setup. Manual testing acceptable for v6.0.

5. **Dynamic cron scheduling** - User can edit vercel.json if needed (rare). Static schedules sufficient.

6. **Real-time pellet sensor integration** - Hardware out of scope. Software estimation only.

7. **Playwright migration** - No ROI for 3 weeks migration time. Cypress works fine.

8. **Advanced analytics (predictive usage)** - ML models overkill for family app. Heuristics sufficient.

---

## Complexity Summary

| Feature | Complexity | Why | Risk Level |
|---------|-----------|-----|------------|
| Cron Automation | LOW | Vercel Cron = YAML config + existing endpoints | LOW |
| Cron Reliability Monitoring | MEDIUM | Timestamp tracking + client-side alert logic | LOW |
| Persistent Rate Limiting | MEDIUM-HIGH | Firebase transactions + sliding window algorithm | MEDIUM |
| E2E Test Improvements | MEDIUM | Auth0 test tenant + cy.origin() | MEDIUM |
| Interactive Push Notifications | HIGH | Service worker notificationclick + postMessage | HIGH |
| PWA Install Prompt | LOW-MEDIUM | beforeinstallprompt + localStorage tracking | LOW |
| Offline Notification Actions | HIGH | Background Sync + IndexedDB queue | HIGH |
| Analytics Dashboard | MEDIUM-HIGH | Firestore aggregation + heuristic formula + Recharts | MEDIUM |

**Highest risk:** Interactive notifications with Background Sync (service worker complexity, iOS compatibility issues).

**Lowest risk:** Cron automation, PWA install prompt (well-documented patterns, minimal code).

---

## Sources

### Cron Automation & Scheduling
- [Schedule - Home Assistant](https://www.home-assistant.io/integrations/schedule/)
- [Our complete cron job guide for 2026 - UptimeRobot](https://uptimerobot.com/knowledge-hub/cron-monitoring/cron-job-guide/)
- [How To Create Schedules in Home Assistant - SmartHomeScene](https://smarthomescene.com/guides/how-to-create-schedules-in-home-assistant/)
- [Home Assistant automation scheduling patterns - Community Discussion](https://community.home-assistant.io/t/full-featured-scheduling-based-on-cron/83627)

### Distributed Rate Limiting
- [Smart DDoS Protection & Rate Limiting for Firebase Functions - Flames Shield](https://flamesshield.com/features/ddos/)
- [Tutorial: Firestore Rate Limiting - Fireship.io](https://fireship.io/lessons/how-to-rate-limit-writes-firestore/)
- [How to Build a Distributed Rate Limiter with Redis - OneUpTime](https://oneuptime.com/blog/post/2026-01-21-redis-distributed-rate-limiter/view)
- [Rate Limiting in Distributed System - DEV Community](https://dev.to/smiah/rate-limiting-in-distributed-system-3h59)
- [How to Build Distributed Counters with Redis - OneUpTime](https://oneuptime.com/blog/post/2026-01-27-redis-distributed-counters/view)

### PWA Push Notifications with Actions
- [Re-engageable Notifications and Push APIs - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/Re-engageable_Notifications_Push)
- [Mastering Browser-Based Alerts: Advanced Web Push Notifications in Home Assistant - Newerest Space](https://newerest.space/mastering-browser-alerts-web-push-home-assistant/)
- [How to Set Up Push Notifications for Your PWA - MobiLoud](https://www.mobiloud.com/blog/pwa-push-notifications)
- [Innovations and Trends in PWA Push Notifications - AppMaster](https://appmaster.io/blog/innovations-and-trends-in-pwa-push-notifications)
- [Using Push Notifications in PWAs: The Complete Guide - MagicBell](https://www.magicbell.com/blog/using-push-notifications-in-pwas)

### PWA Offline Mode & Background Sync
- [Offline and background operation - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
- [Background Sync in PWAs: Service Worker Guide - Zee Palm](https://www.zeepalm.com/blog/background-sync-in-pwas-service-worker-guide)
- [Synchronize and update a PWA in the background - Microsoft Edge Docs](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/background-syncs)
- [How to periodically synchronize data in the background - web.dev](https://web.dev/patterns/web-apps/periodic-background-sync)
- [Build a Next.js 16 PWA with true offline support - LogRocket](https://blog.logrocket.com/nextjs-16-pwa-offline-support/)

### PWA Install Prompts
- [Installation prompt - web.dev](https://web.dev/learn/pwa/installation-prompt)
- [Making PWAs installable - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [Trigger installation from your PWA - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt)
- [Patterns for promoting PWA installation - web.dev](https://web.dev/articles/promote-install)
- [Best Practices for PWA Installation - Midday](https://www.midday.io/blog/best-practices-for-pwa-installation)

### E2E Testing with Auth0
- [End-to-End Testing with Cypress and Auth0 - Auth0 Blog](https://auth0.com/blog/end-to-end-testing-with-cypress-and-auth0/)
- [How to Cover Auth0's Login Form with Tests - Auth0 Blog](https://auth0.com/blog/testing-auth0-login-with-cypress/)
- [Cypress vs Playwright: I Ran 500 E2E Tests in Both - Medium](https://medium.com/lets-code-future/cypress-vs-playwright-i-ran-500-e2e-tests-in-both-heres-what-broke-2afc448470ee)
- [Playwright vs Cypress: The 2026 Enterprise Testing Guide - Medium](https://devin-rosario.medium.com/playwright-vs-cypress-the-2026-enterprise-testing-guide-ade8b56d3478)

### Energy Analytics & Visualization
- [The Best Energy Monitoring Tools in 2026 - Vivint](https://www.vivint.com/resources/article/energy-monitoring)
- [Recharts: How to Use it and Build Analytics Dashboards - Embeddable](https://embeddable.com/blog/what-is-recharts)
- [How to use Recharts to visualize analytics data - PostHog](https://posthog.com/tutorials/recharts)
- [The Top 5 React Chart Libraries to Know in 2026 - Syncfusion](https://www.syncfusion.com/blogs/post/top-5-react-chart-libraries)
- [How to use Next.js and Recharts to build an information dashboard - Ably](https://ably.com/blog/informational-dashboard-with-nextjs-and-recharts)

### Pellet Consumption Tracking
- [Smart ways to cut your pellet consumption in 2026 - SiskelEbert](https://www.siskelebert.org/06-166745-smart-ways-to-cut-your-pellet-consumption-in-2026-adopt-them-now/)
- [Tracking wood pellet consumption - Home Assistant Community](https://community.home-assistant.io/t/tracking-wood-pellet-consumption/783104)
- [Machine Learning Algorithms for Energy Consumption Prediction - Springer](https://link.springer.com/chapter/10.1007/978-3-031-80817-3_5)
- [Novel approach to energy consumption estimation in smart homes - Frontiers](https://www.frontiersin.org/journals/energy-research/articles/10.3389/fenrg.2024.1361803/full)

---

**Confidence Level:** HIGH for table stakes and anti-features (well-documented patterns, existing foundation), MEDIUM for differentiators (some novel approaches like Firebase rate limiting, pellet estimation heuristics require validation).

**Last Updated:** 2026-02-10
