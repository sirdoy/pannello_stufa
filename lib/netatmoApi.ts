/**
 * Netatmo Energy API Wrapper
 * Complete integration for Netatmo thermostat and valve control
 *
 * API Documentation: https://dev.netatmo.com/apidocumentation/energy
 */

import { getNetatmoCredentials } from './netatmoCredentials';

const NETATMO_API_BASE = 'https://api.netatmo.com';
const NETATMO_OAUTH_URL = `${NETATMO_API_BASE}/oauth2/token`;

// ============================================================================
// TYPES - Netatmo API Data Structures
// ============================================================================

/** Netatmo Home */
export interface NetatmoHome {
  id: string;
  name?: string;
  rooms?: NetatmoRoom[];
  modules?: NetatmoModule[];
  schedules?: NetatmoSchedule[];
}

/** Netatmo Room */
export interface NetatmoRoom {
  id: string;
  name: string;
  type: string;
  module_ids?: string[];
  therm_setpoint_temperature?: number;
  therm_measured_temperature?: number;
  therm_setpoint_mode?: string;
  heating_power_request?: number;
  therm_setpoint_end_time?: number;
}

/** Netatmo Module */
export interface NetatmoModule {
  id: string;
  name: string;
  type: string;
  bridge?: string;
  room_id?: string;
  battery_state?: string;
  battery_level?: number;
  rf_strength?: number;
  wifi_strength?: number;
  reachable?: boolean;
  firmware_revision?: number;
  boiler_status?: boolean;
}

/** Netatmo Schedule Zone */
export interface NetatmoZone {
  id: number;
  name: string;
  type: number;
  rooms?: unknown[];
  temp?: number;
  rooms_temp?: Array<{ room_id: string; temp: number }>;
}

/** Netatmo Schedule Timetable Slot */
export interface NetatmoTimetableSlot {
  m_offset: number;
  zone_id: number;
}

/** Netatmo Schedule */
export interface NetatmoSchedule {
  id: string;
  name: string;
  type?: string;
  selected?: boolean;
  zones?: NetatmoZone[];
  timetable?: NetatmoTimetableSlot[];
}

/** Netatmo Home Status */
export interface NetatmoHomeStatus {
  rooms?: NetatmoRoom[];
  modules?: NetatmoModule[];
}

/** Parsed Room (cleaned for Firebase) */
export interface ParsedRoom {
  id: string;
  name: string;
  type: string;
  modules: string[];
  setpoint?: number;
}

/** Parsed Module (cleaned for Firebase) */
export interface ParsedModule {
  id: string;
  name?: string;
  type: string;
  bridge?: string;
  room_id?: string;
  battery_state?: string;
  battery_level?: number;
  rf_strength?: number;
  wifi_strength?: number;
  reachable: boolean;
  firmware_revision?: number;
  boiler_status?: boolean;
}

/** Parsed Schedule (cleaned for Firebase) */
export interface ParsedSchedule {
  id: string;
  name: string;
  type: string;
  selected: boolean;
  zones?: Array<{
    id: number;
    name: string;
    type: number;
    rooms: unknown[];
    temp?: number;
    rooms_temp?: Array<{ room_id: string; temp: number }>;
  }>;
  timetable?: Array<{
    m_offset: number;
    zone_id: number;
  }>;
}

/** Room Temperature Data */
export interface RoomTemperature {
  room_id: string;
  temperature?: number;
  setpoint?: number;
  mode?: string;
  heating: boolean;
  endtime?: number;
}

/** Request Options */
interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

