/**
 * Netatmo Stove Sync Service
 *
 * Manages the integration between the pellet stove and Netatmo thermostat valves.
 * When the stove is ON, the configured room valves are set to a low temperature (16C)
 * to prevent competing heating sources.
 *
 * Firebase Schema:
 * netatmo/stoveSync: {
 *   enabled: boolean,           // Whether stove sync is enabled
 *   rooms: [                    // Array of rooms to sync
 *     { id: string, name: string, originalSetpoint: number }
 *   ],
 *   stoveTemperature: number,   // Temperature to set when stove is ON (default: 16)
 *   stoveMode: boolean,         // True when stove is ON and valves are in stove mode
 *   lastSyncAt: number,         // Timestamp of last sync
 *   lastSyncAction: string,     // 'stove_on' | 'stove_off'
 * }
 */

import { adminDbGet, adminDbSet, adminDbUpdate } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { getValidAccessToken } from '@/lib/netatmoTokenHelper';
import { getEnvironmentPath } from '@/lib/environmentHelper';

// Default temperature when stove is ON
const DEFAULT_STOVE_TEMPERATURE = 16;

// Duration for manual setpoint (8 hours in seconds from now)
const MANUAL_SETPOINT_DURATION = 8 * 60 * 60;

/**
 * Get stove sync configuration from Firebase
 */
export async function getStoveSyncConfig() {
  const stoveSyncPath = getEnvironmentPath('netatmo/stoveSync');
  const config = await adminDbGet(stoveSyncPath);

  // Handle migration from single room to multi-room
  if (config && config.livingRoomId && !config.rooms) {
    // Migrate old format to new format
    return {
      ...config,
      rooms: [{
        id: config.livingRoomId,
        name: config.livingRoomName,
        originalSetpoint: config.originalSetpoint,
      }],
    };
  }

  return config || {
    enabled: false,
    rooms: [],
    stoveTemperature: DEFAULT_STOVE_TEMPERATURE,
    stoveMode: false,
    lastSyncAt: null,
    lastSyncAction: null,
  };
}

/**
 * Enable stove sync for multiple rooms
 * @param {Array} rooms - Array of { id, name } objects for rooms to sync
 * @param {number} stoveTemperature - Temperature when stove is ON (default: 16)
 */
export async function enableStoveSync(rooms, stoveTemperature = DEFAULT_STOVE_TEMPERATURE) {
  // Handle both old single-room API and new multi-room API
  let roomsArray = rooms;
  if (!Array.isArray(rooms)) {
    // Old API: enableStoveSync(roomId, roomName, stoveTemperature)
    roomsArray = [{ id: arguments[0], name: arguments[1] }];
    stoveTemperature = arguments[2] || DEFAULT_STOVE_TEMPERATURE;
  }

  const stoveSyncPath = getEnvironmentPath('netatmo/stoveSync');
  await adminDbSet(stoveSyncPath, {
    enabled: true,
    rooms: roomsArray.map(r => ({ id: r.id, name: r.name, originalSetpoint: null })),
    stoveTemperature,
    stoveMode: false,
    lastSyncAt: Date.now(),
    lastSyncAction: 'enabled',
  });

  const roomNames = roomsArray.map(r => r.name).join(', ');
  console.log(`✅ Stove sync enabled for rooms: ${roomNames} at ${stoveTemperature}°C`);
}

/**
 * Disable stove sync
 */
export async function disableStoveSync() {
  const config = await getStoveSyncConfig();

  // If in stove mode, restore all rooms to schedule first
  if (config.stoveMode && config.rooms?.length > 0) {
    try {
      await setRoomsToSchedule(config.rooms);
    } catch (err) {
      console.error('❌ Error restoring setpoints on disable:', err);
    }
  }

  const stoveSyncPath = getEnvironmentPath('netatmo/stoveSync');
  await adminDbUpdate(stoveSyncPath, {
    enabled: false,
    stoveMode: false,
    lastSyncAt: Date.now(),
    lastSyncAction: 'disabled',
  });

  console.log('✅ Stove sync disabled');
}

