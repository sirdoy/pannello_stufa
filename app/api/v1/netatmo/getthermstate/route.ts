/**
 * API Route: Netatmo GetThermState
 *
 * GET /api/v1/netatmo/getthermstate
 *
 * Returns thermostat state (current setpoint and program list) from the HA proxy.
 * Forwards query params (device_id required) to the proxy.
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyThermState } from '@/lib/netatmo/netatmoProxy';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const data = await getProxyThermState(searchParams);
  return success(data as unknown as Record<string, unknown>);
}, 'Netatmo/GetThermState');
