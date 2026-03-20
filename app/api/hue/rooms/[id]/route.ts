/**
 * Philips Hue Room Control Route
 * GET: Fetch room group state from HA proxy
 * PUT: Update all lights in room (on/off, brightness, color) via HA proxy
 */

import {
  withAuthAndErrorHandler,
  success,
  getPathParam,
  parseJson,
} from '@/lib/core';
import { getGroup, setGroupAction } from '@/lib/hue/hueProxy';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const id = await getPathParam(context, 'id');
  const data = await getGroup(id);
  return success(data as unknown as Record<string, unknown>);
}, 'Hue/Room/Get');

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const id = await getPathParam(context, 'id');
  const body = await parseJson(request) as Record<string, unknown>;

  const proxyResponse = await setGroupAction(id, body);

  // Log action — v1 flat body format
  const on = body.on as boolean | undefined;
  const bri = body.bri as number | undefined;

  const actionDescription = on !== undefined
    ? (on ? 'Stanza accesa' : 'Stanza spenta')
    : bri !== undefined
      ? 'Luminosita stanza modificata'
      : 'Luci stanza modificate';

  const value = bri !== undefined
    ? `${Math.round((bri / 254) * 100)}%`
    : on !== undefined
      ? (on ? 'ON' : 'OFF')
      : null;

  await adminDbPush('log', {
    action: actionDescription,
    device: DEVICE_TYPES.LIGHTS,
    value,
    roomId: id,
    timestamp: Date.now(),
    source: 'manual',
  });

  return NextResponse.json(proxyResponse, { status: 202 });
}, 'Hue/Room/Update');
