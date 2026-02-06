/**
 * Offline State Cache Service
 *
 * Caches device states for offline viewing.
 * States are automatically cached by Service Worker on API responses,
 * but this service provides client-side access to the cached data.
 *
 * Supported devices:
 * - stove: Stove status (temperature, state, power level)
 * - thermostat: Netatmo thermostat status (temperature, setpoint)
 * - lights: Hue lights status (future)
 *
 * @example
 * import { getCachedState, getAllCachedStates } from '@/lib/pwa/offlineStateCache';
 *
 * // Get cached stove state
 * const stoveState = await getCachedState('stove');
 * if (stoveState) {
 *   console.log('Last known temperature:', stoveState.state.temperature);
 *   console.log('Cached at:', stoveState.timestamp);
 * }
 */

import { get, getAll, put, STORES } from './indexedDB';

/**
 * Device IDs for state caching
 */
export const DEVICE_IDS = {
  STOVE: 'stove',
  THERMOSTAT: 'thermostat',
  LIGHTS: 'lights',
};

/**
 * Get cached state for a device
 * @param {string} deviceId - Device ID
 * @returns {Promise<{deviceId: string, state: Object, timestamp: string}|null>}
 */
export async function getCachedState(deviceId) {
  try {
    const cached = await get(STORES.DEVICE_STATE, deviceId);
    if (cached) {
      console.log(`[OfflineStateCache] Retrieved cached state for ${deviceId}`);
      return cached;
    }
    return null;
  } catch (error) {
    console.error(`[OfflineStateCache] Failed to get cached state for ${deviceId}:`, error);
    return null;
  }
}

/**
 * Get all cached device states
 * @returns {Promise<Array<{deviceId: string, state: Object, timestamp: string}>>}
 */
export async function getAllCachedStates() {
  try {
    const states = await getAll(STORES.DEVICE_STATE);
    return states || [];
  } catch (error) {
    console.error('[OfflineStateCache] Failed to get all cached states:', error);
    return [];
  }
}

/**
 * Manually cache a device state (usually done by Service Worker)
 * @param {string} deviceId - Device ID
 * @param {Object} state - Device state data
 * @returns {Promise<void>}
 */
export async function cacheState(deviceId, state) {
  try {
    await put(STORES.DEVICE_STATE, {
      deviceId,
      state,
      timestamp: new Date().toISOString(),
    });
    console.log(`[OfflineStateCache] Cached state for ${deviceId}`);
  } catch (error) {
    console.error(`[OfflineStateCache] Failed to cache state for ${deviceId}:`, error);
  }
}

/**
 * Get cached state via Service Worker (for cross-context access)
 * @param {string} deviceId - Device ID
 * @returns {Promise<Object|null>}
 */
export async function getCachedStateFromSW(deviceId) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return getCachedState(deviceId);
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) {
      return getCachedState(deviceId);
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data.data);
        } else {
          resolve(null);
        }
      };

      registration.active.postMessage(
        { type: 'GET_CACHED_STATE', data: { deviceId } },
        [messageChannel.port2]
      );

      // Timeout after 2 seconds
      setTimeout(() => resolve(null), 2000);
    });
  } catch (error) {
    console.error('[OfflineStateCache] Failed to get state from SW:', error);
    return getCachedState(deviceId);
  }
}

/**
 * Format stove state for display
 * @param {Object} cachedData - Cached data with state and timestamp
 * @returns {Object|null} Formatted state or null
 */
export function formatStoveStateForDisplay(cachedData) {
  if (!cachedData?.state) return null;

  const { state, timestamp } = cachedData;

  // Parse timestamp
  const cachedAt = new Date(timestamp);
  const isStale = Date.now() - cachedAt.getTime() > 30 * 60 * 1000; // 30 minutes

  return {
    // Core status
    isOn: state.status === 'on' || state.state === 'on',
    status: state.status || state.state || 'unknown',

    // Temperature data
    temperature: state.temperature ?? state.temp ?? null,
    exhaustTemp: state.exhaustTemp ?? state.fumi ?? null,
    setpoint: state.setpoint ?? state.setpointTemperature ?? null,

    // Power and mode
    powerLevel: state.powerLevel ?? state.power ?? null,
    mode: state.mode ?? null,

    // Maintenance
    needsCleaning: state.needsCleaning ?? false,
    currentHours: state.currentHours ?? null,

    // Metadata
    cachedAt,
    cachedAtFormatted: cachedAt.toLocaleString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }),
    isStale,
    ageMinutes: Math.round((Date.now() - cachedAt.getTime()) / 60000),
  };
}

/**
 * Format thermostat state for display
 * @param {Object} cachedData - Cached data with state and timestamp
 * @returns {Object|null} Formatted state or null
 */
export function formatThermostatStateForDisplay(cachedData) {
  if (!cachedData?.state) return null;

  const { state, timestamp } = cachedData;

  // Parse timestamp
  const cachedAt = new Date(timestamp);
  const isStale = Date.now() - cachedAt.getTime() > 30 * 60 * 1000;

  // Handle Netatmo data structure
  const rooms = state.rooms || [];
  const currentRoom = rooms[0] || {};

  return {
    // Temperature data
    temperature: currentRoom.temperature ?? state.temperature ?? null,
    setpoint: currentRoom.setpoint ?? state.setpoint ?? null,
    humidity: currentRoom.humidity ?? state.humidity ?? null,

    // Mode
    mode: state.mode ?? currentRoom.mode ?? null,
    isHeating: currentRoom.heating ?? false,

    // Room info
    roomName: currentRoom.name ?? 'Stanza',
    roomCount: rooms.length,

    // Metadata
    cachedAt,
    cachedAtFormatted: cachedAt.toLocaleString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }),
    isStale,
    ageMinutes: Math.round((Date.now() - cachedAt.getTime()) / 60000),
  };
}

/**
 * Get cache age in human-readable format
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Human-readable age
 */
export function getCacheAge(timestamp) {
  const ageMs = Date.now() - new Date(timestamp).getTime();
  const ageMinutes = Math.round(ageMs / 60000);

  if (ageMinutes < 1) return 'Appena aggiornato';
  if (ageMinutes < 60) return `${ageMinutes} min fa`;
  if (ageMinutes < 1440) return `${Math.round(ageMinutes / 60)} ore fa`;
  return `${Math.round(ageMinutes / 1440)} giorni fa`;
}

export default {
  getCachedState,
  getAllCachedStates,
  cacheState,
  getCachedStateFromSW,
  formatStoveStateForDisplay,
  formatThermostatStateForDisplay,
  getCacheAge,
  DEVICE_IDS,
};
