# Architecture Research: Fritz!Box Network Monitoring Integration

**Domain:** Network monitoring device integration (Fritz!Box)
**Researched:** 2026-02-13
**Confidence:** HIGH

## Integration Overview

Fritz!Box network monitoring integrates into the existing Pannello Stufa smart home PWA using established patterns. The integration follows the **device card registry pattern** with **orchestrator architecture** and **server-side API proxy** used throughout the codebase.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Dashboard (app/page.tsx)                                            │
│    ├─ StoveCard (existing)                                           │
│    ├─ ThermostatCard (existing)                                      │
│    ├─ LightsCard (existing)                                          │
│    └─ NetworkCard (NEW)  ←── Orchestrator pattern                   │
│         ├─ useNetworkData() ←── Polling + state                     │
│         ├─ useNetworkCommands() ←── Actions                         │
│         └─ Presentational components                                 │
├─────────────────────────────────────────────────────────────────────┤
│                        API PROXY LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│  app/api/network/                                                    │
│    ├─ status/route.ts ←── Connection check                          │
│    ├─ devices/route.ts ←── List devices with pagination             │
│    ├─ devices/[id]/route.ts ←── Device details                      │
│    └─ bandwidth/route.ts ←── Aggregate bandwidth stats              │
│         │                                                             │
│         ├─ Middleware: withAuthAndErrorHandler                       │
│         ├─ Rate limiting: lib/rateLimiter (NEW)                     │
│         └─ Calls: Fritz!Box REST API with X-API-Key                 │
├─────────────────────────────────────────────────────────────────────┤
│                        EXTERNAL API                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Fritz!Box REST API                                                  │
│    ├─ Authentication: X-API-Key header                              │
│    ├─ Rate limit: 10 req/min                                        │
│    ├─ Pagination: limit/offset                                      │
│    └─ Errors: RFC 9457 Problem Details                              │
├─────────────────────────────────────────────────────────────────────┤
│                        DATA PERSISTENCE                              │
├─────────────────────────────────────────────────────────────────────┤
│  Firebase RTDB                                                       │
│    └─ network/                                                       │
│         ├─ lastDevicesFetch (TTL cache)                             │
│         ├─ devices (cached list)                                    │
│         └─ rateLimits/ (request tracking)                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## New Components

### Dashboard Card

**File:** `app/components/devices/network/NetworkCard.tsx`

**Responsibilities:**
- Display connection status (online/offline)
- Show active devices count
- Show aggregate bandwidth usage (down/up)
- Connection button when not configured
- Link to full `/network` page

**Pattern:** Orchestrator (hooks + presentational components)

**Structure:**
```typescript
NetworkCard (orchestrator ~200 LOC)
  ├─ useNetworkData() // Polling, state, Firebase cache
  │   ├─ useAdaptivePolling() // Tab visibility, network quality
  │   ├─ useVisibility()
  │   └─ Firebase: 5-min TTL cache (like Netatmo)
  │
  ├─ useNetworkCommands() // No commands for read-only monitoring
  │
  └─ Presentational components
      ├─ NetworkStatus (connection indicator)
      ├─ NetworkSummary (devices count, bandwidth)
      └─ NetworkBanners (error, API rate limit)
```

**Design System:**
- `DeviceCard` wrapper (like LightsCard)
- `colorTheme="ocean"` (network theme)
- `HealthIndicator` for connection status
- `Badge` for device counts
- `Banner` for errors (API rate limit, connection issues)

---

### Full Network Page

**File:** `app/network/page.tsx`

**Sections:**
1. **Overview** - Aggregate stats (total devices, bandwidth usage)
2. **Active Devices** - Paginated table with device list
3. **Device Details** - Selected device bandwidth history
4. **Settings** - API key configuration, refresh interval

**Components:**
```
app/network/
  ├─ page.tsx (server component, auth check)
  └─ components/
      ├─ NetworkOverview.tsx
      ├─ DevicesTable.tsx (pagination, sorting)
      ├─ DeviceDetails.tsx (bandwidth chart)
      └─ NetworkSettings.tsx
```

---

### API Proxy Routes

**Directory:** `app/api/network/`

