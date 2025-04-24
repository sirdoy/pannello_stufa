import { get, ref } from 'firebase/database';
import { db } from '@/lib/firebase';

export async function GET(req) {
  try {
    const secret = req.nextUrl.searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET) {
      return new Response('Unauthorized', {status: 401});
    }

    // Fuso orario Europe/Rome con Intl
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const [dayPart, timePart] = formatter.formatToParts(now).reduce((acc, part) => {
      if (part.type === 'weekday') acc[0] = part.value;
      if (part.type === 'hour') acc[1] = part.value;
      if (part.type === 'minute') acc[2] = part.value;
      return acc;
    }, []);

    const giorno = capitalize(dayPart);
    const ora = `${timePart}:${formatter.formatToParts(now).find(p => p.type === 'minute').value}`;
    const currentMinutes = parseInt(timePart) * 60 + parseInt(formatter.formatToParts(now).find(p => p.type === 'minute').value);

    const snapshot = await get(ref(db, `stoveScheduler/${giorno}`));
    if (!snapshot.exists()) {
      return Response.json({message: 'Nessuno scheduler', giorno, ora});
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

    const statusJson = await fetch(`${baseUrl}/api/stove/status`);
    const isOn = statusJson?.StatusDescription?.includes('WORK') || statusJson?.StatusDescription?.includes('START');

    const fanLevel = (await fetch(`${baseUrl}/api/stove/getFan`))?.Result;

    const powerLevel = (await fetch(`${baseUrl}/api/stove/getPower`))?.Result;

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
      giorno,
      ora,
    });
  } catch (error) {
    console.error('Errore nel cron:', error);
    return new Response('Errore interno', {status: 500});
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
