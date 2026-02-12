# Phase 57: Adaptive Polling - Research

**Researched:** 2026-02-12
**Domain:** Client-side polling optimization with Page Visibility API and Network Information API
**Confidence:** HIGH

## Summary

Phase 57 implements adaptive polling that automatically pauses when browser tab is hidden and adjusts intervals based on network conditions to reduce resource usage without compromising safety. The Page Visibility API is a well-established standard (2013) with excellent browser support that enables visibility-aware polling. Network Information API provides connection quality detection but has limited browser support and should be used as progressive enhancement only.

Current codebase already implements basic adaptive polling in StoveCard (15s when on, 60s when off) and uses fixed intervals across other cards (ThermostatCard: 30s, CronHealthBanner: 30s). This phase centralizes and enhances the pattern with visibility awareness while preserving the safety-critical 5-second stove status polling requirement.

**Primary recommendation:** Create centralized `useAdaptivePolling` hook that manages visibility, intervals, and network conditions. Use Page Visibility API as core feature, Network Information API as progressive enhancement with fallback.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Page Visibility API | W3C Standard | Detect tab visibility state | Native browser API, 98%+ support, zero dependencies |
| React hooks (built-in) | 19.2.0 | State and effect management | Project uses React 19.2.0 |
| TypeScript | strict mode | Type safety | Project uses strict TypeScript |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Network Information API | Experimental | Detect connection quality | Progressive enhancement only (limited support) |
| date-fns | 4.1.0 | Time formatting for staleness | Already in project for date operations |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom hook | react-page-visibility (npm) | Library adds 2KB, hooks are 20 lines of code |
| Built-in API | Online/Offline events only | Visibility API catches tab switching, online/offline misses it |
| Fixed intervals | Exponential backoff | Safety-critical data needs predictable timing |

**Installation:**
```bash
# No new dependencies needed - all browser APIs + existing React
```

## Architecture Patterns

### Recommended Project Structure

```
lib/hooks/
├── useAdaptivePolling.ts       # New: centralized polling hook
├── useVisibility.ts            # New: Page Visibility wrapper
├── useNetworkQuality.ts        # New: Network Information wrapper (optional)
├── useDeviceStaleness.ts       # Existing: enhanced with visibility
└── __tests__/
    ├── useAdaptivePolling.test.ts
    ├── useVisibility.test.ts
    └── useNetworkQuality.test.ts

app/components/devices/
├── stove/StoveCard.tsx         # Update: use useAdaptivePolling
├── thermostat/ThermostatCard.tsx  # Update: use useAdaptivePolling
└── lights/LightsCard.tsx       # Update: use useAdaptivePolling
```

### Pattern 1: useVisibility Hook

**What:** Wrapper around Page Visibility API for React
**When to use:** Any component that needs to know if tab is visible
**Example:**

```typescript
// Source: MDN + React best practices
// https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API

'use client';
import { useState, useEffect } from 'react';

export function useVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Initialize with current state
    setIsVisible(!document.hidden);

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
```

### Pattern 2: useAdaptivePolling Hook with Visibility Awareness

**What:** Declarative interval management that respects tab visibility
**When to use:** Any polling operation that should pause when tab is hidden
**Example:**

```typescript
// Source: Inspired by Dan Abramov's useInterval + Page Visibility
// https://overreacted.io/making-setinterval-declarative-with-react-hooks/

'use client';
import { useEffect, useRef } from 'react';
import { useVisibility } from './useVisibility';

interface UseAdaptivePollingOptions {
  /** Callback to execute on each interval */
  callback: () => void | Promise<void>;
  /** Interval in milliseconds (null = paused) */
  interval: number | null;
  /** If true, never pause on visibility change (safety-critical) */
  alwaysActive?: boolean;
  /** If true, run immediately on mount */
  immediate?: boolean;
}

export function useAdaptivePolling({
  callback,
  interval,
  alwaysActive = false,
  immediate = true
}: UseAdaptivePollingOptions): void {
  const savedCallback = useRef(callback);
  const isVisible = useVisibility();

  // Update callback ref on each render (avoids stale closures)
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Run immediately on mount if requested
  useEffect(() => {
    if (immediate && interval !== null) {
      savedCallback.current();
    }
  }, []); // Only on mount

  // Manage interval lifecycle
  useEffect(() => {
    // Don't set interval if:
    // - interval is null (explicitly paused)
    // - tab is hidden AND not safety-critical
    const shouldPause = !alwaysActive && !isVisible;
    if (interval === null || shouldPause) {
      return;
    }

    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval, isVisible, alwaysActive]);
}
```

