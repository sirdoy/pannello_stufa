# Domain Pitfalls: Netatmo Schedule Management & Stove Monitoring

**Domain:** Thermostat Schedule Management + Appliance Monitoring Integration
**Researched:** 2026-01-26
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Netatmo Rate Limiting - Inconsistent Per-User vs Per-Application Limits

**What goes wrong:**
App hits "Maximum API usage reached" (error code 26) even with minimal requests. Users report "thermostat stopped responding" during normal use. Rate limit violations cause 3-hour API lockouts. The limit behavior changed in early 2026: single-user apps get 500 calls/hour, but apps with 2+ users are subject to shared application limits (much lower per user).

**Why it happens:**
- Using shared OAuth application (like Home Assistant Cloud) instead of personal application
- Polling thermostat status too frequently (every 5s like stove polling)
- Not caching schedule data locally - refetching on every page load
- Multiple API calls per user action (getNick → homesdata → homestatus → setthermpoint = 4 calls)
- Token refresh requests counting against quota (refresh every 3 hours = 8 calls/day minimum)
- Batching not used for multi-room operations (setting 3 rooms = 3 API calls instead of 1)

**How to avoid:**
1. **Use personal application credentials**: Create dedicated Netatmo app per deployment (not shared)
2. **Conservative polling**: Poll thermostat status every 60s minimum (not 5s like stove)
3. **Local caching**: Store schedule data in Firebase, TTL 5 minutes, refresh only on user action
4. **Batch operations**: Use single API call for multi-room setpoint changes
5. **Smart token refresh**: Only refresh when token expires (3 hours), not on every request
6. **Rate limit tracking**: Store API call count in memory, warn at 80% threshold
7. **Exponential backoff**: On 429 error, wait 60s → 120s → 300s before retry

**Warning signs:**
- Error 26 "User Usage exceeded" in API responses
- Netatmo API returns 429 Too Many Requests
- Sudden API failures after adding 2nd user
- API works in development but fails in production (more users)
- Token refresh fails with rate limit error

**Prevention strategy:**
```javascript
// lib/netatmo/rateLimiter.js
const callsPerHour = new Map(); // userId -> {count, resetAt}

export async function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = callsPerHour.get(userId) || {count: 0, resetAt: now + 3600000};

  if (now > userLimit.resetAt) {
    // Reset window
    callsPerHour.set(userId, {count: 1, resetAt: now + 3600000});
    return {allowed: true, remaining: 499};
  }

  if (userLimit.count >= 450) { // 90% of 500 limit
    return {allowed: false, remaining: 0, resetAt: userLimit.resetAt};
  }

  userLimit.count++;
  callsPerHour.set(userId, userLimit);
  return {allowed: true, remaining: 500 - userLimit.count};
}
```

**Phase to address:**
**Phase 1: Netatmo API Foundation** - Implement rate limiter and caching before schedule CRUD
**Phase 2: Schedule Management** - Batch operations, local schedule cache

---

### Pitfall 2: Setpoint Override vs Schedule Modification Confusion

**What goes wrong:**
User intends temporary override when stove turns on, but app permanently modifies the schedule. When stove turns off, temperature doesn't return to original schedule. User's carefully programmed weekly schedule gets corrupted with stove-triggered changes. Schedule editor shows unexpected temperatures that user didn't set.

**Why it happens:**
- Using `switchSchedule` API instead of `setThermpoint` for temporary overrides
- Confusing "change current temperature" (setpoint) with "change schedule" (modify timetable)
- No expiration time on setpoint overrides (endtime parameter missing)
- Stove ON/OFF events trigger schedule modifications instead of mode changes
- Not distinguishing between user manual changes vs automated stove sync changes
- Existing code in `stove-sync/route.js` calls `syncLivingRoomWithStove` without clear setpoint semantics

**How to avoid:**
1. **NEVER modify schedules programmatically**: Only users can modify schedules via UI
2. **Use setThermpoint with endtime**: Set temporary override with explicit expiration
3. **Mode awareness**: Use `setThermmode` with `manual` mode for overrides, not schedule switches
4. **Auto-return to schedule**: Always set endtime parameter (e.g., 2 hours) for temp overrides
5. **Visual indicators**: UI shows "Override active until 18:00" vs "Schedule active"
6. **Clear semantics in code**: Rename `syncLivingRoomWithStove` to `overrideSetpointForStove`
7. **Audit trail**: Log setpoint changes separately from schedule changes

