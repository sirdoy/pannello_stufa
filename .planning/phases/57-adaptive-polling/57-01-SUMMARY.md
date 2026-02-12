---
phase: 57-adaptive-polling
plan: 01
subsystem: hooks
tags: [polling, visibility-api, network-api, tdd, performance]
dependency-graph:
  requires: []
  provides: [useVisibility, useNetworkQuality, useAdaptivePolling]
  affects: []
tech-stack:
  added: [Page Visibility API, Network Information API]
  patterns: [Dan Abramov interval pattern, progressive enhancement, SSR-safe hooks]
key-files:
  created:
    - lib/hooks/useVisibility.ts
    - lib/hooks/useNetworkQuality.ts
    - lib/hooks/useAdaptivePolling.ts
    - lib/hooks/__tests__/useVisibility.test.ts
    - lib/hooks/__tests__/useNetworkQuality.test.ts
    - lib/hooks/__tests__/useAdaptivePolling.test.ts
  modified: []
decisions:
  - Progressive enhancement: useNetworkQuality returns 'unknown' (not 'fast') when API unavailable
  - Visibility restore triggers immediate callback for fresh data without interval wait
  - alwaysActive flag allows safety-critical features to poll even when tab hidden
  - Ref pattern for callback storage avoids stale closures (Dan Abramov pattern)
  - SSR-safe initialization assumes visible state on server/mount
metrics:
  duration: 4 minutes
  completed: 2026-02-12
---

# Phase 57 Plan 01: Adaptive Polling Foundation

**One-liner:** Three visibility-aware polling hooks (useVisibility, useNetworkQuality, useAdaptivePolling) with 21 tests using TDD methodology

## Summary

Created the three foundational hooks for adaptive polling integration:

1. **useVisibility** - Page Visibility API wrapper that tracks document.hidden state
2. **useNetworkQuality** - Network Information API wrapper that classifies connection speed
3. **useAdaptivePolling** - Centralized polling hook with visibility awareness and interval management

All hooks follow TDD methodology (RED → GREEN), are SSR-safe, and handle progressive enhancement gracefully.

## Objective Achievement

✅ **Objective met:** Three tested hooks in lib/hooks/ with comprehensive test coverage (21 tests total)

### Requirements Met

| Must-Have | Status | Evidence |
|-----------|--------|----------|
| useVisibility tracks document.hidden | ✅ | 4 tests pass |
| useAdaptivePolling pauses on hidden tab | ✅ | Tests verify pause behavior |
| useAdaptivePolling resumes with immediate call | ✅ | "resumes and calls immediately" test |
| useAdaptivePolling alwaysActive never pauses | ✅ | "does not pause when alwaysActive" test |
| useNetworkQuality maps effectiveType correctly | ✅ | 7 tests cover all mappings |
| useNetworkQuality returns 'unknown' fallback | ✅ | First test verifies fallback |

## Tasks Completed

### Task 1: Create useVisibility and useNetworkQuality hooks with TDD

**Approach:** RED phase first (failing tests), then GREEN phase (implementation)

**useVisibility:**
- Wraps Page Visibility API with `document.hidden` and `visibilitychange` event
- SSR-safe: checks `typeof document === 'undefined'`
- Initializes to `true` (assume visible)
- Sets actual state on mount
- Cleanup: removes event listener on unmount
- **4 tests:** initial visible, becomes hidden, becomes visible again, cleanup

**useNetworkQuality:**
- Wraps Network Information API with `(navigator as any).connection`
- Maps `effectiveType`: `'slow-2g'/'2g'` → `'slow'`, `'3g'/'4g'` → `'fast'`
- Returns `'unknown'` when API unavailable (progressive enhancement)
- Listens to `connection` `'change'` events
- Cleanup: removes listener on unmount
- **7 tests:** unknown fallback, 4g/3g/2g/slow-2g mappings, change event, cleanup

**Deviation:** Added `act()` wrapper to tests for React state updates (Rule 1 - auto-fix bug)

**Files:**
- `lib/hooks/useVisibility.ts` (35 lines)
- `lib/hooks/useNetworkQuality.ts` (67 lines)
- `lib/hooks/__tests__/useVisibility.test.ts` (73 lines)
- `lib/hooks/__tests__/useNetworkQuality.test.ts` (158 lines)

**Tests:** 11 tests passing

**Commit:** b7c13b7

### Task 2: Create useAdaptivePolling hook with TDD

**Approach:** RED phase first (failing tests), then GREEN phase (implementation)

**useAdaptivePolling:**
- Interface: `UseAdaptivePollingOptions` with `callback`, `interval`, `alwaysActive?`, `immediate?`
- Uses `useRef` for callback storage (Dan Abramov pattern - avoids stale closures)
- Uses `useVisibility()` from Task 1
- Logic:
  1. Updates `savedCallback.current` on callback change
  2. On mount: calls `savedCallback.current()` if `immediate && interval !== null`
  3. Interval management effect: no interval if `interval === null` or `!alwaysActive && !isVisible`
  4. Visibility restore effect: calls immediately when tab becomes visible (unless `alwaysActive`)
