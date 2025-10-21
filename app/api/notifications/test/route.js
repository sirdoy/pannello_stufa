/**
 * API Route: Test Notifica Push
 *
 * POST /api/notifications/test
 *
 * Invia una notifica di test all'utente autenticato
 */

import { getSession } from '@auth0/nextjs-auth0';
import { sendNotificationToUser } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Verifica autenticazione
    const session = await getSession();
    const user = session?.user;

    if (!user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    // Costruisci notifica di test
    const notification = {
      title: '🧪 Notifica di Test',
      body: 'Se vedi questo messaggio, le notifiche funzionano correttamente! 🎉',
      icon: '/icons/icon-192.png',
      priority: 'normal',
      data: {
        type: 'test',
        url: '/settings/notifications',
        timestamp: new Date().toISOString(),
      },
    };

    // Invia notifica
    const result = await sendNotificationToUser(user.sub, notification);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Notifica di test inviata',
        sentTo: result.successCount,
        failed: result.failureCount,
      });
    } else {
      return NextResponse.json(
        {
          error: result.error || 'SEND_FAILED',
          message: result.message || 'Impossibile inviare notifica',
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Errore API test notifica:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error.message || 'Errore interno del server',
      },
      { status: 500 }
    );
  }
}
