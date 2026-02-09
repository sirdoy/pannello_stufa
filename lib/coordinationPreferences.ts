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
  type CoordinationPreferences,
} from '@/lib/schemas/coordinationPreferences';

/**
 * Get coordination preferences for a user
 */
export async function getCoordinationPreferences(
  userId: string
): Promise<CoordinationPreferences> {
  const prefsPath = getEnvironmentPath(`coordination/preferences/${userId}`);
  const prefs = await adminDbGet(prefsPath);

  if (!prefs) {
    return getDefaultCoordinationPreferences();
  }

  return prefs as CoordinationPreferences;
}

/**
 * Update coordination preferences for a user
 * Validates with Zod, merges updates, increments version, sets updatedAt
 */
export async function updateCoordinationPreferences(
  userId: string,
  updates: Partial<CoordinationPreferences>
): Promise<CoordinationPreferences> {
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
