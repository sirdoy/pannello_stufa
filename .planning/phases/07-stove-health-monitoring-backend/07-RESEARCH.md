# Phase 7: Stove Health Monitoring Backend - Research

**Researched:** 2026-01-27
**Domain:** Cron job monitoring, stove state detection, Firestore event logging
**Confidence:** HIGH

## Summary

Phase 7 implements automated stove health monitoring via cron job that runs every minute to check stove connection status, detect unexpected states by comparing against stove schedules and Netatmo heating demand, and log all monitoring events to Firestore. The system follows established v1.0 patterns: HMAC-secured cron webhook (like existing `/api/scheduler/check`), Firestore for event logging (like existing notification logs), and Firebase RTDB for dead man's switch tracking (like existing `cronHealth/lastCall`).

The research confirms that all required infrastructure already exists in the codebase. No new npm dependencies needed. The implementation extends proven patterns rather than inventing new ones.

**Primary recommendation:** Follow existing cron + Firestore + RTDB patterns. Reuse stoveApi.js for status checks, netatmoApi.js for heating demand verification, and existing Firestore logging infrastructure. Implement as new `/api/health-monitoring/check` cron endpoint following `withCronSecret` middleware pattern.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Firebase Admin SDK | ^13.1.0 (installed) | Firestore writes + RTDB reads | Already integrated for notifications, bypasses security rules |
| firebase/firestore | ^11.1.0 (installed) | Event logging with timestamps | Already used for notificationLogs collection |
| firebase/database | ^11.1.0 (installed) | Dead man's switch tracking | Already used for cronHealth/lastCall |
| lib/stoveApi.js | project code | Stove status checking | Existing API with timeout/retry logic |
| lib/netatmoApi.js | project code | Heating demand verification | OAuth 2.0 + rate limiting built-in |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lib/core/middleware.js | project code | `withCronSecret` wrapper | Secure cron endpoints (query + header support) |
| lib/firebaseAdmin.js | project code | `adminDbGet/adminDbSet` helpers | RTDB operations bypassing security rules |
| lib/notificationLogger.js | project code | Firestore logging patterns | Reference for event logging structure |
| lib/rateLimiter.js | project code | In-memory Map pattern | Reference for retry strategy |
| date-fns | ^4.1.0 (installed) | Timestamp manipulation | Already used in notificationLogger |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Firestore | RTDB | Firestore better for structured logs with querying; RTDB for simple key-value (dead man's switch timestamp) |
| In-memory retry | Redis | Redis overkill for single-instance deployment (v1.0 decision) |
| Cron webhook | Scheduled Cloud Function | Webhook more flexible, works with any cron service |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
app/api/health-monitoring/
├── check/                     # Main cron endpoint
│   └── route.js              # GET with withCronSecret
lib/
├── healthMonitoring.js       # Core health check logic
├── healthLogger.js           # Firestore event logging
└── healthDeadManSwitch.js    # Dead man's switch logic
```

### Pattern 1: Cron Endpoint with HMAC Security
**What:** Protected webhook endpoint called by external cron service
**When to use:** Any automated background task requiring authentication without user session
**Example:**
```javascript
// app/api/health-monitoring/check/route.js
import { withCronSecret, success } from '@/lib/core';

export const dynamic = 'force-dynamic';

export const GET = withCronSecret(async (request) => {
  // 1. Save dead man's switch timestamp FIRST (before any logic)
  await adminDbSet('healthMonitoring/lastCheck', new Date().toISOString());

  // 2. Fetch all users (future: multi-user, for now ADMIN_USER_ID only)
  const users = [process.env.ADMIN_USER_ID];

  // 3. Check each user's stove health
  const results = await Promise.allSettled(
    users.map(userId => checkUserStoveHealth(userId))
  );

  // 4. Log aggregated results to Firestore
  await logHealthCheckEvent(results);

  return success({ checked: results.length, timestamp: Date.now() });
}, 'HealthMonitoring/Check');
```

### Pattern 2: Parallel Status Fetching with Graceful Degradation
**What:** Fetch multiple status sources concurrently, handle individual failures gracefully
**When to use:** Health checks that aggregate data from multiple APIs (stove + Netatmo)
**Example:**
```javascript
// lib/healthMonitoring.js
async function checkUserStoveHealth(userId) {
  // Fetch stove status + schedule + Netatmo demand in parallel
  const [stoveResult, scheduleResult, netatmoResult] = await Promise.allSettled([
    getStoveStatus().catch(err => ({ error: err.message })),
    getCurrentSchedule(userId).catch(() => null),
    getNetatmoHeatingDemand().catch(() => null),
  ]);

  // Determine health status even with partial data
  const health = {
    userId,
    timestamp: Date.now(),
    stoveStatus: stoveResult.status === 'fulfilled' ? stoveResult.value : null,
    stoveError: stoveResult.status === 'rejected' ? stoveResult.reason : null,
    expectedState: scheduleResult.status === 'fulfilled' ? scheduleResult.value : null,
    netatmoDemand: netatmoResult.status === 'fulfilled' ? netatmoResult.value : null,
    connectionStatus: determineConnectionStatus(stoveResult),
    stateMismatch: detectStateMismatch(stoveResult, scheduleResult, netatmoResult),
  };

  return health;
}
```

### Pattern 3: Firestore Event Logging with Subcollections
**What:** Single parent document per cron run with individual user checks as subcollection
**When to use:** Logging related events that need both aggregation and detail queries
**Example:**
```javascript
// lib/healthLogger.js
import { getAdminFirestore } from './firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

async function logHealthCheckEvent(results) {
  const db = getAdminFirestore();

  // Parent document: aggregated cron run data
  const runDoc = await db.collection('healthMonitoring').add({
    timestamp: Timestamp.now(),
    checkedCount: results.length,
    successCount: results.filter(r => r.status === 'fulfilled').length,
    failureCount: results.filter(r => r.status === 'rejected').length,
    duration: Date.now() - startTime, // track execution time
  });

  // Subcollection: individual user check results
  const batch = db.batch();
  results.forEach((result, idx) => {
    const checkDoc = runDoc.collection('checks').doc();
    batch.set(checkDoc, {
      userId: users[idx],
      status: result.status,
      stoveStatus: result.value?.stoveStatus || null,
      expectedState: result.value?.expectedState || null,
      stateMismatch: result.value?.stateMismatch || false,
      error: result.status === 'rejected' ? result.reason : null,
    });
  });
  await batch.commit();

  console.log(`✅ Logged health check run: ${runDoc.id}`);
  return runDoc.id;
}
```

### Pattern 4: Dead Man's Switch with Fallback Check
**What:** Track last successful execution, alert if threshold exceeded, verify system truly down
**When to use:** Monitoring critical background jobs that must run reliably
**Example:**
```javascript
// lib/healthDeadManSwitch.js
async function checkDeadManSwitch() {
  const lastCheck = await adminDbGet('healthMonitoring/lastCheck');

  if (!lastCheck) {
    await alertAdmin('Dead man switch: No health check recorded');
    return;
  }

  const elapsed = Date.now() - new Date(lastCheck).getTime();
  const THRESHOLD = 10 * 60 * 1000; // 10 minutes

  if (elapsed > THRESHOLD) {
    // Attempt fallback check to confirm system truly down
    try {
      const fallbackResult = await checkUserStoveHealth(process.env.ADMIN_USER_ID);

      if (fallbackResult) {
        // System works but cron not running
        await alertAdmin('Dead man switch: Cron service not executing');
      }
    } catch (error) {
      // System completely down
      await alertAdmin('Dead man switch: System unresponsive');
    }
  }
}
```

### Anti-Patterns to Avoid
- **Logging every poll in RTDB:** RTDB for timestamps only, Firestore for structured logs (RTDB not designed for querying)
- **Synchronous sequential checks:** Always use Promise.allSettled for parallel fetching (faster, handles partial failures)
- **Throwing on partial failure:** Health checks should degrade gracefully (log failures, continue processing)
- **Rate limiting health checks:** Health monitoring is critical - exempt from user rate limits (use separate limit if needed)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cron authentication | Custom token system | `withCronSecret` middleware | Already handles query param + Authorization header, tested |
| Firestore timestamp handling | Manual Date conversion | `Timestamp.now()` from firebase-admin | Handles timezone + precision correctly |
| Stove status checking | New API wrapper | `lib/stoveApi.js` | Built-in timeout/retry, sandbox mode support |
| Notification sending | Direct FCM calls | `lib/notificationTriggersServer.js` | Handles preferences, rate limits, DND automatically |
| Environment path handling | Manual dev/prod logic | `getEnvironmentPath()` | Already prefixes 'dev/' in localhost |
| State detection | Manual status parsing | Existing status constants | v1.0 uses `status.includes('WORK')` pattern |

**Key insight:** v1.0 already solved every technical challenge Phase 7 needs. Implementation is composition, not invention.

## Common Pitfalls

### Pitfall 1: Blocking Cron on Firestore Write Failure
**What goes wrong:** Cron handler throws if Firestore logging fails, prevents dead man's switch update
**Why it happens:** Natural instinct to throw on errors, but logging is non-critical
**How to avoid:** Wrap Firestore writes in try-catch, log errors but don't throw (fire-and-forget pattern)
**Warning signs:** Cron stops updating lastCheck timestamp when Firestore has transient issues

### Pitfall 2: Confusing RTDB vs Firestore Use Cases
**What goes wrong:** Using RTDB for structured logs or Firestore for simple timestamps
**Why it happens:** Both are Firebase databases, unclear which to use when
**How to avoid:**
  - RTDB: Simple key-value, realtime listeners needed (cronHealth/lastCall, maintenance hours)
  - Firestore: Structured data, complex queries, long retention (notification logs, health events)
**Warning signs:** Trying to query RTDB with filters, or setting up Firestore listeners for single values

### Pitfall 3: Not Handling Transition States
**What goes wrong:** Flagging stove as "mismatch" when it's in START state transitioning to WORK
**Why it happens:** Binary thinking (ON/OFF) ignores intermediate states
**How to avoid:** Define state categories:
  - ON: WORK, MODULATION
  - STARTING: START (allow 10-15 min grace period)
  - OFF: STANDBY, SHUTDOWN, FINALIZZAZIONE
  - ERROR: Status contains error code
**Warning signs:** False alerts during normal stove startup

### Pitfall 4: Single Point of Failure in Promise.all
**What goes wrong:** One API failure crashes entire health check
**Why it happens:** Using Promise.all instead of Promise.allSettled
**How to avoid:** Always use Promise.allSettled for parallel operations that should tolerate partial failures
**Warning signs:** Health check fails completely when only Netatmo API is down

### Pitfall 5: Timezone Handling in Timestamp Comparisons
**What goes wrong:** Dead man's switch triggers incorrectly due to timezone mismatch
**Why it happens:** Mixing ISO strings, epoch milliseconds, and Date objects without consistent timezone
**How to avoid:**
  - Always store ISO UTC strings in database
  - Always convert to epoch milliseconds for arithmetic
  - Use getEnvironmentPath() for dev/prod separation
**Warning signs:** Dead man's switch fires at wrong times, or never fires

## Code Examples

Verified patterns from existing codebase:

### Cron Secret Authentication (Both Methods)
```javascript
// Source: lib/core/middleware.js:193-214
export function withCronSecret(handler, logContext = null) {
  return withErrorHandler(async (request, context) => {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return unauthorized('CRON_SECRET non configurato');
    }

    // Support both query param and header
    const querySecret = request.nextUrl?.searchParams?.get('secret');
    const authHeader = request.headers.get('authorization');
    const headerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const isValid = querySecret === cronSecret || headerSecret === cronSecret;

    if (!isValid) {
      return unauthorized('Token cron non valido');
    }

    return handler(request, context);
  }, logContext);
}
```

### Firestore Event Logging with Timestamp
```javascript
// Source: lib/notificationLogger.js:45-73
import { getAdminFirestore } from './firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

