import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHealth } from '@/lib/dirigera/dirigeraProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/dirigera/health
 * Returns DIRIGERA hub connection status, firmware, and sensor count.
 * Protected: Requires an authenticated session
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Dirigera/Health');
