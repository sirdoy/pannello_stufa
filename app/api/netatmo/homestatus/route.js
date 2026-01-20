
import { NextResponse } from 'next/server';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';
import { getEnvironmentPath } from '@/lib/environmentHelper';
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

    // Get home_id from Firebase (use environment-aware path)
    const homeIdPath = getEnvironmentPath('netatmo/home_id');
    const homeId = await adminDbGet(homeIdPath);
    if (!homeId) {
      return Response.json({
        error: 'home_id non trovato. Chiama prima /api/netatmo/homesdata'
      }, { status: 400 });
    }

    // Get home status
    const homeStatus = await NETATMO_API.getHomeStatus(accessToken, homeId);

    // Extract temperature data
    const temperatures = NETATMO_API.extractTemperatures(homeStatus);

    // Get topology to enrich data with room/module names (use environment-aware path)
    const topologyPath = getEnvironmentPath('netatmo/topology');
    const topology = await adminDbGet(topologyPath);

    // Extract modules with battery/status info (includes ALL devices)
    const modulesWithStatus = NETATMO_API.extractModulesWithStatus(homeStatus, topology);

    // Get stove sync status for living room indicator (use environment-aware path)
    const stoveSyncPath = getEnvironmentPath('netatmo/stoveSync');
    const stoveSyncData = await adminDbGet(stoveSyncPath);

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

    const currentStatusPath = getEnvironmentPath('netatmo/currentStatus');
    await adminDbSet(currentStatusPath, statusToSave);

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
}
