/**
 * API Route: Resolve Stove Error
 *
 * POST /api/errors/resolve
 *
 * Marca un errore stufa come risolto
 * Aggiunge timestamp risoluzione e flag resolved=true
 *
 * Body:
 * {
 *   errorId: "firebase_error_id"
 * }
 */

import { auth0 } from '@/lib/auth0';
import { adminDbGet, adminDbUpdate } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Verifica autenticazione
    const session = await auth0.getSession();
    const user = session?.user;

    if (!user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Valida body
    if (!body.errorId) {
      return NextResponse.json(
        { error: 'errorId è richiesto' },
        { status: 400 }
      );
    }

    const { errorId } = body;

    // Verifica che l'errore esista
    const errorData = await adminDbGet(`errors/${errorId}`);

    if (!errorData) {
      return NextResponse.json(
        { error: 'Errore non trovato' },
        { status: 404 }
      );
    }

    // Se già risolto, ritorna success
    if (errorData.resolved) {
      return NextResponse.json({
        success: true,
        message: 'Errore già risolto',
        errorId,
        resolvedAt: errorData.resolvedAt,
      });
    }

    // Marca come risolto usando Admin SDK
    const updates = {
      resolved: true,
      resolvedAt: Date.now(),
    };

    await adminDbUpdate(`errors/${errorId}`, updates);

    console.log(`✅ Errore stufa risolto: ${errorId} (${errorData.errorCode})`);

    return NextResponse.json({
      success: true,
      message: 'Errore risolto con successo',
      errorId,
      resolvedAt: updates.resolvedAt,
    });

  } catch (error) {
    console.error('❌ Errore risoluzione errore stufa:', error);
    return NextResponse.json(
      {
        error: 'RESOLVE_FAILED',
        message: error.message || 'Impossibile risolvere errore',
      },
      { status: 500 }
    );
  }
}
