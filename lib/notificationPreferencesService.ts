/**
 * Notification Preferences Service
 *
 * Gestisce le preferenze notifiche per utente salvate su Firebase
 * Permette attivazione/disattivazione selettiva per tipo e severità
 *
 * Categorie supportate:
 * - errors: Errori stufa
 * - scheduler: Azioni automatiche
 * - maintenance: Promemoria manutenzione
 * - netatmo: Termostato Netatmo
 * - hue: Philips Hue
 * - system: Sistema
 */

import { db } from './firebase';
import { ref, get } from 'firebase/database';

/**
 * Notification Categories Configuration
 * Used by UI components to render preferences dynamically
 */
export const NOTIFICATION_CATEGORIES_CONFIG = {
  stove: {
    id: 'stove',
    label: 'Stato Stufa',
    description: 'Notifiche sullo stato operativo della stufa',
    icon: '🔥',
    fields: [
      { key: 'enabled', label: 'Abilita notifiche stato stufa', description: 'Ricevi notifiche sui cambi di stato della stufa', isMaster: true },
      { key: 'statusWork', label: 'Stufa in funzione', description: 'Notifica quando la stufa passa in stato WORK (funzionante)', icon: '🔥' },
      { key: 'unexpectedOff', label: 'Spegnimento imprevisto', description: 'Notifica quando la stufa si spegne mentre lo scheduler e attivo in automatico', icon: '⚠️' },
    ],
  },
  errors: {
    id: 'errors',
    label: 'Errori Stufa',
    description: 'Notifiche quando si verificano errori o allarmi',
    icon: '🚨',
    fields: [
      { key: 'enabled', label: 'Abilita notifiche errori', description: 'Ricevi notifiche per tutti gli errori della stufa', isMaster: true },
      { key: 'severityLevels.info', label: 'INFO', description: 'Notifiche informative (non critiche)', icon: 'i' },
      { key: 'severityLevels.warning', label: 'WARNING', description: 'Avvisi che richiedono attenzione', icon: '⚠️' },
      { key: 'severityLevels.error', label: 'ERROR', description: 'Errori che possono influire sul funzionamento', icon: '❌' },
      { key: 'severityLevels.critical', label: 'CRITICAL', description: 'Errori critici che richiedono intervento immediato', icon: '🚨' },
    ],
  },
  scheduler: {
    id: 'scheduler',
    label: 'Scheduler Automatico',
    description: 'Notifiche per azioni eseguite automaticamente dallo scheduler',
    icon: '⏰',
    fields: [
      { key: 'enabled', label: 'Abilita notifiche scheduler', description: 'Ricevi notifiche per azioni automatiche dello scheduler', isMaster: true },
      { key: 'ignition', label: 'Accensione automatica', description: 'Notifica quando la stufa viene accesa dallo scheduler', icon: '🔥' },
      { key: 'shutdown', label: 'Spegnimento automatico', description: 'Notifica quando la stufa viene spenta dallo scheduler', icon: '🌙' },
    ],
  },
  maintenance: {
    id: 'maintenance',
    label: 'Manutenzione',
    description: 'Promemoria per manutenzione periodica della stufa',
    icon: '🔧',
    fields: [
      { key: 'enabled', label: 'Abilita notifiche manutenzione', description: 'Ricevi promemoria quando si avvicina la pulizia', isMaster: true },
      { key: 'threshold80', label: 'Promemoria 80%', description: "Notifica quando raggiungi l'80% delle ore utilizzo", icon: 'i' },
      { key: 'threshold90', label: 'Attenzione 90%', description: 'Notifica quando raggiungi il 90% delle ore utilizzo', icon: '⚠️' },
      { key: 'threshold100', label: 'Urgente 100%', description: 'Notifica critica quando manutenzione richiesta (blocca accensione)', icon: '🚨' },
    ],
  },
  netatmo: {
    id: 'netatmo',
    label: 'Termostato Netatmo',
    description: 'Notifiche dal termostato smart Netatmo',
    icon: '🌡️',
    fields: [
      { key: 'enabled', label: 'Abilita notifiche Netatmo', description: 'Ricevi notifiche dal termostato Netatmo', isMaster: true },
      { key: 'temperatureLow', label: 'Temperatura bassa', description: 'Notifica quando la temperatura scende sotto la soglia', icon: '❄️' },
      { key: 'temperatureHigh', label: 'Temperatura alta', description: 'Notifica quando la temperatura supera la soglia', icon: '🔥' },
      { key: 'setpointReached', label: 'Temperatura raggiunta', description: 'Notifica quando la temperatura target viene raggiunta', icon: '✅' },
      { key: 'connectionLost', label: 'Connessione persa', description: 'Notifica quando il termostato non risponde', icon: '📡' },
    ],
  },
  hue: {
    id: 'hue',
    label: 'Philips Hue',
    description: 'Notifiche dal sistema luci Philips Hue',
    icon: '💡',
    fields: [
      { key: 'enabled', label: 'Abilita notifiche Hue', description: 'Ricevi notifiche dal sistema Philips Hue', isMaster: true },
      { key: 'sceneActivated', label: 'Scena attivata', description: 'Notifica quando una scena viene attivata', icon: '🎨' },
      { key: 'connectionLost', label: 'Connessione persa', description: 'Notifica quando il bridge Hue non risponde', icon: '📡' },
    ],
  },
  system: {
    id: 'system',
    label: 'Sistema',
    description: 'Notifiche di sistema e aggiornamenti',
    icon: '⚙️',
    fields: [
      { key: 'enabled', label: 'Abilita notifiche sistema', description: 'Ricevi notifiche di sistema', isMaster: true },
      { key: 'updates', label: 'Aggiornamenti', description: 'Notifica quando una nuova versione e disponibile', icon: '🆕' },
      { key: 'offlineSync', label: 'Sincronizzazione offline', description: 'Notifica quando i comandi offline vengono eseguiti', icon: '🔄' },
    ],
  },
};

