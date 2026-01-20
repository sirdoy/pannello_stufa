import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/camera/[cameraId]/events
 * Returns recent events for a specific camera
 */
export async function GET(request, { params }) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { cameraId } = await params;
    const { searchParams } = new URL(request.url);
    const size = parseInt(searchParams.get('size') || '10', 10);

    const { accessToken, error, message } = await getValidAccessToken();
    if (error) {
      const { status, reconnect } = handleTokenError(error);
      return NextResponse.json({ error: message, reconnect }, { status });
    }

    // Use environment-aware path (dev/netatmo in localhost, netatmo in production)
    const homeIdPath = getEnvironmentPath('netatmo/home_id');
    const homeId = await adminDbGet(homeIdPath);

    if (!homeId) {
      return NextResponse.json({ error: 'Home ID non trovato' }, { status: 404 });
    }

    const events = await NETATMO_CAMERA_API.getCameraEvents(accessToken, homeId, size);

    // Filter events for this camera
    const cameraEvents = events
      .filter(e => e.camera_id === cameraId)
      .slice(0, size);

    const parsedEvents = NETATMO_CAMERA_API.parseEvents(cameraEvents);

    return NextResponse.json({
      camera_id: cameraId,
      events: parsedEvents,
      total: parsedEvents.length,
    });
  } catch (err) {
    console.error('Error in /api/netatmo/camera/[cameraId]/events:', err);
    return NextResponse.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}
