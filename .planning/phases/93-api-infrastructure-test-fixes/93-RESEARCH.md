# Phase 93: API & Infrastructure Test Fixes - Research

**Researched:** 2026-03-18
**Domain:** Jest unit test diagnosis — server-side and infrastructure suites
**Confidence:** HIGH (all 27 failing assertions diagnosed by running the test suites and reading source + test files)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Diagnose each failing suite individually — fix whichever side is wrong (test or code)
- If a test expectation is stale (code changed, test not updated), update the test to match current behavior
- If a test reveals an actual code bug, fix the code — but scope the fix to the exact issue
- Document root cause per suite in plan so reviewer understands why it failed
- Use explicit `beforeEach` reset for mocks that retain state across tests
- Use `jest.mocked()` for type-safe mock access
- Use `jest.isolateModules()` only when module-level singleton state causes cross-test pollution
- Prefer `jest.restoreAllMocks()` in `afterEach` for full cleanup

### Claude's Discretion
- Exact grouping of suites into plans (may adjust based on root cause analysis)
- Whether a failing assertion needs a test fix or a code fix (diagnose per case)
- Order of execution within a plan
- Whether to add defensive guards in tests to prevent future regression

### Deferred Ideas (OUT OF SCOPE)
- None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TFIX-01 | middleware.test.ts — withIdempotency tests pass (3 tests) | Root cause identified: `withIdempotency` uses dynamic `import()` for firebase — test mocks use top-level `jest.mock()` which are not matched by dynamic import. Fix: lazy load pattern or eager import in source. |
| TFIX-02 | changelogService.test.ts — saveVersion/syncVersion tests pass (4 tests) | Root cause identified: `syncVersionHistoryToFirebase` in source never calls `console.log('VERSION_HISTORY sincronizzato...')`. Tests expect it; code omits it. Fix: add the missing log call to source. |
| TFIX-03 | stoveApi.test.ts — fetchWithRetry retry logging test passes (1 test) | Root cause identified: `fetchWithRetry` source strips all logging inside retry loop (empty `if` blocks). Test expects `console.log(stringContaining('Timeout on attempt'))`. Fix: restore the missing log statements. |
| TFIX-04 | maintenanceService.test.ts — needsCleaning threshold test passes (1 test) | Root cause identified: `trackUsageHours` source never calls `console.log` with maintenance threshold message. Test expects it. Fix: add the missing log call in source at the threshold-reached branch. |
| TFIX-05 | schedulerService.test.ts — save/set/clear schedule tests pass (5 tests) | Root cause identified: `saveSchedule`, `setSchedulerMode`, `setSemiManualMode`, `clearSemiManualMode` in source omit all `console.log` calls. Tests expect them. Fix: add missing log calls. |
| TFIX-06 | healthDeadManSwitch.test.ts — ADMIN_USER_ID skip test passes (1 test) | Root cause identified: `alertDeadManSwitch` in source does not call `console.log` when `ADMIN_USER_ID` is missing — it just silently returns. Test expects a log message. Fix: add `console.log('...ADMIN_USER_ID not configured...')` before the early return. |
| TFIX-07 | fritzbox/history.test.ts — range/filter/empty tests pass (6 tests) | Root cause identified: `history/route.ts` uses `fritzboxClient.getDeviceEvents()` (method on object) but test mocks `getDeviceEvents` as a standalone export from `@/lib/fritzbox`. Signature mismatch: route passes `(hours, deviceParam)` but `getDeviceEvents` signature is `(startTime, endTime)`. Test expects `(startTime, endTime)` pair. Fix: update route to use standalone `getDeviceEvents(startTime, endTime)` and filter by device in the route, OR rewrite test to match `fritzboxClient.getDeviceEvents`. |
| TFIX-08 | fritzbox/devices-events.test.ts — event detection tests pass (6 tests) | Root cause identified: `devices/route.ts` does NOT perform event detection. It fetches devices via `getCachedData` then calls `success({ devices })`. No calls to `getDeviceStates`, `updateDeviceStates`, or `logDeviceEvent`. Tests expect full event detection logic in the route. Fix: tests are stale — the event detection was removed from the route (moved to HA proxy per route comment). Update tests to match actual route behavior. |
</phase_requirements>

