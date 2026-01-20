'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isPeriodicSyncSupported,
  checkPeriodicSyncPermission,
  registerPeriodicSync,
  unregisterPeriodicSync,
  getPeriodicSyncStatus,
} from '@/lib/pwa/periodicSync';

/**
 * usePeriodicSync Hook
 *
 * Manages periodic background sync for checking stove status.
 * Only works on Chrome/Edge when PWA is installed.
 *
 * @param {Object} options - Hook options
 * @param {number} [options.interval] - Check interval in ms (default: 15 min)
 *
 * @example
 * const { isSupported, isRegistered, register, unregister } = usePeriodicSync();
 *
 * // Enable periodic status checks
 * <button onClick={register}>
 *   {isRegistered ? 'Disable' : 'Enable'} background checks
 * </button>
 */
export function usePeriodicSync(options = {}) {
  const { interval = 15 * 60 * 1000 } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [permission, setPermission] = useState('unknown');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check support and status on mount
  useEffect(() => {
    const checkStatus = async () => {
      const supported = isPeriodicSyncSupported();
      setIsSupported(supported);

      if (!supported) {
        setLoading(false);
        return;
      }

      // Check permission
      const permissionState = await checkPeriodicSyncPermission();
      setPermission(permissionState);

      // Check if already registered
      const status = await getPeriodicSyncStatus();
      setIsRegistered(status.registered);

      setLoading(false);
    };

    checkStatus();
  }, []);

  // Register periodic sync
  const register = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const success = await registerPeriodicSync({ interval });
      setIsRegistered(success);

      if (!success) {
        setError('Registration failed - check browser permissions');
      }

      return success;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [interval]);

  // Unregister periodic sync
  const unregister = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const success = await unregisterPeriodicSync();
      if (success) {
        setIsRegistered(false);
      }
      return success;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle registration
  const toggle = useCallback(async () => {
    if (isRegistered) {
      return unregister();
    }
    return register();
  }, [isRegistered, register, unregister]);

  // Refresh status
  const refresh = useCallback(async () => {
    const status = await getPeriodicSyncStatus();
    setIsRegistered(status.registered);
    return status;
  }, []);

  return {
    isSupported,
    isRegistered,
    permission,
    loading,
    error,
    register,
    unregister,
    toggle,
    refresh,
  };
}

export default usePeriodicSync;
