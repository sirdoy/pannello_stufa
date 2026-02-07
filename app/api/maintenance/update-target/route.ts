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

import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  notFound,
  parseJsonOrThrow,
  validateRequired,
} from '@/lib/core';
import { adminDbGet, adminDbUpdate } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

interface UpdateTargetBody {
  targetHours: number;
}

interface MaintenanceData {
  currentHours: number;
  targetHours: number;
  needsCleaning?: boolean;
  [key: string]: unknown;
}

/**
 * POST /api/maintenance/update-target
 * Update maintenance target hours
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = (await parseJsonOrThrow(request)) as UpdateTargetBody;
  const { targetHours } = body;

  // Validate required field
  validateRequired(targetHours, 'targetHours');
  if (typeof targetHours !== 'number' || targetHours <= 0) {
    return badRequest('targetHours deve essere un numero positivo');
  }

  // Get current maintenance data
  const maintenanceData = (await adminDbGet('maintenance')) as MaintenanceData | null;

  if (!maintenanceData) {
    return notFound('Dati manutenzione non trovati');
  }

  // Update target hours
  const updates: Partial<MaintenanceData> = {
    targetHours: parseFloat(targetHours as any),
  };

  // Check if current hours >= new threshold
  if (maintenanceData.currentHours >= targetHours && !maintenanceData.needsCleaning) {
    updates.needsCleaning = true;
    console.log(`Soglia raggiunta: ${maintenanceData.currentHours}h >= ${targetHours}h - needsCleaning=true`);
  }

  await adminDbUpdate('maintenance', updates);

  console.log(`Target ore manutenzione aggiornato: ${targetHours}h`);

  return success({
    message: 'Soglia manutenzione aggiornata',
    targetHours,
    currentHours: maintenanceData.currentHours,
    needsCleaning: updates.needsCleaning || maintenanceData.needsCleaning,
  });
}, 'Maintenance/UpdateTarget');
