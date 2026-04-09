/**
 * API Route: Netatmo Homestatus
 *
 * GET /api/v1/netatmo/homestatus
 *
 * Returns current room temperatures and heating status from the HA proxy.
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyHomestatus } from '@/lib/netatmo/netatmoProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getProxyHomestatus();
  return success(data as unknown as Record<string, unknown>);
}, 'Netatmo/Homestatus');
