/**
 * Stove Health Monitoring Service
 *
 * Core health check logic for automated stove monitoring:
 * - Checks stove connection status
 * - Detects state mismatches (expected vs actual)
 * - Verifies Netatmo heating demand coordination
 * - Parallel API fetching with graceful degradation
 */

import { getStoveStatus } from './stoveApi.js';
import { getHomeStatus } from './netatmoApi.js';
import { adminDbGet } from './firebaseAdmin.js';

// Stove state categories for mismatch detection
const ON_STATES = ['WORK', 'MODULATION'];
const STARTING_STATES = ['START'];
const OFF_STATES = ['STANDBY', 'SHUTDOWN', 'FINALIZZAZIONE'];
const GRACE_PERIOD_MS = 15 * 60 * 1000; // 15 minutes for STARTING states

/**
 * Check health for a single user's stove
 * Fetches data in parallel with graceful degradation
 *
 * @param {string} userId - User ID (Auth0 sub)
 * @returns {Promise<Object>} Health check result
 */
export async function checkUserStoveHealth(userId) {
  const timestamp = Date.now();

  // Fetch data in parallel - use Promise.allSettled for graceful degradation
  const [stoveResult, scheduleResult, netatmoResult] = await Promise.allSettled([
    getStoveStatus().catch(err => {
      console.error(`❌ Stove status fetch failed for user ${userId}:`, err.message);
      throw err;
    }),
    getExpectedStateFromSchedule(userId).catch(err => {
      console.error(`⚠️ Schedule fetch failed for user ${userId}:`, err.message);
      return null;
    }),
    getNetatmoHeatingDemand().catch(err => {
      console.error(`⚠️ Netatmo demand fetch failed for user ${userId}:`, err.message);
      return null;
    }),
  ]);

  // Extract values with graceful fallbacks
  const stoveStatus = stoveResult.status === 'fulfilled' ? stoveResult.value : null;
  const stoveError = stoveResult.status === 'rejected' ? stoveResult.reason?.message : null;
  const expectedState = scheduleResult.status === 'fulfilled' ? scheduleResult.value : null;
  const netatmoDemand = netatmoResult.status === 'fulfilled' ? netatmoResult.value : null;

  // Determine connection status
  const connectionStatus = determineConnectionStatus(stoveResult);

  // Detect state mismatch
  const stateMismatch = detectStateMismatch(stoveResult, scheduleResult, netatmoResult);

  return {
    userId,
    timestamp,
    stoveStatus,
    stoveError,
    expectedState,
    netatmoDemand,
    connectionStatus,
    stateMismatch,
  };
}

/**
 * Determine stove connection status from API result
 *
 * @param {Object} stoveResult - Promise.allSettled result for stove status
 * @returns {string} 'online' | 'offline' | 'error'
 */
export function determineConnectionStatus(stoveResult) {
  if (stoveResult.status === 'fulfilled') {
    // Successfully fetched status
    return 'online';
  }

  // Check error type
  const error = stoveResult.reason;
  if (error?.message === 'STOVE_TIMEOUT') {
    return 'offline'; // Stove not responding (timeout)
  }

  return 'error'; // Other error (API error, parsing error, etc.)
}

/**
 * Detect state mismatch between expected and actual stove state
 * Uses both schedule and Netatmo heating demand as signals
 *
 * @param {Object} stoveResult - Promise.allSettled result for stove status
 * @param {Object} scheduleResult - Promise.allSettled result for schedule
 * @param {Object} netatmoResult - Promise.allSettled result for Netatmo demand
 * @returns {Object|null} Mismatch object or null if no mismatch
 */
