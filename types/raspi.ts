/**
 * Raspberry Pi Provider API Types
 *
 * TypeScript interfaces for all Raspberry Pi system stats endpoints.
 * Source of truth: docs/api/raspberry-pi.md
 */

export interface RaspiHealthResponse {
  status: "ok";
  data_freshness: "LIVE";
}

export interface CpuResponse {
  cpu_percent: number;
  data_freshness: "LIVE";
}

export interface MemoryResponse {
  used_bytes: number;
  total_bytes: number;
  percent: number;
  data_freshness: "LIVE";
}

export interface DiskResponse {
  used_bytes: number;
  total_bytes: number;
  percent: number;
  mount_point: "/";
  data_freshness: "LIVE";
}

export interface NetworkStats {
  bytes_sent: number;
  bytes_recv: number;
  interface: string;
}

export interface SystemResponse {
  cpu_temperature: number | null;
  uptime_seconds: number;
  load_avg_1: number;
  load_avg_5: number;
  load_avg_15: number;
  process_count: number;
  network: NetworkStats;
  data_freshness: "LIVE";
}
