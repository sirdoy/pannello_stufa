/**
 * API Route: Active Schedule Management
 * GET: Get active schedule ID
 * POST: Set active schedule (atomic operation)
 */

import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  notFound,
  parseJsonOrThrow,
  validateRequired,
} from '@/lib/core';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/schedules/active
 * Get current active schedule ID
 */
export const GET = withAuthAndErrorHandler(async () => {
  const activeScheduleId = await adminDbGet('schedules-v2/activeScheduleId') as string | null;

  if (!activeScheduleId) {
    return notFound('No active schedule set');
  }

  return success({ activeScheduleId });
}, 'Schedules/GetActive');

interface SetActiveScheduleBody {
  scheduleId: string;
}

/**
 * POST /api/schedules/active
 * Set active schedule (atomic operation with validation)
 * Body: { scheduleId: string }
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJsonOrThrow(request) as SetActiveScheduleBody;
  const { scheduleId } = body;

  // Validation: scheduleId required
  validateRequired(scheduleId, 'scheduleId');
  if (typeof scheduleId !== 'string') {
    return badRequest('Schedule ID must be a string');
  }

  // Validation: schedule must exist
  const schedule = await adminDbGet(`schedules-v2/schedules/${scheduleId}`) as { name: string } | null;
  if (!schedule) {
    return notFound(`Schedule '${scheduleId}' does not exist`);
  }

  // Atomic update of active schedule ID
  await adminDbSet('schedules-v2/activeScheduleId', scheduleId);


  return success({
    activeScheduleId: scheduleId,
    scheduleName: schedule.name,
    message: `Schedule '${schedule.name}' is now active`
  });
}, 'Schedules/SetActive');
