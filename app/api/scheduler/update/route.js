/**
 * API Route: Update Scheduler
 * Gestisce tutte le operazioni di modifica scheduler
 */

import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Verifica autenticazione
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { operation, data } = body;

    switch (operation) {
      case 'saveSchedule': {
        // Save schedule for a specific day
        const { day, schedule } = data;
        await adminDbSet(`stoveScheduler/${day}`, schedule);
        return NextResponse.json({
          success: true,
          message: `Scheduler salvato per ${day}`
        });
      }

      case 'setSchedulerMode': {
        // Enable/disable scheduler
        const { enabled } = data;
        const currentMode = await adminDbGet('stoveScheduler/mode') || {};
        await adminDbSet('stoveScheduler/mode', {
          ...currentMode,
          enabled,
          lastUpdated: new Date().toISOString()
        });
        return NextResponse.json({
          success: true,
          message: `Modalità scheduler: ${enabled ? 'attiva' : 'disattiva'}`
        });
      }

      case 'setSemiManualMode': {
        // Activate semi-manual mode
        const { returnToAutoAt } = data;
        const currentMode = await adminDbGet('stoveScheduler/mode') || {};
        await adminDbSet('stoveScheduler/mode', {
          enabled: currentMode.enabled || false,
          semiManual: true,
          semiManualActivatedAt: new Date().toISOString(),
          returnToAutoAt,
          lastUpdated: new Date().toISOString()
        });
        return NextResponse.json({
          success: true,
          message: 'Modalità semi-manuale attivata'
        });
      }

      case 'clearSemiManualMode': {
        // Clear semi-manual mode
        const currentMode = await adminDbGet('stoveScheduler/mode') || {};
        await adminDbSet('stoveScheduler/mode', {
          enabled: currentMode.enabled || false,
          semiManual: false,
          lastUpdated: new Date().toISOString()
        });
        return NextResponse.json({
          success: true,
          message: 'Modalità semi-manuale disattivata'
        });
      }

      default:
        return NextResponse.json(
          { error: `Operazione non supportata: ${operation}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Errore update scheduler:', error);
    return NextResponse.json(
      {
        error: 'Errore nell\'aggiornamento scheduler',
        details: error.message
      },
      { status: 500 }
    );
  }
}
