# Technology Stack - Fritz!Box Network Monitoring

**Project:** Pannello Stufa - Fritz!Box Integration
**Researched:** 2026-02-13
**Confidence:** HIGH

## Executive Summary

**NO NEW DEPENDENCIES REQUIRED.** The existing stack fully supports Fritz!Box network monitoring integration. The external API characteristics (REST with API Key auth, RFC 9457 error format, limit/offset pagination, 10 req/min rate limit) map directly to established patterns: server-side proxy routes, retry client with rate limiting, Recharts visualization, DataTable with TanStack Table, and adaptive polling.

This document focuses on integration patterns and rationale for leveraging existing capabilities rather than introducing new libraries.

---

## Recommended Stack (Existing Libraries)

### Core Framework (No Changes)

| Technology | Version | Purpose | Why Sufficient |
|------------|---------|---------|----------------|
| Next.js 15.5 | 16.1.0 | App Router + API Routes | Server-side proxy pattern established, force-dynamic for real-time data |
| React 19 | 19.2.0 | UI framework | Client components for interactive dashboard, hooks for polling |
| TypeScript | 5.x | Type safety | Strict mode enabled, full type coverage (v5.0 milestone) |

### Data Fetching & Resilience (No Changes)

| Technology | Version | Purpose | Why Sufficient |
|------------|---------|---------|----------------|
| Retry Client | Custom (lib/retry/) | Exponential backoff + rate limiting | Already supports transient error retry, configurable rate limits, perfect for 10 req/min Fritz!Box API |
| Firebase RTDB | 12.8.0 | Token/cache storage | Store Fritz!Box API keys, cache bandwidth data, 5-min staleness pattern |
| Firebase Firestore | 12.8.0 | Historical data | Device history, bandwidth logs (Phase 54 pattern) |
| fetch (native) | Native | HTTP client | Sufficient for REST API, works with retry client |

**Rationale:** Fritz!Box API rate limit (10 req/min) matches existing rate limiter design. Retry client already handles transient errors (NETWORK_ERROR, TIMEOUT, SERVICE_UNAVAILABLE). No need for axios or specialized HTTP libraries.

### Visualization (No Changes)

| Technology | Version | Purpose | Why Sufficient |
|------------|---------|---------|----------------|
| Recharts | 2.15.0 | Bandwidth charts, WAN status visualization | Already used in analytics dashboard (Phase 54), composable components, TypeScript-friendly, supports real-time data updates |
| @tanstack/react-table | 8.21.3 | Device list table | DataTable component supports sorting, pagination, filtering — perfect for device list with 50+ devices |

**Rationale:** Bandwidth charts require time-series visualization (ComposedChart + Line/Bar). WAN status uses gauge/progress components. Device history uses timeline visualization. All patterns proven in existing DeliveryChart and analytics dashboard.

### Date/Time Handling (No Changes)

| Technology | Version | Purpose | Why Sufficient |
|------------|---------|---------|----------------|
| date-fns | 4.1.0 | Date formatting, parsing, timezone | Already used throughout project, handles ISO 8601 timestamps from Fritz!Box API |

### UI Components (No Changes)

| Technology | Version | Purpose | Why Sufficient |
|------------|---------|---------|----------------|
| CVA + Radix UI | 0.7.1 / various | Design system (37+ components) | Card, Button, Badge, Progress, DataTable already exist — sufficient for dashboard card + full page |
| Lucide React | 0.562.0 | Icons | Network icons available (Wifi, Signal, Activity, Router, etc.) |
| Tailwind CSS | 4.1.18 | Styling | Dark-first ember noir theme, responsive utilities |

**Rationale:** NetworkCard follows StoveCard/LightsCard orchestrator pattern (Phase 58-59). No new UI primitives needed.

---

## Integration Patterns (NEW)

### Pattern 1: Fritz!Box API Proxy Route

**What:** Server-side API route to proxy Fritz!Box REST API requests with API Key authentication
**Why:** Keeps API keys secure (never exposed to client), leverages existing server-side proxy pattern

