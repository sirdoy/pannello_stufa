/**
 * Sonos Proxy Client
 *
 * Convenience wrappers around the shared HA proxy client (haGet).
 * All endpoints delegate to haGet which handles auth, timeouts, and error
 * mapping via HA_API_URL and HA_API_KEY env vars.
 *
 * The proxy handles:
 *   - Sonos device discovery and zone topology
 *   - Device status caching and data freshness tracking
 *   - Error mapping to RFC 9457 problem details
 *
 * Error handling:
 *   - RFC 9457 error responses are parsed and mapped to ApiError instances
 *   - AbortError (timeout) → ApiError(TIMEOUT)
 *   - 401 → ApiError(UNAUTHORIZED)
 *   - 503 → ApiError(SERVICE_UNAVAILABLE) — also triggered by UNREACHABLE state
 *   - Other non-ok → ApiError(EXTERNAL_API_ERROR)
 */

import { haGet } from '@/lib/haClient';
import type {
  SonosHealthResponse,
  SonosDeviceResponse,
  SonosDeviceDetailResponse,
  SonosZoneResponse,
} from '@/types/sonosProxy';

// =============================================================================
// READ WRAPPERS
// =============================================================================

/**
 * Get the Sonos proxy health status and data freshness.
 * Calls GET /api/v1/sonos/health on the HA proxy.
 */
export async function getHealth(): Promise<SonosHealthResponse> {
  return haGet<SonosHealthResponse>('/api/v1/sonos/health');
}

/**
 * Get the list of all discovered Sonos devices.
 * Calls GET /api/v1/sonos/devices on the HA proxy.
 */
export async function getDevices(): Promise<SonosDeviceResponse[]> {
  return haGet<SonosDeviceResponse[]>('/api/v1/sonos/devices');
}

/**
 * Get detailed information for a specific Sonos device including volume/EQ state.
 * Calls GET /api/v1/sonos/devices/{uid} on the HA proxy.
 * @param uid - RINCON_... device UID
 */
export async function getDevice(uid: string): Promise<SonosDeviceDetailResponse> {
  return haGet<SonosDeviceDetailResponse>(`/api/v1/sonos/devices/${uid}`);
}

/**
 * Get the current zone topology (groupings of Sonos players).
 * Calls GET /api/v1/sonos/zones on the HA proxy.
 */
export async function getZones(): Promise<SonosZoneResponse[]> {
  return haGet<SonosZoneResponse[]>('/api/v1/sonos/zones');
}
