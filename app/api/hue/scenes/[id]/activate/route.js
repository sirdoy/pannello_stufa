/**
 * Philips Hue Scene Activation Route
 * PUT: Activate a scene
 */

import { NextResponse } from 'next/server';
import HueApi from '@/lib/hue/hueApi';
import { getValidAccessToken } from '@/lib/hue/hueTokenHelper';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
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

    // Activate scene
    const hueApi = new HueApi(tokenResult.accessToken);
    const response = await hueApi.activateScene(id);

    return NextResponse.json({
      success: true,
      data: response.data || [],
    });

  } catch (error) {
    console.error('❌ Hue scene activation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
