import { withAuthAndErrorHandler, getPathParam } from '@/lib/core';
import { getProxyCameraEventSnapshot } from '@/lib/netatmoProxy';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/camera/events/[eventId]/snapshot
 * Streams binary JPEG snapshot for a specific camera event from proxy.
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (_request: unknown, context: unknown) => {
  const eventId = await getPathParam(context, 'eventId');

  const response = await getProxyCameraEventSnapshot(eventId);

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}, 'Netatmo/CameraEventSnapshot');
