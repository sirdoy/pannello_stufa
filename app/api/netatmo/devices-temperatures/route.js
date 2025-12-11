// ✅ File: app/api/netatmo/devices-temperatures/route.js

import { auth0 } from '@/lib/auth0';
import NETATMO_API from '@/lib/netatmoApi';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';

// Force dynamic rendering for Firebase operations
export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/devices-temperatures
 * Retrieves temperatures from all Netatmo devices/modules
 * ✅ Protected by Auth0 authentication
 */
export const GET = auth0.withApiAuthRequired(async function handler(request) {
  try {
    // ✅ Get valid access token using centralized helper (auto-refresh)
    const { accessToken, error, message } = await getValidAccessToken();
    if (error) {
      const { status, reconnect } = handleTokenError(error);
      return Response.json({ error: message, reconnect }, { status });
    }

    // 🌡️ Chiamata a /devicelist per recuperare moduli
    const deviceRes = await fetch('https://api.netatmo.com/api/devicelist', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const deviceData = await deviceRes.json();
    if (!deviceData.body?.devices?.length) {
      return Response.json({ error: 'Nessun dispositivo trovato' }, { status: 404 });
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

    return Response.json({ temperatures: results });
  } catch (err) {
    console.error('Errore generale Netatmo devices-temperatures:', err);
    return Response.json({ error: 'Errore server interno' }, { status: 500 });
  }
});
