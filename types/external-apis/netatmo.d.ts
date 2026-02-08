/**
 * Netatmo Energy & Security API Type Definitions
 *
 * Complete type definitions for Netatmo Smart Home APIs
 * Based on: https://dev.netatmo.com/apidocumentation
 *
 * These types cover all properties accessed in the codebase.
 */

/** Netatmo Device (Thermostat or NAPlug) */
export interface NetatmoDevice {
  _id: string;
  type: string;
  module_name: string;
  setup_date?: number;
  last_setup?: number;
  last_status_store?: number;
  firmware: number;
  last_upgrade?: number;
  wifi_status?: number;
  reachable?: boolean;
  co2_calibrating?: boolean;
  station_name?: string;
  data_type?: string[];
  place?: {
    altitude?: number;
    city?: string;
    country?: string;
    timezone?: string;
    location?: number[];
  };
  dashboard_data?: {
    time_utc?: number;
    Temperature?: number;
    Humidity?: number;
    CO2?: number;
    Noise?: number;
    Pressure?: number;
    AbsolutePressure?: number;
    min_temp?: number;
    max_temp?: number;
    date_min_temp?: number;
    date_max_temp?: number;
    temp_trend?: string;
    pressure_trend?: string;
  };
  modules?: NetatmoModule[];
}

/** Netatmo Module (Valve, Relay, or Sensor) */
export interface NetatmoModule {
  _id: string;
  type: string;
  module_name: string;
  data_type?: string[];
  last_setup?: number;
  last_message?: number;
  last_seen?: number;
  firmware?: number;
  last_upgrade?: number;
  battery_vp?: number;
  battery_percent?: number;
  rf_status?: number;
  wifi_strength?: number;
  battery_state?: string;
  reachable?: boolean;
  dashboard_data?: {
    time_utc?: number;
    Temperature?: number;
    Humidity?: number;
    CO2?: number;
    min_temp?: number;
    max_temp?: number;
    date_min_temp?: number;
    date_max_temp?: number;
  };
}

/** Netatmo Home (Energy API) */
export interface NetatmoHome {
  id: string;
  name: string;
  altitude?: number;
  coordinates?: number[];
  country?: string;
  timezone?: string;
  rooms?: NetatmoRoom[];
  modules?: NetatmoModule[];
  schedules?: NetatmoSchedule[];
  therm_schedules?: NetatmoSchedule[];
  therm_setpoint_default_duration?: number;
  therm_mode?: string;
}

/** Netatmo Room (Energy API) */
export interface NetatmoRoom {
  id: string;
  name: string;
  type: string;
  module_ids?: string[];
  therm_setpoint_temperature?: number;
  therm_measured_temperature?: number;
  therm_setpoint_mode?: string;
  therm_setpoint_start_time?: number;
  therm_setpoint_end_time?: number;
  heating_power_request?: number;
  anticipating?: boolean;
  open_window?: boolean;
  reachable?: boolean;
}

/** Netatmo Schedule (Energy API) */
export interface NetatmoSchedule {
  id: string;
  name: string;
  type: string;
  default?: boolean;
  selected?: boolean;
  away_temp?: number;
  hg_temp?: number;
  timetable?: NetatmoTimetableSlot[];
  zones?: NetatmoZone[];
}

/** Netatmo Schedule Zone */
export interface NetatmoZone {
  id: number;
  name: string;
  type: number;
  temp?: number;
  rooms?: Array<{
    id: string;
    therm_setpoint_temp?: number;
  }>;
  rooms_temp?: Array<{
    room_id: string;
    temp: number;
  }>;
}

/** Netatmo Timetable Slot */
export interface NetatmoTimetableSlot {
  m_offset: number;
  zone_id: number;
  id?: number;
}

/** Netatmo Home Status (Energy API) */
export interface NetatmoHomeStatus {
  rooms?: NetatmoRoom[];
  modules?: Array<{
    id: string;
    type: string;
    name?: string;
    bridge?: string;
    reachable?: boolean;
    rf_strength?: number;
    wifi_strength?: number;
    battery_level?: number;
    battery_state?: string;
    boiler_valve_comfort_boost?: boolean;
    boiler_status?: boolean;
    anticipating?: boolean;
  }>;
}

/** Netatmo Homes Data (wrapper) */
export interface NetatmoHomesData {
  homes: NetatmoHome[];
  user?: {
    email: string;
    language: string;
    locale: string;
    feel_like_algorithm?: number;
    unit_pressure?: number;
    unit_system?: number;
    unit_wind?: number;
  };
}

/** Netatmo API Response (generic) */
export interface NetatmoApiResponse<T = unknown> {
  body: T;
  status: string;
  time_exec?: number;
  time_server?: number;
}

/** Netatmo OAuth Token Response */
export interface NetatmoTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expire_in?: number; // API inconsistency
  scope: string[];
}

/** Parsed Room (cleaned for Firebase) */
export interface ParsedRoom {
  id: string;
  name: string;
  type: string;
  modules: string[];
  setpoint?: number;
  temperature?: number;
  mode?: string;
  heating?: boolean;
  endtime?: number;
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
    rooms_temp?: Array<{
      room_id: string;
      temp: number;
    }>;
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
