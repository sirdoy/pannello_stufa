# Architecture Integration: v6.0 Operations, PWA & Analytics

**Project:** Pannello Stufa v6.0
**Researched:** 2026-02-10
**Confidence:** HIGH

## Executive Summary

v6.0 adds operational resilience, enhanced PWA capabilities, and analytics features to the existing Next.js 15.5 + Firebase + Serwist architecture. All new features integrate with existing patterns (HMAC webhooks, Firebase RTDB/Firestore split, service worker message handlers). **No major architectural changes required** — this is evolutionary enhancement, not revolutionary redesign.

**Key integration points:**
1. **Cron automation** — External cron service → existing `withCronSecret` webhook pattern (already in use)
2. **Persistent rate limiting** — Firebase RTDB counters replace in-memory Map (pattern exists in `netatmoRateLimiter.ts`)
3. **E2E tests** — Playwright session state reuse + Auth0 callback interception (documented patterns available)
4. **Interactive push** — FCM data payload + service worker `notificationclick` with action detection
5. **PWA offline** — Serwist NetworkFirst with fallback, IndexedDB state cache (already implemented for stove/thermostat)
6. **Analytics** — Firebase RTDB for real-time events, Firestore for historical aggregation, Recharts visualization (existing pattern in notification dashboard)

---

## 1. Cron Automation (External Service Integration)

### Current State

**Already operational:** Cron webhook pattern exists in production.

**Existing endpoints:**
- `/api/scheduler/check` — Unified cron endpoint (scheduler, calibration, weather, token cleanup)
- `/api/coordination/enforce` — Stove-thermostat coordination enforcement

**Security:** HMAC-based via `withCronSecret` middleware (lib/core/middleware.ts:166-187)

**Pattern:**
```typescript
export const GET = withCronSecret(async (request, context) => {
  // Cron logic
  return success({ result });
}, 'CronJobName');
```

**Supports:**
- Query param: `?secret=xxx`
- Header: `Authorization: Bearer xxx`
- Validates against `process.env.CRON_SECRET`

### v6.0 Integration

**No architecture changes needed.** Existing pattern already supports:
- Dead man's switch monitoring (cronHealth/lastCall)
- Interval-based jobs (lastExecution timestamp pattern, see scheduler/check route:92-135)
- Fire-and-forget async tasks (weather refresh, token cleanup)

**External service options** (from research):

1. **GitHub Actions** (free)
   - Scheduled workflow pings webhook endpoint
   - 5-minute minimum interval (acceptable for monitoring)
   - No additional dependencies

2. **Upstash** (free tier available)
   - HTTP scheduler with cron syntax
   - Sub-minute precision
   - Better for production

3. **cron-job.org** (free tier available)
   - Simple HTTP GET/POST scheduler
   - Monitoring + notifications

**Recommendation:** Start with GitHub Actions (zero cost), migrate to Upstash if sub-5-minute intervals needed.

**Implementation:**
- Keep existing `/api/scheduler/check` endpoint unchanged
- Add GitHub Actions workflow: `.github/workflows/cron.yml`
- Configure secret in repository settings

**Data flow:**
```
GitHub Actions (every 5 min)
  ↓ HTTPS GET + Authorization header
/api/scheduler/check?secret=xxx
  ↓ withCronSecret validation
  ↓ Parallel async jobs (calibration, weather, etc.)
  ↓ Updates Firebase RTDB (cronHealth/lastCall)
  ↓ Triggers notifications via notificationTriggersServer
  ← 200 OK + job summary
```

**Serverless constraints:**
- Vercel timeout: 10s (Hobby), 60s (Pro)
- Current implementation already handles this (fire-and-forget pattern for long jobs)
- All blocking operations complete within timeout

---

## 2. Persistent Rate Limiting (Firebase RTDB Integration)

### Current State

**In-memory rate limiter:** `lib/rateLimiter.ts`
- Uses `Map<string, number[]>` (userId:notifType → timestamps)
- Single Vercel instance, **does not persist across cold starts**
- Cleanup interval every 5 minutes

**Firebase RTDB pattern already exists:** `lib/netatmoRateLimiter.ts`
- Transaction-based atomic counter increment
- Per-user window tracking (400 calls per hour)
- Persistent across deployments

### v6.0 Integration

**Replace in-memory Map with Firebase RTDB transactions.**

**Schema:**
```
/rateLimits/{userId}/{notifType}/
  timestamps: [1707568800000, 1707568900000, ...]
  windowMinutes: 5
  maxPerWindow: 1
```

**Component changes:**

| Component | Change | Impact |
|-----------|--------|--------|
| `lib/rateLimiter.ts` | Replace Map operations with Firebase RTDB `get()`/`runTransaction()` | Core implementation (80 lines) |
| `lib/notificationService.ts` | No change (uses public API) | None |
| Tests (`__tests__/lib/rateLimiter.test.ts`) | Update to use Firebase Admin mocks | Test setup only |

