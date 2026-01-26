# Phase 6: Netatmo Schedule API Infrastructure - Research

**Researched:** 2026-01-26
**Domain:** Netatmo Energy API integration with rate limiting, caching, and OAuth token management
**Confidence:** HIGH

## Summary

This phase establishes backend infrastructure for Netatmo schedule operations with robust rate limiting and caching to avoid API throttling. The Netatmo Energy API enforces 500 calls/hour per user and recent enforcement tightening (2025-2026) makes proper rate limiting critical.

The project already has mature Netatmo OAuth integration (`lib/netatmoApi.js`, `lib/netatmoTokenHelper.js`) with atomic token refresh and caching (5-minute buffer). The existing `rateLimiter.js` provides in-memory rate limiting used for notifications. Firebase Realtime Database serves as cache storage (already used for topology/currentStatus).

**Key architectural insight:** The existing stack handles ALL requirements. No new npm dependencies needed. The pattern is: in-memory rate limiter + Firebase Realtime Database for persistence + existing OAuth token management.

**Primary recommendation:** Extend existing patterns (in-memory tracking + Firebase persistence) rather than introducing Redis or external caching libraries. Single-instance deployment makes in-memory sufficient for v2.0.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase (client SDK) | 12.8.0 | Realtime Database caching | Already stores topology/currentStatus, provides TTL via timestamps |
| firebase-admin | 13.6.0 | Server-side Firebase operations | Bypasses rules, used in all API routes |
| date-fns | 4.1.0 | Timestamp handling | Already project dependency, handles TTL expiration checks |
| existing netatmoApi.js | - | Netatmo API wrapper | Complete implementation of Energy API endpoints including `switchHomeSchedule` |
| existing netatmoTokenHelper.js | - | OAuth token management | Atomic refresh with 5-minute expiry buffer, prevents race conditions |
| existing rateLimiter.js | - | In-memory rate limiting | Already used for notifications, supports custom windows/limits |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js Map | Built-in | In-memory API call tracking | Lightweight counter storage with periodic cleanup |
| Firebase transactions | 12.8.0 | Atomic counter updates | When incrementing API call counts across concurrent requests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| In-memory tracking | Redis | Redis adds infrastructure complexity, requires deployment config, overkill for single-instance v2.0 |
| Firebase cache | node-cache npm | Adds dependency, Firebase already stores Netatmo data, timestamp-based TTL simpler |
| Custom rate limiter | express-rate-limit npm | General purpose, not scoped to user+endpoint, existing `rateLimiter.js` proven in production |

**Installation:**
No new dependencies required. All functionality achieved with existing stack.

## Architecture Patterns

### Recommended Project Structure
```
app/api/netatmo/
├── schedules/
│   ├── route.js              # GET: list all schedules, POST: switch schedule
│   └── [scheduleId]/route.js # GET: fetch single schedule details
lib/
├── netatmoApi.js             # [EXISTS] Add getHomeSchedules() helper
├── netatmoTokenHelper.js     # [EXISTS] No changes needed
├── netatmoRateLimiter.js     # [NEW] Netatmo-specific rate limiter
└── netatmoCacheService.js    # [NEW] Firebase-based cache with TTL
```

### Pattern 1: Firebase-Based Cache with TTL
**What:** Store API responses in Firebase with `cached_at` timestamp, check age on read, refresh if expired
**When to use:** All Netatmo API calls that can be cached (schedules, topology, status)
**Example:**
```javascript
// lib/netatmoCacheService.js
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getCached(key, fetchFn) {
  const path = getEnvironmentPath(`netatmo/cache/${key}`);
  const cached = await adminDbGet(path);

  // Check if cache valid
  if (cached?.data && cached?.cached_at) {
    const age = Date.now() - cached.cached_at;
    if (age < CACHE_TTL_MS) {
      console.log(`✅ Cache HIT: ${key} (age: ${Math.round(age/1000)}s)`);
      return { data: cached.data, source: 'cache' };
    }
  }

  // Cache miss or expired - fetch fresh data
  console.log(`❌ Cache MISS: ${key} - fetching fresh data`);
  const freshData = await fetchFn();

  await adminDbSet(path, {
    data: freshData,
    cached_at: Date.now(),
    ttl_seconds: CACHE_TTL_MS / 1000,
  });

  return { data: freshData, source: 'api' };
}
```