| Route | Method | Purpose | Notes |
|-------|--------|---------|-------|
| `/api/network/status` | GET | Connection check | Returns `{ connected: boolean, api_key_valid: boolean }` |
| `/api/network/devices` | GET | List devices | Supports `?limit=20&offset=0` pagination |
| `/api/network/devices/[id]` | GET | Device details | Returns device info + bandwidth stats |
| `/api/network/bandwidth` | GET | Aggregate stats | Total bandwidth across all devices |

**Middleware Stack:**
```typescript
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  // Rate limit check (10 req/min to Fritz!Box API)
  await checkRateLimit('network', session.user.sub);

  // Call Fritz!Box REST API
  const response = await fetch(`${FRITZBOX_API_URL}/devices`, {
    headers: {
      'X-API-Key': process.env.FRITZBOX_API_KEY,
    },
  });

  // Handle RFC 9457 errors
  if (!response.ok) {
    const problem = await response.json();
    throw new Error(problem.detail || 'Fritz!Box API error');
  }

  // Cache in Firebase (5-min TTL)
  await cacheNetworkData(data);

  return success({ devices: data });
}, 'Network/Devices');
```

---

### Supporting Libraries

**File:** `lib/network/fritzboxApi.ts`

**Responsibilities:**
- Fritz!Box REST API wrapper
- Request/response types
- Error mapping (RFC 9457 → app errors)

**Example:**
```typescript
export interface FritzBoxDevice {
  id: string;
  name: string;
  ip: string;
  mac: string;
  online: boolean;
  bandwidth: {
    download: number; // bytes/sec
    upload: number;
  };
}

export async function getDevices(
  limit: number = 20,
  offset: number = 0
): Promise<{ devices: FritzBoxDevice[]; total: number }> {
  const response = await fetch(
    `${process.env.FRITZBOX_API_URL}/devices?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'X-API-Key': process.env.FRITZBOX_API_KEY!,
      },
    }
  );

  if (!response.ok) {
    // RFC 9457 error handling
    const problem = await response.json();
    throw new FritzBoxError(problem.detail, problem.type);
  }

  return response.json();
}
```

**File:** `lib/rateLimiter.ts` (NEW)

**Responsibilities:**
- Track API requests to Fritz!Box (10 req/min limit)
- Firebase RTDB for persistence
- Per-user tracking
- Sliding window algorithm

**Example:**
```typescript
export async function checkRateLimit(
  apiName: string,
  userId: string
): Promise<void> {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const rateLimitRef = ref(db, `network/rateLimits/${userId}`);
  const snapshot = await get(rateLimitRef);

  const requests = snapshot.val() || [];
  const recentRequests = requests.filter(
    (ts: number) => ts > now - windowMs
  );

  if (recentRequests.length >= maxRequests) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }

  // Record this request
  await update(rateLimitRef, {
    requests: [...recentRequests, now],
  });
}
```

---

## Modified Components

### Dashboard Registry

**File:** `app/page.tsx`

**Change:** Add NetworkCard to `CARD_COMPONENTS` registry.

```typescript
const CARD_COMPONENTS: Record<string, React.ComponentType> = {
  stove: StoveCard,
  thermostat: ThermostatCard,
  weather: WeatherCardWrapper,
  lights: LightsCard,
  camera: CameraCard,
  network: NetworkCard, // NEW
};

const DEVICE_META: Record<string, { name: string; icon: string }> = {
  stove: { name: 'Stufa', icon: '🔥' },
  thermostat: { name: 'Termostato', icon: '🌡️' },
  weather: { name: 'Meteo', icon: '☀️' },
  lights: { name: 'Luci', icon: '💡' },
  camera: { name: 'Camera', icon: '📷' },
  network: { name: 'Rete', icon: '🌐' }, // NEW
};
```

**Impact:** Card automatically appears in dashboard when enabled in unified device config.

---

### Device Config

**File:** `lib/devices/deviceTypes.ts`

**Change:** Add `network` device type.

```typescript
export type DeviceTypeId =
  | 'stove'
  | 'thermostat'
  | 'camera'
  | 'lights'
  | 'sonos'
  | 'network'; // NEW

export const DEVICE_TYPES = {
  STOVE: 'stove',
  THERMOSTAT: 'thermostat',
  CAMERA: 'camera',
  LIGHTS: 'lights',
  SONOS: 'sonos',
  NETWORK: 'network', // NEW
} as const;

