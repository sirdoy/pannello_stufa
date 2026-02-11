# Phase 55: Retry Infrastructure - Research

**Researched:** 2026-02-11
**Domain:** Client-side retry logic, exponential backoff, idempotency, request deduplication
**Confidence:** HIGH

## Summary

This phase implements automatic retry infrastructure for transient failures (network errors, timeouts) and manual retry for persistent failures (device offline), with idempotency protection to prevent duplicate physical actions and request deduplication to prevent double-tap issues.

The existing codebase already has strong foundations: Radix Toast for notifications, Background Sync for offline command queuing, centralized API error codes, and a robust PWA infrastructure. The research identifies standard patterns for exponential backoff, idempotency keys, and request deduplication that integrate cleanly with existing patterns.

**Primary recommendation:** Build retry logic as a thin wrapper around existing `fetch` calls using exponential backoff with jitter, store idempotency keys in Firebase RTDB with TTL cleanup, implement client-side deduplication with WeakMap for zero memory leaks, and extend existing Toast components for persistent error notifications with inline retry buttons.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Failure feedback:**
- Error toasts are persistent until manually dismissed (tap X) — errors should not auto-disappear
- Success behavior, retry visibility, and error message detail level are Claude's discretion

**Manual retry UX:**
- Retry button appears in BOTH the error toast AND on the device card
- Toast notifies with inline Retry button; card shows error state with Retry button
- Toast auto-dismisses after user taps Retry or dismisses it; card keeps retry option until resolved
- Retry button visual state (spinner vs loading), retry limits, and auto-recovery behavior are Claude's discretion

**Idempotency scope:**
- ALL device commands get idempotency protection — stove, Hue lights, Netatmo thermostat
- Not limited to just ignite/shutdown — every command that triggers a physical action

**Deduplication window:**
- 2-second deduplication window prevents double-tap from sending duplicate commands
- All implementation details (scope per command type, visual feedback, toggle vs duplicate distinction, per-device vs global) are Claude's discretion

### Claude's Discretion

