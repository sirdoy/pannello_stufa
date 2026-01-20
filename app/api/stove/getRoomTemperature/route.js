import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { STUFA_API, fetchWithTimeout } from '@/lib/stoveApi';

/**
 * GET /api/stove/getRoomTemperature
 * Returns the target room temperature setpoint from the stove
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const res = await fetchWithTimeout(STUFA_API.getRoomTemperature);

  if (!res.ok) {
    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      `Failed to fetch room temperature: HTTP ${res.status}`,
      HTTP_STATUS.BAD_GATEWAY
    );
  }

  const data = await res.json();
  return success(data);
}, 'Stove/GetRoomTemperature');
