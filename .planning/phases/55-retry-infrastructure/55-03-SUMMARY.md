---
phase: 55-retry-infrastructure
plan: 03
subsystem: retry-hooks
tags: [retry, toast, deduplication, idempotency, react-hooks]
dependency_graph:
  requires: [retryClient, deduplicationManager, idempotencyManager, ToastProvider]
  provides: [useRetryableCommand]
  affects: []
tech_stack:
  added: []
  patterns: [single-retry-layer, persistent-error-toasts, recovery-success-feedback, manual-retry]
key_files:
  created:
    - lib/hooks/useRetryableCommand.ts
    - lib/hooks/__tests__/useRetryableCommand.test.ts
  modified:
    - app/components/ui/ToastProvider.tsx
    - app/components/ui/__tests__/Toast.test.tsx
decisions:
  - context: "Error toast persistence"
    decision: "Error toasts use duration: 0 (Infinity for Radix) to remain persistent until manually dismissed"
    rationale: "Locked user decision: errors require explicit acknowledgment, not auto-dismiss"
    alternatives: ["8-second auto-dismiss (previous behavior)"]
  - context: "Max visible toasts"
    decision: "Increased from 3 to 5 to accommodate stacked persistent error toasts"
    rationale: "Multiple device errors can occur simultaneously; need space for them all"
    alternatives: ["Keep at 3 and auto-dismiss oldest"]
  - context: "Success toast on recovery only"
    decision: "Show success toast only after previous error (hadErrorRef), not on first-try success"
    rationale: "Reduces notification fatigue; users only need confirmation when recovering from error"
    alternatives: ["Always show success toast", "Never show success toast"]
  - context: "Single integration point (RETRY-06)"
    decision: "useRetryableCommand is the ONLY retry layer device components use"
    rationale: "Centralizes retry, dedup, idempotency logic; device cards don't need retry knowledge"
    alternatives: ["Each device card implements its own retry logic"]
metrics:
  duration_minutes: 6
  completed_date: 2026-02-12
  tasks_completed: 2
  tests_added: 10
  files_created: 2
  files_modified: 2
---

# Phase 55 Plan 03: Retry Hook Integration Summary

**Enhanced ToastProvider for persistent errors and created useRetryableCommand hook orchestrating retry + toast + dedup + idempotency**

## What Was Built

Created the single integration point for device commands that combines all retry infrastructure:

**ToastProvider enhancements:**
- Error toasts now persistent (duration: 0 → Infinity)
- Max visible toasts increased from 3 to 5
- Success/info/warning toasts still auto-dismiss after 5s
- Updated JSDoc with persistence documentation

**useRetryableCommand hook:**
- Single API for device commands: `execute(url, options)`
- Automatic deduplication (2-second window via deduplicationManager)
- Idempotency key injection (via idempotencyManager)
- Retry with exponential backoff (via retryClient)
- Persistent error toasts with inline "Riprova" button
- Success toast only on recovery (not first-try success)
- Manual retry via `retry()` method
- Error state exposed: `lastError`, `attemptCount`, `isExecuting`, `isRetrying`

## Implementation Notes

### Task 1: ToastProvider Enhancement

**Changes made:**
1. Error default duration: 8000ms → 0 (persistent)
2. Duration 0 converted to Infinity for Radix (truly persistent)
3. Max visible toasts: 3 → 5
4. Updated JSDoc and examples

**Test fix:**
- Updated toast stacking test to expect max 5 toasts instead of 3
- Added 2 more test toasts (Toast 6, Toast 7) to verify limit

### Task 2: useRetryableCommand Hook

**Hook architecture:**
```typescript
interface CommandResult {
  execute: (url: string, fetchOptions?: RequestInit) => Promise<Response | null>;
  retry: () => Promise<Response | null>;
  clearError: () => void;
  isExecuting: boolean;
  isRetrying: boolean;
  attemptCount: number;
  lastError: Error | null;
}
```

**Execution flow:**
1. **Dedup check**: `createRequestKey(device, action)` → silently return null if duplicate
2. **Idempotency key**: Parse body → `registerKey(url, body)` → inject as header
3. **Execute**: `retryFetch(url, enhancedOptions)` with automatic retry
4. **Success**: If `hadErrorRef.current` is true → show "Comando eseguito con successo"
5. **Error (RetryError)**: Show persistent toast with "Riprova" button → store command for retry
6. **Finally**: Clear dedup key (allows immediate manual retry)

