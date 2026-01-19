/**
 * POST /api/stove/setWaterTemperature
 *
 * Sets the water temperature setpoint on the stove.
 * Used for hydronic/boiler stoves only (not applicable to air stoves).
 *
 * Request body:
 * {
 *   "temperature": 30-80 (degrees Celsius)
 * }
 *
 * Response format:
 * {
 *   "Result": <value>,
 *   "isSandbox": false
 * }
 *
 * Auth: Auth0 required
 */

import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { setWaterTemperature } from '@/lib/stoveApi';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await request.json();
    const { temperature } = body;

    // Validate temperature
    if (!temperature || typeof temperature !== 'number') {
      return NextResponse.json(
        {
          error: 'Missing or invalid temperature parameter',
          code: 'INVALID_PARAMETER'
        },
        { status: 400 }
      );
    }

    if (temperature < 30 || temperature > 80) {
      return NextResponse.json(
        {
          error: 'Temperature must be between 30 and 80°C',
          code: 'INVALID_TEMPERATURE'
        },
        { status: 400 }
      );
    }

    // Call API
    const data = await setWaterTemperature(temperature);

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Error setting water temperature:', error);

    // Handle specific errors
    if (error.message === 'STOVE_TIMEOUT') {
      return NextResponse.json(
        {
          error: 'Stove not responding',
          code: 'STOVE_TIMEOUT',
          details: 'Timeout after retries'
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to set water temperature',
        code: 'NETWORK_ERROR',
        details: error.message
      },
      { status: 500 }
    );
  }
}