**Warning signs:**
- User reports "my schedule changed by itself"
- Schedule editor shows unexpected temperature values
- Temperature doesn't return to schedule after stove turns off
- Setpoint changes persist across days
- Schedule sync between app and Netatmo thermostat physical device diverges

**Prevention strategy:**
```javascript
// CORRECT - Temporary override
await setThermpoint({
  home_id: homeId,
  room_id: roomId,
  mode: 'manual',
  temp: 16, // Lower temp when stove is on
  endtime: Math.floor(Date.now() / 1000) + 7200 // 2 hours from now
});

// WRONG - Schedule modification
await switchSchedule({schedule_id: newScheduleId}); // DON'T DO THIS FOR STOVE SYNC
```

**Phase to address:**
**Phase 1: Netatmo API Foundation** - Understand setThermpoint vs schedule APIs
**Phase 2: Stove-Thermostat Integration Fix** - Reimplement sync with correct semantics

---

### Pitfall 3: OAuth Token Lifecycle - Refresh Token Invalidation on Rotation

**What goes wrong:**
Netatmo API returns 401 Unauthorized after 3 hours. Token refresh request succeeds but subsequent API calls still fail. App shows "Please reconnect Netatmo" even though user just authenticated. Multiple devices using same account invalidate each other's tokens. Token stored in Firebase becomes stale but app doesn't detect it.

**Why it happens:**
- Netatmo rotates BOTH access_token AND refresh_token on every `/oauth2/token` call
- Old refresh_token is immediately invalidated after successful refresh
- Race condition: Two devices refresh simultaneously, one gets 401 because other invalidated token
- Not storing new refresh_token from refresh response (using old one for next refresh)
- Token refresh logic missing or commented out (like in push notification system initially)
- Firebase update fails silently, leaving stale token in database

**How to avoid:**
1. **Always save new refresh_token**: Update Firebase with BOTH tokens from response
2. **Atomic token refresh**: Use Firebase transaction to prevent race conditions
3. **Single refresh coordinator**: Deduplicate concurrent refresh attempts (in-memory lock)
4. **Detect 401 errors**: Catch "Invalid refresh token" and trigger re-authentication flow
5. **Token metadata**: Store `lastRefreshed`, `expiresAt` timestamps in Firebase
6. **Proactive refresh**: Refresh at 2.5 hours instead of waiting for 3-hour expiration
7. **Reconnect UI flow**: Clear UX when re-authentication required (not just error message)

**Warning signs:**
- 401 errors after exactly 3 hours of use
- Error message: "Invalid refresh token"
- Users report "Netatmo disconnects randomly"
- Multiple "Please reconnect" prompts per day
- Token refresh returns 200 but doesn't actually work

**Prevention strategy:**
```javascript
// lib/netatmo/tokenRefresh.js
const refreshLock = new Map(); // userId -> Promise

export async function refreshNetatmoToken(userId) {
  // Deduplicate concurrent refreshes
  if (refreshLock.has(userId)) {
    return await refreshLock.get(userId);
  }

  const refreshPromise = (async () => {
    try {
      const tokenData = await firebase.get(`netatmo/tokens/${userId}`);

      const response = await fetch('https://api.netatmo.com/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokenData.refresh_token,
          client_id: process.env.NETATMO_CLIENT_ID,
          client_secret: process.env.NETATMO_CLIENT_SECRET,
        }),
      });

      if (!response.ok) {
        // Invalid refresh token - trigger reconnect flow
        await firebase.update(`netatmo/tokens/${userId}`, {
          status: 'reconnect_required',
          errorAt: Date.now(),
        });
        return {reconnectRequired: true};
      }

      const tokens = await response.json();

      // CRITICAL: Store BOTH new tokens atomically
      await firebase.update(`netatmo/tokens/${userId}`, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token, // NEW token, not old one
        lastRefreshed: Date.now(),
        expiresAt: Date.now() + (tokens.expires_in * 1000),
      });

      return {accessToken: tokens.access_token};
    } finally {
      refreshLock.delete(userId);
    }
  })();

  refreshLock.set(userId, refreshPromise);
  return await refreshPromise;
}
```

