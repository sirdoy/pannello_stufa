# Codebase Concerns

**Analysis Date:** 2026-01-23

## Tech Debt

**Deprecated Component Kept for Reference:**
- Issue: `app/components/StovePanel.js` is marked `@deprecated` and replaced by `app/components/devices/stove/StoveCard.js`, but still in codebase
- Files: `app/components/StovePanel.js` (599 lines)
- Impact: Code duplication, maintenance burden, confusion about which component to use
- Fix approach: Delete deprecated file and update any remaining imports

**Unimplemented Notification Cleanup:**
- Issue: `cleanupOldTokens()` function in `lib/notificationService.js` is disabled and never called (lines 480-483+)
- Files: `lib/notificationService.js:480` (TODO comment for migration)
- Impact: FCM tokens older than 90 days accumulate in Firebase, wasting storage
- Fix approach: Migrate to API route `/api/notifications/cleanup` using Admin SDK for write access

**Incomplete Test Coverage:**
- Issue: 92 test files exist for 284 source files (32% coverage by file count)
- Files: `__tests__/`, `app/**/*.test.js`
- Impact: Large areas lack automated testing (especially API routes, complex components)
- Fix approach: Prioritize critical paths: stove control, scheduler, maintenance, Netatmo sync

**Sandbox Testing TODOs:**
- Issue: `__tests__/sandboxService.test.js` has 3 unimplemented tests (lines 100, 105, 110)
- Files: `__tests__/sandboxService.test.js`
- Impact: State transitions in sandbox not verified
- Fix approach: Complete state transition tests (OFF → START → WORK)

---

## Known Issues

**Fire & Forget Network Calls Without Error Handling:**
- Symptoms: Fan/power level changes update UI immediately but don't check response status
- Files: `app/components/StovePanel.js:196-209` (handleFanChange, handlePowerChange)
- Trigger: User changes fan or power level; if API fails, state becomes inconsistent
- Impact: UI shows successful change but backend request failed silently
- Workaround: Check browser network tab to verify requests succeeded
- Fix approach: Add error handling and optionally revert UI on failure

**Unguarded Schedule Time Parsing:**
- Symptoms: Race condition if schedule intervals have malformed time format
- Files: `app/api/scheduler/check/route.js:510-514`
- Trigger: `start.split(':')` assumes valid HH:MM format; invalid data returns NaN
- Impact: parseInt on split results can produce NaN, causing undefined behavior in time comparisons
- Workaround: Validate schedule data in Firebase before entering time comparison
- Fix approach: Add validation: `if (!start || !start.match(/^\d{2}:\d{2}$/)) throw new Error(...)`

---

## Security Considerations

**Exposed Stove API Key:**
- Risk: API key visible in source code at `lib/stoveApi.js:25`
- Files: `lib/stoveApi.js` (export const API_KEY = 'bdb58f63-117e-4753-bb0f-0487f2f14e52')
- Current mitigation: None (this is a real credential)
- Recommendations:
  1. Move to environment variable: `process.env.STOVE_API_KEY`
  2. Regenerate this key in Thermorossi dashboard immediately (key is exposed in git history)
  3. Use server-side-only API route for stove communication if possible
  4. Add pre-commit hook to prevent future exposure: `grep -r "api.key\|apikey\|password" lib/`

**sessionStorage Used for Sensitive Data:**
- Risk: Netatmo refresh token stored in sessionStorage at `app/components/StovePanel.js:67`
- Files: `app/components/StovePanel.js:67` (sessionStorage.removeItem('netatmo_refresh_token'))
- Current mitigation: Not stored at all - only in Netatmo logout, but implies prior storage
- Recommendations:
  1. Verify tokens are NOT stored in sessionStorage anywhere else
  2. Store only in httpOnly cookies (handled by Auth0) or Firebase Realtime DB with proper rules
  3. Audit for any other sensitive data in sessionStorage/localStorage

**Missing Global Error Boundary:**
- Risk: Unhandled promise rejections in async operations not caught
- Files: No `app/error.js` file (only `app/not-found.js` exists)
- Current mitigation: Individual try-catch blocks in components/routes
- Recommendations:
  1. Create `app/error.js` error boundary for unhandled React errors
  2. Add global unhandledRejection listener for promise chains without .catch()
  3. Document error handling strategy in `docs/error-handling.md`

---

## Performance Bottlenecks

