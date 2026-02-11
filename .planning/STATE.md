# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-10)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

**Current focus:** Phase 53 - PWA Offline Improvements (v6.0 Operations, PWA & Analytics)

## Current Position

Phase: 53 of 54 (PWA Offline Improvements) — COMPLETE ✅
Plan: 05/05 completed
Status: All PWA offline improvements integrated and tested
Last activity: 2026-02-11 - Completed quick task 23: fai in modo che anche su desktop ci sia il menu hamburger

Progress: [████████░░] 88.3% (267 of 302 estimated total plans)

Next action: Start Phase 54 execution (Analytics & Consent Management)

## Performance Metrics

**Velocity (v5.0-v5.1):**
- Total plans completed: 247 (v1.0-v5.1)
- v5.0 milestone: 56 plans in 4 days
- v5.1 milestone: 39 plans in 2 days

**By Phase (recent milestones):**

| Phase | Plans | Milestone | Duration |
|-------|-------|-----------|----------|
| 37-43 | 56 | v5.0 TypeScript | 4 days |
| 44-48 | 39 | v5.1 Tech Debt | 2 days |
| 49 | 4 | v6.0 Operations | Phase 49 done |
| 50-54 | TBD | v6.0 Operations | Starting |

**Recent Trend:**
- Parallel execution enabled (5-agent waves)
- Comprehensive depth setting
- Yolo mode active (autonomous execution with verification)

**v6.0 Phase 49 Execution:**

| Plan | Duration | Tasks | Files | Date | Status |
|------|----------|-------|-------|------|--------|
| 49-01 | 4 min | 1 | 2 | 2026-02-10 | Complete ✅ |
| 49-02 | 6 min | 1 | 2 | 2026-02-10 | Complete ✅ |
| 49-03 | 3 min | 1 | 2 | 2026-02-10 | Complete ✅ |
| 49-04 | 14 min | 3 | 12 | 2026-02-10 | Complete ✅ |

**v6.0 Phase 50 Execution:**

| Plan | Duration | Tasks | Files | Date | Status |
|------|----------|-------|-------|------|--------|
| 50-01 | 32 sec | 1 | 1 | 2026-02-10 | Complete ✅ |
| 50-02 | 2 min | 1 | 2 | 2026-02-10 | Complete ✅ |
| 50-03 | 7 min | 2 | 3 | 2026-02-10 | Complete ✅ |
| 50-04 | 2 min | 2 | 0 | 2026-02-10 | Complete ✅ |

**v6.0 Phase 51 Execution:**

| Plan | Duration | Tasks | Files | Date | Status |
|------|----------|-------|-------|------|--------|
| 51-01 | 2.6 min | 3 | 5 | 2026-02-10 | Complete ✅ |
| 51-02 | 2 min | 2 | 3 | 2026-02-10 | Complete ✅ |
| 51-03 | 1.9 min | 2 | 3 | 2026-02-10 | Complete ✅ |
| 51-04 | 1.0 min | 1 | 1 | 2026-02-10 | Complete ✅ |

**v6.0 Phase 52 Execution:**

| Plan | Duration | Tasks | Files | Date | Status |
|------|----------|-------|-------|------|--------|
| 52-01 | 2.9 min | 2 | 3 | 2026-02-10 | Complete ✅ |
| 52-02 | 4.7 min | 1 | 1 | 2026-02-10 | Complete ✅ |
| 52-03 | 5.0 min | 2 | 3 | 2026-02-10 | Complete ✅ |

**v6.0 Phase 53 Execution:**

| Plan | Duration | Tasks | Files | Date | Status |
|------|----------|-------|-------|------|--------|
| 53-01 | 4.0 min | 2 | 2 | 2026-02-11 | Complete ✅ |
| 53-02 | 4.4 min | 2 | 4 | 2026-02-11 | Complete ✅ |
| 53-03 | 6.5 min | 3 | 3 | 2026-02-11 | Complete ✅ |
| 53-04 | 5.6 min | 2 | 5 | 2026-02-11 | Complete ✅ |
| 53-05 | 1.7 min | 1 | 1 | 2026-02-11 | Complete ✅ |
| Phase 53 P05 | 1.7 | 1 tasks | 1 files |

## Accumulated Context

### Decisions

Recent decisions affecting v6.0 work (full log in PROJECT.md):

