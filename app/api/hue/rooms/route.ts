import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getGroups } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hue/rooms
 * Returns all Hue groups (rooms, zones) from the HA proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getGroups();
  return success({ groups: data });
}, 'Hue/Rooms');
