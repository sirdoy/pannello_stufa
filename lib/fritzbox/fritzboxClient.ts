/**
 * Fritz!Box Client
 *
 * Thin wrapper around the shared HA proxy client (haGet).
 * Handles response transformation from raw API format to internal types.
 * Auth is handled by haGet via X-API-Key header (no JWT, no credentials).
 *
 * Endpoints:
 *   /health              - Proxy health check
 *   /api/v1/devices      - Network device list
 *   /api/v1/bandwidth    - Current bandwidth stats
 *   /api/v1/history/bandwidth - Historical bandwidth data
 *   /api/v1/wan          - WAN connection status
 */

import { haGet } from '@/lib/haClient';

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
 * Raw: { devices: [{ ip, name, mac, status: 0|1 }], is_stale, fetched_at }
 * Returns: array of transformed devices
 */
async function getDevices(): Promise<Array<{ id: string; name: string; ip: string; mac: string; active: boolean }>> {
  const raw = await haGet<{
    devices: Array<{ ip: string; name: string; mac: string; status: number }>;
    is_stale: boolean;
    fetched_at: string;
  }>('/api/v1/devices');

  return (raw.devices || []).map(d => ({
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
 * Raw: { upstream_bps, downstream_bps, is_stale, fetched_at }
 * Returns: transformed BandwidthData
 */
async function getBandwidth(): Promise<{ download: number; upload: number; timestamp: number }> {
  const raw = await haGet<{
    upstream_bps: number;
    downstream_bps: number;
    is_stale: boolean;
    fetched_at: string;
  }>('/api/v1/bandwidth');

  return {
    download: raw.downstream_bps / 1_000_000, // bps → Mbps
    upload: raw.upstream_bps / 1_000_000,
    timestamp: new Date(raw.fetched_at).getTime(),
  };
}

/**
 * Get historical bandwidth data
 *
 * Raw: { records: [{ timestamp, bytes_sent, bytes_received, upstream_rate, downstream_rate }], hours_requested, record_count }
 * Returns: array of { time, download, upload } points sorted ascending
 */
async function getBandwidthHistory(hours: number = 24): Promise<Array<{ time: number; download: number; upload: number }>> {
  type HistoryRecord = { timestamp: number; bytes_sent: number; bytes_received: number; upstream_rate: number; downstream_rate: number };
  type HistoryResponse = { records: HistoryRecord[]; hours_requested: number; record_count: number };

  const data = await haGet<HistoryResponse>(`/api/v1/history/bandwidth?hours=${hours}`);
  const records = data.records ?? [];

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
    fetched_at: string;
  }>('/api/v1/wan');

  return {
    connected: raw.is_connected,
    uptime: raw.uptime,
    externalIp: raw.external_ip || undefined,
    linkSpeed: raw.max_downstream_bps ? raw.max_downstream_bps / 1_000_000 : undefined,
    timestamp: new Date(raw.fetched_at).getTime(),
  };
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
};
