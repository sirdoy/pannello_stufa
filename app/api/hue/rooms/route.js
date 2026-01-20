/**
 * Philips Hue Rooms Route
 * GET: Fetch all rooms with their grouped lights
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
    // Fetch rooms from Hue API
    const hueApi = new HueApi(connection.bridgeIp, connection.username);
    const roomsResponse = await hueApi.getRooms();
    const zonesResponse = await hueApi.getZones();

    // Combine rooms and zones
    const rooms = [
      ...(roomsResponse.data || []),
      ...(zonesResponse.data || []),
    ];

    return success({
      rooms,
    });
  } catch (err) {
    // Handle network timeout (not on local network)
    if (err.message === 'NETWORK_TIMEOUT') {
      return hueNotOnLocalNetwork();
    }
    throw err;
  }
}, 'Hue/Rooms');
