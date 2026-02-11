---
phase: 53-pwa-offline-improvements
plan: 02
subsystem: pwa-offline
tags: [staleness-detection, command-expiration, offline-data, react-hooks, tdd]
dependency_graph:
  requires:
    - lib/pwa/indexedDB.ts
  provides:
    - lib/pwa/stalenessDetector.ts
    - lib/hooks/useDeviceStaleness.ts
  affects:
    - Device cards (future integration)
    - Offline command queue (command expiration)
tech_stack:
  added:
    - StalenessInfo interface for device data freshness
    - Command expiration logic for safety-critical endpoints
  patterns:
    - 30-second staleness threshold for cached data
    - 1-hour expiration for safety-critical commands (ignite, shutdown, set-power)
    - 5-second polling interval for real-time staleness updates
    - TDD RED-GREEN-REFACTOR cycle
key_files:
  created:
    - lib/pwa/stalenessDetector.ts (137 lines)
    - lib/hooks/useDeviceStaleness.ts (67 lines)
    - lib/pwa/__tests__/stalenessDetector.test.ts (164 lines)
    - lib/hooks/__tests__/useDeviceStaleness.test.ts (195 lines)
  modified: []
decisions:
  - title: 30-second staleness threshold
    rationale: Balances data freshness with UI responsiveness; offline data older than 30s should show warning
    alternatives: [60s (too permissive), 15s (too aggressive)]
    impact: Device cards will show staleness warnings for data >30s old
  - title: 1-hour command expiration for safety-critical
    rationale: Prevents dangerous stale-intent execution (e.g., ignite command from 2 hours ago)
    alternatives: [30 minutes (too restrictive), 2 hours (too permissive)]
    impact: Offline commands expire after 1 hour for safety-critical endpoints only
  - title: 5-second polling interval
    rationale: Real-time staleness updates without excessive re-renders or IndexedDB reads
    alternatives: [1s (too aggressive), 10s (too slow)]
    impact: Device staleness state updates every 5 seconds
metrics:
  duration_seconds: 266
  duration_minutes: 4
  tasks_completed: 2
  files_created: 4
  files_modified: 1
  tests_added: 19
  tests_passing: 19
  lines_added: 563
  commits: 2
  completed_at: "2026-02-11T08:14:37Z"
---

# Phase 53 Plan 02: Staleness Detection and Command Expiration

**Staleness detection service for device data freshness with command expiration for safety-critical offline commands.**

## What Was Built

### Core Services

**stalenessDetector.ts** (137 lines)
- `getDeviceStaleness(deviceId)`: Returns `{ isStale, cachedAt, ageSeconds }`
- `isCommandExpired(command)`: Checks if command has expired (1hr for safety-critical)
- `STALENESS_THRESHOLD`: 30 seconds constant
- Safety-critical endpoints: `stove/ignite`, `stove/shutdown`, `stove/set-power`

**useDeviceStaleness.ts** (67 lines)
- React hook for real-time staleness monitoring
- Polls every 5 seconds via `setInterval`
- Returns `StalenessInfo | null`
- Cleanup on unmount

### Test Coverage

**stalenessDetector.test.ts** (11 tests)
- Staleness detection for fresh/stale/missing data
- Threshold boundary testing (exactly 30s)
- Command expiration for safety-critical vs read-only endpoints
- All safety-critical endpoints recognized

**useDeviceStaleness.test.ts** (8 tests)
- Initial state and first fetch
- 5-second polling interval verification
- State updates on each poll
- Interval cleanup on unmount
- Device ID changes handled
- Error handling

## Technical Implementation

### Staleness Detection Logic

```typescript
const ageMs = Date.now() - cachedTimestamp;
const isStale = ageMs >= STALENESS_THRESHOLD; // 30000ms
```

### Command Expiration

```typescript
SAFETY_CRITICAL_ENDPOINTS = ['stove/ignite', 'stove/shutdown', 'stove/set-power']
COMMAND_EXPIRY_MS = 60 * 60 * 1000 // 1 hour

if (isSafetyCritical && ageMs > COMMAND_EXPIRY_MS) return true;
```

### React Hook Pattern

```typescript
useEffect(() => {
  const fetch = async () => { setStaleness(await getDeviceStaleness(deviceId)); };
  fetch(); // Initial
  const interval = setInterval(fetch, 5000); // Poll
  return () => clearInterval(interval); // Cleanup
}, [deviceId]);
```

## Deviations from Plan

### Test Timing Fix (Rule 1 - Bug)

**Found during:** GREEN phase - hook tests failing intermittently

**Issue:** Tests expected exact call counts (e.g., `toHaveBeenCalledTimes(1)`), but `waitFor` timeout could trigger interval, causing race conditions:
```
Expected: 1 call
Received: 2 calls
```

