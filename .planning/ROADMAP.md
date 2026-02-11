# Roadmap: Pannello Stufa

## Milestones

- ✅ **v1.0 Push Notifications** — Phases 1-5 (shipped 2026-01-26)
- ✅ **v2.0 Netatmo Complete Control** — Phases 6-10 (shipped 2026-01-28)
- ✅ **v3.0 Design System Evolution** — Phases 11-18 (shipped 2026-01-30)
- ✅ **v3.1 Design System Compliance** — Phases 19-24 (shipped 2026-02-02)
- ✅ **v3.2 Dashboard & Weather** — Phases 25-29 (shipped 2026-02-03)
- ✅ **v4.0 Advanced UI Components** — Phases 30-36 (shipped 2026-02-05)
- ✅ **v5.0 TypeScript Migration** — Phases 37-43 (shipped 2026-02-08)
- ✅ **v5.1 Tech Debt & Code Quality** — Phases 44-48 (shipped 2026-02-10)
- 🚧 **v6.0 Operations, PWA & Analytics** — Phases 49-54 (in progress)

## Phases

<details>
<summary>✅ v5.1 Tech Debt & Code Quality (Phases 44-48) — SHIPPED 2026-02-10</summary>

- [x] Phase 44: Library Strict Mode Foundation (7/7 plans)
- [x] Phase 45: Component Strict Mode Compliance (8/8 plans)
- [x] Phase 46: API and Page Strict Mode Compliance (8/8 plans)
- [x] Phase 47: Test Strict Mode and Index Access (10/10 plans)
- [x] Phase 48: Dead Code Removal and Final Verification (6/6 plans)

</details>

<details>
<summary>✅ v5.0 TypeScript Migration (Phases 37-43) — SHIPPED 2026-02-08</summary>

- [x] Phase 37: TypeScript Foundation (3/3 plans)
- [x] Phase 38: Library Migration (13/13 plans)
- [x] Phase 39: UI Components Migration (11/11 plans)
- [x] Phase 40: API Routes Migration (7/7 plans)
- [x] Phase 41: Pages Migration (7/7 plans)
- [x] Phase 42: Test Migration (7/7 plans)
- [x] Phase 43: Verification (8/8 plans)

</details>

<details>
<summary>✅ Earlier milestones (v1.0-v4.0)</summary>

See `.planning/milestones/` for full archives.

</details>

## 🚧 v6.0 Operations, PWA & Analytics (In Progress)

**Milestone Goal:** Rendere l'app operativa al 100% (cron, resilienza), migliorare l'esperienza mobile (notifiche interattive, offline, installazione PWA), e aggiungere analytics storiche su utilizzo stufa e correlazione meteo.

### Phase 49: Persistent Rate Limiting
**Goal**: Firebase RTDB-backed rate limiter with transaction safety replaces in-memory Map, preventing DoS attacks via cold start exploitation and API quota exhaustion.

**Depends on**: Nothing (foundation phase)

**Requirements**: RATE-01, RATE-02, RATE-03, RATE-04, RATE-05

**Success Criteria** (what must be TRUE):
  1. Rate limits persist across Vercel cold starts and deployments (no reset to zero)
  2. Sliding window algorithm prevents notification spam even during state loss scenarios
  3. Netatmo API rate limiter prevents quota exhaustion (50 req/10s limit enforced)
  4. Expired rate limit windows are automatically cleaned up without manual intervention
  5. Feature flag allows gradual rollout with fallback to in-memory limiter if Firebase unavailable

**Plans**: 4 plans

Plans:
- [x] 49-01-PLAN.md — Persistent notification rate limiter (TDD, Firebase RTDB transactions)
- [x] 49-02-PLAN.md — Persistent Netatmo API rate limiter (TDD, dual-window: 50/10s + 400/1h)
- [x] 49-03-PLAN.md — Persistent coordination throttle (TDD, 30-min global window)
- [x] 49-04-PLAN.md — Feature flag integration + consumer migration (async API, fallback)

### Phase 50: Cron Automation Configuration
**Goal**: Background automation operational with external HTTP scheduler triggering health monitoring, coordination checks, and dead man's switch tracking every 5 minutes.

