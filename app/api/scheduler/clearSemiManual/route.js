/**
 * API Route: Clear Semi-Manual Mode
 * Disattiva la modalità semi-manuale e torna in automatico
 */

import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Verifica autenticazione
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    // Get current mode
    const currentMode = await adminDbGet('stoveScheduler/mode') || {
      enabled: false,
      semiManual: false
    };

    // Clear semi-manual mode
    await adminDbSet('stoveScheduler/mode', {
      enabled: currentMode.enabled,
      semiManual: false,
      lastUpdated: new Date().toISOString()
    });

    console.log('✅ Modalità semi-manuale disattivata');

    return NextResponse.json({
      success: true,
      message: 'Modalità semi-manuale disattivata',
      mode: {
        enabled: currentMode.enabled,
        semiManual: false
      }
    });

  } catch (error) {
    console.error('❌ Errore disattivazione semi-manuale:', error);
    return NextResponse.json(
      {
        error: 'Errore nella disattivazione modalità semi-manuale',
        details: error.message
      },
      { status: 500 }
    );
  }
}
