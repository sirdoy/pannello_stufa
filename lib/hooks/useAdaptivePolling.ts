'use client';

import { useEffect, useRef } from 'react';
import { useVisibility } from './useVisibility';

/**
 * Options for the useAdaptivePolling hook.
 */
export interface UseAdaptivePollingOptions {
  /**
   * Function to call on each polling interval.
   * Can be sync or async.
   */
  callback: () => void | Promise<void>;

  /**
   * Interval in milliseconds between calls.
   * If null, polling is paused.
   */
  interval: number | null;

  /**
   * If true, polling continues even when tab is hidden.
   * Use for safety-critical features (e.g., maintenance warnings).
   * Default: false
   */
  alwaysActive?: boolean;

  /**
   * If true, calls callback immediately on mount (before first interval).
   * Default: true
   */
  immediate?: boolean;
}

/**
 * Hook that provides adaptive polling with visibility awareness.
 *
 * Features:
 * - Pauses polling when tab is hidden (unless alwaysActive is true)
 * - Resumes polling and calls immediately when tab becomes visible again
 * - Respects interval changes (null = pause)
 * - Avoids stale closures using ref pattern
 *
 * @see https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 */
export function useAdaptivePolling(options: UseAdaptivePollingOptions): void {
  const { callback, interval, alwaysActive = false, immediate = true } = options;

  const isVisible = useVisibility();
  const savedCallback = useRef(callback);
  const hasRunImmediate = useRef(false);
  const wasVisible = useRef(isVisible);

  // Update savedCallback ref whenever callback changes (avoid stale closures)
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Effect: Run callback immediately on mount if immediate is true
  useEffect(() => {
    if (immediate && interval !== null && !hasRunImmediate.current) {
      savedCallback.current();
      hasRunImmediate.current = true;
    }
  }, [immediate, interval]);

  // Effect: Manage interval based on visibility and interval value
  useEffect(() => {
    // Don't set up interval if explicitly paused
    if (interval === null) {
      return;
    }

    // Don't set up interval if tab is hidden and not always active
    if (!alwaysActive && !isVisible) {
      return;
    }

    // Set up interval
    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, interval);

    return () => {
      clearInterval(id);
    };
  }, [interval, isVisible, alwaysActive]);

  // Effect: Call immediately when tab becomes visible again
  useEffect(() => {
    // Only trigger on visibility change from hidden to visible
    const becameVisible = !wasVisible.current && isVisible;
    wasVisible.current = isVisible;

    // If alwaysActive, we never pause, so don't call on visibility restore
    if (alwaysActive) {
      return;
    }

    // If interval is null, polling is explicitly paused
    if (interval === null) {
      return;
    }

    // If tab just became visible, fetch fresh data immediately
    if (becameVisible) {
      savedCallback.current();
    }
  }, [isVisible, alwaysActive, interval]);
}
