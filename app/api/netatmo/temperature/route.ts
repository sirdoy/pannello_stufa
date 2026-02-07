import { withAuthAndErrorHandler, success, badRequest, notFound, serverError, requireNetatmoToken } from '@/lib/core';
import { adminDbGet, adminDbUpdate } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

export const dynamic = 'force-dynamic';

interface DeviceConfig {
  device_id?: string;
  module_id?: string;
}

interface ThermStateRoom {
  measured?: {
    temperature?: number;
  };
}

interface ThermStateResponse {
  body?: Record<string, ThermStateRoom>;
}

/**
 * POST /api/netatmo/temperature
 * Gets temperature from configured device/module
 * Requires device_id and module_id in Firebase
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async () => {
  const accessToken = await requireNetatmoToken();

  // Get device config from Firebase
  const deviceConfigPath = getEnvironmentPath('netatmo/deviceConfig');
  const configData = await adminDbGet(deviceConfigPath) as DeviceConfig | null;
  if (!configData) {
    return badRequest('Configurazione dispositivo mancante');
  }

  const { device_id, module_id } = configData;
  if (!device_id || !module_id) {
    return badRequest('device_id o module_id mancanti');
  }

  // Call getthermstate
  const stateRes = await fetch('https://api.netatmo.com/api/getthermstate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ device_id, module_id }),
  });

  const stateJson = await stateRes.json() as ThermStateResponse;

  if (!stateJson.body || Object.keys(stateJson.body).length === 0) {
    console.error('Netatmo state error:', stateJson);
    return serverError('Errore getthermstate');
  }

  const firstRoom = Object.values(stateJson.body)[0];
  const temperature = firstRoom?.measured?.temperature;

  if (temperature === undefined) {
    return notFound('Temperatura non trovata');
  }

  // Save temperature to Firebase
  const temperaturePath = getEnvironmentPath('netatmo/temperature');
  await adminDbUpdate(temperaturePath, {
    value: temperature,
    timestamp: Date.now(),
  });

  return success({ temperature });
}, 'Netatmo/Temperature');
