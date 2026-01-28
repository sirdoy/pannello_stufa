/**
 * Notification Triggers Service
 *
 * Sistema centralizzato per definire e triggerare notifiche.
 * Questo servizio fornisce:
 * - Definizione delle categorie di notifica
 * - API semplice per triggerare notifiche da qualsiasi parte dell'app
 * - Verifica automatica delle preferenze utente prima dell'invio
 *
 * Usage (client-side):
 *   import { triggerNotification } from '@/lib/notificationTriggers';
 *   await triggerNotification('stove_error', { errorCode: 'E01', severity: 'critical' });
 *
 * Usage (server-side - in API routes):
 *   import { triggerNotificationServer } from '@/lib/notificationTriggersServer';
 *   await triggerNotificationServer(userId, 'stove_error', { errorCode: 'E01' });
 */

/**
 * Notification Categories and Types
 *
 * Struttura gerarchica delle notifiche:
 * - category: Gruppo principale (es. 'errors', 'scheduler')
 * - type: Tipo specifico dentro la categoria (es. 'critical', 'ignition')
 *
 * Ogni tipo ha:
 * - id: Identificatore unico
 * - category: Categoria di appartenenza
 * - preferenceKey: Chiave per controllare preferenze (path in Firebase)
 * - defaultEnabled: Se abilitato di default
 * - title: Funzione che genera titolo notifica
 * - body: Funzione che genera corpo notifica
 * - icon: Icona della notifica
 * - priority: 'high' | 'normal'
 * - url: URL a cui navigare quando si clicca la notifica
 */
