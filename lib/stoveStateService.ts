/**
 * Stove State Service
 * Manages Firebase Realtime Database state for instant UI updates
 */

import { adminDbUpdate, adminDbGet } from './firebaseAdmin';
import { getEnvironmentPath } from './environmentHelper';

/**
 * Update stove state in Firebase for real-time sync
 * @param {Object} stateUpdate - Partial state object to update
 * @param {string} [stateUpdate.status] - Status string (e.g., 'WORK', 'OFF')
 * @param {string} [stateUpdate.statusDescription] - Human-readable status
 * @param {number} [stateUpdate.fanLevel] - Fan level (1-6)
 * @param {number} [stateUpdate.powerLevel] - Power level (1-5)
 * @param {number} [stateUpdate.errorCode] - Error code (0 = no error)
 * @param {string} [stateUpdate.errorDescription] - Error description
 * @param {string} [stateUpdate.source] - Source of update ('manual'|'scheduler'|'api')
 */
export async function updateStoveState(stateUpdate) {
  const path = getEnvironmentPath('stove/state');

  try {
    // Always include lastUpdated timestamp
    const updates = {
      ...stateUpdate,
      lastUpdated: new Date().toISOString(),
    };

    // Filter out undefined values (Firebase doesn't accept undefined)
    const filteredUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {});

    await adminDbUpdate(path, filteredUpdates);

    console.log('[StoveStateService] State updated:', Object.keys(filteredUpdates).join(', '));
  } catch (error) {
    console.error('[StoveStateService] Failed to update Firebase state:', error);
    // Non-critical error - don't throw (API action already succeeded)
  }
}

/**
 * Get current stove state from Firebase
 * @returns {Promise<Object|null>} Current stove state or null if not exists
 */
export async function getStoveState() {
  const path = getEnvironmentPath('stove/state');

  try {
    const state = await adminDbGet(path);
    return state;
  } catch (error) {
    console.error('[StoveStateService] Failed to fetch Firebase state:', error);
    return null;
  }
}

/**
 * Initialize stove state in Firebase (if not exists)
 */
export async function initializeStoveState() {
  const existing = await getStoveState();

  if (!existing) {
    await updateStoveState({
      status: 'UNKNOWN',
      statusDescription: 'Inizializzazione...',
      fanLevel: null,
      powerLevel: null,
      errorCode: 0,
      errorDescription: '',
      source: 'init',
    });
    console.log('[StoveStateService] State initialized');
  }
}
