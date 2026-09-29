import { withErrorHandler, withAuthAndErrorHandler, created, success } from '@/lib/core';
import { registryProxy } from '@/lib/registry';
import type { DeviceTypeCreate } from '@/types/registry';

export const dynamic = 'force-dynamic';

/**
 * GET /api/registry/types
 * Returns all device types (built-in + custom). Public — no auth required.
 * Array wrapped under `types` — success() would spread a bare array into an object.
 */
export const GET = withErrorHandler(async () => {
  const data = await registryProxy.getTypes();
  return success({ types: data });
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