export async function logNotification(data) {
  try {
    const db = getAdminFirestore();

    const logEntry = {
      timestamp: Timestamp.now(),
      type: data.type || 'generic',
      status: data.status || (data.successCount > 0 ? 'sent' : 'failed'),
      userId: data.userId || 'unknown',
      deviceCount: data.deviceCount || 0,
      successCount: data.successCount || 0,
      failureCount: data.failureCount || 0,
      title: data.title || '',
      body: data.body ? data.body.substring(0, 200) : '',
      fcmErrors: data.fcmErrors || [],
      metadata: data.metadata || {},
    };

    const docRef = await db.collection('notificationLogs').add(logEntry);
    console.log(`📝 Logged notification: ${logEntry.type} (${docRef.id})`);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error logging notification:', error);
    // Don't throw - logging failures shouldn't break notification flow
    return null;
  }
}
```

### RTDB Operations with Admin SDK
```javascript
// Source: lib/firebaseAdmin.js:94-108
export async function adminDbGet(path) {
  const db = getAdminDatabase();
  const snapshot = await db.ref(path).once('value');
  return snapshot.val();
}

export async function adminDbSet(path, data) {
  const db = getAdminDatabase();
  await db.ref(path).set(data);
}
```

### Parallel API Fetching with Graceful Degradation
```javascript
// Source: app/api/scheduler/check/route.js:278-328
async function fetchStoveData() {
  let currentStatus = 'unknown';
  let isOn = false;
  let statusFetchFailed = false;

  try {
    const [statusData, fanData, powerData] = await Promise.all([
      getStoveStatus().catch(err => {
        console.error('❌ Status fetch failed:', err.message);
        return null;
      }),
      getFanLevel().catch(err => {
        console.error('❌ Fan fetch failed:', err.message);
        return null;
      }),
      getPowerLevel().catch(err => {
        console.error('❌ Power fetch failed:', err.message);
        return null;
      })
    ]);

    if (statusData) {
      currentStatus = statusData.StatusDescription || 'unknown';
      isOn = currentStatus.includes('WORK') || currentStatus.includes('START');
    } else {
      console.warn('⚠️ Status unavailable - will skip state-changing actions');
      statusFetchFailed = true;
    }

    // Continue with defaults for fan/power if unavailable

  } catch (error) {
    console.error('❌ Critical error fetching stove data:', error.message);
    statusFetchFailed = true;
  }

  return { currentStatus, isOn, statusFetchFailed };
}
```

### Stove Status Checking with Timeout/Retry
```javascript
// Source: lib/stoveApi.js:151-184
export async function getStoveStatus() {
  // Sandbox check omitted for brevity

  // Real API call with retry
  const response = await fetchWithRetry(STUFA_API.getStatus);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return { ...data, isSandbox: false };
}

