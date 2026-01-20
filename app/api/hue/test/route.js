/**
 * Philips Hue Test Route
 * Test basic bridge access
 */

import { withAuthAndErrorHandler, success, serverError } from '@/lib/core';
import HueApi from '@/lib/hue/hueApi';
import { getValidAccessToken } from '@/lib/hue/hueTokenHelper';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const tokenResult = await getValidAccessToken();

  if (tokenResult.error) {
    return serverError(tokenResult.message || tokenResult.error);
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

  return success({
    tests: {
      bridgeHome: bridgeHomeResult,
      bridge: bridgeResult,
      devices: devicesResult,
    },
  });
}, 'Hue/Test');
