/**
 * Dashboard Preferences Service
 *
 * Client-side Firebase operations for dashboard customization.
 * Supports get/set/subscribe patterns for card order and visibility.
 *
 * Usage:
 *   import { getDashboardPreferences, setDashboardPreferences } from '@/lib/services/dashboardPreferencesService';
 *
 *   const prefs = await getDashboardPreferences();
 *   await setDashboardPreferences({ cardOrder: [...] });
 */

import { ref, onValue, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getEnvironmentPath } from '@/lib/environmentHelper';

/**
 * Default card order for new users
 * Matches existing home page cards plus weather
 */
export const DEFAULT_CARD_ORDER = [
  { id: 'stove', label: 'Stufa', visible: true },
  { id: 'thermostat', label: 'Termostato', visible: true },
  { id: 'weather', label: 'Meteo', visible: true },
  { id: 'lights', label: 'Luci', visible: true },
  { id: 'camera', label: 'Telecamera', visible: true },
];

/**
 * Get Firebase path for dashboard preferences
 * @returns {string} - 'config/dashboard' or 'dev/config/dashboard'
 */
const getDashboardPath = () => getEnvironmentPath('config/dashboard');

/**
 * Get dashboard preferences (read once)
 *
 * @returns {Promise<Object>} - { cardOrder: [...] } or defaults
 *
 * @example
 * const prefs = await getDashboardPreferences();
 * console.log(prefs.cardOrder); // Array of card configs
 */
export async function getDashboardPreferences() {
  const dashboardRef = ref(db, getDashboardPath());

  return new Promise((resolve) => {
    onValue(
      dashboardRef,
      (snapshot) => {
        const data = snapshot.val();
        // Return stored preferences or defaults
        resolve(data || { cardOrder: DEFAULT_CARD_ORDER });
      },
      { onlyOnce: true }
    );
  });
}

/**
 * Set dashboard preferences
 *
 * @param {Object} preferences - Preferences to save
 * @param {Array} preferences.cardOrder - Array of { id, label, visible }
 * @returns {Promise<void>}
 *
 * @example
 * await setDashboardPreferences({
 *   cardOrder: [
 *     { id: 'stove', label: 'Stufa', visible: true },
 *     { id: 'weather', label: 'Meteo', visible: false },
 *   ]
 * });
 */
export async function setDashboardPreferences({ cardOrder }) {
  const dashboardRef = ref(db, getDashboardPath());

  await set(dashboardRef, {
    cardOrder: cardOrder || DEFAULT_CARD_ORDER,
    updatedAt: Date.now(),
  });
}

/**
 * Subscribe to dashboard preferences (real-time updates)
 *
 * @param {Function} callback - Called with preferences on each update
 * @returns {Function} - Unsubscribe function
 *
 * @example
 * const unsubscribe = subscribeToDashboardPreferences((prefs) => {
 *   console.log('Dashboard updated:', prefs);
 * });
 *
 * // Later: unsubscribe()
 */
export function subscribeToDashboardPreferences(callback) {
  const dashboardRef = ref(db, getDashboardPath());

  const unsubscribe = onValue(dashboardRef, (snapshot) => {
    const data = snapshot.val();
    callback(data || { cardOrder: DEFAULT_CARD_ORDER });
  });

  return unsubscribe;
}
