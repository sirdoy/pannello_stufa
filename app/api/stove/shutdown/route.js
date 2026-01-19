import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { shutdownStove } from '@/lib/stoveApi';
import { getFullSchedulerMode, setSemiManualMode, getNextScheduledChange } from '@/lib/schedulerService';
import { updateStoveState } from '@/lib/stoveStateService';

/**
 * POST /api/stove/shutdown
 * Shuts down the stove
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export async function POST(req) {
  try {
    const session = await auth0.getSession(req);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    // Parse body per ottenere source
    const body = await req.json().catch(() => ({}));
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
        if (nextChange) {
          await setSemiManualMode(nextChange);
          console.log('Modalità semi-manuale attivata per comando manuale di spegnimento');
        }
      }
    }

    return Response.json(data);
  } catch (error) {
    console.error('[Stove API] Shutdown error:', error.message);

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
