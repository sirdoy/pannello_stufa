import { STUFA_API } from '@/lib/stoveApi';

/**
 * GET /api/stove/getRoomTemperature
 * Returns the target room temperature setpoint from the stove
 */
export async function GET() {
  try {
    const res = await fetch(STUFA_API.getRoomTemperature);

    if (!res.ok) {
      return Response.json(
        { error: 'Failed to fetch room temperature' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
