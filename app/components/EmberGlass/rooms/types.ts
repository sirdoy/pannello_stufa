/**
 * Phase 179 — Rooms tab canonical type contracts.
 *
 * RoomDevice, RoomConfig, DeviceKind, AggregatorState are the stable
 * contracts consumed by every Wave 1+ component (RoomCard, RoomSheet,
 * DeviceCard, DeviceBody, all *Body files, rooms-config.ts, getDevicesForRoom.ts).
 *
 * AggregatorState field shapes match RESEARCH.md §Aggregator Reconciliation
 * (NOT the bundle's idealized state fixture).
 *
 * Stability contract: these types are frozen at Wave 0 and MUST NOT change
 * without updating all downstream consumers.
 */

export type DeviceKind =
  | 'stove'
  | 'thermo'
  | 'valve'
  | 'light'
  | 'plug'
  | 'sonos'
  | 'tv'
  | 'shade'
  | 'camera'
  | 'sensor';

export interface RoomConfig {
  name: 'Soggiorno' | 'Cucina' | 'Camera' | 'Studio' | 'Bagno' | 'Ingresso';
  tone: string; // 'var(--accent)' or hex
  icon: 'home' | 'moon' | 'droplet';
}

export interface RoomDevice {
  kind: DeviceKind;
  name: string; // displayed in DeviceCard header
  on: boolean;
  value: string; // status-line right-side string ("21.3° → 21°", "450W", etc.) — see UI-SPEC §Copywriting Contract
  tone: string; // category color used by DeviceChip + DeviceCard tinting
  mock?: boolean; // true for EXTRA_DEVICES static entries
  extra: Record<string, unknown>; // kind-specific payload — bodies down-cast (see UI-SPEC §Data Aggregation Contract)
}

/**
 * AggregatorState — the literal built by RoomsTab orchestrator from real hook outputs.
 *
 * Field shapes are verified against live hooks (RESEARCH.md §Aggregator Reconciliation):
 * - stove: no `temp` field exposed by useStoveData; `powerLevel`/`fanLevel` nullable → coerce ?? 0
 * - thermostat: zones merged from topology.rooms + status.rooms; kind from modules.type (NATherm1 → thermo, NRV → valve)
 * - lights: room_name from HueLight.room_name (string | null); brightness 0-254 → caller converts to 0-100%
 * - plugs: id from device_id; name from custom_name ?? device_id; on from switch_on === true; power from power_w ?? 0
 * - sonos: groups from zones[]; playing from playback[group_id].transport_state === 'PLAYING'; volume from volumes[coordinator_uid].volume
 */
export interface AggregatorState {
  stove: {
    on: boolean;
    temp: number; // placeholder — useStoveData has no temp field; aggregator passes 0 (RESEARCH deviation)
    powerLevel: number;
    fanLevel: number;
    target?: number; // placeholder — no Thermorossi setpoint endpoint (deferred)
  };
  thermostat: {
    zones: Array<{
      name: string;
      on: boolean;
      current: number;
      target: number;
      kind: 'thermo' | 'valve';
      roomId: string;
    }>;
  };
  lights: {
    lights: Array<{
      name: string;
      on: boolean;
      room_name: string | null;
      groupId: string;
      brightness?: number; // 0-100 percent (caller converts from Hue's 0-254)
    }>;
  };
  plugs: {
    plugs: Array<{
      id: string;
      name: string;
      on: boolean;
      power: number;
      today_kwh?: number;
    }>;
  };
  sonos: {
    groups: Array<{
      id: string;
      name: string;
      playing: boolean;
      track: string;
      artist: string;
      volume: number;
      coordinator: string;
    }>;
  };
}
