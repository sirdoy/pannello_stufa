import { db } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';
import NETATMO_API from '@/lib/netatmoApi';

/**
 * GET /api/netatmo/homesdata
 * Retrieves complete Netatmo topology (homes, rooms, modules)
 * Saves home_id to Firebase for future use
 */
export async function GET() {
  try {
    // Get refresh token from Firebase
    const tokenSnap = await get(ref(db, 'netatmo/refresh_token'));
    if (!tokenSnap.exists()) {
      return Response.json({ error: 'Nessun refresh token trovato' }, { status: 401 });
    }
    const refreshToken = tokenSnap.val();

    // Get access token
    const accessToken = await NETATMO_API.getAccessToken(refreshToken);

    // Get homes data
    const homesData = await NETATMO_API.getHomesData(accessToken);

    if (!homesData || homesData.length === 0) {
      return Response.json({ error: 'Nessuna casa trovata' }, { status: 404 });
    }

    const home = homesData[0]; // Usually single home

    // Save home_id to Firebase for future use
    await set(ref(db, 'netatmo/home_id'), home.id);

    // Parse and structure data
    const rooms = NETATMO_API.parseRooms(homesData);
    const modules = NETATMO_API.parseModules(homesData);

    // Save topology to Firebase
    await set(ref(db, 'netatmo/topology'), {
      home_id: home.id,
      home_name: home.name,
      rooms,
      modules,
      schedules: home.schedules || [],
      updated_at: Date.now(),
    });

    return Response.json({
      home_id: home.id,
      home_name: home.name,
      rooms,
      modules,
      schedules: home.schedules || [],
    });
  } catch (err) {
    console.error('Error in /api/netatmo/homesdata:', err);
    return Response.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}
