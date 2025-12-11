/**
 * API Route: User Theme Preference
 *
 * GET /api/user/theme
 * - Recupera la preferenza tema dell'utente
 *
 * POST /api/user/theme
 * - Aggiorna la preferenza tema dell'utente
 *
 * Body (POST):
 * {
 *   theme: "light" | "dark"
 * }
 */

import { auth0 } from '@/lib/auth0';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const VALID_THEMES = ['light', 'dark'];

export const GET = auth0.withApiAuthRequired(async function getUserTheme(request) {
  try {
    // Get user info from session (auth already verified by wrapper)
    const { user } = await auth0.getSession(request);
    const userId = user.sub;

    // Recupera tema da Firebase
    const theme = await adminDbGet(`users/${userId}/preferences/theme`);

    if (theme) {
      return NextResponse.json({
        success: true,
        theme,
      });
    }

    // Default: light
    return NextResponse.json({
      success: true,
      theme: 'light',
      default: true,
    });

  } catch (error) {
    console.error('❌ Errore recupero tema:', error);
    return NextResponse.json(
      {
        error: 'GET_FAILED',
        message: error.message || 'Impossibile recuperare tema',
      },
      { status: 500 }
    );
  }
});

export const POST = auth0.withApiAuthRequired(async function updateUserTheme(request) {
  try {
    // Get user info from session (auth already verified by wrapper)
    const { user } = await auth0.getSession(request);
    const userId = user.sub;
    const body = await request.json();

    // Valida body
    if (!body.theme || !VALID_THEMES.includes(body.theme)) {
      return NextResponse.json(
        { error: `theme deve essere uno tra: ${VALID_THEMES.join(', ')}` },
        { status: 400 }
      );
    }

    const { theme } = body;

    // Salva tema su Firebase usando Admin SDK
    await adminDbSet(`users/${userId}/preferences/theme`, theme);

    console.log(`✅ Tema aggiornato per user ${userId}: ${theme}`);

    return NextResponse.json({
      success: true,
      message: 'Tema aggiornato con successo',
      theme,
    });

  } catch (error) {
    console.error('❌ Errore aggiornamento tema:', error);
    return NextResponse.json(
      {
        error: 'UPDATE_FAILED',
        message: error.message || 'Impossibile aggiornare tema',
      },
      { status: 500 }
    );
  }
});