---

## Summary

All 27 failing assertions across 8 test suites have been diagnosed by running each suite and comparing test expectations against actual source code. The failures fall into three categories:

**Category A — Missing log calls in source (5 suites: TFIX-02, TFIX-03, TFIX-04, TFIX-05, TFIX-06).** Tests expect `console.log` statements that the source code no longer emits. These were either removed during refactoring or never added. The fix in each case is to add the missing log call at the appropriate location in the source. No logic changes needed.

**Category B — Dynamic import / mock scope mismatch (1 suite: TFIX-01).** `withIdempotency` in middleware.ts uses `await import('firebase/database')` and `await import('@/lib/firebase')` inside the function body. The test mocks those modules with `jest.mock()` at the top level. The issue is that Jest's module registry properly intercepts static `import` and top-level `jest.mock()`, but dynamic `import()` inside an `async` function body may bypass the test-level mock. The `set`, `get`, `ref` mocks show 0 calls even though the test mocked them. Fix: convert the dynamic imports in `withIdempotency` to static top-level imports (matching the pattern used by all other middleware functions in the same file).

**Category C — Stale tests / architectural divergence (2 suites: TFIX-07, TFIX-08).** The routes under test were refactored after the tests were written:
- `history/route.ts` uses `fritzboxClient.getDeviceEvents(hours, deviceParam)` (method call with hours + optional MAC), but the test mocks the standalone export `getDeviceEvents` and expects `(startTime, endTime)` args. The test mock never receives a call.
- `devices/route.ts` no longer contains device event detection logic (removed per the route comment: "Device event tracking is now handled by the HA proxy"). Tests expect `logDeviceEvent`, `getDeviceStates`, `updateDeviceStates` to be called — none of them are.

**Primary recommendation:** Fix Categories A and B by updating source code (add log calls, convert dynamic imports). For Category C, update the stale tests to match current route behavior.

---

## Standard Stack

No new libraries required. All fixes use existing project stack:
- Jest (project standard, already configured via Phase 92)
- `jest.mocked()` for type-safe mock access (v5.0 project convention)
- `jest.clearAllMocks()` / `jest.restoreAllMocks()` patterns (Phase 92 established)

---

## Architecture Patterns

### Pattern 1: Static Import Required for Jest Mocking

**What:** `jest.mock('@/lib/firebase')` intercepts static `import` statements but may not intercept `await import('@/lib/firebase')` inside a function body depending on Jest/module resolution.

**Current code in `withIdempotency`:**
```typescript
// PROBLEM: dynamic import inside async function
const { ref, get, set } = await import('firebase/database');
const { db } = await import('@/lib/firebase');
```

**Fix:**
```typescript
// At top of file, alongside other imports
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';
```

The rest of `withIdempotency` already has the correct logic — this is purely an import location change.

### Pattern 2: Missing Console.log Calls — Source Fix Required

The failing tests across TFIX-02 through TFIX-06 all share the same pattern: a test asserts `expect(console.log).toHaveBeenCalledWith('some message')` but the source function does not call it. The source functions were written or refactored without the expected logging.

Each fix is a one-line addition to the source file at the documented location below.

### Pattern 3: Stale Test Rewrite (TFIX-07, TFIX-08)

**What:** Tests describe behavior that no longer exists in the route. The correct fix is to update the tests to describe what the route actually does.

**TFIX-07 diagnosis:**
```typescript
// history/route.ts current code:
const events = await fritzboxClient.getDeviceEvents(hours, deviceParam ?? undefined);
// This calls the METHOD on fritzboxClient object

// Test mocks the STANDALONE EXPORT (different thing):
jest.mock('@/lib/fritzbox');
const mockGetDeviceEvents = jest.mocked(getDeviceEvents); // standalone export
// Never called because route uses fritzboxClient.getDeviceEvents, not the standalone fn
```

**TFIX-08 diagnosis:**
```typescript
// devices/route.ts current code (the full handler):
const rateLimitResult = await checkRateLimitFritzBox(...);
const devices = await getCachedData('devices', () => fritzboxClient.getDevices());
return success({ devices });
// No getDeviceStates, no logDeviceEvent, no updateDeviceStates

// Test expects all three functions to be called — they don't exist in the route
```