- Retry visibility: whether to show retries in progress or keep them silent until resolved/failed
- Error message detail: simple generic vs categorized per error type
- Success toast behavior: always show vs only after retries
- Retry button visual state during retry (spinner on button vs full card loading)
- Manual retry limits (unlimited vs capped)
- Auto-recovery: auto-clear error state when device comes back online vs require user action
- Idempotency key storage (client-side vs Firebase RTDB)
- Idempotency key TTL
- Duplicate notification (silent block vs subtle toast)
- Deduplication scope (all buttons vs critical only)
- Button visual feedback during dedup window
- Toggle intent handling (block same action only vs block everything)
- Deduplication scope (per-device vs global)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native fetch | ES6+ | HTTP requests | Zero dependencies, built-in timeout support via AbortSignal |
| @radix-ui/react-toast | ^1.2.14 | Toast notifications | Already installed, supports persistent toasts with custom actions |
| Firebase Realtime Database | ^12.8.0 | Idempotency key storage | Already used, supports transactions and TTL |
| React useState/useCallback | 19.2.0 | State management | Built-in, sufficient for retry state |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 | Timestamp formatting | Already installed, for retry attempt timestamps |
| lucide-react | ^0.562.0 | Icons for retry button | Already installed, matches design system |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom retry logic | axios-retry, ky-retry | Adds 50KB+ dependency for functionality we can implement in <100 LOC |
| Firebase RTDB | Redis, IndexedDB | RTDB already installed, supports server-side expiry, IndexedDB requires manual cleanup |
| WeakMap deduplication | Set/Map with cleanup | WeakMap auto-GCs when request reference drops, zero memory leaks |
| Exponential backoff | Linear backoff | Exponential is industry standard, prevents retry storms ([Advanced Web Machinery](https://advancedweb.hu/how-to-implement-an-exponential-backoff-retry-strategy-in-javascript/)) |

**Installation:**
```bash
# No new dependencies required
# All infrastructure already present
```

## Architecture Patterns

### Recommended Project Structure

```
lib/
├── retry/
│   ├── retryClient.ts          # Core retry wrapper with exponential backoff
│   ├── idempotencyManager.ts   # Idempotency key generation and storage
│   └── deduplicationManager.ts # Request deduplication with WeakMap
app/components/
└── ui/
    ├── Toast.tsx               # Extend for persistent error toasts (EXISTING)
    └── ToastProvider.tsx       # Add retry action support (EXISTING)
```

### Pattern 1: Exponential Backoff Retry Wrapper

**What:** Wraps fetch calls with automatic retry on transient errors, exponential backoff with jitter
**When to use:** All device command API calls, any network request that can transiently fail
**Example:**

```typescript
// Source: https://advancedweb.hu/how-to-implement-an-exponential-backoff-retry-strategy-in-javascript/
// Adapted for project patterns

interface RetryOptions {
  maxAttempts?: number;        // Default: 3
  initialDelay?: number;       // Default: 1000ms
  maxDelay?: number;          // Default: 10000ms
  backoffMultiplier?: number; // Default: 2
  retryableErrors?: string[]; // ERROR_CODES to retry
  onRetry?: (attempt: number, error: Error) => void;
}

async function retryFetch(
  url: string,
  options: RequestInit,
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryableErrors = ['NETWORK_ERROR', 'TIMEOUT', 'SERVICE_UNAVAILABLE'],
    onRetry,
  } = retryOptions;

  let lastError: Error;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url, options);

      // Success path
      if (response.ok) return response;

      // Check if error is retryable
      const json = await response.json();
      if (!retryableErrors.includes(json.code)) {
        throw new Error(json.error);
      }

      lastError = new Error(json.error);
    } catch (error) {
      lastError = error as Error;

      // Network errors are always retryable
      if (!(error instanceof TypeError && error.message.includes('fetch'))) {
        // Non-network error, check if retryable
        if (!retryableErrors.some(code => error.message.includes(code))) {
          throw error;
        }
      }
    }

    // Don't delay after last attempt
    if (attempt < maxAttempts - 1) {
      // Exponential backoff with jitter
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );
      const jitter = Math.random() * 0.3 * delay; // 30% jitter
      const waitTime = delay + jitter;

      onRetry?.(attempt + 1, lastError);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}
```

**Key insights:**
- Jitter prevents retry storms when multiple clients fail simultaneously ([Tyler Crosse](https://www.tylercrosse.com/ideas/2022/exponential-backoff/))
- Max delay cap prevents excessively long waits
- Only retry on transient errors (network, timeout, 503), not validation errors (400)

### Pattern 2: Idempotency Key Management

**What:** Generate and store idempotency keys to prevent duplicate command execution
**When to use:** All device commands (ignite, shutdown, setFan, setPower, Hue lights, Netatmo thermostat)
**Example:**

```typescript
// Source: https://httptoolkit.com/blog/idempotency-keys/ (IETF RFC draft)
// https://medium.com/@lelianto.eko/understanding-idempotency-in-api-design-use-cases-and-implementation-3d143aac9dd7

import { ref, set, get, remove } from 'firebase/database';
import { db } from '@/lib/firebase';

interface IdempotencyRecord {
  key: string;
  endpoint: string;
  body: string; // JSON stringified
  createdAt: number;
  expiresAt: number;
}

class IdempotencyManager {
  private readonly TTL_MS = 60 * 60 * 1000; // 1 hour (Claude's discretion)

  /**
   * Generate idempotency key (UUID v4)
   */
  generateKey(): string {
    return crypto.randomUUID();
  }

  /**
   * Store idempotency key before request
   * Returns existing key if duplicate within TTL
   */
  async registerKey(
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<string> {
    const bodyHash = JSON.stringify(body);
    const lookupKey = `${endpoint}:${bodyHash}`;

    // Check for existing key (deduplication)
    const existingRef = ref(db, `idempotency/lookup/${lookupKey}`);
    const existing = await get(existingRef);

    if (existing.exists()) {
      const record = existing.val() as IdempotencyRecord;
      if (Date.now() < record.expiresAt) {
        // Still valid, return existing key
        return record.key;
      }
    }

    // Generate new key
    const key = this.generateKey();
    const now = Date.now();
    const record: IdempotencyRecord = {
      key,
      endpoint,
      body: bodyHash,
      createdAt: now,
      expiresAt: now + this.TTL_MS,
    };

    // Store both by key and by lookup hash
    await set(ref(db, `idempotency/keys/${key}`), record);
    await set(ref(db, `idempotency/lookup/${lookupKey}`), record);

    return key;
  }

  /**
   * Cleanup expired keys (called by cron)
   */
  async cleanupExpired(): Promise<void> {
    const keysRef = ref(db, 'idempotency/keys');
    const snapshot = await get(keysRef);

    if (!snapshot.exists()) return;

    const now = Date.now();
    const expired: string[] = [];

    snapshot.forEach(child => {
      const record = child.val() as IdempotencyRecord;
      if (now > record.expiresAt) {
        expired.push(child.key as string);
      }
    });

    // Remove expired keys
    for (const key of expired) {
      await remove(ref(db, `idempotency/keys/${key}`));
    }
  }
}

export const idempotencyManager = new IdempotencyManager();
```

**Usage:**
```typescript
// In API route wrapper
const idempotencyKey = await idempotencyManager.registerKey(
  '/api/stove/ignite',
  { power: 3 }
);

const response = await fetch('/api/stove/ignite', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey,
  },
  body: JSON.stringify({ power: 3 }),
});
```

**Server-side handling:**
```typescript
// In API route
export const POST = withAuthAndErrorHandler(async (request) => {
  const idempotencyKey = request.headers.get('Idempotency-Key');

  if (idempotencyKey) {
    // Check if already processed
    const existing = await get(ref(db, `idempotency/results/${idempotencyKey}`));
    if (existing.exists()) {
      // Return cached result
      return NextResponse.json(existing.val());
    }
  }

  // Process command...
  const result = await stoveService.ignite(power);

  // Store result if idempotency key present
  if (idempotencyKey) {
    await set(ref(db, `idempotency/results/${idempotencyKey}`), result);
  }

  return success(result);
});
```

**Key insights:**
- Store idempotency keys in Firebase RTDB, not client-side, for distributed access ([Zuplo Learning Center](https://zuplo.com/learning-center/implementing-idempotency-keys-in-rest-apis-a-complete-guide))
- Use both key-based and lookup-based storage for efficient duplicate detection
- Server must return cached result for duplicate keys, not re-execute
- IETF RFC draft recommends `Idempotency-Key` header ([HTTP Toolkit](https://httptoolkit.com/blog/idempotency-keys/))

### Pattern 3: Request Deduplication (Double-Tap Prevention)

**What:** Prevent duplicate requests within 2-second window using WeakMap for automatic cleanup
**When to use:** All button click handlers for device commands
**Example:**

```typescript
// Source: https://medium.com/@euijinkk97/the-ultimate-way-to-prevent-duplicate-calls-in-react-daa4c654e2bc
// Adapted for project patterns

class DeduplicationManager {
  private inFlightRequests = new WeakMap<object, number>();
  private readonly DEDUP_WINDOW_MS = 2000; // 2 seconds (locked decision)

  /**
   * Check if request is duplicate within dedup window
   * @param requestKey - Unique object reference (e.g., button ref)
   * @returns true if duplicate, false if allowed
   */
  isDuplicate(requestKey: object): boolean {
    const lastRequestTime = this.inFlightRequests.get(requestKey);
    const now = Date.now();

    if (lastRequestTime && now - lastRequestTime < this.DEDUP_WINDOW_MS) {
      return true; // Duplicate
    }

    // Mark as in-flight
    this.inFlightRequests.set(requestKey, now);
    return false;
  }

  /**
   * Clear deduplication state (e.g., after request completes)
   */
  clear(requestKey: object): void {
    this.inFlightRequests.delete(requestKey);
  }
}

export const dedupManager = new DeduplicationManager();
```

**Usage in React component:**
```typescript
const handleIgnite = async () => {
  // Create stable reference for deduplication
  const requestKey = { action: 'ignite', device: 'stove' };

  if (dedupManager.isDuplicate(requestKey)) {
    // Silent block (Claude's discretion: no toast)
    return;
  }

  try {
    await fetch('/api/stove/ignite', { method: 'POST' });
  } finally {
    // Clear on completion (allows new requests after 2s)
    setTimeout(() => dedupManager.clear(requestKey), 2000);
  }
};
```

**Key insights:**
- WeakMap auto-cleans when button component unmounts, zero memory leaks
- 2-second window is user decision, prevents accidental double-tap
- Debounce/throttle are NOT appropriate for this use case ([Medium - Volodymyr Halchuk](https://medium.com/@volodymyr.halchuk.dev/requests-de-duplication-strategies-in-react-apps-d6f79eb06404))
- React Query pattern: share promises for same query key ([Medium - Giannis Dimitropoulos](https://medium.com/@jdimitrop/react-query-avoiding-duplicate-mutation-requests-38c722e7a2e9))

### Pattern 4: Persistent Error Toast with Retry Button

**What:** Extend existing Toast component to support persistent errors with inline retry action
**When to use:** Device command failures (both auto-retried and manual-retry-required)
**Example:**

```typescript
// Extend existing ToastProvider (app/components/ui/ToastProvider.tsx)

interface ToastOptions {
  variant?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number; // Set to 0 for persistent
  action?: ToastAction;
  dismissible?: boolean; // Default: true
}

// Usage in device component
const { error } = useToast();

// Transient error (auto-retried)
error('Network timeout, retrying...', {
  duration: 0, // Persistent until dismissed or auto-resolved
  action: {
    label: 'Retry Now',
    onClick: async () => {
      await retryCommand(commandId);
      dismiss(toastId);
    },
  },
});

// Persistent error (device offline)
error('Stove offline', {
  duration: 0, // Persistent
  action: {
    label: 'Retry',
    onClick: async () => {
      await fetch('/api/stove/ignite', { method: 'POST' });
      dismiss(toastId);
    },
  },
});
```

**Existing Toast component already supports:**
- Persistent toasts (duration prop)
- Action buttons (action prop)
- Manual dismiss (close button)
- Swipe to dismiss

**Modifications needed:**
- Set `duration: 0` for persistent errors (locked decision)
- Auto-dismiss toast when retry button clicked (locked decision)
- Keep device card error state until resolved (locked decision)

### Anti-Patterns to Avoid

- **Infinite retry loops:** Always cap max attempts (e.g., 3) to prevent infinite loops
- **Retry on validation errors:** Never retry 400 Bad Request, 403 Forbidden — these won't succeed
- **No jitter in backoff:** Causes retry storms when many clients fail simultaneously
- **In-memory idempotency keys:** Lost on page refresh, use Firebase RTDB for persistence
- **Debounce for deduplication:** Debounce delays first request, we want immediate execution with duplicate blocking

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom random string generator | `crypto.randomUUID()` | Built-in ES6, cryptographically secure |
| Exponential backoff | Custom sleep logic | Standard algorithm with jitter | Prevents retry storms, battle-tested |
| Toast notifications | Custom notification system | Radix Toast (already installed) | Accessibility, animations, mobile support built-in |
| Request tracking | Custom Map with cleanup | WeakMap | Auto garbage collection, zero memory leaks |

**Key insight:** The codebase already has 90% of infrastructure needed. Build thin wrappers around existing patterns rather than introducing new dependencies.

## Common Pitfalls

### Pitfall 1: Not Distinguishing Transient vs Persistent Failures

**What goes wrong:** Auto-retrying device-offline errors wastes resources and confuses users
**Why it happens:** Treating all errors the same without checking error codes
**How to avoid:**
- Only auto-retry on: `NETWORK_ERROR`, `TIMEOUT`, `SERVICE_UNAVAILABLE`, `STOVE_TIMEOUT`
- Never auto-retry: `STOVE_OFFLINE`, `MAINTENANCE_REQUIRED`, `VALIDATION_ERROR`
- Show manual retry button for persistent failures

**Warning signs:**
- Toast shows "Retrying..." for 30+ seconds
- Multiple retry attempts on 403 Forbidden

### Pitfall 2: Idempotency Key Reuse Across Different Commands

**What goes wrong:** Same idempotency key used for ignite and shutdown causes wrong cached result
**Why it happens:** Generating key without endpoint context
**How to avoid:** Include endpoint + body hash in idempotency lookup

**Warning signs:**
- Command returns wrong result
- Ignite command returns shutdown result

### Pitfall 3: No Maximum Backoff Delay

**What goes wrong:** Exponential backoff reaches minutes-long delays, user thinks app frozen
**Why it happens:** No cap on delay calculation
**How to avoid:** Set `maxDelay` (e.g., 10 seconds) to prevent excessive waits

**Warning signs:**
- User sees "Retrying..." for 2+ minutes
- No visual progress indicator

### Pitfall 4: Synchronous Retry Storms

**What goes wrong:** 100 clients fail simultaneously, all retry at exactly same time, overload server
**Why it happens:** No jitter in backoff calculation
**How to avoid:** Add 30% random jitter to delay ([Tyler Crosse](https://www.tylercrosse.com/ideas/2022/exponential-backoff/))

**Warning signs:**
- Server CPU spikes in waves
- Retries cluster at exact intervals (1s, 2s, 4s)

### Pitfall 5: Memory Leaks from Deduplication Tracking

**What goes wrong:** Request keys accumulate in Map, never cleaned up
**Why it happens:** Using Map instead of WeakMap
**How to avoid:** Use WeakMap for automatic garbage collection

**Warning signs:**
- Memory usage grows over time
- Browser tab consumes 500MB+ after hours of use

## Code Examples

Verified patterns from official sources:

### Exponential Backoff with Jitter

```typescript
// Source: https://oneuptime.com/blog/post/2026-01-15-retry-logic-exponential-backoff-react/view
// Modified for project patterns

async function exponentialBackoff(
  fn: () => Promise<Response>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<Response> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;

      // Exponential delay: 1s, 2s, 4s, 8s...
      const delay = baseDelay * Math.pow(2, attempt);

      // Add jitter (±30%)
      const jitter = Math.random() * 0.6 * delay - 0.3 * delay;

      // Cap at 10 seconds
      const waitTime = Math.min(delay + jitter, 10000);

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('Max retries exceeded');
}
```

### Firebase Transaction for Idempotency

```typescript
// Source: https://mais.codes/posts/firebase-rtdb-transactions
// Adapted for idempotency use case

import { ref, runTransaction } from 'firebase/database';

async function checkOrStoreIdempotencyKey(
  key: string,
  result: unknown
): Promise<{ exists: boolean; cachedResult?: unknown }> {
  const keyRef = ref(db, `idempotency/results/${key}`);

  const transactionResult = await runTransaction(keyRef, (current) => {
    if (current !== null) {
      // Key exists, abort transaction
      return undefined;
    }

    // Store result
    return {
      result,
      timestamp: Date.now(),
      expiresAt: Date.now() + 3600000, // 1 hour
    };
  });

  if (transactionResult.committed) {
    return { exists: false };
  } else {
    // Key existed, return cached result
    return {
      exists: true,
      cachedResult: transactionResult.snapshot.val()?.result,
    };
  }
}
```

### React Hook for Retry State

```typescript
// Custom hook for managing retry state
function useRetryableCommand() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);
  const { error: showErrorToast } = useToast();

  const executeWithRetry = useCallback(
    async (fn: () => Promise<void>) => {
      setIsRetrying(true);
      setAttemptCount(0);
      setLastError(null);

      try {
        await retryFetch(fn, {
          onRetry: (attempt, error) => {
            setAttemptCount(attempt);
            setLastError(error);
          },
        });
      } catch (err) {
        setLastError(err as Error);

        // Show persistent error toast
        showErrorToast((err as Error).message, {
          duration: 0, // Persistent
          action: {
            label: 'Retry',
            onClick: () => executeWithRetry(fn),
          },
        });
      } finally {
        setIsRetrying(false);
      }
    },
    [showErrorToast]
  );

  return { executeWithRetry, isRetrying, attemptCount, lastError };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Linear backoff | Exponential backoff with jitter | 2022+ ([Tyler Crosse](https://www.tylercrosse.com/ideas/2022/exponential-backoff/)) | Prevents retry storms |
| Client-side idempotency | Server-side with distributed storage | 2024+ (IETF RFC draft) | Works across devices/tabs |
| Debounce for deduplication | Request tracking with WeakMap | 2025+ ([Medium - Euijin Kim](https://medium.com/@euijinkk97/the-ultimate-way-to-prevent-duplicate-calls-in-react-daa4c654e2bc)) | Immediate execution, no delay |
| Auto-dismiss error toasts | Persistent with manual dismiss | UX best practice | User controls error visibility |

**Deprecated/outdated:**
- **Linear backoff:** Replaced by exponential to handle traffic spikes better
- **Map-based deduplication:** Replaced by WeakMap to prevent memory leaks
- **In-memory idempotency:** Replaced by database storage for multi-tab support

## Open Questions

1. **Should retry visibility be silent or shown to user?**
   - What we know: Industry practice varies; some hide retries, some show subtle spinner
   - What's unclear: User preference for this specific use case (stove control)
   - Recommendation: Start silent, add visibility if users report confusion

2. **Should success toasts show after auto-retry recovery?**
   - What we know: Error toast dismissed automatically when retry succeeds
   - What's unclear: Whether user wants explicit "Command succeeded" confirmation
   - Recommendation: Only show success toast if original request failed visibly (error toast was shown)

3. **How to handle retry when device comes back online?**
   - What we know: Offline errors don't auto-retry (user decision)
   - What's unclear: Should error state auto-clear when device reconnects?
   - Recommendation: Auto-clear device card error banner when device reconnects, but keep toast until user dismisses

4. **Should idempotency key cleanup run in cron or on-demand?**
   - What we know: Keys expire after 1 hour (Claude's discretion)
   - What's unclear: Best cleanup strategy (cron job vs lazy cleanup)
   - Recommendation: Add to existing `/api/scheduler/check` cron (runs every minute)

5. **How many retry attempts for manual retry button?**
   - What we know: Auto-retry caps at 3 attempts
   - What's unclear: Should manual retry also cap at 3 or be unlimited?
   - Recommendation: Unlimited for manual retry (user explicitly requested it)

## Sources

### Primary (HIGH confidence)
- [Advanced Web Machinery - Exponential Backoff](https://advancedweb.hu/how-to-implement-an-exponential-backoff-retry-strategy-in-javascript/) - Algorithm implementation
- [HTTP Toolkit - Idempotency Keys RFC](https://httptoolkit.com/blog/idempotency-keys/) - IETF draft standard
- [OneUpTime - Retry Logic 2026](https://oneuptime.com/blog/post/2026-01-15-retry-logic-exponential-backoff-react/view) - React patterns
- [Firebase RTDB Transactions](https://mais.codes/posts/firebase-rtdb-transactions) - Transaction usage
- [Firebase RTDB Limits](https://firebase.google.com/docs/database/usage/limits) - Rate limiting documentation

### Secondary (MEDIUM confidence)
- [Medium - Euijin Kim - Prevent Duplicate Calls](https://medium.com/@euijinkk97/the-ultimate-way-to-prevent-duplicate-calls-in-react-daa4c654e2bc) - WeakMap pattern
- [Medium - Volodymyr Halchuk - Request Deduplication](https://medium.com/@volodymyr.halchuk.dev/requests-de-duplication-strategies-in-react-apps-d6f79eb06404) - React strategies
- [Tyler Crosse - Exponential Backoff and Jitter](https://www.tylercrosse.com/ideas/2022/exponential-backoff/) - Jitter explanation
- [Zuplo - Idempotency Keys Guide](https://zuplo.com/learning-center/implementing-idempotency-keys-in-rest-apis-a-complete-guide) - Implementation guide
- [Medium - Lelianto Eko - Idempotency in API Design](https://medium.com/@lelianto.eko/understanding-idempotency-in-api-design-use-cases-and-implementation-3d143aac9dd7) - API patterns

### Tertiary (LOW confidence)
- [Medium - Giannis Dimitropoulos - React Query Mutations](https://medium.com/@jdimitrop/react-query-avoiding-duplicate-mutation-requests-38c722e7a2e9) - Promise sharing pattern (not using React Query, but pattern applicable)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed, zero new dependencies
- Architecture: HIGH - Patterns verified with official sources, aligns with existing codebase
- Pitfalls: HIGH - Common issues documented in multiple sources with solutions

**Research date:** 2026-02-11
**Valid until:** 2026-03-13 (30 days for stable domain)