- **Simple read/write for coordination throttle (49-03)**: Last-writer-wins acceptable for single timestamp storage; no transaction overhead needed
- **Firebase RTDB for rate limiting**: Transactions provide atomicity without Redis complexity (Phase 49 foundation)
- **GitHub Actions for cron**: External HTTP scheduler, no stateful server needed (Phase 50 approach)
- **Playwright auth state pattern**: Session caching prevents redundant Auth0 logins (Phase 51 implementation)
- **Platform-specific FCM payloads**: iOS requires aps.category, Android uses clickAction (Phase 52 complexity)
- **Consent-first analytics**: GDPR compliance blocks all tracking without explicit opt-in (Phase 54 blocker)
- [Phase 49-01]: Pure transaction callbacks with no side effects (prevents duplication on retry)
- [Phase 49-01]: 2-hour max retention prevents unbounded array growth in Firebase
- [Phase 49-01]: Module independence: Copy rate limit config instead of importing (no shared state)
- [Phase 49-02]: Dual-window enforcement for Netatmo: 50 req/10s burst + 400 req/hour conservative (both limits enforced)
- [Phase 49-02]: Separate RTDB paths for Netatmo windows: netatmo_api_10s (timestamps array) + netatmo_api_1h (counter)
- [Phase 49-04]: Dynamic import for persistent implementations: Lazy loading prevents loading Firebase RTDB code when feature flag is false
- [Phase 49-04]: Async wrappers with graceful fallback: All rate limiter functions now async, fall back to in-memory on Firebase errors
- [Phase 50-02]: Firebase RTDB for cron execution logs: Consistency with existing cron patterns (cronHealth/lastCall), simple time-series data
- [Phase 50-02]: 24-hour retention with automatic cleanup: Prevents unbounded growth, dashboard needs recent history only
- [Phase 50-02]: Fire-and-forget logging: Errors logged but never thrown, logging failures shouldn't block scheduler execution
- [Phase 50-01]: 5-minute cron schedule chosen to balance responsiveness with API cost
- [Phase 50-01]: Query param authentication for simpler curl invocation
- [Phase 50-01]: Separate steps for visibility in GitHub Actions UI
- [Phase 50-03]: Fire-and-forget logging pattern prevents logging failures from blocking scheduler execution
- [Phase 50-03]: All 7 execution paths logged including early returns (manual mode, maintenance blocked, etc.)
- [Phase 50-03]: Execution details (giorno, ora, schedule) included for dashboard visibility
- [Phase 50-04]: GitHub Actions secrets (VERCEL_APP_URL, CRON_SECRET) configured via gh CLI for secure external cron invocation
- [Phase 50-04]: Manual workflow_dispatch trigger confirmed end-to-end automation before production schedule activation
- [Phase 51-01]: Session caching via storageState prevents redundant Auth0 logins (single login per test run)
- [Phase 51-01]: Single worker in CI prevents Auth0 rate limiting during parallel test execution
- [Phase 51-02]: Auth smoke tests explicitly clear storageState to test real Auth0 login flow (feature tests use cached session)
- [Phase 51-02]: Stove and thermostat tests are read-only to avoid triggering actions on real devices
- [Phase 51-02]: Accessibility-first selectors (getByRole, text patterns) more resilient than CSS classes
- [Phase 51-02]: 15-second timeouts account for dashboard API polling delays (5-15s intervals)
- [Phase 51-03]: CI builds app first, then uses npm run start for stability (playwright.config.ts uses process.env.CI)
- [Phase 51-03]: Notification tests validate UI only, no FCM service worker interaction (Playwright cannot test Push API)
- [Phase 51-03]: GitHub encrypted secrets for all Auth0 and Firebase credentials (user configures secrets in repository settings)
- [Phase 51-03]: Blob reporter in CI for compact binary artifacts (suitable for merging parallel results)
- [Phase 51-04]: dotenv ^16.4.5 chosen for Playwright config: Caret range allows patch updates, matches ecosystem standard
- [Phase 52-01]: Const objects over enums for action constants: Better tree-shaking, no runtime overhead, still type-safe with `as const`
- [Phase 52-01]: Standalone feature detection in notificationActions.ts: Avoids circular dependencies with notificationService.ts
- [Phase 52-01]: Platform-specific payload fields: webpush.actions for Chrome/Edge, apns.category for iOS (future-proof), android.clickAction for Android intents
- [Phase 52-02]: Duplicate action constants in SW file: Serwist compiles SW separately, can't import from lib at build time
- [Phase 52-02]: Tag-based notification deduplication: Prevents spam from repeated action clicks (action-success/error/queued-{endpoint})
- [Phase 52-03]: getActionsForNotificationType called in triggerNotificationServer: Automatic action injection based on notification type before payload send
- [Phase 53-02]: 30-second staleness threshold balances data freshness with UI responsiveness
- [Phase 53-02]: 1-hour command expiration for safety-critical endpoints prevents dangerous stale-intent execution
- [Phase 53-04]: localStorage for visit tracking chosen over cookies: Simpler API, no expiration management, sufficient for client-side feature
- [Phase 53-04]: Custom bottom sheet instead of external library: Per CLAUDE.md rule (no npm install), design system has needed primitives
- [Phase 53-04]: 30-day dismissal cooldown balances user experience with install opportunity maintenance
- [Phase 53-04]: 2+ visits requirement avoids annoying first-time visitors while ensuring genuine interest
- [Phase 53-02]: 5-second polling interval for staleness updates provides real-time info without excessive re-renders

