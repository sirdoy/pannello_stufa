/**
 * API Route: Hue Single Light Read
 *
 * GET /api/v1/hue/lights/{lightId}
 *
 * Returns the current state of a single Hue light including:
 * - On/off state, brightness, color temperature
 * - Room enrichment, capability tier, reachability
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success, getPathParam } from '@/lib/core';
import { getLight } from '@/lib/hue/hueProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/hue/lights/{lightId}
 * Returns single light state from HA proxy.
 */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const lightId = await getPathParam(context, 'lightId');
  const data = await getLight(lightId);
  return success(data as unknown as Record<string, unknown>);
}, 'Hue/Light/Get');
