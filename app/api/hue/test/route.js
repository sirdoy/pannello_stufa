/**
 * Philips Hue Test Route
 * Test basic bridge access
 */

import { NextResponse } from 'next/server';
import HueApi from '@/lib/hue/hueApi';
import { getValidAccessToken } from '@/lib/hue/hueTokenHelper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tokenResult = await getValidAccessToken();

    if (tokenResult.error) {
      return NextResponse.json({
        error: tokenResult.error,
        message: tokenResult.message,
      }, { status: 500 });
    }

    const hueApi = new HueApi(tokenResult.accessToken);

    console.log('🧪 Testing multiple Hue endpoints...');

    // Test 1: Bridge Home
    let bridgeHomeResult;
    try {
      bridgeHomeResult = await hueApi.getBridgeHome();
      console.log('✅ Bridge Home: SUCCESS', bridgeHomeResult);
    } catch (err) {
      bridgeHomeResult = { error: err.message };
      console.log('❌ Bridge Home: FAILED', err.message);
    }

    // Test 2: Bridge
    let bridgeResult;
    try {
      bridgeResult = await hueApi.getBridge();
      console.log('✅ Bridge: SUCCESS', bridgeResult);
    } catch (err) {
      bridgeResult = { error: err.message };
      console.log('❌ Bridge: FAILED', err.message);
    }

    // Test 3: Devices
    let devicesResult;
    try {
      devicesResult = await hueApi.getDevices();
      console.log('✅ Devices: SUCCESS', devicesResult);
    } catch (err) {
      devicesResult = { error: err.message };
      console.log('❌ Devices: FAILED', err.message);
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
