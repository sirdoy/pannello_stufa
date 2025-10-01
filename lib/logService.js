/**
 * Log Service - Centralized logging for user actions
 * Tracks all manual user actions with Auth0 user information
 */

import { LOG_ROUTES } from './routes';

/**
 * Log a user action
 * @param {string} action - Description of the action (e.g., 'Accensione', 'Set ventola')
 * @param {*} value - Optional value associated with the action (e.g., fan level, power level)
 * @param {object} metadata - Optional additional metadata
 */
export async function logUserAction(action, value = null, metadata = {}) {
  try {
    const logData = {
      action,
      ...(value !== null && { value }),
      ...metadata,
    };

    const response = await fetch(LOG_ROUTES.add, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData),
    });

    if (!response.ok) {
      console.error('Failed to log action:', action);
    }
  } catch (error) {
    console.error('Error logging action:', error);
  }
}

/**
 * Log stove control actions
 */
export const logStoveAction = {
  ignite: () => logUserAction('Accensione stufa'),
  shutdown: () => logUserAction('Spegnimento stufa'),
  setFan: (level) => logUserAction('Modifica ventilazione', level),
  setPower: (level) => logUserAction('Modifica potenza', level),
};

/**
 * Log scheduler actions
 */
export const logSchedulerAction = {
  toggleMode: (enabled) => logUserAction(
    enabled ? 'Attivazione modalità automatica' : 'Attivazione modalità manuale'
  ),
  updateSchedule: (day) => logUserAction('Modifica scheduler', null, { day }),
  addInterval: (day) => logUserAction('Aggiunto intervallo scheduler', null, { day }),
  removeInterval: (day, index) => logUserAction('Rimosso intervallo scheduler', null, { day, intervalIndex: index }),
  clearSemiManual: () => logUserAction('Disattivazione modalità semi-manuale'),
};

/**
 * Log Netatmo actions
 */
export const logNetatmoAction = {
  connect: () => logUserAction('Connessione Netatmo'),
  disconnect: () => logUserAction('Disconnessione Netatmo'),
  selectDevice: (deviceId) => logUserAction('Selezione dispositivo Netatmo', null, { deviceId }),
};

const logService = {
  logUserAction,
  stove: logStoveAction,
  scheduler: logSchedulerAction,
  netatmo: logNetatmoAction,
};

export default logService;