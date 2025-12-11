import { auth0 } from '@/lib/auth0';
import { igniteStove } from '@/lib/stoveApi';
import { getFullSchedulerMode, setSemiManualMode, getNextScheduledChange } from '@/lib/schedulerService';
import { canIgnite } from '@/lib/maintenanceService';

/**
 * POST /api/stove/ignite
 * Ignites the stove
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const POST = auth0.withApiAuthRequired(async function igniteHandler(req) {
  try {
    // Parse body per ottenere source e power
    const body = await req.json().catch(() => ({}));
    const source = body.source;
    const power = body.power || 3;

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

    const data = await igniteStove(power);

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
});