**StovePanel Component Polling Every 5 Seconds:**
- Problem: `app/components/StovePanel.js:178` sets interval to poll status every 5 seconds
- Files: `app/components/StovePanel.js:129-170` (fetchStatusAndUpdate)
- Cause: Sequential 5 fetch calls per interval: status → fan → power → scheduler → maintenance → checkVersion
- Impact: ~60 network requests per minute even when idle; battery drain on mobile
- Improvement path:
  1. Batch related requests (e.g., status + fan + power in one API route)
  2. Adaptive polling: increase interval when tab not visible (use Page Visibility API)
  3. Consider Server-Sent Events (SSE) for real-time push instead of polling
  4. Cache responses for 2-3 seconds minimum

**Large Component Files (1000+ lines):**
- Problem: `StoveCard.js` (1217 lines), `LightsCard.js` (1186 lines), `stove/page.js` (1043 lines), `lights/page.js` (1182 lines)
- Files: `app/components/devices/stove/StoveCard.js`, `app/components/devices/lights/LightsCard.js`, `app/stove/page.js`, `app/lights/page.js`
- Cause: UI, business logic, error handling mixed in single component
- Impact: Difficult to test, maintain, reuse; re-renders affect entire component
- Improvement path:
  1. Extract state management to custom hooks
  2. Split UI into focused sub-components (e.g., StatusDisplay, ControlPanel, MaintenanceBar)
  3. Move business logic to service layer
  4. Implement React.memo() for expensive sub-components

**Synchronous Netatmo Valve Calibration During Cron Run:**
- Problem: `app/api/scheduler/check/route.js:118` calls calibration synchronously
- Files: `app/api/scheduler/check/route.js:99-142`
- Cause: 12-hour auto-calibration blocks cron execution if slow
- Impact: If calibration takes 10+ seconds, cron response times out, missing scheduled actions
- Improvement path:
  1. Move calibration to background queue (Google Cloud Tasks or similar)
  2. Or make truly fire-and-forget with timeout fallback
  3. Add execution time monitoring to detect slowdowns

---

## Fragile Areas

**Scheduler State Machine (Manual → Semi-Manual → Auto):**
- Files: `app/api/scheduler/check/route.js:468-481`, `lib/schedulerService.js`, `app/stove/scheduler/page.js`
- Why fragile:
  - Multiple code paths modify `schedules-v2/mode` (scheduler route, UI buttons, cron)
  - `returnToAutoAt` timestamp comparison can fail if times are in different timezones
  - Race condition: User changes mode while cron is executing
- Safe modification:
  1. All mode changes must go through single admin-protected route
  2. Add transaction check: read mode → compare timestamp → write back only if unchanged
  3. Test state transitions in both directions with fake timers
- Test coverage: `__tests__/semiAutoMode.test.js` (incomplete)

**Maintenance Hours Tracking (Reset & Increment):**
- Files: `lib/maintenanceService.js`, `app/api/scheduler/check/route.js:545-553`
- Why fragile:
  - `lastUpdatedAt` initialization must match first status=WORK detection
  - Cleaning confirmation clears hours but doesn't verify actual physical cleaning
  - `currentHours` can become negative if lastUpdatedAt is in future
- Safe modification:
  1. Validate all calculated hours ≥ 0 before saving
  2. Add audit trail for manual resets (who, when, why)
  3. Block hours from going backwards (detect resets)
- Test coverage: `lib/__tests__/maintenanceService.test.js` (702 lines)

**Netatmo Sync Setpoint Enforcement:**
- Files: `lib/netatmoStoveSync.js`, `app/api/scheduler/check/route.js:555-571`
- Why fragile:
  - Assumes Netatmo API always returns current setpoints (can be stale)
  - Manual 8-hour setpoints expire but system doesn't track expiration
  - Multiple simultaneous sync calls can cause race conditions
- Safe modification:
  1. Always read fresh setpoint state before enforcement (no caching)
  2. Add timestamp tracking for manual setpoint expiration
  3. Lock mechanism to prevent concurrent sync operations
  4. Add idempotency checks (verify action was actually applied)
- Test coverage: `__tests__/lib/netatmoApi.test.js` (524 lines)

---

## Scaling Limits

**Firebase Realtime Database Concurrent Listeners:**
- Current capacity: No documented limit per connection in codebase
- Limit: Firebase SDK creates new listener per `onValue()` call; with dozens of components, can exceed socket limits
- Scaling path:
  1. Audit all listeners: search for `onValue(`, `on('value',`
  2. Consolidate related listeners into single path with client-side filtering
  3. Implement listener pooling/sharing for common paths
  4. Add listener count metric to monitoring

