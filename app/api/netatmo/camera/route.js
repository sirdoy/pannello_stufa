import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { adminDbSet } from '@/lib/firebaseAdmin';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/camera
 * Retrieves list of cameras with status
 */
export async function GET(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { accessToken, error, message } = await getValidAccessToken();
    if (error) {
      const { status, reconnect } = handleTokenError(error);
      return NextResponse.json({ error: message, reconnect }, { status });
    }

    // Get cameras data from ALL homes (cameras may be in different home than thermostats)
    const homesData = await NETATMO_CAMERA_API.getCamerasData(accessToken);

    if (!homesData || homesData.length === 0) {
      return NextResponse.json({
        cameras: [],
        persons: [],
        events: [],
      });
    }

    const cameras = NETATMO_CAMERA_API.parseCameras(homesData);
    const persons = NETATMO_CAMERA_API.parsePersons(homesData);

    // Get recent events from ALL homes that have cameras
    const allEvents = [];
    for (const home of homesData) {
      if (home.events && home.events.length > 0) {
        allEvents.push(...home.events);
      }
    }
    // Sort by time descending and take first 10
    allEvents.sort((a, b) => (b.time || 0) - (a.time || 0));
    const events = NETATMO_CAMERA_API.parseEvents(allEvents.slice(0, 10));

    // Find the home_id that contains cameras (for future reference)
    const cameraHomeId = cameras.length > 0 ? cameras[0].home_id : null;

    // Save camera data to Firebase with environment-aware path
    const camerasPath = getEnvironmentPath('netatmo/cameras');
    await adminDbSet(camerasPath, {
      cameras,
      persons,
      last_sync: Date.now(),
    });

    return NextResponse.json({
      cameras,
      persons,
      events,
      home_id: cameraHomeId,
    });
  } catch (err) {
    console.error('Error in /api/netatmo/camera:', err);
    return NextResponse.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}
