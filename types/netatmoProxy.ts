/**
 * TypeScript types for Netatmo Proxy API responses
 *
 * The Netatmo proxy handles OAuth and caching server-side.
 * These types represent the proxy's simplified response shapes.
 *
 * Proxy endpoints:
 *   GET /homestatus  — current room temperatures + heating status
 *   GET /homesdata   — home structure (rooms, modules, schedules)
 */

// =============================================================================
// DATA FRESHNESS
// =============================================================================

/**
 * Indicates how fresh the data returned by the proxy is.
 * - LIVE: fetched directly from Netatmo API right now
 * - STALE: served from proxy cache (Netatmo may be temporarily unavailable)
 * - UNREACHABLE: Netatmo API was not reachable; stale or no data
 */
export type DataFreshness = 'LIVE' | 'STALE' | 'UNREACHABLE';

// =============================================================================
// HOMESTATUS TYPES
// =============================================================================

/**
 * A single room's current measurement from the proxy /homestatus endpoint.
 * Nullable fields indicate values that may not be available.
 */
export interface NetatmoProxyRoomMeasurement {
  home_id: string;
  room_id: string;
  room_name: string | null;
  temperature: number | null;
  therm_setpoint_temperature: number | null;
  heating_power_request: number | null;
  timestamp: number;
}

/**
 * Full response from proxy GET /homestatus
 */
export interface NetatmoProxyHomestatusResponse {
  rooms: NetatmoProxyRoomMeasurement[];
  data_freshness: DataFreshness;
}

// =============================================================================
// HOMESDATA TYPES
// =============================================================================

/**
 * A room as returned in the proxy /homesdata response.
 */
export interface NetatmoProxyRoom {
  id: string;
  name: string;
  type: string;
  module_ids: string[];
}

/**
 * A module (thermostat, valve, etc.) as returned in proxy /homesdata.
 */
export interface NetatmoProxyModule {
  id: string;
  type: string;
  name: string;
  room_id: string;
  setup_date: number;
  firmware_revision: number;
  battery_level: string;
}

/**
 * A schedule entry in the timetable (opaque object — proxy passes through as-is).
 */
export type NetatmoProxyTimetableEntry = Record<string, unknown>;

/**
 * A heating schedule associated with a home.
 */
export interface NetatmoProxySchedule {
  id: string;
  name: string;
  selected: boolean;
  type: string;
  timetable: NetatmoProxyTimetableEntry[];
}

/**
 * A home as returned by the proxy /homesdata endpoint.
 * Optional fields (altitude, coordinates, country, timezone) may not always be present.
 */
export interface NetatmoProxyHome {
  id: string;
  name: string;
  rooms: NetatmoProxyRoom[];
  modules: NetatmoProxyModule[];
  schedules: NetatmoProxySchedule[];
  altitude?: number;
  coordinates?: { lat: number; lon: number };
  country?: string;
  timezone?: string;
}

/**
 * Full response from proxy GET /homesdata
 * Mirrors the Netatmo API envelope structure.
 */
export interface NetatmoProxyHomesdataResponse {
  body: {
    homes: NetatmoProxyHome[];
  };
  status: string;
  time_exec: number;
  time_server: number;
}

// =============================================================================
// RFC 9457 ERROR SHAPE
// =============================================================================

/**
 * RFC 9457 "Problem Details for HTTP APIs" error format.
 * The proxy returns this shape on 4xx/5xx responses.
 *
 * @see https://www.rfc-editor.org/rfc/rfc9457
 */
export interface RFC9457ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

// =============================================================================
// CONTROL ENDPOINT TYPES
// =============================================================================

/** POST /setroomthermpoint request body */
export interface SetRoomThermpointRequest {
  home_id: string;
  room_id: string;
  mode: 'manual' | 'home';
  temp?: number;      // Required when mode is 'manual'; range 5.0–30.0
  endtime?: number;   // Unix timestamp when mode expires
}

/** POST /setthermmode request body */
export interface SetThermmodeRequest {
  home_id: string;
  mode: 'schedule' | 'away' | 'hg';
  endtime?: number;
}

/** POST /setthermmode response */
export interface SetThermmodeResponse {
  status: string;
  confirmed_mode: string | null;  // null if read-back confirmation failed
  netatmo_response: Record<string, unknown>;
}

/** POST /switchhomeschedule request body */
export interface SwitchHomeScheduleRequest {
  home_id: string;
  schedule_id: string;
}

/**
 * Generic proxy control response.
 * Returned by setroomthermpoint, switchhomeschedule, synchomeschedule, createnewhomeschedule.
 */
export interface ProxyControlResponse {
  status: string;
  time_exec: number;
  time_server: number;
}

// =============================================================================
// ROOM MEASURE TYPES
// =============================================================================

/** Raw measurement item (scale=max or scale=30min) */
export interface NetatmoRawMeasurement {
  home_id: string; room_id: string; room_name: string | null;
  temperature: number | null; therm_setpoint_temperature: number | null;
  heating_power_request: number | null; timestamp: number;
}

/** Hourly aggregation item (scale=1hour) */
export interface NetatmoHourlyMeasurement {
  home_id: string; room_id: string; room_name: string | null;
  avg_temperature: number | null; min_temperature: number | null;
  max_temperature: number | null; avg_heating_power: number | null;
  sample_count: number; hour_timestamp: number;
}

/** Daily aggregation item (scale=1day) */
export interface NetatmoDailyMeasurement {
  home_id: string; room_id: string; room_name: string | null;
  avg_temperature: number | null; min_temperature: number | null;
  max_temperature: number | null; avg_heating_power: number | null;
  sample_count: number; day_timestamp: number;
}

export type NetatmoMeasurement = NetatmoRawMeasurement | NetatmoHourlyMeasurement | NetatmoDailyMeasurement;

/** Paginated response from GET /getroommeasure */
export interface RoomMeasureResponse {
  items: NetatmoMeasurement[];
  total: number;
  limit: number;
  offset: number;
}