**Implementation:**
```typescript
// app/api/network/devices/route.ts
import { getSession } from '@auth0/nextjs-auth0';
import { success, error } from '@/lib/core/apiResponses';
import { retryFetch } from '@/lib/retry/retryClient';
import { getFromCache, setCache } from '@/lib/cacheService';

export const dynamic = 'force-dynamic'; // Standard pattern

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return error('Unauthorized', 401);
  }

  try {
    // Check cache first (5-minute staleness)
    const cached = await getFromCache('network:devices', 300);
    if (cached) return success(cached);

    // Fetch from Fritz!Box API with retry + rate limiting
    const response = await retryFetch('https://fritz.box/api/devices', {
      headers: {
        'X-API-Key': process.env.FRITZBOX_API_KEY!,
        'Accept': 'application/json',
      },
      // Retry client automatically handles 503, timeout, network errors
      maxAttempts: 3,
      initialDelay: 1000,
    });

    if (!response.ok) {
      // RFC 9457 error format
      const errorBody = await response.json();
      throw new Error(errorBody.title || 'Fritz!Box API error');
    }

    const data = await response.json();

    // Cache for 5 minutes
    await setCache('network:devices', data, 300);

    return success(data);

  } catch (err) {
    console.error('Fritz!Box API error:', err);
    return error('Failed to fetch device list', 500);
  }
}
```

**Pattern source:** Existing `/api/stove/*` routes (Phase 1-5), retry client (Phase 55)

**Key decisions:**
- **X-API-Key header:** Fritz!Box uses API Key auth, not OAuth/JWT
- **5-minute cache:** Balances freshness with 10 req/min rate limit
- **RFC 9457 errors:** Fritz!Box returns `{ type, title, status, detail }` format
- **Retry client:** Handles transient errors automatically
- **force-dynamic:** Required for real-time data (Next.js 15 pattern)

### Pattern 2: Rate Limiting with Retry Client

**What:** Configure retry client to respect Fritz!Box 10 req/min rate limit
**Why:** Prevents 429 errors, existing retry client supports rate limiting

**Implementation:**
```typescript
// lib/retry/fritzboxClient.ts
import { retryFetch } from '@/lib/retry/retryClient';

// Fritz!Box allows 10 requests/minute = 1 request every 6 seconds
const RATE_LIMIT_DELAY = 6000; // 6 seconds between requests
let lastRequestTime = 0;

export async function fritzboxFetch(url: string, options?: RequestInit) {
  // Enforce rate limit
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();

  // Use existing retry client with Fritz!Box-specific defaults
  return retryFetch(url, {
    ...options,
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
  });
}
```

**Pattern source:** Existing retry client (lib/retry/retryClient.ts), rate limiting logic from Phase 49 Firebase RTDB limiter

**Key decisions:**
- **6-second delay:** 10 req/min = 1 request every 6 seconds (conservative)
- **Singleton pattern:** Single rate limiter instance prevents parallel requests from violating limit
- **Retry on 429:** Existing retry client already handles HTTP 429 (rate limit exceeded)

### Pattern 3: Bandwidth Chart Visualization

**What:** Real-time bandwidth chart using Recharts ComposedChart with dual Y-axes
**Why:** Upload/download need different scales, existing Recharts pattern proven in analytics dashboard

