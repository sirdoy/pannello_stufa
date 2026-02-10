# Phase 49: Persistent Rate Limiting - Research

**Researched:** 2026-02-10
**Domain:** Firebase RTDB transaction-based rate limiting, serverless state persistence
**Confidence:** HIGH

## Summary

Firebase Realtime Database transactions provide atomic read-modify-write operations ideal for implementing persistent rate limiting that survives Vercel cold starts. The current in-memory Map-based rate limiters (`rateLimiter.ts`, `netatmoRateLimiter.ts`, `coordinationNotificationThrottle.ts`) reset on every deployment and cold start, allowing DoS attacks and API quota exhaustion.

Transaction-based rate limiting uses Firebase RTDB as the source of truth with automatic retry on conflicts, ensuring accurate rate limit enforcement even under concurrent requests. The sliding window algorithm stores timestamps in arrays, with automatic cleanup via Cloud Functions or TTL-like patterns.

**Primary recommendation:** Migrate all three rate limiters to Firebase RTDB using `adminDbTransaction()` pattern with feature flags for gradual rollout and in-memory fallback.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase-admin | 13.6.0 | Server-side Firebase operations | Already installed, provides transaction API, bypasses security rules |
| firebase | 12.8.0 | Client-side Firebase (unused for rate limiting) | Already installed, client transactions not needed for this phase |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | - | No additional dependencies needed | Existing Firebase Admin SDK sufficient |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Firebase RTDB | Redis (Upstash, Vercel KV) | Redis offers atomic INCR/EXPIRE but adds infrastructure cost, complexity, and another service dependency. Firebase RTDB already integrated. |
| Firebase RTDB | Firestore transactions | Firestore has better scaling but RTDB simpler for counters/timestamps, existing patterns already use RTDB throughout project |
| Custom cleanup | Firestore TTL policies | RTDB doesn't have native TTL, but manual cleanup via timestamp filters adequate for rate limiting use case |

**Installation:**
```bash
# No new packages needed - firebase-admin@13.6.0 already installed
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── rateLimiter.ts                         # Notification rate limiter (MIGRATE)
├── netatmoRateLimiter.ts                  # Netatmo API rate limiter (MIGRATE)
├── coordinationNotificationThrottle.ts    # Coordination throttle (MIGRATE)
├── rateLimiterPersistent.ts               # NEW: Firebase RTDB-backed notification limiter
├── netatmoRateLimiterPersistent.ts        # NEW: Firebase RTDB-backed Netatmo limiter
├── coordinationThrottlePersistent.ts      # NEW: Firebase RTDB-backed coordination throttle
└── firebaseAdmin.ts                       # Existing: adminDbTransaction() helper
```

### Pattern 1: Transaction-Based Rate Limit Check
**What:** Atomic read-modify-write of rate limit counter/timestamps using Firebase RTDB transactions
**When to use:** Every rate limit check for notifications or API calls
**Example:**
```typescript
// Source: Project's lib/firebaseAdmin.ts + Firebase docs
import { adminDbTransaction } from '@/lib/firebaseAdmin';

interface RateLimitWindow {
  timestamps: number[]; // Array of send timestamps (ms)
  windowStart: number;  // Window start time (ms)
}

export async function checkRateLimit(
  userId: string,
  notifType: string,
  windowMs: number,
  maxPerWindow: number
): Promise<{ allowed: boolean; nextAllowedIn: number }> {
  const path = `rateLimits/${userId}/${notifType}`;
  const now = Date.now();

  try {
    const result = await adminDbTransaction(path, (current) => {
      const data = current as RateLimitWindow | null;

      // Filter to current window
      const timestamps = data?.timestamps ?? [];
      const recentInWindow = timestamps.filter(ts => now - ts < windowMs);

      // Check if limit exceeded
      if (recentInWindow.length >= maxPerWindow) {
        // Don't modify - transaction returns same data (no write)
        return current;
      }

      // Allowed - add new timestamp
      recentInWindow.push(now);
      return {
        timestamps: recentInWindow,
        windowStart: now,
      };
    });

    const data = result as RateLimitWindow;
    const recentCount = data.timestamps.filter(ts => now - ts < windowMs).length;

    if (recentCount >= maxPerWindow) {
      const oldestInWindow = Math.min(...data.timestamps);
      const nextAllowedIn = Math.ceil(((oldestInWindow + windowMs) - now) / 1000);
      return { allowed: false, nextAllowedIn };
    }

    return { allowed: true, nextAllowedIn: 0 };
  } catch (error) {
    console.error('❌ Rate limit transaction failed:', error);
    // CRITICAL: Fallback to in-memory limiter on Firebase failure
    throw error; // Let caller handle fallback
  }
}
```

