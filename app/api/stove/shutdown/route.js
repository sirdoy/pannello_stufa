import { withAuthAndErrorHandler, success, parseJson } from '@/lib/core';
import { shutdownStove } from '@/lib/stoveApi';
import { getFullSchedulerMode, setSemiManualMode, getNextScheduledChange } from '@/lib/schedulerService';
import { updateStoveState } from '@/lib/stoveStateService';

/**
 * POST /api/stove/shutdown
 * Shuts down the stove
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJson(request);
  const source = body.source;

  const data = await shutdownStove();

  // Update Firebase state for real-time sync
  await updateStoveState({
    status: 'STANDBY',
    statusDescription: 'Spegnimento...',
    source: source || 'manual',
  });

  // Attiva semi-manuale SOLO se source='manual', scheduler attivo e non già in semi-manuale
  if (source === 'manual') {
    const mode = await getFullSchedulerMode();
    if (mode.enabled && !mode.semiManual) {
      const nextChange = await getNextScheduledChange();
      // Attiva semi-manuale anche senza prossimo evento (rimane attivo fino a reset manuale)
      await setSemiManualMode(nextChange);
      console.log('Modalità semi-manuale attivata per comando manuale di spegnimento');
    }
  }

  return success(data);
}, 'Stove/Shutdown');
