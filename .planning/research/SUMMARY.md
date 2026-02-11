# Project Research Summary

**Project:** Pannello Stufa v7.0 — Performance & Resilience Hardening
**Domain:** Smart Home IoT Control PWA
**Researched:** 2026-02-11
**Confidence:** HIGH

## Executive Summary

Pannello Stufa is a production Next.js 15.5 PWA controlling a Thermorossi stove, Netatmo thermostat, and Philips Hue lights. After six successful milestones (v6.0 just completed), the v7.0 focus is hardening: retry strategies for transient failures, adaptive polling for resource efficiency, error boundaries for graceful degradation, component splitting for 1200-1500 LOC monolithic files, and automated FCM token cleanup.

**The recommended approach is incremental enhancement:** The existing architecture (PWA hooks, Firebase RTDB, Auth0) provides solid foundation. Critical changes include (1) adding @lifeomic/attempt for exponential backoff retry on device commands, (2) using native Page Visibility API for adaptive polling (no library needed), (3) implementing error boundaries at feature level (StoveCard, LightsCard), (4) splitting large components using orchestrator pattern with error boundary per section, and (5) extending the existing 7-day token cleanup with retry logic and delivery-based staleness tracking. All changes are additive—no breaking refactors required.

**Key risks center on safety-critical device control:** Non-idempotent retries could trigger duplicate ignite commands (physical safety issue), layered retry amplification (component + API + external service) causes request storms, adaptive polling that slows critical stove status creates coordination failures with thermostat/scheduler, and error boundaries that swallow maintenance alerts bypass safety validations. Mitigation requires idempotency keys on POST routes, single retry layer at API boundary only, fixed 5s polling for stove status (never adaptive), and custom ValidationError class to distinguish expected errors from crashes.

## Key Findings

### Recommended Stack

**Single new dependency:** @lifeomic/attempt v3.1.1 provides production-grade exponential backoff with jitter, timeout, and error handlers. Alternative (exponential-backoff npm) lacks timeout/abort support. Manual retry implementation is error-prone and lacks jitter for thundering herd prevention.

**Core technologies:**
- **Next.js 16.1.0 App Router:** error.tsx file convention provides granular error boundaries at route segment level—use at `/app/error.tsx` (global), `/app/(authenticated)/error.tsx` (auth-only), and `/app/(authenticated)/dashboard/error.tsx` (per-feature)
- **React 19.2.0:** Error boundaries (class components), React.lazy + Suspense for code splitting, native support stable in React 18+
- **TypeScript 5.x (strict mode enabled):** Type safety for retry logic, polling state machines, error boundary props
- **Page Visibility API (browser built-in):** No library needed—`document.visibilityState` check before polling reduces Firebase RTDB calls by 50% when tabs hidden
- **Jest 30.2.0 built-in coverage:** Use `jest --coverage --collectCoverageFrom='app/api/**/*.ts'` for critical API route testing—80% branch coverage threshold recommended

**What NOT to use:**
- ❌ react-error-boundary package (Next.js App Router provides native error.tsx)
- ❌ Polling libraries like react-query/swr (over-engineered for simple visibility-aware polling)
- ❌ Global-only error boundaries (errors bubble up—need granular boundaries)
- ❌ Custom error boundary class components at component-instance level (too granular)

### Expected Features

**Must have (table stakes):**
- **Error boundaries** at feature level (StoveCard, LightsCard, SchedulerCard)—one component error shouldn't crash entire app
- **Exponential backoff retry** for device commands (3-5 retries, 200ms → 5s with jitter)—production apps without retry feel broken
- **Visibility API polling** stop/resume—OS throttles hidden tabs anyway, explicit handling prevents conflicts and saves 80% resources
- **Component splitting** for 1000+ LOC files (StoveCard 1510 LOC, LightsCard 1203 LOC)—improves maintainability and parse time
- **Token cleanup automation** with 30-day staleness detection—Firebase best practice, prevents unbounded growth

**Should have (competitive):**
- **Adaptive polling state machine** (active 5s / idle 30s / hidden stop / error backoff)—beyond simple visibility toggle
- **Granular loading states** per device, not app-wide spinner—better UX for multi-device operations
- **Automatic error recovery** in boundaries (2 retry attempts before fallback)—most apps just show error
- **Component health monitoring** via error boundary logging to Firebase Analytics—proactive error detection

**Defer (v2+):**
- WebSocket real-time updates (polling adequate for thermostat control)
- Service worker advanced cache strategies (Serwist offline mode already exists)
- Performance monitoring Lighthouse CI (manual audits sufficient)
- Comprehensive E2E coverage (3-5 critical flows sufficient)

### Architecture Approach