**Pattern (from netatmoRateLimiter.ts):**
```typescript
// Read current timestamps
const snapshot = await get(ref(db, `rateLimits/${userId}/${notifType}/timestamps`));
const timestamps = snapshot.val() || [];

// Filter to window
const now = Date.now();
const recentInWindow = timestamps.filter(ts => now - ts < windowMs);

// Check limit
if (recentInWindow.length >= maxPerWindow) {
  return { allowed: false, ... };
}

// Atomically add timestamp
await runTransaction(ref(db, `rateLimits/${userId}/${notifType}`), (current) => {
  const updated = [...(current?.timestamps || []), now];
  return { ...current, timestamps: updated };
});
```

**Benefits:**
- Survives cold starts (critical for serverless)
- Cross-instance consistency (if scaled horizontally)
- Audit trail for debugging

**Trade-offs:**
- Network latency: ~50-100ms vs in-memory <1ms
- Acceptable: Rate limit checks are non-blocking (notification delivery continues)
- Firebase RTDB reads are fast (cached regionally)

**Migration path:**
1. Create parallel Firebase-backed implementation (`lib/rateLimiterPersistent.ts`)
2. Add feature flag: `process.env.USE_PERSISTENT_RATE_LIMIT`
3. Test in development (validate transaction safety)
4. Deploy with flag=true, monitor for 24h
5. Remove in-memory implementation if stable

**Cleanup strategy:**
- Current: In-process interval (5 min)
- New: Cron job cleanup (daily) — prune timestamps older than max window (1 hour)
- Path: `/api/admin/cleanup-rate-limits` (protected by withCronSecret)

---

## 3. E2E Testing (Playwright + Auth0 Integration)

### Current State

**No E2E tests exist yet.** Unit/integration tests cover 3,034 test cases.

**Auth0 setup:**
- SDK: `@auth0/nextjs-auth0` v4.13.1
- Routes: `/auth/login`, `/auth/callback`, `/auth/logout`
- Middleware: `middleware.ts` validates session on all protected routes
- TEST_MODE bypass: `process.env.TEST_MODE=true` skips auth

### v6.0 Integration

