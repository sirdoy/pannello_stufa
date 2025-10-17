/**
 * Philips Hue Lights Route
 * GET: Fetch all lights
 */

import { NextResponse } from 'next/server';
import HueApi from '@/lib/hue/hueApi';
import { getValidAccessToken } from '@/lib/hue/hueTokenHelper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get valid access token (auto-refresh if needed)
    const tokenResult = await getValidAccessToken();

    if (tokenResult.error) {
      return NextResponse.json({
        error: tokenResult.error,
        message: tokenResult.message,
        reconnect: tokenResult.reconnect || false,
      }, { status: tokenResult.reconnect ? 401 : 500 });
    }

    // Fetch lights from Hue API
    const hueApi = new HueApi(tokenResult.accessToken);
    const response = await hueApi.getLights();

    return NextResponse.json({
      lights: response.data || [],
      success: true,
    });

  } catch (error) {
    console.error('❌ Hue lights fetch error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
