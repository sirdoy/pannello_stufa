/**
 * API Route: Confirm Stove Cleaning
 *
 * POST /api/maintenance/confirm-cleaning
 *
 * Conferma che la stufa è stata pulita
 * - Reset ore utilizzo a 0
 * - Disabilita flag needsCleaning
 * - Logga azione utente
 * - Sblocca accensione stufa
 */

import { auth0 } from '@/lib/auth0';
import { adminDbGet, adminDbUpdate, adminDbPush } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';

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

    const userId = user.sub;

    // Recupera dati maintenance attuali
    const maintenanceData = await adminDbGet('maintenance');

    if (!maintenanceData) {
      return NextResponse.json(
        { error: 'Dati manutenzione non trovati' },
        { status: 404 }
      );
    }

    const cleanedAt = new Date().toISOString();

    // Log cleaning action
    const logEntry = {
      action: 'Pulizia stufa',
      device: DEVICE_TYPES.STOVE,
      details: `${maintenanceData.currentHours.toFixed(2)}h`,
      metadata: {
        previousHours: maintenanceData.currentHours,
        targetHours: maintenanceData.targetHours,
        cleanedAt,
        source: 'manual',
      },
      timestamp: Date.now(),
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture,
        sub: userId,
      },
      source: 'user',
    };

    await adminDbPush('log', logEntry);

    // Reset maintenance data usando Admin SDK
    const updates = {
      currentHours: 0,
      needsCleaning: false,
      lastCleanedAt: cleanedAt,
      lastUpdatedAt: cleanedAt,
      lastNotificationLevel: 0, // Reset notification tracking
    };

    await adminDbUpdate('maintenance', updates);

    console.log(`✅ Pulizia stufa confermata - ore reset da ${maintenanceData.currentHours.toFixed(2)}h a 0h`);

    return NextResponse.json({
      success: true,
      message: 'Pulizia confermata con successo',
      previousHours: maintenanceData.currentHours,
      cleanedAt,
    });

  } catch (error) {
    console.error('❌ Errore conferma pulizia:', error);
    return NextResponse.json(
      {
        error: 'CONFIRM_FAILED',
        message: error.message || 'Impossibile confermare pulizia',
      },
      { status: 500 }
    );
  }
}