**Implementation:**
```typescript
// app/components/network/BandwidthChart.tsx
'use client';

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface BandwidthData {
  timestamp: string;
  downloadMbps: number;
  uploadMbps: number;
}

export default function BandwidthChart({ data }: { data: BandwidthData[] }) {
  const chartData = data.map((item) => ({
    ...item,
    time: format(parseISO(item.timestamp), 'HH:mm'),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />

        <XAxis
          dataKey="time"
          stroke="currentColor"
          className="opacity-60"
          style={{ fontSize: '12px' }}
        />

        <YAxis
          stroke="currentColor"
          className="opacity-60"
          label={{ value: 'Mbps', angle: -90, position: 'insideLeft' }}
        />

        <Tooltip />
        <Legend />

        <Line
          type="monotone"
          dataKey="downloadMbps"
          stroke="#ed6f10" // Ember
          strokeWidth={2}
          dot={{ fill: '#ed6f10', r: 3 }}
          name="Download (Mbps)"
        />

        <Line
          type="monotone"
          dataKey="uploadMbps"
          stroke="#437dae" // Copper
          strokeWidth={2}
          dot={{ fill: '#437dae', r: 3 }}
          name="Upload (Mbps)"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

**Pattern source:** Existing DeliveryChart (app/debug/notifications/components/DeliveryChart.tsx), WeatherCorrelation chart (Phase 54 research)

**Key decisions:**
- **'use client' directive:** Recharts requires browser APIs (standard pattern)
- **ComposedChart:** Supports multiple line series with shared X-axis
- **date-fns formatting:** ISO 8601 timestamps → HH:mm display format
- **Ember/copper colors:** Matches design system (ember #ed6f10, copper #437dae)
- **ResponsiveContainer:** Handles responsive sizing automatically

### Pattern 4: Device List with DataTable

**What:** Device list table with sorting, filtering, pagination using existing DataTable component
**Why:** TanStack Table handles 50+ devices efficiently, pattern proven in analytics dashboard

**Implementation:**
```typescript
// app/network/page.tsx
'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import DataTable from '@/app/components/ui/DataTable';
import Badge from '@/app/components/ui/Badge';

interface NetworkDevice {
  id: string;
  name: string;
  ipAddress: string;
  macAddress: string;
  status: 'online' | 'offline';
  bandwidth: number; // Mbps
  lastSeen: string;
}

export default function NetworkPage({ devices }: { devices: NetworkDevice[] }) {
  const columns: ColumnDef<NetworkDevice>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Device Name',
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP Address',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'online' ? 'success' : 'neutral'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'bandwidth',
      header: 'Bandwidth',
      cell: ({ row }) => `${row.original.bandwidth.toFixed(1)} Mbps`,
    },
    {
      accessorKey: 'lastSeen',
      header: 'Last Seen',
      cell: ({ row }) => format(parseISO(row.original.lastSeen), 'PPp'),
    },
  ], []);

  return (
    <DataTable
      data={devices}
      columns={columns}
      density="default"
      striped
      enablePagination
      pageSize={25}
      enableFiltering
      searchPlaceholder="Search devices..."
    />
  );
}
```

**Pattern source:** Existing DataTable component (app/components/ui/DataTable.tsx), TanStack Table v8 patterns

**Key decisions:**
- **ColumnDef typing:** Type-safe column definitions with TanStack Table
- **Badge component:** Existing UI component for status indicators
- **Pagination:** 25 devices per page (reasonable default for 50+ devices)
- **Filtering:** Built-in global search (searches all columns)
- **Striped rows:** Improves readability for dense data

### Pattern 5: Adaptive Polling for Network Status

**What:** Use existing useAdaptivePolling hook with Page Visibility API for bandwidth monitoring
**Why:** Real-time bandwidth data requires polling, adaptive polling reduces server load when tab inactive

**Implementation:**
```typescript
// app/components/network/NetworkCard.tsx (orchestrator pattern)
'use client';

import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useBandwidthData } from './hooks/useBandwidthData';