**Cron Job Execution Window:**
- Current capacity: Runs every N minutes, but scheduler check can take 20+ seconds
- Limit: If cron interval < execution time, jobs queue up and miss scheduled actions
- Scaling path:
  1. Monitor `app/api/scheduler/check` execution time (log duration)
  2. If > 30 seconds, split into async background jobs
  3. Pre-compute next scheduled action to reduce runtime

**FCM Token Management:**
- Current capacity: Unbounded growth of token list per user
- Limit: Large token lists slow down notification distribution
- Scaling path:
  1. Implement `cleanupOldTokens()` (see Tech Debt section)
  2. Add auto-pruning for tokens older than 180 days
  3. Remove tokens that fail 2 consecutive delivery attempts

---

## Dependencies at Risk

**Next.js 16.1.0 (Edge Runtime Incompatibility):**
- Risk: Edge runtime cannot use Firebase; many routes currently use `export const dynamic = 'force-dynamic'`
- Impact: All Firebase-dependent routes must avoid Edge runtime
- Migration plan:
  1. Document why each route uses `force-dynamic` (add comment)
  2. Consider Node.js-only routes for Firebase-heavy features
  3. Monitor Next.js changelog for Firebase Edge Runtime support

**Firebase SDK Version 12.8.0:**
- Risk: Major version dependency; SDK v13+ has breaking changes
- Impact: Significant rewrite needed if SDK updates
- Migration plan:
  1. Pin to v12.x until explicit upgrade plan
  2. Review v13 breaking changes when planning
  3. Test extensively before upgrading (especially auth flows)

---

## Missing Critical Features

**No Global Error Boundary / Unhandled Rejection Handler:**
- Problem: Components can crash silently, users see blank screen
- Blocks: Production reliability, debugging
- Solution: Create `app/error.js` with retry UI + fallback error reporting

**No Request Retry Strategy:**
- Problem: Single network failure blocks user actions (ignite, shutdown, level changes)
- Blocks: Reliability on poor connections (mobile)
- Solution: Implement exponential backoff retry for critical operations (stove control)

**No Offline Queue for Actions:**
- Problem: User actions fail instantly if offline; no ability to queue and retry
- Blocks: PWA reliability promise (should work offline)
- Solution: Queue critical mutations (ignite, shutdown) in IndexedDB, sync when online

---

## Test Coverage Gaps

**API Routes (Critical Safety):**
- What's not tested: `/api/scheduler/check` (main cron handler - no unit tests!)
- Files: `app/api/scheduler/check/route.js` (652 lines)
- Risk: Schedule misfires, unexpected actions, maintenance logic breaks without detection
- Priority: **HIGH** - controls critical stove operations

**Stove API Integration:**
- What's not tested: Error handling in `lib/stoveApi.js` timeout/retry logic
- Files: `lib/stoveApi.js` (fetchWithTimeout, retryWithBackoff)
- Risk: Timeout logic may not work correctly, retries could loop infinitely
- Priority: **HIGH** - affects all stove control

**Netatmo Sync Edge Cases:**
- What's not tested: Undefined setpoints, API failures during sync, setpoint expiration
- Files: `lib/netatmoStoveSync.js` (enforceStoveSyncSetpoints)
- Risk: Thermostat stuck in wrong state if Netatmo API returns unexpected data
- Priority: **MEDIUM** - impacts comfort but not safety

**Component Render Performance:**
- What's not tested: Re-render performance with large state updates
- Files: `app/components/devices/stove/StoveCard.js`, `app/lights/page.js`
- Risk: Performance degradation in real usage undetected
- Priority: **MEDIUM** - affects user experience

**Firebase Security Rules:**
- What's not tested: No firestore.rules or rules test suite found
- Files: Missing firestore.rules file
- Risk: Data accessible to unauthorized users, write escalation
- Priority: **CRITICAL** - affects all data security

---

## Notes

- **Deletion**: Debug log route (`app/api/debug/log/route.js`) was recently removed - verify this doesn't break any logging
- **Recent Refactor**: v1.76.0-v1.76.1 stabilized Netatmo stove sync - ensure regression tests added
- **Stove API Key**: This is a REAL exposed credential that must be rotated immediately in production
- **Performance**: The 5-second polling strategy is aggressive; consider adaptive polling or WebSocket
- **Quality**: Overall code quality is good (tight error handling in scheduler, good test structure), but needs safety coverage on critical paths

---

*Concerns audit: 2026-01-23*
