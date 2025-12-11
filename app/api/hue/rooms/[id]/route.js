/**
 * Philips Hue Room Control Route
 * GET: Fetch room's grouped light state
 * PUT: Update all lights in room (on/off, brightness, color)
 * ✅ Protected by Auth0 authentication
 */

import { NextResponse } from 'next/server';
import HueApi from '@/lib/hue/hueApi';
import { getValidAccessToken } from '@/lib/hue/hueTokenHelper';
import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

export const GET = auth0.withApiAuthRequired(async function handler(request, { params }) {
  try {
    const { id } = params;

    // Get valid access token
    const tokenResult = await getValidAccessToken();

    if (tokenResult.error) {
      return NextResponse.json({
        error: tokenResult.error,
        message: tokenResult.message,
        reconnect: tokenResult.reconnect || false,
      }, { status: tokenResult.reconnect ? 401 : 500 });
    }

    // Fetch grouped light (room state)
    const hueApi = new HueApi(tokenResult.accessToken);
    const response = await hueApi.getGroupedLight(id);

    return NextResponse.json({
      groupedLight: response.data?.[0] || null,
      success: true,
    });

  } catch (error) {
    console.error('❌ Hue room fetch error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

export const PUT = auth0.withApiAuthRequired(async function handler(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Get valid access token
    const tokenResult = await getValidAccessToken();

    if (tokenResult.error) {
      return NextResponse.json({
        error: tokenResult.error,
        message: tokenResult.message,
        reconnect: tokenResult.reconnect || false,
      }, { status: tokenResult.reconnect ? 401 : 500 });
    }

    // Update room lights
    const hueApi = new HueApi(tokenResult.accessToken);
    const response = await hueApi.setGroupedLightState(id, body);

    return NextResponse.json({
      success: true,
      data: response.data || [],
    });

  } catch (error) {
    console.error('❌ Hue room control error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
