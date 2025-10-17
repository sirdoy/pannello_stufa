/**
 * Philips Hue Scenes Route
 * GET: Fetch all scenes (regular + smart scenes)
 */

import { NextResponse } from 'next/server';
import HueApi from '@/lib/hue/hueApi';
import { getValidAccessToken } from '@/lib/hue/hueTokenHelper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get valid access token
    const tokenResult = await getValidAccessToken();

    if (tokenResult.error) {
      return NextResponse.json({
        error: tokenResult.error,
        message: tokenResult.message,
        reconnect: tokenResult.reconnect || false,
      }, { status: tokenResult.reconnect ? 401 : 500 });
    }

    // Fetch scenes from Hue API
    const hueApi = new HueApi(tokenResult.accessToken);
    const scenesResponse = await hueApi.getScenes();
    const smartScenesResponse = await hueApi.getSmartScenes();

    // Combine regular and smart scenes
    const scenes = [
      ...(scenesResponse.data || []).map(s => ({ ...s, type: 'scene' })),
      ...(smartScenesResponse.data || []).map(s => ({ ...s, type: 'smart_scene' })),
    ];

    return NextResponse.json({
      scenes,
      success: true,
    });

  } catch (error) {
    console.error('❌ Hue scenes fetch error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
