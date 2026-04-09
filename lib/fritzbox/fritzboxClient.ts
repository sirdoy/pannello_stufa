/**
 * Fritz!Box Client
 *
 * Thin wrapper around the shared HA proxy client (haGet).
 * Handles response transformation from raw API format to internal types.
 * Auth is handled by haGet via X-API-Key header (no JWT, no credentials).
 *
 * Endpoints (HA proxy base path: /api/v1/fritzbox):
 *   /health                          - Proxy health check
 *   /api/v1/fritzbox/devices         - Network device list (paginated)
 *   /api/v1/fritzbox/bandwidth       - Current bandwidth stats
 *   /api/v1/fritzbox/history/bandwidth - Historical bandwidth data (paginated)
 *   /api/v1/fritzbox/wan             - WAN connection status
 */

import { haGet } from '@/lib/haClient';

/** Paginated response envelope used by all list endpoints */
interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  limit: number;
  offset: number;
}

/**
 * Parse fetched_at timestamp from HA proxy.
 * The proxy returns non-standard ISO 8601 with both offset and Z suffix
 * (e.g. "2026-03-18T09:01:49.196496+00:00Z") which Date can't parse.
 * Strips the trailing Z when an offset is already present.
 */
function parseTimestamp(fetchedAt: string | null): number {
  if (!fetchedAt) return Date.now();
  // Fix duplicate timezone: "+00:00Z" → "+00:00"
  const normalized = fetchedAt.replace(/([+-]\d{2}:\d{2})Z$/, '$1');
  const ms = new Date(normalized).getTime();
  return isNaN(ms) ? Date.now() : ms;
}

/**
 * Ping API to check connectivity
 * Uses /health endpoint with a 10s timeout
 */
async function ping(): Promise<unknown> {
  return haGet<unknown>('/health', { timeout: 10_000 });
}

/**
 * Debug: Make a request and return the raw response.
 * Used by debug endpoints to inspect external API response format.
 */
async function debugRequest(endpoint: string): Promise<unknown> {
  return haGet<unknown>(endpoint);
}

/**
 * Get network devices connected to Fritz!Box
 *
 * Raw: { items: [{ ip, name, mac, status: 0|1, provider_type }], total_count, limit, offset }
 * Returns: array of transformed devices
 */
async function getDevices(): Promise<Array<{ id: string; name: string; ip: string; mac: string; active: boolean }>> {
  const raw = await haGet<PaginatedResponse<{
    ip: string; name: string; mac: string; status: number; provider_type: string | null;
  }>>('/api/v1/fritzbox/devices?limit=1000');

  return (raw.items || []).map(d => ({
    id: d.mac || d.ip, // Use MAC as ID, fallback to IP
    name: d.name || d.ip,
    ip: d.ip,
    mac: d.mac,
    active: d.status === 1,
  }));
}

/**
 * Get bandwidth usage statistics
 *
 * Raw: { upstream_bps, downstream_bps, bytes_sent, bytes_received, is_stale, fetched_at }
 * Returns: transformed BandwidthData
 */
async function getBandwidth(): Promise<{ download: number; upload: number; timestamp: number }> {
  const raw = await haGet<{
    upstream_bps: number;
    downstream_bps: number;
    bytes_sent: number;
    bytes_received: number;
    is_stale: boolean;
    fetched_at: string | null;
  }>('/api/v1/fritzbox/bandwidth');

  return {
    download: raw.downstream_bps / 1_000_000, // bps → Mbps
    upload: raw.upstream_bps / 1_000_000,
    timestamp: parseTimestamp(raw.fetched_at),
  };
}

/**
 * Get historical bandwidth data
 *
 * Raw: { items: [{ timestamp, bytes_sent, bytes_received, upstream_rate, downstream_rate, ... }], total_count, limit, offset }
 * Returns: array of { time, download, upload } points sorted ascending
 */
async function getBandwidthHistory(hours: number = 24): Promise<Array<{ time: number; download: number; upload: number }>> {
  type HistoryRecord = {
    timestamp: number;
    bytes_sent: number;
    bytes_received: number;
    upstream_rate: number;
    downstream_rate: number;
    latency_ms: number | null;
    connection_uptime: number | null;
    external_ip: string | null;
    connection_type: string | null;
  };

  const data = await haGet<PaginatedResponse<HistoryRecord>>(
    `/api/v1/fritzbox/history/bandwidth?hours=${hours}&limit=1000`
  );
  const records = data.items ?? [];

  // Transform: timestamp (Unix seconds) → ms, rates (bps) → Mbps
  return records
    .map(item => ({
      time: item.timestamp * 1000,
      download: item.downstream_rate / 1_000_000,
      upload: item.upstream_rate / 1_000_000,
    }))
    .sort((a, b) => a.time - b.time);
}