---

## Root Cause Per Suite

### TFIX-01: middleware.test.ts (3 tests fail)

**Failing tests:**
- `executes handler and caches result for first request with idempotency key`
- `still returns response even if cache write fails`
- `uses 1-hour TTL for cached results`

**Root cause:** `withIdempotency` uses `await import('firebase/database')` and `await import('@/lib/firebase')` inside the function body (lines 282-283 of `middleware.ts`). Jest's static mock registry does not reliably intercept dynamic imports at call-time. The mocked `ref`, `get`, `set` are never called because the function resolves its own fresh module instances.

**Fix location:** `lib/core/middleware.ts` — move the two dynamic `await import(...)` lines (lines 282-283) to static top-level imports alongside the existing imports at line 23-24.

**Verification:** After fix, `mockSet.toHaveBeenCalledTimes(1)` and `mockGet.toHaveBeenCalledTimes(1)` should pass.

**Side effects:** None — static imports are identical to dynamic imports in module behavior. The existing `jest.mock()` calls in the test already cover these modules.

---

### TFIX-02: changelogService.test.ts (4 tests fail)

**Failing tests:** All 4 `syncVersionHistoryToFirebase` tests that assert `console.log('VERSION_HISTORY sincronizzato con Firebase')`.

**Root cause:** `syncVersionHistoryToFirebase` in `lib/changelogService.ts` (line 93-111) has no `console.log` call. The function iterates and calls `saveVersionToFirebase` for each version, but never logs the completion message that tests expect.

**Fix location:** `lib/changelogService.ts` — add `console.log('VERSION_HISTORY sincronizzato con Firebase');` at the end of the `try` block in `syncVersionHistoryToFirebase`, after the `for` loop completes (before the `} catch`).

---

### TFIX-03: stoveApi.test.ts (1 test fails)

**Failing test:** `logs retry messages and error after exhausting all attempts`

**Root cause:** `fetchWithRetry` in `lib/stoveApi.ts` has empty `if` blocks where logging was removed. Lines 99-100 (`if (attempt > 0) {}`) and lines 118-119 (`if (attempt < maxRetries) {}`) are empty. The test expects `console.log(stringContaining('Timeout on attempt'))` to be called during retries.

**Fix location:** `lib/stoveApi.ts` — add `console.log(`Timeout on attempt ${attempt + 1}/${maxRetries + 1}. Retrying...`)` inside the `if (attempt < maxRetries)` block (line 118-119). Optionally add a success log inside the `if (attempt > 0)` success block (lines 105-106), though only the retry log is required by the test.

---

### TFIX-04: maintenanceService.test.ts (1 test fails)

**Failing test:** `sets needsCleaning when threshold reached during tracking`

**Root cause:** `trackUsageHours` in `lib/maintenanceService.ts` sets `currentData.needsCleaning = true` when threshold is reached (line 199) but never calls `console.log` with a threshold message. The test expects `console.log(stringContaining('⚠️ Maintenance threshold reached'))`.

**Fix location:** `lib/maintenanceService.ts` — add `console.log(`⚠️ Maintenance threshold reached: ${newCurrentHours.toFixed(2)}h / ${currentData.targetHours}h`)` immediately after `currentData.needsCleaning = true` (after line 199).

---

### TFIX-05: schedulerService.test.ts (5 tests fail)

**Failing tests:** `saveSchedule`, `setSchedulerMode` (enabled + disabled), `setSemiManualMode`, `clearSemiManualMode`

**Root cause:** All four functions in `lib/schedulerService.ts` are missing their `console.log` success calls. Tests expect:
- `saveSchedule`: `console.log(`Scheduler salvato per ${day}`)`  — not present after `set(ref(db, dayPath), intervals)`
- `setSchedulerMode(true)`: `console.log('Modalità scheduler impostata su: attiva')` — not present
- `setSchedulerMode(false)`: `console.log('Modalità scheduler impostata su: disattiva')` — not present
- `setSemiManualMode`: `console.log(`Modalità semi-manuale attivata. Ritorno automatico previsto: ${nextScheduledChange}`)` — not present
- `clearSemiManualMode`: `console.log('Modalità semi-manuale disattivata. Ritorno in automatico.')` — not present

