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

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/camera/[cameraId]/events
 * Returns recent events for a specific camera
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request, context) => {
  const cameraId = await getPathParam(context, 'cameraId');
  const { size: sizeParam } = parseQuery(request);
  const size = parseInt(sizeParam || '10', 10);

  const accessToken = await requireNetatmoToken();

  // Use environment-aware path (dev/netatmo in localhost, netatmo in production)
  const homeIdPath = getEnvironmentPath('netatmo/home_id');
  const homeId = await adminDbGet(homeIdPath);

  if (!homeId) {
    return notFound('Home ID non trovato');
  }

  const events = await NETATMO_CAMERA_API.getCameraEvents(accessToken, homeId, size);

  // Filter events for this camera
  const cameraEvents = events
    .filter(e => e.camera_id === cameraId)
    .slice(0, size);

  const parsedEvents = NETATMO_CAMERA_API.parseEvents(cameraEvents);

  return success({
    camera_id: cameraId,
    events: parsedEvents,
    total: parsedEvents.length,
  });
}, 'Netatmo/CameraIdEvents');
