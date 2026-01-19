/**
 * API Route: Individual Schedule
 * GET: Get specific schedule (full data with slots)
 * PUT: Update schedule (name, slots, enabled)
 * DELETE: Delete schedule (with validation)
 */

import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/schedules/[id]
 * Get specific schedule with full data
 */
export async function GET(request, { params }) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { id } = await params;

    const schedule = await adminDbGet(`schedules-v2/schedules/${id}`);

    if (!schedule) {
      return NextResponse.json(
        { error: `Schedule '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id,
      ...schedule
    });
  } catch (error) {
    console.error(`❌ Error fetching schedule:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/schedules/[id]
 * Update schedule
 *
 * Body: { name?, slots?, enabled? }
 */
export async function PUT(request, { params }) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { id } = await params;
    const updates = await request.json();

    // Check schedule exists
    const existingSchedule = await adminDbGet(`schedules-v2/schedules/${id}`);
    if (!existingSchedule) {
      return NextResponse.json(
        { error: `Schedule '${id}' not found` },
        { status: 404 }
      );
    }

    // Validation: if updating name, check uniqueness
    if (updates.name && updates.name !== existingSchedule.name) {
      const allSchedules = await adminDbGet('schedules-v2/schedules');
      if (allSchedules) {
        const otherNames = Object.entries(allSchedules)
          .filter(([otherId]) => otherId !== id)
          .map(([, data]) => data.name.toLowerCase());

        if (otherNames.includes(updates.name.toLowerCase())) {
          return NextResponse.json(
            { error: 'Schedule name already exists' },
            { status: 400 }
          );
        }
      }
    }

    // Build updated schedule
    const updatedSchedule = {
      ...existingSchedule,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Preserve required fields
    delete updatedSchedule.id;
    delete updatedSchedule.createdAt; // Don't allow overwriting createdAt

    await adminDbSet(`schedules-v2/schedules/${id}`, updatedSchedule);

    console.log(`✅ Schedule updated: ${id}`);

    return NextResponse.json({
      success: true,
      schedule: {
        id,
        ...updatedSchedule
      }
    });
  } catch (error) {
    console.error(`❌ Error updating schedule:`, error);
    return NextResponse.json(
      { error: 'Failed to update schedule', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/schedules/[id]
 * Delete schedule (with safety validations)
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { id } = await params;

    // Validation 1: Cannot delete active schedule
    const activeScheduleId = await adminDbGet('schedules-v2/activeScheduleId');
    if (activeScheduleId === id) {
      return NextResponse.json(
        { error: 'Cannot delete active schedule. Please activate another schedule first.' },
        { status: 400 }
      );
    }

    // Validation 2: Cannot delete last schedule
    const allSchedules = await adminDbGet('schedules-v2/schedules');
    const scheduleCount = allSchedules ? Object.keys(allSchedules).length : 0;

    if (scheduleCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last schedule. At least one schedule must exist.' },
        { status: 400 }
      );
    }

    // Check schedule exists
    const schedule = await adminDbGet(`schedules-v2/schedules/${id}`);
    if (!schedule) {
      return NextResponse.json(
        { error: `Schedule '${id}' not found` },
        { status: 404 }
      );
    }

    // Delete schedule
    await adminDbSet(`schedules-v2/schedules/${id}`, null);

    console.log(`✅ Schedule deleted: ${id} (${schedule.name})`);

    return NextResponse.json({
      success: true,
      message: `Schedule '${schedule.name}' deleted successfully`
    });
  } catch (error) {
    console.error(`❌ Error deleting schedule:`, error);
    return NextResponse.json(
      { error: 'Failed to delete schedule', details: error.message },
      { status: 500 }
    );
  }
}
