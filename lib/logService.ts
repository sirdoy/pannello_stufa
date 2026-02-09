/**
 * Log Service - Centralized logging for user actions
 * Tracks all manual user actions with Auth0 user information
 */

import { LOG_ROUTES } from './routes';
import { DEVICE_TYPES } from './devices/deviceTypes';

/**
 * Log a user action
 * @param action - Description of the action (e.g., 'Accensione', 'Set ventola')
 * @param device - Device type (from DEVICE_TYPES: 'stove', 'thermostat', 'lights', 'sonos')
 * @param value - Optional value associated with the action (e.g., fan level, power level)
 * @param metadata - Optional additional metadata
 */
export async function logUserAction(
  action: string,
  device: string,
  value: string | number | null = null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const logData: Record<string, unknown> = {
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
  ignite: (): Promise<void> => logUserAction('Accensione stufa', DEVICE_TYPES.STOVE),
  shutdown: (): Promise<void> => logUserAction('Spegnimento stufa', DEVICE_TYPES.STOVE),
  setFan: (level: number): Promise<void> => logUserAction('Modifica ventilazione', DEVICE_TYPES.STOVE, level),
  setPower: (level: number): Promise<void> => logUserAction('Modifica potenza', DEVICE_TYPES.STOVE, level),
};

/**
 * Log scheduler actions (stove scheduler)
 */
export const logSchedulerAction = {
  toggleMode: (enabled: boolean): Promise<void> => logUserAction(
    enabled ? 'Attivazione modalità automatica' : 'Attivazione modalità manuale',
    DEVICE_TYPES.STOVE
  ),
  updateSchedule: (day: string): Promise<void> => logUserAction('Modifica scheduler', DEVICE_TYPES.STOVE, null, { day }),
  addInterval: (day: string): Promise<void> => logUserAction('Aggiunto intervallo scheduler', DEVICE_TYPES.STOVE, null, { day }),
  removeInterval: (day: string, index: number): Promise<void> => logUserAction('Rimosso intervallo scheduler', DEVICE_TYPES.STOVE, null, { day, intervalIndex: index }),
  clearSemiManual: (): Promise<void> => logUserAction('Disattivazione modalità semi-manuale', DEVICE_TYPES.STOVE),
  duplicateDay: (sourceDay: string, targetDay: string): Promise<void> => logUserAction('Duplicato giorno scheduler', DEVICE_TYPES.STOVE, null, { sourceDay, targetDay }),
};

/**
 * Log Netatmo/Thermostat actions
 */
export const logNetatmoAction = {
  connect: (): Promise<void> => logUserAction('Connessione Netatmo', DEVICE_TYPES.THERMOSTAT),
  disconnect: (): Promise<void> => logUserAction('Disconnessione Netatmo', DEVICE_TYPES.THERMOSTAT),
  setRoomTemperature: (roomName: string, temperature: number): Promise<void> => logUserAction(
    'Modifica temperatura stanza',
    DEVICE_TYPES.THERMOSTAT,
    temperature,
    { roomName }
  ),
  setMode: (mode: string): Promise<void> => logUserAction('Cambio modalità termostato', DEVICE_TYPES.THERMOSTAT, mode),
};

/**
 * Log Philips Hue/Lights actions
 */
const logHueAction = {
  connect: (): Promise<void> => logUserAction('Connessione Hue', DEVICE_TYPES.LIGHTS),
  disconnect: (): Promise<void> => logUserAction('Disconnessione Hue', DEVICE_TYPES.LIGHTS),
  lightOn: (lightName: string): Promise<void> => logUserAction('Luce accesa', DEVICE_TYPES.LIGHTS, 'ON', { lightName }),
  lightOff: (lightName: string): Promise<void> => logUserAction('Luce spenta', DEVICE_TYPES.LIGHTS, 'OFF', { lightName }),
  setBrightness: (lightName: string, brightness: number): Promise<void> => logUserAction(
    'Luminosità modificata',
    DEVICE_TYPES.LIGHTS,
    `${brightness}%`,
    { lightName }
  ),
  roomOn: (roomName: string): Promise<void> => logUserAction('Stanza accesa', DEVICE_TYPES.LIGHTS, 'ON', { roomName }),
  roomOff: (roomName: string): Promise<void> => logUserAction('Stanza spenta', DEVICE_TYPES.LIGHTS, 'OFF', { roomName }),
  activateScene: (sceneName: string): Promise<void> => logUserAction('Scena attivata', DEVICE_TYPES.LIGHTS, sceneName),
};

const logService = {
  logUserAction,
  stove: logStoveAction,
  scheduler: logSchedulerAction,
  netatmo: logNetatmoAction,
  hue: logHueAction,
};

export default logService;
