/**
 * TypeScript types for Hue Proxy API responses.
 *
 * The proxy handles Hue Bridge communication and caching server-side via
 * 30-second background polling (CLIP v1). These types represent the proxy's
 * response shapes.
 *
 * See docs/api/hue.md for the authoritative spec.
 */

// =============================================================================
// UNION TYPES
// =============================================================================

/**
 * Hue light capability tier based on Bridge light type.
 * - white: On/off and brightness only (Dimmable light)
 * - ambiance: On/off, brightness, and color temperature (Color temperature light)
 * - color: Full control including hue/saturation (Extended color light)
 */
export type HueCapabilityTier = 'white' | 'ambiance' | 'color';

/**
 * Indicates how fresh the data returned by the proxy is.
 * - LIVE: last successful poll within 90 seconds
 * - STALE: data older than 90 seconds — available but may not reflect current state
 * @note UNREACHABLE triggers HTTP 503 — never appears in response body
 */
export type HueDataFreshness = 'LIVE' | 'STALE';

/**
 * The active color mode of a Hue light.
 * - ct: Color temperature mode
 * - hs: Hue/saturation mode
 * - xy: CIE xy chromaticity mode
 */
export type HueColorMode = 'ct' | 'hs' | 'xy';

/**
 * History data granularity level.
 * Auto-selected based on the requested time window.
 * - raw: Per-poll readings (~30s interval, <=48h window)
 * - hourly: Hourly aggregations (<=30d window)
 * - daily: Daily aggregations (>30d window)
 */
export type HueHistoryGranularity = 'raw' | 'hourly' | 'daily';

// =============================================================================
// LIGHT TYPES
// =============================================================================

/**
 * Full state of a single Hue light.
 * Source: api/providers/hue/routes.py — HueLightStateResponse
 */
export interface HueLight {
  light_id: string;                    // Bridge string key e.g. "1", "5"
  name: string;
  on: boolean;
  brightness: number | null;           // 0-254
  ct_mirek: number | null;             // 153-500
  ct_kelvin: number | null;            // derived: round(1_000_000 / ct_mirek)
  hue: number | null;                  // 0-65535
  saturation: number | null;           // 0-254
  colormode: HueColorMode | null;
  reachable: boolean;
  capability_tier: HueCapabilityTier;
  room_id: string | null;
  room_name: string | null;
  model_id: string | null;
  light_type: string | null;           // e.g. "Extended color light"
}

// =============================================================================
// GROUP TYPES
// =============================================================================

/**
 * State of a single Hue group (room, zone, or light group).
 * Source: api/providers/hue/routes.py — HueGroupResponse
 */
export interface HueGroup {
  group_id: string;
  name: string;
  type: string | null;                 // "Room", "Zone", "LightGroup", etc.
  group_class: string | null;          // "Living room", "Kitchen", "Bedroom", etc.
  lights: string[];                    // member light IDs
  any_on: boolean;
  all_on: boolean;
  brightness: number | null;           // 0-254 (group action state)
  color_temp: number | null;           // mirek (group action state)
  colormode: string | null;
}

// =============================================================================
// SCENE TYPES
// =============================================================================

/**
 * A Hue scene associated with a group.
 * Source: api/providers/hue/routes.py — HueSceneResponse
 */
export interface HueScene {
  scene_id: string;
  name: string;
  group_id: string;
  group_name: string | null;
  lights: string[];
  type: string | null;                 // e.g. "GroupScene"
}

// =============================================================================
// HEALTH TYPES
// =============================================================================

/**
 * Hue Bridge connectivity status and cache freshness.
 * Source: api/providers/hue/routes.py — HueHealthResponse
 */
export interface HueBridgeHealth {
  connected: boolean;
  firmware_version: string | null;
  api_version: string | null;
  light_count: number;
  data_freshness: HueDataFreshness;
  last_poll_at: string | null;         // ISO 8601
  last_success_at: string | null;      // ISO 8601
}

// =============================================================================
// HISTORY TYPES
// =============================================================================

/**
 * A single data point from proxy GET /api/v1/hue/history.
 * Raw tier fields (on_state, brightness, etc.) are null for hourly/daily.
 * Aggregation fields (avg_*, min_*, max_*, on_minutes, sample_count) are
 * null for raw granularity and populated for hourly/daily granularity.
 *
 * Note: on_state and reachable are integers (0 or 1), NOT booleans.
 * SQLite stores them as integers; Pydantic model declares Optional[int].
 * This differs from HueLight.reachable which is boolean on live endpoints.
 *
 * Source: api/providers/hue/routes.py — HueHistoryItem
 */
export interface HueHistoryItem {
  timestamp: number;                   // Unix epoch int
  light_id: string;
  granularity: HueHistoryGranularity;

  // Raw tier only (null for hourly/daily)
  light_name: string | null;
  on_state: number | null;             // 0 or 1 (integer, NOT boolean)
  brightness: number | null;           // 0-254
  color_temp: number | null;           // mirek
  hue: number | null;
  saturation: number | null;
  colormode: string | null;
  reachable: number | null;            // 0 or 1 (integer, NOT boolean)

  // Aggregated tiers only (null for raw)
  avg_brightness: number | null;
  min_brightness: number | null;
  max_brightness: number | null;
  on_minutes: number | null;
  sample_count: number | null;
}

/**
 * Paginated response from proxy GET /api/v1/hue/history.
 * Source: api/providers/hue/routes.py — HueHistoryResponse
 */
export interface HueHistoryResponse {
  items: HueHistoryItem[];
  total: number;
  page: number;
  page_size: number;
  granularity: HueHistoryGranularity;
  from: number | null;                 // Unix epoch (serialization_alias on from_ts field)
  to: number | null;                   // Unix epoch (serialization_alias on to_ts field)
}
