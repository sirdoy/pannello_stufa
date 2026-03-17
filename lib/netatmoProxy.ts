/**
 * Netatmo Proxy Client
 *
 * Convenience wrappers around the shared HA proxy client (haGet/haPost).
 * All JSON endpoints delegate to haGet/haPost which handle auth, timeouts,
 * and error mapping via HA_API_URL and HA_API_KEY env vars.
 *
 * The proxy handles:
 *   - Netatmo OAuth token lifecycle
 *   - Rate limiting and caching
 *   - Data freshness tracking
 *
 * Binary endpoint (getProxyCameraEventSnapshot) reads HA_API_URL and
 * HA_API_KEY directly for streaming response support.
 *
 * Error handling:
 *   - RFC 9457 error responses are parsed and mapped to ApiError instances
 *   - AbortError (timeout) → ApiError(TIMEOUT)
 *   - 401 → ApiError(UNAUTHORIZED)
 *   - 503 → ApiError(SERVICE_UNAVAILABLE)
 *   - Other non-ok → ApiError(EXTERNAL_API_ERROR)
 */

import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';
import { haGet, haPost } from '@/lib/haClient';
import type {
  NetatmoProxyHomestatusResponse,
  NetatmoProxyHomesdataResponse,
  SetRoomThermpointRequest,
  SetThermmodeRequest,
  SetThermmodeResponse,
  SwitchHomeScheduleRequest,
  ProxyControlResponse,
  CameraStatusResponse,
  CameraStreamResponse,
  CameraSnapshotUrlResponse,
  SetMonitoringRequest,
  SetMonitoringResponse,
  CameraEventsResponse,
  ValveStatusResponse,
  CalibrateBatchResponse,
  NetatmoHealthResponse,
  RoomMeasureResponse,
} from '@/types/netatmoProxy';

const DEFAULT_TIMEOUT_MS = 15_000;

// =============================================================================
// CONVENIENCE WRAPPERS
// =============================================================================

/**
 * Get current room temperatures and heating status from the proxy.
 * Calls GET /api/v1/netatmo/homestatus on the HA proxy.
 */
export async function getProxyHomestatus(): Promise<NetatmoProxyHomestatusResponse> {
  return haGet<NetatmoProxyHomestatusResponse>('/api/v1/netatmo/homestatus');
}

/**
 * Get home structure (rooms, modules, schedules) from the proxy.
 * Calls GET /api/v1/netatmo/homesdata on the HA proxy.
 */
export async function getProxyHomesdata(): Promise<NetatmoProxyHomesdataResponse> {
  return haGet<NetatmoProxyHomesdataResponse>('/api/v1/netatmo/homesdata');
}

/**
 * Set room thermostat setpoint (manual or home mode).
 * Calls POST /api/v1/netatmo/setroomthermpoint on the HA proxy.
 */
export async function proxySetRoomThermpoint(
  body: SetRoomThermpointRequest
): Promise<ProxyControlResponse> {
  return haPost<ProxyControlResponse>('/api/v1/netatmo/setroomthermpoint', body as unknown as Record<string, unknown>);
}

/**
 * Set the home thermostat mode (schedule, away, or hg/frost-guard).
 * Calls POST /api/v1/netatmo/setthermmode on the HA proxy.
 */
export async function proxySetThermMode(
  body: SetThermmodeRequest
): Promise<SetThermmodeResponse> {
  return haPost<SetThermmodeResponse>('/api/v1/netatmo/setthermmode', body as unknown as Record<string, unknown>);
}

/**
 * Switch the active heating schedule for a home.
 * Calls POST /api/v1/netatmo/switchhomeschedule on the HA proxy.
 */
export async function proxySwitchHomeSchedule(
  body: SwitchHomeScheduleRequest
): Promise<ProxyControlResponse> {
  return haPost<ProxyControlResponse>('/api/v1/netatmo/switchhomeschedule', body as unknown as Record<string, unknown>);
}

/**
 * Sync a home schedule definition to Netatmo.
 * Calls POST /api/v1/netatmo/synchomeschedule on the HA proxy.
 * Body is passed through as-is; home_id is required.
 */
export async function proxySyncHomeSchedule(
  body: Record<string, unknown>
): Promise<ProxyControlResponse> {
  return haPost<ProxyControlResponse>('/api/v1/netatmo/synchomeschedule', body);
}

/**
 * Create a new home schedule on Netatmo.
 * Calls POST /api/v1/netatmo/createnewhomeschedule on the HA proxy.
 * Body is passed through as-is; home_id is required.
 */
export async function proxyCreateNewHomeSchedule(
  body: Record<string, unknown>
): Promise<ProxyControlResponse> {
  return haPost<ProxyControlResponse>('/api/v1/netatmo/createnewhomeschedule', body);
}

// =============================================================================
// CAMERA WRAPPERS
// =============================================================================

/**
 * Get all camera devices with status, SD card state, and firmware version.
 * Calls GET /api/v1/netatmo/camera/status on the HA proxy.
 */
