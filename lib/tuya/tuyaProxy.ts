/**
 * Tuya Proxy Client
 *
 * Convenience wrappers around the shared HA proxy client (haGet/haPost).
 * All endpoints delegate to haGet/haPost which handle auth, timeouts, and error
 * mapping via HA_API_URL and HA_API_KEY env vars.
 *
 * Tuya smart plugs are polled every 30 seconds server-side via tinytuya LAN TCP.
 * Command endpoints (setState, setTimer) return TuyaPlugMutation with the
 * confirmed post-command state (200 pass-through, no 202 Accepted).
 *
 * Error handling:
 *   - RFC 9457 error responses are propagated directly (no wrapping)
 *   - AbortError (timeout) → ApiError(TIMEOUT)
 *   - 401 → ApiError(UNAUTHORIZED)
 *   - 503 → ApiError(SERVICE_UNAVAILABLE)
 *   - Other non-ok → ApiError(EXTERNAL_API_ERROR)
 *
 * See docs/api/tuya.md for the authoritative spec.
 */

import { haGet, haPost } from '@/lib/haClient';
import type {
  TuyaHealth,
  TuyaPlug,
  TuyaPlugMutation,
  TuyaHistoryResponse,
  TuyaSetStateRequest,
  TuyaSetTimerRequest,
} from '@/types/tuyaProxy';

// =============================================================================
// HEALTH
// =============================================================================

/** Get Tuya proxy health status and per-device freshness overview. */
export async function getHealth(): Promise<TuyaHealth> {
  return haGet<TuyaHealth>('/api/v1/tuya/health');
}

// =============================================================================
// PLUGS (READ)
// =============================================================================

/** Get all known Tuya smart plugs with current state and telemetry. */
export async function getPlugs(): Promise<TuyaPlug[]> {
  return haGet<TuyaPlug[]>('/api/v1/tuya/plugs');
}

/**
 * Get a single Tuya smart plug by device ID.
 *
 * @param deviceId - Tuya local device ID (e.g. 'bf123abc...')
 */
export async function getPlug(deviceId: string): Promise<TuyaPlug> {
  return haGet<TuyaPlug>(`/api/v1/tuya/plugs/${deviceId}`);
}

// =============================================================================
// PLUGS (COMMANDS)
// =============================================================================

/**
 * Set on/off state of a Tuya smart plug.
 * Returns TuyaPlugMutation with data_confirmed=true if re-poll succeeded.
 *
 * @param deviceId - Tuya local device ID
 * @param body     - { on: boolean }
 */
export async function setState(
  deviceId: string,
  body: TuyaSetStateRequest
): Promise<TuyaPlugMutation> {
  return haPost<TuyaPlugMutation>(
    `/api/v1/tuya/plugs/${deviceId}/state`,
    body as unknown as Record<string, unknown>
  );
}

/**
 * Set a countdown timer on a Tuya smart plug.
 * Pass seconds=0 to cancel an active timer.
 * Returns TuyaPlugMutation with data_confirmed=true if re-poll succeeded.
 *
 * @param deviceId - Tuya local device ID
 * @param body     - { seconds: number } (0–86400)
 */
export async function setTimer(
  deviceId: string,
  body: TuyaSetTimerRequest
): Promise<TuyaPlugMutation> {
  return haPost<TuyaPlugMutation>(
    `/api/v1/tuya/plugs/${deviceId}/timer`,
    body as unknown as Record<string, unknown>
  );
}

// =============================================================================
// HISTORY
// =============================================================================

/**
 * Get telemetry history for a Tuya smart plug.
 * Optional query parameters filter by time period and control pagination.
 * Undefined params are omitted from the query string.
 *
 * @param deviceId - Tuya local device ID
 * @param params   - Optional filters: period, from, to, page, page_size
 */
export async function getHistory(
  deviceId: string,
  params: {
    period?: string;
    from?: string;
    to?: string;
    page?: string;
    page_size?: string;
  }
): Promise<TuyaHistoryResponse> {
  const defined = Object.entries(params).filter(
    (entry): entry is [string, string] => entry[1] !== undefined
  );
  const qs =
    defined.length > 0
      ? '?' + new URLSearchParams(defined).toString()
      : '';
  return haGet<TuyaHistoryResponse>(
    `/api/v1/tuya/plugs/${deviceId}/history${qs}`
  );
}
