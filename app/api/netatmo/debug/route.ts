import { withAuthAndErrorHandler, success, requireNetatmoToken } from '@/lib/core';

export const dynamic = 'force-dynamic';

interface HomesDataHome {
  id: string;
  name: string;
  cameras?: unknown[];
  modules?: Array<{ type: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

interface GetHomeDataHome {
  id: string;
  name: string;
  cameras?: unknown[];
  persons?: unknown[];
  events?: unknown[];
  [key: string]: unknown;
}

/**
 * GET /api/netatmo/debug
 * Debug endpoint to see raw Netatmo API response
 * TEMPORARY - Remove after debugging
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const accessToken = await requireNetatmoToken();

  // Call BOTH APIs to compare

  // 1. homesdata (Energy API) - returns cameras as modules
  const homesdataResponse = await fetch('https://api.netatmo.com/api/homesdata', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({}),
  });
  const homesdataRaw = await homesdataResponse.json() as { body?: { homes?: HomesDataHome[] } };

  // 2. gethomedata (Security API) - returns cameras with full data
  const gethomeResponse = await fetch('https://api.netatmo.com/api/gethomedata', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({}),
  });
  const gethomeRaw = await gethomeResponse.json() as { body?: { homes?: GetHomeDataHome[] } };

  // Analyze both responses
  const analysis = {
    homesdata_api: {
      homes_count: homesdataRaw.body?.homes?.length || 0,
      homes_summary: (homesdataRaw.body?.homes || []).map(home => ({
        id: home.id,
        name: home.name,
        has_cameras_field: !!(home.cameras && home.cameras.length > 0),
        cameras_count: home.cameras?.length || 0,
        has_modules: !!(home.modules && home.modules.length > 0),
        modules_count: home.modules?.length || 0,
        camera_modules: (home.modules || []).filter(m => ['NACamera', 'NOC', 'NDB'].includes(m.type)),
      })),
    },
    gethomedata_api: {
      raw: gethomeRaw,
      homes_count: gethomeRaw.body?.homes?.length || 0,
      homes_summary: (gethomeRaw.body?.homes || []).map(home => ({
        id: home.id,
        name: home.name,
        has_cameras: !!(home.cameras && home.cameras.length > 0),
        cameras_count: home.cameras?.length || 0,
        cameras: home.cameras || [],
        has_persons: !!(home.persons && home.persons.length > 0),
        persons_count: home.persons?.length || 0,
        has_events: !!(home.events && home.events.length > 0),
        events_count: home.events?.length || 0,
        all_keys: Object.keys(home),
      })),
    },
  };

  return success(analysis);
}, 'Netatmo/Debug');
