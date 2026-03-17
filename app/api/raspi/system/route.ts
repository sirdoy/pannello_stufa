import { withAuthAndErrorHandler, success } from '@/lib/core';
import { raspiClient } from '@/lib/raspi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/raspi/system
 * Returns aggregated system statistics (temperature, uptime, load, processes, network)
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await raspiClient.getSystem();
  return success(data);
}, 'Raspi/System');
