/**
 * Coordination Preferences Service
 *
 * Manages user-specific coordination preferences in Firebase RTDB.
 * Provides validated, versioned preference storage with sensible defaults.
 *
 * Firebase Schema:
 * coordination/preferences/{userId}: {
 *   enabled: boolean,
 *   defaultBoost: number,
 *   zones: [{ roomId, roomName, enabled, boost }],
 *   notificationPreferences: { ... },
 *   version: number,
 *   updatedAt: string,
 * }
 */

import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import {
  coordinationPreferencesSchema,
  getDefaultCoordinationPreferences,
} from '@/lib/schemas/coordinationPreferences';

/**
 * Get coordination preferences for a user
 * @param {string} userId - User ID (Auth0 sub)
 * @returns {Promise<Object>} User preferences or defaults if not found
 */
export async function getCoordinationPreferences(userId) {
  const prefsPath = getEnvironmentPath(`coordination/preferences/${userId}`);
  const prefs = await adminDbGet(prefsPath);

  if (!prefs) {
    return getDefaultCoordinationPreferences();
  }

  return prefs;
}

/**
 * Update coordination preferences for a user
 * Validates with Zod, merges updates, increments version, sets updatedAt
 *
 * @param {string} userId - User ID (Auth0 sub)
 * @param {Object} updates - Partial preference updates
 * @returns {Promise<Object>} Updated preferences
 * @throws {Error} If validation fails
 */
export async function updateCoordinationPreferences(userId, updates) {
  // Get current preferences
  const currentPrefs = await getCoordinationPreferences(userId);

  // Merge updates
  const newPrefs = {
    ...currentPrefs,
    ...updates,
    // Increment version
    version: (currentPrefs.version || 1) + 1,
    // Set updatedAt to current ISO timestamp
    updatedAt: new Date().toISOString(),
  };

  // Validate merged preferences with Zod
  const validatedPrefs = coordinationPreferencesSchema.parse(newPrefs);

  // Save to Firebase
  const prefsPath = getEnvironmentPath(`coordination/preferences/${userId}`);
  await adminDbSet(prefsPath, validatedPrefs);

  return validatedPrefs;
}

/**
 * Re-export getDefaultCoordinationPreferences for convenience
 */
export { getDefaultCoordinationPreferences };
