import { db } from '@/lib/firebase';
import { ref, push, serverTimestamp } from 'firebase/database';

export async function POST(request) {
  const body = await request.json();

  try {
    const logRef = ref(db, 'log');
    await push(logRef, {
      ...body,
      timestamp: Date.now(), // serverTimestamp non disponibile su client DB
    });
    return Response.json({ success: true });
  } catch (error) {
    console.error('Errore salvataggio log:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
