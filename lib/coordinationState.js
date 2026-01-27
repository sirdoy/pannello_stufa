/**
 * Coordination State Service
 *
 * Manages the runtime state of stove-thermostat coordination.
 * Tracks stove status, automation pauses, debounce timers, and setpoint backups.
 *
 * Firebase Schema:
 * coordination/state: {
 *   stoveOn: boolean,              // Current stove state (from last check)
 *   automationPaused: boolean,     // Whether automation is paused (user intent)
 *   pausedUntil: number|null,      // Timestamp when pause expires (next schedule slot)
 *   pauseReason: string|null,      // Why automation was paused ('manual_setpoint_change', 'manual_mode_change')
 *   lastStateChange: number,       // Timestamp of last state change
 *   pendingDebounce: boolean,      // Whether a debounce timer is active
 *   debounceStartedAt: number|null, // When debounce timer started (for resumability)
 *   previousSetpoints: object|null, // { roomId: setpoint } for restoration
 * }
 */

import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

/**
 * Get default coordination state
 * @returns {Object} Default state
 */
function getDefaultState() {
  return {
    stoveOn: false,
    automationPaused: false,
    pausedUntil: null,
    pauseReason: null,
    lastStateChange: Date.now(),
    pendingDebounce: false,
    debounceStartedAt: null,
    previousSetpoints: null,
  };
}

/**
 * Get current coordination state from Firebase
 * @returns {Promise<Object>} Current state or default if not found
 */
export async function getCoordinationState() {
  const statePath = getEnvironmentPath('coordination/state');
  const state = await adminDbGet(statePath);

  if (!state) {
    return getDefaultState();
  }

  return state;
}

/**
 * Update coordination state (merges updates)
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated state
 */
export async function updateCoordinationState(updates) {
  const currentState = await getCoordinationState();

  const newState = {
    ...currentState,
    ...updates,
    lastStateChange: Date.now(),
  };

  const statePath = getEnvironmentPath('coordination/state');
  await adminDbSet(statePath, newState);

  return newState;
}

/**
 * Reset coordination state to defaults
 * @returns {Promise<Object>} Reset state
 */
export async function resetCoordinationState() {
  const defaultState = getDefaultState();
  const statePath = getEnvironmentPath('coordination/state');
  await adminDbSet(statePath, defaultState);

  return defaultState;
}
