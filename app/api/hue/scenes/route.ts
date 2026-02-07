/**
 * Philips Hue Scenes Route
 * GET: Fetch all scenes
 *
 * Uses Strategy Pattern (automatic local/remote fallback)
 */

import { withHueHandler, success } from '@/lib/core';
import { HueConnectionStrategy } from '@/lib/hue/hueConnectionStrategy';

export const dynamic = 'force-dynamic';

export const GET = withHueHandler(async () => {
  const provider = await HueConnectionStrategy.getProvider();
  const response = await provider.getScenes() as any;

  return success({
    scenes: response.data || [],
  });
}, 'Hue/Scenes');
