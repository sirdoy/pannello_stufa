import { withAuthAndErrorHandler, success, parseJsonOrThrow } from '@/lib/core';
import { setPowerLevel } from '@/lib/stoveApi';
import { getFullSchedulerMode, setSemiManualMode, getNextScheduledChange } from '@/lib/schedulerService';
import { updateStoveState } from '@/lib/stoveStateService';

/**
 * POST /api/stove/setPower
 * Sets the power level
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const { level, source } = await parseJsonOrThrow(request);
  const data = await setPowerLevel(level);

  // Update Firebase state for real-time sync
  await updateStoveState({
    powerLevel: level,
    source: source || 'manual',
  });

  // Attiva semi-manuale SOLO se source='manual', scheduler attivo e non già in semi-manuale
  if (source === 'manual') {
    const mode = await getFullSchedulerMode();
    if (mode.enabled && !mode.semiManual) {
      const nextChange = await getNextScheduledChange();
      // Attiva semi-manuale anche senza prossimo evento (rimane attivo fino a reset manuale)
      await setSemiManualMode(nextChange);
      console.log('Modalità semi-manuale attivata per comando manuale di cambio potenza');

      return success({
        ...data,
        modeChanged: true,
        newMode: 'semi-manual',
        returnToAutoAt: nextChange
      });
    }
  }

  return success(data);
}, 'Stove/SetPower');
