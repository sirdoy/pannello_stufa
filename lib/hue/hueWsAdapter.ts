/**
 * Hue WebSocket Payload Adapter
 *
 * Converts raw Bridge v1 dict payloads from the WS `hue` topic into
 * the proxy-shaped HueLight[] and HueGroup[] arrays used by useLightsData.
 *
 * The WS sends lights/groups as Record<string, BridgeLight/BridgeGroup>,
 * while the HTTP proxy routes flatten them into typed arrays with explicit IDs.
 */

import type { HueLight, HueGroup, HueCapabilityTier, HueColorMode } from '@/types/hueProxy';

// ---------------------------------------------------------------------------
// Raw Bridge v1 shapes (from WS payload)
// ---------------------------------------------------------------------------

interface BridgeLightState {
  on?: boolean;
  bri?: number | null;
  ct?: number | null;
  hue?: number | null;
  sat?: number | null;
  xy?: [number, number] | null;
  colormode?: string | null;
  reachable?: boolean;
}

interface BridgeLight {
  state?: BridgeLightState;
  name?: string;
  type?: string;
  modelid?: string | null;
  custom_name?: string | null;
  device_type?: string | null;
}

interface BridgeGroupState {
  any_on?: boolean;
  all_on?: boolean;
}

interface BridgeGroupAction {
  bri?: number | null;
  ct?: number | null;
  colormode?: string | null;
}

interface BridgeGroup {
  name?: string;
  lights?: string[];
  type?: string | null;
  class?: string | null;
  state?: BridgeGroupState;
  action?: BridgeGroupAction;
}

// ---------------------------------------------------------------------------
// Capability tier derivation (mirrors proxy server logic)
// ---------------------------------------------------------------------------

function deriveCapabilityTier(lightType: string | undefined): HueCapabilityTier {
  if (!lightType) return 'white';
  const lower = lightType.toLowerCase();
  if (lower.includes('extended color') || lower.includes('color light')) return 'color';
  if (lower.includes('color temperature')) return 'ambiance';
  return 'white';
}

// ---------------------------------------------------------------------------
// Public adapters
// ---------------------------------------------------------------------------

/**
 * Convert a Bridge v1 lights dict to proxy-shaped HueLight[].
 * Returns empty array if input is not a valid dict.
 */
export function adaptWsLights(raw: unknown): HueLight[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];

  const dict = raw as Record<string, BridgeLight>;
  return Object.entries(dict).map(([id, light]) => {
    const state = light.state ?? {};
    const ctMirek = state.ct ?? null;
    return {
      light_id: id,
      name: light.name ?? `Light ${id}`,
      on: state.on ?? false,
      brightness: state.bri ?? null,
      ct_mirek: ctMirek,
      ct_kelvin: ctMirek ? Math.round(1_000_000 / ctMirek) : null,
      hue: state.hue ?? null,
      saturation: state.sat ?? null,
      colormode: (state.colormode as HueColorMode) ?? null,
      reachable: state.reachable ?? false,
      capability_tier: deriveCapabilityTier(light.type),
      room_id: null,
      room_name: null,
      model_id: light.modelid ?? null,
      light_type: light.type ?? null,
      custom_name: light.custom_name ?? null,
      device_type: light.device_type ?? null,
    };
  });
}

/**
 * Convert a Bridge v1 groups dict to proxy-shaped HueGroup[].
 * Returns empty array if input is not a valid dict.
 */
export function adaptWsGroups(raw: unknown): HueGroup[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];

  const dict = raw as Record<string, BridgeGroup>;
  return Object.entries(dict).map(([id, group]) => ({
    group_id: id,
    name: group.name ?? `Group ${id}`,
    type: group.type ?? null,
    group_class: group.class ?? null,
    lights: group.lights ?? [],
    any_on: group.state?.any_on ?? false,
    all_on: group.state?.all_on ?? false,
    brightness: group.action?.bri ?? null,
    color_temp: group.action?.ct ?? null,
    colormode: group.action?.colormode ?? null,
  }));
}
