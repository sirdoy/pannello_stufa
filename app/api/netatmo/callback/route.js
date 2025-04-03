// ✅ File: app/api/netatmo/callback/route.js

import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return new Response('Missing code', { status: 400 });
  }

  const res = await fetch('https://api.netatmo.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.NETATMO_CLIENT_ID,
      client_secret: process.env.NETATMO_CLIENT_SECRET,
      code,
      redirect_uri: process.env.NETATMO_REDIRECT_URI,
    }),
  });

  const json = await res.json();

  if (!json.refresh_token) {
    console.error('Errore nel recupero del refresh_token:', json);
    return Response.json({ error: 'Token non ricevuto', details: json }, { status: 400 });
  }

  // ✅ Salva il refresh_token su Firebase
  await set(ref(db, 'netatmo/refresh_token'), json.refresh_token);

  return Response.redirect('http://localhost:3000/netatmo/authorized', 302);
}
