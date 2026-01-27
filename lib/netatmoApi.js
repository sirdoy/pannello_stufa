/**
 * Netatmo Energy API Wrapper
 * Complete integration for Netatmo thermostat and valve control
 *
 * API Documentation: https://dev.netatmo.com/apidocumentation/energy
 */

import { getNetatmoCredentials } from './netatmoCredentials';

const NETATMO_API_BASE = 'https://api.netatmo.com';
const NETATMO_OAUTH_URL = `${NETATMO_API_BASE}/oauth2/token`;

/**
 * Get access token from refresh token
 */
async function getAccessToken(refreshToken) {
  const credentials = getNetatmoCredentials();

  const response = await fetch(NETATMO_OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
    }),
  });

  const data = await response.json();

  if (!data.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

/**
 * Make authenticated API request
 */
async function makeRequest(endpoint, accessToken, options = {}) {
  const url = `${NETATMO_API_BASE}/api/${endpoint}`;
  const method = options.method || 'GET';
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ...options.headers,
  };

  const config = {
    method,
    headers,
  };

  if (options.body) {
    if (method === 'POST') {
      config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      config.body = new URLSearchParams(options.body);
    } else {
      config.body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (data.error) {
    throw new Error(`Netatmo API Error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  return data;
}

// ============================================================================
// TOPOLOGY & DATA ENDPOINTS
// ============================================================================

/**
 * Get homes data - complete topology (homes, rooms, modules)
 * Returns: home_id, room structures, module associations
 */
async function getHomesData(accessToken) {
  const data = await makeRequest('homesdata', accessToken);
  return data.body?.homes || [];
}

/**
 * Get device list - all Netatmo devices
 */
async function getDeviceList(accessToken) {
  const data = await makeRequest('devicelist', accessToken);
  return data.body || {};
}

/**
 * Get home status - real-time status of all rooms and modules
 * Params: { home_id }
 */
async function getHomeStatus(accessToken, homeId) {
  const data = await makeRequest('homestatus', accessToken, {
    method: 'POST',
    body: { home_id: homeId },
  });
  return data.body?.home || {};
}

/**
 * Get thermostat state - specific device/module state
 * Params: { device_id, module_id }
 */
async function getThermState(accessToken, deviceId, moduleId) {
  const data = await makeRequest('getthermstate', accessToken, {
    method: 'POST',
    body: { device_id: deviceId, module_id: moduleId },
  });
  return data.body || {};
}

/**
 * Get room measure - historical temperature data
 * Params: { home_id, room_id, scale, type, date_begin, date_end, limit, optimize }
 * Scale: max (30min), 30min, 1hour, 3hours, 1day, 1week, 1month
 * Type: temperature, sp_temperature, min_temp, max_temp, date_min_temp
 */
async function getRoomMeasure(accessToken, params) {
  const data = await makeRequest('getroommeasure', accessToken, {
    method: 'POST',
    body: params,
  });
  return data.body || [];
}

// ============================================================================
// CONTROL ENDPOINTS
// ============================================================================

/**
 * Set room temperature setpoint
 * Params: { home_id, room_id, mode, temp?, endtime? }
 * Mode: manual, home, max, off
 * Temp: target temperature (manual mode)
 * Endtime: UNIX timestamp when to return to schedule (manual mode)
 */
async function setRoomThermpoint(accessToken, params) {
  // Ensure temp is a float for Netatmo API
  const normalizedParams = {
    ...params,
    temp: params.temp !== undefined ? parseFloat(params.temp) : undefined,
  };

  console.log('🌡️ Calling Netatmo setRoomThermpoint API:', normalizedParams);

  const data = await makeRequest('setroomthermpoint', accessToken, {
    method: 'POST',
    body: normalizedParams,
  });

  console.log('🌡️ Netatmo API response:', data);

  return data.status === 'ok';
}

/**
 * Set thermostat mode for entire home
 * Params: { home_id, mode, endtime? }
 * Mode: schedule, away, hg (frost guard), off
 * Endtime: UNIX timestamp (for away/hg modes)
 */
async function setThermMode(accessToken, params) {
  const data = await makeRequest('setthermmode', accessToken, {
    method: 'POST',
    body: params,
  });
  return data.status === 'ok';
}

/**
 * Switch home schedule
 * Params: { home_id, schedule_id }
 */
async function switchHomeSchedule(accessToken, homeId, scheduleId) {
  const data = await makeRequest('switchhomeschedule', accessToken, {
    method: 'POST',
    body: { home_id: homeId, schedule_id: scheduleId },
  });
  return data.status === 'ok';
}

/**
 * Create new schedule
 * Params: { home_id, schedule_name, zones, timetable }
 */
async function createSchedule(accessToken, params) {
  const data = await makeRequest('createnewhomeschedule', accessToken, {
    method: 'POST',
    body: params,
  });
  return data.body?.schedule_id;
}

/**
 * Rename home
 * Params: { home_id, name }
 */
async function renameHome(accessToken, homeId, name) {
  const data = await makeRequest('renamehome', accessToken, {
    method: 'POST',
    body: { home_id: homeId, name },
  });
  return data.status === 'ok';
}

/**
 * Sync home schedule - triggers valve calibration
 * Params: { home_id, schedule_id?, schedule_name?, zones?, timetable? }
 * This endpoint syncs the current schedule and triggers calibration on all valves
 * If schedule_id is not provided, uses the currently active schedule
 *
 * IMPORTANT:
 * - zones and timetable must be passed as JSON strings for URLSearchParams
 * - schedule_name is REQUIRED when schedule_id is provided
 */
async function syncHomeSchedule(accessToken, params) {
  // Convert zones and timetable arrays to JSON strings for URLSearchParams
  const bodyParams = {
    home_id: params.home_id,
  };

  if (params.schedule_id) {
    bodyParams.schedule_id = params.schedule_id;
  }

  if (params.schedule_name) {
    bodyParams.name = params.schedule_name;
  }

  if (params.zones) {
    bodyParams.zones = JSON.stringify(params.zones);
  }

  if (params.timetable) {
    bodyParams.timetable = JSON.stringify(params.timetable);
  }

  const data = await makeRequest('synchomeschedule', accessToken, {
    method: 'POST',
    body: bodyParams,
  });
  return data.status === 'ok';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse rooms from homesdata response
 * Filters out undefined values to prevent Firebase errors
 */
function parseRooms(homesData) {
  if (!homesData || homesData.length === 0) return [];

  const home = homesData[0]; // Usually single home
  return (home.rooms || []).map(room => {
    const parsed = {
      id: room.id,
      name: room.name,
      type: room.type,
      modules: room.module_ids || [],
    };

    // Only add optional properties if they're defined
    if (room.therm_setpoint_temperature !== undefined && room.therm_setpoint_temperature !== null) {
      parsed.setpoint = room.therm_setpoint_temperature;
    }

    return parsed;
  });
}

/**
 * Parse modules from homesdata response
 * Filters out undefined values to prevent Firebase errors
 */
function parseModules(homesData) {
  if (!homesData || homesData.length === 0) return [];

  const home = homesData[0];
  return (home.modules || []).map(module => {
    const parsed = {
      id: module.id,
      name: module.name,
      type: module.type,
    };

    // Only add optional properties if they're defined
    if (module.bridge !== undefined && module.bridge !== null) {
      parsed.bridge = module.bridge;
    }
    if (module.room_id !== undefined && module.room_id !== null) {
      parsed.room_id = module.room_id;
    }

    return parsed;
  });
}

/**
 * Extract temperatures from homestatus response
 */
function extractTemperatures(homeStatus) {
  const rooms = homeStatus.rooms || [];
  return rooms.map(room => ({
    room_id: room.id,
    temperature: room.therm_measured_temperature,
    setpoint: room.therm_setpoint_temperature,
    mode: room.therm_setpoint_mode,
    heating: room.heating_power_request > 0,
    endtime: room.therm_setpoint_end_time, // UNIX timestamp when manual override ends
  }));
}

/**
 * Check if valves are open in room
 */
function isHeatingActive(room) {
  return room.heating_power_request > 0;
}

/**
 * Extract modules with battery/status info from homestatus response
 * Returns all modules including those with low/dead battery
 * Filters out undefined values to prevent Firebase errors
 *
 * Module types:
 * - NRV: Smart Radiator Valve (battery powered)
 * - NATherm1: Thermostat (battery powered)
 * - NAPlug: Relay/Gateway (mains powered)
 * - OTH: OpenTherm Thermostat
 * - OTM: OpenTherm Module
 *
 * Battery states: "full", "high", "medium", "low", "very_low"
 */
function extractModulesWithStatus(homeStatus, topology = null) {
  const modules = homeStatus.modules || [];

  return modules.map(module => {
    const parsed = {
      id: module.id,
      type: module.type,
      reachable: module.reachable ?? false,
    };

    // Get module name from topology if available
    if (topology?.modules) {
      const topologyModule = topology.modules.find(m => m.id === module.id);
      if (topologyModule?.name) {
        parsed.name = topologyModule.name;
      }
    }

    // Battery info (for battery-powered devices: NRV, NATherm1)
    if (module.battery_state !== undefined && module.battery_state !== null) {
      parsed.battery_state = module.battery_state;
    }
    if (module.battery_level !== undefined && module.battery_level !== null) {
      parsed.battery_level = module.battery_level;
    }

    // RF signal strength (for wireless modules)
    if (module.rf_strength !== undefined && module.rf_strength !== null) {
      parsed.rf_strength = module.rf_strength;
    }

    // WiFi signal strength (for NAPlug relay)
    if (module.wifi_strength !== undefined && module.wifi_strength !== null) {
      parsed.wifi_strength = module.wifi_strength;
    }

    // Bridge/relay association
    if (module.bridge !== undefined && module.bridge !== null) {
      parsed.bridge = module.bridge;
    }

    // Room association
    if (module.room_id !== undefined && module.room_id !== null) {
      parsed.room_id = module.room_id;
    }

    // Firmware
    if (module.firmware_revision !== undefined && module.firmware_revision !== null) {
      parsed.firmware_revision = module.firmware_revision;
    }

    // Boiler status (for relays)
    if (module.boiler_status !== undefined && module.boiler_status !== null) {
      parsed.boiler_status = module.boiler_status;
    }

    return parsed;
  });
}

/**
 * Get modules with low or critical battery
 * Returns modules with battery_state "low" or "very_low"
 */
function getModulesWithLowBattery(modules) {
  return modules.filter(module =>
    module.battery_state === 'low' || module.battery_state === 'very_low'
  );
}

/**
 * Check if any module has critical battery (very_low)
 */
function hasAnyCriticalBattery(modules) {
  return modules.some(module => module.battery_state === 'very_low');
}

/**
 * Check if any module has low battery (low or very_low)
 */
function hasAnyLowBattery(modules) {
  return modules.some(module =>
    module.battery_state === 'low' || module.battery_state === 'very_low'
  );
}

/**
 * Parse schedules from homesdata response
 * Extracts schedule metadata: id, name, type, selected (active), zones, timetable
 * Filters out undefined values to prevent Firebase errors
 */
function parseSchedules(homesData) {
  if (!homesData || homesData.length === 0) return [];

  const home = homesData[0]; // Usually single home
  return (home.schedules || []).map(schedule => {
    const parsed = {
      id: schedule.id,
      name: schedule.name,
      type: schedule.type || 'therm', // 'therm', 'cooling', etc.
      selected: schedule.selected || false, // Is this the active schedule?
    };

    // Only add optional properties if they're defined
    if (schedule.zones && Array.isArray(schedule.zones)) {
      parsed.zones = schedule.zones.map(zone => ({
        id: zone.id,
        name: zone.name,
        type: zone.type,
        rooms: zone.rooms || [],
        temp: zone.temp,
      }));
    }

    if (schedule.timetable && Array.isArray(schedule.timetable)) {
      parsed.timetable = schedule.timetable.map(slot => ({
        m_offset: slot.m_offset, // Minutes from midnight Monday
        zone_id: slot.zone_id,
      }));
    }

    return parsed;
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

const NETATMO_API = {
  // Auth
  getAccessToken,

  // Data endpoints
  getHomesData,
  getDeviceList,
  getHomeStatus,
  getThermState,
  getRoomMeasure,

  // Control endpoints
  setRoomThermpoint,
  setThermMode,
  switchHomeSchedule,
  syncHomeSchedule,
  createSchedule,
  renameHome,

  // Helpers
  parseRooms,
  parseModules,
  parseSchedules,
  extractTemperatures,
  isHeatingActive,
  extractModulesWithStatus,
  getModulesWithLowBattery,
  hasAnyCriticalBattery,
  hasAnyLowBattery,
};

export default NETATMO_API;
export {
  // Auth
  getAccessToken,

  // Data
  getHomesData,
  getDeviceList,
  getHomeStatus,
  getThermState,
  getRoomMeasure,

  // Control
  setRoomThermpoint,
  setThermMode,
  switchHomeSchedule,
  syncHomeSchedule,
  createSchedule,
  renameHome,

  // Helpers
  parseRooms,
  parseModules,
  parseSchedules,
  extractTemperatures,
  isHeatingActive,
  extractModulesWithStatus,
  getModulesWithLowBattery,
  hasAnyCriticalBattery,
  hasAnyLowBattery,
};
