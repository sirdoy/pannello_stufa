---
phase: 55-retry-infrastructure
plan: 01
subsystem: lib/retry
tags: [retry, deduplication, exponential-backoff, network-resilience]
dependency_graph:
  requires: [lib/core/apiErrors.ts, types/api/errors.ts]
  provides: [retryClient, deduplicationManager]
  affects: []
tech_stack:
  added: []
  patterns: [exponential-backoff, request-deduplication, transient-error-classification]
key_files:
  created:
    - lib/retry/retryClient.ts
    - lib/retry/deduplicationManager.ts
    - lib/retry/__tests__/retryClient.test.ts
    - lib/retry/__tests__/deduplicationManager.test.ts
  modified: []
decisions:
  - context: "Deduplication storage mechanism"
    decision: "Map<string, number> with string keys instead of WeakMap"
    rationale: "String keys like 'stove:ignite' are more practical and predictable than object references that components would need to maintain"
    alternatives: ["WeakMap with object keys (requires reference management)"]
  - context: "Jitter implementation"
    decision: "Random 0-30% jitter added to exponential backoff delays"
    rationale: "Prevents thundering herd when multiple clients retry simultaneously"
    alternatives: ["Full jitter (0-100%)", "Decorrelated jitter"]
  - context: "Non-retryable error classification"
    decision: "Device offline errors (STOVE_OFFLINE, HUE_NOT_CONNECTED, NETATMO_NOT_CONNECTED) throw immediately"
    rationale: "These errors indicate persistent state that won't resolve with retry; faster user feedback"
    alternatives: ["Retry all 5xx errors regardless of code"]
metrics:
  duration_minutes: 13
  completed_date: 2026-02-11
  tasks_completed: 2
  tests_added: 39
  files_created: 4
---

# Phase 55 Plan 01: Core Retry Infrastructure Summary

**Retry client with exponential backoff and request deduplication manager implemented via TDD**

## What Was Built

Created the foundational retry infrastructure with two tested modules:

**retryClient.ts** - Automatic retry wrapper for fetch calls:
- Exponential backoff: 1s → 2s → 4s → 8s (with 30% jitter)
- Smart error classification (transient vs persistent)
- Configurable retry attempts, delays, and callbacks
- RetryError with attempt count metadata

**deduplicationManager.ts** - Request deduplication:
- 2-second window blocks duplicate requests
- String-key based tracking (device:action pattern)
- isInFlight() status checks
- clear() for explicit state cleanup

## Implementation Notes

### TDD Execution Flow

Both modules followed strict TDD:
1. RED: Created comprehensive test suites (27 + 12 tests)
2. GREEN: Implemented minimal code to pass all tests
3. REFACTOR: Added JSDoc and cleaned exports

### Test Infrastructure

Added Response polyfill for Node.js test environment since Jest doesn't provide it by default:
```typescript
if (typeof Response === 'undefined') {
  global.Response = class Response { /* minimal implementation */ }
}
```

### Timing Tests Strategy

Initial approach with `jest.advanceTimersByTimeAsync()` had race conditions. Simplified to:
- Use `jest.runAllTimersAsync()` for retry execution
- Spy on `setTimeout` to verify backoff delays
- Catch rejected promises with `.catch(() => {})` to prevent unhandled rejections

### Error Classification

Transient (auto-retry):
- NETWORK_ERROR, TIMEOUT, SERVICE_UNAVAILABLE
- STOVE_TIMEOUT, EXTERNAL_API_ERROR

Non-retryable (immediate throw):
- VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN
- STOVE_OFFLINE, MAINTENANCE_REQUIRED
- HUE_NOT_CONNECTED, NETATMO_NOT_CONNECTED

## Deviations from Plan

None - plan executed exactly as written.

## Test Coverage

All 39 tests passing:
- retryClient: 27 tests (retry logic, backoff, error classification)
- deduplicationManager: 12 tests (window expiry, key isolation, singleton)

## Verification Results

```bash
npx jest lib/retry/__tests__/ --no-coverage --verbose
# PASS lib/retry/__tests__/retryClient.test.ts (27 tests)
# PASS lib/retry/__tests__/deduplicationManager.test.ts (12 tests)
# Test Suites: 3 passed (includes existing idempotencyManager)
# Tests: 49 passed total
```

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | d711733 | retryClient with exponential backoff (RED+GREEN) |
| 2 | 2645c3d | deduplicationManager with 2-second window (RED+GREEN) |

## Next Steps

Ready for integration in Plan 55-02:
- Wrap stoveApi.ts calls with retryFetch
- Add deduplication to command endpoints
- Integration tests for end-to-end retry flow

## Self-Check: PASSED

**Files created:**
```bash
✓ lib/retry/retryClient.ts exists
✓ lib/retry/deduplicationManager.ts exists
✓ lib/retry/__tests__/retryClient.test.ts exists
✓ lib/retry/__tests__/deduplicationManager.test.ts exists
```

**Commits:**
```bash
✓ d711733 - test(55-01): add failing tests for retry client with exponential backoff
✓ 2645c3d - test(55-01): add failing tests for deduplication manager
```

**Tests:**
```bash
✓ All 49 tests pass (27 retryClient + 12 deduplicationManager + 10 idempotencyManager)
✓ retryFetch correctly retries transient errors
✓ Non-retryable errors throw immediately
✓ Exponential backoff with jitter verified (700-1300ms, 1400-2600ms ranges)
✓ Deduplication blocks duplicate requests within 2s window
```

---

**Duration:** 13 minutes
**Status:** Complete ✓
**Quality:** All success criteria met
