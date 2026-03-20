import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getScenes } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hue/scenes
 * Returns all Hue scenes from the HA proxy, optionally filtered by group_id.
 * Query params: group_id (optional) — filter scenes to a single group
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const groupId = request.nextUrl.searchParams.get('group_id') ?? undefined;
  const data = await getScenes(groupId);
  return success(data as unknown as Record<string, unknown>);
}, 'Hue/Scenes');
