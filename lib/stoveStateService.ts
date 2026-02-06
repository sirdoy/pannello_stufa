/**
 * Stove State Service
 * Manages Firebase Realtime Database state for instant UI updates
 */

import { adminDbUpdate, adminDbGet } from './firebaseAdmin';
import { getEnvironmentPath } from './environmentHelper';

/** Stove state update */
export interface StoveStateUpdate {
  status?: string;
  statusDescription?: string;
  fanLevel?: number | null;
  powerLevel?: number | null;
  errorCode?: number;
  errorDescription?: string;
  source?: 'manual' | 'scheduler' | 'api' | 'init';
  lastUpdated?: string;
}

/** Full stove state */
export interface StoveState extends Required<StoveStateUpdate> {}

/**
 * Update stove state in Firebase for real-time sync
 */
export async function updateStoveState(stateUpdate: StoveStateUpdate): Promise<void> {
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
 */
export async function getStoveState(): Promise<StoveState | null> {
  const path = getEnvironmentPath('stove/state');

  try {
    const state = await adminDbGet(path) as StoveState | null;
    return state;
  } catch (error) {
    console.error('[StoveStateService] Failed to fetch Firebase state:', error);
    return null;
  }
}

/**
 * Initialize stove state in Firebase (if not exists)
 */
export async function initializeStoveState(): Promise<void> {
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
