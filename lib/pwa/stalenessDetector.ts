/**
 * Staleness Detection Service
 *
 * Determines whether cached device data is stale (older than 30 seconds)
 * and whether offline commands have expired (safety-critical commands expire after 1 hour).
 *
 * @module stalenessDetector
 */

import { get, STORES } from './indexedDB';

/**
 * Staleness threshold: 30 seconds
 */
export const STALENESS_THRESHOLD = 30000; // 30 seconds in milliseconds

/**
 * Command expiry threshold: 1 hour for safety-critical commands
 */
const COMMAND_EXPIRY_MS = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Safety-critical endpoints that expire after 1 hour
 */
const SAFETY_CRITICAL_ENDPOINTS = [
  'stove/ignite',
  'stove/shutdown',
  'stove/set-power',
] as const;

/**
 * Staleness information for a device
 */
export interface StalenessInfo {
  isStale: boolean;
  cachedAt: Date | null;
  ageSeconds: number;
}

/**
 * Cached device state structure from IndexedDB
 */
interface CachedDeviceState {
  deviceId: string;
  state: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Command structure for expiration check
 */
export interface Command {
  endpoint: string;
  timestamp: string;
}

/**
 * Get staleness information for a device
 *
 * @param deviceId - Device ID to check
 * @returns Staleness info including isStale, cachedAt, and ageSeconds
 *
 * @example
 * const staleness = await getDeviceStaleness('stove');
 * if (staleness.isStale) {
 *   console.log(`Data is ${staleness.ageSeconds} seconds old`);
 * }
 */
export async function getDeviceStaleness(deviceId: string): Promise<StalenessInfo> {
  try {
    const cached = await get<CachedDeviceState>(STORES.DEVICE_STATE, deviceId);

    // No cached data or no timestamp
    if (!cached || !cached.timestamp) {
      return {
        isStale: true,
        cachedAt: null,
        ageSeconds: Infinity,
      };
    }

    // Calculate age
    const cachedAt = new Date(cached.timestamp);
    const ageMs = Date.now() - cachedAt.getTime();
    const ageSeconds = Math.floor(ageMs / 1000);

    return {
      isStale: ageMs >= STALENESS_THRESHOLD,
      cachedAt,
      ageSeconds,
    };
  } catch (error) {
    console.error(`[StalenessDetector] Error checking staleness for ${deviceId}:`, error);
    return {
      isStale: true,
      cachedAt: null,
      ageSeconds: Infinity,
    };
  }
}

/**
 * Check if a command has expired
 *
 * Safety-critical commands (ignite, shutdown, set-power) expire after 1 hour.
 * Read-only and non-critical commands never expire.
 *
 * @param command - Command object with endpoint and timestamp
 * @returns True if command has expired, false otherwise
 *
 * @example
 * const expired = isCommandExpired({
 *   endpoint: 'stove/ignite',
 *   timestamp: '2024-01-01T10:00:00Z'
 * });
 * if (expired) {
 *   console.log('Command too old, cannot execute');
 * }
 */
export function isCommandExpired(command: Command): boolean {
  // Check if this is a safety-critical endpoint
  const isSafetyCritical = SAFETY_CRITICAL_ENDPOINTS.some((endpoint) =>
    command.endpoint.includes(endpoint)
  );

  // Non-safety-critical commands never expire
  if (!isSafetyCritical) {
    return false;
  }

  // Calculate command age
  const commandTime = new Date(command.timestamp).getTime();
  const ageMs = Date.now() - commandTime;

  // Safety-critical commands expire after 1 hour
  return ageMs > COMMAND_EXPIRY_MS;
}
