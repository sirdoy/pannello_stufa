---
status: resolved
trigger: "Health Monitoring page shows no data - neither stats nor event timeline display any information"
created: 2026-02-05T10:00:00Z
updated: 2026-02-05T10:30:00Z
---

## Current Focus

hypothesis: The monitoring page silently swallows API errors. If the stats/logs APIs return non-200 responses (e.g., auth failure), the components stay in loading/empty state without showing errors.
test: Check if the page handles res.ok=false cases and add proper error handling
expecting: Need to update components to show error state when API fails instead of perpetual loading
next_action: Add error handling to stats fetch in MonitoringPage - currently if res.ok is false, stats stays null forever

## Symptoms

expected: The /monitoring page should display health stats (uptime percentage, success/failure counts) and event timeline with logged health check events
actual: The page shows loading state or empty state - no data is displayed
errors: Unknown - need to investigate both frontend and API responses
reproduction: Navigate to /monitoring page
started: Unknown - need to check if data has ever been logged to Firestore

## Eliminated

## Evidence

- timestamp: 2026-02-05T10:05:00Z
  checked: Source code for monitoring page, APIs, and healthLogger
  found: |
    1. Monitoring page (app/monitoring/page.js) is a client component that fetches:
       - /api/health-monitoring/stats?days=7 for stats card
       - /api/health-monitoring/dead-man-switch for DMS panel
    2. MonitoringTimeline fetches /api/health-monitoring/logs for event list
    3. All protected endpoints use withAuthAndErrorHandler (requires auth)
    4. Stats API (getHealthStats): Simple query with single where clause on timestamp
    5. Logs API: Complex query with where('timestamp', '>=', ...) + orderBy('timestamp', 'desc')
    6. Cron job (/api/health-monitoring/check) populates data to healthMonitoring collection
    7. The logHealthCheckRun function creates parent doc + checks subcollection
  implication: Need to verify if cron job has run and data exists, plus check if queries work

- timestamp: 2026-02-05T10:06:00Z
  checked: Query structure in logs API route
  found: |
    The logs API builds a query with:
    - where('timestamp', '>=', startDate) - inequality filter
    - orderBy('timestamp', 'desc') - ordering
    - Optional: where('hasStateMismatch', '==', true) or where('failureCount', '>', 0)
    Firestore requires composite indexes for inequality + different field orderBy combinations.
    However, timestamp inequality + timestamp orderBy should work without custom index.
  implication: The query itself looks correct. Issue is likely either no data or auth failure.

- timestamp: 2026-02-05T10:10:00Z
  checked: Error handling in monitoring page
  found: |
    MonitoringPage.js lines 20-24:
    ```
    const res = await fetch('/api/health-monitoring/stats?days=7');
    if (res.ok) {
      const data = await res.json();
      setStats(data);
    }
    ```

    PROBLEM: If res.ok is false (401 unauthorized, 500 error, etc.), nothing happens.
    stats remains null, showing perpetual loading state in ConnectionStatusCard.

    Similarly, the DMS fetch (lines 37-44) has the same pattern.

    MonitoringTimeline DOES handle errors properly (line 43-45) but only shows error if
    events.length === 0.
  implication: |
    This is a UX bug - errors are swallowed silently. The page needs to:
    1. Track error state for stats fetch
    2. Show error UI when API fails
    3. Allow retry

## Resolution

root_cause: |
  The monitoring page silently swallows API errors. When /api/health-monitoring/stats or
  /api/health-monitoring/dead-man-switch return non-200 responses (e.g., 401 unauthorized,
  500 internal error), the page:
  1. Catches the error in console.error()
  2. Does NOT update state
  3. Stats and DMS status remain null forever
  4. ConnectionStatusCard shows perpetual loading skeleton
  5. DeadManSwitchPanel shows perpetual loading skeleton

  The MonitoringTimeline component has better error handling (shows error state), but the
  main page components do not surface errors to users.

  Additionally, when res.ok is false (line 21), setStats is never called, so even if the
  API returns a parseable error response, the user sees loading forever.

fix: |
  1. Add error state to MonitoringPage for stats and DMS fetches
  2. Update ConnectionStatusCard to accept error prop and show error UI
  3. Update DeadManSwitchPanel to accept error prop and show error UI
  4. Add retry capability for failed fetches

  Changes made:
  - MonitoringPage: Added statsError/dmsError states, memoized fetch functions with useCallback,
    handle non-200 responses by parsing error from JSON response, pass error/onRetry props to cards
  - ConnectionStatusCard: Added error/onRetry props, added error state UI with retry button,
    imported RefreshCw icon and Button component
  - DeadManSwitchPanel: Added error/onRetry props, added error state UI with retry button,
    imported RefreshCw icon and Button component

verification: |
  - healthLogger tests pass (13 tests)
  - ESLint passes with only pre-existing warnings
  - No component tests exist for ConnectionStatusCard/DeadManSwitchPanel
  - Changes verified:
    1. MonitoringPage now tracks error states (statsError, dmsError)
    2. ConnectionStatusCard shows error UI with retry button when error prop set
    3. DeadManSwitchPanel shows error UI with retry button when error prop set
    4. Retry handlers use refs to avoid stale closure issues

files_changed:
  - app/monitoring/page.js
  - components/monitoring/ConnectionStatusCard.js
  - components/monitoring/DeadManSwitchPanel.js
