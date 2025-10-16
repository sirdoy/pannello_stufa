// ✅ File: app/api/netatmo/devices/route.js

import NETATMO_API from '@/lib/netatmoApi';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';

/**
 * GET /api/netatmo/devices
 * Retrieves list of all Netatmo devices
 * Note: Changed from POST to GET for consistency
 */
export async function GET() {
  try {
    // ✅ Get valid access token using centralized helper (auto-refresh)
    const { accessToken, error, message } = await getValidAccessToken();
    if (error) {
      const { status, reconnect } = handleTokenError(error);
      return Response.json({ error: message, reconnect }, { status });
    }

    // Get device list from Netatmo API
    const devices = await NETATMO_API.getDeviceList(accessToken);

    return Response.json({ devices });
  } catch (err) {
    console.error('Error in /api/netatmo/devices:', err);
    return Response.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}
