/**
 * Thermorossi Proxy Client
 *
 * Convenience wrappers around the shared HA proxy client (haGet/haPost).
 * All endpoints delegate to haGet which handles auth, timeouts, and error
 * mapping via HA_API_URL and HA_API_KEY env vars.
 *
 * The proxy handles:
 *   - WiNet cloud communication
 *   - Stove state caching and data freshness tracking
 *   - Error mapping to RFC 9457 problem details
 *
 * Error handling:
 *   - RFC 9457 error responses are parsed and mapped to ApiError instances
 *   - AbortError (timeout) → ApiError(TIMEOUT)
 *   - 401 → ApiError(UNAUTHORIZED)
 *   - 503 → ApiError(SERVICE_UNAVAILABLE)
 *   - Other non-ok → ApiError(EXTERNAL_API_ERROR)
 */

import { haGet, haPost } from '@/lib/haClient';
import type {
  ThermorossiStatusResponse,
  ThermorossiPowerResponse,
  ThermorossiFanResponse,
  ThermorossiHealthResponse,
  ThermorossiHistoryResponse,
  ThermorossiCommandResponse,
} from '@/types/thermorossiProxy';

// =============================================================================
// CONVENIENCE WRAPPERS
// =============================================================================

/**
 * Get the full stove status including state, power level, fan level, and alarm info.
 * Calls GET /api/v1/thermorossi/status on the HA proxy.
 */
export async function getStatus(): Promise<ThermorossiStatusResponse> {
  return haGet<ThermorossiStatusResponse>('/api/v1/thermorossi/status');
}

/**
 * Get the current power level from the stove.
 * Calls GET /api/v1/thermorossi/power on the HA proxy.
 */
export async function getPower(): Promise<ThermorossiPowerResponse> {
  return haGet<ThermorossiPowerResponse>('/api/v1/thermorossi/power');
}

/**
 * Get the current fan level from the stove.
 * Calls GET /api/v1/thermorossi/fan-level on the HA proxy.
 */
export async function getFan(): Promise<ThermorossiFanResponse> {
  return haGet<ThermorossiFanResponse>('/api/v1/thermorossi/fan-level');
}

/**
 * Get the current health status of the Thermorossi proxy.
 * Calls GET /api/v1/thermorossi/health on the HA proxy.
 */
export async function getHealth(): Promise<ThermorossiHealthResponse> {
  return haGet<ThermorossiHealthResponse>('/api/v1/thermorossi/health');
}

/**
 * Get paginated stove history from the proxy.
 * Calls GET /api/v1/thermorossi/history on the HA proxy.
 * @param params - Optional URLSearchParams for filtering (granularity, limit, offset, from, to)
 */
export async function getHistory(params?: URLSearchParams): Promise<ThermorossiHistoryResponse> {
  const endpoint = params
    ? `/api/v1/thermorossi/history?${params.toString()}`
    : '/api/v1/thermorossi/history';
  return haGet<ThermorossiHistoryResponse>(endpoint);
}

// =============================================================================
// COMMAND WRAPPERS
// =============================================================================

/**
 * Ignite the stove.
 * Calls POST /api/v1/thermorossi/commands/ignit on the HA proxy.
 * Returns 202 Accepted with suggested_poll_delay_s.
 */
export async function sendIgnit(): Promise<ThermorossiCommandResponse> {
  return haPost<ThermorossiCommandResponse>(
    '/api/v1/thermorossi/commands/ignit',
    {}
  );
}

/**
 * Shut down the stove.
 * Calls POST /api/v1/thermorossi/commands/shutdown on the HA proxy.
 * Returns 202 Accepted with suggested_poll_delay_s.
 */
export async function sendShutdown(): Promise<ThermorossiCommandResponse> {
  return haPost<ThermorossiCommandResponse>(
    '/api/v1/thermorossi/commands/shutdown',
    {}
  );
}

/**
 * Set the stove power level.
 * Calls POST /api/v1/thermorossi/settings/power on the HA proxy.
 * @param value - Power level (range validated by proxy; 422 on out-of-range)
 */
export async function setPower(value: number): Promise<ThermorossiCommandResponse> {
  return haPost<ThermorossiCommandResponse>(
    '/api/v1/thermorossi/settings/power',
    { value }
  );
}

/**
 * Set the stove fan level.
 * Calls POST /api/v1/thermorossi/settings/fan-level on the HA proxy.
 * @param value - Fan level (range validated by proxy; 422 on out-of-range)
 */
export async function setFan(value: number): Promise<ThermorossiCommandResponse> {
  return haPost<ThermorossiCommandResponse>(
    '/api/v1/thermorossi/settings/fan-level',
    { value }
  );
}

/**
 * Set the water temperature setpoint.
 * Calls POST /api/v1/thermorossi/settings/temperature/water on the HA proxy.
 * @param value - Temperature in Celsius (range 40-80, validated by proxy; 422 on out-of-range)
 */
export async function setWaterTemp(value: number): Promise<ThermorossiCommandResponse> {
  return haPost<ThermorossiCommandResponse>(
    '/api/v1/thermorossi/settings/temperature/water',
    { value }
  );
}