**Pattern: Session state reuse** (from research: [End-to-End Testing Auth Flows with Playwright and Next.js](https://testdouble.com/insights/how-to-test-auth-flows-with-playwright-and-next-js))

**Approach 1: Session caching (recommended)**

```typescript
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  // Login once
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL);
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('/');

  // Save session state
  await page.context().storageState({ path: 'tests/.auth/user.json' });
});

// playwright.config.ts
export default {
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'authenticated',
      dependencies: ['setup'],
      use: { storageState: 'tests/.auth/user.json' },
    },
  ],
};
```

**Benefits:**
- Single Auth0 round-trip (fast test suite)
- Real session cookies (validates full auth flow)
- Reusable across all tests

**Approach 2: TEST_MODE bypass (fast, less realistic)**

```typescript
// playwright.config.ts
export default {
  use: {
    baseURL: 'http://localhost:3000',
  },
  env: {
    TEST_MODE: 'true',  // Middleware skips auth
  },
};
```

**Component changes:**

| Component | Change | Effort |
|-----------|--------|--------|
| New: `tests/auth.setup.ts` | Auth session setup script | 30 lines |
| New: `tests/stove.spec.ts` | Example E2E test (ignite flow) | 50 lines |
| `playwright.config.ts` | Project config with dependencies | 10 lines |
| `.gitignore` | Ignore `tests/.auth/` session files | 1 line |

**Test coverage targets:**

1. **Critical user flows** (5 tests)
   - Stove ignite/shutdown from dashboard
   - Thermostat temperature change
   - Schedule switch
   - Notification permission flow
   - PWA install prompt

2. **Cross-device scenarios** (3 tests)
   - Multi-tab state sync (Firebase listeners)
   - Offline → online reconnection
   - Push notification click → app focus

**Data flow:**
```
Playwright test suite
  ↓ setup project runs once
Auth0 login flow (real credentials)
  ↓ saves storageState
Session cookies persisted to JSON
  ↓ injected in test context
All tests run authenticated
  ↓ validate app behavior
  ← no additional Auth0 calls
```

**CI/CD integration:**
- GitHub Actions: `npm run test:e2e:ci`
- Secrets: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` (repository secrets)
- Artifact: Playwright HTML report + traces

---

## 4. Interactive Push Notifications (FCM + Service Worker)

### Current State

**FCM setup complete:**
- Push handler in `app/sw.ts:104-137` (basic notification display)
- Notification click handler in `app/sw.ts:143-171` (opens app)
- Badge management in `app/sw.ts:357-419` (increment on new notification)

**Current limitations:**
- No action buttons (single tap → open app)
- No inline actions (reply, snooze, etc.)

### v6.0 Integration

**Add notification actions via data payload.**

**FCM payload structure** (from research: [Implementing Action Buttons in Push Notifications](https://medium.com/@hassem_mahboob/implementing-action-buttons-in-push-notifications-using-firebase-and-notifee-f5743bdb28bc)):

```json
{
  "notification": {
    "title": "Stufa spenta inaspettatamente",
    "body": "La stufa si è spenta. Vuoi riaccenderla?"
  },
  "data": {
    "type": "stove_unexpected_off",
    "url": "/",
    "actions": JSON.stringify([
      { "action": "ignite", "title": "Accendi", "icon": "/icons/fire.png" },
      { "action": "dismiss", "title": "Ignora", "icon": "/icons/close.png" }
    ])
  }
}
```

**Service worker changes** (app/sw.ts):

```typescript
// Enhanced push handler (line 104)
self.addEventListener('push', (event) => {
  const payload = event.data?.json();

  // Parse actions from data payload
  const actions = payload.data?.actions
    ? JSON.parse(payload.data.actions)
    : [];

  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: payload.data?.type || 'default',
    data: payload.data,
    actions: actions,  // ← NEW
  };

  event.waitUntil(
    self.registration.showNotification(
      payload.notification?.title || 'Pannello Stufa',
      notificationOptions
    )
  );
});

// Enhanced click handler (line 143)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;  // ← NEW: action button ID or empty string for body click
  const type = event.notification.data?.type;

  // Handle action-specific logic
  if (action === 'ignite' && type === 'stove_unexpected_off') {
    event.waitUntil(
      fetch('/api/stove/ignite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'notification' }),
      }).then(() => {
        // Show success notification
        self.registration.showNotification('Stufa accesa', {
          body: 'La stufa è stata riaccesa con successo',
          tag: 'ignite-success',
        });
      })
    );
    return;
  }

  // Default: open app
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Focus existing window or open new
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            return client.focus().then(() => client.navigate(urlToOpen));
          }
        }
        return self.clients.openWindow(urlToOpen);
      })
  );
});
```

**Server-side notification trigger** (lib/notificationTriggersServer.ts):

```typescript
export async function triggerStoveUnexpectedOffServer(
  userId: string,
  details: Record<string, any> = {}
) {
  const payload = {
    notification: {
      title: 'Stufa spenta inaspettatamente',
      body: 'La stufa si è spenta. Vuoi riaccenderla?',
    },
    data: {
      type: 'stove_unexpected_off',
      url: '/',
      actions: JSON.stringify([
        { action: 'ignite', title: 'Accendi 🔥' },
        { action: 'dismiss', title: 'Ignora' },
      ]),
      ...details,
    },
  };

  await sendNotification(userId, payload);
}
```

**Component changes:**

| Component | Change | Lines |
|-----------|--------|-------|
| `app/sw.ts` | Parse actions from payload, handle in click event | +40 |
| `lib/notificationTriggersServer.ts` | Add actions to payloads for interactive types | +15 per trigger |
| `lib/notificationService.ts` | No change (server-side only) | 0 |

**Use cases:**

1. **Stove unexpected off** — Ignite / Dismiss
2. **Maintenance alert** — View details / Snooze 24h
3. **Schedule conflict** — Override / Keep schedule
4. **Thermostat offline** — Retry connection / Ignore

**Platform support:**
- **Android Chrome:** Full support (2+ action buttons)
- **iOS Safari 16.4+:** Partial support (notification actions require app installed as PWA)
- **Desktop Chrome/Edge:** Full support

**Fallback:** If no action taken, default body click opens app (existing behavior preserved).

---

## 5. PWA Offline Mode (Serwist + IndexedDB)

### Current State

**Serwist v9 configured** (next.config.ts:4-10):
- Service worker: `app/sw.ts` → compiled to `public/sw.js`
- Strategies: NetworkFirst (pages), CacheFirst (images), StaleWhileRevalidate (JS/CSS)
- Offline fallback: `/offline` page (app/sw.ts:84-91)

**IndexedDB caching** (app/sw.ts:422-498):
- Stove status cached on fetch success
- Thermostat status cached on fetch success
- Device state retrievable via message handler

**Limitations:**
- No offline UI state indicators on device cards
- No queued command retry (Background Sync exists but not integrated with UI)

### v6.0 Integration

**Phase 1: Enhanced offline detection**

**Add connection status hook** (new: `lib/hooks/useOnlineStatus.ts`):

```typescript
'use client';
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

**Update device cards** (StoveCard, ThermostatCard):

