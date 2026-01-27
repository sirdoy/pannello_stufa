---
phase: 07-stove-health-monitoring-backend
plan: 02
subsystem: health-monitoring
status: complete
tags: [cron-endpoint, dead-mans-switch, environment-validation, hmac-security]
requires:
  - lib/healthMonitoring.js
  - lib/healthLogger.js
  - lib/core/middleware.js (withCronSecret)
provides:
  - app/api/health-monitoring/check/route.js
  - lib/healthDeadManSwitch.js
  - lib/envValidator.js
affects:
  - cron-job.org (needs configuration)
  - 10-XX (dashboard will monitor dead man's switch status)
tech-stack:
  added: []
  patterns: [dead-mans-switch, fire-and-forget, fail-safe, startup-validation]
key-files:
  created:
    - app/api/health-monitoring/check/route.js
    - lib/healthDeadManSwitch.js
    - lib/envValidator.js
    - __tests__/lib/healthDeadManSwitch.test.js
    - __tests__/lib/envValidator.test.js
  modified: []
decisions:
  - id: health-02-dead-man-threshold
    decision: 10-minute threshold for stale cron detection
    rationale: Cron runs every minute - 10 missed runs indicates serious issue requiring admin alert
    alternatives: [5 min (too sensitive), 15 min (too slow to respond)]
  - id: health-02-first-operation
    decision: updateDeadManSwitch() runs FIRST before any other processing
    rationale: Even if health check fails, timestamp gets updated (proves cron is running)
  - id: health-02-env-validation
    decision: Log warnings but continue execution when env validation fails
    rationale: Partial functionality better than complete failure - admin will see warnings in logs
  - id: health-02-fire-forget-logging
    decision: Firestore logging errors don't block cron response
    rationale: Health check execution more important than logging - use fire-and-forget pattern
completed: 2026-01-27
duration: 4 min
---

# Phase 07 Plan 02: Health Monitoring Cron Endpoint with Dead Man's Switch Summary

**One-liner:** HMAC-secured cron endpoint with dead man's switch tracking, environment validation, and fire-and-forget Firestore logging

## What Was Delivered

### Cron Endpoint (app/api/health-monitoring/check/route.js)

HMAC-secured endpoint for automated health monitoring that runs every minute:

**Request flow:**
1. **Dead man's switch update** - First operation (before any logic that could fail)
2. **Environment validation** - Checks required vars, logs warnings, continues
3. **User list** - Currently checks admin user only (expandable to multi-user)
4. **Parallel health checks** - Promise.allSettled for graceful degradation
5. **Firestore logging** - Fire-and-forget (doesn't block response)
6. **Response** - Summary with success/failure counts, mismatches, duration

**Security:** Uses `withCronSecret` middleware (supports query param `?secret=xxx` or `Authorization: Bearer xxx` header)

**Response structure:**
```javascript
{
  checked: 1,
  successCount: 1,
  failureCount: 0,
  mismatches: [
    { userId, expected, actual }
  ],
  timestamp: 1706352000000,
  duration: 1500
}
```

### Dead Man's Switch Service (lib/healthDeadManSwitch.js)

Reliability monitoring for cron execution health:

**updateDeadManSwitch()** - Write timestamp to RTDB:
- Path: `healthMonitoring/lastCheck`
- Called FIRST in cron handler (before any other logic)
- Returns true/false (never throws)
- Proves cron is running even if health check fails

**checkDeadManSwitch()** - Detect stale cron:
- Reads timestamp from RTDB
- 10-minute threshold (600000 ms)
- Returns `{ stale, reason, elapsed, lastCheck }`
- Reasons: 'never_run', 'timeout', 'error'

**alertDeadManSwitch()** - Send admin notification:
- Uses triggerMaintenanceAlertServer with 100% threshold (critical)
- Message varies by reason:
  - 'never_run': "Health monitoring cron has never executed"
  - 'timeout': "Health monitoring cron hasn't run in {elapsed} minutes"
- Fire-and-forget: logs result but doesn't throw

**Fallback check pattern (from RESEARCH.md):**
Dashboard can attempt manual health check when dead man's switch triggers:
- If check succeeds: "Cron service not running but system responsive"
- If check fails: "System completely unresponsive"

### Environment Validator (lib/envValidator.js)

Startup validation for configuration health:

**validateHealthMonitoringEnv()** - Required vars:
- `ADMIN_USER_ID` - Alert recipient
- `CRON_SECRET` - Endpoint security
- `FIREBASE_ADMIN_PROJECT_ID` - Firestore logging
- `FIREBASE_ADMIN_CLIENT_EMAIL` - Firebase auth
- `FIREBASE_ADMIN_PRIVATE_KEY` - Firebase auth

Optional vars (warnings only):
- `NETATMO_CLIENT_ID` - Heating demand check
- `NETATMO_CLIENT_SECRET` - Heating demand check

Returns: `{ valid, missing[], warnings[] }`

**validateNetatmoEnv()** - Dev vs prod detection:
- Detects 'test' or 'dev' in credential strings
- Warns if using dev credentials in production
- Returns: `{ valid, environment: 'dev'|'prod', warnings[] }`

## Testing

### Dead Man's Switch Tests (12 tests)
- updateDeadManSwitch: writes ISO timestamp to RTDB, returns false on error
- checkDeadManSwitch: detects stale (10+ min), never_run, healthy states
- alertDeadManSwitch: sends notifications, handles failures, skips if ADMIN_USER_ID missing

### Environment Validator Tests (11 tests)
- validateHealthMonitoringEnv: detects missing required vars, warns about optional vars
- validateNetatmoEnv: detects dev/prod environment, warns about misconfigurations

**Total: 23 new tests, all passing (61 total with existing health tests)**

## Architecture Notes

### Dead Man's Switch Pattern
```
Cron execution:
1. updateDeadManSwitch() → RTDB write (proves cron ran)
2. Health check logic (can fail)
3. Firestore logging (fire-and-forget)
4. Response

Separate monitoring process:
- Periodically call checkDeadManSwitch()
- If stale > 10 min → alertDeadManSwitch()
- Dashboard shows red banner when stale
```

**Benefits:**
- Cron outages detected within 10 minutes
- Separates execution from monitoring
- Timestamp write happens even if health check crashes
- Admin gets notification automatically

### Cron Endpoint Flow
```
┌─────────────────────────────────────────────────┐
│ 1. withCronSecret (HMAC validation)             │
├─────────────────────────────────────────────────┤
│ 2. updateDeadManSwitch() ← FIRST OPERATION      │
├─────────────────────────────────────────────────┤
│ 3. validateHealthMonitoringEnv()                │
│    ├─ Log warnings if invalid                   │
│    └─ Continue anyway (graceful degradation)    │
├─────────────────────────────────────────────────┤
│ 4. Get users to check (ADMIN_USER_ID)           │
│    └─ Return early warning if not configured    │
├─────────────────────────────────────────────────┤
│ 5. Promise.allSettled (parallel checks)         │
│    ├─ checkUserStoveHealth(userId)              │
│    └─ Graceful degradation on failures          │
├─────────────────────────────────────────────────┤
│ 6. logHealthCheckRun().catch() ← Fire-and-forget│
├─────────────────────────────────────────────────┤
│ 7. Return success (duration, counts, mismatches)│
└─────────────────────────────────────────────────┘
```

### Environment Validation Strategy
- **Required vars:** Block shows in logs but doesn't prevent startup
- **Optional vars:** Warning only (Netatmo checks skip gracefully)
- **Fail-safe:** Log validation on startup, re-validate on each cron run

## Deviations from Plan

None - plan executed exactly as written.

## Known Issues / Technical Debt

None identified.

## Next Phase Readiness

**Phase 07 Plan 03 (Dead Man's Switch Monitoring)** - READY
- Dead man's switch service implemented
- Dashboard can call checkDeadManSwitch() periodically
- CronHealthBanner component can show stale status

**Phase 10 (Dashboard)** - READY
- Firestore logs available via getRecentHealthLogs()
- Dead man's switch status available via checkDeadManSwitch()
- Can display health check history and cron status

**Blockers:** None

## Integration Points

### Consumes
- `lib/healthMonitoring.js` → checkUserStoveHealth()
- `lib/healthLogger.js` → logHealthCheckRun()
- `lib/core/middleware.js` → withCronSecret()
- `lib/notificationTriggersServer.js` → triggerMaintenanceAlertServer()

### Produces
- `/api/health-monitoring/check` - Cron endpoint
- `healthMonitoring/lastCheck` in RTDB - Dead man's switch timestamp
- Health check logs in Firestore `healthMonitoring` collection

### Used By
- Cron service (cron-job.org): Calls `/api/health-monitoring/check` every minute
- Dashboard (Phase 10): Monitors dead man's switch status, displays health logs
- Alert system: Sends admin notifications when cron stale

## Performance Considerations

### Cron Frequency
- Recommended: Every 1 minute
- Dead man's switch threshold: 10 minutes (10 missed runs before alert)
- Firestore writes: 1 parent doc + N subcollection docs per run (efficient batch writes)

### Graceful Degradation
- Environment validation failures don't block execution
- Firestore logging failures don't block response
- User health check failures captured individually (Promise.allSettled)
- Missing ADMIN_USER_ID returns early warning (doesn't crash)

### Security
- HMAC validation via withCronSecret (query param or Authorization header)
- No API key rotation needed (shared secret approach)
- Follows existing scheduler/check pattern

## Operational Setup Required

**1. Cron Configuration (cron-job.org):**
```
URL: https://{domain}/api/health-monitoring/check?secret={CRON_SECRET}
Frequency: Every 1 minute
Method: GET
Timeout: 30 seconds
```

**2. Environment Variables:**
All required vars must be configured (see envValidator.js):
- ADMIN_USER_ID
- CRON_SECRET
- FIREBASE_ADMIN_* (3 vars)
- Optional: NETATMO_CLIENT_ID, NETATMO_CLIENT_SECRET

**3. Dead Man's Switch Monitoring:**
Dashboard should periodically call checkDeadManSwitch() (e.g., every 30 seconds) to detect stale cron and show banner.

## Documentation Updates Needed

None - all functionality documented in code comments and this summary.

---

**Completion:** 2026-01-27
**Duration:** 4 minutes
**Commits:**
- c0c5bd1: Dead Man's Switch Service (12 tests)
- 3cd351a: Environment Validator (11 tests)
- 5e628a6: Health Monitoring Cron Endpoint
