---
phase: 56-error-boundaries
plan: 01
subsystem: error-handling
tags: [foundation, validation, analytics, error-boundaries]
dependency_graph:
  requires: [analytics-infrastructure, firebase-rtdb]
  provides: [validation-error-class, error-logging-api, global-error-boundary]
  affects: [all-components]
tech_stack:
  added: [ValidationError, logComponentError, /api/analytics/error, app/error.tsx]
  patterns: [fire-and-forget-logging, instanceof-bypass, error-boundary]
key_files:
  created:
    - lib/errors/ValidationError.ts
    - lib/errors/index.ts
    - app/api/analytics/error/route.ts
    - app/error.tsx
    - lib/__tests__/ValidationError.test.ts
    - lib/__tests__/analyticsErrorLogger.test.ts
  modified:
    - lib/analyticsEventLogger.ts
    - types/analytics.ts
    - lib/analyticsAggregationService.ts
decisions:
  - decision: ValidationError bypasses error boundaries via instanceof check
    rationale: Safety-critical validation errors (maintenance required) must propagate to show blocking UI
    impact: Component error boundaries will need to check instanceof ValidationError
  - decision: Error logging does not check analytics consent
    rationale: Error logging is operational (necessary for app function), not analytics tracking per GDPR
    impact: Errors always logged regardless of user consent state
  - decision: component_error events filtered from analytics aggregation
    rationale: Usage statistics should only include stove operation events, not error events
    impact: Error events stored in same RTDB path but excluded from daily stats
metrics:
  duration: 6 min
  tasks_completed: 2
  tests_added: 12
  tests_passing: 12
  files_created: 6
  files_modified: 3
  commits: 2
  completed_date: 2026-02-12
---

# Phase 56 Plan 01: Error Boundaries Foundation Summary

**One-liner:** ValidationError custom class with instanceof bypass, error logging API route, and global error.tsx fallback with Ember Noir UI.

## What Was Built

Created the foundation layer for Phase 56 error boundaries:

1. **ValidationError Class** (`lib/errors/ValidationError.ts`)
   - Custom error class extending Error with `code` and `details` properties
   - Sets `this.name = 'ValidationError'` for instanceof checks
   - Captures stack traces in V8 engines (Error.captureStackTrace)
   - Static factory: `ValidationError.maintenanceRequired(details?)` returns instance with `MAINTENANCE_REQUIRED` code
   - Exported via barrel `lib/errors/index.ts`

2. **Analytics Event Type Extension** (`types/analytics.ts`)
   - Added `'component_error'` to AnalyticsEventType union
   - Added `'error_boundary'` to AnalyticsEventSource union
   - Extended AnalyticsEvent interface with optional fields: `component`, `errorMessage`, `errorStack`, `device`

3. **Error Logging Infrastructure** (`lib/analyticsEventLogger.ts`)
   - New function `logComponentError(params)` for component error logging
   - Fire-and-forget pattern: calls logAnalyticsEvent with eventType 'component_error' and source 'error_boundary'
   - Updated logAnalyticsEvent to conditionally include component error fields (only if defined)

4. **Error Logging API Route** (`app/api/analytics/error/route.ts`)
   - POST endpoint accepting JSON body: `{ device?, component, message, stack?, digest? }`
   - Validates required fields (component, message) - returns 400 if missing
   - Calls logComponentError (fire-and-forget, never throws)
   - Does NOT check analytics consent (error logging is operational)
   - Returns 200 `{ success: true }` on success

5. **Global Error Boundary** (`app/error.tsx`)
   - Next.js route-level error boundary with 'use client' directive
   - Logs errors to /api/analytics/error via fire-and-forget fetch in useEffect
   - Renders Ember Noir fallback UI:
     - Dark background: bg-slate-950
     - Heading variant="ember": "Qualcosa e andato storto"
     - Text variant="secondary": shows error.message or fallback
     - Button variant="ember" onClick={reset}: "Riprova"
   - Centered fullscreen layout with max-w-md inner container

6. **Unit Tests**
   - **ValidationError**: 8 tests covering instanceof, static factory, details, stack traces
   - **logComponentError**: 4 tests covering fire-and-forget, field filtering, Firebase integration

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed analytics aggregation type error after adding error_boundary source**
- **Found during:** Task 1 TypeScript verification
- **Issue:** analyticsAggregationService.ts line 83 had type error because currentSource could be 'error_boundary' after adding new source type, but the local variable was typed as `'manual' | 'scheduler' | 'automation'`
- **Fix:** Added filter to exclude component_error events from aggregation (line 35), then added type assertion at line 83 since after filtering, source is guaranteed to be one of the usage types
- **Files modified:** lib/analyticsAggregationService.ts
- **Commit:** ef8fb4a (part of Task 2)
- **Reason:** Error events are not usage statistics and should not affect daily stats calculations

