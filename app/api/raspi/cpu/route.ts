import { withAuthAndErrorHandler, success } from '@/lib/core';
import { raspiClient } from '@/lib/raspi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/raspi/cpu
 * Returns current CPU usage percentage
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await raspiClient.getCpu();
  return success(data as unknown as Record<string, unknown>);
}, 'Raspi/Cpu');
