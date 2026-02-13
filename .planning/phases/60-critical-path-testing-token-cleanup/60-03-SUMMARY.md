---
phase: 60-critical-path-testing-token-cleanup
plan: 03
subsystem: notifications/token-management
tags: [tdd, unit-testing, token-cleanup, audit-trail]
dependencies:
  requires: [60-01]
  provides: [token-cleanup-tests, staleness-verification, audit-verification]
  affects: [tokenCleanupService]
tech_stack:
  added: []
  patterns: [tdd-testing, mock-firebase-snapshots, fake-timers]
key_files:
  created:
    - lib/services/__tests__/tokenCleanupService.test.ts
  modified: []
decisions:
  - "12 test cases provide complete coverage of token cleanup logic"
  - "Mock Firebase snapshots with forEach pattern for user/error iteration"
  - "Fake timers with fixed system time (2026-02-13) for deterministic age calculations"
  - "Batch update verification confirms single update call with all deletion paths"
metrics:
  duration_minutes: 2
  tasks_completed: 1
  files_created: 1
  files_modified: 0
  lines_added: 415
  lines_removed: 0
  commits: 1
  tests_added: 12
  coverage_statements: 98.21
  coverage_branch: 92.3
completed: 2026-02-13T10:30:00Z
---

# Phase 60 Plan 03: Token Cleanup Service Unit Tests

**One-liner:** Created 12 TDD test cases with 92.3% branch coverage verifying stale token deletion, active token preservation, and audit trail logging.

## Overview

Implemented comprehensive unit tests for `tokenCleanupService.ts` following TDD methodology. Tests verify all TOKEN requirements (TOKEN-02, TOKEN-03, TOKEN-04) with high branch coverage using mock Firebase snapshots and fake timers.

## Implementation Details

### Created Files

**lib/services/__tests__/tokenCleanupService.test.ts** (415 lines)
- 12 test cases covering all code paths in cleanupStaleTokens()
- Mock Firebase database with ref/once/update pattern
- Custom snapshot helper with forEach iteration and child navigation
- Fake timers set to 2026-02-13T12:00:00.000Z for deterministic age calculations

**Test Coverage:**

1. **Empty database case** - Returns cleaned:true with zero removals
2. **Active token preservation (TOKEN-04)** - Tokens with lastUsed within 90 days are safe
3. **Stale token deletion (TOKEN-02)** - Tokens with lastUsed >90 days are deleted
4. **CreatedAt fallback** - Uses createdAt when lastUsed is missing
5. **No timestamp handling** - Tokens with neither lastUsed nor createdAt are deleted
6. **Mixed token states** - Multiple users with both active and stale tokens
7. **Audit trail logging (TOKEN-03)** - Verifies tokenCleanupHistory path and data structure
8. **Error log cleanup (30 days)** - Removes error logs older than 30 days
9. **Recent error preservation** - Keeps error logs within 30-day window
10. **Exception handling** - Returns cleaned:false with error details
11. **Batch update** - Single update call with multiple deletion paths
12. **No-op verification** - No update call when all tokens are active

### Mock Patterns

**Firebase snapshot creation:**
```typescript
function createSnapshot(data: Record<string, any>) {
  const entries = Object.entries(data);
  return {
    exists: () => entries.length > 0,
    forEach: (callback: (snap: any) => void) => {
      entries.forEach(([key, value]) => {
        callback({
          key,
          val: () => value,
          child: (childPath: string) => ({
            val: () => {
              // Navigate nested path
              const parts = childPath.split('/');
              let current = value;
              for (const part of parts) {
                current = current?.[part];
              }
              return current ?? {};
            },
          }),
        });
      });
    },
  };
}
```

**Database mock with path routing:**
```typescript
mockRef = jest.fn().mockImplementation((path: string) => ({
  once: jest.fn().mockImplementation(() => {
    if (path === 'users') return Promise.resolve(createSnapshot(usersData));
    if (path === 'notificationErrors') return Promise.resolve(createSnapshot(errorsData));
    return Promise.resolve(createSnapshot({}));
  }),
  update: mockUpdate,
}));
```

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

