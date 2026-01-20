
import { adminDbGet, adminDbPush } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { auth0 } from '@/lib/auth0';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';

// Force dynamic rendering for Firebase operations
export const dynamic = 'force-dynamic';

/**
 * POST /api/netatmo/setthermmode
 * Sets heating mode for entire home
 * Body: { mode, endtime? }
 * Mode: schedule, away, hg (frost guard), off
 * ✅ Protected by Auth0 authentication
 */
export async function POST(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return Response.json({ error: 'Non autenticato' }, { status: 401 });
    }
    const user = session.user;

    const body = await request.json();
    const { mode, endtime } = body;

    if (!mode) {
      return Response.json({ error: 'mode è obbligatorio' }, { status: 400 });
    }

    // Validate mode
    const validModes = ['schedule', 'away', 'hg', 'off'];
    if (!validModes.includes(mode)) {
      return Response.json({
        error: `mode deve essere uno di: ${validModes.join(', ')}`
      }, { status: 400 });
    }

    // ✅ Get valid access token using centralized helper (auto-refresh)
    const { accessToken, error, message } = await getValidAccessToken();
    if (error) {
      const { status, reconnect } = handleTokenError(error);
      return Response.json({ error: message, reconnect }, { status });
    }

    // Get home_id from Firebase (use environment-aware path)
    const homeIdPath = getEnvironmentPath('netatmo/home_id');
    const homeId = await adminDbGet(homeIdPath);
    if (!homeId) {
      return Response.json({
        error: 'home_id non trovato. Chiama prima /api/netatmo/homesdata'
      }, { status: 400 });
    }

    // Build request params
    const params = {
      home_id: homeId,
      mode,
    };

    if (endtime && (mode === 'away' || mode === 'hg')) {
      params.endtime = endtime;
    }

    // Set thermostat mode
    const success = await NETATMO_API.setThermMode(accessToken, params);

    if (!success) {
      return Response.json({ error: 'Comando non riuscito' }, { status: 500 });
    }

    // Log action using Admin SDK
    const logEntry = {
      action: 'Cambio modalità termostato',
      device: DEVICE_TYPES.THERMOSTAT,
      value: mode,
      mode,
      endtime: endtime || null,
      timestamp: Date.now(),
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture,
        sub: user.sub,
      },
      source: 'manual',
    };

    await adminDbPush('log', logEntry);

    return Response.json({ success: true });
  } catch (err) {
    console.error('Error in /api/netatmo/setthermmode:', err);
    return Response.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}
