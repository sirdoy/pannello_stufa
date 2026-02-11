# Stack Research

**Domain:** Performance & Resilience Hardening for Next.js 15.5 PWA
**Researched:** 2026-02-11
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js App Router | 16.1.0 (current) | Error boundaries with error.tsx | Built-in support for granular error handling at route segment level, client component boundaries with automatic bubbling to parent segments |
| React | 19.2.0 (current) | Error boundaries, React.lazy, Suspense | Native error boundary support, code splitting with lazy/Suspense for breaking large components, standard for 2026 React apps |
| TypeScript | 5.x (current) | Type safety for retry logic, polling | Strict mode already enabled, ensures type safety for new retry/polling utilities |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @lifeomic/attempt | ^3.1.1 | Exponential backoff retry | API calls to Firebase, Netatmo, Philips Hue — handles transient network failures with jitter, timeout, error handlers |
| Native Page Visibility API | Browser built-in | Adaptive polling (no library needed) | Slow/stop polling when page hidden, resume when visible — reduces Firebase RTDB calls and network traffic |
| Jest (built-in coverage) | 30.2.0 (current) | Test coverage analysis | Use `jest --coverage` for critical API route testing — already installed, zero additional setup |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| React Developer Tools | Component profiling | Use Profiler tab to identify 1000+ line components for splitting |
| Firebase Admin SDK (existing) | FCM token cleanup cron | Use in GitHub Actions cron job (already scheduled every 5 min) to query tokens older than 30 days |
| Jest Coverage Reports | Identify untested code | Use `--coverage --collectCoverageFrom='app/api/**/*.ts'` to focus on critical API routes |

## Installation

```bash
# New dependencies ONLY
npm install @lifeomic/attempt

# Dev dependencies (if needed for coverage visualization)
# None required — Jest coverage built-in
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| @lifeomic/attempt | exponential-backoff (npm) | If you need ONLY basic retry logic without timeout/abort/error handlers — simpler API but fewer features |
| @lifeomic/attempt | Manual implementation | NEVER — error-prone, reinventing wheel, no jitter support |
| Native Page Visibility API | RxJS-based visibility wrapper | If already using RxJS heavily — adds dependency weight for this single feature |
| React.lazy + Suspense | loadable-components | If you need SSR code splitting — React.lazy doesn't support SSR yet, but Pannello Stufa is CSR-only (Auth0 + dynamic data) |
| Jest coverage (built-in) | Codecov / SonarQube Cloud | If you need CI/CD integration, historical tracking, team dashboards — overkill for phase-specific critical route testing |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Custom error boundary class components | React 19 and Next.js 15 standardize on error.tsx file convention | error.tsx files in App Router |
| react-error-boundary package | Next.js App Router provides native error.tsx — adds unnecessary dependency | Native error.tsx files |
| Global-only error boundaries | Errors bubble up — need granular boundaries at route segment level for better UX | error.tsx at multiple route levels |
| Polling libraries (react-query, swr) | Over-engineered for simple visibility-aware polling — you need pause/resume, not caching/stale-while-revalidate | Native setInterval + Page Visibility API |
| Istanbul/nyc for coverage | Jest uses c8 (Node native) in modern versions — nyc adds build step complexity | Jest built-in `--coverage` flag |

## Stack Patterns by Variant

**For retry with exponential backoff:**
- Use @lifeomic/attempt wrapper around Firebase RTDB, Netatmo, Philips Hue API calls
- Configure: `maxAttempts: 3, delay: 200, factor: 2, maxDelay: 5000, jitter: true`
- Because: 200ms base → 400ms → 800ms with jitter avoids thundering herd, 5s max prevents long user waits

**For adaptive polling:**
- Use native `document.visibilityState` check before each poll
- Pattern: `if (document.visibilityState === 'hidden') return; // skip poll`
- Because: No library needed, works in all modern browsers, Firebase RTDB rate limiter already in place (Phase 49)

**For error boundaries:**
- Place error.tsx at `/app/error.tsx` (global) AND `/app/(authenticated)/error.tsx` (auth-only)
- Pattern: Client component with `useEffect(() => console.error(error), [error])` for logging
- Because: Errors in unauthenticated pages (landing, 404) vs authenticated dashboard need different fallback UIs

**For component splitting:**
- Use `React.lazy(() => import('./HeavyComponent'))` wrapped in `<Suspense fallback={<Loading />}>`
- Target: Components >500 lines or with heavy dependencies (Recharts, complex forms)
- Because: Next.js 15 auto-chunks dynamic imports, reduces initial bundle, Suspense provides loading states

**For FCM token cleanup:**
- Use Firebase Admin SDK query in GitHub Actions cron (existing schedule)
- Pattern: `db.ref('devices').orderByChild('fcmTokenTimestamp').endAt(Date.now() - 30*24*60*60*1000)`
- Because: Tokens stale after 30 days (Firebase recommendation), cron already runs every 5 min for other tasks