**Depends on**: Phase 49 (rate limiter prevents notification spam from cron)

**Requirements**: CRON-01, CRON-02, CRON-03, CRON-04, CRON-05

**Success Criteria** (what must be TRUE):
  1. Health monitoring runs automatically every 5 minutes without manual trigger
  2. Stove-thermostat coordination executes automatically every 5 minutes
  3. Cron orchestrator completes all operations within Vercel timeout (fire-and-forget pattern)
  4. Dead man's switch alerts if cron stops running (>15 min without execution)
  5. Cron execution logs visible in monitoring dashboard with timestamp and duration

**Plans**: 4 plans

Plans:
- [x] 50-01-PLAN.md — GitHub Actions cron workflow (5-min schedule, dual endpoint trigger)
- [x] 50-02-PLAN.md — Cron execution logger service (TDD, Firebase RTDB)
- [x] 50-03-PLAN.md — Scheduler logging integration + cron-executions API route
- [x] 50-04-PLAN.md — End-to-end verification (secrets config + manual test)

### Phase 51: E2E Test Improvements
**Goal**: Realistic Auth0 testing with session state caching validates security foundation and critical user flows without mocking authentication.

**Depends on**: Nothing (independent validation phase, can run parallel to Phase 52-53)

**Requirements**: E2E-01, E2E-02, E2E-03, E2E-04, E2E-05, E2E-06

**Success Criteria** (what must be TRUE):
  1. E2E tests use real Auth0 OAuth flow without mocked authentication
  2. Session state caching prevents redundant logins across test runs
  3. Critical flow tests pass: stove ignition, thermostat schedule change, notification delivery
  4. GitHub Actions CI runs E2E tests automatically on every PR
  5. Test flakiness eliminated (Auth0 rate limiting and session leakage avoided)

**Plans**: 4 plans (3 original + 1 gap closure)

Plans:
- [x] 51-01-PLAN.md — Playwright config + Auth0 auth setup + session caching + helpers
- [x] 51-02-PLAN.md — Auth smoke tests + stove ignition + thermostat schedule flow tests
- [x] 51-03-PLAN.md — Notification delivery flow test + GitHub Actions CI workflow
- [x] 51-04-PLAN.md — Gap closure: add missing dotenv dependency to package.json

### Phase 52: Interactive Push Notifications
**Goal**: Action buttons in notifications allow direct device control ("Spegni stufa", "Imposta manuale") with platform-specific payloads for iOS and Android.

**Depends on**: Phase 49 (rate limiter prevents action button spam)

**Requirements**: PUSH-01, PUSH-02, PUSH-03, PUSH-04, PUSH-05, PUSH-06

**Success Criteria** (what must be TRUE):
  1. Stove notifications have "Spegni stufa" action button that executes shutdown directly
  2. Thermostat notifications have "Imposta manuale" action button for temperature override
  3. Action buttons work on Android Chrome and iOS Safari PWA (platform-specific payloads)
  4. Action buttons function offline via Background Sync (queue and execute on reconnect)
  5. Platforms without action button support gracefully degrade to tap-to-open behavior

**Plans**: 3 plans

Plans:
- [x] 52-01-PLAN.md — Action constants, feature detection, and server-side FCM payload enhancement
- [x] 52-02-PLAN.md — Service worker action display and notificationclick handler with offline support
- [x] 52-03-PLAN.md — Notification trigger wiring and unit tests

### Phase 53: PWA Offline Improvements
**Goal**: Offline mode enhanced with staleness indicators, command queuing UI, and guided PWA install prompt for safer device control and improved mobile experience.

**Depends on**: Phase 52 (notification actions can queue offline via Background Sync)

**Requirements**: PWA-01, PWA-02, PWA-03, PWA-04, PWA-05, PWA-06, PWA-07, PWA-08

**Success Criteria** (what must be TRUE):
  1. Offline banner visible when connection lost with timestamp of last successful update
  2. Device cards show staleness indicator when cached data older than 30 seconds
  3. Device controls disabled when offline to prevent actions on stale state
  4. Pending offline commands visible to user with sync confirmation toast on reconnect
  5. PWA install prompt appears after 2+ visits with guided UI and 30-day dismissal tracking