### Pattern 3: Network-Aware Interval Adjustment (Progressive Enhancement)

**What:** Adjust polling intervals based on connection quality
**When to use:** Non-critical data (weather, tokens) where slower updates are acceptable
**Example:**

```typescript
// Source: Network Information API + MDN
// https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API

'use client';
import { useState, useEffect } from 'react';

type NetworkQuality = 'slow' | 'fast' | 'unknown';

export function useNetworkQuality(): NetworkQuality {
  const [quality, setQuality] = useState<NetworkQuality>('unknown');

  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    // Check if Network Information API is available
    const connection = (navigator as any).connection ||
                       (navigator as any).mozConnection ||
                       (navigator as any).webkitConnection;

    if (!connection) {
      setQuality('unknown'); // API not supported, assume fast
      return;
    }

    const updateQuality = () => {
      const effectiveType = connection.effectiveType;
      // slow-2g, 2g = slow; 3g, 4g = fast
      setQuality(effectiveType === 'slow-2g' || effectiveType === '2g' ? 'slow' : 'fast');
    };

    updateQuality();
    connection.addEventListener('change', updateQuality);

    return () => {
      connection.removeEventListener('change', updateQuality);
    };
  }, []);

  return quality;
}

// Usage in polling:
// const networkQuality = useNetworkQuality();
// const baseInterval = 30000;
// const adjustedInterval = networkQuality === 'slow' ? baseInterval * 2 : baseInterval;
```

### Pattern 4: Staleness Indicator Integration

**What:** Show staleness badge when data age exceeds expected refresh interval
**When to use:** Device cards that poll data - visual feedback for stale data
**Example:**

```typescript
// Staleness detection with expected refresh interval
// Current: useDeviceStaleness polls every 5s, checks 30s threshold (STALENESS_THRESHOLD)
// Enhancement: Pass expected interval to detect staleness relative to actual polling rate

interface StalenessOptions {
  deviceId: string;
  expectedRefreshInterval: number; // ms - when data should update
}

// In DeviceCard:
const isVisible = useVisibility();
const expectedInterval = isVisible ? 30000 : Infinity; // Never stale when hidden
const staleness = useDeviceStaleness(deviceId);

// Show badge if data older than expected AND tab is visible
const showStaleness = isVisible && staleness.ageSeconds > (expectedInterval / 1000);
```

### Anti-Patterns to Avoid

- **Visibility polling without cleanup:** Always remove `visibilitychange` listeners in useEffect cleanup
- **Stale closures in intervals:** Store callback in ref, not directly in setInterval (see Dan Abramov pattern)
- **Network API without fallback:** Network Information API has ~70% browser support - always provide fallback
- **Pausing safety-critical data:** Stove status must maintain 5s interval regardless of visibility
- **Forgetting immediate execution:** First poll should happen immediately, not after first interval delay

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interval management with deps | Manual setInterval in useEffect | useRef + effect pattern | Avoids stale closures, cleanup issues, memory leaks |
| Visibility detection | Custom focus/blur logic | Page Visibility API | Covers tab switch, window minimize, mobile backgrounding |
| Connection quality | Ping-based speed tests | Network Information API (with fallback) | Standardized, efficient, battery-friendly |
| Interval deduplication | Custom locking | Single hook per polling target | React guarantees effect cleanup before re-run |

**Key insight:** Polling in React is deceptively complex due to closure behavior and cleanup timing. The useRef pattern (Dan Abramov) + Page Visibility API combination is battle-tested and handles edge cases that custom solutions miss.

## Common Pitfalls

### Pitfall 1: Stale Closures in setInterval

**What goes wrong:** Interval callback captures state/props at creation time, doesn't see updates

```typescript
// ❌ BAD: counter stays at 0
function BadCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      console.log(count); // Always 0!
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []); // Empty deps = stale closure
}

// ✅ GOOD: Use ref pattern
function GoodCounter() {
  const [count, setCount] = useState(0);
  const savedCallback = useRef(() => setCount(c => c + 1));

  useEffect(() => {
    const id = setInterval(() => savedCallback.current(), 1000);
    return () => clearInterval(id);
  }, []);
}
```

**Why it happens:** JavaScript closures capture variables at creation time; setInterval doesn't "re-close" over new values

**How to avoid:** Always use `useRef` for callback, or use updater function `setState(prev => prev + 1)`