export const DEVICE_CONFIG: Record<DeviceTypeId, DeviceConfig> = {
  // ... existing devices
  [DEVICE_TYPES.NETWORK]: {
    id: 'network',
    name: 'Rete',
    icon: '🌐',
    color: 'ocean',
    enabled: false, // Start disabled
    routes: {
      main: '/network',
    },
    features: {
      hasScheduler: false,
      hasMaintenance: false,
      hasErrors: false,
    },
  },
};
```

**Impact:** Device available in settings, can be enabled/disabled, navbar item auto-generated.

---

### Navbar

**File:** `app/components/Navbar.tsx`

**Change:** None required — device menu auto-generates from `DEVICE_CONFIG`.

**Impact:** `/network` link appears automatically when device is enabled.

---

## Data Flow

### Dashboard Card Polling

```
1. NetworkCard mounts
     ↓
2. useNetworkData() → useAdaptivePolling(callback, 30000ms)
     ↓
3. Every 30s (or on tab visibility restore):
     ↓
4. fetch('/api/network/status')
     ↓
5. API route checks Firebase cache (TTL: 5 min)
     ├─ Cache hit → Return cached data
     └─ Cache miss → Call Fritz!Box API
           ↓
6. Fritz!Box REST API (X-API-Key auth)
     ↓
7. Rate limit check (10 req/min)
     ↓
8. Response cached in Firebase
     ↓
9. Return to client → Update state → Re-render
```

**Key Points:**
- **Adaptive polling:** Pauses when tab hidden (unless `alwaysActive: true`)
- **Firebase cache:** Reduces Fritz!Box API calls (10 req/min limit)
- **Retry client:** Auto-retries transient errors (network, timeout)
- **Error boundaries:** Crashes isolated to NetworkCard (doesn't break dashboard)

---

### Full Page Pagination

```
1. User visits /network
     ↓
2. Server component checks Auth0 session
     ├─ No session → Redirect to /auth/login
     └─ Valid session → Render page
           ↓
3. Client component loads
     ↓
4. fetch('/api/network/devices?limit=20&offset=0')
     ↓
5. API route → Fritz!Box API pagination
     ↓
6. Return { devices: [...], total: 150 }
     ↓
7. Client renders table with pagination controls
     ↓
8. User clicks "Next" → offset=20
     ↓
9. Repeat fetch with new offset
```

**Pagination Pattern:**
- **Limit/offset:** Simple, allows jumping to arbitrary pages
- **Total count:** Included in response for pagination UI
- **Trade-off:** Offset pagination can skip/duplicate if data changes (acceptable for network monitoring)

---

## Architectural Patterns

### Pattern 1: Orchestrator Card

**What:** Separate state/commands (hooks) from presentation (components).

**Why used here:**
- Consistent with existing StoveCard, LightsCard, ThermostatCard
- Easy to test (hooks testable separately from UI)
- Single polling loop guarantee (only in useNetworkData)

**Example:**
```typescript
// NetworkCard.tsx (orchestrator)
export default function NetworkCard() {
  const networkData = useNetworkData(); // All state
  const commands = useNetworkCommands(networkData); // All actions (none for read-only)

  return (
    <DeviceCard colorTheme="ocean" connected={networkData.connected}>
      <NetworkStatus status={networkData.status} />
      <NetworkSummary devices={networkData.devices} bandwidth={networkData.bandwidth} />
    </DeviceCard>
  );
}

