import {
  withAuthAndErrorHandler,
  success,
  notFound,
  badRequest,
  requireNetatmoToken,
  parseQuery,
} from '@/lib/core';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface CameraData {
  cameras?: Array<{
    id: string;
    name?: string;
    is_local?: boolean;
    [key: string]: unknown;
  }>;
}

/**
 * GET /api/netatmo/camera/snapshot?cameraId=<id>
 * Returns snapshot URL for a specific camera
 * Protected: Requires Auth0 authentication
 *
 * Uses query parameter instead of path segment to avoid Turbopack routing issues
 * with MAC address IDs that contain colons (e.g., 70:ee:50:3b:1f:4f).
 */
export const GET = withAuthAndErrorHandler(async (request: NextRequest, _context, _session) => {
  const params = parseQuery(request);
  const cameraId = params.get('cameraId');

  if (!cameraId) {
    return badRequest('Parametro cameraId mancante');
  }

  const accessToken = await requireNetatmoToken();

  // Get cameras from Firebase or API (use environment-aware path)
  const camerasPath = getEnvironmentPath('netatmo/cameras');
  let cameraData = await adminDbGet(camerasPath) as CameraData | null;

  if (!cameraData?.cameras) {
    // Fetch fresh data
    const homesData = await NETATMO_CAMERA_API.getCamerasData(accessToken);
    cameraData = { cameras: NETATMO_CAMERA_API.parseCameras(homesData as any) as any };
  }

  if (!cameraData.cameras) {
    return notFound('Nessuna camera disponibile');
  }

  const camera = cameraData.cameras.find(c => c.id === cameraId);

  if (!camera) {
    return notFound('Camera non trovata');
  }

  const snapshotUrl = NETATMO_CAMERA_API.getSnapshotUrl(camera as any, false);

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