**Test strategy:**
- **Challenge**: Initially mocked entire `retryClient` module, which also mocked `RetryError` class
- **Solution**: Use `jest.requireActual()` to keep real `RetryError` class while mocking `retryFetch` function
- **Response polyfill**: Added minimal Response class for Node.js test environment (same as retryClient tests)
- **State timing**: Used `waitFor()` for `attemptCount` assertion to handle async state updates

### Integration with Previous Plans

**Plan 55-01 (retryClient + deduplicationManager):**
- Hook uses `retryFetch` for automatic retry with exponential backoff
- Hook uses `deduplicationManager` to prevent double-tap (2-second window)
- Hook uses `createRequestKey` for consistent key format

**Plan 55-02 (idempotencyManager):**
- Hook uses `idempotencyManager.registerKey()` to get/generate idempotency keys
- Keys injected as `Idempotency-Key` header in fetch requests
- Same endpoint+body within 1-hour TTL returns same key

## Deviations from Plan

None - plan executed exactly as written.

## Test Coverage

All 44 tests passing:
- **useRetryableCommand**: 10 tests
  - Idempotency header injection
  - Dedup blocking (silent null return)
  - Persistent error toast on failure
  - Success toast on recovery only
  - No success toast on first-try success
  - Dedup cleanup after completion
  - Manual retry re-execution
  - Error state clearing
  - isExecuting state tracking
  - attemptCount tracking

- **Toast**: 34 tests (all still passing after ToastProvider changes)
  - Toast stacking now expects max 5 toasts
  - Persistent error toast behavior verified

## Verification Results

```bash
npx jest lib/hooks/__tests__/useRetryableCommand.test.ts app/components/ui/__tests__/Toast.test.tsx --no-coverage --verbose
# PASS lib/hooks/__tests__/useRetryableCommand.test.ts (10 tests)
# PASS app/components/ui/__tests__/Toast.test.tsx (34 tests)
# Test Suites: 2 passed
# Tests: 44 passed total
```

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | f016b5e | Enhanced ToastProvider for persistent error toasts (duration 0, max 5) |
| 2 | 6f8f059 | Created useRetryableCommand hook with full integration (10 tests) |

## Next Steps

**Ready for device card integration** (next phase):
- Stove card: Replace direct API calls with `useRetryableCommand`
- Hue card: Replace direct API calls with `useRetryableCommand`
- Netatmo card: Replace direct API calls with `useRetryableCommand`

**Device cards will:**
1. Call `const { execute, retry, lastError, isExecuting } = useRetryableCommand({ device, action })`
2. Use `execute()` for all commands (ignite, shutdown, setFan, etc.)
3. Show error banner if `lastError` is set
4. Add manual retry button in card that calls `retry()`
5. Show loading state via `isExecuting`

**No need to:**
- Implement their own retry logic
- Manage deduplication
- Generate idempotency keys
- Show/manage error toasts

## Success Criteria: ✓ All Met

- [x] Error toasts are persistent (duration: 0/Infinity) per locked decision
- [x] Max visible toasts increased to 5
- [x] useRetryableCommand provides execute, retry, clearError, isExecuting, isRetrying, lastError
- [x] Deduplication silently blocks duplicate requests within 2s window
- [x] Idempotency-Key header injected into all device commands
- [x] Persistent error toast shows "Riprova" inline button
- [x] Success toast only shown on recovery from error (not first-try success)
- [x] Manual retry via retry() re-executes last failed command
- [x] Error state (lastError) exposed for device card error banner
- [x] All 44 tests passing (10 hook + 34 toast)

## Self-Check: PASSED

**Files created:**
```bash
✓ lib/hooks/useRetryableCommand.ts exists
✓ lib/hooks/__tests__/useRetryableCommand.test.ts exists
```

**Files modified:**
```bash
✓ app/components/ui/ToastProvider.tsx modified (persistent errors, max 5)
✓ app/components/ui/__tests__/Toast.test.tsx modified (test expects 5)
```

**Commits:**
```bash
✓ f016b5e - feat(55-03): enhance ToastProvider for persistent error toasts
✓ 6f8f059 - feat(55-03): create useRetryableCommand hook with retry + dedup + idempotency
```

**Tests:**
```bash
✓ All 44 tests pass (10 useRetryableCommand + 34 Toast)
✓ Idempotency header injection verified
✓ Dedup blocking verified (returns null silently)
✓ Persistent error toast with retry button verified
✓ Success toast only on recovery verified
✓ Manual retry re-execution verified
✓ Error state tracking verified (lastError, attemptCount, isExecuting)
```

---

**Duration:** 6 minutes
**Status:** Complete ✓
**Quality:** All success criteria met, RETRY-06 single retry layer pattern achieved
