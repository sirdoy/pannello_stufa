/**
 * API Route: Philips Hue Lights
 *
 * GET /api/hue/lights - Fetch all lights
 *
 * Uses Strategy Pattern (automatic local/remote fallback)
 * Protected: Requires Auth0 authentication
 */

import { withHueHandler, success } from '@/lib/core';
import { HueConnectionStrategy } from '@/lib/hue/hueConnectionStrategy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hue/lights
 * Fetch all Hue lights
 */
export const GET = withHueHandler(async () => {
  const provider = await HueConnectionStrategy.getProvider();
  const response = await provider.getLights() as any;

  return success({
    lights: response.data || [],
  });
}, 'Hue/Lights');