**Warning signs:** State/props not updating in interval callback; "callback only runs once" behavior

### Pitfall 2: Racing Visibility Changes

**What goes wrong:** User rapidly switches tabs, creating multiple overlapping intervals

```typescript
// ❌ BAD: Can create duplicate intervals
useEffect(() => {
  if (!document.hidden) {
    const id = setInterval(fetch, 5000);
    return () => clearInterval(id);
  }
}, []); // Missing dependency - won't clean up on visibility change

// ✅ GOOD: Let effect deps trigger cleanup
useEffect(() => {
  if (document.hidden) return;

  const id = setInterval(fetch, 5000);
  return () => clearInterval(id); // Runs on every visibility change
}, [isVisible]); // React handles cleanup timing
```

**Why it happens:** Missing dependencies in effect array; React can't clean up properly

**How to avoid:** Include all variables that trigger re-execution in deps array; trust React cleanup

**Warning signs:** Network requests increase over time; multiple fetch calls at same time

### Pitfall 3: Network API Unavailable

**What goes wrong:** Code assumes `navigator.connection` exists, crashes in unsupported browsers

```typescript
// ❌ BAD: Crashes in Safari
const speed = navigator.connection.effectiveType;

// ✅ GOOD: Feature detection + fallback
const connection = navigator.connection || navigator.mozConnection;
const speed = connection?.effectiveType || 'unknown';
```

**Why it happens:** Network Information API only ~70% browser support (missing Safari, Firefox)

**How to avoid:** Always check for API existence; provide sensible fallback (assume 'fast')

**Warning signs:** Safari/Firefox errors; "cannot read property of undefined"

### Pitfall 4: Pausing Safety-Critical Polling

**What goes wrong:** Stove status stops updating when tab is hidden, user misses dangerous state

```typescript
// ❌ BAD: All polling pauses on hidden
const isVisible = useVisibility();
useAdaptivePolling({
  callback: fetchStoveStatus,
  interval: isVisible ? 5000 : null // DANGER: pauses safety data
});

// ✅ GOOD: Use alwaysActive flag
useAdaptivePolling({
  callback: fetchStoveStatus,
  interval: 5000,
  alwaysActive: true // Never pauses, even when hidden
});
```

**Why it happens:** Applying visibility optimization universally without considering criticality

**How to avoid:** Flag safety-critical data with `alwaysActive: true`; maintain fixed 5s interval for stove

**Warning signs:** Stove status outdated when returning to tab; missed error states

### Pitfall 5: Forgetting Resume Fetch

**What goes wrong:** User returns to tab, sees stale data until next interval tick

```typescript
// ❌ BAD: Waits up to 30s to refresh
useEffect(() => {
  if (document.hidden) return;
  const id = setInterval(fetch, 30000);
  return () => clearInterval(id);
}, [isVisible]);

// ✅ GOOD: Fetch immediately on visibility change
useEffect(() => {
  if (document.hidden) return;

  fetch(); // Immediate refresh on tab show
  const id = setInterval(fetch, 30000);
  return () => clearInterval(id);
}, [isVisible]);
```

**Why it happens:** Only setting interval without immediate execution on visibility change

**How to avoid:** Always call callback once before setting interval when becoming visible

**Warning signs:** Users report "data doesn't update when I switch back to tab"

## Code Examples

Verified patterns from official sources and existing codebase:

### Example 1: Complete useAdaptivePolling Hook

```typescript
// File: lib/hooks/useAdaptivePolling.ts
// Pattern: Combines Dan Abramov's useInterval + Page Visibility API

'use client';
import { useEffect, useRef } from 'react';
import { useVisibility } from './useVisibility';

interface UseAdaptivePollingOptions {
  callback: () => void | Promise<void>;
  interval: number | null;
  alwaysActive?: boolean;
  immediate?: boolean;
}

/**
 * Adaptive polling hook that respects tab visibility
 *
 * Automatically pauses polling when tab is hidden (unless alwaysActive).
 * Uses ref pattern to avoid stale closures in interval callbacks.
 *
 * @param options.callback - Function to call on each interval
 * @param options.interval - Milliseconds between calls (null = paused)
 * @param options.alwaysActive - If true, never pause (for safety-critical data)
 * @param options.immediate - If true, run callback immediately on mount
 *
 * @example
 * useAdaptivePolling({
 *   callback: fetchDeviceStatus,
 *   interval: 30000,
 *   immediate: true
 * });
 */
export function useAdaptivePolling({
  callback,
  interval,
  alwaysActive = false,
  immediate = true
}: UseAdaptivePollingOptions): void {
  const savedCallback = useRef(callback);
  const isVisible = useVisibility();

  // Update callback ref (prevents stale closures)
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Run immediately on mount
  useEffect(() => {
    if (immediate && interval !== null) {
      savedCallback.current();
    }
  }, []);

  // Manage interval with visibility awareness
  useEffect(() => {
    const shouldPause = !alwaysActive && !isVisible;
    if (interval === null || shouldPause) {
      return;
    }

    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval, isVisible, alwaysActive]);

  // Fetch immediately when tab becomes visible
  useEffect(() => {
    if (isVisible && !alwaysActive && interval !== null) {
      savedCallback.current();
    }
  }, [isVisible]);
}
```

