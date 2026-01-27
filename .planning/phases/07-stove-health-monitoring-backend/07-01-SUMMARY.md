---
phase: 07-stove-health-monitoring-backend
plan: 01
subsystem: health-monitoring
status: complete
tags: [health-checks, firestore-logging, parallel-fetching, state-detection]
requires:
  - lib/stoveApi.js
  - lib/netatmoApi.js
  - lib/firebaseAdmin.js
provides:
  - lib/healthMonitoring.js
  - lib/healthLogger.js
affects:
  - 07-02 (cron endpoint will use these services)
  - 10-XX (dashboard will query Firestore logs)
tech-stack:
  added: []
  patterns: [parallel-fetching, graceful-degradation, fire-and-forget, parent-subcollection-logging]
key-files:
  created:
    - lib/healthMonitoring.js
    - lib/healthLogger.js
    - __tests__/lib/healthMonitoring.test.js
    - __tests__/lib/healthLogger.test.js
  modified: []
decisions:
  - id: health-01-parallel-fetch
    decision: Use Promise.allSettled for parallel API fetching with graceful degradation
    rationale: Health checks must tolerate partial failures (Netatmo down shouldn't crash entire check)
    alternatives: [Promise.all (fails on any rejection), Sequential fetching (too slow)]
  - id: health-01-starting-grace
    decision: STARTING states have 15-min grace period (not flagged as mismatch)
    rationale: Stove takes 10-15 minutes to transition from START to WORK - avoid false alerts
  - id: health-01-parent-subcollection
    decision: Firestore parent doc per cron run + subcollection for individual checks
    rationale: Enables both aggregated queries (dashboard summary) and detailed drill-down (user-specific issues)
  - id: health-01-fire-forget
    decision: Logging failures return null instead of throwing
    rationale: Health check execution must not be blocked by Firestore transient errors
completed: 2026-01-27
duration: 5 min
---

# Phase 07 Plan 01: Core Health Check Logic and Firestore Logging Summary

**One-liner:** Parallel health checking with state mismatch detection and parent/subcollection Firestore logging

## What Was Delivered

### Health Monitoring Service (lib/healthMonitoring.js)

Core health check logic that fetches stove status, schedule, and Netatmo heating demand in parallel using Promise.allSettled for graceful degradation:

**checkUserStoveHealth(userId)** - Main function:
- Parallel fetching: stove status, schedule, Netatmo demand
- Returns complete health object with 8 fields (userId, timestamp, stoveStatus, stoveError, expectedState, netatmoDemand, connectionStatus, stateMismatch)
- Handles partial failures gracefully (e.g., Netatmo down doesn't crash check)

**determineConnectionStatus(stoveResult)** - Helper:
- 'online' - API returned valid status
- 'offline' - STOVE_TIMEOUT error (stove not responding)
- 'error' - Other errors (API error, parsing error)

**detectStateMismatch(stoveResult, scheduleResult, netatmoResult)** - Helper:
- Compares actual stove state vs expected from schedule
- State categories: ON (WORK, MODULATION), STARTING (START), OFF (STANDBY, SHUTDOWN, FINALIZZAZIONE), ERROR
- STARTING states have 15-min grace period (not flagged immediately)
- Detects coordination issues (Netatmo heating but stove OFF)
- Returns mismatch object or null

### Health Logger Service (lib/healthLogger.js)

Firestore event logging with parent/subcollection structure for audit trail and dashboard queries:

**logHealthCheckRun(results, options)** - Main function:
- Creates parent document with aggregated stats (checkedCount, successCount, failureCount, hasStateMismatch, duration)
- Creates subcollection 'checks' with individual user results
- Batch writes for efficiency
- Fire-and-forget: returns null on error (doesn't throw)

**getRecentHealthLogs(options)** - Query helper:
- Filters: startDate, endDate, hasStateMismatch, limit
- Default: last 24 hours, 100 results
- Converts Firestore Timestamps to ISO strings

**getHealthCheckDetails(runId)** - Subcollection fetch:
- Retrieves individual checks for specific cron run
- Enables drill-down from dashboard summary to user-specific issues

**getHealthStats(days)** - Statistics:
- Calculates 7-day aggregates: totalRuns, totalChecks, successRate, mismatchCount
- Dashboard summary card data

## Testing

### Health Monitoring Tests (19 tests)
- determineConnectionStatus: online/offline/error detection
- detectStateMismatch: ON/OFF mismatches, STARTING grace period, error states, Netatmo coordination
- checkUserStoveHealth: proper structure, partial failures, timeout handling, all API failures

### Health Logger Tests (19 tests)
- logHealthCheckRun: parent doc creation, subcollection writes, fire-and-forget behavior
- getRecentHealthLogs: date filters, mismatch filter, ordering, limit, timestamp conversion
- getHealthCheckDetails: subcollection fetch
- getHealthStats: 7-day aggregate calculations

**Total: 38 tests, all passing**

## Architecture Notes

### Parallel Fetching Pattern
```javascript
const [stoveResult, scheduleResult, netatmoResult] = await Promise.allSettled([
  getStoveStatus(),
  getExpectedStateFromSchedule(userId),
  getNetatmoHeatingDemand(),
]);
```

**Benefits:**
- Faster execution (parallel vs sequential)
- Graceful degradation (partial failures allowed)
- Complete error context preserved

### State Categorization
| Category | States | Behavior |
|----------|--------|----------|
| ON | WORK, MODULATION | Active heating |
| STARTING | START | 15-min grace period |
| OFF | STANDBY, SHUTDOWN, FINALIZZAZIONE | Inactive |
| ERROR | AL1, AL2, etc. | Always flagged |

### Firestore Structure
```
healthMonitoring/ (collection)
├── {runId}/ (parent doc)
│   ├── timestamp: Timestamp
│   ├── checkedCount: 3
│   ├── successCount: 2
│   ├── failureCount: 1
│   ├── hasStateMismatch: true
│   ├── duration: 1500
│   └── checks/ (subcollection)
│       ├── {checkId1}/
│       │   ├── userId: "auth0|123"
│       │   ├── status: "fulfilled"
│       │   ├── connectionStatus: "online"
│       │   ├── stoveStatus: "WORK"
│       │   ├── expectedState: "ON"
│       │   ├── netatmoDemand: "heating"
│       │   ├── stateMismatch: null
│       │   └── error: null
│       └── {checkId2}/
```

**Query patterns:**
- Dashboard summary: Query parent docs with filters
- User drill-down: Fetch subcollection for specific run
- Statistics: Aggregate parent doc fields

## Deviations from Plan

None - plan executed exactly as written.

## Known Issues / Technical Debt

None identified.

## Next Phase Readiness

**Phase 07 Plan 02 (Cron Endpoint)** - READY
- All required services implemented
- Can now create `/api/health-monitoring/check` endpoint
- Should follow existing `scheduler/check` pattern (withCronSecret middleware)

**Blockers:** None

## Integration Points

### Consumes
- `lib/stoveApi.js` → getStoveStatus()
- `lib/netatmoApi.js` → getHomeStatus()
- `lib/firebaseAdmin.js` → adminDbGet(), getAdminFirestore()

### Produces
- Health check results (checkUserStoveHealth)
- Firestore logs (logHealthCheckRun)
- Query helpers (getRecentHealthLogs, getHealthCheckDetails, getHealthStats)

### Used By
- Next plan (07-02): Cron endpoint will call checkUserStoveHealth and logHealthCheckRun
- Phase 10: Dashboard will query Firestore logs for health monitoring UI

## Performance Considerations

### Parallel Fetching
- 3 APIs called in parallel: ~1-2 seconds total (vs 3-6 seconds sequential)
- Netatmo rate limit: 500 calls/hour (existing throttle in netatmoApi.js)

### Firestore Writes
- Batch writes: 1 parent doc + N subcollection docs in single batch (efficient)
- Retention: 7 days recommended (matches Phase 10 dashboard requirement)

### Error Handling
- Fire-and-forget logging: Transient Firestore errors don't block health checks
- Graceful degradation: Partial API failures don't crash entire check
- Error context preserved: stoveError, connectionStatus fields capture failure details

## Documentation Updates Needed

None - all functionality is self-contained in lib/ services.

---

**Completion:** 2026-01-27
**Duration:** 5 minutes
**Commits:**
- bfa4347: Health Monitoring Service (19 tests)
- 3b6b82d: Health Logger Service (19 tests)