- Cleanup: clears interval on unmount

**10 test cases:**
1. ✅ Calls callback immediately on mount when `immediate: true` (default)
2. ✅ Does NOT call callback on mount when `immediate: false`
3. ✅ Calls callback at regular interval
4. ✅ Stops calling when `interval` changes to `null`
5. ✅ Pauses polling when tab becomes hidden
6. ✅ Resumes polling AND calls immediately when tab becomes visible again
7. ✅ Does NOT pause when `alwaysActive: true` even if tab hidden
8. ✅ Cleans up interval on unmount
9. ✅ Uses latest callback (no stale closures)
10. ✅ Does NOT call immediately on visibility restore when `alwaysActive: true`

**Files:**
- `lib/hooks/useAdaptivePolling.ts` (112 lines)
- `lib/hooks/__tests__/useAdaptivePolling.test.ts` (306 lines)

**Tests:** 10 tests passing

**Commit:** 6205766

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added act() wrapper to visibility/network change tests**
- **Found during:** Task 1 GREEN phase
- **Issue:** Tests failed with "An update to TestComponent inside a test was not wrapped in act(...)" error
- **Fix:** Imported `act` from `@testing-library/react` and wrapped `document.dispatchEvent()` and connection change handler calls
- **Files modified:** `lib/hooks/__tests__/useVisibility.test.ts`, `lib/hooks/__tests__/useNetworkQuality.test.ts`
- **Commit:** Included in b7c13b7

## Key Technical Details

### Pattern: Dan Abramov Interval Pattern

```typescript
const savedCallback = useRef(callback);

useEffect(() => {
  savedCallback.current = callback;
}, [callback]);

useEffect(() => {
  const tick = () => savedCallback.current();
  const id = setInterval(tick, interval);
  return () => clearInterval(id);
}, [interval]);
```

**Why:** Avoids stale closures. Interval effect doesn't need callback in deps because it uses ref.

### Pattern: Progressive Enhancement

```typescript
// useNetworkQuality
if (!connection || !connection.effectiveType) {
  return 'unknown'; // NOT 'fast' - don't assume
}
```

**Why:** Unknown network > assumed fast network. Prevents aggressive polling on slow connections.

### Pattern: SSR Safety

```typescript
// useVisibility
const [isVisible, setIsVisible] = useState(() => {
  if (typeof document === 'undefined') {
    return true; // Server assumes visible
  }
  return !document.hidden;
});
```

**Why:** Next.js SSR renders on server without `document`. Graceful degradation.

### Pattern: Visibility Restore Immediate Fetch

```typescript
// useAdaptivePolling
const becameVisible = !wasVisible.current && isVisible;
if (becameVisible && !alwaysActive && interval !== null) {
  savedCallback.current(); // Fetch immediately, don't wait for interval
}
```

**Why:** User returns to tab expecting fresh data. Interval could be 30s+ away.

## Verification

```bash
npm test -- --testPathPatterns='lib/hooks/__tests__/(useVisibility|useNetworkQuality|useAdaptivePolling)' --no-coverage
```

**Result:** 21 tests passed (4 + 7 + 10)

```bash
npx tsc --noEmit --strict --skipLibCheck lib/hooks/useVisibility.ts lib/hooks/useNetworkQuality.ts lib/hooks/useAdaptivePolling.ts
```

**Result:** No TypeScript errors

```bash
grep -n 'export' lib/hooks/useVisibility.ts lib/hooks/useNetworkQuality.ts lib/hooks/useAdaptivePolling.ts
```

**Result:** All exports verified:
- `useVisibility` function
- `NetworkQuality` type + `useNetworkQuality` function
- `UseAdaptivePollingOptions` interface + `useAdaptivePolling` function

## Self-Check

### Files Created

```bash
[ -f "lib/hooks/useVisibility.ts" ] && echo "✅ useVisibility.ts"
[ -f "lib/hooks/useNetworkQuality.ts" ] && echo "✅ useNetworkQuality.ts"
[ -f "lib/hooks/useAdaptivePolling.ts" ] && echo "✅ useAdaptivePolling.ts"
[ -f "lib/hooks/__tests__/useVisibility.test.ts" ] && echo "✅ useVisibility.test.ts"
[ -f "lib/hooks/__tests__/useNetworkQuality.test.ts" ] && echo "✅ useNetworkQuality.test.ts"
[ -f "lib/hooks/__tests__/useAdaptivePolling.test.ts" ] && echo "✅ useAdaptivePolling.test.ts"
```

### Commits Created

```bash
git log --oneline --all | grep -E "(b7c13b7|6205766)"
```

## Self-Check: PASSED

✅ All 6 files created
✅ Both commits verified (b7c13b7, 6205766)