```typescript
'use client';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';

export default function StoveCard() {
  const isOnline = useOnlineStatus();
  const [status, setStatus] = useState(null);
  const [cachedStatus, setCachedStatus] = useState(null);

  // Load cached state when offline
  useEffect(() => {
    if (!isOnline) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'GET_CACHED_STATE',
        data: { deviceId: 'stove' },
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHED_STATE') {
          setCachedStatus(event.data.data);
        }
      });
    }
  }, [isOnline]);

  return (
    <Card>
      {!isOnline && (
        <Banner variant="warning" title="Modalità offline">
          Dati visualizzati dall'ultima sincronizzazione
        </Banner>
      )}

      <StatusDisplay status={isOnline ? status : cachedStatus} />

      {/* Disable controls when offline */}
      <Button onClick={handleIgnite} disabled={!isOnline}>
        Accendi
      </Button>
    </Card>
  );
}
```

**Phase 2: Command queueing UI**

**Background Sync integration** (already in app/sw.ts:184-347):
- Queue commands to IndexedDB when offline
- Sync event processes queue when connection restored
- Client notified via postMessage

**Add UI feedback:**

```typescript
// app/components/devices/stove/StoveCard.tsx
const [pendingCommands, setPendingCommands] = useState([]);

const handleIgnite = async () => {
  if (!isOnline) {
    // Queue command for later
    await queueCommand('stove/ignite', { source: 'manual' });
    setPendingCommands(prev => [...prev, 'ignite']);

    toast.info('Comando in coda', {
      description: 'Verrà eseguito quando tornerai online',
    });
    return;
  }

  // Execute immediately if online
  await fetch('/api/stove/ignite', { ... });
};

// Listen for sync completion
useEffect(() => {
  navigator.serviceWorker?.addEventListener('message', (event) => {
    if (event.data.type === 'COMMAND_SYNCED') {
      setPendingCommands(prev => prev.filter(cmd => cmd !== event.data.endpoint));
      toast.success('Comando eseguito', {
        description: `${event.data.endpoint} completato`,
      });
    }
  });
}, []);

return (
  <Card>
    {pendingCommands.length > 0 && (
      <Badge variant="warning">
        {pendingCommands.length} comandi in attesa
      </Badge>
    )}
  </Card>
);
```

**Component changes:**

| Component | Change | Lines |
|-----------|--------|-------|
| New: `lib/hooks/useOnlineStatus.ts` | Online/offline detection hook | 25 |
| `app/components/devices/stove/StoveCard.tsx` | Offline banner + cached state + queue UI | +60 |
| `app/components/devices/thermostat/ThermostatCard.tsx` | Same pattern | +60 |
| `app/sw.ts` | Enhanced message handler for cached state | +15 |

**Serwist strategy optimization:**

Current NetworkFirst timeout: 10s (app/sw.ts:37)
- Good for slow connections
- May feel slow on fast WiFi

**Recommendation:** Keep as-is. 10s timeout is acceptable UX trade-off for offline resilience.

**Fallback page enhancement:**

Current `/offline` page is basic. Enhance with:
- Last sync timestamp
- Cached device states (read-only view)
- Link to settings (cached via precache)

---

## 6. Analytics Dashboard (Firebase + Recharts)

### Current State

**Recharts already in use:**
- Notification delivery trends (app/debug/notifications/components/DeliveryChart.tsx)
- 7-day time-series visualization with ResponsiveContainer, AreaChart, Tooltip

**Firebase data:**
- **RTDB:** Real-time stove state (stove/state), maintenance tracking (maintenance/)
- **Firestore:** Notification history with pagination (notifications/{userId}/history/{notifId})

**Existing analytics pattern:**
- Server-side aggregation (lib/notificationLogger.ts)
- Client-side visualization (Recharts)

### v6.0 Integration

**Analytics schema design:**

**Real-time events → Firebase RTDB**
```
/analytics/stove/
  events/{eventId}/            # Raw events (1-day retention)
    type: "ignite" | "shutdown" | "power_change" | "fan_change"
    timestamp: 1707568800000
    source: "manual" | "scheduler" | "coordination"
    value: "P4" | "F3"
    userId: "auth0|xxx"

  dailyStats/{YYYY-MM-DD}/     # Aggregated daily (90-day retention)
    totalIgnitions: 3
    totalHours: 8.5
    avgPowerLevel: 4.2
    schedulerIgnitions: 2
    manualIgnitions: 1
```

**Historical aggregation → Firestore**
```
/analytics/{userId}/stove/monthly/{YYYY-MM}/
  totalIgnitions: 45
  totalHours: 340
  pelletConsumption: 85  // kg (calculated from hours + power)
  topPowerLevel: 4       // most used
  schedulerPercentage: 67

/analytics/{userId}/weather/daily/{YYYY-MM-DD}/
  avgTemp: 8.5
  minTemp: 2
  maxTemp: 15
  weatherCode: 3         // WMO code
  stoveHours: 8.5        // correlation
```

**Data collection:**

