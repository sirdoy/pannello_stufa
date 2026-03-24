import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHealth } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dirigera/health
 * Returns DIRIGERA hub connection status, firmware, and sensor count.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Dirigera/Health');
