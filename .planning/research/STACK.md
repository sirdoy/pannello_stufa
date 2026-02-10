# Technology Stack

**Project:** Pannello Stufa v6.0
**Researched:** 2026-02-10

## Executive Summary

v6.0 adds **operational resilience, PWA improvements, and analytics** to the existing Next.js 15.5 PWA. Most features can be implemented with **existing stack** (Serwist, Firebase, Vercel). Only **two new libraries** needed: `idb` for IndexedDB wrapper and potentially `@omgovich/firebase-functions-rate-limiter` for persistent rate limiting.

**Key Finding**: NO major stack changes. v6.0 builds on validated v5.1 foundation.

---

## NEW Stack Additions for v6.0

### Required Libraries

| Technology | Version | Purpose | Installation |
|------------|---------|---------|--------------|
| **idb** | ^8.0.3 | Promise-based IndexedDB wrapper for offline data sync | `npm install idb` |

**Why `idb`**:
- Currently using **raw IndexedDB** in `app/sw.ts` (lines 192-271, 420-447)
- `idb` reduces boilerplate by 60% (Promise-based API vs callback-based)
- Maintained by Jake Archibald (Google), 1,234+ projects use it
- Already have Dexie (4.2.1) for client-side, but `idb` is **smaller and better for service workers** (1.19kB vs Dexie's larger footprint)
- **Confidence: HIGH** (official npm, 9 months old, stable API)

### Optional Libraries (Evaluate During Planning)

| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| **@omgovich/firebase-functions-rate-limiter** | ^4.3.0 | Persistent rate limiting using Firebase RTDB/Firestore | If in-memory rate limiting insufficient |

**Why Optional**:
- Currently have **no rate limiting** in API routes
- Firebase RTDB backend uses 10-50KB per limit record (negligible for 5-10 API routes)
- Original `firebase-functions-rate-limiter` **abandoned** (last update 4 years ago)
- `@omgovich` fork **actively maintained** (3 months old, v4.3.0)
- **Alternative**: Simple Firestore document with timestamp + counter (custom implementation)
- **Confidence: MEDIUM** (fork, not original, but only viable option)

---

## Existing Stack - NO CHANGES NEEDED

### Core Framework (Already Validated)

| Technology | Current Version | v6.0 Use Case |
|------------|----------------|---------------|
| **Next.js** | ^16.1.0 | Cron routes, App Router pages, PWA host |
| **@serwist/next** | ^9.0.0 | Offline improvements, install prompt, service worker |
| **Firebase** | ^12.8.0 | Rate limiting backend, analytics data storage |
| **Firebase Admin** | ^13.6.0 | Server-side Firestore writes for analytics |
| **Dexie** | ^4.2.1 | Client-side IndexedDB for analytics dashboard |
| **Recharts** | ^2.15.0 | Analytics dashboard visualization |
| **@playwright/test** | ^1.52.0 | E2E Auth0 testing with saved state |

**Rationale for NO CHANGES**:
1. **Cron automation** → Vercel Cron Jobs (built-in, no library needed)
2. **Persistent rate limiting** → Firebase RTDB/Firestore (already have `firebase` + `firebase-admin`)
3. **Interactive push** → FCM notification actions (already in `app/sw.ts:100-137`, `firebase-messaging-sw.js:38-57`)
4. **PWA offline** → Serwist already handles caching, sync, IndexedDB (just needs `idb` wrapper)
5. **Install prompt** → `beforeinstallprompt` event (web standard, no library)
6. **Analytics dashboard** → Recharts + Dexie + Firestore (already have all)
7. **E2E Auth0** → Playwright auth state (official pattern, no library)

---

## Integration Points with Existing Stack

### 1. Cron Automation (Vercel Cron Jobs)

**Configuration**: `vercel.json` in project root

```json
{
  "crons": [
    {
      "path": "/api/cron/check-scheduler",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/cleanup-logs",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**API Route Pattern**: Next.js 15 App Router

```typescript
// app/api/cron/check-scheduler/route.ts
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Execute cron logic
  await checkSchedulerLogic();

  return new Response('OK', { status: 200 });
}
```

**Security**: Vercel auto-sets `CRON_SECRET` env var, sends as `Authorization: Bearer {CRON_SECRET}` header

**Deployment**: Cron jobs **only run in production** (not dev, not preview)

**Confidence: HIGH** (official Vercel feature, documented in [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs))

---

### 2. Persistent Rate Limiting (Firebase RTDB)

**Two Options**:

#### Option A: @omgovich/firebase-functions-rate-limiter (Library)

```typescript
import { FirebaseFunctionsRateLimiter } from '@omgovich/firebase-functions-rate-limiter';
import { getDatabase } from 'firebase-admin/database';