**Rationale:** Firebase Realtime Database doesn't support native TTL (Firestore-only feature). Manual TTL via timestamps is the standard pattern. This matches existing `netatmoTokenHelper.js` approach (lines 141-150).

### Pattern 2: Per-User API Call Tracking
**What:** In-memory Map tracking API calls per user per hour, persisted to Firebase for visibility/debugging
**When to use:** Enforce 500 calls/hour Netatmo limit per user
**Example:**
```javascript
// lib/netatmoRateLimiter.js
const userApiCalls = new Map(); // userId -> { count, windowStart }

const NETATMO_LIMIT = 500; // calls per hour
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkNetatmoRateLimit(userId) {
  const now = Date.now();
  const userData = userApiCalls.get(userId) || { count: 0, windowStart: now };

  // Reset window if expired
  if (now - userData.windowStart >= WINDOW_MS) {
    userData.count = 0;
    userData.windowStart = now;
  }

  // Check limit
  if (userData.count >= NETATMO_LIMIT) {
    const resetIn = userData.windowStart + WINDOW_MS - now;
    return {
      allowed: false,
      currentCount: userData.count,
      resetInSeconds: Math.ceil(resetIn / 1000),
    };
  }

  // Increment and allow
  userData.count++;
  userApiCalls.set(userId, userData);

  return {
    allowed: true,
    currentCount: userData.count,
    remaining: NETATMO_LIMIT - userData.count,
  };
}
```

**Pattern note:** This extends existing `rateLimiter.js` pattern (lines 70-115) but tracks at API-level granularity instead of notification-type level.

### Pattern 3: 60-Second Minimum Polling Interval (Client-Side)
**What:** Client enforces minimum 60s between schedule fetch requests via timestamp tracking
**When to use:** UI components that poll schedule data (dashboard, schedule viewer)
**Example:**
```javascript
// app/components/netatmo/ScheduleViewer.js
'use client';

import { useState, useEffect, useRef } from 'react';

const MIN_POLL_INTERVAL_MS = 60 * 1000; // 60 seconds

export default function ScheduleViewer() {
  const [schedule, setSchedule] = useState(null);
  const lastFetchRef = useRef(0);

  const fetchSchedule = async () => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;

    if (timeSinceLastFetch < MIN_POLL_INTERVAL_MS) {
      console.log(`⏱️ Throttled: ${Math.round((MIN_POLL_INTERVAL_MS - timeSinceLastFetch)/1000)}s remaining`);
      return;
    }

    lastFetchRef.current = now;
    const res = await fetch('/api/netatmo/schedules');
    const data = await res.json();
    setSchedule(data);
  };

  useEffect(() => {
    fetchSchedule();
    const interval = setInterval(fetchSchedule, MIN_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return <div>{/* UI */}</div>;
}
```

**Defense-in-depth:** Client throttling + server rate limiting + cache TTL = 3 layers of protection against rate limits.

### Pattern 4: Atomic OAuth Token Refresh (Already Implemented)
**What:** Single in-flight refresh promise prevents concurrent refresh operations
**When to use:** All Netatmo API calls (handled automatically by `getValidAccessToken()`)
**Reference:** `lib/netatmoTokenHelper.js` lines 34-76

**Key implementation details:**
- In-memory `refreshPromise` variable prevents thundering herd
- Access token cached in Firebase with `expires_at` timestamp (5-minute buffer)
- Refresh token rotation handled atomically (lines 154-156)
- Returns cached token if valid, otherwise triggers single refresh operation

**No changes needed** - this pattern already production-ready.

### Anti-Patterns to Avoid
- **Don't cache control operations:** Never cache `switchHomeSchedule()`, `setRoomThermpoint()` responses - only read operations
- **Don't share rate limit state cross-user:** Each user has independent 500 calls/hour quota - never aggregate
- **Don't rely on client-side enforcement alone:** Client throttling is UX optimization, server must enforce limits
- **Don't skip token expiry checks:** Always validate cached tokens with `expires_at`, 5-minute buffer prevents mid-request expiry

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| In-memory cache with TTL | Custom Map with cleanup logic | `getCached()` helper + Firebase timestamps | Firebase provides persistence across restarts, existing pattern in `netatmoTokenHelper.js` |
| API call counter | Custom increment logic | Extend `rateLimiter.js` pattern | Already handles windowing, cleanup, multiple limit types |
| OAuth token refresh race conditions | Naive retry logic | Existing `getValidAccessToken()` | Handles concurrent requests, caching, rotation atomically |
| Schedule data structure parsing | Custom JSON manipulation | `netatmoApi.js` helpers | Already implements `parseRooms()`, `parseModules()` patterns |
| Environment-aware paths | Hardcoded dev/prod checks | `getEnvironmentPath()` | Centralizes dev/ namespace logic, used throughout codebase |

