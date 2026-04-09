/**
 * Hue Scene Activation Route (v1)
 * POST: Activate a scene on a group via HA proxy
 *
 * Returns 202 Accepted with suggested_poll_delay_s.
 */

import {
  withAuthAndErrorHandler,
  getPathParam,
} from '@/lib/core';
import { activateScene } from '@/lib/hue/hueProxy';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (_request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const sceneId = await getPathParam(context, 'sceneId');

  const proxyResponse = await activateScene(groupId, sceneId);

  await adminDbPush('log', {
    action: 'Scena attivata',
    device: DEVICE_TYPES.LIGHTS,
    groupId,
    sceneId,
    timestamp: Date.now(),
    source: 'manual',
  });

  return NextResponse.json(proxyResponse, { status: 202 });
}, 'Hue/Scene/Activate');
