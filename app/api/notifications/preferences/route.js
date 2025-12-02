/**
 * API Route: Notification Preferences
 *
 * GET /api/notifications/preferences
 * - Recupera le preferenze notifiche dell'utente
 *
 * PUT /api/notifications/preferences
 * - Aggiorna le preferenze notifiche dell'utente
 *
 * Body (PUT):
 * {
 *   preferences: {
 *     errors: {
 *       enabled: true,
 *       severityLevels: { info: false, warning: true, error: true, critical: true }
 *     },
 *     scheduler: {
 *       enabled: true,
 *       ignition: true,
 *       shutdown: true
 *     },
 *     maintenance: {
 *       enabled: true,
 *       threshold80: true,
 *       threshold90: true,
 *       threshold100: true
 *     }
 *   }
 * }
 */

import { auth0 } from '@/lib/auth0';
import { adminDbGet, adminDbSet, adminDbUpdate } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Default preferences
const DEFAULT_PREFERENCES = {
  errors: {
    enabled: true,
    severityLevels: {
      info: false,
      warning: true,
      error: true,
      critical: true,
    },
  },
  scheduler: {
    enabled: true,
    ignition: true,
    shutdown: true,
  },
  maintenance: {
    enabled: true,
    threshold80: true,
    threshold90: true,
    threshold100: true,
  },
};

export async function GET(request) {
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

    const userId = user.sub;

    // Recupera preferenze da Firebase
    const preferences = await adminDbGet(`users/${userId}/notificationPreferences`);

    if (preferences) {
      return NextResponse.json({
        success: true,
        preferences,
      });
    }

    // Se non esistono, inizializza con defaults
    await adminDbSet(`users/${userId}/notificationPreferences`, DEFAULT_PREFERENCES);

    return NextResponse.json({
      success: true,
      preferences: DEFAULT_PREFERENCES,
      initialized: true,
    });

  } catch (error) {
    console.error('❌ Errore recupero preferenze notifiche:', error);
    return NextResponse.json(
      {
        error: 'GET_FAILED',
        message: error.message || 'Impossibile recuperare preferenze',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
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

    const userId = user.sub;
    const body = await request.json();

    // Valida body
    if (!body.preferences) {
      return NextResponse.json(
        { error: 'preferences è richiesto' },
        { status: 400 }
      );
    }

    const { preferences } = body;

    // Aggiorna preferenze su Firebase usando Admin SDK
    await adminDbUpdate(`users/${userId}/notificationPreferences`, preferences);

    console.log(`✅ Preferenze notifiche aggiornate per user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Preferenze aggiornate con successo',
      preferences,
    });

  } catch (error) {
    console.error('❌ Errore aggiornamento preferenze notifiche:', error);
    return NextResponse.json(
      {
        error: 'UPDATE_FAILED',
        message: error.message || 'Impossibile aggiornare preferenze',
      },
      { status: 500 }
    );
  }
}
