---
phase: 49-persistent-rate-limiting
plan: 01
subsystem: notifications
tags: [rate-limiting, firebase-rtdb, transactions, sliding-window, persistence]
dependency_graph:
  requires: [lib/firebaseAdmin.ts, Firebase RTDB transactions]
  provides: [checkRateLimitPersistent, clearRateLimitPersistentForUser, getRateLimitPersistentStatus]
  affects: []
tech_stack:
  added: []
  patterns: [Firebase transactions, sliding window, pure callbacks]
key_files:
  created:
    - lib/rateLimiterPersistent.ts
    - __tests__/lib/rateLimiterPersistent.test.ts
  modified: []
decisions:
  - key: transaction-purity
    choice: "Pure callbacks with no side effects"
    rationale: "Transaction callbacks may run multiple times, side effects would be duplicated"
  - key: max-retention
    choice: "2-hour maximum retention (7200000ms)"
    rationale: "Prevents unbounded array growth while keeping enough history for debugging"
  - key: module-independence
    choice: "Copy DEFAULT_RATE_LIMITS instead of importing from rateLimiter.ts"
    rationale: "Keep modules independent, no shared state between in-memory and persistent limiters"
  - key: allowed-detection
    choice: "Track willAllow flag inside transaction callback"
    rationale: "Reliable detection of whether request was allowed, independent of timestamp comparison"
metrics:
  duration_minutes: 4
  completed_date: 2026-02-10
  task_count: 1
  test_count: 11
  file_count: 2
---

# Phase 49 Plan 01: Persistent Rate Limiter Implementation Summary

**One-liner:** Firebase RTDB-backed notification rate limiter with atomic transactions, sliding window cleanup, and 2-hour max retention

## Overview

Created a persistent notification rate limiter using Firebase RTDB transactions that survives serverless cold starts. Mirrors the API of the existing in-memory `rateLimiter.ts` but provides persistent state via atomic read-modify-write operations. Sliding window algorithm filters expired timestamps on every check, with 2-hour max retention to prevent unbounded array growth.

## Tasks Completed

### Task 1: Create persistent notification rate limiter with TDD ✅

**Approach:** Test-Driven Development (RED-GREEN-REFACTOR)

**RED Phase:**
- Created 11 comprehensive tests covering:
  - First request initialization (Firebase null handling)
  - Blocking when maxPerWindow reached
  - Sliding window with expired timestamp filtering
  - Correct nextAllowedIn calculation
  - Custom limits support
  - Max retention cleanup (2-hour limit)
  - Concurrent transaction enforcement
  - Clear and status operations

**GREEN Phase:**
- Implemented `checkRateLimitPersistent()`:
  - Firebase path: `rateLimits/{userId}/{notifType}`
  - Pure transaction callback (no side effects)
  - Filters timestamps by both sliding window AND max retention
  - Atomic check-and-update operation
  - Returns RateLimitResult with allowed/suppressedCount/nextAllowedIn
- Implemented `clearRateLimitPersistentForUser()`:
  - Removes all rate limit entries for user
  - Uses `adminDbRemove()`
- Implemented `getRateLimitPersistentStatus()`:
  - Reads current state with `adminDbGet()`
  - Returns RateLimitStatus with counts and timing
- Copied DEFAULT_RATE_LIMITS from rateLimiter.ts (module independence)
- Initial implementation had flawed "allowed" detection (checked if last timestamp === now)
- **Deviation (Rule 1 - Bug):** Fixed allowed detection logic by tracking willAllow flag inside transaction callback instead of comparing timestamps after transaction completes

**REFACTOR Phase:**
- Code clean with comprehensive JSDoc comments
- No console.log in transaction callbacks (verified)
- Pure transaction callbacks (no side effects)
- No further refactoring needed

**Verification:**
- All 11 tests passing
- No TypeScript errors for rateLimiterPersistent.ts
- Exports verified: checkRateLimitPersistent, clearRateLimitPersistentForUser, getRateLimitPersistentStatus
- Transaction callback purity verified (no console.log found)

**Files:**
- Created: `lib/rateLimiterPersistent.ts` (211 lines)
- Created: `__tests__/lib/rateLimiterPersistent.test.ts` (294 lines)
- Commit: 382731a

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed rate limit allowed detection logic**
- **Found during:** Task 1 GREEN phase
- **Issue:** Initial implementation checked if `window.timestamps[window.timestamps.length - 1] === now` to determine if request was allowed, but this failed when at limit because we don't add the timestamp in that case, leading to false positives
- **Fix:** Track `willAllow` boolean flag inside transaction callback, set when we decide to add timestamp, return based on this flag instead of post-transaction timestamp comparison
- **Files modified:** lib/rateLimiterPersistent.ts
- **Commit:** 382731a (included in same commit as implementation since caught during TDD GREEN phase)

