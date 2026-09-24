/**
 * WebSocket type definitions for all 8 provider payloads.
 *
 * Source of truth: docs/api/websocket.md
 *
 * Since the WS server sends data in the same format as the HA proxy REST
 * endpoints, most payload types are re-exported from the proxy type files.
 * Only FritzBox (canonical here) and Netatmo (raw format) define local types.
 */

import type { HueLight, HueGroup } from '@/types/hueProxy';
import type { ThermorossiStatusResponse } from '@/types/thermorossiProxy';
import type { SonosDeviceResponse, SonosZoneResponse, SonosDataFreshness } from '@/types/sonosProxy';
import type { DirigeraSensor } from '@/types/dirigeraProxy';
import type { TuyaPlug } from '@/types/tuyaProxy';

// Re-export proxy types for convenience
export type { HueLight, HueGroup } from '@/types/hueProxy';
export type { ThermorossiStatusResponse } from '@/types/thermorossiProxy';
export type { SonosDeviceResponse, SonosZoneResponse } from '@/types/sonosProxy';
export type { DirigeraSensor } from '@/types/dirigeraProxy';
export type { TuyaPlug } from '@/types/tuyaProxy';

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

/** All available WebSocket subscription topics */
export type Topic =
  | 'fritzbox' | 'dirigera' | 'netatmo' | 'thermorossi'
  | 'hue' | 'sonos' | 'raspi' | 'tuya' | 'scheduler'
  | 'sonos_transport' | 'sonos_volume' | 'sonos_topology'
  | 'automations';

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
// FritzBox interfaces (canonical — no proxy type file for these)
// ---------------------------------------------------------------------------

export interface FritzBoxDevice {
  ip: string;
  name: string;
  mac: string;
  /** 1 = online, 0 = offline */
  status: 0 | 1;
  custom_name?: string | null;   // registry override, null if not set
  device_type?: string | null;   // registry device type slug, null if not set
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
  is_stale: boolean;                  // true if cache is older than max_age_seconds
  fetched_at: string | null;          // ISO 8601 timestamp of last successful fetch, or null
  data_freshness: 'LIVE' | 'STALE';  // 'LIVE' if not stale, 'STALE' otherwise
}

// ---------------------------------------------------------------------------
// DIRIGERA — uses proxy DirigeraSensor (flat, with is_open: boolean | null)
// ---------------------------------------------------------------------------

export interface DirigeraData {
  sensors: DirigeraSensor[] | null;
  data_freshness: 'LIVE' | 'STALE';  // based on cache staleness
}

// ---------------------------------------------------------------------------
// Netatmo type
// ---------------------------------------------------------------------------

/**
 * Netatmo topic payload (backend/api/ws/manager.py `_enrich_payload`):
 * `rooms` are raw homestatus rooms (id, therm_measured_temperature, ...), `cameras`
 * the camera view with proxy URLs. No `modules` (battery info is REST-only).
 * Adapter in lib/netatmo/netatmoWsAdapter.ts maps rooms to NetatmoStatus.
 */
export interface NetatmoData {
  rooms: Record<string, unknown>[];
  cameras: Record<string, unknown>[];
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Thermorossi — alias for proxy ThermorossiStatusResponse
// ---------------------------------------------------------------------------

/**
 * WS sends the same shape as GET /api/v1/thermorossi/status.
 * Gains strict StoveState union (not string) plus data_freshness and last_poll_at.
 */
export type ThermorossiData = ThermorossiStatusResponse;

// ---------------------------------------------------------------------------
// Hue — dicts keyed by id with REST-shaped entries; adaptWsLights/adaptWsGroups → arrays
// ---------------------------------------------------------------------------

export interface HueData {
  lights: Record<string, HueLight> | null;  // keyed by light_id, HueLight item shape
  groups: Record<string, HueGroup> | null;  // keyed by group_id, HueGroup item shape
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';
  is_stale?: boolean;
  last_poll_at?: string | null;
  fetched_at?: string | null;
}

// ---------------------------------------------------------------------------
// Sonos — uses proxy SonosDeviceResponse and SonosZoneResponse
// ---------------------------------------------------------------------------

export interface SonosData {
  speakers: SonosDeviceResponse[] | null;
  groups: SonosZoneResponse[] | null;
  data_freshness: SonosDataFreshness;  // import from sonosProxy — 3-state, matches WS doc exactly
}

// ---------------------------------------------------------------------------
// Raspi — always-live system stats (no cache freshness threshold)
// ---------------------------------------------------------------------------

// Same sections as the REST endpoints /raspi/{cpu,memory,disk,system}, nested per section.
export interface RaspiData {
  cpu: { cpu_percent: number };
  memory: { percent: number; [key: string]: unknown };
  disk: { percent: number; mount_point?: string; [key: string]: unknown };
  system: { cpu_temperature: number | null; [key: string]: unknown };
  data_freshness: 'LIVE';  // always 'LIVE' — raspi is an on-demand provider
}

// ---------------------------------------------------------------------------
// Tuya — smart plug state and energy data
// ---------------------------------------------------------------------------

/** Same item shape as GET /tuya/plugs; freshness is per plug (no top-level field). */
export interface TuyaData {
  plugs: TuyaPlug[] | null;
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
  raspi: RaspiData;
  tuya: TuyaData;
};