**Fix location:** `lib/schedulerService.ts` — add the five `console.log` calls at the appropriate positions inside the `try` blocks of each function.

Note: `saveSchedule` test also expects `set` to be called with `('mock-ref', intervals)`. The current source calls `set(ref(db, dayPath), intervals)` AND also calls `set(ref(db, ...updatedAt...), new Date().toISOString())`. The test only checks that `set` was called with the right intervals, using `toHaveBeenCalledWith` (which checks any call, not only call). This should already work. The only hard failure is the missing `console.log`.

---

### TFIX-06: healthDeadManSwitch.test.ts (1 test fails)

**Failing test:** `should skip alert if ADMIN_USER_ID not configured`

**Root cause:** `alertDeadManSwitch` in `lib/healthDeadManSwitch.ts` has an early return at line 106-108 when `adminUserId` is falsy, but no `console.log`. Test expects `console.log(stringContaining('ADMIN_USER_ID not configured'))`.

**Fix location:** `lib/healthDeadManSwitch.ts` — add `console.log('[DeadManSwitch] ADMIN_USER_ID not configured, skipping alert');` before the `return;` at line 107.

---

### TFIX-07: fritzbox/history.test.ts (6 tests fail)

**Failing tests:** All 6 range/filter/empty tests

**Root cause:** Architectural mismatch between test mock target and route implementation.

The route (`app/api/fritzbox/history/route.ts`) calls:
```typescript
const events = await fritzboxClient.getDeviceEvents(hours, deviceParam ?? undefined);
```

The test mocks:
```typescript
jest.mock('@/lib/fritzbox');
const mockGetDeviceEvents = jest.mocked(getDeviceEvents); // standalone export
```

`fritzboxClient` is an object exported from `lib/fritzbox/fritzboxClient.ts`. `getDeviceEvents` is a separate standalone function exported from `lib/fritzbox/deviceEventLogger.ts`. These are two different things — the mock never intercepts `fritzboxClient.getDeviceEvents`.

Additionally, the test expects `getDeviceEvents(startTime, endTime)` — a calculated Unix ms pair — but the route passes `(hours, deviceParam)` — hours count and optional MAC string.

**Fix approach (test fix, not source fix):** Update the test to mock `fritzboxClient` and its `getDeviceEvents` method correctly. The test should mock `@/lib/fritzbox` module and specifically set `fritzboxClient.getDeviceEvents` as a jest.fn(). The expected call args should match `(hours, deviceParam)` or the route should be updated to use the standalone function with correct signature.

**Recommended fix:** Update `history/route.ts` to use the standalone `getDeviceEvents` with `(startTime, endTime)` — this matches the test expectation exactly and is the more explicit pattern. Then apply device filtering in the route handler (already tested by the test for device filter). The `fritzboxClient.getDeviceEvents` method likely wraps the standalone function anyway.

To confirm, check `fritzboxClient.ts` — it exports `getDeviceEvents` as method. But the cleaner path is to update the route to use the standalone function (mirrors the test intent) and add device filtering.

**Key insight:** The test is architecturally correct for how the route *should* work (standalone function, startTime/endTime, filter in route). The route was written to use `fritzboxClient.getDeviceEvents(hours, deviceParam)` which delegates filtering to the HA proxy. Update the route to match the test expectation.

---

### TFIX-08: fritzbox/devices-events.test.ts (6 tests fail)

**Failing tests:** All 6 event detection tests

**Root cause:** `app/api/fritzbox/devices/route.ts` does NOT contain event detection logic. The route comment explicitly states: "Device event tracking (connected/disconnected) is now handled by the HA proxy, not by Firebase-based state comparison."

The current route body:
```typescript
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'devices');
  if (!rateLimitResult.allowed) { throw new ApiError(...); }
  const devices = await getCachedData('devices', () => fritzboxClient.getDevices());
  return success({ devices });
});
```

Tests mock `getDeviceStates`, `updateDeviceStates`, `logDeviceEvent` and expect them to be called. None are called.

**Fix approach (test fix):** The tests describe a feature that was deliberately removed from this route. Update the test file to describe what the route actually does:
- Rate limit check (allowed: passes through)
- `getCachedData` called with `'devices'`
- Returns `{ success: true, devices: [...] }`
- Rate limit exceeded returns 429

