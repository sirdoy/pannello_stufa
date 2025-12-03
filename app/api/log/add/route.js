import { adminDbPush } from '@/lib/firebaseAdmin';
import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json();

  try {
    // Recupera informazioni utente da Auth0
    const session = await auth0.getSession(request);
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

    await adminDbPush('log', logEntry);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Errore salvataggio log:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
