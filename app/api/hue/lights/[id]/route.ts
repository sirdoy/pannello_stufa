/**
 * Philips Hue Single Light Control Route
 * GET: Fetch single light state
 * PUT: Update light state (on/off, brightness, color)
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

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface LightStateBody {
  on?: { on: boolean };
  dimming?: { brightness: number };
  [key: string]: unknown;
}

export const GET = withHueHandler(async (request, context: RouteContext) => {
  const id = await getPathParam(context, 'id');

  const provider = await HueConnectionStrategy.getProvider();
  const response = await provider.getLight(id) as any;

  return success({
    light: response.data?.[0] || null,
  });
}, 'Hue/Light/Get');

export const PUT = withHueHandler(async (request, context: RouteContext, session) => {
  const id = await getPathParam(context, 'id');
  const body = await parseJson(request) as LightStateBody;
  const user = session.user;

  const provider = await HueConnectionStrategy.getProvider();
  const response = await provider.setLightState(id, body) as any;

  // Log action
  const actionDescription = body.on !== undefined
    ? (body.on.on ? 'Luce accesa' : 'Luce spenta')
    : body.dimming !== undefined
      ? 'Luminosita modificata'
      : 'Luce modificata';

  const value = body.dimming?.brightness !== undefined
    ? `${Math.round(body.dimming.brightness)}%`
    : body.on?.on !== undefined
      ? (body.on.on ? 'ON' : 'OFF')
      : null;

  await adminDbPush('log', {
    action: actionDescription,
    device: DEVICE_TYPES.LIGHTS,
    value,
    lightId: id,
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
}, 'Hue/Light/Update');
