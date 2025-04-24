import { DateTime } from 'luxon';
import { get, ref } from 'firebase/database';
import { db } from '@/lib/firebase';

export async function GET(req) {
  try {
    const secret = req.nextUrl.searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET) {
      return new Response('Unauthorized', {status: 401});
    }

    const now = DateTime.now().setZone('Europe/Rome');
    const day = now.setLocale('it').toFormat('cccc'); // Es: "Lunedì"
    const currentMinutes = now.hour * 60 + now.minute;

    const snapshot = await get(ref(db, `stoveScheduler/${capitalize(day)}`));
    if (!snapshot.exists()) {
      return Response.json({
        message: 'Nessuno scheduler',
        giorno: day,
        ora: now.toFormat('HH:mm'),
      });
    }

    const intervals = snapshot.val();
    const active = intervals.find(({start, end}) => {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      return currentMinutes >= startMin && currentMinutes < endMin;
    });

    const baseUrl = `${req.nextUrl.protocol}//${req.headers.get('host')}`;

    // Stato attuale della stufa
    const statusRes = await fetch(`${baseUrl}/api/stove/status`);
    const statusJson = await statusRes.json();
    const isOn = statusJson?.StatusDescription?.includes('WORK') || statusJson?.StatusDescription?.includes('START');

    const fanRes = await fetch(`${baseUrl}/api/stove/getFan`);
    const fanLevel = (await fanRes.json())?.Result;

    const powerRes = await fetch(`${baseUrl}/api/stove/getPower`);
    const powerLevel = (await powerRes.json())?.Result;

    if (active) {
      if (!isOn) {
        await fetch(`${baseUrl}/api/stove/ignite`, {method: 'POST'});
      }

      if (powerLevel !== active.power) {
        await fetch(`${baseUrl}/api/stove/setPower`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({level: active.power}),
        });
      }

      if (fanLevel !== active.fan) {
        await fetch(`${baseUrl}/api/stove/setFan`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({level: active.fan}),
        });
      }
    } else {
      if (isOn) {
        await fetch(`${baseUrl}/api/stove/shutdown`, {method: 'POST'});
      }
    }

    return Response.json({
      status: active ? 'ACCESA' : 'SPENTA',
      giorno: day,
      ora: now.toFormat('HH:mm'),
    });
  } catch (error) {
    console.error('Errore nel cron:', error);
    return new Response('Errore interno', {status: 500});
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