export const NOTIFICATION_TYPES = {
  // === STOVE STATUS ===
  stove_status_work: {
    id: 'stove_status_work',
    category: 'stove',
    preferenceKey: 'stove.statusWork',
    defaultEnabled: true,
    title: () => 'Stufa in Funzione',
    body: (data) => data.message || 'La stufa e ora in funzione (stato WORK)',
    icon: '/icons/icon-192.png',
    priority: 'normal',
    url: '/',
  },
  stove_unexpected_off: {
    id: 'stove_unexpected_off',
    category: 'stove',
    preferenceKey: 'stove.unexpectedOff',
    defaultEnabled: true,
    title: () => 'Spegnimento Imprevisto',
    body: (data) => data.message || 'La stufa si e spenta mentre lo scheduler era attivo in automatico',
    icon: '/icons/icon-192.png',
    priority: 'high',
    url: '/stove/scheduler',
  },

  // === ERRORS ===
  stove_error_info: {
    id: 'stove_error_info',
    category: 'errors',
    preferenceKey: 'errors.severityLevels.info',
    defaultEnabled: false,
    title: () => 'Informazione Stufa',
    body: (data) => data.message || `Codice: ${data.errorCode}`,
    icon: '/icons/icon-192.png',
    priority: 'normal',
    url: '/stove/errors',
  },
  stove_error_warning: {
    id: 'stove_error_warning',
    category: 'errors',
    preferenceKey: 'errors.severityLevels.warning',
    defaultEnabled: true,
    title: () => 'Avviso Stufa',
    body: (data) => data.message || `Codice: ${data.errorCode}`,
    icon: '/icons/icon-192.png',
    priority: 'normal',
    url: '/stove/errors',
  },
  stove_error_error: {
    id: 'stove_error_error',
    category: 'errors',
    preferenceKey: 'errors.severityLevels.error',
    defaultEnabled: true,
    title: () => 'Errore Stufa',
    body: (data) => data.message || `Errore ${data.errorCode}: ${data.description || 'Richiesto intervento'}`,
    icon: '/icons/icon-192.png',
    priority: 'high',
    url: '/stove/errors',
  },
  stove_error_critical: {
    id: 'stove_error_critical',
    category: 'errors',
    preferenceKey: 'errors.severityLevels.critical',
    defaultEnabled: true,
    title: () => 'ERRORE CRITICO Stufa',
    body: (data) => data.message || `Errore critico ${data.errorCode}: Intervento immediato richiesto!`,
    icon: '/icons/icon-192.png',
    priority: 'high',
    url: '/stove/errors',
  },

  // === SCHEDULER ===
  scheduler_ignition: {
    id: 'scheduler_ignition',
    category: 'scheduler',
    preferenceKey: 'scheduler.ignition',
    defaultEnabled: true,
    title: () => 'Accensione Automatica',
    body: (data) => data.message || 'La stufa e stata accesa automaticamente dallo scheduler',
    icon: '/icons/icon-192.png',
    priority: 'normal',
    url: '/stove/scheduler',
  },
  scheduler_shutdown: {
    id: 'scheduler_shutdown',
    category: 'scheduler',
    preferenceKey: 'scheduler.shutdown',
    defaultEnabled: true,
    title: () => 'Spegnimento Automatico',
    body: (data) => data.message || 'La stufa e stata spenta automaticamente dallo scheduler',
    icon: '/icons/icon-192.png',
    priority: 'normal',
    url: '/stove/scheduler',
  },

  // === MAINTENANCE ===
  maintenance_80: {
    id: 'maintenance_80',
    category: 'maintenance',
    preferenceKey: 'maintenance.threshold80',
    defaultEnabled: true,
    title: () => 'Promemoria Manutenzione',
    body: (data) => data.message || `Raggiunto 80% ore utilizzo. ${data.remainingHours?.toFixed(1) || '?'}h rimanenti.`,
    icon: '/icons/icon-192.png',
    priority: 'normal',
    url: '/stove/maintenance',
  },
  maintenance_90: {
    id: 'maintenance_90',
    category: 'maintenance',
    preferenceKey: 'maintenance.threshold90',
    defaultEnabled: true,
    title: () => 'Attenzione Manutenzione',
    body: (data) => data.message || `Raggiunto 90% ore utilizzo. ${data.remainingHours?.toFixed(1) || '?'}h rimanenti. Pianifica la pulizia.`,
    icon: '/icons/icon-192.png',
    priority: 'normal',
    url: '/stove/maintenance',
  },
  maintenance_100: {
    id: 'maintenance_100',
    category: 'maintenance',
    preferenceKey: 'maintenance.threshold100',
    defaultEnabled: true,
    title: () => 'MANUTENZIONE RICHIESTA',
    body: (data) => data.message || 'Manutenzione obbligatoria! Accensione bloccata fino a pulizia.',
    icon: '/icons/icon-192.png',
    priority: 'high',
    url: '/stove/maintenance',
  },

  // === NETATMO (placeholder per future implementazioni) ===
  netatmo_temperature_low: {
    id: 'netatmo_temperature_low',
    category: 'netatmo',
    preferenceKey: 'netatmo.temperatureLow',
    defaultEnabled: false,
    title: () => 'Temperatura Bassa',
    body: (data) => data.message || `Temperatura scesa a ${data.temperature}°C in ${data.room || 'casa'}`,
    icon: '/icons/icon-192.png',
    priority: 'normal',
    url: '/thermostat',
  },
  netatmo_temperature_high: {
    id: 'netatmo_temperature_high',
    category: 'netatmo',
    preferenceKey: 'netatmo.temperatureHigh',
    defaultEnabled: false,
    title: () => 'Temperatura Alta',
    body: (data) => data.message || `Temperatura salita a ${data.temperature}°C in ${data.room || 'casa'}`,
    icon: '/icons/icon-192.png',
    priority: 'normal',
    url: '/thermostat',
  },
  netatmo_setpoint_reached: {
    id: 'netatmo_setpoint_reached',
    category: 'netatmo',
    preferenceKey: 'netatmo.setpointReached',
    defaultEnabled: false,
    title: () => 'Temperatura Raggiunta',
    body: (data) => data.message || `Temperatura target di ${data.setpoint}°C raggiunta`,
    icon: '/icons/icon-192.png',
    priority: 'normal',
    url: '/thermostat',
  },
  netatmo_connection_lost: {
    id: 'netatmo_connection_lost',
    category: 'netatmo',
    preferenceKey: 'netatmo.connectionLost',
    defaultEnabled: true,
    title: () => 'Connessione Netatmo Persa',
    body: (data) => data.message || 'Il termostato Netatmo non risponde. Verifica la connessione.',
    icon: '/icons/icon-192.png',
    priority: 'high',
    url: '/thermostat',
  },

  // === HUE (placeholder per future implementazioni) ===
  hue_scene_activated: {
    id: 'hue_scene_activated',
    category: 'hue',
    preferenceKey: 'hue.sceneActivated',
    defaultEnabled: false,
    title: () => 'Scena Attivata',
    body: (data) => data.message || `Scena "${data.sceneName}" attivata`,
    icon: '/icons/icon-192.png',
    priority: 'normal',
    url: '/hue',
  },
  hue_connection_lost: {
    id: 'hue_connection_lost',
    category: 'hue',
    preferenceKey: 'hue.connectionLost',
    defaultEnabled: true,
    title: () => 'Connessione Hue Persa',
    body: (data) => data.message || 'Il bridge Philips Hue non risponde. Verifica la connessione.',
    icon: '/icons/icon-192.png',
    priority: 'high',
    url: '/hue',
  },

  // === SYSTEM ===
  system_update: {
    id: 'system_update',
    category: 'system',
    preferenceKey: 'system.updates',
    defaultEnabled: true,
    title: () => 'Aggiornamento Disponibile',
    body: (data) => data.message || `Nuova versione ${data.version} disponibile`,
    icon: '/icons/icon-192.png',
    priority: 'normal',
    url: '/',
  },
  system_offline_commands_synced: {
    id: 'system_offline_commands_synced',
    category: 'system',
    preferenceKey: 'system.offlineSync',
    defaultEnabled: true,
    title: () => 'Comandi Sincronizzati',
    body: (data) => data.message || `${data.count || 1} comandi eseguiti dopo riconnessione`,
    icon: '/icons/icon-192.png',
    priority: 'normal',
    url: '/',
  },

  // === MONITORING ===
  monitoring_connection_lost: {
    id: 'monitoring_connection_lost',
    category: 'monitoring',
    preferenceKey: 'monitoring.connectionLost',
    defaultEnabled: true,
    title: () => 'Stufa Disconnessa',
    body: (data) => data.message || 'La stufa non risponde. Verifica la connessione.',
    icon: '/icons/icon-192.png',
    priority: 'high',
    url: '/monitoring',
  },
  monitoring_state_mismatch: {
    id: 'monitoring_state_mismatch',
    category: 'monitoring',
    preferenceKey: 'monitoring.stateMismatch',
    defaultEnabled: true,
    title: () => 'Anomalia Rilevata',
    body: (data) => data.message || `Stufa dovrebbe essere ${data.expected} ma e ${data.actual}`,
    icon: '/icons/icon-192.png',
    priority: 'high',
    url: '/monitoring',
  },
  monitoring_stove_error: {
    id: 'monitoring_stove_error',
    category: 'monitoring',
    preferenceKey: 'monitoring.stoveError',
    defaultEnabled: true,
    title: () => 'Errore Stufa Rilevato',
    body: (data) => data.message || `Errore AL${data.errorCode}: ${data.errorDescription || 'Richiesto intervento'}`,
    icon: '/icons/icon-192.png',
    priority: 'high',
    url: '/monitoring',
  },

  // === GENERIC ===
  generic: {
    id: 'generic',
    category: 'generic',
    preferenceKey: null, // Always sent (no preference check)
    defaultEnabled: true,
    title: (data) => data.title || 'Pannello Stufa',
    body: (data) => data.body || data.message || 'Notifica',
    icon: '/icons/icon-192.png',
    priority: 'normal',
    url: '/',
  },
};