// useNetworkData.ts (hook)
export function useNetworkData() {
  const [status, setStatus] = useState(null);

  useAdaptivePolling({
    callback: async () => {
      const res = await fetch('/api/network/status');
      setStatus(await res.json());
    },
    interval: 30000, // 30s
  });

  return { status, connected: status?.connected };
}
```

---

### Pattern 2: Server-Side API Proxy

**What:** Next.js API routes proxy external APIs, hide secrets server-side.

**Why used here:**
- Fritz!Box API key stays server-side (never exposed to client)
- Rate limiting enforced before external API call
- Response transformation (RFC 9457 → app error format)
- Firebase caching layer

**Example:**
```typescript
// app/api/network/devices/route.ts
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  // Rate limit (10 req/min)
  await checkRateLimit('network', session.user.sub);

  // Check Firebase cache (5-min TTL)
  const cached = await getNetworkCache('devices');
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return success(cached.data);
  }

  // Call external API
  const response = await fetch(`${FRITZBOX_API_URL}/devices`, {
    headers: { 'X-API-Key': process.env.FRITZBOX_API_KEY! },
  });

  if (!response.ok) {
    // RFC 9457 error handling
    const problem = await response.json();
    throw new Error(problem.detail);
  }

  const data = await response.json();

  // Cache response
  await setNetworkCache('devices', data);

  return success(data);
}, 'Network/Devices');
```

**Benefits:**
- Environment variables (API key) never leak to client
- Rate limiting prevents quota exhaustion
- Caching reduces external API calls
- Error transformation (RFC 9457 → friendly messages)

---

### Pattern 3: Adaptive Polling with Visibility

**What:** Pause polling when tab hidden, resume immediately when visible.

**Why used here:**
- Saves bandwidth (no requests when user not looking)
- Fresh data on tab restore (immediate fetch)
- Consistent with other device cards (StoveCard, LightsCard)

**Example:**
```typescript
useAdaptivePolling({
  callback: fetchNetworkStatus,
  interval: 30000, // 30s
  alwaysActive: false, // Pause when tab hidden
  immediate: true, // Fetch on mount
});
```

**Trade-offs:**
- **Pros:** Lower bandwidth, better battery, fresh data on restore
- **Cons:** Data can be stale if tab hidden for long periods
- **For network monitoring:** `alwaysActive: false` is correct (not safety-critical like stove maintenance)

---

### Pattern 4: Firebase TTL Cache

**What:** Cache external API responses in Firebase RTDB with timestamp-based expiration.

**Why used here:**
- Fritz!Box API has 10 req/min rate limit
- Multiple tabs/users share cache
- Persistent across page reloads
- Fallback if external API down

**Example:**
```typescript
// lib/network/cache.ts
export async function getNetworkCache(key: string): Promise<CachedData | null> {
  const ref = ref(db, `network/cache/${key}`);
  const snapshot = await get(ref);

  if (!snapshot.exists()) return null;

  const cached = snapshot.val();
  const age = Date.now() - cached.timestamp;

  // 5-min TTL (like Netatmo)
  if (age > 5 * 60 * 1000) {
    return null; // Expired
  }

  return cached;
}

export async function setNetworkCache(key: string, data: any): Promise<void> {
  const ref = ref(db, `network/cache/${key}`);
  await set(ref, {
    data,
    timestamp: Date.now(),
  });
}
```

**Trade-offs:**
- **Pros:** Reduces API calls, shares cache across users, persists across reloads
- **Cons:** Data can be stale up to TTL duration
- **For network monitoring:** 5-min TTL acceptable (not real-time critical)

---

## Error Handling

### RFC 9457 Problem Details

Fritz!Box API returns errors in RFC 9457 format:

```json
{
  "type": "https://fritzbox.example/errors/rate-limit",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Maximum 10 requests per minute exceeded",
  "instance": "/api/devices"
}
```

**Mapping to App Errors:**

```typescript
// lib/network/fritzboxApi.ts
export class FritzBoxError extends Error {
  constructor(
    public detail: string,
    public type: string,
    public status?: number
  ) {
    super(detail);
    this.name = 'FritzBoxError';
  }
}

// Error handling in API route
try {
  const response = await fetch(FRITZBOX_API_URL);

  if (!response.ok) {
    const problem = await response.json();

    if (problem.status === 429) {
      // Rate limit exceeded
      throw new FritzBoxError(
        'Limite richieste API superato (10 req/min)',
        problem.type,
        429
      );
    }

    throw new FritzBoxError(problem.detail, problem.type, problem.status);
  }
} catch (error) {
  // Middleware handles FritzBoxError → user-friendly banner
  return handleError(error, 'Network/API');
}
```

**UI Display:**

```tsx
// NetworkCard banners
{error && (
  <Banner
    variant="error"
    icon="⚠️"
    title="Errore Rete"
    description={error.message}
    dismissible
    onDismiss={() => setError(null)}
  />
)}

{rateLimitExceeded && (
  <Banner
    variant="warning"
    icon="⏱️"
    title="Limite Richieste API"
    description="Troppe richieste. Riprova tra 1 minuto."
    compact
  />
)}
```

---

### Retry Strategy

```typescript
// lib/retry/retryClient.ts (existing)
const TRANSIENT_ERROR_CODES = new Set([
  'NETWORK_ERROR',
  'TIMEOUT',
  'SERVICE_UNAVAILABLE',
]);