// fetchWithRetry defined in same file:
// - 20 second timeout per attempt
// - 2 retries (3 total attempts)
// - Only retries on timeout, not other errors
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual cron monitoring | Dead man's switch pattern | 2025 (healthchecks.io popularized) | Self-healing: system detects own failures |
| RTDB for all logs | Firestore for structured events | 2024 (Firebase best practices) | Complex queries + 7-day retention easier |
| Sequential API calls | Promise.allSettled parallel | Node.js 12+ (2019) | Faster health checks, handles partial failures |
| Hardcoded timestamps | Timestamp.now() from admin SDK | Firebase Admin SDK v9+ | Timezone-safe, server clock independent |
| Single cron endpoint | Separate endpoints per job | Microservices pattern | Independent scaling, clearer monitoring |

**Deprecated/outdated:**
- Firebase Admin SDK v8 namespace imports: Use v9+ modular imports (`firebase-admin/app`, `firebase-admin/firestore`)
- RTDB for queryable logs: Use Firestore collections instead (RTDB not designed for filtering)
- Promise.all for health checks: Use Promise.allSettled (available since Node 12.9)

## Open Questions

Things that couldn't be fully resolved:

1. **Multi-user health check strategy**
   - What we know: v1.0 has single admin user (ADMIN_USER_ID), Phase 7 checks all users
   - What's unclear: How to identify "all users" - enumerate Firebase RTDB users/ path? Firestore users collection? Hardcoded list?
   - Recommendation: Start with single admin user array `[process.env.ADMIN_USER_ID]`, add multi-user support when user management implemented