/**
 * Sync room valves with stove state
 * Called when stove state changes
 *
 * @param {boolean} stoveIsOn - True if stove is ON (WORK/START status)
 * @returns {Object} Sync result
 */
export async function syncLivingRoomWithStove(stoveIsOn) {
  const config = await getStoveSyncConfig();

  // Check if sync is enabled
  if (!config.enabled) {
    return {
      synced: false,
      reason: 'disabled',
      message: 'Stove sync is not enabled',
    };
  }

  // Check if rooms are configured
  if (!config.rooms || config.rooms.length === 0) {
    return {
      synced: false,
      reason: 'not_configured',
      message: 'No rooms configured for stove sync',
    };
  }

  // Check if we need to do anything
  if (stoveIsOn === config.stoveMode) {
    return {
      synced: false,
      reason: 'no_change',
      message: `Stove mode already ${stoveIsOn ? 'active' : 'inactive'}`,
    };
  }

  try {
    if (stoveIsOn) {
      // Stove turning ON - set valves to low temperature
      return await setRoomsToStoveMode(config);
    } else {
      // Stove turning OFF - return valves to schedule
      return await setRoomsToSchedule(config.rooms);
    }
  } catch (err) {
    console.error('❌ Error syncing rooms with stove:', err);
    return {
      synced: false,
      reason: 'error',
      error: err.message,
    };
  }
}

/**
 * Set all configured rooms to stove mode (low temperature)
 * @private
 */
async function setRoomsToStoveMode(config) {
  const { accessToken, error } = await getValidAccessToken();
  if (error) {
    return {
      synced: false,
      reason: 'auth_error',
      error,
    };
  }

  const homeIdPath = getEnvironmentPath('netatmo/home_id');
  const homeId = await adminDbGet(homeIdPath);
  if (!homeId) {
    return {
      synced: false,
      reason: 'no_home_id',
      error: 'home_id not found',
    };
  }

  // Get current setpoints to save for later
  const homeStatus = await NETATMO_API.getHomeStatus(accessToken, homeId);

  // Set manual temperature with 8 hour duration
  const endtime = Math.floor(Date.now() / 1000) + MANUAL_SETPOINT_DURATION;

  // Process each room
  const results = [];
  const updatedRooms = [];

  for (const room of config.rooms) {
    try {
      // Get current setpoint
      const roomStatus = homeStatus.rooms?.find(r => r.id === room.id);
      const currentSetpoint = roomStatus?.therm_setpoint_temperature;

      // Set room to stove temperature
      const success = await NETATMO_API.setRoomThermpoint(accessToken, {
        home_id: homeId,
        room_id: room.id,
        mode: 'manual',
        temp: config.stoveTemperature,
        endtime,
      });

      if (success) {
        updatedRooms.push({
          id: room.id,
          name: room.name,
          originalSetpoint: currentSetpoint,
        });
        results.push({ roomId: room.id, roomName: room.name, success: true });
        console.log(`✅ Room "${room.name}" set to ${config.stoveTemperature}°C (stove mode)`);
      } else {
        results.push({ roomId: room.id, roomName: room.name, success: false, error: 'API call failed' });
        console.error(`❌ Failed to set room "${room.name}" to stove mode`);
      }
    } catch (err) {
      results.push({ roomId: room.id, roomName: room.name, success: false, error: err.message });
      console.error(`❌ Error setting room "${room.name}":`, err.message);
    }
  }

  // Update Firebase with new room states
  const stoveSyncPath = getEnvironmentPath('netatmo/stoveSync');
  await adminDbUpdate(stoveSyncPath, {
    stoveMode: true,
    rooms: updatedRooms,
    lastSyncAt: Date.now(),
    lastSyncAction: 'stove_on',
  });

  const successCount = results.filter(r => r.success).length;
  const roomNames = updatedRooms.map(r => r.name).join(', ');

  return {
    synced: successCount > 0,
    action: 'stove_on',
    rooms: results,
    roomNames,
    temperature: config.stoveTemperature,
    successCount,
    totalCount: config.rooms.length,
  };
}

