import { db } from '@/lib/firebase';
import { ref, push } from 'firebase/database';
import { getSession } from '@auth0/nextjs-auth0';

export async function POST(request) {
  const body = await request.json();

  try {
    // Recupera informazioni utente da Auth0
    const session = await getSession();
    const user = session?.user || null;

    const logEntry = {
      ...body,
      timestamp: Date.now(),
      user: user ? {
        email: user.email,
        name: user.name,
        picture: user.picture,
        sub: user.sub, // Auth0 user ID
      } : null,
      source: 'user', // Azioni manuali dell'utente
    };

    const logRef = ref(db, 'log');
    await push(logRef, logEntry);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Errore salvataggio log:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
