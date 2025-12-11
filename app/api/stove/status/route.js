import { auth0 } from '@/lib/auth0';
import { getStoveStatus } from '@/lib/stoveApi';

/**
 * GET /api/stove/status
 * Returns the current operational status of the stove
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const GET = auth0.withApiAuthRequired(async function getStatus(request) {
  try {
    const data = await getStoveStatus();
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
});
