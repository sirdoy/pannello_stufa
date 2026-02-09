import { withAuthAndErrorHandler, success, requireNetatmoToken } from '@/lib/core';
import { adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';

export const dynamic = 'force-dynamic';

interface Home {
  events?: Array<{ time?: number; [key: string]: unknown }>;
  [key: string]: unknown;
}

/**
 * GET /api/netatmo/camera
 * Retrieves list of cameras with status
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const accessToken = await requireNetatmoToken();

  // Get cameras data from ALL homes (cameras may be in different home than thermostats)
  const homesData = await NETATMO_CAMERA_API.getCamerasData(accessToken) as unknown as Home[];

  if (!homesData || homesData.length === 0) {
    return success({
      cameras: [],
      persons: [],
      events: [],
    });
  }

  const cameras = NETATMO_CAMERA_API.parseCameras(homesData as any) as unknown as Array<{ home_id?: string; [key: string]: unknown }>;
  const persons = NETATMO_CAMERA_API.parsePersons(homesData as any);

  // Get recent events from ALL homes that have cameras
  const allEvents: Array<{ time?: number; [key: string]: unknown }> = [];
  for (const home of homesData) {
    if (home.events && home.events.length > 0) {
      allEvents.push(...home.events);
    }
  }
  // Sort by time descending and take first 10
  allEvents.sort((a, b) => (b.time || 0) - (a.time || 0));
  const events = NETATMO_CAMERA_API.parseEvents(allEvents as any);

  // Find the home_id that contains cameras (for future reference)
  const cameraHomeId = cameras.length > 0 ? cameras[0]?.home_id ?? null : null;

  // Save camera data to Firebase with environment-aware path
  const camerasPath = getEnvironmentPath('netatmo/cameras');
  await adminDbSet(camerasPath, {
    cameras,
    persons,
    last_sync: Date.now(),
  });

  return success({
    cameras,
    persons,
    events,
    home_id: cameraHomeId,
  });
}, 'Netatmo/Camera');
