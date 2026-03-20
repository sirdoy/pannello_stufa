/**
 * Philips Hue Single Light Control Route
 * GET: Fetch single light state from HA proxy
 * PUT: Update light state (on/off, brightness, color) via HA proxy
 */

import {
  withAuthAndErrorHandler,
  success,
  getPathParam,
  parseJson,
} from '@/lib/core';
import { getLight, setLightState } from '@/lib/hue/hueProxy';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const id = await getPathParam(context, 'id');
  const data = await getLight(id);
  return success(data as unknown as Record<string, unknown>);
}, 'Hue/Light/Get');

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const id = await getPathParam(context, 'id');
  const body = await parseJson(request) as Record<string, unknown>;

  const proxyResponse = await setLightState(id, body);

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
    lightId: id,
    timestamp: Date.now(),
    source: 'manual',
  });

  return NextResponse.json(proxyResponse, { status: 202 });
}, 'Hue/Light/Update');
