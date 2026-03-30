import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getPlugs } from '@/lib/tuya/tuyaProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tuya/plugs
 * Returns all configured Tuya smart plugs with current state and energy data.
 * Protected: Requires Auth0 authentication.
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getPlugs();
  return success(data as unknown as Record<string, unknown>);
}, 'Tuya/Plugs/List');
