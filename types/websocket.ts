/**
 * WebSocket type definitions for all 6 provider payloads.
 *
 * Source of truth: docs/api/websocket.md
 * These types are derived verbatim from the server's payload interfaces.
 */

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

/** All available WebSocket subscription topics */
export type Topic = 'fritzbox' | 'dirigera' | 'netatmo' | 'thermorossi' | 'hue' | 'sonos';

/**
 * Envelope for all server-to-client messages.
 * Both "snapshot" (initial state on subscribe) and "event" (delta push) use the same shape.
 */
export interface WebSocketMessage<T = unknown> {
  type: 'event' | 'snapshot';
  topic: string;
  data: T;
  /** Unix timestamp (integer seconds) */
  ts: number;
}

// ---------------------------------------------------------------------------
// FritzBox interfaces
// ---------------------------------------------------------------------------

export interface FritzBoxDevice {
  ip: string;
  name: string;
  mac: string;
  /** 1 = online, 0 = offline */
  status: 0 | 1;
}

export interface FritzBoxBandwidth {
  upstream_bps: number;
  downstream_bps: number;
  bytes_sent: number;
  bytes_received: number;
}

export interface FritzBoxWan {
  external_ip: string | null;
  is_connected: boolean;
  is_linked: boolean;
  /** seconds */
  uptime: number;
  max_upstream_bps: number;
  max_downstream_bps: number;
}

export interface FritzBoxData {
  devices: FritzBoxDevice[] | null;
  bandwidth: FritzBoxBandwidth | null;
  wan: FritzBoxWan | null;
}

// ---------------------------------------------------------------------------
// DIRIGERA interfaces
// ---------------------------------------------------------------------------

export interface DirigeraBaseSensor {
  id: string;
  relation_id: string | null;
  type: 'openCloseSensor' | 'occupancySensor' | 'motionSensor';
  custom_name: string | null;
  room: string | null;
  firmware_version: string | null;
  battery_percentage: number | null;
  is_reachable: boolean;
  /** ISO 8601 */
  last_seen: string | null;
}

export interface DirigeraContactSensor extends DirigeraBaseSensor {
  type: 'openCloseSensor';
  is_open: boolean;
}

export interface DirigeraMotionSensor extends DirigeraBaseSensor {
  type: 'occupancySensor' | 'motionSensor';
  is_detected: boolean;
  light_level: number | null;
}

export type DirigeraSensor = DirigeraContactSensor | DirigeraMotionSensor;

export interface DirigeraData {
  sensors: DirigeraSensor[] | null;
}

// ---------------------------------------------------------------------------
// Netatmo type
// ---------------------------------------------------------------------------

/**
 * Raw Netatmo cloud API homestatus response.
 * Adapter layer added in Phase 143.
 * For full schema see: GET /api/v1/netatmo/energy/homestatus
 */
export type NetatmoData = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Thermorossi interface
// ---------------------------------------------------------------------------

export interface ThermorossiData {
  /** 'off' | 'igniting' | 'working' | 'cooling' | 'alarm' | ... */
  stove_state: string;
  /** 1–5 (fuel feed rate) */
  power_level: number | null;
  /** 1–5 (combustion air) */
  fan_level: number | null;
  error_code: number | null;
  error_description: string | null;
  /** Additional raw WiNet fields may be present */
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Hue interfaces
// ---------------------------------------------------------------------------

export interface HueLightState {
  on: boolean;
  /** brightness 0–254 */
  bri: number | null;
  /** color temperature in mirek */
  ct: number | null;
  colormode: 'ct' | 'hs' | 'xy' | null;
  reachable: boolean;
  [key: string]: unknown;
}

export interface HueLight {
  state: HueLightState;
  name: string;
  type: string;
  modelid: string | null;
  [key: string]: unknown;
}

export interface HueGroupState {
  any_on: boolean;
  all_on: boolean;
}

export interface HueGroup {
  name: string;
  /** array of light_id strings */
  lights: string[];
  state: HueGroupState;
  action: Record<string, unknown>;
  [key: string]: unknown;
}

export interface HueData {
  /** key = light_id (e.g. "1", "2") */
  lights: Record<string, HueLight> | null;
  /** key = group_id (e.g. "1") */
  groups: Record<string, HueGroup> | null;
}

// ---------------------------------------------------------------------------
// Sonos interfaces
// ---------------------------------------------------------------------------

export interface SonosSpeaker {
  uid: string;
  name: string;
  ip: string;
  model: string | null;
  firmware: string | null;
  serial: string | null;
  role: 'soundbar' | 'sub' | 'surround' | 'speaker';
  is_visible: boolean;
  is_coordinator: boolean;
}

export interface SonosGroupMember {
  uid: string;
  name: string;
  ip: string;
  role: string;
}

export interface SonosGroup {
  group_id: string;
  label: string;
  coordinator_uid: string;
  coordinator_name: string;
  member_count: number;
  members: SonosGroupMember[];
}

export interface SonosData {
  speakers: SonosSpeaker[] | null;
  groups: SonosGroup[] | null;
}

// ---------------------------------------------------------------------------
// TopicDataMap — maps Topic literal to its payload type
// ---------------------------------------------------------------------------

export type TopicDataMap = {
  fritzbox: FritzBoxData;
  dirigera: DirigeraData;
  netatmo: NetatmoData;
  thermorossi: ThermorossiData;
  hue: HueData;
  sonos: SonosData;
};
