/**
 * DIRIGERA Proxy Client
 *
 * Convenience wrappers around the shared HA proxy client (haGet).
 * All endpoints delegate to haGet which handles auth, timeouts, and error
 * mapping via HA_API_URL and HA_API_KEY env vars.
 *
 * DIRIGERA is a read-only provider (haGet only — per D-02).
 * No command/mutation endpoints are in scope.
 *
 * The proxy handles:
 *   - IKEA DIRIGERA hub sensor discovery and state caching
 *   - Data freshness tracking (LIVE/STALE/UNREACHABLE — 3-state per D-08)
 *   - Error mapping to RFC 9457 problem details
 *
 * Error handling:
 *   - RFC 9457 error responses are propagated directly (no wrapping per D-15)
 *   - AbortError (timeout) → ApiError(TIMEOUT)
 *   - 401 → ApiError(UNAUTHORIZED)
 *   - 503 → ApiError(SERVICE_UNAVAILABLE)
 *   - Other non-ok → ApiError(EXTERNAL_API_ERROR)
 */

import { haGet } from '@/lib/haClient';
import type {
  DirigeraHealthResponse,
  DirigeraSensorsResponse,
  ContactSensorsResponse,
  MotionSensorsResponse,
  SensorSummaryResponse,
} from '@/types/dirigeraProxy';

// =============================================================================
// READ WRAPPERS (Phase 130)
// =============================================================================

/** Get DIRIGERA hub health status including firmware version and reachability. */
export async function getHealth(): Promise<DirigeraHealthResponse> {
  return haGet<DirigeraHealthResponse>('/api/v1/dirigera/health');
}

/** Get all sensors (contact + motion) with metadata. */
export async function getSensors(): Promise<DirigeraSensorsResponse> {
  return haGet<DirigeraSensorsResponse>('/api/v1/dirigera/sensors');
}

/** Get contact (open/close) sensors only, with data_freshness. */
export async function getContactSensors(): Promise<ContactSensorsResponse> {
  return haGet<ContactSensorsResponse>('/api/v1/dirigera/sensors/contact');
}

/** Get motion/occupancy sensors only, with light_level and data_freshness. */
export async function getMotionSensors(): Promise<MotionSensorsResponse> {
  return haGet<MotionSensorsResponse>('/api/v1/dirigera/sensors/motion');
}

/** Get fleet-wide sensor summary (totals, open, offline, low battery). */
export async function getSensorSummary(): Promise<SensorSummaryResponse> {
  return haGet<SensorSummaryResponse>('/api/v1/dirigera/sensors/summary');
}
