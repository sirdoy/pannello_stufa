/**
 * WebSocket type definitions for all 6 provider payloads.
 *
 * Source of truth: docs/api/websocket.md
 *
 * Since the WS server sends data in the same format as the HA proxy REST
 * endpoints, most payload types are re-exported from the proxy type files.
 * Only FritzBox (canonical here) and Netatmo (raw format) define local types.
 */

import type { HueLight, HueGroup } from '@/types/hueProxy';
import type { ThermorossiStatusResponse } from '@/types/thermorossiProxy';
import type { SonosDeviceResponse, SonosZoneResponse } from '@/types/sonosProxy';
import type { DirigeraSensor } from '@/types/dirigeraProxy';

// Re-export proxy types for convenience
export type { HueLight, HueGroup } from '@/types/hueProxy';
export type { ThermorossiStatusResponse } from '@/types/thermorossiProxy';
export type { SonosDeviceResponse, SonosZoneResponse } from '@/types/sonosProxy';
export type { DirigeraSensor } from '@/types/dirigeraProxy';

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
// FritzBox interfaces (canonical — no proxy type file for these)
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
// DIRIGERA — uses proxy DirigeraSensor (flat, with is_open: boolean | null)
// ---------------------------------------------------------------------------

export interface DirigeraData {
  sensors: DirigeraSensor[] | null;
}

// ---------------------------------------------------------------------------
// Netatmo type
// ---------------------------------------------------------------------------

/**
 * Raw Netatmo cloud API homestatus response.
 * WS sends raw Netatmo homestatus envelope (body.home.rooms[]), NOT proxy format.
 * Adapter in lib/netatmo/netatmoWsAdapter.ts handles conversion.
 */
export type NetatmoData = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Thermorossi — alias for proxy ThermorossiStatusResponse
// ---------------------------------------------------------------------------

/**
 * WS sends the same shape as GET /api/v1/thermorossi/status.
 * Gains strict StoveState union (not string) plus data_freshness and last_poll_at.
 */
export type ThermorossiData = ThermorossiStatusResponse;

// ---------------------------------------------------------------------------
// Hue — uses proxy HueLight[] and HueGroup[] (flat, not nested Bridge format)
// ---------------------------------------------------------------------------

export interface HueData {
  lights: HueLight[] | null;
  groups: HueGroup[] | null;
}

// ---------------------------------------------------------------------------
// Sonos — uses proxy SonosDeviceResponse and SonosZoneResponse
// ---------------------------------------------------------------------------

export interface SonosData {
  speakers: SonosDeviceResponse[] | null;
  groups: SonosZoneResponse[] | null;
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
