/**
 * Philips Hue Rooms Route
 * GET: Fetch all rooms with their grouped lights
 * ✅ Protected by Auth0 authentication
 */

import { NextResponse } from 'next/server';
import HueApi from '@/lib/hue/hueApi';
import { getHueConnection } from '@/lib/hue/hueLocalHelper';
import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

export const GET = auth0.withApiAuthRequired(async function handler(request) {
  try {
    // Get Hue connection from Firebase
    const connection = await getHueConnection();

    if (!connection) {
      return NextResponse.json({
        error: 'NOT_CONNECTED',
        message: 'Hue bridge not connected. Please pair first.',
        reconnect: true,
      }, { status: 401 });
    }

    // Fetch rooms from Hue API
    const hueApi = new HueApi(connection.bridgeIp, connection.username);
    const roomsResponse = await hueApi.getRooms();
    const zonesResponse = await hueApi.getZones();

    // Combine rooms and zones
    const rooms = [
      ...(roomsResponse.data || []),
      ...(zonesResponse.data || []),
    ];

    return NextResponse.json({
      rooms,
      success: true,
    });

  } catch (error) {
    console.error('❌ Hue rooms fetch error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
