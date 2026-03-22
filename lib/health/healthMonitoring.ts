/**
 * Stove Health Monitoring Service
 *
 * Core health check logic for automated stove monitoring:
 * - Checks stove connection status
 * - Detects state mismatches (expected vs actual)
 * - Verifies Netatmo heating demand coordination
 * - Parallel API fetching with graceful degradation
 */

import { getStatus } from '@/lib/stove/thermorossiProxy';
import { getProxyHomestatus } from '@/lib/netatmo/netatmoProxy';
import { adminDbGet, adminDbSet, adminDbRemove } from '@/lib/firebaseAdmin';

// Stove state categories for mismatch detection
const ON_STATES = ['working', 'modulating'];
const STARTING_STATES = ['igniting'];
const OFF_STATES = ['standby', 'off', 'cleaning'];
const GRACE_PERIOD_MS = 15 * 60 * 1000; // 15 minutes for STARTING states

/**
 * Health check result
 */
export interface HealthCheck {
  userId: string;
  timestamp: number;
  stoveStatus: string | null;
  stoveError: string | null;
  expectedState: 'ON' | 'OFF' | null;
  netatmoDemand: 'heating' | 'idle' | null;
  connectionStatus: 'online' | 'offline' | 'error';
  stateMismatch: {
    detected: boolean;
    expected: string;
    actual: string;
    reason: string;
  } | null;
}

/**
 * Check health for a single user's stove
 * Fetches data in parallel with graceful degradation
 */
export async function checkUserStoveHealth(userId: string): Promise<HealthCheck> {
  const timestamp = Date.now();

  // Fetch data in parallel - use Promise.allSettled for graceful degradation
  const [stoveResult, scheduleResult, netatmoResult] = await Promise.allSettled([
    getStatus().catch(err => {
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
  const stateMismatch = await detectStateMismatch(stoveResult, scheduleResult, netatmoResult, userId);

  return {
    userId,
    timestamp,
    stoveStatus: stoveResult.status === 'fulfilled' ? (stoveStatus?.stove_state || 'unknown') : null,
    stoveError,
    expectedState,
    netatmoDemand,
    connectionStatus,
    stateMismatch,
  };
}

/**
 * Determine stove connection status from API result
 */
export function determineConnectionStatus(
  stoveResult: PromiseSettledResult<unknown>
): 'online' | 'offline' | 'error' {
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
 */
export async function detectStateMismatch(
  stoveResult: any,
  scheduleResult: any,
  netatmoResult: any,
  userId: string
): Promise<{ detected: boolean; expected: string; actual: string; reason: string; [key: string]: unknown } | null> {
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
  const statusDescription = stoveStatus.stove_state || '';
  const actualCategory = categorizeStoveStatus(statusDescription);

  // Check if status is alarm (proxy uses stove_state === 'alarm' + error_code)
  const hasError = stoveStatus.stove_state === 'alarm' && stoveStatus.error_code && stoveStatus.error_code !== 0;

  // Handle ERROR states - always flag as mismatch
  if (hasError) {
    return {
      detected: true,
      expected: expectedState,
      actual: `ERROR (AL${stoveStatus.error_code})`,
      reason: 'stove_error',
      errorDescription: stoveStatus.error_description || 'Unknown error',
    };
  }

  // Handle STARTING states - grace period
  if (actualCategory === 'STARTING') {
    try {
      const entryTimestamp = await adminDbGet<number>(`health/stoveStarting/${userId}`);

      if (!entryTimestamp) {
        // First observation: start grace period
        await adminDbSet(`health/stoveStarting/${userId}`, Date.now());
        return null;
      }

      if (Date.now() - entryTimestamp < GRACE_PERIOD_MS) {
        return null; // Within grace period
      }

      // Grace period expired — flag as mismatch
      return {
        detected: true,
        expected: expectedState,
        actual: statusDescription,
        reason: 'starting_timeout',
      };
    } catch (err) {
      console.error('[detectStateMismatch] Grace period Firebase error:', err);
      return null; // Fail-safe: don't alert on Firebase errors
    }
  }

  // Leaving STARTING state — clean up grace period key (fire-and-forget)
  adminDbRemove(`health/stoveStarting/${userId}`).catch(() => {});

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
function categorizeStoveStatus(status: string) {
  if (!status) return 'UNKNOWN';

  // Check ON states (proxy values are lowercase exact strings)
  if (ON_STATES.includes(status)) {
    return 'ON';
  }

  // Check STARTING states
  if (STARTING_STATES.includes(status)) {
    return 'STARTING';
  }

  // Check OFF states
  if (OFF_STATES.includes(status)) {
    return 'OFF';
  }

  // alarm state is handled separately via hasError check
  if (status === 'alarm') {
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
async function getExpectedStateFromSchedule(userId: string) {
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
    // Fetch home status via proxy (no token management needed)
    const proxyResponse = await getProxyHomestatus();

    if (!proxyResponse.rooms || proxyResponse.rooms.length === 0) {
      return 'idle';
    }

    // Check if any room is actively heating
    const isHeating = proxyResponse.rooms.some(room => {
      return room.heating_power_request && room.heating_power_request > 0;
    });

    return isHeating ? 'heating' : 'idle';

  } catch (error) {
    console.error('❌ Error getting Netatmo heating demand:', error);
    throw error;
  }
}
