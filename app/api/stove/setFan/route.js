import { STUFA_API } from '@/lib/stoveApi';
import { getFullSchedulerMode, setSemiManualMode, getNextScheduledChange } from '@/lib/schedulerService';

export async function POST(req) {
  const { level, source } = await req.json();
  const res = await fetch(STUFA_API.setFan(level));
  const data = await res.json();

  // Attiva semi-manuale SOLO se source='manual', stufa accesa, scheduler attivo e non già in semi-manuale
  if (source === 'manual') {
    // Verifica se stufa è accesa
    const statusRes = await fetch(STUFA_API.getStatus());
    const statusData = await statusRes.json();
    const isOn = statusData?.StatusDescription?.includes('WORK') || statusData?.StatusDescription?.includes('START');

    if (isOn) {
      const mode = await getFullSchedulerMode();
      if (mode.enabled && !mode.semiManual) {
        const nextChange = await getNextScheduledChange();
        if (nextChange) {
          await setSemiManualMode(nextChange);
          console.log('Modalità semi-manuale attivata per comando manuale di cambio ventola');
        }
      }
    }
  }

  return Response.json(data);
}