2. **Optimal retry strategy for individual user check failures**
   - What we know: Existing scheduler/check skips failed operations, continues to next
   - What's unclear: Should health monitoring retry failed user checks within same cron run, or just log failure and move on?
   - Recommendation: No retry within cron run (keep cron fast), log failures, let next cron run retry naturally

3. **Dead man's switch trigger mechanism**
   - What we know: Threshold is 10+ minutes, should alert admin
   - What's unclear: Is dead man's switch checked by separate cron job? Client-side banner? Manual admin dashboard check?
   - Recommendation: Piggyback on existing CronHealthBanner component (already monitors cronHealth/lastCall every 30s) - extend to also check healthMonitoring/lastCheck

## Sources

### Primary (HIGH confidence)
- Existing codebase: app/api/scheduler/check/route.js (cron pattern), lib/core/middleware.js (withCronSecret), lib/notificationLogger.js (Firestore logging), lib/firebaseAdmin.js (Admin SDK helpers)
- Firebase Admin SDK documentation (official): firestore.Timestamp, database operations
- Project context: 07-CONTEXT.md decisions on check frequency, logging detail, dead man's switch behavior

### Secondary (MEDIUM confidence)
- [Healthchecks.io Documentation](https://healthchecks.io/docs/) - Dead man's switch pattern for cron monitoring (verified active 2026)
- [Dead Man's Snitch](https://deadmanssnitch.com/docs/monitor/cron-jobs) - Cron job monitoring service patterns
- [How to build an Event Logging System with Firebase and Google Cloud Firestore](https://medium.com/firebase-developers/how-to-build-an-event-logging-system-with-firebase-and-google-cloud-firestore-8a1a457c1522) - Firestore logging patterns

### Tertiary (LOW confidence)
- [Better Stack: 10 Best Cron Job Monitoring Tools in 2026](https://betterstack.com/community/comparisons/cronjob-monitoring-tools/) - Current landscape overview
- Web search results on stove monitoring systems - Consumer products (iGuardFire, Safera) use similar patterns (status polling, state detection, alerts)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed, patterns proven in v1.0
- Architecture: HIGH - Direct mapping to existing scheduler/check route, notification logging, maintenance tracking
- Pitfalls: HIGH - Derived from existing codebase issues (Promise.all vs allSettled, RTDB vs Firestore confusion evident in docs)

**Research date:** 2026-01-27
**Valid until:** 60 days (stack stable, Firebase patterns mature, no fast-moving dependencies)