## Success Criteria Met

- ✅ All tests green for persistent notification rate limiter
- ✅ Firebase RTDB path: `rateLimits/{userId}/{notifType}`
- ✅ Sliding window with cleanup on read (max retention 2h)
- ✅ Pure transaction callback (no side effects, no console.log)
- ✅ Same type interfaces as existing rateLimiter.ts (RateLimitResult, RateLimitConfig, RateLimitStatus)
- ✅ Exports: checkRateLimitPersistent, clearRateLimitPersistentForUser, getRateLimitPersistentStatus
- ✅ No TypeScript errors

## Technical Details

### Firebase RTDB Structure

```
rateLimits/
  {userId}/
    {notifType}/
      timestamps: [number[]]  // Unix timestamps in ms
      windowStart: number     // Unix timestamp of first entry
```

### Rate Limit Defaults (copied from rateLimiter.ts)

| Type | Window | Max |
|------|--------|-----|
| CRITICAL | 1 min | 5 |
| ERROR | 1 min | 3 |
| maintenance | 5 min | 1 |
| updates | 60 min | 1 |
| scheduler_success | 5 min | 1 |
| status | 5 min | 1 |
| test | 1 min | 10 |
| default | 5 min | 1 |

### Sliding Window Algorithm

1. Read current data via transaction
2. Filter timestamps to current window: `now - ts < windowMs`
3. Apply max retention filter: `now - ts < MAX_RETENTION_MS` (2 hours)
4. If `recentInWindow.length >= maxPerWindow` → return unchanged (blocked)
5. If allowed → add `now` to timestamps array
6. Transaction commits atomically

### Transaction Callback Purity

**MUST NOT:**
- console.log (may run multiple times)
- Side effects (API calls, writes to other locations)
- Return undefined (aborts transaction)

**MUST:**
- Handle null (first time case)
- Return new data structure (not modify in place)
- Keep logic deterministic

## Testing Coverage

| Scenario | Status | Description |
|----------|--------|-------------|
| First request | ✅ Pass | Firebase returns null → initialize correctly |
| At limit | ✅ Pass | maxPerWindow reached → block request |
| Sliding window | ✅ Pass | Old timestamps filtered out |
| nextAllowedIn | ✅ Pass | Correct seconds until next allowed |
| Custom limits | ✅ Pass | Override default limits |
| Max retention | ✅ Pass | Timestamps > 2h cleaned up |
| Concurrent checks | ✅ Pass | Transactions prevent exceeding limits |
| Clear user | ✅ Pass | Remove all entries for user |
| Get status | ✅ Pass | Return current count/timing |
| Empty state | ✅ Pass | Handle no data gracefully |
| Status filtering | ✅ Pass | Filter expired timestamps in status |

## Known Limitations

1. **Firebase RTDB required:** Does not work without Firebase Admin SDK configured
2. **Network latency:** Async operations add 50-200ms overhead vs in-memory limiter
3. **Transaction retries:** Firebase may retry transaction callback multiple times if conflicts detected
4. **No cleanup job:** Old entries only cleaned on next check, not proactively (acceptable for 2h max retention)

## Integration Notes

**Next steps:**
- Plan 02: Integrate into notification send flow (sendNotificationToUser)
- Plan 03: Add feature flag for gradual rollout
- Plan 04: Monitoring and alerting for rate limit persistence

**API Usage:**

```typescript
import { checkRateLimitPersistent } from '@/lib/rateLimiterPersistent';

// Check rate limit before sending
const result = await checkRateLimitPersistent(userId, 'scheduler_success');
if (!result.allowed) {
  console.log(`Rate limited: ${result.nextAllowedIn}s until next allowed`);
  return;
}

// Send notification...
```

## Self-Check: PASSED ✅

**Created files verified:**
```bash
[ -f "lib/rateLimiterPersistent.ts" ] && echo "FOUND: lib/rateLimiterPersistent.ts"
[ -f "__tests__/lib/rateLimiterPersistent.test.ts" ] && echo "FOUND: __tests__/lib/rateLimiterPersistent.test.ts"
```
Result: Both files exist

**Commit verified:**
```bash
git log --oneline --all | grep -q "382731a" && echo "FOUND: 382731a"
```
Result: Commit exists

**Test execution:**
```bash
npx jest __tests__/lib/rateLimiterPersistent.test.ts --no-coverage
```
Result: 11 tests passed

**TypeScript compilation:**
```bash
npx tsc --noEmit 2>&1 | grep "lib/rateLimiterPersistent.ts"
```
Result: No errors for rateLimiterPersistent.ts

**Transaction callback purity:**
```bash
grep -n "console\." lib/rateLimiterPersistent.ts
```
Result: No console statements found
