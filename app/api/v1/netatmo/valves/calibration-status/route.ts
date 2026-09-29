/**
 * GET /api/v1/netatmo/valves/calibration-status
 *
 * Last NRV calibration run (manual or automatic) and the next automatic one:
 * the 12 h auto calibration runs on the Pi (ROADMAP V9).
 *
 * Protected: Requires an authenticated session
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyValveCalibrationStatus } from '@/lib/netatmo/netatmoProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getProxyValveCalibrationStatus();
  return success(data as unknown as Record<string, unknown>);
}, 'Netatmo/Valves/CalibrationStatus');
