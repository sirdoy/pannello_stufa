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
} as const;

interface CachedDeviceState {
  deviceId: string;
  state: Record<string, unknown>;
  timestamp: string;
}

interface FormattedStoveState {
  isOn: boolean;
  status: string;
  temperature: number | null;
  exhaustTemp: number | null;
  setpoint: number | null;
  powerLevel: number | null;
  mode: string | null;
  needsCleaning: boolean;
  currentHours: number | null;
  cachedAt: Date;
  cachedAtFormatted: string;
  isStale: boolean;
  ageMinutes: number;
}

interface ThermostatRoom {
  name?: string;
  temperature?: number;
  setpoint?: number;
  humidity?: number;
  mode?: string;
  heating?: boolean;
}

interface FormattedThermostatState {
  temperature: number | null;
  setpoint: number | null;
  humidity: number | null;
  mode: string | null;
  isHeating: boolean;
  roomName: string;
  roomCount: number;
  cachedAt: Date;
  cachedAtFormatted: string;
  isStale: boolean;
  ageMinutes: number;
}

interface SWMessageEvent {
  data: {
    success: boolean;
    data?: CachedDeviceState;
  };
}

/**
 * Get cached state for a device
 * @param {string} deviceId - Device ID
 * @returns {Promise<{deviceId: string, state: Object, timestamp: string}|null>}
 */
export async function getCachedState(deviceId: string): Promise<CachedDeviceState | null> {
  try {
    const cached = await get<CachedDeviceState>(STORES.DEVICE_STATE, deviceId);
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
async function getAllCachedStates(): Promise<CachedDeviceState[]> {
  try {
    const states = await getAll<CachedDeviceState>(STORES.DEVICE_STATE);
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
async function cacheState(deviceId: string, state: Record<string, unknown>): Promise<void> {
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
async function getCachedStateFromSW(deviceId: string): Promise<CachedDeviceState | null> {
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

      messageChannel.port1.onmessage = (event: SWMessageEvent) => {
        if (event.data.success) {
          resolve(event.data.data || null);
        } else {
          resolve(null);
        }
      };

      registration.active!.postMessage(
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
export function formatStoveStateForDisplay(cachedData: CachedDeviceState | null): FormattedStoveState | null {
  if (!cachedData?.state) return null;

  const { state, timestamp } = cachedData;

  // Parse timestamp
  const cachedAt = new Date(timestamp);
  const isStale = Date.now() - cachedAt.getTime() > 30 * 60 * 1000; // 30 minutes

  return {
    // Core status
    isOn: state.status === 'on' || state.state === 'on',
    status: (state.status as string) || (state.state as string) || 'unknown',

    // Temperature data
    temperature: (state.temperature as number) ?? (state.temp as number) ?? null,
    exhaustTemp: (state.exhaustTemp as number) ?? (state.fumi as number) ?? null,
    setpoint: (state.setpoint as number) ?? (state.setpointTemperature as number) ?? null,

    // Power and mode
    powerLevel: (state.powerLevel as number) ?? (state.power as number) ?? null,
    mode: (state.mode as string) ?? null,

    // Maintenance
    needsCleaning: (state.needsCleaning as boolean) ?? false,
    currentHours: (state.currentHours as number) ?? null,

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
export function formatThermostatStateForDisplay(cachedData: CachedDeviceState | null): FormattedThermostatState | null {
  if (!cachedData?.state) return null;

  const { state, timestamp } = cachedData;

  // Parse timestamp
  const cachedAt = new Date(timestamp);
  const isStale = Date.now() - cachedAt.getTime() > 30 * 60 * 1000;

  // Handle Netatmo data structure
  const rooms = (state.rooms as ThermostatRoom[]) || [];
  const currentRoom = rooms[0] || {};

  return {
    // Temperature data
    temperature: currentRoom.temperature ?? (state.temperature as number) ?? null,
    setpoint: currentRoom.setpoint ?? (state.setpoint as number) ?? null,
    humidity: currentRoom.humidity ?? (state.humidity as number) ?? null,

    // Mode
    mode: (state.mode as string) ?? currentRoom.mode ?? null,
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
export function getCacheAge(timestamp: string): string {
  const ageMs = Date.now() - new Date(timestamp).getTime();
  const ageMinutes = Math.round(ageMs / 60000);

  if (ageMinutes < 1) return 'Appena aggiornato';
  if (ageMinutes < 60) return `${ageMinutes} min fa`;
  if (ageMinutes < 1440) return `${Math.round(ageMinutes / 60)} ore fa`;
  return `${Math.round(ageMinutes / 1440)} giorni fa`;
}

