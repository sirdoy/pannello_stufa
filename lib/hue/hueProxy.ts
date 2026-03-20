/**
 * Hue Proxy Client
 *
 * Convenience wrappers around the shared HA proxy client (haGet).
 * All endpoints delegate to haGet which handles auth, timeouts, and error
 * mapping via HA_API_URL and HA_API_KEY env vars.
 *
 * The proxy handles:
 *   - Hue Bridge communication (CLIP v1)
 *   - Light state caching via 30-second background polling
 *   - Data freshness tracking
 *   - Error mapping to RFC 9457 problem details
 *
 * Error handling:
 *   - RFC 9457 error responses are parsed and mapped to ApiError instances
 *   - AbortError (timeout) → ApiError(TIMEOUT)
 *   - 401 → ApiError(UNAUTHORIZED)
 *   - 503 → ApiError(SERVICE_UNAVAILABLE)
 *   - Other non-ok → ApiError(EXTERNAL_API_ERROR)
 */

import { haGet } from '@/lib/haClient';
import type {
  HueLight,
  HueGroup,
  HueScene,
  HueBridgeHealth,
  HueHistoryResponse,
} from '@/types/hueProxy';

// =============================================================================
// READ WRAPPERS
// =============================================================================

/**
 * Get all Hue lights with state, capability tier, and room enrichment.
 * Calls GET /api/v1/hue/lights on the HA proxy.
 */
export async function getLights(): Promise<HueLight[]> {
  return haGet<HueLight[]>('/api/v1/hue/lights');
}

/**
 * Get the current state of a single Hue light by its Bridge-assigned string ID.
 * Calls GET /api/v1/hue/lights/{lightId} on the HA proxy.
 * @param lightId - Bridge-assigned string key (e.g. "1", "5")
 */
export async function getLight(lightId: string): Promise<HueLight> {
  return haGet<HueLight>(`/api/v1/hue/lights/${lightId}`);
}

/**
 * Get all Hue groups (rooms, zones) with member light IDs and current action state.
 * Calls GET /api/v1/hue/groups on the HA proxy.
 */
export async function getGroups(): Promise<HueGroup[]> {
  return haGet<HueGroup[]>('/api/v1/hue/groups');
}

/**
 * Get a single Hue group by its Bridge-assigned string ID.
 * Calls GET /api/v1/hue/groups/{groupId} on the HA proxy.
 * @param groupId - Bridge-assigned string key (e.g. "1", "3")
 */
export async function getGroup(groupId: string): Promise<HueGroup> {
  return haGet<HueGroup>(`/api/v1/hue/groups/${groupId}`);
}

/**
 * Get all Hue scenes from cache, optionally filtered to a single group.
 * Calls GET /api/v1/hue/scenes on the HA proxy.
 * @param groupId - Optional group ID to filter scenes
 */
export async function getScenes(groupId?: string): Promise<HueScene[]> {
  const endpoint = groupId
    ? `/api/v1/hue/scenes?group_id=${groupId}`
    : '/api/v1/hue/scenes';
  return haGet<HueScene[]>(endpoint);
}

// =============================================================================
// HEALTH WRAPPER
// =============================================================================

/**
 * Get the Hue Bridge connectivity status and cache freshness.
 * Calls GET /api/v1/hue/health on the HA proxy.
 */
export async function getHealth(): Promise<HueBridgeHealth> {
  return haGet<HueBridgeHealth>('/api/v1/hue/health');
}

// =============================================================================
// HISTORY WRAPPER
// =============================================================================

/**
 * Get paginated Hue light state history with automatic granularity selection.
 * Calls GET /api/v1/hue/history on the HA proxy.
 * @param params - Optional URLSearchParams for filtering (from, to, light_id, page, page_size)
 */
export async function getHistory(params?: URLSearchParams): Promise<HueHistoryResponse> {
  const endpoint = params
    ? `/api/v1/hue/history?${params.toString()}`
    : '/api/v1/hue/history';
  return haGet<HueHistoryResponse>(endpoint);
}
