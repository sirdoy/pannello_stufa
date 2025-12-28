/**
 * API Route: Sync External State to Firebase
 *
 * Called when client polling detects external changes (manual actions, auto-shutdown)
 * Updates Firebase state so all devices receive real-time updates
 */

import { updateStoveState } from '@/lib/stoveStateService';
import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Auth0 authentication
    const session = await auth0.getSession(request);
    if (!session) {
      return Response.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await request.json();
    const { status, fanLevel, powerLevel, errorCode, errorDescription } = body;

    // Validation
    if (!status) {
      return Response.json({ error: 'Campo status richiesto' }, { status: 400 });
    }

    // Sync to Firebase for multi-device real-time updates
    await updateStoveState({
      status,
      fanLevel,
      powerLevel,
      errorCode: errorCode ?? 0,
      errorDescription: errorDescription ?? '',
      source: 'external_change'
    });

    return Response.json({
      success: true,
      message: 'External state synced to Firebase'
    });
  } catch (error) {
    console.error('[sync-external-state] Error:', error);
    return Response.json({
      error: 'Errore sincronizzazione Firebase',
      details: error.message
    }, { status: 500 });
  }
}
