/**
 * User Intent Detection Service
 *
 * Detects manual thermostat changes by comparing current Netatmo setpoints
 * against expected values stored in coordination state.
 *
 * Detection logic:
 * - Setpoint change: Current differs from expected by > 0.5°C tolerance
 * - Mode change: User switched to away, hg (frost guard), or off
 *
 * User intent is sacred - manual changes pause automation until next schedule slot.
 */

import NETATMO_API from './netatmoApi';
import { getCoordinationState } from './coordinationState';

/**
 * Tolerance for setpoint comparison (0.5°C)
 * Accounts for rounding in Netatmo API
 */
const SETPOINT_TOLERANCE = 0.5;

/**
 * Non-standard modes that indicate user intent
 */
const NON_STANDARD_MODES = ['away', 'hg', 'off'];

/**
 * Detect user intent across multiple rooms
 *
 * @param {string} homeId - Netatmo home ID
 * @param {string[]} roomIds - Array of room IDs to check
 * @param {Object} expectedSetpoints - Object { roomId: expectedTemp }
 * @param {string} accessToken - Netatmo access token
 * @returns {Promise<{
 *   manualChange: boolean,
 *   changes: Array<{
 *     roomId: string,
 *     roomName: string,
 *     type: 'setpoint_changed' | 'mode_changed',
 *     expected: number | string,
 *     actual: number | string,
 *   }>,
 *   reason: string | null,
 *   error?: string
 * }>}
 *
 * @example
 * const result = await detectUserIntent(
 *   'home123',
 *   ['room1', 'room2'],
 *   { room1: 21.0, room2: 19.0 },
 *   accessToken
 * );
 *
 * if (result.manualChange) {
 *   console.log('Manual change detected:', result.reason);
 *   // Pause automation
 * }
 */
export async function detectUserIntent(homeId, roomIds, expectedSetpoints, accessToken) {
  try {
    // Get current home status from Netatmo
    const homeStatus = await NETATMO_API.getHomeStatus(accessToken, homeId);

    if (!homeStatus || !homeStatus.rooms) {
      return {
        manualChange: false,
        changes: [],
        reason: null,
        error: 'Unable to fetch home status',
      };
    }

    const changes = [];

    // Check each room for manual changes
    for (const roomId of roomIds) {
      const room = homeStatus.rooms.find(r => r.id === roomId);

      if (!room) {
        console.warn(`Room ${roomId} not found in home status`);
        continue;
      }

      const expected = expectedSetpoints[roomId];
      const currentSetpoint = room.therm_setpoint_temperature;
      const currentMode = room.therm_setpoint_mode;

      // Check 1: Setpoint changed by more than tolerance
      if (expected !== undefined && currentSetpoint !== undefined) {
        const diff = Math.abs(currentSetpoint - expected);

        if (diff > SETPOINT_TOLERANCE) {
          changes.push({
            roomId: room.id,
            roomName: room.name || roomId,
            type: 'setpoint_changed',
            expected,
            actual: currentSetpoint,
          });
        }
      }

      // Check 2: Mode changed to non-standard (away, hg, off)
      if (NON_STANDARD_MODES.includes(currentMode)) {
        changes.push({
          roomId: room.id,
          roomName: room.name || roomId,
          type: 'mode_changed',
          expected: 'manual/home',
          actual: currentMode,
        });
      }
    }

    // Generate human-readable reason
    let reason = null;
    if (changes.length > 0) {
      const roomNames = [...new Set(changes.map(c => c.roomName))].join(', ');
      const types = [...new Set(changes.map(c => c.type))];

      if (types.includes('setpoint_changed') && types.includes('mode_changed')) {
        reason = `Setpoint e modalità modificati manualmente (${roomNames})`;
      } else if (types.includes('setpoint_changed')) {
        reason = `Setpoint modificato manualmente (${roomNames})`;
      } else {
        reason = `Modalità modificata manualmente (${roomNames})`;
      }
    }

    return {
      manualChange: changes.length > 0,
      changes,
      reason,
    };

  } catch (error) {
    console.error('Error detecting user intent:', error);
    return {
      manualChange: false,
      changes: [],
      reason: null,
      error: error.message,
    };
  }
}

/**
 * Check if a single room was manually changed
 * Convenience wrapper for single-room check
 *
 * @param {string} homeId - Netatmo home ID
 * @param {string} roomId - Room ID to check
 * @param {number} expectedSetpoint - Expected setpoint temperature
 * @param {string} accessToken - Netatmo access token
 * @returns {Promise<boolean>} True if manual change detected
 *
 * @example
 * const changed = await wasManuallyChanged('home123', 'room1', 21.0, accessToken);
 * if (changed) {
 *   // Pause automation for this room
 * }
 */
export async function wasManuallyChanged(homeId, roomId, expectedSetpoint, accessToken) {
  const result = await detectUserIntent(
    homeId,
    [roomId],
    { [roomId]: expectedSetpoint },
    accessToken
  );

  return result.manualChange;
}