/**
 * Notification Categories Configuration
 *
 * Definisce le categorie disponibili per le preferenze
 */
export const NOTIFICATION_CATEGORIES = {
  stove: {
    id: 'stove',
    label: 'Stato Stufa',
    description: 'Notifiche sullo stato operativo della stufa',
    icon: '🔥',
    masterToggle: true,
  },
  errors: {
    id: 'errors',
    label: 'Errori Stufa',
    description: 'Notifiche quando si verificano errori o allarmi',
    icon: '🚨',
    masterToggle: true, // Ha un toggle master che abilita/disabilita tutti
  },
  scheduler: {
    id: 'scheduler',
    label: 'Scheduler Automatico',
    description: 'Notifiche per azioni eseguite automaticamente',
    icon: '⏰',
    masterToggle: true,
  },
  maintenance: {
    id: 'maintenance',
    label: 'Manutenzione',
    description: 'Promemoria per manutenzione periodica',
    icon: '🔧',
    masterToggle: true,
  },
  netatmo: {
    id: 'netatmo',
    label: 'Termostato Netatmo',
    description: 'Notifiche dal termostato smart',
    icon: '🌡️',
    masterToggle: true,
  },
  hue: {
    id: 'hue',
    label: 'Philips Hue',
    description: 'Notifiche dal sistema luci',
    icon: '💡',
    masterToggle: true,
  },
  system: {
    id: 'system',
    label: 'Sistema',
    description: 'Notifiche di sistema e aggiornamenti',
    icon: '⚙️',
    masterToggle: true,
  },
  monitoring: {
    id: 'monitoring',
    label: 'Health Monitoring',
    description: 'Notifiche dal sistema di monitoraggio automatico',
    icon: '📊',
    masterToggle: true,
  },
};