1. ✅ All 12 tests pass in 3.048 seconds
2. ✅ Coverage: 98.21% statements, 92.3% branch, 80% functions, 98.21% lines
3. ✅ Only uncovered line: 161 (error logging in audit trail catch block)
4. ✅ All TOKEN requirements verified:
   - TOKEN-02: Stale token deletion by delivery timestamp (lastUsed >90 days)
   - TOKEN-04: Active token preservation (lastUsed <90 days)
   - TOKEN-03: Audit trail logging to tokenCleanupHistory
5. ✅ Edge cases covered: no timestamp, createdAt fallback, batch updates, error handling

## Task Breakdown

### Task 1: Create TDD tests for cleanupStaleTokens
**Duration:** 2 minutes
**Commit:** `13499b1`
**Files:** `lib/services/__tests__/tokenCleanupService.test.ts`

- Created test file with 12 comprehensive test cases
- Implemented mock Firebase snapshot helpers
- Used fake timers for deterministic time-based tests
- Verified all code paths including edge cases
- Achieved 92.3% branch coverage (exceeds 80% target)

## Testing Strategy

**TDD Approach:**
Since the implementation already existed (from Plan 01), the tests were written against the existing service and passed immediately (GREEN state). This validates that the implementation matches the requirements.

**Mock Strategy:**
- Mock `@/lib/firebaseAdmin` module
- Create helper to build mock database with ref/once/update
- Create snapshot helper with forEach iteration
- Mock `adminDbSet` for audit trail verification

**Time Handling:**
- Use `jest.useFakeTimers()` in beforeEach
- Set fixed system time: `2026-02-13T12:00:00.000Z`
- Calculate expected age in days: 12 days (active), 135 days (stale), etc.
- Restore real timers in afterEach

## Success Criteria Met

- ✅ Token cleanup service has 12+ test cases covering all code paths
- ✅ Stale token deletion verified (>90 days by lastUsed)
- ✅ Active token preservation verified (<90 days by lastUsed)
- ✅ Audit trail logging verified (tokenCleanupHistory path)
- ✅ Tokens with no timestamp treated as stale
- ✅ Error log cleanup verified (30-day retention)
- ✅ Exception handling verified
- ✅ All tests pass
- ✅ Branch coverage >80% (achieved 92.3%)

## Coverage Analysis

**High coverage areas (100%):**
- Empty database handling
- Active token preservation logic
- Stale token detection and deletion
- Batch update construction
- Error log cleanup logic
- Exception handling

**Uncovered line:**
- Line 161: Error logging inside `.catch()` handler for audit trail failures
- Reason: Fire-and-forget pattern makes this difficult to test
- Impact: Minimal - only affects logging, not cleanup functionality

## Architecture Decisions

1. **Mock snapshot iteration**: Used forEach pattern to match real Firebase snapshot API
2. **Fake timers**: Fixed system time eliminates flakiness in age calculations
3. **Batch verification**: Confirm single update call with all paths (performance optimization)
4. **Edge case coverage**: No timestamp, createdAt fallback, exception handling all tested

## Next Steps (Plan 04)

**Plan 04:** Integration tests for critical scheduler routes
- End-to-end scheduler/check route tests
- Ignite/shutdown route integration tests
- PID route integration tests
- Full request/response cycle validation

## Self-Check: PASSED

**Created files:**
✅ FOUND: lib/services/__tests__/tokenCleanupService.test.ts (415 lines, 12 tests)

**Tests:**
✅ PASSED: All 12 tests pass
✅ PASSED: Coverage 98.21% statements, 92.3% branch (exceeds 80% target)

**Commits:**
✅ FOUND: 13499b1 (test(60-03): add unit tests for token cleanup service)

**Verification:**
✅ Test file imports cleanupStaleTokens from tokenCleanupService
✅ All TOKEN requirements validated (TOKEN-02, TOKEN-03, TOKEN-04)
✅ Mock Firebase database pattern matches actual implementation
✅ Fake timers provide deterministic time-based tests
✅ Batch update verification confirms optimization

All claims verified. Summary is accurate.
