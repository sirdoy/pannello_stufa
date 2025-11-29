/**
 * Notification Preferences Service
 *
 * Gestisce le preferenze notifiche per utente salvate su Firebase
 * Permette attivazione/disattivazione selettiva per tipo e severità
 */

import { db } from './firebase';
import { ref, get } from 'firebase/database';

/**
 * Default preferences (tutto abilitato)
 */
export const DEFAULT_PREFERENCES = {
  errors: {
    enabled: true,
    severityLevels: {
      info: false,        // INFO di default disabilitato (troppo rumore)
      warning: true,
      error: true,
      critical: true,
    },
  },
  scheduler: {
    enabled: true,
    ignition: true,      // Notifica accensione automatica
    shutdown: true,      // Notifica spegnimento automatico
  },
  maintenance: {
    enabled: true,
    threshold80: true,   // Promemoria 80%
    threshold90: true,   // Attenzione 90%
    threshold100: true,  // Urgente 100%
  },
};

/**
 * Get user notification preferences from Firebase via API
 * @param {string} userId - User ID (Auth0 sub)
 * @returns {Promise<Object>} User preferences
 */
export async function getUserPreferences(userId) {
  if (!userId) {
    throw new Error('User ID required');
  }

  try {
    const response = await fetch('/api/notifications/preferences', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch preferences');
    }

    const data = await response.json();
    return data.preferences;

  } catch (error) {
    console.error('Error getting user preferences:', error);
    // Return defaults in caso di errore
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Update user notification preferences via API
 * @param {string} userId - User ID
 * @param {Object} preferences - Preferences object (partial update supported)
 * @returns {Promise<boolean>}
 */
export async function updateUserPreferences(userId, preferences) {
  if (!userId) {
    throw new Error('User ID required');
  }

  try {
    const response = await fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update preferences');
    }

    return true;

  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
}

/**
 * Update specific preference section via API
 * @param {string} userId - User ID
 * @param {string} section - 'errors'|'scheduler'|'maintenance'
 * @param {Object} sectionPreferences - Section preferences
 * @returns {Promise<boolean>}
 */
export async function updatePreferenceSection(userId, section, sectionPreferences) {
  if (!userId) {
    throw new Error('User ID required');
  }

  if (!['errors', 'scheduler', 'maintenance'].includes(section)) {
    throw new Error('Invalid section');
  }

  try {
    // Usa updateUserPreferences con partial update
    const preferences = {
      [section]: sectionPreferences,
    };

    return await updateUserPreferences(userId, preferences);

  } catch (error) {
    console.error(`Error updating ${section} preferences:`, error);
    throw error;
  }
}

/**
 * Check if error notification should be sent based on user preferences
 * @param {string} userId - User ID
 * @param {string} severity - 'info'|'warning'|'error'|'critical'
 * @returns {Promise<boolean>}
 */
export async function shouldSendErrorNotification(userId, severity) {
  if (!userId) return false;

  try {
    const prefs = await getUserPreferences(userId);

    // Check se errori sono abilitati globalmente
    if (!prefs.errors?.enabled) {
      return false;
    }

    // Check severità specifica
    const severityKey = severity.toLowerCase();
    return prefs.errors?.severityLevels?.[severityKey] ?? true;

  } catch (error) {
    console.error('Error checking error notification preference:', error);
    return true; // In caso di errore, invia comunque (fail-safe)
  }
}

/**
 * Check if scheduler notification should be sent based on user preferences
 * @param {string} userId - User ID
 * @param {string} action - 'ignition'|'shutdown'
 * @returns {Promise<boolean>}
 */
export async function shouldSendSchedulerNotification(userId, action) {
  if (!userId) return false;

  try {
    const prefs = await getUserPreferences(userId);

    // Check se scheduler notifiche sono abilitate globalmente
    if (!prefs.scheduler?.enabled) {
      return false;
    }

    // Check azione specifica
    const actionKey = action.toLowerCase();
    return prefs.scheduler?.[actionKey] ?? true;

  } catch (error) {
    console.error('Error checking scheduler notification preference:', error);
    return true; // Fail-safe
  }
}

/**
 * Check if maintenance notification should be sent based on user preferences
 * @param {string} userId - User ID
 * @param {number} thresholdLevel - 80|90|100
 * @returns {Promise<boolean>}
 */
export async function shouldSendMaintenanceNotification(userId, thresholdLevel) {
  if (!userId) return false;

  try {
    const prefs = await getUserPreferences(userId);

    // Check se manutenzione notifiche sono abilitate globalmente
    if (!prefs.maintenance?.enabled) {
      return false;
    }

    // Check threshold specifico
    const thresholdKey = `threshold${thresholdLevel}`;
    return prefs.maintenance?.[thresholdKey] ?? true;

  } catch (error) {
    console.error('Error checking maintenance notification preference:', error);
    return true; // Fail-safe
  }
}

/**
 * Reset preferences to defaults via API
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export async function resetPreferences(userId) {
  if (!userId) {
    throw new Error('User ID required');
  }

  try {
    // Usa updateUserPreferences per resettare a defaults
    return await updateUserPreferences(userId, DEFAULT_PREFERENCES);

  } catch (error) {
    console.error('Error resetting preferences:', error);
    throw error;
  }
}

/**
 * Get notification stats (useful for debugging)
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function getPreferenceStats(userId) {
  if (!userId) {
    throw new Error('User ID required');
  }

  try {
    const prefs = await getUserPreferences(userId);

    // Conta quante notifiche sono abilitate
    const errorsEnabled = prefs.errors?.enabled ?
      Object.values(prefs.errors.severityLevels).filter(Boolean).length : 0;

    const schedulerEnabled = prefs.scheduler?.enabled ?
      [prefs.scheduler.ignition, prefs.scheduler.shutdown].filter(Boolean).length : 0;

    const maintenanceEnabled = prefs.maintenance?.enabled ?
      [prefs.maintenance.threshold80, prefs.maintenance.threshold90, prefs.maintenance.threshold100]
        .filter(Boolean).length : 0;

    return {
      totalEnabled: errorsEnabled + schedulerEnabled + maintenanceEnabled,
      errors: {
        enabled: prefs.errors?.enabled ?? true,
        count: errorsEnabled,
      },
      scheduler: {
        enabled: prefs.scheduler?.enabled ?? true,
        count: schedulerEnabled,
      },
      maintenance: {
        enabled: prefs.maintenance?.enabled ?? true,
        count: maintenanceEnabled,
      },
    };

  } catch (error) {
    console.error('Error getting preference stats:', error);
    return null;
  }
}
