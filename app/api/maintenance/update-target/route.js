/**
 * API Route: Update Maintenance Target Hours
 *
 * POST /api/maintenance/update-target
 *
 * Aggiorna la soglia ore per la manutenzione stufa
 * Se le ore correnti >= nuova soglia, imposta needsCleaning=true
 *
 * Body:
 * {
 *   targetHours: 50  // Numero ore target (es. 50, 100, 150)
 * }
 */

import { getSession } from '@auth0/nextjs-auth0';
import { adminDbGet, adminDbUpdate } from '@/lib/firebaseAdmin';
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

    const body = await request.json();

    // Valida body
    if (!body.targetHours || typeof body.targetHours !== 'number' || body.targetHours <= 0) {
      return NextResponse.json(
        { error: 'targetHours deve essere un numero positivo' },
        { status: 400 }
      );
    }

    const { targetHours } = body;

    // Recupera dati maintenance attuali
    const maintenanceData = await adminDbGet('maintenance');

    if (!maintenanceData) {
      return NextResponse.json(
        { error: 'Dati manutenzione non trovati' },
        { status: 404 }
      );
    }

    // Aggiorna target hours
    const updates = {
      targetHours: parseFloat(targetHours),
    };

    // Check se ore correnti >= nuova soglia
    if (maintenanceData.currentHours >= targetHours && !maintenanceData.needsCleaning) {
      updates.needsCleaning = true;
      console.log(`⚠️ Soglia raggiunta: ${maintenanceData.currentHours}h >= ${targetHours}h - needsCleaning=true`);
    }

    await adminDbUpdate('maintenance', updates);

    console.log(`✅ Target ore manutenzione aggiornato: ${targetHours}h`);

    return NextResponse.json({
      success: true,
      message: 'Soglia manutenzione aggiornata',
      targetHours,
      currentHours: maintenanceData.currentHours,
      needsCleaning: updates.needsCleaning || maintenanceData.needsCleaning,
    });

  } catch (error) {
    console.error('❌ Errore aggiornamento target hours:', error);
    return NextResponse.json(
      {
        error: 'UPDATE_FAILED',
        message: error.message || 'Impossibile aggiornare soglia',
      },
      { status: 500 }
    );
  }
}
