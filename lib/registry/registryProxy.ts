/**
 * Device Registry Proxy Client
 *
 * Thin wrapper around the shared HA proxy client.
 * No response transformation — all endpoints return data directly as-is.
 * Auth is handled by haGet/haPost/haDelete via X-API-Key header.
 *
 * Endpoints:
 *   /api/v1/registry/types          - GET list, POST create
 *   /api/v1/registry/types/{slug}   - DELETE
 *   /api/v1/registry/devices        - GET list (paginated), POST register
 *   /api/v1/registry/devices/{id}   - PUT update, DELETE unregister
 *   /api/v1/registry/health         - GET health stats
 */

import { haGet, haPost, haPut, haDelete } from '@/lib/haClient';
import type { PaginatedResponse } from '@/types/common';
import type {
  DeviceType,
  DeviceTypeCreate,
  RegistryDevice,
  DeviceCreate,
  DeviceUpdate,
  RegistryHealthResponse,
} from '@/types/registry';

/** Get all device types (built-in + custom) */
async function getTypes(): Promise<DeviceType[]> {
  return haGet<DeviceType[]>('/api/v1/registry/types');
}

/** Create a custom device type */
async function createType(body: DeviceTypeCreate): Promise<DeviceType> {
  return haPost<DeviceType>('/api/v1/registry/types', body as unknown as Record<string, unknown>);
}

/** Delete a custom device type by slug */
async function deleteType(slug: string): Promise<void> {
  return haDelete(`/api/v1/registry/types/${slug}`);
}

/** Get registered devices with optional pagination and provider filter */
async function getDevices(params?: {
  limit?: number;
  offset?: number;
  provider_name?: string;
}): Promise<PaginatedResponse<RegistryDevice>> {
  const qs = new URLSearchParams();
  if (params?.limit !== undefined) qs.set('limit', String(params.limit));
  if (params?.offset !== undefined) qs.set('offset', String(params.offset));
  if (params?.provider_name) qs.set('provider_name', params.provider_name);
  const query = qs.toString();
  return haGet<PaginatedResponse<RegistryDevice>>(
    `/api/v1/registry/devices${query ? `?${query}` : ''}`
  );
}

/** Register a new device */
async function registerDevice(body: DeviceCreate): Promise<RegistryDevice> {
  return haPost<RegistryDevice>('/api/v1/registry/devices', body as unknown as Record<string, unknown>);
}

/** Update a registered device's name and type */
async function updateDevice(deviceId: number, body: DeviceUpdate): Promise<RegistryDevice> {
  return haPut<RegistryDevice>(
    `/api/v1/registry/devices/${deviceId}`,
    body as unknown as Record<string, unknown>
  );
}

/** Unregister a device by ID */
async function unregisterDevice(deviceId: number): Promise<void> {
  return haDelete(`/api/v1/registry/devices/${deviceId}`);
}

/** Get registry health stats (type count, device count) */
async function getHealth(): Promise<RegistryHealthResponse> {
  return haGet<RegistryHealthResponse>('/api/v1/registry/health');
}

/** Device Registry proxy client */
export const registryProxy = {
  getTypes,
  createType,
  deleteType,
  getDevices,
  registerDevice,
  updateDevice,
  unregisterDevice,
  getHealth,
};
