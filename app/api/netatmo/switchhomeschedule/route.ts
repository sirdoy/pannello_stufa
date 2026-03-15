import { withAuthAndErrorHandler, success, parseJsonOrThrow, validateRequired } from '@/lib/core';
import { proxySwitchHomeSchedule } from '@/lib/netatmoProxy';
import { adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface SwitchHomeScheduleBody {
  home_id?: string;
  schedule_id?: string;
}

/**
 * POST /api/netatmo/switchhomeschedule
 * Switch the active heating schedule for a home.
 * Body: { home_id: string; schedule_id: string }
 * Side effect: writes userSelectedScheduleId to Firebase for schedule preservation.
 */
export const POST = withAuthAndErrorHandler(async (request: NextRequest) => {
  const body = await parseJsonOrThrow(request) as SwitchHomeScheduleBody;
  const { home_id, schedule_id } = body;

  validateRequired(home_id, 'home_id');
  validateRequired(schedule_id, 'schedule_id');

  await proxySwitchHomeSchedule({ home_id: home_id!, schedule_id: schedule_id! });

  await adminDbSet(
    getEnvironmentPath('netatmo/userSelectedScheduleId'),
    schedule_id
  );

  return success({
    success: true,
    scheduleId: schedule_id,
    message: 'Schedule cambiato con successo',
  });
}, 'Netatmo/SwitchHomeSchedule');
