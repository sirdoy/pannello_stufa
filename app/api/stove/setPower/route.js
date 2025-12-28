import { auth0 } from '@/lib/auth0';
import { setPowerLevel, getStoveStatus } from '@/lib/stoveApi';
import { getFullSchedulerMode, setSemiManualMode, getNextScheduledChange } from '@/lib/schedulerService';
import { updateStoveState } from '@/lib/stoveStateService';

/**
 * POST /api/stove/setPower
 * Sets the power level
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const POST = auth0.withApiAuthRequired(async function setPowerHandler(req) {
  try {
    const { level, source } = await req.json();
    const data = await setPowerLevel(level);

    // Update Firebase state for real-time sync
    await updateStoveState({
      powerLevel: level,
      source: source || 'manual',
    });

    // Attiva semi-manuale SOLO se source='manual', stufa accesa, scheduler attivo e non già in semi-manuale
    if (source === 'manual') {
      // Verifica se stufa è accesa
      const statusData = await getStoveStatus();
      const isOn = statusData?.StatusDescription?.includes('WORK') || statusData?.StatusDescription?.includes('START');

      if (isOn) {
        const mode = await getFullSchedulerMode();
        if (mode.enabled && !mode.semiManual) {
          const nextChange = await getNextScheduledChange();
          // Attiva semi-manuale anche senza prossimo evento (rimane attivo fino a reset manuale)
          await setSemiManualMode(nextChange);
          console.log('Modalità semi-manuale attivata per comando manuale di cambio potenza');

          return Response.json({
            ...data,
            modeChanged: true,
            newMode: 'semi-manual',
            returnToAutoAt: nextChange
          });
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
});
