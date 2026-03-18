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
};
