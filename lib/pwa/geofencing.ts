/**
 * Geofencing Service
 *
 * Location-based automation for stove control.
 * - Leaving home → Can trigger shutdown
 * - Arriving home → Can trigger ignition
 *
 * Uses Geolocation API to monitor position relative to a "home" location.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
 */

import { get, put, STORES } from './indexedDB';

const GEOFENCE_KEY = 'geofence-config';
const DEFAULT_RADIUS = 200; // meters

export interface GeofenceAction {
  action: string;
  enabled: boolean;
}

export interface GeofenceActions {
  onLeave?: GeofenceAction;
  onArrive?: GeofenceAction;
}

export interface GeofenceConfig {
  key?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  radius: number;
  enabled: boolean;
  actions?: GeofenceActions;
  setAt?: number;
  updatedAt?: number;
}

export interface GeofenceOptions {
  radius?: number;
  actions?: GeofenceActions;
}

export interface GeofenceStatus {
  configured: boolean;
  enabled: boolean;
  isHome: boolean | null;
  distance: number | null;
  radius?: number;
  accuracy?: number;
  actions?: GeofenceActions;
  error?: string;
}

/**
 * Check if Geolocation API is supported
 * @returns {boolean}
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Get current position as a Promise
 * @param {PositionOptions} options - Geolocation options
 * @returns {Promise<GeolocationPosition>}
 */
function getCurrentPosition(options: PositionOptions = {}): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options,
      }
    );
  });
}

/**
 * Get saved geofence configuration
 * @returns {Promise<Object|null>}
 */
async function getGeofenceConfig(): Promise<GeofenceConfig | null> {
  try {
    const result = await get<GeofenceConfig>(STORES.APP_STATE, GEOFENCE_KEY);
    return result ?? null;
  } catch (error) {
    console.error('[Geofencing] Error getting config:', error);
    return null;
  }
}

/**
 * Save geofence configuration (home location)
 * @param {Object} config - Geofence configuration
 * @param {number} config.latitude - Home latitude
 * @param {number} config.longitude - Home longitude
 * @param {number} [config.radius] - Radius in meters (default 200)
 * @param {boolean} [config.enabled] - Whether geofencing is enabled
 * @param {Object} [config.actions] - Actions to perform on enter/exit
 * @returns {Promise<void>}
 */
async function saveGeofenceConfig(config: GeofenceConfig): Promise<void> {
  try {
    await put(STORES.APP_STATE, {
      key: GEOFENCE_KEY,
      ...config,
      radius: config.radius || DEFAULT_RADIUS,
      enabled: config.enabled ?? true,
      updatedAt: Date.now(),
    });
    console.log('[Geofencing] Config saved:', config);
  } catch (error) {
    console.error('[Geofencing] Error saving config:', error);
    throw error;
  }
}

/**
 * Set current location as home
 * @param {Object} options - Configuration options
 * @param {number} [options.radius] - Geofence radius in meters
 * @param {Object} [options.actions] - Actions configuration
 * @returns {Promise<Object>} The saved configuration
 */
async function setCurrentLocationAsHome(options: GeofenceOptions = {}): Promise<GeofenceConfig> {
  const position = await getCurrentPosition();

  const config: GeofenceConfig = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    radius: options.radius || DEFAULT_RADIUS,
    enabled: true,
    actions: options.actions || {
      onLeave: { action: 'shutdown', enabled: false },
      onArrive: { action: 'ignite', enabled: false },
    },
    setAt: Date.now(),
  };

  await saveGeofenceConfig(config);
  return config;
}

/**
 * Check if current position is inside the geofence
 * @returns {Promise<Object>} Status object with isHome, distance, etc.
 */
async function checkGeofenceStatus(): Promise<GeofenceStatus> {
  const config = await getGeofenceConfig();

  if (!config || !config.enabled) {
    return {
      configured: false,
      enabled: false,
      isHome: null,
      distance: null,
    };
  }

  try {
    const position = await getCurrentPosition();
    const distance = calculateDistance(
      position.coords.latitude,
      position.coords.longitude,
      config.latitude,
      config.longitude
    );

    const isHome = distance <= config.radius;

    return {
      configured: true,
      enabled: true,
      isHome,
      distance: Math.round(distance),
      radius: config.radius,
      accuracy: position.coords.accuracy,
      actions: config.actions,
    };
  } catch (error) {
    console.error('[Geofencing] Error checking status:', error);
    return {
      configured: true,
      enabled: true,
      isHome: null,
      distance: null,
      error: (error as Error).message,
    };
  }
}

/**
 * Enable geofencing
 * @returns {Promise<void>}
 */
async function enableGeofencing(): Promise<void> {
  const config = await getGeofenceConfig();
  if (config) {
    await saveGeofenceConfig({ ...config, enabled: true });
  }
}

/**
 * Disable geofencing
 * @returns {Promise<void>}
 */
async function disableGeofencing(): Promise<void> {
  const config = await getGeofenceConfig();
  if (config) {
    await saveGeofenceConfig({ ...config, enabled: false });
  }
}

/**
 * Update geofence actions
 * @param {Object} actions - Actions configuration
 * @param {Object} [actions.onLeave] - Action when leaving home
 * @param {Object} [actions.onArrive] - Action when arriving home
 * @returns {Promise<void>}
 */
async function updateGeofenceActions(actions: GeofenceActions): Promise<void> {
  const config = await getGeofenceConfig();
  if (config) {
    await saveGeofenceConfig({
      ...config,
      actions: { ...config.actions, ...actions },
    });
  }
}

/**
 * Clear geofence configuration
 * @returns {Promise<void>}
 */
async function clearGeofenceConfig(): Promise<void> {
  try {
    const { remove } = await import('./indexedDB');
    await remove(STORES.APP_STATE, GEOFENCE_KEY);
    console.log('[Geofencing] Config cleared');
  } catch (error) {
    console.error('[Geofencing] Error clearing config:', error);
  }
}