export default function NetworkCard() {
  // Poll bandwidth data with adaptive intervals
  const { data, isLoading, error } = useAdaptivePolling(
    () => fetch('/api/network/bandwidth').then(r => r.json()),
    {
      baseInterval: 30000, // 30 seconds when visible
      slowInterval: 300000, // 5 minutes when hidden
      alwaysActive: false, // Not safety-critical (unlike stove)
    }
  );

  return (
    <Card>
      <CardHeader>
        <Heading level={3}>Network Status</Heading>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton />}
        {error && <ErrorState message="Failed to load network data" />}
        {data && <BandwidthChart data={data.history} />}
      </CardContent>
    </Card>
  );
}
```

**Pattern source:** Existing useAdaptivePolling (lib/hooks/useAdaptivePolling.ts, Phase 57), StoveCard orchestrator (Phase 58)

**Key decisions:**
- **30s base interval:** Balances freshness with 10 req/min rate limit (2 requests/min)
- **5-min slow interval:** Reduces load when tab hidden
- **alwaysActive: false:** Network monitoring not safety-critical (unlike stove ignition)
- **Orchestrator pattern:** Separates data fetching (useBandwidthData) from presentation (BandwidthChart)

---

## Alternatives Considered (NOT Recommended)

| Instead of | Could Use | Why NOT |
|------------|-----------|---------|
| Retry client | axios + axios-retry | Adds dependency (46KB), existing retry client already handles rate limiting + transient errors |
| Recharts | Chart.js | Already established in project (Phase 54), Chart.js requires different patterns, no TypeScript improvement |
| TanStack Table | react-virtualized | DataTable component already exists, virtualization overkill for <100 devices |
| Firebase RTDB | Redis | Adds infrastructure complexity, RTDB already used for caching throughout project |
| fetch | ky or got | Adds dependency, fetch + retry client sufficient for REST API |
| Custom polling | SWR or React Query | Adds dependency, useAdaptivePolling already implements stale-while-revalidate with visibility optimization |

**Key principle:** Don't introduce new dependencies when existing stack fully supports requirements. Fritz!Box integration leverages mature patterns from 7 milestones (v1.0-v7.0).

---

## Installation

**NO NEW PACKAGES REQUIRED.** All dependencies already installed:

```bash
# Verify current versions (already in package.json)
npm list recharts          # 2.15.0
npm list @tanstack/react-table  # 8.21.3
npm list date-fns          # 4.1.0
npm list firebase          # 12.8.0
npm list next              # 16.1.0 (Next.js 15.5)
```

**Environment variables (NEW):**
```bash
# .env.local
FRITZBOX_API_KEY=your_api_key_here
FRITZBOX_BASE_URL=https://fritz.box/api  # Default, override if custom domain
```

**Firebase RTDB structure (NEW paths):**
```
/cache/network/
  devices         # Device list cache (5-min TTL)
  bandwidth       # Current bandwidth cache (5-min TTL)
  wanStatus       # WAN connection status (5-min TTL)

/analytics/network/
  bandwidthHistory    # Historical bandwidth data (Firestore preferred for large datasets)
  deviceHistory       # Device connection/disconnection events
