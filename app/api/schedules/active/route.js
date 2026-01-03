/**
 * API Route: Active Schedule Management
 * GET: Get active schedule ID
 * POST: Set active schedule (atomic operation)
 */

import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/schedules/active
 * Get current active schedule ID
 */
export const GET = auth0.withApiAuthRequired(async function getActiveScheduleHandler() {
  try {
    const activeScheduleId = await adminDbGet('schedules-v2/activeScheduleId');

    if (!activeScheduleId) {
      return NextResponse.json(
        { error: 'No active schedule set' },
        { status: 404 }
      );
    }

    return NextResponse.json({ activeScheduleId });
  } catch (error) {
    console.error('❌ Error fetching active schedule ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active schedule ID', details: error.message },
      { status: 500 }
    );
  }
});

/**
 * POST /api/schedules/active
 * Set active schedule (atomic operation with validation)
 *
 * Body: { scheduleId: string }
 */
export const POST = auth0.withApiAuthRequired(async function setActiveScheduleHandler(request) {
  try {
    const body = await request.json();
    const { scheduleId } = body;

    // Validation: scheduleId required
    if (!scheduleId || typeof scheduleId !== 'string') {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    // Validation: schedule must exist
    const schedule = await adminDbGet(`schedules-v2/schedules/${scheduleId}`);
    if (!schedule) {
      return NextResponse.json(
        { error: `Schedule '${scheduleId}' does not exist` },
        { status: 404 }
      );
    }

    // Atomic update of active schedule ID
    await adminDbSet('schedules-v2/activeScheduleId', scheduleId);

    console.log(`✅ Active schedule changed to: ${scheduleId} (${schedule.name})`);

    return NextResponse.json({
      success: true,
      activeScheduleId: scheduleId,
      scheduleName: schedule.name,
      message: `Schedule '${schedule.name}' is now active`
    });
  } catch (error) {
    console.error('❌ Error setting active schedule:', error);
    return NextResponse.json(
      { error: 'Failed to set active schedule', details: error.message },
      { status: 500 }
    );
  }
});
