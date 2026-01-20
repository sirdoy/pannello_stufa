import { withAuthAndErrorHandler, success, requireNetatmoToken, parseQuery } from '@/lib/core';
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
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const { camera_id: cameraId, size: sizeParam } = parseQuery(request);
  // Request more events from Netatmo (max ~200)
  const size = Math.min(parseInt(sizeParam || '200', 10), 200);

  const accessToken = await requireNetatmoToken();

  // Get cameras data with events
  const homesData = await NETATMO_CAMERA_API.getCamerasData(accessToken, size);

  if (!homesData || homesData.length === 0) {
    return success({
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

  return success({
    events: parsedEvents,
    cameras,
    total: parsedEvents.length,
  });
}, 'Netatmo/CameraEvents');