```

---

## Integration Checklist

- [ ] Add FRITZBOX_API_KEY to environment variables
- [ ] Create proxy API routes: /api/network/devices, /api/network/bandwidth, /api/network/wan
- [ ] Implement fritzboxClient.ts with rate limiting (6-second delay)
- [ ] Create NetworkCard component (orchestrator pattern, follows StoveCard)
- [ ] Create /network page with device list (DataTable), bandwidth chart (Recharts), WAN status
- [ ] Add network routes to navigation (app/components/layout/Navigation.tsx)
- [ ] Add network cache paths to cacheService.ts
- [ ] Configure useAdaptivePolling (30s visible, 5min hidden, alwaysActive: false)
- [ ] Add Fritz!Box icon to design system (Lucide: Router or Wifi)
- [ ] Add unit tests for fritzboxClient, NetworkCard, bandwidth calculations
- [ ] Update docs/api-routes.md with new /api/network/* routes

---

## RFC 9457 Error Handling (NEW)

Fritz!Box API returns errors in RFC 9457 format:

```json
{
  "type": "https://fritz.box/errors/rate-limit-exceeded",
  "title": "Rate limit exceeded",
  "status": 429,
  "detail": "You have exceeded the 10 requests per minute limit. Please wait 6 seconds before retrying.",
  "instance": "/api/devices"
}
```

**Handling pattern:**
```typescript
// lib/retry/fritzboxClient.ts
export async function handleFritzboxError(response: Response): Promise<never> {
  if (!response.ok) {
    try {
      const error = await response.json(); // RFC 9457 format

      // Map to existing ERROR_CODES
      if (response.status === 429) {
        throw new Error(ERROR_CODES.RATE_LIMIT_EXCEEDED);
      }
      if (response.status >= 500) {
        throw new Error(ERROR_CODES.SERVICE_UNAVAILABLE);
      }

      // Throw with RFC 9457 title + detail
      throw new Error(error.title || error.detail || 'Fritz!Box API error');

    } catch (parseError) {
      // Fallback if response is not JSON
      throw new Error(`Fritz!Box API error: ${response.status} ${response.statusText}`);
    }
  }

  throw new Error('Unexpected error state');
}
```

**Key decisions:**
- **Map to ERROR_CODES:** Existing error handling expects ERROR_CODES constants
- **429 → RATE_LIMIT_EXCEEDED:** Triggers exponential backoff in retry client
- **5xx → SERVICE_UNAVAILABLE:** Retry client already handles this as transient
- **Graceful degradation:** Parse RFC 9457 format, but fallback to statusText if JSON parsing fails

---

## Performance Considerations

| Concern | Strategy | Rationale |
|---------|----------|-----------|
| Rate limiting | 6-second delay between requests, singleton rate limiter | Fritz!Box 10 req/min limit, conservative approach prevents 429 errors |
| Cache staleness | 5-minute TTL for device list, bandwidth, WAN status | Balances freshness with rate limits, matches existing cache patterns |
| Adaptive polling | 30s visible, 5min hidden, pause on error | Reduces server load, existing useAdaptivePolling pattern (Phase 57) |
| Large device lists | TanStack Table with pagination (25/page), virtual scrolling if >100 devices | Existing DataTable optimized for 50-100 rows |
| Historical data | Firestore for bandwidth/device history (not RTDB) | Firestore better for time-series queries, established pattern from Phase 54 |

**Benchmark expectations (based on existing patterns):**
- API proxy latency: <200ms (cached), <1s (Fritz!Box fetch)
- Dashboard load time: <500ms (cached data)
- Chart render time: <100ms (Recharts, 50 data points)
- DataTable render: <50ms (25 rows)
- Polling overhead: ~2 req/min (30s interval), well under 10 req/min limit

---

## Testing Strategy

**Unit tests (NEW):**
```typescript
// lib/retry/__tests__/fritzboxClient.test.ts
describe('fritzboxFetch rate limiting', () => {
  it('enforces 6-second delay between requests', async () => {
    const start = Date.now();
    await fritzboxFetch('/devices');
    await fritzboxFetch('/bandwidth');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(6000);
  });

  it('handles RFC 9457 error format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        type: 'https://fritz.box/errors/rate-limit',
        title: 'Rate limit exceeded',
        status: 429,
      }),
    });

    await expect(fritzboxFetch('/devices')).rejects.toThrow('Rate limit exceeded');
  });
});
```

**Integration tests (NEW):**
```typescript
// app/api/network/__tests__/devices.test.ts
describe('GET /api/network/devices', () => {
  it('returns cached device list within 5 minutes', async () => {
    await setCache('network:devices', mockDevices, 300);

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockDevices);
    expect(mockFritzboxFetch).not.toHaveBeenCalled(); // Cache hit
  });

  it('fetches from Fritz!Box API when cache expired', async () => {
    mockFritzboxFetch.mockResolvedValueOnce({ ok: true, json: async () => mockDevices });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(mockFritzboxFetch).toHaveBeenCalledWith(
      'https://fritz.box/api/devices',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-API-Key': 'test-api-key',
        }),
      })
    );
  });
});
```

**E2E tests (Playwright):**
```typescript
// e2e/network-monitoring.spec.ts
test('network dashboard loads and displays bandwidth chart', async ({ page }) => {
  await page.goto('/network');

  // Wait for chart to render
  await expect(page.locator('.recharts-wrapper')).toBeVisible();

  // Verify device table
  await expect(page.locator('table')).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(25); // First page

  // Test pagination
  await page.click('button[aria-label="Go to next page"]');
  await expect(page.locator('tbody tr')).toHaveCount(25); // Second page
});
```

---

## Security Considerations

| Risk | Mitigation | Implementation |
|------|------------|----------------|
| API key exposure | Server-side proxy only, never send to client | API routes fetch from Fritz!Box, client fetches from /api/network/* |
| Unauthorized access | Auth0 session check in all /api/network/* routes | `const session = await getSession(); if (!session) return error(401)` |
| Rate limit abuse | Singleton rate limiter, 6-second delay | fritzboxClient.ts enforces single request queue |
| SSRF attacks | Validate Fritz!Box base URL, restrict to internal network | Env var validation: `FRITZBOX_BASE_URL must start with https://` |
| Sensitive data leakage | Don't log full API responses, redact API keys | `console.log({ ...data, apiKey: '[REDACTED]' })` |