/**
 * Return all configured rooms to schedule (stove off)
 * @private
 */
async function setRoomsToSchedule(rooms) {
  const { accessToken, error } = await getValidAccessToken();
  if (error) {
    return {
      synced: false,
      reason: 'auth_error',
      error,
    };
  }

  const homeIdPath = getEnvironmentPath('netatmo/home_id');
  const homeId = await adminDbGet(homeIdPath);
  if (!homeId) {
    return {
      synced: false,
      reason: 'no_home_id',
      error: 'home_id not found',
    };
  }

  // Process each room
  const results = [];

  for (const room of rooms) {
    try {
      // Set room to home mode (follow schedule)
      const success = await NETATMO_API.setRoomThermpoint(accessToken, {
        home_id: homeId,
        room_id: room.id,
        mode: 'home',
      });

      if (success) {
        results.push({ roomId: room.id, roomName: room.name, success: true });
        console.log(`✅ Room "${room.name}" returned to schedule (stove off)`);
      } else {
        results.push({ roomId: room.id, roomName: room.name, success: false, error: 'API call failed' });
        console.error(`❌ Failed to restore room "${room.name}" to schedule`);
      }
    } catch (err) {
      results.push({ roomId: room.id, roomName: room.name, success: false, error: err.message });
      console.error(`❌ Error restoring room "${room.name}":`, err.message);
    }
  }

  // Update Firebase
  const stoveSyncPath = getEnvironmentPath('netatmo/stoveSync');
  await adminDbUpdate(stoveSyncPath, {
    stoveMode: false,
    lastSyncAt: Date.now(),
    lastSyncAction: 'stove_off',
  });

  const successCount = results.filter(r => r.success).length;
  const roomNames = rooms.map(r => r.name).join(', ');

  return {
    synced: successCount > 0,
    action: 'stove_off',
    rooms: results,
    roomNames,
    successCount,
    totalCount: rooms.length,
  };
}

/**
 * Check if stove sync should be triggered based on stove status change
 * Called from scheduler cron
 *
 * @param {string} currentStatus - Current stove status (WORK, START, STANDBY, etc.)
 * @param {string} previousStatus - Previous stove status
 */
export async function checkStoveSyncOnStatusChange(currentStatus, previousStatus) {
  // Determine if stove is ON (WORK or START states)
  const currentlyOn = currentStatus === 'WORK' || currentStatus === 'START' ||
                      currentStatus?.includes('WORK') || currentStatus?.includes('START');
  const wasOn = previousStatus === 'WORK' || previousStatus === 'START' ||
                previousStatus?.includes('WORK') || previousStatus?.includes('START');

  // Only sync if there's a state change
  if (currentlyOn !== wasOn) {
    console.log(`🔥 Stove state changed: ${previousStatus} → ${currentStatus}`);
    return await syncLivingRoomWithStove(currentlyOn);
  }

  return {
    synced: false,
    reason: 'no_state_change',
  };
}

/**
 * Get list of rooms available for stove sync configuration
 */
export async function getAvailableRoomsForSync() {
  const topologyPath = getEnvironmentPath('netatmo/topology');
  const topology = await adminDbGet(topologyPath);
  if (!topology?.rooms) {
    return [];
  }

  // Filter rooms that have valves (module_ids with NRV type)
  return topology.rooms.map(room => ({
    id: room.id,
    name: room.name,
    type: room.type,
  }));
}

/**
 * Get list of room IDs currently configured for stove sync
 */
export async function getSyncedRoomIds() {
  const config = await getStoveSyncConfig();
  if (!config.enabled || !config.rooms) {
    return [];
  }
  return config.rooms.map(r => r.id);
}

export default {
  getStoveSyncConfig,
  enableStoveSync,
  disableStoveSync,
  syncLivingRoomWithStove,
  checkStoveSyncOnStatusChange,
  getAvailableRoomsForSync,
  getSyncedRoomIds,
};
