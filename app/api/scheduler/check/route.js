import { get, ref } from 'firebase/database';
import { db } from '@/lib/firebase';

export async function GET(req) {
  try {
    const secret = req.nextUrl.searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    const now = new Date(new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' }));
    const day = now.toLocaleDateString('it-IT', { weekday: 'long' });
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const snapshot = await get(ref(db, `stoveScheduler/${capitalize(day)}`));
    if (!snapshot.exists()) {
      return Response.json({
        message: 'Nessuno scheduler',
        giorno: day,
        ora: now.toTimeString().slice(0, 5)
      });
    }

    const intervals = snapshot.val();
    const active = intervals.find(({ start, end }) => {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      return currentMinutes >= startMin && currentMinutes < endMin;
    });

    if (active) {
      await fetch(`${req.nextUrl.protocol}//${req.headers.get("host")}/api/stove/ignite`, { method: 'POST' });
      await fetch(`${req.nextUrl.protocol}//${req.headers.get("host")}/api/stove/setPower`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: active.power }),
      });
      await fetch(`${req.nextUrl.protocol}//${req.headers.get("host")}/api/stove/setFan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: active.fan }),
      });
    } else {
      await fetch(`${req.nextUrl.protocol}//${req.headers.get("host")}/api/stove/shutdown`, { method: 'POST' });
    }

    return Response.json({
      status: active ? 'ACCESA' : 'SPENTA',
      giorno: day,
      ora: now.toTimeString().slice(0, 5)
    });
  } catch (error) {
    console.error('Errore nel cron:', error);
    return new Response('Errore interno', { status: 500 });
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