/**
 * Get notification type by ID
 * @param {string} typeId - Type ID
 * @returns {Object|null}
 */
export function getNotificationType(typeId) {
  return NOTIFICATION_TYPES[typeId] || null;
}

/**
 * Get all notification types for a category
 * @param {string} categoryId - Category ID
 * @returns {Object[]}
 */
export function getNotificationTypesByCategory(categoryId) {
  return Object.values(NOTIFICATION_TYPES).filter(t => t.category === categoryId);
}

/**
 * Build notification payload from type and data
 * @param {string} typeId - Notification type ID
 * @param {Object} data - Dynamic data for the notification
 * @returns {Object} Notification payload
 */
export function buildNotificationPayload(typeId, data = {}) {
  const type = NOTIFICATION_TYPES[typeId];

  if (!type) {
    console.warn(`Unknown notification type: ${typeId}`);
    return null;
  }

  const title = typeof type.title === 'function' ? type.title(data) : type.title;
  const body = typeof type.body === 'function' ? type.body(data) : type.body;

  return {
    notification: {
      title,
      body,
      icon: type.icon || '/icons/icon-192.png',
    },
    data: {
      type: typeId,
      category: type.category,
      url: data.url || type.url || '/',
      priority: type.priority || 'normal',
      timestamp: new Date().toISOString(),
      ...data,
    },
  };
}

/**
 * Trigger notification (client-side)
 *
 * Invia una notifica all'utente corrente tramite API.
 * Le preferenze vengono verificate server-side.
 *
 * @param {string} typeId - Notification type ID (from NOTIFICATION_TYPES)
 * @param {Object} data - Dynamic data for the notification
 * @returns {Promise<Object>} Result with success/error
 */
export async function triggerNotification(typeId, data = {}) {
  try {
    const response = await fetch('/api/notifications/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        typeId,
        data,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to trigger notification');
    }

    return result;

  } catch (error) {
    console.error('Error triggering notification:', error);
    throw error;
  }
}

/**
 * Helper: Trigger stove status work notification
 * @param {Object} data - { message }
 */
export async function triggerStoveStatusWork(data = {}) {
  return triggerNotification('stove_status_work', data);
}

/**
 * Helper: Trigger stove unexpected off notification
 * @param {Object} data - { message, schedulerName }
 */
export async function triggerStoveUnexpectedOff(data = {}) {
  return triggerNotification('stove_unexpected_off', data);
}

/**
 * Helper: Trigger stove error notification
 * @param {string} severity - 'info' | 'warning' | 'error' | 'critical'
 * @param {Object} data - { errorCode, description, message }
 */
export async function triggerStoveError(severity, data) {
  const typeId = `stove_error_${severity.toLowerCase()}`;
  return triggerNotification(typeId, data);
}

/**
 * Helper: Trigger scheduler notification
 * @param {string} action - 'ignition' | 'shutdown'
 * @param {Object} data - { message }
 */
export async function triggerSchedulerAction(action, data = {}) {
  const typeId = `scheduler_${action.toLowerCase()}`;
  return triggerNotification(typeId, data);
}

/**
 * Helper: Trigger maintenance notification
 * @param {number} threshold - 80 | 90 | 100
 * @param {Object} data - { remainingHours, message }
 */
export async function triggerMaintenanceAlert(threshold, data = {}) {
  const typeId = `maintenance_${threshold}`;
  return triggerNotification(typeId, data);
}

/**
 * Helper: Trigger Netatmo notification
 * @param {string} type - 'temperature_low' | 'temperature_high' | 'setpoint_reached' | 'connection_lost'
 * @param {Object} data - { temperature, room, setpoint, message }
 */
export async function triggerNetatmoAlert(type, data = {}) {
  const typeId = `netatmo_${type}`;
  return triggerNotification(typeId, data);
}

/**
 * Helper: Trigger generic notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} options - { url, priority }
 */
export async function triggerGenericNotification(title, body, options = {}) {
  return triggerNotification('generic', {
    title,
    body,
    ...options,
  });
}
