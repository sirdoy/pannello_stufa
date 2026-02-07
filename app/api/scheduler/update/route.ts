/**
 * API Route: Update Scheduler
 * Gestisce tutte le operazioni di modifica scheduler
 */

import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  parseJsonOrThrow,
} from '@/lib/core';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

interface UpdateSchedulerBody {
  operation: string;
  data: any;
}

/**
 * POST /api/scheduler/update
 * Update scheduler settings
 * Body: { operation, data }
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJsonOrThrow(request) as UpdateSchedulerBody;
  const { operation, data } = body;

  switch (operation) {
    case 'saveSchedule': {
      // Save schedule for a specific day (active schedule)
      const { day, schedule } = data;
      const activeScheduleId = (await adminDbGet('schedules-v2/activeScheduleId') as string | null) || 'default';
      await adminDbSet(`schedules-v2/schedules/${activeScheduleId}/slots/${day}`, schedule);
      // Update schedule's updatedAt timestamp
      await adminDbSet(`schedules-v2/schedules/${activeScheduleId}/updatedAt`, new Date().toISOString());
      return success({
        message: `Scheduler salvato per ${day}`
      });
    }

    case 'setSchedulerMode': {
      // Enable/disable scheduler
      const { enabled } = data;
      const currentMode = (await adminDbGet('schedules-v2/mode') as Record<string, any> | null) || {};
      await adminDbSet('schedules-v2/mode', {
        ...currentMode,
        enabled,
        lastUpdated: new Date().toISOString()
      });
      return success({
        message: `Modalita scheduler: ${enabled ? 'attiva' : 'disattiva'}`
      });
    }

    case 'setSemiManualMode': {
      // Activate semi-manual mode
      // Note: semiManual requires scheduler to be enabled, so we force enabled: true
      const { returnToAutoAt } = data;
      await adminDbSet('schedules-v2/mode', {
        enabled: true,
        semiManual: true,
        semiManualActivatedAt: new Date().toISOString(),
        returnToAutoAt,
        lastUpdated: new Date().toISOString()
      });
      return success({
        message: 'Modalita semi-manuale attivata'
      });
    }

    case 'clearSemiManualMode': {
      // Clear semi-manual mode
      const currentMode = (await adminDbGet('schedules-v2/mode') as Record<string, any> | null) || {};
      await adminDbSet('schedules-v2/mode', {
        enabled: currentMode.enabled || false,
        semiManual: false,
        lastUpdated: new Date().toISOString()
      });
      return success({
        message: 'Modalita semi-manuale disattivata'
      });
    }

    default:
      return badRequest(`Operazione non supportata: ${operation}`);
  }
}, 'Scheduler/Update');
