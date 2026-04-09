import { withAuthAndErrorHandler, success, getPathParam } from '@/lib/core';
import { getGroup } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hue/groups/[groupId]
 * Returns a single Hue group by ID from the HA proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const data = await getGroup(groupId);
  return success(data as unknown as Record<string, unknown>);
}, 'Hue/Group/Get');