/**
 * Default preferences (configurazione iniziale)
 *
 * Categorie:
 * - errors: Errori stufa (info, warning, error, critical)
 * - scheduler: Azioni automatiche scheduler
 * - maintenance: Promemoria manutenzione
 * - netatmo: Notifiche termostato Netatmo
 * - hue: Notifiche Philips Hue
 * - system: Notifiche di sistema
 */
export const DEFAULT_PREFERENCES = {
  stove: {
    enabled: true,
    statusWork: true,     // Notifica quando passa in stato WORK
    unexpectedOff: true,  // Notifica spegnimento imprevisto durante scheduler
  },
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
  netatmo: {
    enabled: false,       // Default disabilitato - utente deve attivare
    temperatureLow: false,
    temperatureHigh: false,
    setpointReached: false,
    connectionLost: true, // Connessione persa sempre abilitata
  },
  hue: {
    enabled: false,       // Default disabilitato
    sceneActivated: false,
    connectionLost: true, // Connessione persa sempre abilitata
  },
  system: {
    enabled: true,
    updates: true,        // Aggiornamenti disponibili
    offlineSync: true,    // Comandi offline sincronizzati
  },
};

/**
 * Get user notification preferences from Firebase via API
 * @param {string} userId - User ID (Auth0 sub)
 * @returns {Promise<Object>} User preferences
 */
async function getUserPreferences(userId: string) {
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
async function updateUserPreferences(userId: string, preferences: Record<string, unknown>) {
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
export async function updatePreferenceSection(userId: string, section: string, sectionPreferences: Record<string, unknown>) {
  if (!userId) {
    throw new Error('User ID required');
  }

  const validSections = ['stove', 'errors', 'scheduler', 'maintenance', 'netatmo', 'hue', 'system'];
  if (!validSections.includes(section)) {
    throw new Error(`Invalid section: ${section}. Valid: ${validSections.join(', ')}`);
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
export async function shouldSendErrorNotification(userId: string, severity: string) {
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

// Removed unused functions: shouldSendSchedulerNotification, shouldSendMaintenanceNotification,
// resetPreferences, getPreferenceStats - not used in codebase
