import { withErrorHandler, withAuthAndErrorHandler, success, created } from '@/lib/core';
import { registryProxy } from '@/lib/registry';
import type { DeviceTypeCreate } from '@/types/registry';

export const dynamic = 'force-dynamic';

/**
 * GET /api/registry/types
 * Returns all device types (built-in + custom). Public — no auth required.
 */
export const GET = withErrorHandler(async () => {
  const data = await registryProxy.getTypes();
  return success(data as unknown as Record<string, unknown>);
}, 'Registry/Types');

/**
 * POST /api/registry/types
 * Creates a custom device type. Requires authentication.
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = (await request.json()) as DeviceTypeCreate;
  const data = await registryProxy.createType(body);
  return created(data as unknown as Record<string, unknown>);
}, 'Registry/Types/Create');