### Pattern 2: Sliding Window Algorithm
**What:** Store array of timestamps, filter to current window, enforce limit
**When to use:** Notification rate limiting (prevents spam bursts)
**Example:**
```typescript
// Sliding window: Keep last N timestamps, remove expired
function filterToWindow(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter(ts => now - ts < windowMs);
}

// Example: Max 3 notifications per 5 minutes
// Window: [t1, t2, t3, t4, t5, t6, t7]
// Now: t8 (5 min later)
// After filter: [t6, t7] (only t6, t7 within 5 min)
// Allowed: true (2 < 3)
```

### Pattern 3: Feature Flag with Fallback
**What:** Environment variable controls RTDB vs in-memory limiter with graceful degradation
**When to use:** Gradual rollout to production (test on staging first)
**Example:**
```typescript
// Source: REQUIREMENTS.md RATE-05 + feature flag best practices
const USE_PERSISTENT_RATE_LIMITER = process.env.USE_PERSISTENT_RATE_LIMITER === 'true';

export async function checkRateLimit(userId: string, notifType: string) {
  if (!USE_PERSISTENT_RATE_LIMITER) {
    // Fallback: Use existing in-memory limiter
    return checkRateLimitInMemory(userId, notifType);
  }

  try {
    // Try persistent (Firebase RTDB)
    return await checkRateLimitPersistent(userId, notifType);
  } catch (error) {
    console.error('⚠️ Persistent rate limiter failed, falling back to in-memory:', error);
    // Graceful degradation on Firebase failure
    return checkRateLimitInMemory(userId, notifType);
  }
}
```

### Pattern 4: Cleanup via Timestamp Filtering (No TTL)
**What:** RTDB doesn't have native TTL - cleanup happens via filtering stale timestamps on read
**When to use:** Every transaction - filter timestamps older than max retention (1-2 hours)
**Example:**
```typescript
// Pattern: Cleanup on read (no separate cron job needed)
await adminDbTransaction(path, (current) => {
  const data = current as RateLimitWindow | null;
  const now = Date.now();
  const maxRetentionMs = 2 * 60 * 60 * 1000; // 2 hours

  // Filter out timestamps older than retention period
  const timestamps = (data?.timestamps ?? []).filter(ts => now - ts < maxRetentionMs);

  // If no recent activity, return null (deletes node)
  if (timestamps.length === 0) {
    return null; // Transaction deletes the path
  }

  // Otherwise update with cleaned timestamps
  return { timestamps, windowStart: now };
});
```

