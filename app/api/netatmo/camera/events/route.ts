import { withAuthAndErrorHandler, success, requireNetatmoToken, parseQuery } from '@/lib/core';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface Home {
  events?: Array<{ time?: number; camera_id?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

/**
 * GET /api/netatmo/camera/events
 * Returns events from all cameras
 * Query params:
 * - camera_id: Filter by specific camera (optional)
 * - size: Number of events to fetch (default: 200, max: 200)
 *
 * Note: Netatmo's gethomedata API returns max ~200 recent events.
 * Client handles virtual scrolling for display.
 *
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request: NextRequest) => {
  const params = parseQuery(request);
  const cameraId = params.get('camera_id');
  const sizeParam = params.get('size');
  // Default to 200 events (max from Netatmo)
  const size = Math.min(parseInt(sizeParam || '200', 10), 200);

  const accessToken = await requireNetatmoToken();

  // Get cameras data with events
  const homesData = await NETATMO_CAMERA_API.getCamerasData(accessToken, size) as unknown as Home[];

  if (!homesData || homesData.length === 0) {
    return success({
      events: [],
      cameras: [],
      total: 0,
    });
  }

  const cameras = NETATMO_CAMERA_API.parseCameras(homesData as any);
  let allEvents: Array<{ time?: number; camera_id?: string; [key: string]: unknown }> = [];

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
  const parsedEvents = NETATMO_CAMERA_API.parseEvents(allEvents as any);

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