**Stove events** — Trigger from existing API routes:

```typescript
// app/api/stove/ignite/route.ts
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const body = await request.json();

  // Existing: Ignite stove
  await igniteStove();

  // NEW: Log analytics event
  await logStoveEvent({
    type: 'ignite',
    timestamp: Date.now(),
    source: body.source || 'manual',
    userId: session.user.sub,
  });

  return success({ success: true });
});
```

**Weather correlation** — Collect in cron job:

```typescript
// app/api/scheduler/check/route.ts (add to existing cron)
async function logWeatherAnalytics() {
  const weather = await fetchWeatherForecast();
  const stoveStatus = await getStoveStatus();

  await adminDbSet(`analytics/weather/daily/${getCurrentDate()}`, {
    avgTemp: weather.current.temperature,
    weatherCode: weather.current.weatherCode,
    stoveOn: stoveStatus.state === 'on',
    timestamp: Date.now(),
  });
}
```

**Aggregation strategy:**

**Real-time:** RTDB events expire after 1 day (Firebase TTL not available, use cron cleanup)

**Daily aggregation:** Cron job (midnight) processes previous day:
```typescript
// New: /api/analytics/aggregate-daily (called by cron)
export const POST = withCronSecret(async () => {
  const yesterday = getYesterday();
  const events = await getStoveEventsForDate(yesterday);

  const stats = {
    totalIgnitions: events.filter(e => e.type === 'ignite').length,
    totalHours: calculateHoursFromEvents(events),
    avgPowerLevel: calculateAvgPower(events),
    schedulerIgnitions: events.filter(e => e.source === 'scheduler').length,
  };

  await adminDbSet(`analytics/stove/dailyStats/${yesterday}`, stats);

  // Clean up events older than 1 day
  await adminDbRemove(`analytics/stove/events`);

  return success({ aggregated: stats });
});
```

**Monthly aggregation:** Sum daily stats into Firestore (better for complex queries):
```typescript
// Same cron job, end of month
if (isLastDayOfMonth()) {
  const monthlyStats = await aggregateMonthlyStats(currentMonth);
  await firestoreSet(`analytics/${userId}/stove/monthly/${currentMonth}`, monthlyStats);
}
```

**Visualization components:**

**New page:** `/app/analytics/page.tsx`

```typescript
'use client';
import { useState, useEffect } from 'react';
import { Card, Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [dailyStats, setDailyStats] = useState([]);
  const [weatherCorrelation, setWeatherCorrelation] = useState([]);

  useEffect(() => {
    fetchDailyStats(timeRange).then(setDailyStats);
    fetchWeatherCorrelation(timeRange).then(setWeatherCorrelation);
  }, [timeRange]);

  return (
    <div className="space-y-6">
      <Tabs value={timeRange} onValueChange={setTimeRange}>
        <TabsList>
          <TabsTrigger value="7d">7 giorni</TabsTrigger>
          <TabsTrigger value="30d">30 giorni</TabsTrigger>
          <TabsTrigger value="90d">90 giorni</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Usage Chart */}
      <Card liquid className="p-6">
        <h2>Ore di utilizzo stufa</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="totalHours"
              stroke="#ff6b35"
              fill="#ff6b3550"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Pellet Consumption */}
      <Card liquid className="p-6">
        <h2>Consumo pellet stimato</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'kg', angle: -90 }} />
            <Tooltip />
            <Bar dataKey="pelletKg" fill="#ff6b35" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Weather Correlation */}
      <Card liquid className="p-6">
        <h2>Correlazione temperatura-utilizzo</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weatherCorrelation}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avgTemp"
              stroke="#4ecdc4"
              name="Temperatura (°C)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="stoveHours"
              stroke="#ff6b35"
              name="Ore stufa"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card liquid className="p-4">
          <p className="text-sm text-muted">Accensioni totali</p>
          <p className="text-3xl font-bold text-ember">
            {dailyStats.reduce((sum, day) => sum + day.totalIgnitions, 0)}
          </p>
        </Card>

        <Card liquid className="p-4">
          <p className="text-sm text-muted">Ore totali</p>
          <p className="text-3xl font-bold text-ember">
            {dailyStats.reduce((sum, day) => sum + day.totalHours, 0).toFixed(1)}h
          </p>
        </Card>

        <Card liquid className="p-4">
          <p className="text-sm text-muted">Pellet consumato</p>
          <p className="text-3xl font-bold text-ember">
            {dailyStats.reduce((sum, day) => sum + day.pelletKg, 0).toFixed(1)}kg
          </p>
        </Card>

        <Card liquid className="p-4">
          <p className="text-sm text-muted">Automazione</p>
          <p className="text-3xl font-bold text-ember">
            {calculateSchedulerPercentage(dailyStats)}%
          </p>
        </Card>
      </div>
    </div>
  );
}
```

