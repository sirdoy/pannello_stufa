import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getLights } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hue/lights
 * Returns all Hue lights from the HA proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getLights();
  return success({ lights: data });
}, 'Hue/Lights');
