/**
 * Netatmo Stove Sync Service
 *
 * Manages the integration between the pellet stove and Netatmo thermostat valves.
 * When the stove is ON, the living room valve (salotto) is set to a low temperature (16C)
 * to prevent competing heating sources.
 *
 * Firebase Schema:
 * netatmo/stoveSync: {
 *   enabled: boolean,           // Whether stove sync is enabled
 *   livingRoomId: string,       // Room ID for living room (salotto)
 *   livingRoomName: string,     // Room name for display
 *   stoveTemperature: number,   // Temperature to set when stove is ON (default: 16)
 *   stoveMode: boolean,         // True when stove is ON and valve is in stove mode
 *   originalSetpoint: number,   // Original setpoint before stove mode
 *   lastSyncAt: number,         // Timestamp of last sync
 *   lastSyncAction: string,     // 'stove_on' | 'stove_off'
 * }
 */

import { adminDbGet, adminDbSet, adminDbUpdate } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { getValidAccessToken } from '@/lib/netatmoTokenHelper';

// Default temperature when stove is ON
const DEFAULT_STOVE_TEMPERATURE = 16;

// Duration for manual setpoint (8 hours in seconds from now)
const MANUAL_SETPOINT_DURATION = 8 * 60 * 60;

/**
 * Get stove sync configuration from Firebase
 */
export async function getStoveSyncConfig() {
  const config = await adminDbGet('netatmo/stoveSync');
  return config || {
    enabled: false,
    livingRoomId: null,
    livingRoomName: null,
    stoveTemperature: DEFAULT_STOVE_TEMPERATURE,
    stoveMode: false,
    originalSetpoint: null,
    lastSyncAt: null,
    lastSyncAction: null,
  };
}

/**
 * Enable stove sync for a specific room
 * @param {string} roomId - Netatmo room ID for living room
 * @param {string} roomName - Room name for display
 * @param {number} stoveTemperature - Temperature when stove is ON (default: 16)
 */
export async function enableStoveSync(roomId, roomName, stoveTemperature = DEFAULT_STOVE_TEMPERATURE) {
  await adminDbSet('netatmo/stoveSync', {
    enabled: true,
    livingRoomId: roomId,
    livingRoomName: roomName,
    stoveTemperature,
    stoveMode: false,
    originalSetpoint: null,
    lastSyncAt: Date.now(),
    lastSyncAction: 'enabled',
  });

  console.log(`✅ Stove sync enabled for room "${roomName}" (${roomId}) at ${stoveTemperature}°C`);
}

/**
 * Disable stove sync
 */
export async function disableStoveSync() {
  const config = await getStoveSyncConfig();

  // If in stove mode, restore original setpoint first
  if (config.stoveMode && config.originalSetpoint && config.livingRoomId) {
    try {
      await setLivingRoomToSchedule(config.livingRoomId);
    } catch (err) {
      console.error('❌ Error restoring setpoint on disable:', err);
    }
  }

  await adminDbUpdate('netatmo/stoveSync', {
    enabled: false,
    stoveMode: false,
    lastSyncAt: Date.now(),
    lastSyncAction: 'disabled',
  });

  console.log('✅ Stove sync disabled');
}

/**
 * Sync living room valve with stove state
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

  // Check if living room is configured
  if (!config.livingRoomId) {
    return {
      synced: false,
      reason: 'not_configured',
      message: 'Living room ID not configured',
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
      // Stove turning ON - set valve to low temperature
      return await setLivingRoomToStoveMode(config);
    } else {
      // Stove turning OFF - return valve to schedule
      return await setLivingRoomToSchedule(config.livingRoomId);
    }
  } catch (err) {
    console.error('❌ Error syncing living room with stove:', err);
    return {
      synced: false,
      reason: 'error',
      error: err.message,
    };
  }
}

/**
 * Set living room valve to stove mode (low temperature)
 * @private
 */
async function setLivingRoomToStoveMode(config) {
  const { accessToken, error } = await getValidAccessToken();
  if (error) {
    return {
      synced: false,
      reason: 'auth_error',
      error,
    };
  }

  const homeId = await adminDbGet('netatmo/home_id');
  if (!homeId) {
    return {
      synced: false,
      reason: 'no_home_id',
      error: 'home_id not found',
    };
  }

  // Get current setpoint to save for later
  const homeStatus = await NETATMO_API.getHomeStatus(accessToken, homeId);
  const roomStatus = homeStatus.rooms?.find(r => r.id === config.livingRoomId);
  const currentSetpoint = roomStatus?.therm_setpoint_temperature;

  // Set manual temperature with 8 hour duration
  const endtime = Math.floor(Date.now() / 1000) + MANUAL_SETPOINT_DURATION;

  const success = await NETATMO_API.setRoomThermpoint(accessToken, {
    home_id: homeId,
    room_id: config.livingRoomId,
    mode: 'manual',
    temp: config.stoveTemperature,
    endtime,
  });

  if (!success) {
    return {
      synced: false,
      reason: 'api_error',
      error: 'Failed to set room temperature',
    };
  }

  // Update Firebase
  await adminDbUpdate('netatmo/stoveSync', {
    stoveMode: true,
    originalSetpoint: currentSetpoint,
    lastSyncAt: Date.now(),
    lastSyncAction: 'stove_on',
  });

  console.log(`✅ Living room "${config.livingRoomName}" set to ${config.stoveTemperature}°C (stove mode)`);

  return {
    synced: true,
    action: 'stove_on',
    roomId: config.livingRoomId,
    roomName: config.livingRoomName,
    temperature: config.stoveTemperature,
    originalSetpoint: currentSetpoint,
  };
}

/**
 * Return living room valve to schedule (stove off)
 * @private
 */
async function setLivingRoomToSchedule(livingRoomId) {
  const { accessToken, error } = await getValidAccessToken();
  if (error) {
    return {
      synced: false,
      reason: 'auth_error',
      error,
    };
  }

  const homeId = await adminDbGet('netatmo/home_id');
  if (!homeId) {
    return {
      synced: false,
      reason: 'no_home_id',
      error: 'home_id not found',
    };
  }

  // Set room to home mode (follow schedule)
  const success = await NETATMO_API.setRoomThermpoint(accessToken, {
    home_id: homeId,
    room_id: livingRoomId,
    mode: 'home',
  });

  if (!success) {
    return {
      synced: false,
      reason: 'api_error',
      error: 'Failed to restore room to schedule',
    };
  }

  // Update Firebase
  const config = await getStoveSyncConfig();
  await adminDbUpdate('netatmo/stoveSync', {
    stoveMode: false,
    originalSetpoint: null,
    lastSyncAt: Date.now(),
    lastSyncAction: 'stove_off',
  });

  console.log(`✅ Living room "${config.livingRoomName}" returned to schedule (stove off)`);

  return {
    synced: true,
    action: 'stove_off',
    roomId: livingRoomId,
    roomName: config.livingRoomName,
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
  const topology = await adminDbGet('netatmo/topology');
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

export default {
  getStoveSyncConfig,
  enableStoveSync,
  disableStoveSync,
  syncLivingRoomWithStove,
  checkStoveSyncOnStatusChange,
  getAvailableRoomsForSync,
};
