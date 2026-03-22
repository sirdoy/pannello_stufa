import { withAuthAndErrorHandler, success, created } from '@/lib/core';
import { registryProxy } from '@/lib/registry';
import type { DeviceCreate } from '@/types/registry';

export const dynamic = 'force-dynamic';

/**
 * GET /api/registry/devices
 * Returns paginated list of registered devices. Requires authentication.
 * Query params: limit (number), offset (number), provider_name (string)
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const sp = request.nextUrl.searchParams;
  const data = await registryProxy.getDevices({
    limit: sp.has('limit') ? Number(sp.get('limit')) : undefined,
    offset: sp.has('offset') ? Number(sp.get('offset')) : undefined,
    provider_name: sp.get('provider_name') ?? undefined,
  });
  return success(data as unknown as Record<string, unknown>);
}, 'Registry/Devices');

/**
 * POST /api/registry/devices
 * Registers a new device. Requires authentication.
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = (await request.json()) as DeviceCreate;
  const data = await registryProxy.registerDevice(body);
  return created(data as unknown as Record<string, unknown>);
}, 'Registry/Devices/Register');
