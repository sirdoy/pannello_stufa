/**
 * API Route: Hue Light State Command
 *
 * PUT /api/v1/hue/lights/{lightId}/state
 *
 * Sends a state command to a single Hue light via the HA proxy.
 * Accepts CLIP v1 flat body (on, bri, ct, xy).
 * Logs action to Firebase and returns 202 Accepted with suggested poll delay.
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, getPathParam, parseJson } from '@/lib/core';
import { setLightState } from '@/lib/hue/hueProxy';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/v1/hue/lights/{lightId}/state
 * Sends light state command, logs to Firebase, returns 202 Accepted.
 */
export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const lightId = await getPathParam(context, 'lightId');
  const body = await parseJson(request) as Record<string, unknown>;

  const proxyResponse = await setLightState(lightId, body);

  // Log action — v1 flat body format
  const on = body.on as boolean | undefined;
  const bri = body.bri as number | undefined;

  const actionDescription = on !== undefined
    ? (on ? 'Luce accesa' : 'Luce spenta')
    : bri !== undefined
      ? 'Luminosita modificata'
      : 'Luce modificata';

  const value = bri !== undefined
    ? `${Math.round((bri / 254) * 100)}%`
    : on !== undefined
      ? (on ? 'ON' : 'OFF')
      : null;

  await adminDbPush('log', {
    action: actionDescription,
    device: DEVICE_TYPES.LIGHTS,
    value,
    lightId,
    timestamp: Date.now(),
    source: 'manual',
  });

  return NextResponse.json(proxyResponse, { status: 202 });
}, 'Hue/Light/Update');