Keep the mock setup for `checkRateLimitFritzBox` and `getCachedData` — they are needed. Remove the `getDeviceStates`, `updateDeviceStates`, `logDeviceEvent` mocks and assertions. Write 6 tests for the current behavior (rate limit pass, rate limit fail, success with devices, empty devices, getCachedData error, auth failure).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tracking whether mock was called | Custom spy tracking | `jest.mocked()` + `toHaveBeenCalledWith` | Type-safe, standard Jest pattern |
| Module isolation | Manual module resets | `jest.isolateModules()` for singleton state | Only needed for module-level side effects |

---

## Common Pitfalls

### Pitfall 1: Dynamic Import Bypasses Jest Mocks

**What goes wrong:** Using `await import('module')` inside a function body — Jest mock registry applies at module load time, not at call time. Dynamic imports may resolve to the real module, not the mocked one.

**Why it happens:** Jest intercepts `require()` and static `import` via its module registry. Dynamic `import()` can bypass this depending on the transformer and module resolution strategy.

**How to avoid:** Keep all Firebase imports at the top level of the module file. Never use `await import()` for modules that need to be mocked in tests.

**Warning signs:** Mock shows 0 calls when the function under test clearly reaches the mocked code path.

### Pitfall 2: clearAllMocks Does Not Reset mockReturnValue

**What goes wrong:** `jest.clearAllMocks()` clears call counts but not `mockReturnValue` / `mockImplementation` set in a previous test.

**Why it happens:** Phase 92 finding — documented project convention now.

**How to avoid:** Use `beforeEach` with explicit `mock.mockReturnValue(...)` resets, or use `jest.restoreAllMocks()` in `afterEach` for spies.

### Pitfall 3: Mock Target vs. Actual Call Target

**What goes wrong:** Test mocks `getDeviceEvents` (standalone export) but code calls `fritzboxClient.getDeviceEvents` (object method). Different references — mock never intercepts.

**How to avoid:** Always check the actual import path and call site in the source file before writing the mock. Mock what the source *actually imports*, not what you think it should use.

---

## Code Examples

### Fix Pattern A: Static Import Conversion (TFIX-01)

```typescript
// lib/core/middleware.ts — BEFORE (lines 282-283, inside withIdempotency function body)
const { ref, get, set } = await import('firebase/database');
const { db } = await import('@/lib/firebase');

// AFTER — move to file top-level imports (line 24 area, alongside NextRequest/NextResponse)
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';
// Remove the two await import lines from inside the function
```

### Fix Pattern B: Add Missing Console.log (TFIX-02 through TFIX-06)

```typescript
// Example: lib/changelogService.ts — syncVersionHistoryToFirebase
export const syncVersionHistoryToFirebase = async (versionHistory: any[]): Promise<void> => {
  try {
    for (let i = 0; i < versionHistory.length; i++) {
      // ... existing loop ...
    }
    console.log('VERSION_HISTORY sincronizzato con Firebase'); // ADD THIS
  } catch (error) {
    console.error('Errore nella sincronizzazione:', error);
    throw error;
  }
};
```

### Fix Pattern C: Rewrite Stale Test (TFIX-07, TFIX-08)

