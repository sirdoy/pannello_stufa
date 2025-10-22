import { getPowerLevel } from '@/lib/stoveApi';

/**
 * GET /api/stove/getPower
 * Returns the current power level
 * Supports sandbox mode in localhost
 */
export async function GET() {
  try {
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
