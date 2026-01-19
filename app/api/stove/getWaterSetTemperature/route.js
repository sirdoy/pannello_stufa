/**
 * GET /api/stove/getWaterSetTemperature
 *
 * Returns the water temperature setpoint (target temperature) from the stove.
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
import { getWaterSetTemperature } from '@/lib/stoveApi';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const data = await getWaterSetTemperature();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Error getting water setpoint temperature:', error);

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
        error: 'Failed to get water setpoint temperature',
        code: 'NETWORK_ERROR',
        details: error.message,
        Result: null
      },
      { status: 500 }
    );
  }
}
