import { withAuthAndErrorHandler, success } from '@/lib/core';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { proxyCalibrateValves } from '@/lib/netatmo/netatmoProxy';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/netatmo/calibrate
 * Triggers valve calibration via the Netatmo proxy's dedicated /valves/calibrate endpoint.
 *
 * Replaces the old schedule-switching workaround — the proxy handles calibration natively.
 * Returns 202 Accepted with per-valve calibration results.
 *
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request: NextRequest, _context: unknown, session?: any) => {
  try {
    const result = await proxyCalibrateValves();
    return success(result as unknown as Record<string, unknown>);
  } catch (error) {
    await adminDbPush('log', {
      action: 'Calibrazione valvole - errore',
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
      user: session?.user?.email ?? 'unknown',
      source: 'manual',
    });
    throw error;
  }
}, 'Netatmo/Calibrate');
