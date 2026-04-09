import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getGroups } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hue/groups
 * Returns all Hue groups from the HA proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getGroups();
  return success({ groups: data });
}, 'Hue/Groups');