**Phase to address:**
**Phase 1: Netatmo API Foundation** - Implement robust token lifecycle BEFORE any features

---

### Pitfall 4: Cron Job Silent Failures - No Health Monitoring

**What goes wrong:**
Cron job stops running but no alerts are triggered. Stove monitoring fails silently for hours/days. Developer discovers issue only when user reports "monitoring doesn't work." Cron service (cron-job.org) times out but system doesn't detect it. Webhook receives 500 error but no retry happens.

**Why it happens:**
- No dead man's switch: System doesn't detect cron job NOT running
- Cron job execution not logged in Firebase (no audit trail)
- Timeout errors (>30s) not caught and reported
- External cron service downtime not monitored
- No "last successful run" timestamp in database
- Cron job errors caught but not logged/alerted
- CRON_SECRET validation fails silently (wrong secret = silent skip)

**How to avoid:**
1. **Heartbeat tracking**: Store `lastRunAt` timestamp in Firebase on every execution
2. **Dead man's switch**: Alert if `lastRunAt > 10 minutes ago`
3. **Execution logging**: Log every run with status (success/failure/timeout)
4. **Error reporting**: On cron failure, trigger push notification to admin
5. **Health check endpoint**: `/api/cron/health` returns last run status
6. **Timeout handling**: Set explicit 25s timeout, log if exceeded
7. **Retry logic**: On transient failures (network, rate limit), retry 3x with backoff

**Warning signs:**
- Firebase shows `cronHealth/lastCall` > 10 minutes old
- No entries in cron execution log for extended period
- Stove monitoring alerts not triggering despite known issues
- Users report "monitoring stopped" but no error visible in logs
- Cron-job.org dashboard shows failures but app doesn't know

**Prevention strategy:**
```javascript
// app/api/cron/stove-monitor/route.js
export async function GET(request) {
  const startTime = Date.now();

  try {
    // Verify CRON_SECRET
    const secret = request.nextUrl.searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET) {
      // Log authentication failure
      await firebase.push('cron/errors', {
        type: 'auth_failed',
        timestamp: Date.now(),
        ip: request.headers.get('x-forwarded-for'),
      });
      return Response.json({error: 'Unauthorized'}, {status: 401});
    }

    // Update heartbeat FIRST
    await firebase.update('cronHealth', {
      stoveMonitor: {
        lastRunAt: Date.now(),
        status: 'running',
      }
    });

    // Execute monitoring with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 25000)
    );

    const monitoringResult = await Promise.race([
      performStoveMonitoring(),
      timeoutPromise
    ]);

    // Log successful execution
    await firebase.push('cron/executions', {
      job: 'stove-monitor',
      status: 'success',
      duration: Date.now() - startTime,
      timestamp: Date.now(),
      result: monitoringResult,
    });

    return Response.json({success: true});

  } catch (error) {
    // Log failure
    await firebase.push('cron/executions', {
      job: 'stove-monitor',
      status: 'error',
      error: error.message,
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    });

    // Alert admin via push notification
    await triggerNotification({
      type: 'CRITICAL',
      category: 'system',
      title: 'Cron Job Failed',
      body: `Stove monitoring failed: ${error.message}`,
    });

    return Response.json({error: error.message}, {status: 500});
  }
}

// Separate health check endpoint
export async function GET_health() {
  const health = await firebase.get('cronHealth/stoveMonitor');
  const lastRun = health?.lastRunAt || 0;
  const minutesSinceLastRun = (Date.now() - lastRun) / 60000;

  return Response.json({
    healthy: minutesSinceLastRun < 10,
    lastRunAt: lastRun,
    minutesSinceLastRun: Math.round(minutesSinceLastRun),
  });
}
```

**Phase to address:**
**Phase 3: Stove Monitoring Cron** - Implement health tracking and error reporting
**Phase 4: Monitoring Dashboard** - Visualize cron health and execution history

---

### Pitfall 5: State Synchronization Race Conditions - Stove vs Thermostat

**What goes wrong:**
Stove turns on, triggers Netatmo setpoint override, but stove immediately turns off (maintenance needed), leaving thermostat in overridden state. User manually adjusts thermostat via Netatmo app, but PWA overwrites it 60s later during polling. Two devices (phone + tablet) trigger conflicting thermostat commands simultaneously. Cron job and user manual action race to set setpoint, final state is unpredictable.

