import { withAuthAndErrorHandler, success, notFound, requireNetatmoToken } from '@/lib/core';

export const dynamic = 'force-dynamic';

interface DeviceModule {
  _id: string;
  module_name?: string;
  measured?: {
    temperature?: number;
  };
  [key: string]: unknown;
}

interface Device {
  _id: string;
  modules?: DeviceModule[];
  [key: string]: unknown;
}

interface DeviceListResponse {
  body?: {
    devices?: Device[];
  };
}

interface TemperatureResult {
  device_id: string;
  module_id: string;
  name: string;
  temperature: number;
}

/**
 * GET /api/netatmo/devices-temperatures
 * Retrieves temperatures from all Netatmo devices/modules
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const accessToken = await requireNetatmoToken();

  // Call /devicelist to get modules
  const deviceRes = await fetch('https://api.netatmo.com/api/devicelist', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const deviceData = await deviceRes.json() as DeviceListResponse;
  if (!deviceData.body?.devices?.length) {
    return notFound('Nessun dispositivo trovato');
  }

  const results: TemperatureResult[] = [];
  for (const device of deviceData.body.devices) {
    const device_id = device._id;
    for (const dev of device.modules || []) {
      const module_id = dev._id;
      const temperature = dev.measured?.temperature;
      const name = dev.module_name || module_id;

      if (temperature !== undefined) {
        results.push({ device_id, module_id, name, temperature });
      }
    }
  }

  return success({ temperatures: results });
}, 'Netatmo/DevicesTemperatures');
