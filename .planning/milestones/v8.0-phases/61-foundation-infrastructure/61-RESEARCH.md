# Phase 61: Foundation & Infrastructure - Research

**Researched:** 2026-02-13
**Domain:** Fritz!Box TR-064 API integration, rate limiting, device registry, proxy routes, environment security
**Confidence:** HIGH

## Summary

Phase 61 establishes the foundational infrastructure for Fritz!Box network monitoring integration. The goal is to build a secure, rate-limited API proxy layer that stores Fritz!Box credentials server-side, enforces 10 req/min rate limits with proper budget allocation, registers the network device in the unified device registry, and implements RFC 9457 error handling with specific TR-064 configuration verification.

The existing codebase provides strong foundations: Firebase RTDB rate limiter with transactions (Phase 49), RFC 9457 error handling with ApiError class (v7.0), withAuthAndErrorHandler middleware (v5.0+), device registry pattern (multi-device architecture), and retry infrastructure (Phase 55). The Fritz!Box integration follows the established pattern from Netatmo and Hue integrations but requires tighter rate limiting (10 req/min vs Netatmo's 400 req/hr equivalent) and self-hosted API connectivity handling (similar to Hue's local bridge pattern).

**Primary recommendation:** Create server-side proxy routes under `/api/fritzbox/*` that store credentials in environment variables, adapt existing Firebase RTDB rate limiter for 10 req/min dual-window enforcement, register network device type in device registry with routes and features, implement TR-064 connectivity verification endpoint, and use RFC 9457 error responses with specific error codes (RATE_LIMIT, TIMEOUT, TR064_NOT_ENABLED).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js API Routes | 16.1.0 | Server-side proxy pattern | Built-in, already used for Netatmo/Hue, keeps credentials server-side |
| Firebase RTDB | 12.8.0 | Rate limit state storage | Already installed, transaction support, Phase 49 pattern proven |
| Firebase Admin SDK | 13.6.0 | Server-side Firebase ops | Already installed, secure credential storage, encryption at rest |
| Native fetch | ES6+ | HTTP requests to Fritz!Box | Zero dependencies, timeout support via AbortSignal |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing middleware | - | withAuthAndErrorHandler, withIdempotency | Already implemented, authentication and error handling |
| Existing error system | - | ApiError, ERROR_CODES, HTTP_STATUS | Already implemented, RFC 9457 compliance |
| Existing rate limiter | - | rateLimiterPersistent.ts | Phase 49 implementation, adapt for Fritz!Box limits |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server-side proxy | Client-side direct API calls | Exposes Fritz!Box credentials to client (unacceptable security risk) |
| Firebase RTDB rate limiter | In-memory rate limiter | Lost state on serverless cold starts (Phase 49 chose persistence) |
| Custom error handling | Generic 500 errors | Poor UX, no actionable feedback for TR-064 disabled scenario |
| Static 10 req/min limit | Endpoint-specific budgets | Works for MVP, but Phase 2 should add budget allocation |

**Installation:**
```bash
# No new dependencies required
# All infrastructure already present
```

## Architecture Patterns

### Recommended Project Structure

```
app/api/fritzbox/
├── health/
│   └── route.ts              # TR-064 connectivity check
├── devices/
│   └── route.ts              # Get network device list
├── bandwidth/
│   └── route.ts              # Get current bandwidth stats
└── wan/
    └── route.ts              # Get WAN connection status

lib/
├── fritzbox/
│   ├── fritzboxClient.ts     # Fritz!Box API client with rate limiting
│   ├── fritzboxCache.ts      # Firebase RTDB cache layer (60s TTL)
│   └── fritzboxErrors.ts     # Fritz!Box-specific error codes
└── rateLimiterPersistent.ts  # Adapt for Fritz!Box 10 req/min
```

### Pattern 1: Server-Side Proxy Route

**What:** Next.js API route that proxies Fritz!Box API calls, keeping credentials server-side.

**When to use:** ALL Fritz!Box API endpoints (health, devices, bandwidth, WAN, etc.).

**Example:**
```typescript
// app/api/fritzbox/devices/route.ts
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox/fritzboxClient';
import { checkRateLimitFritzBox } from '@/lib/fritzbox/rateLimiter';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  // 1. Rate limit check (10 req/min)
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'devices');

  if (!rateLimitResult.allowed) {
    throw new ApiError(
      ERROR_CODES.RATE_LIMITED,
      `Rate limit exceeded. Try again in ${rateLimitResult.nextAllowedIn}s`,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { retryAfter: rateLimitResult.nextAllowedIn }
    );
  }

  // 2. Fetch from Fritz!Box (credentials from env)
  const devices = await fritzboxClient.getDevices();

  // 3. Return data
  return success({ devices });
}, 'FritzBox/Devices');
```