/**
 * Get WAN connection status
 *
 * Raw: { external_ip, is_connected, is_linked, uptime, max_upstream_bps, max_downstream_bps, ... }
 * Returns: transformed WanData
 */
async function getWanStatus(): Promise<{
  connected: boolean; uptime: number; externalIp?: string; linkSpeed?: number; timestamp: number;
}> {
  const raw = await haGet<{
    external_ip: string;
    is_connected: boolean;
    is_linked: boolean;
    uptime: number;
    max_downstream_bps: number;
    max_upstream_bps: number;
    is_stale: boolean;
    fetched_at: string | null;
  }>('/api/v1/fritzbox/wan');

  return {
    connected: raw.is_connected,
    uptime: raw.uptime,
    externalIp: raw.external_ip || undefined,
    linkSpeed: raw.max_downstream_bps ? raw.max_downstream_bps / 1_000_000 : undefined,
    timestamp: parseTimestamp(raw.fetched_at),
  };
}

/**
 * Get device connection/disconnection events from proxy
 *
 * Raw: { items: [{ timestamp, mac, name, ip, event_type }], total_count, limit, offset }
 * Returns: array of DeviceEvent (camelCase, timestamp in ms)
 */
async function getDeviceEvents(
  hours: number = 24,
  mac?: string
): Promise<Array<{ deviceMac: string; deviceName: string; deviceIp: string; eventType: 'connected' | 'disconnected'; timestamp: number }>> {
  type ProxyEvent = { timestamp: number; mac: string; name: string; ip: string; event_type: 'connected' | 'disconnected' };

  const params = new URLSearchParams({ hours: String(hours), limit: '1000' });
  if (mac) params.set('mac', mac);

  const data = await haGet<PaginatedResponse<ProxyEvent>>(
    `/api/v1/fritzbox/history/device-events?${params}`,
    { timeout: 30_000 } // Device event computation can be slow on large datasets
  );

  return (data.items ?? []).map(e => ({
    deviceMac: e.mac,
    deviceName: e.name,
    deviceIp: e.ip,
    eventType: e.event_type,
    timestamp: e.timestamp * 1000, // Unix seconds → ms
  }));
}

// ─── System & Network Services (FRITZ-01 through FRITZ-07) ───────────────────

/**
 * System information response from HA proxy.
 * Raw pass-through — no transformation applied.
 */
interface SystemResponse {
  model: string;
  firmware_version: string;
  update_available: string;
  device_uptime_seconds: number;
  device_uptime_formatted: string;
  is_stale: boolean;
  fetched_at: string | null;
}

/**
 * Get Fritz!Box system info (model, firmware, uptime) — FRITZ-01
 * Raw pass-through: no field transformation.
 */
async function getSystemInfo(): Promise<SystemResponse> {
  return haGet<SystemResponse>('/api/v1/fritzbox/system');
}

/** A single WiFi client connected to the Fritz!Box */
interface WiFiClientModel {
  hostname: string;
  mac: string;
  ip: string;
  band: string;
  ssid: string;
  signal_strength: number;
  link_speed_mbps: number;
  is_active: boolean;
}

/**
 * Get paginated list of connected WiFi clients — FRITZ-02
 * Supports optional `band`, `limit`, `offset` query params.
 */
async function getWifiClients(params?: URLSearchParams): Promise<PaginatedResponse<WiFiClientModel>> {
  const query = params?.toString() ? `?${params.toString()}` : '';
  return haGet<PaginatedResponse<WiFiClientModel>>(`/api/v1/fritzbox/wifi/clients${query}`);
}

/** A configured WiFi network (SSID) on the Fritz!Box */
interface WiFiNetworkModel {
  service: number;
  band: string;
  ssid: string;
  channel: number;
  possible_channels: string;
  is_enabled: boolean;
  beacon_type: string;
}

/** WiFi networks status response from HA proxy */
interface WiFiStatusResponse {
  networks: WiFiNetworkModel[];
  is_stale: boolean;
  fetched_at: string | null;
}

/**
 * Get configured WiFi networks with enabled/disabled status — FRITZ-03
 * Raw pass-through: no field transformation.
 */
async function getWifiNetworks(): Promise<WiFiStatusResponse> {
  return haGet<WiFiStatusResponse>('/api/v1/fritzbox/wifi/networks');
}

/** A DHCP reservation entry in the Fritz!Box */
interface DhcpReservationModel {
  ip: string;
  name: string;
  mac: string;
  interface_type: string;
  address_source: string;
}

