# Architecture Research: Netatmo Schedule Management & Stove Monitoring

**Domain:** Smart home PWA with thermostat control and IoT monitoring
**Researched:** 2026-01-26
**Confidence:** HIGH

---

## Integration Context

**Existing Architecture (v1.0):**
- Next.js 15.5 App Router (Server Components + API Routes)
- Firebase Realtime Database (device state, tokens, scheduler)
- Firestore (notification history)
- Service Worker (Serwist - offline capability)
- Repository Pattern (services abstract data access)
- Vercel deployment (serverless functions)

**v2.0 Additions:**
- Netatmo schedule CRUD operations (API integration)
- Stove health monitoring (cron-based)
- Thermostat-stove coordination (setpoint override, not schedule modification)
- Alert generation (reuses v1.0 notification system)

---

## Recommended Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────────┐  ┌─────────────┐            │
│  │ StoveCard  │  │ ThermostatCard │  │ AlertBanner │            │
│  │ (polling)  │  │ (polling)      │  │ (polling)   │            │
│  └─────┬──────┘  └────────┬───────┘  └──────┬──────┘            │
│        │ 5s               │ 30s             │ 60s               │
├────────┴──────────────────┴─────────────────┴───────────────────┤
│                      API ROUTES LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  /api/stove/*          /api/netatmo/*        /api/scheduler/*   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │ Status       │      │ HomeStatus   │      │ Check (cron) │  │
│  │ Ignite       │      │ Schedules    │      │ Update       │  │
│  │ Shutdown     │      │ SetThermPoint│      └──────┬───────┘  │
│  └──────┬───────┘      └──────┬───────┘             │          │
│         │                     │                     │          │
├─────────┴─────────────────────┴─────────────────────┴──────────┤
│                      SERVICE LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ StoveAPI         │  │ NetatmoAPI       │  │ MonitorSvc   │  │
│  │ - getStatus()    │  │ - getHomeStatus()│  │ - checkHealth│  │
│  │ - ignite()       │  │ - getSchedules() │  │ - detectDrift│  │
│  │ - shutdown()     │  │ - setSchedule()  │  │ - syncState  │  │
│  └──────────────────┘  └──────┬───────────┘  └──────────────┘  │
│                                │                                 │
│  ┌─────────────────────────────┴──────────────────┐             │
│  │ NetatmoStoveSync                                │             │
│  │ - syncLivingRoomWithStove(isOn)                │             │
│  │ - enforceStoveSyncSetpoints(isOn)              │             │
│  │ - setRoomsToStoveMode()                        │             │
│  │ - setRoomsToSchedule()                         │             │
│  └────────────────────────────────────────────────┘             │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                      DATA LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│  Firebase Realtime DB:           Firestore:         External:   │
│  ┌──────────────────────┐        ┌────────────┐   ┌─────────┐  │
│  │ netatmo/             │        │ notifHist/ │   │ Netatmo │  │
│  │  - refresh_token     │        │ (history)  │   │ API     │  │
│  │  - home_id           │        └────────────┘   │         │  │
│  │  - topology          │                         │ Stove   │  │
│  │  - currentStatus     │                         │ API     │  │
│  │  - stoveSync         │                         └─────────┘  │
│  │  - schedules (new)   │                                      │
│  │ cronHealth/          │                                      │
│  │  - lastCall          │                                      │
│  │ monitoring/ (new)    │                                      │
│  │  - stoveHealth       │                                      │
│  │  - syncDrift         │                                      │
│  └──────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Cron Job Architecture (Vercel Compatible)

```
External Scheduler (cron-job.org)
         │ 1 min interval
         │ GET /api/scheduler/check?secret=xxx
         ↓
┌─────────────────────────────────────────┐
│ /api/scheduler/check (Serverless Fn)    │
│ ───────────────────────────────────────  │
│ 1. Health check (cronHealth/lastCall)   │
│ 2. Stove status fetch                   │
│ 3. Netatmo status fetch                 │
│ 4. Compare actual vs expected           │
│ 5. Detect anomalies                     │
│ 6. Execute scheduler actions            │
│ 7. Sync thermostat-stove                │
│ 8. Track maintenance hours              │
│ 9. Send alerts if needed                │
└────────────┬────────────────────────────┘
             │
             ↓
    ┌───────────────────┐
    │ Parallel Tasks    │
    │ (fire-and-forget) │
    ├───────────────────┤
    │ - Valve calibr.   │
    │ - Token refresh   │
    │ - Notifications   │
    └───────────────────┘
```

**Rationale:**
- **External scheduler required:** Vercel serverless functions don't run continuously (no Node.js cron within function)
- **1-minute interval:** Balances responsiveness with Vercel execution limits (10-second max function duration)
- **HMAC-secured webhook:** `?secret=xxx` with timing-safe comparison prevents unauthorized cron execution
- **Parallel tasks:** Non-blocking operations (valve calibration, token refresh) don't delay critical scheduler logic

**References:**
- [Vercel Cron Example](https://vercel.com/templates/next.js/vercel-cron)
- [Securing Vercel Cron Routes](https://codingcat.dev/post/how-to-secure-vercel-cron-job-routes-in-next-js-14-app-router)

---

## Component Responsibilities

| Component | Responsibility | Location | Implementation |
|-----------|---------------|----------|----------------|
| **ThermostatCard** | Display current temps/setpoints, schedule selector | `app/components/devices/thermostat/` | Client component with 30s polling |
| **ScheduleManager** | CRUD UI for Netatmo schedules | `app/components/netatmo/` (NEW) | Client component with form validation |
| **StoveMonitorBanner** | Display health alerts (connection loss, unexpected off) | `app/components/monitoring/` (NEW) | Client component polling monitoring state |
| **NetatmoScheduleService** | Fetch/save schedules from Netatmo API | `lib/` (NEW) | Server-side service |
| **NetatmoScheduleRepository** | Abstract Firebase storage for schedule cache | `lib/` (NEW) | Repository pattern |
| **StoveMonitorService** | Health check logic, drift detection | `lib/` (NEW) | Server-side service |
| **NetatmoStoveSync** | Thermostat-stove coordination (setpoint override) | `lib/netatmoStoveSync.js` (EXISTS) | Server-side service |
| **NotificationTriggers** | Alert generation for anomalies | `lib/notificationTriggersServer.js` (EXISTS) | v1.0 notification system |

---

## New Components for v2.0

### 1. NetatmoScheduleService (NEW)

**Purpose:** Manages Netatmo schedule operations (CRUD) with caching.

**Key Methods:**
```javascript
// lib/netatmoScheduleService.js

export async function getSchedules(homeId) {
  // 1. Check cache (Firebase RTDB netatmo/schedules)
  // 2. If stale (>5 min), fetch from Netatmo API
  // 3. Update cache
  // 4. Return schedules array
}

export async function getSchedule(homeId, scheduleId) {
  // Fetch single schedule details
  // Returns: { id, name, timetable, zones }
}

export async function createSchedule(homeId, name, timetable, zones) {
  // POST to Netatmo API /api/setthermmode
  // Invalidate cache
  // Return new schedule ID
}

export async function updateSchedule(homeId, scheduleId, updates) {
  // PUT to Netatmo API
  // Invalidate cache
}

export async function deleteSchedule(homeId, scheduleId) {
  // DELETE via Netatmo API
  // Validation: cannot delete active schedule
  // Invalidate cache
}

export async function setActiveSchedule(homeId, scheduleId) {
  // POST to Netatmo API /api/setthermmode
  // { schedule_id: scheduleId }
}
```

**Caching Strategy:**
- Cache schedules in Firebase RTDB: `netatmo/schedules/cache`
- TTL: 5 minutes (balances freshness with API rate limits)
- Invalidate on write operations (create/update/delete)
- Cache structure: `{ schedules: [...], lastFetchedAt: timestamp }`

**Error Handling:**
- Token refresh on 401 (use existing `getValidAccessToken()`)
- Retry with exponential backoff (max 3 attempts)
- Return `{ success, error, reconnect }` pattern (existing convention)

### 2. StoveMonitorService (NEW)

**Purpose:** Continuous monitoring of stove health and thermostat coordination.

**Key Methods:**
```javascript
// lib/stoveMonitorService.js

export async function checkStoveHealth(stoveStatus, netatmoStatus) {
  // Called from /api/scheduler/check every minute

  // Check 1: Stove API connectivity
  if (!stoveStatus) {
    return { healthy: false, issue: 'CONNECTION_LOST', severity: 'critical' };
  }

  // Check 2: Unexpected OFF during scheduled ON period
  const activeSchedule = getActiveScheduleSlot();
  if (activeSchedule && !stoveStatus.isOn) {
    return { healthy: false, issue: 'UNEXPECTED_OFF', severity: 'warning' };
  }

  // Check 3: Thermostat-stove coordination drift
  const driftDetected = await detectStoveSyncDrift(stoveStatus.isOn, netatmoStatus);
  if (driftDetected) {
    return { healthy: false, issue: 'SYNC_DRIFT', severity: 'info' };
  }

  return { healthy: true };
}

export async function detectStoveSyncDrift(stoveIsOn, netatmoStatus) {
  // Compare Firebase stoveSync.stoveMode with actual Netatmo setpoints
  const config = await getStoveSyncConfig();
  if (!config.enabled) return false;

  for (const room of config.rooms) {
    const actualSetpoint = netatmoStatus.rooms.find(r => r.id === room.id)?.setpoint;
    const expectedSetpoint = stoveIsOn ? config.stoveTemperature : null;

    if (stoveIsOn && Math.abs(actualSetpoint - expectedSetpoint) > 0.5) {
      return true; // Drift detected
    }
  }

  return false;
}

export async function logMonitoringIssue(issue) {
  // Save to Firebase: monitoring/issues/{timestamp}
  await adminDbSet(`monitoring/issues/${Date.now()}`, {
    ...issue,
    timestamp: Date.now(),
    resolved: false,
  });

  // Trigger notification via v1.0 system
  await triggerMonitoringAlertServer(userId, issue);
}
```

**Monitoring State Storage (Firebase RTDB):**
```javascript
monitoring/
  lastCheck: timestamp,
  currentHealth: { healthy, issue, severity },
  issues/
    {timestamp}: { issue, severity, resolved, resolvedAt }
```

**Integration with Existing Cron:**
- Add `checkStoveHealth()` call to `/api/scheduler/check`
- Execute after scheduler actions (non-blocking)
- Store result in Firebase for client polling

### 3. Schedule CRUD API Routes (NEW)

**File Structure:**
```
app/api/netatmo/schedules/
  route.js              # GET (list), POST (create)
  [scheduleId]/
    route.js            # GET (detail), PUT (update), DELETE
  active/
    route.js            # GET (current), POST (set active)
```

**GET /api/netatmo/schedules:**
```javascript
// Returns list of schedule metadata
export const GET = withAuthAndErrorHandler(async () => {
  const homeId = await getHomeId();
  const schedules = await NetatmoScheduleService.getSchedules(homeId);

  return success({
    schedules: schedules.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type, // 'therm', 'custom'
      selected: s.selected, // boolean - is active
    }))
  });
});
```

**POST /api/netatmo/schedules:**
```javascript
// Create new schedule
export const POST = withAuthAndErrorHandler(async (request) => {
  const { name, timetable, zones } = await request.json();

  // Validation
  if (!name || !timetable) {
    return badRequest('name and timetable required');
  }

  const homeId = await getHomeId();
  const newSchedule = await NetatmoScheduleService.createSchedule(
    homeId, name, timetable, zones
  );

  return success({ schedule: newSchedule });
});
```

**PUT /api/netatmo/schedules/[scheduleId]:**
```javascript
// Update existing schedule
export const PUT = withAuthAndErrorHandler(async (request, { params }) => {
  const { scheduleId } = params;
  const updates = await request.json();

  const homeId = await getHomeId();
  await NetatmoScheduleService.updateSchedule(homeId, scheduleId, updates);

  return success({ updated: true });
});
```

**DELETE /api/netatmo/schedules/[scheduleId]:**
```javascript
// Delete schedule (validation: cannot delete active)
export const DELETE = withAuthAndErrorHandler(async (request, { params }) => {
  const { scheduleId } = params;

  const homeId = await getHomeId();
  const activeScheduleId = await NetatmoScheduleService.getActiveScheduleId(homeId);

  if (scheduleId === activeScheduleId) {
    return badRequest('Cannot delete active schedule');
  }

  await NetatmoScheduleService.deleteSchedule(homeId, scheduleId);
  return success({ deleted: true });
});
```

---

## Data Flow

### Netatmo Schedule Management Flow

```
[User: Create Schedule]
         ↓
[ScheduleManager Component]
         ↓ POST /api/netatmo/schedules
         ↓ { name, timetable, zones }
[API Route: /api/netatmo/schedules/route.js]
         ↓
[NetatmoScheduleService.createSchedule()]
         ↓ POST https://api.netatmo.com/api/setthermmode
[Netatmo API]
         ↓ 200 OK
[NetatmoScheduleService]
         ↓ Invalidate cache
         ↓ Save to Firebase: netatmo/schedules/cache
[Firebase RTDB]
         ↓ success response
[Client] ← Schedule created
```

### Stove Monitoring Flow (Cron)

```
[External Cron: every 1 minute]
         ↓ GET /api/scheduler/check?secret=xxx
[Cron Route: /api/scheduler/check/route.js]
         ↓
    ┌────┴─────┬──────────┬────────────┐
    ↓          ↓          ↓            ↓
[getStove   [getNetatmo [getActive   [check
 Status()]   Status()]   Schedule()]  Maintenance]
    ↓          ↓          ↓            ↓
    └────┬─────┴──────────┴────────────┘
         ↓
[StoveMonitorService.checkStoveHealth()]
         ↓
    Decision tree:
    ┌─────────────────────────────────┐
    │ Issue detected?                 │
    │ ├─ CONNECTION_LOST → alert      │
    │ ├─ UNEXPECTED_OFF → alert       │
    │ ├─ SYNC_DRIFT → enforce sync    │
    │ └─ HEALTHY → log & continue     │
    └─────────────────────────────────┘
         ↓
[Save monitoring/currentHealth to Firebase]
         ↓
[Client polls monitoring/currentHealth every 60s]
         ↓
[StoveMonitorBanner displays alert if unhealthy]
```

### Thermostat-Stove Coordination Flow (Corrected)

**Problem (v1.0):** When stove turns ON, `syncLivingRoomWithStove()` was modifying Netatmo schedules, causing permanent changes.

**Solution (v2.0):** Use **temporary setpoint override** instead of schedule modification.

```
[Stove: Status changes to WORK]
         ↓
[Cron detects state change]
         ↓
[NetatmoStoveSync.syncLivingRoomWithStove(isOn=true)]
         ↓
    ┌───┴────────────────────────────────────────┐
    │ For each configured room:                  │
    │ 1. Get current setpoint (save to Firebase) │
    │ 2. Call Netatmo setRoomThermpoint()        │
    │    - mode: 'manual'                        │
    │    - temp: 16°C                            │
    │    - endtime: now + 8 hours                │
    │ 3. Update Firebase stoveSync.stoveMode     │
    └────────────────────────────────────────────┘
         ↓
[Netatmo applies manual setpoint for 8 hours]
         ↓
[After 8 hours OR stove shutdown]
         ↓
[NetatmoStoveSync.setRoomsToSchedule()]
         ↓
    ┌───┴────────────────────────────────┐
    │ For each configured room:          │
    │ Call Netatmo setRoomThermpoint()   │
    │    - mode: 'home' (follow schedule)│
    └────────────────────────────────────┘
         ↓
[Netatmo returns to schedule setpoints]
```

**Key Architectural Decision:**
- **NEVER modify Netatmo schedules** programmatically (only user via UI)
- **Use mode='manual' with endtime** for temporary overrides (max 8 hours)
- **Continuous enforcement:** Cron re-checks actual setpoints every minute and re-applies if drifted (handles 8-hour expiration)

---

## Integration Points

### With Existing Components

| Existing Component | Integration | Changes Required |
|-------------------|-------------|------------------|
| `/api/scheduler/check` | Add stove monitoring calls after scheduler logic | Add `StoveMonitorService.checkStoveHealth()` call |
| `ThermostatCard` | Add schedule selector dropdown | Add state for active schedule, dropdown UI |
| `NetatmoStoveSync` | No changes (already uses setpoint override) | None - architecture is correct |
| `NotificationTriggers` | Add new trigger types | Add `triggerStoveConnectionLostServer()`, `triggerStoveDriftServer()` |
| Firebase RTDB Schema | Add paths for schedules cache, monitoring | Add `netatmo/schedules/cache`, `monitoring/` |

### New Components to Create

| Component | Type | Purpose | Priority |
|-----------|------|---------|----------|
| `NetatmoScheduleService` | Service | Schedule CRUD with caching | HIGH |
| `StoveMonitorService` | Service | Health checks, drift detection | HIGH |
| `/api/netatmo/schedules/*` | API Routes | Schedule CRUD endpoints | HIGH |
| `ScheduleManager` | UI Component | Schedule management interface | MEDIUM |
| `StoveMonitorBanner` | UI Component | Display health alerts | MEDIUM |

---

## Architectural Patterns

### Pattern 1: Service Layer Abstraction

**What:** Separate business logic (services) from data access (repositories) and transport (API routes).

**When to use:** When domain logic is complex and needs to be reused across multiple endpoints.

**Example:**
```javascript
// API Route (thin controller)
export const GET = withAuthAndErrorHandler(async () => {
  const schedules = await NetatmoScheduleService.getSchedules(homeId);
  return success({ schedules });
});

// Service Layer (business logic)
export async function getSchedules(homeId) {
  const cached = await NetatmoScheduleRepository.getCached(homeId);
  if (cached && !isStale(cached)) {
    return cached.schedules;
  }

  const fresh = await NetatmoAPI.getSchedules(homeId);
  await NetatmoScheduleRepository.saveCached(homeId, fresh);
  return fresh;
}

// Repository Layer (data access)
export async function getCached(homeId) {
  const path = getEnvironmentPath(`netatmo/schedules/${homeId}/cache`);
  return await adminDbGet(path);
}
```

**Trade-offs:**
- ✅ Testable (mock repository in service tests)
- ✅ Reusable (service used by multiple API routes)
- ❌ More files (3 layers instead of 1 monolithic route)

**Existing Usage:** `netatmoService.js`, `stoveStateService.js`

### Pattern 2: Cache-Aside with TTL

**What:** Cache external API responses in Firebase RTDB with expiration timestamp.

**When to use:** External API has rate limits OR response is expensive to compute.

**Example:**
```javascript
export async function getSchedules(homeId) {
  const cached = await adminDbGet(`netatmo/schedules/${homeId}/cache`);

  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  if (cached && (Date.now() - cached.lastFetchedAt) < CACHE_TTL) {
    return cached.schedules; // Cache hit
  }

  // Cache miss - fetch from API
  const fresh = await NETATMO_API.getSchedules(accessToken, homeId);
  await adminDbSet(`netatmo/schedules/${homeId}/cache`, {
    schedules: fresh,
    lastFetchedAt: Date.now(),
  });

  return fresh;
}
```

**Trade-offs:**
- ✅ Reduces API calls (avoids rate limits)
- ✅ Faster response times (Firebase < 50ms vs API 300-500ms)
- ❌ Stale data risk (5-min window where changes aren't reflected)
- ❌ Cache invalidation complexity (must invalidate on writes)

**Mitigation:** Invalidate cache on write operations (create/update/delete schedule).

### Pattern 3: Fire-and-Forget for Non-Critical Tasks

**What:** Execute non-blocking operations asynchronously without awaiting completion.

**When to use:** Operation is not critical to user response OR has independent failure handling.

**Example:**
```javascript
// In /api/scheduler/check
export const GET = withCronSecret(async () => {
  // Critical path - blocking
  const stoveStatus = await getStoveStatus();
  const scheduleAction = await executeSchedulerLogic(stoveStatus);

  // Non-critical - fire-and-forget
  calibrateValvesIfNeeded().catch(err => console.error('Calibration failed:', err));
  proactiveTokenRefresh().catch(err => console.error('Token refresh failed:', err));
  sendNotifications(scheduleAction).catch(err => console.error('Notification failed:', err));

  return success({ status: scheduleAction });
});
```

**Trade-offs:**
- ✅ Fast response (critical path completes quickly)
- ✅ Isolated failures (non-critical task failure doesn't block main flow)
- ❌ No error propagation to client (failures logged but not returned)
- ❌ Harder to debug (errors happen after response sent)

**Existing Usage:** Valve calibration, Hue token refresh in scheduler cron (lines 512-525 of `/api/scheduler/check`)

### Pattern 4: Polling with Exponential Backoff for Client State

**What:** Client polls server for state updates with increasing interval on error.

**When to use:** No WebSocket/SSE support AND state changes are infrequent.

**Example:**
```javascript
// Client component
export default function StoveMonitorBanner() {
  const [health, setHealth] = useState(null);
  const [backoff, setBackoff] = useState(60000); // Start at 60s

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/monitoring/health');
        const data = await res.json();
        setHealth(data);
        setBackoff(60000); // Reset on success
      } catch (err) {
        console.error('Health fetch failed:', err);
        setBackoff(prev => Math.min(prev * 2, 300000)); // Max 5 min
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, backoff);
    return () => clearInterval(interval);
  }, [backoff]);

  // Render alert if unhealthy
}
```

**Trade-offs:**
- ✅ Simple (no WebSocket infrastructure)
- ✅ Works with Vercel serverless (no persistent connections)
- ❌ Delayed updates (60s latency for state changes)
- ❌ Increased server load (all clients polling)

**Recommendation:** 60s interval for monitoring state (changes are infrequent). Use 5s for stove status (existing pattern).

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-10 users** (current) | Current architecture sufficient. Single Vercel instance handles polling. Firebase RTDB free tier (10GB/month) adequate. |
| **10-100 users** | Consider Redis for rate limiting (currently in-memory). Move to Firestore for schedule cache (better querying). Add Sentry for error monitoring. |
| **100+ users** | Unlikely for personal smart home app. If reached: WebSocket for real-time updates, CDN for static assets, database read replicas. |

### Bottlenecks

**1. Netatmo API Rate Limits (first bottleneck)**
- **Problem:** Netatmo API has undocumented rate limits (~60 req/min per user)
- **Solution:** Cache-aside pattern with 5-min TTL (already planned)
- **Monitoring:** Log 429 responses, alert on repeated failures

**2. Vercel Function Execution Time (second bottleneck)**
- **Problem:** Scheduler cron can timeout if stove API is slow (10s max)
- **Solution:** Parallel requests with Promise.all (already implemented in scheduler)
- **Monitoring:** Track cron execution time in Firebase, alert if >8s

**3. Firebase RTDB Write Throughput (unlikely bottleneck)**
- **Problem:** RTDB has 1000 writes/sec limit
- **Current Usage:** ~60 writes/min (1/sec) from cron + client updates
- **Solution:** No action needed unless adding 100+ concurrent users

---

## Anti-Patterns

### Anti-Pattern 1: Modifying Netatmo Schedules Programmatically

**What people do:** Call Netatmo `setthermmode` to modify schedule timetable when stove turns on/off.

**Why it's wrong:**
- Permanent changes to user-defined schedules
- Loses original schedule configuration
- Conflicts with user edits (race conditions)
- Netatmo schedule has limited slots (can't infinitely add/remove)

**Do this instead:** Use **temporary manual setpoint override** with `mode='manual'` and `endtime`.

**Implementation:**
```javascript
// ❌ WRONG - modifies schedule
await NETATMO_API.setSchedule(homeId, scheduleId, {
  timetable: modifiedTimetable // Permanent change!
});

// ✅ CORRECT - temporary override
await NETATMO_API.setRoomThermpoint(accessToken, {
  home_id: homeId,
  room_id: roomId,
  mode: 'manual',
  temp: 16,
  endtime: Math.floor(Date.now() / 1000) + (8 * 60 * 60), // 8 hours
});

// Later: return to schedule
await NETATMO_API.setRoomThermpoint(accessToken, {
  home_id: homeId,
  room_id: roomId,
  mode: 'home', // Follow schedule
});
```

**Reference:** Existing implementation in `netatmoStoveSync.js` (lines 199-225, 298-302)

### Anti-Pattern 2: Blocking Cron Execution on Non-Critical Tasks

**What people do:** Await all operations in cron handler, including optional tasks like valve calibration.

**Why it's wrong:**
- Increases function execution time (risk of 10s timeout)
- Non-critical failure blocks entire cron job
- User experience degrades (delayed scheduler actions)

**Do this instead:** Fire-and-forget for non-critical tasks.

**Implementation:**
```javascript
// ❌ WRONG
export const GET = async () => {
  await executeSchedulerLogic();
  await calibrateValves(); // Blocks even if optional
  await refreshTokens();
  await sendNotifications();
  return success();
};

// ✅ CORRECT
export const GET = async () => {
  await executeSchedulerLogic(); // Critical - block

  // Non-critical - fire-and-forget
  calibrateValves().catch(err => console.error('Calibration:', err));
  refreshTokens().catch(err => console.error('Token refresh:', err));
  sendNotifications().catch(err => console.error('Notifications:', err));

  return success();
};
```

**Reference:** Existing implementation in scheduler cron (lines 512-525)

### Anti-Pattern 3: Client-Side State Tracking for Server Actions

**What people do:** Track scheduler state (is auto mode on?) in client component state.

**Why it's wrong:**
- State desync between client and server (cron operates independently)
- Page refresh loses state
- Multiple clients show different states

**Do this instead:** Single source of truth in Firebase, client reads only.

**Implementation:**
```javascript
// ❌ WRONG
const [autoMode, setAutoMode] = useState(false);
const toggleMode = async () => {
  setAutoMode(!autoMode); // Optimistic update
  await fetch('/api/scheduler/mode', { method: 'POST' });
};

// ✅ CORRECT
const [autoMode, setAutoMode] = useState(null);
useEffect(() => {
  const unsubscribe = onValue(ref(db, 'schedules-v2/mode'), (snap) => {
    setAutoMode(snap.val()?.enabled);
  });
  return () => unsubscribe();
}, []);

const toggleMode = async () => {
  await fetch('/api/scheduler/mode', { method: 'POST' });
  // State updates via Firebase listener automatically
};
```

**Reference:** Existing pattern in `StoveCard.js` (Firebase listener for maintenance state)

---

## Build Order Recommendation

Based on architectural dependencies and feature priorities:

### Phase 1: Foundation - Netatmo Schedule Infrastructure
**Goal:** Lay groundwork for schedule operations without UI.

**Components:**
1. `NetatmoScheduleService` - Core CRUD logic
2. `NetatmoScheduleRepository` - Firebase caching
3. `/api/netatmo/schedules/*` - API routes
4. **Test:** Postman calls to API routes, verify caching

**Rationale:** Backend-first allows testing independently of UI complexity.

**Estimated Effort:** 1 task (6-8 hours)

### Phase 2: Stove Monitoring Backend
**Goal:** Detect and log health issues, no UI alerts yet.

**Components:**
1. `StoveMonitorService` - Health checks, drift detection
2. Monitoring state in Firebase (`monitoring/`)
3. Integration with `/api/scheduler/check` cron
4. **Test:** Force connection loss, verify logging

**Rationale:** Monitoring backend informs alert UI requirements.

**Estimated Effort:** 1 task (6-8 hours)

### Phase 3: Thermostat-Stove Integration Correction
**Goal:** Fix schedule modification bug, use setpoint override.

**Components:**
1. Update `NetatmoStoveSync.syncLivingRoomWithStove()` (if needed - already correct)
2. Add `enforceStoveSyncSetpoints()` to cron (already exists, verify behavior)
3. Add continuous enforcement logic
4. **Test:** Stove on/off transitions, verify Netatmo schedules unchanged

**Rationale:** Critical bug fix before adding more features.

**Estimated Effort:** 1 task (4-6 hours) - mostly verification

### Phase 4: Schedule Management UI
**Goal:** User can create/edit/delete Netatmo schedules.

**Components:**
1. `ScheduleManager` component - CRUD UI
2. Schedule selector in `ThermostatCard`
3. Form validation (React Hook Form + Zod)
4. **Test:** Create schedule, verify in Netatmo app

**Rationale:** UI depends on stable backend from Phase 1.

**Estimated Effort:** 2 tasks (10-12 hours) - complex forms

### Phase 5: Monitoring UI & Alerts
**Goal:** Display health status and send alerts.

**Components:**
1. `StoveMonitorBanner` component - Alert display
2. New notification triggers (`triggerStoveConnectionLostServer`, etc.)
3. Dashboard for monitoring history
4. **Test:** Force connection loss, verify alert + notification

**Rationale:** UI depends on monitoring backend from Phase 2.

**Estimated Effort:** 2 tasks (8-10 hours)

---

## Sources

**Netatmo API Integration:**
- [Netatmo Developer Documentation](https://dev.netatmo.com/apidocumentation) - Official API reference
- [Netatmo Energy API](https://dev.netatmo.com/apidocumentation/energy) - Schedule management endpoints
- [Home Assistant Netatmo Integration](https://www.home-assistant.io/integrations/netatmo/) - Community integration patterns

**Cron Job Architecture:**
- [Vercel Cron Job Example](https://vercel.com/templates/next.js/vercel-cron) - Official Next.js cron pattern
- [Cron Jobs in Next.js: Serverless vs Serverful](https://yagyaraj234.medium.com/running-cron-jobs-in-nextjs-guide-for-serverful-and-stateless-server-542dd0db0c4c) - Serverless cron architecture
- [Securing Vercel Cron Routes](https://codingcat.dev/post/how-to-secure-vercel-cron-job-routes-in-next-js-14-app-router) - HMAC webhook security
- [Testing Next.js Cron Jobs Locally](https://medium.com/@quentinmousset/testing-next-js-cron-jobs-locally-my-journey-from-frustration-to-solution-6ffb2e774d7a) - Local development patterns

**IoT Monitoring:**
- [Polling vs Webhooks](https://www.merge.dev/blog/webhooks-vs-polling) - Architecture comparison
- [The Ultimate Guide to IoT Monitoring in 2026](https://uptimerobot.com/knowledge-hub/devops/iot-monitoring/) - Monitoring patterns
- [IoT Monitoring Challenges](https://www.netdata.cloud/blog/iot-monitoring-challenges/) - Common pitfalls

**Existing Codebase:**
- `app/api/scheduler/check/route.js` - Current cron implementation (HIGH confidence)
- `lib/netatmoStoveSync.js` - Thermostat-stove coordination service (HIGH confidence)
- `lib/netatmoService.js` - Netatmo state management patterns (HIGH confidence)
- `docs/architecture.md` - Repository pattern, multi-device architecture (HIGH confidence)

---

*Architecture research for: Netatmo Schedule Management & Stove Monitoring*
*Researched: 2026-01-26*
*Confidence: HIGH (existing codebase analysis + 2026 web research)*
