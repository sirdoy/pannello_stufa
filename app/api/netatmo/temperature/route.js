// ✅ File: app/api/netatmo/temperature/route.js

import { db } from '@/lib/firebase';
import { ref, get, set, update } from 'firebase/database';

export async function POST() {
  try {
    // 🔐 Leggi il refresh_token salvato su Firebase
    const tokenSnap = await get(ref(db, 'netatmo/refresh_token'));
    if (!tokenSnap.exists()) {
      return Response.json({ error: 'Nessun refresh token trovato' }, { status: 401 });
    }
    const refresh_token = tokenSnap.val();

    // Step 1: ottieni access token
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
      console.error('Errore access_token:', tokenData);
      return Response.json({ error: 'Token non valido', details: tokenData }, { status: 500 });
    }

    const accessToken = tokenData.access_token;

    // Step 2: recupera device_id e module_id da Firebase (o fallisce)
    const configSnap = await get(ref(db, 'netatmo/deviceConfig'));
    if (!configSnap.exists()) {
      return Response.json({ error: 'Configurazione dispositivo mancante' }, { status: 400 });
    }

    const { device_id, module_id } = configSnap.val();
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
    const tempRef = ref(db, 'netatmo/temperature');
    await update(tempRef, {
      value: temperature,
      timestamp: Date.now(),
    });

    return Response.json({ temperature });
  } catch (err) {
    console.error('Errore server Netatmo temperature:', err);
    return Response.json({ error: 'Errore server interno' }, { status: 500 });
  }
}
