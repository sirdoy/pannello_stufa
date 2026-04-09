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

// =============================================================================
// CAMERA TYPES
// =============================================================================

/**
 * A single camera device from the proxy /camera/status endpoint.
 * All fields except camera_id are nullable — values may be absent if the
 * camera has never reported or is offline.
 */
export interface CameraStatus {
  camera_id: string;
  name: string | null;
  device_type: string | null;   // e.g. "NOC" (Presence), "NACamera" (Welcome)
  status: string | null;        // "on" | "off"
  sd_status: string | null;     // "on" | "off"
  alim_status: string | null;   // "on" | "off"
  firmware: string | null;
  is_local: boolean | null;
}

/**
 * Full response from proxy GET /camera/status
 */
export interface CameraStatusResponse {
  cameras: CameraStatus[];
  data_freshness: DataFreshness;
}

/**
 * HLS stream URL set (high, medium, low quality levels).
 */
export interface StreamUrls {
  high: string;
  medium: string;
  low: string;
}

/**
 * Response from proxy GET /camera/{camera_id}/stream
 * VPN stream URLs expire every 3 hours; local_streams only present when is_local=true.
 */
export interface CameraStreamResponse {
  camera_id: string;
  vpn_streams: StreamUrls;
  is_local: boolean;
  local_streams?: StreamUrls;
}

/**
 * Response from proxy GET /camera/{camera_id}/snapshot
 * Returns a URL, not binary data.
 */
export interface CameraSnapshotUrlResponse {
  camera_id: string;
  snapshot_url: string;
}

/**
 * Request body for POST /camera/{camera_id}/monitoring
 */
export interface SetMonitoringRequest {
  monitoring: 'on' | 'off';
}

/**
 * Response from proxy POST /camera/{camera_id}/monitoring
 */
export interface SetMonitoringResponse {
  camera_id: string;
  monitoring: 'on' | 'off';
  status: 'applied';
}

/**
 * A single camera event from the proxy /camera/events endpoint.
 * Uses proxy field names (event_id, event_type, timestamp) — not old Netatmo API field names.
 */
export interface CameraEvent {
  event_id: string;
  camera_id: string;
  event_type: 'movement' | 'person' | 'sound';  // other values may appear for future camera types
  timestamp: number;         // Unix timestamp
  message: string | null;
  snapshot_url: string | null;
  person_id: string | null;
}

/**
 * Full response from proxy GET /camera/events
 */
export interface CameraEventsResponse {
  events: CameraEvent[];
  count: number;
}

// =============================================================================
// VALVE TYPES
// =============================================================================

/**
 * A single valve module with battery, signal, and calibration state.
 * All fields except module_id are nullable — values may be absent if the
 * valve has never reported or is offline.
 */
export interface ValveStatus {
  module_id: string;
  module_name: string | null;
  room_id: string | null;
  room_name: string | null;
  battery_level: string | null;   // "high" | "medium" | "low" | "very_low"
  rf_strength: number | null;
  reachable: boolean | null;
  calibrating: boolean | null;
}

/**
 * Full response from proxy GET /valves
 */
export interface ValveStatusResponse {
  valves: ValveStatus[];
  data_freshness: DataFreshness;
}

/**
 * Result for a single valve in a batch calibration operation.
 */
export interface CalibrateBatchResult {
  module_id: string;
  status: 'accepted' | 'error';
  error?: string;
}

/**
 * Full response from proxy POST /valves/calibrate
 * The proxy triggers calibration on all valves simultaneously.
 */
export interface CalibrateBatchResponse {
  status: 'accepted';
  results: CalibrateBatchResult[];
  poll_endpoint: string;
}

// =============================================================================
// HEALTH TYPES
// =============================================================================

/**
 * Health status response from proxy GET /health endpoint.
 * Provides token lifecycle status, rate limit usage, and data freshness metrics.
 */
export interface NetatmoHealthResponse {
  token_status: 'valid' | 'expiring' | 'expired';
  expires_at: number;
  last_refresh_at: number | null;
  consecutive_failures: number;
  last_error: string | null;
  provider_status: 'ok' | 'degraded' | 'down';
  data_freshness: DataFreshness;
  token_source: 'sqlite' | 'secrets_toml';
  requests_this_hour: number;
  rate_limit_ceiling: number;
  last_poll_at: number | null;
}

// =============================================================================
// THERMSTATE TYPES
// =============================================================================

/** GET /getthermstate response */
interface NetatmoSetpoint {
  setpoint_mode: string;
  setpoint_temp: number | null;
  setpoint_endtime: number | null;
}
interface NetatmoThermProgram {
  program_id: string;
  name: string;
  selected: number;
  timetable: Record<string, unknown>[];
}
export interface NetatmoThermstateResponse {
  body: {
    status: string;
    setpoint: NetatmoSetpoint;
    therm_program_list: NetatmoThermProgram[];
    device_id: string;
  };
  status: string;
  time_exec: number;
  time_server: number;
}

// =============================================================================
// RENAME HOME TYPES
// =============================================================================

/** POST /renamehome request body */
export interface RenameHomeRequest {
  home_id: string;
  name: string;
}

// =============================================================================
// GETHOMEDATA TYPES
// =============================================================================

/** GET /gethomedata response */
export interface NetatmoHomedataResponse {
  body: {
    homes: Array<{
      id: string;
      cameras: Record<string, unknown>[];
      smokedetectors: Record<string, unknown>[];
      persons: Record<string, unknown>[];
    }>;
    global_info: Record<string, unknown>;
  };
  status: string;
  time_exec: number;
  time_server: number;
}

// =============================================================================
// CALIBRATE VALVE TYPES
// =============================================================================

/** POST /valves/{module_id}/calibrate response */
export interface CalibrateValveResponse {
  status: 'accepted';
  module_id: string;
  poll_endpoint: string;
}
