/**
 * Log Service - Centralized logging for user actions
 * Tracks all manual user actions with Auth0 user information
 */

import { LOG_ROUTES } from './routes';
import { DEVICE_TYPES } from './devices/deviceTypes';

/**
 * Log a user action
 * @param {string} action - Description of the action (e.g., 'Accensione', 'Set ventola')
 * @param {string} device - Device type (from DEVICE_TYPES: 'stove', 'thermostat', 'lights', 'sonos')
 * @param {*} value - Optional value associated with the action (e.g., fan level, power level)
 * @param {object} metadata - Optional additional metadata
 */
export async function logUserAction(action, device, value = null, metadata = {}) {
  try {
    const logData = {
      action,
      device,
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
  ignite: () => logUserAction('Accensione stufa', DEVICE_TYPES.STOVE),
  shutdown: () => logUserAction('Spegnimento stufa', DEVICE_TYPES.STOVE),
  setFan: (level) => logUserAction('Modifica ventilazione', DEVICE_TYPES.STOVE, level),
  setPower: (level) => logUserAction('Modifica potenza', DEVICE_TYPES.STOVE, level),
};

/**
 * Log scheduler actions (stove scheduler)
 */
export const logSchedulerAction = {
  toggleMode: (enabled) => logUserAction(
    enabled ? 'Attivazione modalità automatica' : 'Attivazione modalità manuale',
    DEVICE_TYPES.STOVE
  ),
  updateSchedule: (day) => logUserAction('Modifica scheduler', DEVICE_TYPES.STOVE, null, { day }),
  addInterval: (day) => logUserAction('Aggiunto intervallo scheduler', DEVICE_TYPES.STOVE, null, { day }),
  removeInterval: (day, index) => logUserAction('Rimosso intervallo scheduler', DEVICE_TYPES.STOVE, null, { day, intervalIndex: index }),
  clearSemiManual: () => logUserAction('Disattivazione modalità semi-manuale', DEVICE_TYPES.STOVE),
  duplicateDay: (sourceDay, targetDay) => logUserAction('Duplicato giorno scheduler', DEVICE_TYPES.STOVE, null, { sourceDay, targetDay }),
};

/**
 * Log Netatmo/Thermostat actions
 */
export const logNetatmoAction = {
  connect: () => logUserAction('Connessione Netatmo', DEVICE_TYPES.THERMOSTAT),
  disconnect: () => logUserAction('Disconnessione Netatmo', DEVICE_TYPES.THERMOSTAT),
  setRoomTemperature: (roomName, temperature) => logUserAction(
    'Modifica temperatura stanza',
    DEVICE_TYPES.THERMOSTAT,
    temperature,
    { roomName }
  ),
  setMode: (mode) => logUserAction('Cambio modalità termostato', DEVICE_TYPES.THERMOSTAT, mode),
};

const logService = {
  logUserAction,
  stove: logStoveAction,
  scheduler: logSchedulerAction,
  netatmo: logNetatmoAction,
};

export default logService;