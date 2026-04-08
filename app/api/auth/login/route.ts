/**
 * POST /api/auth/login
 *
 * Server-side login via HA proxy. Uses HA_ADMIN_USER and HA_ADMIN_PASSWORD
 * env vars to authenticate with the HA proxy backend.
 *
 * Security (D-03, T-157-01): The JWT access_token is NEVER returned to the client.
 * Only { authenticated: true } is returned on success.
 *
 * Requires Auth0 session (D-07, T-157-06).
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { login } from '@/lib/auth/authProxy';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async () => {
  const username = process.env.HA_ADMIN_USER;
  const password = process.env.HA_ADMIN_PASSWORD;

  if (!username || !password) {
    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      'HA proxy auth not configured: missing HA_ADMIN_USER or HA_ADMIN_PASSWORD',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  await login(username, password);
  // Per D-03 / T-157-01: NEVER return access_token to client
  return success({ authenticated: true });
}, 'Auth/Login');
