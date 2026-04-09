/**
 * API Route: Netatmo Valves Calibrate (Batch)
 *
 * POST /api/v1/netatmo/valves/calibrate
 *
 * Triggers calibration on all valves simultaneously via the HA proxy.
 * Returns 202 Accepted with suggested_poll_delay_s.
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success, HTTP_STATUS } from '@/lib/core';
import { proxyCalibrateValves } from '@/lib/netatmo/netatmoProxy';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async () => {
  const data = await proxyCalibrateValves();
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Netatmo/Valves/CalibrateBatch');
