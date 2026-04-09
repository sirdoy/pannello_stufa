/**
 * Hue Group Action Route
 * PUT: Set group-wide light state via HA proxy
 *
 * Returns 202 Accepted with suggested_poll_delay_s.
 */

import {
  withAuthAndErrorHandler,
  getPathParam,
  parseJson,
} from '@/lib/core';
import { setGroupAction } from '@/lib/hue/hueProxy';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const body = await parseJson(request) as Record<string, unknown>;

  const proxyResponse = await setGroupAction(groupId, body);

  // Log action — v1 flat body format
  const on = body.on as boolean | undefined;
  const bri = body.bri as number | undefined;

  const action = on !== undefined
    ? (on ? 'Gruppo acceso' : 'Gruppo spento')
    : bri !== undefined
      ? 'Luminosita gruppo modificata'
      : 'Luci gruppo modificate';

  const value = bri !== undefined
    ? `${Math.round((bri / 254) * 100)}%`
    : on !== undefined
      ? (on ? 'ON' : 'OFF')
      : null;

  await adminDbPush('log', {
    action,
    device: DEVICE_TYPES.LIGHTS,
    value,
    groupId,
    timestamp: Date.now(),
    source: 'manual',
  });

  return NextResponse.json(proxyResponse, { status: 202 });
}, 'Hue/Group/Action');
