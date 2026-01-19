/**
 * Philips Hue Room Control Route
 * GET: Fetch room's grouped light state
 * PUT: Update all lights in room (on/off, brightness, color)
 * ✅ Protected by Auth0 authentication
 */

import { NextResponse } from 'next/server';
import HueApi from '@/lib/hue/hueApi';
import { getHueConnection } from '@/lib/hue/hueLocalHelper';
import { auth0 } from '@/lib/auth0';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';

export const dynamic = 'force-dynamic';

export const GET = auth0.withApiAuthRequired(async function handler(request, { params }) {
  try {
    const { id } = await params;

    // Get Hue connection from Firebase
    const connection = await getHueConnection();

    if (!connection) {
      return NextResponse.json({
        error: 'NOT_CONNECTED',
        message: 'Hue bridge not connected. Please pair first.',
        reconnect: true,
      }, { status: 401 });
    }

    // Fetch grouped light (room state)
    const hueApi = new HueApi(connection.bridgeIp, connection.username);
    const response = await hueApi.getGroupedLight(id);

    return NextResponse.json({
      groupedLight: response.data?.[0] || null,
      success: true,
    });

  } catch (error) {
    console.error('❌ Hue room fetch error:', error);

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

export const PUT = auth0.withApiAuthRequired(async function handler(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
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

    // Update room lights
    const hueApi = new HueApi(connection.bridgeIp, connection.username);
    const response = await hueApi.setGroupedLightState(id, body);

    // Log action
    const actionDescription = body.on !== undefined
      ? (body.on.on ? 'Stanza accesa' : 'Stanza spenta')
      : body.dimming !== undefined
        ? 'Luminosità stanza modificata'
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

    return NextResponse.json({
      success: true,
      data: response.data || [],
    });

  } catch (error) {
    console.error('❌ Hue room control error:', error);

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
