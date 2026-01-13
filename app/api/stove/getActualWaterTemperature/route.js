/**
 * GET /api/stove/getActualWaterTemperature
 *
 * Returns the actual water temperature reading from the stove.
 * Used for hydronic/boiler stoves only (not applicable to air stoves).
 *
 * Response format:
 * {
 *   "Result": <temperature-value>,
 *   "isSandbox": false
 * }
 *
 * Auth: Auth0 required
 */

import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getActualWaterTemperature } from '@/lib/stoveApi';

export const dynamic = 'force-dynamic';

export const GET = auth0.withApiAuthRequired(async () => {
  try {
    const data = await getActualWaterTemperature();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Error getting actual water temperature:', error);

    // Handle specific errors
    if (error.message === 'STOVE_TIMEOUT') {
      return NextResponse.json(
        {
          error: 'Stove not responding',
          code: 'STOVE_TIMEOUT',
          details: 'Timeout after retries',
          Result: null
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to get water temperature',
        code: 'NETWORK_ERROR',
        details: error.message,
        Result: null
      },
      { status: 500 }
    );
  }
});