**Component changes:**

| Component | Change | Lines |
|-----------|--------|-------|
| New: `lib/analyticsLogger.ts` | Log stove events to Firebase RTDB | 80 |
| New: `/app/api/analytics/aggregate-daily/route.ts` | Daily aggregation cron | 120 |
| New: `/app/analytics/page.tsx` | Analytics dashboard UI | 200 |
| Modify: All `/api/stove/*` routes | Add event logging after actions | +5 per route (6 routes) |
| Modify: `/api/scheduler/check/route.ts` | Add weather correlation logging | +20 |

**Performance considerations:**

**RTDB vs Firestore choice:**

| Use Case | Database | Rationale |
|----------|----------|-----------|
| Real-time events | RTDB | Fast writes, 1-day TTL, client listeners |
| Daily stats | RTDB | Fast reads for dashboard, 90-day retention |
| Monthly aggregates | Firestore | Complex queries, unlimited retention, pagination |

**Query optimization:**
- Dashboard fetches daily stats for selected range (7/30/90 days)
- Data pre-aggregated (no on-the-fly calculations)
- Client-side caching via React Query or SWR (future enhancement)

**Cost estimation:**
- RTDB: ~10K events/month (ignite, shutdown, power changes) = negligible
- Firestore: ~12 writes/month (monthly aggregates) = free tier
- Total: < $1/month

---

## Component Dependency Map

**New components for v6.0:**

```
Analytics Dashboard
├── lib/analyticsLogger.ts (event collection)
├── lib/analyticsAggregator.ts (daily/monthly rollup)
├── app/api/analytics/aggregate-daily/route.ts (cron endpoint)
├── app/analytics/page.tsx (visualization)
└── app/analytics/components/
    ├── UsageChart.tsx
    ├── PelletConsumptionChart.tsx
    └── WeatherCorrelationChart.tsx

E2E Testing
├── tests/auth.setup.ts (session state)
├── tests/stove.spec.ts (device control flows)
├── tests/offline.spec.ts (PWA offline mode)
└── playwright.config.ts (project dependencies)

PWA Enhancements
├── lib/hooks/useOnlineStatus.ts (connection detection)
├── app/sw.ts (enhanced handlers)
└── app/components/devices/*/Card.tsx (offline UI)

Persistent Rate Limiting
└── lib/rateLimiterPersistent.ts (Firebase RTDB backend)

Interactive Notifications
├── app/sw.ts (action handlers)
└── lib/notificationTriggersServer.ts (action payloads)

Cron Automation
└── .github/workflows/cron.yml (GitHub Actions scheduler)
```

**Modified components:**

```
Modified (Analytics Events)
├── app/api/stove/ignite/route.ts (+5 lines: log event)
├── app/api/stove/shutdown/route.ts (+5 lines: log event)
├── app/api/stove/setPower/route.ts (+5 lines: log event)
├── app/api/stove/setFan/route.ts (+5 lines: log event)
└── app/api/scheduler/check/route.ts (+20 lines: weather correlation)

Modified (Offline UI)
├── app/components/devices/stove/StoveCard.tsx (+60 lines: offline mode)
└── app/components/devices/thermostat/ThermostatCard.tsx (+60 lines: offline mode)

Modified (Rate Limiting)
└── lib/rateLimiter.ts (→ replace with rateLimiterPersistent.ts)
```

---

## Data Flow Changes

### Before v6.0

**Notification rate limiting:**
```
Notification trigger
  ↓ checkRateLimit() [in-memory Map]
  ↓ allowed=true
Send FCM notification
  ↓ service worker push event
Show notification (basic)
  ↓ user taps notification
Open app to URL
```

**Stove control:**
```
User clicks "Accendi"
  ↓ /api/stove/ignite
Thermorossi Cloud API
  ← 200 OK
UI updates
```

### After v6.0

**Persistent rate limiting:**
```
Notification trigger
  ↓ checkRateLimit() [Firebase RTDB transaction]
  ↓ atomic timestamp append
  ↓ allowed=true (survives cold starts)
Send FCM notification with actions
  ↓ service worker push event
Show notification with buttons
  ↓ user taps action button
Service worker API call (background)
  ↓ /api/stove/ignite
  ← 200 OK
Show success notification
```

**Offline-aware stove control:**
```
User clicks "Accendi" (offline)
  ↓ queueCommand() → IndexedDB
  ↓ UI shows "in coda" badge
... network reconnects ...
  ↓ Background Sync event
Service worker processes queue
  ↓ /api/stove/ignite
  ← 200 OK
  ↓ postMessage to client
UI updates + toast "Comando eseguito"
```

