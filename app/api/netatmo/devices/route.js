// ✅ File: app/api/netatmo/devices/route.js

export async function POST(request) {
  try {
    const { refresh_token } = await request.json();

    if (!refresh_token) {
      return new Response('Missing refresh token', { status: 400 });
    }

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

    // Step 2: ottieni lista dispositivi
    const deviceRes = await fetch('https://api.netatmo.com/api/devicelist', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const deviceData = await deviceRes.json();

    if (!deviceData.body) {
      console.error('Errore devicelist:', deviceData);
      return Response.json({ error: 'Errore devicelist', details: deviceData }, { status: 500 });
    }

    return Response.json({ devices: deviceData.body });
  } catch (err) {
    console.error('Errore Netatmo /devices:', err);
    return Response.json({ error: 'Errore server' }, { status: 500 });
  }
}
