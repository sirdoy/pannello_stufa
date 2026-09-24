/**
 * TypeScript types for Thermorossi Proxy API responses.
 *
 * The proxy handles WiNet cloud communication and caching server-side.
 * These types represent the proxy's response shapes.
 *
 * See docs/api/thermorossi.md for the authoritative spec.
 */

// =============================================================================
// DATA FRESHNESS & STATE
// =============================================================================

/**
 * Represents the operational state of the Thermorossi stove.
 */
// 'unknown' only in mutation responses when nothing is cached yet (backend fallback).
export type StoveState = 'off' | 'igniting' | 'working' | 'standby' | 'cleaning' | 'alarm' | 'modulating' | 'unknown';

/**
 * Indicates how fresh the data returned by the proxy is.
 * - LIVE: fetched directly from WiNet cloud right now
 * - STALE: served from proxy cache (WiNet may be temporarily unavailable)
 * @note UNREACHABLE triggers HTTP 503 — never appears in response body
 */
export type DataFreshness = 'LIVE' | 'STALE';

// =============================================================================
// STATUS TYPES
// =============================================================================

/**
 * Full response from proxy GET /api/v1/thermorossi/status.
 * Returns the current stove state including power level, fan level, and freshness.
 * Alarm fields are only populated when stove_state === 'alarm'.
 */
export interface ThermorossiStatusResponse {
  stove_state: StoveState;
  power_level: number | null;       // 1-5
  fan_level: number | null;         // 1-6
  data_freshness: DataFreshness;
  last_poll_at: string | null;      // ISO 8601
  error_code: number | null;        // only when stove_state === 'alarm'
  error_description: string | null; // only when stove_state === 'alarm'
  custom_name?: string | null;      // registry override for device display name
  device_type?: string | null;      // registry device type slug
}

// =============================================================================
// POWER & FAN TYPES
// =============================================================================

/**
 * Response from proxy GET /api/v1/thermorossi/power.
 * Returns only the current power level and freshness metadata.
 */
export interface ThermorossiPowerResponse {
  power_level: number | null;       // 1-5
  data_freshness: DataFreshness;
  last_poll_at: string | null;
}

/**
 * Response from proxy GET /api/v1/thermorossi/fan-level.
 * Returns only the current fan level and freshness metadata.
 */
export interface ThermorossiFanResponse {
  fan_level: number | null;         // 1-6
  data_freshness: DataFreshness;
  last_poll_at: string | null;
}

// =============================================================================
// HEALTH TYPES
// =============================================================================

/**
 * Response from proxy GET /api/v1/thermorossi/health.
 * Returns the proxy health status and data freshness.
 */
export interface ThermorossiHealthResponse {
  status: 'ok' | 'degraded';
  data_freshness: DataFreshness;
  last_poll_at: string | null;
}

// =============================================================================
// COMMAND TYPES
// =============================================================================

/**
 * Response from backend POST /api/v1/thermorossi/{commands,settings}/* endpoints
 * (ThermorossiMutationResponse): HTTP 200 with the full status after a re-poll.
 * data_confirmed=false → re-poll failed, fields come from the last cached status.
 */
export interface ThermorossiMutationResponse extends ThermorossiStatusResponse {
  data_confirmed: boolean;
}

/**
 * Command response as consumed by the UI. `suggested_poll_delay_s` only exists on
 * the legacy 202 contract (pre-mutation-response backends) and is optional.
 */
export type ThermorossiCommandResponse = ThermorossiMutationResponse & {
  suggested_poll_delay_s?: number;
};

// =============================================================================
// HISTORY TYPES
// =============================================================================

/**
 * A single data point from proxy GET /api/v1/thermorossi/history.
 * Aggregation fields (avg_*, min_*, max_*, working_minutes, sample_count) are
 * null for raw granularity and populated for hourly/daily granularity.
 */
export interface ThermorossiHistoryItem {
  timestamp: number;
  stove_state: string | null;
  power_level: number | null;
  fan_level: number | null;
  avg_power_level: number | null;
  min_power_level: number | null;
  max_power_level: number | null;
  avg_fan_level: number | null;
  min_fan_level: number | null;
  max_fan_level: number | null;
  working_minutes: number | null;
  sample_count: number | null;
}

/**
 * Paginated response from proxy GET /api/v1/thermorossi/history.
 */
export interface ThermorossiHistoryResponse {
  items: ThermorossiHistoryItem[];
  total_count: number;
  limit: number;
  offset: number;
  granularity: 'raw' | 'hourly' | 'daily';
}