**2. [Rule 1 - Bug] Fixed logAnalyticsEvent to conditionally include component error fields**
- **Found during:** Task 2 unit test writing
- **Issue:** logAnalyticsEvent was not conditionally spreading new component error fields, causing undefined fields to be written to Firebase
- **Fix:** Added conditional spreads for component, errorMessage, errorStack, device fields (only included if truthy)
- **Files modified:** lib/analyticsEventLogger.ts
- **Commit:** ef8fb4a (part of Task 2)
- **Reason:** Firebase RTDB best practice is to omit undefined fields rather than storing them

**3. [Rule 1 - Bug] Fixed analyticsErrorLogger tests to mock firebaseAdmin instead of logAnalyticsEvent**
- **Found during:** Task 2 test execution
- **Issue:** Initial test approach mocked logAnalyticsEvent but the mock wasn't working correctly because the test was importing the actual implementation
- **Fix:** Changed test strategy to mock firebaseAdmin (adminDbSet, adminDbGet) and environmentHelper instead
- **Files modified:** lib/__tests__/analyticsErrorLogger.test.ts
- **Commit:** ef8fb4a (part of Task 2)
- **Reason:** Mocking at the Firebase layer is more reliable and tests the actual logComponentError integration path

## Key Integration Points

1. **ValidationError → Error Boundaries** (Phase 56 plans 02-04)
   - Component error boundaries will check `instanceof ValidationError` to bypass catching
   - Allows safety-critical errors to propagate for blocking UI

2. **Error Logging API → Global Error Boundary** (app/error.tsx)
   - Fire-and-forget fetch to /api/analytics/error in useEffect
   - Logs all unhandled route-level errors for monitoring

3. **Error Logging API → Feature Error Boundaries** (future plans)
   - Device card error boundaries will POST to /api/analytics/error with device context
   - Enables device-specific error tracking and debugging

4. **component_error Events → Analytics Dashboard** (potential future)
   - Error events stored in same RTDB path as usage events
   - Could be displayed in separate error monitoring section (not in plan scope)

## Technical Decisions

1. **ValidationError.maintenanceRequired() Italian message**
   - Decision: Hard-coded Italian error message in static factory
   - Rationale: App UI is Italian-only, validation errors shown directly to user
   - Alternative considered: i18n system (rejected as unnecessary for single-language app)

2. **Error logging always enabled (no consent check)**
   - Decision: Error logging is operational, not analytics tracking
   - Rationale: GDPR distinguishes between operational logging (necessary for service) and analytics tracking (optional)
   - Impact: Errors logged even if user denies analytics consent

3. **Fire-and-forget error logging**
   - Decision: All error logging uses fire-and-forget pattern (never throws)
   - Rationale: Prevents cascading failures (error in error logger should not break app)
   - Implementation: try/catch with console.error, always return success

4. **component_error events in same RTDB path as usage events**
   - Decision: Store component_error events in analyticsEvents/{timestamp}
   - Rationale: Reuses existing infrastructure, simple cleanup via retention policy
   - Trade-off: Mixed event types in same path, but filtered at aggregation layer

## Verification Results

All verification criteria met:

- ✅ `npx tsc --noEmit` passes with zero production code errors (16 pre-existing test errors)
- ✅ `npx jest lib/__tests__/ValidationError.test.ts lib/__tests__/analyticsErrorLogger.test.ts --no-coverage` — 12 tests green (8 + 4)
- ✅ `lib/errors/ValidationError.ts` exports ValidationError class
- ✅ `app/error.tsx` has 'use client' directive and renders fallback UI
- ✅ `app/api/analytics/error/route.ts` exports POST handler
- ✅ AnalyticsEventType union includes 'component_error'

**Test Results:**
```
Test Suites: 2 passed, 2 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        1.312 s
```

**File Verification:**
```
✓ lib/errors/ValidationError.ts
✓ lib/errors/index.ts
✓ app/api/analytics/error/route.ts
✓ app/error.tsx
✓ lib/__tests__/ValidationError.test.ts
✓ lib/__tests__/analyticsErrorLogger.test.ts
```

## Next Steps

**Phase 56 Plan 02** will build on this foundation by:
- Creating feature-level ErrorBoundary component with instanceof ValidationError check
- Implementing error recovery strategies (retry, reset state)
- Adding device-specific error context to logs

**Integration with existing features:**
- Device cards will wrap controls in ErrorBoundary components
- Maintenance flow will throw ValidationError.maintenanceRequired() to show blocking UI
- All component errors will be logged to Firebase Analytics for monitoring

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| 16ba9e3 | feat(56-01): create ValidationError class and error analytics infrastructure | 6 files (3 created, 3 modified) |
| ef8fb4a | feat(56-01): create global error.tsx and unit tests | 4 files (all created) |

## Self-Check: PASSED

All claimed files and commits verified:

**Files created:**
- ✓ lib/errors/ValidationError.ts exists
- ✓ lib/errors/index.ts exists
- ✓ app/api/analytics/error/route.ts exists
- ✓ app/error.tsx exists
- ✓ lib/__tests__/ValidationError.test.ts exists
- ✓ lib/__tests__/analyticsErrorLogger.test.ts exists

**Commits:**
- ✓ 16ba9e3 present in git log
- ✓ ef8fb4a present in git log

**Tests:**
- ✓ 12/12 tests passing
- ✓ 0 TypeScript errors in production code
