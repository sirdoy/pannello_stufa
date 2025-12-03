/**
 * API Route: Log Stove Error
 *
 * POST /api/errors/log
 *
 * Logga un errore stufa su Firebase per tracking storico
 * Usato da errorMonitor service quando rileva nuovi errori
 *
 * Body:
 * {
 *   errorCode: 3,
 *   errorDescription: "Pellet esaurito",
 *   severity: "critical|error|warning|info",
 *   additionalData: { ... }  // opzionale
 * }
 */

import { auth0 } from '@/lib/auth0';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Verifica autenticazione
    const session = await auth0.getSession(request);
    const user = session?.user;

    if (!user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Valida body
    if (body.errorCode === undefined || !body.errorDescription || !body.severity) {
      return NextResponse.json(
        { error: 'errorCode, errorDescription e severity sono richiesti' },
        { status: 400 }
      );
    }

    const { errorCode, errorDescription, severity, additionalData } = body;

    // Valida severity
    const validSeverities = ['info', 'warning', 'error', 'critical'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `severity deve essere uno tra: ${validSeverities.join(', ')}` },
        { status: 400 }
      );
    }

    // Crea error log
    const errorLog = {
      errorCode,
      errorDescription,
      severity,
      timestamp: Date.now(),
      resolved: false,
      ...(additionalData || {}),
    };

    // Salva su Firebase usando Admin SDK
    const errorId = await adminDbPush('errors', errorLog);

    console.log(`✅ Errore stufa loggato: ${errorCode} - ${errorDescription} (${severity})`);

    return NextResponse.json({
      success: true,
      message: 'Errore loggato con successo',
      errorId,
      errorLog,
    });

  } catch (error) {
    console.error('❌ Errore logging errore stufa:', error);
    return NextResponse.json(
      {
        error: 'LOG_FAILED',
        message: error.message || 'Impossibile loggare errore',
      },
      { status: 500 }
    );
  }
}