### Pattern 5: Netatmo API Rate Limiter (50 req/10s)
**What:** Enforce Netatmo API limit of 50 requests per 10 seconds per user
**When to use:** Before every Netatmo API call
**Example:**
```typescript
// Source: Netatmo API docs + REQUIREMENTS.md RATE-04
const NETATMO_LIMIT_10S = 50;
const NETATMO_WINDOW_10S_MS = 10 * 1000;

interface NetatmoRateLimitWindow {
  timestamps: number[]; // Last 50 API call timestamps
  count: number;        // Redundant counter for quick check
}

export async function checkNetatmoRateLimit(userId: string): Promise<{ allowed: boolean }> {
  const path = `rateLimits/${userId}/netatmo_api`;
  const now = Date.now();

  const result = await adminDbTransaction(path, (current) => {
    const data = current as NetatmoRateLimitWindow | null;

    // Filter to 10-second window
    const timestamps = (data?.timestamps ?? []).filter(ts => now - ts < NETATMO_WINDOW_10S_MS);

    if (timestamps.length >= NETATMO_LIMIT_10S) {
      // Limit exceeded - don't modify
      return current;
    }

    // Track this call
    timestamps.push(now);
    return { timestamps, count: timestamps.length };
  });

  const data = result as NetatmoRateLimitWindow;
  return { allowed: data.count < NETATMO_LIMIT_10S };
}
```

### Anti-Patterns to Avoid
- **Anti-pattern:** Separate read + write operations instead of transaction
  - **Why:** Race condition - two concurrent requests both read count=4, both write count=5 (should be 6)
  - **Fix:** Use `adminDbTransaction()` for atomic read-modify-write
- **Anti-pattern:** Storing only counter without timestamps
  - **Why:** Can't implement sliding window, only fixed window (less accurate)
  - **Fix:** Store array of timestamps for true sliding window
- **Anti-pattern:** Infinite timestamp array growth
  - **Why:** Memory leak in RTDB, unbounded storage cost
  - **Fix:** Filter old timestamps on every transaction (cleanup on read)
- **Anti-pattern:** Throwing errors on rate limit exceeded
  - **Why:** Rate limiting is expected behavior, not exceptional case
  - **Fix:** Return `{ allowed: false }` - let caller decide how to handle
- **Anti-pattern:** Using client SDK transactions for rate limiting
  - **Why:** Security rules would expose rate limit internals, slower roundtrip
  - **Fix:** Use Admin SDK server-side only

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Distributed rate limiting | Custom locking with timestamps | Firebase RTDB transactions | Automatic retry on conflict, optimistic concurrency, battle-tested |
| TTL/expiration | Cron job to delete old data | Filter on read + return null | RTDB has no native TTL, filtering adequate for rate limits |
| Feature flags | Custom boolean logic | Environment variable + try/catch fallback | Simple, testable, zero dependencies |
| Transaction retry logic | Manual retry loops | Firebase SDK automatic retry | SDK retries until success or abort (return undefined) |

**Key insight:** Firebase transactions handle all concurrency edge cases (simultaneous writes, stale reads, conflicts). Don't reimplement - trust the SDK's optimistic locking.

## Common Pitfalls

### Pitfall 1: Transaction Callback Called Multiple Times
**What goes wrong:** Transaction function runs 2-5 times on conflicts, causing side effects to execute multiple times
**Why it happens:** Firebase uses optimistic concurrency - retries on conflict with fresh data
**How to avoid:** Keep transaction function PURE (no side effects like logging, API calls). Only read/modify data.
**Warning signs:** Console logs appear 3x for single rate limit check, external API called during transaction

### Pitfall 2: Returning Undefined Aborts Transaction
**What goes wrong:** Transaction silently fails, no data written, `committed: false`
**Why it happens:** `undefined` return value signals "abort" to Firebase
**How to avoid:** Always return data object or `null` (to delete). Never `undefined`.
**Warning signs:** `adminDbTransaction()` throws "Transaction aborted" error

### Pitfall 3: Cold Start Latency Spike
**What goes wrong:** First rate limit check after cold start takes 800ms+ (10x normal)
**Why it happens:** Admin SDK initialization on serverless cold start
**How to avoid:** Accept cold start latency OR warm connections via ping endpoint (not recommended for this use case)
**Warning signs:** Periodic 800ms spikes in API response times