### Example 2: Device Card Integration

```typescript
// File: app/components/devices/stove/StoveCard.tsx (enhancement)

export default function StoveCard() {
  const [status, setStatus] = useState<string>('...');
  const isVisible = useVisibility();
  const staleness = useDeviceStaleness('stove');

  const fetchStatus = useCallback(async () => {
    const res = await fetch('/api/stove/status');
    const data = await res.json();
    setStatus(data.status);
  }, []);

  // Safety-critical: Always poll stove status at 5s
  useAdaptivePolling({
    callback: fetchStatus,
    interval: 5000,
    alwaysActive: true, // NEVER pause stove status
    immediate: true
  });

  // Show staleness only when visible and old
  const showStaleness = isVisible && staleness.isStale;

  return (
    <DeviceCard>
      {showStaleness && (
        <Badge variant="warning">
          Data {staleness.ageSeconds}s old
        </Badge>
      )}
      <Text>Status: {status}</Text>
    </DeviceCard>
  );
}
```

### Example 3: Non-Critical Polling with Network Awareness

```typescript
// File: app/components/CronHealthBanner.tsx (enhancement)

export default function CronHealthBanner() {
  const [lastCall, setLastCall] = useState<string | null>(null);
  const networkQuality = useNetworkQuality();

  const fetchCronHealth = useCallback(async () => {
    const snapshot = await get(ref(db, 'cronHealth/lastCall'));
    if (snapshot.exists()) {
      setLastCall(snapshot.val());
    }
  }, []);

  // Non-critical: Adjust interval based on network
  // Base: 30s, Slow network: 60s, Hidden: paused
  const baseInterval = 30000;
  const networkMultiplier = networkQuality === 'slow' ? 2 : 1;
  const adjustedInterval = baseInterval * networkMultiplier;

  useAdaptivePolling({
    callback: fetchCronHealth,
    interval: adjustedInterval,
    alwaysActive: false, // OK to pause when hidden
    immediate: true
  });

  // Component rendering...
}
```

### Example 4: Test Pattern for Visibility-Aware Polling

