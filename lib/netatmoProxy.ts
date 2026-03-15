/**
 * Netatmo Proxy Client
 *
 * Foundation client for the Netatmo proxy API — replaces the legacy OAuth-based
 * netatmoApi.ts for migrated routes. Much simpler: no token management, just
 * an X-API-Key header on every request.
 *
 * The proxy handles:
 *   - Netatmo OAuth token lifecycle
 *   - Rate limiting and caching
 *   - Data freshness tracking
 *
 * Configuration (env vars):
 *   NETATMO_PROXY_URL     — Base URL of the proxy (e.g. https://proxy.example.com)
 *   NETATMO_PROXY_API_KEY — Shared secret for proxy authentication
 *
 * Error handling:
 *   - RFC 9457 error responses are parsed and mapped to ApiError instances
 *   - AbortError (timeout) → ApiError(TIMEOUT)
 *   - 401 → ApiError(UNAUTHORIZED)
 *   - 503 → ApiError(SERVICE_UNAVAILABLE)
 *   - Other non-ok → ApiError(EXTERNAL_API_ERROR)
 */

import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';
import type {
  NetatmoProxyHomestatusResponse,
  NetatmoProxyHomesdataResponse,
  RFC9457ProblemDetail,
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
} from '@/types/netatmoProxy';

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Core proxy GET function. Handles auth header, timeouts, and error mapping.
 *
 * @param endpoint - Path relative to proxy base URL (e.g. '/homestatus')
 * @param options  - Optional { timeout } in milliseconds (default 15000)
 * @returns Parsed JSON response as T
 * @throws ApiError on any failure
 */
