---
phase: 08-stove-thermostat-integration-correction
plan: 02
subsystem: coordination
tags: [debounce, throttle, in-memory, timers, rate-limiting]

# Dependency graph
requires:
  - phase: 08-01
    provides: coordinationState for pendingDebounce flag persistence
  - phase: 03
    provides: rateLimiter.js pattern for in-memory Map-based storage
provides:
  - Debounce timer service (2-min delay, 30s retry, early cancellation)
  - Global notification throttle service (30-min window across all coordination events)
  - In-memory timer and throttle management with automatic cleanup
affects:
  - 08-03: Coordination logic will use these services for timing control
  - 08-04: UI will display debounce status and throttle information
  - 08-05: Integration tests will verify timer behavior

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "In-memory Map-based timer management (activeTimers Map with setTimeout)"
    - "State persistence via coordinationState (pendingDebounce flag)"
    - "Global throttle pattern (different from rateLimiter.js per-type throttle)"
    - "Automatic cleanup intervals (5-min cleanup for both services)"

key-files:
  created:
    - lib/coordinationDebounce.js
    - lib/coordinationNotificationThrottle.js
    - __tests__/lib/coordinationDebounce.test.js
    - __tests__/lib/coordinationNotificationThrottle.test.js
  modified: []

key-decisions:
  - "Debounce timer: 2-minute default delay for stove ON events"
  - "Early shutoff handling: 30-second retry timer when stove OFF during debounce"
  - "Immediate execution: Stove OFF with no pending debounce executes immediately"
  - "State persistence: pendingDebounce flag in coordinationState enables resumability"
  - "Global throttle: Single 30-minute window across ALL coordination event types (not per-type like rateLimiter.js)"
  - "Notification decision only: Throttle service decides if sending allowed, doesn't send notifications"
  - "Always log events: Even when throttled, events should be logged to Firestore"

patterns-established:
  - "handleStoveStateChange: Context-aware debouncing based on current state and pending timers"
  - "Timer cancellation on new timer start: Ensures single active timer per user"
  - "Cleanup safety net: Removes stale entries after 5 minutes (prevents memory leaks)"
  - "Wait time calculation: Provides user-friendly seconds remaining for throttle status"

# Metrics
duration: 4.6min
completed: 2026-01-27
---

# Phase 08 Plan 02: Coordination Logic Services Summary

**In-memory debounce timer and global notification throttle services with 2-min delay, 30s retry, and 30-min notification window**

## Performance

- **Duration:** 4.6 min
- **Started:** 2026-01-27T13:28:59Z
- **Completed:** 2026-01-27T13:33:36Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments
- Debounce timer service manages coordination timing with 2-min delay for stove ON events
- 30-second retry timer for early shutoff handling (stove OFF during debounce)
- Global notification throttle enforces 30-min window across all coordination event types
- Both services follow rateLimiter.js patterns with automatic cleanup
- Comprehensive test coverage (34 tests total: 18 debounce + 16 throttle)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Debounce Timer Service** - `56b9d93` (feat) - Already completed
2. **Task 2: Create Notification Throttle Service** - `c00e075` (feat)

## Files Created/Modified

### Created
- `lib/coordinationDebounce.js` - Debounce timer management with handleStoveStateChange logic
- `lib/coordinationNotificationThrottle.js` - Global notification throttle service
- `__tests__/lib/coordinationDebounce.test.js` - 18 tests covering timer lifecycle and state changes
- `__tests__/lib/coordinationNotificationThrottle.test.js` - 16 tests covering global throttle behavior

### Modified
None - all new files

## Decisions Made

**Debounce Timer Strategy:**
- 2-minute delay for stove ON events (prevents premature coordination)
- 30-second retry for early shutoff (handles quick stove restarts)
- Immediate execution for stove OFF with no pending timer (restore setpoints quickly)
- State persistence via coordinationState.pendingDebounce (enables resumability after server restart)

**Notification Throttle Strategy:**
- GLOBAL 30-minute window (different from rateLimiter.js which is per-type)
- Applies to ALL coordination event types (coordinationApplied, coordinationRestored, automationPaused, maxSetpointReached)
- Service only decides if sending allowed - caller handles actual notification sending
- Always log events to Firestore regardless of throttle status

**Memory Management:**
- In-memory Map storage (timers and timestamps don't persist)
- 5-minute cleanup interval for both services
- Automatic removal of expired entries

**Context-Aware Logic:**
handleStoveStateChange implements intelligent debouncing:
- ON + no pending → 2-min timer
- OFF during ON debounce → Cancel, 30s retry
- OFF + no pending → Execute immediately
- State matches targetState → No action

## Deviations from Plan

**[Rule 1 - Bug] Fixed test timing issue:**
- **Found during:** Task 1 test execution
- **Issue:** Test "does not remove recent entries" advancing 2 minutes caused timer to expire naturally
- **Fix:** Changed advance time from 2 minutes to 1 minute (within timer duration)
- **Files modified:** `__tests__/lib/coordinationDebounce.test.js`
- **Commit:** Included in Task 1 commit

## Issues Encountered

**Task 1 already completed:**
- Task 1 (debounce service) was already implemented in commit `56b9d93`
- This was from a previous execution that completed some tasks but not the full plan
- Resolution: Verified existing implementation matches plan requirements, proceeded with Task 2

## User Setup Required

None - no external service configuration required. Services use in-memory storage and existing coordinationState infrastructure.

## Next Phase Readiness

**Ready for 08-03 (Coordination Logic):**
- Debounce service provides handleStoveStateChange for intelligent timing control
- Notification throttle service provides shouldSendCoordinationNotification for spam prevention
- Both services have status getters for debugging and UI display

**Ready for 08-04 (UI):**
- getDebounceStatus() returns remaining time for progress indicators
- getThrottleStatus() returns wait time for notification status display
- Both services expose clear APIs for React integration

**Ready for 08-05 (Integration Tests):**
- Both services export _internals for test access
- Cleanup functions can be called manually in tests
- Timer behavior testable with jest.useFakeTimers()

**No blockers** - all timing control services in place for coordination logic implementation.

## Test Coverage

**coordinationDebounce.test.js (18 tests):**
- Timer creation and Map storage
- Timer cancellation and replacement
- coordinationState updates (pendingDebounce flag)
- Timer callback execution after delay
- handleStoveStateChange context-aware logic
- Remaining time calculation
- Cleanup of stale entries

**coordinationNotificationThrottle.test.js (16 tests):**
- First notification allowed
- Throttling within 30-min window
- Window expiration and reset
- Wait time calculation
- Global throttle behavior (not per-type)
- Independent throttles per user
- Cleanup of expired entries

All 34 tests passing.

---
*Phase: 08-stove-thermostat-integration-correction*
*Completed: 2026-01-27*