**Analytics collection:**
```
/api/stove/ignite success
  ↓ logStoveEvent() → Firebase RTDB
  ↓ /analytics/stove/events/{eventId}

... midnight cron job ...
  ↓ /api/analytics/aggregate-daily
  ↓ read events for yesterday
  ↓ calculate stats
  ↓ write to dailyStats/{YYYY-MM-DD}
  ↓ delete old events (1-day retention)

... end of month ...
  ↓ aggregate daily → monthly
  ↓ write to Firestore (complex queries + pagination)

Dashboard page loads
  ↓ fetch dailyStats for range
  ↓ Recharts visualization
```

---

## Build Order & Dependencies

**Recommended implementation sequence:**

### Phase 1: Foundation (Week 1)

1. **Cron automation** (0.5 days)
   - Add `.github/workflows/cron.yml`
   - Test with existing `/api/scheduler/check`
   - Validate HMAC security

2. **Persistent rate limiting** (1 day)
   - Implement `lib/rateLimiterPersistent.ts`
   - Write unit tests with Firebase Admin mocks
   - Deploy with feature flag
   - Monitor for 24h, switch fully

3. **E2E test foundation** (1.5 days)
   - Setup `tests/auth.setup.ts`
   - Configure Playwright projects
   - Write first 5 critical flow tests
   - Integrate with GitHub Actions CI

**Milestone 1:** Operational resilience complete (cron running, rate limits persistent, E2E tests passing)

### Phase 2: PWA Enhancements (Week 2)

4. **Interactive push notifications** (1 day)
   - Enhance service worker action handlers
   - Update notification triggers with action payloads
   - Test on Android + iOS PWA

5. **Offline mode UI** (1.5 days)
   - Create `useOnlineStatus` hook
   - Update device cards (offline banner + cached state)
   - Add command queue UI feedback
   - Test offline → online flows

6. **PWA install improvements** (0.5 days)
   - Guided install prompt (BeforeInstallPromptEvent)
   - Settings page with install instructions
   - iOS Safari add-to-home-screen guide

**Milestone 2:** PWA experience enhanced (interactive notifications, offline resilience, install guidance)

### Phase 3: Analytics (Week 3)

7. **Analytics data collection** (1 day)
   - Implement `lib/analyticsLogger.ts`
   - Add event logging to stove API routes
   - Add weather correlation to cron job
   - Test RTDB writes

8. **Analytics aggregation** (1 day)
   - Create `/api/analytics/aggregate-daily` endpoint
   - Implement daily stats calculation
   - Add monthly rollup to Firestore
   - Schedule cron job (midnight + end of month)

9. **Analytics dashboard** (2 days)
   - Build `/app/analytics/page.tsx`
   - Create chart components (usage, pellet, weather correlation)
   - Add time range selector (7d/30d/90d)
   - Add stats cards (totals, automation %)
   - Polish responsive layout

**Milestone 3:** Analytics complete (historical data visualized, correlations shown, insights actionable)

### Total Estimated Effort

**9 work days (1.8 weeks)** for complete v6.0 implementation.

**Breakdown:**
- Cron automation: 0.5 days
- Persistent rate limiting: 1 day
- E2E testing: 1.5 days
- Interactive push: 1 day
- Offline mode: 1.5 days
- PWA install: 0.5 days
- Analytics collection: 1 day
- Analytics aggregation: 1 day
- Analytics dashboard: 2 days

---

## Serverless Constraints & Solutions

**Vercel limitations addressed:**

| Constraint | Impact | Solution |
|------------|--------|----------|
| 10s timeout (Hobby) | Long operations fail | Fire-and-forget async (already implemented in cron) |
| Cold starts | In-memory state lost | Firebase RTDB for rate limits + analytics events |
| Single instance | No in-process sharing | Firebase RTDB transactions (atomic) |
| No cron built-in | Scheduled tasks need external service | GitHub Actions or Upstash (free tier) |
| Stateless functions | Can't persist analytics in memory | RTDB for real-time, Firestore for historical |

**All solutions align with existing architecture patterns** — no new paradigms introduced.

---

## Risk Mitigation

**Potential issues & safeguards:**

1. **Firebase RTDB quota exhaustion** (rate limiter writes)
   - Current: In-memory (zero cost)
   - New: ~1K writes/day (notifications × users)
   - Mitigation: Firebase free tier = 10GB/month downloads, 1GB storage (ample)
   - Monitoring: Firebase console usage dashboard

2. **Analytics storage growth** (unbounded Firestore writes)
   - Risk: Monthly aggregates accumulate indefinitely
   - Mitigation: TTL policy (delete after 2 years) or Firestore auto-delete (future feature)
   - Cost: ~$0.18/GB/month (100 months × 12 docs ≈ 1,200 docs = <1MB)

3. **E2E test flakiness** (Auth0 rate limits)
   - Risk: CI runs too frequently → Auth0 blocks test user
   - Mitigation: Session caching (1 login per test suite, not per test)
   - Fallback: TEST_MODE bypass for rapid iteration