```typescript
// File: lib/hooks/__tests__/useAdaptivePolling.test.ts

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdaptivePolling } from '../useAdaptivePolling';

describe('useAdaptivePolling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('pauses polling when tab becomes hidden', async () => {
    const callback = jest.fn();

    renderHook(() =>
      useAdaptivePolling({
        callback,
        interval: 1000,
        immediate: false
      })
    );

    // Simulate tab becoming hidden
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: true
    });
    document.dispatchEvent(new Event('visibilitychange'));

    // Fast-forward time - callback should NOT fire
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('respects alwaysActive flag', () => {
    const callback = jest.fn();

    renderHook(() =>
      useAdaptivePolling({
        callback,
        interval: 1000,
        alwaysActive: true,
        immediate: false
      })
    );

    // Hide tab
    Object.defineProperty(document, 'hidden', { value: true });
    document.dispatchEvent(new Event('visibilitychange'));

    // Should still poll
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed 5s polling everywhere | Adaptive intervals by state | StoveCard (v1.77.0) | 75% fewer requests when stove off |
| Manual interval management | useRef + effect pattern | Dan Abramov (2019) | Eliminates stale closure bugs |
| Focus/blur events | Page Visibility API | W3C Standard (2013) | Catches tab switch, mobile backgrounding |
| Always-on polling | Visibility-aware pausing | Modern practice (2020+) | Battery savings, reduced server load |
| Ping-based speed tests | Network Information API | Draft spec (ongoing) | Efficient, no network overhead |

**Deprecated/outdated:**
- **window.onfocus/onblur**: Doesn't catch tab switching; use Page Visibility API instead
- **navigator.onLine only**: Misses slow connections; combine with Network Information API
- **Polling without cleanup**: Memory leaks in SPAs; always return cleanup function from useEffect
- **setInterval with dependencies in closure**: Stale state; use useRef pattern

## Open Questions

1. **Network API Polyfill Strategy**
   - What we know: Network Information API ~70% browser support (missing Safari, Firefox)
   - What's unclear: Should we use feature detection only, or provide user preference override?
   - Recommendation: Feature detection + fallback to 'unknown' (assume fast). Document browser support in user-facing docs if we show network quality indicator

2. **Staleness Threshold Coordination**
   - What we know: Current staleness threshold is 30s (STALENESS_THRESHOLD constant)
   - What's unclear: Should threshold adapt to polling interval? (30s for 30s polling, 60s for 60s polling?)
   - Recommendation: Make threshold 2x the expected polling interval to avoid false positives during network jitter

3. **Firebase Realtime Database Polling**
   - What we know: Firebase RTDB uses onValue() listeners, not polling
   - What's unclear: Should Firebase listeners pause when tab is hidden? Does Firebase handle this internally?
   - Recommendation: Research Firebase client SDK behavior with hidden tabs; may auto-throttle already

4. **Immediate Fetch on Visibility Restore**
   - What we know: Users expect fresh data when returning to tab
   - What's unclear: Should immediate fetch bypass rate limiters? Could cause burst on tab restore
   - Recommendation: Immediate fetch should respect rate limits; show staleness badge if rate-limited

## Sources

### Primary (HIGH confidence)

- **MDN - Network Information API**: https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API
  - Verified effectiveType values: slow-2g, 2g, 3g, 4g
  - Browser support: ~70% (no Safari/Firefox)
  - Usage examples and feature detection patterns

- **MDN - NetworkInformation.effectiveType**: https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType
  - Property details and type definitions
  - Event listeners for connection changes

- **Dan Abramov - Making setInterval Declarative with React Hooks**: https://overreacted.io/making-setinterval-declarative-with-react-hooks/
  - Authoritative pattern for interval management in React
  - Explains stale closure problem and ref-based solution
  - Pause/resume pattern with null interval

- **Existing codebase**: StoveCard.tsx, ThermostatCard.tsx, useDeviceStaleness.ts
  - Current adaptive polling implementation (15s/60s by state)
  - Staleness detection with 30s threshold
  - Fixed interval patterns for device cards

### Secondary (MEDIUM confidence)

- **useHooks - useInterval**: https://usehooks-ts.com/react-hook/use-interval
  - Community implementation of Dan Abramov pattern
  - TypeScript examples and test patterns

- **React.dev - useEffect**: https://react.dev/reference/react/useEffect
  - Official effect cleanup documentation
  - Dependency array behavior and timing guarantees

### Tertiary (LOW confidence)

- **Medium - Modern JavaScript Polling**: https://medium.com/tech-pulse-by-collatzinc/modern-javascript-polling-adaptive-strategies-that-actually-work-part-1-9909f5946730
  - General polling strategies discussion (403 error on fetch)
  - Mentions visibility-aware polling and exponential backoff

- **GitHub - react-page-visibility**: https://github.com/pgilad/react-page-visibility
  - npm library for visibility detection
  - Not needed (hand-roll is 20 lines), but validates pattern

## Metadata

**Confidence breakdown:**
- Page Visibility API: HIGH - W3C standard, 98%+ browser support, MDN docs verified
- useInterval pattern: HIGH - Dan Abramov (React team), battle-tested, codebase uses similar
- Network Information API: MEDIUM - Draft spec, 70% support, requires progressive enhancement
- Staleness integration: HIGH - Existing implementation verified in codebase

**Research date:** 2026-02-12
**Valid until:** 2026-03-14 (30 days - stable APIs)

**Browser Support:**
- Page Visibility API: 98%+ (all modern browsers)
- Network Information API: ~70% (Chrome/Edge/Opera, no Safari/Firefox)
- React hooks: 100% (React 19.2.0 project dependency)

**Key Implementation Notes:**
1. Stove status MUST use `alwaysActive: true` - safety-critical, never pause
2. Network API needs feature detection + fallback to 'unknown'
3. useRef pattern mandatory to avoid stale closures
4. Immediate fetch on visibility restore for fresh data
5. Staleness threshold should be 2x polling interval to avoid false positives