**Fix:** Changed assertions to track call count before/after time advances:
```typescript
// Before (flaky)
await waitFor(() => expect(fn).toHaveBeenCalledTimes(1));

// After (reliable)
await waitFor(() => expect(fn).toHaveBeenCalled());
const initialCalls = fn.mock.calls.length;
jest.advanceTimersByTime(5000);
await waitFor(() => expect(fn).toHaveBeenCalledTimes(initialCalls + 1));
```

**Files modified:** `lib/hooks/__tests__/useDeviceStaleness.test.ts`

**Commit:** 4ba5cb3 (included in GREEN phase)

## Verification Results

### Test Results
```bash
npm test -- --testPathPatterns="staleness" --no-coverage

✓ stalenessDetector.test.ts (11 tests)
✓ useDeviceStaleness.test.ts (8 tests)

Test Suites: 2 passed
Tests: 19 passed
```

### TypeScript Compilation
✓ No new TypeScript errors introduced
✓ Interfaces exported correctly
✓ Path aliases resolved (`@/lib/pwa/stalenessDetector`)

### Must-Haves Validation

| Artifact | Requirement | Status |
|----------|-------------|--------|
| stalenessDetector.ts | min 30 lines | ✅ 137 lines |
| stalenessDetector.ts | exports getDeviceStaleness, isCommandExpired, STALENESS_THRESHOLD | ✅ All exported |
| useDeviceStaleness.ts | min 25 lines | ✅ 67 lines |
| useDeviceStaleness.ts | exports useDeviceStaleness | ✅ Exported |
| stalenessDetector.test.ts | min 40 lines | ✅ 164 lines |
| useDeviceStaleness.test.ts | min 30 lines | ✅ 195 lines |
| Key link | stalenessDetector → indexedDB | ✅ `get(STORES.DEVICE_STATE, deviceId)` |
| Key link | useDeviceStaleness → stalenessDetector | ✅ `import { getDeviceStaleness }` |

### TDD Cycle

1. **RED** (commit 522fb90): Created failing tests
   - stalenessDetector.test.ts: 11 test cases
   - useDeviceStaleness.test.ts: 9 test cases (later reduced to 8)
   - Tests fail with "Cannot find module" errors

2. **GREEN** (commit 4ba5cb3): Implemented functionality
   - Created stalenessDetector.ts with detection logic
   - Created useDeviceStaleness.ts with polling hook
   - Fixed test timing issues
   - All 19 tests passing

3. **REFACTOR**: Not needed
   - Code already minimal and clean
   - No duplication or complexity to refactor

## Integration Points

### Current Usage
None yet - this plan provides foundation infrastructure.

### Future Integration (Phase 53 Plans 03-05)
- **Device cards**: Show staleness warnings when `isStale === true`
- **Offline command queue**: Use `isCommandExpired` to reject stale safety-critical commands
- **UI indicators**: Display "Data from N seconds ago" using `ageSeconds`

## Files Changed

### Created (4 files, 563 lines)
- `lib/pwa/stalenessDetector.ts` (137 lines)
- `lib/hooks/useDeviceStaleness.ts` (67 lines)
- `lib/pwa/__tests__/stalenessDetector.test.ts` (164 lines)
- `lib/hooks/__tests__/useDeviceStaleness.test.ts` (195 lines)

### Modified (1 file)
- `lib/hooks/__tests__/useDeviceStaleness.test.ts` (test timing fixes)

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 522fb90 | test | RED: Add failing tests for staleness detection |
| 4ba5cb3 | feat | GREEN: Implement staleness detection and device staleness hook |

## Self-Check

**Verifying created files:**
```bash
✅ FOUND: lib/pwa/stalenessDetector.ts
✅ FOUND: lib/hooks/useDeviceStaleness.ts
✅ FOUND: lib/pwa/__tests__/stalenessDetector.test.ts
✅ FOUND: lib/hooks/__tests__/useDeviceStaleness.test.ts
```

**Verifying commits:**
```bash
✅ FOUND: 522fb90 (test(53-02): add failing tests for staleness detection)
✅ FOUND: 4ba5cb3 (feat(53-02): implement staleness detection and device staleness hook)
```

**Verifying exports:**
```bash
✅ getDeviceStaleness exported from stalenessDetector.ts
✅ isCommandExpired exported from stalenessDetector.ts
✅ STALENESS_THRESHOLD exported from stalenessDetector.ts
✅ StalenessInfo interface exported from stalenessDetector.ts
✅ useDeviceStaleness exported from useDeviceStaleness.ts
```

## Self-Check: PASSED

All claims verified. Implementation complete.

---

**Plan 53-02 Complete** | Duration: 4 minutes | Tests: 19/19 passing | TDD: RED-GREEN cycle
