import { withAuthAndErrorHandler, success, noContent } from '@/lib/core';
import { registryProxy } from '@/lib/registry';
import type { DeviceUpdate } from '@/types/registry';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/registry/devices/[device_id]
 * Updates a registered device's name and type. Requires authentication.
 */
export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const params = await context.params;
  const device_id = params['device_id'] ?? '';
  const body = (await request.json()) as DeviceUpdate;
  const data = await registryProxy.updateDevice(Number(device_id), body);
  return success(data as unknown as Record<string, unknown>);
}, 'Registry/Devices/Update');

/**
 * DELETE /api/registry/devices/[device_id]
 * Unregisters a device. Requires authentication.
 */
export const DELETE = withAuthAndErrorHandler(async (_request, context) => {
  const params = await context.params;
  const device_id = params['device_id'] ?? '';
  await registryProxy.unregisterDevice(Number(device_id));
  return noContent();
}, 'Registry/Devices/Delete');
