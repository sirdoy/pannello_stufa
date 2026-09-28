/**
 * POST /api/maintenance/confirm-cleaning
 *
 * Confirms the stove cleaning: resets the working-hours counter on the Pi
 * (backend POST /thermorossi/maintenance/clean, workspace ROADMAP D2.3) and writes
 * the entry in the activity log (Firebase `log`, unchanged).
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';
import { confirmMaintenanceCleaning } from '@/lib/stove/schedulerProxy';

export const dynamic = 'force-dynamic';

/**
 * POST /api/maintenance/confirm-cleaning
 * Confirm stove cleaning
 * Protected: Requires an authenticated session
 */
export const POST = withAuthAndErrorHandler(async (_request, _context, session) => {
  const user = session.user;
  const result = await confirmMaintenanceCleaning();
  const cleanedAt = new Date((result.last_cleaned_at ?? Date.now() / 1000) * 1000).toISOString();

  await adminDbPush('log', {
    action: 'Pulizia stufa',
    device: DEVICE_TYPES.STOVE,
    details: `${result.previous_hours.toFixed(2)}h`,
    metadata: {
      previousHours: result.previous_hours,
      targetHours: result.target_hours,
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
  });

  return success({
    message: 'Pulizia confermata con successo',
    previousHours: result.previous_hours,
    cleanedAt,
  });
}, 'Maintenance/ConfirmCleaning');