**Why it happens:**
- No state locking: Multiple sources can modify thermostat simultaneously
- Polling-based sync: PWA polls stove status, reacts with delay (5-60s lag)
- No conflict resolution: Last-write-wins without considering timestamps
- Stove state changes rapidly (ON → OFF → ON within 2 minutes)
- Not detecting user manual changes on physical thermostat
- No transaction semantics: Read-modify-write pattern without atomicity
- Cron job and user action both call Netatmo API concurrently

**How to avoid:**
1. **Debounce rapid changes**: Wait 2 minutes of stable stove state before syncing
2. **Timestamp-based conflict resolution**: Only apply sync if stove state change is newer
3. **User override priority**: If user manually adjusted thermostat, don't auto-sync for 30 minutes
4. **State machine**: Track sync state (idle → pending → synced → user_override)
5. **Firebase atomic operations**: Use transactions for state updates
6. **Cron coordination**: Lock mechanism prevents concurrent cron + user actions
7. **Detect external changes**: Poll Netatmo homestatus to detect physical thermostat changes

**Warning signs:**
- Thermostat oscillates between temperatures rapidly
- User reports "thermostat ignores my manual changes"
- Firebase shows conflicting state updates within seconds
- Setpoint override doesn't expire as expected
- Temperature jumps unexpectedly after stove state changes

**Prevention strategy:**
```javascript
// lib/stoveThermostatSync.js
const syncState = {
  lastSyncAt: 0,
  lastStoveState: null,
  stoveStateChangedAt: 0,
  userOverrideUntil: 0,
};

export async function syncStoveWithThermostat(currentStoveState) {
  const now = Date.now();

  // Check if user recently overrode (manual change on thermostat)
  if (now < syncState.userOverrideUntil) {
    return {skipped: true, reason: 'user_override_active'};
  }

  // Detect stove state change
  if (currentStoveState !== syncState.lastStoveState) {
    syncState.lastStoveState = currentStoveState;
    syncState.stoveStateChangedAt = now;
    return {skipped: true, reason: 'state_change_debounce'};
  }

  // Wait for stable state (2 minutes)
  const timeSinceChange = now - syncState.stoveStateChangedAt;
  if (timeSinceChange < 120000) {
    return {skipped: true, reason: 'waiting_for_stable_state', waitRemaining: 120000 - timeSinceChange};
  }

  // Check if already synced recently (don't re-sync)
  if (now - syncState.lastSyncAt < 300000) { // 5 minutes
    return {skipped: true, reason: 'recently_synced'};
  }

  // Perform atomic sync with Firebase transaction
  const syncResult = await firebase.transaction('netatmo/syncState', async (state) => {
    // Check if another process already syncing
    if (state?.syncing) {
      return null; // Abort transaction
    }

    // Mark as syncing
    return {
      syncing: true,
      syncStartedAt: now,
      targetState: currentStoveState,
    };
  });

  if (!syncResult.committed) {
    return {skipped: true, reason: 'concurrent_sync_in_progress'};
  }

  try {
    // Execute Netatmo API call
    const result = await setThermpoint({
      room_id: syncConfig.roomId,
      mode: 'manual',
      temp: currentStoveState === 'ON' ? 16 : 19,
      endtime: now + 7200, // 2 hours
    });

    syncState.lastSyncAt = now;

    // Clear syncing flag
    await firebase.update('netatmo/syncState', {
      syncing: false,
      lastSyncedAt: now,
    });

    return {synced: true, result};

  } catch (error) {
    // Clear syncing flag on error
    await firebase.update('netatmo/syncState', {syncing: false});
    throw error;
  }
}

// Detect user manual override
export async function detectUserOverride() {
  const currentSetpoint = await getNetatmoCurrentSetpoint();
  const expectedSetpoint = syncState.lastStoveState === 'ON' ? 16 : 19;

  if (Math.abs(currentSetpoint - expectedSetpoint) > 1) {
    // User changed temperature manually
    syncState.userOverrideUntil = Date.now() + 1800000; // 30 minutes
    return true;
  }
  return false;
}
```

**Phase to address:**
**Phase 2: Stove-Thermostat Integration Fix** - Implement debouncing and conflict resolution
**Phase 3: Stove Monitoring Cron** - Add user override detection

