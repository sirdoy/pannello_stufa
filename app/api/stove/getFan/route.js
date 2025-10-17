import { STUFA_API, fetchWithTimeout } from '@/lib/stoveApi';

export async function GET() {
  try {
    const res = await fetchWithTimeout(STUFA_API.getFan);

    if (!res.ok) {
      return Response.json(
        { error: 'Failed to fetch fan level', details: `HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
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
}
