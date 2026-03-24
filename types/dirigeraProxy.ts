/**
 * TypeScript types for DIRIGERA Proxy API responses.
 *
 * The proxy handles IKEA DIRIGERA hub communication and sensor data caching
 * server-side. These types represent the proxy's response shapes.
 *
 * See docs/api/dirigera.md for the authoritative spec.
 *
 * Organized by phase:
 *   - Phase 130 types: actively used (health, sensors, contact, motion, summary)
 *   - Future-phase types: defined now per D-05, routes deferred
 *     - DIRIG-F01: history
 *     - DIRIG-F02: stats
 *     - DIRIG-F03: telemetry
 */

// =============================================================================
// DATA FRESHNESS
// =============================================================================

/**
 * Indicates how fresh the sensor data returned by the DIRIGERA proxy is.
 * - LIVE: sensor is reachable and last seen within 5 minutes
 * - STALE: sensor is reachable but last seen > 5 minutes ago, or last_seen is null
 * - UNREACHABLE: sensor is not reachable
 * @note Unlike SonosDataFreshness (2-state), DIRIGERA is 3-state per D-08
 */
export type DirigeraDataFreshness = 'LIVE' | 'STALE' | 'UNREACHABLE';

// =============================================================================
// PHASE 130 TYPES (actively used)
// =============================================================================

// Source: docs/api/dirigera.md — DirigeraHealthResponse
export interface DirigeraHealthResponse {
  firmware_version: string;
  connected_sensors: number;
  is_reachable: boolean;
}

// Source: docs/api/dirigera.md — DirigeraSensor
export interface DirigeraSensor {
  id: string;
  type: 'openCloseSensor' | 'occupancySensor' | string;
  custom_name: string;
  room: string | null;
  firmware_version: string | null;
  battery_percentage: number | null;
  is_reachable: boolean;
  is_open: boolean | null;    // null for motion sensors
  last_seen: string | null;   // ISO 8601 timestamp
}

// Source: docs/api/dirigera.md — DirigeraSensorsResponse
export interface DirigeraSensorsResponse {
  sensors: DirigeraSensor[];
  count: number;
  is_stale: boolean;
}

// Source: docs/api/dirigera.md — ContactSensor
export interface ContactSensor extends DirigeraSensor {
  data_freshness: DirigeraDataFreshness;
  is_open: boolean;   // narrowed: never null for contact sensors
}

// Source: docs/api/dirigera.md — ContactSensorsResponse
export interface ContactSensorsResponse {
  sensors: ContactSensor[];
  count: number;
  is_stale: boolean;
}

// Source: docs/api/dirigera.md — MotionSensor
export interface MotionSensor extends DirigeraSensor {
  light_level: number | null;   // companion lightSensor illuminance, merged by room
  data_freshness: DirigeraDataFreshness;
}

// Source: docs/api/dirigera.md — MotionSensorsResponse
export interface MotionSensorsResponse {
  sensors: MotionSensor[];
  count: number;
  is_stale: boolean;
}

// Source: docs/api/dirigera.md — SensorSummaryResponse
export interface SensorSummaryResponse {
  total_sensors: number;
  open_count: number;         // Contact sensors currently open
  offline_count: number;      // Sensors where is_reachable is false
  low_battery_count: number;  // Sensors with battery_percentage <= 20
  is_stale: boolean;
}

// =============================================================================
// FUTURE-PHASE TYPES (defined now per D-05, routes deferred)
// =============================================================================

// --- DIRIG-F01: history ---

// Source: docs/api/dirigera.md — SensorEvent
export interface SensorEvent {
  id: number;
  sensor_id: string;
  sensor_name: string | null;
  event_type: 'open' | 'close' | 'motion_detected' | 'motion_cleared' | string;
  recorded_at: number;   // Unix timestamp (seconds)
}

// Source: docs/api/dirigera.md — SensorHistoryResponse
export interface SensorHistoryResponse {
  events: SensorEvent[];
  total: number;
  limit: number;
  offset: number;
}

// --- DIRIG-F02: stats ---

// Source: docs/api/dirigera.md — AggregationStats
export interface AggregationStats {
  last_run_at: number | null;
  last_run_status: string | null;
  rows_aggregated_last_run: number;
  total_runs: number;
  total_rows_aggregated: number;
}

// Source: docs/api/dirigera.md — RetentionStats
export interface RetentionStats {
  last_run_at: number | null;
  last_run_status: string | null;
  rows_deleted_last_run: number;
  total_runs: number;
  total_rows_deleted: number;
}

// Source: docs/api/dirigera.md — DirigeraStatsResponse
export interface DirigeraStatsResponse {
  aggregation: AggregationStats;
  retention: RetentionStats;
}

// --- DIRIG-F03: telemetry ---

// Source: docs/api/dirigera.md — SensorTelemetryReading
export interface SensorTelemetryReading {
  id: number;
  sensor_id: string;
  battery_percentage: number | null;
  light_level: number | null;
  timestamp: number;   // Unix timestamp (seconds)
}

// Source: docs/api/dirigera.md — SensorTelemetryResponse
export interface SensorTelemetryResponse {
  telemetry: SensorTelemetryReading[];
  total: number;
  limit: number;
  offset: number;
}
