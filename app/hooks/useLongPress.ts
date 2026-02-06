'use client';

import { useRef, useCallback } from 'react';
import { vibrateShort } from '@/lib/pwa/vibration';

/** useLongPress options */
export interface UseLongPressOptions {
  /** Initial delay before repeat starts (default: 400ms) */
  delay?: number;
  /** Interval between repeats (default: 100ms) - CONSTANT rate */
  interval?: number;
  /** Enable haptic feedback (default: true) */
  haptic?: boolean;
}

/** useLongPress return type */
export interface UseLongPressReturn {
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchCancel: () => void;
}

/**
 * useLongPress Hook - Ember Noir Design System
 *
 * Provides long-press functionality with constant repeat rate for continuous
 * value adjustment (temperature, brightness, etc.).
 *
 * @param callback - Function to call on press and repeat
 * @param options - Configuration options
 * @returns Event handlers for mouse and touch events
 *
 * @example
 * const handlers = useLongPress(() => setValue(v => v + 1), { delay: 400, interval: 100 });
 * <button {...handlers}>+</button>
 */
export function useLongPress(
  callback: () => void,
  options: UseLongPressOptions = {}
): UseLongPressReturn {
  const { delay = 400, interval = 100, haptic = true } = options;

  // Use refs to avoid re-renders and stale closures
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(false);
  const callbackRef = useRef<() => void>(callback);

  // Update callback ref on each render to capture latest callback
  callbackRef.current = callback;

  /**
   * Execute the callback with optional haptic feedback
   */
  const executeCallback = useCallback(() => {
    if (haptic) {
      vibrateShort();
    }
    callbackRef.current?.();
  }, [haptic]);

  /**
   * Start the long-press sequence
   */
  const start = useCallback(() => {
    // Prevent double-start
    if (isActiveRef.current) return;
    isActiveRef.current = true;

    // Call immediately on press
    executeCallback();

    // Start repeat after delay
    timeoutRef.current = setTimeout(() => {
      // Repeat at constant interval
      intervalRef.current = setInterval(() => {
        executeCallback();
      }, interval);
    }, delay);
  }, [executeCallback, delay, interval]);

  /**
   * Stop the long-press sequence and clear all timers
   */
  const stop = useCallback(() => {
    isActiveRef.current = false;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Handle touch start - prevent scrolling during press
   */
  const handleTouchStart = useCallback(
    (e) => {
      e.preventDefault();
      start();
    },
    [start]
  );

  return {
    // Mouse events
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    // Touch events
    onTouchStart: handleTouchStart,
    onTouchEnd: stop,
    onTouchCancel: stop,
  };
}

export default useLongPress;
