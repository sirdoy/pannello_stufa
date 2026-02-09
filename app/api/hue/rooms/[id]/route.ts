/**
 * Philips Hue Room Control Route
 * GET: Fetch room's grouped light state
 * PUT: Update all lights in room (on/off, brightness, color)
 *
 * Uses Strategy Pattern (automatic local/remote fallback)
 */

import {
  withHueHandler,
  success,
  getPathParam,
  parseJson,
} from '@/lib/core';
import { HueConnectionStrategy } from '@/lib/hue/hueConnectionStrategy';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';

export const dynamic = 'force-dynamic';

interface GroupedLightStateBody {
  on?: { on: boolean };
  dimming?: { brightness: number };
  [key: string]: unknown;
}

export const GET = withHueHandler(async (request, context, session) => {
  const id = await getPathParam(context, 'id');

  const provider = await HueConnectionStrategy.getProvider();
  const response = await provider.getGroupedLight(id) as any;

  return success({
    groupedLight: response.data?.[0] || null,
  });
}, 'Hue/Room/Get');

export const PUT = withHueHandler(async (request, context, session) => {
  const id = await getPathParam(context, 'id');
  const body = await parseJson(request) as GroupedLightStateBody;
  const user = session.user;

  const provider = await HueConnectionStrategy.getProvider();
  const response = await provider.setGroupedLightState(id, body) as any;

  // Log action
  const actionDescription = body.on !== undefined
    ? (body.on.on ? 'Stanza accesa' : 'Stanza spenta')
    : body.dimming !== undefined
      ? 'Luminosita stanza modificata'
      : 'Luci stanza modificate';

  const value = body.dimming?.brightness !== undefined
    ? `${Math.round(body.dimming.brightness)}%`
    : body.on?.on !== undefined
      ? (body.on.on ? 'ON' : 'OFF')
      : null;

  await adminDbPush('log', {
    action: actionDescription,
    device: DEVICE_TYPES.LIGHTS,
    value,
    roomId: id,
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
}, 'Hue/Room/Update');
