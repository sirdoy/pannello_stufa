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
  | 'hue' | 'sonos' | 'raspi' | 'tuya'
  | 'sonos_transport' | 'sonos_volume';

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
 * Raw Netatmo cloud API homestatus response with enrichment metadata.
 * WS sends raw Netatmo homestatus envelope (body.home.rooms[]), NOT proxy format.
 * Adapter in lib/netatmo/netatmoWsAdapter.ts handles conversion.
 * The index signature [key: string]: unknown preserves backward compat for other
 * Netatmo API top-level fields.
 */
export interface NetatmoData {
  body: Record<string, unknown>;
  status: string;
  time_server: number;
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';
  [key: string]: unknown;  // additional Netatmo API top-level fields
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
// Hue — WS sends Bridge v1 dicts; adaptWsLights/adaptWsGroups convert to proxy arrays
// ---------------------------------------------------------------------------

export interface HueData {
  lights: Record<string, unknown> | null;   // Bridge v1 dict keyed by light_id
  groups: Record<string, unknown> | null;   // Bridge v1 dict keyed by group_id
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';
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

export interface RaspiData {
  cpu_percent: number;
  memory: Record<string, unknown>;
  disk: Record<string, unknown>;
  system: Record<string, unknown>;
  data_freshness: 'LIVE';  // always 'LIVE' — raspi is an on-demand provider
}

// ---------------------------------------------------------------------------
// Tuya — smart plug state and energy data
// ---------------------------------------------------------------------------

export interface TuyaData {
  plugs: TuyaPlug[] | null;
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';
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