export async function netatmoProxyGet<T>(
  endpoint: string,
  options: { timeout?: number } = {}
): Promise<T> {
  const baseUrl = process.env.NETATMO_PROXY_URL;
  const apiKey = process.env.NETATMO_PROXY_API_KEY;

  if (!baseUrl || !apiKey) {
    const missing = !baseUrl ? 'NETATMO_PROXY_URL' : 'NETATMO_PROXY_API_KEY';
    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      `Netatmo proxy not configured: missing ${missing}`,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  const { timeout = DEFAULT_TIMEOUT_MS } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: { 'X-API-Key': apiKey },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Attempt to parse RFC 9457 problem detail
      let detail: string | undefined;
      let parsedStatus = response.status;

      try {
        const body = (await response.json()) as RFC9457ProblemDetail;
        if (body.detail) detail = body.detail;
        if (body.status) parsedStatus = body.status;
      } catch {
        // Not a JSON body — use statusText as fallback
        detail = response.statusText;
      }

      // Map status codes to error codes
      if (parsedStatus === 401) {
        throw new ApiError(
          ERROR_CODES.UNAUTHORIZED,
          detail ?? 'Unauthorized',
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      if (parsedStatus === 503) {
        throw new ApiError(
          ERROR_CODES.SERVICE_UNAVAILABLE,
          detail ?? 'Netatmo proxy unavailable',
          HTTP_STATUS.SERVICE_UNAVAILABLE
        );
      }

      throw new ApiError(
        ERROR_CODES.EXTERNAL_API_ERROR,
        detail ?? `Netatmo proxy error: ${response.statusText}`,
        HTTP_STATUS.BAD_GATEWAY
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);

    // Already an ApiError — re-throw as-is
    if (error instanceof ApiError) throw error;

    // Timeout abort
    if (error instanceof Error && error.name === 'AbortError') {
      throw ApiError.timeout('Netatmo proxy timeout');
    }

    // Unknown network error
    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      `Netatmo proxy request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      HTTP_STATUS.BAD_GATEWAY
    );
  }
}

/**
 * Core proxy POST function. Handles auth header, JSON body, timeouts, and error mapping.
 *
 * @param endpoint - Path relative to proxy base URL (e.g. '/setroomthermpoint')
 * @param body     - Request body; serialized as JSON
 * @param options  - Optional { timeout } in milliseconds (default 15000)
 * @returns Parsed JSON response as T
 * @throws ApiError on any failure
 */
export async function netatmoProxyPost<T>(
  endpoint: string,
  body: Record<string, unknown>,
  options: { timeout?: number } = {}
): Promise<T> {
  const baseUrl = process.env.NETATMO_PROXY_URL;
  const apiKey = process.env.NETATMO_PROXY_API_KEY;

  if (!baseUrl || !apiKey) {
    const missing = !baseUrl ? 'NETATMO_PROXY_URL' : 'NETATMO_PROXY_API_KEY';
    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      `Netatmo proxy not configured: missing ${missing}`,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  const { timeout = DEFAULT_TIMEOUT_MS } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Attempt to parse RFC 9457 problem detail
      let detail: string | undefined;
      let parsedStatus = response.status;

      try {
        const errorBody = (await response.json()) as RFC9457ProblemDetail;
        if (errorBody.detail) detail = errorBody.detail;
        if (errorBody.status) parsedStatus = errorBody.status;
      } catch {
        // Not a JSON body — use statusText as fallback
        detail = response.statusText;
      }

      // Map status codes to error codes
      if (parsedStatus === 401) {
        throw new ApiError(
          ERROR_CODES.UNAUTHORIZED,
          detail ?? 'Unauthorized',
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      if (parsedStatus === 503) {
        throw new ApiError(
          ERROR_CODES.SERVICE_UNAVAILABLE,
          detail ?? 'Netatmo proxy unavailable',
          HTTP_STATUS.SERVICE_UNAVAILABLE
        );
      }

      throw new ApiError(
        ERROR_CODES.EXTERNAL_API_ERROR,
        detail ?? `Netatmo proxy error: ${response.statusText}`,
        HTTP_STATUS.BAD_GATEWAY
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);

    // Already an ApiError — re-throw as-is
    if (error instanceof ApiError) throw error;

    // Timeout abort
    if (error instanceof Error && error.name === 'AbortError') {
      throw ApiError.timeout('Netatmo proxy timeout');
    }

    // Unknown network error
    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      `Netatmo proxy request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      HTTP_STATUS.BAD_GATEWAY
    );
  }
}

// =============================================================================
// CONVENIENCE WRAPPERS
// =============================================================================

/**
 * Get current room temperatures and heating status from the proxy.
 * Calls GET /homestatus on the Netatmo proxy.
 */
export async function getProxyHomestatus(): Promise<NetatmoProxyHomestatusResponse> {
  return netatmoProxyGet<NetatmoProxyHomestatusResponse>('/homestatus');
}

/**
 * Get home structure (rooms, modules, schedules) from the proxy.
 * Calls GET /homesdata on the Netatmo proxy.
 */
export async function getProxyHomesdata(): Promise<NetatmoProxyHomesdataResponse> {
  return netatmoProxyGet<NetatmoProxyHomesdataResponse>('/homesdata');
}

/**
 * Set room thermostat setpoint (manual or home mode).
 * Calls POST /setroomthermpoint on the Netatmo proxy.
 */
export async function proxySetRoomThermpoint(
  body: SetRoomThermpointRequest
): Promise<ProxyControlResponse> {
  return netatmoProxyPost<ProxyControlResponse>('/setroomthermpoint', body as unknown as Record<string, unknown>);
}

/**
 * Set the home thermostat mode (schedule, away, or hg/frost-guard).
 * Calls POST /setthermmode on the Netatmo proxy.
 */
export async function proxySetThermMode(
  body: SetThermmodeRequest
): Promise<SetThermmodeResponse> {
  return netatmoProxyPost<SetThermmodeResponse>('/setthermmode', body as unknown as Record<string, unknown>);
}

/**
 * Switch the active heating schedule for a home.
 * Calls POST /switchhomeschedule on the Netatmo proxy.
 */
export async function proxySwitchHomeSchedule(
  body: SwitchHomeScheduleRequest
): Promise<ProxyControlResponse> {
  return netatmoProxyPost<ProxyControlResponse>('/switchhomeschedule', body as unknown as Record<string, unknown>);
}

/**
 * Sync a home schedule definition to Netatmo.
 * Calls POST /synchomeschedule on the Netatmo proxy.
 * Body is passed through as-is; home_id is required.
 */
export async function proxySyncHomeSchedule(
  body: Record<string, unknown>
): Promise<ProxyControlResponse> {
  return netatmoProxyPost<ProxyControlResponse>('/synchomeschedule', body);
}

/**
 * Create a new home schedule on Netatmo.
 * Calls POST /createnewhomeschedule on the Netatmo proxy.
 * Body is passed through as-is; home_id is required.
 */
export async function proxyCreateNewHomeSchedule(
  body: Record<string, unknown>
): Promise<ProxyControlResponse> {
  return netatmoProxyPost<ProxyControlResponse>('/createnewhomeschedule', body);
}

// =============================================================================
// CAMERA WRAPPERS
// =============================================================================

/**
 * Get all camera devices with status, SD card state, and firmware version.
 * Calls GET /camera/status on the Netatmo proxy.
 */
export async function getProxyCameraStatus(): Promise<CameraStatusResponse> {
  return netatmoProxyGet<CameraStatusResponse>('/camera/status');
}

/**
 * Get HLS stream URLs for a specific camera.
 * Calls GET /camera/{cameraId}/stream on the Netatmo proxy.
 * VPN URLs expire every 3 hours — do not cache client-side.
 */
export async function getProxyCameraStream(cameraId: string): Promise<CameraStreamResponse> {
  return netatmoProxyGet<CameraStreamResponse>(`/camera/${cameraId}/stream`);
}

/**
 * Get the current snapshot URL for a camera (returns URL, not binary data).
 * Calls GET /camera/{cameraId}/snapshot on the Netatmo proxy.
 */
export async function getProxyCameraSnapshot(cameraId: string): Promise<CameraSnapshotUrlResponse> {
  return netatmoProxyGet<CameraSnapshotUrlResponse>(`/camera/${cameraId}/snapshot`);
}

/**
 * Toggle monitoring on or off for a specific camera.
 * Calls POST /camera/{cameraId}/monitoring on the Netatmo proxy.
 */
export async function proxySetCameraMonitoring(
  cameraId: string,
  body: SetMonitoringRequest
): Promise<SetMonitoringResponse> {
  return netatmoProxyPost<SetMonitoringResponse>(
    `/camera/${cameraId}/monitoring`,
    body as unknown as Record<string, unknown>
  );
}

/**
 * Get a timeline of camera events from the proxy (served from local SQLite).
 * Calls GET /camera/events on the Netatmo proxy.
 * @param hours - Optional hours of history to return (1–168, default 24 server-side)
 */
export async function getProxyCameraEvents(hours?: number): Promise<CameraEventsResponse> {
  const endpoint = hours !== undefined ? `/camera/events?hours=${hours}` : '/camera/events';
  return netatmoProxyGet<CameraEventsResponse>(endpoint);
}

// =============================================================================
// VALVE WRAPPERS
// =============================================================================

/**
 * Get all valve modules with battery level, RF signal, reachability, and calibration state.
 * Calls GET /valves on the Netatmo proxy.
 */
export async function getProxyValves(): Promise<ValveStatusResponse> {
  return netatmoProxyGet<ValveStatusResponse>('/valves');
}

/**
 * Trigger calibration on all valves simultaneously.
 * Calls POST /valves/calibrate on the Netatmo proxy with an empty body.
 * The proxy handles calibration natively — no schedule-switching workaround needed.
 */
export async function proxyCalibrateValves(): Promise<CalibrateBatchResponse> {
  return netatmoProxyPost<CalibrateBatchResponse>('/valves/calibrate', {});
}

// =============================================================================
// HEALTH WRAPPERS
// =============================================================================

/**
 * Get the current health status of the Netatmo proxy.
 * Calls GET /health on the Netatmo proxy.
 * Returns token lifecycle status, rate limit usage, and data freshness.
 */
export async function getProxyHealth(): Promise<NetatmoHealthResponse> {
  return netatmoProxyGet<NetatmoHealthResponse>('/health');
}

/**
 * Get a binary JPEG snapshot for a specific camera event.
 * This is the only binary endpoint — returns the raw Response object for streaming.
 * Calls GET /camera/events/{eventId}/snapshot directly (NOT via netatmoProxyGet).
 *
 * @throws ApiError when env vars are missing or on network/timeout errors
 */
export async function getProxyCameraEventSnapshot(eventId: string): Promise<Response> {
  const baseUrl = process.env.NETATMO_PROXY_URL;
  const apiKey = process.env.NETATMO_PROXY_API_KEY;

  if (!baseUrl || !apiKey) {
    const missing = !baseUrl ? 'NETATMO_PROXY_URL' : 'NETATMO_PROXY_API_KEY';
    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      `Netatmo proxy not configured: missing ${missing}`,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/camera/events/${eventId}/snapshot`, {
      headers: { 'X-API-Key': apiKey },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) throw error;

    if (error instanceof Error && error.name === 'AbortError') {
      throw ApiError.timeout('Netatmo proxy timeout');
    }

    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      `Netatmo proxy request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      HTTP_STATUS.BAD_GATEWAY
    );
  }
}
