import {
  withAuthAndErrorHandler,
  success,
  notFound,
  requireNetatmoToken,
  getPathParam,
} from '@/lib/core';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/camera/[cameraId]/snapshot
 * Returns snapshot URL for a specific camera
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request, context) => {
  const cameraId = await getPathParam(context, 'cameraId');
  const accessToken = await requireNetatmoToken();

  // Get cameras from Firebase or API (use environment-aware path)
  const camerasPath = getEnvironmentPath('netatmo/cameras');
  let cameraData = await adminDbGet(camerasPath);

  if (!cameraData?.cameras) {
    // Fetch fresh data
    const homeIdPath = getEnvironmentPath('netatmo/home_id');
    const homeId = await adminDbGet(homeIdPath);
    const homesData = await NETATMO_CAMERA_API.getCamerasData(accessToken, homeId);
    cameraData = { cameras: NETATMO_CAMERA_API.parseCameras(homesData) };
  }

  const camera = cameraData.cameras.find(c => c.id === cameraId);

  if (!camera) {
    return notFound('Camera non trovata');
  }

  const snapshotUrl = NETATMO_CAMERA_API.getSnapshotUrl(camera, false);

  if (!snapshotUrl) {
    return notFound('URL snapshot non disponibile');
  }

  return success({
    camera_id: cameraId,
    snapshot_url: snapshotUrl,
    is_local: camera.is_local,
    camera_name: camera.name,
  });
}, 'Netatmo/CameraSnapshot');
