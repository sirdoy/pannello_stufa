/**
 * API Route: Individual Schedule
 * GET: Get specific schedule (full data with slots)
 * PUT: Update schedule (name, slots, enabled)
 * DELETE: Delete schedule (with validation)
 */

import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  notFound,
  parseJson,
  getPathParam,
} from '@/lib/core';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

interface Schedule {
  name: string;
  enabled: boolean;
  slots: Record<string, any[]>;
  createdAt: string;
  updatedAt: string;
}

interface UpdateScheduleBody {
  name?: string;
  slots?: Record<string, any[]>;
  enabled?: boolean;
}

/**
 * GET /api/schedules/[id]
 * Get specific schedule with full data
 */
export const GET = withAuthAndErrorHandler(async (request, context) => {
  const id = await getPathParam(context, 'id');

  const schedule = await adminDbGet(`schedules-v2/schedules/${id}`) as Schedule | null;

  if (!schedule) {
    return notFound(`Schedule '${id}' not found`);
  }

  return success({ id, ...schedule });
}, 'Schedules/Get');

/**
 * PUT /api/schedules/[id]
 * Update schedule
 * Body: { name?, slots?, enabled? }
 */
export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const id = await getPathParam(context, 'id');
  const updates = await parseJson(request) as UpdateScheduleBody;

  // Check schedule exists
  const existingSchedule = await adminDbGet(`schedules-v2/schedules/${id}`) as Schedule | null;
  if (!existingSchedule) {
    return notFound(`Schedule '${id}' not found`);
  }

  // Validation: if updating name, check uniqueness
  if (updates.name && updates.name !== existingSchedule.name) {
    const allSchedules = await adminDbGet('schedules-v2/schedules') as Record<string, Schedule> | null;
    if (allSchedules) {
      const otherNames = Object.entries(allSchedules)
        .filter(([otherId]) => otherId !== id)
        .map(([, data]: [string, Schedule]) => data.name.toLowerCase());

      if (otherNames.includes(updates.name.toLowerCase())) {
        return badRequest('Schedule name already exists');
      }
    }
  }

  // Build updated schedule
  const updatedSchedule: any = {
    ...existingSchedule,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Preserve required fields
  delete updatedSchedule.id;
  delete updatedSchedule.createdAt;

  await adminDbSet(`schedules-v2/schedules/${id}`, updatedSchedule);


  return success({
    schedule: { id, ...updatedSchedule }
  });
}, 'Schedules/Update');

/**
 * DELETE /api/schedules/[id]
 * Delete schedule (with safety validations)
 */
export const DELETE = withAuthAndErrorHandler(async (request, context) => {
  const id = await getPathParam(context, 'id');

  // Validation 1: Cannot delete active schedule
  const activeScheduleId = await adminDbGet('schedules-v2/activeScheduleId') as string | null;
  if (activeScheduleId === id) {
    return badRequest('Cannot delete active schedule. Please activate another schedule first.');
  }

  // Validation 2: Cannot delete last schedule
  const allSchedules = await adminDbGet('schedules-v2/schedules') as Record<string, Schedule> | null;
  const scheduleCount = allSchedules ? Object.keys(allSchedules).length : 0;

  if (scheduleCount <= 1) {
    return badRequest('Cannot delete the last schedule. At least one schedule must exist.');
  }

  // Check schedule exists
  const schedule = await adminDbGet(`schedules-v2/schedules/${id}`) as Schedule | null;
  if (!schedule) {
    return notFound(`Schedule '${id}' not found`);
  }

  // Delete schedule
  await adminDbSet(`schedules-v2/schedules/${id}`, null);


  return success({
    message: `Schedule '${schedule.name}' deleted successfully`
  });
}, 'Schedules/Delete');
