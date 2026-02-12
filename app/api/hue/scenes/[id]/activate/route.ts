/**
 * Philips Hue Scene Activation Route
 * PUT: Activate a scene
 *
 * Uses Strategy Pattern (automatic local/remote fallback)
 */

import {
  withHueHandler,
  withIdempotency,
  success,
  getPathParam,
} from '@/lib/core';
import { HueConnectionStrategy } from '@/lib/hue/hueConnectionStrategy';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';

export const dynamic = 'force-dynamic';

export const PUT = withHueHandler(
  withIdempotency(async (request, context, session) => {
    const id = await getPathParam(context, 'id');
    const user = session.user;

    const provider = await HueConnectionStrategy.getProvider();
    const response = await provider.activateScene(id) as any;

    // Log action
    await adminDbPush('log', {
      action: 'Scena attivata',
      device: DEVICE_TYPES.LIGHTS,
      sceneId: id,
      timestamp: Date.now(),
      user: user ? {
        email: user.email,
        name: user.name,
        picture: user.picture,
        sub: user.sub,
      } : null,
      source: 'manual',
    });

    return success({
      data: response.data || [],
    });
  }),
  'Hue/Scene/Activate'
);
