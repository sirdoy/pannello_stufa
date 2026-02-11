---
phase: 54-analytics-dashboard
plan: 01
subsystem: analytics-foundation
tags: [analytics, gdpr, consent, event-logging, firebase-rtdb]
dependency_graph:
  requires: []
  provides:
    - analytics-types
    - consent-service
    - event-logger
  affects:
    - future-analytics-plans
tech_stack:
  added: []
  patterns:
    - fire-and-forget-logging
    - ssr-safe-localstorage
    - gdpr-consent-management
key_files:
  created:
    - types/analytics.ts
    - lib/analyticsConsentService.ts
    - lib/analyticsEventLogger.ts
    - lib/__tests__/analyticsConsentService.test.ts
    - lib/__tests__/analyticsEventLogger.test.ts
  modified: []
decisions:
  - decision: "Consent enforcement is caller responsibility, not logger responsibility"
    rationale: "Event logger is server-side only; client code checks canTrackAnalytics(), API routes check X-Analytics-Consent header, scheduler logs unconditionally (server-initiated events)"
    alternatives: ["Embed consent check in logger"]
    trade_offs: "More flexible but requires caller discipline"
  - decision: "Fire-and-forget pattern for event logging"
    rationale: "Analytics logging failures should never block stove control or scheduler execution"
    alternatives: ["Throw errors on logging failure"]
    trade_offs: "Silent failures but guaranteed system stability"
  - decision: "7-day default retention for analytics events"
    rationale: "Balances dashboard utility with storage costs; matches cronExecutionLogger pattern"
    alternatives: ["30-day retention", "90-day retention"]
    trade_offs: "Shorter history but lower storage overhead"
metrics:
  duration_minutes: 5.7
  tasks_completed: 2
  files_created: 5
  files_modified: 0
  tests_added: 38
  tests_passing: 38
  commits: 2
  completed_date: "2026-02-11"
---

# Phase 54 Plan 01: Analytics Foundation Summary

**Analytics types, GDPR consent service, and fire-and-forget event logger for stove state tracking**

## What Was Built

### Core Components

1. **types/analytics.ts** (67 lines)
   - `ConsentState`: 'unknown' | 'granted' | 'denied'
   - `AnalyticsEventType`: stove_ignite | stove_shutdown | power_change
   - `AnalyticsEventSource`: manual | scheduler | automation
   - `AnalyticsEvent`: timestamp, eventType, powerLevel?, source, userId?
   - `DailyStats`: date, totalHours, byPowerLevel, pelletEstimate, ignition/shutdown counts
   - `CalibrationSettings`: pelletCalibrationFactor, lastCalibration data, costPerKg
   - `AnalyticsPeriod`: 7 | 30 | 90 days

2. **lib/analyticsConsentService.ts** (110 lines)
   - `getConsentState()`: Returns current consent state (SSR-safe)
   - `setConsentState(granted)`: Writes consent decision + timestamp to localStorage
   - `canTrackAnalytics()`: Returns true only when consent explicitly granted
   - `getConsentTimestamp()`: Returns ISO timestamp of consent decision
   - `resetConsent()`: Removes all consent data (for settings page)
   - SSR-safe: all functions check `typeof window === 'undefined'`

3. **lib/analyticsEventLogger.ts** (144 lines)
   - `logAnalyticsEvent(event)`: Fire-and-forget write to Firebase RTDB
   - `getAnalyticsEventsForDate(dateKey)`: Read events filtered by YYYY-MM-DD prefix
   - `cleanupOldAnalyticsEvents(retentionDays)`: Auto-cleanup old entries (default 7 days)
   - Server-side only (uses adminDbSet/adminDbGet)
   - Environment-aware paths (dev/ prefix in development)
   - Errors logged but never thrown

### Test Coverage

**lib/__tests__/analyticsConsentService.test.ts** (21 tests)
- SSR safety (4 tests): window undefined handling
- Initial state (3 tests): defaults to 'unknown', canTrack returns false
- Granting consent (4 tests): state becomes 'granted', timestamp written, canTrack returns true
- Denying consent (4 tests): state becomes 'denied', timestamp written, canTrack returns false
- Resetting consent (4 tests): removes all localStorage data, returns to 'unknown'
- Changing consent (2 tests): timestamp updates on state change

**lib/__tests__/analyticsEventLogger.test.ts** (17 tests)
- logAnalyticsEvent (6 tests): timestamp key generation, optional fields, error handling
- getAnalyticsEventsForDate (5 tests): date filtering, empty data handling, error resilience
- cleanupOldAnalyticsEvents (6 tests): retention period enforcement, custom retention, error handling

## Implementation Highlights

### GDPR Compliance Pattern

