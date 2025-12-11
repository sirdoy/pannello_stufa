import { auth0 } from '@/lib/auth0';
import { getFanLevel } from '@/lib/stoveApi';

/**
 * GET /api/stove/getFan
 * Returns the current fan level
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const GET = auth0.withApiAuthRequired(async function getFanHandler(request) {
  try {
    const data = await getFanLevel();
    return Response.json(data);
  } catch (error) {
    console.error('[Stove API] GetFan error:', error.message);

    if (error.message === 'STOVE_TIMEOUT') {
      return Response.json(
        { error: 'Stufa non raggiungibile', code: 'TIMEOUT', Result: 3 },
        { status: 504 }
      );
    }

    return Response.json(
      { error: 'Errore di connessione', code: 'NETWORK_ERROR', Result: 3 },
      { status: 500 }
    );
  }
});
