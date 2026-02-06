'use client';

import { useCallback, useMemo } from 'react';
import {
  vibrateShort,
  vibrateSuccess,
  vibrateWarning,
  vibrateError,
  isVibrationSupported,
} from '@/lib/pwa/vibration';

/** Haptic pattern type */
export type HapticPattern = 'short' | 'success' | 'warning' | 'error';

/** useHaptic return type */
export interface UseHapticReturn {
  trigger: () => void;
  isSupported: boolean;
}

/**
 * useHaptic Hook - Ember Noir Design System
 *
 * Provides haptic feedback for interactive elements (buttons, toggles, etc.).
 * Wraps vibration.js patterns with React hooks for memoization and lifecycle management.
 *
 * @param pattern - Haptic pattern to use ('short' | 'success' | 'warning' | 'error')
 * @returns Trigger function and support detection
 *
 * @example
 * const haptic = useHaptic('short');
 * <button onClick={() => { haptic.trigger(); doAction(); }}>Click</button>
 *
 * @example
 * const haptic = useHaptic('success');
 * if (haptic.isSupported) { haptic.trigger(); }
 */
export function useHaptic(pattern: HapticPattern = 'short'): UseHapticReturn {
  // Map pattern names to vibration functions
  const vibrationFunction = useMemo(() => {
    switch (pattern) {
      case 'success':
        return vibrateSuccess;
      case 'warning':
        return vibrateWarning;
      case 'error':
        return vibrateError;
      case 'short':
      default:
        return vibrateShort;
    }
  }, [pattern]);

  // Memoize trigger function to avoid re-renders
  const trigger = useCallback(() => {
    vibrationFunction();
  }, [vibrationFunction]);

  // Check if haptic is supported on this device
  const isSupported = useMemo(() => isVibrationSupported(), []);

  return {
    trigger,
    isSupported,
  };
}

export default useHaptic;
