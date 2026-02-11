# Feature Landscape - v7.0 Performance & Resilience

**Domain:** Production Hardening for Smart Home PWA
**Researched:** 2026-02-11
**Project:** Pannello Stufa v7.0
**Context:** Performance & resilience hardening for existing Next.js 15.5 PWA after successful v6.0 operations/analytics milestone

---

## Executive Summary

This research covers six hardening domains for production resilience: (1) **Retry strategies** with exponential backoff for device control commands, (2) **Adaptive polling** with Visibility API to optimize resource usage, (3) **Error boundaries** at feature level for graceful degradation, (4) **Component splitting** for StoveCard/LightsCard/stove page (1000+ line files), (5) **Critical path testing** with Playwright for login-to-control flows, and (6) **Token lifecycle management** with automated 30-day cleanup.

**Table stakes are fundamental**: Production apps without retry logic feel broken, apps that poll hidden tabs waste battery, apps without error boundaries crash completely, large components slow parse times, critical paths without E2E tests break in production, and unbounded FCM tokens bloat databases. These are not nice-to-have features—they're reliability requirements.

**Key differentiators** center on: (1) **Adaptive polling with state machine** (not just visibility toggle), (2) **Granular loading states** per device (not spinner-of-death), (3) **Automatic error recovery** with user-friendly fallbacks, and (4) **Component health monitoring** via error boundary logging.

**Critical anti-features:** No 100% E2E coverage (3-5 flows sufficient), no premature micro-frontends (component splitting adequate), no global error handler only (crashes whole app), no manual token management UI (needs automation), no infinite retries (battery drain), no real-time everything (polling adequate for thermostat control).

---

## Table Stakes

Features users expect from production apps. Missing these = product feels broken or unreliable.

### 1. Error Recovery (Error Boundaries)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|-------------|-------|
| **Feature-level boundaries** | One component error shouldn't crash entire app | Medium | StoveCard, LightsCard, SchedulerCard boundaries |
| **Fallback UI** | User sees "Something went wrong" not white screen | Low | Simple ErrorFallback component with reload button |
| **Error logging** | Production errors tracked in analytics | Low | componentDidCatch → Firebase Analytics |
| **Reset capability** | User can retry without page reload | Low | Reset button in fallback updates error state |
| **Nested boundaries** | Critical sections (ignite button) have own boundary | Medium | Extra protection for high-risk operations |

**Why table stakes:** React error boundaries are production standard since 2017. Apps without them feel unstable. Users expect graceful degradation, not crashes.

**Existing foundation:** None currently. One unhandled error in any component crashes the whole app.

**Complexity:** MEDIUM - Must be class components (no hooks equivalent), requires testing error scenarios, needs logging infrastructure.

**Pattern:**
```typescript
class StoveErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logToAnalytics('stove_error', {
      error: error.message,
      componentStack: info.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
```

---

### 2. Background Tab Optimization (Visibility API)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|-------------|-------|
| **Stop polling when hidden** | OS throttles hidden tabs anyway, explicit stop = courteous | Low | document.visibilityState === 'hidden' |
| **Resume on tab visible** | User expects fresh data when returning | Low | visibilitychange event listener |
| **Battery consideration** | Mobile users notice battery drain from background polling | Low | 80% resource savings reported |
| **Bandwidth savings** | Cellular users pay per MB | Low | 5-second polling wastes data when tab hidden |

**Why table stakes:** Chrome throttles background tabs to 1 request/minute after 5 minutes hidden. Explicit handling prevents conflicts. Users expect apps to respect system resources.

**Existing foundation:** Current polling is unconditional 5-second setInterval. Wastes resources 24/7 if tab stays open but hidden.

**Complexity:** LOW - Visibility API is standard (IE10+), simple event listener, minimal code change.

**Pattern:**
```typescript
function useVisibilityChange() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
}

// Usage in polling hook
useEffect(() => {
  if (!isVisible) return; // Don't poll when tab hidden
  const id = setInterval(pollDevices, 5000);
  return () => clearInterval(id);
}, [isVisible]);
```

---

### 3. Retry on Failure (Exponential Backoff)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|-------------|-------|
| **Automatic retry** | Network is unreliable, users expect "it just works" | Medium | 3-5 retries max before surfacing error |
| **Exponential delays** | 10ms → 20ms → 40ms → 80ms prevents retry storms | Low | Standard pattern: baseDelay * 2^attempt |
| **Max retry limit** | Prevents infinite loops and battery drain | Low | 3 retries = 4 total attempts (initial + 3 retries) |
| **User feedback** | After max retries, show actionable error | Low | "Device offline. Check WiFi and try again." |
| **Idempotency** | POST requests don't duplicate on retry | Medium | Idempotency keys for stove ignite/shutdown |

**Why table stakes:** Production apps without retry logic fail on first network glitch. Users perceive as "app is broken" not "my WiFi is spotty."

**Existing foundation:** Zero retry logic. Any network failure immediately surfaces error to user.

**Complexity:** MEDIUM - Exponential backoff is simple, but idempotency for POST requests requires backend changes (idempotency key validation).

**Pattern:**
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 10
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}

