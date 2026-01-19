/**
 * Philips Hue Scene Activation Route
 * PUT: Activate a scene
 * ✅ Protected by Auth0 authentication
 */

import { NextResponse } from 'next/server';
import HueApi from '@/lib/hue/hueApi';
import { getHueConnection } from '@/lib/hue/hueLocalHelper';
import { auth0 } from '@/lib/auth0';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';

export const dynamic = 'force-dynamic';

export const PUT = auth0.withApiAuthRequired(async function handler(request, { params }) {
  try {
    const { id } = await params;
    const session = await auth0.getSession(request);
    const user = session?.user;

    // Get Hue connection from Firebase
    const connection = await getHueConnection();

    if (!connection) {
      return NextResponse.json({
        error: 'NOT_CONNECTED',
        message: 'Hue bridge not connected. Please pair first.',
        reconnect: true,
      }, { status: 401 });
    }

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

    return NextResponse.json({
      success: true,
      data: response.data || [],
    });

  } catch (error) {
    console.error('❌ Hue scene activation error:', error);

    // Handle network timeout (not on local network)
    if (error.message === 'NETWORK_TIMEOUT') {
      return NextResponse.json({
        error: 'NOT_ON_LOCAL_NETWORK',
        message: 'Bridge Hue non raggiungibile. Assicurati di essere sulla stessa rete locale del bridge.',
        reconnect: false,
      }, { status: 503 });
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