/**
 * Get paginated DHCP reservations — FRITZ-04
 * Supports optional `limit`, `offset` query params.
 */
async function getDhcpReservations(params?: URLSearchParams): Promise<PaginatedResponse<DhcpReservationModel>> {
  const query = params?.toString() ? `?${params.toString()}` : '';
  return haGet<PaginatedResponse<DhcpReservationModel>>(`/api/v1/fritzbox/network/dhcp/reservations${query}`);
}

/** A port forwarding rule configured on the Fritz!Box */
interface PortForwardingRuleModel {
  external_port: number;
  internal_port: number;
  protocol: 'TCP' | 'UDP';
  internal_client: string;
  enabled: boolean;
  description: string;
  lease_duration: number;
}

/**
 * Get paginated port forwarding rules — FRITZ-05
 * Supports optional `limit`, `offset` query params.
 */
async function getPortForwarding(params?: URLSearchParams): Promise<PaginatedResponse<PortForwardingRuleModel>> {
  const query = params?.toString() ? `?${params.toString()}` : '';
  return haGet<PaginatedResponse<PortForwardingRuleModel>>(`/api/v1/fritzbox/network/port-forwarding${query}`);
}

/** UPnP status response from HA proxy */
interface UPnPStatusResponse {
  enabled: boolean;
  upnp_ports: PortForwardingRuleModel[];
  is_stale: boolean;
  fetched_at: string | null;
}

/**
 * Get UPnP status and active UPnP port mappings — FRITZ-06
 * Raw pass-through: no field transformation.
 */
async function getUpnpStatus(): Promise<UPnPStatusResponse> {
  return haGet<UPnPStatusResponse>('/api/v1/fritzbox/network/upnp');
}

/** A node (router or repeater) in the Fritz!Box mesh */
interface MeshNodeModel {
  uid: string;
  name: string;
  model: string;
  mac: string;
  vendor: string;
  is_meshed: boolean;
  device_category: string;
}

/** A link between two mesh nodes */
interface MeshLinkModel {
  source_uid: string;
  source_name: string;
  target_uid: string;
  target_name: string;
  type: string | null;
  state: string | null;
  cur_rx_kbps: number | null;
  cur_tx_kbps: number | null;
  max_rx_kbps: number | null;
  max_tx_kbps: number | null;
}

/** Mesh topology response from HA proxy */
interface MeshTopologyResponse {
  schema_version: string | null;
  node_count: number;
  link_count: number;
  nodes: MeshNodeModel[];
  links: MeshLinkModel[];
  is_stale: boolean;
  fetched_at: string | null;
}

/**
 * Get Fritz!Box mesh network topology — FRITZ-07
 * Raw pass-through: no field transformation.
 */
async function getMeshTopology(): Promise<MeshTopologyResponse> {
  return haGet<MeshTopologyResponse>('/api/v1/fritzbox/network/mesh');
}

// ─── History Tiers & Budget (FRITZ-08 through FRITZ-12) ──────────────────────

/** Hourly bandwidth aggregation record — FRITZ-08 */
interface BandwidthHourlyRecord {
  hour_timestamp: number;
  avg_upstream_rate: number;
  min_upstream_rate: number;
  max_upstream_rate: number;
  avg_downstream_rate: number;
  min_downstream_rate: number;
  max_downstream_rate: number;
  avg_bytes_sent: number;
  avg_bytes_received: number;
  sample_count: number;
}

/** Daily bandwidth aggregation record — FRITZ-09 */
interface BandwidthDailyRecord {
  day_timestamp: number;
  avg_upstream_rate: number;
  min_upstream_rate: number;
  max_upstream_rate: number;
  avg_downstream_rate: number;
  min_downstream_rate: number;
  max_downstream_rate: number;
  avg_bytes_sent: number;
  avg_bytes_received: number;
  sample_count: number;
}

/** Daily device count record (24 rows per day) — FRITZ-10 */
interface DeviceDailyRecord {
  day_timestamp: number;
  hour_bucket: number;    // 0-23
  online_count: number;
  offline_count: number;
  total_devices: number;
}

/** Auto-granularity bandwidth record with discriminator — FRITZ-11 */
interface BandwidthAggregatedRecord {
  timestamp: number;
  granularity: 'hourly' | 'daily';
  avg_upstream_rate: number;
  min_upstream_rate: number;
  max_upstream_rate: number;
  avg_downstream_rate: number;
  min_downstream_rate: number;
  max_downstream_rate: number;
  avg_bytes_sent: number;
  avg_bytes_received: number;
  sample_count: number;
}

