import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

export const dynamic = 'force-dynamic';

/**
 * POST /api/netatmo/disconnect
 * Clears Netatmo tokens to force re-authorization
 * Used when user needs to re-authorize with new OAuth scopes (e.g., camera access)
 */
export async function POST(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // Clear all Netatmo data using Admin SDK
    // Use environment-aware path (dev/netatmo in localhost, netatmo in production)
    const netatmoPath = getEnvironmentPath('netatmo');
    await adminDbSet(netatmoPath, null);

    return NextResponse.json({
      success: true,
      message: 'Disconnesso da Netatmo. Riconnetti per autorizzare nuovi permessi.',
    });
  } catch (err) {
    console.error('Error in /api/netatmo/disconnect:', err);
    return NextResponse.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}
