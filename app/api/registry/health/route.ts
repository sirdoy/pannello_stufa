import { withErrorHandler, success } from '@/lib/core';
import { registryProxy } from '@/lib/registry';

export const dynamic = 'force-dynamic';

/**
 * GET /api/registry/health
 * Returns registry health stats (type count, device count). Public — no auth required.
 */
export const GET = withErrorHandler(async () => {
  const data = await registryProxy.getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Registry/Health');