/** Budget consumption statistics — FRITZ-12 */
interface BudgetStats {
  window_seconds: number;
  current_window_requests: number;
  soft_limit: number;
  hard_limit: number;
  total_lifetime_requests: number;
  warning_count: number;
  utilization_percent: number;
  status: 'ok' | 'warning' | 'danger';
  message: string;
}

/** Get hourly bandwidth history — FRITZ-08. Raw pass-through per D-05. */
async function getBandwidthHourly(params?: URLSearchParams): Promise<PaginatedResponse<BandwidthHourlyRecord>> {
  const query = params?.toString() ? `?${params.toString()}` : '';
  return haGet<PaginatedResponse<BandwidthHourlyRecord>>(`/api/v1/fritzbox/history/bandwidth/hourly${query}`);
}

/** Get daily bandwidth history — FRITZ-09. Raw pass-through per D-05. */
async function getBandwidthDaily(params?: URLSearchParams): Promise<PaginatedResponse<BandwidthDailyRecord>> {
  const query = params?.toString() ? `?${params.toString()}` : '';
  return haGet<PaginatedResponse<BandwidthDailyRecord>>(`/api/v1/fritzbox/history/bandwidth/daily${query}`);
}

/** Get daily device count history — FRITZ-10. Raw pass-through per D-05. */
async function getDevicesDaily(params?: URLSearchParams): Promise<PaginatedResponse<DeviceDailyRecord>> {
  const query = params?.toString() ? `?${params.toString()}` : '';
  return haGet<PaginatedResponse<DeviceDailyRecord>>(`/api/v1/fritzbox/history/devices/daily${query}`);
}

/** Get auto-granularity bandwidth history — FRITZ-11. Server decides hourly vs daily based on days param. Raw pass-through per D-05/D-09. */
async function getBandwidthAuto(params?: URLSearchParams): Promise<PaginatedResponse<BandwidthAggregatedRecord>> {
  const query = params?.toString() ? `?${params.toString()}` : '';
  return haGet<PaginatedResponse<BandwidthAggregatedRecord>>(`/api/v1/fritzbox/history/bandwidth/auto${query}`);
}

/** Get data budget statistics — FRITZ-12. No query params per D-08. Raw pass-through per D-05. */
async function getBudgetStats(): Promise<BudgetStats> {
  return haGet<BudgetStats>('/api/v1/fritzbox/budget-stats');
}

// --- Telephony (v19.0 FRITZ-01 through FRITZ-03) ---

/** A DECT handset registered with the Fritz!Box */
interface DectHandset {
  id: string;
  name: string;
  model: string;
  firmware_version: string;
  battery_charge_level: number | null;
  is_registered: boolean;
}

/** A call log entry from Fritz!Box */
interface CallRecord {
  id: string;
  call_type: string;
  number: string;
  name: string | null;
  duration_seconds: number;
  timestamp: number;
  port: string | null;
}

/** Answering machine (TAM) status response */
interface TamStatusResponse {
  enabled: boolean;
  new_messages: number;
  total_messages: number;
  is_stale: boolean;
  fetched_at: string | null;
}

/** Get registered DECT handsets -- FRITZ-01 (v19.0). Raw pass-through per D-01. */
async function getDectHandsets(): Promise<PaginatedResponse<DectHandset>> {
  return haGet<PaginatedResponse<DectHandset>>('/api/v1/fritzbox/telephony/dect');
}

/** Get paginated call history -- FRITZ-02 (v19.0). Supports limit/offset per D-03. */
async function getCallHistory(params?: URLSearchParams): Promise<PaginatedResponse<CallRecord>> {
  const query = params?.toString() ? `?${params.toString()}` : '';
  return haGet<PaginatedResponse<CallRecord>>(`/api/v1/fritzbox/telephony/calls${query}`);
}

/** Get answering machine status -- FRITZ-03 (v19.0). Raw pass-through per D-01. */
async function getTamStatus(): Promise<TamStatusResponse> {
  return haGet<TamStatusResponse>('/api/v1/fritzbox/telephony/tam');
}

/**
 * Fritz!Box client object — preserves existing route call patterns (fritzboxClient.method())
 */
export const fritzboxClient = {
  ping,
  debugRequest,
  getDevices,
  getBandwidth,
  getBandwidthHistory,
  getWanStatus,
  getDeviceEvents,
  getSystemInfo,
  getWifiClients,
  getWifiNetworks,
  getDhcpReservations,
  getPortForwarding,
  getUpnpStatus,
  getMeshTopology,
  // Phase 133 additions:
  getBandwidthHourly,
  getBandwidthDaily,
  getDevicesDaily,
  getBandwidthAuto,
  getBudgetStats,
  // Phase 162 telephony additions:
  getDectHandsets,
  getCallHistory,
  getTamStatus,
};