---

### Pitfall 6: Alert Fatigue - Over-Monitoring Without Aggregation

**What goes wrong:**
User receives 50 push notifications in 1 hour: "Stove connection lost", "Stove connection restored", repeat 25 times. Monitoring detects transient network issues and alerts on every poll (every 60s). User disables ALL notifications at OS level due to spam. Critical alerts (fire, CO2) get ignored because user is desensitized. Dashboard shows 1000 "warnings" that are all noise.

**Why it happens:**
- Alert on every anomaly detection without state tracking
- No distinction between transient issues (network blip) vs persistent problems
- Rate limiting from v1.0 push notification system not applied to monitoring alerts
- Alerting for INFO/DEBUG level events (connection retry succeeded)
- No aggregation: 10 identical errors in 10 minutes = 10 separate notifications
- Missing alert deduplication window (send at most once per 30 minutes for same issue)
- Monitoring every metric: temperature, connection, fan, power, errors all trigger alerts

**How to avoid:**
1. **Alert deduplication**: Same alert type → max 1 notification per 30 minutes
2. **Severity-based alerting**: Only CRITICAL and ERROR levels trigger notifications by default
3. **Transient vs persistent**: Only alert if issue persists for 3+ consecutive checks
4. **Alert aggregation**: Batch multiple related issues into single notification
5. **Smart rate limiting**: Different limits per alert category (errors: 5/hour, warnings: 1/hour)
6. **Monitoring dashboard**: Surface INFO/WARNING in UI, not via push notifications
7. **Escalation ladder**: First occurrence → dashboard only, 3+ occurrences → notification