export function detectStateMismatch(stoveResult, scheduleResult, netatmoResult) {
  // Can't detect mismatch if stove status unavailable
  if (stoveResult.status !== 'fulfilled') {
    return null;
  }

  const stoveStatus = stoveResult.value;
  const expectedState = scheduleResult.status === 'fulfilled' ? scheduleResult.value : null;
  const netatmoDemand = netatmoResult.status === 'fulfilled' ? netatmoResult.value : null;

  // Can't detect mismatch without expected state
  if (!expectedState) {
    return null;
  }

  // Parse actual stove state
  const statusDescription = stoveStatus.StatusDescription || '';
  const actualCategory = categorizeStoveStatus(statusDescription);

  // Check if status contains error code
  const hasError = stoveStatus.Error && stoveStatus.Error !== 0;

  // Handle ERROR states - always flag as mismatch
  if (hasError) {
    return {
      detected: true,
      expected: expectedState,
      actual: `ERROR (AL${stoveStatus.Error})`,
      reason: 'stove_error',
      errorDescription: stoveStatus.ErrorDescription || 'Unknown error',
    };
  }

  // Handle STARTING states - grace period (don't flag immediately)
  if (actualCategory === 'STARTING') {
    // TODO: Track when stove entered STARTING state to apply grace period
    // For now, don't flag STARTING as mismatch (allow time to transition)
    return null;
  }

  // Compare expected vs actual
  if (expectedState === 'ON' && actualCategory === 'OFF') {
    // Stove should be ON but is OFF
    return {
      detected: true,
      expected: 'ON',
      actual: statusDescription,
      reason: 'should_be_on',
      netatmoDemand, // Include for coordination analysis
    };
  }

  if (expectedState === 'OFF' && actualCategory === 'ON') {
    // Stove should be OFF but is ON
    return {
      detected: true,
      expected: 'OFF',
      actual: statusDescription,
      reason: 'should_be_off',
      netatmoDemand,
    };
  }

  // Secondary signal: Check Netatmo coordination
  // If Netatmo is heating but stove is OFF, potential issue
  if (netatmoDemand === 'heating' && actualCategory === 'OFF') {
    return {
      detected: true,
      expected: 'ON (heating demand)',
      actual: statusDescription,
      reason: 'netatmo_heating_stove_off',
      netatmoDemand,
    };
  }

  // No mismatch detected
  return null;
}

/**
 * Categorize stove status into ON/STARTING/OFF/ERROR
 *
 * @param {string} status - Stove status description
 * @returns {string} 'ON' | 'STARTING' | 'OFF' | 'ERROR' | 'UNKNOWN'
 */
function categorizeStoveStatus(status) {
  if (!status) return 'UNKNOWN';

  const upperStatus = status.toUpperCase();

  // Check ON states
  if (ON_STATES.some(s => upperStatus.includes(s))) {
    return 'ON';
  }

  // Check STARTING states
  if (STARTING_STATES.some(s => upperStatus.includes(s))) {
    return 'STARTING';
  }

  // Check OFF states
  if (OFF_STATES.some(s => upperStatus.includes(s))) {
    return 'OFF';
  }

  // Check for error indicators
  if (upperStatus.includes('ERROR') || upperStatus.includes('AL')) {
    return 'ERROR';
  }

  return 'UNKNOWN';
}

/**
 * Get expected stove state from user's schedule
 * Reads scheduler mode and current time slot from Firebase RTDB
 *
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} 'ON' | 'OFF' | null
 */
async function getExpectedStateFromSchedule(userId) {
  try {
    // Read scheduler mode
    const mode = await adminDbGet(`scheduler/mode`);

    if (!mode || mode === 'manual') {
      // Manual mode - no expected state
      return null;
    }

    if (mode === 'auto') {
      // Auto mode - check current time slot
      const schedule = await adminDbGet(`scheduler/schedule`);

      if (!schedule || !Array.isArray(schedule)) {
        return null;
      }

      // Find current time slot (similar to scheduler/check route logic)
      const now = new Date();
      const currentDay = now.getDay(); // 0=Sunday, 1=Monday, etc.
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Find matching slot
      const currentSlot = schedule.find(slot => {
        return slot.day === currentDay &&
               currentMinutes >= slot.start &&
               currentMinutes < slot.end;
      });

      // If slot found and enabled, stove should be ON
      return currentSlot && currentSlot.enabled ? 'ON' : 'OFF';
    }

    if (mode === 'semi-manual') {
      // Semi-manual mode - user controls, but schedule provides suggestion
      // For health monitoring, treat as manual (no expected state)
      return null;
    }

    return null;

  } catch (error) {
    console.error('❌ Error getting expected state from schedule:', error);
    throw error;
  }
}

/**
 * Get Netatmo heating demand for coordination verification
 * Checks if any room is actively requesting heat
 *
 * @returns {Promise<string|null>} 'heating' | 'idle' | null
 */
async function getNetatmoHeatingDemand() {
  try {
    const homeId = process.env.NETATMO_HOME_ID;

    if (!homeId) {
      console.log('⚠️ NETATMO_HOME_ID not configured - skipping demand check');
      return null;
    }

    // Get Netatmo access token from Firebase RTDB
    const tokenData = await adminDbGet('netatmo/accessToken');

    if (!tokenData || !tokenData.token) {
      console.log('⚠️ Netatmo token not available - skipping demand check');
      return null;
    }

    // Fetch home status
    const homeStatus = await getHomeStatus(tokenData.token, homeId);

    if (!homeStatus.rooms || homeStatus.rooms.length === 0) {
      return 'idle';
    }

    // Check if any room is actively heating
    const isHeating = homeStatus.rooms.some(room => {
      return room.heating_power_request && room.heating_power_request > 0;
    });

    return isHeating ? 'heating' : 'idle';

  } catch (error) {
    console.error('❌ Error getting Netatmo heating demand:', error);
    throw error;
  }
}
