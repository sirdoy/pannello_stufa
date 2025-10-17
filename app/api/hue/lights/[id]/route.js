/**
 * Philips Hue Single Light Control Route
 * GET: Fetch single light state
 * PUT: Update light state (on/off, brightness, color)
 */

import { NextResponse } from 'next/server';
import HueApi from '@/lib/hue/hueApi';
import { getValidAccessToken } from '@/lib/hue/hueTokenHelper';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
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

    // Fetch light from Hue API
    const hueApi = new HueApi(tokenResult.accessToken);
    const response = await hueApi.getLight(id);

    return NextResponse.json({
      light: response.data?.[0] || null,
      success: true,
    });

  } catch (error) {
    console.error('❌ Hue light fetch error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
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

    // Update light state
    const hueApi = new HueApi(tokenResult.accessToken);
    const response = await hueApi.setLightState(id, body);

    return NextResponse.json({
      success: true,
      data: response.data || [],
    });

  } catch (error) {
    console.error('❌ Hue light control error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