### Pending Todos

None yet for v6.0. Use `/gsd:add-todo` to capture ideas during execution.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 23 | fai in modo che anche su desktop ci sia il menu hamburger | 2026-02-11 | c53b0d5 | [23-fai-in-modo-che-anche-su-desktop-ci-sia-](./quick/23-fai-in-modo-che-anche-su-desktop-ci-sia-/) |
| 22 | crea sistema di logging automatico per tuning PID | 2026-02-11 | 4ff9367 | [22-crea-sistema-di-logging-automatico-per-t](./quick/22-crea-sistema-di-logging-automatico-per-t/) |
| 21 | pulisci i console.log presenti nel sito | 2026-02-10 | efc18c6 | [21-pulisci-i-console-log-presenti-nel-sito-](./quick/21-pulisci-i-console-log-presenti-nel-sito-/) |
| 20 | rimuovi i context menu con tasto destro dalle card | 2026-02-10 | 08ff45e | [20-rimuovi-i-context-menu-con-tasto-destro-](./quick/20-rimuovi-i-context-menu-con-tasto-destro-/) |
| 19 | rimuovi tutti i comandi long-press da mobile | 2026-02-10 | ed4689f | [19-rimuovi-tutti-i-comandi-long-press-da-mo](./quick/19-rimuovi-tutti-i-comandi-long-press-da-mo/) |
| 18 | remove Quick Actions bars from all device cards | 2026-02-10 | 102a823 | [18-rimuovi-le-quick-actions-da-tutte-le-car](./quick/18-rimuovi-le-quick-actions-da-tutte-le-car/) |
| 17 | remove duplicate controls from homepage device cards | 2026-02-10 | 9c96af6 | [17-rimuovi-comandi-duplicati-dalle-card-hom](./quick/17-rimuovi-comandi-duplicati-dalle-card-hom/) |
| 16 | fix weather tab coordinates from config | 2026-02-09 | 00f3184 | [16-fix-weather-tab-coordinates-from-config](./quick/16-fix-weather-tab-coordinates-from-config/) |
| 15 | aggiungi la favicon | 2026-02-09 | 266bd24 | [15-aggiungi-la-favicon](./quick/15-aggiungi-la-favicon/) |

### Blockers/Concerns

**v6.0 Risks (from research):**
- Phase 49: Serverless state loss if Firebase transactions fail (feature flag mitigation)
- Phase 50: Vercel 10s timeout for cron orchestrator (fire-and-forget pattern required)
- Phase 52: iOS notification category registration in PWA unclear (needs deeper research during planning)
- Phase 54: GDPR consent banner UX must not block essential controls (essential mode implementation critical)

**Known Issues (carried from v5.1):**
- Worker teardown warning (React 19 cosmetic, documented as not actionable)
- 179 unused exports remain (131 intentional design system barrel, 48 utility)
- 2 knip false positives (app/sw.ts, firebase-messaging-sw.js)

## Session Continuity

Last session: 2026-02-11
Stopped at: Completed Quick Task 23 (Desktop Hamburger Menu)
Resume file: None

Next action: Start Phase 54 execution (Analytics & Consent Management)

---
*State updated: 2026-02-11 after completing Phase 53 Plan 05*
