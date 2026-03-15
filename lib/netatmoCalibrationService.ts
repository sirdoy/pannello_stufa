/**
 * Netatmo Valve Calibration Service
 *
 * Server-side service for triggering valve calibration.
 * Called directly from cron jobs without HTTP overhead.
 *
 * Calls the Netatmo proxy's /valves/calibrate endpoint directly —
 * no OAuth token management or schedule-switching workaround needed.
 */

import { adminDbPush } from '@/lib/firebaseAdmin';
import { proxyCalibrateValves } from '@/lib/netatmoProxy';
import { ApiError, ERROR_CODES } from '@/lib/core/apiErrors';

/** Calibration result - success */
interface CalibrationSuccess {
  calibrated: true;
  timestamp: number;
}

/** Calibration result - failure */
interface CalibrationFailure {
  calibrated: false;
  reason: 'auth_error' | 'proxy_error';
  error: string;
}

/** Calibration result */
export type CalibrationResult = CalibrationSuccess | CalibrationFailure;

/**
 * Calibrate Netatmo valves via the proxy's dedicated calibration endpoint.
 * This is the server-side version that can be called directly from cron.
 */
export async function calibrateValvesServer(): Promise<CalibrationResult> {
  try {
    await proxyCalibrateValves();
    return {
      calibrated: true,
      timestamp: Date.now(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await adminDbPush('netatmo/calibrations/failures', {
      timestamp: Date.now(),
      triggered_by: 'cron',
      status: 'error',
      error: message,
    });

    // 401 from proxy means authentication issue
    if (error instanceof ApiError && error.code === ERROR_CODES.UNAUTHORIZED) {
      return {
        calibrated: false,
        reason: 'auth_error',
        error: message,
      };
    }

    return {
      calibrated: false,
      reason: 'proxy_error',
      error: message,
    };
  }
}
