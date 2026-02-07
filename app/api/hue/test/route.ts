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
  let bridgeHomeResult: unknown;
  try {
    bridgeHomeResult = await hueApi.getBridgeHome();
  } catch (err: unknown) {
    bridgeHomeResult = { error: err instanceof Error ? err.message : 'Unknown error' };
  }

  // Test 2: Bridge
  let bridgeResult: unknown;
  try {
    bridgeResult = await hueApi.getBridge();
  } catch (err: unknown) {
    bridgeResult = { error: err instanceof Error ? err.message : 'Unknown error' };
  }

  // Test 3: Devices
  let devicesResult: unknown;
  try {
    devicesResult = await hueApi.getDevices();
  } catch (err: unknown) {
    devicesResult = { error: err instanceof Error ? err.message : 'Unknown error' };
  }

  return success({
    tests: {
      bridgeHome: bridgeHomeResult,
      bridge: bridgeResult,
      devices: devicesResult,
    },
  });
}, 'Hue/Test');