**Orchestrator pattern with error boundary isolation:** Large monolithic components (StoveCard 1510 LOC) split into orchestrator (~200 LOC) managing state and polling, plus 5-6 subcomponents (~150-250 LOC each) for presentation. Single `useAdaptivePolling()` hook in orchestrator prevents polling multiplication. Each logical section wrapped in `DeviceErrorBoundary` for graceful degradation. Pass data via props to avoid context re-render cascades.

**Major components:**
1. **Retry utility** (`lib/utils/retry.ts`) — centralized exponential backoff with presets (DEVICE_COMMAND, API_CALL, BACKGROUND_SYNC)
2. **Adaptive polling hook** (`lib/hooks/useAdaptivePolling.ts`) — visibility/network-aware polling state machine, integrates with existing `useOnlineStatus` hook
3. **Error boundaries** (`app/components/error-boundaries/DeviceErrorBoundary.tsx`) — class component with logging to Firebase Analytics, custom ValidationError handling
4. **Token cleanup service** (`lib/services/tokenCleanupService.ts`) — extracted from API route, adds retry logic and delivery-based staleness tracking

**Integration with existing patterns:** Preserves self-contained device card pattern (all device info inside card boundaries), keeps Firebase RTDB listeners in orchestrators, enhances existing Background Sync with retry logic, maintains PWA offline strategies.

### Critical Pitfalls

1. **Non-idempotent retry on ignite/shutdown** — duplicate physical actions if network timeout doesn't mean action failed. **Prevention:** Server-side idempotency keys, read-verify-write pattern (check stove state before retry), only retry safe operations.

2. **Layered retry amplification** — app retry + API route retry + external service retry = 27 requests for single action. **Prevention:** Single retry layer at API boundary only, disable browser fetch retry, monitor retry depth.

3. **Adaptive polling breaks real-time** — slowing stove status polling to 30s causes stale display, automation conflicts. **Prevention:** Fixed 5s for critical stove status (never adaptive), adaptive only for weather/tokens, staleness indicator if >10s old.

4. **Error boundaries swallow safety alerts** — `needsCleaning` validation error shows generic fallback instead of maintenance alert. **Prevention:** Custom ValidationError class, render validation UI before error boundary scope, boundaries wrap unexpected errors only.

5. **Component splitting multiplies polling** — split into subcomponents with independent polling = 3× server requests. **Prevention:** Hoist state to parent orchestrator, single polling loop, pass data via props to children.

6. **Token cleanup deletes active devices** — inactive by "app open" metric, but user receives background notifications. **Prevention:** Track `lastNotificationDelivered` not `lastAppOpened`, 270-day window (not 30), audit logs.

## Implications for Roadmap

Based on research, suggested 5-phase structure with 3-4 weeks execution:

### Phase 1: Resilience Foundation (Week 1)
**Rationale:** Error boundaries and retry logic are table stakes—without them, transient failures crash the app or feel broken to users. Must come first as foundation for all other phases.

**Delivers:**
- `lib/utils/retry.ts` with exponential backoff + presets
- `app/components/error-boundaries/DeviceErrorBoundary.tsx`
- Error boundaries on homepage device cards
- Retry logic on device command handlers (ignite, shutdown, lights control)

