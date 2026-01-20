import { withAuthAndErrorHandler, success, maintenanceRequired, parseJson } from '@/lib/core';
import { igniteStove } from '@/lib/stoveApi';
import { getFullSchedulerMode, setSemiManualMode, getNextScheduledChange } from '@/lib/schedulerService';
import { canIgnite } from '@/lib/maintenanceService';
import { updateStoveState } from '@/lib/stoveStateService';

/**
 * POST /api/stove/ignite
 * Ignites the stove
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJson(request);
  const source = body.source;
  const power = body.power || 3;

  // Check maintenance status before igniting
  const maintenanceAllowed = await canIgnite();
  if (!maintenanceAllowed) {
    return maintenanceRequired();
  }

  const data = await igniteStove(power);

  // Update Firebase state for real-time sync
  await updateStoveState({
    status: 'START',
    statusDescription: 'Avvio in corso',
    powerLevel: power,
    source: source || 'manual',
  });

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

  return success(data);
}, 'Stove/Ignite');