### Pitfall 4: Stale Local Cache in Transactions
**What goes wrong:** Transaction callback receives `null` even though data exists
**Why it happens:** RTDB transactions may start with stale local cache, then retry with server data
**How to avoid:** Always check for `null` and initialize properly. Don't assume data exists.
**Warning signs:** Intermittent `null` data in transaction logs

### Pitfall 5: Firebase Unavailable Edge Case
**What goes wrong:** All rate limiting fails when Firebase RTDB down (rare but possible)
**Why it happens:** External dependency failure
**How to avoid:** Feature flag + fallback to in-memory limiter (RATE-05 requirement)
**Warning signs:** Transaction errors, 503 responses from Firebase

### Pitfall 6: Over-Aggressive Cleanup
**What goes wrong:** Deleting rate limit data too early (1-minute retention instead of 1-hour)
**Why it happens:** Cleanup window shorter than rate limit window
**How to avoid:** Retention period ≥ 2x max rate limit window (e.g., 2 hours for 1-hour windows)
**Warning signs:** Rate limits not enforced correctly, users can spam after waiting 2 minutes

## Code Examples

Verified patterns from official sources:

### Admin SDK Transaction (Existing Pattern)
```typescript
// Source: lib/firebaseAdmin.ts:145-163
export async function adminDbTransaction(
  path: string,
  updateFunction: (currentData: unknown) => unknown
): Promise<unknown> {
  const db = getAdminDatabase();
  const ref = db.ref(path);

  const result = await ref.transaction(updateFunction);

  if (!result.committed) {
    throw new Error('Transaction aborted');
  }

  return result.snapshot.val();
}
```

### In-Memory Rate Limiter (Current Implementation)
```typescript
// Source: lib/rateLimiter.ts:88-137
const recentSends = new Map<string, number[]>();

export function checkRateLimit(
  userId: string,
  notifType: string,
  customLimits: RateLimitConfig | null = null
): RateLimitResult {
  const key = `${userId}:${notifType}`;
  const now = Date.now();
  const limits = customLimits ?? DEFAULT_RATE_LIMITS[notifType] ?? DEFAULT_RATE_LIMITS.default!;
  const windowMs = limits.windowMinutes * 60 * 1000;

  const sends = recentSends.get(key) ?? [];
  const recentInWindow = sends.filter(ts => now - ts < windowMs);

  if (recentInWindow.length >= limits.maxPerWindow) {
    const oldestInWindow = Math.min(...recentInWindow);
    const nextAllowedIn = (oldestInWindow + windowMs) - now;
    return { allowed: false, suppressedCount: recentInWindow.length, nextAllowedIn: Math.ceil(nextAllowedIn / 1000) };
  }

  recentInWindow.push(now);
  recentSends.set(key, recentInWindow);
  return { allowed: true, suppressedCount: 0, nextAllowedIn: 0 };
}
```

