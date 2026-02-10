/**
 * API Route: Confirm Stove Cleaning
 *
 * POST /api/maintenance/confirm-cleaning
 *
 * Conferma che la stufa e stata pulita
 * - Reset ore utilizzo a 0
 * - Disabilita flag needsCleaning
 * - Logga azione utente
 * - Sblocca accensione stufa
 */

import {
  withAuthAndErrorHandler,
  success,
  notFound,
} from '@/lib/core';
import { adminDbGet, adminDbUpdate, adminDbPush } from '@/lib/firebaseAdmin';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';

export const dynamic = 'force-dynamic';

interface MaintenanceData {
  currentHours: number;
  targetHours: number;
  needsCleaning?: boolean;
  lastCleanedAt?: string;
  [key: string]: unknown;
}

/**
 * POST /api/maintenance/confirm-cleaning
 * Confirm stove cleaning
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const user = session.user;

  // Get current maintenance data
  const maintenanceData = (await adminDbGet('maintenance')) as MaintenanceData | null;

  if (!maintenanceData) {
    return notFound('Dati manutenzione non trovati');
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
      sub: user.sub,
    },
    source: 'user',
  };

  await adminDbPush('log', logEntry);

  // Reset maintenance data using Admin SDK
  const updates = {
    currentHours: 0,
    needsCleaning: false,
    lastCleanedAt: cleanedAt,
    lastUpdatedAt: cleanedAt,
    lastNotificationLevel: 0,
  };

  await adminDbUpdate('maintenance', updates);


  return success({
    message: 'Pulizia confermata con successo',
    previousHours: maintenanceData.currentHours,
    cleanedAt,
  });
}, 'Maintenance/ConfirmCleaning');
