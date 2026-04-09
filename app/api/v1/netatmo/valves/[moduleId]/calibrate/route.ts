/**
 * API Route: Netatmo Valves Single Calibrate
 *
 * POST /api/v1/netatmo/valves/{moduleId}/calibrate
 *
 * Calibrates a single valve by module ID via the HA proxy.
 * Returns 202 Accepted with suggested_poll_delay_s.
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success, getPathParam, HTTP_STATUS } from '@/lib/core';
import { proxyCalibrateValve } from '@/lib/netatmo/netatmoProxy';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (_request, context) => {
  const moduleId = await getPathParam(context, 'moduleId');
  const data = await proxyCalibrateValve(moduleId);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Netatmo/Valves/Calibrate');
