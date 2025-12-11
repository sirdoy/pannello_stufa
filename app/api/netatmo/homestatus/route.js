
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';
import { auth0 } from '@/lib/auth0';

// Force dynamic rendering for Firebase operations
export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/homestatus
 * Retrieves real-time status of all rooms and modules
 * Returns temperatures, setpoints, heating status
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

    // Get home_id from Firebase
    const homeIdSnap = await adminDbGet('netatmo/home_id');
    if (!homeIdSnap.exists()) {
      return Response.json({
        error: 'home_id non trovato. Chiama prima /api/netatmo/homesdata'
      }, { status: 400 });
    }
    const homeId = homeIdSnap.val();

    // Get home status
    const homeStatus = await NETATMO_API.getHomeStatus(accessToken, homeId);

    // Extract temperature data
    const temperatures = NETATMO_API.extractTemperatures(homeStatus);

    // Get topology to enrich data with room names
    const topologySnap = await adminDbGet('netatmo/topology');
    const topology = topologySnap.exists() ? topologySnap.val() : null;

    // Enrich with room names (filter out undefined values for Firebase)
    const enrichedRooms = temperatures.map(temp => {
      const room = topology?.rooms?.find(r => r.id === temp.room_id);

      // Build object without undefined values
      const enriched = {
        room_id: temp.room_id,
        room_name: room?.name || 'Sconosciuta',
        room_type: room?.type || 'unknown',
      };

      // Only add properties if they're defined
      if (temp.temperature !== undefined && temp.temperature !== null) {
        enriched.temperature = temp.temperature;
      }
      if (temp.setpoint !== undefined && temp.setpoint !== null) {
        enriched.setpoint = temp.setpoint;
      }
      if (temp.mode !== undefined && temp.mode !== null) {
        enriched.mode = temp.mode;
      }
      if (temp.heating !== undefined && temp.heating !== null) {
        enriched.heating = temp.heating;
      }

      return enriched;
    });

    // Save current status to Firebase (only if we have valid data)
    const statusToSave = {
      rooms: enrichedRooms,
      updated_at: Date.now(),
    };

    // Only add mode if it's defined
    if (homeStatus.therm_mode !== undefined && homeStatus.therm_mode !== null) {
      statusToSave.mode = homeStatus.therm_mode;
    }

    await adminDbSet('netatmo/currentStatus', statusToSave);

    const response = {
      rooms: enrichedRooms,
      updated_at: Date.now(),
    };

    // Only add mode if it's defined
    if (homeStatus.therm_mode !== undefined && homeStatus.therm_mode !== null) {
      response.mode = homeStatus.therm_mode;
    }

    return Response.json(response);
  } catch (err) {
    console.error('❌ Error in /api/netatmo/homestatus:', err);
    console.error('❌ Error stack:', err.stack);
    return Response.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
});