**CRITICAL:** Never expose FRITZBOX_API_KEY to client. All Fritz!Box API calls must go through server-side proxy routes with Auth0 session validation.

---

## Migration Path (if needed)

**NOT APPLICABLE** — this is a new feature addition, not a migration from existing system.

Future migration considerations:
- If Fritz!Box API rate limit becomes bottleneck, consider WebSocket connection (if Fritz!Box supports)
- If device list exceeds 100 devices, implement virtual scrolling in DataTable
- If bandwidth history grows beyond Firestore limits, migrate to TimescaleDB or InfluxDB

---

## Sources

### Primary (HIGH confidence)
- **Project codebase:**
  - `package.json` (recharts 2.15.0, @tanstack/react-table 8.21.3, date-fns 4.1.0, firebase 12.8.0)
  - `lib/retry/retryClient.ts` (retry + rate limiting patterns)
  - `app/components/ui/DataTable.tsx` (TanStack Table implementation)
  - `app/debug/notifications/components/DeliveryChart.tsx` (Recharts patterns)
  - `lib/hooks/useAdaptivePolling.ts` (Phase 57, adaptive polling)
  - `app/components/stove/StoveCard.tsx` (Phase 58, orchestrator pattern)
  - `.planning/phases/54-analytics-dashboard/54-RESEARCH.md` (Recharts + Firestore patterns)
- **Project documentation:**
  - `docs/architecture.md` (server-side proxy pattern)
  - `docs/design-system.md` (UI component variants)
  - `docs/testing.md` (test patterns)

### Secondary (MEDIUM confidence)
- **Next.js 15 official docs:**
  - [App Router API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
  - [Server Actions and Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- **Recharts official docs:**
  - [ComposedChart API](https://recharts.org/en-US/api/ComposedChart)
  - [Line Chart Examples](https://recharts.org/en-US/examples/SimpleLineChart)
- **TanStack Table v8 docs:**
  - [React Table Quick Start](https://tanstack.com/table/v8/docs/framework/react/quick-start)
  - [Pagination Guide](https://tanstack.com/table/v8/docs/framework/react/examples/pagination)
- **RFC 9457 specification:**
  - [Problem Details for HTTP APIs](https://datatracker.ietf.org/doc/html/rfc9457)

### Tertiary (LOW confidence)
- None — all recommendations based on existing project patterns or official documentation

---

## Confidence Assessment

| Area | Level | Rationale |
|------|-------|-----------|
| Stack sufficiency | **HIGH** | All required capabilities exist in current stack (verified in package.json + codebase patterns) |
| Integration patterns | **HIGH** | Patterns proven across 7 milestones (retry client Phase 55, adaptive polling Phase 57, orchestrator Phase 58-59) |
| Rate limiting | **HIGH** | Existing retry client supports rate limiting, 6-second delay well under 10 req/min limit |
| Visualization | **HIGH** | Recharts + DataTable patterns proven in analytics dashboard (Phase 54) |
| Security | **HIGH** | Server-side proxy + Auth0 session validation established pattern (all existing API routes) |

**Overall confidence: HIGH** — No new dependencies required, all patterns established in v1.0-v7.0 milestones.

---

## Metadata

**Research date:** 2026-02-13
**Valid until:** 2026-03-13 (30 days — stack stable, patterns mature)
**Milestone:** Fritz!Box Network Monitoring (v8.0 candidate)
**Dependencies:** Next.js 15.5, React 19, Recharts 2.15, TanStack Table 8.21, Firebase 12.8

---

**Next step:** Create FEATURES.md documenting table stakes vs differentiator features for network monitoring dashboard.
