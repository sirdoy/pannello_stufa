
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';
import { auth0 } from '@/lib/auth0';

// Force dynamic rendering for Firebase operations
export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/homestatus
 * Retrieves real-time status of all rooms and modules
 * Returns temperatures, setpoints, heating status, and module battery info
 * ✅ Protected by Auth0 authentication
 * ✅ Includes ALL devices including those with low/dead battery
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
    const homeId = await adminDbGet('netatmo/home_id');
    if (!homeId) {
      return Response.json({
        error: 'home_id non trovato. Chiama prima /api/netatmo/homesdata'
      }, { status: 400 });
    }

    // Get home status
    const homeStatus = await NETATMO_API.getHomeStatus(accessToken, homeId);

    // Extract temperature data
    const temperatures = NETATMO_API.extractTemperatures(homeStatus);

    // Get topology to enrich data with room/module names
    const topology = await adminDbGet('netatmo/topology');

    // Extract modules with battery/status info (includes ALL devices)
    const modulesWithStatus = NETATMO_API.extractModulesWithStatus(homeStatus, topology);

    // Get stove sync status for living room indicator
    const stoveSyncData = await adminDbGet('netatmo/stoveSync');

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

      // Add stove sync indicator for living room
      if (stoveSyncData?.enabled && stoveSyncData?.livingRoomId === temp.room_id && stoveSyncData?.stoveMode) {
        enriched.stoveSync = true;
        enriched.stoveSyncSetpoint = 16; // Temperature set when stove is on
      }

      return enriched;
    });

    // Get modules with low battery for quick access
    const lowBatteryModules = NETATMO_API.getModulesWithLowBattery(modulesWithStatus);
    const hasCriticalBattery = NETATMO_API.hasAnyCriticalBattery(modulesWithStatus);
    const hasLowBattery = NETATMO_API.hasAnyLowBattery(modulesWithStatus);

    // Save current status to Firebase (only if we have valid data)
    const statusToSave = {
      rooms: enrichedRooms,
      modules: modulesWithStatus,
      updated_at: Date.now(),
    };

    // Only add mode if it's defined
    if (homeStatus.therm_mode !== undefined && homeStatus.therm_mode !== null) {
      statusToSave.mode = homeStatus.therm_mode;
    }

    // Add battery status flags
    statusToSave.hasLowBattery = hasLowBattery;
    statusToSave.hasCriticalBattery = hasCriticalBattery;

    await adminDbSet('netatmo/currentStatus', statusToSave);

    const response = {
      rooms: enrichedRooms,
      modules: modulesWithStatus,
      lowBatteryModules,
      hasLowBattery,
      hasCriticalBattery,
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
