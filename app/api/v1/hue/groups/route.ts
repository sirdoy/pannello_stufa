import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getGroups } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hue/groups
 * Returns all Hue groups from the HA proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  // The HA proxy already wraps the array as `{ groups, count, is_stale, fetched_at }`.
  // Spread the payload into success() so the client sees a flat
  // `{ success, groups, count, … }` envelope; previously we double-wrapped
  // (`success({ groups: data })`) and consumers had to peel two layers.
  const data = await getGroups();
  return success({ ...data });
}, 'Hue/Groups');
