/**
 * API Route: Register FCM Token
 *
 * POST /api/notifications/register
 *
 * Registra un FCM token per l'utente autenticato
 * Usato quando l'utente concede permessi notifiche
 *
 * Body:
 * {
 *   token: "FCM_TOKEN_STRING",
 *   userAgent: "Mozilla/5.0...",    // opzionale
 *   platform: "ios|other",           // opzionale
 *   isPWA: true|false                // opzionale
 * }
 * ✅ Protected by Auth0 authentication
 */

import { auth0 } from '@/lib/auth0';
import { adminDbSet } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Verifica autenticazione
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    const userId = session.user.sub;
    const body = await request.json();

    // Valida body
    if (!body.token) {
      return NextResponse.json(
        { error: 'token è richiesto' },
        { status: 400 }
      );
    }

    const { token, userAgent, platform, isPWA } = body;

    // Salva token su Firebase con metadata usando Admin SDK
    const tokenData = {
      token,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      userAgent: userAgent || 'unknown',
      platform: platform || 'other',
      isPWA: isPWA || false,
    };

    await adminDbSet(`users/${userId}/fcmTokens/${token}`, tokenData);

    console.log(`✅ FCM token registrato per user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Token FCM registrato con successo',
      token,
    });

  } catch (error) {
    console.error('❌ Errore registrazione FCM token:', error);
    return NextResponse.json(
      {
        error: 'REGISTRATION_FAILED',
        message: error.message || 'Impossibile registrare token',
      },
      { status: 500 }
    );
  }
}