### Firebase RTDB Schema for Rate Limits
```javascript
// Recommended structure
{
  "rateLimits": {
    "<userId>": {
      "<notifType>": {
        "timestamps": [1739174400000, 1739174460000, 1739174520000], // Array of send times
        "windowStart": 1739174400000  // First timestamp in current window
      },
      "netatmo_api": {
        "timestamps": [...],
        "count": 12  // Redundant counter for quick checks (optional)
      }
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| In-memory Map storage | Firebase RTDB transactions | Phase 49 (2026-02-10) | Survives cold starts, prevents DoS via deployment spam |
| Fixed cleanup interval | Cleanup on read via timestamp filter | Phase 49 | No separate cron job needed, self-cleaning |
| Single global limiter | Per-user + per-type limiters | v1.0 (Phase 03) | Granular control, user preferences supported |
| Manual retry logic | Firebase SDK automatic retry | Already in use | Simpler code, handles conflicts automatically |

**Deprecated/outdated:**
- **In-memory Map for rate limiting:** Works on single-instance servers but fails on Vercel serverless (cold starts reset state)
- **Firestore for simple counters:** RTDB simpler and cheaper for rate limit use case (single-field reads/writes)
- **Redis for small projects:** Adds cost and complexity when Firebase RTDB already integrated

## Open Questions

1. **Should we use a single RTDB path per user or split by notification type?**
   - What we know: Current in-memory limiter uses `userId:notifType` composite key
   - What's unclear: RTDB path depth vs query performance tradeoff
   - Recommendation: Use `/rateLimits/{userId}/{notifType}` (matches current pattern, allows per-type cleanup)

2. **How to handle Netatmo's dual rate limit (50/10s AND 500/hour)?**
   - What we know: Current `netatmoRateLimiter.ts` only enforces 400/hour (conservative buffer)
   - What's unclear: Should we enforce BOTH limits or just the hourly one?
   - Recommendation: Enforce both - store two windows (`netatmo_api_10s` and `netatmo_api_1h`)

3. **Should rate limit cleanup be synchronous (on read) or async (Cloud Function)?**
   - What we know: Cleanup on read works, but adds latency to every check
   - What's unclear: Is Cloud Function scheduled cleanup worth the complexity?
   - Recommendation: Start with cleanup on read (simpler), move to Cloud Function if latency becomes issue

4. **What's the optimal retention period for old timestamps?**
   - What we know: Current in-memory limiter uses 1 hour max retention
   - What's unclear: RTDB storage cost vs cleanup frequency tradeoff
   - Recommendation: 2 hours retention (2x max window), cleanup on every transaction

## Sources

### Primary (HIGH confidence)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup) - Transaction API, Admin SDK patterns
- [Firebase Realtime Database Limits](https://firebase.google.com/docs/database/usage/limits) - 64 MB/min write limit, 256 MB operation size
- [Optimize Database Performance](https://firebase.google.com/docs/database/usage/optimize) - Transaction best practices, monitoring
- [Firebase RTDB Transaction Retry Behavior](https://bootstrapped.app/guide/how-to-handle-firebase-realtime-database-concurrency-issues) - Automatic retry on conflicts, optimistic concurrency
- Project codebase: `lib/firebaseAdmin.ts`, `lib/rateLimiter.ts`, `lib/netatmoRateLimiter.ts` - Existing patterns

### Secondary (MEDIUM confidence)
- [How to Build Sliding Window Rate Limiting](https://oneuptime.com/blog/post/2026-01-30-sliding-window-rate-limiting/view) - Sliding window algorithm explanation
- [Feature Flags Best Practices (2026)](https://designrevision.com/blog/feature-flags-best-practices) - Gradual rollout, fallback patterns
- [Vercel Serverless Cold Starts](https://vercel.com/blog/scale-to-one-how-fluid-solves-cold-starts) - Cold start performance, state loss
- [Netatmo API Rate Limits](https://helpcenter.netatmo.com/hc/en-us/community/posts/29846852785298-Inconsistent-Rate-Limits-for-Netatmo-Home-Control-API) - 50 req/10s + 500 req/hour limits

### Tertiary (LOW confidence)
- [Firebase RTDB Transaction GitHub Issues](https://github.com/firebase/firebase-admin-node/issues/1831) - Known transaction hang issues (may be SDK bugs)
- [Firestore TTL Policies](https://firebase.google.com/docs/firestore/ttl) - TTL feature exists for Firestore but NOT RTDB (marked for awareness)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - firebase-admin already installed, transaction API well-documented
- Architecture: HIGH - Existing `adminDbTransaction()` helper proven in maintenance tracking
- Pitfalls: MEDIUM - Transaction retry behavior documented, but edge cases need testing
- Netatmo limits: MEDIUM - Community forum sources, official docs not fully verified

**Research date:** 2026-02-10
**Valid until:** 2026-03-12 (30 days - Firebase API stable, rate limiting patterns mature)
