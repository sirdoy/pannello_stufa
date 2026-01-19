import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getPowerLevel } from '@/lib/stoveApi';

/**
 * GET /api/stove/getPower
 * Returns the current power level
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export async function GET(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    const data = await getPowerLevel();
    return Response.json(data);
  } catch (error) {
    console.error('[Stove API] GetPower error:', error.message);

    if (error.message === 'STOVE_TIMEOUT') {
      return Response.json(
        { error: 'Stufa non raggiungibile', code: 'TIMEOUT', Result: 2 },
        { status: 504 }
      );
    }

    return Response.json(
      { error: 'Errore di connessione', code: 'NETWORK_ERROR', Result: 2 },
      { status: 500 }
    );
  }
}
