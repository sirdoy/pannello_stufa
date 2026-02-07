import {
  withAuthAndErrorHandler,
  success,
  notFound,
  requireNetatmoToken,
  getPathParam,
  parseQuery,
} from '@/lib/core';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ cameraId: string }>;
}

/**
 * GET /api/netatmo/camera/[cameraId]/events
 * Returns recent events for a specific camera
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const cameraId = await getPathParam(context, 'cameraId');
  const params = parseQuery(request);
  const size = parseInt(params.get('size') || '10', 10);

  const accessToken = await requireNetatmoToken();

  // Use environment-aware path (dev/netatmo in localhost, netatmo in production)
  const homeIdPath = getEnvironmentPath('netatmo/home_id');
  const homeId = await adminDbGet(homeIdPath) as string | null;

  if (!homeId) {
    return notFound('Home ID non trovato');
  }

  const events = await NETATMO_CAMERA_API.getCameraEvents(accessToken, homeId, size) as any;

  // Filter events for this camera
  const cameraEvents = events
    .filter((e: any) => e.camera_id === cameraId)
    .slice(0, size);

  const parsedEvents = NETATMO_CAMERA_API.parseEvents(cameraEvents as any);

  return success({
    camera_id: cameraId,
    events: parsedEvents,
    total: parsedEvents.length,
  });
}, 'Netatmo/CameraIdEvents');
