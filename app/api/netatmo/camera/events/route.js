import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/camera/events
 * Returns events from all cameras
 * Query params:
 * - camera_id: Filter by specific camera (optional)
 * - size: Number of events to fetch from Netatmo (default: 200)
 *
 * Note: Netatmo's gethomedata API returns the most recent events.
 * For true pagination beyond ~200 events, geteventsuntil would be needed
 * but it has limitations. This endpoint returns all available events
 * and the client handles virtual scrolling.
 */
export async function GET(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cameraId = searchParams.get('camera_id');
    // Request more events from Netatmo (max ~200)
    const size = Math.min(parseInt(searchParams.get('size') || '200', 10), 200);

    const { accessToken, error, message } = await getValidAccessToken();
    if (error) {
      const { status, reconnect } = handleTokenError(error);
      return NextResponse.json({ error: message, reconnect }, { status });
    }

    // Get cameras data with events
    const homesData = await NETATMO_CAMERA_API.getCamerasData(accessToken, size);

    if (!homesData || homesData.length === 0) {
      return NextResponse.json({
        events: [],
        cameras: [],
        total: 0,
      });
    }

    const cameras = NETATMO_CAMERA_API.parseCameras(homesData);
    let allEvents = [];

    // Get events from all homes
    for (const home of homesData) {
      if (home.events && home.events.length > 0) {
        allEvents.push(...home.events);
      }
    }

    // Sort by time descending (newest first)
    allEvents.sort((a, b) => (b.time || 0) - (a.time || 0));

    // Filter by camera if specified
    if (cameraId) {
      allEvents = allEvents.filter(e => e.camera_id === cameraId);
    }

    // Parse all events
    const parsedEvents = NETATMO_CAMERA_API.parseEvents(allEvents);

    // Debug logging
    console.log('[Camera Events]', {
      totalEvents: parsedEvents.length,
      cameraFilter: cameraId || 'all',
    });

    return NextResponse.json({
      events: parsedEvents,
      cameras,
      total: parsedEvents.length,
    });
  } catch (err) {
    console.error('Error in /api/netatmo/camera/events:', err);
    return NextResponse.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}
