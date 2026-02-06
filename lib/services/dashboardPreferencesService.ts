/**
 * Dashboard Preferences Service
 *
 * Client-side Firebase operations for per-user dashboard customization.
 * Supports get/set/subscribe patterns for card order and visibility.
 * Each user has their own preferences stored at users/${userId}/dashboardPreferences.
 *
 * Usage:
 *   import { getDashboardPreferences, setDashboardPreferences } from '@/lib/services/dashboardPreferencesService';
 *
 *   const prefs = await getDashboardPreferences(userId);
 *   await setDashboardPreferences(userId, { cardOrder: [...] });
 */

import { ref, onValue, set } from 'firebase/database';
import { db } from '@/lib/firebase';

/**
 * Default card order for new users
 * Matches existing home page cards plus weather
 * Each card has id, label, icon, and visible properties
 */
export const DEFAULT_CARD_ORDER = [
  { id: 'stove', label: 'Stufa', icon: '🔥', visible: true },
  { id: 'thermostat', label: 'Termostato', icon: '🌡️', visible: true },
  { id: 'weather', label: 'Meteo', icon: '☀️', visible: true },
  { id: 'lights', label: 'Luci', icon: '💡', visible: true },
  { id: 'camera', label: 'Telecamera', icon: '📹', visible: true },
];

/**
 * Get Firebase path for user's dashboard preferences
 * @param {string} userId - Auth0 user ID (sub claim)
 * @returns {string} - 'users/${userId}/dashboardPreferences'
 */
const getDashboardPath = (userId) => `users/${userId}/dashboardPreferences`;

/**
 * Get dashboard preferences for a user (read once)
 *
 * @param {string} userId - Auth0 user ID (required)
 * @returns {Promise<Object>} - { cardOrder: [...] } or defaults
 *
 * @example
 * const prefs = await getDashboardPreferences(session.user.sub);
 * console.log(prefs.cardOrder); // Array of card configs
 */
export async function getDashboardPreferences(userId) {
  // Return defaults if no userId provided
  if (!userId) {
    return { cardOrder: DEFAULT_CARD_ORDER };
  }

  const dashboardRef = ref(db, getDashboardPath(userId));

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
 * Set dashboard preferences for a user
 *
 * @param {string} userId - Auth0 user ID (required)
 * @param {Object} preferences - Preferences to save
 * @param {Array} preferences.cardOrder - Array of { id, label, icon, visible }
 * @returns {Promise<void>}
 * @throws {Error} If userId is not provided
 *
 * @example
 * await setDashboardPreferences(session.user.sub, {
 *   cardOrder: [
 *     { id: 'stove', label: 'Stufa', icon: '🔥', visible: true },
 *     { id: 'weather', label: 'Meteo', icon: '☀️', visible: false },
 *   ]
 * });
 */
export async function setDashboardPreferences(userId, { cardOrder }) {
  if (!userId) {
    throw new Error('userId is required to save dashboard preferences');
  }

  const dashboardRef = ref(db, getDashboardPath(userId));

  await set(dashboardRef, {
    cardOrder: cardOrder || DEFAULT_CARD_ORDER,
    updatedAt: Date.now(),
  });
}

/**
 * Subscribe to dashboard preferences (real-time updates)
 *
 * @param {string} userId - Auth0 user ID (required)
 * @param {Function} callback - Called with preferences on each update
 * @returns {Function} - Unsubscribe function (noop if no userId)
 *
 * @example
 * const unsubscribe = subscribeToDashboardPreferences(session.user.sub, (prefs) => {
 *   console.log('Dashboard updated:', prefs);
 * });
 *
 * // Later: unsubscribe()
 */
export function subscribeToDashboardPreferences(userId, callback) {
  // Return noop unsubscribe if no userId
  if (!userId) {
    callback({ cardOrder: DEFAULT_CARD_ORDER });
    return () => {};
  }

  const dashboardRef = ref(db, getDashboardPath(userId));

  const unsubscribe = onValue(dashboardRef, (snapshot) => {
    const data = snapshot.val();
    callback(data || { cardOrder: DEFAULT_CARD_ORDER });
  });

  return unsubscribe;
}
