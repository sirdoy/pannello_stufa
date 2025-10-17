import { STUFA_API, fetchWithTimeout } from '@/lib/stoveApi';
import { getFullSchedulerMode, setSemiManualMode, getNextScheduledChange } from '@/lib/schedulerService';

export async function POST(req) {
  try {
    // Parse body per ottenere source
    const body = await req.json().catch(() => ({}));
    const source = body.source;

    const res = await fetchWithTimeout(STUFA_API.shutdown);

    if (!res.ok) {
      return Response.json(
        { error: 'Failed to shutdown stove', details: `HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Attiva semi-manuale SOLO se source='manual', scheduler attivo e non già in semi-manuale
    if (source === 'manual') {
      const mode = await getFullSchedulerMode();
      if (mode.enabled && !mode.semiManual) {
        const nextChange = await getNextScheduledChange();
        if (nextChange) {
          await setSemiManualMode(nextChange);
          console.log('Modalità semi-manuale attivata per comando manuale di spegnimento');
        }
      }
    }

    return Response.json(data);
  } catch (error) {
    console.error('[Stove API] Shutdown error:', error.message);

    if (error.message === 'STOVE_TIMEOUT') {
      return Response.json(
        { error: 'Stufa non raggiungibile', code: 'TIMEOUT' },
        { status: 504 }
      );
    }

    return Response.json(
      { error: 'Errore di connessione', code: 'NETWORK_ERROR' },
      { status: 500 }
    );
  }
}
