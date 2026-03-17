/**
 * Raspberry Pi Client
 *
 * Thin wrapper around the shared HA proxy client (haGet).
 * No response transformation — all endpoints return data directly as-is.
 * Auth is handled by haGet via X-API-Key header (no JWT, no credentials).
 *
 * Endpoints:
 *   /api/v1/raspi/health  - Provider health check
 *   /api/v1/raspi/cpu     - CPU usage percentage
 *   /api/v1/raspi/memory  - RAM usage statistics
 *   /api/v1/raspi/disk    - Disk usage for root partition
 *   /api/v1/raspi/system  - Aggregated system stats
 */

import { haGet } from '@/lib/haClient';
import type {
  RaspiHealthResponse,
  CpuResponse,
  MemoryResponse,
  DiskResponse,
  SystemResponse,
} from '@/types/raspi';

/**
 * Get Raspberry Pi provider health status
 */
async function getHealth(): Promise<RaspiHealthResponse> {
  return haGet<RaspiHealthResponse>('/api/v1/raspi/health');
}

/**
 * Get current CPU usage percentage
 */
async function getCpu(): Promise<CpuResponse> {
  return haGet<CpuResponse>('/api/v1/raspi/cpu');
}

/**
 * Get RAM usage statistics
 */
async function getMemory(): Promise<MemoryResponse> {
  return haGet<MemoryResponse>('/api/v1/raspi/memory');
}

/**
 * Get disk usage for root partition
 */
async function getDisk(): Promise<DiskResponse> {
  return haGet<DiskResponse>('/api/v1/raspi/disk');
}

/**
 * Get aggregated system statistics
 */
async function getSystem(): Promise<SystemResponse> {
  return haGet<SystemResponse>('/api/v1/raspi/system');
}

/**
 * Raspberry Pi client object
 */
export const raspiClient = {
  getHealth,
  getCpu,
  getMemory,
  getDisk,
  getSystem,
};