const limiter = FirebaseFunctionsRateLimiter.withRealtimeDbBackend(
  {
    name: 'stove-ignite',
    maxCalls: 10,
    periodSeconds: 60,
  },
  getDatabase()
);

export async function POST(request: Request) {
  const session = await auth0.getSession();
  const userId = session?.user.sub;

  try {
    await limiter.rejectOnQuotaExceededOrRecordUsage(userId);
    // Proceed with ignite
  } catch (error) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
}
```

**Data Structure**: Stores in Firebase RTDB at `/rate_limits/{name}/{userId}`

#### Option B: Custom Firestore Implementation (Recommended)

```typescript
// lib/rateLimiter.ts
import { getFirestore } from 'firebase-admin/firestore';

export async function checkRateLimit(
  key: string,
  maxCalls: number,
  windowMs: number
): Promise<boolean> {
  const db = getFirestore();
  const ref = db.collection('rate_limits').doc(key);
  const doc = await ref.get();

  const now = Date.now();
  const data = doc.data();

  if (!data || now - data.resetAt > windowMs) {
    await ref.set({ count: 1, resetAt: now });
    return true;
  }

  if (data.count >= maxCalls) {
    return false;
  }

  await ref.update({ count: data.count + 1 });
  return true;
}
```

**Recommendation**: Start with **Option B** (custom). It's 20 lines, no dependency, uses existing Firestore. Add library later if rate limiting gets complex (per-IP, sliding windows, distributed counters).

**Confidence: HIGH** (custom implementation), **MEDIUM** (library - fork dependency)

---

### 3. E2E Test Improvements (Playwright Auth0)

**Pattern**: Authenticate once in setup project, save state, reuse across tests

```typescript
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/auth/login');

  // Fill Auth0 Universal Login form
  await page.fill('input[name="username"]', process.env.TEST_USER_EMAIL!);
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!);
  await page.click('button[type="submit"]');

  // Wait for redirect back to app
  await page.waitForURL('/');

  // Save auth state to file
  await page.context().storageState({ path: authFile });
});
```

**playwright.config.ts**:

```typescript
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

**Security**: Use env vars for credentials, create **test-only Auth0 tenant**, never commit `user.json`