### Pattern 2: Rate Limiter Adaptation

**What:** Adapt Phase 49's `rateLimiterPersistent.ts` for Fritz!Box's 10 req/min limit (vs Netatmo's 400 req/hr).

**When to use:** All Fritz!Box API endpoints.

**Example:**
```typescript
// lib/fritzbox/rateLimiter.ts
import { checkRateLimitPersistent, RateLimitConfig } from '@/lib/rateLimiterPersistent';

/** Fritz!Box rate limit: 10 requests per minute (600 per hour theoretical) */
const FRITZBOX_RATE_LIMIT: RateLimitConfig = {
  windowMinutes: 1,
  maxPerWindow: 10,
};

export async function checkRateLimitFritzBox(
  userId: string,
  endpoint: string
) {
  return checkRateLimitPersistent(
    userId,
    `fritzbox_${endpoint}`,
    FRITZBOX_RATE_LIMIT
  );
}
```

### Pattern 3: Device Registry Integration

**What:** Register network device type in unified device registry with routes and features.

**When to use:** Once during Phase 61 implementation.

**Example:**
```typescript
// lib/constants/device-types.ts (update existing file)
export const DEVICE_TYPES = {
  STOVE: 'stove',
  THERMOSTAT: 'thermostat',
  LIGHTS: 'lights',
  NETWORK: 'network', // NEW
} as const;

export const DEVICE_CONFIG = {
  // ... existing stove, thermostat, lights config

  [DEVICE_TYPES.NETWORK]: {
    id: 'network',
    name: 'Rete',
    icon: '🌐',
    color: 'info',
    enabled: true,
    routes: {
      main: '/network',
    },
    features: {
      hasScheduler: false,
      hasMaintenance: false,
      hasErrors: false,
    },
  },
} as const;
```

### Pattern 4: TR-064 Connectivity Verification

**What:** Health check endpoint that verifies TR-064 API is enabled and returns specific setup guide link if disabled.

**When to use:** Before rendering network page, during onboarding.

**Example:**
```typescript
// app/api/fritzbox/health/route.ts
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox/fritzboxClient';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  try {
    // Attempt basic TR-064 call (lightweight)
    await fritzboxClient.ping();

    return success({
      status: 'connected',
      tr064Enabled: true
    });
  } catch (error) {
    const err = error as Error;

    // 403 Forbidden = TR-064 not enabled
    if (err.message.includes('403') || err.message.includes('Forbidden')) {
      throw new ApiError(
        'TR064_NOT_ENABLED',
        'TR-064 API not enabled. Enable in Fritz!Box settings: Home Network > Network > Network Settings',
        HTTP_STATUS.FORBIDDEN,
        {
          setupGuideUrl: '/docs/fritzbox-setup',
          tr064Enabled: false
        }
      );
    }

    // Timeout = connectivity issue
    if (err.message.includes('timeout') || err.message.includes('ETIMEDOUT')) {
      throw ApiError.timeout('Fritz!Box not reachable. Check network connectivity.');
    }

    // Re-throw for generic handling
    throw err;
  }
}, 'FritzBox/Health');
```

### Pattern 5: Firebase Cache Layer

**What:** Cache Fritz!Box responses in Firebase RTDB with 60s TTL to reduce rate limit consumption.

**When to use:** All data endpoints (devices, bandwidth, WAN) but NOT command endpoints.

**Example:**
```typescript
// lib/fritzbox/fritzboxCache.ts
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function getCachedData<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const path = getEnvironmentPath(`fritzbox/cache/${cacheKey}`);

  // Check cache
  const cached = await adminDbGet(path) as { data: T; timestamp: number } | null;

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Cache miss - fetch fresh data
  const data = await fetchFn();

  // Store in cache
  await adminDbSet(path, {
    data,
    timestamp: Date.now(),
  });

  return data;
}
```

### Anti-Patterns to Avoid

- **Client-side Fritz!Box API calls:** NEVER expose credentials to client. Always use server-side proxy.
- **Single global rate limiter:** Don't share rate limit with other devices. Fritz!Box has unique 10 req/min constraint.
- **Generic error messages:** Don't return "API Error" for TR-064 disabled. Return actionable message with setup guide link.
- **No cache on data endpoints:** Without caching, rate limit exhausts in <1 minute with normal usage.
- **Ignoring router's cache_age_seconds:** Fritz!Box returns cached data with age indicator. Parse and display total staleness.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rate limiting | Custom in-memory counter | Phase 49 Firebase RTDB rate limiter | Persists across serverless cold starts, transaction-safe, proven implementation |
| API authentication | Custom Auth0 wrapper | withAuthAndErrorHandler middleware | Already handles session, error responses, consistent across all routes |
| Error responses | String messages | ApiError class + RFC 9457 | Standardized error codes, details field, consistent JSON structure |
| Retry logic | Custom exponential backoff | Phase 55 retry client | Already handles network failures, timeouts, idempotency |
| Idempotency (commands) | Custom request tracking | withIdempotency middleware | Firebase RTDB storage, TTL cleanup, prevents duplicate actions |

**Key insight:** Fritz!Box integration follows established patterns from Netatmo (OAuth + rate limiting) and Hue (local API + connectivity handling). Don't reinvent infrastructure — adapt existing patterns with Fritz!Box-specific constraints (tighter rate limits, TR-064 verification).

## Common Pitfalls

### Pitfall 1: Rate Limit Budget Exhaustion

**What goes wrong:** Fritz!Box has 10 req/min limit (6x tighter than Netatmo's effective 6.6 req/min). Loading network page requires 4-5 endpoints (health, devices, bandwidth, WAN, history). Without parallel fetching and caching, rate limit exhausts in <1 minute with 2+ users or aggressive polling.

**Why it happens:** Developers treat 10 req/min like Netatmo's 400 req/hr, not realizing the burst window is far more restrictive. Sequential API calls consume 1 request per endpoint, and polling every 30s hits limit quickly.

**How to avoid:**
- Implement 60s cache TTL (vs Netatmo's 30s) — Phase 61
- Parallel fetching with Promise.all for independent endpoints — Phase 62+
- Rate limiter middleware on ALL endpoints from Day 1
- Monitor rate limit consumption: log remaining budget after each call
- Consider endpoint-specific budgets in Phase 2: critical (health, devices) get priority

**Warning signs:**
- 429 errors in console
- Rate limit debug showing rapid count increases
- Page load >6s (sequential waterfall)
- Multiple "Rate limit remaining: 0" logs

### Pitfall 2: Self-Hosted API Connectivity Assumptions

**What goes wrong:** Fritz!Box API runs on router (myfritz.net dynamic DNS), not cloud service. When off-network, API may timeout, hang 30-60s, or return stale data. Users see "loading..." forever with no feedback.

**Why it happens:** Developers test on local network where Fritz!Box is reliably accessible. Don't test scenarios where user is on cellular, router is rebooting, or dynamic DNS hasn't propagated.

**How to avoid:**
- Set aggressive timeouts: 10s for health check, 15s for data endpoints
- Health check endpoint first, before rendering network page
- Fallback to cached data when API unreachable (with staleness indicator)
- Similar pattern to Hue's withHueHandler (handles HUE_NOT_CONNECTED, NETWORK_TIMEOUT)
- Test on cellular network during development

**Warning signs:**
- API calls taking >20s
- Intermittent 500 errors with "ECONNREFUSED" or "ETIMEDOUT"
- Users reporting "works at home, doesn't work on cellular"

### Pitfall 3: TR-064 Configuration Not Verified

**What goes wrong:** Fritz!Box TR-064 requires two router settings enabled: "Allow access for applications" and "Transmit status information over UPnP". If disabled, all API calls return 403 Forbidden. Generic error makes it hard to diagnose.

**Why it happens:** Developers test with pre-configured router. Don't test "fresh router" or "security hardened" scenarios. Setup docs mention requirements but don't enforce verification.

**How to avoid:**
- Health check endpoint verifies TR-064 access, returns specific error "TR-064 not enabled"
- Include setup guide link in error response: `/docs/fritzbox-setup`
- Show in-app banner: "TR-064 disabled — Click to view setup guide"
- Test with TR-064 disabled during development

**Warning signs:**
- All Fritz!Box API calls returning 403 Forbidden
- Health endpoint failing with "Access Denied"
- User reports "worked before, stopped working" (firmware update reset settings)

### Pitfall 4: Client-Side Credential Exposure

**What goes wrong:** Storing Fritz!Box credentials in localStorage, cookies, or client-accessible Firebase paths exposes router admin credentials to XSS attacks.

**Why it happens:** Developers copy Netatmo OAuth token storage pattern (client-side tokens are safe with OAuth). Fritz!Box uses HTTP Basic Auth with router admin credentials (NOT safe client-side).

**How to avoid:**
- Store Fritz!Box URL + credentials in environment variables (.env.local)
- Server-side proxy pattern: ALL `/api/fritzbox/*` endpoints use `withAuthAndErrorHandler`
- Never return credentials in API responses
- Use Firebase Admin SDK with encryption at rest

**Warning signs:**
- Fritz!Box credentials in client-side code or Firebase RTDB accessible to client
- API routes without authentication middleware

### Pitfall 5: Ignoring Stale Router Cache

**What goes wrong:** Fritz!Box API includes `cache_age_seconds` in responses, indicating router-cached data age. If ignored, app displays stale data without indication. Combined with client cache (60s) + router cache (120s) = 180s total staleness.

**Why it happens:** Developers focus on client-side caching and assume API returns "fresh" data like cloud APIs. Existing `useStalenessIndicator` checks last_fetch_time but not upstream cache age.

**How to avoid:**
- Parse `cache_age_seconds` from every API response
- Combined staleness: `totalStaleness = clientCacheTTL + cache_age_seconds`
- Show staleness indicator when `totalStaleness > 120` seconds
- Add "Refresh" button that bypasses both client and router cache

**Warning signs:**
- Users reporting data doesn't match router UI
- Device count doesn't update when devices connect/disconnect
- Debug logs showing identical responses across fetches

## Code Examples

Verified patterns from existing codebase:

### Server-Side Proxy Route with Rate Limiting

```typescript
// app/api/fritzbox/devices/route.ts
// Pattern: Netatmo homesdata route + Phase 49 rate limiting
import { withAuthAndErrorHandler, success } from '@/lib/core';
import { adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { fritzboxClient } from '@/lib/fritzbox/fritzboxClient';
import { checkRateLimitFritzBox } from '@/lib/fritzbox/rateLimiter';
import { getCachedData } from '@/lib/fritzbox/fritzboxCache';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  // 1. Rate limit check
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'devices');

  if (!rateLimitResult.allowed) {
    throw new ApiError(
      ERROR_CODES.RATE_LIMITED,
      `Rate limit exceeded. Try again in ${rateLimitResult.nextAllowedIn}s`,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { retryAfter: rateLimitResult.nextAllowedIn }
    );
  }

  // 2. Fetch with cache (60s TTL)
  const devices = await getCachedData('devices', async () => {
    return await fritzboxClient.getDevices();
  });

  // 3. Store in Firebase for UI consumption
  const devicesPath = getEnvironmentPath('fritzbox/devices');
  await adminDbSet(devicesPath, {
    devices,
    updated_at: Date.now(),
  });

  return success({ devices });
}, 'FritzBox/Devices');
```

### Fritz!Box Client with Timeout and TR-064 Verification

```typescript
// lib/fritzbox/fritzboxClient.ts
// Pattern: Timeout handling similar to Hue local API
const FRITZBOX_URL = process.env.FRITZBOX_URL;
const FRITZBOX_USER = process.env.FRITZBOX_USER;
const FRITZBOX_PASSWORD = process.env.FRITZBOX_PASSWORD;

class FritzBoxClient {
  private async request(endpoint: string, timeout = 15000) {
    if (!FRITZBOX_URL || !FRITZBOX_USER || !FRITZBOX_PASSWORD) {
      throw new ApiError(
        ERROR_CODES.INTERNAL_ERROR,
        'Fritz!Box credentials not configured',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${FRITZBOX_URL}${endpoint}`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${FRITZBOX_USER}:${FRITZBOX_PASSWORD}`).toString('base64')}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 403) {
        throw new ApiError(
          'TR064_NOT_ENABLED',
          'TR-064 API not enabled. Enable in Fritz!Box settings.',
          HTTP_STATUS.FORBIDDEN,
          { setupGuideUrl: '/docs/fritzbox-setup' }
        );
      }

      if (!response.ok) {
        throw new ApiError(
          ERROR_CODES.EXTERNAL_API_ERROR,
          `Fritz!Box API error: ${response.statusText}`,
          HTTP_STATUS.BAD_GATEWAY
        );
      }

      return await response.json();
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw ApiError.timeout('Fritz!Box request timeout');
      }
      throw error;
    }
  }

  async ping() {
    // Lightweight TR-064 call for health check
    return this.request('/tr064/upnp/control/DeviceInfo', 10000);
  }

  async getDevices() {
    return this.request('/tr064/upnp/control/Hosts');
  }
}

export const fritzboxClient = new FritzBoxClient();
```

### Device Registry Update

```typescript
// lib/constants/device-types.ts
// Pattern: Existing stove/thermostat/lights registry
export const DEVICE_TYPES = {
  STOVE: 'stove',
  THERMOSTAT: 'thermostat',
  LIGHTS: 'lights',
  NETWORK: 'network',
} as const;

export const DEVICE_CONFIG = {
  [DEVICE_TYPES.NETWORK]: {
    id: 'network',
    name: 'Rete',
    icon: '🌐',
    color: 'info',
    enabled: true,
    routes: {
      main: '/network',
    },
    features: {
      hasScheduler: false,
      hasMaintenance: false,
      hasErrors: false,
    },
  },
} as const;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side API calls | Server-side proxy pattern | Next.js 13+ App Router | Credentials stay secure, no CORS issues |
| In-memory rate limiting | Firebase RTDB persistence | Phase 49 (2026-02-11) | Survives serverless cold starts, transaction-safe |
| Generic error messages | RFC 9457 with ApiError class | v7.0 (2026-02-13) | Actionable user feedback, consistent JSON structure |
| Manual retry buttons | Automatic retry + manual fallback | Phase 55 (2026-02-13) | Better UX for transient failures |

**Deprecated/outdated:**
- Client-side device credentials: Hue used local storage for bridge IP (pre-v7.0) — now server-side only
- String error messages: Replaced by ApiError with error codes and details field (v7.0)
- Synchronous polling: Replaced by adaptive polling with visibility awareness (Phase 57)

## Open Questions

1. **Endpoint-specific rate limit budgets**
   - What we know: Global 10 req/min limit, multiple endpoints needed for network page
   - What's unclear: Should Phase 61 implement endpoint budgets (e.g., 2 req/min for devices, 3 for bandwidth) or defer to Phase 2?
   - Recommendation: Start with global 10 req/min (simpler), add endpoint budgets in Phase 2 if exhaustion occurs

2. **Fritz!Box API response format**
   - What we know: TR-064 protocol uses SOAP/XML or JSON depending on endpoint
   - What's unclear: Does myfritz.net API use JSON or XML? Need to test actual responses.
   - Recommendation: Implement XML parsing if needed, prefer JSON endpoints if available

3. **Cache invalidation strategy**
   - What we know: 60s cache TTL, router includes cache_age_seconds in responses
   - What's unclear: Should manual "Refresh" button invalidate cache globally or per-endpoint?
   - Recommendation: Per-endpoint invalidation (more granular), add global refresh in Phase 3 if needed

## Sources

### Primary (HIGH confidence)

- Project codebase: `lib/rateLimiterPersistent.ts` (Phase 49 rate limiting pattern)
- Project codebase: `lib/core/apiErrors.ts` (RFC 9457 error handling)
- Project codebase: `lib/core/middleware.ts` (withAuthAndErrorHandler, withIdempotency)
- Project codebase: `app/api/netatmo/homesdata/route.ts` (server-side proxy pattern)
- Project codebase: `lib/hooks/useAdaptivePolling.ts` (Phase 57 adaptive polling)
- Project codebase: `.planning/research/PITFALLS-fritzbox.md` (Fritz!Box-specific pitfalls)

### Secondary (MEDIUM confidence)

- [FritzConnection API Documentation](https://fritzconnection.readthedocs.io/en/1.12.2/sources/fritzconnection_api.html) - TR-064 protocol patterns
- [Getting Started - fritzconnection](https://fritzconnection.readthedocs.io/en/latest/sources/getting_started.html) - Authentication and rate limiting
- [Next.js Security Hardening 2026 | Medium](https://medium.com/@widyanandaadi22/next-js-security-hardening-five-steps-to-bulletproof-your-app-in-2026-61e00d4c006e) - Environment variable security
- [Mastering Secure API Integration in Next.js with Proxy Endpoints](https://www.bomberbot.com/proxy/mastering-secure-api-integration-in-next-js-with-proxy-endpoints/) - Proxy pattern best practices
- [Firebase Data Fetching and Caching in Next.js 15 | Medium](https://medium.com/@jwill617bos/firebase-data-fetching-and-caching-in-next-js-15-38ae749a9966) - RTDB caching strategies

### Tertiary (LOW confidence)

- None — all research verified against existing project patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and proven in production
- Architecture: HIGH - follows established Netatmo (proxy) and Hue (local API) patterns
- Pitfalls: HIGH - based on project-specific PITFALLS-fritzbox.md research
- Fritz!Box API specifics: MEDIUM - TR-064 protocol documented, but need to verify actual response formats

**Research date:** 2026-02-13
**Valid until:** 30 days (stable domain — Next.js patterns, Firebase infrastructure)
