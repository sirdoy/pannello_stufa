import { NextResponse } from 'next/server';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    const user = session.user;

    const body = await request.json();

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
