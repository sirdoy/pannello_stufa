import { STUFA_API, fetchWithTimeout } from '@/lib/stoveApi';
import { getFullSchedulerMode, setSemiManualMode, getNextScheduledChange } from '@/lib/schedulerService';
import { canIgnite } from '@/lib/maintenanceService';

export async function POST(req) {
  try {
    // Parse body per ottenere source
    const body = await req.json().catch(() => ({}));
    const source = body.source;

    // Check maintenance status before igniting
    const maintenanceAllowed = await canIgnite();
    if (!maintenanceAllowed) {
      return Response.json(
        {
          error: 'Maintenance required',
          message: 'La stufa richiede pulizia prima di essere accesa'
        },
        { status: 403 }
      );
    }

    const res = await fetchWithTimeout(STUFA_API.ignite);

    if (!res.ok) {
      return Response.json(
        { error: 'Failed to ignite stove', details: `HTTP ${res.status}` },
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
          console.log('Modalità semi-manuale attivata per comando manuale di accensione');
        }
      }
    }

    return Response.json(data);
  } catch (error) {
    console.error('[Stove API] Ignite error:', error.message);

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
