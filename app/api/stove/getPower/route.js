import { STUFA_API, fetchWithTimeout } from '@/lib/stoveApi';

export async function GET() {
  try {
    const res = await fetchWithTimeout(STUFA_API.getPower);

    if (!res.ok) {
      return Response.json(
        { error: 'Failed to fetch power level', details: `HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
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
