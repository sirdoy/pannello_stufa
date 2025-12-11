
import { adminDbGet } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { auth0 } from '@/lib/auth0';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';

// Force dynamic rendering for Firebase operations
export const dynamic = 'force-dynamic';

/**
 * POST /api/netatmo/setroomthermpoint
 * Sets temperature setpoint for a specific room
 * Body: { room_id, mode, temp?, endtime? }
 * Mode: manual, home, max, off
 * ✅ Protected by Auth0 authentication
 */
export const POST = auth0.withApiAuthRequired(async function handler(request) {
  try {
    const session = await auth0.getSession(request);
    const user = session?.user;

    if (!user) {
      return Response.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await request.json();
    const { room_id, mode, temp, endtime } = body;

    if (!room_id || !mode) {
      return Response.json({
        error: 'room_id e mode sono obbligatori'
      }, { status: 400 });
    }

    // Validate mode
    const validModes = ['manual', 'home', 'max', 'off'];
    if (!validModes.includes(mode)) {
      return Response.json({
        error: `mode deve essere uno di: ${validModes.join(', ')}`
      }, { status: 400 });
    }

    // Validate temp for manual mode
    if (mode === 'manual' && (temp === undefined || temp === null)) {
      return Response.json({
        error: 'temp è obbligatorio per mode=manual'
      }, { status: 400 });
    }

    // ✅ Get valid access token using centralized helper (auto-refresh)
    const { accessToken, error, message } = await getValidAccessToken();
    if (error) {
      const { status, reconnect } = handleTokenError(error);
      return Response.json({ error: message, reconnect }, { status });
    }

    // Get home_id from Firebase
    const homeIdSnap = await adminDbGet('netatmo/home_id');
    if (!homeIdSnap.exists()) {
      return Response.json({
        error: 'home_id non trovato. Chiama prima /api/netatmo/homesdata'
      }, { status: 400 });
    }
    const homeId = homeIdSnap.val();

    // Build request params
    const params = {
      home_id: homeId,
      room_id,
      mode,
    };

    if (mode === 'manual') {
      params.temp = temp;
      if (endtime) {
        params.endtime = endtime;
      }
    }

    // Set room thermpoint
    const success = await NETATMO_API.setRoomThermpoint(accessToken, params);

    if (!success) {
      return Response.json({ error: 'Comando non riuscito' }, { status: 500 });
    }

    // Log action
    const logEntry = {
      action: 'netatmo_set_room_temp',
      room_id,
      mode,
      temp: temp || null,
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
    console.error('Error in /api/netatmo/setroomthermpoint:', err);
    return Response.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
});