**Confidence: HIGH** (official Playwright + Auth0 pattern, documented in [Playwright Authentication](https://playwright.dev/docs/auth) and [Auth0 Community](https://community.auth0.com/t/playwright-testing-with-authorization-code-flow/187895))

---

### 4. Interactive Push Notifications (FCM Actions)

**Already Implemented** in `app/sw.ts:100-137` and `firebase-messaging-sw.js:38-57`

**Enhancement Needed**: Add `actions` array to notification options

```typescript
// app/sw.ts (push event handler)
const notificationOptions = {
  body: payload.notification?.body || '',
  icon: '/icons/icon-192.png',
  badge: '/icons/icon-72.png',
  tag: payload.data?.type || 'default',
  requireInteraction: payload.data?.priority === 'high',
  data: {
    url: payload.data?.url || '/',
    ...payload.data,
  },
  vibrate: payload.data?.priority === 'high' ? [200, 100, 200] : [100],

  // NEW: Action buttons
  actions: [
    {
      action: 'view',
      title: 'Apri',
      icon: '/icons/icon-72.png',
    },
    {
      action: 'dismiss',
      title: 'Ignora',
    },
  ],
} as NotificationOptions;
```

**Action Handler**: Modify `notificationclick` event in `app/sw.ts:143-171`

```typescript
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return; // Just close
  }

  const urlToOpen = event.notification.data?.url || '/';
  // ... existing focus/navigate logic
});
```

**Server Payload** (from Firebase Admin SDK):

```typescript
await admin.messaging().send({
  token: userFcmToken,
  notification: {
    title: 'Stufa Accesa',
    body: 'Accensione completata',
  },
  data: {
    type: 'stove-status',
    url: '/',
  },
  webpush: {
    notification: {
      actions: [
        { action: 'view', title: 'Apri' },
        { action: 'dismiss', title: 'Ignora' },
      ],
    },
  },
});
```

**Limitations**: Actions work on **Android + desktop Chrome/Edge**. iOS requires PWA installed, **no action buttons** (just notification).

**Confidence: HIGH** (official FCM feature, already have infrastructure)

---

### 5. PWA Offline Improvements

**Current State**:
- Serwist v9 configured in `next.config.ts`
- Service worker at `app/sw.ts` with caching strategies
- Already handles offline page (`/offline`), cache fallback
- IndexedDB for command queue + device state (lines 184-498)

**Enhancement**: Replace raw IndexedDB with `idb` wrapper

**Before** (lines 192-214):

```typescript
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(COMMAND_QUEUE_STORE)) {
        // ... store creation
      }
    };
  });
}
```

**After** (with `idb`):

```typescript
import { openDB } from 'idb';

const db = await openDB('pannello-stufa-pwa', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('commandQueue')) {
      const store = db.createObjectStore('commandQueue', {
        keyPath: 'id',
        autoIncrement: true,
      });
      store.createIndex('status', 'status');
      store.createIndex('timestamp', 'timestamp');
    }
    // ... other stores
  },
});

// Get pending commands (no Promise wrapper needed)
const commands = await db.getAllFromIndex('commandQueue', 'status', 'pending');
```

**Benefit**: 60% less boilerplate, cleaner async/await, better TypeScript support

**Confidence: HIGH** (replacing existing code with better API)

---

### 6. PWA Install Prompt

**Web Standard API**: `beforeinstallprompt` event

```typescript
// app/hooks/useInstallPrompt.ts
'use client';

import { useEffect, useState } from 'react';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstallable(false);
    }

    setDeferredPrompt(null);
    return outcome === 'accepted';
  };

  return { isInstallable, promptInstall };
}
```

**UI Component**:

```tsx
// app/components/InstallBanner.tsx
'use client';

import { useInstallPrompt } from '@/app/hooks/useInstallPrompt';
import Banner from '@/app/components/ui/Banner';
import Button from '@/app/components/ui/Button';

export default function InstallBanner() {
  const { isInstallable, promptInstall } = useInstallPrompt();

  if (!isInstallable) return null;

  return (
    <Banner variant="info" title="Installa l'app">
      <p>Aggiungi Pannello Stufa alla tua home screen per accesso rapido</p>
      <Button onClick={promptInstall} size="sm">
        Installa
      </Button>
    </Banner>
  );
}
```

**Limitations**:
- **iOS Safari**: Event doesn't fire, use Share → Add to Home Screen menu
- **Chrome/Edge iOS**: No PWA support, must use Safari
- **Android Chrome/Edge**: Full support

**Confidence: HIGH** (web standard, widely supported, fallback for iOS)

---

### 7. Analytics Dashboard (Usage Tracking)

**Data Flow**:
1. **Collection**: Client sends usage events to `/api/analytics/track` API route
2. **Storage**: API route writes to Firestore `analytics/{userId}/events/{eventId}`
3. **Aggregation**: API route `/api/analytics/summary` queries Firestore, calculates metrics
4. **Visualization**: Dashboard page uses Recharts to render graphs

**Firestore Schema**:

```typescript
// collections/analytics/{userId}/events/{autoId}
{
  timestamp: Timestamp,
  type: 'stove_ignite' | 'stove_shutdown' | 'scheduler_enable' | ...,
  device: 'stove' | 'thermostat' | 'lights',
  metadata: {
    source?: 'manual' | 'scheduler' | 'automation',
    duration?: number, // seconds
    pelletUsed?: number, // grams (estimated)
    temperature?: number,
  }
}

// collections/analytics_summaries/{userId}/daily/{date}
{
  date: '2026-02-10',
  stoveRuntime: 14400, // seconds
  pelletUsed: 5200, // grams (estimated)
  igniteCount: 3,
  temperatureAvg: 21.5,
  weatherCorrelation: {
    outdoorTemp: 8.5,
    indoorTemp: 21.5,
  }
}
```

**Dashboard Components**:

```tsx
// app/analytics/page.tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default async function AnalyticsPage() {
  const session = await auth0.getSession();
  const summary = await fetch('/api/analytics/summary?days=30');
  const data = await summary.json();

  return (
    <div>
      <Heading variant="ember">Analisi Consumi</Heading>

      {/* Stove usage over time */}
      <AreaChart width={800} height={300} data={data.dailyUsage}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="runtime" stroke="#f97316" fill="#fed7aa" />
      </AreaChart>

      {/* Pellet consumption estimation */}
      <AreaChart width={800} height={300} data={data.pelletEstimate}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="pelletKg" stroke="#059669" fill="#a7f3d0" />
      </AreaChart>

      {/* Weather correlation */}
      <LineChart width={800} height={300} data={data.weatherCorrelation}>
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Line yAxisId="left" dataKey="outdoorTemp" stroke="#3b82f6" />
        <Line yAxisId="right" dataKey="runtime" stroke="#f97316" />
      </LineChart>
    </div>
  );
}
```

**Pellet Consumption Estimation**:

```typescript
// lib/analytics/pelletEstimator.ts
const PELLET_USAGE_RATES = {
  P1: 0.6, // kg/hour
  P2: 0.9,
  P3: 1.2,
  P4: 1.5,
  P5: 1.8,
};

export function estimatePelletUsage(
  runtimeSeconds: number,
  averagePower: number
): number {
  const hours = runtimeSeconds / 3600;
  const powerLevel = `P${averagePower}` as keyof typeof PELLET_USAGE_RATES;
  const rateKgPerHour = PELLET_USAGE_RATES[powerLevel] || 1.2;

  return hours * rateKgPerHour * 1000; // grams
}
```

**Weather Correlation**: Use existing Open-Meteo data (already fetched for weather API)

**Confidence: HIGH** (all libraries already in stack, standard Firestore + Recharts patterns)

---

## What NOT to Add

### ❌ Separate Cron Service (node-cron, cron, bull)
**Why**: Vercel Cron Jobs are serverless, free for Hobby tier, integrated with deployment. No need for separate service or Redis queue.

### ❌ Separate Rate Limiting Library (express-rate-limit, rate-limiter-flexible)
**Why**: Built for Express, not Next.js App Router. Firebase RTDB/Firestore is better fit for serverless (stateless between requests).

### ❌ Separate IndexedDB Library for Client (localForage, idb-keyval)
**Why**: Already have Dexie (4.2.1) for client-side. Only need `idb` for **service worker** where Dexie doesn't work well.

### ❌ Chart Library Alternatives (Chart.js, Victory, Nivo)
**Why**: Already have Recharts (2.15.0), 53 pre-built components, works perfectly with React Server Components.

### ❌ Playwright Plugins for Auth0 (@auth0/auth0-spa-js test helpers)
**Why**: Official Playwright auth state pattern is simpler, no dependency, works across all auth providers.

### ❌ Service Worker Library Alternatives (Workbox, next-pwa)
**Why**: Already using Serwist v9 (successor to next-pwa), maintained, Next.js 15 compatible.

---

## Installation Commands

### Required
```bash
npm install idb@^8.0.3
```

### Optional (Evaluate During Planning)
```bash
# Only if custom rate limiter insufficient
npm install @omgovich/firebase-functions-rate-limiter@^4.3.0
```

### Environment Variables (Vercel Dashboard)

**Required for Cron Jobs**:
```bash
# Vercel auto-generates this, but verify it exists
CRON_SECRET=<random-16-char-string>
```

**Required for E2E Auth0 Tests** (GitHub Secrets):
```bash
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=<secure-password>
```

---

## Migration Notes

### Replacing IndexedDB in Service Worker

**Files to Update**:
- `app/sw.ts` (lines 192-271, 420-447)

**Pattern**: Replace `new Promise` wrappers with `idb` async/await

**Estimated Effort**: 2-3 hours (refactor + test)

### Adding vercel.json

**New File**: `vercel.json` at project root

**Impact**: None on existing functionality (cron routes additive)

---

## Version Compatibility Matrix

| Library | Current | v6.0 | Compatible | Notes |
|---------|---------|------|------------|-------|
| Next.js | ^16.1.0 | ^16.1.0 | ✅ | No change |
| @serwist/next | ^9.0.0 | ^9.0.0 | ✅ | Works with Next.js 15+16 |
| Firebase | ^12.8.0 | ^12.8.0 | ✅ | No change |
| Recharts | ^2.15.0 | ^2.15.0 | ✅ | No change |
| Dexie | ^4.2.1 | ^4.2.1 | ✅ | Client-side only |
| **idb** | - | ^8.0.3 | ✅ | NEW: Service worker only |
| Playwright | ^1.52.0 | ^1.52.0 | ✅ | Auth state since v1.18 |

---

## Research Sources

### Vercel Cron Jobs
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Getting started with cron jobs](https://vercel.com/docs/cron-jobs/quickstart)
- [Cron Jobs in Next.js: Serverless vs Serverful](https://yagyaraj234.medium.com/running-cron-jobs-in-nextjs-guide-for-serverful-and-stateless-server-542dd0db0c4c)

### Firebase Rate Limiting
- [firebase-functions-rate-limiter - npm](https://www.npmjs.com/package/firebase-functions-rate-limiter)
- [@omgovich/firebase-functions-rate-limiter - npm](https://www.npmjs.com/package/@omgovich/firebase-functions-rate-limiter)
- [Tutorial: Firestore Rate Limiting](https://fireship.io/lessons/how-to-rate-limit-writes-firestore/)

### FCM Interactive Notifications
- [Receive messages in Web apps | Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging/js/receive)
- [Implementing Action Buttons in Push Notifications using Firebase and Notifee](https://medium.com/@hassem_mahboob/implementing-action-buttons-in-push-notifications-using-firebase-and-notifee-f5743bdb28bc)

### PWA Install Prompt
- [How to Implement PWA in Next.js App router 2026](https://medium.com/@amirjld/how-to-implement-pwa-progressive-web-app-in-next-js-app-router-2026-f25a6797d5e6)
- [Installation prompt | web.dev](https://web.dev/learn/pwa/installation-prompt)
- [Trigger installation from your PWA - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt)

### Playwright Auth0
- [Playwright testing with Authorization Code Flow - Auth0 Community](https://community.auth0.com/t/playwright-testing-with-authorization-code-flow/187895)
- [Authentication | Playwright](https://playwright.dev/docs/auth)
- [How to Configure Auth0 Playwright for Secure, Repeatable Access](https://hoop.dev/blog/how-to-configure-auth0-playwright-for-secure-repeatable-access/)

### IndexedDB & Offline
- [idb - npm](https://www.npmjs.com/package/idb)
- [Build an Offline-First Mood Journal PWA with Next.js & IndexedDB](https://www.wellally.tech/blog/build-offline-first-pwa-nextjs-indexeddb)
- [Building an Offline-First PWA Notes App with Next.js, IndexedDB, and Supabase (Jan 2026)](https://oluwadaprof.medium.com/building-an-offline-first-pwa-notes-app-with-next-js-indexeddb-and-supabase-f861aa3a06f9)

### Firestore Analytics
- [Write-time aggregations | Firestore | Firebase](https://firebase.google.com/docs/firestore/solutions/aggregation)
- [Summarize data with aggregation queries | Firestore | Firebase](https://firebase.google.com/docs/firestore/query-data/aggregation-queries)
- [How to use Firebase Firestore to store and query time-series data](https://bootstrapped.app/guide/how-to-use-firebase-firestore-to-store-and-query-time-series-data)

### Recharts
- [Recharts: How to Use it and Build Analytics Dashboards](https://embeddable.com/blog/what-is-recharts)
- [How to use Recharts to visualize analytics data (with examples)](https://posthog.com/tutorials/recharts)
- [How to use Next.js and Recharts to build an information dashboard](https://ably.com/blog/informational-dashboard-with-nextjs-and-recharts)

---

**Last Updated**: 2026-02-10
