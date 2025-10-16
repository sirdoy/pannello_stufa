import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import NETATMO_API from '@/lib/netatmoApi';
import { getSession } from '@auth0/nextjs-auth0';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';

/**
 * POST /api/netatmo/setthermmode
 * Sets heating mode for entire home
 * Body: { mode, endtime? }
 * Mode: schedule, away, hg (frost guard), off
 */
export async function POST(request) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user) {
      return Response.json({ error: 'Non autenticato' }, { status: 401 });
    }

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

    // Get home_id from Firebase
    const homeIdSnap = await get(ref(db, 'netatmo/home_id'));
    if (!homeIdSnap.exists()) {
      return Response.json({
        error: 'home_id non trovato. Chiama prima /api/netatmo/homesdata'
      }, { status: 400 });
    }
    const homeId = homeIdSnap.val();

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

    // Log action
    const logEntry = {
      action: 'netatmo_set_mode',
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

    const { push, ref: dbRef } = await import('firebase/database');
    await push(dbRef(db, 'log'), logEntry);

    return Response.json({ success: true });
  } catch (err) {
    console.error('Error in /api/netatmo/setthermmode:', err);
    return Response.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}
