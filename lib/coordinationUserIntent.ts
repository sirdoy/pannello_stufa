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
const NON_STANDARD_MODES = ['away', 'hg', 'off'] as const;

/**
 * Change type
 */
type ChangeType = 'setpoint_changed' | 'mode_changed';

/**
 * Manual change entry
 */
interface ManualChange {
  roomId: string;
  roomName: string;
  type: ChangeType;
  expected: number | string;
  actual: number | string;
}

/**
 * User intent detection result
 */
interface IntentResult {
  manualChange: boolean;
  changes: ManualChange[];
  reason: string | null;
  error?: string;
}

/**
 * Detect user intent across multiple rooms
 */
export async function detectUserIntent(
  homeId: string,
  roomIds: string[],
  expectedSetpoints: Record<string, number>,
  accessToken: string
): Promise<IntentResult> {
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

    const changes: ManualChange[] = [];

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
      if ((NON_STANDARD_MODES as readonly string[]).includes(currentMode)) {
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
 */
export async function wasManuallyChanged(
  homeId: string,
  roomId: string,
  expectedSetpoint: number,
  accessToken: string
): Promise<boolean> {
  const result = await detectUserIntent(
    homeId,
    [roomId],
    { [roomId]: expectedSetpoint },
    accessToken
  );

  return result.manualChange;
}
