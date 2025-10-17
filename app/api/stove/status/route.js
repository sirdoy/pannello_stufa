import { STUFA_API, fetchWithTimeout } from '@/lib/stoveApi';

/**
 * GET /api/stove/status
 * Returns the current operational status of the stove
 */
export async function GET() {
  try {
    const res = await fetchWithTimeout(STUFA_API.getStatus);

    if (!res.ok) {
      return Response.json(
        { error: 'Failed to fetch stove status', details: `HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error('[Stove API] Status error:', error.message);

    // Handle timeout specifically
    if (error.message === 'STOVE_TIMEOUT') {
      return Response.json(
        {
          error: 'Stufa non raggiungibile',
          details: 'La stufa potrebbe essere spenta o offline. Verifica che sia accesa e connessa alla rete.',
          code: 'TIMEOUT'
        },
        { status: 504 }
      );
    }

    // Handle other network errors
    return Response.json(
      {
        error: 'Errore di connessione',
        details: error.message || 'Impossibile comunicare con la stufa',
        code: 'NETWORK_ERROR'
      },
      { status: 500 }
    );
  }
}
