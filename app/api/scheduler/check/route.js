// app/api/scheduler/check/route.js (Next.js App Router)

import { get, ref } from 'firebase/database';
import { db } from '@/lib/firebase';

export async function GET(req) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', {status: 401});
  }

  const now = new Date();
  const day = now.toLocaleDateString('it-IT', {weekday: 'long'});
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const snapshot = await get(ref(db, `stoveScheduler/${capitalize(day)}`));
  if (!snapshot.exists()) return Response.json({message: 'Nessuno scheduler'});

  const intervals = snapshot.val();
  const active = intervals.find(({start, end}) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    return currentMinutes >= startMin && currentMinutes < endMin;
  });

  if (active) {
    await fetch(process.env.NEXT_PUBLIC_API_IGNITE, {method: 'POST'});
    await fetch(process.env.NEXT_PUBLIC_API_SET_POWER, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({level: active.power}),
    });
    await fetch(process.env.NEXT_PUBLIC_API_SET_FAN, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({level: active.fan}),
    });
  } else {
    await fetch(process.env.NEXT_PUBLIC_API_SHUTDOWN, {method: 'POST'});
  }

  return Response.json({status: active ? 'ACCESA' : 'SPENTA'});
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