**Plans**: 5 plans

Plans:
- [x] 53-01-PLAN.md — Enhanced OfflineBanner with Ember Noir styling and command queue UI
- [x] 53-02-PLAN.md — Staleness detection service and useDeviceStaleness hook (TDD)
- [x] 53-03-PLAN.md — Device cards offline safety (control hiding, staleness UI, command expiration)
- [x] 53-04-PLAN.md — PWA install prompt bottom sheet with visit tracking and iOS fallback
- [x] 53-05-PLAN.md — Integration wiring (InstallPrompt in layout, reconnect sync toast)

### Phase 54: Analytics Dashboard
**Goal**: GDPR-compliant usage analytics with pellet consumption estimation, historical trends, weather correlation, and user calibration for stove optimization insights.

**Depends on**: Phase 50 (cron enables data collection aggregation)

**Requirements**: ANLY-01, ANLY-02, ANLY-03, ANLY-04, ANLY-05, ANLY-06, ANLY-07, ANLY-08, ANLY-09, ANLY-10, ANLY-11

**Success Criteria** (what must be TRUE):
  1. Consent banner blocks all analytics tracking until user grants permission (GDPR compliance)
  2. Essential mode functional without analytics consent (device controls work)
  3. Analytics dashboard shows daily stove usage hours with power level breakdown
  4. Pellet consumption estimated based on power level and runtime with user calibration option
  5. Historical charts visualize usage trends (7/30/90 days) and weather correlation
  6. Daily aggregation cron processes real-time events into queryable stats automatically

**Plans**: 8 plans

Plans:
- [ ] 54-01-PLAN.md — Analytics types, consent service, and event logger (foundation)
- [ ] 54-02-PLAN.md — Pellet consumption estimation service (TDD)
- [ ] 54-03-PLAN.md — Aggregation service and cron endpoint
- [ ] 54-04-PLAN.md — GDPR consent banner UI component + ClientProviders wiring
- [ ] 54-05-PLAN.md — Analytics stats API, calibrate API, and StatsCards
- [ ] 54-06-PLAN.md — Dashboard charts (Usage, Consumption, Weather Correlation)
- [ ] 54-07-PLAN.md — Dashboard page assembly with period selector and calibration modal
- [ ] 54-08-PLAN.md — Stove event instrumentation (ignite/shutdown/power API routes + scheduler)

## Progress

**Execution Order:**
Phases execute in numeric order: 49 → 50 → 51 → 52 → 53 → 54

**Critical Path:** 49 → 50 → 52 → 53 → 54 (Phase 51 can run parallel to 52-53)

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 44-48 | v5.1 | 39/39 | ✓ Complete | 2026-02-10 |
| 37-43 | v5.0 | 56/56 | ✓ Complete | 2026-02-08 |
| 30-36 | v4.0 | 24/24 | ✓ Complete | 2026-02-05 |
| 25-29 | v3.2 | 13/13 | ✓ Complete | 2026-02-03 |
| 19-24 | v3.1 | 13/13 | ✓ Complete | 2026-02-02 |
| 11-18 | v3.0 | 52/52 | ✓ Complete | 2026-01-30 |
| 6-10 | v2.0 | 21/21 | ✓ Complete | 2026-01-28 |
| 1-5 | v1.0 | 29/29 | ✓ Complete | 2026-01-26 |
| 49 | v6.0 | 4/4 | ✓ Complete | 2026-02-10 |
| 50 | v6.0 | 4/4 | ✓ Complete | 2026-02-10 |
| 51 | v6.0 | 4/4 | ✓ Complete | 2026-02-10 |
| 52 | v6.0 | 3/3 | ✓ Complete | 2026-02-10 |
| 53 | v6.0 | 5/5 | ✓ Complete | 2026-02-11 |
| 54 | v6.0 | 0/TBD | Not started | - |

---

**v6.0 Phases:** 6 phases (49-54)
**v6.0 Requirements:** 42 total (100% coverage validated)
**Depth:** Comprehensive (6 phases for 42 requirements)
**Created:** 2026-02-10
**Last updated:** 2026-02-11 — Phase 53 complete