export async function getProxyCameraStatus(): Promise<CameraStatusResponse> {
  return haGet<CameraStatusResponse>('/api/v1/netatmo/camera/status');
}

/**
 * Get HLS stream URLs for a specific camera.
 * Calls GET /api/v1/netatmo/camera/{cameraId}/stream on the HA proxy.
 * VPN URLs expire every 3 hours — do not cache client-side.
 */
export async function getProxyCameraStream(cameraId: string): Promise<CameraStreamResponse> {
  return haGet<CameraStreamResponse>(`/api/v1/netatmo/camera/${cameraId}/stream`);
}

/**
 * Get the current snapshot URL for a camera (returns URL, not binary data).
 * Calls GET /api/v1/netatmo/camera/{cameraId}/snapshot on the HA proxy.
 */
export async function getProxyCameraSnapshot(cameraId: string): Promise<CameraSnapshotUrlResponse> {
  return haGet<CameraSnapshotUrlResponse>(`/api/v1/netatmo/camera/${cameraId}/snapshot`);
}

/**
 * Toggle monitoring on or off for a specific camera.
 * Calls POST /api/v1/netatmo/camera/{cameraId}/monitoring on the HA proxy.
 */
export async function proxySetCameraMonitoring(
  cameraId: string,
  body: SetMonitoringRequest
): Promise<SetMonitoringResponse> {
  return haPost<SetMonitoringResponse>(
    `/api/v1/netatmo/camera/${cameraId}/monitoring`,
    body as unknown as Record<string, unknown>
  );
}

/**
 * Get a timeline of camera events from the proxy (served from local SQLite).
 * Calls GET /api/v1/netatmo/camera/events on the HA proxy.
 * @param hours - Optional hours of history to return (1–168, default 24 server-side)
 */
export async function getProxyCameraEvents(hours?: number): Promise<CameraEventsResponse> {
  const endpoint = hours !== undefined ? `/api/v1/netatmo/camera/events?hours=${hours}` : '/api/v1/netatmo/camera/events';
  return haGet<CameraEventsResponse>(endpoint);
}

// =============================================================================
// VALVE WRAPPERS
// =============================================================================

/**
 * Get all valve modules with battery level, RF signal, reachability, and calibration state.
 * Calls GET /api/v1/netatmo/valves on the HA proxy.
 */
export async function getProxyValves(): Promise<ValveStatusResponse> {
  return haGet<ValveStatusResponse>('/api/v1/netatmo/valves');
}

/**
 * Trigger calibration on all valves simultaneously.
 * Calls POST /api/v1/netatmo/valves/calibrate on the HA proxy with an empty body.
 * The proxy handles calibration natively — no schedule-switching workaround needed.
 */
export async function proxyCalibrateValves(): Promise<CalibrateBatchResponse> {
  return haPost<CalibrateBatchResponse>('/api/v1/netatmo/valves/calibrate', {});
}

// =============================================================================
// HEALTH WRAPPERS
// =============================================================================

/**
 * Get the current health status of the Netatmo proxy.
 * Calls GET /api/v1/netatmo/health on the HA proxy.
 * Returns token lifecycle status, rate limit usage, and data freshness.
 */
export async function getProxyHealth(): Promise<NetatmoHealthResponse> {
  return haGet<NetatmoHealthResponse>('/api/v1/netatmo/health');
}

// =============================================================================
// MEASURE WRAPPERS
// =============================================================================

/**
 * Get room measurement data from the proxy.
 * Calls GET /api/v1/netatmo/getroommeasure with query params on the HA proxy.
 */
export async function getProxyRoomMeasure(params: URLSearchParams): Promise<RoomMeasureResponse> {
  return haGet<RoomMeasureResponse>(`/api/v1/netatmo/getroommeasure?${params.toString()}`);
}

// =============================================================================
// BINARY ENDPOINT
// =============================================================================

/**
 * Get a binary JPEG snapshot for a specific camera event.
 * This is the only binary endpoint — returns the raw Response object for streaming.
 * Calls GET /api/v1/netatmo/camera/events/{eventId}/snapshot directly (NOT via haGet).
 *
 * @throws ApiError when env vars are missing or on network/timeout errors
 */
export async function getProxyCameraEventSnapshot(eventId: string): Promise<Response> {
  const baseUrl = process.env.HA_API_URL;
  const apiKey = process.env.HA_API_KEY;

  if (!baseUrl || !apiKey) {
    const missing = !baseUrl ? 'HA_API_URL' : 'HA_API_KEY';
    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      `HA proxy not configured: missing ${missing}`,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/api/v1/netatmo/camera/events/${eventId}/snapshot`, {
      headers: { 'X-API-Key': apiKey },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) throw error;

    if (error instanceof Error && error.name === 'AbortError') {
      throw ApiError.timeout('HA proxy timeout');
    }

    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      `HA proxy request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      HTTP_STATUS.BAD_GATEWAY
    );
  }
}