// Usage
await retryWithBackoff(() =>
  fetch('/api/stove/ignite', {
    method: 'POST',
    headers: { 'Idempotency-Key': crypto.randomUUID() }
  })
);
```

---

### 4. Load Time <3s (Code Splitting)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|-------------|-------|
| **Page-level splitting** | Next.js automatic, ensures fast initial load | Low | Already implemented by Next.js |
| **Component lazy loading** | Large modals/charts load only when needed | Low | next/dynamic for StoveSettingsModal, charts |
| **Client-side only components** | Browser-specific code (Hue color picker) loads client-side | Low | ssr: false in dynamic import |
| **Loading states** | Suspense fallback prevents layout shift | Low | <Spinner /> during lazy load |

**Why table stakes:** Google Core Web Vitals threshold is 2.5s for Largest Contentful Paint (LCP). Users bounce above 3s load time. Next.js 15 apps expected to be fast.

**Existing foundation:** Next.js automatic page-level splitting active. Manual dynamic imports not used for large components.

**Complexity:** LOW - Next.js `next/dynamic` wraps React.lazy + Suspense. Minimal code change for immediate benefit.

**Pattern:**
```typescript
import dynamic from 'next/dynamic';

// Modal loaded only when opened
const StoveSettingsModal = dynamic(() => import('./StoveSettingsModal'), {
  loading: () => <Spinner />,
  ssr: false, // Client-side only
});

// Chart loaded only in viewport
const TemperatureChart = dynamic(() => import('./TemperatureChart'));
```

---

### 5. Critical Path Tests (E2E Flows)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|-------------|-------|
| **Login → control flow** | Core user journey must not break in production | Medium | Playwright: login → dashboard → ignite → verify |
| **3-5 critical flows** | Not 100% coverage, just critical paths | Medium | Login, stove control, scheduler, lights, logout |
| **Real Auth0 integration** | No mocks—real OAuth flow catches real bugs | Medium | Playwright auth setup with session reuse |
| **CI integration** | Tests run on PR, block merge if failing | Low | GitHub Actions with Playwright |
| **Failure debugging** | Screenshots/videos on failure | Low | Playwright automatic trace on failure |

**Why table stakes:** Playwright/Cypress are production standard in 2026. Critical flows breaking in production = incident. /api/scheduler/check (652 lines) has zero tests = high risk.

**Existing foundation:** Cypress 3034 tests exist, but no E2E critical path tests with real Auth0. TEST_MODE bypass used everywhere.

**Complexity:** MEDIUM - Playwright auth requires session caching, careful selector strategy, understanding of Auth0 redirect flow. 2026 consensus favors Playwright over Cypress for new tests.

**Pattern:**
```typescript
// tests/e2e/critical-flows.spec.ts
import { test, expect } from '@playwright/test';

test('User can control stove from dashboard', async ({ page }) => {
  // 1. Login (session cached from setup)
  await page.goto('/');

  // 2. Navigate to stove
  await page.getByRole('link', { name: 'Stove' }).click();
  await expect(page).toHaveURL('/stove');

  // 3. Verify status loads
  await expect(page.getByTestId('stove-status')).toBeVisible();

  // 4. Ignite stove
  await page.getByRole('button', { name: 'Ignite' }).click();
  await expect(page.getByText('Ignition started')).toBeVisible();

  // 5. Verify state update (polling should reflect change within 10s)
  await expect(page.getByTestId('stove-status'))
    .toContainText('Igniting', { timeout: 10000 });
});
```

---

### 6. Token Lifecycle Management (Automated Cleanup)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|-------------|-------|
| **30-day staleness detection** | FCM recommends monthly token refresh | Low | Firebase query: timestamp < now - 30days |
| **Automatic deletion** | Manual cleanup doesn't scale, users forget | Medium | Scheduled Firebase Function (daily cron) |
| **Timestamp on update** | Track when token last used | Low | Update timestamp on every token refresh |
| **Expired token removal** | Android tokens expire after 270 days | Low | Firebase Function filters and deletes |
| **Metrics accuracy** | Stale tokens skew delivery rates in console | Low | Cleanup improves FCM dashboard accuracy |

**Why table stakes:** Firebase official best practice. Tokens accumulate unbounded without cleanup. Delivery metrics become meaningless with 50% stale tokens.

**Existing foundation:** FCM tokens stored in Firebase RTDB. No cleanup logic exists. Tokens accumulate forever.

**Complexity:** LOW-MEDIUM - Firebase Function scheduled via Pub/Sub cron. Query and delete logic is straightforward. Testing requires time manipulation.

**Pattern:**
```typescript
// functions/cleanupTokens.ts
export const cleanupStaleTokens = functions.pubsub
  .schedule('0 2 * * *') // 2 AM daily
  .onRun(async () => {
    const now = Date.now();
    const staleThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days

    const tokensRef = admin.database().ref('fcmTokens');
    const snapshot = await tokensRef.once('value');
    const tokens = snapshot.val();

    const batch = [];
    for (const [userId, userTokens] of Object.entries(tokens)) {
      for (const [token, data] of Object.entries(userTokens)) {
        if (now - data.timestamp > staleThreshold) {
          batch.push(tokensRef.child(`${userId}/${token}`).remove());
        }
      }
    }

    await Promise.all(batch);
    console.log(`Cleaned up ${batch.length} stale tokens`);
  });
