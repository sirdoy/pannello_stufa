/**
 * API Route: Schedules Collection
 * GET: List all schedules (metadata only)
 * POST: Create new schedule (from scratch or copy)
 */

import { withAuthAndErrorHandler, success, badRequest, notFound, parseJsonOrThrow, validateRequired } from '@/lib/core';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

interface Schedule {
  name: string;
  enabled: boolean;
  slots: Record<string, any[]>;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/schedules
 * List all schedules (metadata only, no slots)
 */
export const GET = withAuthAndErrorHandler(async () => {
  const schedulesData = await adminDbGet('schedules-v2/schedules') as Record<string, Schedule> | null;
  const activeScheduleId = await adminDbGet('schedules-v2/activeScheduleId') as string | null;

  if (!schedulesData) {
    return success({
      schedules: [],
      activeScheduleId: activeScheduleId || 'default'
    });
  }

  // Map to array with metadata only
  const schedules = Object.entries(schedulesData).map(([id, data]) => ({
    id,
    name: data.name,
    enabled: data.enabled,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    intervalCount: calculateTotalIntervals(data.slots)
  }));

  // Sort by createdAt (oldest first)
  const sorted = schedules.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return success({
    schedules: sorted,
    activeScheduleId: activeScheduleId || 'default'
  });
}, 'Schedules/List');

interface CreateScheduleBody {
  name: string;
  copyFromId?: string;
}

/**
 * POST /api/schedules
 * Create new schedule (from scratch or copy from existing)
 * Body: { name: string, copyFromId?: string }
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJsonOrThrow(request) as CreateScheduleBody;
  const { name, copyFromId } = body;

  // Validation: name required
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return badRequest('Schedule name is required');
  }

  // Validation: name must be unique
  const existingSchedules = await adminDbGet('schedules-v2/schedules') as Record<string, Schedule> | null;
  if (existingSchedules) {
    const names = Object.values(existingSchedules).map((s: Schedule) => s.name.toLowerCase());
    if (names.includes(name.trim().toLowerCase())) {
      return badRequest('Schedule name already exists');
    }
  }

  // Generate unique ID
  const scheduleId = generateScheduleId(name);

  const now = new Date().toISOString();
  let slots: Record<string, any[]> = createEmptySlots();

  // If copying from existing schedule
  if (copyFromId) {
    const sourceSchedule = await adminDbGet(`schedules-v2/schedules/${copyFromId}`) as Schedule | null;
    if (!sourceSchedule) {
      return notFound(`Source schedule '${copyFromId}' not found`);
    }
    // Deep copy slots
    slots = JSON.parse(JSON.stringify(sourceSchedule.slots));
  }

  // Create new schedule
  const newSchedule = {
    name: name.trim(),
    enabled: true,
    slots,
    createdAt: now,
    updatedAt: now
  };

  await adminDbSet(`schedules-v2/schedules/${scheduleId}`, newSchedule);

  console.log(`✅ Schedule created: ${scheduleId} (${name})`);

  return success({
    schedule: {
      id: scheduleId,
      ...newSchedule
    }
  });
}, 'Schedules/Create');

/**
 * Helper: Calculate total intervals
 */
function calculateTotalIntervals(slots: Record<string, any[]> | undefined): number {
  if (!slots) return 0;
  return Object.values(slots).reduce((total, dayIntervals) => {
    return total + (Array.isArray(dayIntervals) ? dayIntervals.length : 0);
  }, 0);
}

/**
 * Helper: Create empty slots for all days
 */
function createEmptySlots(): Record<string, any[]> {
  const days = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  return days.reduce((acc: Record<string, any[]>, day) => {
    acc[day] = [];
    return acc;
  }, {});
}

/**
 * Helper: Generate unique schedule ID from name
 */
function generateScheduleId(name: string): string {
  const normalized = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const timestamp = Date.now().toString(36);
  return `${normalized}-${timestamp}`;
}
