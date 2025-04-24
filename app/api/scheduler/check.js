import { get, ref } from 'firebase/database';
import { db } from '@/lib/firebase';

export default async function handler(req, res) {
  const now = new Date();
  const dayName = now.toLocaleDateString('it-IT', {weekday: 'long'});
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const snapshot = await get(ref(db, `stoveScheduler/${capitalize(dayName)}`));
  if (!snapshot.exists()) return res.status(200).end('Nessuna programmazione');

  const intervals = snapshot.val();
  const active = intervals.find(({start, end}) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  });

  if (active) {
    await fetch(process.env.NEXT_PUBLIC_API_IGNITE, {method: 'POST'});
    await fetch(process.env.NEXT_PUBLIC_API_SET_POWER, {
      method: 'POST',
      body: JSON.stringify({level: active.power}),
    });
    await fetch(process.env.NEXT_PUBLIC_API_SET_FAN, {
      method: 'POST',
      body: JSON.stringify({level: active.fan}),
    });
  } else {
    await fetch(process.env.NEXT_PUBLIC_API_SHUTDOWN, {method: 'POST'});
  }

  res.status(200).json({status: active ? 'ACCESA' : 'SPENTA'});
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
