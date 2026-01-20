import { withAuthAndErrorHandler, success, notFound, requireNetatmoToken } from '@/lib/core';

export const dynamic = 'force-dynamic';

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

  const deviceData = await deviceRes.json();
  if (!deviceData.body?.devices?.length) {
    return notFound('Nessun dispositivo trovato');
  }

  const results = [];
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