**Addresses:**
- FEATURES.md table stakes: error recovery, retry on failure
- PITFALLS.md critical: non-idempotent retry (#1), layered amplification (#2), error boundaries swallow alerts (#4)

**Avoids:** Layered retries (single layer at API boundary), non-idempotent operations (read-verify-write pattern), swallowing validations (custom error classes)

**Test coverage:** Unit tests for retry logic (backoff, jitter, shouldRetry), integration tests for error boundaries (throw error, verify fallback)

**Estimated effort:** 3-5 days

---

### Phase 2: Polling Optimization (Week 1-2)
**Rationale:** Resource efficiency improves UX (battery life) and operational costs (Firebase RTDB reads). Quick wins with low complexity—Page Visibility API is browser built-in.

**Delivers:**
- `lib/hooks/useAdaptivePolling.ts` with visibility/network awareness
- Replace fixed polling in StoveCard, LightsCard, ThermostatCard
- AbortController cleanup for race condition prevention

**Uses:**
- STACK.md: Page Visibility API (browser built-in)
- Existing: `useOnlineStatus` hook for network awareness

**Implements:**
- ARCHITECTURE.md: Adaptive polling integration with existing PWA patterns

**Addresses:**
- FEATURES.md table stakes: background tab optimization, visibility API
- PITFALLS.md critical: adaptive polling breaks real-time (#3), useEffect race condition (#9)

**Avoids:** Making stove status adaptive (fixed 5s), polling without cleanup (AbortController)

**Estimated effort:** 2-3 days

---

### Phase 3: Component Splitting — Stove (Week 2)
**Rationale:** StoveCard (1510 LOC) is most complex, splitting provides blueprint pattern for other components. Enables lazy loading in later optimizations.

**Delivers:**
- `app/components/devices/stove/components/` directory with 5-6 subcomponents
- StoveCard refactored to orchestrator pattern (~200 LOC)
- Error boundary per logical section
- Single polling loop (prevents multiplication)

**Uses:**
- STACK.md: React.lazy + Suspense for future lazy loading
- ARCHITECTURE.md: Orchestrator pattern with props-based data flow

**Implements:**
- ARCHITECTURE.md: Component splitting integration, error boundary hierarchy

**Addresses:**
- FEATURES.md table stakes: load time <3s (code splitting foundation)
- PITFALLS.md critical: component splitting multiplies polling (#5), context re-renders (#3 integration)

**Avoids:** Polling in subcomponents (hoist to parent), split too small (<200 LOC per component), context consumption in every child

**Test coverage:** Snapshot tests for split components (verify output identical), unit tests for orchestrator data flow

**Estimated effort:** 5-7 days

---

### Phase 4: Component Splitting — Lights & Page (Week 3)
**Rationale:** Follows established pattern from Phase 3. LightsCard (1203 LOC) and stove/page.tsx (1066 LOC) benefit from same orchestrator approach.

**Delivers:**
- `app/components/devices/lights/components/` directory with 4-5 subcomponents
- `app/stove/components/` directory with 4 subcomponents
- LightsCard and stove/page.tsx refactored to orchestrators

**Uses:** Phase 3 orchestrator pattern

**Addresses:**
- FEATURES.md table stakes: component splitting (remaining large files)
- FEATURES.md should have: granular loading states per device

**Avoids:** Same pitfalls as Phase 3 (now documented pattern to follow)

**Estimated effort:** 5-7 days

---

### Phase 5: Token Cleanup & Polish (Week 4)
**Rationale:** Operational hygiene—prevents unbounded FCM token growth. Independent of other phases, can run in parallel with Phase 4 if resources allow.

**Delivers:**
- `lib/services/tokenCleanupService.ts` extracted from API route
- Retry logic for cleanup operations
- Delivery-based staleness tracking (not app-open based)
- Client-side cleanup trigger (on app open if >7 days)
- Audit logging to `firebase/tokenCleanupLog`

**Uses:**
- STACK.md: @lifeomic/attempt for cleanup retry
- ARCHITECTURE.md: Token cleanup integration with existing cron

**Addresses:**
- FEATURES.md table stakes: token lifecycle management with 30-day staleness
- PITFALLS.md critical: cleanup deletes active devices (#6)

**Avoids:** App-open metric (use delivery), 30-day window (use 270-day), no audit trail (add logging)

**Estimated effort:** 2-3 days

---

### Phase Ordering Rationale

**Dependencies:**
- Phase 1 is foundational—retry utility and error boundaries needed by later phases
- Phase 2 builds on Phase 1 (adaptive polling uses retry on error)
- Phase 3 uses Phase 1 boundaries and Phase 2 polling hook
- Phase 4 follows Phase 3 pattern (established orchestrator approach)
- Phase 5 is independent (can parallelize with Phase 4)

**Groupings:**
- Week 1: Core resilience patterns (retry + error + polling)
- Week 2-3: Component refactoring (apply patterns to large files)
- Week 4: Operational hygiene (token cleanup, polish)

**Risk mitigation:**
- Early phases address safety-critical pitfalls (non-idempotent retry, error swallowing)
- Component splitting after patterns established (avoid multiplying polling loops)
- Token cleanup last (least user-facing, independent)

### Research Flags

**Phases needing deeper research during planning:**
- **None expected** — all phases use well-documented patterns. Error boundaries (React official docs), exponential backoff (OneUpTime 2026 guide), Page Visibility API (MDN), component splitting (React patterns).

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** Error boundaries and retry are established React/API patterns
- **Phase 2:** Page Visibility API is browser standard, well-documented
- **Phase 3-4:** Component refactoring follows React best practices
- **Phase 5:** Firebase token management is official best practice

**If implementation blockers arise:**
- Use `/gsd:research-phase` for specific questions (e.g., "How to test error boundaries with Cypress")
- Most likely candidates: Testing strategy (Phase 1), Race condition edge cases (Phase 2)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official docs for Next.js, React, Page Visibility API; established npm package (@lifeomic/attempt) |
| Features | HIGH | Table stakes validated with official React error boundary docs, Firebase best practices, 2026 industry articles |
| Architecture | HIGH | Based on existing codebase analysis (actual LOC counts, current patterns), Next.js App Router conventions |
| Pitfalls | HIGH | Verified with official docs, production post-mortems (Microsoft Azure retry storm, Firebase token lifecycle), IEEE research papers |

**Overall confidence:** HIGH

**Reasoning:**
- Existing codebase provides solid foundation (PWA patterns, Firebase integration, Auth0 working)
- All recommendations use official/standard APIs (no experimental libraries)
- Pitfalls documented with real-world examples and mitigation strategies
- Phase structure follows natural dependencies (retry → polling → splitting)
- Risk areas clearly identified with prevention strategies

### Gaps to Address

**Playwright E2E testing strategy:** Research mentions Playwright for critical path testing (FEATURES.md Phase 4), but existing codebase has Cypress 3034 tests. During Phase 1 planning, decide: (1) Add new E2E in Playwright for critical flows only, or (2) Use existing Cypress for integration tests. Recommendation: Add 3-5 Playwright flows for critical paths (login → ignite → verify), keep Cypress unit tests.

**Idempotency key implementation:** PITFALLS.md emphasizes server-side idempotency for ignite/shutdown, but current API routes don't have this. During Phase 1 planning, design idempotency key storage: (1) In-memory cache (Redis-like), (2) Firebase RTDB `idempotencyKeys/{key}/{timestamp}`, or (3) Request deduplication based on stove state. Recommendation: Option 2 (Firebase RTDB) for simplicity, 2-minute TTL.

**Error boundary logging integration:** ARCHITECTURE.md mentions logging to Firebase Analytics, but FEATURES.md component health monitoring is deferred to v7.1. During Phase 1 implementation, use simple `logEvent(analytics, 'component_error', {...})` for basic tracking, defer dashboard UI.

**Token cleanup migration path:** Current cleanup in `/api/scheduler/check` route (652 LOC). During Phase 5 planning, decide: (1) Extract to service and call from route, or (2) New dedicated `/api/admin/cleanup-tokens` route. Recommendation: Option 1 (extract to service) for backward compatibility with existing cron.

## Sources

### Primary (HIGH confidence)

**Stack Research:**
- Next.js App Router Error Handling (https://nextjs.org/docs/app/getting-started/error-handling)
- React Error Boundaries (https://legacy.reactjs.org/docs/error-boundaries.html)
- @lifeomic/attempt npm (https://www.npmjs.com/package/@lifeomic/attempt)
- Page Visibility API MDN (https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- Firebase FCM Token Management (https://firebase.google.com/docs/cloud-messaging/manage-tokens)

**Features Research:**
- OneUpTime — Error Boundaries & Retry Logic in React 2026 (https://oneuptime.com/blog/post/2026-01-15-react-error-boundaries/view)
- Next.js 15 Lazy Loading Guide v16.1.6 2026-02-09 (https://nextjs.org/docs/app/guides/lazy-loading)
- Firebase Blog — Managing Cloud Messaging Tokens (https://firebase.blog/posts/2023/04/managing-cloud-messaging-tokens/)
- BrowserStack — 15 Best Practices for Playwright 2026 (https://www.browserstack.com/guide/playwright-best-practices)

**Architecture Research:**
- Existing codebase analysis: StoveCard.tsx (1510 LOC), LightsCard.tsx (1203 LOC), stove/page.tsx (1066 LOC)
- docs/architecture.md — Self-contained device card pattern
- docs/pwa.md — PWA architecture with useOnlineStatus, useDeviceStaleness, useBackgroundSync hooks

**Pitfalls Research:**
- Microsoft Azure — Retry Storm Antipattern (https://learn.microsoft.com/en-us/azure/architecture/antipatterns/retry-storm/)
- ThinhDA — Retries Without Thundering Herds (https://thinhdanggroup.github.io/retry-without-thundering-herds/)
- IEEE — RT-IFTTT Real-Time IoT Framework (https://ieeexplore.ieee.org/document/8277299/)
- Max Rozen — Race Conditions in React useEffect (https://maxrozen.com/race-conditions-fetching-data-react-with-useeffect)

### Secondary (MEDIUM confidence)

- Medium — Modern JavaScript Polling: Adaptive Strategies (https://medium.com/tech-pulse-by-collatzinc/modern-javascript-polling-adaptive-strategies-that-actually-work-part-1-9909f5946730)
- Medium — Advanced React Error Boundaries for Production Apps (https://medium.com/@asiandigitalhub/advanced-react-error-boundaries-for-production-apps-f9ad9d2ae966)
- Kent C. Dodds — Application State Management with React (https://kentcdodds.com/blog/application-state-management-with-react)
- LogRocket — Dynamic Imports and Code Splitting with Next.js (https://blog.logrocket.com/dynamic-imports-code-splitting-next-js/)

### Tertiary (LOW confidence)

- None — all recommendations backed by official docs or authoritative 2026 sources

---

*Research completed: 2026-02-11*
*Ready for roadmap: yes*
*Synthesized from: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
