import { STUFA_API } from '@/lib/stoveApi';
import { getFullSchedulerMode, setSemiManualMode, getNextScheduledChange } from '@/lib/schedulerService';

export async function POST() {
  const res = await fetch(STUFA_API.ignite);
  const data = await res.json();

  // Se scheduler è attivo e non siamo già in semi-manuale, attiva la modalità semi-manuale
  const mode = await getFullSchedulerMode();
  if (mode.enabled && !mode.semiManual) {
    const nextChange = await getNextScheduledChange();
    if (nextChange) {
      await setSemiManualMode(nextChange);
      console.log('Modalità semi-manuale attivata per comando manuale di accensione');
    }
  }

  return Response.json(data);
}
