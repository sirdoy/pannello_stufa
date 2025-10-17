import { STUFA_API, fetchWithTimeout } from '@/lib/stoveApi';
import { getFullSchedulerMode, setSemiManualMode, getNextScheduledChange } from '@/lib/schedulerService';

export async function POST(req) {
  try {
    const { level, source } = await req.json();
    const res = await fetchWithTimeout(STUFA_API.setPower(level));

    if (!res.ok) {
      return Response.json(
        { error: 'Failed to set power level', details: `HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Attiva semi-manuale SOLO se source='manual', stufa accesa, scheduler attivo e non già in semi-manuale
    if (source === 'manual') {
      // Verifica se stufa è accesa
      const statusRes = await fetchWithTimeout(STUFA_API.getStatus);
      const statusData = await statusRes.json();
      const isOn = statusData?.StatusDescription?.includes('WORK') || statusData?.StatusDescription?.includes('START');

      if (isOn) {
        const mode = await getFullSchedulerMode();
        if (mode.enabled && !mode.semiManual) {
          const nextChange = await getNextScheduledChange();
          if (nextChange) {
            await setSemiManualMode(nextChange);
            console.log('Modalità semi-manuale attivata per comando manuale di cambio potenza');
          }
        }
      }
    }

    return Response.json(data);
  } catch (error) {
    console.error('[Stove API] SetPower error:', error.message);

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
