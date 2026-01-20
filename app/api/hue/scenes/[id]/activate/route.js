/**
 * Philips Hue Scene Activation Route
 * PUT: Activate a scene
 */

import {
  withAuthAndErrorHandler,
  success,
  hueNotConnected,
  hueNotOnLocalNetwork,
  getPathParam,
} from '@/lib/core';
import HueApi from '@/lib/hue/hueApi';
import { getHueConnection } from '@/lib/hue/hueLocalHelper';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';

export const dynamic = 'force-dynamic';

export const PUT = withAuthAndErrorHandler(async (request, context, session) => {
  const id = await getPathParam(context, 'id');
  const user = session.user;

  // Get Hue connection from Firebase
  const connection = await getHueConnection();

  if (!connection) {
    return hueNotConnected();
  }

  try {
    // Activate scene
    const hueApi = new HueApi(connection.bridgeIp, connection.username);
    const response = await hueApi.activateScene(id);

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
  } catch (err) {
    // Handle network timeout (not on local network)
    if (err.message === 'NETWORK_TIMEOUT') {
      return hueNotOnLocalNetwork();
    }
    throw err;
  }
}, 'Hue/Scene/Activate');
