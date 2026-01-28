---
phase: 10-monitoring-dashboard-&-alerts-ui
plan: 05
type: gap-closure
completed: 2026-01-28
duration: 4.4 minutes

# Dependencies
requires:
  - 08-02-notifications-throttle
  - 07-02-health-monitoring-cron
  - 03-01-notification-triggers-infrastructure

provides:
  - Health monitoring push notification triggering
  - Connection lost alerts
  - State mismatch alerts
  - Stove error alerts
  - 30-minute notification deduplication

affects:
  - Future health alert preference UI (Phase 10)
  - Admin notification settings

# Tech Stack
tech-stack:
  added: []
  patterns:
    - Fire-and-forget notification pattern
    - Throttle-before-send pattern
    - Global coordination throttle reuse

# Files
key-files:
  created:
    - __tests__/lib/healthNotifications.test.js
  modified:
    - lib/notificationTriggers.js
    - lib/notificationTriggersServer.js
    - app/api/health-monitoring/check/route.js

# Decisions
decisions:
  - id: monitoring-notification-types
    decision: Create three health monitoring notification types (connection_lost, state_mismatch, stove_error)
    rationale: Covers all critical health monitoring scenarios with appropriate priority levels
    alternatives: Single generic monitoring alert (rejected - lacks specificity)
    impact: Users receive targeted alerts for different health issues

  - id: reuse-coordination-throttle
    decision: Reuse coordination throttle (30-min global window) for health alerts
    rationale: Health alerts and coordination events are related, one throttle window prevents spam
    alternatives: Separate health monitoring throttle (rejected - more complex)
    impact: Simple deduplication, max 1 alert per 30 minutes across all events

  - id: fire-and-forget-notifications
    decision: Fire-and-forget pattern for notification sending (don't block cron response)
    rationale: Cron endpoint must respond quickly, notification failures shouldn't block health checks
    alternatives: Await notifications (rejected - increases cron latency)
    impact: Fast cron response, notifications sent asynchronously

  - id: throttle-check-before-send
    decision: Check throttle BEFORE creating notification promises
    rationale: Synchronous check prevents unnecessary async operations
    alternatives: Check inside notification function (rejected - wastes async overhead)
    impact: Efficient throttle enforcement, minimal overhead

# Commits
commits:
  - hash: 38cc889
    message: "feat(10-05): add health monitoring notification types"
    files:
      - lib/notificationTriggers.js
      - lib/notificationTriggersServer.js

  - hash: 575a214
    message: "feat(10-05): wire notification triggering in health check cron"
    files:
      - app/api/health-monitoring/check/route.js

  - hash: 787d228
    message: "test(10-05): add unit tests for health notification triggering"
    files:
      - __tests__/lib/healthNotifications.test.js

# Metrics
metrics:
  tests-added: 7
  tests-passing: 7
  notification-types-added: 3
---

# Phase 10 Plan 05: Health Alert Notification Wiring Summary

**One-liner:** Wired push notification triggering into health monitoring cron with 30-minute global throttle and fire-and-forget delivery

## What Was Built

### 1. Health Monitoring Notification Types

Added three new notification types to support health monitoring alerts:

**monitoring_connection_lost:**
- Category: monitoring
- Priority: high
- Triggered when: Stove is offline or connection error detected
- Message: "La stufa non risponde. Verifica la connessione."
- URL: /monitoring

**monitoring_state_mismatch:**
- Category: monitoring
- Priority: high
- Triggered when: Expected state doesn't match actual state
- Message: "Stufa dovrebbe essere {expected} ma e {actual}"
- URL: /monitoring

**monitoring_stove_error:**
- Category: monitoring
- Priority: high
- Triggered when: Stove reports an AL error code
- Message: "Errore AL{code}: {description}"
- URL: /monitoring

All three types default enabled with Italian-localized messages matching project language.

### 2. Monitoring Category

Added new "monitoring" category to NOTIFICATION_CATEGORIES:
- Label: "Health Monitoring"
- Description: "Notifiche dal sistema di monitoraggio automatico"
- Icon: 📊
- Master toggle enabled

### 3. Server Helper Function

Created `triggerHealthMonitoringAlertServer()` in notificationTriggersServer.js:
- Accepts: userId, alertType ('connection_lost' | 'state_mismatch' | 'stove_error'), data
- Maps alert type to notification type ID (`monitoring_{alertType}`)
- Delegates to existing triggerNotificationServer infrastructure
- Respects user preferences and Phase 3 filtering

### 4. Health Check Cron Integration

Enhanced `/api/health-monitoring/check` route with notification triggering:

**Logic Flow:**
1. Check health for all users (existing)
2. For each result with critical issue:
   - Check throttle status (shouldSendCoordinationNotification)
   - If throttled: Log and skip (don't send notification)
   - If allowed: Trigger appropriate notification type
   - Record notification sent (recordNotificationSent)
3. Use fire-and-forget pattern (Promise.allSettled, no await)
4. Log summary with alert count

**Alert Triggering Rules:**
- Connection lost: connectionStatus === 'offline' OR 'error'
- State mismatch: stateMismatch.detected === true AND reason !== 'stove_error'
- Stove error: stateMismatch.detected === true AND reason === 'stove_error'

**Throttle Enforcement:**
- Uses existing coordinationNotificationThrottle.js (30-minute global window)
- Check happens BEFORE creating notification promises (efficient)
- One user can't receive multiple health alerts within 30 minutes
- Event logging ALWAYS happens (throttle only affects notifications)

### 5. Unit Tests

Created comprehensive test suite for health notification types:

**Coverage:**
- ✅ Notification type definitions (3 tests)
- ✅ Monitoring category configuration (1 test)
- ✅ Payload building with default messages (1 test)
- ✅ Payload building with custom data (1 test)
- ✅ Payload building with error codes (1 test)

All 7 tests passing.

## Gap Closed

**Before:** Health monitoring detected critical issues (connection lost, state mismatch, stove errors) but didn't notify users. The infrastructure existed but wasn't connected.

**After:** Health monitoring cron triggers push notifications for critical issues with 30-minute deduplication. Users are alerted to problems requiring attention.

**Key Features:**
- ✅ Three targeted notification types (not generic alerts)
- ✅ High priority for all health alerts
- ✅ 30-minute throttle prevents spam
- ✅ Fire-and-forget pattern doesn't block cron
- ✅ Italian-localized messages
- ✅ Respects user preferences
- ✅ Deep links to /monitoring page

## Technical Implementation

### Fire-and-Forget Pattern

```javascript
// Fire-and-forget notifications (don't block response)
if (notificationPromises.length > 0) {
  Promise.allSettled(notificationPromises).then(results => {
    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    console.log(`📬 Health alerts sent: ${sent} success, ${failed} failed`);
  });
}
```

**Benefits:**
- Cron endpoint responds quickly (doesn't wait for notifications)
- Notification failures don't block health checks
- Success/failure logged asynchronously

### Throttle-Before-Send Pattern

```javascript
// Check throttle BEFORE attempting to send
const throttleCheck = shouldSendCoordinationNotification(userId);
if (!throttleCheck.allowed) {
  console.log(`⏱️ Health alert throttled for ${userId} (wait ${throttleCheck.waitSeconds}s)`);
  continue;
}

// If allowed: send notification
notificationPromises.push(
  triggerHealthMonitoringAlertServer(userId, 'connection_lost', {
    message: 'La stufa non risponde (timeout). Verifica la connessione.',
  }).then(() => recordNotificationSent(userId))
);
```

**Benefits:**
- Synchronous throttle check (no async overhead for skipped notifications)
- Clear logging when throttled
- recordNotificationSent called after successful send (starts new window)

### Legacy Type Mapping

Added mapping entries to LEGACY_TYPE_MAPPING for Phase 3 filtering:

```javascript
'monitoring_connection_lost': 'ERROR',
'monitoring_state_mismatch': 'ERROR',
'monitoring_stove_error': 'CRITICAL',
```

This allows notification preferences to filter health alerts by severity level.

## Deviations from Plan

None - plan executed exactly as written.

## Testing

### Unit Tests
- **File:** `__tests__/lib/healthNotifications.test.js`
- **Tests:** 7 passing
- **Coverage:** Notification type definitions, category config, payload building

### Manual Testing Recommendations

1. **Trigger health alerts:**
   - Temporarily disable stove to trigger connection_lost
   - Modify health monitoring logic to force state_mismatch
   - Check notification received with correct message

2. **Verify throttle:**
   - Trigger multiple alerts within 30 minutes
   - Confirm only first alert sends notification
   - Check logs show throttled attempts

3. **Check preferences:**
   - Disable monitoring category in preferences
   - Trigger health alert
   - Confirm notification skipped (check server logs)

## Next Phase Readiness

**Gap Closure Complete:** This plan closes the gap where health monitoring didn't trigger notifications.

**For Phase 10 Continuation:**
- ✅ Health alert types defined and tested
- ✅ Notification triggering integrated in cron
- ✅ Monitoring category ready for preference UI
- ⚠️ Future work: Preference UI for monitoring category (separate plan)

**Known Limitations:**
- Only ADMIN_USER_ID receives health alerts (single-user system)
- Manual testing required (automated testing would need mocked Firebase + cron)
- No preference UI yet (uses default enabled state)

**Operational Setup:**
- Health monitoring cron must be configured (1-min frequency)
- CRON_SECRET must be set in environment
- Firebase Cloud Messaging must be configured
- User must grant notification permission in browser

## Related Documentation

- `lib/notificationTriggers.js` - All notification type definitions
- `lib/notificationTriggersServer.js` - Server-side notification helpers
- `lib/coordinationNotificationThrottle.js` - Global throttle service
- `lib/healthMonitoring.js` - Health check logic
- `app/api/health-monitoring/check/route.js` - Cron endpoint

## Lessons Learned

1. **Reuse existing throttle infrastructure** - Coordination throttle naturally extends to health alerts (both are system events)

2. **Fire-and-forget for async operations in cron** - Notification sending shouldn't block cron response time

3. **Throttle check before promise creation** - Synchronous checks prevent unnecessary async overhead

4. **Italian localization throughout** - All user-facing messages match project language

5. **High priority for all health alerts** - Health issues are critical by nature, all deserve high priority

## Future Enhancements

1. **Preference UI for monitoring category** - Let users customize health alert settings

2. **Per-alert-type throttle** - Connection alerts more frequently than state mismatches

3. **Multi-user support** - When system supports multiple users, send alerts to all registered devices

4. **Rich notifications** - Include action buttons (e.g., "View Details", "Dismiss")

5. **Alert history** - Store health alerts in notification history for review

6. **Escalation logic** - If issue persists, send additional alerts after longer window
