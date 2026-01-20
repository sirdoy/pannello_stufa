import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';
import { getEnvironmentPath } from '@/lib/environmentHelper';

// Force dynamic rendering for Firebase operations
export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/homesdata
 * Retrieves complete Netatmo topology (homes, rooms, modules)
 * Saves home_id to Firebase for future use
 * ✅ Protected by Auth0 authentication
 */
export async function GET(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    // ✅ Get valid access token using centralized helper (auto-refresh)
    const { accessToken, error, message } = await getValidAccessToken();
    if (error) {
      const { status, reconnect } = handleTokenError(error);
      return Response.json({ error: message, reconnect }, { status });
    }

    // Get homes data
    const homesData = await NETATMO_API.getHomesData(accessToken);

    if (!homesData || homesData.length === 0) {
      return Response.json({ error: 'Nessuna casa trovata' }, { status: 404 });
    }

    const home = homesData[0]; // Usually single home

    // Save home_id to Firebase for future use
    // Use environment-aware path (dev/netatmo in localhost, netatmo in production)
    const homeIdPath = getEnvironmentPath('netatmo/home_id');
    await adminDbSet(homeIdPath, home.id);

    // Parse and structure data
    const rooms = NETATMO_API.parseRooms(homesData);
    const modules = NETATMO_API.parseModules(homesData);

    // Save topology to Firebase using Admin SDK
    const topologyPath = getEnvironmentPath('netatmo/topology');
    await adminDbSet(topologyPath, {
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
