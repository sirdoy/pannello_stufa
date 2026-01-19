// ✅ File: app/api/netatmo/devices/route.js

import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import NETATMO_API from '@/lib/netatmoApi';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';

// Force dynamic rendering for Firebase operations
export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/devices
 * Retrieves list of all Netatmo devices
 * Note: Changed from POST to GET for consistency
 * Protected: Requires Auth0 authentication
 */
export async function GET(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    // ✅ Get valid access token using centralized helper (auto-refresh)
    const { accessToken, error, message } = await getValidAccessToken();
    if (error) {
      const { status, reconnect } = handleTokenError(error);
      return Response.json({ error: message, reconnect }, { status });
    }

    // Get device list from Netatmo API
    const devices = await NETATMO_API.getDeviceList(accessToken);

    return Response.json({ devices });
  } catch (err) {
    console.error('Error in /api/netatmo/devices:', err);
    return Response.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}
