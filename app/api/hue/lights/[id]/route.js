/**
 * Philips Hue Single Light Control Route
 * GET: Fetch single light state
 * PUT: Update light state (on/off, brightness, color)
 */

import {
  withAuthAndErrorHandler,
  success,
  hueNotConnected,
  hueNotOnLocalNetwork,
  getPathParam,
  parseJson,
} from '@/lib/core';
import HueApi from '@/lib/hue/hueApi';
import { getHueConnection } from '@/lib/hue/hueLocalHelper';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request, context) => {
  const id = await getPathParam(context, 'id');

  // Get Hue connection from Firebase
  const connection = await getHueConnection();

  if (!connection) {
    return hueNotConnected();
  }

  try {
    // Fetch light from Hue API
    const hueApi = new HueApi(connection.bridgeIp, connection.username);
    const response = await hueApi.getLight(id);

    return success({
      light: response.data?.[0] || null,
    });
  } catch (err) {
    // Handle network timeout (not on local network)
    if (err.message === 'NETWORK_TIMEOUT') {
      return hueNotOnLocalNetwork();
    }
    throw err;
  }
}, 'Hue/Light/Get');

export const PUT = withAuthAndErrorHandler(async (request, context, session) => {
  const id = await getPathParam(context, 'id');
  const body = await parseJson(request);
  const user = session.user;

  // Get Hue connection from Firebase
  const connection = await getHueConnection();

  if (!connection) {
    return hueNotConnected();
  }

  try {
    // Update light state
    const hueApi = new HueApi(connection.bridgeIp, connection.username);
    const response = await hueApi.setLightState(id, body);

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
  } catch (err) {
    // Handle network timeout (not on local network)
    if (err.message === 'NETWORK_TIMEOUT') {
      return hueNotOnLocalNetwork();
    }
    throw err;
  }
}, 'Hue/Light/Update');