```typescript
// devices-events.test.ts — replace event detection tests with actual route behavior tests
test('returns devices list on success', async () => {
  const devices = [{ id: 'AA:BB:CC:DD:EE:FF', mac: '...', active: true, ... }];
  mockGetCachedData.mockResolvedValue(devices);

  const response = await GET(mockRequest as any, {} as any);
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
  expect(data.devices).toEqual(devices);
  expect(mockGetCachedData).toHaveBeenCalledWith('devices', expect.any(Function));
});
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (next/jest transformer) |
| Config file | `jest.config.ts` |
| Quick run command | `npx jest --testPathPattern="middleware|changelogService|stoveApi|maintenanceService|schedulerService|healthDead|fritzbox/(history|devices-events)" --no-coverage` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TFIX-01 | `withIdempotency` caches/returns results | unit | `npx jest lib/core/__tests__/middleware.test.ts --no-coverage` | ✅ |
| TFIX-02 | `syncVersionHistoryToFirebase` logs completion | unit | `npx jest lib/__tests__/changelogService.test.ts --no-coverage` | ✅ |
| TFIX-03 | `fetchWithRetry` logs retry attempts | unit | `npx jest lib/__tests__/stoveApi.test.ts --no-coverage` | ✅ |
| TFIX-04 | `trackUsageHours` logs threshold reached | unit | `npx jest lib/__tests__/maintenanceService.test.ts --no-coverage` | ✅ |
| TFIX-05 | scheduler CRUD functions log operations | unit | `npx jest lib/__tests__/schedulerService.test.ts --no-coverage` | ✅ |
| TFIX-06 | `alertDeadManSwitch` logs missing ADMIN_USER_ID | unit | `npx jest __tests__/lib/healthDeadManSwitch.test.ts --no-coverage` | ✅ |
| TFIX-07 | history route range/filter/empty behavior | unit | `npx jest app/api/fritzbox/__tests__/history.test.ts --no-coverage` | ✅ |
| TFIX-08 | devices route current behavior (not event detection) | unit | `npx jest app/api/fritzbox/__tests__/devices-events.test.ts --no-coverage` | ✅ |

### Sampling Rate
- **Per task commit:** Run the specific test file for the suite fixed
- **Per wave merge:** `npm test -- --no-coverage` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — all test files exist. No new test infrastructure required.

---

## Plan Grouping Recommendation

Based on root causes, the suggested grouping from CONTEXT.md is valid with one note:

| Plan | Suites | Work Type |
|------|--------|-----------|
| Plan 1 | TFIX-01 (middleware) + TFIX-02 (changelog) | Source fixes: static imports + missing log |
| Plan 2 | TFIX-03 (stoveApi) + TFIX-04 (maintenanceService) + TFIX-05 (scheduler) | Source fixes: missing log calls only |
| Plan 3 | TFIX-06 (healthDeadManSwitch) | Source fix: missing log call |
| Plan 4 | TFIX-07 (fritzbox/history) + TFIX-08 (fritzbox/devices-events) | Test rewrites |

Plans 1-3 can run in parallel (source fixes, no cross-contamination). Plan 4 should run independently (test rewrites require careful analysis).

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Dynamic `await import()` in middleware | Static top-level import | Required for Jest mocks to work |
| Event detection in devices route | Moved to HA proxy | Tests for devices route must be rewritten |
| `fritzboxClient.getDeviceEvents(hours, device)` | Standalone `getDeviceEvents(startTime, endTime)` | History route should use standalone fn |

---

## Open Questions

1. **TFIX-07 — Route or test fix?**
   - What we know: Route uses `fritzboxClient.getDeviceEvents(hours, deviceParam)`. Test expects standalone `getDeviceEvents(startTime, endTime)`.
   - What's unclear: Whether the `fritzboxClient.getDeviceEvents` method is just a wrapper over the standalone function, or whether it calls the HA proxy directly.
   - Recommendation: Check `lib/fritzbox/fritzboxClient.ts` before implementing. If `fritzboxClient.getDeviceEvents` delegates to the HA proxy (not the standalone fn), fix the route to use standalone `getDeviceEvents`. If `fritzboxClient.getDeviceEvents` IS the standalone function re-exported, mock the client method in the test instead. Either path is valid — planner should pick the one that keeps route behavior correct.

---

## Sources

### Primary (HIGH confidence)
- Direct test execution via `npx jest` — observed actual failure messages
- Source code inspection of all 8 source files and 8 test files
- `jest.config.ts` and `jest.setup.ts` for context on mock infrastructure

### Secondary (MEDIUM confidence)
- Phase 92 decisions documented in CONTEXT.md — `clearAllMocks` / `beforeEach` reset pattern confirmed as project standard

---

## Metadata

**Confidence breakdown:**
- Root cause diagnosis: HIGH — all 27 assertions run and inspected
- Fix strategy: HIGH for Categories A/B (trivial source additions), MEDIUM for Category C (requires verifying fritzboxClient.getDeviceEvents implementation before deciding route vs. test fix)
- Architecture patterns: HIGH — drawn from actual source code

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (stable code — valid until source files change)