**Consent state management:**
```typescript
// Client-side usage
if (canTrackAnalytics()) {
  // Make API call with X-Analytics-Consent header
}

// API route check
const consent = request.headers.get('X-Analytics-Consent');
if (consent === 'granted') {
  await logAnalyticsEvent({ ... });
}

// Scheduler (unconditional)
await logAnalyticsEvent({
  eventType: 'stove_ignite',
  source: 'scheduler' // No userId - server-initiated
});
```

### Fire-and-Forget Pattern

Following `cronExecutionLogger.ts` pattern:
- Timestamp key generation: `timestamp.replace(/[:.]/g, '-')`
- Try/catch with console.error but no throw
- Environment-specific paths via `getEnvironmentPath()`
- Automatic cleanup on retention boundary

### SSR Safety

All consent service functions check `typeof window === 'undefined'`:
- Returns 'unknown' state when SSR
- Silent no-op for setters
- Prevents localStorage access errors during Next.js SSR

## Deviations from Plan

None - plan executed exactly as written.

## Dependencies

**Requires:**
- `lib/firebaseAdmin.ts`: adminDbSet, adminDbGet for event persistence
- `lib/environmentHelper.ts`: getEnvironmentPath for dev/prod path prefixing

**Provides:**
- Analytics types for all future analytics plans
- Consent service for client-side GDPR compliance
- Event logger for server-side analytics data collection

**Affects:**
- Phase 54 plans 02-05: Will use these types and services
- API routes: Will check X-Analytics-Consent header before logging
- Scheduler: Will log events unconditionally (server-initiated)

## Quality Metrics

- **Test coverage:** 38/38 tests passing (100%)
- **Type safety:** All TypeScript interfaces exported correctly
- **Error handling:** Fire-and-forget pattern prevents analytics failures from blocking operations
- **SSR safety:** No localStorage access during server rendering
- **Code quality:** Follows existing patterns (cronExecutionLogger, environmentHelper)

## Key Decisions

1. **Consent enforcement is caller responsibility**
   - Event logger does NOT import consent service (server-side only)
   - Client code checks `canTrackAnalytics()` before API calls
   - API routes check `X-Analytics-Consent` header
   - Scheduler logs unconditionally (no user context)
   - **Why:** Clear separation of concerns, server-side logger can't access client localStorage

2. **Fire-and-forget logging**
   - Errors caught and logged but never thrown
   - Analytics failures never block stove control
   - **Why:** Analytics is observability, not critical path

3. **7-day default retention**
   - Matches `cronExecutionLogger` pattern
   - Dashboard shows recent trends, not long-term history
   - **Why:** Balances utility with storage costs

## Next Steps

Following plans will build on this foundation:
- **54-02**: Pellet estimation service (uses CalibrationSettings type)
- **54-03**: Daily stats aggregator (uses DailyStats type)
- **54-04**: Analytics dashboard page (uses all types + services)
- **54-05**: GDPR consent banner (uses consent service)

## Verification

```bash
# All tests pass
npx jest lib/__tests__/analyticsConsentService.test.ts \
  lib/__tests__/analyticsEventLogger.test.ts --no-coverage
# ✅ 38 tests passing

# Types exported correctly
grep "^export" types/analytics.ts
# ✅ 7 types/interfaces exported

# Consent service exports
grep "^export function" lib/analyticsConsentService.ts
# ✅ 5 functions exported (get/set/canTrack/getTimestamp/reset)

# Event logger exports
grep "^export async function" lib/analyticsEventLogger.ts
# ✅ 3 functions exported (log/getForDate/cleanup)
```

## Commits

1. **3fbb08d**: feat(54-01): create analytics types and consent service
   - types/analytics.ts: All analytics data structures
   - lib/analyticsConsentService.ts: GDPR consent management
   - lib/__tests__/analyticsConsentService.test.ts: 21 tests

2. **3691c09**: feat(54-01): create analytics event logger
   - lib/analyticsEventLogger.ts: Fire-and-forget event logging
   - lib/__tests__/analyticsEventLogger.test.ts: 17 tests

## Self-Check: PASSED

**Files created:**
```bash
[ -f "types/analytics.ts" ] && echo "✅ types/analytics.ts"
[ -f "lib/analyticsConsentService.ts" ] && echo "✅ lib/analyticsConsentService.ts"
[ -f "lib/analyticsEventLogger.ts" ] && echo "✅ lib/analyticsEventLogger.ts"
[ -f "lib/__tests__/analyticsConsentService.test.ts" ] && echo "✅ test file 1"
[ -f "lib/__tests__/analyticsEventLogger.test.ts" ] && echo "✅ test file 2"
```

**Commits exist:**
```bash
git log --oneline | grep -E "(3fbb08d|3691c09)"
# ✅ 3fbb08d feat(54-01): create analytics types and consent service
# ✅ 3691c09 feat(54-01): create analytics event logger
```

**All claims verified.**