**For test coverage:**
- Use `jest --coverage --collectCoverageFrom='app/api/**/*.ts' --coverageThreshold='{"global":{"branches":80}}'`
- Focus: Critical API routes (stove control, thermostat, Firebase writes)
- Because: 100% coverage = waste of time, 80% branches = catch edge cases in critical paths

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| @lifeomic/attempt@3.1.1 | TypeScript 5.x | Full TypeScript support, generic retry<T>() return types |
| Next.js 16.1.0 | React 19.2.0 | error.tsx requires React 18+, React.lazy stable in 18+, no breaking changes in 19 |
| Jest 30.2.0 | TypeScript 5.x | Built-in coverage via c8, ts-jest not needed with Next.js SWC compiler |
| Firebase Admin SDK (existing) | Node.js 18+ | Required for FCM token cleanup cron, already in use for rate limiter |

## Integration Points

### Retry Logic Integration
- **Where:** `lib/firebase-client.ts`, `lib/netatmo-api.ts`, `lib/philips-hue-api.ts`
- **Pattern:** Wrap fetch/SDK calls in `retry(() => apiCall(), options)`
- **Error handling:** Use `handleError` callback to log attempts for debugging
- **Existing integration:** Works with Firebase RTDB rate limiter (Phase 49 — transaction-based)

### Adaptive Polling Integration
- **Where:** Dashboard components polling Firebase RTDB for stove status
- **Pattern:** Check `document.visibilityState` before `setInterval` callback fires
- **Existing integration:** Works with existing 5s polling intervals, respects rate limiter
- **Benefit:** Reduces Firebase RTDB reads by ~50% (users frequently switch tabs)

### Error Boundary Integration
- **Where:** App Router route segments with external API calls (stove, thermostat, lights)
- **Pattern:** error.tsx files at `/app/error.tsx`, `/app/(authenticated)/error.tsx`, `/app/(authenticated)/dashboard/error.tsx`
- **Existing integration:** Works with Auth0 middleware (errors in auth vs post-auth need different UIs)
- **Logging:** Integrate with analytics (Phase 54 — GDPR-compliant logging)

### Component Splitting Integration
- **Where:** `app/(authenticated)/dashboard/page.tsx` (1200+ lines), scheduler components
- **Pattern:** Extract sub-sections into separate files, use React.lazy for heavy chart components
- **Existing integration:** Works with CVA design system, Radix UI components (already lazy-loadable)
- **Build optimization:** Next.js 15 automatically creates chunks, no webpack config needed

### FCM Token Cleanup Integration
- **Where:** `.github/workflows/cron-schedule.yml` (existing)
- **Pattern:** Add new job to query Firebase `devices/{deviceId}/fcmTokenTimestamp`
- **Existing integration:** Runs alongside existing cron job (analytics cleanup, maintenance checks)
- **Safety:** Use Firebase Admin SDK transactions to avoid race conditions with active token refreshes

### Test Coverage Integration
- **Where:** Critical API routes in `app/api/stove/`, `app/api/thermostat/`, `app/api/firebase/`
- **Pattern:** Focus on branch coverage (80%+), not line coverage (easy to game)
- **Existing integration:** 3012/3037 tests already passing (Phase 42), add coverage reports to CI
- **Tooling:** Use `jest --coverage --json --outputFile=coverage.json` for CI artifacts

## Sources

### HIGH Confidence (Official Documentation)
- [Next.js App Router Error Handling](https://nextjs.org/docs/app/getting-started/error-handling) — error.tsx file conventions, client component requirements
- [React Error Boundaries](https://legacy.reactjs.org/docs/error-boundaries.html) — lifecycle methods caught, event handlers NOT caught
- [@lifeomic/attempt npm](https://www.npmjs.com/package/@lifeomic/attempt) — exponential backoff API, TypeScript usage, jitter configuration
- [@lifeomic/attempt GitHub](https://github.com/lifeomic/attempt) — retry() function options, handleError callback
- [Firebase FCM Token Management](https://firebase.google.com/docs/cloud-messaging/manage-tokens) — 30-day staleness recommendation, batch cleanup patterns
- [Page Visibility API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) — visibilityState property, visibilitychange event

### MEDIUM Confidence (Community Best Practices, Recent 2026)
- [React Code Splitting Guide](https://legacy.reactjs.org/docs/code-splitting.html) — React.lazy + Suspense patterns
- [Next.js 15 Error Handling Best Practices](https://devanddeliver.com/blog/frontend/next-js-15-error-handling-best-practices-for-code-and-routes) — granular error boundaries, route-level patterns
- [Modern JavaScript Polling: Adaptive Strategies](https://medium.com/tech-pulse-by-collatzinc/modern-javascript-polling-adaptive-strategies-that-actually-work-part-1-9909f5946730) — visibility-aware polling, resource optimization
- [Page Visibility API Performance](https://blog.sachinchaurasiya.dev/how-the-page-visibility-api-improves-web-performance-and-user-experience) — reduce network requests when hidden
- [Jest Coverage with TypeScript](https://about.codecov.io/blog/measuring-typescript-code-coverage-with-jest-and-github-actions/) — collectCoverageFrom patterns, GitHub Actions integration

### LOW Confidence (Verification Needed)
- None — all recommendations backed by official docs or verified 2026 sources

---
*Stack research for: Pannello Stufa v7.0 — Performance & Resilience*
*Researched: 2026-02-11*
