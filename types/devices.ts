/**
 * Type definitions for the cross-provider device aggregator.
 * Source of truth: GET /api/v1/devices.
 *
 * Locked decisions (per .planning/phases/173-cross-provider-device-aggregator/173-CONTEXT.md):
 * - D-01: Slim core + optional fields. Required: id, name, provider_type. Optional: type, ip, mac, status, room.
 *         Absent optional fields are OMITTED (not null) — keeps payload small and TS narrowing precise.
 * - D-02: id is composite `{provider_type}:{native_id}` (e.g. "fritzbox:AA:BB:CC:DD:EE:FF", "raspi:host").
 * - D-03: provider_type is one of the 8 literal strings below.
 * - D-13: Response shape adds errors[] surfacing partial-provider failures (HTTP stays 200).
 */

/**
 * Source provider discriminator on aggregated Device items.
 * Mirrors the WebSocket Topic union in types/websocket.ts (same 8-provider set).
 */
export type ProviderType =
  | 'fritzbox'
  | 'hue'
  | 'sonos'
  | 'netatmo'
  | 'dirigera'
  | 'tuya'
  | 'raspi'
  | 'thermorossi';

/**
 * Aggregated cross-provider device representation (per D-01).
 * Required fields: id, name, provider_type.
 * Optional fields are OMITTED when absent (not set to null) — keeps payloads small
 * and lets `if (device.ip)` narrow correctly without explicit null checks.
 */
export interface Device {
  /** Composite id: `{provider_type}:{native_id}` (D-02). Globally unique across providers. */
  id: string;
  /** Display name. Required. */
  name: string;
  /** Source provider discriminator. Required. */
  provider_type: ProviderType;
  /** Device type (e.g. 'light', 'speaker', 'thermostat', 'plug', 'network_device'). Optional. */
  type?: string;
  /** Local IP if exposed by provider. Optional. */
  ip?: string;
  /** MAC address if exposed by provider. Optional. */
  mac?: string;
  /** Reachability: 1 = online, 0 = offline. Optional (omit when unknown). */
  status?: 0 | 1;
  /** Room/area name if exposed by provider. Optional. */
  room?: string;
}

/**
 * Per-provider failure entry surfaced when a provider's listing call rejects (D-13).
 * Multi-item providers (fritzbox, hue, sonos, netatmo, dirigera, tuya): on rejection,
 *   contribute zero items AND get an entry here.
 * Single-item providers (raspi, thermorossi): on rejection, emit a single item with
 *   status=0 and DO NOT get an entry here (asymmetry locked per RESEARCH.md Pitfall 4).
 */
export interface DeviceAggregatorError {
  provider_type: ProviderType;
  message: string;
}

/**
 * Response shape for GET /api/v1/devices.
 *
 * Mirrors PaginatedResponse<Device> (types/common.ts) plus errors[] for partial-failure
 * surfacing (D-13). HTTP status stays 200 even when errors[] is non-empty.
 */
export interface DeviceAggregatorResponse {
  items: Device[];
  total_count: number;
  limit: number;
  offset: number;
  errors: DeviceAggregatorError[];
}
