import { STUFA_API } from '@/lib/stoveApi';
import { getFullSchedulerMode, setSemiManualMode, getNextScheduledChange } from '@/lib/schedulerService';

export async function POST(req) {
  const res = await fetch(STUFA_API.ignite);
  const data = await res.json();

  // Parse body per ottenere source
  const body = await req.json().catch(() => ({}));
  const source = body.source;

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
}
