/**
 * API Route: Schedules Collection
 * GET: List all schedules (metadata only)
 * POST: Create new schedule (from scratch or copy)
 */

import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/schedules
 * List all schedules (metadata only, no slots)
 */
export async function GET(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    const schedulesData = await adminDbGet('schedules-v2/schedules');
    const activeScheduleId = await adminDbGet('schedules-v2/activeScheduleId');

    if (!schedulesData) {
      return NextResponse.json({
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
    const sorted = schedules.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return NextResponse.json({
      schedules: sorted,
      activeScheduleId: activeScheduleId || 'default'
    });
  } catch (error) {
    console.error('❌ Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schedules
 * Create new schedule (from scratch or copy from existing)
 *
 * Body: { name: string, copyFromId?: string }
 */
export async function POST(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await request.json();
    const { name, copyFromId } = body;

    // Validation: name required
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Schedule name is required' },
        { status: 400 }
      );
    }

    // Validation: name must be unique
    const existingSchedules = await adminDbGet('schedules-v2/schedules');
    if (existingSchedules) {
      const names = Object.values(existingSchedules).map(s => s.name.toLowerCase());
      if (names.includes(name.trim().toLowerCase())) {
        return NextResponse.json(
          { error: 'Schedule name already exists' },
          { status: 400 }
        );
      }
    }

    // Generate unique ID
    const scheduleId = generateScheduleId(name);

    const now = new Date().toISOString();
    let slots = createEmptySlots();

    // If copying from existing schedule
    if (copyFromId) {
      const sourceSchedule = await adminDbGet(`schedules-v2/schedules/${copyFromId}`);
      if (!sourceSchedule) {
        return NextResponse.json(
          { error: `Source schedule '${copyFromId}' not found` },
          { status: 404 }
        );
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

    return NextResponse.json({
      success: true,
      schedule: {
        id: scheduleId,
        ...newSchedule
      }
    });
  } catch (error) {
    console.error('❌ Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper: Calculate total intervals
 */
function calculateTotalIntervals(slots) {
  if (!slots) return 0;
  return Object.values(slots).reduce((total, dayIntervals) => {
    return total + (Array.isArray(dayIntervals) ? dayIntervals.length : 0);
  }, 0);
}

/**
 * Helper: Create empty slots for all days
 */
function createEmptySlots() {
  const days = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  return days.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {});
}

/**
 * Helper: Generate unique schedule ID from name
 */
function generateScheduleId(name) {
  const normalized = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const timestamp = Date.now().toString(36);
  return `${normalized}-${timestamp}`;
}
