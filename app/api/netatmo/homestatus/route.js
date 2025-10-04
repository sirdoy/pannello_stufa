import { db } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';
import NETATMO_API from '@/lib/netatmoApi';

/**
 * GET /api/netatmo/homestatus
 * Retrieves real-time status of all rooms and modules
 * Returns temperatures, setpoints, heating status
 */
export async function GET() {
  try {
    // Get refresh token from Firebase
    const tokenSnap = await get(ref(db, 'netatmo/refresh_token'));
    if (!tokenSnap.exists()) {
      return Response.json({ error: 'Nessun refresh token trovato' }, { status: 401 });
    }
    const refreshToken = tokenSnap.val();

    // Get home_id from Firebase
    const homeIdSnap = await get(ref(db, 'netatmo/home_id'));
    if (!homeIdSnap.exists()) {
      return Response.json({
        error: 'home_id non trovato. Chiama prima /api/netatmo/homesdata'
      }, { status: 400 });
    }
    const homeId = homeIdSnap.val();

    // Get access token
    const accessToken = await NETATMO_API.getAccessToken(refreshToken);

    // Get home status
    const homeStatus = await NETATMO_API.getHomeStatus(accessToken, homeId);

    // Extract temperature data
    const temperatures = NETATMO_API.extractTemperatures(homeStatus);

    // Get topology to enrich data with room names
    const topologySnap = await get(ref(db, 'netatmo/topology'));
    const topology = topologySnap.exists() ? topologySnap.val() : null;

    // Enrich with room names
    const enrichedRooms = temperatures.map(temp => {
      const room = topology?.rooms?.find(r => r.id === temp.room_id);
      return {
        ...temp,
        room_name: room?.name || 'Sconosciuta',
        room_type: room?.type || 'unknown',
      };
    });

    // Save current status to Firebase
    await set(ref(db, 'netatmo/currentStatus'), {
      rooms: enrichedRooms,
      mode: homeStatus.therm_mode,
      updated_at: Date.now(),
    });

    return Response.json({
      rooms: enrichedRooms,
      mode: homeStatus.therm_mode,
      updated_at: Date.now(),
    });
  } catch (err) {
    console.error('Error in /api/netatmo/homestatus:', err);
    return Response.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}
