'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  isGeolocationSupported,
  getGeofenceConfig,
  setCurrentLocationAsHome,
  checkGeofenceStatus,
  enableGeofencing,
  disableGeofencing,
  updateGeofenceActions,
  clearGeofenceConfig,
  type GeofenceConfig,
  type GeofenceStatus,
  type GeofenceActions,
} from '@/lib/pwa/geofencing';

/**
 * useGeofencing Hook
 *
 * Location-based automation for stove control.
 *
 * @param {Object} options - Hook options
 * @param {number} [options.checkInterval] - Check interval in ms (default: 5 min)
 * @param {Function} [options.onLeaveHome] - Callback when leaving home
 * @param {Function} [options.onArriveHome] - Callback when arriving home
 *
 * @example
 * const {
 *   isSupported,
 *   isConfigured,
 *   isEnabled,
 *   isHome,
 *   distance,
 *   setHomeLocation,
 * } = useGeofencing({
 *   onLeaveHome: () => shutdownStove(),
 *   onArriveHome: () => igniteStove(),
 * });
 */
export interface UseGeofencingReturn {
  isSupported: boolean;
  isConfigured: boolean;
  isEnabled: boolean;
  isHome: boolean | null;
  distance: number | null;
  config: GeofenceConfig | null;
  loading: boolean;
  error: string | null;
  permissionStatus: string;
  setHomeLocation: (options?: { radius?: number; actions?: GeofenceActions }) => Promise<GeofenceConfig>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  updateActions: (actions: GeofenceActions) => Promise<void>;
  clear: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useGeofencing(options: { checkInterval?: number; onLeaveHome?: () => void; onArriveHome?: () => void } = {}): UseGeofencingReturn {
  const {
    checkInterval = 5 * 60 * 1000, // 5 minutes
    onLeaveHome,
    onArriveHome,
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isHome, setIsHome] = useState<boolean | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [config, setConfig] = useState<GeofenceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState('unknown');

  const previousIsHome = useRef<boolean | null>(null);
  const watchId = useRef<number | null>(null);

  // Check support and load config on mount
  useEffect(() => {
    const init = async () => {
      const supported = isGeolocationSupported();
      setIsSupported(supported);

      if (!supported) {
        setLoading(false);
        return;
      }

      // Check permission status
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          setPermissionStatus(permission.state);
          permission.onchange = () => setPermissionStatus(permission.state);
        } catch {
          // Permission API not available for geolocation
        }
      }

      // Load saved config
      const savedConfig = await getGeofenceConfig();
      if (savedConfig) {
        setConfig(savedConfig);
        setIsConfigured(true);
        setIsEnabled(savedConfig.enabled);
      }

      setLoading(false);
    };

    init();
  }, []);

  // Monitor location when enabled
  useEffect(() => {
    if (!isSupported || !isConfigured || !isEnabled) {
      return;
    }

    const checkLocation = async () => {
      try {
        const status = await checkGeofenceStatus();
        setIsHome(status.isHome);
        setDistance(status.distance);
        setError(null);

        // Trigger callbacks on state change
        if (previousIsHome.current !== null && status.isHome !== previousIsHome.current) {
          if (status.isHome && onArriveHome) {
            console.log('[Geofencing] Arrived home');
            onArriveHome();
          } else if (!status.isHome && onLeaveHome) {
            console.log('[Geofencing] Left home');
            onLeaveHome();
          }
        }

        previousIsHome.current = status.isHome;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    // Initial check
    checkLocation();

    // Set up interval for periodic checks
    const intervalId = setInterval(checkLocation, checkInterval as number);

    return () => {
      clearInterval(intervalId);
    };
  }, [isSupported, isConfigured, isEnabled, checkInterval, onLeaveHome, onArriveHome]);

  // Set current location as home
  const setHomeLocation = useCallback(async (options: { radius?: number; actions?: GeofenceActions } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const newConfig = await setCurrentLocationAsHome(options);
      setConfig(newConfig);
      setIsConfigured(true);
      setIsEnabled(true);
      previousIsHome.current = true; // Assume we're home when setting
      setIsHome(true);
      setDistance(0);
      return newConfig;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Enable geofencing
  const enable = useCallback(async () => {
    await enableGeofencing();
    setIsEnabled(true);
  }, []);

  // Disable geofencing
  const disable = useCallback(async () => {
    await disableGeofencing();
    setIsEnabled(false);
  }, []);

  // Update actions
  const updateActions = useCallback(async (actions: GeofenceActions) => {
    await updateGeofenceActions(actions);
    const updatedConfig = await getGeofenceConfig();
    setConfig(updatedConfig);
  }, []);

  // Clear configuration
  const clear = useCallback(async () => {
    await clearGeofenceConfig();
    setConfig(null);
    setIsConfigured(false);
    setIsEnabled(false);
    setIsHome(null);
    setDistance(null);
    previousIsHome.current = null;
  }, []);

  // Request permission (trigger location prompt)
  const requestPermission = useCallback(async () => {
    try {
      await checkGeofenceStatus();
      setPermissionStatus('granted');
      return true;
    } catch (err) {
      if (err instanceof GeolocationPositionError && err.code === 1) {
        setPermissionStatus('denied');
      }
      return false;
    }
  }, []);

  // Refresh status manually
  const refresh = useCallback(async () => {
    if (!isConfigured || !isEnabled) return;

    setLoading(true);
    try {
      const status = await checkGeofenceStatus();
      setIsHome(status.isHome);
      setDistance(status.distance);
      setError(status.error ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [isConfigured, isEnabled]);

  return {
    // State
    isSupported,
    isConfigured,
    isEnabled,
    isHome,
    distance,
    config,
    loading,
    error,
    permissionStatus,

    // Actions
    setHomeLocation,
    enable,
    disable,
    updateActions,
    clear,
    requestPermission,
    refresh,
  };
}

export default useGeofencing;
