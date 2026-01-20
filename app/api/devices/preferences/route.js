/**
 * Device Preferences API
 * GET: Fetch user device preferences
 * POST: Update user device preferences
 */

import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  parseJsonOrThrow,
  validateRequired,
} from '@/lib/core';
import {
  getDevicePreferences,
  updateDevicePreferences,
} from '@/lib/devicePreferencesService';
import { DEVICE_CONFIG } from '@/lib/devices/deviceTypes';

export const dynamic = 'force-dynamic';

/**
 * GET /api/devices/preferences
 * Fetch device preferences for current user
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;

  const preferences = await getDevicePreferences(userId);

  // Also return device config for UI rendering
  const devices = Object.values(DEVICE_CONFIG).map(device => ({
    id: device.id,
    name: device.name,
    icon: device.icon,
    color: device.color,
    enabled: preferences[device.id] === true,
    description: getDeviceDescription(device.id),
  }));

  return success({
    preferences,
    devices,
  });
}, 'Devices/GetPreferences');

/**
 * POST /api/devices/preferences
 * Update device preferences for current user
 * Body: { preferences: { deviceId: boolean, ... } }
 */
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;
  const body = await parseJsonOrThrow(request);
  const { preferences } = body;

  // Validate preferences object
  validateRequired(preferences, 'preferences');
  if (typeof preferences !== 'object') {
    return badRequest('Preferenze non valide');
  }

  // Validate that all keys are valid device IDs
  const validDeviceIds = Object.keys(DEVICE_CONFIG);
  const invalidKeys = Object.keys(preferences).filter(
    key => !validDeviceIds.includes(key)
  );

  if (invalidKeys.length > 0) {
    return badRequest(`Device ID non validi: ${invalidKeys.join(', ')}`);
  }

  // Validate that all values are booleans
  const invalidValues = Object.entries(preferences).filter(
    ([, value]) => typeof value !== 'boolean'
  );

  if (invalidValues.length > 0) {
    return badRequest('Tutti i valori devono essere booleani');
  }

  await updateDevicePreferences(userId, preferences);

  return success({
    message: 'Preferenze aggiornate con successo',
  });
}, 'Devices/UpdatePreferences');

/**
 * Get device description for UI
 */
function getDeviceDescription(deviceId) {
  const descriptions = {
    stove: 'Stufa a pellet Thermorossi - controllo accensione, spegnimento, potenza e ventilazione',
    thermostat: 'Termostato Netatmo Energy - gestione multi-room temperatura e programmazione',
    lights: 'Luci Philips Hue - controllo luci smart, scene e automazioni',
    sonos: 'Sistema audio Sonos - controllo musica multi-room e integrazione Spotify',
  };

  return descriptions[deviceId] || 'Dispositivo smart home';
}
