/**
 * Philips Hue Scenes Route
 * GET: Fetch all scenes
 */

import {
  withAuthAndErrorHandler,
  success,
  hueNotConnected,
  hueNotOnLocalNetwork,
} from '@/lib/core';
import HueApi from '@/lib/hue/hueApi';
import { getHueConnection } from '@/lib/hue/hueLocalHelper';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  // Get Hue connection from Firebase
  const connection = await getHueConnection();

  if (!connection) {
    return hueNotConnected();
  }

  try {
    // Fetch scenes from Hue API
    const hueApi = new HueApi(connection.bridgeIp, connection.username);
    const response = await hueApi.getScenes();

    return success({
      scenes: response.data || [],
    });
  } catch (err) {
    // Handle network timeout (not on local network)
    if (err.message === 'NETWORK_TIMEOUT') {
      return hueNotOnLocalNetwork();
    }
    throw err;
  }
}, 'Hue/Scenes');
