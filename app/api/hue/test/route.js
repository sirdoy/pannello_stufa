/**
 * Philips Hue Test Route
 * Test basic bridge access
 * ✅ Protected by Auth0 authentication
 */

import { NextResponse } from 'next/server';
import HueApi from '@/lib/hue/hueApi';
import { getValidAccessToken } from '@/lib/hue/hueTokenHelper';
import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const tokenResult = await getValidAccessToken();

    if (tokenResult.error) {
      return NextResponse.json({
        error: tokenResult.error,
        message: tokenResult.message,
      }, { status: 500 });
    }

    const hueApi = new HueApi(tokenResult.accessToken);

    // Test 1: Bridge Home
    let bridgeHomeResult;
    try {
      bridgeHomeResult = await hueApi.getBridgeHome();
    } catch (err) {
      bridgeHomeResult = { error: err.message };
    }

    // Test 2: Bridge
    let bridgeResult;
    try {
      bridgeResult = await hueApi.getBridge();
    } catch (err) {
      bridgeResult = { error: err.message };
    }

    // Test 3: Devices
    let devicesResult;
    try {
      devicesResult = await hueApi.getDevices();
    } catch (err) {
      devicesResult = { error: err.message };
    }

    return NextResponse.json({
      success: true,
      tests: {
        bridgeHome: bridgeHomeResult,
        bridge: bridgeResult,
        devices: devicesResult,
      },
    });

  } catch (error) {
    console.error('❌ Test route error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
