import { withAuthAndErrorHandler, success } from '@/lib/core';
import { raspiClient } from '@/lib/raspi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/raspi/health
 * Returns Raspberry Pi provider health status
 * Protected: Requires an authenticated session
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await raspiClient.getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Raspi/Health');
