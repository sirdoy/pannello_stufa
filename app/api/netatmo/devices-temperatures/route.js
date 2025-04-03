// ✅ File: app/api/netatmo/devices-temperatures/route.js

import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

export async function GET() {
  try {
    // 🔐 Legge il refresh_token da Firebase
    const tokenSnap = await get(ref(db, 'netatmo/refresh_token'));
    if (!tokenSnap.exists()) {
      return Response.json({ error: 'Nessun refresh token trovato' }, { status: 401 });
    }
    const refresh_token = tokenSnap.val();

    // 🎟️ Ottiene access token
    const tokenRes = await fetch('https://api.netatmo.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
        client_id: process.env.NETATMO_CLIENT_ID,
        client_secret: process.env.NETATMO_CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Access token error:', tokenData);
      return Response.json({ error: 'Access token non ottenuto', details: tokenData }, { status: 500 });
    }

    const accessToken = tokenData.access_token;

    // 🌡️ Chiamata a /devicelist per recuperare moduli
    const deviceRes = await fetch('https://api.netatmo.com/api/devicelist', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const deviceData = await deviceRes.json();
    if (!deviceData.body?.devices?.length) {
      return Response.json({ error: 'Nessun dispositivo trovato' }, { status: 404 });
    }

    const results = [];
    for (const device of deviceData.body.devices) {
      const device_id = device._id;
      for (const module of device.modules || []) {
        const module_id = module._id;
        const temperature = module.measured?.temperature;
        const name = module.module_name || module_id;

        if (temperature !== undefined) {
          results.push({ device_id, module_id, name, temperature });
        }
      }
    }

    return Response.json({ temperatures: results });
  } catch (err) {
    console.error('Errore generale Netatmo devices-temperatures:', err);
    return Response.json({ error: 'Errore server interno' }, { status: 500 });
  }
}