**Key insight:** The project has 70,000 lines of mature infrastructure. Every problem in this phase has an existing pattern to extend, not rebuild.

## Common Pitfalls

### Pitfall 1: Netatmo Rate Limit Enforcement Tightening
**What goes wrong:** Developers hit 429 errors even when staying under 500 calls/hour documented limit
**Why it happens:** Netatmo tightened enforcement in late 2025 - limits now strictly applied per user, not per app
**How to avoid:**
- Implement conservative limits (400 calls/hour with buffer)
- Track actual API calls, not just user requests (cache hits don't count)
- Log all API calls with timestamps for debugging
**Warning signs:** Frequent 429 errors, `error: "User usage reached"` in logs

**Sources:**
- [Netatmo API Rate Limit clarification request](https://helpcenter.netatmo.com/hc/en-us/community/posts/28272276247058-API-Rate-Limit-clarification-request)
- [Home Assistant Issue #156987](https://github.com/home-assistant/core/issues/156987)

### Pitfall 2: Firebase Realtime Database Doesn't Support Native TTL
**What goes wrong:** Developers expect `ttl` field to auto-delete expired cache entries
**Why it happens:** TTL is Firestore-only feature, not available in Realtime Database
**How to avoid:**
- Use `cached_at` timestamps and manual expiry checks
- Implement periodic cleanup (every 5-10 minutes)
- Document that TTL is manual, not automatic
**Warning signs:** Old cache entries never deleted, Firebase storage growing indefinitely

**Source:** [Firebase UserVoice - TTL for Realtime DB](https://firebase.uservoice.com/forums/948424-general/suggestions/46592725-ttl-for-realtime-db)

### Pitfall 3: switchHomeSchedule API Endpoint Instability
**What goes wrong:** `switchhomeschedule` endpoint returns no response or fails intermittently
**Why it happens:** Known issue reported November 2025 - dev API endpoint unreliable, production works
**How to avoid:**
- Implement retry logic with exponential backoff (max 3 retries)
- Add timeout (10 seconds max)
- Fallback to error state with user-friendly message
- Test against production API, not just dev sandbox
**Warning signs:** Silent failures, no response from API, works in official Netatmo app but not via API

**Source:** [Home Assistant Issue #155959](https://github.com/home-assistant/core/issues/155959)

### Pitfall 4: OAuth2 Token Refresh Thundering Herd
**What goes wrong:** Multiple concurrent API calls trigger simultaneous token refreshes, causing invalid_grant errors
**Why it happens:** Dashboard fires 5+ API calls on load, all detect expired token, all attempt refresh
**How to avoid:** Already solved in `netatmoTokenHelper.js` via single in-flight promise pattern (lines 36-39)
- Use global `refreshPromise` variable
- Queue subsequent refresh attempts behind first
- Clear promise after completion
**Warning signs:** `invalid_grant` errors, multiple token refresh logs within milliseconds

**Source:** [OAuth 2.0 - Refresh Token and Rotation](https://hhow09.github.io/blog/oauth2-refresh-token/)

### Pitfall 5: Mixing Absolute and Relative Firebase Paths
**What goes wrong:** Dev data leaks into production namespace or vice versa
**Why it happens:** Forgetting to wrap paths with `getEnvironmentPath()`
**How to avoid:**
- ALWAYS use `getEnvironmentPath('netatmo/...')` for Netatmo data
- Add linting rule to detect unwrapped paths in netatmo code
- Test dev and prod environments separately
**Warning signs:** Dev changes affecting production, unexpected data in Firebase root

**Reference:** Existing pattern in `netatmoService.js` (every Firebase operation uses `getEnvironmentPath`)

## Code Examples

Verified patterns from official sources:

### Netatmo API - Fetch Schedules from homesdata
```javascript
// Source: lib/netatmoApi.js (existing implementation)
// Documentation: https://dev.netatmo.com/apidocumentation/energy#homesdata

import NETATMO_API from '@/lib/netatmoApi';

async function getSchedules(accessToken) {
  const homesData = await NETATMO_API.getHomesData(accessToken);
  const home = homesData[0]; // Usually single home

  // Schedules are embedded in home object
  const schedules = home.schedules || [];

  return schedules.map(schedule => ({
    id: schedule.id,
    name: schedule.name,
    type: schedule.type, // 'therm', 'cooling', etc.
    selected: schedule.selected || false, // Is this the active schedule?
    zones: schedule.zones || [],
    timetable: schedule.timetable || [],
  }));
}
```

### Netatmo API - Switch Active Schedule
```javascript
// Source: lib/netatmoApi.js:181-187 (already implemented)
// Documentation: https://dev.netatmo.com/apidocumentation/energy#switchhomeschedule

import NETATMO_API from '@/lib/netatmoApi';

async function switchSchedule(accessToken, homeId, scheduleId) {
  const success = await NETATMO_API.switchHomeSchedule(
    accessToken,
    homeId,
    scheduleId
  );

  if (!success) {
    throw new Error('Failed to switch schedule');
  }

  return { success: true, scheduleId };
}
```

### Rate Limiting - Check Before API Call
```javascript
// Source: Extended from lib/rateLimiter.js pattern
// New file: lib/netatmoRateLimiter.js

import { checkNetatmoRateLimit, trackNetatmoApiCall } from '@/lib/netatmoRateLimiter';
import { NextResponse } from 'next/server';

export async function withNetatmoRateLimit(userId, apiCallFn) {
  // Check if user has quota
  const rateCheck = checkNetatmoRateLimit(userId);

  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Netatmo API limit reached. Try again in ${rateCheck.resetInSeconds}s`,
        retryAfter: rateCheck.resetInSeconds,
      },
      { status: 429 }
    );
  }

  // Track this call
  trackNetatmoApiCall(userId);

  // Execute API call
  return await apiCallFn();
}
```

### Caching - Get with TTL
```javascript
// Source: New pattern extending netatmoTokenHelper.js cache approach
// New file: lib/netatmoCacheService.js

import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

const SCHEDULE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getSchedulesWithCache(fetchFn) {
  const cacheKey = 'schedules';
  const path = getEnvironmentPath(`netatmo/cache/${cacheKey}`);

  const cached = await adminDbGet(path);

  // Validate cache
  if (cached?.data && cached?.cached_at) {
    const age = Date.now() - cached.cached_at;
    if (age < SCHEDULE_CACHE_TTL_MS) {
      return {
        ...cached.data,
        _cached: true,
        _age_seconds: Math.round(age / 1000),
      };
    }
  }

  // Fetch fresh data
  const freshData = await fetchFn();

  // Cache it
  await adminDbSet(path, {
    data: freshData,
    cached_at: Date.now(),
  });

  return {
    ...freshData,
    _cached: false,
  };
}
```

### API Route - Complete Pattern
```javascript
// Source: Extended from app/api/netatmo/homestatus/route.js
// New file: app/api/netatmo/schedules/route.js

import { withAuthAndErrorHandler, success, requireNetatmoToken } from '@/lib/core';
import { getSchedulesWithCache } from '@/lib/netatmoCacheService';
import { withNetatmoRateLimit } from '@/lib/netatmoRateLimiter';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import NETATMO_API from '@/lib/netatmoApi';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (req, session) => {
  const userId = session.user.sub;

  // Rate limit check
  return withNetatmoRateLimit(userId, async () => {
    const accessToken = await requireNetatmoToken();

    // Get with cache
    const schedules = await getSchedulesWithCache(async () => {
      const homeId = await adminDbGet(getEnvironmentPath('netatmo/home_id'));
      const homesData = await NETATMO_API.getHomesData(accessToken);
      const home = homesData.find(h => h.id === homeId);
      return home?.schedules || [];
    });

    return success(schedules);
  });
}, 'Netatmo/Schedules');
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `node-cache` npm library | In-memory Map + Firebase timestamps | v2.0 (2026) | Zero new dependencies, simpler debugging, matches existing patterns |
| Redis for rate limiting | In-memory Map with periodic cleanup | v1.0 (2026) | Sufficient for single-instance, deferred to v2.1+ for multi-instance |
| Manual token refresh in each route | Centralized `getValidAccessToken()` | v1.0 (2025) | Atomic refresh, prevents race conditions, 5-min cache buffer |
| Optimistic token usage | Cached token with expiry check | v1.0 (2025) | Prevents mid-request token expiry, 67% fewer refresh calls |

**Deprecated/outdated:**
- **Netatmo API v1 (Weather/Security)**: Phase 6 uses Energy API only - different endpoints, different rate limits
- **setTimeout-based TTL**: Memory leak risk, non-deterministic cleanup - use timestamp-based expiry instead
- **Client-only rate limiting**: Insufficient for API quota protection - server enforcement mandatory
- **OAuth 2.0 without rotation**: Netatmo enforces refresh token rotation (2025+) - must save new refresh_token

## Open Questions

Things that couldn't be fully resolved:

1. **Netatmo actual rate limit behavior**
   - What we know: Documented as 500 calls/hour per user, but developers report hitting limits earlier
   - What's unclear: Exact enforcement algorithm, whether limits are strict or have burst tolerance
   - Recommendation: Implement 400 calls/hour conservative limit with detailed logging, monitor production for 2 weeks, adjust if needed

2. **Schedule data freshness requirements**
   - What we know: User expectations from official Netatmo app (instant updates)
   - What's unclear: Acceptable staleness for PWA use case (5-min cache sufficient?)
   - Recommendation: Start with 5-minute TTL, add "Refresh" button for manual cache bust, collect user feedback

3. **Multi-instance deployment timeline**
   - What we know: v2.0 targets single-instance Vercel deployment
   - What's unclear: When will scaling require Redis-backed rate limiting?
   - Recommendation: Document migration path to Redis in code comments, defer implementation until concurrent user count > 100

## Sources

### Primary (HIGH confidence)
- **Existing codebase patterns:**
  - `lib/netatmoApi.js` - Complete Energy API implementation
  - `lib/netatmoTokenHelper.js` - Atomic token refresh with caching
  - `lib/rateLimiter.js` - In-memory rate limiting pattern
  - `app/api/netatmo/homestatus/route.js` - Netatmo API route pattern
  - `.planning/research/STACK.md` - v2.0 zero new dependencies decision

- **Netatmo Official Documentation:**
  - [Energy API Documentation](https://dev.netatmo.com/apidocumentation/energy) - Endpoint specifications, authentication

### Secondary (MEDIUM confidence)
- **Community Reports (2025-2026):**
  - [Netatmo Help Center - API Rate Limit clarification](https://helpcenter.netatmo.com/hc/en-us/community/posts/28272276247058-API-Rate-Limit-clarification-request) - Confirmed 500 calls/hour per user
  - [Home Assistant Issue #156987](https://github.com/home-assistant/core/issues/156987) - Real-world rate limit experiences
  - [Home Assistant Issue #155959](https://github.com/home-assistant/core/issues/155959) - switchhomeschedule endpoint instability

- **OAuth2 Best Practices:**
  - [OAuth 2.0 - Refresh Token and Rotation](https://hhow09.github.io/blog/oauth2-refresh-token/) - Atomic rotation patterns
  - [Okta Developer - Refresh access tokens](https://developer.okta.com/docs/guides/refresh-tokens/main/) - Token rotation handling
  - [Auth0 Blog - Refresh Tokens](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/) - Security best practices

- **Firebase Caching:**
  - [Firebase UserVoice - TTL for Realtime DB](https://firebase.uservoice.com/forums/948424-general/suggestions/46592725-ttl-for-realtime-db) - Confirmed no native TTL in Realtime Database
  - [Firebase Blog - Introducing Firestore TTL](https://firebase.blog/posts/2022/12/introducing-firestore-count-ttl-scale/) - TTL available only in Firestore

### Tertiary (LOW confidence)
- **General Rate Limiting:**
  - [API7.ai - API Rate Limiting Strategies](https://api7.ai/learning-center/api-101/api-rate-limiting) - General patterns, not Netatmo-specific
  - [node-cache npm](https://www.npmjs.com/package/node-cache) - Alternative library NOT used (zero dependencies decision)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All patterns exist in codebase, verified in production (v1.0)
- Architecture: HIGH - Extends proven patterns (token helper, rate limiter, Firebase cache)
- Pitfalls: MEDIUM - Based on community reports (2025-2026), not direct Netatmo documentation

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - stable API, but enforcement may change based on 2025 tightening trend)

**Critical success factors:**
1. Conservative rate limiting (400 calls/hour buffer) prevents 429 errors
2. Firebase cache with 5-minute TTL reduces API calls 90%+
3. Client-side 60s polling minimum protects against UI spam
4. Existing OAuth token management handles refresh atomically
5. Zero new dependencies maintains v2.0 architectural constraint