**Warning signs:**
- User notification count > 20/day per device
- High notification dismiss rate without engagement
- User disables notifications at OS level (can't detect in app)
- Support complaints: "Too many alerts"
- Firebase shows same alert type repeated every minute

**Prevention strategy:**
```javascript
// lib/monitoring/alertManager.js
const alertState = new Map(); // alertKey -> {lastSentAt, occurrences, firstSeenAt}

export async function evaluateAlert(alert) {
  const alertKey = `${alert.type}:${alert.device}:${alert.errorCode || 'general'}`;
  const now = Date.now();
  const state = alertState.get(alertKey) || {
    lastSentAt: 0,
    occurrences: 0,
    firstSeenAt: now,
  };

  // Increment occurrence counter
  state.occurrences++;
  state.lastSeenAt = now;
  alertState.set(alertKey, state);

  // Transient issue filter: Only alert if persists 3+ checks
  if (state.occurrences < 3) {
    return {shouldAlert: false, reason: 'waiting_for_persistence'};
  }

  // Deduplication window: Max 1 notification per 30 minutes
  const timeSinceLastAlert = now - state.lastSentAt;
  if (timeSinceLastAlert < 1800000) {
    return {shouldAlert: false, reason: 'deduplication_window', nextAlertIn: 1800000 - timeSinceLastAlert};
  }

  // Severity-based rate limiting
  const rateLimit = getRateLimitForSeverity(alert.severity);
  const recentAlerts = await getRecentAlerts(alert.severity, rateLimit.window);
  if (recentAlerts.length >= rateLimit.max) {
    return {shouldAlert: false, reason: 'rate_limit_exceeded'};
  }

  // Check user preferences (respect DND, severity filters)
  const userPrefs = await getUserNotificationPreferences(alert.userId);
  if (!shouldNotifyBasedOnPreferences(alert, userPrefs)) {
    return {shouldAlert: false, reason: 'user_preferences'};
  }

  // Alert approved - send notification
  state.lastSentAt = now;
  alertState.set(alertKey, state);

  // Aggregate message if multiple occurrences
  const message = state.occurrences > 3
    ? `${alert.message} (${state.occurrences} times in ${Math.round((now - state.firstSeenAt) / 60000)} minutes)`
    : alert.message;

  return {
    shouldAlert: true,
    message,
    metadata: {
      occurrences: state.occurrences,
      firstSeenAt: state.firstSeenAt,
      duration: now - state.firstSeenAt,
    },
  };
}

function getRateLimitForSeverity(severity) {
  switch (severity) {
    case 'CRITICAL': return {max: 10, window: 3600000}; // 10/hour
    case 'ERROR': return {max: 5, window: 3600000}; // 5/hour
    case 'WARNING': return {max: 1, window: 3600000}; // 1/hour
    case 'INFO': return {max: 0, window: 0}; // No notifications
    default: return {max: 0, window: 0};
  }
}

// Clear alert state when issue resolved
export function clearAlertState(alertKey) {
  alertState.delete(alertKey);
}
```

**Phase to address:**
**Phase 3: Stove Monitoring Cron** - Implement alert evaluation and deduplication
**Phase 4: Monitoring Dashboard** - Surface INFO/WARNING in UI without notifications

---

## Moderate Pitfalls

### Pitfall 7: Schedule CRUD Without Validation - Corrupt Schedule Data

**What goes wrong:**
User creates schedule with overlapping time slots (06:00-08:00 and 07:00-09:00 both set). Schedule saved successfully but Netatmo API rejects it on activation. Schedule deleted but was the "active" schedule, leaving system in broken state. Temperature values outside valid range (10-30°C) saved to Firebase. Schedule has no slots for certain days of week (missing Sunday).

**Prevention:**
- Validate schedule before saving: No overlaps, 7 days covered, temps 10-30°C
- Prevent deletion of active schedule (must switch to another first)
- Validate against Netatmo API schema before Firebase save
- UI validation + server-side validation (defense in depth)

**Phase to address:**
**Phase 2: Schedule Management** - Comprehensive validation in schedule CRUD

---

### Pitfall 8: Polling Frequency Trade-offs - Battery vs Responsiveness

**What goes wrong:**
Polling Netatmo every 5s like stove causes rate limit violations and drains mobile battery. Polling every 5 minutes feels laggy (user changes temp, app doesn't update for 5 minutes). WebSocket/SSE not supported by Netatmo API, forcing polling. PWA in background on iOS stops polling silently.

**Prevention:**
- Adaptive polling: 60s when app in foreground, 5 minutes in background
- User-action triggered refresh: Manual change → immediate refresh
- Smart polling: Only poll if user viewing thermostat page (not on homepage)
- Local optimistic updates: Update UI immediately, reconcile with API response

**Phase to address:**
**Phase 1: Netatmo API Foundation** - Implement adaptive polling strategy

---

### Pitfall 9: Multi-Room Coordination - Partial Failures

**What goes wrong:**
User enables stove sync for 3 rooms (Living Room, Kitchen, Bedroom). API call to set Living Room succeeds, Kitchen fails (rate limit), Bedroom not attempted. System state is inconsistent: some rooms synced, others not. User doesn't know which rooms are synced.

**Prevention:**
- Batch API calls with rollback on partial failure
- Track per-room sync status in Firebase
- UI shows sync status per room (synced, failed, pending)
- Retry failed rooms automatically

**Phase to address:**
**Phase 2: Stove-Thermostat Integration Fix** - Implement robust multi-room handling

---

### Pitfall 10: Environment Variable Confusion - Dev vs Prod Credentials

**What goes wrong:**
Developer uses production Netatmo credentials in localhost development. Localhost callback URL (http://localhost:3000/api/netatmo/callback) doesn't match production whitelist, OAuth fails. Production deployment uses `NETATMO_CLIENT_ID_DEV` instead of `NETATMO_CLIENT_ID`. Firebase paths mixed: dev code writes to production `/netatmo/` path.

**Prevention:**
- Use `*_DEV` env vars for localhost (already partially implemented)
- Separate Firebase paths: `dev/netatmo/` vs `netatmo/` (existing pattern)
- Validate redirect URI matches env in callback handler
- Clear documentation of which env vars needed in which environments

**Phase to address:**
**Phase 1: Netatmo API Foundation** - Document and validate environment setup

---

## "Looks Done But Isn't" Checklist

- [ ] **Rate limiting implemented**: Often missing request counting and throttling
- [ ] **Token refresh working**: Often implemented but doesn't save new refresh_token
- [ ] **Setpoint vs schedule distinction**: Often confused, leading to schedule corruption
- [ ] **Cron health monitoring**: Often missing dead man's switch and error reporting
- [ ] **Alert deduplication**: Often missing, causing notification spam
- [ ] **Multi-room atomicity**: Often partial failure handling missing
- [ ] **State synchronization**: Often race conditions between cron and user actions
- [ ] **Schedule validation**: Often client-side only, no server-side checks
- [ ] **User override detection**: Often missing, auto-sync fights user changes
- [ ] **Adaptive polling**: Often fixed polling rate regardless of app state
- [ ] **Error recovery**: Often fails permanently instead of retry with backoff
- [ ] **Environment separation**: Often dev and prod credentials mixed

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Netatmo OAuth | Not saving new refresh_token after refresh | Always update both access + refresh tokens |
| Schedule API | Using `switchSchedule` for temp overrides | Use `setThermpoint` with `endtime` parameter |
| Rate Limiting | Counting only explicit API calls | Include token refreshes, redirects in quota |
| Cron Monitoring | Only logging errors | Log every execution + dead man's switch |
| Stove-Thermostat Sync | Immediate sync on state change | Debounce 2 minutes for stable state |
| Multi-Device | Last-write-wins | Timestamp-based conflict resolution |
| Alert System | Alert on every anomaly | Require 3+ consecutive failures |
| Polling | Fixed rate polling | Adaptive: 60s foreground, 5min background |
| Schedule CRUD | Client validation only | Client + server validation |
| Firebase Paths | Mixing dev/prod paths | Use `dev/` prefix for development |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Over-polling Netatmo | Rate limit errors, battery drain | Poll 60s foreground, 5min background | >500 requests/hour |
| No schedule caching | Slow page loads, quota waste | Cache 5 minutes, refresh on user action | Every page load fetches |
| Unbatched multi-room ops | API quota exhaustion | Use batch endpoints when available | >3 rooms configured |
| Synchronous cron execution | Timeout errors (>30s) | Background processing with timeouts | Complex monitoring logic |
| No request deduplication | Duplicate API calls | Debounce user actions, dedupe cron | User clicks rapidly |
| Full schedule on every poll | Large payload, slow parsing | Delta updates or cached schedules | Schedule has >50 time slots |
| Alert storm | Database write quota exhaustion | Deduplication + rate limiting | >100 alerts/hour |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| CRON_SECRET not validated | Unauthorized monitoring execution | HMAC validation with timing-safe comparison |
| Netatmo client secret in client bundle | API credential leak | Server-side only, never expose to client |
| No CSRF protection on OAuth callback | Account takeover | Validate state parameter in callback |
| Firebase rules allow unauthenticated access | Data leak, unauthorized control | Require Auth0 authentication for all paths |
| Schedule data not validated server-side | Injection attacks, corrupt data | Zod validation on all schedule operations |
| Logging sensitive data (access tokens) | Token leak via logs | Never log full tokens, use last 4 chars only |

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Rate Limit Exceeded | LOW | Wait 1 hour, implement rate limiter for future |
| Invalid Refresh Token | MEDIUM | User must re-authenticate via OAuth flow |
| Corrupted Schedule | MEDIUM | Restore from backup or recreate manually |
| Cron Health Monitoring Missing | LOW | Add dead man's switch, retroactively analyze logs |
| Alert Fatigue | HIGH | Cannot recover - user disabled notifications at OS level |
| Schedule Modified Instead of Override | MEDIUM | Restore schedule from backup or user must re-program |
| Multi-Room Partial Failure | LOW | Retry failed rooms automatically |
| Token Rotation Race Condition | MEDIUM | Implement atomic token updates with transactions |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Netatmo Rate Limiting | Phase 1: API Foundation | Track call count, verify <450/hour per user |
| Setpoint vs Schedule Confusion | Phase 2: Integration Fix | Verify schedules unchanged after stove sync |
| OAuth Token Invalidation | Phase 1: API Foundation | Token refresh works after 3 hours |
| Cron Silent Failures | Phase 3: Monitoring Cron | Dead man's switch triggers if no run for 10min |
| State Sync Race Conditions | Phase 2: Integration Fix | No conflicting updates in Firebase logs |
| Alert Fatigue | Phase 3: Monitoring Cron | Max 5 notifications/hour during testing |
| Schedule Validation Missing | Phase 2: Schedule Management | Invalid schedules rejected server-side |
| Polling Frequency Issues | Phase 1: API Foundation | Battery drain acceptable, updates responsive |
| Multi-Room Partial Failures | Phase 2: Integration Fix | All rooms sync or none (atomicity) |
| Environment Variable Confusion | Phase 1: API Foundation | Dev uses dev credentials, prod uses prod |

## Sources

### Official Documentation (HIGH Confidence)
- [Netatmo Connect Energy API Documentation](https://dev.netatmo.com/apidocumentation/energy)
- [Netatmo setthermpoint API](https://dev.netatmo.com/en-US/doc/methods/setthermpoint)
- [Netatmo switchSchedule API](https://dev.netatmo.com/en-US/resources/technical/reference/thermostat/switchschedule)

### Technical Issues & Discussions (MEDIUM Confidence)
- [Inconsistent Rate Limits for Netatmo Home + Control API](https://helpcenter.netatmo.com/hc/en-us/community/posts/29846852785298-Inconsistent-Rate-Limits-for-Netatmo-Home-Control-API)
- [Getting error 26 "User Usage exceeded"](https://helpcenter.netatmo.com/hc/en-us/community/posts/19767427948434-Getting-error-26-User-Usage-exceeded-for-a-few-hours-now)
- [Netatmo error Maximum api usage reached · Issue #158845](https://github.com/home-assistant/core/issues/158845)
- [API token invalid after 3 hours despite refresh](https://helpcenter.netatmo.com/hc/en-us/community/posts/19506310228242-API-token-invalid-after-3-hours-despite-refresh)
- [Rate limits with Netatmo Weather Station](https://community.home-assistant.io/t/rate-limits-with-netatmo-weather-station/188680)

### Cron Job Monitoring (HIGH Confidence)
- [How to Monitor Cron Jobs in 2026: A Complete Guide](https://dev.to/cronmonitor/how-to-monitor-cron-jobs-in-2026-a-complete-guide-28g9)
- [10 Best Cron Job Monitoring Tools in 2026](https://betterstack.com/community/comparisons/cronjob-monitoring-tools/)
- [Cron Job Monitoring: Never Miss a Failed Background Task](https://web-alert.io/blog/cron-job-monitoring-background-tasks)
- [Our complete cron job guide for 2026](https://uptimerobot.com/knowledge-hub/cron-monitoring/cron-job-guide/)

### Thermostat Best Practices (MEDIUM Confidence)
- [Setpoints, Intelligent Recovery, and More—Your Thermostat, Decoded](https://www.davidenergy.com/blog/fb-your-thermostat-decoded)
- [How To Temporarily Override Schedules Using Thermostat Setpoints](https://support.asairhome.com/hc/en-us/articles/360055408392-How-To-Temporarily-Override-Schedules-Using-Thermostat-Setpoints)
- [Programmable Thermostats | Department of Energy](https://www.energy.gov/energysaver/programmable-thermostats)

### Smart Home Alert Fatigue (MEDIUM Confidence)
- [How to Reduce Temperature Alarm Fatigue in 2026: 8 Proven Strategies](https://envigilance.com/temperature-monitoring/alarm-fatigue/)
- [Smart Home Trends to Look for in 2026](https://smarthomewizards.com/smart-home-trends-to-look-for/)

### Distributed Systems State Synchronization (MEDIUM Confidence)
- [The Art of Staying in Sync: How Distributed Systems Avoid Race Conditions](https://medium.com/@alexglushenkov/the-art-of-staying-in-sync-how-distributed-systems-avoid-race-conditions-f59b58817e02)
- [Top 7 Practices for Real-Time Data Synchronization](https://www.serverion.com/uncategorized/top-7-practices-for-real-time-data-synchronization/)

### Known Patterns from Project Code (HIGH Confidence)
- Existing stove-sync implementation in `app/api/netatmo/stove-sync/route.js`
- Rate limiting pattern from v1.0 push notification system
- CRON_SECRET validation pattern from existing cron jobs
- Firebase transaction patterns from existing codebase
- Environment detection pattern (`*_DEV` vars for localhost)

---

**Pitfalls research for:** Netatmo Schedule Management & Stove Monitoring Integration
**Researched:** 2026-01-26
**Confidence:** HIGH (Netatmo API patterns verified with official docs, cron monitoring validated with 2026 tooling guides)
**Next step:** Use these pitfalls to inform roadmap phase structure, validation criteria, and success metrics
