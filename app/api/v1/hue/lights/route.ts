import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getLights } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hue/lights
 * Returns all Hue lights from the HA proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  // The HA proxy already wraps the array as `{ lights, count, is_stale, fetched_at }`.
  // Spread the payload into success() so the client sees a flat
  // `{ success, lights, count, … }` envelope; previously we double-wrapped
  // (`success({ lights: data })`) and consumers had to peel two layers.
  const data = await getLights();
  return success({ ...data });
}, 'Hue/Lights');
