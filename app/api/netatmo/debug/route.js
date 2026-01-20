import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/debug
 * Debug endpoint to see raw Netatmo API response
 * TEMPORARY - Remove after debugging
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
    const homesdataRaw = await homesdataResponse.json();

    // 2. gethomedata (Security API) - returns cameras with full data
    const gethomeResponse = await fetch('https://api.netatmo.com/api/gethomedata', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({}),
    });
    const gethomeRaw = await gethomeResponse.json();

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

    return NextResponse.json(analysis, { status: 200 });
  } catch (err) {
    console.error('Error in /api/netatmo/debug:', err);
    return NextResponse.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}