4. **Service worker action compatibility** (iOS Safari)
   - Risk: Notification actions don't work on iOS < 16.4
   - Mitigation: Feature detection + graceful degradation (action missing = body click)
   - User education: Settings page explains iOS requirements

5. **Offline command queue conflicts** (same command queued twice)
   - Risk: User taps "Accendi" multiple times while offline
   - Mitigation: Debounce UI button (disable after first tap until sync)
   - IndexedDB dedupe: Check pending commands before queueing

---

## Testing Strategy

**Unit tests (Jest):**

| Component | Test Coverage |
|-----------|---------------|
| `lib/rateLimiterPersistent.ts` | Transaction safety, window calculations, cleanup |
| `lib/analyticsLogger.ts` | Event schema validation, timestamp generation |
| `lib/analyticsAggregator.ts` | Daily stats calculation, pellet estimation |
| `lib/hooks/useOnlineStatus.ts` | Event listener lifecycle, SSR safety |

**Integration tests (Jest + Firebase Admin mocks):**

| Component | Test Coverage |
|-----------|---------------|
| `/api/analytics/aggregate-daily` | RTDB read → calculate → RTDB/Firestore write |
| Notification triggers | Action payload serialization |

**E2E tests (Playwright):**

| Flow | Assertions |
|------|-----------|
| Stove ignite (online) | Button click → API call → status updates |
| Stove ignite (offline) | Button click → queue UI → sync on reconnect |
| Notification action | Push received → action button → API call → success toast |
| Analytics dashboard | Load data → charts render → time range switch |
| Offline mode | Go offline → banner shows → cached data displays |

**Manual testing checklist:**

- [ ] GitHub Actions cron triggers endpoint successfully
- [ ] Rate limiter survives Vercel deployment (check Firebase RTDB)
- [ ] Notification actions work on Android Chrome
- [ ] Notification actions gracefully degrade on iOS Safari <16.4
- [ ] Offline banner appears when network disconnects
- [ ] Queued commands execute after reconnection
- [ ] Analytics charts render with 30-day data
- [ ] Pellet consumption calculation matches expected formula

---

## Sources

**Playwright + Auth0:**
- [End-to-End Testing Auth Flows with Playwright and Next.js](https://testdouble.com/insights/how-to-test-auth-flows-with-playwright-and-next-js)
- [Auth0 Community: Mock auth0 login and MFA flow for E2E testing using Playwright](https://community.auth0.com/t/mock-auth0-login-and-mfa-flow-for-e2e-testing-using-playwright/131872)
- [Testing with Next.js 15, Playwright, MSW, and Supabase](https://micheleong.com/blog/testing-with-nextjs-15-and-playwright-msw-and-supabase)

**Firebase Cloud Messaging Actions:**
- [Implementing Action Buttons in Push Notifications using Firebase and Notifee](https://medium.com/@hassem_mahboob/implementing-action-buttons-in-push-notifications-using-firebase-and-notifee-f5743bdb28bc)
- [Firebase Cloud Messaging | React Native Firebase](https://rnfirebase.io/messaging/usage)

**Vercel Serverless Cron:**
- [How to Run Cron Jobs in a Vercel Serverless Environment (Without Paying Extra)](https://dev.to/hexshift/how-to-run-cron-jobs-in-a-vercel-serverless-environment-without-paying-extra-502h)
- [Render vs Vercel (2026): Which platform suits your app architecture better?](https://northflank.com/blog/render-vs-vercel)

**Firebase Rate Limiting:**
- [firebase-functions-rate-limiter - npm](https://www.npmjs.com/package/firebase-functions-rate-limiter)
- [Tutorial: Firestore Rate Limiting | Fireship.io](https://fireship.io/lessons/how-to-rate-limit-writes-firestore/)

**Serwist Offline Fallback:**
- [Building an Offline-First Next.js 15 App with App Router and Dynamic Routes](https://github.com/vercel/next.js/discussions/82498)
- [PrecacheFallbackPlugin - Plugins - serwist](https://serwist.pages.dev/docs/serwist/runtime-caching/plugins/precache-fallback-plugin)

**Firebase RTDB vs Firestore:**
- [Choose a Database: Cloud Firestore or Realtime Database](https://firebase.google.com/docs/database/rtdb-vs-firestore)
- [Firebase Realtime Database vs. Firestore: Choosing the Right Tool for Your App](https://www.oreateai.com/blog/firebase-realtime-database-vs-firestore-choosing-the-right-tool-for-your-app/0278ccc2c418b4cb92ddca5da03822e1)

**Next.js PWA Analytics:**
- [Serverless Realtime Analytics for Next.js with Vercel Edge, Upstash Kafka and Tinybird](https://upstash.com/blog/kafka-tinybird-vercel-edge)

---

**Last Updated:** 2026-02-10
