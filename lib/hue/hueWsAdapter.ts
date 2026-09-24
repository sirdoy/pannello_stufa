/**
 * Hue WebSocket Payload Adapter
 *
 * Converts the WS `hue` topic payload into the proxy-shaped HueLight[] and
 * HueGroup[] arrays used by useLightsData.
 *
 * The WS sends lights/groups as dicts keyed by id. The backend
 * (`_enrich_payload` in backend/api/ws/manager.py) already flattens each entry
 * to the REST item shape (HueLight / HueGroup, including room_id/room_name);
 * those entries are passed through. Raw Bridge v1 entries (`state`, `class`,
 * `action`) are still accepted as a legacy fallback.
 */

import type {
  HueLight,
  HueGroup,
  HueCapabilityTier,
  HueColorMode,
} from "@/types/hueProxy";

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

function deriveCapabilityTier(
  lightType: string | undefined,
): HueCapabilityTier {
  if (!lightType) return "white";
  const lower = lightType.toLowerCase();
  if (lower.includes("extended color") || lower.includes("color light"))
    return "color";
  if (lower.includes("color temperature")) return "ambiance";
  return "white";
}

// ---------------------------------------------------------------------------
// Flat (REST-shaped) entries — current backend WS payload
// ---------------------------------------------------------------------------

function isFlatLight(entry: unknown): entry is Partial<HueLight> {
  return !!entry && typeof entry === "object" && "light_id" in entry;
}

function isFlatGroup(entry: unknown): entry is Partial<HueGroup> {
  return !!entry && typeof entry === "object" && "group_id" in entry;
}

function normalizeFlatLight(id: string, l: Partial<HueLight>): HueLight {
  return {
    light_id: l.light_id ?? id,
    name: l.name ?? `Light ${id}`,
    on: l.on ?? false,
    brightness: l.brightness ?? null,
    ct_mirek: l.ct_mirek ?? null,
    ct_kelvin: l.ct_kelvin ?? null,
    hue: l.hue ?? null,
    saturation: l.saturation ?? null,
    colormode: l.colormode ?? null,
    reachable: l.reachable ?? false,
    capability_tier: l.capability_tier ?? "white",
    room_id: l.room_id ?? null,
    room_name: l.room_name ?? null,
    model_id: l.model_id ?? null,
    light_type: l.light_type ?? null,
    custom_name: l.custom_name ?? null,
    device_type: l.device_type ?? null,
  };
}

function normalizeFlatGroup(id: string, g: Partial<HueGroup>): HueGroup {
  return {
    group_id: g.group_id ?? id,
    name: g.name ?? `Group ${id}`,
    type: g.type ?? null,
    group_class: g.group_class ?? null,
    lights: g.lights ?? [],
    any_on: g.any_on ?? false,
    all_on: g.all_on ?? false,
    brightness: g.brightness ?? null,
    color_temp: g.color_temp ?? null,
    colormode: g.colormode ?? null,
  };
}

// ---------------------------------------------------------------------------
// Public adapters
// ---------------------------------------------------------------------------

/**
 * Convert a Bridge v1 lights dict to proxy-shaped HueLight[].
 * Returns empty array if input is not a valid dict.
 */
export function adaptWsLights(raw: unknown): HueLight[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];

  const dict = raw as Record<string, BridgeLight | Partial<HueLight>>;
  return Object.entries(dict).map(([id, entry]) => {
    if (isFlatLight(entry)) return normalizeFlatLight(id, entry);
    const light = entry as BridgeLight;
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
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];

  const dict = raw as Record<string, BridgeGroup | Partial<HueGroup>>;
  return Object.entries(dict).map(([id, entry]) => {
    if (isFlatGroup(entry)) return normalizeFlatGroup(id, entry);
    const group = entry as BridgeGroup;
    return {
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
    };
  });
}