/** API Response */
interface NetatmoApiResponse {
  status?: string;
  body?: {
    homes?: NetatmoHome[];
    home?: NetatmoHomeStatus;
    schedule_id?: string;
    [key: string]: unknown;
  };
  error?: {
    message?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/** Token Response */
interface TokenResponse {
  access_token?: string;
  [key: string]: unknown;
}

/** Set Room Thermpoint Params */
export interface SetRoomThermpointParams {
  home_id: string;
  room_id: string;
  mode: 'manual' | 'home' | 'max' | 'off';
  temp?: number | string;
  endtime?: number;
}

/** Set Therm Mode Params */
export interface SetThermModeParams {
  home_id: string;
  mode: 'schedule' | 'away' | 'hg' | 'off';
  endtime?: number;
  [key: string]: unknown;
}

/** Create Schedule Params */
export interface CreateScheduleParams {
  home_id: string;
  schedule_name: string;
  zones: unknown[];
  timetable: unknown[];
  [key: string]: unknown;
}

/** Sync Home Schedule Params */
export interface SyncHomeScheduleParams {
  home_id: string;
  schedule_id?: string;
  schedule_name?: string;
  zones?: unknown[];
  timetable?: unknown[];
}

/** Get Room Measure Params */
export interface GetRoomMeasureParams {
  home_id: string;
  room_id: string;
  scale: 'max' | '30min' | '1hour' | '3hours' | '1day' | '1week' | '1month';
  type: 'temperature' | 'sp_temperature' | 'min_temp' | 'max_temp' | 'date_min_temp';
  date_begin?: number;
  date_end?: number;
  limit?: number;
  optimize?: boolean;
  [key: string]: unknown;
}

/** Topology Data (for module name resolution) */
export interface TopologyData {
  modules?: Array<{ id: string; name: string }>;
}

// ============================================================================
// AUTH
// ============================================================================

/**
 * Get access token from refresh token
 */
async function getAccessToken(refreshToken: string): Promise<string> {
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

  const data = await response.json() as TokenResponse;

  if (!data.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

/**
 * Make authenticated API request
 */
async function makeRequest(endpoint: string, accessToken: string, options: RequestOptions = {}): Promise<NetatmoApiResponse> {
  const url = `${NETATMO_API_BASE}/api/${endpoint}`;
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    ...options.headers,
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (options.body) {
    if (method === 'POST') {
      config.headers = { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' };
      config.body = new URLSearchParams(options.body as Record<string, string>);
    } else {
      config.body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(url, config);
  const data = await response.json() as NetatmoApiResponse;

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
async function getHomesData(accessToken: string): Promise<NetatmoHome[]> {
  const data = await makeRequest('homesdata', accessToken);
  return data.body?.homes || [];
}

/**
 * Get device list - all Netatmo devices
 */
async function getDeviceList(accessToken: string): Promise<Record<string, unknown>> {
  const data = await makeRequest('devicelist', accessToken);
  return data.body || {};
}

/**
 * Get home status - real-time status of all rooms and modules
 */
async function getHomeStatus(accessToken: string, homeId: string): Promise<NetatmoHomeStatus> {
  const data = await makeRequest('homestatus', accessToken, {
    method: 'POST',
    body: { home_id: homeId },
  });
  return data.body?.home || {};
}

/**
 * Get thermostat state - specific device/module state
 */
async function getThermState(accessToken: string, deviceId: string, moduleId: string): Promise<Record<string, unknown>> {
  const data = await makeRequest('getthermstate', accessToken, {
    method: 'POST',
    body: { device_id: deviceId, module_id: moduleId },
  });
  return data.body || {};
}

/**
 * Get room measure - historical temperature data
 * Scale: max (30min), 30min, 1hour, 3hours, 1day, 1week, 1month
 * Type: temperature, sp_temperature, min_temp, max_temp, date_min_temp
 */
async function getRoomMeasure(accessToken: string, params: GetRoomMeasureParams): Promise<unknown[]> {
  const data = await makeRequest('getroommeasure', accessToken, {
    method: 'POST',
    body: params,
  });
  return (data.body as unknown as unknown[]) || [];
}

// ============================================================================
// CONTROL ENDPOINTS
// ============================================================================

/**
 * Set room temperature setpoint
 * Mode: manual, home, max, off
 * Temp: target temperature (manual mode)
 * Endtime: UNIX timestamp when to return to schedule (manual mode)
 */
async function setRoomThermpoint(accessToken: string, params: SetRoomThermpointParams): Promise<boolean> {
  // Ensure temp is a float for Netatmo API
  const normalizedParams = {
    ...params,
    temp: params.temp !== undefined ? parseFloat(params.temp.toString()) : undefined,
  };

  console.log('🌡️ Calling Netatmo setRoomThermpoint API:', normalizedParams);

  const data = await makeRequest('setroomthermpoint', accessToken, {
    method: 'POST',
    body: normalizedParams as Record<string, unknown>,
  });

  console.log('🌡️ Netatmo API response:', data);

  return data.status === 'ok';
}

/**
 * Set thermostat mode for entire home
 * Mode: schedule, away, hg (frost guard), off
 * Endtime: UNIX timestamp (for away/hg modes)
 */
async function setThermMode(accessToken: string, params: SetThermModeParams): Promise<boolean> {
  const data = await makeRequest('setthermmode', accessToken, {
    method: 'POST',
    body: params,
  });
  return data.status === 'ok';
}

/**
 * Switch home schedule
 */
async function switchHomeSchedule(accessToken: string, homeId: string, scheduleId: string): Promise<boolean> {
  const data = await makeRequest('switchhomeschedule', accessToken, {
    method: 'POST',
    body: { home_id: homeId, schedule_id: scheduleId },
  });
  return data.status === 'ok';
}

/**
 * Create new schedule
 */
async function createSchedule(accessToken: string, params: CreateScheduleParams): Promise<string | undefined> {
  const data = await makeRequest('createnewhomeschedule', accessToken, {
    method: 'POST',
    body: params,
  });
  return data.body?.schedule_id;
}

/**
 * Rename home
 */
async function renameHome(accessToken: string, homeId: string, name: string): Promise<boolean> {
  const data = await makeRequest('renamehome', accessToken, {
    method: 'POST',
    body: { home_id: homeId, name },
  });
  return data.status === 'ok';
}

/**
 * Sync home schedule - triggers valve calibration
 * This endpoint syncs the current schedule and triggers calibration on all valves
 * If schedule_id is not provided, uses the currently active schedule
 *
 * IMPORTANT:
 * - zones and timetable must be passed as JSON strings for URLSearchParams
 * - schedule_name is REQUIRED when schedule_id is provided
 */
async function syncHomeSchedule(accessToken: string, params: SyncHomeScheduleParams): Promise<boolean> {
  // Convert zones and timetable arrays to JSON strings for URLSearchParams
  const bodyParams: Record<string, string> = {
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
function parseRooms(homesData: NetatmoHome[]): ParsedRoom[] {
  if (!homesData || homesData.length === 0) return [];

  const home = homesData[0]; // Usually single home
  return (home.rooms || []).map(room => {
    const parsed: ParsedRoom = {
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
function parseModules(homesData: NetatmoHome[]): ParsedModule[] {
  if (!homesData || homesData.length === 0) return [];

  const home = homesData[0];
  return (home.modules || []).map(module => {
    const parsed: ParsedModule = {
      id: module.id,
      name: module.name,
      type: module.type,
      reachable: module.reachable ?? false,
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
function extractTemperatures(homeStatus: NetatmoHomeStatus): RoomTemperature[] {
  const rooms = homeStatus.rooms || [];
  return rooms.map(room => ({
    room_id: room.id,
    temperature: room.therm_measured_temperature,
    setpoint: room.therm_setpoint_temperature,
    mode: room.therm_setpoint_mode,
    heating: (room.heating_power_request || 0) > 0,
    endtime: room.therm_setpoint_end_time, // UNIX timestamp when manual override ends
  }));
}

/**
 * Check if valves are open in room
 */
function isHeatingActive(room: NetatmoRoom): boolean {
  return (room.heating_power_request || 0) > 0;
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
function extractModulesWithStatus(homeStatus: NetatmoHomeStatus, topology: TopologyData | null = null): ParsedModule[] {
  const modules = homeStatus.modules || [];

  return modules.map(module => {
    const parsed: ParsedModule = {
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
function getModulesWithLowBattery(modules: ParsedModule[]): ParsedModule[] {
  return modules.filter(module =>
    module.battery_state === 'low' || module.battery_state === 'very_low'
  );
}

/**
 * Check if any module has critical battery (very_low)
 */
function hasAnyCriticalBattery(modules: ParsedModule[]): boolean {
  return modules.some(module => module.battery_state === 'very_low');
}

/**
 * Check if any module has low battery (low or very_low)
 */
function hasAnyLowBattery(modules: ParsedModule[]): boolean {
  return modules.some(module =>
    module.battery_state === 'low' || module.battery_state === 'very_low'
  );
}

/**
 * Parse schedules from homesdata response
 * Extracts schedule metadata: id, name, type, selected (active), zones, timetable
 * Filters out undefined values to prevent Firebase errors
 */
function parseSchedules(homesData: NetatmoHome[]): ParsedSchedule[] {
  if (!homesData || homesData.length === 0) return [];

  const home = homesData[0]; // Usually single home

  return (home.schedules || []).map(schedule => {
    const parsed: ParsedSchedule = {
      id: schedule.id,
      name: schedule.name,
      type: schedule.type || 'therm', // 'therm', 'cooling', etc.
      selected: schedule.selected || false, // Is this the active schedule?
    };

    // Only add optional properties if they're defined
    if (schedule.zones && Array.isArray(schedule.zones)) {
      parsed.zones = schedule.zones.map(zone => {
        const zoneData: {
          id: number;
          name: string;
          type: number;
          rooms: unknown[];
          temp?: number;
          rooms_temp?: Array<{ room_id: string; temp: number }>;
        } = {
          id: zone.id,
          name: zone.name,
          type: zone.type,
          rooms: zone.rooms || [],
        };

        // Extract temperature from multi-room structure
        // Netatmo provides temps in rooms_temp array, not direct zone.temp
        if (zone.temp !== undefined) {
          // Direct temp property (legacy or single-room)
          zoneData.temp = zone.temp;
        } else if (zone.rooms_temp && Array.isArray(zone.rooms_temp) && zone.rooms_temp.length > 0) {
          // Multi-room: calculate average temperature across all rooms
          const validTemps = zone.rooms_temp
            .map(r => r.temp)
            .filter(t => t !== undefined && t !== null && !isNaN(t));
          if (validTemps.length > 0) {
            zoneData.temp = Math.round(validTemps.reduce((sum, t) => sum + t, 0) / validTemps.length * 10) / 10;
          }
          // Preserve rooms_temp for detailed view
          zoneData.rooms_temp = zone.rooms_temp;
        } else if (zone.rooms && Array.isArray(zone.rooms) && zone.rooms.length > 0) {
          // Fallback: calculate average from therm_setpoint_temperature
          const roomsWithTemp = zone.rooms as Array<{ therm_setpoint_temperature?: number }>;
          const validTemps = roomsWithTemp
            .map(r => r.therm_setpoint_temperature)
            .filter(t => t !== undefined && t !== null && !isNaN(t)) as number[];
          if (validTemps.length > 0) {
            zoneData.temp = Math.round(validTemps.reduce((sum, t) => sum + t, 0) / validTemps.length * 10) / 10;
          }
        }
        // Else: No temperature available (Away zones or unconfigured) - temp property omitted

        return zoneData;
      });
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
