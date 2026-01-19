import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { STUFA_API, fetchWithTimeout } from '@/lib/stoveApi';

/**
 * GET /api/stove/getRoomTemperature
 * Returns the target room temperature setpoint from the stove
 * Protected: Requires Auth0 authentication
 */
export async function GET(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    const res = await fetchWithTimeout(STUFA_API.getRoomTemperature);

    if (!res.ok) {
      return Response.json(
        { error: 'Failed to fetch room temperature', details: `HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error('[Stove API] GetRoomTemperature error:', error.message);

    if (error.message === 'STOVE_TIMEOUT') {
      return Response.json(
        { error: 'Stufa non raggiungibile', code: 'TIMEOUT', Result: 20 },
        { status: 504 }
      );
    }

    return Response.json(
      { error: 'Errore di connessione', code: 'NETWORK_ERROR', Result: 20 },
      { status: 500 }
    );
  }
}