```

---

## Differentiators

Features that set product apart. Not expected, but highly valued.

### 1. Adaptive Polling (State Machine)

**What:** Polling intervals adjust dynamically based on user activity, errors, and visibility—not just on/off.

**Why valuable:** Most apps toggle polling binary (on when visible, off when hidden). Adaptive polling goes further: fast when user actively controlling, slow when idle, paused on errors with backoff.

**How it works:**
```typescript
type PollingState = 'active' | 'idle' | 'hidden' | 'error';

function useAdaptivePolling(callback: () => void) {
  const [state, setState] = useState<PollingState>('idle');
  const isVisible = useVisibilityChange();

  const intervals = {
    active: 5000,  // 5s when user actively controlling
    idle: 30000,   // 30s when no interaction for 2 minutes
    hidden: null,  // Stop when tab hidden
    error: null,   // Pause on error, restart with exponential backoff
  };

  useEffect(() => {
    if (!isVisible) {
      setState('hidden');
      return;
    }

    const interval = intervals[state];
    if (!interval) return;

    const id = setInterval(callback, interval);
    return () => clearInterval(id);
  }, [state, isVisible, callback]);

  return {
    markActive: () => setState('active'),
    markIdle: () => setState('idle'),
    markError: () => setState('error'),
  };
}
```

**Complexity:** MEDIUM - State machine for polling states, idle detection via user interaction tracking, error backoff logic.

**Competitive advantage:** Home Assistant, SmartThings poll at fixed intervals. This adapts to user behavior.

**Confidence:** MEDIUM - Pattern documented in community articles, not official React guide. Requires validation for battery impact.

---

### 2. Granular Loading States (Per-Device)

**What:** Each device shows its own loading indicator during control operations, not app-wide spinner.

**Why valuable:** When turning off stove, user sees "Spegnimento..." on stove card only. Lights, thermostat remain interactive. Spinner-of-death blocks entire UI.

**How it works:**
```typescript
// Per-device loading state
function StoveCard() {
  const [loading, setLoading] = useState<'ignite' | 'shutdown' | null>(null);

  async function handleIgnite() {
    setLoading('ignite');
    try {
      await retryWithBackoff(() => fetch('/api/stove/ignite', { method: 'POST' }));
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card>
      <Button
        onClick={handleIgnite}
        disabled={loading !== null}
      >
        {loading === 'ignite' ? <Spinner /> : 'Accendi'}
      </Button>
    </Card>
  );
}
```

**Complexity:** LOW - State management already exists per component. Just needs loading state extraction.

**Competitive advantage:** Better UX than global loading overlay. Allows multi-device operations in parallel.

**Confidence:** HIGH - Standard React pattern, no research needed.

---

### 3. Automatic Error Recovery

**What:** Error boundaries not only catch errors but attempt automatic recovery (retry component mount, refetch data).

**Why valuable:** Most error boundaries just show fallback UI. This tries to recover first, falls back only if recovery fails.

**How it works:**
```typescript
class SmartErrorBoundary extends React.Component {
  state = { hasError: false, retryCount: 0 };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logToAnalytics('error_caught', { error, info });

    // Attempt automatic recovery (max 2 retries)
    if (this.state.retryCount < 2) {
      setTimeout(() => {
        this.setState({ hasError: false, retryCount: this.state.retryCount + 1 });
      }, 1000 * Math.pow(2, this.state.retryCount)); // Exponential backoff
    }
  }

  render() {
    if (this.state.hasError && this.state.retryCount >= 2) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false, retryCount: 0 })} />;
    }
    return this.props.children;
  }
}
```

**Complexity:** MEDIUM-HIGH - Requires retry logic in error boundary, careful to avoid infinite loops, needs to distinguish transient vs permanent errors.

**Competitive advantage:** Most apps show error and give up. This tries to recover automatically.

**Confidence:** MEDIUM - Pattern is novel, requires validation to ensure no infinite retry loops.

---

### 4. Component Health Monitoring

**What:** Error boundaries log errors to analytics, dashboard shows component error rates over time.

**Why valuable:** Proactive error detection—"LightsCard had 15 errors last week, needs investigation" before users complain.

**How it works:**
```typescript
// Error boundary logs to Firebase Analytics
componentDidCatch(error, info) {
  logEvent(analytics, 'component_error', {
    component: this.props.componentName, // 'StoveCard'
    error: error.message,
    timestamp: Date.now(),
  });
}

