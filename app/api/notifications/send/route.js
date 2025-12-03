/**
 * API Route: Invia Notifica Push Generica
 *
 * POST /api/notifications/send
 *
 * Endpoint interno per inviare notifiche push a utenti specifici
 * Protetto con ADMIN_SECRET per prevenire abusi
 *
 * Body:
 * {
 *   userId: "auth0|xxx",              // User ID destinatario
 *   notification: {
 *     title: "Titolo",
 *     body: "Messaggio",
 *     icon: "/icons/icon.png",       // opzionale
 *     priority: "high|normal",        // opzionale
 *     data: { ... }                   // opzionale
 *   }
 * }
 */

import { auth0 } from '@/lib/auth0';
import { sendNotificationToUser } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Verifica autenticazione O admin secret
    const session = await auth0.getSession(request);
    const user = session?.user;

    // Check admin secret da header o body
    const adminSecret = request.headers.get('x-admin-secret');
    const body = await request.json();
    const bodySecret = body.adminSecret;

    const isAdmin = adminSecret === process.env.ADMIN_SECRET ||
                    bodySecret === process.env.ADMIN_SECRET;

    // Se non è admin, verifica che l'utente invii notifiche a se stesso
    if (!isAdmin && (!user || user.sub !== body.userId)) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 403 }
      );
    }

    // Valida body
    if (!body.userId || !body.notification) {
      return NextResponse.json(
        { error: 'userId e notification sono richiesti' },
        { status: 400 }
      );
    }

    const { userId, notification } = body;

    // Valida notification
    if (!notification.title || !notification.body) {
      return NextResponse.json(
        { error: 'notification.title e notification.body sono richiesti' },
        { status: 400 }
      );
    }

    // Invia notifica
    const result = await sendNotificationToUser(userId, notification);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Notifica inviata',
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
    console.error('❌ Errore API send notifica:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error.message || 'Errore interno del server',
      },
      { status: 500 }
    );
  }
}
