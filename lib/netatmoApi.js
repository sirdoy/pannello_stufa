/**
 * Netatmo Energy API Wrapper
 * Complete integration for Netatmo thermostat and valve control
 *
 * API Documentation: https://dev.netatmo.com/apidocumentation/energy
 */

const NETATMO_API_BASE = 'https://api.netatmo.com';
const NETATMO_OAUTH_URL = `${NETATMO_API_BASE}/oauth2/token`;

/**
 * Get access token from refresh token
 */
async function getAccessToken(refreshToken) {
  const response = await fetch(NETATMO_OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.NETATMO_CLIENT_ID,
      client_secret: process.env.NETATMO_CLIENT_SECRET,
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
  const data = await makeRequest('setroomthermpoint', accessToken, {
    method: 'POST',
    body: params,
  });
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse rooms from homesdata response
 */
function parseRooms(homesData) {
  if (!homesData || homesData.length === 0) return [];

  const home = homesData[0]; // Usually single home
  return (home.rooms || []).map(room => ({
    id: room.id,
    name: room.name,
    type: room.type,
    modules: room.module_ids || [],
  }));
}

/**
 * Parse modules from homesdata response
 */
function parseModules(homesData) {
  if (!homesData || homesData.length === 0) return [];

  const home = homesData[0];
  return (home.modules || []).map(module => ({
    id: module.id,
    name: module.name,
    type: module.type,
    bridge: module.bridge,
    room_id: module.room_id,
  }));
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
  }));
}

/**
 * Check if valves are open in room
 */
function isHeatingActive(room) {
  return room.heating_power_request > 0;
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
  createSchedule,
  renameHome,

  // Helpers
  parseRooms,
  parseModules,
  extractTemperatures,
  isHeatingActive,
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
  createSchedule,
  renameHome,

  // Helpers
  parseRooms,
  parseModules,
  extractTemperatures,
  isHeatingActive,
};