// Analytics dashboard queries Firestore
const errorsByComponent = await getDocs(
  query(
    collection(db, 'analytics_events'),
    where('name', '==', 'component_error'),
    where('timestamp', '>', Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
  )
);

// Aggregate and display
const errorCounts = {};
errorsByComponent.forEach(doc => {
  const component = doc.data().params.component;
  errorCounts[component] = (errorCounts[component] || 0) + 1;
});
```

**Complexity:** MEDIUM-HIGH - Requires logging infrastructure, Firestore queries, analytics dashboard UI.

**Competitive advantage:** Proactive vs reactive error handling. Catch patterns before production incidents.

**Confidence:** MEDIUM - Requires observability infrastructure (already have Firebase Analytics, but need dashboard UI).

---

## Anti-Features

Features to explicitly NOT build. Scope creep prevention.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **100% E2E Coverage** | Slow (20min builds), flaky, expensive; critical paths sufficient | 3-5 Playwright flows: login, stove control, scheduler, lights, logout |
| **Premature Micro-Frontends** | Over-engineering for single team, complexity explosion | Component splitting + lazy loading adequate |
| **Global Error Handler Only** | One boundary = whole app crashes on any error | Feature-level boundaries: StoveCard, LightsCard, SchedulerCard |
| **Manual Token Management UI** | Users can't diagnose "which tokens are stale", needs automation | Scheduled Firebase Function, no UI |
| **Infinite Retries** | Battery drain, cost escalation, masks real problems | Max 3-5 retries, exponential backoff, then surface error |
| **Real-Time Everything** | WebSockets complexity, cost, overkill for thermostat (updates every 5min) | Polling with Visibility API adequate |
| **Component Library Migration** | Rewriting 37 design system components for marginal DX gain | Refactor existing components, don't rebuild from scratch |
| **Playwright Migration (from Cypress)** | 3 weeks full-time for 3034 tests, marginal ROI for family app | Add new E2E critical path tests in Playwright, keep Cypress unit tests |

---

## Feature Dependencies

Dependencies between features (must build X before Y).

```
Error Boundaries
  ↓ (required foundation)
Component Splitting (split points need boundaries)

Adaptive Polling
  ↓ (builds on)
Visibility API Polling (foundation)

Retry Logic
  ↓ (requires)
Idempotency (POST requests need idempotency keys)

Code Splitting
  ↓ (enables)
Component Splitting (smaller components = easier to lazy load)

Critical Path Tests
  ↓ (validates)
All features (tests verify retry, error boundaries, polling work)

Token Cleanup
  ↓ (no dependency, independent)
(none)
```

**Critical path:**
1. Error Boundaries (foundation for reliability)
2. Retry Logic (foundation for resilience)
3. Visibility API Polling (quick win, low complexity)
4. Component Splitting (enables lazy loading, improves maintainability)
5. Adaptive Polling (builds on visibility API)
6. Critical Path Tests (validates all features)
7. Token Cleanup (independent, can run in parallel)

**Parallelizable:**
- Token Cleanup (Firebase Function, independent)
- Visibility API Polling (low complexity, no dependencies)
- Code Splitting (Next.js feature, no custom logic needed)

---

## MVP Recommendation

Prioritize features for maximum reliability improvement with minimum complexity.

### Phase 1: Resilience Foundation (Week 1)

**Build first:**
1. **Error Boundaries** - Prevents app crashes (MEDIUM complexity, CRITICAL value)
   - Global boundary for catastrophic errors
   - Feature boundaries: StoveCard, LightsCard, SchedulerCard
   - ErrorFallback component with reset button

2. **Retry Logic** - Makes unreliable networks feel reliable (MEDIUM complexity, HIGH value)
   - Exponential backoff helper function
   - Apply to device control endpoints (/api/stove/ignite, /api/lights/control)
   - Max 3 retries, surface error after

3. **Visibility API Polling** - 80% resource savings (LOW complexity, HIGH value)
   - Stop polling when tab hidden
   - Resume when tab visible
   - 5-line change to existing polling logic

**Rationale:** These are table stakes. Without error boundaries, one bug crashes the app. Without retry, first network glitch breaks UX. Without visibility API, battery drains unnecessarily.

**Test coverage:** Unit tests for retry logic, integration tests for error boundaries (throw error in child, verify fallback), Cypress test for visibility (simulate tab hidden).

**Estimated effort:** 3-5 days

---

### Phase 2: Performance Optimization (Week 2)

**Build next:**
4. **Component Splitting** - Maintainability + load time (MEDIUM complexity, MEDIUM-HIGH value)
   - Split StoveCard (1217 lines) → StoveStatus, StoveControls, StoveSchedule
   - Split LightsCard (1186 lines) → LightsList, LightControl, LightGroups
   - Split stove/page.tsx (1054 lines) → Compose smaller components
   - Preserve existing tests, update imports

5. **Code Splitting (Lazy Loading)** - Fast load times (LOW complexity, MEDIUM value)
   - Lazy load StoveSettingsModal, LightsSettingsModal
   - Lazy load TemperatureChart, ConsumptionChart
   - ssr: false for client-only components (Hue color picker)

**Rationale:** 1000+ line components slow parse time, harder to maintain, harder to test. Splitting improves DX and load time. Lazy loading defers non-critical code.

**Test coverage:** Snapshot tests for split components (verify rendered output identical), unit tests for new component boundaries.

**Estimated effort:** 5-7 days

---

### Phase 3: Advanced Resilience (Week 3)

**Build later:**
6. **Adaptive Polling** - Beyond visibility toggle (MEDIUM complexity, MEDIUM value)
   - Polling state machine: active (5s), idle (30s), hidden (stop), error (backoff)
   - Idle detection: no user interaction for 2 minutes
   - Error backoff: pause on error, resume with exponential backoff

7. **Granular Loading States** - Better UX (LOW complexity, LOW-MEDIUM value)
   - Per-device loading indicators
   - Optimistic updates with rollback on error

**Defer to later:**
- Automatic error recovery (complex, requires validation)
- Component health monitoring (requires observability infrastructure)

**Rationale:** Adaptive polling is nice-to-have, not critical. Users can live with visibility-based polling. Granular loading is polish, not functionality.

**Test coverage:** Unit tests for polling state machine, Cypress tests for loading states.

**Estimated effort:** 3-5 days

---

### Phase 4: Quality Gates (Week 4)

**Build finally:**
8. **Critical Path Tests** - Catch regressions (MEDIUM complexity, HIGH value)
   - Playwright setup with Auth0 session caching
   - Login → Dashboard → Control Stove → Verify State
   - 3-5 critical flows: login, stove control, scheduler, lights, logout
   - CI integration: GitHub Actions, fail PR if tests fail

9. **Token Lifecycle Cleanup** - Operational hygiene (LOW-MEDIUM complexity, MEDIUM value)
   - Firebase Function: daily cron at 2 AM
   - Delete tokens with timestamp > 30 days old
   - Log cleanup count to Firebase Analytics

**Rationale:** Tests validate all features work together. Token cleanup is operational must-have but not user-facing.

**Test coverage:** E2E tests themselves are the deliverable. Unit test for token cleanup logic.

**Estimated effort:** 5-7 days

---

## Deferred Features (Out of Scope for v7.0)

**Save for v7.1 or later:**

1. **Automatic error recovery** - Complex retry logic in error boundaries, risk of infinite loops. Manual reset sufficient for v7.0.

2. **Component health monitoring dashboard** - Requires observability infrastructure, analytics dashboard UI. Error logging sufficient for v7.0.

3. **WebSocket real-time updates** - Complexity, cost, overkill for thermostat. Polling adequate.

4. **Advanced code splitting** (route-based prefetching) - Next.js automatic splitting sufficient. Diminishing returns.

5. **Comprehensive E2E coverage** - 3-5 critical flows sufficient. Full coverage = weeks of work for marginal benefit.

6. **Service worker cache strategies** - Already have Serwist offline mode from v6.0. Further optimization low priority.

7. **Performance monitoring (Lighthouse CI)** - Useful but not critical. Manual Lighthouse audits sufficient for v7.0.

---

## Complexity Summary

| Feature | Complexity | Effort | Risk Level |
|---------|-----------|--------|------------|
| Error Boundaries | MEDIUM | 2-3 days | LOW |
| Retry Logic | MEDIUM | 2-3 days | LOW |
| Visibility API Polling | LOW | 1 day | LOW |
| Component Splitting | MEDIUM | 5-7 days | MEDIUM |
| Code Splitting (Lazy) | LOW | 2-3 days | LOW |
| Adaptive Polling | MEDIUM | 3-5 days | MEDIUM |
| Granular Loading States | LOW | 2-3 days | LOW |
| Critical Path Tests | MEDIUM | 5-7 days | HIGH |
| Token Cleanup | LOW-MEDIUM | 2-3 days | LOW |

**Highest risk:** Critical path E2E tests (Auth0 integration complexity, Playwright learning curve, flakiness potential).

**Lowest risk:** Visibility API polling, code splitting (well-documented, minimal code change).

**Total estimated effort:** 25-35 days (5-7 weeks with buffer)

---

## Implementation Patterns

### Error Boundaries (Class Component Required)

```typescript
// src/components/errors/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { logEvent } from '@/lib/analytics';
import ErrorFallback from './ErrorFallback';

interface Props {
  children: ReactNode;
  componentName: string; // For logging
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logEvent('component_error', {
      component: this.props.componentName,
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          componentName={this.props.componentName}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Retry with Exponential Backoff

```typescript
// src/lib/retry.ts
export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 10,
    maxDelay = 5000,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw new RetryError(
          `Failed after ${attempt + 1} attempts`,
          attempt + 1,
          lastError
        );
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      onRetry?.(attempt + 1, lastError);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Usage example
import { retryWithBackoff } from '@/lib/retry';

async function igniteStove() {
  return retryWithBackoff(
    () => fetch('/api/stove/ignite', {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() }
    }),
    {
      maxRetries: 3,
      onRetry: (attempt, error) => {
        console.log(`Retry attempt ${attempt}: ${error.message}`);
        toast.info(`Tentativo ${attempt} in corso...`);
      }
    }
  );
}
```

### Visibility API Hook

```typescript
// src/hooks/useVisibilityChange.ts
import { useState, useEffect } from 'react';

export function useVisibilityChange(): boolean {
  const [isVisible, setIsVisible] = useState(() => !document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

// Usage in polling component
import { useVisibilityChange } from '@/hooks/useVisibilityChange';

export function StoveCard() {
  const isVisible = useVisibilityChange();

  useEffect(() => {
    if (!isVisible) return; // Stop polling when tab hidden

    const pollStoveStatus = async () => {
      // Fetch stove status
    };

    const intervalId = setInterval(pollStoveStatus, 5000);
    return () => clearInterval(intervalId);
  }, [isVisible]);

  // ...
}
```

### Adaptive Polling Hook

```typescript
// src/hooks/useAdaptivePolling.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useVisibilityChange } from './useVisibilityChange';

type PollingState = 'active' | 'idle' | 'hidden' | 'error';

interface AdaptivePollingOptions {
  activeInterval?: number;
  idleInterval?: number;
  idleTimeout?: number;
  errorBackoffBase?: number;
  errorBackoffMax?: number;
}

export function useAdaptivePolling(
  callback: () => void | Promise<void>,
  options: AdaptivePollingOptions = {}
) {
  const {
    activeInterval = 5000,
    idleInterval = 30000,
    idleTimeout = 120000, // 2 minutes
    errorBackoffBase = 1000,
    errorBackoffMax = 60000,
  } = options;

  const [state, setState] = useState<PollingState>('idle');
  const [errorCount, setErrorCount] = useState(0);
  const isVisible = useVisibilityChange();
  const lastActivityRef = useRef(Date.now());

  // Track user activity
  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (state !== 'active') setState('active');
  }, [state]);

  // Check for idle state
  useEffect(() => {
    const checkIdle = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      if (timeSinceActivity > idleTimeout && state === 'active') {
        setState('idle');
      }
    }, 5000);

    return () => clearInterval(checkIdle);
  }, [idleTimeout, state]);

  // Main polling effect
  useEffect(() => {
    if (!isVisible) {
      setState('hidden');
      return;
    }

    if (state === 'hidden') {
      setState('idle');
    }

    if (state === 'error') {
      // Exponential backoff on error
      const backoffDelay = Math.min(
        errorBackoffBase * Math.pow(2, errorCount),
        errorBackoffMax
      );

      const timeoutId = setTimeout(() => {
        setState('idle');
        setErrorCount(0);
      }, backoffDelay);

      return () => clearTimeout(timeoutId);
    }

    const interval = state === 'active' ? activeInterval : idleInterval;

    const executeCallback = async () => {
      try {
        await callback();
        setErrorCount(0); // Reset error count on success
      } catch (error) {
        console.error('Polling error:', error);
        setErrorCount(prev => prev + 1);
        setState('error');
      }
    };

    const intervalId = setInterval(executeCallback, interval);

    // Execute immediately on interval change
    executeCallback();

    return () => clearInterval(intervalId);
  }, [state, isVisible, callback, activeInterval, idleInterval, errorCount, errorBackoffBase, errorBackoffMax]);

  return {
    state,
    markActivity,
    forceActive: () => setState('active'),
    forceIdle: () => setState('idle'),
  };
}
```

### Component Splitting (Presentational/Container Pattern)

```typescript
// Before: StoveCard.tsx (1217 lines)

// After: Composition of smaller components

// src/components/stove/StoveCard.tsx (orchestrator, ~100 lines)
import ErrorBoundary from '@/components/errors/ErrorBoundary';
import StoveStatus from './StoveStatus';
import StoveControls from './StoveControls';
import StoveSchedule from './StoveSchedule';

export function StoveCard() {
  const { markActivity } = useAdaptivePolling(pollStoveStatus);

  return (
    <ErrorBoundary componentName="StoveCard">
      <Card>
        <StoveStatus />
        <StoveControls onAction={markActivity} />
        <StoveSchedule />
      </Card>
    </ErrorBoundary>
  );
}

// src/components/stove/StoveStatus.tsx (~150 lines)
export function StoveStatus() {
  const stoveState = useStoveState();
  return <StatusDisplay state={stoveState} />;
}

// src/components/stove/StoveControls.tsx (~200 lines)
interface Props {
  onAction: () => void;
}

export function StoveControls({ onAction }: Props) {
  const [loading, setLoading] = useState<'ignite' | 'shutdown' | null>(null);

  async function handleIgnite() {
    setLoading('ignite');
    onAction(); // Mark activity for adaptive polling
    try {
      await retryWithBackoff(() => igniteStove());
    } finally {
      setLoading(null);
    }
  }

  return <ControlPanel loading={loading} onIgnite={handleIgnite} />;
}

// src/components/stove/StoveSchedule.tsx (~150 lines)
export function StoveSchedule() {
  const schedule = useSchedule();
  return <ScheduleDisplay schedule={schedule} />;
}
```

### Lazy Loading (Next.js Dynamic Import)

```typescript
// src/app/stove/page.tsx
import dynamic from 'next/dynamic';
import StoveCard from '@/components/stove/StoveCard';

// Lazy load heavy components
const StoveSettingsModal = dynamic(
  () => import('@/components/stove/StoveSettingsModal'),
  {
    loading: () => <Spinner />,
    ssr: false, // Client-side only (uses localStorage)
  }
);

const TemperatureChart = dynamic(
  () => import('@/components/stove/TemperatureChart'),
  {
    loading: () => <ChartSkeleton />,
  }
);

export default function StovePage() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div>
      <StoveCard />

      {/* Chart loads on scroll into viewport */}
      <TemperatureChart />

      {/* Modal loads only when opened */}
      {showSettings && (
        <StoveSettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
```

### Critical Path Test (Playwright)

```typescript
// tests/e2e/critical-flows.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Assumes auth state saved from global setup
    await page.goto('/');
  });

  test('User can control stove from dashboard', async ({ page }) => {
    // Navigate to stove page
    await page.getByRole('link', { name: /stufa/i }).click();
    await expect(page).toHaveURL(/\/stove/);

    // Verify status loads
    const statusCard = page.getByTestId('stove-status');
    await expect(statusCard).toBeVisible();
    await expect(statusCard).toContainText(/stato/i);

    // Ignite stove
    const igniteButton = page.getByRole('button', { name: /accendi/i });
    await igniteButton.click();

    // Verify optimistic update
    await expect(page.getByText(/accensione in corso/i)).toBeVisible();

    // Verify polling updates status (within 10 seconds)
    await expect(statusCard).toContainText(/igniting|accensione/i, {
      timeout: 10000,
    });
  });

  test('User can view and edit schedule', async ({ page }) => {
    await page.goto('/stove');

    // Open scheduler
    const scheduleButton = page.getByRole('button', { name: /programma/i });
    await scheduleButton.click();

    // Verify scheduler modal
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/orari/i);

    // Add schedule (example)
    await page.getByLabel(/ora accensione/i).fill('07:00');
    await page.getByRole('button', { name: /salva/i }).click();

    // Verify success toast
    await expect(page.getByText(/salvato/i)).toBeVisible();
  });

  test('Protected routes redirect unauthenticated users', async ({ browser }) => {
    // Create new incognito context (no auth state)
    const context = await browser.newContext();
    const page = await context.newPage();

    // Try to access protected route
    await page.goto('/stove');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText(/sign in/i)).toBeVisible();

    await context.close();
  });
});
```

### Token Cleanup (Firebase Function)

```typescript
// functions/src/cleanupTokens.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const cleanupStaleTokens = functions.pubsub
  .schedule('0 2 * * *') // Daily at 2 AM
  .timeZone('Europe/Rome')
  .onRun(async (context) => {
    const now = Date.now();
    const staleThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

    const db = admin.database();
    const tokensRef = db.ref('fcmTokens');

    try {
      const snapshot = await tokensRef.once('value');
      const allTokens = snapshot.val();

      if (!allTokens) {
        console.log('No tokens to clean up');
        return null;
      }

      const deletions: Promise<void>[] = [];
      let staleCount = 0;

      for (const [userId, userTokens] of Object.entries(allTokens)) {
        if (!userTokens || typeof userTokens !== 'object') continue;

        for (const [tokenId, tokenData] of Object.entries(userTokens as Record<string, any>)) {
          const timestamp = tokenData?.timestamp;

          if (!timestamp || (now - timestamp) > staleThreshold) {
            deletions.push(
              tokensRef.child(`${userId}/${tokenId}`).remove()
            );
            staleCount++;
          }
        }
      }

      await Promise.all(deletions);

      console.log(`Cleaned up ${staleCount} stale FCM tokens`);

      // Log to analytics for monitoring
      await db.ref('monitoring/tokenCleanup').push({
        timestamp: now,
        tokensDeleted: staleCount,
      });

      return null;
    } catch (error) {
      console.error('Error cleaning up tokens:', error);
      throw error;
    }
  });
```

---

## Research Confidence

| Feature Category | Confidence | Source Quality |
|------------------|------------|----------------|
| Error Boundaries | HIGH | Official React docs, recent 2026 articles |
| Retry Strategies | HIGH | Official patterns, established npm packages |
| Visibility API | HIGH | MDN, established browser API |
| Code Splitting | HIGH | Official Next.js docs (v16.1.6, Feb 2026) |
| Token Lifecycle | HIGH | Official Firebase docs |
| Critical Path Testing | MEDIUM-HIGH | Playwright best practices 2026, industry consensus |
| Component Splitting | HIGH | React patterns, authoritative sources |
| Adaptive Polling | MEDIUM | Community patterns, no official guide |

---

## Key Insights

### Error Boundaries (Critical Foundation)

- **Must be class components** — No hooks equivalent exists yet (react-error-boundary package is alternative)
- **Don't catch:** Event handlers, async code (setTimeout, promises), errors in boundary itself
- **Strategic placement:** Feature-level (StoveCard, LightsCard), not global-only or component-level
- **Production pattern:** Log to analytics in componentDidCatch, not just console.error
- **User experience:** Show actionable fallback ("Something went wrong. Retry?"), not cryptic messages

### Retry Logic (Network Resilience)

- **Standard pattern:** 10ms → 20ms → 40ms → 80ms → 160ms (exponential backoff)
- **Max retries:** 3-5 attempts, then surface error (never infinite)
- **Idempotency:** POST requests need idempotency keys to prevent duplicate actions
- **User feedback:** Show retry attempt number, don't leave users guessing
- **Error surfacing:** After max retries, show actionable message ("Check WiFi, try again")

### Polling Optimization (Resource Efficiency)

- **Visibility API:** Supported IE10+, simple event listener, 80% resource savings
- **Battery impact:** Mobile OS throttles hidden tabs to 1req/min after 5 minutes anyway
- **Bandwidth:** Cellular users notice unnecessary polling
- **Adaptive patterns:** Beyond visibility—active/idle/error states for smart intervals
- **User expectations:** App should respect system resources, feel "native"

### Code Splitting (Load Performance)

- **Next.js automatic:** Page-level splitting built-in, zero config
- **Manual splitting:** next/dynamic for Client Components, modals, charts
- **SSR consideration:** ssr: false for browser-only code (localStorage, window)
- **Loading states:** Suspense fallback prevents layout shift, improves perceived performance
- **Bundle analysis:** @next/bundle-analyzer identifies bloat

### Token Lifecycle (Operational Hygiene)

- **FCM staleness:** 30 days inactive = stale, 270 days = expired (Android)
- **Cleanup frequency:** Daily/weekly scheduled function adequate
- **Timestamp tracking:** Update on every token refresh, not just registration
- **Metrics impact:** Stale tokens skew FCM console delivery rates
- **Resubscription:** Monthly topic resubscription auto-heals inactive devices

### Testing Strategy (Quality Gates)

- **E2E scope:** 3-5 critical flows (login, core features), not full coverage
- **Tool choice 2026:** Playwright > Cypress for new tests (speed, reliability)
- **CI integration:** Fast tests first, E2E gated (don't block on slow tests)
- **Auth testing:** Real Auth0 flow, not mocks (catches real bugs)
- **Focus:** User journeys over line coverage metrics

### Component Splitting (Maintainability)

- **Threshold:** 200-300 lines = consider splitting, 1000+ lines = must split
- **Patterns:** Presentational/Container, Custom Hooks extraction, Composition
- **Testing benefit:** Smaller components = easier to test in isolation
- **TypeScript benefit:** Explicit prop types at component boundaries
- **DX impact:** Easier to navigate, review, maintain

---

## Sources

### Error Boundaries
- [Error Boundaries – React (Official Docs)](https://react.dev/reference/react/Component)
- [How to Implement Error Boundaries for Graceful Error Handling in React (2026)](https://oneuptime.com/blog/post/2026-01-15-react-error-boundaries/view)
- [Advanced React Error Boundaries for Production Apps | Medium](https://medium.com/@asiandigitalhub/advanced-react-error-boundaries-for-production-apps-f9ad9d2ae966)
- [Error Handling in React Apps: A Complete Guide | Medium](https://medium.com/@rajeevranjan2k11/error-handling-in-react-apps-a-complete-guide-to-error-boundaries-and-best-practices-094aa0e4a641)

### Code Splitting & Lazy Loading
- [Guides: Lazy Loading | Next.js (Official, v16.1.6, 2026-02-09)](https://nextjs.org/docs/app/guides/lazy-loading)
- [Mastering Lazy Loading in Next.js 15: Advanced Patterns for Peak Performance (2026)](https://medium.com/@sureshdotariya/mastering-lazy-loading-in-next-js-15-advanced-patterns-for-peak-performance-75e0bd574c76)
- [Dynamic imports and code splitting with Next.js - LogRocket](https://blog.logrocket.com/dynamic-imports-code-splitting-next-js/)
- [How to Use Code Splitting to Reduce Initial Load Times in Next.js | Blazity](https://blazity.com/blog/code-splitting-next-js)

### Adaptive Polling & Visibility API
- [Implementing Polling in React: A Guide for Efficient Real-Time Data Fetching | Medium](https://medium.com/@sfcofc/implementing-polling-in-react-a-guide-for-efficient-real-time-data-fetching-47f0887c54a7)
- [Modern JavaScript Polling: Adaptive Strategies That Actually Work (Part 1) | Medium](https://medium.com/tech-pulse-by-collatzinc/modern-javascript-polling-adaptive-strategies-that-actually-work-part-1-9909f5946730)
- [Enhancing User Experience with React Polling in Real-Time Apps | DhiWise](https://www.dhiwise.com/post/a-guide-to-real-time-applications-with-react-polling)

### Retry Strategies & Exponential Backoff
- [How to Implement Retry Logic with Exponential Backoff in React (2026)](https://oneuptime.com/blog/post/2026-01-15-retry-logic-exponential-backoff-react/view)
- [Retrying API Calls with Exponential Backoff in JavaScript](https://bpaulino.com/entries/retrying-api-calls-with-exponential-backoff)
- [How to implement an exponential backoff retry strategy in Javascript - Advanced Web Machinery](https://advancedweb.hu/how-to-implement-an-exponential-backoff-retry-strategy-in-javascript/)
- [exponential-backoff - npm](https://www.npmjs.com/package/exponential-backoff)

### FCM Token Lifecycle Management
- [Best practices for FCM registration token management | Firebase (Official)](https://firebase.google.com/docs/cloud-messaging/manage-tokens)
- [Managing Cloud Messaging Tokens | Firebase Blog](https://firebase.blog/posts/2023/04/managing-cloud-messaging-tokens/)
- [Lifecycle of Push Notification based Device Tokens | Medium](https://medium.com/@chunilalkukreja/lifecycle-of-fcm-device-tokens-61681bb6fbcf)

### Critical Path Testing with Playwright
- [15 Best Practices for Playwright testing in 2026 | BrowserStack](https://www.browserstack.com/guide/playwright-best-practices)
- [Why Testers Will Switch to Playwright in 2026 | Testleaf](https://www.testleaf.com/blog/why-testers-switch-to-playwright-2026-guide/)
- [Testing Next.js Applications: A Complete Guide To Catching Bugs Before QA Does (2026)](https://trillionclues.medium.com/testing-next-js-applications-a-complete-guide-to-catching-bugs-before-qa-does-a1db8d1a0a3b)
- [Testing in 2026: Jest, React Testing Library, and Full Stack Testing Strategies](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies)

### Component Refactoring Patterns
- [Common Sense Refactoring of a Messy React Component | Alex Kondov](https://alexkondov.com/refactoring-a-messy-react-component/)
- [Refactoring components in React with custom hooks | CodeScene](https://codescene.com/engineering-blog/refactoring-components-in-react-with-custom-hooks)
- [Building Reusable React Components in 2026 | Medium](https://medium.com/@romko.kozak/building-reusable-react-components-in-2026-a461d30f8ce4)
- [Modularizing React Applications with Established UI Patterns | Martin Fowler](https://martinfowler.com/articles/modularizing-react-apps.html)

---

**Confidence Level:** HIGH for table stakes and implementation patterns (official docs, established practices), MEDIUM for differentiators (adaptive polling, component health monitoring require validation).

**Last Updated:** 2026-02-11
