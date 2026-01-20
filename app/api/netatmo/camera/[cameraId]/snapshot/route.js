import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/camera/[cameraId]/snapshot
 * Returns snapshot URL for a specific camera
 */
export async function GET(request, { params }) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { cameraId } = await params;

    const { accessToken, error, message } = await getValidAccessToken();
    if (error) {
      const { status, reconnect } = handleTokenError(error);
      return NextResponse.json({ error: message, reconnect }, { status });
    }

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
      return NextResponse.json({ error: 'Camera non trovata' }, { status: 404 });
    }

    const snapshotUrl = NETATMO_CAMERA_API.getSnapshotUrl(camera, false);

    if (!snapshotUrl) {
      return NextResponse.json({ error: 'URL snapshot non disponibile' }, { status: 404 });
    }

    return NextResponse.json({
      camera_id: cameraId,
      snapshot_url: snapshotUrl,
      is_local: camera.is_local,
      camera_name: camera.name,
    });
  } catch (err) {
    console.error('Error in /api/netatmo/camera/[cameraId]/snapshot:', err);
    return NextResponse.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}
