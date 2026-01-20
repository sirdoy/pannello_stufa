// ✅ File: app/api/netatmo/temperature/route.js

import { NextResponse } from 'next/server';
import { adminDbGet, adminDbUpdate } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { auth0 } from '@/lib/auth0';

// Force dynamic rendering for Firebase operations
export const dynamic = 'force-dynamic';

/**
 * POST /api/netatmo/temperature
 * Gets temperature from configured device/module
 * Requires device_id and module_id in Firebase
 * ✅ Protected by Auth0 authentication
 */
export async function POST(request) {
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

    // Step 2: recupera device_id e module_id da Firebase (o fallisce)
    const deviceConfigPath = getEnvironmentPath('netatmo/deviceConfig');
    const configData = await adminDbGet(deviceConfigPath);
    if (!configData) {
      return Response.json({ error: 'Configurazione dispositivo mancante' }, { status: 400 });
    }

    const { device_id, module_id } = configData;
    if (!device_id || !module_id) {
      return Response.json({ error: 'device_id o module_id mancanti' }, { status: 400 });
    }

    // Step 3: chiama getthermstate con device_id e module_id
    const stateRes = await fetch('https://api.netatmo.com/api/getthermstate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ device_id, module_id }),
    });

    const stateJson = await stateRes.json();

    if (!stateJson.body || Object.keys(stateJson.body).length === 0) {
      console.error('Netatmo state error:', stateJson);
      return Response.json({ error: 'Errore getthermstate', details: stateJson }, { status: 500 });
    }

    const firstRoom = Object.values(stateJson.body)[0];
    const temperature = firstRoom?.measured?.temperature;

    if (temperature === undefined) {
      return Response.json({ error: 'Temperatura non trovata' }, { status: 404 });
    }

    // ✅ Salva la temperatura in Firebase
    const temperaturePath = getEnvironmentPath('netatmo/temperature');
    await adminDbUpdate(temperaturePath, {
      value: temperature,
      timestamp: Date.now(),
    });

    return Response.json({ temperature });
  } catch (err) {
    console.error('Errore server Netatmo temperature:', err);
    return Response.json({ error: 'Errore server interno' }, { status: 500 });
  }
}
