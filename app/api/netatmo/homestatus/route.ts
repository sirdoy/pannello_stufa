import { withAuthAndErrorHandler, success, badRequest, requireNetatmoToken } from '@/lib/core';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { getEnvironmentPath } from '@/lib/environmentHelper';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/homestatus
 * Retrieves real-time status of all rooms and modules
 * Returns temperatures, setpoints, heating status, and module battery info
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const accessToken = await requireNetatmoToken();

  // Get home_id from Firebase
  const homeIdPath = getEnvironmentPath('netatmo/home_id');
  const homeId = await adminDbGet(homeIdPath);
  if (!homeId) {
    return badRequest('home_id non trovato. Chiama prima /api/netatmo/homesdata');
  }

  // Get home status
  const homeStatus = await NETATMO_API.getHomeStatus(accessToken, homeId);

  // Extract temperature data
  const temperatures = NETATMO_API.extractTemperatures(homeStatus);

  // Get topology to enrich data with room/module names
  const topologyPath = getEnvironmentPath('netatmo/topology');
  const topology = await adminDbGet(topologyPath);

  // Extract modules with battery/status info
  const modulesWithStatus = NETATMO_API.extractModulesWithStatus(homeStatus, topology);

  // Get stove sync status for living room indicator
  const stoveSyncPath = getEnvironmentPath('netatmo/stoveSync');
  const stoveSyncData = await adminDbGet(stoveSyncPath);

  // Enrich with room names (filter out undefined values for Firebase)
  const enrichedRooms = temperatures.map(temp => {
    const room = topology?.rooms?.find(r => r.id === temp.room_id);

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
    if (temp.endtime !== undefined && temp.endtime !== null) {
      enriched.endtime = temp.endtime;
    }

    // Add stove sync indicator for all synced rooms
    const syncedRoomIds = stoveSyncData?.rooms?.map(r => r.id) || [];
    // Also check legacy single-room format for backward compatibility
    if (stoveSyncData?.livingRoomId && !syncedRoomIds.includes(stoveSyncData.livingRoomId)) {
      syncedRoomIds.push(stoveSyncData.livingRoomId);
    }
    if (stoveSyncData?.enabled && stoveSyncData?.stoveMode && syncedRoomIds.includes(temp.room_id)) {
      enriched.stoveSync = true;
      enriched.stoveSyncSetpoint = stoveSyncData?.stoveTemperature || 16;
    }

    return enriched;
  });

  // Get modules with low battery
  const lowBatteryModules = NETATMO_API.getModulesWithLowBattery(modulesWithStatus);
  const hasCriticalBattery = NETATMO_API.hasAnyCriticalBattery(modulesWithStatus);
  const hasLowBattery = NETATMO_API.hasAnyLowBattery(modulesWithStatus);

  // Save current status to Firebase
  const statusToSave = {
    rooms: enrichedRooms,
    modules: modulesWithStatus,
    updated_at: Date.now(),
    hasLowBattery,
    hasCriticalBattery,
  };

  if (homeStatus.therm_mode !== undefined && homeStatus.therm_mode !== null) {
    statusToSave.mode = homeStatus.therm_mode;
  }

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

  if (homeStatus.therm_mode !== undefined && homeStatus.therm_mode !== null) {
    response.mode = homeStatus.therm_mode;
  }

  return success(response);
}, 'Netatmo/HomeStatus');
