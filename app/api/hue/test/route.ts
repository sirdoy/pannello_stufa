/**
 * Philips Hue Test Route
 * Test basic bridge access
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import HueApi from '@/lib/hue/hueApi';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  // This test route uses stub values for testing
  const hueApi = new HueApi('stub', 'stub');

  // Test 1: Bridge
  let bridgeHomeResult: unknown;
  try {
    bridgeHomeResult = await hueApi.getBridge();
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
