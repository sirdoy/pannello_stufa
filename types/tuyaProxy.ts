/**
 * TypeScript types for Tuya Proxy API responses.
 *
 * The proxy handles Tuya smart plug communication and caching server-side via
 * 30-second background polling (tinytuya LAN TCP). These types represent the
 * proxy's response shapes.
 *
 * See docs/api/tuya.md for the authoritative spec.
 */

// =============================================================================
// HEALTH TYPES
// =============================================================================

// Source: docs/api/tuya.md — TuyaDeviceHealth
export interface TuyaDeviceHealth {
  device_id: string;
  last_polled_at: number | null;  // Unix epoch float, null if never polled
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';
}

// Source: docs/api/tuya.md — TuyaHealth
export interface TuyaHealth {
  status: string;
  devices: TuyaDeviceHealth[];
}

// =============================================================================
// PLUG TYPES
// =============================================================================

// Source: docs/api/tuya.md — TuyaPlug (TuyaPlugResponse in server)
export interface TuyaPlug {
  device_id: string;
  switch_on: boolean | null;      // null when UNREACHABLE
  power_w: number | null;         // active power in watts
  voltage_v: number | null;       // mains voltage in volts
  current_ma: number | null;      // current draw in milliamps
  energy_kwh: number | null;      // cumulative energy consumed (kWh)
  countdown_s: number | null;     // remaining countdown in seconds (0 = no timer)
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';
  last_polled_at: number | null;  // Unix epoch float, null if never polled
  custom_name: string | null;     // from device registry, null if not registered
  device_type: string | null;     // device type slug from registry, null if not registered
}

// Source: docs/api/tuya.md — TuyaPlugMutation (TuyaPlugMutationResponse in server)
export interface TuyaPlugMutation extends TuyaPlug {
  data_confirmed: boolean;  // true if re-poll after command succeeded
}

// =============================================================================
// COMMAND TYPES
// =============================================================================

// Source: docs/api/tuya.md — TuyaSetStateRequest
export interface TuyaSetStateRequest {
  on: boolean;  // true = switch on, false = switch off
}

// Source: docs/api/tuya.md — TuyaSetTimerRequest
export interface TuyaSetTimerRequest {
  seconds: number;  // 0 cancels timer; max 86400 (24h)
}

// =============================================================================
// HISTORY TYPES
// =============================================================================

// Source: docs/api/tuya.md — TuyaHistoryItem
export interface TuyaHistoryItem {
  timestamp: number;                    // Unix epoch (seconds)
  device_id: string;
  granularity: 'raw' | 'hourly' | 'daily';
  // Raw fields (non-null for granularity="raw", null otherwise)
  switch_on?: boolean | null;
  power_w?: number | null;
  voltage_v?: number | null;
  current_ma?: number | null;
  energy_kwh?: number | null;
  // Aggregated fields (non-null for granularity="hourly"|"daily", null otherwise)
  avg_power_w?: number | null;
  min_voltage_v?: number | null;
  max_voltage_v?: number | null;
  max_current_ma?: number | null;
  energy_kwh_delta?: number | null;     // energy consumed during this period
  sample_count?: number | null;         // number of raw rows aggregated
}

// Source: docs/api/tuya.md — TuyaHistoryResponse
export interface TuyaHistoryResponse {
  device_id: string;
  granularity: 'raw' | 'hourly' | 'daily';
  period: { from: number; to: number };  // resolved epoch range
  page: number;
  page_size: number;
  total: number;
  items: TuyaHistoryItem[];
}
