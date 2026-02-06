'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isWakeLockSupported,
  requestWakeLock,
  releaseWakeLock,
  isWakeLockActive,
} from '@/lib/pwa/wakeLock';

/**
 * useWakeLock Hook
 *
 * Manages screen wake lock for keeping display on during monitoring.
 *
 * @example
 * const { isLocked, isSupported, lock, unlock } = useWakeLock();
 *
 * // Keep screen on while monitoring
 * <button onClick={isLocked ? unlock : lock}>
 *   {isLocked ? 'Allow screen sleep' : 'Keep screen on'}
 * </button>
 */
export function useWakeLock(): { isLocked: boolean; isSupported: boolean; lock: () => Promise<void>; unlock: () => Promise<void> } {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  // Check support on mount
  useEffect(() => {
    setIsSupported(isWakeLockSupported());
    setIsLocked(isWakeLockActive());
  }, []);

  // Handle visibility change - reacquire lock when page becomes visible
  useEffect(() => {
    if (!isSupported || !isLocked) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isLocked) {
        const success = await requestWakeLock();
        setIsLocked(success);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSupported, isLocked]);

  const lock = useCallback(async () => {
    const success = await requestWakeLock();
    setIsLocked(success);
    return success;
  }, []);

  const unlock = useCallback(async () => {
    const success = await releaseWakeLock();
    if (success) {
      setIsLocked(false);
    }
    return success;
  }, []);

  const toggle = useCallback(async () => {
    if (isLocked) {
      return unlock();
    }
    return lock();
  }, [isLocked, lock, unlock]);

  return {
    isLocked,
    isSupported,
    lock,
    unlock,
    toggle,
  };
}

export default useWakeLock;