// Used automatically by fetch wrapper
const response = await retryFetch('/api/network/status', {
  maxAttempts: 3,
  initialDelay: 1000, // 1s
  backoffMultiplier: 2,
});
```

**Non-retryable errors:**
- `RATE_LIMIT_EXCEEDED` (429) — Must wait 1 minute
- `UNAUTHORIZED` (401) — API key invalid
- `NOT_FOUND` (404) — Device doesn't exist

**Retryable errors:**
- `NETWORK_ERROR` — Transient network issue
- `TIMEOUT` — Request timeout
- `SERVICE_UNAVAILABLE` (503) — Fritz!Box temporarily down

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 user | Current architecture works perfectly. Dashboard card + full page. |
| 5-10 users | Firebase cache shared across users. 10 req/min limit shared → effective 1-2 req/user/min. May need per-user rate limit tracking. |
| 100+ users | Fritz!Box API rate limit becomes bottleneck. Consider: local Fritz!Box polling service (bypass REST API), dedicated backend with websockets for real-time updates, separate Fritz!Box instances per household. |

**Bottleneck Analysis:**

1. **First bottleneck:** Fritz!Box 10 req/min rate limit
   - **Fix:** Increase Firebase cache TTL (5 min → 10 min)
   - **Fix:** Per-user rate limit tracking (prevent one user exhausting quota)

2. **Second bottleneck:** Firebase RTDB read/write limits
   - **Fix:** Use Firebase RTDB transactions for rate limit tracking
   - **Fix:** Batch cache writes

**For Pannello Stufa (1-5 users):** Current architecture sufficient. No scaling changes needed.

---

## Anti-Patterns

### Anti-Pattern 1: Client-Side API Key Storage

**What people do:** Store Fritz!Box API key in environment variable with `NEXT_PUBLIC_` prefix.

**Why it's wrong:**
- API key exposed to client (visible in browser DevTools)
- Anyone can extract key and abuse quota
- Security risk if key has admin privileges

**Do this instead:**
- Server-side only: `FRITZBOX_API_KEY` (no `NEXT_PUBLIC_`)
- All Fritz!Box API calls through Next.js API routes
- Middleware validates Auth0 session before proxying

---

### Anti-Pattern 2: No Rate Limiting

**What people do:** Call Fritz!Box API directly from client on every render/poll.

**Why it's wrong:**
- Quickly exhausts 10 req/min quota
- No coordination between tabs/users
- API returns 429, app unusable

**Do this instead:**
- Server-side rate limiter with Firebase persistence
- Shared quota across users (or per-user tracking)
- Firebase cache reduces API calls (5-min TTL)

---

### Anti-Pattern 3: Polling Without Visibility Awareness

**What people do:** `setInterval()` polling that runs even when tab hidden.

**Why it's wrong:**
- Wastes bandwidth on hidden tabs
- Drains mobile battery
- Unnecessary API quota consumption

**Do this instead:**
- `useAdaptivePolling()` hook (existing)
- Pauses when tab hidden (`alwaysActive: false`)
- Resumes + fetches immediately on tab restore

---

### Anti-Pattern 4: Ignoring RFC 9457 Error Structure

**What people do:** Treat all errors as generic `{ error: string }`.

**Why it's wrong:**
- Loses valuable error context (type, instance, detail)
- Can't distinguish rate limit vs auth vs network errors
- Poor UX (generic "Error occurred" messages)

**Do this instead:**
- Parse RFC 9457 `type`, `status`, `detail`
- Map to app-specific error codes
- Display user-friendly messages with context

---

## Integration Checklist

### Phase 1: Foundation

- [ ] Add `network` device type to `lib/devices/deviceTypes.ts`
- [ ] Create `lib/network/fritzboxApi.ts` (API wrapper)
- [ ] Create `lib/rateLimiter.ts` (10 req/min enforcement)
- [ ] Add environment variables (`FRITZBOX_API_URL`, `FRITZBOX_API_KEY`)

### Phase 2: API Routes

- [ ] `app/api/network/status/route.ts` (connection check)
- [ ] `app/api/network/devices/route.ts` (list with pagination)
- [ ] `app/api/network/devices/[id]/route.ts` (device details)
- [ ] `app/api/network/bandwidth/route.ts` (aggregate stats)

### Phase 3: Dashboard Card

- [ ] `app/components/devices/network/NetworkCard.tsx` (orchestrator)
- [ ] `app/components/devices/network/hooks/useNetworkData.ts` (polling + state)
- [ ] `app/components/devices/network/components/NetworkStatus.tsx` (presentational)
- [ ] `app/components/devices/network/components/NetworkSummary.tsx` (presentational)
- [ ] `app/components/devices/network/components/NetworkBanners.tsx` (error handling)
- [ ] Add to `app/page.tsx` registry

### Phase 4: Full Page

- [ ] `app/network/page.tsx` (server component with auth)
- [ ] `app/network/components/NetworkOverview.tsx` (aggregate stats)
- [ ] `app/network/components/DevicesTable.tsx` (pagination)
- [ ] `app/network/components/DeviceDetails.tsx` (bandwidth chart)
- [ ] `app/network/components/NetworkSettings.tsx` (API config)

### Phase 5: Testing

- [ ] Unit tests: `lib/network/fritzboxApi.test.ts`
- [ ] Unit tests: `lib/rateLimiter.test.ts`
- [ ] Integration tests: `app/api/network/devices/route.test.ts`
- [ ] Component tests: `app/components/devices/network/NetworkCard.test.tsx`
- [ ] E2E tests: Network page pagination, rate limit handling

### Phase 6: Documentation

- [ ] Update `docs/architecture.md` (add network device section)
- [ ] Update `docs/api-routes.md` (add network API endpoints)
- [ ] Update `docs/firebase.md` (add network cache schema)
- [ ] Create `docs/setup/fritzbox-setup.md` (API key setup guide)

---

## Build Order Recommendations

**Order by dependencies:**

1. **Device registry** (`lib/devices/deviceTypes.ts`) — No deps
2. **API wrapper** (`lib/network/fritzboxApi.ts`) — No deps
3. **Rate limiter** (`lib/rateLimiter.ts`) — Depends on Firebase
4. **API routes** (`app/api/network/*`) — Depends on #2, #3
5. **Dashboard card** (`app/components/devices/network/NetworkCard.tsx`) — Depends on #4
6. **Full page** (`app/network/page.tsx`) — Depends on #4, #5 (reuses components)
7. **Testing** — Depends on all above

**Rationale:**
- Bottom-up (infrastructure → API → UI)
- Each layer testable independently
- Dashboard card validates API before building full page
- Full page reuses NetworkCard components (DRY)

**Estimated LOC:**
- Device registry: +30 LOC (modify existing file)
- API wrapper: ~150 LOC
- Rate limiter: ~100 LOC
- API routes: ~400 LOC (4 routes × ~100 LOC)
- Dashboard card: ~200 LOC (orchestrator) + ~150 LOC (components/hooks)
- Full page: ~300 LOC (page) + ~400 LOC (components)
- Tests: ~800 LOC

**Total:** ~2,530 LOC (similar to LightsCard integration)

---

## Sources

Fritz!Box API and network monitoring patterns:
- [How can I monitor the Internet bandwidth of an AVM Fritzbox router? | Paessler Knowledge Base](https://kb.paessler.com/en/topic/38313-how-can-i-monitor-the-internet-bandwidth-of-an-avm-fritzbox-router)
- [Structure and API — fritzconnection 1.4 documentation](https://fritzconnection.readthedocs.io/en/1.4.2/sources/api.html)
- [Monitoring per-device traffic on FritzBox](https://marcoperetti.com/monitoring-per-device-traffic-on-fritzbox/)
- [Fritzbox Network Devices Monitoring | Netdata](https://www.netdata.cloud/monitoring-101/fritzbox-monitoring/)

RFC 9457 Problem Details and pagination best practices:
- [Problem Details (RFC 9457): Doing API Errors Well](https://swagger.io/blog/problem-details-rfc9457-doing-api-errors-well/)
- [Pagination Best Practices in REST API Design | Speakeasy](https://www.speakeasy.com/api-design/pagination)
- [RFC 9457 - Problem Details for HTTP APIs](https://datatracker.ietf.org/doc/html/rfc9457)

---

*Architecture research for: Fritz!Box Network Monitoring Integration*
*Researched: 2026-02-13*
*Confidence: HIGH (existing patterns validated, external API specs confirmed)*
